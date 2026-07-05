import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  agentTeamPersonaMetadata,
  type AgentDebugRun,
  type BehaviorConclusion,
  checkinInputSchema,
  clientInboxOverviewResponseSchema,
  type CreateGoalInput,
  createHealthSnapshotInputSchema,
  type CreateTaskInput,
  createVideoAssessmentInputSchema,
  dashboardSummarySchema,
  type DashboardSummary,
  debugRegressionStepSchema,
  debugRegressionMatrixResultSchema,
  debugRegressionMatrixRunInputSchema,
  type DebugRegressionMatrixCase,
  type DebugRegressionMatrixCaseResult,
  type DebugRegressionMatrixResult,
  debugRegressionSuiteResultSchema,
  emotionAssessmentSchema,
  latestStateResponseSchema,
  openClawAdapterDecisionSchema,
  openClawAdapterStatusResponseSchema,
  recoveryHistoryResponseSchema,
  signalBatchResponseSchema,
  type CheckinInput,
  type CreateEmotionAssessmentInput,
  type CreateHealthSnapshotInput,
  type CreateMediaUploadSessionInput,
  type CreateVideoAssessmentInput,
  type CoachFrontAgentState,
  type DeviceHeartbeatInput,
  type DebugRegressionScenarioResult,
  type DebugRegressionStep,
  type DebugRegressionSuiteResult,
  type EndSessionInput,
  type FocusSession,
  type OpenClawAdapterDecision,
  type RecoveryPlan,
  type ReflectionReport,
  type RegisterEdgeDeviceInput,
  type RegisterMediaChunkInput,
  type SignalBatchInput,
  type StartSessionInput,
  type StateAssessment,
  type Task,
  type UpdateTaskInput,
} from "@mindanchor/domain";
import { collectConversationRouteData } from "./lib/conversation-route-metrics.js";
import { applyAgentModelOverrides, getAgentConfigAuditResponse, OPENCLAW_AGENT_NAMES, type AppEnv, type OpenClawAgentName } from "./env.js";
import { DEBUG_SCENARIOS, getDebugScenarioDefinition, type DebugScenarioDefinition, type DebugScenarioId } from "./debug-scenarios.js";
import { OPENCLAW_CLUSTER_ENDPOINTS } from "./lib/openclaw-cluster-client.js";
import { buildGatewayTraceContext } from "./lib/openclaw-trace.js";
import {
  CHIEF_ROUTE_SYSTEM_PROMPT,
  INTERRUPTION_RECOVERY_SYSTEM_PROMPT,
  PROGRESS_FEEDBACK_SYSTEM_PROMPT,
  REFLECTION_SYSTEM_PROMPT,
  STATE_INSIGHT_SYSTEM_PROMPT,
  TASK_MANAGEMENT_SYSTEM_PROMPT,
  AUTOMATION_SYSTEM_PROMPT,
  assertAutomationClusterPayload,
  assertBehaviorConclusionClusterPayload,
  assertChiefRouteClusterPayload,
  assertProgressFeedbackClusterPayload,
  assertRecoveryClusterPayload,
  assertReflectionClusterPayload,
  assertStateInsightClusterPayload,
  assertTaskManagementClusterPayload,
  automationOutputSchema,
  behaviorConclusionOutputSchema,
  BEHAVIOR_CONCLUSION_SYSTEM_PROMPT,
  chiefRouteOutputSchema,
  coachFrontStateOutputSchema,
  chiefRouteWorkflowSchema,
  interruptionRecoveryOutputSchema,
  normalizeAutomationOutput,
  normalizeBehaviorConclusionOutput,
  normalizeChiefRouteOutput,
  normalizeProgressFeedbackOutput,
  normalizeRecoveryOutput,
  normalizeReflectionOutput,
  normalizeStateInsightOutput,
  normalizeTaskManagementOutput,
  progressFeedbackOutputSchema,
  reflectionOutputSchema,
  stateInsightOutputSchema,
  taskManagementOutputSchema,
  visiblePersonaTargets,
} from "./lib/agent-contracts.js";
import { ModelBridge } from "./lib/model-bridge.js";
import { MindAnchorTraceLogger } from "./lib/trace-logger.js";
import { createId, now } from "./lib/utils.js";
import { MindAnchorStore } from "./store.js";
import { buildBehaviorConclusion, buildInboxMessage } from "./services/behavior-service.js";
import { dispatchNotification } from "./services/notification-dispatcher.js";
import { generateReflectionReport } from "./services/reflection-service.js";
import { shouldCreateIntervention, scoreState } from "./services/state-service.js";
import { buildRecoveryPlan, reprioritizeTasks } from "./services/task-service.js";

type ChiefWorkflow = "state_assessment" | "task_management" | "progress_summary" | "recovery_plan" | "reflection_report" | "notification_dispatch";
type RoutedAgent =
  | "state-insight-agent"
  | "task-management-agent"
  | "progress-feedback-agent"
  | "interruption-recovery-agent"
  | "reflection-coach-agent"
  | "automation-agent";

const CHIEF_ROUTE_CANDIDATES: RoutedAgent[] = [
  "state-insight-agent",
  "task-management-agent",
  "progress-feedback-agent",
  "interruption-recovery-agent",
  "reflection-coach-agent",
  "automation-agent",
];

const WORKFLOW_DEFAULT_AGENT: Record<ChiefWorkflow, RoutedAgent> = {
  state_assessment: "state-insight-agent",
  task_management: "task-management-agent",
  progress_summary: "progress-feedback-agent",
  recovery_plan: "interruption-recovery-agent",
  reflection_report: "reflection-coach-agent",
  notification_dispatch: "automation-agent",
};

const WORKFLOW_EXECUTORS: Record<ChiefWorkflow, RoutedAgent[]> = {
  state_assessment: ["state-insight-agent"],
  task_management: ["task-management-agent"],
  progress_summary: ["progress-feedback-agent"],
  recovery_plan: ["interruption-recovery-agent"],
  reflection_report: ["reflection-coach-agent"],
  notification_dispatch: ["automation-agent"],
};

type DebugScenarioSeedResult = {
  scenarioId: DebugScenarioId;
  title: string;
  description: string;
  userId: string;
  goalId?: string;
  taskId?: string;
  sessionId?: string;
  periodType?: ReflectionReport["periodType"];
  recommendedWorkflows: string[];
  notes: string[];
  counts: {
    goals: number;
    tasks: number;
    sessions: number;
    assessments: number;
    recoveryPlans: number;
    reflections: number;
    inbox: number;
  };
};

type RegressionDebugAction =
  | { kind: "chief"; workflow: ChiefWorkflow }
  | { kind: "agent"; agentName: RoutedAgent };

type DebugRegressionMatrixCaseDefinition = Omit<DebugRegressionMatrixCase, "scenarioId" | "workflow" | "focusAgent"> & {
  scenarioId: DebugScenarioId;
  workflow: ChiefWorkflow;
  focusAgent: RoutedAgent;
  overrides: Partial<Record<OpenClawAgentName, { reasoningEffort?: "minimal" | "low" | "medium" | "high" | "xhigh" }>>;
};

const DEBUG_REGRESSION_MATRIX_CASES: DebugRegressionMatrixCaseDefinition[] = [
  {
    id: "state-insight-high",
    title: "State insight override",
    description: "验证 chief → state-insight 的定向覆写链路。",
    scenarioId: "focus-recovery-loop",
    workflow: "state_assessment",
    focusAgent: "state-insight-agent",
    overrideSummary: "state-insight-agent reasoningEffort=high",
    overrides: {
      "state-insight-agent": { reasoningEffort: "high" },
    },
  },
  {
    id: "recovery-high",
    title: "Recovery override",
    description: "验证 chief → interruption-recovery 的定向覆写链路。",
    scenarioId: "focus-recovery-loop",
    workflow: "recovery_plan",
    focusAgent: "interruption-recovery-agent",
    overrideSummary: "interruption-recovery-agent reasoningEffort=high",
    overrides: {
      "interruption-recovery-agent": { reasoningEffort: "high" },
    },
  },
  {
    id: "automation-medium",
    title: "Automation override",
    description: "验证 chief → automation 的定向覆写链路。",
    scenarioId: "focus-recovery-loop",
    workflow: "notification_dispatch",
    focusAgent: "automation-agent",
    overrideSummary: "automation-agent reasoningEffort=medium",
    overrides: {
      "automation-agent": { reasoningEffort: "medium" },
    },
  },
  {
    id: "task-management-high",
    title: "Task management override",
    description: "验证 chief → task-management 的定向覆写链路。",
    scenarioId: "goal-reprioritization",
    workflow: "task_management",
    focusAgent: "task-management-agent",
    overrideSummary: "task-management-agent reasoningEffort=high",
    overrides: {
      "task-management-agent": { reasoningEffort: "high" },
    },
  },
  {
    id: "progress-high",
    title: "Progress override",
    description: "验证 chief → progress-feedback 的定向覆写链路。",
    scenarioId: "goal-reprioritization",
    workflow: "progress_summary",
    focusAgent: "progress-feedback-agent",
    overrideSummary: "progress-feedback-agent reasoningEffort=high",
    overrides: {
      "progress-feedback-agent": { reasoningEffort: "high" },
    },
  },
  {
    id: "reflection-high",
    title: "Reflection override",
    description: "验证 chief → reflection-coach 的定向覆写链路。",
    scenarioId: "weekly-reflection-mix",
    workflow: "reflection_report",
    focusAgent: "reflection-coach-agent",
    overrideSummary: "reflection-coach-agent reasoningEffort=high",
    overrides: {
      "reflection-coach-agent": { reasoningEffort: "high" },
    },
  },
];

export class MindAnchorOrchestrator {
  private readonly models: ModelBridge;
  private readonly traceLogger: MindAnchorTraceLogger;

  constructor(private readonly env: AppEnv, private readonly store: MindAnchorStore, traceLogger?: MindAnchorTraceLogger) {
    this.traceLogger = traceLogger?.child("orchestrator") ?? new MindAnchorTraceLogger(store).child("orchestrator");
    this.models = new ModelBridge(env, this.traceLogger.child("model-bridge"));
  }

  private buildOpenClawRuntimeContext(target: string, workflow?: string, userId?: string) {
    const gatewayBaseUrl = `http://127.0.0.1:${this.env.apiPort}`;

    if (target === "chief-agent") {
      const picard = agentTeamPersonaMetadata.picard;
      return {
        workflow,
        userId,
        frontAgent: picard.agentId,
        runtimeAgentId: picard.runtimeAgentId,
        memoryScopes: [...picard.memoryScopes],
        gatewayBaseUrl,
      };
    }

    const persona = Object.values(agentTeamPersonaMetadata).find((entry) => entry.agentId === target);
    if (persona) {
      return {
        workflow,
        userId,
        frontAgent: persona.canFront ? persona.agentId : undefined,
        runtimeAgentId: persona.runtimeAgentId,
        memoryScopes: [...persona.memoryScopes],
        gatewayBaseUrl,
      };
    }

    return {
      workflow,
      userId,
      gatewayBaseUrl,
    };
  }

  private buildChiefFallback(workflow: ChiefWorkflow, defaultAgent: RoutedAgent, reason: string) {
    return {
      workflow,
      selectedAgent: defaultAgent,
      reason,
      executionMode: "agent" as const,
      confidence: 0.35,
    };
  }

  private buildChiefRoutePayload({
    workflow,
    userId,
    context,
  }: {
    workflow: ChiefWorkflow;
    userId: string;
    context: Record<string, unknown>;
  }) {
    return {
      userId,
      workflow,
      routeCandidates: CHIEF_ROUTE_CANDIDATES,
      defaultAgent: WORKFLOW_DEFAULT_AGENT[workflow],
      context,
    };
  }

  private async routeWithChief({
    workflow,
    userId,
    context,
    parentTraceId,
  }: {
    workflow: ChiefWorkflow;
    userId: string;
    context: Record<string, unknown>;
    parentTraceId?: string;
  }) {
    const defaultAgent = WORKFLOW_DEFAULT_AGENT[workflow];
    const fallbackPayload = this.buildChiefFallback(
      workflow,
      defaultAgent,
      `Fallback route selected ${defaultAgent} for ${workflow}.`,
    );
    const trace = this.buildAgentTraceContext({
      parentTraceId,
      operation: "generate",
      agentName: "chief-agent",
      workflow,
      userId,
    });
    const decision = await this.models.generateJson({
      target: "chief-agent",
      systemPrompt: CHIEF_ROUTE_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(this.buildChiefRoutePayload({ workflow, userId, context }), null, 2),
      schema: chiefRouteOutputSchema,
      normalize: (raw) => normalizeChiefRouteOutput(raw, fallbackPayload, CHIEF_ROUTE_CANDIDATES),
      validateClusterPayload: assertChiefRouteClusterPayload,
      fallback: () => fallbackPayload,
      traceContext: trace,
      runtimeContext: this.buildOpenClawRuntimeContext("chief-agent", workflow, userId),
    });
    const executableAgents = WORKFLOW_EXECUTORS[workflow];
    const executionTarget = executableAgents.includes(decision.selectedAgent) ? decision.selectedAgent : defaultAgent;

    return {
      ...decision,
      traceId: trace.traceId,
      parentTraceId: trace.parentTraceId,
      executionTarget,
    };
  }

  async handleSignalBatch(input: SignalBatchInput) {
    const { acceptedCount, deduplicatedCount } = await this.store.addSignals(input.events);
    const userId = input.events[0]?.userId ?? "demo-user";
    const latestAssessment = await this.refreshAssessment(userId);

    return signalBatchResponseSchema.parse({
      acceptedCount,
      deduplicatedCount,
      queued: false,
      latestAssessment,
    });
  }

  async handleCheckin(input: CheckinInput) {
    const parsed = checkinInputSchema.parse(input);
    await this.store.addCheckin(parsed);
    const latestAssessment = await this.refreshAssessment(parsed.userId, parsed);

    return latestStateResponseSchema.parse({
      latestAssessment,
      latestIntervention: this.store.getLatestIntervention(parsed.userId),
      latestEmotionAssessment: this.store.getLatestEmotionAssessment(parsed.userId),
      latestVideoAssessment: this.store.getLatestVideoAssessment(parsed.userId),
      latestHealthSnapshot: this.store.getLatestHealthSnapshot(parsed.userId),
      latestBehaviorConclusion: this.store.getLatestBehaviorConclusion(parsed.userId),
    });
  }

  private buildTaskManagementFallback(goalTitle: string, tasks: Task[], reason: string) {
    const orderedTaskIds = reprioritizeTasks(tasks, reason)
      .filter((task) => task.status !== "done")
      .map((task) => task.id);
    const topTask = tasks.find((task) => task.id === orderedTaskIds[0]) ?? tasks.find((task) => task.status !== "done");
    const suggestedTasks =
      tasks.length === 0
        ? [
            {
              title: `Clarify success criteria for "${goalTitle}"`,
              priority: "high" as const,
              estimatedMinutes: 20,
              dueAt: undefined,
            },
            {
              title: `Break "${goalTitle}" into the first deliverable`,
              priority: "high" as const,
              estimatedMinutes: 30,
              dueAt: undefined,
            },
            {
              title: `Start the first focused work block for "${goalTitle}"`,
              priority: "medium" as const,
              estimatedMinutes: 25,
              dueAt: undefined,
            },
          ]
        : [];

    return {
      orderedTaskIds,
      summary:
        tasks.length === 0
          ? `Goal "${goalTitle}" is ready. Add the first concrete task to start execution.`
          : topTask
            ? `Keep "${topTask.title}" as the next task for goal "${goalTitle}".`
            : `Goal "${goalTitle}" has no open tasks and can be reviewed or closed.`,
      suggestedTasks,
    };
  }

  private async applyTaskOrdering(userId: string, goalId: string, orderedTaskIds: string[]) {
    const tasks = this.store.listTasks(userId, goalId);
    if (tasks.length === 0) {
      return [];
    }

    const taskMap = new Map(tasks.map((task) => [task.id, task]));
    const ordered = orderedTaskIds.map((taskId) => taskMap.get(taskId)).filter((task): task is NonNullable<typeof task> => Boolean(task));
    const remaining = tasks.filter((task) => !orderedTaskIds.includes(task.id));
    const updated = [...ordered, ...remaining].map((task, index) => ({
      ...task,
      sortOrder: index,
      updatedAt: now(),
    }));
    await this.store.updateTasks(updated);
    return updated;
  }

  private isoMinutesAgo(minutesAgo: number) {
    return new Date(Date.now() - minutesAgo * 60_000).toISOString();
  }

  private isoHoursAgo(hoursAgo: number) {
    return new Date(Date.now() - hoursAgo * 60 * 60_000).toISOString();
  }

  private isoDaysAgo(daysAgo: number, hourOffset = 0) {
    return new Date(Date.now() - (daysAgo * 24 + hourOffset) * 60 * 60_000).toISOString();
  }

  private buildScenarioCounts(userId: string): DebugScenarioSeedResult["counts"] {
    return {
      goals: this.store.listGoals(userId).length,
      tasks: this.store.listTasks(userId).length,
      sessions: this.store.listSessions(userId).length,
      assessments: this.store.listStateAssessments(userId, 200).length,
      recoveryPlans: this.store.listRecoveryPlans(userId, 50).length,
      reflections: this.store.listReflectionReports(userId).length,
      inbox: this.store.listClientInboxMessages(userId, 200).length,
    };
  }

  private buildScenarioSeedResult(
    definition: DebugScenarioDefinition,
    input: Omit<DebugScenarioSeedResult, "scenarioId" | "title" | "description" | "recommendedWorkflows" | "counts" | "userId"> & {
      userId?: string;
    },
  ): DebugScenarioSeedResult {
    const userId = input.userId ?? definition.defaultUserId;
    return {
      scenarioId: definition.id,
      title: definition.title,
      description: definition.description,
      userId,
      goalId: input.goalId,
      taskId: input.taskId,
      sessionId: input.sessionId,
      periodType: input.periodType,
      recommendedWorkflows: definition.recommendedWorkflows,
      notes: input.notes,
      counts: this.buildScenarioCounts(userId),
    };
  }

  private buildRegressionStep({
    label,
    traceId,
    parentTraceId,
    userId,
    kind,
    agentName,
    workflow,
    scenarioId,
    success,
    fallbackLikely,
    summary,
    durationMs,
  }: DebugRegressionStep) {
    return {
      label,
      traceId,
      parentTraceId,
      userId,
      kind,
      agentName,
      workflow,
      scenarioId,
      success,
      fallbackLikely,
      summary,
      durationMs,
    } satisfies DebugRegressionStep;
  }

  private summarizeRegressionScenario(
    seeded: DebugScenarioSeedResult,
    steps: DebugRegressionStep[],
    traceId?: string,
    parentTraceId?: string,
  ): DebugRegressionScenarioResult {
    const successfulSteps = steps.filter((step) => step.success).length;
    const fallbackSteps = steps.filter((step) => step.fallbackLikely).length;

    return {
      traceId,
      parentTraceId,
      scenarioId: seeded.scenarioId,
      title: seeded.title,
      description: seeded.description,
      userId: seeded.userId,
      goalId: seeded.goalId,
      taskId: seeded.taskId,
      sessionId: seeded.sessionId,
      periodType: seeded.periodType,
      notes: seeded.notes,
      recommendedWorkflows: seeded.recommendedWorkflows,
      counts: seeded.counts,
      steps,
      totalSteps: steps.length,
      successfulSteps,
      fallbackSteps,
    };
  }

  private async executeRegressionStep({
    label,
    kind,
    agentName,
    userId,
    workflow,
    scenarioId,
    parentTraceId,
    run,
  }: {
    label: string;
    kind: AgentDebugRun["kind"];
    agentName: string;
    userId: string;
    workflow?: string;
    scenarioId?: string;
    parentTraceId?: string;
    run: () => Promise<unknown>;
  }): Promise<DebugRegressionStep> {
    const started = Date.now();
    try {
      const result = await run();
      const record = (result && typeof result === "object" ? (result as Record<string, unknown>) : {}) ?? {};
      return this.buildRegressionStep({
        label,
        traceId: typeof record.traceId === "string" ? record.traceId : undefined,
        parentTraceId: typeof record.parentTraceId === "string" ? record.parentTraceId : parentTraceId,
        userId,
        kind,
        agentName,
        workflow,
        scenarioId,
        success: kind === "seed" ? true : Boolean(record.success),
        fallbackLikely: kind === "seed" ? false : Boolean(record.fallbackLikely),
        summary: this.buildDebugSummary({ kind, agentName, workflow, result }),
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown regression execution error";
      const failureResult = {
        success: false,
        fallbackLikely: true,
        validationError: message,
      };
      const persisted = await this.persistDebugRun({
        kind,
        userId,
        agentName,
        workflow,
        scenarioId,
        parentTraceId,
        result: failureResult,
      });
      return this.buildRegressionStep({
        label,
        traceId: persisted.traceId,
        parentTraceId: persisted.parentTraceId,
        userId,
        kind,
        agentName,
        workflow,
        scenarioId,
        success: false,
        fallbackLikely: true,
        summary: message,
        durationMs: Date.now() - started,
      });
    }
  }

  private getRegressionActionsForScenario(scenarioId: DebugScenarioId): RegressionDebugAction[] {
    switch (scenarioId) {
      case "focus-recovery-loop":
        return [
          { kind: "chief", workflow: "state_assessment" },
          { kind: "chief", workflow: "recovery_plan" },
          { kind: "chief", workflow: "notification_dispatch" },
          { kind: "agent", agentName: "state-insight-agent" },
          { kind: "agent", agentName: "interruption-recovery-agent" },
          { kind: "agent", agentName: "automation-agent" },
        ];
      case "goal-reprioritization":
        return [
          { kind: "chief", workflow: "task_management" },
          { kind: "chief", workflow: "progress_summary" },
          { kind: "agent", agentName: "task-management-agent" },
          { kind: "agent", agentName: "progress-feedback-agent" },
        ];
      case "weekly-reflection-mix":
        return [
          { kind: "chief", workflow: "reflection_report" },
          { kind: "chief", workflow: "progress_summary" },
          { kind: "agent", agentName: "reflection-coach-agent" },
          { kind: "agent", agentName: "progress-feedback-agent" },
        ];
    }
  }

  private async runRegressionScenarioActions(
    seeded: DebugScenarioSeedResult & { traceId?: string },
    parentTraceId?: string,
    scenarioTraceId = this.buildTraceContext(parentTraceId).traceId,
  ) {
    const steps: DebugRegressionStep[] = [];

    steps.push(
      this.buildRegressionStep({
        label: `Seed ${seeded.title}`,
        traceId: seeded.traceId,
        parentTraceId: scenarioTraceId,
        userId: seeded.userId,
        kind: "seed",
        agentName: "scenario-seed",
        scenarioId: seeded.scenarioId,
        success: true,
        fallbackLikely: false,
        summary: `Seeded ${seeded.title}.`,
        durationMs: 0,
      }),
    );

    for (const action of this.getRegressionActionsForScenario(seeded.scenarioId)) {
      if (action.kind === "chief") {
        steps.push(
          await this.executeRegressionStep({
            label: `Chief route · ${action.workflow}`,
            kind: "debug",
            agentName: "chief-agent",
            workflow: action.workflow,
            userId: seeded.userId,
            scenarioId: seeded.scenarioId,
            parentTraceId: scenarioTraceId,
            run: () =>
              this.debugChiefRoute({
                workflow: action.workflow,
                userId: seeded.userId,
                taskId: seeded.taskId,
                periodType: seeded.periodType,
                scenarioId: seeded.scenarioId,
                parentTraceId: scenarioTraceId,
              }),
          }),
        );
        continue;
      }

      const debugRun = (() => {
        switch (action.agentName) {
          case "state-insight-agent":
            return () => this.debugStateInsight(seeded.userId, seeded.scenarioId, scenarioTraceId);
          case "task-management-agent":
            return () => this.debugTaskManagement(seeded.userId, seeded.goalId, seeded.scenarioId, scenarioTraceId);
          case "progress-feedback-agent":
            return () => this.debugProgressSummary(seeded.userId, seeded.scenarioId, scenarioTraceId);
          case "interruption-recovery-agent":
            return () => this.debugRecovery(seeded.userId, seeded.taskId, seeded.scenarioId, scenarioTraceId);
          case "reflection-coach-agent":
            return () => this.debugReflection(seeded.userId, seeded.periodType ?? "weekly", seeded.scenarioId, scenarioTraceId);
          case "automation-agent":
            return () => this.debugAutomation(seeded.userId, seeded.scenarioId, scenarioTraceId);
        }
      })();

      const workflow =
        action.agentName === "state-insight-agent"
          ? "state_assessment"
          : action.agentName === "task-management-agent"
            ? "task_management"
            : action.agentName === "progress-feedback-agent"
              ? "progress_summary"
              : action.agentName === "interruption-recovery-agent"
                ? "recovery_plan"
                : action.agentName === "reflection-coach-agent"
                  ? "reflection_report"
                  : "notification_dispatch";

      steps.push(
        await this.executeRegressionStep({
          label: `Agent debug · ${action.agentName}`,
          kind: "debug",
          agentName: action.agentName,
          workflow,
          userId: seeded.userId,
          scenarioId: seeded.scenarioId,
          parentTraceId: scenarioTraceId,
          run: debugRun,
        }),
      );
    }

    return this.summarizeRegressionScenario(seeded, steps, scenarioTraceId, parentTraceId);
  }

  private extractDebugPayload(result: unknown) {
    if (!result || typeof result !== "object") {
      return result;
    }

    const record = result as Record<string, unknown>;
    if ("normalizedJson" in record) {
      return record.normalizedJson ?? record.extractedJson ?? record.parsed ?? record.content ?? null;
    }
    return record.parsed ?? record;
  }

  private buildDebugSummary({
    kind,
    agentName,
    workflow,
    result,
  }: {
    kind: AgentDebugRun["kind"];
    agentName: string;
    workflow?: string;
    result: unknown;
  }) {
    if (kind === "seed") {
      const payload = result as Partial<DebugScenarioSeedResult>;
      return `Seeded ${payload.title ?? payload.scenarioId ?? "debug scenario"}.`;
    }

    const payload = this.extractDebugPayload(result);
    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;
      const firstHighlight =
        Array.isArray(record.highlights) && typeof record.highlights[0] === "string"
          ? (record.highlights[0] as string)
          : undefined;
      const firstBlocker =
        Array.isArray(record.blockers) && typeof record.blockers[0] === "string"
          ? (record.blockers[0] as string)
          : undefined;
      const firstTrend =
        Array.isArray(record.trends) && typeof record.trends[0] === "string" ? (record.trends[0] as string) : undefined;
      const firstMeaningfulText =
        (typeof record.summaryHeadline === "string" && record.summaryHeadline) ||
        (typeof record.summary === "string" && record.summary) ||
        (typeof record.reason === "string" && record.reason) ||
        (typeof record.nextStep === "string" && record.nextStep) ||
        firstHighlight ||
        firstBlocker ||
        firstTrend ||
        (typeof record.title === "string" && record.title) ||
        (typeof record.probe === "string" && record.probe) ||
        (typeof record.workflow === "string" && record.workflow);
      if (firstMeaningfulText) {
        return firstMeaningfulText;
      }
    }

    return workflow ? `${kind} run for ${agentName} (${workflow})` : `${kind} run for ${agentName}`;
  }

  private buildTraceContext(parentTraceId?: string, operation: string = "debug") {
    return buildGatewayTraceContext({
      traceId: createId(),
      parentTraceId,
      operation,
    });
  }

  private buildAgentTraceContext({
    parentTraceId,
    operation,
    agentName,
    workflow,
    scenarioId,
    userId,
  }: {
    parentTraceId?: string;
    operation: "probe" | "debug" | "generate";
    agentName: string;
    workflow?: string;
    scenarioId?: string;
    userId?: string;
  }) {
    return buildGatewayTraceContext({
      traceId: createId(),
      parentTraceId,
      operation,
      agentName,
      workflow,
      scenarioId,
      userId,
    });
  }

  private attachTraceMetadata<T>(result: T, trace: Pick<AgentDebugRun, "id" | "traceId" | "createdAt"> & Partial<Pick<AgentDebugRun, "parentTraceId">>) {
    if (!result || typeof result !== "object") {
      return result;
    }

    const record = result as Record<string, unknown>;
    const adapter =
      record.adapter && typeof record.adapter === "object"
        ? this.normalizeAdapterDecision(record.adapter, {
            traceId: trace.traceId,
            parentTraceId: trace.parentTraceId,
            createdAt: trace.createdAt,
          })
        : undefined;

    return {
      ...record,
      ...(adapter ? { adapter } : {}),
      runId: trace.id,
      traceId: trace.traceId,
      parentTraceId: trace.parentTraceId,
      createdAt: trace.createdAt,
    } as T;
  }

  private normalizeAdapterDecision(
    value: unknown,
    overrides?: Partial<Pick<OpenClawAdapterDecision, "traceId" | "parentTraceId" | "createdAt">>,
  ) {
    const parsed = openClawAdapterDecisionSchema.safeParse({
      ...(value && typeof value === "object" ? (value as Record<string, unknown>) : {}),
      ...(overrides ?? {}),
    });
    return parsed.success ? parsed.data : undefined;
  }

  private mapAdapterDecisionEvent(event: {
    traceId: string;
    parentTraceId?: string;
    createdAt: string;
    metadata: Record<string, unknown>;
  }) {
    return this.normalizeAdapterDecision(event.metadata, {
      traceId: event.traceId,
      parentTraceId: event.parentTraceId,
      createdAt: event.createdAt,
    });
  }

  private async persistDebugRun({
    kind,
    userId,
    agentName,
    workflow,
    scenarioId,
    traceId,
    parentTraceId,
    result,
  }: {
    kind: AgentDebugRun["kind"];
    userId: string;
    agentName: string;
    workflow?: string;
    scenarioId?: string;
    traceId?: string;
    parentTraceId?: string;
    result: unknown;
  }) {
    const record = (result && typeof result === "object" ? (result as Record<string, unknown>) : {}) ?? {};
    const config = (record.config && typeof record.config === "object" ? (record.config as Record<string, unknown>) : null) ?? null;
    const success = kind === "seed" ? true : Boolean(record.success);
    const fallbackLikely = kind === "seed" ? false : Boolean(record.fallbackLikely);
    const resolvedTraceId = traceId ?? (typeof record.traceId === "string" ? record.traceId : createId());
    const resolvedParentTraceId = parentTraceId ?? (typeof record.parentTraceId === "string" ? record.parentTraceId : undefined);
    const adapter = this.normalizeAdapterDecision(record.adapter, {
      traceId: resolvedTraceId,
      parentTraceId: resolvedParentTraceId,
    });

    const persisted = await this.store.addAgentDebugRun({
      userId,
      traceId: resolvedTraceId,
      parentTraceId: resolvedParentTraceId,
      kind,
      agentName,
      workflow,
      scenarioId,
      success,
      fallbackLikely,
      model: typeof config?.model === "string" ? config.model : undefined,
      wireApi: typeof config?.wireApi === "string" ? config.wireApi : undefined,
      adapter,
      summary: this.buildDebugSummary({ kind, agentName, workflow, result }),
      payload: this.extractDebugPayload(result),
    });
    await this.traceLogger.info({
      traceId: persisted.traceId,
      parentTraceId: persisted.parentTraceId,
      event: "agent.debug.persisted",
      message: `${persisted.kind} persisted for ${persisted.agentName}`,
      metadata: {
        agentName: persisted.agentName,
        workflow: persisted.workflow,
        scenarioId: persisted.scenarioId,
        success: persisted.success,
        fallbackLikely: persisted.fallbackLikely,
        model: persisted.model,
      },
    });
    return persisted;
  }

  private buildDashboardSummaryFallback(userId: string): DashboardSummary {
    const tasks = this.store.listTasks(userId);
    const completedTaskCount = tasks.filter((task) => task.status === "done").length;
    const inProgressTaskCount = tasks.filter((task) => task.status === "in_progress").length;
    const blockedTaskCount = tasks.filter((task) => task.status === "blocked").length;
    const activeSession = this.store.getActiveSession(userId);
    const suggestedFocusTaskId =
      activeSession?.taskId ?? tasks.find((task) => task.status === "in_progress")?.id ?? tasks.find((task) => task.status === "todo")?.id ?? null;

    return {
      goalCount: this.store.listGoals(userId).length,
      taskCount: tasks.length,
      completedTaskCount,
      inProgressTaskCount,
      blockedTaskCount,
      completionRate: tasks.length > 0 ? Number((completedTaskCount / tasks.length).toFixed(2)) : 0,
      openInterventions: this.store.listInterventions(userId).filter((intervention) => intervention.status === "open").length,
      suggestedFocusTaskId,
      summaryHeadline:
        completedTaskCount > 0
          ? `${completedTaskCount}/${tasks.length} tasks completed.`
          : tasks.length > 0
            ? `Focus on the next ${tasks[0]?.priority ?? "medium"} priority task.`
            : "No tasks yet. Start from the suggested task drafts.",
      coachFrontAgent: this.getCoachFrontAgentState(userId),
      activeSession,
      latestAssessment: this.store.getLatestAssessment(userId),
      latestRecoveryPlan: this.store.getLatestRecoveryPlan(userId),
      latestBehaviorConclusion: this.store.getLatestBehaviorConclusion(userId),
      latestVideoAssessment: this.store.getLatestVideoAssessment(userId),
      latestHealthSnapshot: this.store.getLatestHealthSnapshot(userId),
      mobileAudio: {
        enabled: this.store.getLatestMobileCaptureDevice(userId) !== null,
        latestDevice: this.store.getLatestMobileCaptureDevice(userId),
        latestSession: this.store.getLatestAudioCaptureSession(userId),
        latestEmotionAssessment: this.store.getLatestEmotionAssessment(userId),
        latestCallEvent: this.store.getLatestCallEvent(userId),
      },
      edgeDevices: this.store.listEdgeDevices(userId),
      inbox: this.store.listClientInboxMessages(userId, 10),
      goals: this.store.listGoals(userId),
      tasks,
    };
  }

  getCoachFrontAgentState(userId: string): CoachFrontAgentState {
    const stored = this.store.getCoachFrontAgentState(userId);
    if (stored) {
      const { userId: _userId, updatedAt: _updatedAt, ...state } = stored;
      return coachFrontStateOutputSchema.parse(state);
    }

    return coachFrontStateOutputSchema.parse({
      currentFrontAgent: visiblePersonaTargets.includes("director-agent") ? "director-agent" : visiblePersonaTargets[0],
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: null,
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard is currently coordinating the team.",
    });
  }

  async setCoachFrontAgentState(userId: string, state: CoachFrontAgentState) {
    const stored = await this.store.saveCoachFrontAgentState({
      userId,
      ...state,
    });
    const { userId: _userId, updatedAt: _updatedAt, ...payload } = stored;
    return coachFrontStateOutputSchema.parse(payload);
  }

  private async dispatchBehaviorNotification(userId: string, conclusion: BehaviorConclusion) {
    const fallbackMessage = buildInboxMessage({ userId, conclusion });
    const fallbackPayload = {
      title: fallbackMessage.title,
      message: fallbackMessage.message,
      channel: fallbackMessage.channel,
      deliver: conclusion.riskLevel !== "low",
    };
    const chiefRoute = await this.routeWithChief({
      workflow: "notification_dispatch",
      userId,
      context: {
        riskLevel: conclusion.riskLevel,
        recommendedChannel: conclusion.recommendedChannel,
        trigger: conclusion.trigger,
        summary: conclusion.summary,
        suggestedAction: conclusion.suggestedAction,
        hasMobileEndpoint: this.store.getLatestMobileCaptureDevice(userId) !== null,
      },
    });

    const notification =
      chiefRoute.executionMode === "stub"
        ? fallbackPayload
        : await this.models.generateJson({
            target: chiefRoute.executionTarget,
            systemPrompt: AUTOMATION_SYSTEM_PROMPT,
            userPrompt: JSON.stringify(
              {
                userId,
                chiefRoute,
                conclusion,
              },
              null,
              2,
            ),
            schema: automationOutputSchema,
            normalize: (raw) => normalizeAutomationOutput(raw, fallbackPayload),
            validateClusterPayload: assertAutomationClusterPayload,
            fallback: () => fallbackPayload,
            traceContext: this.buildAgentTraceContext({
              parentTraceId: typeof chiefRoute.traceId === "string" ? chiefRoute.traceId : undefined,
              operation: "generate",
              agentName: chiefRoute.executionTarget,
              workflow: "notification_dispatch",
              userId,
            }),
          });
    const dispatchResult = await dispatchNotification(this.env, notification);

    if (notification.deliver) {
      await this.store.addClientInboxMessage({
        userId,
        title: notification.title,
        message: dispatchResult.fallbackReason ? `${notification.message} (${dispatchResult.fallbackReason})` : notification.message,
        channel: dispatchResult.effectiveChannel,
      });
    }

    return {
      ...notification,
      dispatchResult,
    };
  }

  private async generateBehaviorConclusion({
    userId,
    assessment,
    sessionId,
    taskId,
    hasMobileEndpoint,
  }: {
    userId: string;
    assessment: StateAssessment;
    sessionId?: string;
    taskId?: string;
    hasMobileEndpoint: boolean;
  }): Promise<Omit<BehaviorConclusion, "id" | "createdAt">> {
    const fallbackPayload = buildBehaviorConclusion({
      userId,
      assessment,
      sessionId,
      taskId,
      hasMobileEndpoint,
    });
    const chiefRoute = await this.routeWithChief({
      workflow: "notification_dispatch",
      userId,
      context: {
        intent: "behavior_conclusion",
        assessment,
        sessionId,
        taskId,
        hasMobileEndpoint,
        fallbackSummary: fallbackPayload.summary,
      },
    });

    if (chiefRoute.executionMode === "stub") {
      return fallbackPayload;
    }

    const generated = behaviorConclusionOutputSchema.parse(
      await this.models.generateJson({
      target: chiefRoute.executionTarget,
      systemPrompt: BEHAVIOR_CONCLUSION_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(
        {
          intent: "behavior_conclusion",
          userId,
          chiefRoute,
          assessment,
          activeSession: this.store.getActiveSession(userId),
          latestRecoveryPlan: this.store.getLatestRecoveryPlan(userId),
          latestBehaviorConclusion: this.store.getLatestBehaviorConclusion(userId),
          hasMobileEndpoint,
        },
        null,
        2,
      ),
      schema: behaviorConclusionOutputSchema,
      normalize: (raw) => normalizeBehaviorConclusionOutput(raw, fallbackPayload),
      validateClusterPayload: assertBehaviorConclusionClusterPayload,
      fallback: () => fallbackPayload,
      traceContext: this.buildAgentTraceContext({
        parentTraceId: typeof chiefRoute.traceId === "string" ? chiefRoute.traceId : undefined,
        operation: "generate",
        agentName: chiefRoute.executionTarget,
        workflow: "notification_dispatch",
        userId,
      }),
      }),
    );

    return generated;
  }

  async createGoal(input: CreateGoalInput) {
    const goal = await this.store.createGoal(input);
    const fallbackPayload = this.buildTaskManagementFallback(goal.title, [], "goal_created");
    const chiefRoute = await this.routeWithChief({
      workflow: "task_management",
      userId: goal.userId,
      context: {
        reason: "goal_created",
        goal,
        tasks: [],
        latestAssessment: this.store.getLatestAssessment(goal.userId),
      },
    });

    const plan =
      chiefRoute.executionMode === "stub"
        ? fallbackPayload
        : await this.models.generateJson({
            target: chiefRoute.executionTarget,
            systemPrompt: TASK_MANAGEMENT_SYSTEM_PROMPT,
            userPrompt: JSON.stringify(
              {
                userId: goal.userId,
                chiefRoute,
                reason: "goal_created",
                goal,
                tasks: [],
                latestAssessment: this.store.getLatestAssessment(goal.userId),
              },
              null,
              2,
            ),
            schema: taskManagementOutputSchema,
            normalize: (raw) => normalizeTaskManagementOutput(raw, fallbackPayload, []),
            validateClusterPayload: assertTaskManagementClusterPayload,
            fallback: () => fallbackPayload,
            traceContext: this.buildAgentTraceContext({
              parentTraceId: typeof chiefRoute.traceId === "string" ? chiefRoute.traceId : undefined,
              operation: "generate",
              agentName: chiefRoute.executionTarget,
              workflow: "task_management",
              userId: goal.userId,
            }),
          });

    const createdTasks: Task[] = [];
    for (const [index, draft] of (plan.suggestedTasks ?? []).slice(0, 5).entries()) {
      const createdTask = await this.store.createTask({
        userId: goal.userId,
        goalId: goal.id,
        title: draft.title,
        priority: draft.priority ?? "medium",
        estimatedMinutes: draft.estimatedMinutes,
        dueAt: draft.dueAt,
        sortOrder: index,
      });
      createdTasks.push(createdTask);
    }

    if (createdTasks.length > 0) {
      const draftIdsByOrder = createdTasks.map((task) => task.id);
      await this.applyTaskOrdering(goal.userId, goal.id, plan.orderedTaskIds.length > 0 ? plan.orderedTaskIds : draftIdsByOrder);
    }

    if (plan.summary) {
      await this.store.addClientInboxMessage({
        userId: goal.userId,
        title: "Goal plan ready",
        message: plan.summary,
        channel: "desktop_local",
      });
    }

    return this.store.getGoal(goal.id) ?? goal;
  }

  async createTask(input: CreateTaskInput) {
    const task = await this.store.createTask(input);
    const goal = this.store.getGoal(task.goalId);
    const goalTasks = this.store.listTasks(task.userId, task.goalId);
    const fallbackPayload = this.buildTaskManagementFallback(goal?.title ?? "Goal", goalTasks, "task_created");
    const chiefRoute = await this.routeWithChief({
      workflow: "task_management",
      userId: task.userId,
      context: {
        reason: "task_created",
        goal,
        task,
        tasks: goalTasks,
        latestAssessment: this.store.getLatestAssessment(task.userId),
      },
    });

    const plan =
      chiefRoute.executionMode === "stub"
        ? fallbackPayload
        : await this.models.generateJson({
            target: chiefRoute.executionTarget,
            systemPrompt: TASK_MANAGEMENT_SYSTEM_PROMPT,
            userPrompt: JSON.stringify(
              {
                userId: task.userId,
                chiefRoute,
                reason: "task_created",
                goal,
                task,
                tasks: goalTasks,
                latestAssessment: this.store.getLatestAssessment(task.userId),
              },
              null,
              2,
            ),
            schema: taskManagementOutputSchema,
            normalize: (raw) => normalizeTaskManagementOutput(raw, fallbackPayload, goalTasks),
            validateClusterPayload: assertTaskManagementClusterPayload,
            fallback: () => fallbackPayload,
            traceContext: this.buildAgentTraceContext({
              parentTraceId: typeof chiefRoute.traceId === "string" ? chiefRoute.traceId : undefined,
              operation: "generate",
              agentName: chiefRoute.executionTarget,
              workflow: "task_management",
              userId: task.userId,
            }),
          });

    await this.applyTaskOrdering(task.userId, task.goalId, plan.orderedTaskIds);
    return this.store.getTask(task.id) ?? task;
  }

  async updateTask(taskId: string, patch: UpdateTaskInput) {
    const updatedTask = await this.store.updateTask(taskId, patch);
    if (!updatedTask) {
      return null;
    }

    const goal = this.store.getGoal(updatedTask.goalId);
    const goalTasks = this.store.listTasks(updatedTask.userId, updatedTask.goalId);
    const fallbackPayload = this.buildTaskManagementFallback(goal?.title ?? "Goal", goalTasks, `task_updated:${patch.status ?? "generic"}`);
    const chiefRoute = await this.routeWithChief({
      workflow: "task_management",
      userId: updatedTask.userId,
      context: {
        reason: "task_updated",
        goal,
        task: updatedTask,
        tasks: goalTasks,
        latestAssessment: this.store.getLatestAssessment(updatedTask.userId),
      },
    });

    const plan =
      chiefRoute.executionMode === "stub"
        ? fallbackPayload
        : await this.models.generateJson({
            target: chiefRoute.executionTarget,
            systemPrompt: TASK_MANAGEMENT_SYSTEM_PROMPT,
            userPrompt: JSON.stringify(
              {
                userId: updatedTask.userId,
                chiefRoute,
                reason: "task_updated",
                goal,
                task: updatedTask,
                tasks: goalTasks,
                latestAssessment: this.store.getLatestAssessment(updatedTask.userId),
              },
              null,
              2,
            ),
            schema: taskManagementOutputSchema,
            normalize: (raw) => normalizeTaskManagementOutput(raw, fallbackPayload, goalTasks),
            validateClusterPayload: assertTaskManagementClusterPayload,
            fallback: () => fallbackPayload,
            traceContext: this.buildAgentTraceContext({
              parentTraceId: typeof chiefRoute.traceId === "string" ? chiefRoute.traceId : undefined,
              operation: "generate",
              agentName: chiefRoute.executionTarget,
              workflow: "task_management",
              userId: updatedTask.userId,
            }),
          });

    await this.applyTaskOrdering(updatedTask.userId, updatedTask.goalId, plan.orderedTaskIds);
    return this.store.getTask(taskId) ?? updatedTask;
  }

  async startSession(input: StartSessionInput) {
    const task = input.taskId ? this.store.getTask(input.taskId) : null;
    const session = await this.store.createSession({
      ...input,
      goalId: input.goalId ?? task?.goalId,
    });

    if (session.taskId) {
      await this.store.updateTask(session.taskId, { status: "in_progress" });
    }

    return session;
  }

  async endSession(input: EndSessionInput) {
    const session = await this.store.endSession(input.sessionId, input.interrupted, input.summary);
    if (!session) {
      return { session: null, recoveryPlan: null };
    }

    if (!input.interrupted && input.completeTask && session.taskId) {
      await this.store.updateTask(session.taskId, { status: "done" });
    }

    const recoveryPlan = await this.handleSessionEnd(session);
    return { session, recoveryPlan };
  }

  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    await this.ensureFreshStateOutputs(userId);
    const fallbackSummary = this.buildDashboardSummaryFallback(userId);
    const chiefRoute = await this.routeWithChief({
      workflow: "progress_summary",
      userId,
      context: {
        goalCount: fallbackSummary.goalCount,
        taskCount: fallbackSummary.taskCount,
        openInterventions: fallbackSummary.openInterventions,
        latestAssessment: fallbackSummary.latestAssessment,
        latestBehaviorConclusion: fallbackSummary.latestBehaviorConclusion,
      },
    });

    const summary =
      chiefRoute.executionMode === "stub"
        ? fallbackSummary
        : await this.models.generateJson({
            target: chiefRoute.executionTarget,
            systemPrompt: PROGRESS_FEEDBACK_SYSTEM_PROMPT,
            userPrompt: JSON.stringify(
              {
                userId,
                chiefRoute,
                dashboard: fallbackSummary,
              },
              null,
              2,
            ),
            schema: progressFeedbackOutputSchema,
            normalize: (raw) => normalizeProgressFeedbackOutput(raw, fallbackSummary),
            validateClusterPayload: assertProgressFeedbackClusterPayload,
            fallback: () => fallbackSummary,
            traceContext: this.buildAgentTraceContext({
              parentTraceId: typeof chiefRoute.traceId === "string" ? chiefRoute.traceId : undefined,
              operation: "generate",
              agentName: chiefRoute.executionTarget,
              workflow: "progress_summary",
              userId,
            }),
          });

    return dashboardSummarySchema.parse(summary);
  }

  async refreshAssessment(userId: string, checkin?: CheckinInput): Promise<StateAssessment | null> {
    const signals = this.store.listStateSignals(userId, 20);
    const latestEmotionAssessment = this.store.getLatestEmotionAssessment(userId);
    const latestVideoAssessment = this.store.getLatestVideoAssessment(userId);
    const latestHealthSnapshot = this.store.getLatestHealthSnapshot(userId);

    if (signals.length === 0 && !checkin && !latestEmotionAssessment && !latestVideoAssessment && !latestHealthSnapshot) {
      return this.store.getLatestAssessment(userId);
    }

    const fallback = () =>
      scoreState({
        userId,
        signals,
        checkin,
        latestEmotionAssessment,
        latestVideoAssessment,
        latestHealthSnapshot,
        source: this.env.agentMode === "openai-compatible" ? "openai-compatible" : "stub-agent",
      });
    const fallbackAssessment = fallback();
    const fallbackPayload = {
      userId: fallbackAssessment.userId,
      windowStart: fallbackAssessment.windowStart,
      windowEnd: fallbackAssessment.windowEnd,
      focusScore: fallbackAssessment.focusScore,
      energyScore: fallbackAssessment.energyScore,
      moodScore: fallbackAssessment.moodScore,
      summary: fallbackAssessment.summary,
      recommendedAction: fallbackAssessment.recommendedAction,
      emotionSummary: fallbackAssessment.emotionSummary,
      emotionConfidence: fallbackAssessment.emotionConfidence,
      fatigueScore: fallbackAssessment.fatigueScore,
      videoSummary: fallbackAssessment.videoSummary,
      healthSummary: fallbackAssessment.healthSummary,
      activeInputs: fallbackAssessment.activeInputs,
      mediaFreshness: fallbackAssessment.mediaFreshness,
    };
    const chiefRoute = await this.routeWithChief({
      workflow: "state_assessment",
      userId,
      context: {
        signalCount: signals.length,
        hasCheckin: Boolean(checkin),
        hasEmotionAssessment: Boolean(latestEmotionAssessment),
        hasVideoAssessment: Boolean(latestVideoAssessment),
        hasHealthSnapshot: Boolean(latestHealthSnapshot),
        latestFallbackSummary: fallbackPayload.summary,
      },
    });

    const assessment =
      chiefRoute.executionMode === "stub"
        ? fallbackPayload
        : await this.models.generateJson({
            target: chiefRoute.executionTarget,
            systemPrompt: STATE_INSIGHT_SYSTEM_PROMPT,
            userPrompt: JSON.stringify(
              {
                userId,
                chiefRoute,
                recentSignals: signals,
                latestCheckin: checkin,
                latestEmotionAssessment,
                latestVideoAssessment,
                latestHealthSnapshot,
              },
              null,
              2,
            ),
            schema: stateInsightOutputSchema,
            normalize: (raw) => normalizeStateInsightOutput(raw, fallbackPayload),
            validateClusterPayload: assertStateInsightClusterPayload,
            fallback: () => fallbackPayload,
            traceContext: this.buildAgentTraceContext({
              parentTraceId: typeof chiefRoute.traceId === "string" ? chiefRoute.traceId : undefined,
              operation: "generate",
              agentName: chiefRoute.executionTarget,
              workflow: "state_assessment",
              userId,
            }),
          });

    const persisted: StateAssessment = {
      id: createId(),
      userId: assessment.userId,
      windowStart: assessment.windowStart,
      windowEnd: assessment.windowEnd,
      focusScore: Math.round(assessment.focusScore),
      energyScore: Math.round(assessment.energyScore),
      moodScore: Math.round(assessment.moodScore),
      summary: assessment.summary,
      recommendedAction: assessment.recommendedAction,
      emotionSummary: assessment.emotionSummary,
      emotionConfidence: assessment.emotionConfidence,
      fatigueScore: assessment.fatigueScore,
      videoSummary: assessment.videoSummary,
      healthSummary: assessment.healthSummary,
      activeInputs: assessment.activeInputs ?? [],
      mediaFreshness: assessment.mediaFreshness,
      source: this.env.agentMode === "openai-compatible" ? "openai-compatible" : "stub-agent",
      createdAt: now(),
    };

    await this.store.addAssessment(persisted);

    if (shouldCreateIntervention(persisted)) {
      await this.store.addIntervention({
        id: createId(),
        userId,
        assessmentId: persisted.id,
        trigger: "low_state_score",
        action: "reset_focus",
        copy: persisted.recommendedAction,
        status: "open",
        createdAt: now(),
      });
    }

    await this.syncBehaviorOutputs(userId, persisted);
    return persisted;
  }

  async handleSessionEnd(session: FocusSession) {
    if (session.status !== "interrupted") {
      return null;
    }
    const plan = await this.createRecoveryPlan({
      userId: session.userId,
      sessionId: session.id,
      taskId: session.taskId,
      reason: "session_interrupted",
    });
    await this.store.addIntervention({
      id: createId(),
      userId: session.userId,
      trigger: "session_interrupted",
      action: "show_recovery_plan",
      copy: plan.nextStep,
      status: "open",
      createdAt: now(),
    });
    await this.store.addClientInboxMessage({
      userId: session.userId,
      title: "恢复计划已就绪",
      message: plan.nextStep,
      channel: this.store.getLatestMobileCaptureDevice(session.userId) ? "mobile_push" : "desktop_local",
    });

    return plan;
  }

  async createRecoveryPlan({
    userId,
    sessionId,
    taskId,
    reason,
  }: {
    userId: string;
    sessionId?: string;
    taskId?: string;
    reason: string;
  }): Promise<RecoveryPlan> {
    const tasks = this.store.listTasks(userId);
    const ordered = reprioritizeTasks(tasks, reason);
    await this.store.updateTasks(ordered);
    const fallback = () =>
      buildRecoveryPlan({
        userId,
        sessionId,
        taskId,
        tasks: ordered,
        latestAssessment: this.store.getLatestAssessment(userId),
      });
    const fallbackPlan = fallback();
    const fallbackPayload = {
      reason: fallbackPlan.reason,
      nextStep: fallbackPlan.nextStep,
      suggestedMinutes: fallbackPlan.suggestedMinutes,
      reprioritizedTaskIds: fallbackPlan.reprioritizedTaskIds,
    };
    const chiefRoute = await this.routeWithChief({
      workflow: "recovery_plan",
      userId,
      context: {
        sessionId,
        taskId,
        reason,
        taskCount: ordered.length,
        latestAssessment: this.store.getLatestAssessment(userId),
        fallbackNextStep: fallbackPayload.nextStep,
      },
    });

    const plan =
      chiefRoute.executionMode === "stub"
        ? fallbackPayload
        : await this.models.generateJson({
            target: chiefRoute.executionTarget,
            systemPrompt: INTERRUPTION_RECOVERY_SYSTEM_PROMPT,
            userPrompt: JSON.stringify(
              {
                userId,
                sessionId,
                taskId,
                reason,
                chiefRoute,
                tasks: ordered,
                latestAssessment: this.store.getLatestAssessment(userId),
              },
              null,
              2,
            ),
            schema: interruptionRecoveryOutputSchema,
            normalize: (raw) => normalizeRecoveryOutput(raw, fallbackPayload),
            validateClusterPayload: assertRecoveryClusterPayload,
            fallback: () => fallbackPayload,
            traceContext: this.buildAgentTraceContext({
              parentTraceId: typeof chiefRoute.traceId === "string" ? chiefRoute.traceId : undefined,
              operation: "generate",
              agentName: chiefRoute.executionTarget,
              workflow: "recovery_plan",
              userId,
            }),
          });

    const persisted = {
      id: createId(),
      userId,
      sessionId,
      taskId,
      reason: plan.reason,
      nextStep: plan.nextStep,
      suggestedMinutes: Math.max(5, Math.round(plan.suggestedMinutes)),
      reprioritizedTaskIds: plan.reprioritizedTaskIds,
      createdAt: now(),
    };

    await this.store.addRecoveryPlan(persisted);
    return persisted;
  }

  async recordEmotionAssessment(input: CreateEmotionAssessmentInput) {
    const parsed = emotionAssessmentSchema.omit({ id: true, createdAt: true }).parse(input);
    const assessment = await this.store.addEmotionAssessment(parsed);
    await this.refreshAssessment(parsed.userId);
    return assessment;
  }

  async recordVideoAssessment(input: CreateVideoAssessmentInput) {
    const parsed = createVideoAssessmentInputSchema.parse(input);
    const assessment = await this.store.addVideoAssessment(parsed);
    await this.refreshAssessment(parsed.userId);
    return assessment;
  }

  async recordHealthSnapshot(input: CreateHealthSnapshotInput) {
    const parsed = createHealthSnapshotInputSchema.parse(input);
    const snapshot = await this.store.addHealthSnapshot(parsed);
    await this.refreshAssessment(parsed.userId);
    return snapshot;
  }

  async debugChiefRoute({
    workflow,
    userId,
    taskId,
    periodType,
    scenarioId,
    parentTraceId,
  }: {
    workflow: string;
    userId: string;
    taskId?: string;
    periodType?: ReflectionReport["periodType"];
    scenarioId?: string;
    parentTraceId?: string;
  }) {
    const parsedWorkflow = chiefRouteWorkflowSchema.parse(workflow);
    const defaultAgent = WORKFLOW_DEFAULT_AGENT[parsedWorkflow];
    const fallbackPayload = this.buildChiefFallback(
      parsedWorkflow,
      defaultAgent,
      `Fallback route selected ${defaultAgent} for ${parsedWorkflow}.`,
    );

    const contextByWorkflow: Record<ChiefWorkflow, Record<string, unknown>> = {
      state_assessment: {
        signalCount: this.store.listStateSignals(userId, 20).length,
        latestAssessment: this.store.getLatestAssessment(userId),
        latestEmotionAssessment: this.store.getLatestEmotionAssessment(userId),
        latestVideoAssessment: this.store.getLatestVideoAssessment(userId),
        latestHealthSnapshot: this.store.getLatestHealthSnapshot(userId),
      },
      task_management: {
        taskId,
        tasks: this.store.listTasks(userId),
        goals: this.store.listGoals(userId),
      },
      progress_summary: {
        goals: this.store.listGoals(userId),
        tasks: this.store.listTasks(userId),
        sessions: this.store.listSessions(userId),
        assessments: this.store.listStateAssessments(userId, 20),
      },
      recovery_plan: {
        taskId,
        latestAssessment: this.store.getLatestAssessment(userId),
        tasks: this.store.listTasks(userId),
      },
      reflection_report: {
        periodType: periodType ?? "weekly",
        goals: this.store.listGoals(userId),
        tasks: this.store.listTasks(userId),
        sessions: this.store.listSessions(userId),
        assessments: this.store.listStateAssessments(userId, 30),
      },
      notification_dispatch: {
        latestConclusion: this.store.getLatestBehaviorConclusion(userId),
        inbox: this.store.listClientInboxMessages(userId, 10),
      },
    };

    const trace = this.buildAgentTraceContext({
      parentTraceId,
      operation: "debug",
      agentName: "chief-agent",
      workflow: parsedWorkflow,
      scenarioId,
      userId,
    });
    const result = await this.models.debugJson({
      target: "chief-agent",
      systemPrompt: CHIEF_ROUTE_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(
        this.buildChiefRoutePayload({
          workflow: parsedWorkflow,
          userId,
          context: contextByWorkflow[parsedWorkflow],
        }),
        null,
        2,
      ),
      schema: chiefRouteOutputSchema,
      normalize: (raw) => normalizeChiefRouteOutput(raw, fallbackPayload, CHIEF_ROUTE_CANDIDATES),
      validateClusterPayload: assertChiefRouteClusterPayload,
      traceContext: trace,
      runtimeContext: this.buildOpenClawRuntimeContext("chief-agent", parsedWorkflow, userId),
    });
    const persisted = await this.persistDebugRun({
      kind: "debug",
      userId,
      agentName: "chief-agent",
      workflow: parsedWorkflow,
      scenarioId,
      traceId: trace.traceId,
      parentTraceId: trace.parentTraceId,
      result,
    });
    return this.attachTraceMetadata(result, persisted);
  }

  async debugTaskManagement(userId: string, goalId?: string, scenarioId?: string, parentTraceId?: string) {
    const goal = goalId ? this.store.getGoal(goalId) : this.store.listGoals(userId)[0] ?? null;
    const tasks = goal ? this.store.listTasks(userId, goal.id) : this.store.listTasks(userId);
    const fallbackPayload = this.buildTaskManagementFallback(goal?.title ?? "Goal", tasks, "debug_task_management");

    const trace = this.buildAgentTraceContext({
      parentTraceId,
      operation: "debug",
      agentName: "task-management-agent",
      workflow: "task_management",
      scenarioId,
      userId,
    });
    const result = await this.models.debugJson({
      target: "task-management-agent",
      systemPrompt: TASK_MANAGEMENT_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(
        {
          userId,
          reason: "debug_task_management",
          goal,
          tasks,
          latestAssessment: this.store.getLatestAssessment(userId),
        },
        null,
        2,
      ),
      schema: taskManagementOutputSchema,
      normalize: (raw) => normalizeTaskManagementOutput(raw, fallbackPayload, tasks),
      validateClusterPayload: assertTaskManagementClusterPayload,
      traceContext: trace,
    });
    const persisted = await this.persistDebugRun({
      kind: "debug",
      userId,
      agentName: "task-management-agent",
      workflow: "task_management",
      scenarioId,
      traceId: trace.traceId,
      parentTraceId: trace.parentTraceId,
      result,
    });
    return this.attachTraceMetadata(result, persisted);
  }

  async debugProgressSummary(userId: string, scenarioId?: string, parentTraceId?: string) {
    const fallbackSummary = this.buildDashboardSummaryFallback(userId);

    const trace = this.buildAgentTraceContext({
      parentTraceId,
      operation: "debug",
      agentName: "progress-feedback-agent",
      workflow: "progress_summary",
      scenarioId,
      userId,
    });
    const result = await this.models.debugJson({
      target: "progress-feedback-agent",
      systemPrompt: PROGRESS_FEEDBACK_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(
        {
          userId,
          dashboard: fallbackSummary,
        },
        null,
        2,
      ),
      schema: progressFeedbackOutputSchema,
      normalize: (raw) => normalizeProgressFeedbackOutput(raw, fallbackSummary),
      validateClusterPayload: assertProgressFeedbackClusterPayload,
      traceContext: trace,
    });
    const persisted = await this.persistDebugRun({
      kind: "debug",
      userId,
      agentName: "progress-feedback-agent",
      workflow: "progress_summary",
      scenarioId,
      traceId: trace.traceId,
      parentTraceId: trace.parentTraceId,
      result,
    });
    return this.attachTraceMetadata(result, persisted);
  }

  async debugAutomation(userId: string, scenarioId?: string, parentTraceId?: string) {
    const latestAssessment = this.store.getLatestAssessment(userId);
    const latestConclusion =
      this.store.getLatestBehaviorConclusion(userId) ??
      (latestAssessment
        ? ({
            id: createId(),
            createdAt: now(),
            ...buildBehaviorConclusion({
              userId,
              assessment: latestAssessment,
              sessionId: this.store.getActiveSession(userId)?.id,
              taskId: this.store.getActiveSession(userId)?.taskId,
              hasMobileEndpoint: this.store.getLatestMobileCaptureDevice(userId) !== null,
            }),
          } satisfies BehaviorConclusion)
        : null);

    if (!latestConclusion) {
      const trace = this.buildAgentTraceContext({
        parentTraceId,
        operation: "debug",
        agentName: "automation-agent",
        workflow: "notification_dispatch",
        scenarioId,
        userId,
      });
      const result = {
        success: false,
        fallbackLikely: true,
        validationError: "No behavior conclusion or assessment available for automation debug.",
      };
      const persisted = await this.persistDebugRun({
        kind: "debug",
        userId,
        agentName: "automation-agent",
        workflow: "notification_dispatch",
        scenarioId,
        traceId: trace.traceId,
        parentTraceId: trace.parentTraceId,
        result,
      });
      return this.attachTraceMetadata(result, persisted);
    }

    const fallbackMessage = buildInboxMessage({ userId, conclusion: latestConclusion });
    const fallbackPayload = {
      title: fallbackMessage.title,
      message: fallbackMessage.message,
      channel: fallbackMessage.channel,
      deliver: latestConclusion.riskLevel !== "low",
    };

    const trace = this.buildAgentTraceContext({
      parentTraceId,
      operation: "debug",
      agentName: "automation-agent",
      workflow: "notification_dispatch",
      scenarioId,
      userId,
    });
    const result = await this.models.debugJson({
      target: "automation-agent",
      systemPrompt: AUTOMATION_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(
        {
          userId,
          conclusion: latestConclusion,
        },
        null,
        2,
      ),
      schema: automationOutputSchema,
      normalize: (raw) => normalizeAutomationOutput(raw, fallbackPayload),
      validateClusterPayload: assertAutomationClusterPayload,
      traceContext: trace,
    });
    const persisted = await this.persistDebugRun({
      kind: "debug",
      userId,
      agentName: "automation-agent",
      workflow: "notification_dispatch",
      scenarioId,
      traceId: trace.traceId,
      parentTraceId: trace.parentTraceId,
      result,
    });
    return this.attachTraceMetadata(result, persisted);
  }

  async debugStateInsight(userId: string, scenarioId?: string, parentTraceId?: string) {
    const fallbackAssessment = scoreState({
      userId,
      signals: this.store.listStateSignals(userId, 20),
      latestEmotionAssessment: this.store.getLatestEmotionAssessment(userId),
      latestVideoAssessment: this.store.getLatestVideoAssessment(userId),
      latestHealthSnapshot: this.store.getLatestHealthSnapshot(userId),
      source: this.env.agentMode === "openai-compatible" ? "openai-compatible" : "stub-agent",
    });
    const fallbackPayload = {
      userId: fallbackAssessment.userId,
      windowStart: fallbackAssessment.windowStart,
      windowEnd: fallbackAssessment.windowEnd,
      focusScore: fallbackAssessment.focusScore,
      energyScore: fallbackAssessment.energyScore,
      moodScore: fallbackAssessment.moodScore,
      summary: fallbackAssessment.summary,
      recommendedAction: fallbackAssessment.recommendedAction,
      emotionSummary: fallbackAssessment.emotionSummary,
      emotionConfidence: fallbackAssessment.emotionConfidence,
      fatigueScore: fallbackAssessment.fatigueScore,
      videoSummary: fallbackAssessment.videoSummary,
      healthSummary: fallbackAssessment.healthSummary,
      activeInputs: fallbackAssessment.activeInputs,
      mediaFreshness: fallbackAssessment.mediaFreshness,
    };

    const trace = this.buildAgentTraceContext({
      parentTraceId,
      operation: "debug",
      agentName: "state-insight-agent",
      workflow: "state_assessment",
      scenarioId,
      userId,
    });
    const result = await this.models.debugJson({
      target: "state-insight-agent",
      systemPrompt: STATE_INSIGHT_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(
        {
          userId,
          recentSignals: this.store.listStateSignals(userId, 20),
          latestEmotionAssessment: this.store.getLatestEmotionAssessment(userId),
          latestVideoAssessment: this.store.getLatestVideoAssessment(userId),
          latestHealthSnapshot: this.store.getLatestHealthSnapshot(userId),
        },
        null,
        2,
      ),
      schema: stateInsightOutputSchema,
      normalize: (raw) => normalizeStateInsightOutput(raw, fallbackPayload),
      validateClusterPayload: assertStateInsightClusterPayload,
      traceContext: trace,
    });
    const persisted = await this.persistDebugRun({
      kind: "debug",
      userId,
      agentName: "state-insight-agent",
      workflow: "state_assessment",
      scenarioId,
      traceId: trace.traceId,
      parentTraceId: trace.parentTraceId,
      result,
    });
    return this.attachTraceMetadata(result, persisted);
  }

  async debugRecovery(userId: string, taskId?: string, scenarioId?: string, parentTraceId?: string) {
    const tasks = this.store.listTasks(userId);
    const fallbackPlan = buildRecoveryPlan({
      userId,
      taskId,
      tasks,
      latestAssessment: this.store.getLatestAssessment(userId),
    });
    const fallbackPayload = {
      reason: fallbackPlan.reason,
      nextStep: fallbackPlan.nextStep,
      suggestedMinutes: fallbackPlan.suggestedMinutes,
      reprioritizedTaskIds: fallbackPlan.reprioritizedTaskIds,
    };

    const trace = this.buildAgentTraceContext({
      parentTraceId,
      operation: "debug",
      agentName: "interruption-recovery-agent",
      workflow: "recovery_plan",
      scenarioId,
      userId,
    });
    const result = await this.models.debugJson({
      target: "interruption-recovery-agent",
      systemPrompt: INTERRUPTION_RECOVERY_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(
        {
          userId,
          taskId,
          reason: "manual_request",
          tasks,
          latestAssessment: this.store.getLatestAssessment(userId),
        },
        null,
        2,
      ),
      schema: interruptionRecoveryOutputSchema,
      normalize: (raw) => normalizeRecoveryOutput(raw, fallbackPayload),
      validateClusterPayload: assertRecoveryClusterPayload,
      traceContext: trace,
    });
    const persisted = await this.persistDebugRun({
      kind: "debug",
      userId,
      agentName: "interruption-recovery-agent",
      workflow: "recovery_plan",
      scenarioId,
      traceId: trace.traceId,
      parentTraceId: trace.parentTraceId,
      result,
    });
    return this.attachTraceMetadata(result, persisted);
  }

  async debugReflection(userId: string, periodType: ReflectionReport["periodType"], scenarioId?: string, parentTraceId?: string) {
    const fallbackReport = generateReflectionReport({
      userId,
      goals: this.store.listGoals(userId),
      tasks: this.store.listTasks(userId),
      sessions: this.store.listSessions(userId),
      assessments: this.store.listStateAssessments(userId, 30),
      emotionAssessments: this.store.listEmotionAssessments(userId, 30),
      videoAssessments: this.store.listVideoAssessments(userId, 30),
      healthSnapshots: this.store.listHealthSnapshots(userId, 30),
      callEvents: this.store.listCallEvents(userId, 30),
      periodType,
    });
    const fallbackPayload = {
      userId: fallbackReport.userId,
      periodType: fallbackReport.periodType,
      periodStart: fallbackReport.periodStart,
      periodEnd: fallbackReport.periodEnd,
      highlights: fallbackReport.highlights,
      blockers: fallbackReport.blockers,
      trends: fallbackReport.trends,
      nextSuggestions: fallbackReport.nextSuggestions,
    };

    const trace = this.buildAgentTraceContext({
      parentTraceId,
      operation: "debug",
      agentName: "reflection-coach-agent",
      workflow: "reflection_report",
      scenarioId,
      userId,
    });
    const result = await this.models.debugJson({
      target: "reflection-coach-agent",
      systemPrompt: REFLECTION_SYSTEM_PROMPT,
      userPrompt: JSON.stringify(
        {
          userId,
          periodType,
          goals: this.store.listGoals(userId),
          tasks: this.store.listTasks(userId),
          sessions: this.store.listSessions(userId),
          assessments: this.store.listStateAssessments(userId, 30),
          emotionAssessments: this.store.listEmotionAssessments(userId, 30),
          videoAssessments: this.store.listVideoAssessments(userId, 30),
          healthSnapshots: this.store.listHealthSnapshots(userId, 30),
          callEvents: this.store.listCallEvents(userId, 30),
        },
        null,
        2,
      ),
      schema: reflectionOutputSchema,
      normalize: (raw) => normalizeReflectionOutput(raw, fallbackPayload),
      validateClusterPayload: assertReflectionClusterPayload,
      traceContext: trace,
    });
    const persisted = await this.persistDebugRun({
      kind: "debug",
      userId,
      agentName: "reflection-coach-agent",
      workflow: "reflection_report",
      scenarioId,
      traceId: trace.traceId,
      parentTraceId: trace.parentTraceId,
      result,
    });
    return this.attachTraceMetadata(result, persisted);
  }

  listDebugScenarios() {
    return DEBUG_SCENARIOS;
  }

  async runFullDebugRegressionSuite(parentTraceId?: string): Promise<DebugRegressionSuiteResult> {
    const startedAt = now();
    const suiteTraceId = this.buildTraceContext(parentTraceId, "regression-suite").traceId;
    const probeUserId = "debug-regression-probe-user";
    await this.clearAgentDebugRuns(probeUserId);

    const probeSteps: DebugRegressionStep[] = [];
    for (const agentName of OPENCLAW_AGENT_NAMES) {
      probeSteps.push(
        await this.executeRegressionStep({
          label: `Probe ${agentName}`,
          kind: "probe",
          agentName,
          userId: probeUserId,
          scenarioId: "full-regression-suite",
          parentTraceId: suiteTraceId,
          run: () => this.probeAgentModel(agentName, probeUserId, "full-regression-suite", suiteTraceId),
        }),
      );
    }

    const scenarioResults: DebugRegressionScenarioResult[] = [];
    for (const scenario of DEBUG_SCENARIOS) {
      const scenarioTraceId = this.buildTraceContext(suiteTraceId, "scenario-seed").traceId;
      const seeded = await this.seedDebugScenario(scenario.id, scenarioTraceId);
      if (!seeded) {
        continue;
      }
      scenarioResults.push(await this.runRegressionScenarioActions(seeded, suiteTraceId, scenarioTraceId));
    }

    const allSteps = [...probeSteps, ...scenarioResults.flatMap((scenario) => scenario.steps)];
    const suite = debugRegressionSuiteResultSchema.parse({
      suiteName: "full-agent-regression",
      traceId: suiteTraceId,
      startedAt,
      completedAt: now(),
      probeUserId,
      probeSteps,
      scenarioResults,
      totalSteps: allSteps.length,
      successfulSteps: allSteps.filter((step) => step.success).length,
      fallbackSteps: allSteps.filter((step) => step.fallbackLikely).length,
    });

    await this.traceLogger.info({
      traceId: suiteTraceId,
      event: "regression.suite.completed",
      message: "Full regression suite completed",
      metadata: {
        totalSteps: suite.totalSteps,
        successfulSteps: suite.successfulSteps,
        fallbackSteps: suite.fallbackSteps,
        scenarioCount: suite.scenarioResults.length,
      },
    });

    return suite;
  }

  listDebugRegressionMatrixCases(): DebugRegressionMatrixCase[] {
    return DEBUG_REGRESSION_MATRIX_CASES.map(({ overrides: _overrides, ...definition }) => definition);
  }

  async runDebugRegressionMatrix(input?: { caseIds?: string[] }, parentTraceId?: string): Promise<DebugRegressionMatrixResult> {
    const parsed = debugRegressionMatrixRunInputSchema.parse(input ?? {});
    const selectedCases =
      parsed.caseIds && parsed.caseIds.length > 0
        ? DEBUG_REGRESSION_MATRIX_CASES.filter((definition) => parsed.caseIds?.includes(definition.id))
        : DEBUG_REGRESSION_MATRIX_CASES;

    const startedAt = now();
    const matrixTraceId = this.buildTraceContext(parentTraceId, "regression-matrix").traceId;
    const caseResults: DebugRegressionMatrixCaseResult[] = [];

    for (const definition of selectedCases) {
      caseResults.push(await this.runDebugRegressionMatrixCase(definition, matrixTraceId));
    }

    const allSteps = caseResults.flatMap((result) => result.steps);
    const result = debugRegressionMatrixResultSchema.parse({
      matrixName: "agent-override-matrix",
      traceId: matrixTraceId,
      startedAt,
      completedAt: now(),
      requestedCaseIds: parsed.caseIds ?? [],
      caseResults,
      totalSteps: allSteps.length,
      successfulSteps: allSteps.filter((step) => step.success).length,
      fallbackSteps: allSteps.filter((step) => step.fallbackLikely).length,
    });
    await this.store.addDebugRegressionMatrixRun(result);
    await this.traceLogger.info({
      traceId: matrixTraceId,
      event: "regression.matrix.completed",
      message: "Matrix regression completed",
      metadata: {
        totalSteps: result.totalSteps,
        successfulSteps: result.successfulSteps,
        fallbackSteps: result.fallbackSteps,
        caseCount: result.caseResults.length,
      },
    });
    return result;
  }

  private async runDebugRegressionMatrixCase(
    definition: DebugRegressionMatrixCaseDefinition,
    parentTraceId?: string,
  ): Promise<DebugRegressionMatrixCaseResult> {
    const startedAt = now();
    const caseTraceId = this.buildTraceContext(parentTraceId, "debug").traceId;
    const tempDir = await mkdtemp(join(tmpdir(), "mindanchor-matrix-"));
    const tempDataFile = join(tempDir, "mindanchor.json");

    try {
      const caseEnv = applyAgentModelOverrides(
        {
          ...this.env,
          dataFile: tempDataFile,
        },
        definition.overrides,
      );
      const tempStore = new MindAnchorStore(tempDataFile);
      await tempStore.init();
      const tempOrchestrator = new MindAnchorOrchestrator(caseEnv, tempStore);

      const seeded = await tempOrchestrator.seedDebugScenario(definition.scenarioId as DebugScenarioId, caseTraceId);
      if (!seeded) {
        return {
          traceId: caseTraceId,
          parentTraceId,
          caseId: definition.id,
          title: definition.title,
          description: definition.description,
          scenarioId: definition.scenarioId,
          workflow: definition.workflow,
          focusAgent: definition.focusAgent,
          overrideSummary: definition.overrideSummary,
          startedAt,
          completedAt: now(),
          userId: "unknown-user",
          resolvedConfigs: [],
          steps: [],
          totalSteps: 0,
          successfulSteps: 0,
          fallbackSteps: 0,
        };
      }

      const steps: DebugRegressionStep[] = [];
      steps.push(
        await tempOrchestrator.executeRegressionStep({
          label: "Probe chief-agent",
          kind: "probe",
          agentName: "chief-agent",
          userId: seeded.userId,
          scenarioId: definition.id,
          parentTraceId: caseTraceId,
          run: () => tempOrchestrator.probeAgentModel("chief-agent", seeded.userId, definition.id, caseTraceId),
        }),
      );
      steps.push(
        await tempOrchestrator.executeRegressionStep({
          label: `Probe ${definition.focusAgent}`,
          kind: "probe",
          agentName: definition.focusAgent,
          userId: seeded.userId,
          scenarioId: definition.id,
          parentTraceId: caseTraceId,
          run: () => tempOrchestrator.probeAgentModel(definition.focusAgent, seeded.userId, definition.id, caseTraceId),
        }),
      );
      steps.push(
        debugRegressionStepSchema.parse({
          label: `Seed ${seeded.title}`,
          traceId: typeof (seeded as { traceId?: string }).traceId === "string" ? (seeded as { traceId?: string }).traceId : undefined,
          parentTraceId: caseTraceId,
          userId: seeded.userId,
          kind: "seed",
          agentName: "scenario-seed",
          scenarioId: seeded.scenarioId,
          success: true,
          fallbackLikely: false,
          summary: `Seeded ${seeded.title}.`,
          durationMs: 0,
        }),
      );
      steps.push(
        await tempOrchestrator.executeRegressionStep({
          label: `Chief route · ${definition.workflow}`,
          kind: "debug",
          agentName: "chief-agent",
          workflow: definition.workflow,
          userId: seeded.userId,
          scenarioId: seeded.scenarioId,
          parentTraceId: caseTraceId,
          run: () =>
            tempOrchestrator.debugChiefRoute({
              workflow: definition.workflow,
              userId: seeded.userId,
              taskId: seeded.taskId,
              periodType: seeded.periodType,
              scenarioId: seeded.scenarioId,
              parentTraceId: caseTraceId,
            }),
        }),
      );
      steps.push(
        await tempOrchestrator.executeRegressionStep({
          label: `Agent debug · ${definition.focusAgent}`,
          kind: "debug",
          agentName: definition.focusAgent,
          workflow: definition.workflow,
          userId: seeded.userId,
          scenarioId: seeded.scenarioId,
          parentTraceId: caseTraceId,
          run: () => tempOrchestrator.runFocusedMatrixDebug(definition.focusAgent, seeded, caseTraceId),
        }),
      );

      const resolved = getAgentConfigAuditResponse(caseEnv);
      const resolvedConfigs = [resolved.defaultModelConfig, ...resolved.agents.filter((config) => config.target === "chief-agent" || config.target === definition.focusAgent)];

      return {
        traceId: caseTraceId,
        parentTraceId,
        caseId: definition.id,
        title: definition.title,
        description: definition.description,
        scenarioId: definition.scenarioId,
        workflow: definition.workflow,
        focusAgent: definition.focusAgent,
        overrideSummary: definition.overrideSummary,
        startedAt,
        completedAt: now(),
        userId: seeded.userId,
        resolvedConfigs,
        steps,
        totalSteps: steps.length,
        successfulSteps: steps.filter((step) => step.success).length,
        fallbackSteps: steps.filter((step) => step.fallbackLikely).length,
      };
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  private runFocusedMatrixDebug(focusAgent: RoutedAgent, seeded: DebugScenarioSeedResult, parentTraceId?: string) {
    switch (focusAgent) {
      case "state-insight-agent":
        return this.debugStateInsight(seeded.userId, seeded.scenarioId, parentTraceId);
      case "task-management-agent":
        return this.debugTaskManagement(seeded.userId, seeded.goalId, seeded.scenarioId, parentTraceId);
      case "progress-feedback-agent":
        return this.debugProgressSummary(seeded.userId, seeded.scenarioId, parentTraceId);
      case "interruption-recovery-agent":
        return this.debugRecovery(seeded.userId, seeded.taskId, seeded.scenarioId, parentTraceId);
      case "reflection-coach-agent":
        return this.debugReflection(seeded.userId, seeded.periodType ?? "weekly", seeded.scenarioId, parentTraceId);
      case "automation-agent":
        return this.debugAutomation(seeded.userId, seeded.scenarioId, parentTraceId);
    }
  }

  listAgentDebugRuns(userId: string, limit = 20, traceId?: string) {
    return this.store.listAgentDebugRuns(userId, limit, traceId);
  }

  async clearAgentDebugRuns(userId?: string) {
    return this.store.clearAgentDebugRuns(userId);
  }

  listDebugRegressionMatrixRuns(limit = 20, traceId?: string) {
    return this.store.listDebugRegressionMatrixRuns(limit, traceId);
  }

  async clearDebugRegressionMatrixRuns() {
    return this.store.clearDebugRegressionMatrixRuns();
  }

  getDebugTrace(traceId: string) {
    const events = this.store.listTraceLogEvents(traceId, 400);
    return {
      traceId,
      agentRuns: this.store.listAgentDebugRunsByTrace(traceId, 200),
      matrixRuns: this.store.listDebugRegressionMatrixRuns(50, traceId),
      events,
      summary: {
        conversationPath: this.buildConversationTraceSummary(events),
      },
    };
  }

  private buildConversationTraceSummary(events: ReturnType<MindAnchorStore["listTraceLogEvents"]>) {
    let frontAgent: string | null = null;
    let consultedAgent: string | null = null;
    let authorityAgent: string | null = null;
    let authorityTarget: string | null = null;
    let authorityExecutionStatus: string | null = null;
    let revokedMemoryCount = 0;
    let routeSummary: string | null = null;
    let authoritySummary: string | null = null;
    let memoryUsage: {
      recalledCount: number;
      sourceCounts: Record<string, number>;
      scopeEntryCounts: {
        preferences: number;
        habits: number;
        constraints: number;
        recentContext: number;
      };
    } | null = null;
    let feedbackLearning = {
      strengtheningRecalledCount: 0,
      staleFilteredCount: 0,
      missingSourceFilteredCount: 0,
      weakenedRejectedCandidateCount: 0,
    };
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

      if (event.event === "coach.memory.recalled") {
        const recalledCount =
          typeof event.metadata?.count === "number" && Number.isFinite(event.metadata.count) ? event.metadata.count : 0;
        memoryUsage = {
          recalledCount,
          sourceCounts: this.toStringNumberRecord(event.metadata?.sourceCounts),
          scopeEntryCounts: this.toScopeEntryCounts(event.metadata?.scopeEntryCounts),
        };
        continue;
      }

      if (event.event === "coach.feedback.strengthening.recalled") {
        const candidateCount =
          typeof event.metadata?.candidateCount === "number" && Number.isFinite(event.metadata.candidateCount)
            ? event.metadata.candidateCount
            : 0;
        const staleCandidateCount =
          typeof event.metadata?.staleCandidateCount === "number" && Number.isFinite(event.metadata.staleCandidateCount)
            ? event.metadata.staleCandidateCount
            : 0;
        const missingSourceMessageCount =
          typeof event.metadata?.missingSourceMessageCount === "number" &&
          Number.isFinite(event.metadata.missingSourceMessageCount)
            ? event.metadata.missingSourceMessageCount
            : 0;
        feedbackLearning = {
          ...feedbackLearning,
          strengtheningRecalledCount: feedbackLearning.strengtheningRecalledCount + candidateCount,
          staleFilteredCount: feedbackLearning.staleFilteredCount + staleCandidateCount,
          missingSourceFilteredCount: feedbackLearning.missingSourceFilteredCount + missingSourceMessageCount,
        };
        continue;
      }

      if (event.event === "coach.feedback.strengthening.filtered") {
        const staleCandidateCount =
          typeof event.metadata?.staleCandidateCount === "number" && Number.isFinite(event.metadata.staleCandidateCount)
            ? event.metadata.staleCandidateCount
            : 0;
        const missingSourceMessageCount =
          typeof event.metadata?.missingSourceMessageCount === "number" &&
          Number.isFinite(event.metadata.missingSourceMessageCount)
            ? event.metadata.missingSourceMessageCount
            : 0;
        feedbackLearning = {
          ...feedbackLearning,
          staleFilteredCount: feedbackLearning.staleFilteredCount + staleCandidateCount,
          missingSourceFilteredCount: feedbackLearning.missingSourceFilteredCount + missingSourceMessageCount,
        };
        continue;
      }

      if (event.event === "coach.feedback.strengthening.weakened") {
        const rejectedCandidateCount =
          typeof event.metadata?.rejectedCandidateCount === "number" &&
          Number.isFinite(event.metadata.rejectedCandidateCount)
            ? event.metadata.rejectedCandidateCount
            : 0;
        feedbackLearning = {
          ...feedbackLearning,
          weakenedRejectedCandidateCount:
            feedbackLearning.weakenedRejectedCandidateCount + rejectedCandidateCount,
        };
        continue;
      }

    }

    const hasConversationData =
      frontAgent !== null ||
      consultedAgent !== null ||
      authorityAgent !== null ||
      routeData.adapterRoutes.length > 0 ||
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
      memoryUsage,
      feedbackLearning:
        feedbackLearning.strengtheningRecalledCount > 0 ||
        feedbackLearning.staleFilteredCount > 0 ||
        feedbackLearning.missingSourceFilteredCount > 0 ||
        feedbackLearning.weakenedRejectedCandidateCount > 0
          ? feedbackLearning
          : null,
      adapterRoutes: routeData.adapterRoutes,
    };
  }

  private toStringNumberRecord(input: unknown) {
    if (!input || typeof input !== "object") {
      return {};
    }
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).flatMap(([key, value]) =>
        typeof value === "number" && Number.isFinite(value) ? [[key, value]] : [],
      ),
    );
  }

  private toScopeEntryCounts(input: unknown) {
    const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    return {
      preferences: typeof record.preferences === "number" && Number.isFinite(record.preferences) ? record.preferences : 0,
      habits: typeof record.habits === "number" && Number.isFinite(record.habits) ? record.habits : 0,
      constraints: typeof record.constraints === "number" && Number.isFinite(record.constraints) ? record.constraints : 0,
      recentContext:
        typeof record.recentContext === "number" && Number.isFinite(record.recentContext) ? record.recentContext : 0,
    };
  }

  getOpenClawAdapterStatus() {
    const recentTimeline = this.store
      .listRecentTraceLogEventsByEvent("openclaw.adapter.decision", 20)
      .map((event) => this.mapAdapterDecisionEvent(event))
      .filter((decision): decision is OpenClawAdapterDecision => Boolean(decision));
    const failureCategoryCounts = recentTimeline.reduce<Record<string, number>>((counts, decision) => {
      if (!decision.failureCategory) {
        return counts;
      }
      counts[decision.failureCategory] = (counts[decision.failureCategory] ?? 0) + 1;
      return counts;
    }, {});

    return openClawAdapterStatusResponseSchema.parse({
      gatewayMode: this.env.agentMode,
      clusterEnabled: Boolean(this.env.openClawBaseUrl),
      executionStrategy: this.env.openClawBaseUrl ? "cluster-preferred" : "provider-direct",
      openClawBaseUrl: this.env.openClawBaseUrl ?? null,
      clusterEndpoints: [...OPENCLAW_CLUSTER_ENDPOINTS],
      lastDecision: recentTimeline[0] ?? null,
      lastFallback: recentTimeline.find((decision) => typeof decision.fallbackReason === "string" && decision.fallbackReason.length > 0) ?? null,
      failureCategoryCounts,
      recentTimeline,
    });
  }

  async getRecoveryHistory(userId = "demo-user", limit = 20) {
    await this.ensureFreshStateOutputs(userId);
    const activeSession = this.store.getActiveSession(userId);
    const latestAssessment = this.store.getLatestAssessment(userId);
    const latestBehaviorConclusion = this.store.getLatestBehaviorConclusion(userId);
    const recoveryPlans = this.store.listRecoveryPlans(userId, limit);
    const latestRecoveryPlan = recoveryPlans[0] ?? null;
    const allPendingTasks = this.store.listTasks(userId).filter((task) => task.status !== "done");

    const fallbackPayload = this.buildTaskManagementFallback(
      latestRecoveryPlan?.taskId ? this.store.getTask(latestRecoveryPlan.taskId)?.title ?? "Recovery" : "Recovery",
      allPendingTasks,
      "recovery_history",
    );
    const chiefRoute = await this.routeWithChief({
      workflow: "task_management",
      userId,
      context: {
        reason: "recovery_history",
        taskCount: allPendingTasks.length,
        activeSessionTaskId: activeSession?.taskId ?? null,
        latestRecoveryTaskId: latestRecoveryPlan?.taskId ?? null,
        latestAssessment,
        latestBehaviorConclusion,
        fallbackSummary: fallbackPayload.summary,
      },
    });

    const ordering =
      chiefRoute.executionMode === "stub"
        ? fallbackPayload
        : await this.models.generateJson({
            target: chiefRoute.executionTarget,
            systemPrompt: TASK_MANAGEMENT_SYSTEM_PROMPT,
            userPrompt: JSON.stringify(
              {
                userId,
                reason: "recovery_history",
                chiefRoute,
                activeSession,
                latestRecoveryPlan,
                latestAssessment,
                latestBehaviorConclusion,
                tasks: allPendingTasks,
              },
              null,
              2,
            ),
            schema: taskManagementOutputSchema,
            normalize: (raw) => normalizeTaskManagementOutput(raw, fallbackPayload, allPendingTasks),
            validateClusterPayload: assertTaskManagementClusterPayload,
            fallback: () => fallbackPayload,
            traceContext: this.buildAgentTraceContext({
              parentTraceId: typeof chiefRoute.traceId === "string" ? chiefRoute.traceId : undefined,
              operation: "generate",
              agentName: chiefRoute.executionTarget,
              workflow: "task_management",
              userId,
            }),
          });

    const orderedPendingTasks = ordering.orderedTaskIds
      .map((taskId) => allPendingTasks.find((task) => task.id === taskId) ?? null)
      .filter((task): task is Task => Boolean(task));
    const remainingPendingTasks = allPendingTasks.filter((task) => !orderedPendingTasks.some((candidate) => candidate.id === task.id));
    const pendingTasks = [...orderedPendingTasks, ...remainingPendingTasks].slice(0, limit);
    const suggestedFocusTaskId =
      (activeSession?.taskId && pendingTasks.some((task) => task.id === activeSession.taskId) ? activeSession.taskId : null) ??
      pendingTasks.find((task) => task.id === latestRecoveryPlan?.taskId)?.id ??
      pendingTasks.find((task) => task.id === ordering.orderedTaskIds[0])?.id ??
      pendingTasks[0]?.id ??
      null;

    return recoveryHistoryResponseSchema.parse({
      activeSession,
      interruptedSessions: this.store
        .listSessions(userId)
        .filter((session) => session.status === "interrupted")
        .slice(0, limit),
      interventions: this.store.listInterventions(userId).slice(0, limit),
      recoveryPlans,
      pendingTasks,
      latestAssessment,
      latestBehaviorConclusion,
      suggestedFocusTaskId,
    });
  }

  private async ensureFreshStateOutputs(userId: string) {
    const latestAssessment = this.store.getLatestAssessment(userId);
    const latestBehaviorConclusion = this.store.getLatestBehaviorConclusion(userId);
    const latestInputTimestamp =
      [
        this.store.listStateSignals(userId, 1)[0]?.occurredAt,
        this.store.getLatestEmotionAssessment(userId)?.createdAt,
        this.store.getLatestVideoAssessment(userId)?.createdAt,
        this.store.getLatestHealthSnapshot(userId)?.createdAt,
        this.store.getLatestCallEvent(userId)?.occurredAt,
      ]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .sort((left, right) => right.localeCompare(left))[0] ?? null;

    if (!latestAssessment && latestInputTimestamp) {
      await this.refreshAssessment(userId);
      return;
    }

    if (latestAssessment && latestInputTimestamp && latestInputTimestamp > latestAssessment.createdAt) {
      await this.refreshAssessment(userId);
      return;
    }

    if (!latestBehaviorConclusion && latestAssessment) {
      await this.syncBehaviorOutputs(userId, latestAssessment);
    }
  }

  private getLatestReflectionInputTimestamp(userId: string) {
    return (
      [
        this.store.listGoals(userId)[0]?.updatedAt,
        this.store.listTasks(userId)[0]?.updatedAt,
        this.store.listSessions(userId)[0]?.startedAt,
        this.store.listStateAssessments(userId, 1)[0]?.createdAt,
        this.store.listEmotionAssessments(userId, 1)[0]?.createdAt,
        this.store.listVideoAssessments(userId, 1)[0]?.createdAt,
        this.store.listHealthSnapshots(userId, 1)[0]?.createdAt,
        this.store.listCallEvents(userId, 1)[0]?.occurredAt,
      ]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .sort((left, right) => right.localeCompare(left))[0] ?? null
    );
  }

  private async ensureFreshReflectionOutputs(
    userId: string,
    periodTypes: ReflectionReport["periodType"][] = ["weekly", "monthly"],
  ) {
    await this.ensureFreshStateOutputs(userId);

    const latestInputTimestamp = this.getLatestReflectionInputTimestamp(userId);
    const targetPeriods = [...new Set(periodTypes)];

    for (const periodType of targetPeriods) {
      const latestReport = this.store.listReflectionReports(userId, periodType)[0] ?? null;
      if (!latestReport) {
        await this.refreshReflection(userId, periodType);
        continue;
      }

      if (latestInputTimestamp && latestInputTimestamp > latestReport.createdAt) {
        await this.refreshReflection(userId, periodType);
      }
    }
  }

  async getLatestReflections(userId = "demo-user", periodType?: ReflectionReport["periodType"]) {
    await this.ensureFreshReflectionOutputs(userId, periodType ? [periodType] : ["weekly", "monthly"]);
    return this.store.listReflectionReports(userId, periodType);
  }

  async getLatestState(userId = "demo-user") {
    await this.ensureFreshStateOutputs(userId);
    return latestStateResponseSchema.parse({
      latestAssessment: this.store.getLatestAssessment(userId),
      latestIntervention: this.store.getLatestIntervention(userId),
      latestEmotionAssessment: this.store.getLatestEmotionAssessment(userId),
      latestVideoAssessment: this.store.getLatestVideoAssessment(userId),
      latestHealthSnapshot: this.store.getLatestHealthSnapshot(userId),
      latestBehaviorConclusion: this.store.getLatestBehaviorConclusion(userId),
    });
  }

  async getStateTrends(userId = "demo-user", limit = 20) {
    await this.ensureFreshStateOutputs(userId);
    const assessments = this.store.listStateAssessments(userId, limit);
    const emotionAssessments = this.store.listEmotionAssessments(userId, limit);
    const videoAssessments = this.store.listVideoAssessments(userId, limit);
    const healthSnapshots = this.store.listHealthSnapshots(userId, limit);
    const behaviorConclusions = this.store.listBehaviorConclusions(userId, limit);
    const callEvents = this.store.listCallEvents(userId, limit);
    const currentAssessment = assessments[0] ?? null;

    return {
      currentAssessment,
      latestIntervention: this.store.getLatestIntervention(userId),
      latestBehaviorConclusion: behaviorConclusions[0] ?? this.store.getLatestBehaviorConclusion(userId),
      metricCounts: {
        assessments: assessments.length,
        emotionAssessments: emotionAssessments.length,
        videoAssessments: videoAssessments.length,
        healthSnapshots: healthSnapshots.length,
        behaviorConclusions: behaviorConclusions.length,
        callEvents: callEvents.length,
      },
      activeInputs: currentAssessment?.activeInputs ?? [],
      assessments,
      emotionAssessments,
      videoAssessments,
      healthSnapshots,
      behaviorConclusions,
      callEvents,
    };
  }

  private async ensureFreshInboxOutputs(userId: string) {
    await this.ensureFreshStateOutputs(userId);

    const latestConclusion = this.store.getLatestBehaviorConclusion(userId);
    const latestMessage = this.store.listClientInboxMessages(userId, 1)[0] ?? null;

    if (
      latestConclusion &&
      latestConclusion.riskLevel !== "low" &&
      (!latestMessage || latestMessage.createdAt < latestConclusion.createdAt)
    ) {
      await this.dispatchBehaviorNotification(userId, latestConclusion);
    }
  }

  async getReflectionOverview(userId = "demo-user", limit = 10) {
    await this.ensureFreshReflectionOutputs(userId);
    const weeklyReports = this.store.listReflectionReports(userId, "weekly");
    const monthlyReports = this.store.listReflectionReports(userId, "monthly");

    const reports = this.store.listReflectionReports(userId).slice(0, limit);

    return {
      latestWeekly: weeklyReports[0] ?? null,
      latestMonthly: monthlyReports[0] ?? null,
      reports,
      metricCounts: {
        reports: reports.length,
        weeklyReports: weeklyReports.length,
        monthlyReports: monthlyReports.length,
        goals: this.store.listGoals(userId).length,
        tasks: this.store.listTasks(userId).length,
        sessions: this.store.listSessions(userId).length,
        assessments: this.store.listStateAssessments(userId, 100).length,
        emotionAssessments: this.store.listEmotionAssessments(userId, 100).length,
        videoAssessments: this.store.listVideoAssessments(userId, 100).length,
        healthSnapshots: this.store.listHealthSnapshots(userId, 100).length,
        callEvents: this.store.listCallEvents(userId, 100).length,
      },
    };
  }

  async getClientInboxOverview(userId = "demo-user", limit = 50) {
    await this.ensureFreshInboxOutputs(userId);
    const messages = this.store.listClientInboxMessages(userId, limit);
    const pendingMessages = messages.filter((message) => message.status === "pending");
    const acknowledgedMessages = messages.filter((message) => message.status === "acknowledged");

    const channelCounts = ["mobile_push", "desktop_local", "feishu_bot", "telegram_bot"].map((channel) => {
      const channelMessages = messages.filter((message) => message.channel === channel);
      return {
        channel,
        total: channelMessages.length,
        pending: channelMessages.filter((message) => message.status === "pending").length,
        acknowledged: channelMessages.filter((message) => message.status === "acknowledged").length,
      };
    });

    return clientInboxOverviewResponseSchema.parse({
      messages,
      pendingMessages,
      acknowledgedMessages,
      metricCounts: {
        totalMessages: messages.length,
        pendingMessages: pendingMessages.length,
        acknowledgedMessages: acknowledgedMessages.length,
        openInterventions: this.store.listInterventions(userId).filter((item) => item.status === "open").length,
      },
      channelCounts,
      latestBehaviorConclusion: this.store.getLatestBehaviorConclusion(userId),
      latestRecoveryPlan: this.store.getLatestRecoveryPlan(userId),
      activeSession: this.store.getActiveSession(userId),
    });
  }

  async getGoalFlowOverview(userId = "demo-user") {
    const summary = await this.getDashboardSummary(userId);
    const todoTasks = Math.max(summary.taskCount - summary.completedTaskCount - summary.inProgressTaskCount - summary.blockedTaskCount, 0);

    return {
      goals: summary.goals,
      tasks: summary.tasks,
      activeSession: summary.activeSession,
      latestRecoveryPlan: summary.latestRecoveryPlan,
      latestAssessment: summary.latestAssessment,
      latestBehaviorConclusion: summary.latestBehaviorConclusion,
      suggestedFocusTaskId: summary.suggestedFocusTaskId,
      summaryHeadline: summary.summaryHeadline,
      metricCounts: {
        goals: summary.goalCount,
        totalTasks: summary.taskCount,
        todoTasks,
        inProgressTasks: summary.inProgressTaskCount,
        blockedTasks: summary.blockedTaskCount,
        doneTasks: summary.completedTaskCount,
        completionRate: summary.completionRate,
      },
    };
  }

  async seedDebugScenario(scenarioId: DebugScenarioId, parentTraceId?: string) {
    const definition = getDebugScenarioDefinition(scenarioId);
    if (!definition) {
      return null;
    }

    switch (scenarioId) {
      case "focus-recovery-loop":
        return this.seedFocusRecoveryScenario(definition, parentTraceId);
      case "goal-reprioritization":
        return this.seedGoalReprioritizationScenario(definition, parentTraceId);
      case "weekly-reflection-mix":
        return this.seedWeeklyReflectionScenario(definition, parentTraceId);
    }
  }

  private async populateFocusRecoveryScenario(
    definition: DebugScenarioDefinition,
    userId: string,
    options: { clusterFirstOutputs?: boolean } = {},
  ) {
    const desktopDeviceId = userId === definition.defaultUserId ? "debug-desktop-focus" : `debug-desktop-${userId}`;
    const mobileDeviceId = userId === definition.defaultUserId ? "debug-mobile-focus" : `debug-mobile-${userId}`;
    await this.store.resetUserData(userId);

    await this.store.registerEdgeDevice({
      userId,
      deviceId: desktopDeviceId,
      label: "调试专注桌面端",
      deviceType: "desktop",
      platform: "macos",
      capabilities: ["desktop_signals", "notifications", "video_capture"],
      appVersion: "debug-scenario",
    });
    await this.store.registerEdgeDevice({
      userId,
      deviceId: mobileDeviceId,
      label: "调试专注手机端",
      deviceType: "mobile",
      platform: "android",
      capabilities: ["notifications", "health_bridge"],
      appVersion: "debug-scenario",
    });
    await this.store.upsertMobileCaptureDevice({
      userId,
      deviceId: mobileDeviceId,
      deviceName: "调试 Android",
      platform: "android",
      appVersion: "debug-scenario",
      desktopHost: userId === definition.defaultUserId ? "debug-focus.local" : `debug-${userId}.local`,
      consentAcknowledgedAt: this.isoHoursAgo(2),
    });

    const goal = await this.store.createGoal({
      userId,
      title: "在深度工作中找回注意力",
      description: "用于状态、恢复和通知 agent 联调的示例场景。",
    });
    const activeTask = await this.store.createTask({
      userId,
      goalId: goal.id,
      title: "验证 chief-agent 在压力场景下的路由",
      priority: "high",
      estimatedMinutes: 35,
      sortOrder: 0,
    });
    const followUpTask = await this.store.createTask({
      userId,
      goalId: goal.id,
      title: "调整收件箱提醒文案",
      priority: "medium",
      estimatedMinutes: 20,
      sortOrder: 1,
    });
    await this.store.createTask({
      userId,
      goalId: goal.id,
      title: "检查复盘亮点摘要",
      priority: "low",
      estimatedMinutes: 15,
      sortOrder: 2,
    });
    await this.store.updateTask(activeTask.id, { status: "in_progress" });

    const interruptedSession = await this.store.addSession({
      id: createId(),
      userId,
      goalId: goal.id,
      taskId: followUpTask.id,
      status: "interrupted",
      startedAt: this.isoMinutesAgo(95),
      endedAt: this.isoMinutesAgo(70),
      interruptionCount: 1,
      summary: "频繁切换上下文打断了上一段专注块。",
    });
    const activeSession = await this.store.addSession({
      id: createId(),
      userId,
      goalId: goal.id,
      taskId: activeTask.id,
      status: "active",
      startedAt: this.isoMinutesAgo(28),
      interruptionCount: 0,
      summary: "",
    });

    await this.store.addSignals([
      {
        userId,
        source: "desktop",
        eventType: "unlock",
        occurredAt: this.isoMinutesAgo(25),
        clientEventId: createId(),
        payload: {},
      },
      {
        userId,
        source: "desktop",
        eventType: "active_app",
        occurredAt: this.isoMinutesAgo(24),
        clientEventId: createId(),
        payload: { app: "Cursor" },
      },
      {
        userId,
        source: "desktop",
        eventType: "window_switch",
        occurredAt: this.isoMinutesAgo(16),
        clientEventId: createId(),
        payload: { from: "Cursor", to: "Chrome" },
      },
      {
        userId,
        source: "desktop",
        eventType: "idle",
        occurredAt: this.isoMinutesAgo(12),
        clientEventId: createId(),
        payload: { idleSeconds: 420 },
      },
      {
        userId,
        source: "desktop",
        eventType: "window_switch",
        occurredAt: this.isoMinutesAgo(8),
        clientEventId: createId(),
        payload: { from: "Chrome", to: "Slack" },
      },
      {
        userId,
        source: "web",
        eventType: "manual_checkin",
        occurredAt: this.isoMinutesAgo(4),
        clientEventId: createId(),
        payload: {
          focusScore: 34,
          energyScore: 29,
          moodScore: 37,
          note: "被中断后有些散，难以回到主线。",
        },
      },
    ]);

    await this.store.addEmotionAssessment({
      userId,
      deviceId: mobileDeviceId,
      sessionId: activeSession.id,
      chunkSequence: 2,
      windowStart: this.isoMinutesAgo(11),
      windowEnd: this.isoMinutesAgo(6),
      emotionLabel: "tense",
      valenceScore: 32,
      arousalScore: 76,
      stressScore: 84,
      confidence: 0.82,
      summary: "音频侧推断近期压力偏高，语速与语气都更紧绷。",
      modelName: "debug-audio-seed",
      source: "cluster-stub",
    });
    await this.store.addVideoAssessment({
      userId,
      deviceId: desktopDeviceId,
      sessionId: activeSession.id,
      windowStart: this.isoMinutesAgo(13),
      windowEnd: this.isoMinutesAgo(7),
      fatigueScore: 79,
      focusScore: 36,
      confidence: 0.78,
      summary: "视频侧显示眨眼频率偏高，视线稳定度下降。",
      modelName: "debug-video-seed",
      featureSummary: "landmarks+blink+headpose",
      source: "cluster-stub",
    });
    await this.store.addHealthSnapshot({
      userId,
      deviceId: mobileDeviceId,
      sourcePlatform: "android",
      sourceProvider: "health_connect",
      windowStart: this.isoHoursAgo(12),
      windowEnd: this.isoHoursAgo(4),
      sleepMinutes: 295,
      heartRate: 81,
      oxygenSaturation: 93,
      restingHeartRate: 70,
      summary: "健康桥接显示睡眠不足，疲劳影响延续到了今天。",
    });

    if (options.clusterFirstOutputs) {
      await this.refreshAssessment(userId);
      await this.handleSessionEnd(interruptedSession);
    } else {
      const assessment = {
        ...scoreState({
          userId,
          signals: this.store.listStateSignals(userId, 20),
          latestEmotionAssessment: this.store.getLatestEmotionAssessment(userId),
          latestVideoAssessment: this.store.getLatestVideoAssessment(userId),
          latestHealthSnapshot: this.store.getLatestHealthSnapshot(userId),
          source: "manual",
        }),
        source: "manual" as const,
        createdAt: this.isoMinutesAgo(2),
      };
      await this.store.addAssessment(assessment);

      if (shouldCreateIntervention(assessment)) {
        await this.store.addIntervention({
          id: createId(),
          userId,
          assessmentId: assessment.id,
          trigger: "low_state_score",
          action: "reset_focus",
          copy: assessment.recommendedAction,
          status: "open",
          createdAt: this.isoMinutesAgo(2),
        });
      }

      const seededRecovery = buildRecoveryPlan({
        userId,
        sessionId: interruptedSession.id,
        taskId: followUpTask.id,
        tasks: this.store.listTasks(userId),
        latestAssessment: assessment,
      });
      await this.store.addRecoveryPlan({
        id: createId(),
        userId,
        sessionId: interruptedSession.id,
        taskId: followUpTask.id,
        reason: seededRecovery.reason,
        nextStep: seededRecovery.nextStep,
        suggestedMinutes: seededRecovery.suggestedMinutes,
        reprioritizedTaskIds: seededRecovery.reprioritizedTaskIds,
        createdAt: this.isoMinutesAgo(60),
      });

      const conclusionInput = buildBehaviorConclusion({
        userId,
        assessment,
        sessionId: activeSession.id,
        taskId: activeTask.id,
        hasMobileEndpoint: true,
      });
      await this.store.addBehaviorConclusion(conclusionInput);
      await this.store.addClientInboxMessage(buildInboxMessage({ userId, conclusion: conclusionInput }));
    }

    return {
      goal,
      activeTask,
      followUpTask,
      interruptedSession,
      activeSession,
    };
  }

  private async seedFocusRecoveryScenario(definition: DebugScenarioDefinition, parentTraceId?: string) {
    const userId = definition.defaultUserId;
    const { goal, activeTask, activeSession } = await this.populateFocusRecoveryScenario(definition, userId);

    const seeded = this.buildScenarioSeedResult(definition, {
      userId,
      goalId: goal.id,
      taskId: activeTask.id,
      sessionId: activeSession.id,
      notes: [
        "包含活跃专注会话、一次历史中断与恢复计划。",
        "音频、视频、健康桥三类信号都已写入，适合联调 state / recovery / notification。",
      ],
    });
    const persisted = await this.persistDebugRun({
      kind: "seed",
      userId,
      agentName: "scenario-seed",
      scenarioId: definition.id,
      parentTraceId,
      result: seeded,
    });
    return this.attachTraceMetadata(seeded, persisted);
  }

  async bootstrapLocalClusterManualUser(parentTraceId?: string) {
    const definition = getDebugScenarioDefinition("focus-recovery-loop");
    if (!definition) {
      return null;
    }

    const userId = "demo-user";
    const { goal, activeTask, activeSession } = await this.populateFocusRecoveryScenario(definition, userId, {
      clusterFirstOutputs: true,
    });
    const weekly = await this.refreshReflection(userId, "weekly");
    const monthly = await this.refreshReflection(userId, "monthly");

    return {
      userId,
      sourceScenarioId: definition.id,
      goalId: goal.id,
      taskId: activeTask.id,
      sessionId: activeSession.id,
      periodType: "weekly" as const,
      reflectionReportIds: [weekly.id, monthly.id],
      counts: this.buildScenarioCounts(userId),
      ...(parentTraceId ? { parentTraceId } : {}),
    };
  }

  private async seedGoalReprioritizationScenario(definition: DebugScenarioDefinition, parentTraceId?: string) {
    const userId = definition.defaultUserId;
    const desktopDeviceId = "debug-desktop-plan";
    await this.store.resetUserData(userId);

    await this.store.registerEdgeDevice({
      userId,
      deviceId: desktopDeviceId,
      label: "Debug Planning Desktop",
      deviceType: "desktop",
      platform: "windows",
      capabilities: ["desktop_signals", "notifications"],
      appVersion: "debug-scenario",
    });

    const goal = await this.store.createGoal({
      userId,
      title: "Ship Lobster gateway rollout",
      description: "Seeded scenario for task management and progress summary tests.",
    });

    const lowTask = await this.store.createTask({
      userId,
      goalId: goal.id,
      title: "Refine GoalFlow page copy",
      priority: "low",
      estimatedMinutes: 20,
      sortOrder: 0,
    });
    const blockedTask = await this.store.createTask({
      userId,
      goalId: goal.id,
      title: "Fix inbox acknowledgement states",
      priority: "high",
      estimatedMinutes: 30,
      sortOrder: 1,
    });
    const criticalTask = await this.store.createTask({
      userId,
      goalId: goal.id,
      title: "Backfill chief-route regression tests",
      priority: "critical",
      estimatedMinutes: 45,
      sortOrder: 2,
    });
    const doneTask = await this.store.createTask({
      userId,
      goalId: goal.id,
      title: "Document environment setup",
      priority: "medium",
      estimatedMinutes: 15,
      sortOrder: 3,
    });
    const activeTask = await this.store.createTask({
      userId,
      goalId: goal.id,
      title: "Review OpenClaw prompt contracts",
      priority: "medium",
      estimatedMinutes: 25,
      sortOrder: 4,
    });

    await this.store.updateTask(blockedTask.id, { status: "blocked" });
    await this.store.updateTask(doneTask.id, { status: "done" });
    await this.store.updateTask(activeTask.id, { status: "in_progress" });

    await this.store.addSession({
      id: createId(),
      userId,
      goalId: goal.id,
      taskId: doneTask.id,
      status: "completed",
      startedAt: this.isoHoursAgo(6),
      endedAt: this.isoHoursAgo(5),
      interruptionCount: 0,
      summary: "Finished environment setup notes.",
    });
    const activeSession = await this.store.addSession({
      id: createId(),
      userId,
      goalId: goal.id,
      taskId: activeTask.id,
      status: "active",
      startedAt: this.isoMinutesAgo(35),
      interruptionCount: 0,
      summary: "",
    });

    await this.store.addSignals([
      {
        userId,
        source: "desktop",
        eventType: "active_app",
        occurredAt: this.isoMinutesAgo(28),
        clientEventId: createId(),
        payload: { app: "Cursor" },
      },
      {
        userId,
        source: "desktop",
        eventType: "window_switch",
        occurredAt: this.isoMinutesAgo(16),
        clientEventId: createId(),
        payload: { from: "Cursor", to: "Terminal" },
      },
      {
        userId,
        source: "web",
        eventType: "manual_checkin",
        occurredAt: this.isoMinutesAgo(5),
        clientEventId: createId(),
        payload: {
          focusScore: 62,
          energyScore: 54,
          moodScore: 61,
          note: "Need a clearer next task ordering.",
        },
      },
    ]);

    const assessment = {
      ...scoreState({
        userId,
        signals: this.store.listStateSignals(userId, 20),
        latestEmotionAssessment: null,
        latestVideoAssessment: null,
        latestHealthSnapshot: null,
        source: "manual",
      }),
      source: "manual" as const,
      createdAt: this.isoMinutesAgo(3),
    };
    await this.store.addAssessment(assessment);

    const conclusionInput = buildBehaviorConclusion({
      userId,
      assessment,
      sessionId: activeSession.id,
      taskId: activeTask.id,
      hasMobileEndpoint: false,
    });
    await this.store.addBehaviorConclusion(conclusionInput);

    const seeded = this.buildScenarioSeedResult(definition, {
      goalId: goal.id,
      taskId: criticalTask.id,
      sessionId: activeSession.id,
      notes: [
        "包含 critical / blocked / done / in_progress 的混合任务状态。",
        "适合观察 chief-agent 在 task_management 与 progress_summary 之间的路由。",
      ],
    });
    const persisted = await this.persistDebugRun({
      kind: "seed",
      userId,
      agentName: "scenario-seed",
      scenarioId: definition.id,
      parentTraceId,
      result: seeded,
    });
    return this.attachTraceMetadata(seeded, persisted);
  }

  private async seedWeeklyReflectionScenario(definition: DebugScenarioDefinition, parentTraceId?: string) {
    const userId = definition.defaultUserId;
    const desktopDeviceId = "debug-desktop-reflection";
    const mobileDeviceId = "debug-mobile-reflection";
    await this.store.resetUserData(userId);

    await this.store.registerEdgeDevice({
      userId,
      deviceId: desktopDeviceId,
      label: "Debug Reflection Desktop",
      deviceType: "desktop",
      platform: "linux",
      capabilities: ["desktop_signals", "notifications", "video_capture"],
      appVersion: "debug-scenario",
    });
    await this.store.registerEdgeDevice({
      userId,
      deviceId: mobileDeviceId,
      label: "Debug Reflection Phone",
      deviceType: "mobile",
      platform: "android",
      capabilities: ["notifications", "health_bridge", "audio_capture"],
      appVersion: "debug-scenario",
    });
    await this.store.upsertMobileCaptureDevice({
      userId,
      deviceId: mobileDeviceId,
      deviceName: "Debug Reflection Android",
      platform: "android",
      appVersion: "debug-scenario",
      desktopHost: "debug-reflection.local",
      consentAcknowledgedAt: this.isoDaysAgo(3),
    });

    const deliveryGoal = await this.store.createGoal({
      userId,
      title: "Stabilize MVP delivery",
      description: "Weekly reflection seed: delivery track.",
    });
    const recoveryGoal = await this.store.createGoal({
      userId,
      title: "Protect recovery budget",
      description: "Weekly reflection seed: recovery track.",
    });

    const routingTask = await this.store.createTask({
      userId,
      goalId: deliveryGoal.id,
      title: "Stabilize chief routing",
      priority: "high",
      estimatedMinutes: 40,
      sortOrder: 0,
    });
    const inboxTask = await this.store.createTask({
      userId,
      goalId: deliveryGoal.id,
      title: "Patch inbox acknowledgement flow",
      priority: "medium",
      estimatedMinutes: 25,
      sortOrder: 1,
    });
    const promptTask = await this.store.createTask({
      userId,
      goalId: deliveryGoal.id,
      title: "Review reflection coach prompts",
      priority: "medium",
      estimatedMinutes: 30,
      sortOrder: 2,
    });
    const sleepTask = await this.store.createTask({
      userId,
      goalId: recoveryGoal.id,
      title: "Add sleep trend check",
      priority: "medium",
      estimatedMinutes: 20,
      sortOrder: 0,
    });
    const callsTask = await this.store.createTask({
      userId,
      goalId: recoveryGoal.id,
      title: "Review missed call windows",
      priority: "low",
      estimatedMinutes: 15,
      sortOrder: 1,
    });

    await this.store.updateTask(routingTask.id, { status: "done" });
    await this.store.updateTask(inboxTask.id, { status: "done" });
    await this.store.updateTask(promptTask.id, { status: "in_progress" });
    await this.store.updateTask(callsTask.id, { status: "blocked" });

    await this.store.addSession({
      id: createId(),
      userId,
      goalId: deliveryGoal.id,
      taskId: routingTask.id,
      status: "completed",
      startedAt: this.isoDaysAgo(6, 4),
      endedAt: this.isoDaysAgo(6, 3),
      interruptionCount: 0,
      summary: "Shipped the routing contract pass.",
    });
    await this.store.addSession({
      id: createId(),
      userId,
      goalId: deliveryGoal.id,
      taskId: inboxTask.id,
      status: "completed",
      startedAt: this.isoDaysAgo(4, 5),
      endedAt: this.isoDaysAgo(4, 4),
      interruptionCount: 0,
      summary: "Closed inbox acknowledgement flow.",
    });
    await this.store.addSession({
      id: createId(),
      userId,
      goalId: deliveryGoal.id,
      taskId: promptTask.id,
      status: "interrupted",
      startedAt: this.isoDaysAgo(3, 4),
      endedAt: this.isoDaysAgo(3, 3),
      interruptionCount: 1,
      summary: "Meetings broke the planned block.",
    });
    await this.store.addSession({
      id: createId(),
      userId,
      goalId: deliveryGoal.id,
      taskId: promptTask.id,
      status: "completed",
      startedAt: this.isoDaysAgo(2, 4),
      endedAt: this.isoDaysAgo(2, 3),
      interruptionCount: 0,
      summary: "Recovered and refined prompts.",
    });
    await this.store.addSession({
      id: createId(),
      userId,
      goalId: recoveryGoal.id,
      taskId: sleepTask.id,
      status: "completed",
      startedAt: this.isoDaysAgo(1, 5),
      endedAt: this.isoDaysAgo(1, 4),
      interruptionCount: 0,
      summary: "Reviewed health bridge sleep data.",
    });

    const assessments = [
      {
        focusScore: 78,
        energyScore: 72,
        moodScore: 66,
        summary: "Strong progress and stable focus.",
        recommendedAction: "Keep the current cadence.",
        createdAt: this.isoDaysAgo(6, 2),
      },
      {
        focusScore: 64,
        energyScore: 58,
        moodScore: 60,
        summary: "Solid execution with manageable drift.",
        recommendedAction: "Keep tasks small and explicit.",
        createdAt: this.isoDaysAgo(4, 2),
      },
      {
        focusScore: 42,
        energyScore: 46,
        moodScore: 48,
        summary: "Interruptions increased and progress slowed.",
        recommendedAction: "Use a smaller restart step after meetings.",
        createdAt: this.isoDaysAgo(3, 2),
      },
      {
        focusScore: 69,
        energyScore: 51,
        moodScore: 57,
        summary: "Recovery improved after task size was reduced.",
        recommendedAction: "Continue with shorter focus blocks.",
        createdAt: this.isoDaysAgo(2, 2),
      },
      {
        focusScore: 55,
        energyScore: 39,
        moodScore: 50,
        summary: "Energy dipped after short sleep, but delivery remained on track.",
        recommendedAction: "Schedule a recharge break before the next block.",
        createdAt: this.isoDaysAgo(1, 2),
      },
    ];

    for (const [index, entry] of assessments.entries()) {
      await this.store.addAssessment({
        id: createId(),
        userId,
        windowStart: this.isoDaysAgo(6 - index, 3),
        windowEnd: this.isoDaysAgo(6 - index, 2),
        focusScore: entry.focusScore,
        energyScore: entry.energyScore,
        moodScore: entry.moodScore,
        summary: entry.summary,
        recommendedAction: entry.recommendedAction,
        activeInputs: index >= 2 ? ["desktop_signal", "audio_server_inference", "video_server_inference", "health_bridge"] : ["desktop_signal"],
        fatigueScore: index >= 3 ? 68 : undefined,
        emotionSummary: index >= 2 ? "Audio stress rose during meeting-heavy windows." : undefined,
        emotionConfidence: index >= 2 ? 0.76 : undefined,
        videoSummary: index >= 3 ? "Video fatigue stayed elevated late in the day." : undefined,
        healthSummary: index >= 4 ? "Health bridge: sleep 330m · spo2 95%" : undefined,
        mediaFreshness: index >= 2 ? "fresh" : undefined,
        source: "manual",
        createdAt: entry.createdAt,
      });
    }

    await this.store.addEmotionAssessment({
      userId,
      deviceId: mobileDeviceId,
      sessionId: undefined,
      chunkSequence: 0,
      windowStart: this.isoDaysAgo(3, 3),
      windowEnd: this.isoDaysAgo(3, 2),
      emotionLabel: "tense",
      valenceScore: 44,
      arousalScore: 68,
      stressScore: 66,
      confidence: 0.74,
      summary: "Meeting-heavy windows raised audio stress markers.",
      modelName: "debug-audio-seed",
      source: "cluster-stub",
    });
    await this.store.addEmotionAssessment({
      userId,
      deviceId: mobileDeviceId,
      sessionId: undefined,
      chunkSequence: 1,
      windowStart: this.isoDaysAgo(1, 3),
      windowEnd: this.isoDaysAgo(1, 2),
      emotionLabel: "neutral",
      valenceScore: 57,
      arousalScore: 52,
      stressScore: 41,
      confidence: 0.79,
      summary: "Audio windows stabilized after the recovery day.",
      modelName: "debug-audio-seed",
      source: "cluster-stub",
    });

    await this.store.addVideoAssessment({
      userId,
      deviceId: desktopDeviceId,
      sessionId: undefined,
      windowStart: this.isoDaysAgo(2, 3),
      windowEnd: this.isoDaysAgo(2, 2),
      fatigueScore: 72,
      focusScore: 48,
      confidence: 0.77,
      summary: "Video fatigue remained elevated late in the sprint.",
      modelName: "debug-video-seed",
      featureSummary: "landmarks+blink+headpose",
      source: "cluster-stub",
    });
    await this.store.addVideoAssessment({
      userId,
      deviceId: desktopDeviceId,
      sessionId: undefined,
      windowStart: this.isoDaysAgo(1, 3),
      windowEnd: this.isoDaysAgo(1, 2),
      fatigueScore: 58,
      focusScore: 63,
      confidence: 0.75,
      summary: "Video fatigue eased after a shorter workday.",
      modelName: "debug-video-seed",
      featureSummary: "landmarks+blink+headpose",
      source: "cluster-stub",
    });

    await this.store.addHealthSnapshot({
      userId,
      deviceId: mobileDeviceId,
      sourcePlatform: "android",
      sourceProvider: "health_connect",
      windowStart: this.isoDaysAgo(2, 10),
      windowEnd: this.isoDaysAgo(2, 2),
      sleepMinutes: 330,
      heartRate: 79,
      restingHeartRate: 68,
      oxygenSaturation: 95,
      summary: "Short sleep dragged energy down mid-week.",
    });
    await this.store.addHealthSnapshot({
      userId,
      deviceId: mobileDeviceId,
      sourcePlatform: "android",
      sourceProvider: "health_connect",
      windowStart: this.isoDaysAgo(1, 10),
      windowEnd: this.isoDaysAgo(1, 2),
      sleepMinutes: 405,
      heartRate: 72,
      restingHeartRate: 66,
      oxygenSaturation: 97,
      summary: "Recovery sleep improved before the final day.",
    });

    await this.store.addCallEvent({
      userId,
      deviceId: mobileDeviceId,
      direction: "incoming",
      status: "missed",
      occurredAt: this.isoDaysAgo(3, 1),
    });
    await this.store.addCallEvent({
      userId,
      deviceId: mobileDeviceId,
      direction: "outgoing",
      status: "ended",
      occurredAt: this.isoDaysAgo(2, 1),
    });

    const reflection = generateReflectionReport({
      userId,
      goals: this.store.listGoals(userId),
      tasks: this.store.listTasks(userId),
      sessions: this.store.listSessions(userId),
      assessments: this.store.listStateAssessments(userId, 50),
      emotionAssessments: this.store.listEmotionAssessments(userId, 50),
      videoAssessments: this.store.listVideoAssessments(userId, 50),
      healthSnapshots: this.store.listHealthSnapshots(userId, 50),
      callEvents: this.store.listCallEvents(userId, 50),
      periodType: "weekly",
    });
    await this.store.addReflectionReport({
      ...reflection,
      createdAt: this.isoMinutesAgo(1),
    });

    const seeded = this.buildScenarioSeedResult(definition, {
      goalId: deliveryGoal.id,
      taskId: promptTask.id,
      periodType: "weekly",
      notes: [
        "包含一周内完成/中断会话、音频/视频/健康桥混合输入与一份已生成周报。",
        "适合联调 reflection-coach-agent，也能顺手验证 progress summary 的聚合结果。",
      ],
    });
    const persisted = await this.persistDebugRun({
      kind: "seed",
      userId,
      agentName: "scenario-seed",
      scenarioId: definition.id,
      parentTraceId,
      result: seeded,
    });
    return this.attachTraceMetadata(seeded, persisted);
  }

  async registerEdgeDevice(input: RegisterEdgeDeviceInput) {
    return this.store.registerEdgeDevice(input);
  }

  async recordDeviceHeartbeat(input: DeviceHeartbeatInput) {
    return this.store.recordDeviceHeartbeat(input);
  }

  async createMediaUploadSession(input: CreateMediaUploadSessionInput) {
    return this.store.createMediaUploadSession(input);
  }

  async probeAgentModel(agentName: string, userId = "demo-user", scenarioId?: string, parentTraceId?: string) {
    const trace = this.buildAgentTraceContext({
      parentTraceId,
      operation: "probe",
      agentName,
      scenarioId,
      userId,
    });
    const result = await this.models.probe(agentName, trace);
    const persisted = await this.persistDebugRun({
      kind: "probe",
      userId,
      agentName,
      scenarioId,
      traceId: trace.traceId,
      parentTraceId: trace.parentTraceId,
      result,
    });
    return this.attachTraceMetadata(result, persisted);
  }

  async registerMediaChunk(sessionId: string, input: RegisterMediaChunkInput) {
    return this.store.addMediaChunkManifest(sessionId, input);
  }

  async completeMediaUploadSession(sessionId: string, completedAt?: string) {
    const session = await this.store.completeMediaUploadSession(sessionId, completedAt);
    if (!session) {
      return null;
    }

    const manifests = this.store.listMediaChunkManifests(sessionId);
    const windowStart = manifests[0]?.startedAt ?? session.captureStartedAt ?? now();
    const windowEnd = manifests.at(-1)?.endedAt ?? session.captureEndedAt ?? now();

    await this.store.updateMediaUploadSessionStatus(sessionId, "processing");

    if (session.mediaType === "audio") {
      const partCount = Math.max(manifests.length, session.plannedPartCount, 1);
      await this.recordEmotionAssessment({
        userId: session.userId,
        deviceId: session.deviceId,
        sessionId: session.id,
        chunkSequence: partCount - 1,
        windowStart,
        windowEnd,
        emotionLabel: partCount > 1 ? "tense" : "neutral",
        valenceScore: Math.max(20, 70 - partCount * 5),
        arousalScore: Math.min(90, 45 + partCount * 8),
        stressScore: Math.min(95, 40 + partCount * 10),
        confidence: 0.72,
        summary: "OpenClaw cluster stub inferred elevated audio tension from uploaded media.",
        modelName: "openclaw-audio-stub-v1",
        source: "cluster-stub",
      });
    } else {
      const partCount = Math.max(manifests.length, session.plannedPartCount, 1);
      await this.recordVideoAssessment({
        userId: session.userId,
        deviceId: session.deviceId,
        sessionId: session.id,
        windowStart,
        windowEnd,
        fatigueScore: Math.min(95, 35 + partCount * 12),
        focusScore: Math.max(20, 82 - partCount * 7),
        confidence: 0.74,
        summary: "OpenClaw cluster stub inferred video-based fatigue and focus trends from the uploaded clip.",
        modelName: "openclaw-video-stub-v1",
        featureSummary: "landmarks+blink+headpose",
        source: "cluster-stub",
      });
    }

    await this.store.updateMediaUploadSessionStatus(sessionId, "completed");
    return this.store.getMediaUploadSession(sessionId);
  }

  async refreshReflection(userId: string, periodType: ReflectionReport["periodType"]) {
    const fallback = () =>
      generateReflectionReport({
        userId,
        goals: this.store.listGoals(userId),
        tasks: this.store.listTasks(userId),
        sessions: this.store.listSessions(userId),
        assessments: this.store.listStateAssessments(userId, 50),
        emotionAssessments: this.store.listEmotionAssessments(userId, 50),
        videoAssessments: this.store.listVideoAssessments(userId, 50),
        healthSnapshots: this.store.listHealthSnapshots(userId, 50),
        callEvents: this.store.listCallEvents(userId, 50),
        periodType,
      });
    const fallbackReport = fallback();
    const fallbackPayload = {
      userId: fallbackReport.userId,
      periodType: fallbackReport.periodType,
      periodStart: fallbackReport.periodStart,
      periodEnd: fallbackReport.periodEnd,
      highlights: fallbackReport.highlights,
      blockers: fallbackReport.blockers,
      trends: fallbackReport.trends,
      nextSuggestions: fallbackReport.nextSuggestions,
    };
    const chiefRoute = await this.routeWithChief({
      workflow: "reflection_report",
      userId,
      context: {
        periodType,
        goalCount: this.store.listGoals(userId).length,
        taskCount: this.store.listTasks(userId).length,
        sessionCount: this.store.listSessions(userId).length,
        assessmentCount: this.store.listStateAssessments(userId, 30).length,
        fallbackHighlights: fallbackPayload.highlights,
      },
    });

    const report =
      chiefRoute.executionMode === "stub"
        ? fallbackPayload
        : await this.models.generateJson({
            target: chiefRoute.executionTarget,
            systemPrompt: REFLECTION_SYSTEM_PROMPT,
            userPrompt: JSON.stringify(
              {
                userId,
                periodType,
                chiefRoute,
                goals: this.store.listGoals(userId),
                tasks: this.store.listTasks(userId),
                sessions: this.store.listSessions(userId),
                assessments: this.store.listStateAssessments(userId, 30),
                emotionAssessments: this.store.listEmotionAssessments(userId, 30),
                videoAssessments: this.store.listVideoAssessments(userId, 30),
                healthSnapshots: this.store.listHealthSnapshots(userId, 30),
                callEvents: this.store.listCallEvents(userId, 30),
              },
              null,
              2,
            ),
            schema: reflectionOutputSchema,
            normalize: (raw) => normalizeReflectionOutput(raw, fallbackPayload),
            validateClusterPayload: assertReflectionClusterPayload,
            fallback: () => fallbackPayload,
            traceContext: this.buildAgentTraceContext({
              parentTraceId: typeof chiefRoute.traceId === "string" ? chiefRoute.traceId : undefined,
              operation: "generate",
              agentName: chiefRoute.executionTarget,
              workflow: "reflection_report",
              userId,
            }),
          });

    const persisted: ReflectionReport = {
      id: createId(),
      userId: report.userId ?? userId,
      periodType: report.periodType ?? periodType,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      highlights: report.highlights ?? [],
      blockers: report.blockers ?? [],
      trends: report.trends ?? [],
      nextSuggestions: report.nextSuggestions ?? [],
      createdAt: now(),
    };
    await this.store.addReflectionReport(persisted);
    return persisted;
  }

  private async syncBehaviorOutputs(userId: string, assessment: StateAssessment) {
    const activeSession = this.store.getActiveSession(userId);
    const latestRecoveryPlan = this.store.getLatestRecoveryPlan(userId);
    const hasMobileEndpoint = this.store.getLatestMobileCaptureDevice(userId) !== null;
    const conclusionInput = await this.generateBehaviorConclusion({
      userId,
      assessment,
      sessionId: activeSession?.id ?? latestRecoveryPlan?.sessionId,
      taskId: activeSession?.taskId ?? latestRecoveryPlan?.taskId,
      hasMobileEndpoint,
    });
    const conclusion = await this.store.addBehaviorConclusion(conclusionInput);

    if (conclusion.riskLevel !== "low") {
      await this.dispatchBehaviorNotification(userId, conclusion);
    }

    return conclusion;
  }
}
