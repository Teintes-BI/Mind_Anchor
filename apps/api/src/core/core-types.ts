import type {
  CoreEvent,
  CoreExport,
  CorePermission,
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
  addSystemTrace(input: CreateSystemTraceInput): Promise<void>;
  buildCloudProjection(event: CoreEvent): Record<string, unknown>;
  exportProfile(profileId: string, userId: string): Promise<CoreExport>;
  runRetention(at: string): Promise<{ deletedEvents: number }>;
  deleteProfile(profileId: string, userId: string): Promise<{ deletedRows: number }>;
};
