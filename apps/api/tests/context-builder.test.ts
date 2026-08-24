import Database from "better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";
import { SqliteCoreRepository } from "../src/core/sqlite-core-repository.js";
import { ContextBuilder } from "../src/core/context-builder.js";

const date = "2026-08-24T00:00:00.000Z";

const makeRepository = async () => {
  let tick = 0;
  const repo = SqliteCoreRepository.fromDatabase(new Database(":memory:"), () => new Date(Date.parse(date) + tick++).toISOString(), (() => {
    let n = 0;
    return () => `id-${++n}`;
  })());
  await repo.init();
  await repo.ensureProfile({ profileId: "profile-1", userId: "user-1", timezone: "Asia/Shanghai" });
  const conversation = await repo.createConversation({ profileId: "profile-1", userId: "user-1", title: "Context" });
  return { repo, conversation };
};

describe("bounded ContextBuilder", () => {
  let repo: Awaited<ReturnType<typeof makeRepository>>["repo"];
  let conversationId: string;

  beforeEach(async () => {
    const fixture = await makeRepository();
    repo = fixture.repo;
    conversationId = fixture.conversation.id;
  });

  it("includes active Life Compass in a local projection", async () => {
    const candidate = await repo.createLifeCompassCandidate({ profileId: "profile-1", userId: "user-1", content: "把重要的事做得踏实" });
    await repo.confirmLifeCompassCandidate("profile-1", "user-1", candidate.id, null);
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "我该做什么？", dataBoundary: "local_only" });
    expect(packet.lifeCompass).toBe("把重要的事做得踏实");
  });

  it("omits P3 Life Compass from cloud projection", async () => {
    const candidate = await repo.createLifeCompassCandidate({ profileId: "profile-1", userId: "user-1", content: "只在乎这段不应外泄的方向" });
    await repo.confirmLifeCompassCandidate("profile-1", "user-1", candidate.id, null);
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "继续", dataBoundary: "cloud_allowed" });
    expect(packet.lifeCompass).toBeNull();
    expect(packet.redactions).toContain("P3_life_compass_omitted");
    expect(JSON.stringify(packet)).not.toContain("只在乎这段不应外泄的方向");
  });

  it("projects only safe event fields and caps recent events at twelve", async () => {
    for (let index = 0; index < 20; index += 1) {
      await repo.appendEvent({ profileId: "profile-1", userId: "user-1", eventType: "activity", occurredAt: `2026-08-24T00:${String(index).padStart(2, "0")}:00.000Z`, source: "web", payload: { summary: `event-${index}`, prompt: "secret", agent: "planner", route: "hidden", rawAudio: "bytes", screenshot: "image", modelResponse: "raw" }, privacyLevel: "P1", confidence: 0.8 });
    }
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "events", dataBoundary: "local_only" });
    expect(packet.recentEvents).toHaveLength(12);
    expect(packet.recentEvents[0]).toEqual(expect.objectContaining({ id: expect.any(String), occurredAt: expect.any(String), type: "activity", summary: expect.stringMatching(/^event-/) }));
    expect(JSON.stringify(packet)).not.toMatch(/prompt|planner|hidden|bytes|image|raw/);
    expect(packet.redactions.some((item: string) => item.includes("event"))).toBe(true);
  });

  it("limits each event summary to five hundred characters", async () => {
    await repo.appendEvent({ profileId: "profile-1", userId: "user-1", eventType: "activity", occurredAt: date, source: "web", payload: { text: "x".repeat(1000) }, privacyLevel: "P1", confidence: 0.8 });
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "events", dataBoundary: "local_only" });
    expect(packet.recentEvents[0]?.summary).toHaveLength(500);
  });

  it("includes only the latest six completed history messages and truncates content", async () => {
    for (let index = 0; index < 8; index += 1) {
      const message = await repo.appendConversationMessage({ profileId: "profile-1", userId: "user-1", conversationId, role: "user", content: `${index}-${"x".repeat(1300)}`, clientMessageId: `m-${index}` });
      await repo.completeConversationMessage(message.id, { content: `assistant-${index}`, modelTier: "stub", contextHash: "h", redactions: [] });
    }
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "now", dataBoundary: "local_only" });
    expect(packet.history).toHaveLength(6);
    expect(packet.history.some((item: { content: string }) => item.content.startsWith("5-"))).toBe(true);
    expect(packet.history.every((item: { content: string }) => item.content.length <= 1200)).toBe(true);
  });

  it("does not duplicate the persisted current user message in history", async () => {
    await repo.appendConversationMessage({ profileId: "profile-1", userId: "user-1", conversationId, role: "user", content: "current turn", clientMessageId: "current" });
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "current turn", dataBoundary: "local_only" });
    expect(packet.history).toEqual([]);
    expect(packet.userMessage).toBe("current turn");
  });

  it("includes current state with its seven numeric fields and provenance", async () => {
    await repo.appendStateSnapshot({ profileId: "profile-1", userId: "user-1", energy: 1, emotion: 2, cognitiveLoad: 3, mentalNoise: 4, focusReadiness: 5, physicalFatigue: 6, recoveryNeed: 7, source: ["user"], confidence: 0.9, userConfirmed: true, capturedAt: date, purpose: "core", scope: "write" });
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "state", dataBoundary: "local_only" });
    expect(packet.currentState).toEqual(expect.objectContaining({ energy: 1, emotion: 2, cognitiveLoad: 3, mentalNoise: 4, focusReadiness: 5, physicalFatigue: 6, recoveryNeed: 7, source: ["user"], confidence: 0.9, userConfirmed: true }));
    expect(Object.keys(packet.currentState)).toHaveLength(10);
  });

  it("does not include state in cloud projection without granted context permission", async () => {
    await repo.appendStateSnapshot({ profileId: "profile-1", userId: "user-1", energy: 1, emotion: 2, cognitiveLoad: 3, mentalNoise: 4, focusReadiness: 5, physicalFatigue: 6, recoveryNeed: 7, source: ["user"], confidence: 0.9, userConfirmed: true, capturedAt: date, purpose: "core", scope: "write" });
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "state", dataBoundary: "cloud_allowed" });
    expect(packet.currentState).toBeNull();
  });

  it("includes state in cloud projection only with conversation context permission", async () => {
    await repo.appendStateSnapshot({ profileId: "profile-1", userId: "user-1", energy: 1, emotion: 2, cognitiveLoad: 3, mentalNoise: 4, focusReadiness: 5, physicalFatigue: 6, recoveryNeed: 7, source: ["user"], confidence: 0.9, userConfirmed: true, capturedAt: date, purpose: "core", scope: "write" });
    await repo.upsertPermission({ profileId: "profile-1", purpose: "conversation", scope: "context_state", status: "granted", dataLevel: "P1", updatedAt: date });
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "state", dataBoundary: "cloud_allowed" });
    expect(packet.currentState).toEqual(expect.objectContaining({ energy: 1, userConfirmed: true }));
  });

  it("keeps the current user message and stays within the total character budget", async () => {
    const candidate = await repo.createLifeCompassCandidate({ profileId: "profile-1", userId: "user-1", content: "c".repeat(5000) });
    await repo.confirmLifeCompassCandidate("profile-1", "user-1", candidate.id, null);
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "u".repeat(12000), dataBoundary: "local_only" });
    expect(packet.characterCount).toBeLessThanOrEqual(24000);
    expect(packet.userMessage).toBe("u".repeat(12000));
  });

  it("produces a stable hash and changes it when the user message changes", async () => {
    const builder = new ContextBuilder(repo, () => date);
    const input = { profileId: "profile-1", userId: "user-1", conversationId, userMessage: "same", dataBoundary: "local_only" as const };
    const first = await builder.build(input);
    const second = await builder.build(input);
    const changed = await builder.build({ ...input, userMessage: "different" });
    expect(first.contextHash).toBe(second.contextHash);
    expect(first.contextHash).not.toBe(changed.contextHash);
    expect(first.contextHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("creates a valid empty packet without inventing memory", async () => {
    const packet = await new ContextBuilder(repo, () => date).build({ profileId: "profile-1", userId: "user-1", conversationId, userMessage: "nothing else", dataBoundary: "cloud_allowed" });
    expect(packet.lifeCompass).toBeNull();
    expect(packet.currentState).toBeNull();
    expect(packet.recentEvents).toEqual([]);
    expect(packet.history).toEqual([]);
  });
});
