import test from "node:test";
import assert from "node:assert/strict";

import {
  assertNoRegistryContractDrift,
  summarizeRegistryContractSummaryLines,
} from "./openclaw-registry-e2e-assertions.mjs";

test("summarizeRegistryContractSummaryLines returns none for empty lines", () => {
  assert.equal(summarizeRegistryContractSummaryLines([]), "none");
});

test("summarizeRegistryContractSummaryLines joins contract drift lines", () => {
  assert.equal(
    summarizeRegistryContractSummaryLines([
      "Runtime contract: healthStatus",
      "Workflow response: coach_conversation_full · fullResponse",
    ]),
    "Runtime contract: healthStatus | Workflow response: coach_conversation_full · fullResponse",
  );
});

test("assertNoRegistryContractDrift passes when contract drift lines are empty", () => {
  assert.doesNotThrow(() =>
    assertNoRegistryContractDrift(
      {
        openClawRegistryContractSummaryLines: [],
      },
      "today aligned registry",
    ),
  );
});

test("assertNoRegistryContractDrift throws a readable error when contract drift exists", () => {
  assert.throws(
    () =>
      assertNoRegistryContractDrift(
        {
          openClawRegistryContractSummaryLines: [
            "Persona contract: director-agent · responseMode",
            "Execute probe: memory_governance · unreachable",
          ],
        },
        "today aligned registry",
      ),
    /today aligned registry.*Persona contract: director-agent · responseMode.*Execute probe: memory_governance · unreachable/s,
  );
});
