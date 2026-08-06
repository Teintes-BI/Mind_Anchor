import { describe, expect, it } from "vitest";
import {
  createHealthSnapshotInputSchema,
  healthCalibrationRecordSchema,
  healthSignalSchema,
  healthSummarySchema,
} from "@mindanchor/domain";

const timestamps = {
  capturedAt: "2026-08-06T00:00:00.000Z",
  receivedAt: "2026-08-06T00:01:00.000Z",
  windowStart: "2026-08-05T00:00:00.000Z",
  windowEnd: "2026-08-06T00:00:00.000Z",
};

describe("health signal contracts", () => {
  it("accepts a provenance-rich available sleep summary", () => {
    const result = healthSignalSchema.parse({
      signalKind: "sleep_summary",
      sourcePlatform: "android",
      sourceProvider: "health_connect",
      sourceDevice: "pixel-health-connect",
      ...timestamps,
      missingness: "available",
      consentScope: "health_summary",
      retentionClass: "summary",
      value: 420,
      unit: "minutes",
      confidence: 0.82,
      evidenceRef: "health:2026-08-06:sleep",
    });

    expect(result).toMatchObject({ signalKind: "sleep_summary", missingness: "available", value: 420 });
  });

  it("keeps missing data explicit instead of turning it into a zero", () => {
    const result = healthSummarySchema.parse({
      sourcePlatform: "ios",
      sourceProvider: "healthkit",
      sourceDevice: "iphone-healthkit",
      ...timestamps,
      missingness: "missing",
      consentScope: "health_summary",
      retentionClass: "summary",
      confidence: 0,
      signals: [],
      summary: "Health data is unavailable or has not synced yet.",
    });

    expect(result.missingness).toBe("missing");
    expect(result.signals).toEqual([]);
    expect(result.summary).not.toContain("no activity");
  });

  it("records bounded calibration outcomes for a recommendation", () => {
    const result = healthCalibrationRecordSchema.parse({
      id: "calibration-1",
      userId: "demo-user",
      windowStart: timestamps.windowStart,
      windowEnd: timestamps.windowEnd,
      recommendation: "energy_recovery",
      predictedEnergyBand: "low",
      actualEnergyBand: "medium",
      outcome: "completed",
      userRating: 4,
      absoluteError: 0.33,
      evidenceRefs: ["health:2026-08-06:sleep"],
      createdAt: timestamps.receivedAt,
    });

    expect(result.userRating).toBe(4);
    expect(result.absoluteError).toBeCloseTo(0.33);
  });

  it("retains consent provenance and activity fields on persisted snapshots", () => {
    const result = createHealthSnapshotInputSchema.parse({
      userId: "demo-user",
      deviceId: "phone-1",
      sourcePlatform: "android",
      sourceProvider: "health_connect",
      windowStart: timestamps.windowStart,
      windowEnd: timestamps.windowEnd,
      activeMinutes: 42,
      steps: 6800,
      consentRef: "health-consent-1",
      consentScope: "health_summary",
      retentionClass: "summary",
    });

    expect(result).toMatchObject({ activeMinutes: 42, steps: 6800, consentRef: "health-consent-1" });
  });
});
