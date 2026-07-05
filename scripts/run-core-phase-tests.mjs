#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createServer as createHttpServer } from "node:http";
import http from "node:http";
import https from "node:https";
import { createWriteStream, existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildRegistryPhaseSummary,
  evaluateRegistryPhaseGate,
} from "./lib/core-phase-openclaw-registry.mjs";
import {
  evaluateCorePhasePreflight,
  formatCorePhasePreflightIssues,
} from "./lib/core-phase-real-preflight.mjs";
import {
  OPENCLAW_MINIMUM_NODE_VERSION,
  selectOpenClawNodeBinary,
} from "./lib/openclaw-node-runtime.mjs";
import {
  formatCorePhaseStepCompleted,
  formatCorePhaseStepFailed,
  formatCorePhaseStepStarted,
} from "./lib/core-phase-progress.mjs";
import {
  CORE_PHASE_IDS,
  filterSelectedPhases,
  parseSelectedPhaseIds,
  validateSelectedPhaseIds,
} from "./lib/core-phase-selection.mjs";
import {
  CORE_PHASE_SEGMENT_IDS,
  getSelectedBusinessWebCheckIds,
  parseSelectedSegmentIds,
  shouldRunBusinessFlow,
  shouldRunCorePhaseScenarioSeed,
  shouldRunCorePhaseSegment,
  validateSelectedSegmentIds as validateCorePhaseSegmentIds,
} from "./lib/core-phase-segments.mjs";
import { buildCorePhaseReportMarkdown } from "./lib/core-phase-report-files.mjs";
import { findAvailablePort } from "./lib/core-phase-port-availability.mjs";
import {
  cleanupManagedProcesses,
  spawnManagedLoggedProcess,
  stopManagedChild,
} from "./lib/core-phase-process-supervisor.mjs";
import { probeProviderAuth } from "./lib/core-phase-provider-auth-probe.mjs";
import {
  compareProviderConfigDrift,
  readOpenClawProfileProviderConfig,
} from "./lib/core-phase-provider-config-drift.mjs";
import { deleteAppleDoubleFiles } from "./lib/appledouble-cleanup.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const cleanedAppleDoubleCount = await deleteAppleDoubleFiles(ROOT_DIR);

if (cleanedAppleDoubleCount > 0) {
  console.log(`Removed ${cleanedAppleDoubleCount} AppleDouble sidecar file(s) before core phase run.`);
}

const parseArgs = (argv) => {
  const options = {
    clusterMode: process.env.MINDANCHOR_PHASED_CLUSTER_MODE ?? "real",
    providerMode: process.env.MINDANCHOR_PHASED_PROVIDER_MODE ?? "",
    selectedPhaseIds: parseSelectedPhaseIds(process.env.MINDANCHOR_PHASED_PHASES),
    selectedSegmentIds: parseSelectedSegmentIds(process.env.MINDANCHOR_PHASED_SEGMENTS),
    reportDir: process.env.MINDANCHOR_PHASED_REPORT_DIR
      ? resolve(ROOT_DIR, process.env.MINDANCHOR_PHASED_REPORT_DIR)
      : resolve(ROOT_DIR, "test-results", `core-phase-${timestamp}`),
    apiPort: Number(process.env.MINDANCHOR_PHASED_API_PORT ?? "3024"),
    webPort: Number(process.env.MINDANCHOR_PHASED_WEB_PORT ?? "4174"),
    clusterPort: Number(process.env.MINDANCHOR_PHASED_CLUSTER_PORT ?? "8788"),
    mockProviderPort: Number(process.env.MINDANCHOR_PHASED_MOCK_PROVIDER_PORT ?? "9324"),
    defaultRequestTimeoutMs: Number(process.env.MINDANCHOR_PHASED_REQUEST_TIMEOUT_MS ?? "300000"),
    providerDirectRequestTimeoutMs: Number(process.env.MINDANCHOR_PHASED_PROVIDER_REQUEST_TIMEOUT_MS ?? "1200000"),
    defaultProbeTimeoutMs: Number(process.env.MINDANCHOR_PHASED_PROBE_TIMEOUT_MS ?? "300000"),
    defaultFullRegressionTimeoutMs: Number(process.env.MINDANCHOR_PHASED_FULL_REGRESSION_TIMEOUT_MS ?? "300000"),
    defaultMatrixRegressionTimeoutMs: Number(process.env.MINDANCHOR_PHASED_MATRIX_REGRESSION_TIMEOUT_MS ?? "300000"),
    apiHost: process.env.MINDANCHOR_PHASED_API_HOST ?? "127.0.0.1",
    webHost: process.env.MINDANCHOR_PHASED_WEB_HOST ?? "127.0.0.1",
    clusterHost: process.env.MINDANCHOR_PHASED_CLUSTER_HOST ?? "127.0.0.1",
    externalClusterBaseUrl:
      process.env.MINDANCHOR_PHASED_CLUSTER_BASE_URL ?? process.env.MINDANCHOR_OPENCLAW_BASE_URL ?? "",
    keepArtifacts: process.env.MINDANCHOR_PHASED_KEEP_ARTIFACTS === "1",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    switch (token) {
      case "--cluster-mode":
        options.clusterMode = next ?? options.clusterMode;
        index += 1;
        break;
      case "--provider-mode":
        options.providerMode = next ?? options.providerMode;
        index += 1;
        break;
      case "--phases":
        options.selectedPhaseIds = parseSelectedPhaseIds(next ?? "");
        index += 1;
        break;
      case "--segments":
        options.selectedSegmentIds = parseSelectedSegmentIds(next ?? "");
        index += 1;
        break;
      case "--report-dir":
        options.reportDir = resolve(ROOT_DIR, next ?? options.reportDir);
        index += 1;
        break;
      case "--api-port":
        options.apiPort = Number(next ?? options.apiPort);
        index += 1;
        break;
      case "--web-port":
        options.webPort = Number(next ?? options.webPort);
        index += 1;
        break;
      case "--cluster-port":
        options.clusterPort = Number(next ?? options.clusterPort);
        index += 1;
        break;
      case "--external-cluster-base-url":
        options.externalClusterBaseUrl = next ?? options.externalClusterBaseUrl;
        index += 1;
        break;
      case "--keep-artifacts":
        options.keepArtifacts = true;
        break;
      case "--help":
        console.log(`
Usage:
  node scripts/run-core-phase-tests.mjs [options]

Options:
  --cluster-mode <real|local|external>   Default: real
  --provider-mode <real|mock>            Default: local=>mock, otherwise real
  --phases <csv>                         Optional: stub,provider-direct,cluster-preferred
  --segments <csv>                       Optional: baseline,web,seed,probes,routes,debugs,runtime-contracts,business,business-core,business-web-dashboard,business-web-goalflow,business-web-state,business-web-recovery,business-web-reflections,business-web-inbox,regressions
  --report-dir <path>                    Default: test-results/core-phase-<timestamp>
  --api-port <port>                      Default: 3024
  --web-port <port>                      Default: 4174
  --cluster-port <port>                  Default: 8788
  --external-cluster-base-url <url>      Required when cluster-mode=external
  --keep-artifacts                       Keep generated artifacts on failure
        `.trim());
        process.exit(0);
      default:
        break;
    }
  }

  if (!options.providerMode) {
    options.providerMode = options.clusterMode === "local" ? "mock" : "real";
  }

  return options;
};

const options = parseArgs(process.argv.slice(2));
const COREPACK_BIN = existsSync(resolve(ROOT_DIR, ".tools/node/bin/corepack"))
  ? resolve(ROOT_DIR, ".tools/node/bin/corepack")
  : "corepack";
const TOOL_NODE_BIN = resolve(ROOT_DIR, ".tools/node/bin/node");
const DEFAULT_NODE_BIN = existsSync(TOOL_NODE_BIN) ? TOOL_NODE_BIN : process.execPath;
const OPENCLAW_BIN = process.env.OPENCLAW_BIN ?? `${process.env.HOME ?? ""}/.openclaw/bin/openclaw`;

const readNodeBinaryVersion = (binaryPath) => {
  if (!binaryPath || !existsSync(binaryPath)) {
    return "";
  }
  const result = spawnSync(binaryPath, ["-v"], { encoding: "utf8" });
  if (result.status !== 0) {
    return "";
  }
  return String(result.stdout ?? "").trim();
};

const selectedOpenClawNode = selectOpenClawNodeBinary({
  minimumVersion: OPENCLAW_MINIMUM_NODE_VERSION,
  candidates: [
    existsSync(TOOL_NODE_BIN) ? { path: TOOL_NODE_BIN, version: readNodeBinaryVersion(TOOL_NODE_BIN) } : null,
    process.execPath ? { path: process.execPath, version: process.version } : null,
    process.env.HOME ? {
      path: `${process.env.HOME}/.nvm/versions/node/v24.14.0/bin/node`,
      version: readNodeBinaryVersion(`${process.env.HOME}/.nvm/versions/node/v24.14.0/bin/node`),
    } : null,
  ].filter(Boolean),
});
const NODE_BIN = selectedOpenClawNode.path ?? DEFAULT_NODE_BIN;

let API_BASE_URL = "";
let WEB_BASE_URL = "";
let CLUSTER_BASE_URL = "";

const refreshBaseUrls = () => {
  API_BASE_URL = `http://${options.apiHost}:${options.apiPort}`;
  WEB_BASE_URL = `http://${options.webHost}:${options.webPort}`;
  CLUSTER_BASE_URL =
    options.clusterMode === "external"
      ? options.externalClusterBaseUrl
      : `http://${options.clusterHost}:${options.clusterPort}`;
};

refreshBaseUrls();

const requiredAgentNames = [
  "chief-agent",
  "state-insight-agent",
  "task-management-agent",
  "progress-feedback-agent",
  "interruption-recovery-agent",
  "reflection-coach-agent",
  "automation-agent",
];

const scenarioIds = ["focus-recovery-loop", "goal-reprioritization", "weekly-reflection-mix"];
const webRoutes = ["/", "/tasks", "/state", "/recovery", "/reflections", "/inbox", "/agents"];

const runState = {
  report: {
    startedAt: new Date().toISOString(),
    completedAt: null,
    rootDir: ROOT_DIR,
    apiBaseUrl: API_BASE_URL,
    webBaseUrl: WEB_BASE_URL,
    clusterBaseUrl: CLUSTER_BASE_URL || null,
    clusterMode: options.clusterMode,
    providerMode: options.providerMode,
    phases: [],
    files: {},
    failures: [],
  },
  currentPhase: null,
  currentPhaseRecord: null,
  processes: [],
  webProcess: null,
  clusterProcess: null,
  apiProcess: null,
  mockProviderServer: null,
  reportDir: options.reportDir,
  logsDir: join(options.reportDir, "logs"),
  responsesDir: join(options.reportDir, "responses"),
};
let finalized = false;
let liveSnapshotPromise = Promise.resolve();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitize = (value) => value.replace(/[^a-zA-Z0-9._-]+/g, "-");

const ensureDir = async (path) => {
  await mkdir(path, { recursive: true });
};

const baseEnv = () => ({
  ...process.env,
  PATH: [
    resolve(ROOT_DIR, ".tools/node/bin"),
    `${process.env.HOME ?? ""}/.openclaw/bin`,
    process.env.PATH ?? "",
  ]
    .filter(Boolean)
    .join(":"),
});

const extractJsonCandidate = (content) => {
  const trimmed = String(content ?? "").trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
};

const tryParseJson = (value) => {
  try {
    const candidate = extractJsonCandidate(value);
    return candidate ? JSON.parse(candidate) : null;
  } catch {
    return null;
  }
};

const extractPromptText = (payload) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  if (typeof payload.input === "string") {
    return payload.input;
  }
  if (Array.isArray(payload.input)) {
    return payload.input
      .flatMap((entry) => {
        if (typeof entry === "string") {
          return [entry];
        }
        if (Array.isArray(entry?.content)) {
          return entry.content.map((part) => part?.text ?? "");
        }
        if (typeof entry?.content === "string") {
          return [entry.content];
        }
        return [];
      })
      .join("\n");
  }
  if (Array.isArray(payload.messages)) {
    return payload.messages
      .flatMap((message) => {
        if (typeof message?.content === "string") {
          return [message.content];
        }
        if (Array.isArray(message?.content)) {
          return message.content.map((part) => part?.text ?? "");
        }
        return [];
      })
      .join("\n");
  }
  return "";
};

const extractUserPromptText = (payload) => {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  if (Array.isArray(payload.input)) {
    const userEntry = payload.input.find((entry) => entry?.role === "user") ?? payload.input[payload.input.length - 1];
    if (Array.isArray(userEntry?.content)) {
      return userEntry.content.map((part) => part?.text ?? "").join("\n");
    }
    if (typeof userEntry?.content === "string") {
      return userEntry.content;
    }
  }
  if (Array.isArray(payload.messages)) {
    const userEntry = payload.messages.find((entry) => entry?.role === "user") ?? payload.messages[payload.messages.length - 1];
    if (Array.isArray(userEntry?.content)) {
      return userEntry.content.map((part) => part?.text ?? "").join("\n");
    }
    if (typeof userEntry?.content === "string") {
      return userEntry.content;
    }
  }
  if (typeof payload.input === "string") {
    return payload.input;
  }
  return extractPromptText(payload);
};

const buildMockChiefRoute = (workflow = "state_assessment") => ({
  workflow,
  selectedAgent:
    workflow === "task_management"
      ? "task-management-agent"
      : workflow === "progress_summary"
        ? "progress-feedback-agent"
        : workflow === "recovery_plan"
          ? "interruption-recovery-agent"
          : workflow === "reflection_report"
            ? "reflection-coach-agent"
            : workflow === "notification_dispatch"
              ? "automation-agent"
              : "state-insight-agent",
  reason: `Mock provider routed workflow ${workflow}.`,
  executionMode: "agent",
  confidence: 0.99,
});

const buildMockStateInsight = (context) => {
  const userId = context?.userId ?? "demo-user";
  const windowEnd = new Date().toISOString();
  const windowStart = new Date(Date.now() - 15 * 60_000).toISOString();
  return {
    userId,
    windowStart,
    windowEnd,
    focusScore: 71,
    energyScore: 64,
    moodScore: 59,
    summary: "Mock provider detected moderate focus with manageable interruptions.",
    recommendedAction: "Continue the top task for another 20 minutes.",
    activeInputs: ["desktop_signal", "manual_checkin"],
    mediaFreshness: "fresh",
  };
};

const buildMockTaskManagement = (context) => {
  const taskIds = Array.isArray(context?.tasks) ? context.tasks.map((task) => task?.id).filter(Boolean) : [];
  return {
    orderedTaskIds: taskIds,
    summary: "Mock provider kept the most relevant tasks at the top.",
    suggestedTasks:
      taskIds.length > 0
        ? []
        : [
            {
              title: "Clarify the next deliverable",
              priority: "high",
              estimatedMinutes: 25,
            },
            {
              title: "Break the goal into two smaller tasks",
              priority: "medium",
              estimatedMinutes: 20,
            },
          ],
  };
};

const buildMockProgressFeedback = () => ({
  summaryHeadline: "Mock provider progress summary",
  completionRate: 0.45,
  completedTaskCount: 2,
  inProgressTaskCount: 1,
});

const buildMockRecovery = (context) => ({
  reason: context?.reason ?? "manual_request",
  nextStep: "Resume with the highest-priority task for 15 minutes.",
  suggestedMinutes: 15,
  reprioritizedTaskIds: Array.isArray(context?.tasks) ? context.tasks.map((task) => task?.id).filter(Boolean).slice(0, 3) : [],
});

const buildMockReflection = (context) => {
  const periodType = context?.periodType ?? "weekly";
  const periodEnd = new Date().toISOString();
  const periodStart = new Date(Date.now() - (periodType === "monthly" ? 30 : 7) * 24 * 60 * 60_000).toISOString();
  return {
    userId: context?.userId ?? "demo-user",
    periodType,
    periodStart,
    periodEnd,
    highlights: ["Mock provider highlight"],
    blockers: ["Mock provider blocker"],
    trends: ["Mock provider trend"],
    nextSuggestions: ["Mock provider next suggestion"],
  };
};

const buildMockAutomation = () => ({
  title: "Mock provider reminder",
  message: "Resume the current task or take a short intentional break.",
  channel: "desktop_local",
  deliver: true,
});

const buildMockProviderPayload = ({ agentName, workflow, operation, context }) => {
  if (operation === "probe") {
    return { probe: "ok" };
  }
  switch (agentName) {
    case "chief-agent":
      return buildMockChiefRoute(workflow);
    case "state-insight-agent":
      return buildMockStateInsight(context);
    case "task-management-agent":
      return buildMockTaskManagement(context);
    case "progress-feedback-agent":
      return buildMockProgressFeedback();
    case "interruption-recovery-agent":
      return buildMockRecovery(context);
    case "reflection-coach-agent":
      return buildMockReflection(context);
    case "automation-agent":
      return buildMockAutomation();
    default:
      return { ok: true };
  }
};

const startMockProvider = async () => {
  if (runState.mockProviderServer) {
    return `http://127.0.0.1:${options.mockProviderPort}`;
  }

  await ensureDir(runState.logsDir);
  const logFile = join(runState.logsDir, "mock-provider.log");
  const stream = createWriteStream(logFile, { flags: "a" });

  const server = createHttpServer(async (request, response) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      const parsedBody = tryParseJson(body) ?? {};
      const promptText = extractUserPromptText(parsedBody);
      const context = tryParseJson(promptText) ?? {};
      const agentName = String(request.headers["x-mindanchor-agent-name"] ?? context?.agentName ?? "unknown-agent");
      const workflow = String(request.headers["x-mindanchor-workflow"] ?? context?.workflow ?? "state_assessment");
      const operation = String(request.headers["x-mindanchor-operation"] ?? "generate");
      const payload = buildMockProviderPayload({ agentName, workflow, operation, context });
      const wireResponse =
        request.url?.includes("/chat/completions")
          ? { choices: [{ message: { content: JSON.stringify(payload) } }] }
          : { output_text: JSON.stringify(payload) };

      stream.write(`[${new Date().toISOString()}] ${request.method} ${request.url} agent=${agentName} workflow=${workflow} operation=${operation}\n`);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify(wireResponse));
    });
  });

  await new Promise((resolve) => {
    server.listen(options.mockProviderPort, "127.0.0.1", () => resolve(undefined));
  });
  runState.mockProviderServer = { server, stream, logFile };
  return `http://127.0.0.1:${options.mockProviderPort}`;
};

const spawnLoggedProcess = async ({ name, command, args, env, logFile, cwd = ROOT_DIR }) => {
  const processInfo = await spawnManagedLoggedProcess({
    name,
    command,
    args,
    env,
    logFile,
    cwd,
  });
  runState.processes.push(processInfo);
  return processInfo.child;
};

const cleanupProcesses = async () => {
  await cleanupManagedProcesses({
    directChildren: [runState.apiProcess, runState.clusterProcess, runState.webProcess],
    processEntries: runState.processes,
    stopChildImpl: stopManagedChild,
    closeMockProviderImpl: runState.mockProviderServer
      ? async () => {
          await new Promise((resolve) => runState.mockProviderServer.server.close(() => resolve(undefined)));
          runState.mockProviderServer.stream.end();
          runState.mockProviderServer = null;
        }
      : null,
  });
  runState.apiProcess = null;
  runState.clusterProcess = null;
  runState.webProcess = null;
  runState.processes = [];
};

const execCommand = async ({ label, command, args, env, cwd = ROOT_DIR }) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${label} failed with code ${code}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`));
    });
  });

const waitForJson = async (url, timeoutMs = 90000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch {}
    await delay(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const saveResponseBody = async (phaseId, label, body, extension = "json") => {
  const targetDir = join(runState.responsesDir, phaseId);
  await ensureDir(targetDir);
  const file = join(targetDir, `${sanitize(label)}.${extension}`);
  await writeFile(file, body, "utf8");
  return file;
};

const requestText = ({ url, method = "GET", headers = {}, body, timeoutMs = 300000 }) =>
  new Promise((resolve, reject) => {
    const target = new URL(url);
    const transport = target.protocol === "https:" ? https : http;
    const request = transport.request(
      target,
      {
        method,
        headers,
      },
      (response) => {
        let text = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          text += chunk;
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode ?? 0,
            headers: response.headers,
            text,
          });
        });
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Request timeout after ${timeoutMs}ms`));
    });
    request.on("error", reject);
    if (body) {
      request.write(body);
    }
    request.end();
  });

const summarizePayload = (payload) => {
  const adapter = payload?.adapter ?? payload?.lastDecision ?? null;
  return {
    traceId:
      payload?.traceId ??
      payload?.lastDecision?.traceId ??
      payload?.trace?.traceId ??
      payload?.parentTraceId ??
      null,
    success: typeof payload?.success === "boolean" ? payload.success : null,
    fallbackLikely: typeof payload?.fallbackLikely === "boolean" ? payload.fallbackLikely : null,
    adapterRoute: adapter?.route ?? null,
    selectedEndpoint: adapter?.selectedEndpoint ?? null,
    fallbackReason: adapter?.fallbackReason ?? payload?.lastFallback?.fallbackReason ?? null,
    failureCategory: adapter?.failureCategory ?? payload?.lastFallback?.failureCategory ?? null,
  };
};

const summarizeFailureCategoryCounts = (steps) =>
  steps.reduce((counts, step) => {
    if (!step?.failureCategory) {
      return counts;
    }
    counts[step.failureCategory] = (counts[step.failureCategory] ?? 0) + 1;
    return counts;
  }, {});

const recordFailure = (phaseId, label, error, details = {}) => {
  const failure = {
    phaseId,
    label,
    message: error instanceof Error ? error.message : String(error),
    ...details,
    createdAt: new Date().toISOString(),
  };
  runState.report.failures.push(failure);
  if (runState.currentPhaseRecord) {
    runState.currentPhaseRecord.failures.push(failure);
  }
  queueLiveReportSnapshot();
};

const addStepRecord = (record) => {
  if (!runState.currentPhaseRecord) {
    throw new Error("No current phase record available.");
  }
  runState.currentPhaseRecord.steps.push(record);
  runState.currentPhaseRecord.failureCategoryCounts = summarizeFailureCategoryCounts(runState.currentPhaseRecord.steps);
  queueLiveReportSnapshot();
  return record;
};

const writeSnapshotFiles = async ({ live }) => {
  const jsonFile = join(runState.reportDir, live ? "report.live.json" : "report.json");
  const markdownFile = join(runState.reportDir, live ? "report.live.md" : "report.md");
  if (!live) {
    runState.report.files = {
      reportJson: jsonFile,
      reportMarkdown: markdownFile,
      logsDir: runState.logsDir,
      responsesDir: runState.responsesDir,
    };
  }
  await writeFile(jsonFile, `${JSON.stringify(runState.report, null, 2)}\n`, "utf8");
  const markdown = buildCorePhaseReportMarkdown({
    report: runState.report,
    apiBaseUrl: API_BASE_URL,
    webBaseUrl: WEB_BASE_URL,
    clusterBaseUrl: CLUSTER_BASE_URL,
    clusterMode: options.clusterMode,
    providerMode: options.providerMode,
    jsonFile,
    logsDir: runState.logsDir,
    responsesDir: runState.responsesDir,
  });
  await writeFile(markdownFile, markdown, "utf8");
  return { jsonFile, markdownFile };
};

const queueLiveReportSnapshot = () => {
  if (!runState.reportDir) {
    return liveSnapshotPromise;
  }
  liveSnapshotPromise = liveSnapshotPromise
    .catch(() => undefined)
    .then(() => writeSnapshotFiles({ live: true }))
    .catch(() => undefined);
  return liveSnapshotPromise;
};

const callJson = async ({
  phaseId,
  label,
  method = "GET",
  path,
  body,
  baseUrl = API_BASE_URL,
  headers = {},
  timeoutMs,
  validate,
}) => {
  const requestUrl = `${baseUrl}${path}`;
  const startedAt = new Date().toISOString();
  const stepStartedAtMs = Date.now();
  const effectiveTimeoutMs =
    timeoutMs ??
    (runState.currentPhaseRecord?.agentMode === "openai-compatible" && runState.currentPhaseRecord?.clusterEnabled === false
      ? options.providerDirectRequestTimeoutMs
      : options.defaultRequestTimeoutMs);
  const phaseTitle = runState.currentPhaseRecord?.title ?? phaseId;
  let responseFile = null;
  let responseStatus = null;
  let responsePayload = null;
  console.log(
    formatCorePhaseStepStarted({
      phaseTitle,
      label,
      method,
      path,
      timeoutMs: effectiveTimeoutMs,
    }),
  );
  try {
    const requestBody = body !== undefined ? JSON.stringify(body) : undefined;
    const response = await requestText({
      url: requestUrl,
      method,
      headers: {
        ...(requestBody !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: requestBody,
      timeoutMs: effectiveTimeoutMs,
    });
    const ok = response.statusCode >= 200 && response.statusCode < 300;
    const headerValue = (name) => {
      const value = response.headers[name.toLowerCase()];
      return Array.isArray(value) ? value.join(", ") : value ?? null;
    };
    const text = response.text;
    const extension = headerValue("content-type")?.includes("json") ? "json" : "txt";
    responseFile = await saveResponseBody(phaseId, label, text, extension);
    responsePayload = extension === "json" && text.length > 0 ? JSON.parse(text) : text;
    responseStatus = response.statusCode;
    if (validate) {
      await validate(responsePayload, {
        status: response.statusCode,
        ok,
        headers: {
          get: headerValue,
        },
      });
    }
    const summary = summarizePayload(responsePayload);
    const step = addStepRecord({
      label,
      method,
      path,
      baseUrl,
      startedAt,
      completedAt: new Date().toISOString(),
      statusCode: response.statusCode,
      success: ok,
      responseFile,
      ...summary,
      adapterStrategy:
        responsePayload?.executionStrategy ??
        responsePayload?.adapter?.strategy ??
        responsePayload?.lastDecision?.strategy ??
        responsePayload?.adapterStatus?.executionStrategy ??
        null,
      conclusion: "passed",
    });
    console.log(
      formatCorePhaseStepCompleted({
        phaseTitle,
        label,
        statusCode: response.statusCode,
        elapsedMs: Date.now() - stepStartedAtMs,
        conclusion: "passed",
      }),
    );
    return {
      response: {
        status: response.statusCode,
        ok,
        headers: {
          get: headerValue,
        },
      },
      payload: responsePayload,
      step,
    };
  } catch (error) {
    const step = addStepRecord({
      label,
      method,
      path,
      baseUrl,
      startedAt,
      completedAt: new Date().toISOString(),
      statusCode: responseStatus,
      success: false,
      responseFile,
      ...summarizePayload(responsePayload),
      adapterStrategy:
        responsePayload?.executionStrategy ??
        responsePayload?.adapter?.strategy ??
        responsePayload?.lastDecision?.strategy ??
        responsePayload?.adapterStatus?.executionStrategy ??
        null,
      conclusion: error instanceof Error ? error.message : String(error),
    });
    console.error(
      formatCorePhaseStepFailed({
        phaseTitle,
        label,
        elapsedMs: Date.now() - stepStartedAtMs,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    recordFailure(phaseId, label, error, { step });
    throw error;
  }
};

const assertCondition = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const lookupTrace = async (phaseId, label, traceId) => {
  const { payload } = await callJson({
    phaseId,
    label,
    path: `/debug/traces/${traceId}`,
    validate: (data) => {
      assertCondition(data.traceId === traceId, `${label}: traceId mismatch.`);
      assertCondition(Array.isArray(data.events) && data.events.length > 0, `${label}: trace returned no events.`);
    },
  });
  return payload;
};

const currentApiEnv = ({ agentMode, openClawBaseUrl, dataFile, extraEnv = {} }) => ({
  ...baseEnv(),
  MINDANCHOR_API_PORT: String(options.apiPort),
  MINDANCHOR_DATA_FILE: dataFile,
  MINDANCHOR_AGENT_MODE: agentMode,
  MINDANCHOR_API_URL: API_BASE_URL,
  ...(openClawBaseUrl ? { MINDANCHOR_OPENCLAW_BASE_URL: openClawBaseUrl } : { MINDANCHOR_OPENCLAW_BASE_URL: "" }),
  ...extraEnv,
});

const startApi = async ({ phaseId, agentMode, openClawBaseUrl, extraEnv }) => {
  await stopManagedChild(runState.apiProcess);
  runState.apiProcess = null;
  await delay(300);
  const dataFile = join(runState.reportDir, `${phaseId}-mindanchor.json`);
  const logFile = join(runState.logsDir, `api-${phaseId}.log`);
  const apiEnv = currentApiEnv({ agentMode, openClawBaseUrl, dataFile, extraEnv });
  runState.apiProcess = await spawnLoggedProcess({
    name: `api-${phaseId}`,
    command: COREPACK_BIN,
    args: ["pnpm", "--filter", "@mindanchor/api", "exec", "tsx", "src/index.ts"],
    env: apiEnv,
    logFile,
  });
  await waitForJson(`${API_BASE_URL}/health`);
  assertCondition(runState.apiProcess.exitCode === null, `API process for ${phaseId} exited before becoming healthy.`);
  return { dataFile, logFile, agentMode, openClawBaseUrl: openClawBaseUrl || null };
};

const startWeb = async () => {
  if (runState.webProcess) {
    return;
  }
  const logFile = join(runState.logsDir, "web.log");
  runState.webProcess = await spawnLoggedProcess({
    name: "web",
    command: COREPACK_BIN,
    args: ["pnpm", "--filter", "@mindanchor/web", "exec", "vite", "--host", options.webHost, "--port", String(options.webPort)],
    env: {
      ...baseEnv(),
      VITE_API_BASE_URL: API_BASE_URL,
    },
    logFile,
  });
  await waitForJson(`${API_BASE_URL}/health`).catch(() => undefined);
  const startedAt = Date.now();
  while (Date.now() - startedAt < 90000) {
    try {
      const response = await fetch(`${WEB_BASE_URL}/`);
      if (response.ok) {
        return;
      }
    } catch {}
    await delay(500);
  }
  throw new Error(`Timed out waiting for Web UI at ${WEB_BASE_URL}`);
};

const startCluster = async () => {
  if (options.clusterMode === "external") {
    assertCondition(Boolean(CLUSTER_BASE_URL), "External cluster mode requires a cluster base URL.");
    await waitForJson(`${CLUSTER_BASE_URL}/health`);
    return {
      kind: "external",
      baseUrl: CLUSTER_BASE_URL,
      logFile: null,
    };
  }

  if (options.clusterMode === "real") {
    assertCondition(existsSync(OPENCLAW_BIN), `OpenClaw CLI not found at ${OPENCLAW_BIN}`);
  }

  const logFile = join(runState.logsDir, `openclaw-${options.clusterMode}.log`);
  const entrypoint =
    options.clusterMode === "real" ? "openclaw/production-runtime-server.mjs" : "openclaw/local-cluster-server.mjs";
  runState.clusterProcess = await spawnLoggedProcess({
    name: `openclaw-${options.clusterMode}`,
    command: NODE_BIN,
    args: [entrypoint],
    env: {
      ...baseEnv(),
      OPENCLAW_HOST: options.clusterHost,
      OPENCLAW_PORT: String(options.clusterPort),
      ...(options.clusterMode === "real" ? { OPENCLAW_BIN } : {}),
    },
    logFile,
  });
  await waitForJson(`${CLUSTER_BASE_URL}/health`, options.clusterMode === "real" ? 180000 : 90000);
  assertCondition(runState.clusterProcess.exitCode === null, `OpenClaw ${options.clusterMode} process exited before health check passed.`);
  return {
    kind: options.clusterMode,
    baseUrl: CLUSTER_BASE_URL,
    logFile,
  };
};

const buildWorkspaces = async () => {
  await execCommand({
    label: "build-domain",
    command: COREPACK_BIN,
    args: ["pnpm", "--filter", "@mindanchor/domain", "build"],
    env: baseEnv(),
  });
  await execCommand({
    label: "build-api",
    command: COREPACK_BIN,
    args: ["pnpm", "--filter", "@mindanchor/api", "build"],
    env: baseEnv(),
  });
  await execCommand({
    label: "build-web",
    command: COREPACK_BIN,
    args: ["pnpm", "--filter", "@mindanchor/web", "build"],
    env: baseEnv(),
  });
};

const clearHistories = async (phaseId) => {
  await callJson({
    phaseId,
    label: "clear-debug-runs",
    method: "POST",
    path: "/debug/runs/clear",
    body: {},
    validate: (payload) => {
      assertCondition(payload.userId === null, "clear-debug-runs did not clear all users.");
    },
  });
  await callJson({
    phaseId,
    label: "clear-matrix-runs",
    method: "POST",
    path: "/debug/regressions/matrix-runs/clear",
    body: {},
    validate: (payload) => {
      assertCondition(payload.cleared === true, "clear-matrix-runs did not return cleared=true.");
    },
  });
};

const baselineChecks = async (phaseId, expectedStrategy, clusterEnabled) => {
  const health = await callJson({
    phaseId,
    label: "health",
    path: "/health",
    validate: (payload) => {
      assertCondition(payload.ok === true, "/health did not report ok=true.");
    },
  });
  const adapter = await callJson({
    phaseId,
    label: "adapter-status",
    path: "/debug/openclaw/adapter",
    validate: (payload) => {
      assertCondition(payload.executionStrategy === expectedStrategy, `Expected adapter strategy ${expectedStrategy}.`);
      assertCondition(payload.clusterEnabled === clusterEnabled, `Expected clusterEnabled=${clusterEnabled}.`);
    },
  });
  const agentConfigs = await callJson({
    phaseId,
    label: "agent-configs",
    path: "/debug/agent-configs",
    validate: (payload) => {
      assertCondition(Array.isArray(payload.agents), "agent-configs returned no agents array.");
      for (const agentName of requiredAgentNames) {
        assertCondition(payload.agents.some((agent) => agent.target === agentName), `agent-configs missing ${agentName}.`);
      }
    },
  });
  const scenarios = await callJson({
    phaseId,
    label: "debug-scenarios",
    path: "/debug/scenarios",
    validate: (payload) => {
      for (const scenarioId of scenarioIds) {
        assertCondition(payload.scenarios.some((scenario) => scenario.id === scenarioId), `Missing debug scenario ${scenarioId}.`);
      }
    },
  });
  const registryVisibility = await callJson({
    phaseId,
    label: "registry-visibility",
    path: "/debug/openclaw/registry-visibility",
    validate: (payload) => {
      assertCondition(Boolean(payload?.externalRuntime), "registry-visibility missing externalRuntime.");
      assertCondition(Boolean(payload?.nativeRegistry), "registry-visibility missing nativeRegistry.");
      assertCondition(typeof payload?.externalRuntime?.healthStatus === "string", "registry-visibility missing healthStatus.");
    },
  });

  return {
    health,
    adapter,
    agentConfigs,
    scenarios,
    registryVisibility,
    registrySummary: buildRegistryPhaseSummary(registryVisibility.payload),
  };
};

const webRouteChecks = async (phaseId) => {
  for (const route of webRoutes) {
    const label = `web${route === "/" ? "-root" : route.replaceAll("/", "-")}`;
    const response = await fetch(`${WEB_BASE_URL}${route}`, {
      headers: {
        Accept: "text/html",
      },
    });
    const text = await response.text();
    const responseFile = await saveResponseBody(phaseId, label, text, "html");
    assertCondition(response.ok, `${route} did not return HTTP 200 from Web UI.`);
    assertCondition(text.includes("id=\"root\"") || text.includes("id='root'"), `${route} did not look like the app shell.`);
    addStepRecord({
      label,
      method: "GET",
      path: route,
      baseUrl: WEB_BASE_URL,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      statusCode: response.status,
      success: true,
      responseFile,
      traceId: null,
      fallbackLikely: null,
      adapterRoute: null,
      selectedEndpoint: null,
      fallbackReason: null,
      adapterStrategy: null,
      conclusion: "passed",
    });
  }
};

const webReadModelChecks = async (phaseId, users, selectedCheckIds = null) => {
  const checks = [
    {
      id: "dashboard",
      label: "web-dashboard-summary",
      path: `/dashboard/summary?userId=${users.dashboardUserId}`,
      validate: (payload) => {
        assertCondition(payload.latestAssessment !== null, "dashboard summary missing latestAssessment.");
      },
    },
    {
      id: "goalflow",
      label: "web-goalflow-overview",
      path: `/goalflow/overview?userId=${users.goalflowUserId}`,
      validate: (payload) => {
        assertCondition(payload.metricCounts.totalTasks > 0, "goalflow overview missing tasks.");
      },
    },
    {
      id: "state",
      label: "web-state-trends",
      path: `/state/trends?userId=${users.stateUserId}`,
      validate: (payload) => {
        assertCondition(Array.isArray(payload.assessments) && payload.assessments.length > 0, "state trends missing assessments.");
      },
    },
    {
      id: "recovery",
      label: "web-recovery-history",
      path: `/recovery/history?userId=${users.recoveryUserId}`,
      validate: (payload) => {
        assertCondition(Array.isArray(payload.recoveryPlans) && payload.recoveryPlans.length > 0, "recovery history missing recovery plans.");
      },
    },
    {
      id: "reflections",
      label: "web-reflections-overview",
      path: `/reflections/overview?userId=${users.reflectionUserId}`,
      validate: (payload) => {
        assertCondition(Array.isArray(payload.reports) && payload.reports.length > 0, "reflections overview missing reports.");
      },
    },
    {
      id: "inbox",
      label: "web-inbox-overview",
      path: `/client/inbox/overview?userId=${users.inboxUserId}`,
      validate: (payload) => {
        assertCondition(Array.isArray(payload.messages) && payload.messages.length > 0, "inbox overview missing messages.");
      },
    },
  ];

  const filteredChecks = selectedCheckIds?.length
    ? checks.filter((check) => selectedCheckIds.includes(check.id))
    : checks;

  for (const check of filteredChecks) {
    await callJson({
      phaseId,
      label: check.label,
      path: check.path,
      validate: check.validate,
    });
  }
};

const seedScenarios = async (phaseId) => {
  const seeded = {};
  for (const scenarioId of scenarioIds) {
    const response = await callJson({
      phaseId,
      label: `seed-${scenarioId}`,
      method: "POST",
      path: `/debug/scenarios/${scenarioId}/seed`,
      body: {},
      validate: (payload) => {
        assertCondition(payload.scenarioId === scenarioId, `${scenarioId} seed returned wrong scenarioId.`);
        assertCondition(Boolean(payload.userId), `${scenarioId} seed did not return userId.`);
      },
    });
    seeded[scenarioId] = response.payload;
  }
  return seeded;
};

const runChiefRoutes = async (phaseId, seeded) => {
  const checks = [
    {
      label: "chief-route-recovery",
      path: `/debug/agent/chief-route?workflow=recovery_plan&userId=${seeded["focus-recovery-loop"].userId}&taskId=${seeded["focus-recovery-loop"].taskId}&scenarioId=focus-recovery-loop`,
    },
    {
      label: "chief-route-task-management",
      path: `/debug/agent/chief-route?workflow=task_management&userId=${seeded["goal-reprioritization"].userId}&scenarioId=goal-reprioritization`,
    },
    {
      label: "chief-route-reflection",
      path: `/debug/agent/chief-route?workflow=reflection_report&userId=${seeded["weekly-reflection-mix"].userId}&periodType=${seeded["weekly-reflection-mix"].periodType ?? "weekly"}&scenarioId=weekly-reflection-mix`,
    },
  ];

  for (const check of checks) {
    const { payload } = await callJson({
      phaseId,
      label: check.label,
      path: check.path,
      validate: (data) => {
        assertCondition(typeof data.success === "boolean", `${check.label} missing success flag.`);
        assertCondition(typeof data.traceId === "string", `${check.label} missing traceId.`);
      },
    });
    if (payload.traceId) {
      await lookupTrace(phaseId, `${check.label}-trace`, payload.traceId);
    }
  }
};

const runSingleAgentDebugs = async (phaseId, seeded) => {
  const checks = [
    {
      label: "debug-state-insight",
      path: `/debug/agent/state-insight?userId=${seeded["focus-recovery-loop"].userId}&scenarioId=focus-recovery-loop`,
      agentName: "state-insight-agent",
    },
    {
      label: "debug-task-management",
      path: `/debug/agent/task-management?userId=${seeded["goal-reprioritization"].userId}&goalId=${seeded["goal-reprioritization"].goalId}&scenarioId=goal-reprioritization`,
      agentName: "task-management-agent",
    },
    {
      label: "debug-progress-feedback",
      path: `/debug/agent/progress-feedback?userId=${seeded["goal-reprioritization"].userId}&scenarioId=goal-reprioritization`,
      agentName: "progress-feedback-agent",
    },
    {
      label: "debug-interruption-recovery",
      path: `/debug/agent/interruption-recovery?userId=${seeded["focus-recovery-loop"].userId}&taskId=${seeded["focus-recovery-loop"].taskId}&scenarioId=focus-recovery-loop`,
      agentName: "interruption-recovery-agent",
    },
    {
      label: "debug-reflection",
      path: `/debug/agent/reflection?userId=${seeded["weekly-reflection-mix"].userId}&periodType=${seeded["weekly-reflection-mix"].periodType ?? "weekly"}&scenarioId=weekly-reflection-mix`,
      agentName: "reflection-coach-agent",
    },
    {
      label: "debug-automation",
      path: `/debug/agent/automation?userId=${seeded["focus-recovery-loop"].userId}&scenarioId=focus-recovery-loop`,
      agentName: "automation-agent",
    },
  ];

  for (const check of checks) {
    const { payload } = await callJson({
      phaseId,
      label: check.label,
      path: check.path,
      validate: (data) => {
        assertCondition(typeof data.success === "boolean", `${check.label} missing success flag.`);
        assertCondition(typeof data.traceId === "string", `${check.label} missing traceId.`);
      },
    });
    if (payload.traceId) {
      await lookupTrace(phaseId, `${check.label}-trace`, payload.traceId);
    }
  }
};

const runModelProbes = async (phaseId, timeoutMs = options.defaultProbeTimeoutMs) => {
  for (const agentName of requiredAgentNames) {
    const { payload } = await callJson({
      phaseId,
      label: `probe-${agentName}`,
      path: `/debug/model-probe/${agentName}`,
      timeoutMs,
      validate: (data) => {
        assertCondition(typeof data.success === "boolean", `probe-${agentName} missing success flag.`);
      },
    });
    if (payload.traceId) {
      await lookupTrace(phaseId, `probe-${agentName}-trace`, payload.traceId);
    }
  }
};

const runBusinessFlow = async (phaseId, agentMode, reflectionUserId) => {
  const userId = `core-phase-${phaseId}-user`;
  const goalResponse = await callJson({
    phaseId,
    label: "business-create-goal",
    method: "POST",
    path: "/goals",
    body: {
      userId,
      title: `Core phase goal ${phaseId}`,
      description: `Business flow in ${agentMode}`,
    },
    validate: (payload, response) => {
      assertCondition(response.status === 201, "Goal creation did not return 201.");
      assertCondition(Boolean(payload.id), "Goal creation did not return id.");
    },
  });

  const taskResponse = await callJson({
    phaseId,
    label: "business-create-task",
    method: "POST",
    path: "/tasks",
    body: {
      userId,
      goalId: goalResponse.payload.id,
      title: `Core phase task ${phaseId}`,
      priority: "high",
      estimatedMinutes: 30,
    },
    validate: (payload, response) => {
      assertCondition(response.status === 201, "Task creation did not return 201.");
      assertCondition(Boolean(payload.id), "Task creation did not return id.");
    },
  });

  const sessionResponse = await callJson({
    phaseId,
    label: "business-start-session",
    method: "POST",
    path: "/sessions/start",
    body: {
      userId,
      taskId: taskResponse.payload.id,
      goalId: goalResponse.payload.id,
    },
    validate: (payload, response) => {
      assertCondition(response.status === 201, "Session start did not return 201.");
      assertCondition(Boolean(payload.id), "Session start did not return id.");
    },
  });

  await callJson({
    phaseId,
    label: "business-signal-batch",
    method: "POST",
    path: "/state/signals/batch",
    body: {
      events: [
        {
          userId,
          source: "desktop",
          eventType: "idle",
          occurredAt: new Date(Date.now() - 60_000).toISOString(),
          payload: { idleSeconds: 180 },
        },
        {
          userId,
          source: "desktop",
          eventType: "window_switch",
          occurredAt: new Date().toISOString(),
          payload: { from: "Code", to: "Browser" },
        },
      ],
    },
    validate: (payload) => {
      assertCondition(payload.acceptedCount >= 2, "Signal batch did not accept both events.");
    },
  });

  await callJson({
    phaseId,
    label: "business-state-latest",
    path: `/state/latest?userId=${userId}`,
    validate: (payload) => {
      assertCondition(payload.latestAssessment !== null, "Latest state missing assessment.");
      assertCondition(payload.latestBehaviorConclusion !== null, "Latest state missing behavior conclusion.");
    },
  });

  await callJson({
    phaseId,
    label: "business-end-session",
    method: "POST",
    path: "/sessions/end",
    body: {
      sessionId: sessionResponse.payload.id,
      interrupted: true,
      summary: `Interrupted during ${phaseId}`,
    },
    validate: (payload) => {
      assertCondition(payload.recoveryPlan !== null, "Session end did not return recovery plan.");
    },
  });

  const inbox = await callJson({
    phaseId,
    label: "business-inbox",
    path: `/client/inbox?userId=${userId}`,
    validate: (payload) => {
      assertCondition(Array.isArray(payload.messages) && payload.messages.length > 0, "Inbox missing messages.");
    },
  });

  await callJson({
    phaseId,
    label: "business-dashboard-summary",
    path: `/dashboard/summary?userId=${userId}`,
    validate: (payload) => {
      assertCondition(payload.goalCount >= 1, "Dashboard summary missing goal count.");
      assertCondition(payload.latestRecoveryPlan !== null, "Dashboard summary missing latest recovery plan.");
    },
  });

  await callJson({
    phaseId,
    label: "business-reflections-latest",
    path: `/reflections/latest?userId=${reflectionUserId}&periodType=weekly`,
    validate: (payload) => {
      assertCondition(Array.isArray(payload.reports) && payload.reports.length > 0, "Reflections latest missing reports.");
    },
  });

  const firstMessageId = inbox.payload.messages[0]?.id;
  assertCondition(Boolean(firstMessageId), "Inbox did not return a message id to acknowledge.");
  await callJson({
    phaseId,
    label: "business-inbox-ack",
    method: "POST",
    path: `/client/inbox/${firstMessageId}/ack`,
    body: {},
    validate: (payload) => {
      assertCondition(payload.status === "acknowledged", "Inbox ack did not return acknowledged.");
    },
  });

  return { userId };
};

const runReflectionsChain = async (phaseId, seeded) => {
  const reflectionUserId = seeded["weekly-reflection-mix"].userId;
  await callJson({
    phaseId,
    label: "reflection-latest-weekly",
    path: `/reflections/latest?userId=${reflectionUserId}&periodType=weekly`,
    validate: (payload) => {
      assertCondition(Array.isArray(payload.reports) && payload.reports.length > 0, "Weekly reflections missing reports.");
    },
  });
};

const runFullRegression = async (phaseId, timeoutMs = options.defaultFullRegressionTimeoutMs) => {
  const { payload } = await callJson({
    phaseId,
    label: "full-regression",
    method: "POST",
    path: "/debug/regressions/full-run",
    body: {},
    timeoutMs,
    validate: (data) => {
      assertCondition(data.totalSteps > 0, "Full regression returned no steps.");
      assertCondition(typeof data.traceId === "string", "Full regression missing traceId.");
    },
  });
  if (payload.traceId) {
    await lookupTrace(phaseId, "full-regression-trace", payload.traceId);
  }
  return payload;
};

const runMatrixRegression = async (phaseId, timeoutMs = options.defaultMatrixRegressionTimeoutMs) => {
  const matrixCasesResponse = await callJson({
    phaseId,
    label: "matrix-cases",
    path: "/debug/regressions/matrix-cases",
    validate: (payload) => {
      assertCondition(Array.isArray(payload.cases) && payload.cases.length > 0, "Matrix cases missing.");
    },
  });
  const caseIds = matrixCasesResponse.payload.cases.map((item) => item.id);
  const matrixRun = await callJson({
    phaseId,
    label: "matrix-run",
    method: "POST",
    path: "/debug/regressions/matrix-run",
    body: { caseIds },
    timeoutMs,
    validate: (payload) => {
      assertCondition(payload.totalSteps > 0, "Matrix regression returned no steps.");
      assertCondition(typeof payload.traceId === "string", "Matrix regression missing traceId.");
    },
  });
  await callJson({
    phaseId,
    label: "matrix-history",
    path: "/debug/regressions/matrix-runs?limit=5",
    validate: (payload) => {
      assertCondition(Array.isArray(payload.runs) && payload.runs.length > 0, "Matrix history missing saved runs.");
    },
  });
  if (matrixRun.payload.traceId) {
    await lookupTrace(phaseId, "matrix-run-trace", matrixRun.payload.traceId);
  }
  return matrixRun.payload;
};

const evaluateClusterPhase = (phaseRecord, fullRegression, matrixRegression) => {
  const agentSteps = phaseRecord.steps.filter(
    (step) =>
      (step.label.startsWith("probe-") && !step.label.endsWith("-trace")) ||
      (step.label.startsWith("chief-route-") && !step.label.endsWith("-trace")) ||
      [
        "debug-state-insight",
        "debug-task-management",
        "debug-progress-feedback",
        "debug-interruption-recovery",
        "debug-reflection",
        "debug-automation",
      ].includes(step.label),
  );
  const nonClusterStep = agentSteps.find((step) => step.adapterRoute !== "cluster");
  if (nonClusterStep) {
    throw new Error(`Cluster phase expected route=cluster, but ${nonClusterStep.label} used ${nonClusterStep.adapterRoute ?? "unknown"}.`);
  }
  assertCondition(fullRegression.fallbackSteps === 0, "Cluster phase full regression still reported fallback steps.");
  assertCondition(matrixRegression.fallbackSteps === 0, "Cluster phase matrix regression still reported fallback steps.");
};

const evaluateProviderPhase = (phaseRecord) => {
  const failedProbe = phaseRecord.steps.find(
    (step) => step.label.startsWith("probe-") && !step.label.endsWith("-trace") && step.success !== true,
  );
  if (failedProbe) {
    throw new Error(`Provider phase probe failed: ${failedProbe.label}`);
  }
};

const runPhase = async ({
  id,
  title,
  agentMode,
  clusterEnabled,
  openClawBaseUrl,
  shouldRunProbes,
  shouldEnforceCluster,
  apiEnvOverrides,
  probeTimeoutMs,
  fullRegressionTimeoutMs,
  matrixRegressionTimeoutMs,
}) => {
  console.log(`\n=== ${title} ===`);
  const selectedSegments = options.selectedSegmentIds;
  const phaseRecord = {
    id,
    title,
    agentMode,
    openClawBaseUrl,
    clusterEnabled,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: "running",
    setup: null,
    registrySummary: null,
    steps: [],
    failureCategoryCounts: {},
    failures: [],
  };
  runState.currentPhase = id;
  runState.currentPhaseRecord = phaseRecord;
  runState.report.phases.push(phaseRecord);
  await queueLiveReportSnapshot();

  try {
    phaseRecord.setup = await startApi({
      phaseId: id,
      agentMode,
      openClawBaseUrl,
      extraEnv: apiEnvOverrides,
    });

    let baseline = null;
    if (shouldRunCorePhaseSegment(selectedSegments, "baseline")) {
      baseline = await baselineChecks(id, clusterEnabled ? "cluster-preferred" : "provider-direct", clusterEnabled);
      phaseRecord.registrySummary = baseline.registrySummary;
      evaluateRegistryPhaseGate({
        phaseTitle: title,
        shouldEnforceCluster,
        registrySummary: baseline.registrySummary,
      });
      await clearHistories(id);
    }

    if (shouldRunCorePhaseSegment(selectedSegments, "web")) {
      await webRouteChecks(id);
    }

    let seeded = null;
    if (shouldRunCorePhaseScenarioSeed(selectedSegments)) {
      seeded = await seedScenarios(id);
    }

    const runRuntimeContracts = shouldRunCorePhaseSegment(selectedSegments, "runtime-contracts");

    if (shouldRunProbes && (shouldRunCorePhaseSegment(selectedSegments, "probes") || runRuntimeContracts)) {
      await runModelProbes(id, probeTimeoutMs);
    }

    if (seeded && (shouldRunCorePhaseSegment(selectedSegments, "routes") || runRuntimeContracts)) {
      await runChiefRoutes(id, seeded);
    }

    if (seeded && (shouldRunCorePhaseSegment(selectedSegments, "debugs") || runRuntimeContracts)) {
      await runSingleAgentDebugs(id, seeded);
    }

    let business = null;
    if (seeded && shouldRunBusinessFlow(selectedSegments)) {
      business = await runBusinessFlow(id, agentMode, seeded["weekly-reflection-mix"].userId);
      await runReflectionsChain(id, seeded);
    }
    const selectedBusinessWebCheckIds = getSelectedBusinessWebCheckIds(selectedSegments);
    if (business && selectedBusinessWebCheckIds.length > 0) {
      await webReadModelChecks(id, {
        dashboardUserId: business.userId,
        goalflowUserId: seeded["goal-reprioritization"].userId,
        stateUserId: seeded["focus-recovery-loop"].userId,
        recoveryUserId: business.userId,
        reflectionUserId: seeded["weekly-reflection-mix"].userId,
        inboxUserId: business.userId,
      }, selectedBusinessWebCheckIds);
    }

    let fullRegression = null;
    let matrixRegression = null;
    if (shouldRunCorePhaseSegment(selectedSegments, "regressions")) {
      fullRegression = await runFullRegression(id, fullRegressionTimeoutMs);
      matrixRegression = await runMatrixRegression(id, matrixRegressionTimeoutMs);
    }

    const ranProviderEvaluationSegments =
      shouldRunCorePhaseSegment(selectedSegments, "probes") &&
      shouldRunCorePhaseSegment(selectedSegments, "regressions");
    const ranClusterEvaluationSegments =
      shouldRunCorePhaseSegment(selectedSegments, "probes") &&
      shouldRunCorePhaseSegment(selectedSegments, "routes") &&
      shouldRunCorePhaseSegment(selectedSegments, "debugs") &&
      shouldRunCorePhaseSegment(selectedSegments, "regressions");

    if (id === "provider-direct" && ranProviderEvaluationSegments) {
      evaluateProviderPhase(phaseRecord);
    }

    if (shouldEnforceCluster && ranClusterEvaluationSegments && fullRegression && matrixRegression) {
      evaluateClusterPhase(phaseRecord, fullRegression, matrixRegression);
    }

    phaseRecord.status = "passed";
    console.log(`[${title}] PHASE PASSED steps=${phaseRecord.steps.length}`);
  } catch (error) {
    phaseRecord.status = "failed";
    console.error(`[${title}] PHASE FAILED message=${error instanceof Error ? error.message : String(error)}`);
    recordFailure(id, `${id}-phase`, error);
  } finally {
    phaseRecord.completedAt = new Date().toISOString();
    runState.currentPhase = null;
    runState.currentPhaseRecord = null;
  }
};

const writeReportFiles = async () => {
  runState.report.completedAt = new Date().toISOString();
  await liveSnapshotPromise.catch(() => undefined);
  return writeSnapshotFiles({ live: false });
};

const finalizeRun = async () => {
  if (finalized) {
    return { jsonFile: runState.report.files.reportJson, markdownFile: runState.report.files.reportMarkdown };
  }
  finalized = true;
  const files = await writeReportFiles();
  await cleanupProcesses();
  const removedAfterRun = await deleteAppleDoubleFiles(ROOT_DIR);
  if (removedAfterRun > 0) {
    console.log(`Removed ${removedAfterRun} AppleDouble sidecar file(s) after core phase run.`);
  }
  return files;
};

const main = async () => {
  options.apiPort = await findAvailablePort(options.apiHost, options.apiPort);
  options.webPort = await findAvailablePort(options.webHost, options.webPort);
  options.mockProviderPort = await findAvailablePort("127.0.0.1", options.mockProviderPort);
  if (options.clusterMode !== "external") {
    options.clusterPort = await findAvailablePort(options.clusterHost, options.clusterPort);
  }
  refreshBaseUrls();
  runState.report.apiBaseUrl = API_BASE_URL;
  runState.report.webBaseUrl = WEB_BASE_URL;
  runState.report.clusterBaseUrl = CLUSTER_BASE_URL || null;

  await ensureDir(runState.reportDir);
  await ensureDir(runState.logsDir);
  await ensureDir(runState.responsesDir);

  console.log(`Artifacts will be written to ${runState.reportDir}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Web Base URL: ${WEB_BASE_URL}`);
  console.log(`Provider Mode: ${options.providerMode}`);
  console.log(`Cluster Base URL: ${CLUSTER_BASE_URL || "not-configured"}`);
  if (options.selectedPhaseIds?.length) {
    console.log(`Selected Phases: ${options.selectedPhaseIds.join(", ")}`);
  }
  if (options.selectedSegmentIds?.length) {
    console.log(`Selected Segments: ${options.selectedSegmentIds.join(", ")}`);
  }

  const phaseSelection = validateSelectedPhaseIds(options.selectedPhaseIds, CORE_PHASE_IDS);
  assertCondition(
    phaseSelection.unknownIds.length === 0,
    `Unknown phase ids: ${phaseSelection.unknownIds.join(", ")}. Allowed: ${CORE_PHASE_IDS.join(", ")}`,
  );
  const segmentSelection = validateCorePhaseSegmentIds(options.selectedSegmentIds, CORE_PHASE_SEGMENT_IDS);
  assertCondition(
    segmentSelection.unknownIds.length === 0,
    `Unknown segment ids: ${segmentSelection.unknownIds.join(", ")}. Allowed: ${CORE_PHASE_SEGMENT_IDS.join(", ")}`,
  );

  const preflight = evaluateCorePhasePreflight({
    clusterMode: options.clusterMode,
    providerMode: options.providerMode,
    env: process.env,
    openClawBinPath: OPENCLAW_BIN,
    openClawBinExists: existsSync(OPENCLAW_BIN),
    selectedNodePath: NODE_BIN,
    selectedNodeVersion: readNodeBinaryVersion(NODE_BIN) || process.version,
    minimumNodeVersion: OPENCLAW_MINIMUM_NODE_VERSION,
  });
  const shouldRunProviderAuthProbe =
    options.providerMode === "real" &&
    process.env.MINDANCHOR_PHASED_SKIP_PROVIDER_AUTH_PROBE !== "1" &&
    preflight.ok;
  let providerAuthProbe = null;
  let providerConfigDrift = null;
  if (shouldRunProviderAuthProbe) {
    providerAuthProbe = await probeProviderAuth({
      baseUrl: process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL,
      apiKey: process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY,
      model: process.env.MINDANCHOR_DEFAULT_MODEL_NAME ?? "gpt-5.4",
      wireApi: process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API === "chat-completions" ? "chat-completions" : "responses",
      timeoutMs: Number(process.env.MINDANCHOR_PHASED_PROVIDER_AUTH_PROBE_TIMEOUT_MS ?? "15000"),
    });
    const openClawProviderConfig = await readOpenClawProfileProviderConfig({
      profileName: process.env.OPENCLAW_REAL_PROFILE ?? "dev",
    });
    providerConfigDrift = compareProviderConfigDrift({
      gateway: {
        baseUrl: process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL ?? null,
        model: process.env.MINDANCHOR_DEFAULT_MODEL_NAME ?? "gpt-5.4",
        wireApi: process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API === "chat-completions" ? "chat-completions" : "responses",
        apiKey: process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY ?? null,
      },
      openClaw: openClawProviderConfig
        ? {
            baseUrl: openClawProviderConfig.baseUrl,
            model: openClawProviderConfig.model,
            wireApi: openClawProviderConfig.wireApi,
            apiKey: openClawProviderConfig.apiKey,
          }
        : null,
    });
    if (!providerAuthProbe.ok && providerAuthProbe.issue) {
      preflight.issues.push(providerAuthProbe.issue);
      if (providerConfigDrift?.issues?.length) {
        preflight.issues.push(...providerConfigDrift.issues);
      }
      preflight.ok = false;
    }
  }
  runState.report.preflight = {
    ...preflight,
    providerAuthProbeEnabled: shouldRunProviderAuthProbe,
    providerAuthProbe,
    providerConfigDrift,
  };
  if (!preflight.ok) {
    throw new Error(`Core phase preflight failed:\n${formatCorePhasePreflightIssues(preflight.issues)}`);
  }
  await queueLiveReportSnapshot();

  await buildWorkspaces();
  await startWeb();
  const mockProviderBaseUrl = await startMockProvider();
  const providerDirectApiEnvOverrides =
    options.providerMode === "mock"
      ? {
          MINDANCHOR_DEFAULT_MODEL_BASE_URL: mockProviderBaseUrl,
          MINDANCHOR_DEFAULT_MODEL_API_KEY: "provider-direct-mock-key",
          MINDANCHOR_DEFAULT_MODEL_NAME: "gpt-5.4",
          MINDANCHOR_DEFAULT_MODEL_WIRE_API: "responses",
          MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT: "high",
          MINDANCHOR_DEFAULT_MODEL_DISABLE_RESPONSE_STORAGE: "true",
        }
      : {};

  const phases = filterSelectedPhases([
    {
      id: "stub",
      title: "Phase 1 Stub Baseline",
      agentMode: "stub",
      clusterEnabled: false,
      openClawBaseUrl: null,
      shouldRunProbes: false,
      shouldEnforceCluster: false,
      apiEnvOverrides: {
        MINDANCHOR_DEFAULT_MODEL_BASE_URL: mockProviderBaseUrl,
        MINDANCHOR_DEFAULT_MODEL_API_KEY: "stub-provider-key",
        MINDANCHOR_DEFAULT_MODEL_NAME: "gpt-5.4",
        MINDANCHOR_DEFAULT_MODEL_WIRE_API: "responses",
        MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT: "minimal",
        MINDANCHOR_DEFAULT_MODEL_DISABLE_RESPONSE_STORAGE: "true",
      },
      probeTimeoutMs: 300000,
      fullRegressionTimeoutMs: 600000,
      matrixRegressionTimeoutMs: 600000,
    },
    {
      id: "provider-direct",
      title: "Phase 2 Provider Direct",
      agentMode: "openai-compatible",
      clusterEnabled: false,
      openClawBaseUrl: null,
      shouldRunProbes: true,
      shouldEnforceCluster: false,
      apiEnvOverrides: providerDirectApiEnvOverrides,
      probeTimeoutMs: 900000,
      fullRegressionTimeoutMs: 1800000,
      matrixRegressionTimeoutMs: 1200000,
    },
    {
      id: "cluster-preferred",
      title: "Phase 3 Cluster Preferred",
      agentMode: "openai-compatible",
      clusterEnabled: true,
      openClawBaseUrl: CLUSTER_BASE_URL,
      shouldRunProbes: true,
      shouldEnforceCluster: true,
      apiEnvOverrides: {},
      probeTimeoutMs: 300000,
      fullRegressionTimeoutMs: 900000,
      matrixRegressionTimeoutMs: 900000,
    },
  ], phaseSelection.selectedIds);

  try {
    for (const phase of phases) {
      if (phase.id === "cluster-preferred") {
        try {
          const clusterSetup = await startCluster();
          phase.openClawBaseUrl = clusterSetup.baseUrl;
        } catch (error) {
          runState.report.phases.push({
            id: phase.id,
            title: phase.title,
            agentMode: phase.agentMode,
            openClawBaseUrl: phase.openClawBaseUrl,
            clusterEnabled: phase.clusterEnabled,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            status: "failed",
            setup: null,
            steps: [],
            failures: [],
          });
          recordFailure(phase.id, "start-cluster", error);
          break;
        }
      }
      await runPhase(phase);
    }
  } finally {
    const { markdownFile } = await finalizeRun();
    console.log(`Report written to ${markdownFile}`);
  }

  const hasFailure = runState.report.phases.some((phase) => phase.status !== "passed");
  if (hasFailure) {
    process.exitCode = 1;
  }
};

process.on("SIGINT", async () => {
  await finalizeRun();
  process.exit(130);
});

process.on("SIGTERM", async () => {
  await finalizeRun();
  process.exit(143);
});

main().catch(async (error) => {
  console.error(error);
  try {
    await finalizeRun();
  } finally {
    if (!options.keepArtifacts && runState.reportDir.includes("test-results")) {
      // Keep the directory by default for inspection; only delete if explicitly desired later.
    }
  }
  process.exitCode = 1;
});
