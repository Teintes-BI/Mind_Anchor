import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const SCRIPT_PATH = resolve(ROOT_DIR, "scripts", "diagnose-openclaw-runtime-transport-lan.mjs");
const LOGS_DIR = resolve(ROOT_DIR, ".logs");

const runScript = async (env) =>
  await new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [SCRIPT_PATH], {
      cwd: ROOT_DIR,
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
    child.on("close", (status) => {
      resolvePromise({ status, stdout, stderr });
    });
  });

const listenJson = async (handler) => {
  const server = createServer(handler);
  await new Promise((resolvePromise) => server.listen(0, "127.0.0.1", () => resolvePromise(undefined)));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve test server address.");
  }
  return {
    server,
    port: address.port,
  };
};

test("diagnose-openclaw-runtime-transport-lan emits runtime health and adapter transport evidence in one payload", async () => {
  const health = await listenJson((_, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, runtime: "openclaw-real-cluster" }));
  });

  const adapter = await listenJson((req, res) => {
    if (String(req.url ?? "") !== "/debug/openclaw/adapter") {
      res.writeHead(404).end();
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        clusterEnabled: true,
        executionStrategy: "cluster-preferred",
        lastDecision: {
          route: "provider-fallback",
          target: "chief-agent",
        },
        lastFallback: {
          fallbackReason: "fetch failed",
          failureCategory: "cluster_transport_error",
          clusterAttempts: [
            { endpoint: "/v1/tasks/execute", ok: false, error: "fetch failed" },
            { endpoint: "/v1/tasks/execute", ok: false, error: "fetch failed" },
            { endpoint: "/tasks/execute", ok: false, error: "fetch failed" },
            { endpoint: "/tasks/execute", ok: false, error: "fetch failed" },
            { endpoint: "/api/tasks/execute", ok: false, error: "fetch failed" },
            { endpoint: "/api/tasks/execute", ok: false, error: "fetch failed" },
          ],
        },
        failureCategoryCounts: {
          cluster_transport_error: 2,
        },
      }),
    );
  });

  mkdirSync(LOGS_DIR, { recursive: true });
  const port = "9914";
  const envFile = resolve(LOGS_DIR, `openclaw-real-lan-${port}.env`);
  const pidFile = resolve(LOGS_DIR, `openclaw-real-lan-${port}.pid`);

  writeFileSync(
    envFile,
    [
      `OPENCLAW_HEALTH_URL=http://127.0.0.1:${health.port}/health`,
      `OPENCLAW_BASE_URL=http://127.0.0.1:${health.port}`,
    ].join("\n"),
    "utf8",
  );
  writeFileSync(pidFile, String(process.pid), "utf8");

  try {
    const result = await runScript({
      ...process.env,
      OPENCLAW_PORT: port,
      MINDANCHOR_API_URL: `http://127.0.0.1:${adapter.port}`,
    });

    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout);

    assert.equal(payload.runtimeFiles.filePrefix, "openclaw-real-lan-9914");
    assert.equal(payload.runtimeFiles.status, "running");
    assert.equal(payload.runtimeHealth.loopback.ok, true);
    assert.equal(payload.runtimeHealth.lan.ok, true);
    assert.equal(payload.adapter.httpStatus, 200);
    assert.equal(payload.adapter.executionStrategy, "cluster-preferred");
    assert.equal(payload.adapter.lastDecision.route, "provider-fallback");
    assert.equal(payload.adapter.lastFallback.failureCategory, "cluster_transport_error");
    assert.deepEqual(payload.adapter.clusterAttemptSummary, {
      totalAttempts: 6,
      uniqueEndpoints: ["/v1/tasks/execute", "/tasks/execute", "/api/tasks/execute"],
      attemptsPerEndpoint: {
        "/v1/tasks/execute": 2,
        "/tasks/execute": 2,
        "/api/tasks/execute": 2,
      },
      allErrorsFetchFailed: true,
    });
    assert.deepEqual(payload.issues, []);
  } finally {
    rmSync(envFile, { force: true });
    rmSync(pidFile, { force: true });
    await new Promise((resolvePromise, reject) => health.server.close((error) => (error ? reject(error) : resolvePromise(undefined))));
    await new Promise((resolvePromise, reject) => adapter.server.close((error) => (error ? reject(error) : resolvePromise(undefined))));
  }
});
