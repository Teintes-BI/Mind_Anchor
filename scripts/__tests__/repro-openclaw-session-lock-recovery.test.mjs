import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const SCRIPT_PATH = resolve(ROOT_DIR, "scripts", "repro-openclaw-session-lock-recovery.mjs");

test("repro-openclaw-session-lock-recovery reports cluster recovery after a known session lock", () => {
  const result = spawnSync(process.execPath, [SCRIPT_PATH], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    timeout: 180000,
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.probe.status, 200);
  assert.equal(payload.probe.success, true);
  assert.equal(payload.adapter.lastDecision.route, "cluster");
  assert.equal(payload.adapter.lastDecision.target, "state-insight-agent");
  assert.equal(payload.adapter.lastDecision.selectedEndpoint, "cluster:/v1/tasks/execute");
  assert.equal(payload.adapter.lastFallback, null);
  assert.deepEqual(payload.adapter.failureCategoryCounts, {});
  assert.equal(payload.cluster.requestCount, 2);
  assert.deepEqual(payload.cluster.requestPaths, ["/v1/tasks/execute", "/v1/tasks/execute"]);
  assert.deepEqual(payload.provider.requestPaths, []);
});
