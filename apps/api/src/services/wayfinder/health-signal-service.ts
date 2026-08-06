import { z } from "zod";
import {
  createHealthSnapshotInputSchema,
  healthCalibrationRecordSchema,
  healthMissingnessSchema,
  healthSummarySchema,
  healthSignalSchema,
  type CreateHealthSnapshotInput,
  type EnergyBand,
  type HealthCalibrationRecord,
  type HealthSummary,
  type HealthSignal,
} from "@mindanchor/domain";

const isoDateTimeSchema = z.string().datetime({ offset: true });
const identifierSchema = z.string().min(1);

export const healthBridgeSnapshotInputSchema = createHealthSnapshotInputSchema.extend({
  sourceDevice: identifierSchema.max(120).optional(),
  capturedAt: isoDateTimeSchema.optional(),
  receivedAt: isoDateTimeSchema.optional(),
  missingness: healthMissingnessSchema.optional(),
  consentRef: identifierSchema.optional(),
});

export type HealthBridgeSnapshotInput = z.infer<typeof healthBridgeSnapshotInputSchema>;

export type HealthPolicyModifiers = {
  dose: "normal" | "reduced_load" | "energy_recovery";
  energyRecovery: boolean;
  confidence: number;
  reasons: string[];
};

export type HealthCalibrationSummary = {
  recordCount: number;
  meanAbsoluteError: number | null;
  byRecommendation: Record<string, { recordCount: number; meanAbsoluteError: number }>;
};

const energyBandValue: Record<EnergyBand, number> = { low: 0, medium: 0.5, high: 1 };
const round = (value: number, digits = 3) => Number(value.toFixed(digits));
const hasValue = (value: number | undefined) => typeof value === "number" && Number.isFinite(value);

const summaryFor = (input: HealthBridgeSnapshotInput, missingness: HealthSummary["missingness"]) => {
  if (missingness === "missing") return "Health data is unavailable or has not synced yet.";
  if (missingness === "delayed") return "Health data is delayed; it is being treated as a low-confidence context signal.";

  const parts: string[] = [];
  if (hasValue(input.sleepMinutes)) parts.push(`sleep ${input.sleepMinutes}m`);
  if (hasValue(input.activeMinutes)) parts.push(`activity ${input.activeMinutes}m`);
  if (hasValue(input.steps)) parts.push(`steps ${input.steps}`);
  if (hasValue(input.restingHeartRate)) parts.push(`resting heart rate ${Math.round(input.restingHeartRate!)} bpm`);
  return parts.length > 0 ? `Health summary: ${parts.join(", ")}.` : "No health summary values were available in this window.";
};

export class HealthSignalService {
  constructor(private readonly clock: () => Date = () => new Date()) {}

  normalize(rawInput: HealthBridgeSnapshotInput): { snapshot: CreateHealthSnapshotInput; summary: HealthSummary } {
    const input = healthBridgeSnapshotInputSchema.parse(rawInput);
    const now = this.clock();
    const capturedAt = input.capturedAt ?? input.windowEnd;
    const receivedAt = input.receivedAt ?? now.toISOString();
    const hasAnySignal = [input.sleepMinutes, input.activeMinutes, input.steps, input.restingHeartRate, input.heartRate].some(hasValue);
    const explicitlyMissing = input.missingness === "missing" || (!input.missingness && !hasAnySignal);
    const windowEndMs = Date.parse(input.windowEnd);
    const receivedAtMs = Date.parse(receivedAt);
    const isDelayed = !explicitlyMissing && Number.isFinite(windowEndMs) && Number.isFinite(receivedAtMs) && receivedAtMs - windowEndMs > 24 * 60 * 60 * 1000;
    const missingness = explicitlyMissing ? "missing" : isDelayed ? "delayed" : "available";
    const consentScope = input.consentScope ?? "health_summary";
    const retentionClass = input.retentionClass ?? "summary";
    const providedEvidenceRefs = input.evidenceRefs ?? [];
    const evidenceRefs = providedEvidenceRefs.length > 0 ? providedEvidenceRefs : [`health:${input.sourceDevice ?? input.deviceId ?? "unknown"}:${input.windowEnd}`];
    const confidence = missingness === "available" ? 0.65 : missingness === "delayed" ? 0.25 : 0;
    const signalInputs: Array<[HealthSignal["signalKind"], number | undefined, HealthSignal["unit"]]> = [
      ["sleep_summary", input.sleepMinutes, "minutes"],
      ["activity_summary", input.activeMinutes ?? input.steps, input.activeMinutes !== undefined ? "minutes" : "count"],
      ["resting_hr_summary", input.restingHeartRate, "bpm"],
    ];
    const signals = signalInputs
      .filter(([, value]) => hasValue(value) && missingness === "available")
      .map(([signalKind, value, unit], index) =>
        healthSignalSchema.parse({
          signalKind,
          sourcePlatform: input.sourcePlatform,
          sourceProvider: input.sourceProvider,
          sourceDevice: input.sourceDevice ?? input.deviceId ?? "unknown-device",
          capturedAt,
          receivedAt,
          windowStart: input.windowStart,
          windowEnd: input.windowEnd,
          missingness,
          consentScope,
          retentionClass,
          value,
          unit,
          confidence,
          evidenceRef: evidenceRefs[index] ?? evidenceRefs[0],
        }),
      );
    const summary = healthSummarySchema.parse({
      sourcePlatform: input.sourcePlatform,
      sourceProvider: input.sourceProvider,
      sourceDevice: input.sourceDevice ?? input.deviceId ?? "unknown-device",
      capturedAt,
      receivedAt,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      missingness,
      consentScope,
      retentionClass,
      confidence,
      signals,
      summary: summaryFor(input, missingness),
    });

    const snapshot = createHealthSnapshotInputSchema.parse({
      ...input,
      capturedAt,
      receivedAt,
      sourceDevice: input.sourceDevice ?? input.deviceId ?? "unknown-device",
      missingness,
      confidence,
      evidenceRefs,
      summary: summary.summary,
    });
    return { snapshot, summary };
  }

  buildPolicyModifiers(summary: HealthSummary): HealthPolicyModifiers {
    if (summary.missingness !== "available") {
      return {
        dose: "normal",
        energyRecovery: false,
        confidence: summary.confidence,
        reasons: [summary.missingness === "missing" ? "Health data is unavailable." : "Health data is delayed and ignored for dose changes."],
      };
    }

    const sleep = summary.signals.find((signal) => signal.signalKind === "sleep_summary")?.value;
    if (typeof sleep === "number" && sleep < 360) {
      return {
        dose: "energy_recovery",
        energyRecovery: true,
        confidence: summary.confidence,
        reasons: ["Sleep summary is below the user's recovery baseline; offer a smaller next step."],
      };
    }
    return { dose: "normal", energyRecovery: false, confidence: summary.confidence, reasons: ["No health-based dose change is needed."] };
  }

  createCalibrationRecord(input: Omit<HealthCalibrationRecord, "id" | "createdAt" | "absoluteError"> & { id?: string; createdAt?: string }) {
    const now = input.createdAt ?? this.clock().toISOString();
    return healthCalibrationRecordSchema.parse({
      ...input,
      id: input.id ?? `health-calibration-${Date.parse(now)}`,
      createdAt: now,
      absoluteError: Math.abs(energyBandValue[input.predictedEnergyBand] - energyBandValue[input.actualEnergyBand]),
    });
  }

  summarizeCalibration(records: HealthCalibrationRecord[]): HealthCalibrationSummary {
    const byRecommendation: HealthCalibrationSummary["byRecommendation"] = {};
    for (const record of records) {
      const bucket = byRecommendation[record.recommendation] ?? { recordCount: 0, meanAbsoluteError: 0 };
      bucket.recordCount += 1;
      bucket.meanAbsoluteError += record.absoluteError;
      byRecommendation[record.recommendation] = bucket;
    }
    for (const bucket of Object.values(byRecommendation)) bucket.meanAbsoluteError = round(bucket.meanAbsoluteError / bucket.recordCount);
    return {
      recordCount: records.length,
      meanAbsoluteError: records.length > 0 ? round(records.reduce((sum, record) => sum + record.absoluteError, 0) / records.length) : null,
      byRecommendation,
    };
  }
}
