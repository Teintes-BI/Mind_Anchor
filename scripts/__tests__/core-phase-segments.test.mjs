import test from "node:test";
import assert from "node:assert/strict";

import {
  CORE_PHASE_SEGMENT_IDS,
  getSelectedBusinessWebCheckIds,
  parseSelectedSegmentIds,
  shouldRunBusinessFlow,
  shouldRunCorePhaseSegment,
  shouldRunCorePhaseScenarioSeed,
  validateSelectedSegmentIds,
} from "../lib/core-phase-segments.mjs";

test("parseSelectedSegmentIds returns null when segments are not specified", () => {
  assert.equal(parseSelectedSegmentIds(""), null);
  assert.equal(parseSelectedSegmentIds(undefined), null);
});

test("parseSelectedSegmentIds parses comma-separated segment ids", () => {
  assert.deepEqual(parseSelectedSegmentIds("baseline,probes,regressions"), ["baseline", "probes", "regressions"]);
});

test("validateSelectedSegmentIds reports unknown segment ids", () => {
  const result = validateSelectedSegmentIds(["baseline", "wrong-segment"], CORE_PHASE_SEGMENT_IDS);
  assert.deepEqual(result.unknownIds, ["wrong-segment"]);
});

test("shouldRunCorePhaseSegment runs all segments when none are specified", () => {
  assert.equal(shouldRunCorePhaseSegment(null, "business"), true);
});

test("shouldRunCorePhaseSegment respects selected segment ids", () => {
  assert.equal(shouldRunCorePhaseSegment(["baseline", "probes"], "baseline"), true);
  assert.equal(shouldRunCorePhaseSegment(["baseline", "probes"], "regressions"), false);
});

test("business segment ids include finer-grained business core and web checks", () => {
  assert.equal(CORE_PHASE_SEGMENT_IDS.includes("business-core"), true);
  assert.equal(CORE_PHASE_SEGMENT_IDS.includes("business-web-dashboard"), true);
  assert.equal(CORE_PHASE_SEGMENT_IDS.includes("business-web-inbox"), true);
  assert.equal(CORE_PHASE_SEGMENT_IDS.includes("runtime-contracts"), true);
});

test("shouldRunCorePhaseScenarioSeed stays true for finer-grained business segments", () => {
  assert.equal(shouldRunCorePhaseScenarioSeed(["business-core"]), true);
  assert.equal(shouldRunCorePhaseScenarioSeed(["business-web-dashboard"]), true);
  assert.equal(shouldRunCorePhaseScenarioSeed(["runtime-contracts"]), true);
  assert.equal(shouldRunCorePhaseScenarioSeed(["web"]), false);
});

test("shouldRunBusinessFlow stays true for business core and business web segments", () => {
  assert.equal(shouldRunBusinessFlow(["business-core"]), true);
  assert.equal(shouldRunBusinessFlow(["business-web-dashboard"]), true);
  assert.equal(shouldRunBusinessFlow(["debugs"]), false);
});

test("getSelectedBusinessWebCheckIds returns all web checks for the legacy business segment", () => {
  assert.deepEqual(getSelectedBusinessWebCheckIds(["business"]), [
    "dashboard",
    "goalflow",
    "state",
    "recovery",
    "reflections",
    "inbox",
  ]);
});

test("getSelectedBusinessWebCheckIds returns only explicitly selected finer-grained web checks", () => {
  assert.deepEqual(getSelectedBusinessWebCheckIds(["business-web-dashboard", "business-web-state"]), [
    "dashboard",
    "state",
  ]);
});
