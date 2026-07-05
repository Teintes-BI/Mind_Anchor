import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const SETUP_SCRIPT = resolve(ROOT_DIR, "scripts", "setup-openclaw-real-profile.sh");
const START_SCRIPT = resolve(ROOT_DIR, "scripts", "start-openclaw-runtime-lan.sh");
const HEALTH_SCRIPT = resolve(ROOT_DIR, "scripts", "health-openclaw-runtime-lan.sh");

const cleanupPortFiles = (port) => {
  const prefix = `openclaw-real-lan-${port}`;
  const pidFile = resolve(ROOT_DIR, ".logs", `${prefix}.pid`);
  const logFile = resolve(ROOT_DIR, ".logs", `${prefix}.log`);
  const envFile = resolve(ROOT_DIR, ".logs", `${prefix}.env`);
  if (existsSync(pidFile)) {
    const pid = readFileSync(pidFile, "utf8").trim();
    if (pid) {
      spawnSync("kill", [pid], { stdio: "ignore" });
    }
  }
  rmSync(pidFile, { force: true });
  rmSync(logFile, { force: true });
  rmSync(envFile, { force: true });
};

test("setup-openclaw-real-profile fails clearly when python is unavailable for auth parsing", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "mindanchor-setup-preflight-"));
  const authFile = join(tempDir, "auth.json");
  writeFileSync(authFile, JSON.stringify({ OPENAI_API_KEY: "test-key" }), "utf8");

  const result = spawnSync("bash", [SETUP_SCRIPT], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      OPENCLAW_REAL_PROFILE: "preflight-setup-test",
      OPENCLAW_REAL_AUTH_JSON_PATH: authFile,
      OPENAI_API_KEY: "",
      OPENCLAW_REAL_API_KEY: "",
      OPENCLAW_PYTHON_BIN: "/definitely/missing/python3",
    },
    encoding: "utf8",
    timeout: 120000,
  });

  rmSync(tempDir, { recursive: true, force: true });
  rmSync(resolve(process.env.HOME ?? "", ".openclaw-preflight-setup-test"), { recursive: true, force: true });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Python 3 runtime not found/);
});

test("start-openclaw-runtime-lan fails clearly when configured node binary is missing", () => {
  const port = "9922";
  cleanupPortFiles(port);
  try {
    const result = spawnSync("bash", [START_SCRIPT], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        OPENCLAW_PORT: port,
        OPENCLAW_LAN_IP: "127.0.0.1",
        OPENCLAW_NODE_BIN: "/definitely/missing/node",
      },
      encoding: "utf8",
      timeout: 120000,
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Node runtime not found/);
  } finally {
    cleanupPortFiles(port);
  }
});

test("start-openclaw-runtime-lan selects a compatible node runtime when the bundled node is too old", () => {
  const port = "9923";
  cleanupPortFiles(port);
  try {
    const startResult = spawnSync("bash", [START_SCRIPT], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        OPENCLAW_PORT: port,
        OPENCLAW_LAN_IP: "127.0.0.1",
      },
      encoding: "utf8",
      timeout: 180000,
    });

    assert.equal(startResult.status, 0, startResult.stderr);

    const healthResult = spawnSync("bash", [HEALTH_SCRIPT], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        OPENCLAW_PORT: port,
        OPENCLAW_SKIP_LAN_HEALTH: "1",
      },
      encoding: "utf8",
      timeout: 30000,
    });

    assert.equal(healthResult.status, 0, healthResult.stderr);
    assert.match(healthResult.stdout, /"ok":true/);
  } finally {
    cleanupPortFiles(port);
  }
});
