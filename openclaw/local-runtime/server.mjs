import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { nativeOpenClawAgentRegistry, nativeOpenClawAgentRegistryById } from "../runtime/agent-registry.mjs";
import { fetchAgentMemoryContext } from "../runtime/memory-client.mjs";
import { applyDataGovernanceDecision, applyJarvisAuthorityDecision } from "../runtime/authority-client.mjs";
import { routeWithPicard } from "../runtime/workflows/picard-router.mjs";
import { executePersonaTurn } from "../runtime/workflows/persona-executor.mjs";
import { executeJarvisAuthority } from "../runtime/workflows/jarvis-authority.mjs";
import { executeDataGovernance } from "../runtime/workflows/data-governor.mjs";
import { frameWayfinderSituation } from "../runtime/workers/wayfinder-situation-worker.mjs";
import { architectWayfinderOptions } from "../runtime/workers/wayfinder-option-worker.mjs";
import { reflectWayfinderDecision } from "../runtime/workers/wayfinder-reflection-worker.mjs";

const RUNTIME_NAME = "openclaw-local-cluster";
const RUNTIME_VERSION = "structured-local-runtime-phase1";
const EXECUTE_ENDPOINTS = ["/v1/tasks/execute", "/tasks/execute", "/api/tasks/execute"];
const DEFAULT_RESPONSE_MODE = "parsed";
const WORKFLOW_CONTRACTS = [
  {
    workflow: "coach_conversation_fast",
    requiredContextFields: ["workflow", "userId", "frontAgent", "runtimeAgentId", "memoryScopes", "gatewayBaseUrl"],
  },
  {
    workflow: "coach_conversation_full",
    requiredContextFields: ["workflow", "userId", "frontAgent", "runtimeAgentId", "memoryScopes", "gatewayBaseUrl"],
  },
  {
    workflow: "coach_conversation_consult",
    requiredContextFields: ["workflow", "userId", "frontAgent", "runtimeAgentId", "memoryScopes", "gatewayBaseUrl"],
  },
  {
    workflow: "plan_adjustment",
    requiredContextFields: [
      "workflow",
      "userId",
      "frontAgent",
      "runtimeAgentId",
      "memoryScopes",
      "gatewayBaseUrl",
      "authorityAction",
      "proposalContext",
    ],
  },
  {
    workflow: "memory_governance",
    requiredContextFields: [
      "workflow",
      "userId",
      "frontAgent",
      "runtimeAgentId",
      "memoryScopes",
      "gatewayBaseUrl",
      "authorityAction",
    ],
  },
];
const WORKFLOW_RESPONSE_CONTRACTS = [
  {
    workflow: "coach_conversation_fast",
    requiredParsedFields: ["fastResponse", "status"],
  },
  {
    workflow: "coach_conversation_full",
    requiredParsedFields: ["fastResponse", "fullResponse", "status"],
  },
  {
    workflow: "coach_conversation_consult",
    requiredParsedFields: ["consultSummary", "status"],
  },
  {
    workflow: "plan_adjustment",
    requiredParsedFields: ["authorityAgent", "action", "executionMode", "summary"],
  },
  {
    workflow: "memory_governance",
    requiredParsedFields: ["authorityAgent", "action", "executionMode", "summary"],
  },
];
const WORKFLOW_EXECUTION_CONTRACTS = [
  {
    workflow: "coach_conversation_fast",
    requiredMetadataFields: ["workflow", "responseMode", "memoryFetch"],
    memoryFetchFields: ["attempted", "loaded", "error"],
  },
  {
    workflow: "coach_conversation_full",
    requiredMetadataFields: ["workflow", "responseMode", "memoryFetch"],
    memoryFetchFields: ["attempted", "loaded", "error"],
  },
  {
    workflow: "coach_conversation_consult",
    requiredMetadataFields: ["workflow", "responseMode", "memoryFetch"],
    memoryFetchFields: ["attempted", "loaded", "error"],
  },
  {
    workflow: "plan_adjustment",
    requiredMetadataFields: ["workflow", "responseMode", "authorityApply"],
    authorityApplyFields: ["attempted", "applied", "status", "readModelRefresh"],
  },
  {
    workflow: "memory_governance",
    requiredMetadataFields: ["workflow", "responseMode", "authorityApply"],
    authorityApplyFields: ["attempted", "applied", "status", "readModelRefresh"],
  },
];

const PERSONA_BY_AGENT_ID = nativeOpenClawAgentRegistryById;
const PERSONA_AGENTS = nativeOpenClawAgentRegistry.map((entry) => ({
  name: entry.agentId,
  worker: entry.worker,
  wayfinderWorker: entry.wayfinderWorker ?? null,
  wayfinderPerspectivePacks: entry.wayfinderPerspectivePacks ?? [],
  modelTarget: entry.modelTarget,
  skills: entry.skills,
  supportedWorkflows: entry.supportedWorkflows,
  memoryScopes: entry.memoryScopes,
  canFront: entry.canFront,
  canConsult: entry.canConsult,
  canWritePlans: entry.canWritePlans,
  canGovernMemory: entry.canGovernMemory,
}));

const AGENTS = [
  {
    name: "chief-agent",
    worker: "chief-agent-worker",
    modelTarget: "chief-agent",
    skills: ["state-score-skill"],
    supportedWorkflows: [
      "state_assessment",
      "task_management",
      "progress_summary",
      "recovery_plan",
      "reflection_report",
      "notification_dispatch",
    ],
  },
  {
    name: "state-insight-agent",
    worker: "state-insight-agent-worker",
    modelTarget: "state-insight-agent",
    skills: ["state-score-skill", "state-ingest-skill"],
    supportedWorkflows: ["state_assessment"],
  },
  {
    name: "task-management-agent",
    worker: "task-management-agent-worker",
    modelTarget: "task-management-agent",
    skills: ["goalflow-plan-skill", "task-reprioritize-skill"],
    supportedWorkflows: ["task_management"],
  },
  {
    name: "progress-feedback-agent",
    worker: "progress-feedback-agent-worker",
    modelTarget: "progress-feedback-agent",
    skills: ["progress-summary-skill"],
    supportedWorkflows: ["progress_summary"],
  },
  {
    name: "interruption-recovery-agent",
    worker: "interruption-recovery-agent-worker",
    modelTarget: "interruption-recovery-agent",
    skills: ["interruption-recovery-skill"],
    supportedWorkflows: ["recovery_plan"],
  },
  {
    name: "reflection-coach-agent",
    worker: "reflection-coach-agent-worker",
    modelTarget: "reflection-coach-agent",
    skills: ["reflection-report-skill"],
    supportedWorkflows: ["reflection_report"],
  },
  {
    name: "automation-agent",
    worker: "automation-agent-worker",
    modelTarget: "automation-agent",
    skills: ["notification-skill"],
    supportedWorkflows: ["notification_dispatch"],
  },
  {
    name: "conversation-coach-fast-agent",
    worker: "conversation-coach-fast-agent-worker",
    modelTarget: "conversation-coach-fast-agent",
    skills: ["coach-conversation-fast-skill"],
    supportedWorkflows: ["coach_conversation_fast"],
  },
  {
    name: "conversation-coach-agent",
    worker: "conversation-coach-agent-worker",
    modelTarget: "conversation-coach-agent",
    skills: ["coach-conversation-skill"],
    supportedWorkflows: ["coach_conversation_full"],
  },
  ...PERSONA_AGENTS,
];

const AGENT_BY_NAME = new Map(AGENTS.map((agent) => [agent.name, agent]));

const CHIEF_WORKFLOW_AGENT = {
  state_assessment: "state-insight-agent",
  task_management: "task-management-agent",
  progress_summary: "progress-feedback-agent",
  recovery_plan: "interruption-recovery-agent",
  reflection_report: "reflection-coach-agent",
  notification_dispatch: "automation-agent",
};

const asObject = (value) => (value !== null && typeof value === "object" && !Array.isArray(value) ? value : null);

const asString = (value) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const asNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const asBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }
  return false;
};

const pickString = (...values) => values.map(asString).find(Boolean);
const pickNumber = (...values) => values.map(asNumber).find((value) => value !== undefined);

const asPersonaAgentId = (value) => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return PERSONA_BY_AGENT_ID.has(normalized) ? normalized : null;
};

const toRoutingMode = (value) => (value === "manual" ? "manual" : "auto");

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseJson = (value) => {
  if (typeof value !== "string") {
    return asObject(value) ?? value ?? {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const getArrayOfStrings = (value) =>
  Array.isArray(value) ? value.map((item) => pickString(item)).filter(Boolean) : [];

const readRequestBody = async (request) => {
  let body = "";
  for await (const chunk of request) {
    body += chunk.toString();
  }

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};

const deriveChiefRoute = (context) => {
  const workflow = pickString(context?.workflow, context?.intent) ?? "state_assessment";
  const selectedAgent = CHIEF_WORKFLOW_AGENT[workflow] ?? "state-insight-agent";
  return {
    workflow,
    selectedAgent,
    reason: `Local OpenClaw cluster routed ${workflow} to ${selectedAgent}.`,
    executionMode: "agent",
    confidence: 0.9,
  };
};

const buildStateInsight = (context) => {
  const recentSignals = Array.isArray(context?.recentSignals) ? context.recentSignals : [];
  const latestEmotionAssessment = asObject(context?.latestEmotionAssessment);
  const latestVideoAssessment = asObject(context?.latestVideoAssessment);
  const latestHealthSnapshot = asObject(context?.latestHealthSnapshot);
  const latestCheckin = asObject(context?.latestCheckin);
  const userId = pickString(context?.userId) ?? "demo-user";
  const windowEnd = pickString(context?.windowEnd) ?? new Date().toISOString();
  const windowStart = pickString(context?.windowStart) ?? new Date(Date.now() - 15 * 60_000).toISOString();
  const signalTypes = new Set(recentSignals.map((signal) => pickString(signal?.eventType)).filter(Boolean));
  const switchPenalty = signalTypes.has("window_switch") ? 10 : 0;
  const idlePenalty = signalTypes.has("idle") ? 8 : 0;
  const lockPenalty = signalTypes.has("lock") ? 5 : 0;
  const checkinFocus = pickNumber(latestCheckin?.focusScore) ?? 58;
  const checkinEnergy = pickNumber(latestCheckin?.energyScore) ?? 55;
  const checkinMood = pickNumber(latestCheckin?.moodScore) ?? 57;
  const fatigueScore = latestVideoAssessment ? clamp(Math.round(pickNumber(latestVideoAssessment?.fatigueScore) ?? 68), 0, 100) : undefined;

  const focusScore = clamp(Math.round(checkinFocus - switchPenalty - idlePenalty), 0, 100);
  const energyScore = clamp(
    Math.round(checkinEnergy - lockPenalty - (fatigueScore !== undefined ? Math.round(fatigueScore / 8) : 0)),
    0,
    100,
  );
  const moodScore = clamp(
    Math.round(checkinMood - (latestEmotionAssessment ? Math.round((pickNumber(latestEmotionAssessment?.stressScore) ?? 60) / 10) : 0)),
    0,
    100,
  );

  const activeInputs = [];
  if (recentSignals.length > 0) {
    activeInputs.push("desktop_signal");
  }
  if (latestEmotionAssessment) {
    activeInputs.push("audio_server_inference");
  }
  if (latestVideoAssessment) {
    activeInputs.push("video_server_inference");
  }
  if (latestHealthSnapshot) {
    activeInputs.push("health_bridge");
  }
  if (latestCheckin) {
    activeInputs.push("manual_checkin");
  }

  return {
    userId,
    windowStart,
    windowEnd,
    focusScore,
    energyScore,
    moodScore,
    summary:
      "当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。",
    recommendedAction: "先收拢干扰源，回到主任务，只推进一个最小可验证步骤，再决定是否继续扩展。",
    emotionSummary: latestEmotionAssessment
      ? "音频侧提示紧张和压力抬升，说明当前更适合减少切换而不是继续并行处理。": undefined,
    emotionConfidence: latestEmotionAssessment ? 0.82 : undefined,
    fatigueScore,
    videoSummary: latestVideoAssessment
      ? "视频侧显示疲劳和视觉稳定度下降，说明持续专注能力正在变弱。": undefined,
    healthSummary: latestHealthSnapshot
      ? "健康数据显示恢复基础一般，健康数据提示应优先保证节奏稳定而不是强行加码。": undefined,
    activeInputs,
    mediaFreshness: latestEmotionAssessment || latestVideoAssessment || latestHealthSnapshot ? "mixed" : "fresh",
  };
};

const prioritizeTasks = (tasks = [], preferredTaskId) => {
  const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusRank = { in_progress: 0, todo: 1, blocked: 2, done: 3 };
  return [...tasks]
    .sort((left, right) => {
      if (left?.id === preferredTaskId) return -1;
      if (right?.id === preferredTaskId) return 1;
      const leftStatus = statusRank[pickString(left?.status) ?? "todo"] ?? 9;
      const rightStatus = statusRank[pickString(right?.status) ?? "todo"] ?? 9;
      if (leftStatus !== rightStatus) return leftStatus - rightStatus;
      const leftPriority = priorityRank[pickString(left?.priority) ?? "medium"] ?? 9;
      const rightPriority = priorityRank[pickString(right?.priority) ?? "medium"] ?? 9;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return (pickNumber(left?.sortOrder) ?? 999) - (pickNumber(right?.sortOrder) ?? 999);
    })
    .map((task) => pickString(task?.id))
    .filter(Boolean);
};

const buildTaskManagement = (context) => {
  const tasks = Array.isArray(context?.tasks) ? context.tasks : [];
  const orderedTaskIds = prioritizeTasks(tasks);
  return {
    orderedTaskIds,
    summary:
      orderedTaskIds.length > 0
        ? "本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。"
        : "当前还没有足够任务，建议先补齐目标拆解，再开始稳定执行。",
    suggestedTasks:
      orderedTaskIds.length > 0
        ? []
        : [
            { title: "明确本周唯一最重要目标", priority: "high", estimatedMinutes: 20 },
            { title: "拆出 2 到 3 个最小可执行任务", priority: "medium", estimatedMinutes: 25 },
          ],
  };
};

const buildRecovery = (context) => {
  const tasks = Array.isArray(context?.tasks) ? context.tasks : [];
  const targetTaskId = pickString(context?.taskId);
  const selectedTask =
    tasks.find((task) => pickString(task?.id) === targetTaskId) ??
    tasks.find((task) => pickString(task?.status) === "in_progress") ??
    tasks[0];
  const selectedTitle = pickString(selectedTask?.title) ?? "当前主任务";
  const ordered = prioritizeTasks(tasks, pickString(selectedTask?.id));

  return {
    reason: "attention_shift_after_interruption",
    nextStep: `先回到「${selectedTitle}」，只推进一个最小切片，避免继续切去处理旁支任务。`,
    suggestedMinutes: 25,
    reprioritizedTaskIds: ordered,
  };
};

const buildConversationCoachFast = (context) => {
  const userText = pickString(context?.userText, context?.message, context?.text) ?? "先别急，先把问题收窄到一个最小下一步。";
  return {
    fastResponse: `先别急，先把“${userText.slice(0, 18)}”收窄成一个最小下一步。`,
    status: "pending_full",
  };
};

const buildConversationCoachFull = (context) => {
  const userText = pickString(context?.userText, context?.message, context?.text) ?? "先别急，先把问题收窄到一个最小下一步。";
  const memoryContext = asObject(context?.memoryContext);
  const memoryFramingHints = Array.isArray(context?.memoryFramingHints) ? context.memoryFramingHints : [];
  const consultSummary = pickString(context?.consultSummary);
  const authoritySummary = pickString(context?.authoritySummary);
  const contextMemory = [
    ...getArrayOfStrings(memoryContext?.preferences?.map?.((item) => pickString(item?.summary))),
    ...getArrayOfStrings(memoryContext?.habits?.map?.((item) => pickString(item?.summary))),
    ...getArrayOfStrings(memoryContext?.constraints?.map?.((item) => pickString(item?.summary))),
    ...getArrayOfStrings(memoryContext?.recentContext?.map?.((item) => pickString(item?.summary))),
  ];
  const recalledMemory = Array.isArray(context?.recalledMemory)
    ? context.recalledMemory.filter((item) => typeof item === "string")
    : contextMemory;
  const framedMemory = memoryFramingHints
    .map((item) => {
      const object = asObject(item);
      const label = pickString(object?.label);
      const summary = pickString(object?.summary);
      return label && summary ? `${label}：${summary}` : null;
    })
    .filter(Boolean);
  const detailLines = [
    consultSummary ? `补充判断：${consultSummary}` : null,
    authoritySummary ? `执行结论：${authoritySummary}` : null,
    framedMemory.length > 0 ? `参考框架：${framedMemory.join("；")}` : null,
    framedMemory.length === 0 && recalledMemory.length > 0 ? `参考偏好：${recalledMemory.join("；")}` : null,
  ].filter(Boolean);
  return {
    fastResponse: `先别急，先把“${userText.slice(0, 18)}”收窄成一个最小下一步。`,
    fullResponse: detailLines.length > 0
      ? `我先帮你把问题拆成一个可执行起点，再结合这些已知线索来安排节奏。\n${detailLines.join("\n")}`
      : "我先帮你把问题拆成一个可执行起点，再决定是否继续扩展。",
    status: "completed",
  };
};

const buildConversationCoachConsult = (context) => {
  const userText = pickString(context?.userText, context?.message, context?.text) ?? "先收窄现实判断。";
  const frontAgent = pickString(context?.frontAgent) ?? "director-agent";
  const memoryFramingHints = Array.isArray(context?.memoryFramingHints) ? context.memoryFramingHints : [];
  const framedMemory = memoryFramingHints
    .map((item) => {
      const object = asObject(item);
      const label = pickString(object?.label);
      const summary = pickString(object?.summary);
      return label && summary ? `${label}：${summary}` : null;
    })
    .filter(Boolean);
  return {
    consultSummary: framedMemory.length > 0
      ? `给 ${frontAgent} 的补充判断：先看这些线索——${framedMemory.join("；")}。再把“${userText.slice(0, 18)}”拆成一个现实上最可验证的判断点。`
      : `给 ${frontAgent} 的补充判断：先把“${userText.slice(0, 18)}”拆成一个现实上最可验证的判断点，再继续推进。`,
    status: "consulted",
  };
};

const buildReflection = (context) => {
  const periodType = pickString(context?.periodType) === "monthly" ? "monthly" : "weekly";
  const periodEnd = pickString(context?.periodEnd) ?? new Date().toISOString();
  const periodStart =
    pickString(context?.periodStart) ??
    new Date(Date.now() - (periodType === "monthly" ? 30 : 7) * 24 * 60 * 60_000).toISOString();
  const prefix = periodType === "monthly" ? "本月" : "本周";
  const blockedTasks = Array.isArray(context?.tasks)
    ? context.tasks.filter((task) => pickString(task?.status) === "blocked")
    : [];

  return {
    userId: pickString(context?.userId) ?? "demo-user",
    periodType,
    periodStart,
    periodEnd,
    highlights: [`${prefix}已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。`],
    blockers: blockedTasks.length > 0 ? blockedTasks.map((task) => `blocked：${pickString(task?.title) ?? "未命名任务"}`) : [`${prefix}的主要阻力来自中断后回到主线的成本偏高。`],
    trends: [`${prefix}专注均值仍有波动，但在恢复方案介入后开始重新聚焦。`],
    nextSuggestions: [
      blockedTasks.length > 0
        ? "优先清理 blocked 任务对应的外部阻塞，避免主线继续受牵连。"
        : "中断后先执行 10 到 25 分钟的最小恢复块，而不是立即重开多个任务。",
    ],
  };
};

const buildProgress = (context) => {
  const dashboard = asObject(context?.dashboard) ?? asObject(context) ?? {};
  const goals = Array.isArray(dashboard.goals) ? dashboard.goals : [];
  const tasks = Array.isArray(dashboard.tasks) ? dashboard.tasks : [];
  const activeSession = asObject(dashboard.activeSession) ?? null;
  const latestAssessment = asObject(dashboard.latestAssessment) ?? null;
  const latestRecoveryPlan = asObject(dashboard.latestRecoveryPlan) ?? null;
  const latestBehaviorConclusion = asObject(dashboard.latestBehaviorConclusion) ?? null;
  const latestVideoAssessment = asObject(dashboard.latestVideoAssessment) ?? null;
  const latestHealthSnapshot = asObject(dashboard.latestHealthSnapshot) ?? null;
  const mobileAudio = asObject(dashboard.mobileAudio) ?? {
    enabled: false,
    latestDevice: null,
    latestSession: null,
    latestEmotionAssessment: null,
    latestCallEvent: null,
  };
  const openInterventions = Math.max(0, Math.round(pickNumber(dashboard.openInterventions) ?? 0));
  const completedTaskCount = tasks.filter((task) => pickString(task?.status) === "done").length;
  const inProgressTaskCount = tasks.filter((task) => pickString(task?.status) === "in_progress").length;
  const blockedTaskCount = tasks.filter((task) => pickString(task?.status) === "blocked").length;
  const suggestedFocusTaskId =
    pickString(dashboard.suggestedFocusTaskId) ??
    pickString(activeSession?.taskId) ??
    pickString(latestRecoveryPlan?.taskId) ??
    pickString(tasks[0]?.id) ??
    null;

  return {
    goalCount: Math.max(0, Math.round(pickNumber(dashboard.goalCount) ?? goals.length)),
    taskCount: Math.max(0, Math.round(pickNumber(dashboard.taskCount) ?? tasks.length)),
    completedTaskCount,
    inProgressTaskCount,
    blockedTaskCount,
    completionRate:
      tasks.length > 0
        ? clamp(completedTaskCount / tasks.length, 0, 1)
        : clamp(pickNumber(dashboard.completionRate) ?? 0, 0, 1),
    openInterventions,
    suggestedFocusTaskId,
    summaryHeadline:
      latestRecoveryPlan || openInterventions > 0
        ? "当前已有恢复方案，建议先按恢复方案收拢主线，再继续推进最重要任务。"
        : "当前主线相对稳定，可以继续保持单线程推进。",
    activeSession,
    latestAssessment,
    latestRecoveryPlan,
    latestBehaviorConclusion,
    latestVideoAssessment,
    latestHealthSnapshot,
    mobileAudio,
    edgeDevices: Array.isArray(dashboard.edgeDevices) ? dashboard.edgeDevices : [],
    inbox: Array.isArray(dashboard.inbox) ? dashboard.inbox : [],
    goals,
    tasks,
  };
};

const buildAutomation = (context) => {
  const conclusion = asObject(context?.conclusion) ?? null;
  return {
    title: pickString(context?.title, conclusion?.summary) ?? "恢复提醒",
    message:
      pickString(context?.message, conclusion?.suggestedAction) ??
      "请先收拢干扰源，再继续当前主任务的一个最小执行步骤。",
    channel:
      pickString(context?.channel, conclusion?.recommendedChannel) ??
      (context?.hasMobileEndpoint ? "mobile_push" : "desktop_local"),
    deliver: true,
  };
};

const buildBehaviorConclusion = (context) => {
  const assessment = asObject(context?.assessment) ?? {};
  const riskLevel = pickString(context?.riskLevel, assessment?.riskLevel) ?? "high";
  return {
    userId: pickString(context?.userId) ?? "demo-user",
    assessmentId: pickString(assessment?.id),
    sessionId: pickString(context?.sessionId),
    taskId: pickString(context?.taskId),
    riskLevel,
    summary: "当前已进入需要主动收拢干扰和恢复节奏的阶段。",
    suggestedAction: "暂停并回到主任务，只做一个最小恢复块，再决定是否继续延长。",
    trigger: pickString(context?.intent) ?? "state_assessment",
    recommendedChannel: context?.hasMobileEndpoint ? "mobile_push" : "desktop_local",
  };
};

const buildParsedPayload = ({ target, mode, context }) => {
  if (mode === "probe") {
    return { probe: "ok" };
  }

  const workflow = pickString(context?.workflow, context?.intent);

  if (target === "director-agent" && workflow === "wayfinder_situation_framing") {
    return frameWayfinderSituation(context);
  }

  if (target === "analyst-agent" && workflow === "wayfinder_option_architecture") {
    return architectWayfinderOptions(context);
  }

  if (target === "balance-agent" && workflow === "wayfinder_reflection") {
    return reflectWayfinderDecision(context);
  }

  if (PERSONA_BY_AGENT_ID.has(target) && workflow === "coach_conversation_fast") {
    return buildConversationCoachFast(context);
  }

  if (PERSONA_BY_AGENT_ID.has(target) && workflow === "coach_conversation_full") {
    return buildConversationCoachFull(context);
  }

  if (PERSONA_BY_AGENT_ID.has(target) && workflow === "coach_conversation_consult") {
    return buildConversationCoachConsult(context);
  }

  if (target === "director-agent") {
    const decision = routeWithPicard({
      workflow: pickString(context?.workflow, context?.intent, context?.contextSource),
      userMessage: pickString(context?.userMessage, context?.message, context?.text) ?? "",
      memoryContext: context?.memoryContext,
      contextSource: pickString(context?.contextSource),
      hasEmotionSignal: Boolean(asObject(context?.latestEmotionAssessment)),
      hasRecentSignals: Array.isArray(context?.recentSignals) && context.recentSignals.length > 0,
      manualOverrideAgent: asPersonaAgentId(pickString(context?.manualOverrideAgent)),
      releaseOverride: Boolean(context?.releaseOverride),
      requiresPlanWrite: Boolean(context?.requiresPlanWrite),
      requiresMemoryGovernance: Boolean(context?.requiresMemoryGovernance),
    });

    return executePersonaTurn({
      targetAgent: target,
      routeDecision: decision,
      contextSource: pickString(context?.contextSource),
    });
  }

  if (target === "life-secretary-agent" && pickString(context?.workflow) === "plan_adjustment") {
    return executeJarvisAuthority(context);
  }

  if (target === "memory-governor-agent" && pickString(context?.workflow) === "memory_governance") {
    return executeDataGovernance(context);
  }

  if (PERSONA_BY_AGENT_ID.has(target)) {
    return executePersonaTurn({
      targetAgent: target,
      routeDecision: null,
      contextSource: pickString(context?.contextSource),
    });
  }

  switch (target) {
    case "chief-agent":
      return deriveChiefRoute(context);
    case "state-insight-agent":
      return buildStateInsight(context);
    case "task-management-agent":
      return buildTaskManagement(context);
    case "progress-feedback-agent":
      return buildProgress(context);
    case "interruption-recovery-agent":
      return buildRecovery(context);
    case "reflection-coach-agent":
      return buildReflection(context);
    case "automation-agent":
      return context?.intent === "behavior_conclusion" ? buildBehaviorConclusion(context) : buildAutomation(context);
    case "conversation-coach-fast-agent":
      return buildConversationCoachFast(context);
    case "conversation-coach-agent":
      return buildConversationCoachFull(context);
    default:
      return { probe: "ok" };
  }
};

const json = (response, statusCode, payload) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
};

export const createLocalOpenClawServer = ({
  host = process.env.OPENCLAW_HOST ?? "127.0.0.1",
  port = Number(process.env.OPENCLAW_PORT ?? "8788"),
  responseMode = process.env.OPENCLAW_RESPONSE_MODE ?? DEFAULT_RESPONSE_MODE,
} = {}) => {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);

    if (request.method === "GET" && url.pathname === "/health") {
      return json(response, 200, {
        ok: true,
        runtime: RUNTIME_NAME,
        runtimeVersion: RUNTIME_VERSION,
        responseMode,
        workflowContracts: WORKFLOW_CONTRACTS,
        workflowResponseContracts: WORKFLOW_RESPONSE_CONTRACTS,
        workflowExecutionContracts: WORKFLOW_EXECUTION_CONTRACTS,
        agentCount: AGENTS.length,
        agents: AGENTS.map((agent) => ({
          name: agent.name,
          worker: agent.worker,
          wayfinderWorker: agent.wayfinderWorker ?? null,
          wayfinderPerspectivePacks: agent.wayfinderPerspectivePacks ?? [],
          modelTarget: agent.modelTarget,
          skillCount: agent.skills.length,
          skills: agent.skills,
          supportedWorkflows: agent.supportedWorkflows,
          memoryScopes: Array.isArray(agent.memoryScopes) ? agent.memoryScopes : [],
          canFront: agent.canFront === true,
          canConsult: agent.canConsult === true,
          canWritePlans: agent.canWritePlans === true,
          canGovernMemory: agent.canGovernMemory === true,
        })),
        endpoints: EXECUTE_ENDPOINTS,
      });
    }

    if (request.method === "POST" && EXECUTE_ENDPOINTS.includes(url.pathname)) {
      const body = await readRequestBody(request);
      const target = pickString(body?.target);
      const mode = pickString(body?.mode) ?? "generate";
      const agent = target ? AGENT_BY_NAME.get(target) : null;

      if (!agent || !target) {
        return json(response, 400, {
          success: false,
          error: `Unknown agent target: ${target ?? "missing-target"}`,
          metadata: {
            runtime: RUNTIME_NAME,
            runtimeVersion: RUNTIME_VERSION,
            errorCode: "unknown_target",
            availableTargets: AGENTS.map((entry) => entry.name),
          },
        });
      }

      const context = parseJson(body?.payload?.userPrompt ?? body?.payload ?? {});
      const taskId = pickString(body?.taskId) ?? randomUUID();
      const trace = asObject(body?.trace) ?? {
        traceId: randomUUID(),
        parentTraceId: undefined,
        source: "mindanchor-gateway",
        operation: mode,
        agentName: target,
      };
      const workflow = pickString(context?.workflow, trace?.workflow) ?? null;
      const frontAgent = asPersonaAgentId(pickString(context?.frontAgent)) ?? null;
      const runtimeAgentId = pickString(context?.runtimeAgentId) ?? PERSONA_BY_AGENT_ID.get(target)?.runtimeAgentId ?? null;
      const memoryScopes = getArrayOfStrings(context?.memoryScopes);
      const gatewayBaseUrl = pickString(context?.gatewayBaseUrl);
      let memoryContext = null;
      let memoryFetch = {
        attempted: false,
        loaded: false,
        error: null,
      };
      let authorityApply = {
        attempted: false,
        applied: false,
        error: null,
        endpoint: null,
        status: null,
        readModelRefresh: null,
      };

      if (gatewayBaseUrl && memoryScopes.length > 0) {
        memoryFetch.attempted = true;
        try {
          memoryContext = await fetchAgentMemoryContext({
            gatewayBaseUrl,
            userId: pickString(context?.userId, trace?.userId) ?? "demo-user",
            agentId: target,
            scopes: memoryScopes,
            trace,
            workflow,
          });
          memoryFetch.loaded = true;
        } catch (error) {
          memoryFetch.error = error instanceof Error ? error.message : "Unknown memory fetch error.";
        }
      }

      const parsed = buildParsedPayload({
        target,
        mode,
        context: memoryContext ? { ...context, memoryContext } : context,
      });

      if (gatewayBaseUrl && asBoolean(context?.applyAuthority)) {
        authorityApply.attempted = true;
        try {
          if (target === "life-secretary-agent" && workflow === "plan_adjustment") {
            const result = await applyJarvisAuthorityDecision({
              gatewayBaseUrl,
              decision: parsed,
              context,
              trace,
              workflow,
            });
            authorityApply.applied = true;
            authorityApply.endpoint = result.endpoint;
            authorityApply.status = pickString(result?.result?.status) ?? null;
            authorityApply.readModelRefresh = asObject(result?.result?.readModelRefresh) ?? null;
          } else if (target === "memory-governor-agent" && workflow === "memory_governance") {
            const result = await applyDataGovernanceDecision({
              gatewayBaseUrl,
              decision: parsed,
              trace,
              workflow,
            });
            authorityApply.applied = true;
            authorityApply.endpoint = result.endpoint;
            authorityApply.status = pickString(result?.result?.status) ?? null;
            authorityApply.readModelRefresh = asObject(result?.result?.readModelRefresh) ?? null;
          }
        } catch (error) {
          authorityApply.error = error instanceof Error ? error.message : "Unknown authority apply error.";
        }
      }

      const metadata = {
        runtime: RUNTIME_NAME,
        runtimeVersion: RUNTIME_VERSION,
        worker: agent.worker,
        agent: agent.name,
        wayfinderPerspectivePacks: agent.wayfinderPerspectivePacks ?? [],
        modelTarget: agent.modelTarget,
        mode,
        responseMode,
        skillCount: agent.skills.length,
        skills: agent.skills,
        supportedWorkflows: agent.supportedWorkflows,
        workflow,
        frontAgent,
        runtimeAgentId,
        memoryScopes,
        memoryFetch,
        memoryContext,
        authorityApplied: authorityApply.applied,
        authorityApply,
      };

      const payload = {
        success: true,
        taskId,
        trace,
        metadata,
        ...(responseMode === "outputText"
          ? { outputText: JSON.stringify(parsed) }
          : { parsed }),
      };

      return json(response, 200, payload);
    }

    return json(response, 404, {
      success: false,
      error: `Unknown route: ${request.method ?? "GET"} ${url.pathname}`,
      metadata: {
        runtime: RUNTIME_NAME,
        runtimeVersion: RUNTIME_VERSION,
        errorCode: "unknown_route",
      },
    });
  });

  return {
    host,
    port,
    responseMode,
    server,
    async start() {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          server.off("error", reject);
          resolve();
        });
      });
      return server;
    },
  };
};
