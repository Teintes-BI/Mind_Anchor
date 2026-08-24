import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SqliteCoreRepository } from "../src/core/sqlite-core-repository.js";

describe("Core privacy, export and deletion", () => {
  it("blocks P3 cloud projection and excludes trace payloads from export", async () => {
    const repo = SqliteCoreRepository.fromDatabase(new Database(":memory:"));
    await repo.init();
    await repo.ensureProfile({ profileId: "p", userId: "u", timezone: "UTC" });
    await expect(repo.appendEvent({ profileId: "p", userId: "u", eventType: "activity", occurredAt: "2026-08-24T10:00:00.000Z", source: "desktop", payload: { secret: "x" }, privacyLevel: "P3", confidence: 1 })).rejects.toMatchObject({ code: "core_p3_egress_blocked" });
    const event = await repo.appendEvent({ profileId: "p", userId: "u", eventType: "activity", occurredAt: "2026-08-24T10:00:00.000Z", source: "desktop", payload: { summary: "safe" }, privacyLevel: "P1", confidence: 1 });
    await repo.upsertPermission({ profileId: "p", purpose: "conversation", scope: "chat_input", status: "granted", dataLevel: "P1", updatedAt: "2026-08-24T10:00:00.000Z" });
    const conversation = await repo.createConversation({ profileId: "p", userId: "u" });
    const userMessage = await repo.appendConversationMessage({ profileId: "p", userId: "u", conversationId: conversation.id, role: "user", content: "请帮我整理一下" });
    const assistantMessage = await repo.completeConversationMessage(userMessage.id, { content: "先写下最重要的一件事。", modelTier: "stub", contextHash: "context-hash", redactions: [] });
    await repo.addSystemTrace({ profileId: "p", userId: "u", event: "model.raw", payload: { prompt: "secret", response: "secret" } });
    const exported = await repo.exportProfile("p", "u");
    expect(exported.events[0].id).toBe(event.id);
    expect(exported.conversations).toEqual([expect.objectContaining({ id: conversation.id, title: "新对话" })]);
    expect(exported.conversationMessages).toEqual([
      expect.objectContaining({ id: userMessage.id, role: "user" }),
      expect.objectContaining({ id: assistantMessage.id, role: "assistant", status: "completed" }),
    ]);
    expect(exported.systemTraceCount).toBe(1);
    expect(JSON.stringify(exported)).not.toContain("secret");
    await repo.deleteProfile("p", "u");
    await expect(repo.exportProfile("p", "u")).rejects.toMatchObject({ code: "core_not_found" });
    await expect(repo.getConversation("p", "u", conversation.id)).rejects.toMatchObject({ code: "core_not_found" });
    repo.close();
  });

  it("exports the complete chat history even when conversation reads are capped", async () => {
    let sequence = 0;
    const repo = SqliteCoreRepository.fromDatabase(new Database(":memory:"), () => "2026-08-24T10:00:00.000Z", () => `id-${String(++sequence).padStart(3, "0")}`);
    await repo.init();
    await repo.ensureProfile({ profileId: "p", userId: "u", timezone: "UTC" });
    const conversation = await repo.createConversation({ profileId: "p", userId: "u" });
    for (let index = 0; index < 101; index += 1) {
      await repo.appendConversationMessage({ profileId: "p", userId: "u", conversationId: conversation.id, role: "user", content: `turn ${index}` });
    }

    expect((await repo.listConversationMessages("p", "u", conversation.id)).length).toBe(100);
    expect((await repo.exportProfile("p", "u")).conversationMessages).toHaveLength(101);
    repo.close();
  });
});
