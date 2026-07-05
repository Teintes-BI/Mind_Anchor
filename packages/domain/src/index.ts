import { z } from "zod";
import { agentTeamAgentIds, agentTeamPersonaMetadata, memoryScopeValues } from "./agent-team.js";
export { agentTeamAgentIds, agentTeamPersonaMetadata, memoryScopeValues } from "./agent-team.js";
export type { AgentTeamPersonaEntry, AgentTeamPersonaName, AgentTeamPersonaRegistry } from "./agent-team.js";
export {
  buildOpenClawManagementAgentDescriptor,
  openClawManagementAgentDescriptorSchema,
  openClawManagementCapabilitiesSchema,
  openClawManagementProfileKeySchema,
} from "./openclaw-management.js";
export type {
  OpenClawManagementAgentDescriptor,
  OpenClawManagementCapabilities,
  OpenClawManagementProfileKey,
} from "./openclaw-management.js";

export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const identifierSchema = z.string().min(1);
export const traceIdentifierSchema = z.string().min(1);
export const userIdSchema = z.string().min(1).default("demo-user");

export const signalSourceSchema = z.enum(["desktop", "web", "api", "mobile"]);
export const goalStatusSchema = z.enum(["active", "paused", "completed", "archived"]);
export const taskStatusSchema = z.enum(["todo", "in_progress", "blocked", "done"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
export const sessionStatusSchema = z.enum(["active", "completed", "interrupted"]);
export const reportPeriodSchema = z.enum(["weekly", "monthly"]);
export const interventionStatusSchema = z.enum(["open", "dismissed", "completed"]);
export const signalEventTypeSchema = z.enum([
  "idle",
  "lock",
  "unlock",
  "active_app",
  "window_switch",
  "manual_checkin",
  "call_started",
  "call_ended",
  "audio_stream_disconnected",
  "audio_stream_replayed",
]);
export const agentModeSchema = z.enum(["stub", "openai-compatible"]);
export const mobilePairingStateSchema = z.enum(["pending", "paired", "revoked"]);
export const mobilePlatformSchema = z.enum(["android", "ios"]);
export const audioCaptureModeSchema = z.enum(["foreground_microphone", "foreground_microphone_with_call_events"]);
export const audioCaptureStatusSchema = z.enum(["active", "buffering", "completed", "failed"]);
export const audioEncodingSchema = z.enum(["audio/pcm16le", "audio/wav"]);
export const callDirectionSchema = z.enum(["incoming", "outgoing", "unknown"]);
export const callStatusSchema = z.enum(["ringing", "answered", "ended", "missed", "rejected", "unknown"]);
export const emotionLabelSchema = z.enum(["calm", "neutral", "positive", "tense", "stressed"]);
export const emotionAssessmentSourceSchema = z.enum([
  "desktop-stub",
  "desktop-local-model",
  "desktop-openai-compatible",
  "cluster-stub",
  "openclaw-cluster",
  "cluster-openai-compatible",
]);
export const edgeDeviceTypeSchema = z.enum(["desktop", "mobile", "web"]);
export const clientPlatformSchema = z.enum(["macos", "windows", "linux", "android", "ios", "web"]);
export const edgeDeviceCapabilitySchema = z.enum([
  "desktop_signals",
  "audio_capture",
  "video_capture",
  "health_bridge",
  "notifications",
]);
export const edgeDeviceStatusSchema = z.enum(["online", "offline"]);
export const mediaTypeSchema = z.enum(["audio", "video"]);
export const mediaUploadStatusSchema = z.enum(["pending", "uploading", "uploaded", "processing", "completed", "failed", "expired"]);
export const videoAssessmentSourceSchema = z.enum(["cluster-stub", "openclaw-cluster", "cluster-openai-compatible"]);
export const notificationEndpointSchema = z.enum(["mobile_push", "desktop_local", "feishu_bot", "telegram_bot"]);
export const clientInboxStatusSchema = z.enum(["pending", "acknowledged"]);
export const healthDataSourceSchema = z.enum(["health_connect", "healthkit", "vendor_cloud", "vendor_sdk"]);
export const riskLevelSchema = z.enum(["low", "medium", "high"]);
export const coachRoutingModeSchema = z.enum(["auto", "manual"]);
export const coachAgentActorTypeSchema = z.enum(["agent"]);
export const planChangeProposalStatusSchema = z.enum(["proposal", "approved", "rejected"]);
export const memoryCandidateStatusSchema = z.enum(["candidate", "accepted", "rejected", "deleted", "recall_blocked"]);
export const memoryItemStatusSchema = z.enum(["active", "deleted", "recall_blocked"]);
export const planChangeTargetKindSchema = z.enum(["task_order", "recovery_block", "plan_change"]);
export const agentDebugRunKindSchema = z.enum(["probe", "debug", "seed"]);
export const traceLogLevelSchema = z.enum(["info", "warn", "error"]);
export const openClawClusterTaskModeSchema = z.enum(["probe", "debug", "generate"]);
export const agentTeamAgentIdSchema = z.enum(agentTeamAgentIds);
export const memoryScopeSchema = z.enum(memoryScopeValues);
export const coachSessionStatusSchema = z.enum(["active", "archived", "deleted"]);
export const coachMessageRoleSchema = z.enum(["user", "assistant"]);
export const coachMessageStatusSchema = z.enum(["pending_fast", "pending_full", "completed", "failed"]);
export const coachFeedbackLabelSchema = z.enum(["helpful", "unhelpful"]);
export const coachMemoryKindSchema = z.enum(["preference", "habit", "work_style"]);
export const coachMemoryStatusSchema = z.enum(["active", "revoked", "suppressed"]);
export const coachTrainingExampleStatusSchema = z.enum(["candidate", "invalidated"]);

export const goalSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  title: z.string().min(1),
  description: z.string().default(""),
  status: goalStatusSchema.default("active"),
  targetDate: z.string().optional(),
  taskSummary: z
    .object({
      total: z.number().int().nonnegative(),
      completed: z.number().int().nonnegative(),
    })
    .default({ total: 0, completed: 0 }),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createGoalInputSchema = goalSchema.pick({
  userId: true,
  title: true,
  description: true,
  targetDate: true,
});

export const taskSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  goalId: identifierSchema,
  title: z.string().min(1),
  status: taskStatusSchema.default("todo"),
  priority: taskPrioritySchema.default("medium"),
  estimatedMinutes: z.number().int().positive().default(25),
  dueAt: z.string().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createTaskInputSchema = taskSchema.pick({
  userId: true,
  goalId: true,
  title: true,
  priority: true,
  estimatedMinutes: true,
  dueAt: true,
  sortOrder: true,
});

export const updateTaskInputSchema = z
  .object({
    title: z.string().min(1).optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    dueAt: z.string().nullable().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one task field must be provided.",
  });

export const focusSessionSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  taskId: identifierSchema.optional(),
  goalId: identifierSchema.optional(),
  status: sessionStatusSchema,
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema.optional(),
  interruptionCount: z.number().int().nonnegative().default(0),
  summary: z.string().default(""),
});

export const startSessionInputSchema = z.object({
  userId: userIdSchema,
  taskId: identifierSchema.optional(),
  goalId: identifierSchema.optional(),
});

export const endSessionInputSchema = z.object({
  sessionId: identifierSchema,
  interrupted: z.boolean().default(false),
  summary: z.string().default(""),
  completeTask: z.boolean().default(false),
});

const signalPayloadValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export const signalPayloadSchema = z.record(z.string(), signalPayloadValueSchema).default({});

export const stateSignalEventSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  source: signalSourceSchema.default("desktop"),
  eventType: signalEventTypeSchema,
  occurredAt: isoDateTimeSchema,
  receivedAt: isoDateTimeSchema,
  clientEventId: z.string().optional(),
  payload: signalPayloadSchema,
});

export const signalBatchItemSchema = z.object({
  userId: userIdSchema,
  source: signalSourceSchema.default("desktop"),
  eventType: signalEventTypeSchema,
  occurredAt: isoDateTimeSchema,
  clientEventId: z.string().optional(),
  payload: signalPayloadSchema,
});

export const signalBatchInputSchema = z.object({
  events: z.array(signalBatchItemSchema).min(1),
});

export const stateAssessmentSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  windowStart: isoDateTimeSchema,
  windowEnd: isoDateTimeSchema,
  focusScore: z.number().min(0).max(100),
  energyScore: z.number().min(0).max(100),
  moodScore: z.number().min(0).max(100),
  summary: z.string(),
  recommendedAction: z.string(),
  emotionSummary: z.string().optional(),
  emotionConfidence: z.number().min(0).max(1).optional(),
  fatigueScore: z.number().min(0).max(100).optional(),
  videoSummary: z.string().optional(),
  healthSummary: z.string().optional(),
  activeInputs: z.array(z.string()).default([]),
  mediaFreshness: z.string().optional(),
  source: z.enum(["stub-agent", "openai-compatible", "manual"]),
  createdAt: isoDateTimeSchema,
});

export const checkinInputSchema = z.object({
  userId: userIdSchema,
  focusScore: z.number().min(0).max(100),
  energyScore: z.number().min(0).max(100),
  moodScore: z.number().min(0).max(100).default(50),
  note: z.string().max(300).default(""),
});

export const interventionSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  assessmentId: identifierSchema.optional(),
  trigger: z.string(),
  action: z.string(),
  copy: z.string(),
  status: interventionStatusSchema.default("open"),
  createdAt: isoDateTimeSchema,
});

export const recoveryPlanSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  sessionId: identifierSchema.optional(),
  taskId: identifierSchema.optional(),
  reason: z.string(),
  nextStep: z.string(),
  suggestedMinutes: z.number().int().positive(),
  reprioritizedTaskIds: z.array(identifierSchema).default([]),
  createdAt: isoDateTimeSchema,
});

export const recoveryPlanInputSchema = z.object({
  userId: userIdSchema,
  sessionId: identifierSchema.optional(),
  taskId: identifierSchema.optional(),
  reason: z.string().default("manual_request"),
});

export const reflectionReportSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  periodType: reportPeriodSchema,
  periodStart: isoDateTimeSchema,
  periodEnd: isoDateTimeSchema,
  highlights: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  trends: z.array(z.string()).default([]),
  nextSuggestions: z.array(z.string()).default([]),
  createdAt: isoDateTimeSchema,
});

export const reflectionQuerySchema = z.object({
  userId: userIdSchema.optional(),
  periodType: reportPeriodSchema.optional(),
});

export const reflectionOverviewQuerySchema = z.object({
  userId: userIdSchema.optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const mobileCaptureDeviceSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  deviceId: z.string().min(1),
  deviceName: z.string().min(1),
  platform: mobilePlatformSchema.default("android"),
  appVersion: z.string().optional(),
  platformVersion: z.string().optional(),
  pairingState: mobilePairingStateSchema.default("paired"),
  desktopHost: z.string().min(1),
  consentAcknowledgedAt: isoDateTimeSchema.optional(),
  lastSeenAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const registerMobileDeviceInputSchema = mobileCaptureDeviceSchema.pick({
  userId: true,
  deviceId: true,
  deviceName: true,
  platform: true,
  appVersion: true,
  platformVersion: true,
  desktopHost: true,
  consentAcknowledgedAt: true,
});

export const audioCaptureSessionSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  deviceId: z.string().min(1),
  captureMode: audioCaptureModeSchema.default("foreground_microphone_with_call_events"),
  status: audioCaptureStatusSchema.default("active"),
  sampleRateHz: z.number().int().positive(),
  channels: z.number().int().positive(),
  encoding: audioEncodingSchema.default("audio/pcm16le"),
  chunkDurationMs: z.number().int().positive(),
  rollingBufferSeconds: z.number().int().positive(),
  receivedChunkCount: z.number().int().nonnegative().default(0),
  lastChunkAt: isoDateTimeSchema.optional(),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema.optional(),
});

export const startAudioCaptureSessionInputSchema = audioCaptureSessionSchema.pick({
  userId: true,
  deviceId: true,
  captureMode: true,
  sampleRateHz: true,
  channels: true,
  encoding: true,
  chunkDurationMs: true,
  rollingBufferSeconds: true,
  startedAt: true,
});

export const endAudioCaptureSessionInputSchema = z.object({
  sessionId: identifierSchema,
  status: audioCaptureStatusSchema.default("completed"),
  endedAt: isoDateTimeSchema.optional(),
});

export const audioChunkSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  deviceId: z.string().min(1),
  sessionId: identifierSchema,
  sequence: z.number().int().nonnegative(),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema,
  durationMs: z.number().int().positive(),
  encoding: audioEncodingSchema.default("audio/pcm16le"),
  checksum: z.string().min(1),
  localFilePath: z.string().min(1),
  rms: z.number().min(0).max(1).optional(),
  peak: z.number().min(0).max(1).optional(),
  replayed: z.boolean().default(false),
});

export const audioChunkUploadSchema = audioChunkSchema
  .omit({
    id: true,
    userId: true,
    localFilePath: true,
  })
  .extend({
    deviceId: z.string().min(1),
    pairToken: z.string().min(1),
    base64Audio: z.string().min(1),
  });

export const callEventSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  deviceId: z.string().min(1),
  direction: callDirectionSchema.default("unknown"),
  status: callStatusSchema.default("unknown"),
  occurredAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
});

export const createCallEventInputSchema = callEventSchema.omit({
  id: true,
  createdAt: true,
});

export const emotionAssessmentSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  deviceId: z.string().optional(),
  sessionId: identifierSchema.optional(),
  chunkSequence: z.number().int().nonnegative().optional(),
  windowStart: isoDateTimeSchema,
  windowEnd: isoDateTimeSchema,
  emotionLabel: emotionLabelSchema,
  valenceScore: z.number().min(0).max(100),
  arousalScore: z.number().min(0).max(100),
  stressScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  modelName: z.string().optional(),
  source: emotionAssessmentSourceSchema,
  createdAt: isoDateTimeSchema,
});

export const createEmotionAssessmentInputSchema = emotionAssessmentSchema.omit({
  id: true,
  createdAt: true,
});

export const edgeDeviceSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  deviceId: z.string().min(1),
  label: z.string().min(1),
  deviceType: edgeDeviceTypeSchema,
  platform: clientPlatformSchema,
  capabilities: z.array(edgeDeviceCapabilitySchema).default([]),
  status: edgeDeviceStatusSchema.default("online"),
  appVersion: z.string().optional(),
  queueDepth: z.number().int().nonnegative().default(0),
  lastUploadedAt: isoDateTimeSchema.optional(),
  lastSeenAt: isoDateTimeSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const registerEdgeDeviceInputSchema = edgeDeviceSchema.pick({
  userId: true,
  deviceId: true,
  label: true,
  deviceType: true,
  platform: true,
  capabilities: true,
  appVersion: true,
});

export const deviceHeartbeatInputSchema = z.object({
  userId: userIdSchema,
  deviceId: z.string().min(1),
  status: edgeDeviceStatusSchema.default("online"),
  queueDepth: z.number().int().nonnegative().default(0),
  lastUploadedAt: isoDateTimeSchema.optional(),
  capabilities: z.array(edgeDeviceCapabilitySchema).optional(),
});

export const mediaUploadSessionSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  deviceId: z.string().min(1),
  mediaType: mediaTypeSchema,
  contentType: z.string().min(1),
  storageBucket: z.string().min(1),
  objectKey: z.string().min(1),
  uploadUrl: z.string().min(1),
  status: mediaUploadStatusSchema.default("pending"),
  plannedPartCount: z.number().int().positive().default(1),
  captureStartedAt: isoDateTimeSchema.optional(),
  captureEndedAt: isoDateTimeSchema.optional(),
  ttlExpiresAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const createMediaUploadSessionInputSchema = z.object({
  userId: userIdSchema,
  deviceId: z.string().min(1),
  mediaType: mediaTypeSchema,
  contentType: z.string().min(1),
  plannedPartCount: z.number().int().positive().default(1),
  captureStartedAt: isoDateTimeSchema.optional(),
  captureEndedAt: isoDateTimeSchema.optional(),
});

export const mediaChunkManifestSchema = z.object({
  id: identifierSchema,
  sessionId: identifierSchema,
  sequence: z.number().int().nonnegative(),
  checksum: z.string().min(1),
  sizeBytes: z.number().int().nonnegative().default(0),
  startedAt: isoDateTimeSchema.optional(),
  endedAt: isoDateTimeSchema.optional(),
  etag: z.string().optional(),
  uploadedAt: isoDateTimeSchema,
});

export const registerMediaChunkInputSchema = mediaChunkManifestSchema.omit({
  id: true,
  uploadedAt: true,
});

export const completeMediaUploadSessionInputSchema = z.object({
  sessionId: identifierSchema,
  completedAt: isoDateTimeSchema.optional(),
});

export const videoAssessmentSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  deviceId: z.string().optional(),
  sessionId: identifierSchema.optional(),
  windowStart: isoDateTimeSchema,
  windowEnd: isoDateTimeSchema,
  fatigueScore: z.number().min(0).max(100),
  focusScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  modelName: z.string().optional(),
  featureSummary: z.string().optional(),
  source: videoAssessmentSourceSchema,
  createdAt: isoDateTimeSchema,
});

export const createVideoAssessmentInputSchema = videoAssessmentSchema.omit({
  id: true,
  createdAt: true,
});

export const healthSnapshotSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  deviceId: z.string().optional(),
  sourcePlatform: mobilePlatformSchema,
  sourceProvider: healthDataSourceSchema,
  windowStart: isoDateTimeSchema,
  windowEnd: isoDateTimeSchema,
  heartRate: z.number().positive().optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  restingHeartRate: z.number().positive().optional(),
  sleepMinutes: z.number().int().nonnegative().optional(),
  summary: z.string().optional(),
  createdAt: isoDateTimeSchema,
});

export const createHealthSnapshotInputSchema = healthSnapshotSchema.omit({
  id: true,
  createdAt: true,
});

export const behaviorConclusionSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  assessmentId: identifierSchema.optional(),
  sessionId: identifierSchema.optional(),
  taskId: identifierSchema.optional(),
  riskLevel: riskLevelSchema,
  summary: z.string(),
  suggestedAction: z.string(),
  trigger: z.string(),
  recommendedChannel: notificationEndpointSchema,
  createdAt: isoDateTimeSchema,
});

export const coachFrontAgentStateSchema = z.object({
  currentFrontAgent: agentTeamAgentIdSchema,
  routingMode: coachRoutingModeSchema,
  manualOverride: z.boolean(),
  consultedAgent: agentTeamAgentIdSchema.nullable(),
  handoffReason: z.string().nullable(),
  overrideSourceAgent: agentTeamAgentIdSchema.nullable(),
  visibleSummary: z.string().nullable(),
});

export const storedCoachFrontAgentStateSchema = coachFrontAgentStateSchema.extend({
  userId: userIdSchema,
  updatedAt: isoDateTimeSchema,
});

export const planChangeProposalSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  actorType: coachAgentActorTypeSchema,
  actorAgent: agentTeamAgentIdSchema,
  riskLevel: riskLevelSchema,
  status: planChangeProposalStatusSchema,
  summary: z.string().min(1),
  beforeStateSummary: z.string().min(1),
  afterStateSummary: z.string().min(1),
  rationale: z.string().min(1),
  createdAt: isoDateTimeSchema,
  approvedAt: isoDateTimeSchema.nullable(),
});

export const memoryCandidateSchema = z.object({
  candidateId: identifierSchema,
  userId: userIdSchema,
  memoryId: identifierSchema.nullable(),
  status: memoryCandidateStatusSchema,
  sourceAgent: agentTeamAgentIdSchema,
  sourceTurnRef: identifierSchema,
  summary: z.string().default(""),
  effectiveAt: isoDateTimeSchema.nullable(),
  recallBlockedAt: isoDateTimeSchema.nullable(),
  deletedAt: isoDateTimeSchema.nullable(),
});

export const memoryItemSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  memoryId: identifierSchema,
  sourceCandidateId: identifierSchema,
  sourceAgent: agentTeamAgentIdSchema,
  sourceTurnRef: identifierSchema,
  summary: z.string().default(""),
  status: memoryItemStatusSchema,
  effectiveAt: isoDateTimeSchema,
  recallBlockedAt: isoDateTimeSchema.nullable(),
  deletedAt: isoDateTimeSchema.nullable(),
});

export const planChangeCommandLogSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  actorType: coachAgentActorTypeSchema,
  actorAgent: agentTeamAgentIdSchema,
  riskLevel: riskLevelSchema,
  targetKind: planChangeTargetKindSchema,
  proposalId: identifierSchema.nullable(),
  approvedAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});

export const coachSessionSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  title: z.string().min(1),
  status: coachSessionStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  lastMessageAt: isoDateTimeSchema.nullable(),
});

export const coachMessageUsedMemoryEntrySchema = z.object({
  memoryId: identifierSchema.nullable(),
  summary: z.string().min(1),
  kind: z.string().min(1),
  source: z.string().min(1),
});

export const conversationPathSummarySchema = z.object({
  frontAgent: z.string().nullable(),
  consultedAgent: z.string().nullable(),
  authorityAgent: z.string().nullable(),
  authorityTarget: z.string().nullable(),
  authorityExecutionStatus: z.string().nullable(),
  runtimeSource: z.string().nullable().optional(),
  revokedMemoryCount: z.number().int().nonnegative().default(0),
  routeSummary: z.string().nullable().optional(),
  authoritySummary: z.string().nullable().optional(),
  routeStatusSummary: z.string().nullable().optional(),
  degradedSummary: z.string().nullable().optional(),
  routeMetrics: z
    .object({
      adapterDecisionCount: z.number().int().nonnegative(),
      agentCounts: z.record(z.string(), z.number().int().nonnegative()),
      workflowCounts: z.record(z.string(), z.number().int().nonnegative()),
      routeCounts: z.record(z.string(), z.number().int().nonnegative()),
      fallbackReasonCounts: z.record(z.string(), z.number().int().nonnegative()),
    })
    .nullable()
    .optional(),
  primaryRoute: z.string().nullable(),
  usedOpenClaw: z.boolean(),
  hadFallback: z.boolean(),
  degraded: z.boolean(),
  degradedReason: z.string().nullable(),
});

export const coachMessageSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  sessionId: identifierSchema,
  role: coachMessageRoleSchema,
  status: coachMessageStatusSchema,
  userText: z.string().nullable(),
  fastResponse: z.string().nullable(),
  fullResponse: z.string().nullable(),
  usedMemoryIds: z.array(identifierSchema).default([]),
  usedMemoryEntries: z.array(coachMessageUsedMemoryEntrySchema).default([]),
  conversationPath: conversationPathSummarySchema.nullable().optional().default(null),
  traceId: traceIdentifierSchema.nullable(),
  errorCode: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const coachFeedbackSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  sessionId: identifierSchema,
  messageId: identifierSchema,
  label: coachFeedbackLabelSchema,
  reason: z.string().nullable().default(null),
  createdAt: isoDateTimeSchema,
});

export const coachMemoryItemSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  kind: coachMemoryKindSchema,
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  status: coachMemoryStatusSchema,
  sourceMessageId: identifierSchema,
  sourceExcerpt: z.string().min(1),
  createdAt: isoDateTimeSchema,
  lastUsedAt: isoDateTimeSchema.nullable(),
  revokedAt: isoDateTimeSchema.nullable(),
});

export const coachTrainingExampleSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  sourceSessionId: identifierSchema,
  sourceMessageId: identifierSchema,
  contextSnapshotId: identifierSchema,
  status: coachTrainingExampleStatusSchema,
  createdAt: isoDateTimeSchema,
});

export const createCoachSessionInputSchema = z
  .object({
    title: z.string().min(1).max(160).optional(),
  })
  .strict();

export const createCoachMessageInputSchema = z
  .object({
    text: z.string().min(1).max(4000),
    contextTags: z.array(z.string().min(1).max(80)).max(10).optional(),
  })
  .strict();

export const coachMessageFeedbackInputSchema = z
  .object({
    label: coachFeedbackLabelSchema,
    reason: z.string().min(1).max(300).optional(),
  })
  .strict();

export const coachSessionDetailResponseSchema = z.object({
  session: coachSessionSchema,
  messages: z.array(coachMessageSchema),
  feedback: z.array(coachFeedbackSchema).default([]),
});

export const coachMessageSendResponseSchema = z.object({
  userMessage: coachMessageSchema,
  assistantMessage: coachMessageSchema,
  frontAgentState: coachFrontAgentStateSchema,
  fastResponse: z.string().nullable(),
  traceId: traceIdentifierSchema,
});

export const clientInboxMessageSchema = z.object({
  id: identifierSchema,
  userId: userIdSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  channel: notificationEndpointSchema,
  status: clientInboxStatusSchema.default("pending"),
  createdAt: isoDateTimeSchema,
  acknowledgedAt: isoDateTimeSchema.optional(),
});

export const agentMemoryEntrySchema = z.object({
  memoryId: identifierSchema,
  kind: z.string().min(1),
  summary: z.string().min(1),
  source: z.string().min(1),
  confidence: z.number().min(0).max(1),
  updatedAt: isoDateTimeSchema,
  recallAllowed: z.boolean(),
});

export const agentMemoryContextMetadataSchema = z.object({
  activeMemoryCount: z.number().int().nonnegative().default(0),
  proposalCount: z.number().int().nonnegative().default(0),
  retrievedAt: isoDateTimeSchema.optional(),
  scopeEntryCounts: z
    .object({
      preferences: z.number().int().nonnegative().default(0),
      habits: z.number().int().nonnegative().default(0),
      constraints: z.number().int().nonnegative().default(0),
      recentContext: z.number().int().nonnegative().default(0),
    })
    .optional(),
  sourceCounts: z.record(z.string(), z.number().int().nonnegative()).optional(),
});

export const agentMemoryContextBundleSchema = z.object({
  userId: userIdSchema,
  agentId: agentTeamAgentIdSchema,
  scopes: z.array(memoryScopeSchema).min(1),
  identity: z.array(agentMemoryEntrySchema).default([]),
  preferences: z.array(agentMemoryEntrySchema).default([]),
  habits: z.array(agentMemoryEntrySchema).default([]),
  constraints: z.array(agentMemoryEntrySchema).default([]),
  recentContext: z.array(agentMemoryEntrySchema).default([]),
  metadata: agentMemoryContextMetadataSchema.default({
    activeMemoryCount: 0,
    proposalCount: 0,
  }),
});

export const agentMemoryProposalSchema = z.object({
  proposalId: identifierSchema.optional(),
  userId: userIdSchema,
  sourceAgent: agentTeamAgentIdSchema,
  targetScope: memoryScopeSchema,
  kind: z.string().min(1),
  summary: z.string().min(1),
  rationale: z.string().min(1),
  sourceTurnRef: identifierSchema.optional(),
  confidence: z.number().min(0).max(1).default(0.5),
  status: z.enum(["proposal", "accepted", "rejected"]).default("proposal"),
  createdAt: isoDateTimeSchema,
});

export const agentRuntimeDescriptorSchema = z.object({
  agentId: agentTeamAgentIdSchema,
  runtimeAgentId: identifierSchema,
  displayName: z.string().min(1),
  soulFilePath: z.string().min(1),
  memoryScopes: z.array(memoryScopeSchema).min(1),
  canFront: z.boolean(),
  canConsult: z.boolean(),
  canWritePlans: z.boolean(),
  canGovernMemory: z.boolean(),
});

export const gatewayTraceContextSchema = z.object({
  traceId: traceIdentifierSchema,
  parentTraceId: traceIdentifierSchema.optional(),
  requestTraceId: traceIdentifierSchema.optional(),
  source: z.literal("mindanchor-gateway").default("mindanchor-gateway"),
  operation: z.string().min(1),
  agentName: z.string().optional(),
  workflow: z.string().optional(),
  scenarioId: z.string().optional(),
  userId: userIdSchema.optional(),
});

export const openClawTaskEnvelopeSchema = z.object({
  taskId: identifierSchema,
  target: z.string().min(1),
  createdAt: isoDateTimeSchema,
  trace: gatewayTraceContextSchema,
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const openClawClusterTaskRequestSchema = openClawTaskEnvelopeSchema.extend({
  mode: openClawClusterTaskModeSchema,
});

export const openClawClusterTaskResponseSchema = z.object({
  success: z.boolean(),
  taskId: identifierSchema.optional(),
  trace: gatewayTraceContextSchema.partial().optional(),
  outputText: z.string().optional(),
  parsed: z.unknown().optional(),
  error: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const traceLogEventSchema = z.object({
  id: identifierSchema,
  traceId: traceIdentifierSchema,
  parentTraceId: traceIdentifierSchema.optional(),
  level: traceLogLevelSchema,
  component: z.string().min(1),
  event: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: isoDateTimeSchema,
});

export const openClawAdapterRouteSchema = z.enum(["cluster", "provider-direct", "provider-fallback", "failed"]);

export const openClawAdapterStrategySchema = z.enum(["cluster-preferred", "provider-direct"]);

export const openClawAdapterFailureCategorySchema = z.enum([
  "cluster_contract_failure",
  "cluster_http_error",
  "cluster_timeout",
  "cluster_transport_error",
  "provider_http_error",
  "provider_timeout",
  "provider_invalid_response",
  "missing_provider_config",
]);

export const openClawAdapterClusterAttemptSchema = z.object({
  endpoint: z.string().min(1),
  status: z.number().int().nonnegative().optional(),
  ok: z.boolean(),
  preview: z.string().optional(),
  error: z.string().optional(),
});

export const openClawAdapterDecisionSchema = z.object({
  traceId: traceIdentifierSchema.optional(),
  parentTraceId: traceIdentifierSchema.optional(),
  createdAt: isoDateTimeSchema.optional(),
  target: z.string().min(1),
  mode: openClawClusterTaskModeSchema,
  strategy: openClawAdapterStrategySchema,
  route: openClawAdapterRouteSchema,
  success: z.boolean(),
  selectedEndpoint: z.string().nullable().default(null),
  fallbackReason: z.string().nullable().default(null),
  failureCategory: openClawAdapterFailureCategorySchema.nullable().default(null),
  clusterAttempts: z.array(openClawAdapterClusterAttemptSchema).default([]),
});

export const agentDebugRunSchema = z.object({
  id: identifierSchema,
  traceId: traceIdentifierSchema,
  parentTraceId: traceIdentifierSchema.optional(),
  userId: userIdSchema,
  kind: agentDebugRunKindSchema,
  agentName: z.string().min(1),
  workflow: z.string().optional(),
  scenarioId: z.string().optional(),
  success: z.boolean(),
  fallbackLikely: z.boolean(),
  model: z.string().optional(),
  wireApi: z.string().optional(),
  adapter: openClawAdapterDecisionSchema.optional(),
  summary: z.string().min(1),
  payload: z.unknown().optional(),
  createdAt: isoDateTimeSchema,
});

export const debugRegressionStepSchema = z.object({
  label: z.string().min(1),
  traceId: traceIdentifierSchema.optional(),
  parentTraceId: traceIdentifierSchema.optional(),
  userId: userIdSchema,
  kind: agentDebugRunKindSchema,
  agentName: z.string().min(1),
  workflow: z.string().optional(),
  scenarioId: z.string().optional(),
  success: z.boolean(),
  fallbackLikely: z.boolean(),
  summary: z.string().min(1),
  durationMs: z.number().int().nonnegative(),
});

export const debugRegressionScenarioResultSchema = z.object({
  traceId: traceIdentifierSchema.optional(),
  parentTraceId: traceIdentifierSchema.optional(),
  scenarioId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  userId: userIdSchema,
  goalId: identifierSchema.optional(),
  taskId: identifierSchema.optional(),
  sessionId: identifierSchema.optional(),
  periodType: reportPeriodSchema.optional(),
  notes: z.array(z.string()).default([]),
  recommendedWorkflows: z.array(z.string()).default([]),
  counts: z.object({
    goals: z.number().int().nonnegative(),
    tasks: z.number().int().nonnegative(),
    sessions: z.number().int().nonnegative(),
    assessments: z.number().int().nonnegative(),
    recoveryPlans: z.number().int().nonnegative(),
    reflections: z.number().int().nonnegative(),
    inbox: z.number().int().nonnegative(),
  }),
  steps: z.array(debugRegressionStepSchema),
  totalSteps: z.number().int().nonnegative(),
  successfulSteps: z.number().int().nonnegative(),
  fallbackSteps: z.number().int().nonnegative(),
});

export const debugRegressionSuiteResultSchema = z.object({
  suiteName: z.string().min(1),
  traceId: traceIdentifierSchema,
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema,
  probeUserId: userIdSchema,
  probeSteps: z.array(debugRegressionStepSchema),
  scenarioResults: z.array(debugRegressionScenarioResultSchema),
  totalSteps: z.number().int().nonnegative(),
  successfulSteps: z.number().int().nonnegative(),
  fallbackSteps: z.number().int().nonnegative(),
});

export const debugRegressionMatrixCaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  scenarioId: z.string().min(1),
  workflow: z.string().min(1),
  focusAgent: z.string().min(1),
  overrideSummary: z.string().min(1),
});

export const debugRegressionMatrixRunInputSchema = z.object({
  caseIds: z.array(z.string().min(1)).max(20).optional(),
});

export const safeAgentModelConfigSchema = z.object({
  target: z.string().min(1),
  envPrefix: z.string().min(1),
  baseUrl: z.string().nullable(),
  model: z.string().nullable(),
  wireApi: z.enum(["responses", "chat-completions"]),
  reasoningEffort: z.enum(["minimal", "low", "medium", "high", "xhigh"]).nullable(),
  disableResponseStorage: z.boolean(),
  hasApiKey: z.boolean(),
  differsFromDefault: z.object({
    baseUrl: z.boolean(),
    apiKey: z.boolean(),
    model: z.boolean(),
    wireApi: z.boolean(),
    reasoningEffort: z.boolean(),
    disableResponseStorage: z.boolean(),
  }),
});

export const debugAgentConfigsResponseSchema = z.object({
  mode: agentModeSchema,
  defaultModelConfig: safeAgentModelConfigSchema,
  agents: z.array(safeAgentModelConfigSchema),
});

export const openClawAdapterStatusResponseSchema = z.object({
  gatewayMode: agentModeSchema,
  clusterEnabled: z.boolean(),
  executionStrategy: openClawAdapterStrategySchema,
  openClawBaseUrl: z.string().nullable(),
  clusterEndpoints: z.array(z.string().min(1)),
  lastDecision: openClawAdapterDecisionSchema.nullable(),
  lastFallback: openClawAdapterDecisionSchema.nullable(),
  failureCategoryCounts: z.record(z.string(), z.number().int().nonnegative()).default({}),
  recentTimeline: z.array(openClawAdapterDecisionSchema),
});

export const openClawNativeAgentSchema = z.object({
  agentId: z.string().min(1),
  displayName: z.string().min(1),
  runtimeAgentId: z.string().min(1),
  worker: z.string().min(1),
  modelTarget: z.string().min(1),
  soulFilePath: z.string().min(1),
  supportedWorkflows: z.array(z.string().min(1)),
  memoryScopes: z.array(z.string().min(1)),
  canFront: z.boolean(),
  canConsult: z.boolean(),
  canWritePlans: z.boolean(),
  canGovernMemory: z.boolean(),
  visibleInLocalRuntime: z.boolean(),
});

export const openClawNativeAgentsResponseSchema = z.object({
  source: z.literal("gateway-native-openclaw-registry"),
  explanation: z.string().min(1),
  totalAgents: z.number().int().nonnegative(),
  agents: z.array(openClawNativeAgentSchema),
});

export const openClawExternalRuntimeAgentSchema = z.object({
  name: z.string().min(1),
  worker: z.string().min(1),
  modelTarget: z.string().min(1),
  skillCount: z.number().int().nonnegative(),
  supportedWorkflows: z.array(z.string().min(1)),
  memoryScopes: z.array(z.string().min(1)).optional().default([]),
  canFront: z.boolean().optional().default(false),
  canConsult: z.boolean().optional().default(false),
  canWritePlans: z.boolean().optional().default(false),
  canGovernMemory: z.boolean().optional().default(false),
});

export const openClawWorkflowContractSchema = z.object({
  workflow: z.string().min(1),
  requiredContextFields: z.array(z.string().min(1)),
});

export const openClawWorkflowResponseContractSchema = z.object({
  workflow: z.string().min(1),
  requiredParsedFields: z.array(z.string().min(1)),
});

export const openClawWorkflowExecutionContractSchema = z.object({
  workflow: z.string().min(1),
  requiredMetadataFields: z.array(z.string().min(1)),
  memoryFetchFields: z.array(z.string().min(1)).optional().default([]),
  authorityApplyFields: z.array(z.string().min(1)).optional().default([]),
});

export const openClawManagementIntegrationStatusSchema = z.object({
  configured: z.boolean(),
  targetProfileKey: z.string().nullable(),
  aligned: z.boolean(),
  expectedAgentCount: z.number().int().nonnegative(),
  actualAgentCount: z.number().int().nonnegative(),
  missingAgents: z.array(z.string().min(1)),
  extraAgents: z.array(z.string().min(1)),
  fieldMismatches: z.array(
    z.object({
      agentId: z.string().min(1),
      field: z.string().min(1),
      expected: z.unknown(),
      actual: z.unknown(),
    }),
  ),
});

export const openClawRegistryVisibilityResponseSchema = z.object({
  source: z.literal("gateway-openclaw-registry-visibility"),
  explanation: z.string().min(1),
  nativeRegistry: openClawNativeAgentsResponseSchema,
  externalRuntime: z.object({
    healthStatus: z.enum(["not_configured", "unreachable", "aligned", "attention"]),
    healthReasonCodes: z.array(z.string().min(1)),
    healthIssueCounts: z.object({
      missingPersonaCount: z.number().int().nonnegative(),
      contractMismatchCount: z.number().int().nonnegative(),
      runtimeContractMismatchCount: z.number().int().nonnegative(),
      workflowContractMismatchCount: z.number().int().nonnegative(),
      workflowResponseContractMismatchCount: z.number().int().nonnegative(),
      workflowExecutionContractMismatchCount: z.number().int().nonnegative(),
      workflowExecutionProbeMismatchCount: z.number().int().nonnegative(),
      unknownExternalAgentCount: z.number().int().nonnegative(),
      totalIssueCount: z.number().int().nonnegative(),
    }),
    configured: z.boolean(),
    reachable: z.boolean(),
    baseUrl: z.string().nullable(),
    runtime: z.string().nullable(),
    runtimeVersion: z.string().nullable(),
    responseMode: z.string().nullable(),
    executeEndpoints: z.array(z.string().min(1)),
    workflowContracts: z.array(openClawWorkflowContractSchema),
    workflowResponseContracts: z.array(openClawWorkflowResponseContractSchema),
    workflowExecutionContracts: z.array(openClawWorkflowExecutionContractSchema),
    agentCount: z.number().int().nonnegative(),
    agents: z.array(openClawExternalRuntimeAgentSchema),
    matchedAgentIds: z.array(z.string().min(1)),
    missingInExternal: z.array(z.string().min(1)),
    contractMismatches: z.array(
      z.object({
        agentId: z.string().min(1),
        mismatchFields: z.array(z.string().min(1)),
      }),
    ),
    runtimeContractMismatches: z.array(z.string().min(1)),
    workflowContractMismatches: z.array(
      z.object({
        workflow: z.string().min(1),
        missingRequiredContextFields: z.array(z.string().min(1)),
      }),
    ),
    workflowResponseContractMismatches: z.array(
      z.object({
        workflow: z.string().min(1),
        missingRequiredParsedFields: z.array(z.string().min(1)),
      }),
    ),
    workflowExecutionContractMismatches: z.array(
      z.object({
        workflow: z.string().min(1),
        missingRequiredMetadataFields: z.array(z.string().min(1)),
        missingMemoryFetchFields: z.array(z.string().min(1)),
        missingAuthorityApplyFields: z.array(z.string().min(1)),
      }),
    ),
    workflowExecutionProbeMismatches: z.array(
      z.object({
        workflow: z.string().min(1),
        target: z.string().min(1),
        statusCode: z.number().int().nullable(),
        missingRequiredMetadataFields: z.array(z.string().min(1)),
        missingMemoryFetchFields: z.array(z.string().min(1)),
        missingAuthorityApplyFields: z.array(z.string().min(1)),
        error: z.string().nullable(),
      }),
    ),
    unknownExternalAgents: z.array(z.string().min(1)),
    error: z.string().nullable(),
  }),
  managementIntegration: openClawManagementIntegrationStatusSchema.optional(),
});

export const debugRegressionMatrixCaseResultSchema = z.object({
  traceId: traceIdentifierSchema,
  parentTraceId: traceIdentifierSchema.optional(),
  caseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  scenarioId: z.string().min(1),
  workflow: z.string().min(1),
  focusAgent: z.string().min(1),
  overrideSummary: z.string().min(1),
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema,
  userId: userIdSchema,
  resolvedConfigs: z.array(safeAgentModelConfigSchema),
  steps: z.array(debugRegressionStepSchema),
  totalSteps: z.number().int().nonnegative(),
  successfulSteps: z.number().int().nonnegative(),
  fallbackSteps: z.number().int().nonnegative(),
});

export const debugRegressionMatrixResultSchema = z.object({
  matrixName: z.string().min(1),
  traceId: traceIdentifierSchema,
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema,
  requestedCaseIds: z.array(z.string().min(1)).default([]),
  caseResults: z.array(debugRegressionMatrixCaseResultSchema),
  totalSteps: z.number().int().nonnegative(),
  successfulSteps: z.number().int().nonnegative(),
  fallbackSteps: z.number().int().nonnegative(),
});

export const debugRegressionMatrixRunSchema = debugRegressionMatrixResultSchema.extend({
  id: identifierSchema,
});

export const mobileDeviceQuerySchema = z.object({
  userId: userIdSchema.optional(),
});

export const emotionQuerySchema = z.object({
  userId: userIdSchema.optional(),
});

export const healthQuerySchema = z.object({
  userId: userIdSchema.optional(),
});

export const stateTrendsQuerySchema = z.object({
  userId: userIdSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const clientInboxQuerySchema = z.object({
  userId: userIdSchema.optional(),
});

export const clientInboxOverviewQuerySchema = z.object({
  userId: userIdSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const goalFlowOverviewQuerySchema = z.object({
  userId: userIdSchema.optional(),
});

export const recoveryHistoryQuerySchema = z.object({
  userId: userIdSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const agentDebugRunsQuerySchema = z.object({
  userId: userIdSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  traceId: traceIdentifierSchema.optional(),
});

export const debugRegressionMatrixRunsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  traceId: traceIdentifierSchema.optional(),
});

export const mobileAudioStatusSchema = z.object({
  enabled: z.boolean(),
  latestDevice: mobileCaptureDeviceSchema.nullable(),
  latestSession: audioCaptureSessionSchema.nullable(),
  latestEmotionAssessment: emotionAssessmentSchema.nullable(),
  latestCallEvent: callEventSchema.nullable(),
});

export const dashboardSummarySchema = z.object({
  goalCount: z.number().int().nonnegative(),
  taskCount: z.number().int().nonnegative(),
  completedTaskCount: z.number().int().nonnegative().default(0),
  inProgressTaskCount: z.number().int().nonnegative().default(0),
  blockedTaskCount: z.number().int().nonnegative().default(0),
  completionRate: z.number().min(0).max(1).default(0),
  openInterventions: z.number().int().nonnegative(),
  suggestedFocusTaskId: identifierSchema.nullable().default(null),
  summaryHeadline: z.string().default(""),
  coachFrontAgent: coachFrontAgentStateSchema,
  activeSession: focusSessionSchema.nullable(),
  latestAssessment: stateAssessmentSchema.nullable(),
  latestRecoveryPlan: recoveryPlanSchema.nullable(),
  latestBehaviorConclusion: behaviorConclusionSchema.nullable(),
  latestVideoAssessment: videoAssessmentSchema.nullable(),
  latestHealthSnapshot: healthSnapshotSchema.nullable(),
  mobileAudio: mobileAudioStatusSchema,
  edgeDevices: z.array(edgeDeviceSchema).default([]),
  inbox: z.array(clientInboxMessageSchema).default([]),
  goals: z.array(goalSchema),
  tasks: z.array(taskSchema),
});

export const latestStateResponseSchema = z.object({
  latestAssessment: stateAssessmentSchema.nullable(),
  latestIntervention: interventionSchema.nullable(),
  latestEmotionAssessment: emotionAssessmentSchema.nullable(),
  latestVideoAssessment: videoAssessmentSchema.nullable(),
  latestHealthSnapshot: healthSnapshotSchema.nullable(),
  latestBehaviorConclusion: behaviorConclusionSchema.nullable(),
});

export const signalBatchResponseSchema = z.object({
  acceptedCount: z.number().int().nonnegative(),
  deduplicatedCount: z.number().int().nonnegative(),
  queued: z.boolean(),
  latestAssessment: stateAssessmentSchema.nullable(),
});

export const healthLatestResponseSchema = z.object({
  latest: healthSnapshotSchema.nullable(),
  recent: z.array(healthSnapshotSchema),
});

export const authProviderSchema = z.enum(["supabase-jwt", "dev-bypass", "gateway-local"]);

export const meResponseSchema = z.object({
  authenticated: z.boolean(),
  user: z
    .object({
      id: identifierSchema,
      email: z.string().email().optional(),
      provider: authProviderSchema,
    })
    .nullable(),
});

export const authRegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(80).optional(),
});

export const authLoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRefreshInputSchema = z.object({
  refreshToken: z.string().min(32),
});

export const authLogoutInputSchema = z.object({
  refreshToken: z.string().min(32),
});

export const authSessionResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().nullable().default(null),
  expiresAt: isoDateTimeSchema.nullable().default(null),
  user: z.object({
    id: identifierSchema,
    email: z.string().email(),
    displayName: z.string().nullable().default(null),
    provider: authProviderSchema,
  }),
});

export const authLogoutResponseSchema = z.object({
  revoked: z.boolean(),
});

export const stateTrendsResponseSchema = z.object({
  currentAssessment: stateAssessmentSchema.nullable(),
  latestIntervention: interventionSchema.nullable(),
  latestBehaviorConclusion: behaviorConclusionSchema.nullable(),
  metricCounts: z.object({
    assessments: z.number().int().nonnegative(),
    emotionAssessments: z.number().int().nonnegative(),
    videoAssessments: z.number().int().nonnegative(),
    healthSnapshots: z.number().int().nonnegative(),
    behaviorConclusions: z.number().int().nonnegative(),
    callEvents: z.number().int().nonnegative(),
  }),
  activeInputs: z.array(z.string()).default([]),
  assessments: z.array(stateAssessmentSchema),
  emotionAssessments: z.array(emotionAssessmentSchema).default([]),
  videoAssessments: z.array(videoAssessmentSchema).default([]),
  healthSnapshots: z.array(healthSnapshotSchema).default([]),
  behaviorConclusions: z.array(behaviorConclusionSchema).default([]),
  callEvents: z.array(callEventSchema).default([]),
});

export const reflectionOverviewResponseSchema = z.object({
  latestWeekly: reflectionReportSchema.nullable(),
  latestMonthly: reflectionReportSchema.nullable(),
  reports: z.array(reflectionReportSchema),
  metricCounts: z.object({
    reports: z.number().int().nonnegative(),
    weeklyReports: z.number().int().nonnegative(),
    monthlyReports: z.number().int().nonnegative(),
    goals: z.number().int().nonnegative(),
    tasks: z.number().int().nonnegative(),
    sessions: z.number().int().nonnegative(),
    assessments: z.number().int().nonnegative(),
    emotionAssessments: z.number().int().nonnegative(),
    videoAssessments: z.number().int().nonnegative(),
    healthSnapshots: z.number().int().nonnegative(),
    callEvents: z.number().int().nonnegative(),
  }),
});

export const clientInboxChannelCountSchema = z.object({
  channel: notificationEndpointSchema,
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  acknowledged: z.number().int().nonnegative(),
});

export const clientInboxResponseSchema = z.object({
  messages: z.array(clientInboxMessageSchema),
});

export const clientInboxOverviewResponseSchema = z.object({
  messages: z.array(clientInboxMessageSchema),
  pendingMessages: z.array(clientInboxMessageSchema),
  acknowledgedMessages: z.array(clientInboxMessageSchema),
  metricCounts: z.object({
    totalMessages: z.number().int().nonnegative(),
    pendingMessages: z.number().int().nonnegative(),
    acknowledgedMessages: z.number().int().nonnegative(),
    openInterventions: z.number().int().nonnegative(),
  }),
  channelCounts: z.array(clientInboxChannelCountSchema),
  latestBehaviorConclusion: behaviorConclusionSchema.nullable(),
  latestRecoveryPlan: recoveryPlanSchema.nullable(),
  activeSession: focusSessionSchema.nullable(),
});

export const goalFlowOverviewResponseSchema = z.object({
  goals: z.array(goalSchema),
  tasks: z.array(taskSchema),
  activeSession: focusSessionSchema.nullable(),
  latestRecoveryPlan: recoveryPlanSchema.nullable(),
  latestAssessment: stateAssessmentSchema.nullable(),
  latestBehaviorConclusion: behaviorConclusionSchema.nullable(),
  suggestedFocusTaskId: identifierSchema.nullable().default(null),
  summaryHeadline: z.string().default(""),
  metricCounts: z.object({
    goals: z.number().int().nonnegative(),
    totalTasks: z.number().int().nonnegative(),
    todoTasks: z.number().int().nonnegative(),
    inProgressTasks: z.number().int().nonnegative(),
    blockedTasks: z.number().int().nonnegative(),
    doneTasks: z.number().int().nonnegative(),
    completionRate: z.number().min(0).max(1),
  }),
});

export const clientBootstrapResponseSchema = z.object({
  me: meResponseSchema,
  dashboard: dashboardSummarySchema,
  inboxOverview: clientInboxOverviewResponseSchema,
  goalFlow: goalFlowOverviewResponseSchema,
  permissions: z.object({
    notificationChannelRecommended: notificationEndpointSchema,
    desktopSignalsExpected: z.boolean(),
    accessibilityRecommended: z.boolean(),
  }),
});

export const localAuthUserSchema = z.object({
  id: identifierSchema,
  email: z.string().email(),
  passwordHash: z.string().min(1),
  displayName: z.string().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const localAuthRefreshTokenSchema = z.object({
  id: identifierSchema,
  userId: identifierSchema,
  tokenHash: z.string().min(32),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
  revokedAt: isoDateTimeSchema.optional(),
  replacedByTokenId: identifierSchema.optional(),
});

export const localClusterManualBootstrapResponseSchema = z.object({
  userId: userIdSchema,
  sourceScenarioId: z.string().min(1),
  goalId: identifierSchema.optional(),
  taskId: identifierSchema.optional(),
  sessionId: identifierSchema.optional(),
  periodType: reportPeriodSchema.optional(),
  reflectionReportIds: z.array(identifierSchema).default([]),
  counts: z.object({
    goals: z.number().int().nonnegative(),
    tasks: z.number().int().nonnegative(),
    sessions: z.number().int().nonnegative(),
    assessments: z.number().int().nonnegative(),
    recoveryPlans: z.number().int().nonnegative(),
    reflections: z.number().int().nonnegative(),
    inbox: z.number().int().nonnegative(),
  }),
});

export const recoveryHistoryResponseSchema = z.object({
  activeSession: focusSessionSchema.nullable(),
  interruptedSessions: z.array(focusSessionSchema),
  interventions: z.array(interventionSchema),
  recoveryPlans: z.array(recoveryPlanSchema),
  pendingTasks: z.array(taskSchema),
  latestAssessment: stateAssessmentSchema.nullable(),
  latestBehaviorConclusion: behaviorConclusionSchema.nullable(),
  suggestedFocusTaskId: identifierSchema.nullable().default(null),
});

export const agentDebugRunsResponseSchema = z.object({
  runs: z.array(agentDebugRunSchema),
});

export const debugRegressionMatrixRunsResponseSchema = z.object({
  runs: z.array(debugRegressionMatrixRunSchema),
});

export const debugTraceLookupResponseSchema = z.object({
  traceId: traceIdentifierSchema,
  agentRuns: z.array(agentDebugRunSchema),
  matrixRuns: z.array(debugRegressionMatrixRunSchema),
  events: z.array(traceLogEventSchema),
  summary: z
    .object({
      conversationPath: z
        .object({
          ...conversationPathSummarySchema.shape,
          memoryUsage: z
            .object({
              recalledCount: z.number().int().nonnegative(),
              sourceCounts: z.record(z.string(), z.number().int().nonnegative()),
              scopeEntryCounts: z.object({
                preferences: z.number().int().nonnegative(),
                habits: z.number().int().nonnegative(),
                constraints: z.number().int().nonnegative(),
                recentContext: z.number().int().nonnegative(),
              }),
            })
            .nullable()
            .optional(),
          feedbackLearning: z
            .object({
              strengtheningRecalledCount: z.number().int().nonnegative(),
              staleFilteredCount: z.number().int().nonnegative(),
              missingSourceFilteredCount: z.number().int().nonnegative(),
              weakenedRejectedCandidateCount: z.number().int().nonnegative(),
            })
            .nullable()
            .optional(),
          adapterRoutes: z.array(
            z.object({
              agentName: z.string(),
              workflow: z.string().nullable(),
              route: z.string(),
              selectedEndpoint: z.string().nullable(),
              fallbackReason: z.string().nullable(),
            }),
          ),
        })
        .nullable(),
    })
    .optional(),
});

export const databaseSchema = z.object({
  goals: z.array(goalSchema).default([]),
  tasks: z.array(taskSchema).default([]),
  sessions: z.array(focusSessionSchema).default([]),
  stateSignals: z.array(stateSignalEventSchema).default([]),
  stateAssessments: z.array(stateAssessmentSchema).default([]),
  interventions: z.array(interventionSchema).default([]),
  recoveryPlans: z.array(recoveryPlanSchema).default([]),
  reflectionReports: z.array(reflectionReportSchema).default([]),
  mobileCaptureDevices: z.array(mobileCaptureDeviceSchema).default([]),
  audioCaptureSessions: z.array(audioCaptureSessionSchema).default([]),
  callEvents: z.array(callEventSchema).default([]),
  emotionAssessments: z.array(emotionAssessmentSchema).default([]),
  edgeDevices: z.array(edgeDeviceSchema).default([]),
  mediaUploadSessions: z.array(mediaUploadSessionSchema).default([]),
  mediaChunkManifests: z.array(mediaChunkManifestSchema).default([]),
  videoAssessments: z.array(videoAssessmentSchema).default([]),
  healthSnapshots: z.array(healthSnapshotSchema).default([]),
  behaviorConclusions: z.array(behaviorConclusionSchema).default([]),
  clientInboxMessages: z.array(clientInboxMessageSchema).default([]),
  coachFrontAgentStates: z.array(storedCoachFrontAgentStateSchema).default([]),
  planChangeProposals: z.array(planChangeProposalSchema).default([]),
  planChangeCommandLogs: z.array(planChangeCommandLogSchema).default([]),
  coachSessions: z.array(coachSessionSchema).default([]),
  coachMessages: z.array(coachMessageSchema).default([]),
  coachFeedback: z.array(coachFeedbackSchema).default([]),
  coachMemoryItems: z.array(coachMemoryItemSchema).default([]),
  coachTrainingExamples: z.array(coachTrainingExampleSchema).default([]),
  memoryCandidates: z.array(memoryCandidateSchema).default([]),
  memoryItems: z.array(memoryItemSchema).default([]),
  agentDebugRuns: z.array(agentDebugRunSchema).default([]),
  debugRegressionMatrixRuns: z.array(debugRegressionMatrixRunSchema).default([]),
  traceLogEvents: z.array(traceLogEventSchema).default([]),
  localAuthUsers: z.array(localAuthUserSchema).default([]),
  localAuthRefreshTokens: z.array(localAuthRefreshTokenSchema).default([]),
});

export const emptyDatabase = (): Database => ({
  goals: [],
  tasks: [],
  sessions: [],
  stateSignals: [],
  stateAssessments: [],
  interventions: [],
  recoveryPlans: [],
  reflectionReports: [],
  mobileCaptureDevices: [],
  audioCaptureSessions: [],
  callEvents: [],
  emotionAssessments: [],
  edgeDevices: [],
  mediaUploadSessions: [],
  mediaChunkManifests: [],
  videoAssessments: [],
  healthSnapshots: [],
  behaviorConclusions: [],
  clientInboxMessages: [],
  coachFrontAgentStates: [],
  planChangeProposals: [],
  planChangeCommandLogs: [],
  coachSessions: [],
  coachMessages: [],
  coachFeedback: [],
  coachMemoryItems: [],
  coachTrainingExamples: [],
  memoryCandidates: [],
  memoryItems: [],
  agentDebugRuns: [],
  debugRegressionMatrixRuns: [],
  traceLogEvents: [],
  localAuthUsers: [],
  localAuthRefreshTokens: [],
});

export const skillNameSchema = z.enum([
  "state-ingest-skill",
  "state-score-skill",
  "goalflow-plan-skill",
  "task-reprioritize-skill",
  "progress-summary-skill",
  "interruption-recovery-skill",
  "reflection-report-skill",
  "notification-skill",
]);

export const skillEnvelopeSchema = z.object({
  skill: skillNameSchema,
  version: z.literal("1.0.0"),
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()),
});

export const skillSchemas = {
  stateIngest: z.object({
    input: signalBatchInputSchema,
    output: signalBatchResponseSchema,
  }),
  stateScore: z.object({
    input: z.object({
      signals: z.array(stateSignalEventSchema),
      latestCheckin: checkinInputSchema.optional(),
      latestEmotionAssessment: emotionAssessmentSchema.nullable().optional(),
      latestVideoAssessment: videoAssessmentSchema.nullable().optional(),
      latestHealthSnapshot: healthSnapshotSchema.nullable().optional(),
    }),
    output: stateAssessmentSchema,
  }),
  goalflowPlan: z.object({
    input: z.object({
      goal: goalSchema,
      tasks: z.array(taskSchema),
    }),
    output: z.object({
      orderedTaskIds: z.array(identifierSchema),
      summary: z.string(),
      suggestedTasks: z
        .array(
          z.object({
            title: z.string().min(1),
            priority: taskPrioritySchema.default("medium"),
            estimatedMinutes: z.number().int().positive().default(25),
            dueAt: z.string().optional(),
          }),
        )
        .default([]),
    }),
  }),
  taskReprioritize: z.object({
    input: z.object({
      tasks: z.array(taskSchema),
      reason: z.string(),
    }),
    output: z.object({
      orderedTaskIds: z.array(identifierSchema),
      summary: z.string(),
    }),
  }),
  progressSummary: z.object({
    input: z.object({
      goals: z.array(goalSchema),
      tasks: z.array(taskSchema),
      sessions: z.array(focusSessionSchema),
      assessments: z.array(stateAssessmentSchema),
      emotionAssessments: z.array(emotionAssessmentSchema).default([]),
      videoAssessments: z.array(videoAssessmentSchema).default([]),
      healthSnapshots: z.array(healthSnapshotSchema).default([]),
      behaviorConclusions: z.array(behaviorConclusionSchema).default([]),
      mobileDevices: z.array(mobileCaptureDeviceSchema).default([]),
      edgeDevices: z.array(edgeDeviceSchema).default([]),
    }),
    output: dashboardSummarySchema,
  }),
  interruptionRecovery: z.object({
    input: z.object({
      session: focusSessionSchema,
      tasks: z.array(taskSchema),
      latestAssessment: stateAssessmentSchema.nullable(),
    }),
    output: recoveryPlanSchema,
  }),
  reflectionReport: z.object({
    input: z.object({
      goals: z.array(goalSchema),
      tasks: z.array(taskSchema),
      sessions: z.array(focusSessionSchema),
      assessments: z.array(stateAssessmentSchema),
      emotionAssessments: z.array(emotionAssessmentSchema).default([]),
      videoAssessments: z.array(videoAssessmentSchema).default([]),
      healthSnapshots: z.array(healthSnapshotSchema).default([]),
      callEvents: z.array(callEventSchema).default([]),
      periodType: reportPeriodSchema,
    }),
    output: reflectionReportSchema,
  }),
  notification: z.object({
    input: z.object({
      userId: userIdSchema,
      title: z.string(),
      message: z.string(),
      channel: notificationEndpointSchema,
    }),
    output: z.object({
      delivered: z.boolean(),
      channel: notificationEndpointSchema,
    }),
  }),
};

export type Goal = z.infer<typeof goalSchema>;
export type CreateGoalInput = z.infer<typeof createGoalInputSchema>;
export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
export type FocusSession = z.infer<typeof focusSessionSchema>;
export type StartSessionInput = z.infer<typeof startSessionInputSchema>;
export type EndSessionInput = z.infer<typeof endSessionInputSchema>;
export type StateSignalEvent = z.infer<typeof stateSignalEventSchema>;
export type SignalBatchInput = z.infer<typeof signalBatchInputSchema>;
export type StateAssessment = z.infer<typeof stateAssessmentSchema>;
export type CheckinInput = z.infer<typeof checkinInputSchema>;
export type Intervention = z.infer<typeof interventionSchema>;
export type RecoveryPlan = z.infer<typeof recoveryPlanSchema>;
export type RecoveryPlanInput = z.infer<typeof recoveryPlanInputSchema>;
export type ReflectionReport = z.infer<typeof reflectionReportSchema>;
export type MobileCaptureDevice = z.infer<typeof mobileCaptureDeviceSchema>;
export type RegisterMobileDeviceInput = z.infer<typeof registerMobileDeviceInputSchema>;
export type AudioCaptureSession = z.infer<typeof audioCaptureSessionSchema>;
export type StartAudioCaptureSessionInput = z.infer<typeof startAudioCaptureSessionInputSchema>;
export type EndAudioCaptureSessionInput = z.infer<typeof endAudioCaptureSessionInputSchema>;
export type AudioChunk = z.infer<typeof audioChunkSchema>;
export type AudioChunkUpload = z.infer<typeof audioChunkUploadSchema>;
export type CallEvent = z.infer<typeof callEventSchema>;
export type CreateCallEventInput = z.infer<typeof createCallEventInputSchema>;
export type EmotionAssessment = z.infer<typeof emotionAssessmentSchema>;
export type CreateEmotionAssessmentInput = z.infer<typeof createEmotionAssessmentInputSchema>;
export type EdgeDevice = z.infer<typeof edgeDeviceSchema>;
export type RegisterEdgeDeviceInput = z.infer<typeof registerEdgeDeviceInputSchema>;
export type DeviceHeartbeatInput = z.infer<typeof deviceHeartbeatInputSchema>;
export type MediaUploadSession = z.infer<typeof mediaUploadSessionSchema>;
export type CreateMediaUploadSessionInput = z.infer<typeof createMediaUploadSessionInputSchema>;
export type MediaChunkManifest = z.infer<typeof mediaChunkManifestSchema>;
export type RegisterMediaChunkInput = z.infer<typeof registerMediaChunkInputSchema>;
export type CompleteMediaUploadSessionInput = z.infer<typeof completeMediaUploadSessionInputSchema>;
export type VideoAssessment = z.infer<typeof videoAssessmentSchema>;
export type CreateVideoAssessmentInput = z.infer<typeof createVideoAssessmentInputSchema>;
export type HealthSnapshot = z.infer<typeof healthSnapshotSchema>;
export type CreateHealthSnapshotInput = z.infer<typeof createHealthSnapshotInputSchema>;
export type BehaviorConclusion = z.infer<typeof behaviorConclusionSchema>;
export type CoachFrontAgentState = z.infer<typeof coachFrontAgentStateSchema>;
export type StoredCoachFrontAgentState = z.infer<typeof storedCoachFrontAgentStateSchema>;
export type PlanChangeProposal = z.infer<typeof planChangeProposalSchema>;
export type CoachSession = z.infer<typeof coachSessionSchema>;
export type CoachMessageUsedMemoryEntry = z.infer<typeof coachMessageUsedMemoryEntrySchema>;
export type ConversationPathSummary = z.infer<typeof conversationPathSummarySchema>;
export type CoachMessage = z.infer<typeof coachMessageSchema>;
export type CoachFeedback = z.infer<typeof coachFeedbackSchema>;
export type CoachMemoryItem = z.infer<typeof coachMemoryItemSchema>;
export type CoachTrainingExample = z.infer<typeof coachTrainingExampleSchema>;
export type CreateCoachSessionInput = z.infer<typeof createCoachSessionInputSchema>;
export type CreateCoachMessageInput = z.infer<typeof createCoachMessageInputSchema>;
export type CoachMessageFeedbackInput = z.infer<typeof coachMessageFeedbackInputSchema>;
export type MemoryCandidate = z.infer<typeof memoryCandidateSchema>;
export type MemoryItem = z.infer<typeof memoryItemSchema>;
export type MemoryScope = z.infer<typeof memoryScopeSchema>;
export type AgentMemoryEntry = z.infer<typeof agentMemoryEntrySchema>;
export type AgentMemoryContextMetadata = z.infer<typeof agentMemoryContextMetadataSchema>;
export type AgentMemoryContextBundle = z.infer<typeof agentMemoryContextBundleSchema>;
export type AgentMemoryProposal = z.infer<typeof agentMemoryProposalSchema>;
export type AgentRuntimeDescriptor = z.infer<typeof agentRuntimeDescriptorSchema>;
export type PlanChangeCommandLog = z.infer<typeof planChangeCommandLogSchema>;
export type ClientInboxMessage = z.infer<typeof clientInboxMessageSchema>;
export type GatewayTraceContext = z.infer<typeof gatewayTraceContextSchema>;
export type OpenClawTaskEnvelope = z.infer<typeof openClawTaskEnvelopeSchema>;
export type OpenClawClusterTaskMode = z.infer<typeof openClawClusterTaskModeSchema>;
export type OpenClawClusterTaskRequest = z.infer<typeof openClawClusterTaskRequestSchema>;
export type OpenClawClusterTaskResponse = z.infer<typeof openClawClusterTaskResponseSchema>;
export type TraceLogEvent = z.infer<typeof traceLogEventSchema>;
export type OpenClawAdapterRoute = z.infer<typeof openClawAdapterRouteSchema>;
export type OpenClawAdapterStrategy = z.infer<typeof openClawAdapterStrategySchema>;
export type OpenClawAdapterFailureCategory = z.infer<typeof openClawAdapterFailureCategorySchema>;
export type OpenClawAdapterClusterAttempt = z.infer<typeof openClawAdapterClusterAttemptSchema>;
export type OpenClawAdapterDecision = z.infer<typeof openClawAdapterDecisionSchema>;
export type AgentDebugRun = z.infer<typeof agentDebugRunSchema>;
export type DebugRegressionStep = z.infer<typeof debugRegressionStepSchema>;
export type DebugRegressionScenarioResult = z.infer<typeof debugRegressionScenarioResultSchema>;
export type DebugRegressionSuiteResult = z.infer<typeof debugRegressionSuiteResultSchema>;
export type DebugRegressionMatrixCase = z.infer<typeof debugRegressionMatrixCaseSchema>;
export type DebugRegressionMatrixRunInput = z.infer<typeof debugRegressionMatrixRunInputSchema>;
export type SafeAgentModelConfig = z.infer<typeof safeAgentModelConfigSchema>;
export type DebugAgentConfigsResponse = z.infer<typeof debugAgentConfigsResponseSchema>;
export type OpenClawAdapterStatusResponse = z.infer<typeof openClawAdapterStatusResponseSchema>;
export type OpenClawNativeAgent = z.infer<typeof openClawNativeAgentSchema>;
export type OpenClawNativeAgentsResponse = z.infer<typeof openClawNativeAgentsResponseSchema>;
export type OpenClawExternalRuntimeAgent = z.infer<typeof openClawExternalRuntimeAgentSchema>;
export type OpenClawManagementIntegrationStatus = z.infer<typeof openClawManagementIntegrationStatusSchema>;
export type OpenClawRegistryVisibilityResponse = z.infer<typeof openClawRegistryVisibilityResponseSchema>;
export type DebugRegressionMatrixCaseResult = z.infer<typeof debugRegressionMatrixCaseResultSchema>;
export type DebugRegressionMatrixResult = z.infer<typeof debugRegressionMatrixResultSchema>;
export type DebugRegressionMatrixRun = z.infer<typeof debugRegressionMatrixRunSchema>;
export type NotificationEndpoint = z.infer<typeof notificationEndpointSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type LatestStateResponse = z.infer<typeof latestStateResponseSchema>;
export type SignalBatchResponse = z.infer<typeof signalBatchResponseSchema>;
export type HealthLatestResponse = z.infer<typeof healthLatestResponseSchema>;
export type AuthRegisterInput = z.infer<typeof authRegisterInputSchema>;
export type AuthLoginInput = z.infer<typeof authLoginInputSchema>;
export type AuthRefreshInput = z.infer<typeof authRefreshInputSchema>;
export type AuthLogoutInput = z.infer<typeof authLogoutInputSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
export type AuthLogoutResponse = z.infer<typeof authLogoutResponseSchema>;
export type AuthProvider = z.infer<typeof authProviderSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type StateTrendsResponse = z.infer<typeof stateTrendsResponseSchema>;
export type ReflectionOverviewResponse = z.infer<typeof reflectionOverviewResponseSchema>;
export type ClientInboxResponse = z.infer<typeof clientInboxResponseSchema>;
export type ClientInboxOverviewResponse = z.infer<typeof clientInboxOverviewResponseSchema>;
export type GoalFlowOverviewResponse = z.infer<typeof goalFlowOverviewResponseSchema>;
export type ClientBootstrapResponse = z.infer<typeof clientBootstrapResponseSchema>;
export type LocalClusterManualBootstrapResponse = z.infer<typeof localClusterManualBootstrapResponseSchema>;
export type RecoveryHistoryResponse = z.infer<typeof recoveryHistoryResponseSchema>;
export type AgentDebugRunsResponse = z.infer<typeof agentDebugRunsResponseSchema>;
export type DebugRegressionMatrixRunsResponse = z.infer<typeof debugRegressionMatrixRunsResponseSchema>;
export type DebugTraceLookupResponse = z.infer<typeof debugTraceLookupResponseSchema>;
export type Database = z.infer<typeof databaseSchema>;
export type LocalAuthUser = z.infer<typeof localAuthUserSchema>;
export type LocalAuthRefreshToken = z.infer<typeof localAuthRefreshTokenSchema>;
export type AgentMode = z.infer<typeof agentModeSchema>;
