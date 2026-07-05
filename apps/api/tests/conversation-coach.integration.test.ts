import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  coachFeedbackSchema,
  coachMemoryItemSchema,
  coachMessageSchema,
  coachSessionSchema,
  coachTrainingExampleSchema,
} from "@mindanchor/domain";
import { buildApp } from "../src/app.js";
import type { AppEnv } from "../src/env.js";
import { MindAnchorStore } from "../src/store.js";
import { createLocalOpenClawServer } from "../../../openclaw/local-runtime/server.mjs";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("conversation coach domain contracts", () => {
  it("parses a coach session", () => {
    const parsed = coachSessionSchema.parse({
      id: "session-1",
      userId: "coach-user",
      title: "最近总感觉推进很卡",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    });

    expect(parsed.status).toBe("active");
  });

  it("parses a coach message with fast/full responses", () => {
    const parsed = coachMessageSchema.parse({
      id: "message-1",
      userId: "coach-user",
      sessionId: "session-1",
      role: "assistant",
      status: "pending_full",
      userText: null,
      fastResponse: "先别急，先收窄成一个最小下一步。",
      fullResponse: null,
      usedMemoryIds: [],
      usedMemoryEntries: [
        {
          memoryId: "memory-1",
          summary: "用户偏好短句、明确下一步。",
          kind: "preference",
          source: "coach-memory",
        },
      ],
      traceId: "trace-1",
      errorCode: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(parsed.status).toBe("pending_full");
    expect(parsed.fastResponse).toContain("最小下一步");
  });

  it("parses coach feedback, memory, and training example records", () => {
    const feedback = coachFeedbackSchema.parse({
      id: "feedback-1",
      userId: "coach-user",
      sessionId: "session-1",
      messageId: "message-1",
      label: "helpful",
      reason: "更符合我的节奏",
      createdAt: new Date().toISOString(),
    });
    const memory = coachMemoryItemSchema.parse({
      id: "memory-1",
      userId: "coach-user",
      kind: "preference",
      summary: "用户更偏好短句、明确的下一步。",
      confidence: 0.82,
      status: "active",
      sourceMessageId: "message-1",
      sourceExcerpt: "来自一次关于推进卡顿的对话摘要。",
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      revokedAt: null,
    });
    const training = coachTrainingExampleSchema.parse({
      id: "training-1",
      userId: "coach-user",
      sourceSessionId: "session-1",
      sourceMessageId: "message-1",
      contextSnapshotId: "snapshot-1",
      status: "candidate",
      createdAt: new Date().toISOString(),
    });

    expect(feedback.label).toBe("helpful");
    expect(memory.status).toBe("active");
    expect(training.status).toBe("candidate");
  });
});

describe("conversation coach store foundation", () => {
  let dataDir = "";
  let store: MindAnchorStore;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-conversation-coach-"));
    store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("creates and lists coach sessions per user", async () => {
    const created = await store.createCoachSession({
      userId: "coach-user",
      title: "最近总感觉推进很卡",
      status: "active",
    });
    await store.createCoachSession({
      userId: "other-user",
      title: "别把我的会话串给别人",
      status: "active",
    });

    expect(store.listCoachSessions("coach-user")).toHaveLength(1);
    expect(store.listCoachSessions("coach-user")[0]?.id).toBe(created.id);
    expect(store.getCoachSession("coach-user", created.id)?.title).toBe("最近总感觉推进很卡");
  });

  it("creates and updates coach messages inside a session", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "消息流测试",
      status: "active",
    });

    const userMessage = await store.createCoachMessage({
      userId: "coach-user",
      sessionId: session.id,
      role: "user",
      status: "completed",
      userText: "我不知道该先处理现实问题还是情绪问题。",
      fastResponse: null,
      fullResponse: null,
      usedMemoryIds: [],
      traceId: "trace-user",
      errorCode: null,
    });
    const assistant = await store.createCoachMessage({
      userId: "coach-user",
      sessionId: session.id,
      role: "assistant",
      status: "pending_full",
      userText: null,
      fastResponse: "先不要同时解决两个问题。",
      fullResponse: null,
      usedMemoryIds: [],
      traceId: "trace-assistant",
      errorCode: null,
    });

    const updated = await store.updateCoachMessage(assistant.id, {
      status: "completed",
      fullResponse: "先稳住情绪，再把现实问题压缩成一个可以执行的下一步。",
    });

    expect(store.listCoachMessagesBySession("coach-user", session.id)).toHaveLength(2);
    expect(userMessage.role).toBe("user");
    expect(updated?.status).toBe("completed");
    expect(updated?.fullResponse).toContain("先稳住情绪");
  });

  it("revokes derived memory when a coach session is deleted", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "删除会话后应撤销派生记忆",
      status: "active",
    });
    const message = await store.createCoachMessage({
      userId: "coach-user",
      sessionId: session.id,
      role: "assistant",
      status: "completed",
      userText: null,
      fastResponse: "你更适合短句建议。",
      fullResponse: "你在高压时更适合短句、明确、一步一动的建议。",
      usedMemoryIds: [],
      traceId: "trace-memory",
      errorCode: null,
    });
    const memory = await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "preference",
      summary: "用户偏好短句、明确下一步。",
      confidence: 0.88,
      status: "active",
      sourceMessageId: message.id,
      sourceExcerpt: "来自一次关于高压状态的总结摘要。",
      lastUsedAt: null,
      revokedAt: null,
    });

    await store.deleteCoachSession("coach-user", session.id);

    expect(store.getCoachSession("coach-user", session.id)).toBeNull();
    expect(store.listCoachMemoryItems("coach-user")[0]?.id).toBe(memory.id);
    expect(store.listCoachMemoryItems("coach-user")[0]?.status).toBe("revoked");
  });
});

describe("conversation coach routes", () => {
  let dataDir = "";
  let env: AppEnv;
  let store: MindAnchorStore;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-conversation-coach-api-"));
    env = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
      agentMode: "stub",
      openClawBaseUrl: undefined,
      supabaseUrl: undefined,
      supabaseJwksUrl: undefined,
      supabaseJwtIssuer: undefined,
      authDevBypassEnabled: true,
      authJwtSecret: undefined,
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
      agentModelConfigs: {},
    };
    store = new MindAnchorStore(env.dataFile);
    await store.init();
    app = await buildApp(env);
  });

  afterEach(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("creates, lists, fetches, and deletes coach sessions for the authenticated user", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/coach/sessions",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        title: "我最近总在卡住时反复切任务",
      },
    });

    expect(created.statusCode).toBe(200);
    expect(created.json().title).toBe("我最近总在卡住时反复切任务");

    const listed = await app.inject({
      method: "GET",
      url: "/coach/sessions",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(listed.statusCode).toBe(200);
    expect(listed.json()).toHaveLength(1);

    const fetched = await app.inject({
      method: "GET",
      url: `/coach/sessions/${created.json().id}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(fetched.statusCode).toBe(200);
    expect(fetched.json().session.id).toBe(created.json().id);
    expect(fetched.json().messages).toEqual([]);

    const deleted = await app.inject({
      method: "DELETE",
      url: `/coach/sessions/${created.json().id}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(deleted.statusCode).toBe(200);

    const refetched = await app.inject({
      method: "GET",
      url: `/coach/sessions/${created.json().id}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(refetched.statusCode).toBe(404);
  });

  it("creates a coach message pair and returns fast response with a trace id", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "我现在很乱，不知道先做什么",
      status: "active",
    });
    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "POST",
      url: `/coach/sessions/${session.id}/messages`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        text: "我现在很乱，不知道先做什么。",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().userMessage.role).toBe("user");
    expect(response.json().assistantMessage.role).toBe("assistant");
    expect(typeof response.json().fastResponse).toBe("string");
    expect(response.json().fastResponse.length).toBeGreaterThan(0);
    expect(typeof response.json().traceId).toBe("string");

    const fetched = await app.inject({
      method: "GET",
      url: `/coach/messages/${response.json().assistantMessage.id}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(fetched.statusCode).toBe(200);
    expect(fetched.json().id).toBe(response.json().assistantMessage.id);
  });

  it("waits for pending coach full-response work before app shutdown returns", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "shutdown-drains-pending-full-response",
      status: "active",
    });
    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "POST",
      url: `/coach/sessions/${session.id}/messages`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        text: "我脑子有点乱，先帮我收成一个最小下一步。",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().assistantMessage.status).toBe("pending_full");
    expect(response.json().frontAgentState).toEqual(
      expect.objectContaining({
        currentFrontAgent: expect.any(String),
        routingMode: expect.any(String),
        manualOverride: expect.any(Boolean),
      }),
    );
    expect(typeof response.json().traceId).toBe("string");

    await app.close();

    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    const completedAssistant = reloaded.getCoachMessage("coach-user", response.json().assistantMessage.id);

    expect(completedAssistant?.status).toBe("completed");
    expect(typeof completedAssistant?.fullResponse).toBe("string");
    expect((completedAssistant?.fullResponse ?? "").length).toBeGreaterThan(0);

    app = await buildApp(env);
  });

  it("retries a failed coach message and records feedback", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "retry",
      status: "active",
    });
    const userMessage = await store.createCoachMessage({
      userId: "coach-user",
      sessionId: session.id,
      role: "user",
      status: "completed",
      userText: "帮我把今天的情况重新理顺。",
      fastResponse: null,
      fullResponse: null,
      usedMemoryIds: [],
      traceId: "trace-user",
      errorCode: null,
    });
    const assistant = await store.createCoachMessage({
      userId: "coach-user",
      sessionId: session.id,
      role: "assistant",
      status: "failed",
      userText: null,
      fastResponse: "先别急，先把这件事收窄成一个最小下一步。",
      fullResponse: null,
      usedMemoryIds: [],
      traceId: "trace-assistant",
      errorCode: "coach_generation_failed",
    });
    await store.createCoachTrainingExample({
      userId: "coach-user",
      sourceSessionId: session.id,
      sourceMessageId: userMessage.id,
      contextSnapshotId: "snapshot-1",
      status: "candidate",
    });
    await app.close();
    app = await buildApp(env);

    const retried = await app.inject({
      method: "POST",
      url: `/coach/messages/${assistant.id}/retry`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(retried.statusCode).toBe(200);
    expect(retried.json().assistantMessage.status).toBe("pending_full");
    expect(retried.json().assistantMessage.fastResponse).toBe("先别急，先把这件事收窄成一个最小下一步。");
    expect(retried.json().assistantMessage.fullResponse).toBeNull();
    expect(retried.json().userMessage.id).toBe(userMessage.id);
    expect(retried.json().frontAgentState).toEqual(
      expect.objectContaining({
        currentFrontAgent: expect.any(String),
        routingMode: expect.any(String),
        manualOverride: expect.any(Boolean),
      }),
    );
    expect(typeof retried.json().fastResponse).toBe("string");
    expect(typeof retried.json().traceId).toBe("string");

    const retriedTraceId = retried.json().traceId as string;
    const retryStore = new MindAnchorStore(env.dataFile);
    await retryStore.init();
    const retryEventsBeforeCompletion = retryStore.listTraceLogEvents(retriedTraceId).map((event) => event.event);
    expect(retryEventsBeforeCompletion).not.toContain("coach.message.fast.started");
    expect(retryEventsBeforeCompletion).not.toContain("coach.message.fast.completed");
    expect(retryEventsBeforeCompletion).toContain("coach.message.full.started");

    let completedMessage = retried.json().assistantMessage;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await sleep(25);
      const fetched = await app.inject({
        method: "GET",
        url: `/coach/messages/${assistant.id}`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });
      expect(fetched.statusCode).toBe(200);
      completedMessage = fetched.json();
      if (completedMessage.status === "completed") {
        break;
      }
    }

    expect(completedMessage.status).toBe("completed");
    expect(completedMessage.fastResponse).toBe("先别急，先把这件事收窄成一个最小下一步。");
    expect(typeof completedMessage.fullResponse).toBe("string");

    const feedback = await app.inject({
      method: "POST",
      url: `/coach/messages/${assistant.id}/feedback`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        label: "helpful",
        reason: "这次更贴近我的真实节奏。",
      },
    });

    expect(feedback.statusCode).toBe(200);
    expect(feedback.json().label).toBe("helpful");
  });

  it("applies unhelpful feedback by revoking used memory and invalidating training examples", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "feedback-governance",
      status: "active",
    });
    const memory = await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "preference",
      summary: "用户更适合短句、明确的下一步。",
      confidence: 0.82,
      status: "active",
      sourceMessageId: "source-message",
      sourceExcerpt: "历史偏好摘要",
      lastUsedAt: null,
      revokedAt: null,
    });
    const assistant = await store.createCoachMessage({
      userId: "coach-user",
      sessionId: session.id,
      role: "assistant",
      status: "completed",
      userText: null,
      fastResponse: "先收窄成一个最小下一步。",
      fullResponse: "先收窄成一个最小下一步，再继续。",
      usedMemoryIds: [memory.id],
      traceId: "trace-feedback-governance",
      errorCode: null,
    });
    await store.createCoachTrainingExample({
      userId: "coach-user",
      sourceSessionId: session.id,
      sourceMessageId: assistant.id,
      contextSnapshotId: "snapshot-feedback-1",
      status: "candidate",
    });
    await app.close();
    app = await buildApp(env);

    const feedback = await app.inject({
      method: "POST",
      url: `/coach/messages/${assistant.id}/feedback`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        label: "unhelpful",
        reason: "这次建议反而把我带偏了。",
      },
    });

    expect(feedback.statusCode).toBe(200);
    expect(feedback.json().label).toBe("unhelpful");

    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    const reloadedMemory = reloaded.listCoachMemoryItems("coach-user").find((item) => item.id === memory.id);
    const training = reloaded.listCoachTrainingExamples("coach-user").find((item) => item.sourceMessageId === assistant.id);

    expect(reloadedMemory?.status).toBe("revoked");
    expect(training?.status).toBe("invalidated");
    expect(reloaded.listRecentTraceLogEventsByEvent("coach.feedback.applied", 10).length).toBeGreaterThan(0);

    const reloadedMessage = reloaded.getCoachMessage("coach-user", assistant.id);
    expect(reloadedMessage?.conversationPath).toEqual(
      expect.objectContaining({
        revokedMemoryCount: 1,
      }),
    );
  });

  it("turns helpful feedback into a memory-strengthening candidate proposal", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "helpful-strengthening",
      status: "active",
    });
    await store.saveCoachFrontAgentState({
      userId: "coach-user",
      currentFrontAgent: "companion-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: null,
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard routed this turn to companion-agent.",
    });
    const memory = await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "preference",
      summary: "用户更适合短句、明确的下一步。",
      confidence: 0.82,
      status: "active",
      sourceMessageId: "source-message",
      sourceExcerpt: "历史偏好摘要",
      lastUsedAt: null,
      revokedAt: null,
    });
    const assistant = await store.createCoachMessage({
      userId: "coach-user",
      sessionId: session.id,
      role: "assistant",
      status: "completed",
      userText: null,
      fastResponse: "先收窄成一个最小下一步。",
      fullResponse: "先收窄成一个最小下一步，再继续。",
      usedMemoryIds: [memory.id],
      traceId: "trace-feedback-helpful",
      errorCode: null,
    });
    await app.close();
    app = await buildApp(env);

    const feedback = await app.inject({
      method: "POST",
      url: `/coach/messages/${assistant.id}/feedback`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        label: "helpful",
        reason: "这次建议很贴合我当前的节奏。",
      },
    });

    expect(feedback.statusCode).toBe(200);
    expect(feedback.json().label).toBe("helpful");

    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    const candidates = reloaded.listMemoryCandidates("coach-user");
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]).toEqual(
      expect.objectContaining({
        status: "candidate",
        sourceAgent: "companion-agent",
      }),
    );
    expect(candidates[0]?.summary).toContain("短句");
    expect(reloaded.listRecentTraceLogEventsByEvent("coach.feedback.strengthening.proposed", 10).length).toBeGreaterThan(0);
  });

  it("reuses helpful-feedback strengthening candidates as lightweight hints on a later similar turn", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "helpful-strengthening-recall",
      status: "active",
    });
    await store.saveCoachFrontAgentState({
      userId: "coach-user",
      currentFrontAgent: "companion-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: null,
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard routed this turn to companion-agent.",
    });
    const memory = await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "preference",
      summary: "用户更适合短句、明确的下一步。",
      confidence: 0.82,
      status: "active",
      sourceMessageId: "source-message",
      sourceExcerpt: "历史偏好摘要",
      lastUsedAt: null,
      revokedAt: null,
    });
    const assistant = await store.createCoachMessage({
      userId: "coach-user",
      sessionId: session.id,
      role: "assistant",
      status: "completed",
      userText: null,
      fastResponse: "先收窄成一个最小下一步。",
      fullResponse: "先收窄成一个最小下一步，再继续。",
      usedMemoryIds: [memory.id],
      traceId: "trace-feedback-helpful-recall",
      errorCode: null,
    });
    await app.close();
    app = await buildApp(env);

    const feedback = await app.inject({
      method: "POST",
      url: `/coach/messages/${assistant.id}/feedback`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        label: "helpful",
        reason: "这次建议很贴合我当前的节奏。",
      },
    });

    expect(feedback.statusCode).toBe(200);

    const nextTurn = await app.inject({
      method: "POST",
      url: `/coach/sessions/${session.id}/messages`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        text: "我现在还是有点乱，想要一个温和但明确的下一步。",
      },
    });

    expect(nextTurn.statusCode).toBe(200);

    let reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    let strengtheningEvents = reloaded
      .listTraceLogEvents(nextTurn.json().traceId)
      .filter((event) => event.event === "coach.feedback.strengthening.recalled");

    for (let attempt = 0; attempt < 20 && strengtheningEvents.length === 0; attempt += 1) {
      await sleep(25);
      reloaded = new MindAnchorStore(env.dataFile);
      await reloaded.init();
      strengtheningEvents = reloaded
        .listTraceLogEvents(nextTurn.json().traceId)
        .filter((event) => event.event === "coach.feedback.strengthening.recalled");
    }

    expect(strengtheningEvents.length).toBeGreaterThan(0);
    expect(strengtheningEvents[0]?.metadata).toEqual(
      expect.objectContaining({
        userId: "coach-user",
        candidateCount: expect.any(Number),
      }),
    );
    expect(Number(strengtheningEvents[0]?.metadata?.candidateCount ?? 0)).toBeGreaterThan(0);
  });

  it("weakens recalled helpful-feedback strengthening candidates after later unhelpful feedback", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "helpful-strengthening-weaken",
      status: "active",
    });
    await store.saveCoachFrontAgentState({
      userId: "coach-user",
      currentFrontAgent: "companion-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: null,
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard routed this turn to companion-agent.",
    });
    const memory = await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "preference",
      summary: "用户更适合短句、明确的下一步。",
      confidence: 0.82,
      status: "active",
      sourceMessageId: "source-message",
      sourceExcerpt: "历史偏好摘要",
      lastUsedAt: null,
      revokedAt: null,
    });
    const assistant = await store.createCoachMessage({
      userId: "coach-user",
      sessionId: session.id,
      role: "assistant",
      status: "completed",
      userText: null,
      fastResponse: "先收窄成一个最小下一步。",
      fullResponse: "先收窄成一个最小下一步，再继续。",
      usedMemoryIds: [memory.id],
      traceId: "trace-feedback-helpful-weaken",
      errorCode: null,
    });
    await app.close();
    app = await buildApp(env);

    const helpful = await app.inject({
      method: "POST",
      url: `/coach/messages/${assistant.id}/feedback`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        label: "helpful",
        reason: "这次建议很贴合我当前的节奏。",
      },
    });

    expect(helpful.statusCode).toBe(200);

    const recallTurn = await app.inject({
      method: "POST",
      url: `/coach/sessions/${session.id}/messages`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        text: "我现在还是有点乱，想要一个温和但明确的下一步。",
      },
    });

    expect(recallTurn.statusCode).toBe(200);

    const unhelpful = await app.inject({
      method: "POST",
      url: `/coach/messages/${recallTurn.json().assistantMessage.id}/feedback`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        label: "unhelpful",
        reason: "这次强化出来的方向不太对。",
      },
    });

    expect(unhelpful.statusCode).toBe(200);

    let reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    const weakenedEvents = reloaded
      .listRecentTraceLogEventsByEvent("coach.feedback.strengthening.weakened", 10)
      .filter((event) => event.metadata?.messageId === recallTurn.json().assistantMessage.id);
    const pendingCandidates = reloaded.listPendingMemoryCandidates("coach-user");

    expect(weakenedEvents.length).toBeGreaterThan(0);
    expect(Number(weakenedEvents[0]?.metadata?.rejectedCandidateCount ?? 0)).toBeGreaterThan(0);
    expect(pendingCandidates).toHaveLength(0);

    const finalTurn = await app.inject({
      method: "POST",
      url: `/coach/sessions/${session.id}/messages`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        text: "再给我一个下一步，但别沿着刚才那种方式。",
      },
    });

    expect(finalTurn.statusCode).toBe(200);

    reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    const finalTraceEvents = reloaded
      .listTraceLogEvents(finalTurn.json().traceId)
      .filter((event) => event.event === "coach.feedback.strengthening.recalled");

    expect(finalTraceEvents).toHaveLength(0);
  });

  it("filters stale helpful-feedback strengthening candidates out of later recall and records why", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "helpful-strengthening-stale-filter",
      status: "active",
    });
    await store.saveCoachFrontAgentState({
      userId: "coach-user",
      currentFrontAgent: "companion-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: null,
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard routed this turn to companion-agent.",
    });
    const memory = await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "preference",
      summary: "用户更适合短句、明确的下一步。",
      confidence: 0.82,
      status: "active",
      sourceMessageId: "source-message",
      sourceExcerpt: "历史偏好摘要",
      lastUsedAt: null,
      revokedAt: null,
    });
    const assistant = await store.createCoachMessage({
      userId: "coach-user",
      sessionId: session.id,
      role: "assistant",
      status: "completed",
      userText: null,
      fastResponse: "先收窄成一个最小下一步。",
      fullResponse: "先收窄成一个最小下一步，再继续。",
      usedMemoryIds: [memory.id],
      traceId: "trace-feedback-helpful-stale",
      errorCode: null,
    });
    await app.close();
    app = await buildApp(env);

    const feedback = await app.inject({
      method: "POST",
      url: `/coach/messages/${assistant.id}/feedback`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        label: "helpful",
        reason: "这次建议当时是对的，但不该长期绑死后续风格。",
      },
    });

    expect(feedback.statusCode).toBe(200);

    await app.close();
    let snapshot: { coachMessages: Array<{ id: string; createdAt: string; updatedAt: string }> } | null = null;
    for (let attempt = 0; attempt < 20 && snapshot === null; attempt += 1) {
      try {
        snapshot = JSON.parse(await readFile(env.dataFile, "utf8"));
      } catch {
        await sleep(10);
      }
    }
    expect(snapshot).not.toBeNull();
    const staleCreatedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const assistantMessage = snapshot!.coachMessages.find((item: { id: string }) => item.id === assistant.id);
    assistantMessage.createdAt = staleCreatedAt;
    assistantMessage.updatedAt = staleCreatedAt;
    await writeFile(env.dataFile, JSON.stringify(snapshot, null, 2));
    app = await buildApp(env);

    const nextTurn = await app.inject({
      method: "POST",
      url: `/coach/sessions/${session.id}/messages`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        text: "我现在还是有点乱，想要一个温和但明确的下一步。",
      },
    });

    expect(nextTurn.statusCode).toBe(200);

    let reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    const traceEvents = reloaded.listTraceLogEvents(nextTurn.json().traceId);
    const recalledEvents = traceEvents.filter((event) => event.event === "coach.feedback.strengthening.recalled");
    const filteredEvents = traceEvents.filter((event) => event.event === "coach.feedback.strengthening.filtered");

    expect(recalledEvents).toHaveLength(0);
    expect(filteredEvents).toHaveLength(1);
    expect(filteredEvents[0]?.metadata).toEqual(
      expect.objectContaining({
        userId: "coach-user",
        staleCandidateCount: 1,
        missingSourceMessageCount: 0,
        candidateCount: 0,
      }),
    );
  });

  it("filters helpful-feedback strengthening candidates with missing source messages and records why", async () => {
    const session = await store.createCoachSession({
      userId: "coach-user",
      title: "helpful-strengthening-missing-source-filter",
      status: "active",
    });
    await store.saveCoachFrontAgentState({
      userId: "coach-user",
      currentFrontAgent: "companion-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: null,
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard routed this turn to companion-agent.",
    });
    await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "preference",
      summary: "用户更适合短句、明确的下一步。",
      confidence: 0.82,
      status: "active",
      sourceMessageId: "source-message",
      sourceExcerpt: "历史偏好摘要",
      lastUsedAt: null,
      revokedAt: null,
    });
    await store.createMemoryCandidate({
      userId: "coach-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "companion-agent",
      sourceTurnRef: "feedback-helpful:preferences:missing-assistant-message",
      summary: "用户更适合短句、明确的下一步。",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });
    await app.close();
    app = await buildApp(env);

    const nextTurn = await app.inject({
      method: "POST",
      url: `/coach/sessions/${session.id}/messages`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        text: "我现在还是有点乱，想要一个温和但明确的下一步。",
      },
    });

    expect(nextTurn.statusCode).toBe(200);

    let reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    const traceEvents = reloaded.listTraceLogEvents(nextTurn.json().traceId);
    const recalledEvents = traceEvents.filter((event) => event.event === "coach.feedback.strengthening.recalled");
    const filteredEvents = traceEvents.filter((event) => event.event === "coach.feedback.strengthening.filtered");

    expect(recalledEvents).toHaveLength(0);
    expect(filteredEvents).toHaveLength(1);
    expect(filteredEvents[0]?.metadata).toEqual(
      expect.objectContaining({
        userId: "coach-user",
        staleCandidateCount: 0,
        missingSourceMessageCount: 1,
        candidateCount: 0,
      }),
    );
  });

  it("lists and revokes conversation coach memory for the authenticated user", async () => {
    const memory = await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "preference",
      summary: "用户更偏好先收窄问题，再决定下一步。",
      confidence: 0.91,
      status: "active",
      sourceMessageId: "message-1",
      sourceExcerpt: "来自一次关于卡顿时如何重新启动的摘要。",
      lastUsedAt: null,
      revokedAt: null,
    });
    await app.close();
    app = await buildApp(env);

    const listed = await app.inject({
      method: "GET",
      url: "/coach/memories",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(listed.statusCode).toBe(200);
    expect(listed.json()).toHaveLength(1);

    const deleted = await app.inject({
      method: "DELETE",
      url: `/coach/memories/${memory.id}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(deleted.statusCode).toBe(200);
    expect(deleted.json().status).toBe("revoked");

    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listRecentTraceLogEventsByEvent("coach.memory.revoked", 10).length).toBeGreaterThan(0);
  });

  it("returns 404 for owner mismatch and rejects explicit userId in request bodies", async () => {
    const session = await store.createCoachSession({
      userId: "other-user",
      title: "private",
      status: "active",
    });
    const memory = await store.createCoachMemoryItem({
      userId: "other-user",
      kind: "preference",
      summary: "别串用户",
      confidence: 0.7,
      status: "active",
      sourceMessageId: "message-1",
      sourceExcerpt: "摘要",
      lastUsedAt: null,
      revokedAt: null,
    });
    await app.close();
    app = await buildApp(env);

    const wrongOwner = await app.inject({
      method: "GET",
      url: `/coach/sessions/${session.id}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(wrongOwner.statusCode).toBe(404);

    const wrongOwnerMemory = await app.inject({
      method: "DELETE",
      url: `/coach/memories/${memory.id}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(wrongOwnerMemory.statusCode).toBe(404);

    const explicitUserId = await app.inject({
      method: "POST",
      url: "/coach/sessions",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        title: "bad",
        userId: "evil-user",
      },
    });

    expect(explicitUserId.statusCode).toBe(400);
  });

  it("emits coach trace events without storing raw user text", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/coach/sessions",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        title: "trace-check",
      },
    });

    const sent = await app.inject({
      method: "POST",
      url: `/coach/sessions/${created.json().id}/messages`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        text: "我今天一直很乱，而且在现实压力和情绪之间来回切换。",
      },
    });

    expect(sent.statusCode).toBe(200);
    let reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    let events = reloaded.listTraceLogEvents(sent.json().traceId);
    let eventNames = events.map((event) => event.event);
    for (let attempt = 0; attempt < 20 && !eventNames.includes("coach.message.full.completed"); attempt += 1) {
      await sleep(25);
      reloaded = new MindAnchorStore(env.dataFile);
      await reloaded.init();
      events = reloaded.listTraceLogEvents(sent.json().traceId);
      eventNames = events.map((event) => event.event);
    }
    const sessionEvents = reloaded.listRecentTraceLogEventsByEvent("coach.session.created", 10);

    expect(sessionEvents.some((event) => event.metadata?.sessionId === created.json().id)).toBe(true);
    expect(eventNames).toContain("coach.message.fast.started");
    expect(eventNames).toContain("coach.message.fast.completed");
    expect(eventNames).toContain("coach.message.full.started");
    expect(eventNames).toContain("coach.message.full.completed");
    expect(
      events.some((event) => JSON.stringify(event.metadata ?? {}).includes("我今天一直很乱")),
    ).toBe(false);
  });

  it("routes conversation coach fast/full generation through the local OpenClaw cluster when enabled", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    await runtime.start();

    try {
      const address = runtime.server.address() as AddressInfo;
      env.agentMode = "openai-compatible";
      env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;
      await store.createCoachMemoryItem({
        userId: "coach-user",
        kind: "preference",
        summary: "用户更适合明确的最小下一步",
        confidence: 0.9,
        status: "active",
        sourceMessageId: "memory-source",
        sourceExcerpt: "来自既有对话的安全摘要。",
        lastUsedAt: null,
        revokedAt: null,
      });
      await app.close();
      app = await buildApp(env);
      const sessionResponse = await app.inject({
        method: "POST",
        url: "/coach/sessions",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
        payload: {
          title: "cluster-route",
        },
      });

      expect(sessionResponse.statusCode).toBe(200);

      const response = await app.inject({
        method: "POST",
        url: `/coach/sessions/${sessionResponse.json().id}/messages`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
        payload: {
          text: "我现在压力很大，也很乱，心里很慌。",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().assistantMessage.status).toBe("pending_full");
      expect(response.json().frontAgentState).toEqual(
        expect.objectContaining({
          currentFrontAgent: expect.any(String),
          routingMode: expect.any(String),
          manualOverride: expect.any(Boolean),
        }),
      );
      expect(response.json().assistantMessage.fastResponse).toContain("最小下一步");
      expect(response.json().assistantMessage.fullResponse).toBeNull();
      expect(response.json().assistantMessage.usedMemoryIds).toHaveLength(1);
      expect(response.json().assistantMessage.usedMemoryEntries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            summary: expect.any(String),
            kind: expect.any(String),
            source: expect.any(String),
          }),
        ]),
      );
      expect(
        response.json().assistantMessage.usedMemoryEntries.some(
          (entry: { source: string }) => entry.source === "coach-memory",
        ),
      ).toBe(true);

      let fetchedMessage = response.json().assistantMessage;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await sleep(25);
        const fetched = await app.inject({
          method: "GET",
          url: `/coach/messages/${response.json().assistantMessage.id}`,
          headers: {
            Authorization: "Bearer dev:coach-user:coach@example.com",
          },
        });
        expect(fetched.statusCode).toBe(200);
        fetchedMessage = fetched.json();
        if (fetchedMessage.status === "completed") {
          break;
        }
      }

      expect(fetchedMessage.status).toBe("completed");
      expect(fetchedMessage.fullResponse).toContain("参考框架");
      expect(fetchedMessage.fullResponse).toContain("安抚偏好");
      expect(fetchedMessage.usedMemoryEntries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            summary: expect.any(String),
            kind: expect.any(String),
            source: expect.any(String),
          }),
        ]),
      );

      const dashboard = await app.inject({
        method: "GET",
        url: "/dashboard/summary",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(dashboard.statusCode).toBe(200);
      expect(dashboard.json().coachFrontAgent.currentFrontAgent).toBe("companion-agent");
      expect(dashboard.json().coachFrontAgent.visibleSummary).toContain("Picard");

      const reloaded = new MindAnchorStore(env.dataFile);
      await reloaded.init();
      const recalledMemories = reloaded.listCoachMemoryItems("coach-user");
      expect(recalledMemories.filter((item) => item.status === "active").length).toBeGreaterThanOrEqual(1);

      const adapter = await app.inject({
        method: "GET",
        url: "/debug/openclaw/adapter",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(adapter.statusCode).toBe(200);
      expect(
        adapter
          .json()
          .recentTimeline.some((decision: { target: string; route: string }) => decision.target === "companion-agent" && decision.route === "cluster"),
      ).toBe(true);
      expect(
        adapter
          .json()
          .recentTimeline.some((decision: { target: string; route: string }) => decision.target === "companion-agent" && decision.route === "cluster"),
      ).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) => {
        runtime.server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("compresses usedMemoryEntries into a stable high-signal order for explainability", async () => {
    await store.saveCoachFrontAgentState({
      userId: "coach-user",
      currentFrontAgent: "director-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: null,
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard is currently coordinating the team.",
    });

    await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "preference",
      summary: "用户偏好短句、明确下一步。",
      confidence: 0.95,
      status: "active",
      sourceMessageId: "memory-source-1",
      sourceExcerpt: "偏好摘要 1",
      lastUsedAt: null,
      revokedAt: null,
    });
    await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "work_style",
      summary: "高压时更适合一次只推进一个动作。",
      confidence: 0.92,
      status: "active",
      sourceMessageId: "memory-source-2",
      sourceExcerpt: "工作方式摘要 2",
      lastUsedAt: null,
      revokedAt: null,
    });
    await store.createCoachMemoryItem({
      userId: "coach-user",
      kind: "preference",
      summary: "更容易接受先定最小下一步，再展开计划。",
      confidence: 0.9,
      status: "active",
      sourceMessageId: "memory-source-3",
      sourceExcerpt: "偏好摘要 3",
      lastUsedAt: null,
      revokedAt: null,
    });

    const constraintA = await store.createMemoryCandidate({
      userId: "coach-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "analyst-agent",
      sourceTurnRef: "constraint-turn-1",
      summary: "本周会议负载偏高，连续大块专注时间有限。",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });
    await store.acceptMemoryCandidate(constraintA.candidateId);

    const constraintB = await store.createMemoryCandidate({
      userId: "coach-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "analyst-agent",
      sourceTurnRef: "constraint-turn-2",
      summary: "下午三点后更容易疲劳，长链任务成功率下降。",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });
    await store.acceptMemoryCandidate(constraintB.candidateId);

    await app.close();
    app = await buildApp(env);

    const sessionResponse = await app.inject({
      method: "POST",
      url: "/coach/sessions",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        title: "used-memory-compaction",
      },
    });

    expect(sessionResponse.statusCode).toBe(200);

    const response = await app.inject({
      method: "POST",
      url: `/coach/sessions/${sessionResponse.json().id}/messages`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        text: "我现在有点乱，先帮我收一下。",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().assistantMessage.usedMemoryEntries).toHaveLength(4);
    expect(response.json().assistantMessage.usedMemoryEntries.map((entry: { source: string }) => entry.source)).toEqual([
      "coach-memory",
      "coach-memory",
      "gateway-memory",
      "front-agent-state",
    ]);
  });

  it("executes a real consulted-agent step for mixed emotional and analytical turns", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    await runtime.start();

    try {
      const address = runtime.server.address() as AddressInfo;
      env.agentMode = "openai-compatible";
      env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;

      const candidate = await store.createMemoryCandidate({
        userId: "coach-user",
        memoryId: null,
        status: "candidate",
        sourceAgent: "analyst-agent",
        sourceTurnRef: "turn-mixed-constraint-memory",
        summary: "当前外部沟通负载偏高，连续推进长链任务会更吃力。",
        effectiveAt: null,
        recallBlockedAt: null,
        deletedAt: null,
      });
      await store.acceptMemoryCandidate(candidate.candidateId);
      await app.close();
      app = await buildApp(env);

      const sessionResponse = await app.inject({
        method: "POST",
        url: "/coach/sessions",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
        payload: {
          title: "mixed-route",
        },
      });

      expect(sessionResponse.statusCode).toBe(200);

      const response = await app.inject({
        method: "POST",
        url: `/coach/sessions/${sessionResponse.json().id}/messages`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
        payload: {
          text: "我现在情绪很乱，也想冷静分析一下现实上到底该怎么办。",
        },
      });

      expect(response.statusCode).toBe(200);

      let fetchedMessage = response.json().assistantMessage;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await sleep(25);
        const fetched = await app.inject({
          method: "GET",
          url: `/coach/messages/${response.json().assistantMessage.id}`,
          headers: {
            Authorization: "Bearer dev:coach-user:coach@example.com",
          },
        });
        expect(fetched.statusCode).toBe(200);
        fetchedMessage = fetched.json();
        if (fetchedMessage.status === "completed") {
          break;
        }
      }

      expect(fetchedMessage.status).toBe("completed");
      expect(fetchedMessage.fullResponse).toContain("现实约束");

      const dashboard = await app.inject({
        method: "GET",
        url: "/dashboard/summary",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(dashboard.statusCode).toBe(200);
      expect(dashboard.json().coachFrontAgent.currentFrontAgent).toBe("companion-agent");
      expect(dashboard.json().coachFrontAgent.consultedAgent).toBe("analyst-agent");

      const reloaded = new MindAnchorStore(env.dataFile);
      await reloaded.init();
      const traceId = response.json().traceId as string;
      const events = reloaded.listTraceLogEvents(traceId).map((event) => event.event);

      expect(events).toContain("coach.consult.started");
      expect(events).toContain("coach.consult.completed");

      const adapter = await app.inject({
        method: "GET",
        url: "/debug/openclaw/adapter",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(adapter.statusCode).toBe(200);
      expect(
        adapter
          .json()
          .recentTimeline.some((decision: { target: string; route: string; workflow?: string }) => decision.target === "analyst-agent" && decision.route === "cluster"),
      ).toBe(true);

      const traceLookup = await app.inject({
        method: "GET",
        url: `/debug/traces/${traceId}`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(traceLookup.statusCode).toBe(200);
      expect(traceLookup.json().summary).toEqual(
        expect.objectContaining({
          conversationPath: expect.objectContaining({
            frontAgent: "companion-agent",
            consultedAgent: "analyst-agent",
            usedOpenClaw: true,
            hadFallback: false,
          }),
        }),
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        runtime.server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("retries a mixed turn through the same consulted-agent conversation lane", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    await runtime.start();

    try {
      const address = runtime.server.address() as AddressInfo;
      env.agentMode = "openai-compatible";
      env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;

      const candidate = await store.createMemoryCandidate({
        userId: "coach-user",
        memoryId: null,
        status: "candidate",
        sourceAgent: "analyst-agent",
        sourceTurnRef: "turn-retry-mixed-constraint-memory",
        summary: "当前外部沟通负载偏高，连续推进长链任务会更吃力。",
        effectiveAt: null,
        recallBlockedAt: null,
        deletedAt: null,
      });
      await store.acceptMemoryCandidate(candidate.candidateId);

      const session = await store.createCoachSession({
        userId: "coach-user",
        title: "retry-mixed-route",
        status: "active",
      });
      await store.createCoachMessage({
        userId: "coach-user",
        sessionId: session.id,
        role: "user",
        status: "completed",
        userText: "我现在情绪很乱，也想冷静分析一下现实上到底该怎么办。",
        fastResponse: null,
        fullResponse: null,
        usedMemoryIds: [],
        usedMemoryEntries: [],
        traceId: "trace-retry-user",
        errorCode: null,
      });
      const failedAssistant = await store.createCoachMessage({
        userId: "coach-user",
        sessionId: session.id,
        role: "assistant",
        status: "failed",
        userText: null,
        fastResponse: null,
        fullResponse: null,
        usedMemoryIds: [],
        usedMemoryEntries: [],
        traceId: "trace-retry-assistant",
        errorCode: "coach_generation_failed",
      });

      await app.close();
      app = await buildApp(env);

      const retried = await app.inject({
        method: "POST",
        url: `/coach/messages/${failedAssistant.id}/retry`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(retried.statusCode).toBe(200);
      expect(retried.json().assistantMessage.status).toBe("pending_full");
      expect(retried.json().assistantMessage.fullResponse).toBeNull();

      const traceId = retried.json().traceId as string;
      let fetchedMessage = retried.json().assistantMessage;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await sleep(25);
        const fetched = await app.inject({
          method: "GET",
          url: `/coach/messages/${retried.json().assistantMessage.id}`,
          headers: {
            Authorization: "Bearer dev:coach-user:coach@example.com",
          },
        });
        expect(fetched.statusCode).toBe(200);
        fetchedMessage = fetched.json();
        if (fetchedMessage.status === "completed") {
          break;
        }
      }

      expect(fetchedMessage.status).toBe("completed");
      expect(fetchedMessage.fullResponse).toContain("现实约束");

      const reloaded = new MindAnchorStore(env.dataFile);
      await reloaded.init();
      const events = reloaded.listTraceLogEvents(traceId).map((event) => event.event);

      expect(events).toContain("coach.consult.started");
      expect(events).toContain("coach.consult.completed");
      expect(events).toContain("coach.message.full.started");

      const adapter = await app.inject({
        method: "GET",
        url: "/debug/openclaw/adapter",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(adapter.statusCode).toBe(200);
      expect(
        adapter
          .json()
          .recentTimeline.some((decision: { target: string; route: string; workflow?: string }) => decision.target === "analyst-agent" && decision.route === "cluster"),
      ).toBe(true);

      const traceLookup = await app.inject({
        method: "GET",
        url: `/debug/traces/${traceId}`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(traceLookup.statusCode).toBe(200);
      expect(traceLookup.json().summary).toEqual(
        expect.objectContaining({
          conversationPath: expect.objectContaining({
            frontAgent: "companion-agent",
            consultedAgent: "analyst-agent",
            usedOpenClaw: true,
          }),
        }),
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        runtime.server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("feeds Gateway constraint memory into analytical coach full responses through the OpenClaw memory bundle", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    await runtime.start();

    try {
      const address = runtime.server.address() as AddressInfo;
      env.agentMode = "openai-compatible";
      env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;

      const candidate = await store.createMemoryCandidate({
        userId: "coach-user",
        memoryId: null,
        status: "candidate",
        sourceAgent: "analyst-agent",
        sourceTurnRef: "turn-constraint-memory",
        summary: "本周会议负载偏高，连续大块专注时间有限。",
        effectiveAt: null,
        recallBlockedAt: null,
        deletedAt: null,
      });
      await store.acceptMemoryCandidate(candidate.candidateId);

      await app.close();
      app = await buildApp(env);

      const sessionResponse = await app.inject({
        method: "POST",
        url: "/coach/sessions",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
        payload: {
          title: "constraint-memory-route",
        },
      });

      expect(sessionResponse.statusCode).toBe(200);

      const response = await app.inject({
        method: "POST",
        url: `/coach/sessions/${sessionResponse.json().id}/messages`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
        payload: {
          text: "请帮我分析一下现实约束，给我一个更理性的判断。",
        },
      });

      expect(response.statusCode).toBe(200);

      let fetchedMessage = response.json().assistantMessage;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await sleep(25);
        const fetched = await app.inject({
          method: "GET",
          url: `/coach/messages/${response.json().assistantMessage.id}`,
          headers: {
            Authorization: "Bearer dev:coach-user:coach@example.com",
          },
        });
        expect(fetched.statusCode).toBe(200);
        fetchedMessage = fetched.json();
        if (fetchedMessage.status === "completed") {
          break;
        }
      }

      expect(fetchedMessage.status).toBe("completed");
      expect(fetchedMessage.fullResponse).toContain("会议负载偏高");
      expect(fetchedMessage.fullResponse).toContain("现实约束");
    } finally {
      await new Promise<void>((resolve, reject) => {
        runtime.server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("executes a Jarvis authority handoff inside the conversation chain for planning intents", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    await runtime.start();

    try {
      const address = runtime.server.address() as AddressInfo;
      env.agentMode = "openai-compatible";
      env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;

      const goal = await store.createGoal({
        userId: "coach-user",
        title: "稳定今天的任务顺序",
      });
      const taskA = await store.createTask({
        userId: "coach-user",
        goalId: goal.id,
        title: "收邮箱",
        priority: "medium",
        sortOrder: 0,
      });
      const taskB = await store.createTask({
        userId: "coach-user",
        goalId: goal.id,
        title: "深度工作",
        priority: "high",
        sortOrder: 1,
      });
      const candidate = await store.createMemoryCandidate({
        userId: "coach-user",
        memoryId: null,
        status: "candidate",
        sourceAgent: "life-secretary-agent",
        sourceTurnRef: "turn-jarvis-constraint-memory",
        summary: "今天下午只有一小时可自由安排。",
        effectiveAt: null,
        recallBlockedAt: null,
        deletedAt: null,
      });
      await store.acceptMemoryCandidate(candidate.candidateId);

      await app.close();
      app = await buildApp(env);

      const sessionResponse = await app.inject({
        method: "POST",
        url: "/coach/sessions",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
        payload: {
          title: "jarvis-handoff",
        },
      });

      expect(sessionResponse.statusCode).toBe(200);

      const response = await app.inject({
        method: "POST",
        url: `/coach/sessions/${sessionResponse.json().id}/messages`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
        payload: {
          text: "请帮我把今天任务重新排序，把深度工作提前。",
        },
      });

      expect(response.statusCode).toBe(200);

      let fetchedMessage = response.json().assistantMessage;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await sleep(25);
        const fetched = await app.inject({
          method: "GET",
          url: `/coach/messages/${response.json().assistantMessage.id}`,
          headers: {
            Authorization: "Bearer dev:coach-user:coach@example.com",
          },
        });
        expect(fetched.statusCode).toBe(200);
        fetchedMessage = fetched.json();
        if (fetchedMessage.status === "completed") {
          break;
        }
      }

      expect(fetchedMessage.status).toBe("completed");
      expect(fetchedMessage.fullResponse).toContain("计划约束");

      const dashboard = await app.inject({
        method: "GET",
        url: "/dashboard/summary",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(dashboard.statusCode).toBe(200);
      expect(dashboard.json().coachFrontAgent.currentFrontAgent).toBe("life-secretary-agent");

      const reloaded = new MindAnchorStore(env.dataFile);
      await reloaded.init();
      expect(reloaded.listPlanChangeCommandLogs("coach-user")).toHaveLength(1);
      expect(reloaded.listTasks("coach-user", goal.id).map((task) => task.id).sort()).toEqual([taskA.id, taskB.id].sort());

      const events = reloaded.listTraceLogEvents(response.json().traceId).map((event) => event.event);
      expect(events).toContain("coach.authority.handoff.started");
      expect(events).toContain("coach.authority.handoff.completed");

      const adapter = await app.inject({
        method: "GET",
        url: "/debug/openclaw/adapter",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(adapter.statusCode).toBe(200);
      expect(
        adapter
          .json()
          .recentTimeline.some((decision: { target: string; route: string; workflow?: string }) => decision.target === "life-secretary-agent" && decision.route === "cluster"),
      ).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) => {
        runtime.server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("executes a Data authority handoff inside the conversation chain for memory governance intents", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    await runtime.start();

    try {
      const address = runtime.server.address() as AddressInfo;
      env.agentMode = "openai-compatible";
      env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;

      await store.createCoachMemoryItem({
        userId: "coach-user",
        kind: "preference",
        summary: "用户偏好短句、明确下一步。",
        confidence: 0.9,
        status: "active",
        sourceMessageId: "coach-memory-source",
        sourceExcerpt: "来自既有对话的长期偏好摘要。",
        lastUsedAt: null,
        revokedAt: null,
      });
      const candidate = await store.createMemoryCandidate({
        userId: "coach-user",
        memoryId: null,
        status: "candidate",
        sourceAgent: "companion-agent",
        sourceTurnRef: "turn-memory-1",
        summary: "用户偏好短句、明确下一步。",
        effectiveAt: null,
        recallBlockedAt: null,
        deletedAt: null,
      });
      await store.acceptMemoryCandidate(candidate.candidateId);

      await app.close();
      app = await buildApp(env);

      const sessionResponse = await app.inject({
        method: "POST",
        url: "/coach/sessions",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
        payload: {
          title: "data-handoff",
        },
      });

      expect(sessionResponse.statusCode).toBe(200);

      const response = await app.inject({
        method: "POST",
        url: `/coach/sessions/${sessionResponse.json().id}/messages`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
        payload: {
          text: "请忘记我偏好短句这条记忆。",
        },
      });

      expect(response.statusCode).toBe(200);

      let fetchedMessage = response.json().assistantMessage;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        await sleep(25);
        const fetched = await app.inject({
          method: "GET",
          url: `/coach/messages/${response.json().assistantMessage.id}`,
          headers: {
            Authorization: "Bearer dev:coach-user:coach@example.com",
          },
        });
        expect(fetched.statusCode).toBe(200);
        fetchedMessage = fetched.json();
        if (fetchedMessage.status === "completed") {
          break;
        }
      }

      expect(fetchedMessage.status).toBe("completed");
      expect(fetchedMessage.fullResponse).toContain("治理目标");
      expect(fetchedMessage.conversationPath).toEqual(
        expect.objectContaining({
          authorityAgent: "memory-governor-agent",
          revokedMemoryCount: 1,
        }),
      );

      const dashboard = await app.inject({
        method: "GET",
        url: "/dashboard/summary",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(dashboard.statusCode).toBe(200);
      expect(dashboard.json().coachFrontAgent.currentFrontAgent).toBe("memory-governor-agent");

      const reloaded = new MindAnchorStore(env.dataFile);
      await reloaded.init();
      expect(reloaded.listRecallEligibleMemory("coach-user")).toHaveLength(0);
      expect(reloaded.listMemoryItems("coach-user")[0]?.status).toBe("deleted");
      expect(reloaded.listCoachMemoryItems("coach-user")[0]?.status).toBe("revoked");

      const events = reloaded.listTraceLogEvents(response.json().traceId).map((event) => event.event);
      expect(events).toContain("coach.authority.handoff.started");
      expect(events).toContain("coach.authority.handoff.completed");
      expect(reloaded.listRecentTraceLogEventsByEvent("coach.memory.revoked", 10).length).toBeGreaterThan(0);

      const adapter = await app.inject({
        method: "GET",
        url: "/debug/openclaw/adapter",
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });

      expect(adapter.statusCode).toBe(200);
      expect(
        adapter
          .json()
          .recentTimeline.some((decision: { target: string; route: string; workflow?: string }) => decision.target === "memory-governor-agent" && decision.route === "cluster"),
      ).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) => {
        runtime.server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
