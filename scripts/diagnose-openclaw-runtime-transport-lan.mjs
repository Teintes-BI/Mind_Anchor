#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const OPENCLAW_PORT = process.env.OPENCLAW_PORT ?? "8800";
const OPENCLAW_RUNTIME_INSTANCE = process.env.OPENCLAW_RUNTIME_INSTANCE ?? "";
const API_BASE_URL = (process.env.MINDANCHOR_API_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const FETCH_TIMEOUT_MS = Number(process.env.MINDANCHOR_DIAG_TIMEOUT_MS ?? "3000");

const resolveOpenClawRuntimeFilePrefix = ({ port, instance }) => {
  if (instance) {
    return `openclaw-runtime-${instance}`;
  }
  if (String(port) === "8800") {
    return "openclaw-real-lan";
  }
  return `openclaw-real-lan-${port}`;
};

const parseSimpleEnvFile = (path) => {
  if (!existsSync(path)) {
    return {};
  }

  const result = {};
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    result[key] = value;
  }
  return result;
};

const readRuntimeStatus = (pidFile) => {
  if (!existsSync(pidFile)) {
    return "stopped";
  }

  const rawPid = readFileSync(pidFile, "utf8").trim();
  const pid = Number(rawPid);
  if (!Number.isInteger(pid) || pid <= 0) {
    return "stale-pid";
  }

  try {
    process.kill(pid, 0);
    return "running";
  } catch {
    return "stale-pid";
  }
};

const summarizeClusterAttempts = (clusterAttempts) => {
  const attempts = Array.isArray(clusterAttempts) ? clusterAttempts : [];
  const attemptsPerEndpoint = {};

  for (const attempt of attempts) {
    const endpoint = String(attempt?.endpoint ?? "");
    if (!endpoint) {
      continue;
    }
    attemptsPerEndpoint[endpoint] = (attemptsPerEndpoint[endpoint] ?? 0) + 1;
  }

  return {
    totalAttempts: attempts.length,
    uniqueEndpoints: Object.keys(attemptsPerEndpoint),
    attemptsPerEndpoint,
    allErrorsFetchFailed:
      attempts.length > 0 &&
      attempts.every((attempt) => attempt?.ok === false && String(attempt?.error ?? "").toLowerCase() === "fetch failed"),
  };
};

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    const parsed = text ? JSON.parse(text) : null;
    return {
      ok: response.ok,
      status: response.status,
      url,
      body: parsed,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
};

const filePrefix = resolveOpenClawRuntimeFilePrefix({
  port: OPENCLAW_PORT,
  instance: OPENCLAW_RUNTIME_INSTANCE,
});
const envFile = resolve(ROOT_DIR, ".logs", `${filePrefix}.env`);
const pidFile = resolve(ROOT_DIR, ".logs", `${filePrefix}.pid`);
const logFile = resolve(ROOT_DIR, ".logs", `${filePrefix}.log`);
const envSnapshot = parseSimpleEnvFile(envFile);
const runtimeStatus = readRuntimeStatus(pidFile);

const loopbackHealthUrl =
  process.env.OPENCLAW_HEALTH_URL ??
  envSnapshot.OPENCLAW_HEALTH_URL ??
  `http://127.0.0.1:${OPENCLAW_PORT}/health`;
const lanBaseUrl = process.env.OPENCLAW_BASE_URL ?? envSnapshot.OPENCLAW_BASE_URL ?? "";
const lanHealthUrl =
  process.env.OPENCLAW_LAN_HEALTH_URL ??
  (lanBaseUrl ? `${lanBaseUrl.replace(/\/$/, "")}/health` : "");

const [loopbackHealth, lanHealth, adapterResponse] = await Promise.all([
  fetchJson(loopbackHealthUrl),
  lanHealthUrl && lanHealthUrl !== loopbackHealthUrl
    ? fetchJson(lanHealthUrl)
    : Promise.resolve({ ok: true, status: null, skipped: true, url: lanHealthUrl || loopbackHealthUrl }),
  fetchJson(`${API_BASE_URL}/debug/openclaw/adapter`),
]);

const issues = [];

if (runtimeStatus !== "running") {
  issues.push({
    code: "runtime_not_running",
    message: `Runtime status is ${runtimeStatus}.`,
  });
}

if (!loopbackHealth.ok) {
  issues.push({
    code: "loopback_health_failed",
    message: `Loopback health failed for ${loopbackHealthUrl}.`,
  });
}

if (!lanHealth.ok && !lanHealth.skipped) {
  issues.push({
    code: "lan_health_failed",
    message: `LAN health failed for ${lanHealthUrl}.`,
  });
}

if (!adapterResponse.ok) {
  issues.push({
    code: "adapter_unreachable",
    message: `Adapter endpoint failed for ${API_BASE_URL}/debug/openclaw/adapter.`,
  });
}

const adapterBody = adapterResponse.body ?? {};

const payload = {
  runtimeFiles: {
    filePrefix,
    pidFile,
    logFile,
    envFile,
    status: runtimeStatus,
  },
  runtimeHealth: {
    loopback: loopbackHealth,
    lan: lanHealth,
  },
  adapter: {
    httpStatus: adapterResponse.status,
    clusterEnabled: adapterBody.clusterEnabled ?? null,
    executionStrategy: adapterBody.executionStrategy ?? null,
    lastDecision: adapterBody.lastDecision ?? null,
    lastFallback: adapterBody.lastFallback ?? null,
    failureCategoryCounts: adapterBody.failureCategoryCounts ?? {},
    clusterAttemptSummary: summarizeClusterAttempts(adapterBody.lastFallback?.clusterAttempts),
  },
  issues,
};

process.stdout.write(`${JSON.stringify(payload)}\n`);
