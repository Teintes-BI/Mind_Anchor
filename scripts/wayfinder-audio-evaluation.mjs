import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ratio = (numerator, denominator) => (denominator > 0 ? Number((numerator / denominator).toFixed(3)) : 0);

const evaluateAudioFixture = (fixture) => {
  const id = String(fixture?.id ?? "unknown");
  const expectedCandidate = fixture?.expectedCandidate === true;
  const predictedCandidate = fixture?.observedStatus === "candidate";
  const revoked = fixture?.consentStatus === "revoked";
  const unsafeOutcomes = [];

  if (revoked && predictedCandidate) unsafeOutcomes.push(`${id}:accepted_after_revoke`);
  if (predictedCandidate && typeof fixture?.confidence === "number" && fixture.confidence < 0.5 && fixture.situationStatus !== "awaiting_confirmation") {
    unsafeOutcomes.push(`${id}:low_confidence_not_awaiting_confirmation`);
  }

  return {
    id,
    expectedCandidate,
    predictedCandidate,
    observedStatus: String(fixture?.observedStatus ?? "unknown"),
    situationStatus: fixture?.situationStatus ?? null,
    consentStatus: fixture?.consentStatus ?? "granted",
    unsafeOutcomes,
  };
};

export function evaluateAudioFixtures(fixtures) {
  const cases = Array.isArray(fixtures) ? fixtures.map(evaluateAudioFixture) : [];
  const expected = cases.filter((fixture) => fixture.expectedCandidate);
  const predicted = cases.filter((fixture) => fixture.predictedCandidate);
  const truePositives = cases.filter((fixture) => fixture.expectedCandidate && fixture.predictedCandidate).length;
  const revoked = cases.filter((fixture) => fixture.consentStatus === "revoked");
  const rejectedAfterRevoke = revoked.filter((fixture) => !fixture.predictedCandidate);

  return {
    fixtureCount: cases.length,
    cases,
    candidate: {
      expected: expected.length,
      predicted: predicted.length,
      truePositives,
      precision: ratio(truePositives, predicted.length),
      recall: ratio(truePositives, expected.length),
    },
    awaitingConfirmationRate: ratio(
      predicted.filter((fixture) => fixture.situationStatus === "awaiting_confirmation").length,
      predicted.length,
    ),
    consentRejectionRate: ratio(rejectedAfterRevoke.length, revoked.length),
    unsafeOutcomes: cases.flatMap((fixture) => fixture.unsafeOutcomes),
  };
}

export function renderAudioEvaluationReport(result) {
  return {
    generatedAt: new Date().toISOString(),
    ...result,
    passed:
      result.candidate.precision === 1 &&
      result.candidate.recall === 1 &&
      result.consentRejectionRate === 1 &&
      result.unsafeOutcomes.length === 0,
  };
}

const argumentValue = (args, name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const fixturesPath = resolve(argumentValue(args, "--fixtures", "docs/wayfinder/audio-evaluation-fixtures.json"));
  const outputPath = argumentValue(args, "--output", "");
  const fixtures = JSON.parse(await readFile(fixturesPath, "utf8"));
  const report = renderAudioEvaluationReport(evaluateAudioFixtures(fixtures));
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (outputPath) await writeFile(resolve(outputPath), text, "utf8");
  process.stdout.write(text);
  process.exitCode = report.passed ? 0 : 1;
}
