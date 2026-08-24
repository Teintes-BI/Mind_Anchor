import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SqliteCoreRepository } from "../src/core/sqlite-core-repository.js";
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

describe("Single brain conversation repository", () => {
  const createRepository = () => {
    let sequence = 0;
    const repo = SqliteCoreRepository.fromDatabase(
      new Database(":memory:"),
      () => now,
      () => `id-${++sequence}`,
    );
    return repo;
  };

  const grantChatInput = (repo: SqliteCoreRepository) =>
    repo.upsertPermission({
      profileId: "p",
      purpose: "conversation",
      scope: "chat_input",
      status: "granted",
      dataLevel: "P1",
      updatedAt: now,
    });

  it("persists an idempotent user turn and creates a completed assistant turn", async () => {
    const repo = createRepository();
    await repo.init();
    await repo.ensureProfile({ profileId: "p", userId: "u", timezone: "UTC" });
    await grantChatInput(repo);
    const conversation = await repo.createConversation({ profileId: "p", userId: "u", title: "今天的对话" });
    const input = { profileId: "p", userId: "u", conversationId: conversation.id, role: "user" as const, content: "我现在有点混乱", clientMessageId: "m-1" };

    const user = await repo.appendConversationMessage(input);
    const retry = await repo.appendConversationMessage(input);

    expect(retry.id).toBe(user.id);
    await expect(repo.appendConversationMessage({ ...input, content: "另一段话" })).rejects.toMatchObject({ code: "core_idempotency_conflict" });
    const assistant = await repo.completeConversationMessage(user.id, { content: "先只选一个最小步骤。", modelTier: "stub", contextHash: "h1", redactions: [] });
    expect(assistant).toMatchObject({ conversationId: conversation.id, role: "assistant", status: "completed", content: "先只选一个最小步骤。" });
    expect((await repo.listConversationMessages("p", "u", conversation.id)).map((item) => item.status)).toEqual(["completed", "completed"]);
    expect((await repo.listConversationMessages("p", "u", conversation.id)).map((item) => item.id)).toEqual([user.id, assistant.id]);
    repo.close();
  });

  it("binds chat input to the P1 conversation permission and defaults an empty title", async () => {
    const repo = createRepository();
    await repo.init();
    await repo.ensureProfile({ profileId: "p", userId: "u", timezone: "UTC" });
    const conversation = await repo.createConversation({ profileId: "p", userId: "u", title: "  " });

    expect(conversation).toMatchObject({ title: "新对话", status: "active" });
    await repo.upsertPermission({ profileId: "p", purpose: "conversation", scope: "chat_input", status: "revoked", dataLevel: "P1", updatedAt: now });
    await expect(repo.appendConversationMessage({ profileId: "p", userId: "u", conversationId: conversation.id, role: "user", content: "hello" })).rejects.toMatchObject({ code: "core_permission_required" });
    repo.close();
  });

  it("enforces ownership, stores failed assistant turns, archives conversations, and caps message reads", async () => {
    let sequence = 0;
    const repo = SqliteCoreRepository.fromDatabase(new Database(":memory:"), () => now, () => `id-${++sequence}`);
    await repo.init();
    await repo.ensureProfile({ profileId: "p", userId: "u", timezone: "UTC" });
    await repo.ensureProfile({ profileId: "q", userId: "v", timezone: "UTC" });
    await grantChatInput(repo);
    const conversation = await repo.createConversation({ profileId: "p", userId: "u" });
    const user = await repo.appendConversationMessage({ profileId: "p", userId: "u", conversationId: conversation.id, role: "user", content: "hello" });

    await expect(repo.getConversation("p", "v", conversation.id)).rejects.toMatchObject({ code: "core_profile_scope_mismatch" });
    await expect(repo.listConversationMessages("q", "v", conversation.id)).rejects.toMatchObject({ code: "core_not_found" });
    await expect(repo.completeConversationMessage("q", "v", user.id, { content: "forbidden", modelTier: "stub", contextHash: "h", redactions: [] })).rejects.toMatchObject({ code: "core_not_found" });
    const failed = await repo.failConversationMessage("p", "u", user.id, { status: "failed", failureCode: "model_unavailable", redactions: ["P3_life_compass_omitted"] });
    expect(failed).toMatchObject({ role: "assistant", status: "failed", failureCode: "model_unavailable" });
    expect(await repo.archiveConversation("p", "u", conversation.id)).toMatchObject({ status: "archived" });
    expect(await repo.listConversations("p", "u")).toEqual([expect.objectContaining({ id: conversation.id, status: "archived" })]);
    repo.close();
  });

  it("returns at most the first 100 messages in created_at and id order", async () => {
    let sequence = 0;
    const repo = SqliteCoreRepository.fromDatabase(new Database(":memory:"), () => now, () => `id-${String(++sequence).padStart(3, "0")}`);
    await repo.init();
    await repo.ensureProfile({ profileId: "p", userId: "u", timezone: "UTC" });
    const conversation = await repo.createConversation({ profileId: "p", userId: "u" });

    for (let index = 0; index < 101; index += 1) {
      await repo.appendConversationMessage({ profileId: "p", userId: "u", conversationId: conversation.id, role: "user", content: `message ${index}` });
    }

    const messages = await repo.listConversationMessages("p", "u", conversation.id);
    expect(messages).toHaveLength(100);
    expect(messages[0]?.content).toBe("message 0");
    expect(messages.at(-1)?.content).toBe("message 99");
    repo.close();
  });
});
