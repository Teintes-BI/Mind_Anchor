import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const SCRIPT_PATH = resolve(ROOT_DIR, "scripts", "repro-openclaw-transport-fallback.mjs");

test("repro-openclaw-transport-fallback reports cluster transport fallback on goal creation", () => {
  const result = spawnSync(process.execPath, [SCRIPT_PATH], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    timeout: 180000,
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.createGoal.status, 201);
  assert.equal(payload.createGoal.goalIdPresent, true);
  assert.equal(payload.adapter.lastDecision.route, "provider-fallback");
  assert.equal(payload.adapter.lastDecision.target, "task-management-agent");
  assert.equal(payload.adapter.lastFallback.failureCategory, "cluster_transport_error");
  assert.equal(payload.adapter.failureCategoryCounts.cluster_transport_error, 2);
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
});
