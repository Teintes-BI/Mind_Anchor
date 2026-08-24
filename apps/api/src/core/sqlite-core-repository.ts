import Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  coreEventSchema,
  coreExportSchema,
  corePermissionSchema,
  lifeCompassCandidateRecordSchema,
  lifeCompassCandidateSchema,
  lifeCompassVersionSchema,
  stateSnapshotSchema,
  type CoreEvent,
  type CoreExport,
  type CorePermission,
  type LifeCompassCandidate,
  type LifeCompassVersion,
  type StateSnapshot,
} from "@mindanchor/domain";
import { CoreError } from "./core-errors.js";
import type {
  CoreProfile,
  CoreRepository,
  CreateCoreEventInput,
  CreateLifeCompassCandidateInput,
  CreateStateSnapshotInput,
  CreateSystemTraceInput,
  StateReportPayload,
} from "./core-types.js";
import { applyCoreMigrations } from "./sqlite-schema.js";

const json = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(json).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${json(item)}`).join(",")}}`;
};
const hash = (value: unknown) => createHash("sha256").update(json(value)).digest("hex");
const nowIso = () => new Date().toISOString();

export class SqliteCoreRepository implements CoreRepository {
  private constructor(
    private readonly db: Database.Database,
    private readonly clock: () => string = nowIso,
    private readonly idFactory: () => string = randomUUID,
  ) {}

  static fromFile(filePath: string, clock?: () => string, idFactory?: () => string) {
    mkdirSync(dirname(filePath), { recursive: true });
    return new SqliteCoreRepository(new Database(filePath), clock, idFactory);
  }

  static fromDatabase(db: Database.Database, clock?: () => string, idFactory?: () => string) {
    return new SqliteCoreRepository(db, clock, idFactory);
  }

  async init() {
    applyCoreMigrations(this.db);
  }

  close() {
    if (this.db.open) this.db.close();
  }

  private profile(profileId: string, userId: string) {
    const profile = this.db.prepare("SELECT profile_id, user_id, timezone, created_at, updated_at FROM core_profiles WHERE profile_id = ?").get(profileId) as Record<string, string> | undefined;
    if (!profile) throw new CoreError("core_not_found");
    if (profile.user_id !== userId) throw new CoreError("core_profile_scope_mismatch");
    return profile;
  }

  private requirePermission(profileId: string, userId: string, dataLevel: string, purpose = "core", scope = "write") {
    this.profile(profileId, userId);
    const permission = this.db.prepare("SELECT status, data_level, memory_boundary FROM core_permissions WHERE profile_id = ? AND purpose = ? AND scope = ?").get(profileId, purpose, scope) as { status?: string; data_level?: string; memory_boundary?: string } | undefined;
    if (!permission || permission.status !== "granted") throw new CoreError("core_permission_required");
    if (dataLevel === "P3" && permission.memory_boundary !== "local_only") throw new CoreError("core_p3_egress_blocked");
  }

  private toEvent(row: Record<string, unknown>): CoreEvent {
    return coreEventSchema.parse({
      id: row.id,
      profileId: row.profile_id,
      userId: row.user_id,
      clientEventId: row.client_event_id ?? undefined,
      eventType: row.event_type,
      occurredAt: row.occurred_at,
      createdAt: row.created_at,
      source: row.source,
      payload: JSON.parse(String(row.payload_json)),
      privacyLevel: row.privacy_level,
      retentionClass: row.retention_class,
      expiresAt: row.expires_at ?? null,
      confidence: row.confidence,
    });
  }

  private toState(row: Record<string, unknown>): StateSnapshot {
    return stateSnapshotSchema.parse({
      id: row.id,
      profileId: row.profile_id,
      userId: row.user_id,
      energy: row.energy,
      emotion: row.emotion,
      cognitiveLoad: row.cognitive_load,
      mentalNoise: row.mental_noise,
      focusReadiness: row.focus_readiness,
      physicalFatigue: row.physical_fatigue,
      recoveryNeed: row.recovery_need,
      source: JSON.parse(String(row.source_json)),
      confidence: row.confidence,
      userConfirmed: Boolean(row.user_confirmed),
      revision: row.revision,
      capturedAt: row.captured_at,
    });
  }

  async ensureProfile(input: { profileId: string; userId: string; timezone: string }): Promise<CoreProfile> {
    const timestamp = this.clock();
    const current = this.db.prepare("SELECT user_id FROM core_profiles WHERE profile_id = ?").get(input.profileId) as { user_id?: string } | undefined;
    if (current && current.user_id !== input.userId) throw new CoreError("core_profile_scope_mismatch");
    this.db.prepare("INSERT INTO core_profiles(profile_id, user_id, timezone, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(profile_id) DO UPDATE SET timezone = excluded.timezone, updated_at = excluded.updated_at").run(input.profileId, input.userId, input.timezone, timestamp, timestamp);
    this.db.prepare("INSERT INTO core_permissions(profile_id, user_id, purpose, scope, status, data_level, memory_boundary, updated_at) VALUES (?, ?, 'core', 'write', 'granted', 'P1', 'cloud_allowed', ?) ON CONFLICT(profile_id, purpose, scope) DO NOTHING").run(input.profileId, input.userId, timestamp);
    const row = this.db.prepare("SELECT profile_id, user_id, timezone, created_at, updated_at FROM core_profiles WHERE profile_id = ?").get(input.profileId) as Record<string, string>;
    return { profileId: row.profile_id, userId: row.user_id, timezone: row.timezone, createdAt: row.created_at, updatedAt: row.updated_at };
  }

  async appendEvent(input: CreateCoreEventInput): Promise<CoreEvent> {
    this.profile(input.profileId, input.userId);
    this.requirePermission(input.profileId, input.userId, input.privacyLevel, input.purpose, input.scope);
    const createdAt = this.clock();
    const payloadHash = hash({ eventType: input.eventType, occurredAt: input.occurredAt, source: input.source, payload: input.payload, privacyLevel: input.privacyLevel, retentionClass: input.retentionClass ?? "P1_standard", expiresAt: input.expiresAt ?? null, confidence: input.confidence });
    if (input.clientEventId) {
      const existing = this.db.prepare("SELECT * FROM core_events WHERE profile_id = ? AND client_event_id = ?").get(input.profileId, input.clientEventId) as Record<string, unknown> | undefined;
      if (existing) {
        if (existing.canonical_hash !== payloadHash) throw new CoreError("core_idempotency_conflict");
        return this.toEvent(existing);
      }
    }
    const eventId = this.idFactory();
    this.db.prepare("INSERT INTO core_events(id, profile_id, user_id, client_event_id, event_type, occurred_at, created_at, source, payload_json, payload_text, privacy_level, retention_class, expires_at, confidence, canonical_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(eventId, input.profileId, input.userId, input.clientEventId ?? null, input.eventType, input.occurredAt, createdAt, input.source, JSON.stringify(input.payload), JSON.stringify(input.payload), input.privacyLevel, input.retentionClass ?? "P1_standard", input.expiresAt ?? null, input.confidence, payloadHash);
    return this.toEvent(this.db.prepare("SELECT * FROM core_events WHERE id = ?").get(eventId) as Record<string, unknown>);
  }

  async listEvents(profileId: string, userId: string, query: { from?: string; to?: string; limit?: number } = {}) {
    const profile = this.db.prepare("SELECT user_id FROM core_profiles WHERE profile_id = ?").get(profileId) as { user_id?: string } | undefined;
    if (!profile || profile.user_id !== userId) return [];
    const limit = Math.min(Math.max(query.limit ?? 100, 1), 200);
    const rows = this.db.prepare("SELECT * FROM core_events WHERE profile_id = ? AND user_id = ? AND (? IS NULL OR occurred_at >= ?) AND (? IS NULL OR occurred_at <= ?) ORDER BY occurred_at DESC LIMIT ?").all(profileId, userId, query.from ?? null, query.from ?? null, query.to ?? null, query.to ?? null, limit) as Record<string, unknown>[];
    return rows.map((row) => this.toEvent(row));
  }

  async getCurrentState(profileId: string, userId: string) {
    this.profile(profileId, userId);
    const row = this.db.prepare("SELECT * FROM core_state_snapshots WHERE profile_id = ? AND user_id = ? ORDER BY revision DESC LIMIT 1").get(profileId, userId) as Record<string, unknown> | undefined;
    return row ? this.toState(row) : null;
  }

  async appendStateSnapshot(input: CreateStateSnapshotInput, expectedRevision: number | null = null) {
    this.requirePermission(input.profileId, input.userId, "P1", input.purpose, input.scope);
    const write = this.db.transaction(() => {
      const latest = this.db.prepare("SELECT revision FROM core_state_snapshots WHERE profile_id = ? ORDER BY revision DESC LIMIT 1").get(input.profileId) as { revision?: number } | undefined;
      const currentRevision = latest?.revision ?? 0;
      if ((expectedRevision ?? null) !== (currentRevision === 0 ? null : currentRevision)) throw new CoreError("core_revision_conflict");
      const revision = currentRevision + 1;
      const id = this.idFactory();
      this.db.prepare("INSERT INTO core_state_snapshots(id, profile_id, user_id, energy, emotion, cognitive_load, mental_noise, focus_readiness, physical_fatigue, recovery_need, source_json, confidence, user_confirmed, revision, captured_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, input.profileId, input.userId, input.energy, input.emotion, input.cognitiveLoad, input.mentalNoise, input.focusReadiness, input.physicalFatigue, input.recoveryNeed, JSON.stringify(input.source), input.confidence, input.userConfirmed ? 1 : 0, revision, input.capturedAt);
      return this.toState(this.db.prepare("SELECT * FROM core_state_snapshots WHERE id = ?").get(id) as Record<string, unknown>);
    });
    return write();
  }

  async deriveStateFromEvent(event: CoreEvent, expectedRevision: number | null = null) {
    if (event.eventType !== "state_report") return null;
    const payload = event.payload as StateReportPayload;
    return this.appendStateSnapshot({ ...payload, profileId: event.profileId, userId: event.userId, purpose: "core", scope: "write" }, expectedRevision);
  }

  async createLifeCompassCandidate(input: CreateLifeCompassCandidateInput) {
    this.requirePermission(input.profileId, input.userId, "P1", input.purpose, input.scope);
    const candidate = lifeCompassCandidateSchema.parse({ id: this.idFactory(), profileId: input.profileId, userId: input.userId, content: input.content, evidenceEventIds: input.evidenceEventIds ?? [], status: "pending", createdAt: this.clock() });
    this.db.prepare("INSERT INTO core_life_compass_candidates(id, profile_id, user_id, content, evidence_event_ids_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(candidate.id, candidate.profileId, candidate.userId, candidate.content, JSON.stringify(candidate.evidenceEventIds), candidate.status, candidate.createdAt);
    return candidate;
  }

  async getLifeCompass(profileId: string, userId: string) {
    this.profile(profileId, userId);
    const activeRow = this.db.prepare("SELECT * FROM core_life_compass_versions WHERE profile_id = ? ORDER BY version DESC LIMIT 1").get(profileId) as Record<string, unknown> | undefined;
    const candidateRows = this.db.prepare("SELECT * FROM core_life_compass_candidates WHERE profile_id = ? AND user_id = ? ORDER BY created_at DESC").all(profileId, userId) as Record<string, unknown>[];
    const candidates = candidateRows.map((row) => lifeCompassCandidateRecordSchema.parse({ id: row.id, profileId: row.profile_id, userId: row.user_id, content: row.content, evidenceEventIds: JSON.parse(String(row.evidence_event_ids_json)), status: row.status, createdAt: row.created_at }));
    const active = activeRow ? lifeCompassVersionSchema.parse({ id: activeRow.id, profileId: activeRow.profile_id, userId: activeRow.user_id, content: activeRow.content, version: activeRow.version, confirmedAt: activeRow.confirmed_at, supersedesId: activeRow.supersedes_id ?? null }) : null;
    return { active, candidates };
  }

  async confirmLifeCompassCandidate(profileId: string, userId: string, candidateId: string, expectedVersion: number | null) {
    this.profile(profileId, userId);
    this.requirePermission(profileId, userId, "P1", "core", "write");
    const confirm = this.db.transaction(() => {
      const candidate = this.db.prepare("SELECT * FROM core_life_compass_candidates WHERE id = ? AND profile_id = ? AND user_id = ?").get(candidateId, profileId, userId) as Record<string, unknown> | undefined;
      if (!candidate) throw new CoreError("core_not_found");
      if (candidate.status !== "pending") throw new CoreError("core_revision_conflict");
      const previous = this.db.prepare("SELECT * FROM core_life_compass_versions WHERE profile_id = ? ORDER BY version DESC LIMIT 1").get(profileId) as Record<string, unknown> | undefined;
      const currentVersion = previous?.version ? Number(previous.version) : null;
      if (currentVersion !== expectedVersion) throw new CoreError("core_revision_conflict");
      const version = (currentVersion ?? 0) + 1;
      const id = this.idFactory();
      const confirmedAt = this.clock();
      this.db.prepare("UPDATE core_life_compass_candidates SET status = 'confirmed' WHERE id = ?").run(candidateId);
      this.db.prepare("INSERT INTO core_life_compass_versions(id, profile_id, user_id, candidate_id, content, version, confirmed_at, supersedes_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, profileId, userId, candidateId, candidate.content, version, confirmedAt, previous?.id ?? null);
      this.db.prepare("INSERT INTO core_system_traces(id, profile_id, user_id, trace_id, event, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(this.idFactory(), profileId, userId, null, "life_compass.confirmed", JSON.stringify({ candidateId, version, previousVersion: currentVersion }), confirmedAt);
      return lifeCompassVersionSchema.parse({ id, profileId, userId, content: candidate.content, version, confirmedAt, supersedesId: previous?.id ?? null });
    });
    return confirm();
  }

  async listPermissions(profileId: string, userId: string) {
    this.profile(profileId, userId);
    const rows = this.db.prepare("SELECT profile_id, purpose, scope, status, data_level, updated_at FROM core_permissions WHERE profile_id = ? AND user_id = ? ORDER BY purpose, scope").all(profileId, userId) as Record<string, unknown>[];
    return rows.map((row) => corePermissionSchema.parse({ profileId: row.profile_id, purpose: row.purpose, scope: row.scope, status: row.status, dataLevel: row.data_level, updatedAt: row.updated_at }));
  }

  async upsertPermission(input: CorePermission) {
    const profile = this.db.prepare("SELECT user_id FROM core_profiles WHERE profile_id = ?").get(input.profileId) as { user_id?: string } | undefined;
    if (!profile) throw new CoreError("core_not_found");
    this.db.prepare("INSERT INTO core_permissions(profile_id, user_id, purpose, scope, status, data_level, memory_boundary, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(profile_id, purpose, scope) DO UPDATE SET status = excluded.status, data_level = excluded.data_level, memory_boundary = excluded.memory_boundary, updated_at = excluded.updated_at").run(input.profileId, profile.user_id, input.purpose, input.scope, input.status, input.dataLevel, input.dataLevel === "P3" ? "local_only" : "cloud_allowed", input.updatedAt);
    return input;
  }

  async addSystemTrace(input: CreateSystemTraceInput) {
    this.profile(input.profileId, input.userId);
    this.db.prepare("INSERT INTO core_system_traces(id, profile_id, user_id, trace_id, event, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(this.idFactory(), input.profileId, input.userId, input.traceId ?? null, input.event, JSON.stringify(input.payload ?? {}), this.clock());
  }

  buildCloudProjection(event: CoreEvent) {
    if (event.privacyLevel === "P3") throw new CoreError("core_p3_egress_blocked");
    return { eventType: event.eventType, occurredAt: event.occurredAt, source: event.source, confidence: event.confidence, summary: typeof event.payload.summary === "string" ? event.payload.summary : undefined };
  }

  async exportProfile(profileId: string, userId: string): Promise<CoreExport> {
    this.profile(profileId, userId);
    const profileRow = this.db.prepare("SELECT profile_id, user_id, timezone, created_at, updated_at FROM core_profiles WHERE profile_id = ?").get(profileId) as Record<string, unknown>;
    const events = await this.listEvents(profileId, userId, { limit: 200 });
    const stateRows = this.db.prepare("SELECT * FROM core_state_snapshots WHERE profile_id = ? AND user_id = ? ORDER BY revision").all(profileId, userId) as Record<string, unknown>[];
    const compass = await this.getLifeCompass(profileId, userId);
    const versionRows = this.db.prepare("SELECT * FROM core_life_compass_versions WHERE profile_id = ? ORDER BY version").all(profileId) as Record<string, unknown>[];
    const versions = versionRows.map((row) => lifeCompassVersionSchema.parse({ id: row.id, profileId: row.profile_id, userId: row.user_id, content: row.content, version: row.version, confirmedAt: row.confirmed_at, supersedesId: row.supersedes_id ?? null }));
    const permissions = await this.listPermissions(profileId, userId);
    const systemTraceCount = Number((this.db.prepare("SELECT COUNT(*) AS count FROM core_system_traces WHERE profile_id = ?").get(profileId) as { count: number }).count);
    return coreExportSchema.parse({ exportedAt: this.clock(), profile: { profileId: profileRow.profile_id, userId: profileRow.user_id, timezone: profileRow.timezone, createdAt: profileRow.created_at, updatedAt: profileRow.updated_at }, events, stateSnapshots: stateRows.map((row) => this.toState(row)), lifeCompassCandidates: compass.candidates, lifeCompassVersions: versions, permissions, systemTraceCount });
  }

  async runRetention(at: string) {
    const result = this.db.prepare("DELETE FROM core_events WHERE privacy_level = 'P0' AND expires_at IS NOT NULL AND expires_at <= ?").run(at);
    return { deletedEvents: result.changes };
  }

  async deleteProfile(profileId: string, userId: string) {
    this.profile(profileId, userId);
    const deleted = this.db.transaction(() => {
      const before = Number((this.db.prepare("SELECT COUNT(*) AS count FROM core_events WHERE profile_id = ?").get(profileId) as { count: number }).count);
      this.db.prepare("DELETE FROM core_profiles WHERE profile_id = ?").run(profileId);
      return before;
    });
    return { deletedRows: deleted() };
  }
}
