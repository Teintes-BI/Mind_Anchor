import type {
  AgentDebugRun,
  AgentDebugRunsResponse,
  ClientInboxMessage,
  ClientInboxOverviewResponse,
  ClientInboxResponse,
  ConsentGrant,
  ContextEvent,
  CoachFeedback,
  CoachFrontAgentState,
  CoachMessage,
  CoachSession,
  DashboardSummary,
  DebugTraceLookupResponse,
  DebugAgentConfigsResponse,
  DebugRegressionMatrixCase,
  DebugRegressionMatrixRun,
  DebugRegressionMatrixResult,
  DebugRegressionMatrixRunsResponse,
  DebugRegressionSuiteResult,
  EmotionAssessment,
  FocusSession,
  GoalFlowOverviewResponse,
  Goal,
  HealthLatestResponse,
  HealthSnapshot,
  OpenClawAdapterClusterAttempt as DomainOpenClawAdapterClusterAttempt,
  OpenClawAdapterDecision as DomainOpenClawAdapterDecision,
  OpenClawAdapterStatusResponse as DomainOpenClawAdapterStatusResponse,
  OpenClawRegistryVisibilityResponse as DomainOpenClawRegistryVisibilityResponse,
  LatestStateResponse,
  RecoveryPlan,
  ReflectionReport,
  ReflectionOverviewResponse,
  RecoveryHistoryResponse,
  DecisionOption,
  DecisionRecord,
  StateTrendsResponse,
  Situation,
  Task,
  VideoAssessment,
  WayfinderOutcome,
  CreateContextEventInput,
  CoreConversation,
  ConversationMessage,
} from "@mindanchor/domain";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";
const coachDevToken =
  import.meta.env.VITE_GATEWAY_DEV_TOKEN ?? (import.meta.env.DEV ? "dev:demo-user:demo@example.com" : undefined);

export type GatewayHealth = {
  ok: boolean;
  mode: string;
  topology: string;
  openClawBaseUrl: string | null;
};

export type ModelProbeResult = {
  success: boolean;
  fallbackLikely: boolean;
  runId?: string;
  traceId?: string;
  parentTraceId?: string;
  createdAt?: string;
  config?: {
    target: string;
    baseUrl: string | null;
    model: string | null;
    wireApi: string;
    reasoningEffort?: string | null;
    disableResponseStorage?: boolean;
    hasApiKey?: boolean;
  };
  attempts?: OpenClawAdapterClusterAttempt[];
  adapter?: OpenClawAdapterDecision;
  parsed?: unknown;
};

export type AgentDebugResult = ModelProbeResult & {
  content?: string;
  extractedJson?: unknown;
  normalizedJson?: unknown;
};

export type OpenClawAdapterClusterAttempt = DomainOpenClawAdapterClusterAttempt;
export type OpenClawAdapterDecision = DomainOpenClawAdapterDecision;
export type OpenClawAdapterStatusResponse = DomainOpenClawAdapterStatusResponse;
export type OpenClawRegistryVisibilityResponse = DomainOpenClawRegistryVisibilityResponse;

export type DebugScenarioDefinition = {
  id: "focus-recovery-loop" | "goal-reprioritization" | "weekly-reflection-mix";
  title: string;
  description: string;
  defaultUserId: string;
  recommendedWorkflows: string[];
};

export type DebugScenarioSeedResult = {
  scenarioId: DebugScenarioDefinition["id"];
  title: string;
  description: string;
  userId: string;
  runId?: string;
  traceId?: string;
  parentTraceId?: string;
  createdAt?: string;
  goalId?: string;
  taskId?: string;
  sessionId?: string;
  periodType?: "weekly" | "monthly";
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

export type DebugTraceLookup = DebugTraceLookupResponse;

export type WayfinderEventInput = Omit<CreateContextEventInput, "userId">;
export type WayfinderHistoryItem = {
  decision: DecisionRecord;
  outcomes: WayfinderOutcome[];
  situation: Situation | null;
  option: DecisionOption | null;
};
export type WayfinderExport = {
  exportedAt: string;
  userId: string;
  contextEvents: ContextEvent[];
  situations: Situation[];
  options: DecisionOption[];
  decisions: DecisionRecord[];
  outcomes: WayfinderOutcome[];
  consent: ConsentGrant[];
};

function withQuery(path: string, query?: Record<string, string | undefined>) {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, value);
    }
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init?.body !== null;
  const headers = new Headers(init?.headers);
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if ((path.startsWith("/coach") || path.startsWith("/wayfinder") || path.startsWith("/v1/core")) && coachDevToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${coachDevToken}`);
  }
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  listCoreConversations: () => request<{ conversations: CoreConversation[] }>("/v1/core/conversations"),
  createCoreConversation: (payload?: { title?: string }) =>
    request<CoreConversation>("/v1/core/conversations", {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),
  getCoreConversation: (conversationId: string) =>
    request<{ conversation: CoreConversation; messages: ConversationMessage[] }>(`/v1/core/conversations/${encodeURIComponent(conversationId)}`),
  sendCoreMessage: (conversationId: string, payload: { content: string; clientMessageId?: string }) => {
    const clientMessageId = payload.clientMessageId ?? crypto.randomUUID();
    return request<{
      userMessage: ConversationMessage;
      assistantMessage: ConversationMessage;
      trace?: { redactions?: string[]; dataBoundary?: string };
    }>(`/v1/core/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      headers: { "Idempotency-Key": clientMessageId },
      body: JSON.stringify({ content: payload.content, clientMessageId }),
    });
  },
  archiveCoreConversation: (conversationId: string) =>
    request<CoreConversation>(`/v1/core/conversations/${encodeURIComponent(conversationId)}/archive`, { method: "POST" }),
  deleteCoreConversation: (conversationId: string) =>
    request<void>(`/v1/core/conversations/${encodeURIComponent(conversationId)}`, { method: "DELETE" }),
  createWayfinderEvent: (payload: WayfinderEventInput) =>
    request<{
      event: ContextEvent;
      situation: Situation;
      fastStatus: "completed";
      fullStatus: "pending";
    }>("/wayfinder/events", {
      method: "POST",
      headers: payload.clientEventId ? { "Idempotency-Key": payload.clientEventId } : undefined,
      body: JSON.stringify(payload),
    }),
  getWayfinderSituation: (situationId: string) => request<Situation>(`/wayfinder/situations/${situationId}`),
  confirmWayfinderSituation: (situationId: string, payload: { status: "confirmed" | "dismissed"; traceId: string }) =>
    request<{
      situation: Situation;
      fastStatus: "completed";
      fullStatus: "pending" | "cancelled";
    }>(`/wayfinder/situations/${situationId}/confirm`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listWayfinderOptions: (situationId: string) =>
    request<{
      situationId: string;
      status: Situation["status"];
      options: DecisionOption[];
      fullStatus: "pending";
    }>(`/wayfinder/situations/${situationId}/options`),
  recordWayfinderDecision: (
    payload: Omit<DecisionRecord, "id" | "userId" | "selectedAt"> & { approvalAcknowledged?: boolean },
  ) => request<DecisionRecord>("/wayfinder/decisions", { method: "POST", body: JSON.stringify(payload) }),
  recordWayfinderOutcome: (
    decisionId: string,
    payload: Omit<WayfinderOutcome, "id" | "userId" | "decisionId" | "observedAt">,
  ) => request<WayfinderOutcome>(`/wayfinder/decisions/${decisionId}/outcome`, { method: "PATCH", body: JSON.stringify(payload) }),
  listWayfinderHistory: (payload?: { limit?: number }) =>
    request<{ decisions: WayfinderHistoryItem[] }>(
      withQuery("/wayfinder/decisions", { limit: payload?.limit ? String(payload.limit) : undefined }),
    ),
  getWayfinderConsent: () => request<{ grants: ConsentGrant[] }>("/wayfinder/consent"),
  updateWayfinderConsent: (
    source: string,
    payload: Omit<ConsentGrant, "id" | "userId" | "grantedAt" | "updatedAt" | "traceId" | "source">,
  ) => request<ConsentGrant>(`/wayfinder/consent/${encodeURIComponent(source)}`, { method: "PATCH", body: JSON.stringify({ ...payload, source }) }),
  exportWayfinderData: () => request<WayfinderExport>("/wayfinder/export", { method: "POST" }),
  getGatewayHealth: () => request<GatewayHealth>("/health"),
  getDebugAgentConfigs: () => request<DebugAgentConfigsResponse>("/debug/agent-configs"),
  getDebugOpenClawAdapterStatus: () => request<OpenClawAdapterStatusResponse>("/debug/openclaw/adapter"),
  getDebugOpenClawRegistryVisibility: () => request<OpenClawRegistryVisibilityResponse>("/debug/openclaw/registry-visibility"),
  getDebugRegressionMatrixCases: () => request<{ cases: DebugRegressionMatrixCase[] }>("/debug/regressions/matrix-cases"),
  runDebugRegressionMatrix: (payload?: { caseIds?: string[] }) =>
    request<DebugRegressionMatrixResult>("/debug/regressions/matrix-run", {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),
  getDebugRegressionMatrixRuns: (payload?: { limit?: number; traceId?: string }) =>
    request<DebugRegressionMatrixRunsResponse>(
      withQuery("/debug/regressions/matrix-runs", {
        limit: payload?.limit ? String(payload.limit) : undefined,
        traceId: payload?.traceId,
      }),
    ),
  clearDebugRegressionMatrixRuns: () =>
    request<{ cleared: boolean }>("/debug/regressions/matrix-runs/clear", {
      method: "POST",
    }),
  getDebugTrace: (traceId: string) => request<DebugTraceLookup>(`/debug/traces/${traceId}`),
  getDebugScenarios: () => request<{ scenarios: DebugScenarioDefinition[] }>("/debug/scenarios"),
  seedDebugScenario: (scenarioId: DebugScenarioDefinition["id"]) =>
    request<DebugScenarioSeedResult>(`/debug/scenarios/${scenarioId}/seed`, {
      method: "POST",
    }),
  runFullRegressionSuite: () =>
    request<DebugRegressionSuiteResult>("/debug/regressions/full-run", {
      method: "POST",
    }),
  getDebugRuns: (payload?: { userId?: string; limit?: number; traceId?: string }) =>
    request<AgentDebugRunsResponse>(
      withQuery("/debug/runs", {
        userId: payload?.userId ?? "demo-user",
        limit: payload?.limit ? String(payload.limit) : undefined,
        traceId: payload?.traceId,
      }),
    ),
  clearDebugRuns: (userId?: string) =>
    request<{ userId: string | null }>("/debug/runs/clear", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  getDashboardSummary: () => request<DashboardSummary>("/dashboard/summary"),
  getCoachFrontAgent: () => request<CoachFrontAgentState>("/coach/front-agent"),
  getCoachSessions: () => request<{ sessions: CoachSession[] }>("/coach/sessions"),
  getCoachSession: (sessionId: string) =>
    request<{ session: CoachSession; messages: CoachMessage[]; feedback: CoachFeedback[] }>(`/coach/sessions/${sessionId}`),
  createCoachSession: (payload?: { title?: string }) =>
    request<CoachSession>("/coach/sessions", {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),
  sendCoachMessage: (sessionId: string, payload: { text: string }) =>
    request<{
      userMessage: CoachMessage;
      assistantMessage: CoachMessage;
      frontAgentState: CoachFrontAgentState;
      fastResponse: string | null;
      traceId: string;
    }>(`/coach/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getCoachMessage: (messageId: string) => request<CoachMessage>(`/coach/messages/${messageId}`),
  retryCoachMessage: (messageId: string) =>
    request<{
      userMessage: CoachMessage;
      assistantMessage: CoachMessage;
      frontAgentState: CoachFrontAgentState;
      fastResponse: string | null;
      traceId: string;
    }>(`/coach/messages/${messageId}/retry`, {
      method: "POST",
    }),
  submitCoachFeedback: (messageId: string, payload: { label: "helpful" | "unhelpful"; reason?: string }) =>
    request<CoachFeedback>(`/coach/messages/${messageId}/feedback`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getGoalFlowOverview: (payload?: { userId?: string }) =>
    request<GoalFlowOverviewResponse>(
      withQuery("/goalflow/overview", {
        userId: payload?.userId ?? "demo-user",
      }),
    ),
  getGoals: () => request<{ goals: Goal[] }>("/goals"),
  createGoal: (payload: Partial<Goal> & { title: string }) =>
    request<Goal>("/goals", {
      method: "POST",
      body: JSON.stringify({
        userId: payload.userId ?? "demo-user",
        title: payload.title,
        description: payload.description ?? "",
        targetDate: payload.targetDate,
      }),
    }),
  getTasks: () => request<{ tasks: Task[] }>("/tasks"),
  createTask: (payload: {
    goalId: string;
    title: string;
    priority?: Task["priority"];
    estimatedMinutes?: number;
    dueAt?: string;
  }) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({
        userId: "demo-user",
        ...payload,
      }),
    }),
  updateTask: (taskId: string, payload: Partial<Pick<Task, "status" | "priority" | "estimatedMinutes" | "dueAt" | "sortOrder" | "title">>) =>
    request<Task>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getSessions: () => request<{ sessions: FocusSession[] }>("/sessions"),
  startSession: (payload: { taskId?: string; goalId?: string }) =>
    request<FocusSession>("/sessions/start", {
      method: "POST",
      body: JSON.stringify({
        userId: "demo-user",
        ...payload,
      }),
    }),
  endSession: (payload: { sessionId: string; interrupted: boolean; summary: string; completeTask?: boolean }) =>
    request<{ session: FocusSession; recoveryPlan: RecoveryPlan | null }>("/sessions/end", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getLatestState: () => request<LatestStateResponse>("/state/latest"),
  getStateTrends: (payload?: { userId?: string; limit?: number }) =>
    request<StateTrendsResponse>(
      withQuery("/state/trends", {
        userId: payload?.userId ?? "demo-user",
        limit: payload?.limit ? String(payload.limit) : undefined,
      }),
    ),
  getStateHistory: () =>
    request<{
      assessments: LatestStateResponse["latestAssessment"][];
      emotionAssessments: EmotionAssessment[];
      videoAssessments: VideoAssessment[];
      healthSnapshots: HealthSnapshot[];
      behaviorConclusions: NonNullable<LatestStateResponse["latestBehaviorConclusion"]>[];
      callEvents: Array<{
        id: string;
        status: string;
        direction: string;
        occurredAt: string;
      }>;
      signals: Array<{
        id: string;
        eventType: string;
        occurredAt: string;
        payload: Record<string, string | number | boolean | null>;
      }>;
    }>("/state/history"),
  createCheckin: (payload: { focusScore: number; energyScore: number; moodScore: number; note: string }) =>
    request<LatestStateResponse>("/state/checkins", {
      method: "POST",
      body: JSON.stringify({
        userId: "demo-user",
        ...payload,
      }),
    }),
  getLatestEmotion: () =>
    request<{
      assessment: EmotionAssessment | null;
      recent: EmotionAssessment[];
    }>("/emotion/latest"),
  getLatestMobileDevice: () =>
    request<{
      device: DashboardSummary["mobileAudio"]["latestDevice"];
      latestSession: DashboardSummary["mobileAudio"]["latestSession"];
      latestCallEvent: DashboardSummary["mobileAudio"]["latestCallEvent"];
    }>("/mobile/devices/latest"),
  getHealthLatest: () => request<HealthLatestResponse>("/health/latest"),
  getClientInbox: () => request<ClientInboxResponse>("/client/inbox"),
  getClientInboxOverview: (payload?: { userId?: string; limit?: number }) =>
    request<ClientInboxOverviewResponse>(
      withQuery("/client/inbox/overview", {
        userId: payload?.userId ?? "demo-user",
        limit: payload?.limit ? String(payload.limit) : undefined,
      }),
    ),
  ackClientInbox: (messageId: string) =>
    request<ClientInboxMessage>(`/client/inbox/${messageId}/ack`, {
      method: "POST",
    }),
  getReflections: () => request<{ reports: ReflectionReport[] }>("/reflections/latest"),
  getReflectionOverview: (payload?: { userId?: string; limit?: number }) =>
    request<ReflectionOverviewResponse>(
      withQuery("/reflections/overview", {
        userId: payload?.userId ?? "demo-user",
        limit: payload?.limit ? String(payload.limit) : undefined,
      }),
    ),
  createRecoveryPlan: (payload: { sessionId?: string; taskId?: string; reason: string }) =>
    request<RecoveryPlan>("/recovery/plan", {
      method: "POST",
      body: JSON.stringify({
        userId: "demo-user",
        ...payload,
      }),
    }),
  getRecoveryHistory: (payload?: { userId?: string; limit?: number }) =>
    request<RecoveryHistoryResponse>(
      withQuery("/recovery/history", {
        userId: payload?.userId ?? "demo-user",
        limit: payload?.limit ? String(payload.limit) : undefined,
      }),
    ),
  probeAgentModel: (agentName: string, payload?: { userId?: string; scenarioId?: string }) =>
    request<ModelProbeResult>(
      withQuery(`/debug/model-probe/${agentName}`, { userId: payload?.userId ?? "demo-user", scenarioId: payload?.scenarioId }),
    ),
  debugChiefRoute: (payload: { workflow: string; userId?: string; taskId?: string; periodType?: "weekly" | "monthly"; scenarioId?: string }) =>
    request<AgentDebugResult>(
      withQuery("/debug/agent/chief-route", {
        workflow: payload.workflow,
        userId: payload.userId ?? "demo-user",
        taskId: payload.taskId,
        periodType: payload.periodType,
        scenarioId: payload.scenarioId,
      }),
    ),
  debugStateInsight: (payload?: { userId?: string; scenarioId?: string }) =>
    request<AgentDebugResult>(withQuery("/debug/agent/state-insight", { userId: payload?.userId ?? "demo-user", scenarioId: payload?.scenarioId })),
  debugRecovery: (payload?: { userId?: string; taskId?: string; scenarioId?: string }) =>
    request<AgentDebugResult>(
      withQuery("/debug/agent/interruption-recovery", {
        userId: payload?.userId ?? "demo-user",
        taskId: payload?.taskId,
        scenarioId: payload?.scenarioId,
      }),
    ),
  debugReflection: (payload?: { userId?: string; periodType?: "weekly" | "monthly"; scenarioId?: string }) =>
    request<AgentDebugResult>(
      withQuery("/debug/agent/reflection", {
        userId: payload?.userId ?? "demo-user",
        periodType: payload?.periodType ?? "weekly",
        scenarioId: payload?.scenarioId,
      }),
    ),
  debugTaskManagement: (payload?: { userId?: string; goalId?: string; scenarioId?: string }) =>
    request<AgentDebugResult>(
      withQuery("/debug/agent/task-management", {
        userId: payload?.userId ?? "demo-user",
        goalId: payload?.goalId,
        scenarioId: payload?.scenarioId,
      }),
    ),
  debugProgressFeedback: (payload?: { userId?: string; scenarioId?: string }) =>
    request<AgentDebugResult>(withQuery("/debug/agent/progress-feedback", { userId: payload?.userId ?? "demo-user", scenarioId: payload?.scenarioId })),
  debugAutomation: (payload?: { userId?: string; scenarioId?: string }) =>
    request<AgentDebugResult>(withQuery("/debug/agent/automation", { userId: payload?.userId ?? "demo-user", scenarioId: payload?.scenarioId })),
};

export type {
  AgentDebugRun,
  DebugAgentConfigsResponse,
  DebugRegressionMatrixCase,
  DebugRegressionMatrixRun,
  DebugRegressionMatrixResult,
  DebugRegressionSuiteResult,
};
