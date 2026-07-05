import { describe, expect, it } from "vitest";
import { generateReflectionReport } from "../src/services/reflection-service.js";

describe("reflection-service", () => {
  it("generates highlights, blockers, trends, and suggestions", () => {
    const now = new Date().toISOString();
    const report = generateReflectionReport({
      userId: "demo-user",
      periodType: "weekly",
      goals: [
        {
          id: "goal-1",
          userId: "demo-user",
          title: "Ship MVP",
          description: "",
          status: "active",
          taskSummary: { total: 2, completed: 1 },
          createdAt: now,
          updatedAt: now,
        },
      ],
      tasks: [
        {
          id: "task-1",
          userId: "demo-user",
          goalId: "goal-1",
          title: "Build API",
          status: "done",
          priority: "high",
          estimatedMinutes: 45,
          sortOrder: 0,
          createdAt: now,
          updatedAt: now,
        },
      ],
      sessions: [
        {
          id: "session-1",
          userId: "demo-user",
          taskId: "task-1",
          goalId: "goal-1",
          status: "completed",
          startedAt: now,
          endedAt: now,
          interruptionCount: 0,
          summary: "done",
        },
      ],
      assessments: [
        {
          id: "assessment-1",
          userId: "demo-user",
          windowStart: now,
          windowEnd: now,
          focusScore: 70,
          energyScore: 60,
          moodScore: 65,
          summary: "stable",
          recommendedAction: "continue",
          source: "stub-agent",
          createdAt: now,
        },
      ],
      emotionAssessments: [
        {
          id: "emotion-1",
          userId: "demo-user",
          deviceId: "android-1",
          sessionId: "mobile-session-1",
          chunkSequence: 1,
          windowStart: now,
          windowEnd: now,
          emotionLabel: "neutral",
          valenceScore: 62,
          arousalScore: 48,
          stressScore: 34,
          confidence: 0.7,
          summary: "steady",
          source: "desktop-stub",
          createdAt: now,
        },
      ],
      callEvents: [
        {
          id: "call-1",
          userId: "demo-user",
          deviceId: "android-1",
          direction: "incoming",
          status: "ringing",
          occurredAt: now,
          createdAt: now,
        },
      ],
    });

    expect(report.highlights.length).toBeGreaterThan(0);
    expect(report.blockers.length).toBeGreaterThan(0);
    expect(report.trends.some((entry) => entry.includes("Average focus score"))).toBe(true);
    expect(report.nextSuggestions.length).toBeGreaterThan(0);
  });
});
