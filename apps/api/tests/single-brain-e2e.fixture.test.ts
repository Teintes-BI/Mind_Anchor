import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { ContextBuilder } from "../src/core/context-builder.js";
import { SqliteCoreRepository } from "../src/core/sqlite-core-repository.js";
import { StubSingleBrainModelAdapter } from "../src/services/single-brain-model.js";
import { SingleBrainService } from "../src/services/single-brain-service.js";

describe("Single Brain V0.1-B acceptance fixture", () => {
  it("runs compass/state/events and three chat turns with bounded privacy output", async () => {
    const repo = SqliteCoreRepository.fromDatabase(new Database(":memory:"));
    await repo.init();
    await repo.ensureProfile({ profileId: "profile:e2e", userId: "e2e", timezone: "UTC" });
    const candidate = await repo.createLifeCompassCandidate({ profileId: "profile:e2e", userId: "e2e", content: "把重要的事做得踏实" });
    await repo.confirmLifeCompassCandidate("profile:e2e", "e2e", candidate.id, null);
    await repo.appendStateSnapshot({ profileId: "profile:e2e", userId: "e2e", energy: 4, emotion: 3, cognitiveLoad: 2, mentalNoise: 2, focusReadiness: 4, physicalFatigue: 3, recoveryNeed: 2, source: ["user"], confidence: 0.9, userConfirmed: true, capturedAt: "2026-08-24T00:00:00.000Z", purpose: "core", scope: "write" });
    for (let index = 0; index < 15; index += 1) {
      await repo.appendEvent({ profileId: "profile:e2e", userId: "e2e", eventType: "activity", occurredAt: `2026-08-24T00:${String(index).padStart(2, "0")}:00.000Z`, source: "web", payload: { summary: `event-${index}`, prompt: "secret", route: "hidden" }, privacyLevel: "P1", confidence: 0.8 });
    }
    const conversation = await repo.createConversation({ profileId: "profile:e2e", userId: "e2e", title: "验收" });
    const service = new SingleBrainService(repo, new ContextBuilder(repo), new StubSingleBrainModelAdapter());
    for (let index = 0; index < 3; index += 1) {
      const result = await service.sendMessage({ profileId: "profile:e2e", userId: "e2e", conversationId: conversation.id, content: `第 ${index + 1} 轮`, clientMessageId: `turn-${index + 1}`, dataBoundary: "cloud_allowed" });
      expect(result.assistantMessage.status).toBe("completed");
      expect(result.packetMeta.redactions).toContain("P3_life_compass_omitted");
    }
    const messages = await repo.listConversationMessages("profile:e2e", "e2e", conversation.id);
    expect(messages).toHaveLength(6);
    expect(messages.filter((message) => message.role === "assistant")).toHaveLength(3);
    expect(messages.map((message) => message.role)).toEqual(["user", "assistant", "user", "assistant", "user", "assistant"]);
    const exported = await repo.exportProfile("profile:e2e", "e2e");
    expect(exported.conversations).toHaveLength(1);
    expect(exported.conversationMessages).toHaveLength(6);
    expect(exported.conversationMessages.every((message) => !("prompt" in message) && !("route" in message) && !("agent" in message))).toBe(true);
    await repo.deleteConversation("profile:e2e", "e2e", conversation.id);
    await expect(repo.getConversation("profile:e2e", "e2e", conversation.id)).rejects.toMatchObject({ code: "core_not_found" });
    repo.close();
  });
});
