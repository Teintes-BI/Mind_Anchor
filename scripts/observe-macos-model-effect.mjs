#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, open, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path, { dirname, resolve } from "node:path";
import process from "node:process";

import { findAvailablePort } from "./lib/core-phase-port-availability.mjs";
import { deleteAppleDoubleFiles } from "./lib/appledouble-cleanup.mjs";
import {
  buildGatewayProviderEnvOverrides,
  readOpenClawProfileProviderConfig,
} from "./lib/core-phase-provider-config-drift.mjs";
import {
  buildMacosModelEffectObservationSummary,
  defaultMacosModelEffectObservationJsonPath,
  defaultMacosModelEffectObservationMarkdownPath,
  MACOS_MODEL_EFFECT_SCENARIO_PLAN,
  renderMacosModelEffectObservationMarkdown,
} from "./lib/macos-model-effect-observation-report.mjs";
import {
  buildMemoryAugmentedPrompt,
  collectOpenChronicleDesktopMemorySnapshot,
} from "./lib/desktop-memory-adapter.mjs";
import { OPENCHRONICLE_DEFAULT_MCP_URL } from "./lib/openchronicle-sidecar-validation-report.mjs";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const MACOS_DIR = resolve(ROOT_DIR, "apps", "macos");
const PROJECT_PATH = resolve(MACOS_DIR, "MindAnchorMac.xcodeproj");
const PROJECT_SPEC_PATH = resolve(MACOS_DIR, "project.yml");
const HEALTH_TIMEOUT_MS = 90000;
const COMMAND_TIMEOUT_MS = 20000;

const now = () => new Date().toISOString();
const sleep = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

const parsePositiveInt = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const sanitizeStamp = (value) => String(value).replace(/[:.]/g, "-");

let argv = [...process.argv.slice(2)];
if (argv[0] === "--") {
  argv = argv.slice(1);
}

let dryRun = false;
let turnCount = parsePositiveInt(process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_TURNS, 3);
let intervalMs = parsePositiveInt(process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_INTERVAL_MS, 1000);
let responseTimeoutMs = parsePositiveInt(process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_RESPONSE_TIMEOUT_MS, 90000);
let preferredApiPort = parsePositiveInt(process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_API_PORT, 3011);
let outDir = resolve(ROOT_DIR, process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_DIR ?? "test-results");
let profileName = process.env.OPENCLAW_REAL_PROFILE ?? "dev";
let accountEmail = process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_EMAIL ?? "m7-desktop-model-effect@example.com";
let accountPassword = process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_PASSWORD ?? "Password123!";
let accountDisplayName = process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_DISPLAY_NAME ?? "M7 Desktop Model Effect";
let memoryMode = process.env.MINDANCHOR_M7_DESKTOP_MEMORY_MODE ?? "off";
let openChronicleMcpUrl = process.env.OPENCHRONICLE_MCP_URL ?? OPENCHRONICLE_DEFAULT_MCP_URL;
let memoryTimeoutMs = parsePositiveInt(process.env.MINDANCHOR_M7_DESKTOP_MEMORY_TIMEOUT_MS, 10000);
let responseExcerptChars = parsePositiveInt(process.env.MINDANCHOR_M7_RESPONSE_EXCERPT_CHARS, 1200);

for (let index = 0; index < argv.length; index += 1) {
  const token = argv[index];
  if (token === "--dry-run") {
    dryRun = true;
    continue;
  }
  if (token === "--turns") {
    turnCount = parsePositiveInt(argv[index + 1], turnCount);
    index += 1;
    continue;
  }
  if (token === "--interval-ms") {
    intervalMs = parsePositiveInt(argv[index + 1], intervalMs);
    index += 1;
    continue;
  }
  if (token === "--response-timeout-ms") {
    responseTimeoutMs = parsePositiveInt(argv[index + 1], responseTimeoutMs);
    index += 1;
    continue;
  }
  if (token === "--api-port") {
    preferredApiPort = parsePositiveInt(argv[index + 1], preferredApiPort);
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
  if (token === "--email") {
    accountEmail = argv[index + 1] ?? accountEmail;
    index += 1;
    continue;
  }
  if (token === "--password") {
    accountPassword = argv[index + 1] ?? accountPassword;
    index += 1;
    continue;
  }
  if (token === "--display-name") {
    accountDisplayName = argv[index + 1] ?? accountDisplayName;
    index += 1;
    continue;
  }
  if (token === "--memory-mode") {
    memoryMode = argv[index + 1] ?? memoryMode;
    index += 1;
    continue;
  }
  if (token === "--with-openchronicle-memory") {
    memoryMode = "openchronicle";
    continue;
  }
  if (token === "--compare-openchronicle-memory") {
    memoryMode = "compare";
    continue;
  }
  if (token === "--openchronicle-mcp-url") {
    openChronicleMcpUrl = argv[index + 1] ?? openChronicleMcpUrl;
    index += 1;
    continue;
  }
  if (token === "--memory-timeout-ms") {
    memoryTimeoutMs = parsePositiveInt(argv[index + 1], memoryTimeoutMs);
    index += 1;
    continue;
  }
  if (token === "--response-excerpt-chars") {
    responseExcerptChars = parsePositiveInt(argv[index + 1], responseExcerptChars);
    index += 1;
  }
}

if (!["off", "openchronicle", "compare"].includes(memoryMode)) {
  throw new Error(`Unsupported --memory-mode: ${memoryMode}`);
}

const stamp = sanitizeStamp(process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_STAMP ?? new Date().toISOString());
const paths = {
  json: process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_REPORT_FILE
    ? resolve(ROOT_DIR, process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_REPORT_FILE)
    : defaultMacosModelEffectObservationJsonPath(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), stamp).replace(
        resolve(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), "test-results"),
        outDir,
      ),
  markdown: process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_MARKDOWN_FILE
    ? resolve(ROOT_DIR, process.env.MINDANCHOR_M7_MACOS_MODEL_EFFECT_MARKDOWN_FILE)
    : defaultMacosModelEffectObservationMarkdownPath(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), stamp).replace(
        resolve(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), "test-results"),
        outDir,
      ),
};

const baseScenarioPlan = Array.from({ length: turnCount }, (_, index) => {
  const base = MACOS_MODEL_EFFECT_SCENARIO_PLAN[index % MACOS_MODEL_EFFECT_SCENARIO_PLAN.length];
  return index < MACOS_MODEL_EFFECT_SCENARIO_PLAN.length
    ? base
    : {
        ...base,
        id: `${base.id}-${index + 1}`,
      };
});
const scenarioPlan =
  memoryMode === "compare"
    ? baseScenarioPlan.flatMap((scenario) => [
        {
          ...scenario,
          id: `${scenario.id}-baseline`,
          memoryVariant: "baseline",
          basePrompt: scenario.prompt,
        },
        {
          ...scenario,
          id: `${scenario.id}-openchronicle`,
          memoryVariant: "openchronicle",
          basePrompt: scenario.prompt,
        },
      ])
    : baseScenarioPlan.map((scenario) => ({
        ...scenario,
        memoryVariant: memoryMode === "openchronicle" ? "openchronicle" : "baseline",
        basePrompt: scenario.prompt,
      }));
const options = {
  turnCount,
  intervalMs,
  responseTimeoutMs,
  preferredApiPort,
  profileName,
  accountEmail,
  memoryMode,
  openChronicleMcpUrl,
  memoryTimeoutMs,
  responseExcerptChars,
};

if (dryRun) {
  process.stdout.write(
    `${JSON.stringify(
      {
        options,
        paths,
        requirements: [
          "macOS GUI session",
          "OpenClaw real runtime reachable",
          "OpenClaw profile provider env",
          "xcodegen",
          "xcodebuild",
          ...(memoryMode === "off" ? [] : ["OpenChronicle MCP sidecar reachable"]),
        ],
        plan: [
          "build MindAnchorMac Debug app",
          "start temporary Gateway API with temp data file",
          "register/login fixed local account",
          "launch macOS app with automation bridge",
          ...(memoryMode === "off" ? [] : ["read OpenChronicle sidecar through DesktopMemoryAdapter"]),
          "send coach prompts through real desktop client",
          "wait for full model responses",
          "submit scripted feedback",
          "write JSON and Markdown report",
        ],
        scenarioPlan,
      },
      null,
      2,
    )}\n`,
  );
  process.exit(0);
}

const log = (message) => process.stdout.write(`${message}\n`);

const parseSimpleEnvFile = (filePath) => {
  if (!existsSync(filePath)) {
    return {};
  }
  const result = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex > 0) {
      result[trimmed.slice(0, separatorIndex)] = trimmed.slice(separatorIndex + 1);
    }
  }
  return result;
};

const runDir = await mkdtemp(path.join(os.tmpdir(), "mindanchor-m7-macos-model-effect-"));
const commandFile = path.join(runDir, "automation-command.json");
const responseFile = path.join(runDir, "automation-response.json");
const apiLogFile = path.join(runDir, "api.log");
const dataFile = path.join(runDir, "mindanchor-m7.json");
const runId = `${Date.now()}-${process.pid}`;
const derivedDataDir = path.join(MACOS_DIR, ".derived-data", "model-effect-observation");
const appBundlePath = path.join(derivedDataDir, "Build", "Products", "Debug", "MindAnchorMac.app");
const appBinaryPath = path.join(appBundlePath, "Contents", "MacOS", "MindAnchorMac");
const bundleIdentifier = `com.mindanchor.mac.modeleffect.${runId.replace(/[^a-zA-Z0-9]/g, "")}`;

function spawnCommand(command, args, options = {}) {
  const { quiet = false, input, cwd = ROOT_DIR, env = process.env } = options;
  return new Promise((resolveCommand, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    if (typeof input === "string" && child.stdin) {
      child.stdin.write(input);
    }
    child.stdin?.end();
    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (!quiet) {
        process.stdout.write(text);
      }
    });
    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (!quiet) {
        process.stderr.write(text);
      }
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolveCommand({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}\n${stderr || stdout}`));
    });
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${url} failed with HTTP ${response.status}: ${text}`);
  }
  return body ?? {};
}

async function postJson(url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetchJson(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function registerOrLoginUser({ apiBaseUrl }) {
  try {
    return await postJson(`${apiBaseUrl}/auth/register`, {
      email: accountEmail,
      password: accountPassword,
      displayName: accountDisplayName,
    });
  } catch (error) {
    if (String(error).includes("409")) {
      return postJson(`${apiBaseUrl}/auth/login`, {
        email: accountEmail,
        password: accountPassword,
      });
    }
    throw error;
  }
}

async function buildMacApp() {
  log("==> 生成并构建 macOS App");
  await rm(PROJECT_PATH, { recursive: true, force: true });
  await spawnCommand("xcodegen", ["generate", "--spec", PROJECT_SPEC_PATH, "--project", MACOS_DIR]);
  await rm(derivedDataDir, { recursive: true, force: true });
  await spawnCommand("xcodebuild", [
    "-project",
    PROJECT_PATH,
    "-scheme",
    "MindAnchorMac",
    "-configuration",
    "Debug",
    "-derivedDataPath",
    derivedDataDir,
    "-destination",
    "platform=macOS,arch=arm64",
    "CODE_SIGNING_ALLOWED=NO",
    `PRODUCT_BUNDLE_IDENTIFIER=${bundleIdentifier}`,
    "build",
  ]);
  await deleteAppleDoubleFiles(appBundlePath);
  await spawnCommand("codesign", ["--force", "--deep", "--sign", "-", appBundlePath], { quiet: true });
}

async function startApiServer({ apiPort, openClawBaseUrl, providerOverrides }) {
  const logHandle = await open(apiLogFile, "w");
  const env = {
    ...process.env,
    ...providerOverrides,
    MINDANCHOR_API_PORT: String(apiPort),
    MINDANCHOR_DATA_FILE: dataFile,
    MINDANCHOR_AGENT_MODE: "openai-compatible",
    MINDANCHOR_OPENCLAW_BASE_URL: openClawBaseUrl,
  };
  const child = spawn("corepack", ["pnpm", "--filter", "@mindanchor/api", "exec", "tsx", "src/index.ts"], {
    cwd: ROOT_DIR,
    env,
    stdio: ["ignore", logHandle.fd, logHandle.fd],
  });
  const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      break;
    }
    try {
      const health = await fetchJson(`${apiBaseUrl}/health`);
      if (health.ok) {
        return { process: child, logHandle, baseUrl: apiBaseUrl };
      }
    } catch {}
    await sleep(500);
  }
  const apiLog = readFileSync(apiLogFile, "utf8");
  throw new Error(`API 启动失败。\n${apiLog}`);
}

async function stopApiServer(api) {
  if (!api) {
    return;
  }
  if (api.process.exitCode === null) {
    api.process.kill("SIGTERM");
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline && api.process.exitCode === null) {
      await sleep(100);
    }
    if (api.process.exitCode === null) {
      api.process.kill("SIGKILL");
    }
  }
  await api.logHandle?.close();
}

async function writeAutomationCommand(action, extra = {}) {
  const id = `${action}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await rm(responseFile, { force: true });
  await writeFile(commandFile, JSON.stringify({ id, action, ...extra }, null, 2), "utf8");
  return id;
}

async function waitForAutomationResponse(expectedId, timeoutMs = COMMAND_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const payload = JSON.parse(readFileSync(responseFile, "utf8"));
      if (payload.id === expectedId) {
        return payload;
      }
    } catch {}
    await sleep(200);
  }
  throw new Error(`等待 automation response 超时：${expectedId}`);
}

async function sendAutomationCommand(action, extra = {}, timeoutMs = COMMAND_TIMEOUT_MS) {
  const id = await writeAutomationCommand(action, extra);
  return waitForAutomationResponse(id, timeoutMs);
}

async function setLaunchEnvironment(environment) {
  for (const [key, value] of Object.entries(environment)) {
    await spawnCommand("launchctl", ["setenv", key, value], { quiet: true });
  }
}

async function clearLaunchEnvironment(keys) {
  for (const key of keys) {
    try {
      await spawnCommand("launchctl", ["unsetenv", key], { quiet: true });
    } catch {}
  }
}

async function getMatchingAppPIDs() {
  const { stdout } = await spawnCommand("ps", ["-axo", "pid=,command="], { quiet: true });
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const firstSpace = line.indexOf(" ");
      return {
        pid: Number(line.slice(0, firstSpace)),
        command: line.slice(firstSpace + 1),
      };
    })
    .filter((entry) => entry.command.includes(appBinaryPath))
    .map((entry) => entry.pid);
}

async function terminateAppPIDs() {
  const pids = await getMatchingAppPIDs();
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {}
  }
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const remaining = await getMatchingAppPIDs();
    if (remaining.length === 0) {
      return;
    }
    await sleep(100);
  }
  for (const pid of await getMatchingAppPIDs()) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
  }
}

async function launchMacApp(environment) {
  await terminateAppPIDs();
  await setLaunchEnvironment(environment);
  log("==> 启动 macOS App");
  await spawnCommand("open", ["-na", appBundlePath], { quiet: true });
}

async function waitForSignedInApp() {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    try {
      const response = await sendAutomationCommand("snapshot", {}, 4000);
      if (response.snapshot?.isSignedIn === true && response.snapshot?.accountEmail === accountEmail) {
        return response;
      }
    } catch {}
    await sleep(500);
  }
  throw new Error("macOS App 登录状态等待超时。");
}

async function waitForCondition(label, predicate, timeoutMs = 45000, interval = 500) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await predicate();
    if (result) {
      return result;
    }
    await sleep(interval);
  }
  throw new Error(`等待条件超时：${label}`);
}

async function observeTurn(scenario, index) {
  const errors = [];
  let desktopMemory = null;
  let prompt = scenario.prompt;
  if (scenario.memoryVariant === "openchronicle") {
    desktopMemory = await collectOpenChronicleDesktopMemorySnapshot({
      mcpUrl: openChronicleMcpUrl,
      query: scenario.basePrompt ?? scenario.prompt,
      timeoutMs: memoryTimeoutMs,
    });
    if (desktopMemory.summary?.readSucceeded !== true) {
      errors.push("desktop memory read failed");
    }
    prompt = buildMemoryAugmentedPrompt({
      originalPrompt: scenario.basePrompt ?? scenario.prompt,
      promptContext: desktopMemory.promptContext,
    });
  }
  await sendAutomationCommand("open_coach");
  await sendAutomationCommand("set_coach_draft_text", { text: prompt });
  await sendAutomationCommand("send_coach_message");

  const completedSnapshot = await waitForCondition(
    `${scenario.id} full response`,
    async () => {
      const response = await sendAutomationCommand("refresh_coach", {}, 8000);
      const coach = response.snapshot?.coach;
      if (coach?.lastUserMessageText === prompt && (coach.lastAssistantFullResponse ?? "").length > 0) {
        return response;
      }
      return null;
    },
    responseTimeoutMs,
    1000,
  );

  const coach = completedSnapshot.snapshot.coach ?? {};
  const trail = coach.lastAssistantExecutionTrail ?? [];
  const fastResponse = coach.lastAssistantFastResponse ?? "";
  const fullResponse = coach.lastAssistantFullResponse ?? "";
  if (coach.lastAssistantStatus !== "completed") {
    errors.push(`assistantStatus=${coach.lastAssistantStatus ?? "unknown"}`);
  }
  if (!fastResponse) {
    errors.push("fast response empty");
  }
  if (!fullResponse) {
    errors.push("full response empty");
  }
  if (!trail.some((line) => String(line).includes("OpenClaw"))) {
    errors.push("execution trail missing OpenClaw");
  }

  const feedbackAction = scenario.feedbackLabel === "unhelpful" ? "coach_feedback_unhelpful" : "coach_feedback_helpful";
  const feedbackSnapshot = await waitForCondition(
    `${scenario.id} feedback persisted`,
    async () => {
      const response = await sendAutomationCommand(feedbackAction, {}, 8000);
      if (response.snapshot?.coach?.lastFeedbackLabel === scenario.feedbackLabel) {
        return response;
      }
      return null;
    },
    20000,
    500,
  );
  const feedbackPersisted = feedbackSnapshot.snapshot?.coach?.lastFeedbackLabel === scenario.feedbackLabel;
  if (!feedbackPersisted) {
    errors.push("feedback not persisted");
  }

  const traceId = completedSnapshot.snapshot?.coach?.lastAssistantExecutionTrail?.find((line) => String(line).includes("trace")) ?? null;

  if (index < scenarioPlan.length - 1) {
    await sleep(intervalMs);
  }

  return {
    id: scenario.id,
    title: scenario.title,
    memoryVariant: scenario.memoryVariant ?? "baseline",
    prompt: scenario.basePrompt ?? scenario.prompt,
    sentPromptLength: prompt.length,
    desktopMemory,
    feedbackLabel: scenario.feedbackLabel,
    assistantStatus: coach.lastAssistantStatus ?? null,
    fastResponseLength: fastResponse.length,
    fullResponseLength: fullResponse.length,
    fastResponseExcerpt: fastResponse.slice(0, responseExcerptChars),
    fullResponseExcerpt: fullResponse.slice(0, responseExcerptChars),
    executionTrailIncludesOpenClaw: trail.some((line) => String(line).includes("OpenClaw")),
    executionTrail: trail,
    traceId,
    feedbackPersisted,
    currentError: completedSnapshot.snapshot?.currentError ?? null,
    userFacingCurrentError: completedSnapshot.snapshot?.userFacingCurrentError ?? null,
    passed: errors.length === 0 && !completedSnapshot.snapshot?.currentError,
    errors,
  };
}

let api = null;
const report = {
  generatedAt: now(),
  startedAt: now(),
  completedAt: null,
  durationMs: null,
  apiBaseUrl: null,
  openClawBaseUrl: null,
  memoryMode,
  openChronicleMcpUrl: memoryMode === "off" ? null : openChronicleMcpUrl,
  accountEmail,
  plannedTurnCount: scenarioPlan.length,
  preflight: {
    openClawReachable: false,
    apiHealthy: false,
    macAppSignedIn: false,
  },
  turns: [],
  errors: [],
};
const started = Date.now();
const launchEnvironment = {
  MINDANCHOR_AUTOMATION_ENABLED: "1",
  MINDANCHOR_AUTOMATION_COMMAND_FILE: commandFile,
  MINDANCHOR_AUTOMATION_RESPONSE_FILE: responseFile,
  MINDANCHOR_AUTH_BOOTSTRAP_MODE: "login",
  MINDANCHOR_AUTH_BOOTSTRAP_EMAIL: accountEmail,
  MINDANCHOR_AUTH_BOOTSTRAP_PASSWORD: accountPassword,
  MINDANCHOR_AUTH_SESSION_ACCOUNT: `mindanchor-auth-session-m7-model-effect-${runId}`,
  MINDANCHOR_DISABLE_COLLECTOR: "1",
};

try {
  const openClawProfile = await readOpenClawProfileProviderConfig({ profileName });
  const providerOverrides = buildGatewayProviderEnvOverrides(openClawProfile);
  if (!providerOverrides) {
    throw new Error(`无法从 OpenClaw profile '${profileName}' 推导 Gateway provider env。`);
  }

  const runtimeEnv = parseSimpleEnvFile(resolve(ROOT_DIR, ".logs", "openclaw-real-lan.env"));
  const openClawBaseUrl = process.env.MINDANCHOR_OPENCLAW_BASE_URL ?? runtimeEnv.OPENCLAW_BASE_URL;
  if (!openClawBaseUrl) {
    throw new Error("无法解析 MINDANCHOR_OPENCLAW_BASE_URL 或 .logs/openclaw-real-lan.env OPENCLAW_BASE_URL。");
  }
  report.openClawBaseUrl = openClawBaseUrl;
  const runtimeHealth = await fetchJson(`${openClawBaseUrl}/health`);
  report.preflight.openClawReachable = Boolean(runtimeHealth.ok ?? true);

  const apiPort = await findAvailablePort("127.0.0.1", preferredApiPort);
  api = await startApiServer({ apiPort, openClawBaseUrl, providerOverrides });
  report.apiBaseUrl = api.baseUrl;
  report.preflight.apiHealthy = true;

  await registerOrLoginUser({ apiBaseUrl: api.baseUrl });
  launchEnvironment.MINDANCHOR_API_BASE_URL = api.baseUrl;

  await buildMacApp();
  await launchMacApp(launchEnvironment);
  await waitForSignedInApp();
  report.preflight.macAppSignedIn = true;

  for (const [index, scenario] of scenarioPlan.entries()) {
    log(`==> M7 turn ${index + 1}/${scenarioPlan.length}: ${scenario.id}`);
    const turn = await observeTurn(scenario, index);
    report.turns.push(turn);
  }
} catch (error) {
  report.errors.push(error.stack || error.message || String(error));
} finally {
  report.completedAt = now();
  report.durationMs = Date.now() - started;
  report.summary = buildMacosModelEffectObservationSummary(report);
  await mkdir(dirname(paths.json), { recursive: true });
  await writeFile(paths.json, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(paths.markdown, renderMacosModelEffectObservationMarkdown(report), "utf8");
  await terminateAppPIDs().catch(() => {});
  await clearLaunchEnvironment(Object.keys(launchEnvironment)).catch(() => {});
  await stopApiServer(api).catch(() => {});
  if (report.summary.passed) {
    log("PASS M7 macOS model effect observation");
  } else {
    log("FAIL M7 macOS model effect observation");
  }
  log(`json: ${paths.json}`);
  log(`markdown: ${paths.markdown}`);
  await rm(runDir, { recursive: true, force: true }).catch(() => {});
  process.exitCode = report.summary.passed ? 0 : 1;
}
