import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const SCRIPT_PATH = resolve(ROOT_DIR, "scripts", "status-openclaw-runtime-lan.sh");

test("status-openclaw-runtime-lan reports resolved runtime file paths for non-default ports", () => {
  const port = "9911";
  const result = spawnSync("bash", [SCRIPT_PATH], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      OPENCLAW_PORT: port,
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /FILE_PREFIX=openclaw-real-lan-9911/);
  assert.match(result.stdout, /PID_FILE=.*openclaw-real-lan-9911\.pid/);
  assert.match(result.stdout, /LOG_FILE=.*openclaw-real-lan-9911\.log/);
  assert.match(result.stdout, /ENV_FILE=.*openclaw-real-lan-9911\.env/);
  assert.match(result.stdout, /STATUS=stopped/);
});
