import test from "node:test";
import assert from "node:assert/strict";

import {
  formatCorePhaseStepStarted,
  formatCorePhaseStepCompleted,
  formatCorePhaseStepFailed,
} from "../lib/core-phase-progress.mjs";

test("formatCorePhaseStepStarted renders phase, label, path, and timeout", () => {
  const text = formatCorePhaseStepStarted({
    phaseTitle: "Phase 2 Provider Direct",
    label: "full-regression",
    method: "POST",
    path: "/debug/regressions/full-run",
    timeoutMs: 1800000,
  });

  assert.equal(
    text,
    "[Phase 2 Provider Direct] START full-regression POST /debug/regressions/full-run timeout=1800000ms",
  );
});

test("formatCorePhaseStepCompleted renders status and elapsed time", () => {
  const text = formatCorePhaseStepCompleted({
    phaseTitle: "Phase 2 Provider Direct",
    label: "probe-chief-agent",
    statusCode: 200,
    elapsedMs: 4021,
    conclusion: "passed",
  });

  assert.equal(
    text,
    "[Phase 2 Provider Direct] DONE probe-chief-agent status=200 elapsed=4021ms conclusion=passed",
  );
});

test("formatCorePhaseStepFailed renders error summary", () => {
  const text = formatCorePhaseStepFailed({
    phaseTitle: "Phase 3 Cluster Preferred",
    label: "registry-visibility",
    elapsedMs: 1200,
    message: "healthStatus not aligned",
  });

  assert.equal(
    text,
    "[Phase 3 Cluster Preferred] FAIL registry-visibility elapsed=1200ms message=healthStatus not aligned",
  );
});
