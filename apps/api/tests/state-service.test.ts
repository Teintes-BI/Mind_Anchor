import { describe, expect, it } from "vitest";
import { scoreState, shouldCreateIntervention } from "../src/services/state-service.js";

const signal = (eventType: "idle" | "lock" | "unlock" | "active_app" | "window_switch" | "manual_checkin", payload = {}) => ({
  id: crypto.randomUUID(),
  userId: "demo-user",
  source: "desktop" as const,
  eventType,
  occurredAt: new Date().toISOString(),
  receivedAt: new Date().toISOString(),
  payload,
});

describe("state-service", () => {
  it("reduces focus when idle and switching windows", () => {
    const assessment = scoreState({
      userId: "demo-user",
      signals: [signal("idle"), signal("window_switch"), signal("active_app", { app: "Code" })],
      source: "stub-agent",
    });

    expect(assessment.focusScore).toBeLessThan(70);
    expect(assessment.energyScore).toBeLessThan(68);
  });

  it("creates interventions for low scores", () => {
    const assessment = scoreState({
      userId: "demo-user",
      signals: [signal("idle"), signal("idle"), signal("window_switch"), signal("window_switch")],
      source: "stub-agent",
    });

    expect(shouldCreateIntervention(assessment)).toBe(true);
  });

  it("does not interpret missing or delayed health data as low energy", () => {
    const baseHealth = {
      id: "health-1",
      userId: "demo-user",
      sourcePlatform: "android" as const,
      sourceProvider: "health_connect" as const,
      windowStart: new Date(Date.now() - 3_600_000).toISOString(),
      windowEnd: new Date().toISOString(),
      sleepMinutes: undefined,
      missingness: "missing" as const,
      confidence: 0,
      summary: "Health data is unavailable or has not synced yet.",
      createdAt: new Date().toISOString(),
    };
    const missing = scoreState({ userId: "demo-user", signals: [], latestHealthSnapshot: baseHealth, source: "stub-agent" });
    const delayed = scoreState({
      userId: "demo-user",
      signals: [],
      latestHealthSnapshot: { ...baseHealth, id: "health-2", missingness: "delayed", sleepMinutes: 180 },
      source: "stub-agent",
    });

    expect(missing.energyScore).toBe(68);
    expect(delayed.energyScore).toBe(68);
    expect(missing.healthSummary).toContain("unavailable");
  });
});

