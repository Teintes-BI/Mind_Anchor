import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { applyCoreMigrations } from "../src/core/sqlite-schema.js";

const now = "2026-08-24T00:00:00.000Z";

describe("Single brain SQLite migration", () => {
  it("creates the planned conversation and message tables with a required title", () => {
    const db = new Database(":memory:");

    applyCoreMigrations(db);

    expect(
      db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('core_conversations', 'core_conversation_messages', 'core_conversation_context_packets') ORDER BY name")
        .all(),
    ).toEqual([
      { name: "core_conversation_messages" },
      { name: "core_conversations" },
    ]);
    expect(db.prepare("PRAGMA table_info(core_conversations)").all()).toContainEqual({ cid: 4, name: "title", type: "TEXT", notnull: 1, dflt_value: null, pk: 0 });
    expect(
      (db.prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = 'core_conversation_messages_conversation_created'").get() as { sql: string }).sql,
    ).toContain("(conversation_id, created_at ASC, id ASC)");
    db.close();
  });

  it("applies the third migration idempotently", () => {
    const db = new Database(":memory:");

    applyCoreMigrations(db);
    applyCoreMigrations(db);

    expect(db.prepare("SELECT COUNT(*) AS count FROM core_schema_migrations").get()).toEqual({ count: 3 });
    db.close();
  });

  it("cascades conversation records when their core profile is deleted", () => {
    const db = new Database(":memory:");
    applyCoreMigrations(db);
    db.prepare("INSERT INTO core_profiles(profile_id,user_id,timezone,created_at,updated_at) VALUES ('profile-1','user-1','UTC',?,?)").run(now, now);
    db.prepare("INSERT INTO core_conversations(id,profile_id,user_id,status,title,created_at,updated_at) VALUES ('conversation-1','profile-1','user-1','active','Focus planning',?,?)").run(now, now);
    db.prepare("INSERT INTO core_conversation_messages(id,conversation_id,profile_id,user_id,role,content,status,redactions_json,created_at) VALUES ('message-1','conversation-1','profile-1','user-1','user','What should I focus on?','completed','[]',?)").run(now);

    db.prepare("DELETE FROM core_profiles WHERE profile_id = 'profile-1'").run();

    expect(db.prepare("SELECT COUNT(*) AS count FROM core_conversations").get()).toEqual({ count: 0 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM core_conversation_messages").get()).toEqual({ count: 0 });
    db.close();
  });
});
