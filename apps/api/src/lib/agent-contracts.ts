import {
  agentTeamAgentIds,
  behaviorConclusionSchema,
  coachFrontAgentStateSchema,
  dashboardSummarySchema,
  notificationEndpointSchema,
  reflectionReportSchema,
  type Task,
} from "@mindanchor/domain";
import { z } from "zod";

export const visiblePersonaTargets = agentTeamAgentIds;
export const coachFrontStateOutputSchema = coachFrontAgentStateSchema;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const asObject = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const getPath = (value: unknown, ...path: string[]) => {
  let current: unknown = value;
  for (const segment of path) {
    const record = asObject(current);
    if (!record) {
      return undefined;
    }
    current = record[segment];
  }
  return current;
};

const asString = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const asNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const asStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      const record = asObject(item);
      if (!record) {
        return undefined;
      }

      return (
        asString(record.summary) ??
        asString(record.title) ??
        asString(record.label) ??
        asString(record.action) ??
        asString(record.step) ??
        asString(record.text)
      );
    })
    .filter((item): item is string => Boolean(item));

  return normalized.length > 0 ? normalized : undefined;
};

const pickString = (...values: unknown[]) => values.map(asString).find(Boolean);
const pickNumber = (...values: unknown[]) => values.map(asNumber).find((value) => value !== undefined);

const dedupeStrings = (values: Array<string | undefined>) =>
  [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];

type ValuePath = [string, ...string[]];

const hasPathValue = (value: unknown, path: ValuePath) => getPath(value, ...path) !== undefined;

const assertClusterPayloadSignals = (value: unknown, contractName: string, signalPaths: readonly ValuePath[]) => {
  if (signalPaths.some((path) => hasPathValue(value, path))) {
    return;
  }

  throw new Error(`Cluster ${contractName} payload failed contract signal validation.`);
};

const chiefRouteClusterSignalPaths: ValuePath[] = [
  ["workflow"],
  ["selectedAgent"],
  ["reason"],
  ["executionMode"],
  ["nextAgent"],
  ["agent"],
  ["route", "target"],
  ["route", "reason"],
];

const stateInsightClusterSignalPaths: ValuePath[] = [
  ["summary"],
  ["stateSummary"],
  ["primaryState"],
  ["recommendedAction"],
  ["nextAction"],
  ["focusScore"],
  ["energyScore"],
  ["moodScore"],
  ["behavioralState"],
  ["emotionState"],
  ["videoState"],
  ["healthState"],
];

const recoveryClusterSignalPaths: ValuePath[] = [
  ["reason"],
  ["nextStep"],
  ["suggestedMinutes"],
  ["reprioritizedTaskIds"],
  ["mode"],
  ["summary"],
  ["focusBlock"],
  ["steps"],
  ["assessment"],
];

const reflectionClusterSignalPaths: ValuePath[] = [
  ["userId"],
  ["periodType"],
  ["periodStart"],
  ["periodEnd"],
  ["period", "start"],
  ["period", "end"],
  ["highlights"],
  ["blockers"],
  ["trends"],
  ["nextSuggestions"],
  ["suggestions"],
];

const taskManagementClusterSignalPaths: ValuePath[] = [
  ["orderedTaskIds"],
  ["taskIds"],
  ["prioritizedTaskIds"],
  ["recommendedOrder"],
  ["summary"],
  ["planSummary"],
  ["nextStep"],
  ["rationale"],
  ["suggestedTasks"],
  ["taskDrafts"],
];

const progressFeedbackClusterSignalPaths: ValuePath[] = [
  ["goalCount"],
  ["taskCount"],
  ["completedTaskCount"],
  ["inProgressTaskCount"],
  ["blockedTaskCount"],
  ["completionRate"],
  ["openInterventions"],
  ["suggestedFocusTaskId"],
  ["summaryHeadline"],
  ["headline"],
  ["summary"],
  ["latestAssessment"],
  ["goals"],
  ["tasks"],
];

const automationClusterSignalPaths: ValuePath[] = [
  ["title"],
  ["headline"],
  ["subject"],
  ["message"],
  ["copy"],
  ["summary"],
  ["channel"],
  ["recommendedChannel"],
  ["deliver"],
  ["delivered"],
  ["notification"],
];

const behaviorConclusionClusterSignalPaths: ValuePath[] = [
  ["userId"],
  ["riskLevel"],
  ["severity"],
  ["summary"],
  ["headline"],
  ["conclusion"],
  ["message"],
  ["suggestedAction"],
  ["recommendedAction"],
  ["nextAction"],
  ["action"],
  ["trigger"],
  ["reason"],
  ["signal"],
  ["recommendedChannel"],
  ["channel"],
];

const normalizeActiveInput = (value: string) => {
  switch (value.trim().toLowerCase()) {
    case "desktop":
    case "desktop_signal":
      return "desktop_signal";
    case "audio":
    case "audio_emotion":
    case "emotion":
    case "audio_server_inference":
      return "audio_server_inference";
    case "video":
    case "video_state":
    case "video_server_inference":
      return "video_server_inference";
    case "health":
    case "health_snapshot":
    case "health_bridge":
      return "health_bridge";
    default:
      return value;
  }
};

export const stateInsightOutputSchema = z.object({
  userId: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  focusScore: z.number(),
  energyScore: z.number(),
  moodScore: z.number(),
  summary: z.string(),
  recommendedAction: z.string(),
  emotionSummary: z.string().optional(),
  emotionConfidence: z.number().optional(),
  fatigueScore: z.number().optional(),
  videoSummary: z.string().optional(),
  healthSummary: z.string().optional(),
  activeInputs: z.array(z.string()).optional(),
  mediaFreshness: z.string().optional(),
});

export const interruptionRecoveryOutputSchema = z.object({
  reason: z.string(),
  nextStep: z.string(),
  suggestedMinutes: z.number(),
  reprioritizedTaskIds: z.array(z.string()),
});

export const reflectionOutputSchema = reflectionReportSchema.omit({
  id: true,
  createdAt: true,
});

export const chiefRouteWorkflowSchema = z.enum([
  "state_assessment",
  "task_management",
  "progress_summary",
  "recovery_plan",
  "reflection_report",
  "notification_dispatch",
]);

export const chiefRouteAgentSchema = z.enum([
  "state-insight-agent",
  "task-management-agent",
  "progress-feedback-agent",
  "interruption-recovery-agent",
  "reflection-coach-agent",
  "automation-agent",
]);

export const chiefRouteExecutionModeSchema = z.enum(["agent", "stub"]);

export const chiefRouteOutputSchema = z.object({
  workflow: chiefRouteWorkflowSchema,
  selectedAgent: chiefRouteAgentSchema,
  reason: z.string(),
  executionMode: chiefRouteExecutionModeSchema,
  confidence: z.number().optional(),
});

export const taskManagementOutputSchema = z.object({
  orderedTaskIds: z.array(z.string()),
  summary: z.string(),
  suggestedTasks: z
    .array(
      z.object({
        title: z.string(),
        priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
        estimatedMinutes: z.number(),
        dueAt: z.string().optional(),
      }),
    )
    .default([]),
});

export const progressFeedbackOutputSchema = dashboardSummarySchema;

export const automationOutputSchema = z.object({
  title: z.string(),
  message: z.string(),
  channel: notificationEndpointSchema,
  deliver: z.boolean(),
});

export const behaviorConclusionOutputSchema = behaviorConclusionSchema.omit({
  id: true,
  createdAt: true,
});

export const STATE_INSIGHT_SYSTEM_PROMPT = [
  "You are the state-insight-agent for MindAnchor.",
  "Return exactly one JSON object and nothing else.",
  "You must use these exact keys and no renames:",
  '{"userId":"string","windowStart":"ISO-8601","windowEnd":"ISO-8601","focusScore":0,"energyScore":0,"moodScore":0,"summary":"string","recommendedAction":"string","emotionSummary":"string?","emotionConfidence":0.0,"fatigueScore":0,"videoSummary":"string?","healthSummary":"string?","activeInputs":["string"],"mediaFreshness":"string?"}.',
  "Do not invent alternative top-level keys such as latestObservedAt, stateSummary, primaryState, behavioralState, emotionState, videoState, or healthState unless you also map them into the required keys above.",
  "Always output required keys even when evidence is weak, and keep numeric scores within 0 to 100 except emotionConfidence which must be within 0 to 1.",
].join(" ");

export const CHIEF_ROUTE_SYSTEM_PROMPT = [
  "You are the chief-agent for MindAnchor.",
  "Return exactly one JSON object and nothing else.",
  'Use this exact shape: {"workflow":"state_assessment|task_management|progress_summary|recovery_plan|reflection_report|notification_dispatch","selectedAgent":"state-insight-agent|task-management-agent|progress-feedback-agent|interruption-recovery-agent|reflection-coach-agent|automation-agent","reason":"string","executionMode":"agent|stub","confidence":0.0}.',
  "Respect the routeCandidates provided by the caller and select only one candidate from that list.",
  "Choose executionMode=stub only when the request should degrade gracefully instead of calling a downstream agent.",
  "Never ask for typed text, screenshots, chat contents, or raw private content that is outside the provided structured context.",
].join(" ");

export const INTERRUPTION_RECOVERY_SYSTEM_PROMPT = [
  "You are the interruption-recovery-agent for MindAnchor.",
  "Return exactly one JSON object and nothing else.",
  'Use this exact shape: {"reason":"string","nextStep":"string","suggestedMinutes":25,"reprioritizedTaskIds":["task-id"]}.',
  "Do not return alternative keys like mode, targetTask, focusBlock, steps, checkpoints, fallback, or assessment unless you also map them into the exact required keys.",
  "suggestedMinutes must be a positive number and reprioritizedTaskIds must be an array of task ids ordered by recommended priority.",
].join(" ");

export const REFLECTION_SYSTEM_PROMPT = [
  "You are the reflection-coach-agent for MindAnchor.",
  "Return exactly one JSON object and nothing else.",
  'Use this exact shape: {"userId":"string","periodType":"weekly|monthly","periodStart":"ISO-8601","periodEnd":"ISO-8601","highlights":["string"],"blockers":["string"],"trends":["string"],"nextSuggestions":["string"]}.',
  "Do not omit periodType, periodStart, or periodEnd.",
  "All four list fields must always be arrays, even if they contain only one item or are empty.",
].join(" ");

export const TASK_MANAGEMENT_SYSTEM_PROMPT = [
  "You are the task-management-agent for MindAnchor.",
  "Return exactly one JSON object and nothing else.",
  'Use this exact shape: {"orderedTaskIds":["task-id"],"summary":"string","suggestedTasks":[{"title":"string","priority":"critical|high|medium|low","estimatedMinutes":25,"dueAt":"ISO-8601 optional"}]}.',
  "orderedTaskIds must contain only task ids from the provided task list, in the exact recommended execution order.",
  "When the goal is new and there are no tasks yet, suggestedTasks should contain 2 to 5 concrete starter tasks.",
  "Do not rename keys to priorities, plan, suggestedTasks, roadmap, or nextSteps.",
].join(" ");

export const PROGRESS_FEEDBACK_SYSTEM_PROMPT = [
  "You are the progress-feedback-agent for MindAnchor.",
  "Return exactly one JSON object and nothing else.",
  "The object must be compatible with the dashboard summary schema used by the client.",
  "Keep the top-level keys aligned to the provided dashboard shape: goalCount, taskCount, completedTaskCount, inProgressTaskCount, blockedTaskCount, completionRate, openInterventions, suggestedFocusTaskId, summaryHeadline, activeSession, latestAssessment, latestRecoveryPlan, latestBehaviorConclusion, latestVideoAssessment, latestHealthSnapshot, mobileAudio, edgeDevices, inbox, goals, tasks.",
  "If you are uncertain about a nested structure, mirror the provided value instead of inventing a new shape.",
].join(" ");

export const AUTOMATION_SYSTEM_PROMPT = [
  "You are the automation-agent for MindAnchor.",
  "Return exactly one JSON object and nothing else.",
  'Use this exact shape: {"title":"string","message":"string","channel":"mobile_push|desktop_local|feishu_bot|telegram_bot","deliver":true}.',
  "Keep the copy concise and action-oriented.",
  "Use deliver=false when no notification should be emitted.",
].join(" ");

export const BEHAVIOR_CONCLUSION_SYSTEM_PROMPT = [
  "You are the automation-agent for MindAnchor.",
  "Return exactly one JSON object and nothing else.",
  'Use this exact shape: {"userId":"string","assessmentId":"string optional","sessionId":"string optional","taskId":"string optional","riskLevel":"low|medium|high","summary":"string","suggestedAction":"string","trigger":"string","recommendedChannel":"mobile_push|desktop_local|feishu_bot|telegram_bot"}.',
  "This output is the structured business conclusion that will later feed inbox/notification decisions.",
  "Keep summary concise but specific, and keep recommendedChannel realistic for the current risk level and context.",
].join(" ");

export const normalizeStateInsightOutput = (
  raw: unknown,
  fallback: z.infer<typeof stateInsightOutputSchema>,
): z.infer<typeof stateInsightOutputSchema> => {
  const summary =
    pickString(
      getPath(raw, "summary"),
      getPath(raw, "stateSummary"),
      getPath(raw, "behavioralState", "summary"),
      getPath(raw, "primaryState"),
    ) ??
    (dedupeStrings([
      pickString(getPath(raw, "behavioralState", "summary")),
      pickString(getPath(raw, "emotionState", "summary"), getPath(raw, "emotionState", "label")),
      pickString(getPath(raw, "videoState", "summary"), getPath(raw, "videoState", "label")),
      pickString(getPath(raw, "healthState", "summary"), getPath(raw, "healthState", "label")),
      pickString(getPath(raw, "primaryState")),
    ]).join(" ") ||
      fallback.summary);

  const recommendedAction =
    pickString(
      getPath(raw, "recommendedAction"),
      getPath(raw, "nextAction"),
      getPath(raw, "action"),
      getPath(raw, "focusBlock", "nextStep"),
      asStringArray(getPath(raw, "steps"))?.[0],
    ) ?? fallback.recommendedAction;

  const activeInputs =
    (
      asStringArray(getPath(raw, "activeInputs")) ??
      dedupeStrings([
        ...(fallback.activeInputs ?? []),
        pickString(getPath(raw, "emotionState"), getPath(raw, "emotionSummary")) ? "audio_server_inference" : undefined,
        pickString(getPath(raw, "videoState"), getPath(raw, "videoSummary")) ? "video_server_inference" : undefined,
        pickString(getPath(raw, "healthState"), getPath(raw, "healthSummary")) ? "health_bridge" : undefined,
      ])
    ).map(normalizeActiveInput);

  return {
    userId: pickString(getPath(raw, "userId")) ?? fallback.userId,
    windowStart:
      pickString(getPath(raw, "windowStart"), getPath(raw, "timeWindow", "start"), getPath(raw, "window", "start")) ??
      fallback.windowStart,
    windowEnd:
      pickString(
        getPath(raw, "windowEnd"),
        getPath(raw, "timeWindow", "end"),
        getPath(raw, "window", "end"),
        getPath(raw, "latestObservedAt"),
      ) ?? fallback.windowEnd,
    focusScore: clamp(
      Math.round(
        pickNumber(
          getPath(raw, "focusScore"),
          getPath(raw, "behavioralState", "focusScore"),
          getPath(raw, "scores", "focusScore"),
          getPath(raw, "scores", "focus"),
        ) ?? fallback.focusScore,
      ),
      0,
      100,
    ),
    energyScore: clamp(
      Math.round(
        pickNumber(
          getPath(raw, "energyScore"),
          getPath(raw, "behavioralState", "energyScore"),
          getPath(raw, "emotionState", "arousalScore"),
          getPath(raw, "emotionState", "arousal"),
        ) ?? fallback.energyScore,
      ),
      0,
      100,
    ),
    moodScore: clamp(
      Math.round(
        pickNumber(
          getPath(raw, "moodScore"),
          getPath(raw, "emotionState", "moodScore"),
          getPath(raw, "emotionState", "valenceScore"),
          getPath(raw, "emotionState", "valence"),
        ) ?? fallback.moodScore,
      ),
      0,
      100,
    ),
    summary,
    recommendedAction,
    emotionSummary:
      pickString(
        getPath(raw, "emotionSummary"),
        getPath(raw, "emotionState", "summary"),
        getPath(raw, "emotionState", "label"),
      ) ?? fallback.emotionSummary,
    emotionConfidence:
      pickNumber(getPath(raw, "emotionConfidence"), getPath(raw, "emotionState", "confidence"), getPath(raw, "confidence")) !==
      undefined
        ? clamp(
            pickNumber(
              getPath(raw, "emotionConfidence"),
              getPath(raw, "emotionState", "confidence"),
              getPath(raw, "confidence"),
            ) ?? fallback.emotionConfidence ?? 0,
            0,
            1,
          )
        : fallback.emotionConfidence,
    fatigueScore:
      pickNumber(getPath(raw, "fatigueScore"), getPath(raw, "videoState", "fatigueScore")) !== undefined
        ? clamp(
            Math.round(
              pickNumber(getPath(raw, "fatigueScore"), getPath(raw, "videoState", "fatigueScore")) ?? fallback.fatigueScore ?? 0,
            ),
            0,
            100,
          )
        : fallback.fatigueScore,
    videoSummary:
      pickString(getPath(raw, "videoSummary"), getPath(raw, "videoState", "summary"), getPath(raw, "videoState", "label")) ??
      fallback.videoSummary,
    healthSummary:
      pickString(getPath(raw, "healthSummary"), getPath(raw, "healthState", "summary"), getPath(raw, "healthState", "label")) ??
      fallback.healthSummary,
    activeInputs: activeInputs.length > 0 ? activeInputs : fallback.activeInputs,
    mediaFreshness:
      pickString(getPath(raw, "mediaFreshness"), getPath(raw, "multimodalCoverage"), getPath(raw, "latestObservedAt")) ??
      fallback.mediaFreshness,
  };
};

export const assertChiefRouteClusterPayload = (raw: unknown) =>
  assertClusterPayloadSignals(raw, "chief-route", chiefRouteClusterSignalPaths);

export const assertStateInsightClusterPayload = (raw: unknown) =>
  assertClusterPayloadSignals(raw, "state-insight", stateInsightClusterSignalPaths);

export const assertRecoveryClusterPayload = (raw: unknown) =>
  assertClusterPayloadSignals(raw, "recovery", recoveryClusterSignalPaths);

export const assertReflectionClusterPayload = (raw: unknown) =>
  assertClusterPayloadSignals(raw, "reflection", reflectionClusterSignalPaths);

export const assertTaskManagementClusterPayload = (raw: unknown) =>
  assertClusterPayloadSignals(raw, "task-management", taskManagementClusterSignalPaths);

export const assertProgressFeedbackClusterPayload = (raw: unknown) =>
  assertClusterPayloadSignals(raw, "progress-feedback", progressFeedbackClusterSignalPaths);

export const assertAutomationClusterPayload = (raw: unknown) =>
  assertClusterPayloadSignals(raw, "automation", automationClusterSignalPaths);

export const assertBehaviorConclusionClusterPayload = (raw: unknown) =>
  assertClusterPayloadSignals(raw, "behavior-conclusion", behaviorConclusionClusterSignalPaths);

export const normalizeRecoveryOutput = (
  raw: unknown,
  fallback: z.infer<typeof interruptionRecoveryOutputSchema>,
): z.infer<typeof interruptionRecoveryOutputSchema> => {
  const steps = asStringArray(getPath(raw, "steps"));
  const targetTaskId = pickString(getPath(raw, "targetTask", "id"), getPath(raw, "targetTaskId"));
  const taskIds = asStringArray(getPath(raw, "reprioritizedTaskIds"));

  return {
    reason: pickString(getPath(raw, "reason"), getPath(raw, "mode"), getPath(raw, "summary")) ?? fallback.reason,
    nextStep:
      pickString(getPath(raw, "nextStep"), getPath(raw, "focusBlock", "nextStep"), steps?.[0], getPath(raw, "summary")) ??
      fallback.nextStep,
    suggestedMinutes: Math.max(
      1,
      Math.round(
        pickNumber(
          getPath(raw, "suggestedMinutes"),
          getPath(raw, "focusBlock", "durationMinutes"),
          getPath(raw, "focusBlock", "minutes"),
          getPath(raw, "assessment", "suggestedMinutes"),
        ) ?? fallback.suggestedMinutes,
      ),
    ),
    reprioritizedTaskIds: taskIds ?? dedupeStrings([targetTaskId, ...fallback.reprioritizedTaskIds]),
  };
};

export const normalizeReflectionOutput = (
  raw: unknown,
  fallback: z.infer<typeof reflectionOutputSchema>,
): z.infer<typeof reflectionOutputSchema> => ({
  userId: pickString(getPath(raw, "userId")) ?? fallback.userId,
  periodType:
    (pickString(getPath(raw, "periodType")) as z.infer<typeof reflectionOutputSchema>["periodType"] | undefined) ??
    fallback.periodType,
  periodStart: pickString(getPath(raw, "periodStart"), getPath(raw, "period", "start")) ?? fallback.periodStart,
  periodEnd: pickString(getPath(raw, "periodEnd"), getPath(raw, "period", "end")) ?? fallback.periodEnd,
  highlights: asStringArray(getPath(raw, "highlights")) ?? fallback.highlights,
  blockers: asStringArray(getPath(raw, "blockers")) ?? fallback.blockers,
  trends: asStringArray(getPath(raw, "trends")) ?? fallback.trends,
  nextSuggestions:
    asStringArray(getPath(raw, "nextSuggestions")) ??
    asStringArray(getPath(raw, "suggestions")) ??
    fallback.nextSuggestions,
});

export const normalizeChiefRouteOutput = (
  raw: unknown,
  fallback: z.infer<typeof chiefRouteOutputSchema>,
  routeCandidates: readonly z.infer<typeof chiefRouteAgentSchema>[],
): z.infer<typeof chiefRouteOutputSchema> => {
  const requestedAgent = pickString(
    getPath(raw, "selectedAgent"),
    getPath(raw, "nextAgent"),
    getPath(raw, "agent"),
    getPath(raw, "route", "target"),
  );
  const selectedAgent =
    routeCandidates.find((candidate) => candidate === requestedAgent) ??
    routeCandidates.find((candidate) => candidate === fallback.selectedAgent) ??
    fallback.selectedAgent;

  const executionModeValue = pickString(
    getPath(raw, "executionMode"),
    getPath(raw, "fallbackMode"),
    getPath(raw, "degradationMode"),
  );
  const executionMode = executionModeValue === "stub" ? "stub" : "agent";

  return {
    workflow:
      (pickString(getPath(raw, "workflow"), getPath(raw, "intent")) as z.infer<typeof chiefRouteWorkflowSchema> | undefined) ??
      fallback.workflow,
    selectedAgent,
    reason:
      pickString(
        getPath(raw, "reason"),
        getPath(raw, "summary"),
        getPath(raw, "rationale"),
        getPath(raw, "route", "reason"),
      ) ?? fallback.reason,
    executionMode,
    confidence:
      pickNumber(getPath(raw, "confidence"), getPath(raw, "route", "confidence")) !== undefined
        ? clamp(pickNumber(getPath(raw, "confidence"), getPath(raw, "route", "confidence")) ?? 0, 0, 1)
        : fallback.confidence,
  };
};

export const normalizeTaskManagementOutput = (
  raw: unknown,
  fallback: z.infer<typeof taskManagementOutputSchema>,
  tasks: Task[],
): z.infer<typeof taskManagementOutputSchema> => {
  const allowedIds = new Set(tasks.map((task) => task.id));
  const rawIds =
    asStringArray(getPath(raw, "orderedTaskIds")) ??
    asStringArray(getPath(raw, "taskIds")) ??
    asStringArray(getPath(raw, "prioritizedTaskIds")) ??
    asStringArray(getPath(raw, "recommendedOrder")) ??
    [];
  const orderedTaskIds = dedupeStrings([
    ...rawIds.filter((taskId) => allowedIds.has(taskId)),
    ...fallback.orderedTaskIds.filter((taskId) => allowedIds.has(taskId)),
    ...tasks.map((task) => task.id),
  ]);

  const suggestedTasks =
    ((Array.isArray(getPath(raw, "suggestedTasks")) ? getPath(raw, "suggestedTasks") : getPath(raw, "taskDrafts")) as unknown[] | undefined)
      ?.map((item) => {
        const record = asObject(item);
        if (!record) {
          return null;
        }

        const title = pickString(record.title, record.name, record.taskTitle);
        if (!title) {
          return null;
        }

        const priorityValue = pickString(record.priority) ?? "medium";
        const priority: "critical" | "high" | "medium" | "low" =
          priorityValue === "critical" || priorityValue === "high" || priorityValue === "medium" || priorityValue === "low"
            ? priorityValue
            : "medium";
        return {
          title,
          priority,
          estimatedMinutes: Math.max(5, Math.round(asNumber(record.estimatedMinutes) ?? asNumber(record.minutes) ?? 25)),
          dueAt: asString(record.dueAt),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)) ?? fallback.suggestedTasks;

  return {
    orderedTaskIds,
    summary:
      pickString(getPath(raw, "summary"), getPath(raw, "planSummary"), getPath(raw, "nextStep"), getPath(raw, "rationale")) ??
      fallback.summary,
    suggestedTasks,
  };
};

export const normalizeProgressFeedbackOutput = (
  raw: unknown,
  fallback: z.infer<typeof progressFeedbackOutputSchema>,
): z.infer<typeof progressFeedbackOutputSchema> => {
  const record = asObject(raw) ?? {};

  const mergeObject = <T extends Record<string, unknown> | null>(base: T, candidate: unknown): T => {
    if (base === null) {
      return (asObject(candidate) as T) ?? base;
    }

    const candidateRecord = asObject(candidate);
    return candidateRecord ? ({ ...base, ...candidateRecord } as T) : base;
  };

  return {
    goalCount: Math.max(0, Math.round(pickNumber(record.goalCount) ?? fallback.goalCount)),
    taskCount: Math.max(0, Math.round(pickNumber(record.taskCount) ?? fallback.taskCount)),
    completedTaskCount: Math.max(0, Math.round(pickNumber(record.completedTaskCount) ?? fallback.completedTaskCount)),
    inProgressTaskCount: Math.max(0, Math.round(pickNumber(record.inProgressTaskCount) ?? fallback.inProgressTaskCount)),
    blockedTaskCount: Math.max(0, Math.round(pickNumber(record.blockedTaskCount) ?? fallback.blockedTaskCount)),
    completionRate: clamp(pickNumber(record.completionRate) ?? fallback.completionRate, 0, 1),
    openInterventions: Math.max(0, Math.round(pickNumber(record.openInterventions) ?? fallback.openInterventions)),
    suggestedFocusTaskId: pickString(record.suggestedFocusTaskId) ?? fallback.suggestedFocusTaskId,
    summaryHeadline: pickString(record.summaryHeadline, record.headline, record.summary) ?? fallback.summaryHeadline,
    coachFrontAgent: mergeObject(fallback.coachFrontAgent, record.coachFrontAgent),
    activeSession: mergeObject(fallback.activeSession, record.activeSession),
    latestAssessment: mergeObject(fallback.latestAssessment, record.latestAssessment),
    latestRecoveryPlan: mergeObject(fallback.latestRecoveryPlan, record.latestRecoveryPlan),
    latestBehaviorConclusion: mergeObject(fallback.latestBehaviorConclusion, record.latestBehaviorConclusion),
    latestVideoAssessment: mergeObject(fallback.latestVideoAssessment, record.latestVideoAssessment),
    latestHealthSnapshot: mergeObject(fallback.latestHealthSnapshot, record.latestHealthSnapshot),
    mobileAudio: mergeObject(fallback.mobileAudio, record.mobileAudio),
    edgeDevices: Array.isArray(record.edgeDevices) ? record.edgeDevices : fallback.edgeDevices,
    inbox: Array.isArray(record.inbox) ? record.inbox : fallback.inbox,
    goals: Array.isArray(record.goals) ? record.goals : fallback.goals,
    tasks: Array.isArray(record.tasks) ? record.tasks : fallback.tasks,
  };
};

export const normalizeAutomationOutput = (
  raw: unknown,
  fallback: z.infer<typeof automationOutputSchema>,
): z.infer<typeof automationOutputSchema> => {
  const channel = pickString(getPath(raw, "channel"), getPath(raw, "recommendedChannel"), getPath(raw, "notification", "channel"));
  const deliverValue = getPath(raw, "deliver") ?? getPath(raw, "delivered") ?? getPath(raw, "notification", "deliver");

  return {
    title: pickString(getPath(raw, "title"), getPath(raw, "headline"), getPath(raw, "subject")) ?? fallback.title,
    message:
      pickString(getPath(raw, "message"), getPath(raw, "copy"), getPath(raw, "summary"), getPath(raw, "notification", "message")) ??
      fallback.message,
    channel:
      channel === "mobile_push" || channel === "desktop_local" || channel === "feishu_bot" || channel === "telegram_bot"
        ? channel
        : fallback.channel,
    deliver: typeof deliverValue === "boolean" ? deliverValue : fallback.deliver,
  };
};

export const normalizeBehaviorConclusionOutput = (
  raw: unknown,
  fallback: z.infer<typeof behaviorConclusionOutputSchema>,
): z.infer<typeof behaviorConclusionOutputSchema> => {
  const riskLevelRank: Record<z.infer<typeof behaviorConclusionOutputSchema>["riskLevel"], number> = {
    low: 0,
    medium: 1,
    high: 2,
  };
  const riskLevelValue = pickString(getPath(raw, "riskLevel"), getPath(raw, "severity"), getPath(raw, "risk", "level"));
  const parsedRiskLevel =
    riskLevelValue === "low" || riskLevelValue === "medium" || riskLevelValue === "high" ? riskLevelValue : fallback.riskLevel;
  const riskLevel = riskLevelRank[parsedRiskLevel] < riskLevelRank[fallback.riskLevel] ? fallback.riskLevel : parsedRiskLevel;
  const channelValue = pickString(
    getPath(raw, "recommendedChannel"),
    getPath(raw, "channel"),
    getPath(raw, "notification", "channel"),
  );
  const recommendedChannel =
    channelValue === "mobile_push" || channelValue === "desktop_local" || channelValue === "feishu_bot" || channelValue === "telegram_bot"
      ? channelValue
      : fallback.recommendedChannel;

  return {
    userId: pickString(getPath(raw, "userId")) ?? fallback.userId,
    assessmentId: pickString(getPath(raw, "assessmentId")) ?? fallback.assessmentId,
    sessionId: pickString(getPath(raw, "sessionId")) ?? fallback.sessionId,
    taskId: pickString(getPath(raw, "taskId")) ?? fallback.taskId,
    riskLevel,
    summary:
      pickString(getPath(raw, "summary"), getPath(raw, "headline"), getPath(raw, "conclusion"), getPath(raw, "message")) ?? fallback.summary,
    suggestedAction:
      pickString(getPath(raw, "suggestedAction"), getPath(raw, "recommendedAction"), getPath(raw, "nextAction"), getPath(raw, "action")) ??
      fallback.suggestedAction,
    trigger: pickString(getPath(raw, "trigger"), getPath(raw, "reason"), getPath(raw, "signal")) ?? fallback.trigger,
    recommendedChannel,
  };
};
