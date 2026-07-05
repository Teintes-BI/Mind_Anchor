import { createHash } from "node:crypto";
import { z } from "zod";
import { agentTeamPersonaMetadata } from "@mindanchor/domain";
import { createId } from "../lib/utils.js";
import { MindAnchorTraceLogger } from "../lib/trace-logger.js";
import { ModelBridge } from "../lib/model-bridge.js";
import { MindAnchorStore } from "../store.js";
import type { AppEnv } from "../env.js";
import { routeWithPicard } from "../../../../openclaw/runtime/workflows/picard-router.mjs";
import type { AgentAuthorityExecutionService } from "./agent-authority-execution-service.js";
import { executeJarvisAuthority } from "../../../../openclaw/runtime/workflows/jarvis-authority.mjs";
import { executeDataGovernance } from "../../../../openclaw/runtime/workflows/data-governor.mjs";
import type {
  AgentMemoryContextBundle,
  CoachFeedback,
  CoachMemoryItem,
  CoachMessage,
  CoachMessageUsedMemoryEntry,
  CoachMessageFeedbackInput,
  ConversationPathSummary,
  CreateCoachMessageInput,
  CreateCoachSessionInput,
} from "@mindanchor/domain";
import type { AgentMemoryService } from "./agent-memory-service.js";
import { collectConversationRouteData } from "../lib/conversation-route-metrics.js";
import {
  HELPFUL_FEEDBACK_STRENGTHENING_PREFIX,
  type HelpfulFeedbackStrengtheningScope,
  classifyHelpfulFeedbackStrengtheningCandidate,
  parseHelpfulFeedbackStrengtheningScope,
} from "./helpful-feedback-strengthening.js";

const FULL_RESPONSE_SETTLE_DELAY_MS = 25;
const MAX_USED_MEMORY_EXPLAINABILITY_ENTRIES = 4;
const USED_MEMORY_SOURCE_PRIORITY: Record<string, number> = {
  "coach-memory": 0,
  "gateway-memory": 1,
  "front-agent-state": 2,
};
const USED_MEMORY_SOURCE_DIVERSITY_LIMIT: Record<string, number> = {
  "coach-memory": 2,
  "gateway-memory": 1,
  "front-agent-state": 1,
};

const normalizeSnippet = (text: string, limit = 64) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit)}…`;
};

type ConversationMemorySummary = {
  summary: string;
};

type PersonaMemoryFramingHint = {
  label: string;
  summary: string;
  source: string;
  kind: string;
};

const buildFastResponse = (text: string, recalledMemory: ConversationMemorySummary[]) => {
  const opening = normalizeSnippet(text, 48);
  const memoryHint = recalledMemory[0]?.summary;
  return memoryHint
    ? `先别同时解决所有问题。先按“${memoryHint}”的方式，把这件事收窄成一个最小下一步。`
    : `先别同时解决所有问题。先把“${opening}”收窄成一个最小下一步。`;
};

const buildFullResponse = (text: string, recalledMemory: ConversationMemorySummary[]) => {
  const opening = normalizeSnippet(text, 96);
  const memoryLines = recalledMemory.slice(0, 2).map((item) => `- ${item.summary}`);
  const memorySection = memoryLines.length > 0 ? `\n参考到的长期偏好：\n${memoryLines.join("\n")}` : "";
  return [
    `我先帮你把当前问题重新排一下优先级：${opening}`,
    "第一步只做一个能立刻开始、且不会额外制造压力的动作。",
    "如果你愿意，我下一轮可以继续帮你把它拆成一个 10 分钟内能完成的步骤。",
    memorySection,
  ]
    .filter(Boolean)
    .join("\n");
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildCoachFastSystemPrompt = (frontAgent: string, consultedAgent: string | null) => {
  const displayName =
    Object.values(agentTeamPersonaMetadata).find((item) => item.agentId === frontAgent)?.displayName ?? frontAgent;
  const consultedDisplayName =
    consultedAgent
      ? Object.values(agentTeamPersonaMetadata).find((item) => item.agentId === consultedAgent)?.displayName ?? consultedAgent
      : null;

  return [
    `You are ${displayName}, the current front agent for MindAnchor Coach.`,
    "Return exactly one JSON object and nothing else.",
    'Use this exact shape: {"fastResponse":"string","status":"pending_full"}.',
    "Give one grounding sentence that narrows the user into the next smallest step.",
    consultedDisplayName ? `Picard has already approved one lightweight consult from ${consultedDisplayName}.` : "Picard has not requested a consult for this turn.",
    "Do not include markdown, lists, or meta commentary.",
  ].join(" ");
};

const buildCoachFullSystemPrompt = (frontAgent: string, consultedAgent: string | null) => {
  const displayName =
    Object.values(agentTeamPersonaMetadata).find((item) => item.agentId === frontAgent)?.displayName ?? frontAgent;
  const consultedDisplayName =
    consultedAgent
      ? Object.values(agentTeamPersonaMetadata).find((item) => item.agentId === consultedAgent)?.displayName ?? consultedAgent
      : null;

  return [
    `You are ${displayName}, the current front agent for MindAnchor Coach.`,
    "Return exactly one JSON object and nothing else.",
    'Use this exact shape: {"fastResponse":"string","fullResponse":"string","status":"completed"}.',
    "fullResponse should turn the situation into a calm, actionable framing and may reference recalled preferences safely.",
    consultedDisplayName ? `You may integrate one lightweight consult from ${consultedDisplayName}, but keep a single coherent voice.` : "Keep a single coherent front-agent voice.",
    "Do not ask for screenshots, typed text, or other raw private content.",
  ].join(" ");
};

const personaMemoryLabel = (frontAgent: string, source: string, kind: string) => {
  switch (frontAgent) {
    case "companion-agent":
      if (source === "coach-memory") return "安抚偏好";
      if (source === "gateway-memory") return "现实边界";
      if (source === "front-agent-state") return "当前情绪焦点";
      return "对话线索";
    case "analyst-agent":
      if (source === "coach-memory" && (kind === "habit" || kind === "work_style")) return "行为习惯";
      if (source === "coach-memory") return "决策偏好";
      if (source === "gateway-memory") return "现实约束";
      if (source === "front-agent-state") return "当前分析焦点";
      return "分析线索";
    case "balance-agent":
      if (source === "coach-memory") return "平衡偏好";
      if (source === "gateway-memory") return "现实边界";
      if (source === "front-agent-state") return "当前平衡焦点";
      return "平衡线索";
    case "life-secretary-agent":
      if (source === "coach-memory") return "执行偏好";
      if (source === "gateway-memory") return "计划约束";
      if (source === "front-agent-state") return "当前计划焦点";
      return "计划线索";
    default:
      if (source === "coach-memory") return "长期偏好";
      if (source === "gateway-memory") return "现实约束";
      if (source === "front-agent-state") return "当前协调状态";
      return "记忆线索";
  }
};

const coachFastGenerationSchema = z.object({
  fastResponse: z.string().min(1),
  status: z.literal("pending_full"),
});

const coachFullGenerationSchema = z.object({
  fastResponse: z.string().min(1),
  fullResponse: z.string().min(1),
  status: z.literal("completed"),
});

const coachConsultGenerationSchema = z.object({
  consultSummary: z.string().min(1),
  status: z.literal("consulted").optional(),
});

const coachRouteDecisionSchema = z.object({
  routingOwner: z.literal("director-agent").default("director-agent"),
  frontAgent: z.enum([
    "director-agent",
    "companion-agent",
    "analyst-agent",
    "balance-agent",
    "life-secretary-agent",
    "memory-governor-agent",
  ]),
  consultedAgent: z
    .enum([
      "director-agent",
      "companion-agent",
      "analyst-agent",
      "balance-agent",
      "life-secretary-agent",
      "memory-governor-agent",
    ])
    .nullable()
    .default(null),
  routingMode: z.enum(["auto", "manual"]).default("auto"),
  manualOverride: z.boolean().default(false),
  handoffReason: z.string().nullable().default(null),
  overrideSourceAgent: z
    .enum([
      "director-agent",
      "companion-agent",
      "analyst-agent",
      "balance-agent",
      "life-secretary-agent",
      "memory-governor-agent",
    ])
    .nullable()
    .default(null),
  reasoning: z.string().min(1),
  visibleSummary: z.string().min(1),
});
type CoachRouteDecision = z.output<typeof coachRouteDecisionSchema>;

const coachJarvisAuthoritySchema = z.object({
  authorityAgent: z.literal("life-secretary-agent"),
  targetKind: z.enum(["task_order", "recovery_block", "plan_change"]),
  executionMode: z.enum(["apply_direct", "proposal"]),
  orderedTaskIds: z.array(z.string()).optional(),
  rationale: z.string().min(1),
  summary: z.string().optional(),
  beforeStateSummary: z.string().optional(),
  afterStateSummary: z.string().optional(),
  nextStep: z.string().optional(),
  suggestedMinutes: z.number().optional(),
});

const coachDataAuthoritySchema = z.object({
  authorityAgent: z.literal("memory-governor-agent"),
  action: z.enum(["accept_candidate", "reject_candidate", "block_recall", "delete_memory"]),
  executionMode: z.literal("govern"),
  candidateId: z.string().nullable().optional(),
  memoryId: z.string().nullable().optional(),
  rationale: z.string().min(1),
  summary: z.string().optional(),
});

const normalizeFastGeneration = (raw: unknown) => {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fastResponse =
    (typeof record.fastResponse === "string" && record.fastResponse.trim().length > 0
      ? record.fastResponse.trim()
      : typeof record.response === "string" && record.response.trim().length > 0
        ? record.response.trim()
        : undefined) ?? "";

  return {
    fastResponse,
    status: "pending_full" as const,
  };
};

const normalizeFullGeneration = (raw: unknown) => {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fastResponse =
    (typeof record.fastResponse === "string" && record.fastResponse.trim().length > 0
      ? record.fastResponse.trim()
      : typeof record.summary === "string" && record.summary.trim().length > 0
        ? record.summary.trim()
        : undefined) ?? "";
  const fullResponse =
    (typeof record.fullResponse === "string" && record.fullResponse.trim().length > 0
      ? record.fullResponse.trim()
      : typeof record.response === "string" && record.response.trim().length > 0
        ? record.response.trim()
        : typeof record.message === "string" && record.message.trim().length > 0
          ? record.message.trim()
          : undefined) ?? "";

  return {
    fastResponse,
    fullResponse,
    status: "completed" as const,
  };
};

const normalizeConsultGeneration = (raw: unknown) => {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const consultSummary =
    (typeof record.consultSummary === "string" && record.consultSummary.trim().length > 0
      ? record.consultSummary.trim()
      : typeof record.fullResponse === "string" && record.fullResponse.trim().length > 0
        ? record.fullResponse.trim()
        : typeof record.response === "string" && record.response.trim().length > 0
          ? record.response.trim()
          : undefined) ?? "";

  return {
    consultSummary,
    status: "consulted" as const,
  };
};

const normalizeCoachRouteDecision = (raw: unknown, fallbackDecision: ReturnType<typeof routeWithPicard>): CoachRouteDecision => {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const allowedAgents = new Set([
    "director-agent",
    "companion-agent",
    "analyst-agent",
    "balance-agent",
    "life-secretary-agent",
    "memory-governor-agent",
  ]);
  const frontAgent =
    typeof record.frontAgent === "string" && allowedAgents.has(record.frontAgent)
      ? (record.frontAgent as typeof fallbackDecision.frontAgent)
      : fallbackDecision.frontAgent;
  const consultedAgent =
    record.consultedAgent === null
      ? null
      : typeof record.consultedAgent === "string" && allowedAgents.has(record.consultedAgent)
        ? (record.consultedAgent as typeof fallbackDecision.consultedAgent)
        : fallbackDecision.consultedAgent;

  return {
    routingOwner: "director-agent" as const,
    frontAgent,
    consultedAgent,
    routingMode:
      record.routingMode === "manual" || record.routingMode === "auto"
        ? (record.routingMode as "auto" | "manual")
        : fallbackDecision.routingMode,
    manualOverride: typeof record.manualOverride === "boolean" ? record.manualOverride : fallbackDecision.manualOverride,
    handoffReason:
      record.handoffReason === null
        ? null
        : typeof record.handoffReason === "string"
          ? record.handoffReason
          : fallbackDecision.handoffReason,
    overrideSourceAgent:
      record.overrideSourceAgent === null
        ? null
        : typeof record.overrideSourceAgent === "string" && allowedAgents.has(record.overrideSourceAgent)
          ? (record.overrideSourceAgent as typeof fallbackDecision.overrideSourceAgent)
          : fallbackDecision.overrideSourceAgent,
    reasoning: typeof record.reasoning === "string" && record.reasoning.trim().length > 0 ? record.reasoning.trim() : fallbackDecision.reasoning,
    visibleSummary:
      typeof record.visibleSummary === "string" && record.visibleSummary.trim().length > 0
        ? record.visibleSummary.trim()
        : fallbackDecision.visibleSummary,
  };
};

export class ConversationCoachService {
  private readonly traceLogger: MindAnchorTraceLogger;
  private readonly models: ModelBridge;
  private readonly pendingCompletionJobs = new Set<Promise<void>>();

  constructor(
    private readonly store: MindAnchorStore,
    private readonly env: AppEnv,
    private readonly authorityExecution?: AgentAuthorityExecutionService,
    private readonly agentMemory?: AgentMemoryService,
    traceLogger?: MindAnchorTraceLogger,
  ) {
    this.traceLogger = traceLogger?.child("conversation-coach") ?? new MindAnchorTraceLogger(store).child("conversation-coach");
    this.models = new ModelBridge(env, this.traceLogger.child("model-bridge"));
  }

  private trackPendingCompletion(job: Promise<void>) {
    this.pendingCompletionJobs.add(job);
    void job.finally(() => {
      this.pendingCompletionJobs.delete(job);
    });
  }

  async shutdown() {
    if (this.pendingCompletionJobs.size === 0) {
      return;
    }
    await Promise.allSettled([...this.pendingCompletionJobs]);
  }

  private hashText(text: string) {
    return createHash("sha256").update(text).digest("hex");
  }

  private deriveAuthorityIntent(userText: string) {
    const normalized = userText.trim().toLowerCase();
    const needsPlanWrite = /(计划|安排|改排|调整|优先级|排序|重排|排期)/.test(normalized);
    const needsMemoryGovernance = /(忘记|删除记忆|别再提|不要记住|屏蔽这条记忆)/.test(normalized);

    let jarvisAction: "task_order" | "recovery_block" | "plan_change" | null = null;
    if (needsPlanWrite) {
      if (/(排序|优先级|重排|提前|靠前)/.test(normalized)) {
        jarvisAction = "task_order";
      } else if (/(恢复|休息|缓一缓|先停一下)/.test(normalized)) {
        jarvisAction = "recovery_block";
      } else {
        jarvisAction = "plan_change";
      }
    }

    let dataActionPreference: "reject_candidate" | "block_recall" | "delete_memory" | null = null;
    if (needsMemoryGovernance) {
      if (/(别再提|屏蔽)/.test(normalized)) {
        dataActionPreference = "block_recall";
      } else if (/(不要记住|别记住)/.test(normalized)) {
        dataActionPreference = "reject_candidate";
      } else {
        dataActionPreference = "delete_memory";
      }
    }

    return {
      needsPlanWrite,
      needsMemoryGovernance,
      jarvisAction,
      dataActionPreference,
    };
  }

  private async selectFrontRoute(input: { userId: string; userText: string; traceId: string; sessionId?: string }): Promise<CoachRouteDecision> {
    const directorMemory = this.getAgentMemoryBundle(input.userId, "director-agent");
    const authorityIntent = this.deriveAuthorityIntent(input.userText);
    const fallbackDecision = routeWithPicard({
      workflow: "coach_conversation",
      userMessage: input.userText,
      memoryContext: this.toPicardMemoryContext(directorMemory.bundle),
      contextSource: "conversation",
      hasEmotionSignal: false,
      hasRecentSignals: false,
      requiresPlanWrite: authorityIntent.needsPlanWrite,
      requiresMemoryGovernance: authorityIntent.needsMemoryGovernance,
    });
    const normalizedFallbackDecision = normalizeCoachRouteDecision({}, fallbackDecision);

    return this.models.generateJson<CoachRouteDecision>({
      target: "director-agent",
      systemPrompt: [
        "You are Picard, the routing owner for MindAnchor Coach.",
        "Return exactly one JSON object and nothing else.",
        'Use this exact shape: {"routingOwner":"director-agent","frontAgent":"director-agent|companion-agent|analyst-agent|balance-agent|life-secretary-agent|memory-governor-agent","consultedAgent":"director-agent|companion-agent|analyst-agent|balance-agent|life-secretary-agent|memory-governor-agent|null","routingMode":"auto|manual","manualOverride":boolean,"handoffReason":"string|null","overrideSourceAgent":"director-agent|companion-agent|analyst-agent|balance-agent|life-secretary-agent|memory-governor-agent|null","reasoning":"string","visibleSummary":"string"}.',
        "Choose the single best frontAgent for this turn.",
        "Use consultedAgent only when one lightweight specialist consult is genuinely helpful.",
      ].join(" "),
      userPrompt: JSON.stringify({
        workflow: "coach_conversation_route",
        userMessage: input.userText,
        userText: input.userText,
        authorityIntent,
        memoryContext: this.toPicardMemoryContext(directorMemory.bundle),
        fallbackDecision,
      }),
      schema: coachRouteDecisionSchema,
      normalize: (raw) => normalizeCoachRouteDecision(raw, fallbackDecision),
      fallback: () => normalizedFallbackDecision,
      traceContext: this.buildTraceContext({
        traceId: input.traceId,
        userId: input.userId,
        sessionId: input.sessionId,
        agentName: "director-agent",
        workflow: "coach_conversation_route",
      }),
      runtimeContext: this.buildConversationRuntimeContext(input.userId, "director-agent", "coach_conversation_route"),
    });
  }

  private buildConversationRuntimeContext(userId: string, agentName: string, workflow: string) {
    const persona = Object.values(agentTeamPersonaMetadata).find((entry) => entry.agentId === agentName);
    if (!persona) {
      return {
        workflow,
        userId,
        gatewayBaseUrl: `http://127.0.0.1:${this.env.apiPort}`,
      };
    }

    return {
      workflow,
      userId,
      frontAgent: persona.canFront ? persona.agentId : undefined,
      runtimeAgentId: persona.runtimeAgentId,
      memoryScopes: [...persona.memoryScopes],
      gatewayBaseUrl: `http://127.0.0.1:${this.env.apiPort}`,
    };
  }

  private toPicardMemoryContext(bundle: AgentMemoryContextBundle) {
    return {
      preferences: bundle.preferences.map((item) => ({ summary: item.summary })),
      habits: bundle.habits.map((item) => ({ summary: item.summary })),
      constraints: bundle.constraints.map((item) => ({ summary: item.summary })),
    };
  }

  private flattenBundleSummaries(bundle: AgentMemoryContextBundle) {
    return [...bundle.preferences, ...bundle.habits, ...bundle.constraints, ...bundle.recentContext].map((item) => ({
      summary: item.summary,
    }));
  }

  private buildUsedMemoryEntries(bundle: AgentMemoryContextBundle): CoachMessageUsedMemoryEntry[] {
    const seen = new Set<string>();
    const entries = [...bundle.preferences, ...bundle.habits, ...bundle.constraints, ...bundle.recentContext]
      .map((entry, index) => ({ entry, index }))
      .flatMap(({ entry, index }) => {
        const summary = entry.summary.trim();
        const key = `${entry.source}:${entry.kind}:${summary}`;
        if (!summary || seen.has(key)) {
          return [];
        }
        seen.add(key);
        return [
          {
            originalIndex: index,
            item: {
              memoryId: entry.source === "coach-memory" ? entry.memoryId : null,
              summary,
              kind: entry.kind,
              source: entry.source,
            } satisfies CoachMessageUsedMemoryEntry,
          },
        ];
      })
      .sort((left, right) => {
        const leftPriority = USED_MEMORY_SOURCE_PRIORITY[left.item.source] ?? 99;
        const rightPriority = USED_MEMORY_SOURCE_PRIORITY[right.item.source] ?? 99;
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }
        return left.originalIndex - right.originalIndex;
      });

    const selected: CoachMessageUsedMemoryEntry[] = [];
    const sourceCounts = new Map<string, number>();

    for (const candidate of entries) {
      if (selected.length >= MAX_USED_MEMORY_EXPLAINABILITY_ENTRIES) {
        break;
      }
      const source = candidate.item.source;
      const currentCount = sourceCounts.get(source) ?? 0;
      const limit = USED_MEMORY_SOURCE_DIVERSITY_LIMIT[source];
      if (limit !== undefined && currentCount >= limit) {
        continue;
      }
      selected.push(candidate.item);
      sourceCounts.set(source, currentCount + 1);
    }

    if (selected.length < MAX_USED_MEMORY_EXPLAINABILITY_ENTRIES) {
      for (const candidate of entries) {
        if (selected.length >= MAX_USED_MEMORY_EXPLAINABILITY_ENTRIES) {
          break;
        }
        if (
          selected.some(
            (item) =>
              item.source === candidate.item.source &&
              item.kind === candidate.item.kind &&
              item.summary === candidate.item.summary,
          )
        ) {
          continue;
        }
        selected.push(candidate.item);
      }
    }

    return selected;
  }

  private buildConversationPathSummary(traceId: string): ConversationPathSummary | null {
    const events = this.store.listTraceLogEvents(traceId, 200);
    let frontAgent: string | null = null;
    let consultedAgent: string | null = null;
    let authorityAgent: string | null = null;
    let authorityTarget: string | null = null;
    let authorityExecutionStatus: string | null = null;
    let routeSummary: string | null = null;
    let authoritySummary: string | null = null;
    let revokedMemoryCount = 0;
    const routeData = collectConversationRouteData(events);

    for (const event of events) {
      if (event.event === "coach.route.selected") {
        frontAgent = typeof event.metadata?.frontAgent === "string" ? event.metadata.frontAgent : frontAgent;
        consultedAgent = typeof event.metadata?.consultedAgent === "string" ? event.metadata.consultedAgent : consultedAgent;
        routeSummary = typeof event.metadata?.visibleSummary === "string" ? event.metadata.visibleSummary : routeSummary;
        continue;
      }

      if (event.event === "coach.authority.handoff.completed") {
        authorityAgent = typeof event.metadata?.authorityAgent === "string" ? event.metadata.authorityAgent : authorityAgent;
        authorityTarget =
          (typeof event.metadata?.action === "string" ? event.metadata.action : null) ??
          (typeof event.metadata?.targetKind === "string" ? event.metadata.targetKind : null) ??
          authorityTarget;
        authorityExecutionStatus =
          typeof event.metadata?.executionStatus === "string" ? event.metadata.executionStatus : authorityExecutionStatus;
        authoritySummary = typeof event.metadata?.summary === "string" ? event.metadata.summary : authoritySummary;
        continue;
      }

      if (event.event === "coach.memory.revoked") {
        const count =
          typeof event.metadata?.revokedMemoryCount === "number" && Number.isFinite(event.metadata.revokedMemoryCount)
            ? event.metadata.revokedMemoryCount
            : 1;
        revokedMemoryCount = Math.max(revokedMemoryCount, count);
        continue;
      }

      if (event.event === "coach.feedback.applied") {
        const count =
          typeof event.metadata?.revokedMemoryCount === "number" && Number.isFinite(event.metadata.revokedMemoryCount)
            ? event.metadata.revokedMemoryCount
            : 0;
        revokedMemoryCount = Math.max(revokedMemoryCount, count);
        continue;
      }

    }

    const hasConversationData =
      frontAgent !== null ||
      consultedAgent !== null ||
      authorityAgent !== null ||
      routeData.primaryRoute !== null ||
      revokedMemoryCount > 0;
    if (!hasConversationData) {
      return null;
    }

    const degraded =
      routeData.primaryRoute === "provider-direct" ||
      routeData.primaryRoute === "provider-fallback" ||
      routeData.primaryRoute === "failed" ||
      routeData.hadFallback;
    const degradedReason =
      routeData.primaryRoute === "provider-fallback"
        ? "cluster_fallback"
        : routeData.primaryRoute === "provider-direct"
          ? "cluster_disabled_or_not_used"
          : routeData.primaryRoute === "failed"
            ? "generation_failed"
            : routeData.hadFallback
              ? "cluster_fallback"
              : null;
    const routeStatusSummary =
      routeData.primaryRoute === "cluster" && !routeData.hadFallback
        ? "Cluster path healthy: OpenClaw handled the conversation without fallback."
        : routeData.primaryRoute === "provider-direct"
          ? "Provider-direct path: cluster was not used for this conversation."
          : routeData.primaryRoute === "provider-fallback" || routeData.hadFallback
            ? "Fallback path: cluster did not fully handle this conversation."
            : routeData.primaryRoute === "failed"
              ? "Failed path: generation did not complete successfully."
              : null;
    const degradedSummary =
      degradedReason === "cluster_disabled_or_not_used"
        ? "Conversation degraded because cluster was bypassed and provider-direct handled the response."
        : degradedReason === "cluster_fallback"
          ? "Conversation degraded because cluster could not fully complete the turn and a fallback path was used."
          : degradedReason === "generation_failed"
            ? "Conversation degraded because generation failed before a stable response path completed."
            : null;

    return {
      frontAgent,
      consultedAgent,
      authorityAgent,
      authorityTarget,
      authorityExecutionStatus,
      runtimeSource: routeData.runtimeSource,
      revokedMemoryCount,
      routeSummary,
      authoritySummary,
      routeStatusSummary,
      degradedSummary,
      routeMetrics: routeData.routeMetrics,
      primaryRoute: routeData.primaryRoute,
      usedOpenClaw: routeData.usedOpenClaw,
      hadFallback: routeData.hadFallback,
      degraded,
      degradedReason,
    };
  }

  private buildPersonaMemoryFramingHints(frontAgent: string, entries: CoachMessageUsedMemoryEntry[]): PersonaMemoryFramingHint[] {
    return entries.map((entry) => ({
      label: personaMemoryLabel(frontAgent, entry.source, entry.kind),
      summary: entry.summary,
      source: entry.source,
      kind: entry.kind,
    }));
  }

  private deriveHelpfulFeedbackTargetScope(userId: string, message: CoachMessage): HelpfulFeedbackStrengtheningScope {
    const recalledKinds = [
      ...message.usedMemoryIds
        .map((memoryId) => this.store.listCoachMemoryItems(userId, 100).find((item) => item.id === memoryId))
        .filter((item): item is CoachMemoryItem => Boolean(item))
        .map((item) => item.kind),
      ...message.usedMemoryEntries.map((entry) => entry.kind),
    ];

    return recalledKinds.some((kind) => kind === "habit" || kind === "work_style") ? "habits" : "preferences";
  }

  private collectHelpfulFeedbackStrengtheningHints(userId: string) {
    const hints: PersonaMemoryFramingHint[] = [];
    const usedEntries: CoachMessageUsedMemoryEntry[] = [];
    const sourceAgents = new Set<string>();
    const seen = new Set<string>();
    let staleCandidateCount = 0;
    let missingSourceMessageCount = 0;
    const targetScopeCounts: Record<HelpfulFeedbackStrengtheningScope, number> = {
      preferences: 0,
      habits: 0,
    };

    for (const candidate of this.store.listPendingMemoryCandidates(userId, 20)) {
      const targetScope = parseHelpfulFeedbackStrengtheningScope(candidate.sourceTurnRef);
      if (!targetScope) {
        continue;
      }
      const eligibility = classifyHelpfulFeedbackStrengtheningCandidate({
        sourceTurnRef: candidate.sourceTurnRef,
        getSourceMessageCreatedAt: (messageId) => this.store.getCoachMessage(userId, messageId)?.createdAt,
      });
      if (eligibility === "stale") {
        staleCandidateCount += 1;
        continue;
      }
      if (eligibility === "missing_source") {
        missingSourceMessageCount += 1;
        continue;
      }

      const summary = candidate.summary.trim();
      const dedupeKey = `${targetScope}:${summary}`;
      if (!summary || seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      sourceAgents.add(candidate.sourceAgent);
      targetScopeCounts[targetScope] += 1;
      hints.push({
        label: targetScope === "habits" ? "已验证习惯候选" : "已验证偏好候选",
        summary,
        source: "gateway-memory",
        kind: targetScope === "habits" ? "habit" : "preference",
      });
      usedEntries.push({
        memoryId: null,
        summary,
        kind: targetScope === "habits" ? "habit" : "preference",
        source: "feedback-strengthening",
      });
    }

    return {
      hints: hints.slice(0, 2),
      usedEntries: usedEntries.slice(0, 2),
      candidateCount: hints.length,
      staleCandidateCount,
      missingSourceMessageCount,
      sourceAgents: [...sourceAgents],
      targetScopeCounts,
    };
  }

  private buildConversationMemoryFramingHints(userId: string, frontAgent: string, entries: CoachMessageUsedMemoryEntry[]) {
    const strengthening = this.collectHelpfulFeedbackStrengtheningHints(userId);
    return {
      hints: [...this.buildPersonaMemoryFramingHints(frontAgent, entries), ...strengthening.hints],
      strengthening,
    };
  }

  private buildGovernanceMemoryFramingHints(input: {
    recalledMemory: CoachMemoryItem[];
    activeMemoryItems: Array<{ summary: string; status?: string }>;
    pendingCandidates: Array<{ summary: string; status?: string }>;
  }): PersonaMemoryFramingHint[] {
    const hints: PersonaMemoryFramingHint[] = [];
    const pushHint = (label: string, summary: string, source: string, kind: string) => {
      const normalized = summary.trim();
      if (!normalized || hints.some((item) => item.label === label && item.summary === normalized)) {
        return;
      }
      hints.push({ label, summary: normalized, source, kind });
    };

    for (const item of input.recalledMemory) {
      pushHint("治理目标", item.summary, "coach-memory", item.kind);
    }
    for (const item of input.activeMemoryItems) {
      pushHint("治理目标", item.summary, "gateway-memory", "constraint");
    }
    for (const item of input.pendingCandidates) {
      pushHint("待治理候选", item.summary, "gateway-memory", "candidate");
    }

    return hints.slice(0, MAX_USED_MEMORY_EXPLAINABILITY_ENTRIES);
  }

  private getAgentMemoryBundle(userId: string, agentId: (typeof agentTeamPersonaMetadata)[keyof typeof agentTeamPersonaMetadata]["agentId"]) {
    if (!this.agentMemory) {
      const coachMemoryItems = this.getActiveMemory(userId);
      return {
        bundle: {
          userId,
          agentId,
          scopes: [],
          identity: [],
          preferences: coachMemoryItems.map((item) => ({
            memoryId: item.id,
            kind: item.kind,
            summary: item.summary,
            source: "coach-memory",
            confidence: item.confidence,
            updatedAt: item.lastUsedAt ?? item.createdAt,
            recallAllowed: item.status === "active",
          })),
          habits: [],
          constraints: [],
          recentContext: [],
          metadata: {
            activeMemoryCount: coachMemoryItems.length,
            proposalCount: 0,
            retrievedAt: new Date().toISOString(),
            scopeEntryCounts: {
              preferences: coachMemoryItems.length,
              habits: 0,
              constraints: 0,
              recentContext: 0,
            },
            sourceCounts: coachMemoryItems.length > 0 ? { "coach-memory": coachMemoryItems.length } : {},
          },
        } satisfies AgentMemoryContextBundle,
        coachMemoryItems,
      };
    }

    const bundle = this.agentMemory.getContext({ userId, agentId });
    const coachMemoryItems = bundle
      .preferences
      .concat(bundle.habits)
      .filter((item) => item.source === "coach-memory")
      .map((entry) => this.store.listCoachMemoryItems(userId, 100).find((item) => item.id === entry.memoryId))
      .filter((item): item is CoachMemoryItem => Boolean(item));

    return {
      bundle,
      coachMemoryItems,
    };
  }

  private async maybeExecuteJarvisAuthorityHandoff({
    userId,
    sessionId,
    traceId,
    assistantMessageId,
    inputText,
  }: {
    userId: string;
    sessionId: string;
    traceId: string;
    assistantMessageId: string;
    inputText: string;
  }) {
    if (!this.authorityExecution) {
      return null;
    }

    const authorityIntent = this.deriveAuthorityIntent(inputText);
    if (!authorityIntent.needsPlanWrite || !authorityIntent.jarvisAction) {
      return null;
    }

    const goals = this.store.listGoals(userId);
    const goalId = goals[0]?.id;
    const tasks = this.store.listTasks(userId, goalId);
    const activeSession = this.store.getActiveSession(userId);
    const authorityMemory = this.getAgentMemoryBundle(userId, "life-secretary-agent");
    const authorityUsedMemoryEntries = this.buildUsedMemoryEntries(authorityMemory.bundle);
    const authorityMemoryFramingHints = this.buildPersonaMemoryFramingHints(
      "life-secretary-agent",
      authorityUsedMemoryEntries,
    );

    await this.traceLogger.info({
      traceId,
      event: "coach.authority.handoff.started",
      message: "Coach authority handoff started",
      metadata: {
        userId,
        sessionId,
        assistantMessageId,
        authorityAgent: "life-secretary-agent",
        targetKind: authorityIntent.jarvisAction,
      },
    });

    const authorityResult = await this.models.generateJson({
      target: "life-secretary-agent",
      systemPrompt: [
        "You are Jarvis for MindAnchor.",
        "Return exactly one JSON object and nothing else.",
        'Use this exact shape: {"authorityAgent":"life-secretary-agent","targetKind":"task_order|recovery_block|plan_change","executionMode":"apply_direct|proposal","orderedTaskIds":["task-id optional"],"rationale":"string","summary":"string optional","beforeStateSummary":"string optional","afterStateSummary":"string optional","nextStep":"string optional","suggestedMinutes":15}.',
      ].join(" "),
      userPrompt: JSON.stringify({
        workflow: "plan_adjustment",
        action: authorityIntent.jarvisAction,
        riskLevel: authorityIntent.jarvisAction === "task_order" || authorityIntent.jarvisAction === "recovery_block" ? "low" : "high",
        userId,
        goalId,
        sessionId: activeSession?.id ?? sessionId,
        taskId: activeSession?.taskId ?? tasks[0]?.id ?? null,
        rationale: inputText,
        tasks,
        memoryFramingHints: authorityMemoryFramingHints,
      }),
      schema: coachJarvisAuthoritySchema,
      normalize: (raw) => coachJarvisAuthoritySchema.parse(executeJarvisAuthority(raw)),
      fallback: () =>
        executeJarvisAuthority({
          action: authorityIntent.jarvisAction,
          riskLevel: authorityIntent.jarvisAction === "task_order" || authorityIntent.jarvisAction === "recovery_block" ? "low" : "high",
          rationale: inputText,
          tasks,
        }),
      traceContext: this.buildTraceContext({
        traceId,
        userId,
        sessionId,
        agentName: "life-secretary-agent",
        workflow: "plan_adjustment",
      }),
    });

    const execution = await this.authorityExecution.executeJarvisDecision({
      userId,
      goalId,
      riskLevel: authorityResult.executionMode === "apply_direct" ? "low" : "high",
      authorityAgent: authorityResult.authorityAgent,
      targetKind: authorityResult.targetKind,
      executionMode: authorityResult.executionMode,
      orderedTaskIds: authorityResult.orderedTaskIds,
      rationale: authorityResult.rationale,
      summary: authorityResult.summary,
      beforeStateSummary: authorityResult.beforeStateSummary,
      afterStateSummary: authorityResult.afterStateSummary,
      sessionId: activeSession?.id ?? sessionId,
      taskId: activeSession?.taskId ?? tasks[0]?.id ?? undefined,
      nextStep: authorityResult.nextStep,
      suggestedMinutes: authorityResult.suggestedMinutes,
      includeReadModelRefresh: false,
    });

    await this.traceLogger.info({
      traceId,
      event: "coach.authority.handoff.completed",
      message: "Coach authority handoff completed",
      metadata: {
        userId,
        sessionId,
        assistantMessageId,
        authorityAgent: "life-secretary-agent",
        targetKind: authorityResult.targetKind,
        executionStatus: execution.status,
        summary: authorityResult.summary ?? null,
      },
    });

    return {
      ...execution,
      coachAuthoritySummary: authorityResult.summary ?? null,
    };
  }

  private selectFallbackDataGovernanceTarget({
    userId,
    preferredAction,
  }: {
    userId: string;
    preferredAction: "reject_candidate" | "block_recall" | "delete_memory";
  }) {
    const activeMemoryItems = this.store.listRecallEligibleMemory(userId).slice(0, 5);
    const pendingCandidates = this.store.listPendingMemoryCandidates(userId, 5);

    if (preferredAction === "reject_candidate" && pendingCandidates[0]) {
      return {
        authorityAgent: "memory-governor-agent" as const,
        action: "reject_candidate" as const,
        executionMode: "govern" as const,
        candidateId: pendingCandidates[0].candidateId,
        memoryId: null,
        rationale: "用户明确要求不要把这条偏好继续记为长期记忆。",
        summary: "Data rejected a pending memory candidate.",
      };
    }

    if (preferredAction === "block_recall" && activeMemoryItems[0]) {
      return {
        authorityAgent: "memory-governor-agent" as const,
        action: "block_recall" as const,
        executionMode: "govern" as const,
        candidateId: null,
        memoryId: activeMemoryItems[0].memoryId,
        rationale: "用户明确要求暂时不要再提及这条长期记忆。",
        summary: "Data blocked recall for an active memory.",
      };
    }

    if (preferredAction === "delete_memory" && activeMemoryItems[0]) {
      return {
        authorityAgent: "memory-governor-agent" as const,
        action: "delete_memory" as const,
        executionMode: "govern" as const,
        candidateId: null,
        memoryId: activeMemoryItems[0].memoryId,
        rationale: "用户明确要求删除这条长期记忆。",
        summary: "Data deleted an active memory.",
      };
    }

    if (activeMemoryItems[0]) {
      return {
        authorityAgent: "memory-governor-agent" as const,
        action: "delete_memory" as const,
        executionMode: "govern" as const,
        candidateId: null,
        memoryId: activeMemoryItems[0].memoryId,
        rationale: "当前可治理目标是活动中的长期记忆，优先执行删除。",
        summary: "Data deleted the most recent active memory.",
      };
    }

    if (pendingCandidates[0]) {
      return {
        authorityAgent: "memory-governor-agent" as const,
        action: "reject_candidate" as const,
        executionMode: "govern" as const,
        candidateId: pendingCandidates[0].candidateId,
        memoryId: null,
        rationale: "当前没有已生效长期记忆，回退为拒绝最近的待治理候选。",
        summary: "Data rejected the most recent pending memory candidate.",
      };
    }

    return null;
  }

  private async revokeCoachMemoryForGovernance({
    userId,
    traceId,
    sessionId,
    assistantMessageId,
    recalledMemory,
  }: {
    userId: string;
    traceId: string;
    sessionId: string;
    assistantMessageId: string;
    recalledMemory: CoachMemoryItem[];
  }) {
    const targets = (recalledMemory.length > 0 ? recalledMemory : this.store.listActiveCoachMemoryItems(userId, 1)).filter(
      (item) => item.status === "active" && item.revokedAt === null,
    );
    if (targets.length === 0) {
      return { revokedMemoryCount: 0, invalidatedTrainingCount: 0 };
    }

    let revokedMemoryCount = 0;
    let invalidatedTrainingCount = 0;
    const seenSourceMessageIds = new Set<string>();
    for (const memory of targets) {
      const revoked = await this.store.revokeCoachMemoryItem(userId, memory.id);
      if (!revoked) {
        continue;
      }
      revokedMemoryCount += 1;
      if (!seenSourceMessageIds.has(memory.sourceMessageId)) {
        seenSourceMessageIds.add(memory.sourceMessageId);
        invalidatedTrainingCount += await this.store.invalidateCoachTrainingExamplesBySourceMessage(userId, memory.sourceMessageId);
      }
    }

    await this.traceLogger.info({
      traceId,
      event: "coach.memory.revoked",
      message: "Coach memory revoked by governance handoff",
      metadata: {
        userId,
        sessionId,
        assistantMessageId,
        revokedMemoryCount,
        invalidatedTrainingCount,
      },
    });

    return {
      revokedMemoryCount,
      invalidatedTrainingCount,
    };
  }

  private async maybeExecuteDataAuthorityHandoff({
    userId,
    sessionId,
    traceId,
    assistantMessageId,
    inputText,
    recalledMemory,
  }: {
    userId: string;
    sessionId: string;
    traceId: string;
    assistantMessageId: string;
    inputText: string;
    recalledMemory: CoachMemoryItem[];
  }) {
    if (!this.authorityExecution) {
      return null;
    }

    const authorityIntent = this.deriveAuthorityIntent(inputText);
    if (!authorityIntent.needsMemoryGovernance || !authorityIntent.dataActionPreference) {
      return null;
    }

    const activeMemoryItems = this.store.listRecallEligibleMemory(userId).slice(0, 5);
    const pendingCandidates = this.store.listPendingMemoryCandidates(userId, 5);
    const authorityMemoryFramingHints = this.buildGovernanceMemoryFramingHints({
      recalledMemory,
      activeMemoryItems,
      pendingCandidates,
    });
    const fallbackDecision = this.selectFallbackDataGovernanceTarget({
      userId,
      preferredAction: authorityIntent.dataActionPreference,
    });
    if (!fallbackDecision) {
      return null;
    }

    await this.traceLogger.info({
      traceId,
      event: "coach.authority.handoff.started",
      message: "Coach authority handoff started",
      metadata: {
        userId,
        sessionId,
        assistantMessageId,
        authorityAgent: "memory-governor-agent",
        action: authorityIntent.dataActionPreference,
      },
    });

    const authorityResult = await this.models.generateJson({
      target: "memory-governor-agent",
      systemPrompt: [
        "You are Data for MindAnchor.",
        "Return exactly one JSON object and nothing else.",
        'Use this exact shape: {"authorityAgent":"memory-governor-agent","action":"accept_candidate|reject_candidate|block_recall|delete_memory","executionMode":"govern","candidateId":"optional","memoryId":"optional","rationale":"string","summary":"string optional"}.',
        "Choose the smallest safe governance action that matches the user's explicit request.",
      ].join(" "),
      userPrompt: JSON.stringify({
        workflow: "memory_governance",
        action: fallbackDecision.action,
        candidateId: fallbackDecision.candidateId,
        memoryId: fallbackDecision.memoryId,
        rationale: fallbackDecision.rationale,
        requestedAction: authorityIntent.dataActionPreference,
        userText: inputText,
        recalledCoachMemory: recalledMemory.map((item) => ({
          id: item.id,
          summary: item.summary,
        })),
        activeMemoryItems: activeMemoryItems.map((item) => ({
          memoryId: item.memoryId,
          summary: item.summary,
          status: item.status,
        })),
        pendingCandidates: pendingCandidates.map((candidate) => ({
          candidateId: candidate.candidateId,
          summary: candidate.summary,
          status: candidate.status,
        })),
        memoryFramingHints: authorityMemoryFramingHints,
      }),
      schema: coachDataAuthoritySchema,
      normalize: (raw) => coachDataAuthoritySchema.parse(executeDataGovernance(raw)),
      fallback: () => fallbackDecision,
      traceContext: this.buildTraceContext({
        traceId,
        userId,
        sessionId,
        agentName: "memory-governor-agent",
        workflow: "memory_governance",
      }),
    });

    const execution = await this.authorityExecution.executeDataDecision({
      authorityAgent: authorityResult.authorityAgent,
      action: authorityResult.action,
      executionMode: authorityResult.executionMode,
      candidateId: authorityResult.candidateId ?? undefined,
      memoryId: authorityResult.memoryId ?? undefined,
      includeReadModelRefresh: false,
    });

    const coachMemoryGovernance = await this.revokeCoachMemoryForGovernance({
      userId,
      traceId,
      sessionId,
      assistantMessageId,
      recalledMemory,
    });

    await this.traceLogger.info({
      traceId,
      event: "coach.authority.handoff.completed",
      message: "Coach authority handoff completed",
      metadata: {
        userId,
        sessionId,
        assistantMessageId,
        authorityAgent: "memory-governor-agent",
        action: authorityResult.action,
        executionStatus:
          execution && typeof execution === "object" && "status" in execution && typeof execution.status === "string"
            ? execution.status
            : null,
        summary: authorityResult.summary ?? null,
        ...coachMemoryGovernance,
      },
    });

    return {
      ...execution,
      coachAuthoritySummary: authorityResult.summary ?? null,
    };
  }

  private async persistFrontState(userId: string, routeDecision: CoachRouteDecision) {
    await this.store.saveCoachFrontAgentState({
      userId,
      currentFrontAgent: routeDecision.frontAgent,
      routingMode: routeDecision.routingMode,
      manualOverride: routeDecision.manualOverride,
      consultedAgent: routeDecision.consultedAgent,
      handoffReason: routeDecision.handoffReason,
      overrideSourceAgent: routeDecision.overrideSourceAgent,
      visibleSummary: routeDecision.visibleSummary,
    });
  }

  private buildTraceContext({
    traceId,
    userId,
    sessionId,
    agentName,
    workflow,
  }: {
    traceId: string;
    userId: string;
    sessionId?: string;
    agentName: string;
    workflow: string;
  }) {
    return {
      traceId,
      source: "mindanchor-gateway" as const,
      operation: "generate" as const,
      agentName,
      workflow,
      userId,
    };
  }

  private getActiveMemory(userId: string) {
    return this.store
      .listCoachMemoryItems(userId)
      .filter((item) => item.status === "active")
      .slice(0, 3);
  }

  private buildMemoryCandidate({
    userId,
    sourceMessageId,
    text,
  }: {
    userId: string;
    sourceMessageId: string;
    text: string;
  }): Omit<CoachMemoryItem, "id" | "createdAt"> | null {
    const normalized = normalizeSnippet(text, 120);
    if (/(忘记|删除记忆|别再提|不要记住|屏蔽这条记忆)/.test(normalized)) {
      return null;
    }
    const trigger = /(更适合|偏好|喜欢|不喜欢|需要|希望|通常|习惯)/;
    if (!trigger.test(normalized)) {
      return null;
    }

    const compactPreference = normalized
      .replace(/^我(更适合|偏好|喜欢|不喜欢|需要|希望|通常|习惯)/, "")
      .replace(/^在[^，。；,;]+时/, "")
      .trim();

    const summaryBase = compactPreference.length > 0 ? compactPreference : normalized;
    const summary = normalizeSnippet(`用户偏好${summaryBase}`, 96);

    return {
      userId,
      kind: "preference",
      summary,
      confidence: 0.72,
      status: "active",
      sourceMessageId,
      sourceExcerpt: normalized,
      lastUsedAt: null,
      revokedAt: null,
    };
  }

  private async persistMemoryCandidate(candidate: Omit<CoachMemoryItem, "id" | "createdAt">, traceId: string, sessionId: string) {
    const existing = this.store
      .listCoachMemoryItems(candidate.userId)
      .find((item) => item.status === "active" && item.summary === candidate.summary);
    if (existing) {
      return existing;
    }

    const memory = await this.store.createCoachMemoryItem(candidate);
    await this.traceLogger.info({
      traceId,
      event: "coach.memory.persisted",
      message: "Coach memory persisted",
      metadata: {
        userId: candidate.userId,
        sessionId,
        memoryId: memory.id,
        kind: memory.kind,
        confidence: memory.confidence,
      },
    });
    return memory;
  }

  private async proposeHelpfulFeedbackStrengthening({
    userId,
    message,
    feedback,
  }: {
    userId: string;
    message: CoachMessage;
    feedback: CoachFeedback;
  }) {
    const targetScope = this.deriveHelpfulFeedbackTargetScope(userId, message);
    const sourceTurnRef = `${HELPFUL_FEEDBACK_STRENGTHENING_PREFIX}:${targetScope}:${message.id}`;
    const existing = this.store.listMemoryCandidates(userId, 100).find((candidate) => candidate.sourceTurnRef === sourceTurnRef);
    if (existing) {
      return existing;
    }

    const frontState = this.store.getCoachFrontAgentState(userId);
    const sourceAgent = frontState?.currentFrontAgent ?? "director-agent";
    const usedMemory = message.usedMemoryIds
      .map((memoryId) => this.store.listCoachMemoryItems(userId, 100).find((item) => item.id === memoryId))
      .find(Boolean);
    const summaryBase =
      usedMemory?.summary ??
      normalizeSnippet(message.fullResponse ?? message.fastResponse ?? "当前建议被用户判定为 helpful，需要记录为轻量 strengthening 候选。", 96);

    const proposal = await this.store.createAgentMemoryProposal({
      userId,
      sourceAgent,
      targetScope,
      kind: "feedback_strengthening",
      summary: summaryBase,
      rationale: feedback.reason ?? "Helpful feedback reinforced this preference or suggestion style.",
      sourceTurnRef,
      confidence: 0.7,
    });

    await this.traceLogger.info({
      traceId: message.traceId ?? createId(),
      event: "coach.feedback.strengthening.proposed",
      message: "Coach helpful feedback proposed a strengthening candidate",
      metadata: {
        userId,
        sessionId: message.sessionId,
        messageId: message.id,
        proposalId: proposal.proposalId ?? null,
        sourceAgent,
        targetScope: proposal.targetScope,
      },
    });

    return proposal;
  }

  private async rejectHelpfulFeedbackStrengtheningCandidates({
    userId,
    message,
  }: {
    userId: string;
    message: CoachMessage;
  }) {
    const strengtheningEntries = message.usedMemoryEntries.filter((entry) => entry.source === "feedback-strengthening");
    if (strengtheningEntries.length === 0) {
      return {
        rejectedCandidateCount: 0,
      };
    }

    const pendingCandidates = this.store.listPendingMemoryCandidates(userId, 50);
    const desiredKeys = new Set(
      strengtheningEntries.map((entry) => {
        const targetScope = entry.kind === "habit" || entry.kind === "work_style" ? "habits" : "preferences";
        return `${targetScope}:${entry.summary}`;
      }),
    );

    let rejectedCandidateCount = 0;
    for (const candidate of pendingCandidates) {
      const targetScope = parseHelpfulFeedbackStrengtheningScope(candidate.sourceTurnRef);
      if (!targetScope) {
        continue;
      }
      const candidateKey = `${targetScope}:${candidate.summary.trim()}`;
      if (!desiredKeys.has(candidateKey)) {
        continue;
      }
      const rejected = await this.store.rejectMemoryCandidate(candidate.candidateId);
      if (rejected) {
        rejectedCandidateCount += 1;
      }
    }

    return {
      rejectedCandidateCount,
    };
  }

  private async completeAssistantMessage({
    userId,
    sessionId,
    traceId,
    userMessage,
    assistantMessageId,
    inputText,
    recalledMemory,
    recalledMemorySummaries,
    frontAgent,
    consultedAgent,
    memoryFramingHints,
    persistDerivedArtifacts = true,
  }: {
    userId: string;
    sessionId: string;
    traceId: string;
    userMessage: CoachMessage;
    assistantMessageId: string;
    inputText: string;
    recalledMemory: CoachMemoryItem[];
    recalledMemorySummaries: ConversationMemorySummary[];
    frontAgent: string;
    consultedAgent: string | null;
    memoryFramingHints: PersonaMemoryFramingHint[];
    persistDerivedArtifacts?: boolean;
  }) {
    try {
      await wait(FULL_RESPONSE_SETTLE_DELAY_MS);

      let consultSummary: string | null = null;
      if (consultedAgent) {
        const consultedMemory = this.getAgentMemoryBundle(
          userId,
          consultedAgent as (typeof agentTeamPersonaMetadata)[keyof typeof agentTeamPersonaMetadata]["agentId"],
        );
        const consultedMemorySummaries = this.flattenBundleSummaries(consultedMemory.bundle);
        const consultedUsedMemoryEntries = this.buildUsedMemoryEntries(consultedMemory.bundle);
        const consultMemoryFramingHints = this.buildPersonaMemoryFramingHints(consultedAgent, consultedUsedMemoryEntries);
        await this.traceLogger.info({
          traceId,
          event: "coach.consult.started",
          message: "Coach consult started",
          metadata: {
            userId,
            sessionId,
            assistantMessageId,
            consultedAgent,
            frontAgent,
          },
        });

        const consultResult = await this.models.generateJson({
          target: consultedAgent,
          systemPrompt: buildCoachFullSystemPrompt(consultedAgent, null),
          userPrompt: JSON.stringify({
            workflow: "coach_conversation_consult",
            frontAgent,
            userText: inputText,
            recalledMemory: consultedMemorySummaries.map((item) => item.summary),
            memoryFramingHints: consultMemoryFramingHints,
            memoryContext: consultedMemory.bundle,
          }),
          schema: coachConsultGenerationSchema,
          normalize: normalizeConsultGeneration,
          fallback: () => ({
            consultSummary: `给 ${frontAgent} 的补充判断：先把当前问题拆成一个现实上最可验证的判断点。`,
            status: "consulted" as const,
          }),
          traceContext: this.buildTraceContext({
            traceId,
            userId,
            sessionId,
            agentName: consultedAgent,
            workflow: "coach_conversation_consult",
          }),
          runtimeContext: this.buildConversationRuntimeContext(userId, consultedAgent, "coach_conversation_consult"),
        });
        consultSummary = consultResult.consultSummary;

        await this.traceLogger.info({
          traceId,
          event: "coach.consult.completed",
          message: "Coach consult completed",
          metadata: {
            userId,
            sessionId,
            assistantMessageId,
            consultedAgent,
            frontAgent,
            consultSummaryLength: consultSummary.length,
          },
        });
      }

      const authorityExecution = frontAgent === "life-secretary-agent"
        ? await this.maybeExecuteJarvisAuthorityHandoff({
            userId,
            sessionId,
            traceId,
            assistantMessageId,
            inputText,
          })
        : frontAgent === "memory-governor-agent"
          ? await this.maybeExecuteDataAuthorityHandoff({
              userId,
              sessionId,
              traceId,
              assistantMessageId,
              inputText,
              recalledMemory,
            })
          : null;
      const frontMemory = this.getAgentMemoryBundle(
        userId,
        frontAgent as (typeof agentTeamPersonaMetadata)[keyof typeof agentTeamPersonaMetadata]["agentId"],
      );
      const usedMemoryEntries = this.buildUsedMemoryEntries(frontMemory.bundle);
      const effectiveRecalledMemorySummaries = frontAgent === "memory-governor-agent" ? [] : recalledMemorySummaries;
      const authoritySummary =
        typeof authorityExecution?.coachAuthoritySummary === "string" && authorityExecution.coachAuthoritySummary.trim().length > 0
          ? authorityExecution.coachAuthoritySummary.trim()
          : authorityExecution?.status === "applied"
          ? "Jarvis 已完成一项低风险计划调整。"
          : authorityExecution?.status === "proposal"
            ? "Jarvis 已生成一个待确认的计划调整提案。"
            : authorityExecution?.status === "deleted"
              ? "Data 已删除一条长期记忆。"
              : authorityExecution?.status === "recall_blocked"
                ? "Data 已阻止一条长期记忆继续被召回。"
                : authorityExecution?.status === "rejected"
                  ? "Data 已拒绝一条待写入的长期记忆候选。"
            : null;

      const fullResult = await this.models.generateJson({
        target: frontAgent,
        systemPrompt: buildCoachFullSystemPrompt(frontAgent, consultedAgent),
        userPrompt: JSON.stringify({
          workflow: "coach_conversation_full",
          frontAgent,
          consultedAgent,
          consultSummary,
          authoritySummary,
          userText: inputText,
          recalledMemory: effectiveRecalledMemorySummaries.map((item) => item.summary),
          memoryFramingHints,
          memoryContext: frontMemory.bundle,
        }),
        schema: coachFullGenerationSchema,
        normalize: normalizeFullGeneration,
        fallback: () => ({
          fastResponse: buildFastResponse(inputText, effectiveRecalledMemorySummaries),
          fullResponse: buildFullResponse(inputText, effectiveRecalledMemorySummaries),
          status: "completed" as const,
        }),
        traceContext: this.buildTraceContext({
          traceId,
          userId,
          sessionId,
          agentName: frontAgent,
          workflow: "coach_conversation_full",
        }),
        runtimeContext: this.buildConversationRuntimeContext(userId, frontAgent, "coach_conversation_full"),
      });

      if (persistDerivedArtifacts) {
        const memoryCandidate = this.buildMemoryCandidate({
          userId,
          sourceMessageId: userMessage.id,
          text: inputText,
        });
        if (memoryCandidate) {
          await this.persistMemoryCandidate(memoryCandidate, traceId, sessionId);
        }

        await this.store.createCoachTrainingExample({
          userId,
          sourceSessionId: sessionId,
          sourceMessageId: userMessage.id,
          contextSnapshotId: createId(),
          status: "candidate",
        });
      }

      const existingAssistantMessage = this.store.getCoachMessage(userId, assistantMessageId);
      const preservedFastResponse =
        existingAssistantMessage?.fastResponse && existingAssistantMessage.fastResponse.trim().length > 0
          ? existingAssistantMessage.fastResponse
          : fullResult.fastResponse;

      const updated = await this.store.updateCoachMessage(assistantMessageId, {
        status: fullResult.status,
        fastResponse: preservedFastResponse,
        fullResponse: fullResult.fullResponse,
        usedMemoryIds: frontAgent === "memory-governor-agent" ? [] : recalledMemory.map((item) => item.id),
        usedMemoryEntries: [...usedMemoryEntries, ...this.collectHelpfulFeedbackStrengtheningHints(userId).usedEntries],
        conversationPath: this.buildConversationPathSummary(traceId),
        traceId,
        errorCode: null,
      });
      if (!updated) {
        return;
      }

      await this.traceLogger.info({
        traceId,
        event: "coach.message.full.completed",
        message: "Coach full response completed",
        metadata: {
          userId,
          sessionId,
          assistantMessageId,
          fullResponseLength: fullResult.fullResponse.length,
        },
      });
    } catch (error) {
      await this.store.updateCoachMessage(assistantMessageId, {
        status: "failed",
        errorCode: "coach_full_generation_failed",
        traceId,
      });
      await this.traceLogger.error({
        traceId,
        event: "coach.message.full.failed",
        message: "Coach full response failed",
        metadata: {
          userId,
          sessionId,
          assistantMessageId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      await this.store.updateCoachMessage(assistantMessageId, {
        conversationPath: this.buildConversationPathSummary(traceId),
      });
    }
  }

  async createSession(userId: string, input: CreateCoachSessionInput, traceId?: string) {
    const session = await this.store.createCoachSession({
      userId,
      title: input.title?.trim().length ? input.title.trim() : "New Coach Session",
      status: "active",
    });
    if (traceId) {
      await this.traceLogger.info({
        traceId,
        event: "coach.session.created",
        message: "Coach session created",
        metadata: {
          userId,
          sessionId: session.id,
          titleLength: session.title.length,
        },
      });
    }
    return session;
  }

  listSessions(userId: string) {
    return this.store.listCoachSessions(userId);
  }

  getSession(userId: string, sessionId: string) {
    const session = this.store.getCoachSession(userId, sessionId);
    if (!session) {
      return null;
    }

    const messages = this.store.listCoachMessagesBySession(userId, sessionId);
    const feedback = messages.flatMap((message) => this.store.listCoachFeedbackByMessage(userId, message.id));

    return {
      session,
      messages,
      feedback,
    };
  }

  deleteSession(userId: string, sessionId: string) {
    return this.store.deleteCoachSession(userId, sessionId);
  }

  async sendMessage(userId: string, sessionId: string, input: CreateCoachMessageInput, traceId: string) {
    const session = this.store.getCoachSession(userId, sessionId);
    if (!session) {
      return null;
    }

    const userMessage = await this.store.createCoachMessage({
      userId,
      sessionId,
      role: "user",
      status: "completed",
      userText: input.text,
      fastResponse: null,
      fullResponse: null,
      usedMemoryIds: [],
      usedMemoryEntries: [],
      traceId,
      errorCode: null,
    });

    const routeDecision = await this.selectFrontRoute({
      userId,
      userText: input.text,
      traceId,
      sessionId,
    });
    const frontAgent = routeDecision.frontAgent;
    const consultedAgent = routeDecision.consultedAgent;
    const frontMemory = this.getAgentMemoryBundle(userId, frontAgent as (typeof agentTeamPersonaMetadata)[keyof typeof agentTeamPersonaMetadata]["agentId"]);
    const recalledMemory = frontMemory.coachMemoryItems;
    const recalledMemorySummaries = this.flattenBundleSummaries(frontMemory.bundle);
    const usedMemoryEntries = this.buildUsedMemoryEntries(frontMemory.bundle);
    const memoryFraming = this.buildConversationMemoryFramingHints(userId, frontAgent, usedMemoryEntries);
    const memoryFramingHints = memoryFraming.hints;
    await this.persistFrontState(userId, routeDecision);

    await this.traceLogger.info({
      traceId,
      event: "coach.route.selected",
      message: "Coach route selected",
      metadata: {
        userId,
        sessionId,
        frontAgent,
        consultedAgent,
        visibleSummary: routeDecision.visibleSummary,
      },
    });

    await this.traceLogger.info({
      traceId,
      event: "coach.message.fast.started",
      message: "Coach fast response started",
      metadata: {
        userId,
        sessionId,
        userMessageId: userMessage.id,
        textHash: this.hashText(input.text),
        textLength: input.text.length,
      },
    });

    for (const item of recalledMemory) {
      await this.store.touchCoachMemoryItemLastUsed(userId, item.id);
    }

    if (recalledMemory.length > 0) {
      await this.traceLogger.info({
        traceId,
        event: "coach.memory.recalled",
        message: "Coach memory recalled",
        metadata: {
          userId,
          sessionId,
          memoryIds: recalledMemory.map((item) => item.id),
          count: recalledMemory.length,
          scopes: frontMemory.bundle.scopes,
          sourceCounts: frontMemory.bundle.metadata.sourceCounts ?? {},
          scopeEntryCounts:
            frontMemory.bundle.metadata.scopeEntryCounts ?? {
              preferences: frontMemory.bundle.preferences.length,
              habits: frontMemory.bundle.habits.length,
              constraints: frontMemory.bundle.constraints.length,
              recentContext: frontMemory.bundle.recentContext.length,
            },
        },
      });
    }

    if (memoryFraming.strengthening.candidateCount > 0) {
      await this.traceLogger.info({
        traceId,
        event: "coach.feedback.strengthening.recalled",
        message: "Helpful-feedback strengthening candidates recalled for this turn",
        metadata: {
          userId,
          sessionId,
          frontAgent,
          candidateCount: memoryFraming.strengthening.candidateCount,
          staleCandidateCount: memoryFraming.strengthening.staleCandidateCount,
          missingSourceMessageCount: memoryFraming.strengthening.missingSourceMessageCount,
          sourceAgents: memoryFraming.strengthening.sourceAgents,
          targetScopeCounts: memoryFraming.strengthening.targetScopeCounts,
        },
      });
    } else if (
      memoryFraming.strengthening.staleCandidateCount > 0 ||
      memoryFraming.strengthening.missingSourceMessageCount > 0
    ) {
      await this.traceLogger.info({
        traceId,
        event: "coach.feedback.strengthening.filtered",
        message: "Helpful-feedback strengthening candidates were filtered for this turn",
        metadata: {
          userId,
          sessionId,
          frontAgent,
          candidateCount: 0,
          staleCandidateCount: memoryFraming.strengthening.staleCandidateCount,
          missingSourceMessageCount: memoryFraming.strengthening.missingSourceMessageCount,
        },
      });
    }

    const fastResult = await this.models.generateJson({
      target: frontAgent,
      systemPrompt: buildCoachFastSystemPrompt(frontAgent, consultedAgent),
      userPrompt: JSON.stringify({
        workflow: "coach_conversation_fast",
        frontAgent,
        consultedAgent,
        userText: input.text,
        recalledMemory: recalledMemorySummaries.map((item) => item.summary),
        memoryFramingHints,
        memoryContext: frontMemory.bundle,
      }),
      schema: coachFastGenerationSchema,
      normalize: normalizeFastGeneration,
      fallback: () => ({
        fastResponse: buildFastResponse(input.text, recalledMemorySummaries),
        status: "pending_full" as const,
      }),
      traceContext: this.buildTraceContext({
        traceId,
        userId,
        sessionId,
        agentName: frontAgent,
        workflow: "coach_conversation_fast",
      }),
      runtimeContext: this.buildConversationRuntimeContext(userId, frontAgent, "coach_conversation_fast"),
    });
    const fastResponse = fastResult.fastResponse;

    await this.traceLogger.info({
      traceId,
      event: "coach.message.fast.completed",
      message: "Coach fast response completed",
      metadata: {
        userId,
        sessionId,
        userMessageId: userMessage.id,
        fastResponseLength: fastResponse.length,
      },
    });

    await this.traceLogger.info({
      traceId,
      event: "coach.message.full.started",
      message: "Coach full response started",
      metadata: {
        userId,
        sessionId,
        userMessageId: userMessage.id,
      },
    });

    const assistantMessage = await this.store.createCoachMessage({
      userId,
      sessionId,
      role: "assistant",
      status: "pending_full",
      userText: null,
      fastResponse,
      fullResponse: null,
      usedMemoryIds: recalledMemory.map((item) => item.id),
      usedMemoryEntries: [...usedMemoryEntries, ...memoryFraming.strengthening.usedEntries],
      conversationPath: this.buildConversationPathSummary(traceId),
      traceId,
      errorCode: null,
    });

    this.trackPendingCompletion(
      this.completeAssistantMessage({
        userId,
        sessionId,
        traceId,
        userMessage,
        assistantMessageId: assistantMessage.id,
        inputText: input.text,
        recalledMemory,
        recalledMemorySummaries,
        frontAgent,
        consultedAgent,
        memoryFramingHints,
      }),
    );

    return {
      userMessage,
      assistantMessage,
      frontAgentState: this.store.getCoachFrontAgentState(userId) ?? {
        currentFrontAgent: routeDecision.frontAgent,
        routingMode: routeDecision.routingMode,
        manualOverride: routeDecision.manualOverride,
        consultedAgent: routeDecision.consultedAgent,
        handoffReason: routeDecision.handoffReason,
        overrideSourceAgent: routeDecision.overrideSourceAgent,
        visibleSummary: routeDecision.visibleSummary,
        userId,
        updatedAt: assistantMessage.updatedAt,
      },
      fastResponse: assistantMessage.fastResponse,
      traceId,
    };
  }

  getMessage(userId: string, messageId: string) {
    return this.store.getCoachMessage(userId, messageId);
  }

  async retryMessage(userId: string, messageId: string, traceId: string) {
    const assistantMessage = this.store.getCoachMessage(userId, messageId);
    if (!assistantMessage || assistantMessage.role !== "assistant") {
      return null;
    }

    const sessionMessages = this.store.listCoachMessagesBySession(userId, assistantMessage.sessionId);
    const sourceUserMessage = [...sessionMessages]
      .reverse()
      .find((message) => message.role === "user" && typeof message.userText === "string" && message.userText.length > 0);
    if (!sourceUserMessage?.userText) {
      return null;
    }
    const sourceUserText = sourceUserMessage.userText;

    const routeDecision = await this.selectFrontRoute({
      userId,
      userText: sourceUserText,
      traceId,
      sessionId: assistantMessage.sessionId,
    });
    const frontAgent = routeDecision.frontAgent;
    const consultedAgent = routeDecision.consultedAgent;
    const frontMemory = this.getAgentMemoryBundle(userId, frontAgent as (typeof agentTeamPersonaMetadata)[keyof typeof agentTeamPersonaMetadata]["agentId"]);
    const recalledMemory = frontMemory.coachMemoryItems;
    const recalledMemorySummaries = this.flattenBundleSummaries(frontMemory.bundle);
    const usedMemoryEntries = this.buildUsedMemoryEntries(frontMemory.bundle);
    const memoryFraming = this.buildConversationMemoryFramingHints(userId, frontAgent, usedMemoryEntries);
    const memoryFramingHints = memoryFraming.hints;
    await this.persistFrontState(userId, routeDecision);

    await this.traceLogger.info({
      traceId,
      event: "coach.route.selected",
      message: "Coach route selected",
      metadata: {
        userId,
        sessionId: assistantMessage.sessionId,
        frontAgent,
        consultedAgent,
        visibleSummary: routeDecision.visibleSummary,
        retriedMessageId: messageId,
      },
    });

    for (const item of recalledMemory) {
      await this.store.touchCoachMemoryItemLastUsed(userId, item.id);
    }

    if (memoryFraming.strengthening.candidateCount > 0) {
      await this.traceLogger.info({
        traceId,
        event: "coach.feedback.strengthening.recalled",
        message: "Helpful-feedback strengthening candidates recalled for this retry",
        metadata: {
          userId,
          sessionId: assistantMessage.sessionId,
          frontAgent,
          messageId,
          candidateCount: memoryFraming.strengthening.candidateCount,
          staleCandidateCount: memoryFraming.strengthening.staleCandidateCount,
          missingSourceMessageCount: memoryFraming.strengthening.missingSourceMessageCount,
          sourceAgents: memoryFraming.strengthening.sourceAgents,
          targetScopeCounts: memoryFraming.strengthening.targetScopeCounts,
        },
      });
    } else if (
      memoryFraming.strengthening.staleCandidateCount > 0 ||
      memoryFraming.strengthening.missingSourceMessageCount > 0
    ) {
      await this.traceLogger.info({
        traceId,
        event: "coach.feedback.strengthening.filtered",
        message: "Helpful-feedback strengthening candidates were filtered for this retry",
        metadata: {
          userId,
          sessionId: assistantMessage.sessionId,
          frontAgent,
          messageId,
          candidateCount: 0,
          staleCandidateCount: memoryFraming.strengthening.staleCandidateCount,
          missingSourceMessageCount: memoryFraming.strengthening.missingSourceMessageCount,
        },
      });
    }

    let fastResponse = assistantMessage.fastResponse;
    if (!fastResponse) {
      await this.traceLogger.info({
        traceId,
        event: "coach.message.fast.started",
        message: "Coach fast response retry started",
        metadata: {
          userId,
          sessionId: assistantMessage.sessionId,
          messageId,
          textHash: this.hashText(sourceUserText),
          textLength: sourceUserText.length,
        },
      });

      const fastResult = await this.models.generateJson({
        target: frontAgent,
        systemPrompt: buildCoachFastSystemPrompt(frontAgent, consultedAgent),
        userPrompt: JSON.stringify({
          workflow: "coach_conversation_fast",
          frontAgent,
          consultedAgent,
          userText: sourceUserText,
          recalledMemory: recalledMemorySummaries.map((item) => item.summary),
          memoryFramingHints,
          memoryContext: frontMemory.bundle,
        }),
        schema: coachFastGenerationSchema,
        normalize: normalizeFastGeneration,
        fallback: () => ({
          fastResponse: buildFastResponse(sourceUserText, recalledMemorySummaries),
          status: "pending_full" as const,
        }),
        traceContext: this.buildTraceContext({
          traceId,
          userId,
          sessionId: assistantMessage.sessionId,
          agentName: frontAgent,
          workflow: "coach_conversation_fast",
        }),
        runtimeContext: this.buildConversationRuntimeContext(userId, frontAgent, "coach_conversation_fast"),
      });
      fastResponse = fastResult.fastResponse;
      await this.traceLogger.info({
        traceId,
        event: "coach.message.fast.completed",
        message: "Coach fast response retry completed",
        metadata: {
          userId,
          sessionId: assistantMessage.sessionId,
          messageId,
          fastResponseLength: fastResponse.length,
        },
      });
    }

    await this.traceLogger.info({
      traceId,
      event: "coach.message.full.started",
      message: "Coach full response retry started",
      metadata: {
        userId,
        sessionId: assistantMessage.sessionId,
        messageId,
      },
    });

    await this.store.updateCoachMessage(messageId, {
      status: "pending_full",
      fastResponse,
      fullResponse: null,
      usedMemoryIds: recalledMemory.map((item) => item.id),
      usedMemoryEntries: [...usedMemoryEntries, ...memoryFraming.strengthening.usedEntries],
      conversationPath: this.buildConversationPathSummary(traceId),
      traceId,
      errorCode: null,
    });

    this.trackPendingCompletion(
      this.completeAssistantMessage({
        userId,
        sessionId: assistantMessage.sessionId,
        traceId,
        userMessage: sourceUserMessage,
        assistantMessageId: messageId,
        inputText: sourceUserMessage.userText,
        recalledMemory,
        recalledMemorySummaries,
        frontAgent,
        consultedAgent,
        memoryFramingHints,
        persistDerivedArtifacts: false,
      }),
    );

    const updatedAssistantMessage = this.store.getCoachMessage(userId, messageId);
    if (!updatedAssistantMessage) {
      return null;
    }
    return {
      userMessage: sourceUserMessage,
      assistantMessage: updatedAssistantMessage,
      frontAgentState: this.store.getCoachFrontAgentState(userId) ?? {
        currentFrontAgent: routeDecision.frontAgent,
        routingMode: routeDecision.routingMode,
        manualOverride: routeDecision.manualOverride,
        consultedAgent: routeDecision.consultedAgent,
        handoffReason: routeDecision.handoffReason,
        overrideSourceAgent: routeDecision.overrideSourceAgent,
        visibleSummary: routeDecision.visibleSummary,
        userId,
        updatedAt: updatedAssistantMessage.updatedAt,
      },
      fastResponse: updatedAssistantMessage.fastResponse,
      traceId,
    };
  }

  async submitFeedback(userId: string, messageId: string, input: CoachMessageFeedbackInput): Promise<CoachFeedback | null> {
    const message = this.store.getCoachMessage(userId, messageId);
    if (!message) {
      return null;
    }

    const feedback = await this.store.createCoachFeedback({
      userId,
      sessionId: message.sessionId,
      messageId,
      label: input.label,
      reason: input.reason ?? null,
    });
    await this.traceLogger.info({
      traceId: message.traceId ?? createId(),
      event: "coach.feedback.recorded",
      message: "Coach feedback recorded",
      metadata: {
        userId,
        sessionId: message.sessionId,
        messageId,
        label: input.label,
        hasReason: Boolean(input.reason),
      },
    });

    if (input.label === "unhelpful") {
      let revokedMemoryCount = 0;
      for (const memoryId of message.usedMemoryIds) {
        const revoked = await this.store.revokeCoachMemoryItem(userId, memoryId);
        if (revoked) {
          revokedMemoryCount += 1;
        }
      }
      const invalidatedTrainingCount = await this.store.invalidateCoachTrainingExamplesBySourceMessage(userId, message.id);
      const strengthening = await this.rejectHelpfulFeedbackStrengtheningCandidates({
        userId,
        message,
      });

      await this.traceLogger.info({
        traceId: message.traceId ?? createId(),
        event: "coach.feedback.applied",
        message: "Coach feedback applied to governance state",
        metadata: {
          userId,
          sessionId: message.sessionId,
          messageId,
          label: input.label,
          revokedMemoryCount,
          invalidatedTrainingCount,
          rejectedStrengtheningCandidateCount: strengthening.rejectedCandidateCount,
        },
      });

      if (strengthening.rejectedCandidateCount > 0) {
        await this.traceLogger.info({
          traceId: message.traceId ?? createId(),
          event: "coach.feedback.strengthening.weakened",
          message: "Helpful-feedback strengthening candidates were weakened by unhelpful feedback",
          metadata: {
            userId,
            sessionId: message.sessionId,
            messageId,
            rejectedCandidateCount: strengthening.rejectedCandidateCount,
          },
        });
      }

      if (message.traceId) {
        await this.store.updateCoachMessage(message.id, {
          conversationPath: this.buildConversationPathSummary(message.traceId),
        });
      }
    } else if (input.label === "helpful") {
      await this.proposeHelpfulFeedbackStrengthening({
        userId,
        message,
        feedback,
      });
    }

    return feedback;
  }

  listMemory(userId: string) {
    return this.store.listCoachMemoryItems(userId).filter((item) => item.status !== "suppressed");
  }

  async revokeMemory(userId: string, memoryId: string) {
    const memory = await this.store.revokeCoachMemoryItem(userId, memoryId);
    if (!memory) {
      return null;
    }

    await this.traceLogger.info({
      traceId: createId(),
      event: "coach.memory.revoked",
      message: "Coach memory revoked",
      metadata: {
        userId,
        memoryId,
        sourceMessageId: memory.sourceMessageId,
      },
    });
    return memory;
  }
}
