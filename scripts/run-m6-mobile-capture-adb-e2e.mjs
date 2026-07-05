#!/usr/bin/env node
import { execFile, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path, { dirname, resolve } from "node:path";
import { promisify } from "node:util";

import { findAvailablePort } from "./lib/core-phase-port-availability.mjs";
import {
  buildGatewayProviderEnvOverrides,
  readOpenClawProfileProviderConfig,
} from "./lib/core-phase-provider-config-drift.mjs";
import {
  buildM6MobileCaptureAdbE2eSummary,
  defaultM6MobileCaptureAdbE2eJsonPath,
  defaultM6MobileCaptureAdbE2eMarkdownPath,
  M6_MOBILE_CAPTURE_ENDPOINT_PLAN,
  renderM6MobileCaptureAdbE2eMarkdown,
} from "./lib/m6-mobile-capture-adb-e2e-report.mjs";
import { buildCurlAuthArgs } from "./lib/m6-mobile-capture-adb-e2e-curl.mjs";
import { buildCadencedPhaseDefinitions, getM6MobileCaptureScenario } from "./lib/m6-mobile-capture-adb-e2e-scenarios.mjs";

const execFileAsync = promisify(execFile);
const ROOT_DIR = resolve(import.meta.dirname, "..");

let argv = [...process.argv.slice(2)];
if (argv[0] === "--") {
  argv = argv.slice(1);
}

const now = () => new Date().toISOString();
const ago = (ms) => new Date(Date.now() - ms).toISOString();
const sleep = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

let dryRun = false;
let outDir = resolve(ROOT_DIR, process.env.MINDANCHOR_M6_MOBILE_CAPTURE_E2E_DIR ?? "test-results");
let userId = process.env.MINDANCHOR_M6_MOBILE_CAPTURE_E2E_USER_ID ?? "m6-mobile-user";
let deviceId = process.env.MINDANCHOR_M6_MOBILE_CAPTURE_E2E_DEVICE_ID ?? "android-m6-capture";
let preferredApiPort = Number(process.env.MINDANCHOR_M6_MOBILE_CAPTURE_E2E_API_PORT ?? "3011");
const apiHost = "0.0.0.0";
let profileName = process.env.OPENCLAW_REAL_PROFILE ?? "dev";
let adbSerial = process.env.MINDANCHOR_M6_MOBILE_CAPTURE_E2E_SERIAL ?? "";
let scenarioName = process.env.MINDANCHOR_M6_MOBILE_CAPTURE_E2E_SCENARIO ?? "one-shot";
let withClientSession = process.env.MINDANCHOR_M6_MOBILE_CAPTURE_E2E_WITH_CLIENT_SESSION === "1";
let withClientPolling = process.env.MINDANCHOR_M6_CLIENT_POLLING === "1";
let withSessionRecovery = process.env.MINDANCHOR_M6_SESSION_RECOVERY === "1";
let withRefreshTokenRecovery = process.env.MINDANCHOR_M6_REFRESH_TOKEN_RECOVERY === "1";
let clientPollDurationMs = Number(process.env.MINDANCHOR_M6_CLIENT_POLL_DURATION_MS ?? "30000");
let clientPollIntervalMs = Number(process.env.MINDANCHOR_M6_CLIENT_POLL_INTERVAL_MS ?? "5000");
let clientSessionEmail = process.env.MINDANCHOR_M6_CLIENT_SESSION_EMAIL ?? "m6-mobile-client@example.com";
let clientSessionPassword = process.env.MINDANCHOR_M6_CLIENT_SESSION_PASSWORD ?? "Password123!";
let clientSessionDisplayName = process.env.MINDANCHOR_M6_CLIENT_SESSION_DISPLAY_NAME ?? "M6 Mobile Client";

for (let index = 0; index < argv.length; index += 1) {
  const token = argv[index];
  if (token === "--dry-run") {
    dryRun = true;
    continue;
  }
  if (token === "--out-dir") {
    outDir = resolve(ROOT_DIR, argv[index + 1] ?? outDir);
    index += 1;
    continue;
  }
  if (token === "--user-id") {
    userId = argv[index + 1] ?? userId;
    index += 1;
    continue;
  }
  if (token === "--device-id") {
    deviceId = argv[index + 1] ?? deviceId;
    index += 1;
    continue;
  }
  if (token === "--api-port") {
    preferredApiPort = Number(argv[index + 1] ?? preferredApiPort);
    index += 1;
    continue;
  }
  if (token === "--profile") {
    profileName = argv[index + 1] ?? profileName;
    index += 1;
    continue;
  }
  if (token === "--adb-serial") {
    adbSerial = argv[index + 1] ?? adbSerial;
    index += 1;
    continue;
  }
  if (token === "--scenario") {
    scenarioName = argv[index + 1] ?? scenarioName;
    index += 1;
    continue;
  }
  if (token === "--with-client-session") {
    withClientSession = true;
    continue;
  }
  if (token === "--with-client-polling") {
    withClientPolling = true;
    withClientSession = true;
    continue;
  }
  if (token === "--with-session-recovery") {
    withSessionRecovery = true;
    withClientSession = true;
    continue;
  }
  if (token === "--with-refresh-token-recovery") {
    withRefreshTokenRecovery = true;
    withClientSession = true;
    continue;
  }
  if (token === "--client-poll-duration-ms") {
    clientPollDurationMs = Number(argv[index + 1] ?? clientPollDurationMs);
    index += 1;
    continue;
  }
  if (token === "--client-poll-interval-ms") {
    clientPollIntervalMs = Number(argv[index + 1] ?? clientPollIntervalMs);
    index += 1;
    continue;
  }
  if (token === "--client-email") {
    clientSessionEmail = argv[index + 1] ?? clientSessionEmail;
    index += 1;
    continue;
  }
  if (token === "--client-password") {
    clientSessionPassword = argv[index + 1] ?? clientSessionPassword;
    index += 1;
    continue;
  }
  if (token === "--client-display-name") {
    clientSessionDisplayName = argv[index + 1] ?? clientSessionDisplayName;
    index += 1;
  }
}

if (withClientPolling || withSessionRecovery || withRefreshTokenRecovery) {
  withClientSession = true;
}

const scenario = getM6MobileCaptureScenario(scenarioName);

const stamp = process.env.MINDANCHOR_M6_MOBILE_CAPTURE_E2E_STAMP ?? new Date().toISOString().replace(/[:.]/g, "-");
const paths = {
  json: defaultM6MobileCaptureAdbE2eJsonPath(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), stamp).replace(
    resolve(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), "test-results"),
    outDir,
  ),
  markdown: defaultM6MobileCaptureAdbE2eMarkdownPath(
    outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir),
    stamp,
  ).replace(resolve(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), "test-results"), outDir),
};

const options = {
  apiHost,
  preferredApiPort,
  userId,
  deviceId,
  profileName,
  scenario: scenario.name,
  withClientSession,
  withClientPolling,
  withSessionRecovery,
  withRefreshTokenRecovery,
  clientPollDurationMs,
  clientPollIntervalMs,
};

if (dryRun) {
  process.stdout.write(
    `${JSON.stringify(
      {
        options,
        paths,
        adbRequirements: ["adb device", "android wifi ip", "android curl"],
        endpointPlan: M6_MOBILE_CAPTURE_ENDPOINT_PLAN,
        phasePlan: scenario.phasePlan,
        clientSession: {
          enabled: withClientSession,
          authEmail: clientSessionEmail,
          authDisplayName: clientSessionDisplayName,
          plan: [
            "POST /auth/login",
            "POST /auth/register (if needed)",
            "GET /me",
            "GET /client/bootstrap",
            "GET /client/inbox",
            "POST /client/inbox/:messageId/ack (if needed)",
            "GET /client/inbox/overview",
          ],
        },
        clientPolling: {
          enabled: withClientPolling,
          durationMs: clientPollDurationMs,
          intervalMs: clientPollIntervalMs,
          minPollCount: 2,
          plan: ["GET /client/bootstrap", "GET /client/inbox", "GET /client/inbox/overview"],
        },
        sessionRecovery: {
          enabled: withSessionRecovery,
          tokenStorage: "android-temp-file",
          plan: [
            "persist access token to Android temp file",
            "reload access token from Android temp file",
            "GET /me with reloaded token",
            "GET /client/bootstrap with reloaded token",
            "GET /client/inbox with reloaded token",
            "GET /client/inbox/overview with reloaded token",
            "delete Android temp token file",
          ],
        },
        refreshTokenRecovery: {
          enabled: withRefreshTokenRecovery,
          tokenStorage: "android-temp-file",
          plan: [
            "persist refresh token to Android temp file",
            "reload refresh token from Android temp file",
            "POST /auth/refresh with reloaded refresh token",
            "POST /auth/refresh with old refresh token expects 401",
            "GET /me with rotated access token",
            "GET /client/bootstrap with rotated access token",
            "POST /auth/logout with rotated refresh token",
            "POST /auth/refresh after logout expects 401",
            "delete Android temp refresh token file",
          ],
        },
      },
      null,
      2,
    )}\n`,
  );
  process.exit(0);
}

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

const runAdb = async (args) => {
  const fullArgs = adbSerial ? ["-s", adbSerial, ...args] : args;
  const { stdout } = await execFileAsync("adb", fullArgs, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 10,
  });
  return String(stdout ?? "").replace(/\r/g, "").trim();
};

const parseCurlOutput = (output) => {
  const normalized = String(output ?? "").replace(/\r/g, "");
  const markerIndex = normalized.lastIndexOf("HTTP_STATUS=");
  const status = markerIndex >= 0 ? Number(normalized.slice(markerIndex).match(/HTTP_STATUS=(\d+)/)?.[1] ?? 0) : 0;
  const bodyText =
    markerIndex >= 0
      ? normalized
          .slice(0, markerIndex)
          .replace(/\\n$/g, "")
          .replace(/\n$/g, "")
      : normalized;
  let body = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = { raw: bodyText };
  }
  return {
    status,
    ok: status >= 200 && status < 300,
    body,
  };
};

const responseIdsFor = (label, body) => {
  const normalizedLabel = String(label ?? "").split(":")[0];
  switch (normalizedLabel) {
    case "mobile-device-register":
    case "edge-device-register":
    case "device-heartbeat":
      return { id: body?.id ?? null, deviceId: body?.deviceId ?? null };
    case "audio-session-start":
    case "audio-session-end":
      return { sessionId: body?.id ?? null, status: body?.status ?? null };
    case "call-event":
    case "emotion-assessment":
    case "video-assessment":
    case "health-snapshot":
      return { id: body?.id ?? null, deviceId: body?.deviceId ?? null, sessionId: body?.sessionId ?? null };
    case "media-upload-session":
      return { sessionId: body?.id ?? null, status: body?.status ?? null };
    case "media-upload-complete":
      return { sessionId: body?.id ?? null, status: body?.status ?? null };
    case "media-upload-part":
      return { id: body?.id ?? null, sessionId: body?.sessionId ?? null, sequence: body?.sequence ?? null };
    case "recovery-plan":
      return { id: body?.id ?? null, taskId: body?.taskId ?? null, reason: body?.reason ?? null };
    case "recovery-history":
      return {
        latestRecoveryPlanId: Array.isArray(body?.recoveryPlans) ? body.recoveryPlans[0]?.id ?? null : null,
        recoveryPlanCount: Array.isArray(body?.recoveryPlans) ? body.recoveryPlans.length : 0,
        suggestedFocusTaskId: body?.suggestedFocusTaskId ?? null,
      };
    case "auth-register":
    case "auth-login":
    case "auth-refresh":
      return {
        userId: body?.user?.id ?? null,
        email: body?.user?.email ?? null,
        accessTokenPresent: typeof body?.accessToken === "string" && body.accessToken.length > 0,
        refreshTokenPresent: typeof body?.refreshToken === "string" && body.refreshToken.length > 0,
      };
    case "auth-logout":
      return { revoked: body?.revoked ?? null };
    case "me":
      return {
        userId: body?.user?.id ?? null,
        email: body?.user?.email ?? null,
        authenticated: body?.authenticated ?? false,
      };
    case "client-bootstrap":
      return {
        userId: body?.me?.user?.id ?? null,
        inboxMessageCount: body?.inboxOverview?.metricCounts?.totalMessages ?? 0,
      };
    case "health-latest":
      return { latestId: body?.latest?.id ?? null, latestDeviceId: body?.latest?.deviceId ?? null };
    case "client-inbox":
      return {
        firstMessageId: Array.isArray(body?.messages) ? body.messages[0]?.id ?? null : null,
        totalMessages: Array.isArray(body?.messages) ? body.messages.length : 0,
      };
    case "inbox-ack":
      return { messageId: body?.id ?? null, status: body?.status ?? null };
    case "dashboard-summary":
      return {
        latestHealthSnapshotId: body?.latestHealthSnapshot?.id ?? null,
        edgeDeviceCount: Array.isArray(body?.edgeDevices) ? body.edgeDevices.length : 0,
        inboxCount: Array.isArray(body?.inbox) ? body.inbox.length : 0,
      };
    case "inbox-overview":
      return {
        totalMessages: body?.metricCounts?.totalMessages ?? 0,
        latestBehaviorConclusionId: body?.latestBehaviorConclusion?.id ?? null,
        latestRecoveryPlanId: body?.latestRecoveryPlan?.id ?? null,
      };
    default:
      return {};
  }
};

const sanitizeStepResponse = (label, body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const normalizedLabel = String(label ?? "").split(":")[0];
  if (!["auth-register", "auth-login", "auth-refresh"].includes(normalizedLabel)) {
    return body;
  }

  return {
    ...body,
    ...(typeof body.accessToken === "string" ? { accessToken: "[redacted]" } : {}),
    ...(typeof body.refreshToken === "string" ? { refreshToken: "[redacted]" } : {}),
  };
};

const writeDevicePayload = async (tmpDir, label, payload) => {
  const localPath = path.join(tmpDir, `${label}.json`);
  await writeFile(localPath, JSON.stringify(payload, null, 2), "utf8");
  const remotePath = `/data/local/tmp/${label}.json`;
  await runAdb(["push", localPath, remotePath]);
  return remotePath;
};

const readDeviceJson = async (remotePath) => {
  const output = await runAdb(["shell", "cat", remotePath]);
  return JSON.parse(output);
};

const runPhoneGet = async (apiLanBaseUrl, endpoint, headers = {}) => {
  const output = await runAdb([
    "shell",
    "curl",
    "-sS",
    "-m",
    "20",
    "-w",
    "HTTP_STATUS=%{http_code}",
    ...buildCurlAuthArgs(headers),
    `${apiLanBaseUrl}${endpoint}`,
  ]);
  return parseCurlOutput(output);
};

const runPhonePost = async (tmpDir, apiLanBaseUrl, label, endpoint, payload, headers = {}) => {
  const remotePath = await writeDevicePayload(tmpDir, label, payload);
  const output = await runAdb([
    "shell",
    "curl",
    "-sS",
    "-m",
    "20",
    "-w",
    "HTTP_STATUS=%{http_code}",
    "-H",
    "Content-Type:application/json",
    ...buildCurlAuthArgs(headers),
    "--data-binary",
    `@${remotePath}`,
    `${apiLanBaseUrl}${endpoint}`,
  ]);
  return parseCurlOutput(output);
};

const waitForGateway = async (localApiBaseUrl) => {
  const timeoutAt = Date.now() + 90000;
  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(`${localApiBaseUrl}/health`);
      if (response.ok) {
        return;
      }
    } catch {}
    await sleep(500);
  }
  throw new Error("Timed out waiting for temporary Gateway health.");
};

const startedAt = now();
const report = {
  generatedAt: startedAt,
  startedAt,
  completedAt: null,
  durationMs: null,
  apiBaseUrl: null,
  apiLanBaseUrl: null,
  openClawBaseUrl: null,
  device: null,
  preflight: {
    adbDeviceConnected: false,
    wifiIpDetected: false,
    curlAvailable: false,
    gatewayLanHealthOk: false,
  },
  scenario: scenario.name,
  options,
  steps: [],
  phaseResults: [],
  responseIds: {},
  readModels: {
    healthLatestReflectsDevice: false,
    dashboardReflectsDevice: false,
    inboxOverviewOk: false,
    inboxAckReflected: false,
    recoveryPlanCreated: false,
    recoveryHistoryReflectsPlan: false,
    recoveryInboxConsistent: false,
    recoveryDashboardConsistent: false,
  },
  clientSession: {
    enabled: withClientSession,
    authMode: withClientSession ? "local-account" : null,
    authEmail: withClientSession ? clientSessionEmail : null,
    authRegistered: false,
    authLoggedIn: false,
    clientMeOk: false,
    clientBootstrapOk: false,
    clientInboxOk: false,
    clientAckAttempted: false,
    clientAckReflected: false,
  },
  clientPolling: {
    enabled: withClientPolling,
    durationMs: withClientPolling ? clientPollDurationMs : 0,
    intervalMs: withClientPolling ? clientPollIntervalMs : 0,
    minPollCount: 2,
    completed: false,
    rounds: [],
  },
  sessionRecovery: {
    enabled: withSessionRecovery,
    tokenFilePath: null,
    tokenPersisted: false,
    tokenReloaded: false,
    meOk: false,
    bootstrapOk: false,
    inboxOk: false,
    overviewOk: false,
    userStable: false,
    recoveredUserId: null,
  },
  refreshTokenRecovery: {
    enabled: withRefreshTokenRecovery,
    tokenFilePath: null,
    tokenIssued: false,
    tokenPersisted: false,
    tokenReloaded: false,
    tokenRotated: false,
    oldRefreshTokenRejected: false,
    meOk: false,
    bootstrapOk: false,
    logoutRevoked: false,
    postLogoutRefreshRejected: false,
    userStable: false,
    recoveredUserId: null,
  },
  errors: [],
};

let gateway = null;
let tempDir = null;
let exitCode = 0;

try {
  const devicesOutput = await runAdb(["devices"]);
  const connected = devicesOutput
    .split(/\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .filter((parts) => parts[1] === "device")
    .map((parts) => parts[0]);
  if (!adbSerial) {
    adbSerial = connected[0] ?? "";
  }
  if (!adbSerial) {
    throw new Error("No adb device in 'device' state.");
  }
  report.preflight.adbDeviceConnected = true;

  const [model, androidVersion, routeOutput, curlPath] = await Promise.all([
    runAdb(["shell", "getprop", "ro.product.model"]),
    runAdb(["shell", "getprop", "ro.build.version.release"]),
    runAdb(["shell", "ip", "route"]),
    runAdb(["shell", "command", "-v", "curl"]),
  ]);
  const wlanRoute = routeOutput
    .split(/\n/)
    .map((line) => line.trim())
    .find((line) => line.includes(" dev wlan0 "));
  const wifiIp = wlanRoute?.match(/src\s+([0-9.]+)/)?.[1] ?? wlanRoute?.match(/([0-9.]+)\/\d+ dev wlan0/)?.[1] ?? "";
  report.device = {
    serial: adbSerial,
    model: model.trim(),
    androidVersion: androidVersion.trim(),
    wifiIp,
    curlPath: curlPath.trim(),
  };
  report.preflight.wifiIpDetected = Boolean(wifiIp);
  report.preflight.curlAvailable = Boolean(curlPath.trim());
  if (!report.preflight.wifiIpDetected) {
    throw new Error("Unable to detect Android wlan0 IP.");
  }
  if (!report.preflight.curlAvailable) {
    throw new Error("Android device does not expose curl.");
  }

  const runtimeEnv = parseSimpleEnvFile(resolve(ROOT_DIR, ".logs", "openclaw-real-lan.env"));
  const desktopLanIp =
    runtimeEnv.OPENCLAW_LAN_IP ?? (runtimeEnv.OPENCLAW_BASE_URL ? new URL(runtimeEnv.OPENCLAW_BASE_URL).hostname : "");
  const openClawBaseUrl = runtimeEnv.OPENCLAW_BASE_URL ?? process.env.MINDANCHOR_OPENCLAW_BASE_URL ?? "";
  if (!desktopLanIp || !openClawBaseUrl) {
    throw new Error("Unable to resolve desktop LAN IP or OpenClaw LAN base URL from runtime env.");
  }
  report.openClawBaseUrl = openClawBaseUrl;

  const openClaw = await readOpenClawProfileProviderConfig({ profileName });
  const providerOverrides = buildGatewayProviderEnvOverrides(openClaw);
  if (!providerOverrides) {
    throw new Error(`Unable to derive provider env from OpenClaw profile '${profileName}'.`);
  }

  const apiPort = await findAvailablePort("127.0.0.1", preferredApiPort);
  const localApiBaseUrl = `http://127.0.0.1:${apiPort}`;
  const apiLanBaseUrl = `http://${desktopLanIp}:${apiPort}`;
  report.apiBaseUrl = localApiBaseUrl;
  report.apiLanBaseUrl = apiLanBaseUrl;

  gateway = spawn("corepack", ["pnpm", "--filter", "@mindanchor/api", "exec", "tsx", "src/index.ts"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      ...providerOverrides,
      PATH: [resolve(ROOT_DIR, ".tools/node/bin"), `${process.env.HOME ?? ""}/.openclaw/bin`, process.env.PATH ?? ""]
        .filter(Boolean)
        .join(":"),
      MINDANCHOR_API_PORT: String(apiPort),
      MINDANCHOR_API_URL: localApiBaseUrl,
      MINDANCHOR_AGENT_MODE: "openai-compatible",
      MINDANCHOR_OPENCLAW_BASE_URL: openClawBaseUrl,
      MINDANCHOR_DATA_FILE: resolve(ROOT_DIR, "tmp", `m6-mobile-capture-adb-e2e-${stamp}.json`),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  gateway.stdout.on("data", (chunk) => process.stdout.write(`[gateway] ${chunk}`));
  gateway.stderr.on("data", (chunk) => process.stderr.write(`[gateway] ${chunk}`));

  await waitForGateway(localApiBaseUrl);
  const gatewayHealth = await runPhoneGet(apiLanBaseUrl, "/health");
  report.preflight.gatewayLanHealthOk = gatewayHealth.ok;
  if (!gatewayHealth.ok) {
    throw new Error(`Android device could not reach Gateway LAN URL ${apiLanBaseUrl}/health.`);
  }

  tempDir = await mkdtemp(path.join(tmpdir(), "mindanchor-m6-mobile-capture-"));
  const captureStartedAt = ago(120000);
  const captureEndedAt = ago(30000);
  const windowStart = ago(90000);
  const windowEnd = now();
  let effectiveUserId = userId;
  let clientSessionAccessToken = null;
  let clientSessionRefreshToken = null;
  let clientSessionTokenRemotePath = null;
  let clientRefreshTokenRemotePath = null;

  const recordStep = async ({ label, method, endpoint, payload, headers = {}, allowFailure = false }) => {
    const response =
      method === "GET"
        ? await runPhoneGet(apiLanBaseUrl, endpoint, headers)
        : await runPhonePost(tempDir, apiLanBaseUrl, label, endpoint, payload, headers);
    report.steps.push({
      label,
      method,
      endpoint,
      status: response.status,
      ok: response.ok,
      countAsFailure: allowFailure ? false : true,
      responseIds: responseIdsFor(label, response.body),
      response: sanitizeStepResponse(label, response.body),
    });
    if (!response.ok && !allowFailure) {
      throw new Error(`${label} failed with HTTP ${response.status ?? "ERR"}`);
    }
    return response;
  };

  if (withClientSession) {
    const loginResponse = await recordStep({
      label: "auth-login",
      method: "POST",
      endpoint: "/auth/login",
      payload: {
        email: clientSessionEmail,
        password: clientSessionPassword,
      },
      allowFailure: true,
    });

    let finalLoginResponse = loginResponse;
    if (!loginResponse.ok) {
      const registerResponse = await recordStep({
        label: "auth-register",
        method: "POST",
        endpoint: "/auth/register",
        payload: {
          email: clientSessionEmail,
          password: clientSessionPassword,
          displayName: clientSessionDisplayName,
        },
        allowFailure: true,
      });

      if (!registerResponse.ok && registerResponse.status !== 409) {
        throw new Error(`auth-register failed with HTTP ${registerResponse.status ?? "ERR"}`);
      }
      if (registerResponse.ok) {
        report.clientSession.authRegistered = true;
      }

      finalLoginResponse = await recordStep({
        label: "auth-login:retry",
        method: "POST",
        endpoint: "/auth/login",
        payload: {
          email: clientSessionEmail,
          password: clientSessionPassword,
        },
      });
    }

    if (!finalLoginResponse.ok) {
      throw new Error(`auth-login failed for fixed local account ${clientSessionEmail}.`);
    }

    clientSessionAccessToken = finalLoginResponse.body?.accessToken ?? null;
    if (!clientSessionAccessToken) {
      throw new Error("auth-login succeeded but no accessToken was returned.");
    }
    clientSessionRefreshToken = finalLoginResponse.body?.refreshToken ?? null;
    if (withRefreshTokenRecovery && !clientSessionRefreshToken) {
      throw new Error("auth-login succeeded but no refreshToken was returned.");
    }

    effectiveUserId = finalLoginResponse.body?.user?.id ?? effectiveUserId;
    report.clientSession.authLoggedIn = true;
    report.responseIds.authUserId = finalLoginResponse.body?.user?.id ?? null;
    report.responseIds.authEmail = finalLoginResponse.body?.user?.email ?? null;
    report.refreshTokenRecovery.tokenIssued = Boolean(clientSessionRefreshToken);

    if (withSessionRecovery) {
      clientSessionTokenRemotePath = await writeDevicePayload(tempDir, "client-session-recovery-token", {
        accessToken: clientSessionAccessToken,
        email: clientSessionEmail,
        userId: effectiveUserId,
        savedAt: now(),
      });
      report.sessionRecovery.tokenFilePath = clientSessionTokenRemotePath;
      report.sessionRecovery.tokenPersisted = true;
    }

    if (withRefreshTokenRecovery) {
      clientRefreshTokenRemotePath = await writeDevicePayload(tempDir, "client-refresh-token-recovery-token", {
        refreshToken: clientSessionRefreshToken,
        email: clientSessionEmail,
        userId: effectiveUserId,
        savedAt: now(),
      });
      report.refreshTokenRecovery.tokenFilePath = clientRefreshTokenRemotePath;
      report.refreshTokenRecovery.tokenPersisted = true;
    }
  }

  const mobileDeviceResponse = await recordStep({
    label: "mobile-device-register",
    method: "POST",
    endpoint: "/mobile/devices/register",
    payload: {
      userId: effectiveUserId,
      deviceId,
      deviceName: report.device.model || "Android ADB Device",
      platform: "android",
      appVersion: "m6-adb-e2e",
      platformVersion: report.device.androidVersion,
      desktopHost: desktopLanIp,
      consentAcknowledgedAt: now(),
    },
  });
  const mobileDevice = mobileDeviceResponse.body;
  report.responseIds.mobileDeviceId = mobileDevice?.id ?? null;

  await recordStep({
    label: "edge-device-register",
    method: "POST",
    endpoint: "/devices/register",
    payload: {
      userId: effectiveUserId,
      deviceId,
      label: mobileDevice?.deviceName ?? report.device.model ?? "Android ADB Device",
      deviceType: "mobile",
      platform: "android",
      capabilities: ["notifications", "audio_capture", "video_capture", "health_bridge"],
      appVersion: "m6-adb-e2e",
    },
  });

  await recordStep({
    label: "device-heartbeat",
    method: "POST",
    endpoint: "/devices/heartbeat",
    payload: {
      userId: effectiveUserId,
      deviceId,
      status: "online",
      queueDepth: 0,
      lastUploadedAt: now(),
      capabilities: ["notifications", "audio_capture", "video_capture", "health_bridge"],
    },
  });

  const sessionResponse = await recordStep({
    label: "audio-session-start",
    method: "POST",
    endpoint: "/mobile/capture/sessions/start",
    payload: {
      userId: effectiveUserId,
      deviceId,
      captureMode: "foreground_microphone_with_call_events",
      sampleRateHz: 16000,
      channels: 1,
      encoding: "audio/pcm16le",
      chunkDurationMs: 1000,
      rollingBufferSeconds: 60,
      startedAt: captureStartedAt,
    },
  });
  const session = sessionResponse.body;
  report.responseIds.audioSessionId = session?.id ?? null;
  const recordPhaseStep = ({ phaseName, label, method, endpoint, payload }) =>
    recordStep({
      label: `${label}:${phaseName}`,
      method,
      endpoint,
      payload,
    });

  const buildPhaseResult = ({ name, healthLatest, dashboard, inboxOverview, recoveryHistory, postRecoveryWriteAccepted = false }) => ({
    name,
    latestHealthId: healthLatest?.latest?.id ?? null,
    latestHealthDeviceId: healthLatest?.latest?.deviceId ?? null,
    latestRecoveryPlanId:
      (Array.isArray(recoveryHistory?.recoveryPlans) ? recoveryHistory.recoveryPlans[0]?.id ?? null : null) ??
      dashboard?.latestRecoveryPlan?.id ??
      inboxOverview?.latestRecoveryPlan?.id ??
      null,
    inboxMessageCount: Array.isArray(inboxOverview?.messages) ? inboxOverview.messages.length : 0,
    inboxLatestRiskLevel: inboxOverview?.latestBehaviorConclusion?.riskLevel ?? null,
    postRecoveryWriteAccepted,
  });

  let recoveryPlan = null;
  let recoveryHistory = null;
  let healthLatest = null;
  let dashboard = null;
  let inbox = null;
  let acknowledgedMessage = null;
  let inboxMessageId = null;

  if (scenario.name === "cadenced") {
    const cadencedPhases = buildCadencedPhaseDefinitions({
      userId: effectiveUserId,
      deviceId,
      sessionId: session?.id,
      startedAt: captureStartedAt,
    });

    for (const phase of cadencedPhases) {
      if (phase.heartbeat) {
        await recordPhaseStep({
          phaseName: phase.name,
          label: "device-heartbeat",
          method: "POST",
          endpoint: "/devices/heartbeat",
          payload: phase.heartbeat,
        });
      }

      if (phase.callEvent) {
        const phaseCallEvent = await recordPhaseStep({
          phaseName: phase.name,
          label: "call-event",
          method: "POST",
          endpoint: "/mobile/call-events",
          payload: phase.callEvent,
        });
        report.responseIds.callEventId = phaseCallEvent?.body?.id ?? null;
      }

      if (phase.emotion) {
        const phaseEmotion = await recordPhaseStep({
          phaseName: phase.name,
          label: "emotion-assessment",
          method: "POST",
          endpoint: "/emotion/assessments",
          payload: phase.emotion,
        });
        report.responseIds.emotionAssessmentId = phaseEmotion?.body?.id ?? null;
      }

      if (phase.video) {
        const phaseVideo = await recordPhaseStep({
          phaseName: phase.name,
          label: "video-assessment",
          method: "POST",
          endpoint: "/video/assessments",
          payload: phase.video,
        });
        report.responseIds.videoAssessmentId = phaseVideo?.body?.id ?? null;
      }

      if (phase.health) {
        const phaseHealth = await recordPhaseStep({
          phaseName: phase.name,
          label: "health-snapshot",
          method: "POST",
          endpoint: "/health/snapshots",
          payload: phase.health,
        });
        report.responseIds.healthSnapshotId = phaseHealth?.body?.id ?? null;
      }

      if (phase.recovery) {
        recoveryPlan = await recordPhaseStep({
          phaseName: phase.name,
          label: "recovery-plan",
          method: "POST",
          endpoint: "/recovery/plan",
          payload: phase.recovery,
        });
      }

      let phaseRecoveryHistory = recoveryHistory;
      if (phase.readRecoveryHistory) {
        phaseRecoveryHistory = await recordPhaseStep({
          phaseName: phase.name,
          label: "recovery-history",
          method: "GET",
          endpoint: `/recovery/history?userId=${encodeURIComponent(effectiveUserId)}`,
        });
      }

      const phaseHealthLatest = await recordPhaseStep({
        phaseName: phase.name,
        label: "health-latest",
        method: "GET",
        endpoint: `/health/latest?userId=${encodeURIComponent(effectiveUserId)}`,
      });

      let phaseInboxMessageId = inboxMessageId;
      let phaseAcknowledgedMessage = acknowledgedMessage;
      if (phase.inboxAck) {
        const phaseInboxMessages = await recordPhaseStep({
          phaseName: phase.name,
          label: "client-inbox",
          method: "GET",
          endpoint: `/client/inbox?userId=${encodeURIComponent(effectiveUserId)}`,
        });
        const candidateMessage = Array.isArray(phaseInboxMessages?.body?.messages)
          ? phaseInboxMessages.body.messages.find((message) => message.status !== "acknowledged") ?? phaseInboxMessages.body.messages[0]
          : null;
        if (!candidateMessage?.id) {
          throw new Error(`client-inbox returned no message to acknowledge during ${phase.name}.`);
        }
        phaseInboxMessageId = candidateMessage.id;
        phaseAcknowledgedMessage = await recordPhaseStep({
          phaseName: phase.name,
          label: "inbox-ack",
          method: "POST",
          endpoint: `/client/inbox/${phaseInboxMessageId}/ack`,
          payload: {},
        });
      }

      const phaseDashboard = await recordPhaseStep({
        phaseName: phase.name,
        label: "dashboard-summary",
        method: "GET",
        endpoint: `/dashboard/summary?userId=${encodeURIComponent(effectiveUserId)}`,
      });
      const phaseInboxOverview = await recordPhaseStep({
        phaseName: phase.name,
        label: "inbox-overview",
        method: "GET",
        endpoint: `/client/inbox/overview?userId=${encodeURIComponent(effectiveUserId)}`,
      });

      recoveryHistory = phaseRecoveryHistory;
      healthLatest = phaseHealthLatest;
      dashboard = phaseDashboard;
      inbox = phaseInboxOverview;
      acknowledgedMessage = phaseAcknowledgedMessage;
      inboxMessageId = phaseInboxMessageId;
      report.phaseResults.push(
        buildPhaseResult({
          name: phase.name,
          healthLatest: phaseHealthLatest.body,
          dashboard: phaseDashboard.body,
          inboxOverview: phaseInboxOverview.body,
          recoveryHistory: phaseRecoveryHistory?.body ?? null,
          postRecoveryWriteAccepted: phase.inboxAck === true,
        }),
      );
    }

    const endedSession = await recordStep({
      label: "audio-session-end:cadenced-finalize",
      method: "POST",
      endpoint: "/mobile/capture/sessions/end",
      payload: {
        sessionId: session?.id,
        status: "completed",
        endedAt: now(),
      },
    });
    report.responseIds.audioSessionStatus = endedSession?.body?.status ?? null;
  } else {
    const callEvent = await recordStep({
      label: "call-event",
      method: "POST",
      endpoint: "/mobile/call-events",
      payload: {
        userId: effectiveUserId,
        deviceId,
        direction: "incoming",
        status: "missed",
        occurredAt: ago(60000),
      },
    });
    report.responseIds.callEventId = callEvent?.body?.id ?? null;

    const emotion = await recordStep({
      label: "emotion-assessment",
      method: "POST",
      endpoint: "/emotion/assessments",
      payload: {
        userId: effectiveUserId,
        deviceId,
        sessionId: session?.id,
        chunkSequence: 0,
        windowStart,
        windowEnd,
        emotionLabel: "stressed",
        valenceScore: 20,
        arousalScore: 28,
        stressScore: 88,
        confidence: 0.91,
        summary: "High stress detected during Android capture window.",
        modelName: "m6-adb-e2e",
        source: "cluster-openai-compatible",
      },
    });
    report.responseIds.emotionAssessmentId = emotion?.body?.id ?? null;

    const media = await recordStep({
      label: "media-upload-session",
      method: "POST",
      endpoint: "/media/upload-sessions",
      payload: {
        userId: effectiveUserId,
        deviceId,
        mediaType: "video",
        contentType: "video/webm",
        plannedPartCount: 1,
        captureStartedAt,
        captureEndedAt,
      },
    });
    report.responseIds.mediaUploadSessionId = media?.body?.id ?? null;

    await recordStep({
      label: "media-upload-part",
      method: "POST",
      endpoint: `/media/upload-sessions/${media?.body?.id}/parts`,
      payload: {
        sessionId: media?.body?.id,
        sequence: 0,
        checksum: "m6-adb-part-0",
        sizeBytes: 2048,
        startedAt: captureStartedAt,
        endedAt: captureEndedAt,
      },
    });

    const completedMedia = await recordStep({
      label: "media-upload-complete",
      method: "POST",
      endpoint: `/media/upload-sessions/${media?.body?.id}/complete`,
      payload: {
        completedAt: now(),
      },
    });
    report.responseIds.completedMediaStatus = completedMedia?.body?.status ?? null;

    const video = await recordStep({
      label: "video-assessment",
      method: "POST",
      endpoint: "/video/assessments",
      payload: {
        userId: effectiveUserId,
        deviceId,
        sessionId: media?.body?.id,
        windowStart,
        windowEnd,
        fatigueScore: 82,
        focusScore: 30,
        confidence: 0.89,
        summary: "Video analysis indicates fatigue and low focus.",
        modelName: "m6-adb-e2e",
        featureSummary: "heavy blink rate and slumped posture",
        source: "cluster-openai-compatible",
      },
    });
    report.responseIds.videoAssessmentId = video?.body?.id ?? null;

    const health = await recordStep({
      label: "health-snapshot",
      method: "POST",
      endpoint: "/health/snapshots",
      payload: {
        userId: effectiveUserId,
        deviceId,
        sourcePlatform: "android",
        sourceProvider: "health_connect",
        windowStart: ago(3600000),
        windowEnd,
        heartRate: 92,
        oxygenSaturation: 95,
        restingHeartRate: 68,
        sleepMinutes: 280,
        summary: "Low sleep and elevated heart rate from Android health bridge.",
      },
    });
    report.responseIds.healthSnapshotId = health?.body?.id ?? null;

    const endedSession = await recordStep({
      label: "audio-session-end",
      method: "POST",
      endpoint: "/mobile/capture/sessions/end",
      payload: {
        sessionId: session?.id,
        status: "completed",
        endedAt: now(),
      },
    });
    report.responseIds.audioSessionStatus = endedSession?.body?.status ?? null;

    recoveryPlan = await recordStep({
      label: "recovery-plan",
      method: "POST",
      endpoint: "/recovery/plan",
      payload: {
        userId: effectiveUserId,
        sessionId: session?.id,
        reason: "android_capture_follow_up",
      },
    });

    recoveryHistory = await recordStep({
      label: "recovery-history",
      method: "GET",
      endpoint: `/recovery/history?userId=${encodeURIComponent(effectiveUserId)}`,
    });

    healthLatest = await recordStep({
      label: "health-latest",
      method: "GET",
      endpoint: `/health/latest?userId=${encodeURIComponent(effectiveUserId)}`,
    });
    const inboxMessages = await recordStep({
      label: "client-inbox",
      method: "GET",
      endpoint: `/client/inbox?userId=${encodeURIComponent(effectiveUserId)}`,
    });
    inboxMessageId = Array.isArray(inboxMessages?.body?.messages) ? inboxMessages.body.messages[0]?.id : null;
    if (!inboxMessageId) {
      throw new Error("client-inbox returned no message to acknowledge.");
    }
    acknowledgedMessage = await recordStep({
      label: "inbox-ack",
      method: "POST",
      endpoint: `/client/inbox/${inboxMessageId}/ack`,
      payload: {},
    });
    dashboard = await recordStep({
      label: "dashboard-summary",
      method: "GET",
      endpoint: `/dashboard/summary?userId=${encodeURIComponent(effectiveUserId)}`,
    });
    inbox = await recordStep({
      label: "inbox-overview",
      method: "GET",
      endpoint: `/client/inbox/overview?userId=${encodeURIComponent(effectiveUserId)}`,
    });
  }

  if (withClientSession) {
    const authHeaders = {
      Authorization: `Bearer ${clientSessionAccessToken}`,
    };
    let clientSessionAckMessageId = null;

    const meResponse = await recordStep({
      label: "me:client-session",
      method: "GET",
      endpoint: "/me",
      headers: authHeaders,
    });
    const meBody = meResponse.body;
    report.clientSession.clientMeOk =
      meResponse.ok === true &&
      meBody?.authenticated === true &&
      meBody?.user?.email === clientSessionEmail &&
      meBody?.user?.id === effectiveUserId;

    const bootstrapResponse = await recordStep({
      label: "client-bootstrap:client-session",
      method: "GET",
      endpoint: "/client/bootstrap",
      headers: authHeaders,
    });
    const bootstrapBody = bootstrapResponse.body;
    report.clientSession.clientBootstrapOk = Boolean(
      bootstrapResponse.ok === true &&
      bootstrapBody?.me?.authenticated === true &&
      bootstrapBody?.me?.user?.id === effectiveUserId &&
      bootstrapBody?.dashboard &&
      bootstrapBody?.inboxOverview &&
      bootstrapBody?.goalFlow &&
      bootstrapBody?.permissions,
    );

    const authenticatedInboxResponse = await recordStep({
      label: "client-inbox:client-session",
      method: "GET",
      endpoint: "/client/inbox",
      headers: authHeaders,
    });
    const authenticatedInbox = authenticatedInboxResponse.body;
    report.clientSession.clientInboxOk = authenticatedInboxResponse.ok === true && Array.isArray(authenticatedInbox?.messages);

    const pendingClientMessage =
      Array.isArray(authenticatedInbox?.messages)
        ? authenticatedInbox.messages.find((message) => message.status !== "acknowledged") ?? null
        : null;

    let clientSessionOverviewResponse = null;
    let clientSessionBootstrapRefresh = null;
    if (pendingClientMessage?.id) {
      report.clientSession.clientAckAttempted = true;
      const clientAckResponse = await recordStep({
        label: "inbox-ack:client-session",
        method: "POST",
        endpoint: `/client/inbox/${pendingClientMessage.id}/ack`,
        payload: {},
        headers: authHeaders,
      });

      clientSessionOverviewResponse = await recordStep({
        label: "inbox-overview:client-session",
        method: "GET",
        endpoint: "/client/inbox/overview",
        headers: authHeaders,
      });
      clientSessionBootstrapRefresh = await recordStep({
        label: "client-bootstrap:client-session-refresh",
        method: "GET",
        endpoint: "/client/bootstrap",
        headers: authHeaders,
      });

      const overviewBody = clientSessionOverviewResponse.body;
      const bootstrapRefreshBody = clientSessionBootstrapRefresh.body;
      report.clientSession.clientAckReflected =
        clientAckResponse.ok === true &&
        clientAckResponse.body?.status === "acknowledged" &&
        Array.isArray(overviewBody?.acknowledgedMessages) &&
        overviewBody.acknowledgedMessages.some((message) => message.id === pendingClientMessage.id && message.status === "acknowledged") &&
        Array.isArray(bootstrapRefreshBody?.inboxOverview?.acknowledgedMessages) &&
        bootstrapRefreshBody.inboxOverview.acknowledgedMessages.some(
          (message) => message.id === pendingClientMessage.id && message.status === "acknowledged",
        );

      report.responseIds.clientInboxAckMessageId = pendingClientMessage.id;
      clientSessionAckMessageId = pendingClientMessage.id;
    } else {
      clientSessionOverviewResponse = await recordStep({
        label: "inbox-overview:client-session",
        method: "GET",
        endpoint: "/client/inbox/overview",
        headers: authHeaders,
      });
      report.clientSession.clientAckReflected = true;
    }

    if (withClientPolling) {
      const minPollCount = 2;
      const pollStartedAt = Date.now();
      let pollRound = 0;

      while (Date.now() - pollStartedAt < clientPollDurationMs || pollRound < minPollCount) {
        pollRound += 1;
        const elapsedMs = Date.now() - pollStartedAt;

        const pollBootstrap = await recordStep({
          label: `client-bootstrap:client-session-poll-${pollRound}`,
          method: "GET",
          endpoint: "/client/bootstrap",
          headers: authHeaders,
        });
        const pollInbox = await recordStep({
          label: `client-inbox:client-session-poll-${pollRound}`,
          method: "GET",
          endpoint: "/client/inbox",
          headers: authHeaders,
        });
        const pollOverview = await recordStep({
          label: `inbox-overview:client-session-poll-${pollRound}`,
          method: "GET",
          endpoint: "/client/inbox/overview",
          headers: authHeaders,
        });

        const overviewAcknowledgedMessages = Array.isArray(pollOverview.body?.acknowledgedMessages)
          ? pollOverview.body.acknowledgedMessages
          : [];
        const bootstrapAcknowledgedMessages = Array.isArray(pollBootstrap.body?.inboxOverview?.acknowledgedMessages)
          ? pollBootstrap.body.inboxOverview.acknowledgedMessages
          : [];
        const acknowledgedMessageVisible =
          clientSessionAckMessageId === null ||
          overviewAcknowledgedMessages.some((message) => message.id === clientSessionAckMessageId && message.status === "acknowledged") ||
          bootstrapAcknowledgedMessages.some((message) => message.id === clientSessionAckMessageId && message.status === "acknowledged");

        report.clientPolling.rounds.push({
          round: pollRound,
          elapsedMs,
          bootstrapOk:
            pollBootstrap.ok === true &&
            pollBootstrap.body?.me?.authenticated === true &&
            pollBootstrap.body?.me?.user?.id === effectiveUserId,
          inboxOk: pollInbox.ok === true && Array.isArray(pollInbox.body?.messages),
          overviewOk: pollOverview.ok === true && Array.isArray(pollOverview.body?.messages),
          bootstrapUserId: pollBootstrap.body?.me?.user?.id ?? null,
          inboxMessageCount: Array.isArray(pollInbox.body?.messages) ? pollInbox.body.messages.length : 0,
          overviewMessageCount: Array.isArray(pollOverview.body?.messages) ? pollOverview.body.messages.length : 0,
          acknowledgedMessageVisible,
        });

        if (Date.now() - pollStartedAt >= clientPollDurationMs && pollRound >= minPollCount) {
          break;
        }
        await sleep(clientPollIntervalMs);
      }

      report.clientPolling.completed = true;
      report.responseIds.clientPollingPollCount = report.clientPolling.rounds.length;
    }

    if (withSessionRecovery) {
      if (!clientSessionTokenRemotePath) {
        throw new Error("Session recovery enabled but no Android token file was created.");
      }

      const recoveredSession = await readDeviceJson(clientSessionTokenRemotePath);
      const recoveredAccessToken = typeof recoveredSession?.accessToken === "string" ? recoveredSession.accessToken : null;
      report.sessionRecovery.tokenReloaded = Boolean(recoveredAccessToken);
      if (!recoveredAccessToken) {
        throw new Error("Unable to reload access token from Android temp storage.");
      }

      const recoveredHeaders = {
        Authorization: `Bearer ${recoveredAccessToken}`,
      };
      const recoveredMe = await recordStep({
        label: "me:session-recovery",
        method: "GET",
        endpoint: "/me",
        headers: recoveredHeaders,
      });
      const recoveredBootstrap = await recordStep({
        label: "client-bootstrap:session-recovery",
        method: "GET",
        endpoint: "/client/bootstrap",
        headers: recoveredHeaders,
      });
      const recoveredInbox = await recordStep({
        label: "client-inbox:session-recovery",
        method: "GET",
        endpoint: "/client/inbox",
        headers: recoveredHeaders,
      });
      const recoveredOverview = await recordStep({
        label: "inbox-overview:session-recovery",
        method: "GET",
        endpoint: "/client/inbox/overview",
        headers: recoveredHeaders,
      });

      report.sessionRecovery.meOk =
        recoveredMe.ok === true &&
        recoveredMe.body?.authenticated === true &&
        recoveredMe.body?.user?.id === effectiveUserId &&
        recoveredMe.body?.user?.email === clientSessionEmail;
      report.sessionRecovery.bootstrapOk =
        recoveredBootstrap.ok === true &&
        recoveredBootstrap.body?.me?.authenticated === true &&
        recoveredBootstrap.body?.me?.user?.id === effectiveUserId &&
        Boolean(recoveredBootstrap.body?.dashboard) &&
        Boolean(recoveredBootstrap.body?.inboxOverview);
      report.sessionRecovery.inboxOk = recoveredInbox.ok === true && Array.isArray(recoveredInbox.body?.messages);
      report.sessionRecovery.overviewOk = recoveredOverview.ok === true && Array.isArray(recoveredOverview.body?.messages);
      report.sessionRecovery.recoveredUserId = recoveredMe.body?.user?.id ?? null;
      report.sessionRecovery.userStable = report.sessionRecovery.recoveredUserId === effectiveUserId;
      report.responseIds.sessionRecoveryUserId = report.sessionRecovery.recoveredUserId;

      await runAdb(["shell", "rm", "-f", clientSessionTokenRemotePath]);
    }

    if (withRefreshTokenRecovery) {
      if (!clientRefreshTokenRemotePath) {
        throw new Error("Refresh token recovery enabled but no Android refresh token file was created.");
      }

      const recoveredRefreshSession = await readDeviceJson(clientRefreshTokenRemotePath);
      const recoveredRefreshToken =
        typeof recoveredRefreshSession?.refreshToken === "string" ? recoveredRefreshSession.refreshToken : null;
      report.refreshTokenRecovery.tokenReloaded = Boolean(recoveredRefreshToken);
      if (!recoveredRefreshToken) {
        throw new Error("Unable to reload refresh token from Android temp storage.");
      }

      const refreshedSession = await recordStep({
        label: "auth-refresh:refresh-token-recovery",
        method: "POST",
        endpoint: "/auth/refresh",
        payload: {
          refreshToken: recoveredRefreshToken,
        },
      });
      const rotatedAccessToken = refreshedSession.body?.accessToken ?? null;
      const rotatedRefreshToken = refreshedSession.body?.refreshToken ?? null;
      report.refreshTokenRecovery.tokenRotated =
        typeof rotatedAccessToken === "string" &&
        typeof rotatedRefreshToken === "string" &&
        rotatedRefreshToken.length > 0 &&
        rotatedRefreshToken !== recoveredRefreshToken;
      report.responseIds.refreshTokenRecoveryUserId = refreshedSession.body?.user?.id ?? null;

      const oldRefreshReuse = await recordStep({
        label: "auth-refresh-old-reuse:refresh-token-recovery",
        method: "POST",
        endpoint: "/auth/refresh",
        payload: {
          refreshToken: recoveredRefreshToken,
        },
        allowFailure: true,
      });
      report.refreshTokenRecovery.oldRefreshTokenRejected = oldRefreshReuse.ok === false && oldRefreshReuse.status === 401;
      if (!report.refreshTokenRecovery.oldRefreshTokenRejected) {
        throw new Error("Refresh token rotation did not reject reuse of the old refresh token.");
      }

      if (!rotatedAccessToken || !rotatedRefreshToken) {
        throw new Error("auth-refresh succeeded but did not return rotated access and refresh tokens.");
      }

      const refreshedHeaders = {
        Authorization: `Bearer ${rotatedAccessToken}`,
      };
      const refreshedMe = await recordStep({
        label: "me:refresh-token-recovery",
        method: "GET",
        endpoint: "/me",
        headers: refreshedHeaders,
      });
      const refreshedBootstrap = await recordStep({
        label: "client-bootstrap:refresh-token-recovery",
        method: "GET",
        endpoint: "/client/bootstrap",
        headers: refreshedHeaders,
      });

      report.refreshTokenRecovery.meOk =
        refreshedMe.ok === true &&
        refreshedMe.body?.authenticated === true &&
        refreshedMe.body?.user?.id === effectiveUserId &&
        refreshedMe.body?.user?.email === clientSessionEmail;
      report.refreshTokenRecovery.bootstrapOk =
        refreshedBootstrap.ok === true &&
        refreshedBootstrap.body?.me?.authenticated === true &&
        refreshedBootstrap.body?.me?.user?.id === effectiveUserId &&
        Boolean(refreshedBootstrap.body?.dashboard) &&
        Boolean(refreshedBootstrap.body?.inboxOverview);
      report.refreshTokenRecovery.recoveredUserId = refreshedMe.body?.user?.id ?? null;
      report.refreshTokenRecovery.userStable = report.refreshTokenRecovery.recoveredUserId === effectiveUserId;
      report.responseIds.refreshTokenRecoveryRecoveredUserId = report.refreshTokenRecovery.recoveredUserId;

      const logoutResponse = await recordStep({
        label: "auth-logout:refresh-token-recovery",
        method: "POST",
        endpoint: "/auth/logout",
        payload: {
          refreshToken: rotatedRefreshToken,
        },
      });
      report.refreshTokenRecovery.logoutRevoked = logoutResponse.ok === true && logoutResponse.body?.revoked === true;

      const postLogoutRefresh = await recordStep({
        label: "auth-refresh-post-logout:refresh-token-recovery",
        method: "POST",
        endpoint: "/auth/refresh",
        payload: {
          refreshToken: rotatedRefreshToken,
        },
        allowFailure: true,
      });
      report.refreshTokenRecovery.postLogoutRefreshRejected = postLogoutRefresh.ok === false && postLogoutRefresh.status === 401;
      if (!report.refreshTokenRecovery.logoutRevoked) {
        throw new Error("auth-logout did not revoke the rotated refresh token.");
      }
      if (!report.refreshTokenRecovery.postLogoutRefreshRejected) {
        throw new Error("Refresh after logout was not rejected.");
      }

      await runAdb(["shell", "rm", "-f", clientRefreshTokenRemotePath]);
    }

    report.responseIds.clientBootstrapUserId = bootstrapBody?.me?.user?.id ?? null;
  }

  recoveryPlan = recoveryPlan?.body ?? null;
  recoveryHistory = recoveryHistory?.body ?? null;
  healthLatest = healthLatest?.body ?? null;
  dashboard = dashboard?.body ?? null;
  inbox = inbox?.body ?? null;
  acknowledgedMessage = acknowledgedMessage?.body ?? null;

  const recoveryPlanId = recoveryPlan?.id ?? null;
  const latestRecoveryPlanIdFromHistory = Array.isArray(recoveryHistory?.recoveryPlans) ? recoveryHistory.recoveryPlans[0]?.id ?? null : null;
  const latestRecoveryPlanIdFromInbox = inbox?.latestRecoveryPlan?.id ?? null;
  const latestRecoveryPlanIdFromDashboard = dashboard?.latestRecoveryPlan?.id ?? null;

  report.readModels = {
    healthLatestReflectsDevice: healthLatest?.latest?.deviceId === deviceId,
    dashboardReflectsDevice:
      dashboard?.latestHealthSnapshot?.deviceId === deviceId &&
      Array.isArray(dashboard?.edgeDevices) &&
      dashboard.edgeDevices.some((edgeDevice) => edgeDevice.deviceId === deviceId),
    inboxOverviewOk:
      Array.isArray(inbox?.messages) &&
      inbox.messages.length > 0 &&
      ["high", "medium", "low", null].includes(inbox?.latestBehaviorConclusion?.riskLevel ?? null) &&
      Array.isArray(inbox?.channelCounts) &&
      inbox.channelCounts.some((item) => item.channel === "mobile_push" && item.total > 0),
    inboxAckReflected:
      acknowledgedMessage?.status === "acknowledged" &&
      Array.isArray(inbox?.acknowledgedMessages) &&
      inbox.acknowledgedMessages.some((message) => message.id === inboxMessageId && message.status === "acknowledged") &&
      Array.isArray(dashboard?.inbox) &&
      dashboard.inbox.some((message) => message.id === inboxMessageId && message.status === "acknowledged"),
    recoveryPlanCreated: typeof recoveryPlanId === "string" && recoveryPlanId.length > 0,
    recoveryHistoryReflectsPlan:
      typeof recoveryPlanId === "string" &&
      recoveryPlanId.length > 0 &&
      latestRecoveryPlanIdFromHistory === recoveryPlanId &&
      Array.isArray(recoveryHistory?.recoveryPlans) &&
      recoveryHistory.recoveryPlans.length > 0,
    recoveryInboxConsistent:
      typeof recoveryPlanId === "string" &&
      recoveryPlanId.length > 0 &&
      latestRecoveryPlanIdFromInbox === recoveryPlanId,
    recoveryDashboardConsistent:
      typeof recoveryPlanId === "string" &&
      recoveryPlanId.length > 0 &&
      latestRecoveryPlanIdFromDashboard === recoveryPlanId,
  };
  report.responseIds = {
    ...report.responseIds,
    recoveryPlanId,
    recoveryPlanReason: recoveryPlan?.reason ?? null,
    recoveryHistoryLatestPlanId: latestRecoveryPlanIdFromHistory,
    recoveryHistoryPlanCount: Array.isArray(recoveryHistory?.recoveryPlans) ? recoveryHistory.recoveryPlans.length : 0,
    inboxAckMessageId: inboxMessageId,
    inboxAckStatus: acknowledgedMessage?.status ?? null,
    latestHealthId: healthLatest?.latest?.id ?? null,
    latestHealthDeviceId: healthLatest?.latest?.deviceId ?? null,
    dashboardLatestHealthSnapshotId: dashboard?.latestHealthSnapshot?.id ?? null,
    dashboardEdgeDeviceCount: Array.isArray(dashboard?.edgeDevices) ? dashboard.edgeDevices.length : 0,
    dashboardLatestRecoveryPlanId: latestRecoveryPlanIdFromDashboard,
    inboxMessageCount: Array.isArray(inbox?.messages) ? inbox.messages.length : 0,
    inboxLatestRiskLevel: inbox?.latestBehaviorConclusion?.riskLevel ?? null,
    inboxLatestRecoveryPlanId: latestRecoveryPlanIdFromInbox,
  };
} catch (error) {
  exitCode = 1;
  report.errors.push(error instanceof Error ? error.message : String(error));
} finally {
  if (gateway) {
    gateway.kill("SIGTERM");
    await sleep(500);
    if (gateway.exitCode === null) {
      gateway.kill("SIGKILL");
    }
  }
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }

  report.completedAt = now();
  report.durationMs = Date.parse(report.completedAt) - Date.parse(startedAt);
  report.summary = buildM6MobileCaptureAdbE2eSummary(report);
  if (!report.summary.passed) {
    exitCode = 1;
  }

  await mkdir(dirname(paths.json), { recursive: true });
  await writeFile(paths.json, JSON.stringify(report, null, 2), "utf8");
  await mkdir(dirname(paths.markdown), { recursive: true });
  await writeFile(paths.markdown, renderM6MobileCaptureAdbE2eMarkdown(report), "utf8");

  process.stdout.write(`m6MobileCaptureAdbE2eReport=${paths.json}\n`);
  process.stdout.write(`m6MobileCaptureAdbE2eReportMarkdown=${paths.markdown}\n`);
}

process.exit(exitCode);
