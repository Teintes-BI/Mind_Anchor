import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentMemoryService } from "../src/services/agent-memory-service.js";
import { MindAnchorStore } from "../src/store.js";

describe("AgentMemoryService behavior", () => {
  let dataDir = "";
  let store: MindAnchorStore;
  let service: AgentMemoryService;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-agent-memory-behavior-"));
    store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();
    service = new AgentMemoryService(store);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("applies scope-specific top-k budgets and keeps the newest relevant memory first", async () => {
    const userId = "demo-user";

    for (let index = 0; index < 5; index += 1) {
      const memory = await store.createCoachMemoryItem({
        userId,
        kind: "preference",
        summary: `偏好记忆 ${index}`,
        confidence: 0.5 + index * 0.05,
        status: "active",
        sourceMessageId: `pref-${index}`,
        sourceExcerpt: `pref-excerpt-${index}`,
        lastUsedAt: null,
        revokedAt: null,
      });
      if (index >= 2) {
        await store.touchCoachMemoryItemLastUsed(userId, memory.id);
      }
    }

    for (let index = 0; index < 3; index += 1) {
      await store.createCoachMemoryItem({
        userId,
        kind: "habit",
        summary: `习惯记忆 ${index}`,
        confidence: 0.7 + index * 0.04,
        status: "active",
        sourceMessageId: `habit-${index}`,
        sourceExcerpt: `habit-excerpt-${index}`,
        lastUsedAt: null,
        revokedAt: null,
      });
    }

    for (let index = 0; index < 3; index += 1) {
      const candidate = await store.createMemoryCandidate({
        userId,
        memoryId: null,
        status: "candidate",
        sourceAgent: "analyst-agent",
        sourceTurnRef: `constraint-${index}`,
        summary: `现实约束 ${index}`,
        effectiveAt: null,
        recallBlockedAt: null,
        deletedAt: null,
      });
      await store.acceptMemoryCandidate(candidate.candidateId);
    }

    await store.saveCoachFrontAgentState({
      userId,
      currentFrontAgent: "director-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: null,
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard 正在协调当前这一轮。",
    });

    const bundle = service.getContext({
      userId,
      agentId: "director-agent",
    });

    expect(bundle.preferences).toHaveLength(3);
    expect(bundle.habits).toHaveLength(2);
    expect(bundle.constraints).toHaveLength(2);
    expect(bundle.recentContext).toHaveLength(1);

    expect(bundle.preferences[0]?.summary).toBe("偏好记忆 4");
    expect(bundle.preferences[1]?.summary).toBe("偏好记忆 3");
    expect(bundle.preferences[2]?.summary).toBe("偏好记忆 2");

    expect(bundle.metadata.activeMemoryCount).toBe(12);
    expect(bundle.metadata.scopeEntryCounts).toEqual({
      preferences: 3,
      habits: 2,
      constraints: 2,
      recentContext: 1,
    });
    expect(bundle.metadata.sourceCounts).toEqual({
      "coach-memory": 5,
      "gateway-memory": 2,
      "front-agent-state": 1,
    });
  });

  it("normalizes requested scopes into a stable persona-defined order", async () => {
    const userId = "demo-user";

    await store.createCoachMemoryItem({
      userId,
      kind: "preference",
      summary: "用户偏好短句、明确下一步。",
      confidence: 0.9,
      status: "active",
      sourceMessageId: "pref-1",
      sourceExcerpt: "pref-excerpt-1",
      lastUsedAt: null,
      revokedAt: null,
    });

    await store.saveCoachFrontAgentState({
      userId,
      currentFrontAgent: "companion-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: null,
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Troi is currently fronting this turn.",
    });

    const bundle = service.getContext({
      userId,
      agentId: "companion-agent",
      scopes: ["recentContext", "preferences"],
    });

    expect(bundle.scopes).toEqual(["preferences", "recentContext"]);
    expect(bundle.preferences).toHaveLength(1);
    expect(bundle.recentContext).toHaveLength(1);
  });

  it("boosts retrieval order for memory matched by a pending helpful-feedback strengthening candidate", async () => {
    const userId = "demo-user";

    await store.createCoachMemoryItem({
      userId,
      kind: "preference",
      summary: "用户更适合短句、明确的下一步。",
      confidence: 0.72,
      status: "active",
      sourceMessageId: "older-memory",
      sourceExcerpt: "older",
      lastUsedAt: null,
      revokedAt: null,
    });

    await store.createCoachMemoryItem({
      userId,
      kind: "preference",
      summary: "用户也能接受较完整的解释型建议。",
      confidence: 0.9,
      status: "active",
      sourceMessageId: "newer-memory",
      sourceExcerpt: "newer",
      lastUsedAt: null,
      revokedAt: null,
    });

    const session = await store.createCoachSession({
      userId,
      title: "helpful-strengthening-boost",
      status: "active",
    });
    const assistant = await store.createCoachMessage({
      userId,
      sessionId: session.id,
      role: "assistant",
      status: "completed",
      userText: null,
      fastResponse: "先收窄成一个最小下一步。",
      fullResponse: "先收窄成一个最小下一步，再继续。",
      usedMemoryIds: [],
      traceId: "trace-helpful-strengthening-boost",
      errorCode: null,
    });

    await store.createMemoryCandidate({
      userId,
      memoryId: null,
      status: "candidate",
      sourceAgent: "companion-agent",
      sourceTurnRef: `feedback-helpful:preferences:${assistant.id}`,
      summary: "用户更适合短句、明确的下一步。",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });

    const bundle = service.getContext({
      userId,
      agentId: "director-agent",
      scopes: ["preferences"],
    });

    expect(bundle.preferences[0]?.summary).toBe("用户更适合短句、明确的下一步。");
    expect(bundle.preferences[1]?.summary).toBe("用户也能接受较完整的解释型建议。");
  });

  it("does not keep boosting retrieval order forever for stale helpful-feedback strengthening candidates", async () => {
    const userId = "demo-user";

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T08:00:00.000Z"));

    await store.createCoachMemoryItem({
      userId,
      kind: "preference",
      summary: "用户更适合短句、明确的下一步。",
      confidence: 0.72,
      status: "active",
      sourceMessageId: "older-memory",
      sourceExcerpt: "older",
      lastUsedAt: null,
      revokedAt: null,
    });

    const session = await store.createCoachSession({
      userId,
      title: "stale-strengthening",
      status: "active",
    });
    const assistant = await store.createCoachMessage({
      userId,
      sessionId: session.id,
      role: "assistant",
      status: "completed",
      userText: null,
      fastResponse: "先收窄成一个最小下一步。",
      fullResponse: "先收窄成一个最小下一步，再继续。",
      usedMemoryIds: [],
      traceId: "trace-stale-strengthening",
      errorCode: null,
    });

    await store.createMemoryCandidate({
      userId,
      memoryId: null,
      status: "candidate",
      sourceAgent: "companion-agent",
      sourceTurnRef: `feedback-helpful:preferences:${assistant.id}`,
      summary: "用户更适合短句、明确的下一步。",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });

    vi.setSystemTime(new Date("2026-03-25T08:00:00.000Z"));

    await store.createCoachMemoryItem({
      userId,
      kind: "preference",
      summary: "用户此刻也能接受稍完整、但更贴近现实约束的建议。",
      confidence: 0.9,
      status: "active",
      sourceMessageId: "newer-memory",
      sourceExcerpt: "newer",
      lastUsedAt: null,
      revokedAt: null,
    });

    const bundle = service.getContext({
      userId,
      agentId: "director-agent",
      scopes: ["preferences"],
    });

    expect(bundle.preferences[0]?.summary).toBe("用户此刻也能接受稍完整、但更贴近现实约束的建议。");
    expect(bundle.preferences[1]?.summary).toBe("用户更适合短句、明确的下一步。");
  });

  it("does not boost retrieval order when a helpful-feedback strengthening candidate lost its source message", async () => {
    const userId = "demo-user";

    await store.createCoachMemoryItem({
      userId,
      kind: "preference",
      summary: "用户更适合短句、明确的下一步。",
      confidence: 0.72,
      status: "active",
      sourceMessageId: "older-memory",
      sourceExcerpt: "older",
      lastUsedAt: null,
      revokedAt: null,
    });

    await store.createCoachMemoryItem({
      userId,
      kind: "preference",
      summary: "用户此刻更需要结合现实约束的完整建议。",
      confidence: 0.9,
      status: "active",
      sourceMessageId: "newer-memory",
      sourceExcerpt: "newer",
      lastUsedAt: null,
      revokedAt: null,
    });

    await store.createMemoryCandidate({
      userId,
      memoryId: null,
      status: "candidate",
      sourceAgent: "companion-agent",
      sourceTurnRef: "feedback-helpful:preferences:missing-assistant-message",
      summary: "用户更适合短句、明确的下一步。",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });

    const bundle = service.getContext({
      userId,
      agentId: "director-agent",
      scopes: ["preferences"],
    });

    expect(bundle.preferences[0]?.summary).toBe("用户此刻更需要结合现实约束的完整建议。");
    expect(bundle.preferences[1]?.summary).toBe("用户更适合短句、明确的下一步。");
  });
});
