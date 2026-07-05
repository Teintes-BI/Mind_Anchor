import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const SCRIPT_PATH = resolve(ROOT_DIR, "scripts", "health-openclaw-runtime-lan.sh");
const LOGS_DIR = resolve(ROOT_DIR, ".logs");

const runScript = async (env) =>
  await new Promise((resolve) => {
    const child = spawn("bash", [SCRIPT_PATH], {
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
      resolve({ status, stdout, stderr });
    });
  });

const withRuntimeEnvFile = async ({ port, content }, run) => {
  mkdirSync(LOGS_DIR, { recursive: true });
  const envFile = resolve(LOGS_DIR, `openclaw-real-lan-${port}.env`);
  writeFileSync(envFile, content, "utf8");
  try {
    return await run();
  } finally {
    rmSync(envFile, { force: true });
  }
};

const listenJson = async () => {
  const server = createServer((_, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve test server address.");
  }

  return {
    server,
    port: address.port,
  };
};

test("health-openclaw-runtime-lan fails when loopback is healthy but LAN base URL is unreachable", async () => {
  const listener = await listenJson();
  try {
    const result = await withRuntimeEnvFile(
      {
        port: "9912",
        content: [
          `OPENCLAW_HEALTH_URL=http://127.0.0.1:${listener.port}/health`,
          "OPENCLAW_BASE_URL=http://192.0.2.10:9912",
        ].join("\n"),
      },
      async () =>
        await runScript({
          ...process.env,
          OPENCLAW_PORT: "9912",
          OPENCLAW_HEALTH_CURL_MAX_TIME: "1",
        }),
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /LAN_HEALTH_URL=http:\/\/192\.0\.2\.10:9912\/health/);
    assert.match(result.stderr, /CHECK_FAILED=lan/);
  } finally {
    await new Promise((resolve, reject) => listener.server.close((error) => (error ? reject(error) : resolve(undefined))));
  }
});

test("health-openclaw-runtime-lan can skip LAN validation explicitly", async () => {
  const listener = await listenJson();
  try {
    const result = await withRuntimeEnvFile(
      {
        port: "9913",
        content: [
          `OPENCLAW_HEALTH_URL=http://127.0.0.1:${listener.port}/health`,
          "OPENCLAW_BASE_URL=http://192.0.2.11:9913",
        ].join("\n"),
      },
      async () =>
        await runScript({
          ...process.env,
          OPENCLAW_PORT: "9913",
          OPENCLAW_HEALTH_CURL_MAX_TIME: "1",
          OPENCLAW_SKIP_LAN_HEALTH: "1",
        }),
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /\{"ok":true\}/);
  } finally {
    await new Promise((resolve, reject) => listener.server.close((error) => (error ? reject(error) : resolve(undefined))));
  }
});
