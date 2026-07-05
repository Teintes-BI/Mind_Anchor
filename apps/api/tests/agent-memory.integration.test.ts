import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";
import { MindAnchorStore } from "../src/store.js";

describe("agent memory internal API", () => {
  let dataDir = "";
  let app: Awaited<ReturnType<typeof buildApp>>;
  let store: MindAnchorStore;
  let env: AppEnv;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-agent-memory-api-"));
    env = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
      agentMode: "stub",
      openClawBaseUrl: undefined,
      supabaseUrl: undefined,
      supabaseJwksUrl: undefined,
      supabaseJwtIssuer: undefined,
      authDevBypassEnabled: true,
      feishuBotWebhookUrl: undefined,
      telegramBotToken: undefined,
      telegramChatId: undefined,
      defaultModelConfig: {
        baseUrl: undefined,
        apiKey: undefined,
        model: "gpt-5.4",
        wireApi: "responses",
        reasoningEffort: "xhigh",
        disableResponseStorage: true,
      },
      agentModelConfigs: Object.fromEntries(
        OPENCLAW_AGENT_NAMES.map((agentName) => [
          agentName,
          {
            baseUrl: undefined,
            apiKey: undefined,
            model: "gpt-5.4",
            wireApi: "responses",
            reasoningEffort: "xhigh",
            disableResponseStorage: true,
          },
        ]),
      ),
    };

    store = new MindAnchorStore(env.dataFile);
    await store.init();
    await store.createCoachMemoryItem({
      userId: "demo-user",
      kind: "preference",
      summary: "用户偏好更短、更轻的提醒文案。",
      confidence: 0.85,
      status: "active",
      sourceMessageId: "message-1",
      sourceExcerpt: "短提醒更好",
      lastUsedAt: null,
      revokedAt: null,
    });
    await store.createCoachMemoryItem({
      userId: "demo-user",
      kind: "habit",
      summary: "用户下午更容易进入深度工作。",
      confidence: 0.8,
      status: "active",
      sourceMessageId: "message-2",
      sourceExcerpt: "下午进入状态更快",
      lastUsedAt: null,
      revokedAt: null,
    });
    await store.createMemoryCandidate({
      userId: "demo-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "analyst-agent",
      sourceTurnRef: "turn-constraint",
      summary: "当前周内会议负载偏高，连续大块专注时间有限。",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    }).then((candidate) => store.acceptMemoryCandidate(candidate.candidateId));
    await store.saveCoachFrontAgentState({
      userId: "demo-user",
      currentFrontAgent: "director-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: "companion-agent",
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard 刚刚把本轮交给 Troi。",
    });

    app = await buildApp(env);
  });

  afterEach(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("returns scoped memory context for an allowed agent", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/agent-memory/context?userId=demo-user&agentId=companion-agent&scopes=preferences,recentContext",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().agentId).toBe("companion-agent");
    expect(response.json().scopes).toEqual(["preferences", "recentContext"]);
    expect(response.json().preferences).toHaveLength(1);
    expect(response.json().preferences[0].summary).toContain("提醒");
    expect(response.json().recentContext.length).toBeGreaterThan(0);
    expect(response.json().constraints).toEqual([]);
    expect(response.json().metadata.scopeEntryCounts).toEqual({
      preferences: 1,
      habits: 0,
      constraints: 0,
      recentContext: 1,
    });
    expect(response.json().metadata.sourceCounts).toEqual({
      "coach-memory": 1,
      "front-agent-state": 1,
    });
  });

  it("returns scopes in stable persona-defined order regardless of query order", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/agent-memory/context?userId=demo-user&agentId=companion-agent&scopes=recentContext,preferences",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().scopes).toEqual(["preferences", "recentContext"]);
    expect(response.json().preferences).toHaveLength(1);
    expect(response.json().recentContext).toHaveLength(1);
  });

  it("rejects out-of-scope memory requests", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/internal/agent-memory/context?userId=demo-user&agentId=companion-agent&scopes=constraints",
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().message).toContain("out of scope");
  });

  it("accepts and normalizes agent memory proposals", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/agent-memory/proposals",
      payload: {
        userId: "demo-user",
        sourceAgent: "companion-agent",
        targetScope: "preferences",
        kind: "preference",
        summary: "用户在压力高的时候更接受温和语气。",
        rationale: "最近多轮对话里，柔和表述的反馈明显更好。",
        sourceTurnRef: "turn-100",
        confidence: 0.79,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().proposalId).toEqual(expect.any(String));
    expect(response.json().status).toBe("proposal");
    expect(response.json().createdAt).toEqual(expect.any(String));
    expect(response.json().sourceAgent).toBe("companion-agent");
    expect(response.json().targetScope).toBe("preferences");
  });
});
