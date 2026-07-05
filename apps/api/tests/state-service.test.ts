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
});

