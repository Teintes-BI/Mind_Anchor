import type {
  CoreEvent,
  CoreExport,
  CorePermission,
  ConversationMessage,
  LifeCompassCandidate,
  LifeCompassCandidateRecord,
  LifeCompassVersion,
  StateSnapshot,
} from "@mindanchor/domain";

export type CoreProfile = {
  profileId: string;
  userId: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCoreEventInput = {
  profileId: string;
  userId: string;
  clientEventId?: string;
  eventType: CoreEvent["eventType"];
  occurredAt: string;
  source: CoreEvent["source"];
  payload: Record<string, unknown>;
  privacyLevel: CoreEvent["privacyLevel"];
  retentionClass?: string;
  expiresAt?: string | null;
  confidence: number;
  purpose?: string;
  scope?: string;
};

export type CreateStateSnapshotInput = Omit<StateSnapshot, "id" | "revision"> & {
  profileId: string;
  userId: string;
  purpose?: string;
  scope?: string;
};

export type StateReportPayload = Omit<CreateStateSnapshotInput, "id" | "profileId" | "userId" | "revision" | "purpose" | "scope">;

export type CreateLifeCompassCandidateInput = {
  profileId: string;
  userId: string;
  content: string;
  evidenceEventIds?: string[];
  purpose?: string;
  scope?: string;
};

export type CreateSystemTraceInput = {
  profileId: string;
  userId: string;
  traceId?: string;
  event: string;
  payload?: Record<string, unknown>;
};

export type CoreConversation = {
  id: string;
  profileId: string;
  userId: string;
  title: string;
  status: "active" | "archived" | "deleted";
  createdAt: string;
  updatedAt: string;
};

export type CreateConversationInput = {
  profileId: string;
  userId: string;
  title?: string;
};

export type AppendConversationMessageInput = {
  profileId: string;
  userId: string;
  conversationId: string;
  role: "user";
  content: string;
  clientMessageId?: string;
};

export type CompleteConversationMessageInput = {
  content: string;
  modelTier: string;
  contextHash: string;
  redactions: string[];
};

export type FailConversationMessageInput = {
  status: "failed" | "blocked";
  failureCode: string;
  redactions: string[];
};

export type CoreRepository = {
  init(): Promise<void>;
  close(): void;
  ensureProfile(input: { profileId: string; userId: string; timezone: string }): Promise<CoreProfile>;
  appendEvent(input: CreateCoreEventInput): Promise<CoreEvent>;
  listEvents(profileId: string, userId: string, query?: { from?: string; to?: string; limit?: number }): Promise<CoreEvent[]>;
  getCurrentState(profileId: string, userId: string): Promise<StateSnapshot | null>;
  appendStateSnapshot(input: CreateStateSnapshotInput, expectedRevision?: number | null): Promise<StateSnapshot>;
  deriveStateFromEvent(event: CoreEvent, expectedRevision?: number | null): Promise<StateSnapshot | null>;
  getLifeCompass(profileId: string, userId: string): Promise<{ active: LifeCompassVersion | null; candidates: LifeCompassCandidateRecord[] }>;
  createLifeCompassCandidate(input: CreateLifeCompassCandidateInput): Promise<LifeCompassCandidate>;
  confirmLifeCompassCandidate(profileId: string, userId: string, candidateId: string, expectedVersion: number | null): Promise<LifeCompassVersion>;
  listPermissions(profileId: string, userId: string): Promise<CorePermission[]>;
  upsertPermission(input: CorePermission): Promise<CorePermission>;
  createConversation(input: CreateConversationInput): Promise<CoreConversation>;
  getConversation(profileId: string, userId: string, conversationId: string): Promise<CoreConversation>;
  listConversations(profileId: string, userId: string): Promise<CoreConversation[]>;
  appendConversationMessage(input: AppendConversationMessageInput): Promise<ConversationMessage>;
  completeConversationMessage(messageId: string, input: CompleteConversationMessageInput): Promise<ConversationMessage>;
  completeConversationMessage(profileId: string, userId: string, messageId: string, input: CompleteConversationMessageInput): Promise<ConversationMessage>;
  failConversationMessage(messageId: string, input: FailConversationMessageInput): Promise<ConversationMessage>;
  failConversationMessage(profileId: string, userId: string, messageId: string, input: FailConversationMessageInput): Promise<ConversationMessage>;
  listConversationMessages(profileId: string, userId: string, conversationId: string): Promise<ConversationMessage[]>;
  archiveConversation(profileId: string, userId: string, conversationId: string): Promise<CoreConversation>;
  addSystemTrace(input: CreateSystemTraceInput): Promise<void>;
  buildCloudProjection(event: CoreEvent): Record<string, unknown>;
  exportProfile(profileId: string, userId: string): Promise<CoreExport>;
  runRetention(at: string): Promise<{ deletedEvents: number }>;
  deleteProfile(profileId: string, userId: string): Promise<{ deletedRows: number }>;
};
