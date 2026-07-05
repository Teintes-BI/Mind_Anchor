import test from "node:test";
import assert from "node:assert/strict";

import { buildCadencedPhaseDefinitions } from "../lib/m6-mobile-capture-adb-e2e-scenarios.mjs";

test("buildCadencedPhaseDefinitions returns ordered phases with evolving signal payloads", () => {
  const phases = buildCadencedPhaseDefinitions({
    userId: "m6-mobile-user",
    deviceId: "android-m6-capture",
    sessionId: "session-1",
    startedAt: "2026-04-25T10:00:00.000Z",
  });

  assert.deepEqual(
    phases.map((phase) => phase.name),
    ["baseline", "stress-build-up-1", "stress-build-up-2", "recovery-trigger", "post-recovery"],
  );

  assert.equal(phases[0].emotion.stressScore < phases[1].emotion.stressScore, true);
  assert.equal(phases[1].emotion.stressScore < phases[2].emotion.stressScore, true);
  assert.equal(phases[4].emotion.stressScore < phases[2].emotion.stressScore, true);
  assert.equal(phases[4].health.windowEnd > phases[0].health.windowEnd, true);
  assert.equal(phases[3].recovery.reason, "cadenced_stress_follow_up");
});

test("buildCadencedPhaseDefinitions uses emotion labels accepted by the API schema", () => {
  const phases = buildCadencedPhaseDefinitions({
    userId: "m6-mobile-user",
    deviceId: "android-m6-capture",
    sessionId: "session-1",
    startedAt: "2026-04-25T10:00:00.000Z",
  });

  assert.deepEqual(
    phases.filter((phase) => phase.emotion).map((phase) => phase.emotion.emotionLabel),
    ["calm", "tense", "stressed", "positive"],
  );
});
