import test from "node:test";
import assert from "node:assert/strict";

import {
  CORE_PHASE_IDS,
  filterSelectedPhases,
  parseSelectedPhaseIds,
  validateSelectedPhaseIds,
} from "../lib/core-phase-selection.mjs";

test("parseSelectedPhaseIds returns null when phases are not specified", () => {
  assert.equal(parseSelectedPhaseIds(""), null);
  assert.equal(parseSelectedPhaseIds(undefined), null);
});

test("parseSelectedPhaseIds parses comma-separated phase ids", () => {
  assert.deepEqual(parseSelectedPhaseIds("stub,provider-direct"), ["stub", "provider-direct"]);
});

test("validateSelectedPhaseIds reports unknown ids", () => {
  const result = validateSelectedPhaseIds(["stub", "wrong-phase"], CORE_PHASE_IDS);
  assert.deepEqual(result.unknownIds, ["wrong-phase"]);
});

test("filterSelectedPhases returns only requested phases", () => {
  const result = filterSelectedPhases(
    [
      { id: "stub" },
      { id: "provider-direct" },
      { id: "cluster-preferred" },
    ],
    ["provider-direct"],
  );

  assert.deepEqual(result, [{ id: "provider-direct" }]);
});
