import type Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { CoreError } from "./core-errors.js";

type Migration = { version: number; sql: string; checksum: string };

const migrationSql = [
  `CREATE TABLE IF NOT EXISTS core_schema_migrations (version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS core_profiles (profile_id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE, timezone TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS core_events (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES core_profiles(profile_id) ON DELETE CASCADE, user_id TEXT NOT NULL, client_event_id TEXT, event_type TEXT NOT NULL, occurred_at TEXT NOT NULL, created_at TEXT NOT NULL, source TEXT NOT NULL, payload_json TEXT NOT NULL, payload_text TEXT NOT NULL, privacy_level TEXT NOT NULL, retention_class TEXT NOT NULL, expires_at TEXT, confidence REAL NOT NULL, canonical_hash TEXT NOT NULL);
   CREATE UNIQUE INDEX IF NOT EXISTS core_events_profile_client_key ON core_events(profile_id, client_event_id) WHERE client_event_id IS NOT NULL;
   CREATE INDEX IF NOT EXISTS core_events_profile_occurred ON core_events(profile_id, occurred_at DESC);
   CREATE TABLE IF NOT EXISTS core_state_snapshots (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES core_profiles(profile_id) ON DELETE CASCADE, user_id TEXT NOT NULL, energy REAL NOT NULL, emotion REAL NOT NULL, cognitive_load REAL NOT NULL, mental_noise REAL NOT NULL, focus_readiness REAL NOT NULL, physical_fatigue REAL NOT NULL, recovery_need REAL NOT NULL, source_json TEXT NOT NULL, confidence REAL NOT NULL, user_confirmed INTEGER NOT NULL, revision INTEGER NOT NULL, captured_at TEXT NOT NULL, UNIQUE(profile_id, revision));
   CREATE TABLE IF NOT EXISTS core_life_compass_candidates (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES core_profiles(profile_id) ON DELETE CASCADE, user_id TEXT NOT NULL, content TEXT NOT NULL, evidence_event_ids_json TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS core_life_compass_versions (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES core_profiles(profile_id) ON DELETE CASCADE, user_id TEXT NOT NULL, candidate_id TEXT NOT NULL, content TEXT NOT NULL, version INTEGER NOT NULL, confirmed_at TEXT NOT NULL, supersedes_id TEXT, UNIQUE(profile_id, version));
   CREATE TABLE IF NOT EXISTS core_permissions (profile_id TEXT NOT NULL REFERENCES core_profiles(profile_id) ON DELETE CASCADE, user_id TEXT NOT NULL, purpose TEXT NOT NULL, scope TEXT NOT NULL, status TEXT NOT NULL, data_level TEXT NOT NULL, memory_boundary TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(profile_id, purpose, scope));
   CREATE TABLE IF NOT EXISTS core_system_traces (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES core_profiles(profile_id) ON DELETE CASCADE, user_id TEXT NOT NULL, trace_id TEXT, event TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL);`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS core_events_fts USING fts5(event_id UNINDEXED, event_type, payload_text);
   CREATE TRIGGER IF NOT EXISTS core_events_fts_ai AFTER INSERT ON core_events BEGIN INSERT INTO core_events_fts(rowid, event_id, event_type, payload_text) VALUES (new.rowid, new.id, new.event_type, new.payload_text); END;
   CREATE TRIGGER IF NOT EXISTS core_events_fts_ad AFTER DELETE ON core_events BEGIN DELETE FROM core_events_fts WHERE rowid = old.rowid; END;
   CREATE TRIGGER IF NOT EXISTS core_events_fts_au AFTER UPDATE ON core_events BEGIN DELETE FROM core_events_fts WHERE rowid = old.rowid; INSERT INTO core_events_fts(rowid, event_id, event_type, payload_text) VALUES (new.rowid, new.id, new.event_type, new.payload_text); END;`,
  `CREATE TABLE IF NOT EXISTS core_conversations (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES core_profiles(profile_id) ON DELETE CASCADE, user_id TEXT NOT NULL, status TEXT NOT NULL, title TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
   CREATE INDEX IF NOT EXISTS core_conversations_profile_updated ON core_conversations(profile_id, updated_at DESC);
   CREATE TABLE IF NOT EXISTS core_conversation_messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES core_conversations(id) ON DELETE CASCADE, profile_id TEXT NOT NULL REFERENCES core_profiles(profile_id) ON DELETE CASCADE, user_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL, client_message_id TEXT, model_tier TEXT, context_hash TEXT, redactions_json TEXT NOT NULL, failure_code TEXT, created_at TEXT NOT NULL);
   CREATE UNIQUE INDEX IF NOT EXISTS core_conversation_messages_conversation_client_key ON core_conversation_messages(conversation_id, client_message_id) WHERE client_message_id IS NOT NULL;
   CREATE INDEX IF NOT EXISTS core_conversation_messages_conversation_created ON core_conversation_messages(conversation_id, created_at ASC, id ASC);`,
] as const;

export const CORE_MIGRATIONS: readonly Migration[] = migrationSql.map((sql, index) => ({
  version: index + 1,
  sql,
  checksum: createHash("sha256").update(sql).digest("hex"),
}));

export const applyCoreMigrations = (db: Database.Database) => {
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.exec("CREATE TABLE IF NOT EXISTS core_schema_migrations (version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)");
  const apply = db.transaction(() => {
    for (const migration of CORE_MIGRATIONS) {
      const existing = db.prepare("SELECT checksum FROM core_schema_migrations WHERE version = ?").get(migration.version) as { checksum?: string } | undefined;
      if (existing && existing.checksum !== migration.checksum) throw new CoreError("core_migration_checksum_mismatch");
      if (!existing) {
        db.exec(migration.sql);
        db.prepare("INSERT INTO core_schema_migrations(version, checksum, applied_at) VALUES (?, ?, ?)").run(migration.version, migration.checksum, new Date().toISOString());
      }
    }
  });
  apply();
};
