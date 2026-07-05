#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { findAvailablePort } from "./lib/core-phase-port-availability.mjs";
import {
  buildGatewayProviderEnvOverrides,
  readOpenClawProfileProviderConfig,
} from "./lib/core-phase-provider-config-drift.mjs";
import {
  buildOpenClawRuntimeStabilitySummary,
  defaultOpenClawRuntimeStabilityJsonPath,
  defaultOpenClawRuntimeStabilityMarkdownPath,
  renderOpenClawRuntimeStabilityMarkdown,
  REQUIRED_OPENCLAW_STABILITY_ENDPOINT,
} from "./lib/openclaw-runtime-stability-report.mjs";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const argv = [...process.argv.slice(2)];

const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

let dryRun = false;
let rounds = parsePositiveInt(process.env.MINDANCHOR_OPENCLAW_RUNTIME_STABILITY_ROUNDS, 12);
let intervalMs = parsePositiveInt(process.env.MINDANCHOR_OPENCLAW_RUNTIME_STABILITY_INTERVAL_MS, 60000);
let outDir = resolve(ROOT_DIR, process.env.MINDANCHOR_OPENCLAW_RUNTIME_STABILITY_DIR ?? "test-results");
let profileName = process.env.OPENCLAW_REAL_PROFILE ?? "dev";

for (let index = 0; index < argv.length; index += 1) {
  const token = argv[index];
  if (token === "--dry-run") {
    dryRun = true;
    continue;
  }
  if (token === "--rounds") {
    rounds = parsePositiveInt(argv[index + 1], rounds);
    index += 1;
    continue;
  }
  if (token === "--interval-ms") {
    intervalMs = parsePositiveInt(argv[index + 1], intervalMs);
    index += 1;
    continue;
  }
  if (token === "--out-dir") {
    outDir = resolve(ROOT_DIR, argv[index + 1] ?? outDir);
    index += 1;
    continue;
  }
  if (token === "--profile") {
    profileName = argv[index + 1] ?? profileName;
    index += 1;
    continue;
  }
}

const stamp =
  process.env.MINDANCHOR_OPENCLAW_RUNTIME_STABILITY_STAMP ?? new Date().toISOString().replace(/[:.]/g, "-");
const paths = {
  json: process.env.MINDANCHOR_OPENCLAW_RUNTIME_STABILITY_REPORT_FILE
    ? resolve(ROOT_DIR, process.env.MINDANCHOR_OPENCLAW_RUNTIME_STABILITY_REPORT_FILE)
    : defaultOpenClawRuntimeStabilityJsonPath(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), stamp).replace(
        resolve(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), "test-results"),
        outDir,
      ),
  markdown: process.env.MINDANCHOR_OPENCLAW_RUNTIME_STABILITY_MARKDOWN_FILE
    ? resolve(ROOT_DIR, process.env.MINDANCHOR_OPENCLAW_RUNTIME_STABILITY_MARKDOWN_FILE)
    : defaultOpenClawRuntimeStabilityMarkdownPath(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), stamp).replace(
        resolve(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), "test-results"),
        outDir,
      ),
};

const options = {
  rounds,
  intervalMs,
  profileName,
  requiredSelectedEndpoint: REQUIRED_OPENCLAW_STABILITY_ENDPOINT,
};

if (dryRun) {
  process.stdout.write(`${JSON.stringify({ options, paths })}\n`);
  process.exit(0);
}

const parseSimpleEnvFile = (path) => {
  if (!existsSync(path)) {
    return {};
  }
  const result = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index > 0) {
      result[trimmed.slice(0, index)] = trimmed.slice(index + 1);
    }
  }
  return result;
};

const fetchJson = async (url, { method = "GET" } = {}) => {
  const response = await fetch(url, { method });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
};

const adapterCheckFromPayload = ({ target, payload, httpStatus }) => {
  const adapter = payload?.adapter ?? payload?.lastDecision ?? payload;
  return {
    target,
    httpStatus,
    route: adapter?.route ?? "failed",
    selectedEndpoint: adapter?.selectedEndpoint ?? null,
    traceId: adapter?.traceId ?? payload?.traceId ?? null,
    fallbackReason: adapter?.fallbackReason ?? null,
    failureCategory: adapter?.failureCategory ?? null,
  };
};

const validateClusterCheck = (check) =>
  check.route === "cluster" &&
  check.selectedEndpoint === REQUIRED_OPENCLAW_STABILITY_ENDPOINT &&
  !check.fallbackReason &&
  !check.failureCategory &&
  (!check.httpStatus || check.httpStatus < 400);

const runRound = async ({ apiBaseUrl, round }) => {
  const errors = [];
  const checks = [];
  const userId = `stability-user-${round}`;

  const health = await fetchJson(`${apiBaseUrl}/health`);
  if (!health.ok) {
    errors.push(`Gateway health failed with HTTP ${health.status}.`);
    checks.push({
      target: "gateway-health",
      httpStatus: health.status,
      route: "failed",
      selectedEndpoint: null,
      traceId: null,
      fallbackReason: null,
      failureCategory: "http_error",
    });
  }

  const probe = await fetchJson(`${apiBaseUrl}/debug/model-probe/chief-agent?userId=${userId}&scenarioId=focus-recovery-loop`);
  const chiefCheck = adapterCheckFromPayload({ target: "chief-agent", payload: probe.body, httpStatus: probe.status });
  checks.push(chiefCheck);
  if (!probe.ok || !validateClusterCheck(chiefCheck)) {
    errors.push(`chief-agent route check failed: route=${chiefCheck.route} selectedEndpoint=${chiefCheck.selectedEndpoint}.`);
  }

  const seed = await fetchJson(`${apiBaseUrl}/debug/scenarios/focus-recovery-loop/seed`, { method: "POST" });
  if (!seed.ok) {
    errors.push(`Scenario seed failed with HTTP ${seed.status}.`);
    checks.push({
      target: "scenario-seed",
      httpStatus: seed.status,
      route: "failed",
      selectedEndpoint: null,
      traceId: null,
      fallbackReason: null,
      failureCategory: "http_error",
    });
  }

  const scenario = seed.body ?? {};
  const debugCalls = [
    ["state-insight-agent", `/debug/agent/state-insight?userId=${scenario.userId ?? userId}&scenarioId=focus-recovery-loop`],
    [
      "interruption-recovery-agent",
      `/debug/agent/interruption-recovery?userId=${scenario.userId ?? userId}&taskId=${scenario.taskId ?? ""}&scenarioId=focus-recovery-loop`,
    ],
    [
      "reflection-coach-agent",
      `/debug/agent/reflection?userId=${scenario.userId ?? userId}&periodType=${scenario.periodType ?? "weekly"}&scenarioId=focus-recovery-loop`,
    ],
    [
      "task-management-agent",
      `/debug/agent/task-management?userId=${scenario.userId ?? userId}&goalId=${scenario.goalId ?? ""}&scenarioId=focus-recovery-loop`,
    ],
    ["progress-feedback-agent", `/debug/agent/progress-feedback?userId=${scenario.userId ?? userId}&scenarioId=focus-recovery-loop`],
    ["automation-agent", `/debug/agent/automation?userId=${scenario.userId ?? userId}&scenarioId=focus-recovery-loop`],
  ];

  for (const [target, endpoint] of debugCalls) {
    const response = await fetchJson(`${apiBaseUrl}${endpoint}`);
    const check = adapterCheckFromPayload({ target, payload: response.body, httpStatus: response.status });
    checks.push(check);
    if (!response.ok || !validateClusterCheck(check)) {
      errors.push(`${target} route check failed: route=${check.route} selectedEndpoint=${check.selectedEndpoint}.`);
    }
  }

  const adapter = await fetchJson(`${apiBaseUrl}/debug/openclaw/adapter`);
  if (!adapter.ok) {
    errors.push(`Adapter status failed with HTTP ${adapter.status}.`);
  }

  return {
    round,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: errors.length === 0 ? "passed" : "failed",
    errors,
    checks,
    adapter: adapter.body ?? null,
  };
};

const waitForGateway = async (apiBaseUrl) => {
  const started = Date.now();
  while (Date.now() - started < 90000) {
    try {
      const response = await fetchJson(`${apiBaseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {}
    await delay(500);
  }
  throw new Error(`Timed out waiting for Gateway at ${apiBaseUrl}.`);
};

const openClawProfile = await readOpenClawProfileProviderConfig({ profileName });
const providerOverrides = buildGatewayProviderEnvOverrides(openClawProfile);
if (!providerOverrides) {
  process.stderr.write(`Unable to derive provider env from OpenClaw profile '${profileName}'.\n`);
  process.exit(1);
}

const runtimeEnv = parseSimpleEnvFile(resolve(ROOT_DIR, ".logs", "openclaw-real-lan.env"));
const openClawBaseUrl = process.env.MINDANCHOR_OPENCLAW_BASE_URL ?? runtimeEnv.OPENCLAW_BASE_URL;
if (!openClawBaseUrl) {
  process.stderr.write("Unable to resolve MINDANCHOR_OPENCLAW_BASE_URL or .logs/openclaw-real-lan.env OPENCLAW_BASE_URL.\n");
  process.exit(1);
}

const apiPort = await findAvailablePort("127.0.0.1", 3011);
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const dataFile = resolve(ROOT_DIR, "tmp", `openclaw-runtime-stability-${stamp}.json`);
const gatewayEnv = {
  ...process.env,
  ...providerOverrides,
  PATH: [resolve(ROOT_DIR, ".tools/node/bin"), `${process.env.HOME ?? ""}/.openclaw/bin`, process.env.PATH ?? ""]
    .filter(Boolean)
    .join(":"),
  MINDANCHOR_API_PORT: String(apiPort),
  MINDANCHOR_API_URL: apiBaseUrl,
  MINDANCHOR_AGENT_MODE: "openai-compatible",
  MINDANCHOR_OPENCLAW_BASE_URL: openClawBaseUrl,
  MINDANCHOR_DATA_FILE: dataFile,
};

const gateway = spawn("corepack", ["pnpm", "--filter", "@mindanchor/api", "exec", "tsx", "src/index.ts"], {
  cwd: ROOT_DIR,
  env: gatewayEnv,
  stdio: ["ignore", "pipe", "pipe"],
});
gateway.stdout.on("data", (chunk) => process.stdout.write(`[gateway] ${chunk}`));
gateway.stderr.on("data", (chunk) => process.stderr.write(`[gateway] ${chunk}`));

const startedAt = new Date().toISOString();
const report = {
  generatedAt: startedAt,
  startedAt,
  completedAt: null,
  durationMs: null,
  apiBaseUrl,
  openClawBaseUrl,
  roundsPlanned: rounds,
  intervalMs,
  requiredSelectedEndpoint: REQUIRED_OPENCLAW_STABILITY_ENDPOINT,
  rounds: [],
};

let exitCode = 0;
try {
  await waitForGateway(apiBaseUrl);
  for (let round = 1; round <= rounds; round += 1) {
    process.stdout.write(`OpenClaw stability round ${round}/${rounds}\n`);
    const roundResult = await runRound({ apiBaseUrl, round });
    report.rounds.push(roundResult);
    if (round < rounds) {
      await delay(intervalMs);
    }
  }
} catch (error) {
  exitCode = 1;
  report.rounds.push({
    round: report.rounds.length + 1,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: "failed",
    errors: [error instanceof Error ? error.message : String(error)],
    checks: [],
  });
} finally {
  const completedAt = new Date().toISOString();
  report.completedAt = completedAt;
  report.durationMs = Date.parse(completedAt) - Date.parse(startedAt);
  report.summary = buildOpenClawRuntimeStabilitySummary(report);
  await mkdir(dirname(paths.json), { recursive: true });
  await writeFile(paths.json, JSON.stringify(report, null, 2), "utf8");
  await mkdir(dirname(paths.markdown), { recursive: true });
  await writeFile(paths.markdown, renderOpenClawRuntimeStabilityMarkdown(report), "utf8");
  process.stdout.write(`openclawRuntimeStabilityReport=${paths.json}\n`);
  process.stdout.write(`openclawRuntimeStabilityReportMarkdown=${paths.markdown}\n`);
  if (!report.summary.passed) {
    exitCode = 1;
  }
  gateway.kill("SIGTERM");
  await delay(500);
  if (gateway.exitCode === null) {
    gateway.kill("SIGKILL");
  }
}

process.exit(exitCode);
