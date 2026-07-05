import { describe, expect, it } from "vitest";
import { buildRecoveryPlan, reprioritizeTasks } from "../src/services/task-service.js";

const task = (overrides = {}) => ({
  id: crypto.randomUUID(),
  userId: "demo-user",
  goalId: "goal-1",
  title: "Task",
  status: "todo" as const,
  priority: "medium" as const,
  estimatedMinutes: 25,
  sortOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("task-service", () => {
  it("reprioritizes unfinished higher-priority tasks to the top", () => {
    const tasks = reprioritizeTasks(
      [
        task({ id: "1", title: "Low", priority: "low", sortOrder: 2 }),
        task({ id: "2", title: "Critical", priority: "critical", sortOrder: 1 }),
        task({ id: "3", title: "Done", priority: "high", status: "done", sortOrder: 0 }),
      ],
      "interruption",
    );

    expect(tasks[0]?.id).toBe("2");
    expect(tasks.at(-1)?.id).toBe("3");
  });

  it("builds a short recovery plan when energy is low", () => {
    const plan = buildRecoveryPlan({
      userId: "demo-user",
      sessionId: "session-1",
      taskId: "1",
      tasks: [task({ id: "1", title: "Resume work" })],
      latestAssessment: {
        id: "assessment-1",
        userId: "demo-user",
        windowStart: new Date().toISOString(),
        windowEnd: new Date().toISOString(),
        focusScore: 30,
        energyScore: 20,
        moodScore: 50,
        summary: "low",
        recommendedAction: "rest",
        source: "stub-agent",
        createdAt: new Date().toISOString(),
      },
    });

    expect(plan.reason).toBe("energy_drop");
    expect(plan.suggestedMinutes).toBe(10);
  });
});

