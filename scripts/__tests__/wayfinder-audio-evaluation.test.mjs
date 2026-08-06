import { describe, expect, it } from "vitest";
import { evaluateAudioFixtures, renderAudioEvaluationReport } from "../wayfinder-audio-evaluation.mjs";

const fixtures = [
  { id: "clear-task", expectedCandidate: true, observedStatus: "candidate" },
  { id: "low-confidence-task", expectedCandidate: true, observedStatus: "candidate", situationStatus: "awaiting_confirmation" },
  { id: "non-task", expectedCandidate: false, observedStatus: "ignored" },
  { id: "empty", expectedCandidate: false, observedStatus: "ignored" },
  { id: "consent-revoked", expectedCandidate: false, consentStatus: "revoked", observedStatus: "rejected" },
];

describe("Wayfinder audio fixture evaluator", () => {
  it("reports candidate precision/recall and consent safety metrics", () => {
    const report = evaluateAudioFixtures(fixtures);

    expect(report.fixtureCount).toBe(5);
    expect(report.candidate).toMatchObject({ expected: 2, predicted: 2, truePositives: 2, precision: 1, recall: 1 });
    expect(report.awaitingConfirmationRate).toBe(0.5);
    expect(report.consentRejectionRate).toBe(1);
    expect(report.unsafeOutcomes).toEqual([]);
  });

  it("fails when a revoked-consent fixture is accepted", () => {
    const report = evaluateAudioFixtures([{ ...fixtures[4], observedStatus: "candidate" }]);

    expect(report.unsafeOutcomes).toEqual(["consent-revoked:accepted_after_revoke"]);
    expect(renderAudioEvaluationReport(report).passed).toBe(false);
  });
});
