import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { applyCoreMigrations } from "../src/core/sqlite-schema.js";

describe("Core SQLite schema", () => {
  it("applies migrations idempotently with foreign keys and FTS5", () => {
    const db = new Database(":memory:");
    applyCoreMigrations(db);
    applyCoreMigrations(db);
    expect(db.prepare("SELECT COUNT(*) AS count FROM core_schema_migrations").get()).toEqual({ count: 3 });
    expect((db.pragma("foreign_keys") as Array<{ foreign_keys: number }>)[0].foreign_keys).toBe(1);
    db.prepare("INSERT INTO core_profiles(profile_id,user_id,timezone,created_at,updated_at) VALUES ('p','u','UTC','2026-08-24T00:00:00.000Z','2026-08-24T00:00:00.000Z')").run();
    db.prepare("INSERT INTO core_events(id,profile_id,user_id,event_type,occurred_at,created_at,source,payload_json,payload_text,privacy_level,retention_class,confidence,canonical_hash) VALUES ('e','p','u','activity','2026-08-24T00:00:00.000Z','2026-08-24T00:00:00.000Z','desktop','{}','editor P1','P1','P1_standard',1,'hash')").run();
    expect(db.prepare("SELECT event_id FROM core_events_fts WHERE core_events_fts MATCH 'editor'").all()).toEqual([{ event_id: "e" }]);
    db.close();
  });
});
