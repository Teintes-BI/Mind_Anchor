import { describe, expect, it } from "vitest";
import {
  normalizeAutomationOutput,
  normalizeBehaviorConclusionOutput,
  normalizeChiefRouteOutput,
  normalizeProgressFeedbackOutput,
  normalizeRecoveryOutput,
  normalizeReflectionOutput,
  normalizeStateInsightOutput,
  normalizeTaskManagementOutput,
} from "../src/lib/agent-contracts.js";

describe("agent output normalizers", () => {
  it("normalizes rich state insight payloads into the contract", () => {
    const normalized = normalizeStateInsightOutput(
      {
        latestObservedAt: "2026-03-07T01:00:00.000Z",
        stateSummary: "Focus is slipping after several app switches.",
        behavioralState: {
          focusScore: 38,
          energyScore: 54,
          summary: "High context switching detected.",
        },
        emotionState: {
          label: "frustrated",
          confidence: 0.78,
          valence: 42,
        },
        videoState: {
          fatigueScore: 64,
          summary: "Eye strain appears elevated.",
        },
        healthState: {
          summary: "Sleep was shorter than usual.",
        },
        nextAction: "Pause for 5 minutes and resume a smaller step.",
      },
      {
        userId: "demo-user",
        windowStart: "2026-03-07T00:30:00.000Z",
        windowEnd: "2026-03-07T01:00:00.000Z",
        focusScore: 50,
        energyScore: 50,
        moodScore: 50,
        summary: "fallback",
        recommendedAction: "fallback action",
        emotionSummary: undefined,
        emotionConfidence: undefined,
        fatigueScore: undefined,
        videoSummary: undefined,
        healthSummary: undefined,
        activeInputs: ["desktop_signal"],
        mediaFreshness: "fresh",
      },
    );

    expect(normalized.focusScore).toBe(38);
    expect(normalized.energyScore).toBe(54);
    expect(normalized.moodScore).toBe(42);
    expect(normalized.summary).toContain("Focus is slipping");
    expect(normalized.recommendedAction).toContain("Pause for 5 minutes");
    expect(normalized.emotionSummary).toBe("frustrated");
    expect(normalized.emotionConfidence).toBe(0.78);
    expect(normalized.fatigueScore).toBe(64);
    expect(normalized.videoSummary).toBe("Eye strain appears elevated.");
    expect(normalized.healthSummary).toBe("Sleep was shorter than usual.");
  });

  it("normalizes recovery payloads with focusBlock and steps", () => {
    const normalized = normalizeRecoveryOutput(
      {
        mode: "manual_request",
        summary: "Restart with the smallest next action.",
        targetTask: { id: "task-1" },
        focusBlock: {
          durationMinutes: 15,
        },
        steps: [{ summary: "Re-open the current file and finish the first TODO." }],
      },
      {
        reason: "fallback",
        nextStep: "fallback step",
        suggestedMinutes: 25,
        reprioritizedTaskIds: ["task-2"],
      },
    );

    expect(normalized.reason).toBe("manual_request");
    expect(normalized.nextStep).toContain("Re-open the current file");
    expect(normalized.suggestedMinutes).toBe(15);
    expect(normalized.reprioritizedTaskIds).toEqual(["task-1", "task-2"]);
  });

  it("fills reflection period metadata from fallback context", () => {
    const normalized = normalizeReflectionOutput(
      {
        highlights: ["Completed the gateway integration."],
        blockers: ["Several interruptions came from calls."],
        trends: ["Focus improved after shorter blocks."],
        nextSuggestions: ["Keep the 25-minute focus cadence."],
      },
      {
        userId: "demo-user",
        periodType: "weekly",
        periodStart: "2026-03-01T00:00:00.000Z",
        periodEnd: "2026-03-07T00:00:00.000Z",
        highlights: [],
        blockers: [],
        trends: [],
        nextSuggestions: [],
      },
    );

    expect(normalized.userId).toBe("demo-user");
    expect(normalized.periodType).toBe("weekly");
    expect(normalized.periodStart).toBe("2026-03-01T00:00:00.000Z");
    expect(normalized.periodEnd).toBe("2026-03-07T00:00:00.000Z");
    expect(normalized.highlights).toHaveLength(1);
  });

  it("normalizes chief route payloads and clamps them to candidates", () => {
    const normalized = normalizeChiefRouteOutput(
      {
        intent: "recovery_plan",
        nextAgent: "interruption-recovery-agent",
        rationale: "The user needs a recovery plan after focus drift.",
        fallbackMode: "agent",
        confidence: 0.91,
      },
      {
        workflow: "recovery_plan",
        selectedAgent: "interruption-recovery-agent",
        reason: "fallback",
        executionMode: "agent",
        confidence: 0.35,
      },
      ["state-insight-agent", "interruption-recovery-agent", "reflection-coach-agent"],
    );

    expect(normalized.workflow).toBe("recovery_plan");
    expect(normalized.selectedAgent).toBe("interruption-recovery-agent");
    expect(normalized.reason).toContain("recovery plan");
    expect(normalized.executionMode).toBe("agent");
    expect(normalized.confidence).toBe(0.91);
  });

  it("normalizes task ordering and appends missing ids", () => {
    const normalized = normalizeTaskManagementOutput(
      {
        prioritizedTaskIds: ["task-2"],
        planSummary: "Do task-2 first.",
      },
      {
        orderedTaskIds: ["task-1"],
        summary: "fallback",
        suggestedTasks: [],
      },
      [
        {
          id: "task-1",
          userId: "demo-user",
          goalId: "goal-1",
          title: "Task 1",
          status: "todo",
          priority: "medium",
          estimatedMinutes: 25,
          sortOrder: 0,
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
        {
          id: "task-2",
          userId: "demo-user",
          goalId: "goal-1",
          title: "Task 2",
          status: "todo",
          priority: "high",
          estimatedMinutes: 25,
          sortOrder: 1,
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
      ],
    );

    expect(normalized.orderedTaskIds).toEqual(["task-2", "task-1"]);
    expect(normalized.summary).toContain("task-2");
  });

  it("merges progress feedback output into a full dashboard summary", () => {
    const normalized = normalizeProgressFeedbackOutput(
      {
        goalCount: 3,
        latestBehaviorConclusion: {
          summary: "Drift detected.",
        },
      },
      {
        goalCount: 1,
        taskCount: 2,
        completedTaskCount: 0,
        inProgressTaskCount: 1,
        blockedTaskCount: 0,
        completionRate: 0,
        openInterventions: 0,
        suggestedFocusTaskId: "task-1",
        summaryHeadline: "fallback headline",
        activeSession: null,
        latestAssessment: null,
        latestRecoveryPlan: null,
        latestBehaviorConclusion: {
          id: "behavior-1",
          userId: "demo-user",
          riskLevel: "medium",
          summary: "fallback",
          suggestedAction: "fallback action",
          trigger: "fallback",
          recommendedChannel: "desktop_local",
          createdAt: "2026-03-01T00:00:00.000Z",
        },
        latestVideoAssessment: null,
        latestHealthSnapshot: null,
        mobileAudio: {
          enabled: false,
          latestDevice: null,
          latestSession: null,
          latestEmotionAssessment: null,
          latestCallEvent: null,
        },
        edgeDevices: [],
        inbox: [],
        goals: [],
        tasks: [],
      },
    );

    expect(normalized.goalCount).toBe(3);
    expect(normalized.taskCount).toBe(2);
    expect(normalized.inProgressTaskCount).toBe(1);
    expect(normalized.summaryHeadline).toBe("fallback headline");
    expect(normalized.latestBehaviorConclusion?.summary).toBe("Drift detected.");
    expect(normalized.latestBehaviorConclusion?.recommendedChannel).toBe("desktop_local");
  });

  it("normalizes automation payloads into a deliverable notification", () => {
    const normalized = normalizeAutomationOutput(
      {
        headline: "Reset focus",
        copy: "Pause briefly and resume one step.",
        recommendedChannel: "mobile_push",
        delivered: true,
      },
      {
        title: "fallback",
        message: "fallback message",
        channel: "desktop_local",
        deliver: false,
      },
    );

    expect(normalized.title).toBe("Reset focus");
    expect(normalized.message).toContain("resume one step");
    expect(normalized.channel).toBe("mobile_push");
    expect(normalized.deliver).toBe(true);
  });

  it("does not let behavior conclusion risk fall below the fallback severity", () => {
    const normalized = normalizeBehaviorConclusionOutput(
      {
        riskLevel: "low",
        summary: "Model claims this is stable.",
        suggestedAction: "Keep going.",
        recommendedChannel: "desktop_local",
      },
      {
        userId: "demo-user",
        assessmentId: "assessment-1",
        sessionId: "session-1",
        taskId: "task-1",
        riskLevel: "high",
        summary: "Fallback detected a high-risk state.",
        suggestedAction: "Pause immediately.",
        trigger: "high_risk_state",
        recommendedChannel: "mobile_push",
      },
    );

    expect(normalized.riskLevel).toBe("high");
    expect(normalized.summary).toBe("Model claims this is stable.");
    expect(normalized.recommendedChannel).toBe("desktop_local");
  });
});
