import { describe, expect, it } from "vitest";
import { HealthSignalService } from "../src/services/wayfinder/health-signal-service.js";

const baseInput = {
  userId: "demo-user",
  deviceId: "pixel-1",
  sourcePlatform: "android" as const,
  sourceProvider: "health_connect" as const,
  windowStart: "2026-08-05T00:00:00.000Z",
  windowEnd: "2026-08-06T00:00:00.000Z",
  sleepMinutes: 330,
  activeMinutes: 42,
  restingHeartRate: 62,
};

describe("HealthSignalService", () => {
  it("normalizes a Health Connect summary into bounded signals and a safe policy modifier", () => {
    const service = new HealthSignalService(() => new Date("2026-08-06T01:00:00.000Z"));
    const result = service.normalize(baseInput);

    expect(result.summary.missingness).toBe("available");
    expect(result.summary.signals.map((signal) => signal.signalKind)).toEqual([
      "sleep_summary",
      "activity_summary",
      "resting_hr_summary",
    ]);
    expect(service.buildPolicyModifiers(result.summary)).toMatchObject({
      dose: "energy_recovery",
      energyRecovery: true,
    });
    expect(result.summary.summary).not.toMatch(/diagnos|病|必须停止/i);
  });

  it.each([
    { sourcePlatform: "ios" as const, sourceProvider: "healthkit" as const, sourceDevice: "iphone-healthkit" },
    { sourcePlatform: "android" as const, sourceProvider: "vendor_sdk" as const, sourceDevice: "watch-vendor-hub" },
  ])("preserves approved $sourceProvider provenance while normalizing a summary", (source) => {
    const service = new HealthSignalService(() => new Date("2026-08-06T01:00:00.000Z"));
    const result = service.normalize({ ...baseInput, ...source });

    expect(result.summary.sourcePlatform).toBe(source.sourcePlatform);
    expect(result.summary.sourceProvider).toBe(source.sourceProvider);
    expect(result.summary.sourceDevice).toBe(source.sourceDevice);
    expect(result.summary.signals.every((signal) => signal.sourceProvider === source.sourceProvider)).toBe(true);
  });

  it("marks no readings as missing without inferring inactivity", () => {
    const service = new HealthSignalService(() => new Date("2026-08-06T01:00:00.000Z"));
    const result = service.normalize({ ...baseInput, sleepMinutes: undefined, activeMinutes: undefined, restingHeartRate: undefined, steps: undefined });

    expect(result.summary.missingness).toBe("missing");
    expect(result.summary.signals).toHaveLength(0);
    expect(service.buildPolicyModifiers(result.summary).dose).toBe("normal");
    expect(result.summary.summary).toContain("unavailable");
  });

  it("marks old readings as delayed and ignores them for dose changes", () => {
    const service = new HealthSignalService(() => new Date("2026-08-08T01:00:00.000Z"));
    const result = service.normalize(baseInput);

    expect(result.summary.missingness).toBe("delayed");
    expect(result.summary.signals).toHaveLength(0);
    expect(service.buildPolicyModifiers(result.summary).dose).toBe("normal");
  });

  it("calculates a bounded 14-day calibration summary", () => {
    const service = new HealthSignalService(() => new Date("2026-08-06T01:00:00.000Z"));
    const first = service.createCalibrationRecord({
      userId: "demo-user",
      windowStart: baseInput.windowStart,
      windowEnd: baseInput.windowEnd,
      recommendation: "energy_recovery",
      predictedEnergyBand: "low",
      actualEnergyBand: "medium",
      outcome: "completed",
      userRating: 4,
      evidenceRefs: ["health:one"],
    });
    const second = service.createCalibrationRecord({
      userId: "demo-user",
      windowStart: baseInput.windowStart,
      windowEnd: baseInput.windowEnd,
      recommendation: "continue",
      predictedEnergyBand: "high",
      actualEnergyBand: "high",
      outcome: "completed",
      evidenceRefs: ["health:two"],
    });

    expect(service.summarizeCalibration([first, second])).toMatchObject({
      recordCount: 2,
      meanAbsoluteError: 0.25,
      byRecommendation: {
        energy_recovery: { recordCount: 1, meanAbsoluteError: 0.5 },
        continue: { recordCount: 1, meanAbsoluteError: 0 },
      },
    });
  });
});
