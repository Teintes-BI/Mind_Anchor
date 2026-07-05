import {
  databaseSchema,
  emptyDatabase,
  type AudioCaptureSession,
  type AgentDebugRun,
  agentMemoryProposalSchema,
  type AgentMemoryProposal,
  type BehaviorConclusion,
  type CallEvent,
  type CoachFeedback,
  type CoachMemoryItem,
  type CoachMessage,
  type CoachMessageUsedMemoryEntry,
  type CoachSession,
  type CoachTrainingExample,
  type CheckinInput,
  type ClientInboxMessage,
  type CreateCallEventInput,
  type CreateEmotionAssessmentInput,
  type CreateGoalInput,
  type CreateHealthSnapshotInput,
  type CreateMediaUploadSessionInput,
  type CreateTaskInput,
  type CreateVideoAssessmentInput,
  type Database,
  type DeviceHeartbeatInput,
  type DebugRegressionMatrixRun,
  type EdgeDevice,
  type EmotionAssessment,
  type FocusSession,
  type Goal,
  type HealthSnapshot,
  type Intervention,
  type LocalAuthUser,
  type LocalAuthRefreshToken,
  type MediaChunkManifest,
  type MediaUploadSession,
  type MemoryCandidate,
  type MemoryItem,
  type MobileCaptureDevice,
  type PlanChangeCommandLog,
  type PlanChangeProposal,
  type RecoveryPlan,
  type ReflectionReport,
  type RegisterEdgeDeviceInput,
  type RegisterMediaChunkInput,
  type RegisterMobileDeviceInput,
  type StoredCoachFrontAgentState,
  type StartAudioCaptureSessionInput,
  type StateAssessment,
  type StateSignalEvent,
  type Task,
  type TraceLogEvent,
  type UpdateTaskInput,
  type VideoAssessment,
} from "@mindanchor/domain";
import { createId, ensureFile, now, readJsonFile, stableStringify, writeJsonFile } from "./lib/utils.js";

const eventFingerprint = (event: Pick<StateSignalEvent, "userId" | "source" | "eventType" | "occurredAt" | "payload">) =>
  `${event.userId}:${event.source}:${event.eventType}:${event.occurredAt}:${stableStringify(event.payload)}`;

export class MindAnchorStore {
  private state: Database = emptyDatabase();
  private persistQueue = Promise.resolve();

  constructor(private readonly dataFile: string) {}

  async init() {
    await ensureFile(this.dataFile, JSON.stringify(emptyDatabase(), null, 2));
    const data = await readJsonFile(this.dataFile, emptyDatabase());
    this.state = databaseSchema.parse(this.migrateLegacyData(data));
  }

  private migrateLegacyData(data: unknown) {
    if (!data || typeof data !== "object") {
      return data;
    }

    const record = data as Record<string, unknown>;
    const agentDebugRuns = Array.isArray(record.agentDebugRuns)
      ? record.agentDebugRuns.map((run) => {
          if (!run || typeof run !== "object") {
            return run;
          }
          const item = run as Record<string, unknown>;
          return {
            ...item,
            traceId: typeof item.traceId === "string" ? item.traceId : createId(),
          };
        })
      : record.agentDebugRuns;

    const debugRegressionMatrixRuns = Array.isArray(record.debugRegressionMatrixRuns)
      ? record.debugRegressionMatrixRuns.map((run) => {
          if (!run || typeof run !== "object") {
            return run;
          }
          const item = run as Record<string, unknown>;
          const matrixTraceId = typeof item.traceId === "string" ? item.traceId : createId();
          const caseResults = Array.isArray(item.caseResults)
            ? item.caseResults.map((caseResult) => {
                if (!caseResult || typeof caseResult !== "object") {
                  return caseResult;
                }
                const caseRecord = caseResult as Record<string, unknown>;
                return {
                  ...caseRecord,
                  traceId: typeof caseRecord.traceId === "string" ? caseRecord.traceId : createId(),
                  parentTraceId: typeof caseRecord.parentTraceId === "string" ? caseRecord.parentTraceId : matrixTraceId,
                };
              })
            : item.caseResults;

          return {
            ...item,
            traceId: matrixTraceId,
            caseResults,
          };
        })
      : record.debugRegressionMatrixRuns;

    const traceLogEvents = Array.isArray(record.traceLogEvents)
      ? record.traceLogEvents.map((event) => {
          if (!event || typeof event !== "object") {
            return event;
          }
          const item = event as Record<string, unknown>;
          return {
            ...item,
            traceId: typeof item.traceId === "string" ? item.traceId : createId(),
          };
        })
      : record.traceLogEvents;

    return {
      ...record,
      agentDebugRuns,
      debugRegressionMatrixRuns,
      traceLogEvents,
    };
  }

  private async persist() {
    this.persistQueue = this.persistQueue.then(() => writeJsonFile(this.dataFile, this.state));
    await this.persistQueue;
  }

  private withTaskSummary(goal: Goal): Goal {
    const goalTasks = this.state.tasks.filter((task) => task.goalId === goal.id);
    return {
      ...goal,
      taskSummary: {
        total: goalTasks.length,
        completed: goalTasks.filter((task) => task.status === "done").length,
      },
    };
  }

  private async syncGoalStatus(goalId: string) {
    const goal = this.state.goals.find((candidate) => candidate.id === goalId);
    if (!goal) {
      return null;
    }

    const goalTasks = this.state.tasks.filter((task) => task.goalId === goalId);
    if (goalTasks.length > 0 && goalTasks.every((task) => task.status === "done")) {
      goal.status = "completed";
    } else if (goal.status === "completed") {
      goal.status = "active";
    }
    goal.updatedAt = now();
    return goal;
  }

  listGoals(userId = "demo-user") {
    return this.state.goals.filter((goal) => goal.userId === userId).map((goal) => this.withTaskSummary(goal));
  }

  listTasks(userId = "demo-user", goalId?: string) {
    return this.state.tasks
      .filter((task) => task.userId === userId)
      .filter((task) => (goalId ? task.goalId === goalId : true))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
  }

  listSessions(userId = "demo-user") {
    return this.state.sessions
      .filter((session) => session.userId === userId)
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt));
  }

  listStateSignals(userId = "demo-user", limit = 50) {
    return this.state.stateSignals
      .filter((signal) => signal.userId === userId)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .slice(0, limit);
  }

  listStateAssessments(userId = "demo-user", limit = 50) {
    return this.state.stateAssessments
      .filter((assessment) => assessment.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listReflectionReports(userId = "demo-user", periodType?: "weekly" | "monthly") {
    return this.state.reflectionReports
      .filter((report) => report.userId === userId)
      .filter((report) => (periodType ? report.periodType === periodType : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  listInterventions(userId = "demo-user") {
    return this.state.interventions
      .filter((intervention) => intervention.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  listRecoveryPlans(userId = "demo-user", limit = 50) {
    return this.state.recoveryPlans
      .filter((plan) => plan.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listMobileCaptureDevices(userId = "demo-user") {
    return this.state.mobileCaptureDevices
      .filter((device) => device.userId === userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  listAudioCaptureSessions(userId = "demo-user") {
    return this.state.audioCaptureSessions
      .filter((session) => session.userId === userId)
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt));
  }

  listCallEvents(userId = "demo-user", limit = 50) {
    return this.state.callEvents
      .filter((event) => event.userId === userId)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .slice(0, limit);
  }

  listEmotionAssessments(userId = "demo-user", limit = 50) {
    return this.state.emotionAssessments
      .filter((assessment) => assessment.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listEdgeDevices(userId = "demo-user") {
    return this.state.edgeDevices
      .filter((device) => device.userId === userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  listMediaUploadSessions(userId = "demo-user") {
    return this.state.mediaUploadSessions
      .filter((session) => session.userId === userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  listMediaChunkManifests(sessionId: string) {
    return this.state.mediaChunkManifests
      .filter((manifest) => manifest.sessionId === sessionId)
      .sort((left, right) => left.sequence - right.sequence);
  }

  listVideoAssessments(userId = "demo-user", limit = 50) {
    return this.state.videoAssessments
      .filter((assessment) => assessment.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listHealthSnapshots(userId = "demo-user", limit = 50) {
    return this.state.healthSnapshots
      .filter((snapshot) => snapshot.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listBehaviorConclusions(userId = "demo-user", limit = 50) {
    return this.state.behaviorConclusions
      .filter((conclusion) => conclusion.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listClientInboxMessages(userId = "demo-user", limit = 50) {
    return this.state.clientInboxMessages
      .filter((message) => message.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  getCoachFrontAgentState(userId = "demo-user") {
    return this.state.coachFrontAgentStates.find((state) => state.userId === userId) ?? null;
  }

  listPlanChangeProposals(userId = "demo-user", limit = 50) {
    return this.state.planChangeProposals
      .filter((proposal) => proposal.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  findPlanChangeProposalById(proposalId: string) {
    return this.state.planChangeProposals.find((proposal) => proposal.id === proposalId) ?? null;
  }

  listPlanChangeCommandLogs(userId = "demo-user", limit = 50) {
    return this.state.planChangeCommandLogs
      .filter((log) => log.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listCoachSessions(userId = "demo-user", limit = 50) {
    return this.state.coachSessions
      .filter((session) => session.userId === userId && session.status !== "deleted")
      .sort((left, right) => {
        const leftTimestamp = left.lastMessageAt ?? left.updatedAt;
        const rightTimestamp = right.lastMessageAt ?? right.updatedAt;
        return rightTimestamp.localeCompare(leftTimestamp);
      })
      .slice(0, limit);
  }

  getCoachSession(userId = "demo-user", sessionId: string) {
    return (
      this.state.coachSessions.find(
        (session) => session.userId === userId && session.id === sessionId && session.status !== "deleted",
      ) ?? null
    );
  }

  listCoachMessagesBySession(userId = "demo-user", sessionId: string, limit = 200) {
    return this.state.coachMessages
      .filter((message) => message.userId === userId && message.sessionId === sessionId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .slice(0, limit);
  }

  getCoachMessage(userId = "demo-user", messageId: string) {
    return this.state.coachMessages.find((message) => message.userId === userId && message.id === messageId) ?? null;
  }

  listCoachFeedbackByMessage(userId = "demo-user", messageId: string, limit = 50) {
    return this.state.coachFeedback
      .filter((feedback) => feedback.userId === userId && feedback.messageId === messageId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listCoachMemoryItems(userId = "demo-user", limit = 100) {
    return this.state.coachMemoryItems
      .filter((item) => item.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listActiveCoachMemoryItems(userId = "demo-user", limit = 100) {
    return this.listCoachMemoryItems(userId, limit).filter((item) => item.status === "active" && item.revokedAt === null);
  }

  listCoachTrainingExamples(userId = "demo-user", limit = 100) {
    return this.state.coachTrainingExamples
      .filter((example) => example.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listMemoryCandidates(userId = "demo-user", limit = 50) {
    return this.state.memoryCandidates
      .filter((candidate) => candidate.userId === userId)
      .sort((left, right) => {
        const leftTimestamp = left.effectiveAt ?? left.recallBlockedAt ?? left.deletedAt ?? left.candidateId;
        const rightTimestamp = right.effectiveAt ?? right.recallBlockedAt ?? right.deletedAt ?? right.candidateId;
        return rightTimestamp.localeCompare(leftTimestamp);
      })
      .slice(0, limit);
  }

  listPendingMemoryCandidates(userId = "demo-user", limit = 50) {
    return this.listMemoryCandidates(userId, limit).filter((candidate) => candidate.status === "candidate");
  }

  listMemoryItems(userId = "demo-user", limit = 50) {
    return this.state.memoryItems
      .filter((item) => item.userId === userId)
      .sort((left, right) => right.effectiveAt.localeCompare(left.effectiveAt))
      .slice(0, limit);
  }

  listRecallEligibleMemory(userId = "demo-user") {
    return this.state.memoryItems.filter(
      (item) =>
        item.userId === userId && item.status === "active" && item.deletedAt === null && item.recallBlockedAt === null,
    );
  }

  listAgentDebugRuns(userId = "demo-user", limit = 50, traceId?: string) {
    return this.state.agentDebugRuns
      .filter((run) => run.userId === userId)
      .filter((run) => (traceId ? run.traceId === traceId || run.parentTraceId === traceId : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listAgentDebugRunsByTrace(traceId: string, limit = 200) {
    return [...this.state.agentDebugRuns]
      .filter((run) => run.traceId === traceId || run.parentTraceId === traceId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  listDebugRegressionMatrixRuns(limit = 20, traceId?: string) {
    return [...this.state.debugRegressionMatrixRuns]
      .filter((run) =>
        traceId
          ? run.traceId === traceId ||
            run.caseResults.some((result) => result.traceId === traceId || result.parentTraceId === traceId)
          : true,
      )
      .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
      .slice(0, limit);
  }

  listTraceLogEvents(traceId: string, limit = 200) {
    return [...this.state.traceLogEvents]
      .filter((event) => event.traceId === traceId || event.parentTraceId === traceId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .slice(0, limit);
  }

  listRecentTraceLogEventsByEvent(eventName: string, limit = 50) {
    return [...this.state.traceLogEvents]
      .filter((event) => event.event === eventName)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  getLatestAssessment(userId = "demo-user") {
    return this.listStateAssessments(userId, 1)[0] ?? null;
  }

  getGoal(goalId: string) {
    const goal = this.state.goals.find((candidate) => candidate.id === goalId);
    return goal ? this.withTaskSummary(goal) : null;
  }

  getTask(taskId: string) {
    return this.state.tasks.find((candidate) => candidate.id === taskId) ?? null;
  }

  getLatestIntervention(userId = "demo-user") {
    return this.listInterventions(userId)[0] ?? null;
  }

  getLatestRecoveryPlan(userId = "demo-user") {
    return (
      this.state.recoveryPlans
        .filter((plan) => plan.userId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null
    );
  }

  getLatestMobileCaptureDevice(userId = "demo-user") {
    return this.listMobileCaptureDevices(userId)[0] ?? null;
  }

  getLatestAudioCaptureSession(userId = "demo-user") {
    return this.listAudioCaptureSessions(userId)[0] ?? null;
  }

  getLatestCallEvent(userId = "demo-user") {
    return this.listCallEvents(userId, 1)[0] ?? null;
  }

  getLatestEmotionAssessment(userId = "demo-user") {
    return this.listEmotionAssessments(userId, 1)[0] ?? null;
  }

  getLatestEdgeDevice(userId = "demo-user") {
    return this.listEdgeDevices(userId)[0] ?? null;
  }

  getMediaUploadSession(sessionId: string) {
    return this.state.mediaUploadSessions.find((session) => session.id === sessionId) ?? null;
  }

  getLatestVideoAssessment(userId = "demo-user") {
    return this.listVideoAssessments(userId, 1)[0] ?? null;
  }

  getLatestHealthSnapshot(userId = "demo-user") {
    return this.listHealthSnapshots(userId, 1)[0] ?? null;
  }

  getLatestBehaviorConclusion(userId = "demo-user") {
    return this.listBehaviorConclusions(userId, 1)[0] ?? null;
  }

  listLocalAuthUsers() {
    return [...this.state.localAuthUsers].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  findLocalAuthUserByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    return this.state.localAuthUsers.find((user) => user.email.trim().toLowerCase() === normalized) ?? null;
  }

  findLocalAuthUserById(userId: string) {
    return this.state.localAuthUsers.find((user) => user.id === userId) ?? null;
  }

  async createLocalAuthUser(input: { email: string; passwordHash: string; displayName?: string }) {
    const timestamp = now();
    const user: LocalAuthUser = {
      id: createId(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      displayName: input.displayName,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.localAuthUsers.push(user);
    await this.persist();
    return user;
  }

  findActiveLocalAuthRefreshTokenByHash(tokenHash: string, at = now()) {
    const activeToken =
      this.state.localAuthRefreshTokens.find(
        (token) =>
          token.tokenHash === tokenHash &&
          !token.revokedAt &&
          Date.parse(token.expiresAt) > Date.parse(at),
      ) ?? null;
    return activeToken;
  }

  async createLocalAuthRefreshToken(input: { userId: string; tokenHash: string; expiresAt: string }) {
    const timestamp = now();
    const refreshToken: LocalAuthRefreshToken = {
      id: createId(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: input.expiresAt,
    };
    this.state.localAuthRefreshTokens.push(refreshToken);
    await this.persist();
    return refreshToken;
  }

  async revokeLocalAuthRefreshToken(tokenId: string, input: { replacedByTokenId?: string } = {}) {
    const refreshToken = this.state.localAuthRefreshTokens.find((token) => token.id === tokenId);
    if (!refreshToken) {
      return null;
    }

    const timestamp = now();
    refreshToken.revokedAt = refreshToken.revokedAt ?? timestamp;
    refreshToken.updatedAt = timestamp;
    if (input.replacedByTokenId) {
      refreshToken.replacedByTokenId = input.replacedByTokenId;
    }
    await this.persist();
    return refreshToken;
  }

  async revokeLocalAuthRefreshTokenByHash(tokenHash: string) {
    const refreshToken =
      this.state.localAuthRefreshTokens.find(
        (token) => token.tokenHash === tokenHash && !token.revokedAt && Date.parse(token.expiresAt) > Date.now(),
      ) ?? null;
    if (!refreshToken) {
      return null;
    }

    return this.revokeLocalAuthRefreshToken(refreshToken.id);
  }

  getActiveSession(userId = "demo-user") {
    return this.state.sessions.find((session) => session.userId === userId && session.status === "active") ?? null;
  }

  async createGoal(input: CreateGoalInput) {
    const timestamp = now();
    const goal: Goal = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      title: input.title,
      description: input.description ?? "",
      status: "active",
      targetDate: input.targetDate,
      taskSummary: { total: 0, completed: 0 },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.goals.push(goal);
    await this.persist();
    return goal;
  }

  async createTask(input: CreateTaskInput) {
    const timestamp = now();
    const task: Task = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      goalId: input.goalId,
      title: input.title,
      status: "todo",
      priority: input.priority ?? "medium",
      estimatedMinutes: input.estimatedMinutes ?? 25,
      dueAt: input.dueAt,
      sortOrder: input.sortOrder ?? this.listTasks(input.userId, input.goalId).length,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.tasks.push(task);
    await this.syncGoalStatus(task.goalId);
    await this.persist();
    return task;
  }

  async updateTasks(tasks: Task[]) {
    const lookup = new Map(tasks.map((task) => [task.id, task]));
    this.state.tasks = this.state.tasks.map((task) => lookup.get(task.id) ?? task);
    const goalIds = [...new Set(tasks.map((task) => task.goalId))];
    for (const goalId of goalIds) {
      await this.syncGoalStatus(goalId);
    }
    await this.persist();
  }

  async updateTask(taskId: string, patch: UpdateTaskInput) {
    const task = this.state.tasks.find((candidate) => candidate.id === taskId);
    if (!task) {
      return null;
    }

    if (patch.title !== undefined) {
      task.title = patch.title;
    }
    if (patch.status !== undefined) {
      task.status = patch.status;
    }
    if (patch.priority !== undefined) {
      task.priority = patch.priority;
    }
    if (patch.estimatedMinutes !== undefined) {
      task.estimatedMinutes = patch.estimatedMinutes;
    }
    if (patch.dueAt !== undefined) {
      task.dueAt = patch.dueAt ?? undefined;
    }
    if (patch.sortOrder !== undefined) {
      task.sortOrder = patch.sortOrder;
    }
    task.updatedAt = now();

    await this.syncGoalStatus(task.goalId);
    await this.persist();
    return task;
  }

  async createSession(input: { userId?: string; taskId?: string; goalId?: string }) {
    const session: FocusSession = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      taskId: input.taskId,
      goalId: input.goalId,
      status: "active",
      startedAt: now(),
      interruptionCount: 0,
      summary: "",
    };
    this.state.sessions.push(session);
    await this.persist();
    return session;
  }

  async addSession(session: FocusSession) {
    this.state.sessions.push(session);
    await this.persist();
    return session;
  }

  async endSession(sessionId: string, interrupted: boolean, summary: string) {
    const session = this.state.sessions.find((candidate) => candidate.id === sessionId);
    if (!session) {
      return null;
    }
    session.status = interrupted ? "interrupted" : "completed";
    session.interruptionCount = interrupted ? session.interruptionCount + 1 : session.interruptionCount;
    session.endedAt = now();
    session.summary = summary;
    await this.persist();
    return session;
  }

  async resetUserData(userId: string) {
    const mediaSessionIds = new Set(this.state.mediaUploadSessions.filter((session) => session.userId === userId).map((session) => session.id));

    this.state.goals = this.state.goals.filter((goal) => goal.userId !== userId);
    this.state.tasks = this.state.tasks.filter((task) => task.userId !== userId);
    this.state.sessions = this.state.sessions.filter((session) => session.userId !== userId);
    this.state.stateSignals = this.state.stateSignals.filter((signal) => signal.userId !== userId);
    this.state.stateAssessments = this.state.stateAssessments.filter((assessment) => assessment.userId !== userId);
    this.state.interventions = this.state.interventions.filter((intervention) => intervention.userId !== userId);
    this.state.recoveryPlans = this.state.recoveryPlans.filter((plan) => plan.userId !== userId);
    this.state.reflectionReports = this.state.reflectionReports.filter((report) => report.userId !== userId);
    this.state.mobileCaptureDevices = this.state.mobileCaptureDevices.filter((device) => device.userId !== userId);
    this.state.audioCaptureSessions = this.state.audioCaptureSessions.filter((session) => session.userId !== userId);
    this.state.callEvents = this.state.callEvents.filter((event) => event.userId !== userId);
    this.state.emotionAssessments = this.state.emotionAssessments.filter((assessment) => assessment.userId !== userId);
    this.state.edgeDevices = this.state.edgeDevices.filter((device) => device.userId !== userId);
    this.state.mediaUploadSessions = this.state.mediaUploadSessions.filter((session) => session.userId !== userId);
    this.state.mediaChunkManifests = this.state.mediaChunkManifests.filter((manifest) => !mediaSessionIds.has(manifest.sessionId));
    this.state.videoAssessments = this.state.videoAssessments.filter((assessment) => assessment.userId !== userId);
    this.state.healthSnapshots = this.state.healthSnapshots.filter((snapshot) => snapshot.userId !== userId);
    this.state.behaviorConclusions = this.state.behaviorConclusions.filter((conclusion) => conclusion.userId !== userId);
    this.state.clientInboxMessages = this.state.clientInboxMessages.filter((message) => message.userId !== userId);
    this.state.agentDebugRuns = this.state.agentDebugRuns.filter((run) => run.userId !== userId);
    this.state.coachFrontAgentStates = this.state.coachFrontAgentStates.filter((state) => state.userId !== userId);
    this.state.planChangeProposals = this.state.planChangeProposals.filter((proposal) => proposal.userId !== userId);
    this.state.planChangeCommandLogs = this.state.planChangeCommandLogs.filter((log) => log.userId !== userId);
    this.state.coachSessions = this.state.coachSessions.filter((session) => session.userId !== userId);
    this.state.coachMessages = this.state.coachMessages.filter((message) => message.userId !== userId);
    this.state.coachFeedback = this.state.coachFeedback.filter((feedback) => feedback.userId !== userId);
    this.state.coachMemoryItems = this.state.coachMemoryItems.filter((item) => item.userId !== userId);
    this.state.coachTrainingExamples = this.state.coachTrainingExamples.filter((example) => example.userId !== userId);
    this.state.memoryCandidates = this.state.memoryCandidates.filter((candidate) => candidate.userId !== userId);
    this.state.memoryItems = this.state.memoryItems.filter((item) => item.userId !== userId);

    await this.persist();
    return { userId };
  }

  async saveCoachFrontAgentState(input: Omit<StoredCoachFrontAgentState, "updatedAt">) {
    const timestamp = now();
    const existing = this.state.coachFrontAgentStates.find((state) => state.userId === input.userId);
    if (existing) {
      Object.assign(existing, input, { updatedAt: timestamp });
      await this.persist();
      return existing;
    }

    const state: StoredCoachFrontAgentState = {
      ...input,
      updatedAt: timestamp,
    };
    this.state.coachFrontAgentStates.push(state);
    await this.persist();
    return state;
  }

  async createCoachSession(input: Pick<CoachSession, "userId" | "title" | "status">) {
    const timestamp = now();
    const session: CoachSession = {
      id: createId(),
      userId: input.userId,
      title: input.title,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMessageAt: null,
    };
    this.state.coachSessions.push(session);
    await this.persist();
    return session;
  }

  async createCoachMessage(
    input: Omit<CoachMessage, "id" | "createdAt" | "updatedAt" | "usedMemoryEntries" | "conversationPath"> & {
      usedMemoryEntries?: CoachMessageUsedMemoryEntry[];
      conversationPath?: CoachMessage["conversationPath"];
    },
  ) {
    const timestamp = now();
    const message: CoachMessage = {
      ...input,
      usedMemoryEntries: input.usedMemoryEntries ?? [],
      conversationPath: input.conversationPath ?? null,
      id: createId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.coachMessages.push(message);

    const session = this.state.coachSessions.find((candidate) => candidate.userId === input.userId && candidate.id === input.sessionId);
    if (session) {
      session.updatedAt = timestamp;
      session.lastMessageAt = timestamp;
    }

    await this.persist();
    return message;
  }

  async updateCoachMessage(
    messageId: string,
    patch: Partial<
      Pick<CoachMessage, "status" | "fastResponse" | "fullResponse" | "usedMemoryIds" | "usedMemoryEntries" | "conversationPath" | "traceId" | "errorCode">
    >,
  ) {
    const message = this.state.coachMessages.find((candidate) => candidate.id === messageId);
    if (!message) {
      return null;
    }

    Object.assign(message, patch, {
      updatedAt: now(),
    });
    await this.persist();
    return message;
  }

  async createCoachFeedback(input: Omit<CoachFeedback, "id" | "createdAt">) {
    const feedback: CoachFeedback = {
      ...input,
      id: createId(),
      createdAt: now(),
    };
    this.state.coachFeedback.push(feedback);
    await this.persist();
    return feedback;
  }

  async createCoachMemoryItem(input: Omit<CoachMemoryItem, "id" | "createdAt">) {
    const item: CoachMemoryItem = {
      ...input,
      id: createId(),
      createdAt: now(),
    };
    this.state.coachMemoryItems.push(item);
    await this.persist();
    return item;
  }

  async revokeCoachMemoryItem(userId: string, memoryId: string) {
    const item = this.state.coachMemoryItems.find((candidate) => candidate.userId === userId && candidate.id === memoryId);
    if (!item) {
      return null;
    }

    item.status = "revoked";
    item.revokedAt = now();
    await this.persist();
    return item;
  }

  async touchCoachMemoryItemLastUsed(userId: string, memoryId: string) {
    const item = this.state.coachMemoryItems.find((candidate) => candidate.userId === userId && candidate.id === memoryId);
    if (!item) {
      return null;
    }

    item.lastUsedAt = now();
    await this.persist();
    return item;
  }

  async createCoachTrainingExample(input: Omit<CoachTrainingExample, "id" | "createdAt">) {
    const example: CoachTrainingExample = {
      ...input,
      id: createId(),
      createdAt: now(),
    };
    this.state.coachTrainingExamples.push(example);
    await this.persist();
    return example;
  }

  async invalidateCoachTrainingExamplesBySourceMessage(userId: string, sourceMessageId: string) {
    let changed = 0;
    this.state.coachTrainingExamples
      .filter((example) => example.userId === userId && example.sourceMessageId === sourceMessageId && example.status !== "invalidated")
      .forEach((example) => {
        example.status = "invalidated";
        changed += 1;
      });

    if (changed > 0) {
      await this.persist();
    }

    return changed;
  }

  async deleteCoachSession(userId: string, sessionId: string) {
    const session = this.state.coachSessions.find(
      (candidate) => candidate.userId === userId && candidate.id === sessionId && candidate.status !== "deleted",
    );
    if (!session) {
      return null;
    }

    const timestamp = now();
    session.status = "deleted";
    session.updatedAt = timestamp;

    const sessionMessageIds = this.state.coachMessages
      .filter((message) => message.userId === userId && message.sessionId === sessionId)
      .map((message) => message.id);

    this.state.coachMemoryItems
      .filter((item) => item.userId === userId && sessionMessageIds.includes(item.sourceMessageId))
      .forEach((item) => {
        item.status = "revoked";
        item.revokedAt = timestamp;
      });

    this.state.coachTrainingExamples
      .filter((example) => example.userId === userId && example.sourceSessionId === sessionId)
      .forEach((example) => {
        example.status = "invalidated";
      });

    await this.persist();
    return session;
  }

  async createPlanChangeProposal(input: Omit<PlanChangeProposal, "id" | "createdAt" | "approvedAt">) {
    const proposal: PlanChangeProposal = {
      ...input,
      id: createId(),
      createdAt: now(),
      approvedAt: null,
    };
    this.state.planChangeProposals.push(proposal);
    await this.persist();
    return proposal;
  }

  async approvePlanChangeProposal(proposalId: string) {
    const proposal = this.state.planChangeProposals.find((item) => item.id === proposalId);
    if (!proposal) {
      return null;
    }
    if (proposal.status !== "proposal") {
      return null;
    }
    proposal.status = "approved";
    proposal.approvedAt = now();
    await this.persist();
    return proposal;
  }

  async rejectPlanChangeProposal(proposalId: string) {
    const proposal = this.state.planChangeProposals.find((item) => item.id === proposalId);
    if (!proposal) {
      return null;
    }
    if (proposal.status !== "proposal") {
      return null;
    }
    proposal.status = "rejected";
    proposal.approvedAt = null;
    await this.persist();
    return proposal;
  }

  async appendPlanChangeCommandLog(input: Omit<PlanChangeCommandLog, "id" | "createdAt">) {
    const log: PlanChangeCommandLog = {
      ...input,
      id: createId(),
      createdAt: now(),
    };
    this.state.planChangeCommandLogs.push(log);
    await this.persist();
    return log;
  }

  async createMemoryCandidate(input: Omit<MemoryCandidate, "candidateId">) {
    const candidate: MemoryCandidate = {
      ...input,
      candidateId: createId(),
    };
    this.state.memoryCandidates.push(candidate);
    await this.persist();
    return candidate;
  }

  async createAgentMemoryProposal(input: {
    userId: string;
    sourceAgent: AgentMemoryProposal["sourceAgent"];
    targetScope: AgentMemoryProposal["targetScope"];
    kind: AgentMemoryProposal["kind"];
    summary: AgentMemoryProposal["summary"];
    rationale: AgentMemoryProposal["rationale"];
    sourceTurnRef?: AgentMemoryProposal["sourceTurnRef"];
    confidence?: AgentMemoryProposal["confidence"];
  }) {
    const createdAt = now();
    const sourceTurnRef = input.sourceTurnRef ?? createId();
    const candidate = await this.createMemoryCandidate({
      userId: input.userId,
      memoryId: null,
      status: "candidate",
      sourceAgent: input.sourceAgent,
      sourceTurnRef,
      summary: input.summary,
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });

    return agentMemoryProposalSchema.parse({
      proposalId: candidate.candidateId,
      userId: input.userId,
      sourceAgent: input.sourceAgent,
      targetScope: input.targetScope,
      kind: input.kind,
      summary: input.summary,
      rationale: input.rationale,
      sourceTurnRef,
      confidence: input.confidence ?? 0.5,
      status: "proposal",
      createdAt,
    });
  }

  async acceptMemoryCandidate(candidateId: string) {
    const candidate = this.state.memoryCandidates.find((item) => item.candidateId === candidateId);
    if (!candidate) {
      return null;
    }

    const memoryId = candidate.memoryId ?? createId();
    const timestamp = now();
    candidate.memoryId = memoryId;
    candidate.status = "accepted";
    candidate.effectiveAt = timestamp;
    candidate.recallBlockedAt = null;
    candidate.deletedAt = null;

    const existing = this.state.memoryItems.find((item) => item.memoryId === memoryId);
    if (existing) {
      Object.assign(existing, {
        userId: candidate.userId,
        sourceCandidateId: candidate.candidateId,
        sourceAgent: candidate.sourceAgent,
        sourceTurnRef: candidate.sourceTurnRef,
        summary: candidate.summary,
        status: "active",
        effectiveAt: timestamp,
        recallBlockedAt: null,
        deletedAt: null,
      });
    } else {
      const item: MemoryItem = {
        id: createId(),
        userId: candidate.userId,
        memoryId,
        sourceCandidateId: candidate.candidateId,
        sourceAgent: candidate.sourceAgent,
        sourceTurnRef: candidate.sourceTurnRef,
        summary: candidate.summary,
        status: "active",
        effectiveAt: timestamp,
        recallBlockedAt: null,
        deletedAt: null,
      };
      this.state.memoryItems.push(item);
    }

    await this.persist();
    return candidate;
  }

  async rejectMemoryCandidate(candidateId: string) {
    const candidate = this.state.memoryCandidates.find((item) => item.candidateId === candidateId);
    if (!candidate) {
      return null;
    }
    candidate.status = "rejected";
    candidate.effectiveAt = null;
    candidate.recallBlockedAt = null;
    candidate.deletedAt = null;
    await this.persist();
    return candidate;
  }

  async deleteMemory(memoryId: string) {
    const item = this.state.memoryItems.find((entry) => entry.memoryId === memoryId);
    if (!item) {
      return null;
    }
    const timestamp = now();
    item.status = "deleted";
    item.deletedAt = timestamp;
    item.recallBlockedAt = item.recallBlockedAt ?? null;

    this.state.memoryCandidates
      .filter((candidate) => candidate.memoryId === memoryId)
      .forEach((candidate) => {
        candidate.status = "deleted";
        candidate.deletedAt = timestamp;
        candidate.recallBlockedAt = candidate.recallBlockedAt ?? null;
      });

    await this.persist();
    return item;
  }

  async blockMemoryRecall(memoryId: string) {
    const item = this.state.memoryItems.find((entry) => entry.memoryId === memoryId);
    if (!item) {
      return null;
    }
    const timestamp = now();
    item.status = "recall_blocked";
    item.recallBlockedAt = timestamp;

    this.state.memoryCandidates
      .filter((candidate) => candidate.memoryId === memoryId)
      .forEach((candidate) => {
        candidate.status = "recall_blocked";
        candidate.recallBlockedAt = timestamp;
        candidate.deletedAt = null;
      });

    await this.persist();
    return item;
  }

  async addSignals(events: Array<Omit<StateSignalEvent, "id" | "receivedAt">>) {
    const fingerprints = new Set(this.state.stateSignals.map((event) => event.clientEventId ?? eventFingerprint(event)));
    let acceptedCount = 0;
    let deduplicatedCount = 0;
    const stored: StateSignalEvent[] = [];

    for (const event of events) {
      const fingerprint = event.clientEventId ?? eventFingerprint(event);
      if (fingerprints.has(fingerprint)) {
        deduplicatedCount += 1;
        continue;
      }

      const storedEvent: StateSignalEvent = {
        ...event,
        id: createId(),
        receivedAt: now(),
      };
      fingerprints.add(fingerprint);
      acceptedCount += 1;
      stored.push(storedEvent);
      this.state.stateSignals.push(storedEvent);
    }

    if (stored.length > 0) {
      await this.persist();
    }

    return { acceptedCount, deduplicatedCount, stored };
  }

  async addCheckin(input: CheckinInput) {
    return this.addSignals([
      {
        userId: input.userId,
        source: "web",
        eventType: "manual_checkin",
        occurredAt: now(),
        clientEventId: createId(),
        payload: {
          focusScore: input.focusScore,
          energyScore: input.energyScore,
          moodScore: input.moodScore,
          note: input.note || null,
        },
      },
    ]);
  }

  async addAssessment(assessment: StateAssessment) {
    this.state.stateAssessments.push(assessment);
    await this.persist();
    return assessment;
  }

  async addIntervention(intervention: Intervention) {
    this.state.interventions.push(intervention);
    await this.persist();
    return intervention;
  }

  async addRecoveryPlan(plan: RecoveryPlan) {
    this.state.recoveryPlans.push(plan);
    await this.persist();
    return plan;
  }

  async addReflectionReport(report: ReflectionReport) {
    const duplicate = this.state.reflectionReports.find(
      (candidate) =>
        candidate.userId === report.userId &&
        candidate.periodType === report.periodType &&
        candidate.periodStart === report.periodStart &&
        candidate.periodEnd === report.periodEnd,
    );

    if (duplicate) {
      Object.assign(duplicate, report);
    } else {
      this.state.reflectionReports.push(report);
    }
    await this.persist();
    return report;
  }

  async upsertMobileCaptureDevice(input: RegisterMobileDeviceInput) {
    const timestamp = now();
    const existing = this.state.mobileCaptureDevices.find((device) => device.deviceId === input.deviceId);
    if (existing) {
      existing.deviceName = input.deviceName;
      existing.platform = input.platform ?? "android";
      existing.appVersion = input.appVersion;
      existing.platformVersion = input.platformVersion;
      existing.desktopHost = input.desktopHost;
      existing.pairingState = "paired";
      existing.consentAcknowledgedAt = input.consentAcknowledgedAt;
      existing.lastSeenAt = timestamp;
      existing.updatedAt = timestamp;
      await this.persist();
      return existing;
    }

    const device: MobileCaptureDevice = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      platform: input.platform ?? "android",
      appVersion: input.appVersion,
      platformVersion: input.platformVersion,
      pairingState: "paired",
      desktopHost: input.desktopHost,
      consentAcknowledgedAt: input.consentAcknowledgedAt,
      lastSeenAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.mobileCaptureDevices.push(device);
    await this.persist();
    return device;
  }

  async startAudioCaptureSession(input: StartAudioCaptureSessionInput) {
    const session: AudioCaptureSession = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      deviceId: input.deviceId,
      captureMode: input.captureMode ?? "foreground_microphone_with_call_events",
      status: "active",
      sampleRateHz: input.sampleRateHz,
      channels: input.channels,
      encoding: input.encoding ?? "audio/pcm16le",
      chunkDurationMs: input.chunkDurationMs,
      rollingBufferSeconds: input.rollingBufferSeconds,
      receivedChunkCount: 0,
      startedAt: input.startedAt,
    };
    this.state.audioCaptureSessions.push(session);
    await this.persist();
    return session;
  }

  async incrementAudioCaptureSessionChunk(sessionId: string, lastChunkAt: string) {
    const session = this.state.audioCaptureSessions.find((candidate) => candidate.id === sessionId);
    if (!session) {
      return null;
    }
    session.receivedChunkCount += 1;
    session.lastChunkAt = lastChunkAt;
    session.status = "active";
    await this.persist();
    return session;
  }

  async endAudioCaptureSession(sessionId: string, status: AudioCaptureSession["status"], endedAt = now()) {
    const session = this.state.audioCaptureSessions.find((candidate) => candidate.id === sessionId);
    if (!session) {
      return null;
    }
    session.status = status;
    session.endedAt = endedAt;
    await this.persist();
    return session;
  }

  async addCallEvent(input: CreateCallEventInput) {
    const callEvent: CallEvent = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      deviceId: input.deviceId,
      direction: input.direction ?? "unknown",
      status: input.status ?? "unknown",
      occurredAt: input.occurredAt,
      createdAt: now(),
    };
    this.state.callEvents.push(callEvent);
    await this.addSignals([
      {
        userId: callEvent.userId,
        source: "mobile",
        eventType: callEvent.status === "ended" || callEvent.status === "missed" ? "call_ended" : "call_started",
        occurredAt: callEvent.occurredAt,
        clientEventId: callEvent.id,
        payload: {
          deviceId: callEvent.deviceId,
          direction: callEvent.direction,
          status: callEvent.status,
        },
      },
    ]);
    await this.persist();
    return callEvent;
  }

  async addEmotionAssessment(input: CreateEmotionAssessmentInput) {
    const assessment: EmotionAssessment = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      deviceId: input.deviceId,
      sessionId: input.sessionId,
      chunkSequence: input.chunkSequence,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      emotionLabel: input.emotionLabel,
      valenceScore: input.valenceScore,
      arousalScore: input.arousalScore,
      stressScore: input.stressScore,
      confidence: input.confidence,
      summary: input.summary,
      modelName: input.modelName,
      source: input.source,
      createdAt: now(),
    };
    this.state.emotionAssessments.push(assessment);
    await this.persist();
    return assessment;
  }

  async registerEdgeDevice(input: RegisterEdgeDeviceInput) {
    const timestamp = now();
    const existing = this.state.edgeDevices.find((device) => device.deviceId === input.deviceId);
    if (existing) {
      existing.label = input.label;
      existing.deviceType = input.deviceType;
      existing.platform = input.platform;
      existing.capabilities = input.capabilities ?? [];
      existing.status = "online";
      existing.appVersion = input.appVersion;
      existing.lastSeenAt = timestamp;
      existing.updatedAt = timestamp;
      await this.persist();
      return existing;
    }

    const device: EdgeDevice = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      deviceId: input.deviceId,
      label: input.label,
      deviceType: input.deviceType,
      platform: input.platform,
      capabilities: input.capabilities ?? [],
      status: "online",
      appVersion: input.appVersion,
      queueDepth: 0,
      lastSeenAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.edgeDevices.push(device);
    await this.persist();
    return device;
  }

  async recordDeviceHeartbeat(input: DeviceHeartbeatInput) {
    const device = this.state.edgeDevices.find((candidate) => candidate.deviceId === input.deviceId);
    if (!device) {
      return null;
    }
    device.status = input.status ?? "online";
    device.queueDepth = input.queueDepth ?? 0;
    device.lastUploadedAt = input.lastUploadedAt;
    if (input.capabilities) {
      device.capabilities = input.capabilities;
    }
    device.lastSeenAt = now();
    device.updatedAt = device.lastSeenAt;
    await this.persist();
    return device;
  }

  async createMediaUploadSession(input: CreateMediaUploadSessionInput) {
    const timestamp = now();
    const objectKey = `${input.userId ?? "demo-user"}/${input.deviceId}/${input.mediaType}/${createId()}`;
    const session: MediaUploadSession = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      deviceId: input.deviceId,
      mediaType: input.mediaType,
      contentType: input.contentType,
      storageBucket: "mindanchor-media",
      objectKey,
      uploadUrl: `stub://openclaw-storage/${objectKey}`,
      status: "pending",
      plannedPartCount: input.plannedPartCount ?? 1,
      captureStartedAt: input.captureStartedAt,
      captureEndedAt: input.captureEndedAt,
      ttlExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.mediaUploadSessions.push(session);
    await this.persist();
    return session;
  }

  async addMediaChunkManifest(sessionId: string, input: RegisterMediaChunkInput) {
    const manifest: MediaChunkManifest = {
      id: createId(),
      sessionId,
      sequence: input.sequence,
      checksum: input.checksum,
      sizeBytes: input.sizeBytes ?? 0,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      etag: input.etag,
      uploadedAt: now(),
    };
    this.state.mediaChunkManifests.push(manifest);
    const session = this.state.mediaUploadSessions.find((candidate) => candidate.id === sessionId);
    if (session) {
      session.status = "uploading";
      session.updatedAt = now();
    }
    await this.persist();
    return manifest;
  }

  async completeMediaUploadSession(sessionId: string, completedAt = now()) {
    const session = this.state.mediaUploadSessions.find((candidate) => candidate.id === sessionId);
    if (!session) {
      return null;
    }
    session.status = "uploaded";
    session.completedAt = completedAt;
    session.updatedAt = now();
    await this.persist();
    return session;
  }

  async updateMediaUploadSessionStatus(sessionId: string, status: MediaUploadSession["status"]) {
    const session = this.state.mediaUploadSessions.find((candidate) => candidate.id === sessionId);
    if (!session) {
      return null;
    }
    session.status = status;
    session.updatedAt = now();
    await this.persist();
    return session;
  }

  async addVideoAssessment(input: CreateVideoAssessmentInput) {
    const assessment: VideoAssessment = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      deviceId: input.deviceId,
      sessionId: input.sessionId,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      fatigueScore: input.fatigueScore,
      focusScore: input.focusScore,
      confidence: input.confidence,
      summary: input.summary,
      modelName: input.modelName,
      featureSummary: input.featureSummary,
      source: input.source,
      createdAt: now(),
    };
    this.state.videoAssessments.push(assessment);
    await this.persist();
    return assessment;
  }

  async addHealthSnapshot(input: CreateHealthSnapshotInput) {
    const snapshot: HealthSnapshot = {
      id: createId(),
      userId: input.userId ?? "demo-user",
      deviceId: input.deviceId,
      sourcePlatform: input.sourcePlatform,
      sourceProvider: input.sourceProvider,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      heartRate: input.heartRate,
      oxygenSaturation: input.oxygenSaturation,
      restingHeartRate: input.restingHeartRate,
      sleepMinutes: input.sleepMinutes,
      summary: input.summary,
      createdAt: now(),
    };
    this.state.healthSnapshots.push(snapshot);
    await this.persist();
    return snapshot;
  }

  async addBehaviorConclusion(input: Omit<BehaviorConclusion, "id" | "createdAt">) {
    const conclusion: BehaviorConclusion = {
      id: createId(),
      createdAt: now(),
      ...input,
    };
    this.state.behaviorConclusions.push(conclusion);
    await this.persist();
    return conclusion;
  }

  async addClientInboxMessage(input: Omit<ClientInboxMessage, "id" | "createdAt" | "status"> & Partial<Pick<ClientInboxMessage, "status">>) {
    const message: ClientInboxMessage = {
      id: createId(),
      createdAt: now(),
      status: input.status ?? "pending",
      userId: input.userId,
      title: input.title,
      message: input.message,
      channel: input.channel,
      acknowledgedAt: input.acknowledgedAt,
    };
    this.state.clientInboxMessages.push(message);
    await this.persist();
    return message;
  }

  async acknowledgeClientInboxMessage(messageId: string) {
    const message = this.state.clientInboxMessages.find((candidate) => candidate.id === messageId);
    if (!message) {
      return null;
    }
    message.status = "acknowledged";
    message.acknowledgedAt = now();
    await this.persist();
    return message;
  }

  async addAgentDebugRun(input: Omit<AgentDebugRun, "id" | "createdAt">) {
    const run: AgentDebugRun = {
      id: createId(),
      createdAt: now(),
      ...input,
    };
    this.state.agentDebugRuns.push(run);
    await this.persist();
    return run;
  }

  async addDebugRegressionMatrixRun(input: Omit<DebugRegressionMatrixRun, "id">) {
    const run: DebugRegressionMatrixRun = {
      id: createId(),
      ...input,
    };
    this.state.debugRegressionMatrixRuns.push(run);
    await this.persist();
    return run;
  }

  async addTraceLogEvent(input: Omit<TraceLogEvent, "id" | "createdAt">) {
    const event: TraceLogEvent = {
      id: createId(),
      createdAt: now(),
      ...input,
    };
    this.state.traceLogEvents.push(event);
    await this.persist();
    return event;
  }

  async clearAgentDebugRuns(userId?: string) {
    this.state.agentDebugRuns = userId ? this.state.agentDebugRuns.filter((run) => run.userId !== userId) : [];
    await this.persist();
    return { userId: userId ?? null };
  }

  async clearDebugRegressionMatrixRuns() {
    this.state.debugRegressionMatrixRuns = [];
    await this.persist();
    return { cleared: true };
  }
}
