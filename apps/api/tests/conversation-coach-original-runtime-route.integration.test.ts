import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

import { execFile } from "node:child_process";
import { buildApp } from "../src/app.js";
import type { AppEnv } from "../src/env.js";
import { MindAnchorStore } from "../src/store.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("conversation coach original runtime route bridge", () => {
  let dataDir = "";
  let env: AppEnv;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-coach-original-runtime-route-"));
    env = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
      agentMode: "openai-compatible",
      openClawBaseUrl: undefined,
      openClawOriginalRuntimeMode: "cli-local",
      openClawOriginalRuntimePath: "/Users/claw/.openclaw/bin/openclaw",
      openClawOriginalRuntimeProfile: "dev",
      openClawManagementActualPath: undefined,
      openClawManagementProfileHome: undefined,
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
        model: undefined,
        wireApi: "responses",
        reasoningEffort: "xhigh",
        disableResponseStorage: true,
      },
      agentModelConfigs: {},
    };
    app = await buildApp(env);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("uses original runtime Picard routing before front-agent generation", async () => {
    const mockedExec = vi.mocked(execFile);
    mockedExec.mockImplementation((...args: unknown[]) => {
      const commandArgs = args[1] as string[];
      const callback = args[args.length - 1] as (error: Error | null, stdout?: string, stderr?: string) => void;
      const agentIndex = commandArgs.indexOf("--agent");
      const agentId = agentIndex >= 0 ? commandArgs[agentIndex + 1] : "unknown";
      const messageIndex = commandArgs.indexOf("--message");
      const message = messageIndex >= 0 ? commandArgs[messageIndex + 1] : "";

      if (agentId === "director-agent" && message.includes("coach_conversation_route")) {
        callback(
          null,
          JSON.stringify({
            payloads: [
              {
                text: JSON.stringify({
                  routingOwner: "director-agent",
                  frontAgent: "companion-agent",
                  consultedAgent: null,
                  routingMode: "auto",
                  manualOverride: false,
                  handoffReason: null,
                  overrideSourceAgent: null,
                  reasoning: "Picard selected emotional containment first.",
                  visibleSummary: "Picard routed this turn to companion-agent.",
                }),
              },
            ],
            meta: { durationMs: 1000 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "companion-agent" && message.includes("coach_conversation_fast")) {
        callback(
          null,
          JSON.stringify({
            payloads: [{ text: JSON.stringify({ fastResponse: "先只做一个最小下一步。", status: "pending_full" }) }],
            meta: { durationMs: 1000 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "companion-agent" && message.includes("coach_conversation_full")) {
        callback(
          null,
          JSON.stringify({
            payloads: [{ text: JSON.stringify({ fastResponse: "先只做一个最小下一步。", fullResponse: "先稳住，再推进。", status: "completed" }) }],
            meta: { durationMs: 1000 },
          }),
          "",
        );
        return {} as never;
      }

      callback(new Error(`Unexpected original-runtime invocation for ${agentId}`), "", "");
      return {} as never;
    });

    const sessionResponse = await app.inject({
      method: "POST",
      url: "/coach/sessions",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        title: "original-runtime-route",
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
    expect(response.json().frontAgentState.currentFrontAgent).toBe("companion-agent");
    expect(response.json().frontAgentState.visibleSummary).toContain("Picard routed this turn to companion-agent");
    expect(response.json().assistantMessage.fastResponse).toContain("最小下一步");
    expect(response.json().assistantMessage.conversationPath.runtimeSource).toBe("original-runtime");

    let fetchedMessage = response.json().assistantMessage;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await sleep(25);
      const fetched = await app.inject({
        method: "GET",
        url: `/coach/messages/${response.json().assistantMessage.id}`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });
      fetchedMessage = fetched.json();
      if (fetchedMessage.status === "completed") {
        break;
      }
    }

    expect(fetchedMessage.status).toBe("completed");
    expect(fetchedMessage.conversationPath.runtimeSource).toBe("original-runtime");

    const traceId = response.json().traceId as string;
    const traceLookup = await app.inject({
      method: "GET",
      url: `/debug/traces/${traceId}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(traceLookup.statusCode).toBe(200);
    const matchingEvents = traceLookup
      .json()
      .events.filter((event: { event: string }) => event.event === "openclaw.original-runtime.request.succeeded");
    expect(matchingEvents.length).toBeGreaterThanOrEqual(2);
    expect(mockedExec.mock.calls.some((call) => (call[1] as string[]).includes("director-agent"))).toBe(true);
    expect(mockedExec.mock.calls.some((call) => (call[1] as string[]).includes("companion-agent"))).toBe(true);
  });

  it("uses original runtime for consult chain after Picard routing", async () => {
    const mockedExec = vi.mocked(execFile);
    mockedExec.mockImplementation((...args: unknown[]) => {
      const commandArgs = args[1] as string[];
      const callback = args[args.length - 1] as (error: Error | null, stdout?: string, stderr?: string) => void;
      const agentIndex = commandArgs.indexOf("--agent");
      const agentId = agentIndex >= 0 ? commandArgs[agentIndex + 1] : "unknown";
      const messageIndex = commandArgs.indexOf("--message");
      const message = messageIndex >= 0 ? commandArgs[messageIndex + 1] : "";

      if (agentId === "director-agent" && message.includes("coach_conversation_route")) {
        callback(
          null,
          JSON.stringify({
            payloads: [
              {
                text: JSON.stringify({
                  routingOwner: "director-agent",
                  frontAgent: "companion-agent",
                  consultedAgent: "analyst-agent",
                  routingMode: "auto",
                  manualOverride: false,
                  handoffReason: "mixed_emotion_and_analysis",
                  overrideSourceAgent: null,
                  reasoning: "Picard selected Deanna as front and asked Spock for one light consult.",
                  visibleSummary: "Picard routed this turn to companion-agent with analyst-agent consult.",
                }),
              },
            ],
            meta: { durationMs: 900 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "companion-agent" && message.includes("coach_conversation_fast")) {
        callback(
          null,
          JSON.stringify({
            payloads: [{ text: JSON.stringify({ fastResponse: "先把混乱收窄成一个最小判断点。", status: "pending_full" }) }],
            meta: { durationMs: 800 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "analyst-agent" && message.includes("coach_conversation_consult")) {
        callback(
          null,
          JSON.stringify({
            payloads: [{ text: JSON.stringify({ consultSummary: "现实上先确认今天最受限的一条约束，再决定是否继续推进。", status: "consulted" }) }],
            meta: { durationMs: 700 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "companion-agent" && message.includes("coach_conversation_full")) {
        callback(
          null,
          JSON.stringify({
            payloads: [
              {
                text: JSON.stringify({
                  fastResponse: "先把混乱收窄成一个最小判断点。",
                  fullResponse: "先稳住情绪，再按 Spock 的补充判断确认今天最受限的一条现实约束。",
                  status: "completed",
                }),
              },
            ],
            meta: { durationMs: 1000 },
          }),
          "",
        );
        return {} as never;
      }

      callback(new Error(`Unexpected original-runtime invocation for ${agentId}`), "", "");
      return {} as never;
    });

    const sessionResponse = await app.inject({
      method: "POST",
      url: "/coach/sessions",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        title: "original-runtime-consult",
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
        text: "我现在情绪很乱，但也想知道现实上到底先看哪一件事。",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().frontAgentState.currentFrontAgent).toBe("companion-agent");
    expect(response.json().frontAgentState.consultedAgent).toBe("analyst-agent");
    expect(response.json().assistantMessage.conversationPath.runtimeSource).toBe("original-runtime");

    let fetchedMessage = response.json().assistantMessage;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await sleep(25);
      const fetched = await app.inject({
        method: "GET",
        url: `/coach/messages/${response.json().assistantMessage.id}`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });
      fetchedMessage = fetched.json();
      if (fetchedMessage.status === "completed") {
        break;
      }
    }

    expect(fetchedMessage.status).toBe("completed");
    expect(fetchedMessage.fullResponse).toContain("现实约束");
    expect(fetchedMessage.conversationPath.runtimeSource).toBe("original-runtime");

    const traceLookup = await app.inject({
      method: "GET",
      url: `/debug/traces/${response.json().traceId}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(traceLookup.statusCode).toBe(200);
    const matchingEvents = traceLookup
      .json()
      .events.filter((event: { event: string }) => event.event === "openclaw.original-runtime.request.succeeded");
    expect(matchingEvents.some((event: { metadata?: { agentName?: string; workflow?: string } }) => event.metadata?.agentName === "director-agent" && event.metadata?.workflow === "coach_conversation_route")).toBe(true);
    expect(matchingEvents.some((event: { metadata?: { agentName?: string; workflow?: string } }) => event.metadata?.agentName === "analyst-agent" && event.metadata?.workflow === "coach_conversation_consult")).toBe(true);
    expect(matchingEvents.some((event: { metadata?: { agentName?: string; workflow?: string } }) => event.metadata?.agentName === "companion-agent" && event.metadata?.workflow === "coach_conversation_fast")).toBe(true);
    expect(matchingEvents.some((event: { metadata?: { agentName?: string; workflow?: string } }) => event.metadata?.agentName === "companion-agent" && event.metadata?.workflow === "coach_conversation_full")).toBe(true);
  });

  it("uses original runtime for Jarvis authority handoff", async () => {
    const store = new MindAnchorStore(env.dataFile);
    await store.init();
    const goal = await store.createGoal({
      userId: "coach-user",
      title: "稳住今天的计划",
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

    await app.close();
    app = await buildApp(env);

    const mockedExec = vi.mocked(execFile);
    mockedExec.mockImplementation((...args: unknown[]) => {
      const commandArgs = args[1] as string[];
      const callback = args[args.length - 1] as (error: Error | null, stdout?: string, stderr?: string) => void;
      const agentIndex = commandArgs.indexOf("--agent");
      const agentId = agentIndex >= 0 ? commandArgs[agentIndex + 1] : "unknown";
      const messageIndex = commandArgs.indexOf("--message");
      const message = messageIndex >= 0 ? commandArgs[messageIndex + 1] : "";

      if (agentId === "director-agent" && message.includes("coach_conversation_route")) {
        callback(
          null,
          JSON.stringify({
            payloads: [
              {
                text: JSON.stringify({
                  routingOwner: "director-agent",
                  frontAgent: "life-secretary-agent",
                  consultedAgent: null,
                  routingMode: "auto",
                  manualOverride: false,
                  handoffReason: "plan_write_needed",
                  overrideSourceAgent: null,
                  reasoning: "Picard selected Jarvis because the user asked for a concrete plan rearrangement.",
                  visibleSummary: "Picard routed this turn to life-secretary-agent.",
                }),
              },
            ],
            meta: { durationMs: 900 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "life-secretary-agent" && message.includes("coach_conversation_fast")) {
        callback(
          null,
          JSON.stringify({
            payloads: [{ text: JSON.stringify({ fastResponse: "我先帮你稳住顺序，只改今天最关键的两件事。", status: "pending_full" }) }],
            meta: { durationMs: 700 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "life-secretary-agent" && message.includes("plan_adjustment")) {
        callback(
          null,
          JSON.stringify({
            payloads: [
              {
                text: JSON.stringify({
                  authorityAgent: "life-secretary-agent",
                  targetKind: "task_order",
                  executionMode: "apply_direct",
                  orderedTaskIds: [taskB.id, taskA.id],
                  rationale: "先做高能量任务更稳。",
                  summary: "Jarvis 已将深度工作提前。",
                  beforeStateSummary: "邮箱在前，深度工作在后。",
                  afterStateSummary: "深度工作在前，邮箱在后。",
                  nextStep: "先开始 25 分钟深度工作。",
                  suggestedMinutes: 25,
                }),
              },
            ],
            meta: { durationMs: 950 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "life-secretary-agent" && message.includes("coach_conversation_full")) {
        callback(
          null,
          JSON.stringify({
            payloads: [
              {
                text: JSON.stringify({
                  fastResponse: "我先帮你稳住顺序，只改今天最关键的两件事。",
                  fullResponse: "我已经把深度工作提前；你现在先开始 25 分钟深度工作，再回头处理邮箱。",
                  status: "completed",
                }),
              },
            ],
            meta: { durationMs: 1000 },
          }),
          "",
        );
        return {} as never;
      }

      callback(new Error(`Unexpected original-runtime invocation for ${agentId}`), "", "");
      return {} as never;
    });

    const sessionResponse = await app.inject({
      method: "POST",
      url: "/coach/sessions",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        title: "original-runtime-jarvis",
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
    expect(response.json().frontAgentState.currentFrontAgent).toBe("life-secretary-agent");

    let fetchedMessage = response.json().assistantMessage;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await sleep(25);
      const fetched = await app.inject({
        method: "GET",
        url: `/coach/messages/${response.json().assistantMessage.id}`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });
      fetchedMessage = fetched.json();
      if (fetchedMessage.status === "completed") {
        break;
      }
    }

    expect(fetchedMessage.status).toBe("completed");
    expect(fetchedMessage.fullResponse).toContain("深度工作");

    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listPlanChangeCommandLogs("coach-user")).toHaveLength(1);

    const traceLookup = await app.inject({
      method: "GET",
      url: `/debug/traces/${response.json().traceId}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(traceLookup.statusCode).toBe(200);
    const matchingEvents = traceLookup
      .json()
      .events.filter((event: { event: string }) => event.event === "openclaw.original-runtime.request.succeeded");
    expect(matchingEvents.some((event: { metadata?: { agentName?: string; workflow?: string } }) => event.metadata?.agentName === "director-agent" && event.metadata?.workflow === "coach_conversation_route")).toBe(true);
    expect(matchingEvents.some((event: { metadata?: { agentName?: string; workflow?: string } }) => event.metadata?.agentName === "life-secretary-agent" && event.metadata?.workflow === "plan_adjustment")).toBe(true);
    expect(matchingEvents.some((event: { metadata?: { agentName?: string; workflow?: string } }) => event.metadata?.agentName === "life-secretary-agent" && event.metadata?.workflow === "coach_conversation_full")).toBe(true);
  });

  it("uses original runtime for Data governance handoff", async () => {
    const store = new MindAnchorStore(env.dataFile);
    await store.init();
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
    const recallTarget = store.listRecallEligibleMemory("coach-user")[0];

    await app.close();
    app = await buildApp(env);

    const mockedExec = vi.mocked(execFile);
    mockedExec.mockImplementation((...args: unknown[]) => {
      const commandArgs = args[1] as string[];
      const callback = args[args.length - 1] as (error: Error | null, stdout?: string, stderr?: string) => void;
      const agentIndex = commandArgs.indexOf("--agent");
      const agentId = agentIndex >= 0 ? commandArgs[agentIndex + 1] : "unknown";
      const messageIndex = commandArgs.indexOf("--message");
      const message = messageIndex >= 0 ? commandArgs[messageIndex + 1] : "";

      if (agentId === "director-agent" && message.includes("coach_conversation_route")) {
        callback(
          null,
          JSON.stringify({
            payloads: [
              {
                text: JSON.stringify({
                  routingOwner: "director-agent",
                  frontAgent: "memory-governor-agent",
                  consultedAgent: null,
                  routingMode: "auto",
                  manualOverride: false,
                  handoffReason: "memory_governance_requires_data",
                  overrideSourceAgent: null,
                  reasoning: "Picard selected Data because the user explicitly asked to forget a memory.",
                  visibleSummary: "Picard routed this turn to memory-governor-agent.",
                }),
              },
            ],
            meta: { durationMs: 900 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "memory-governor-agent" && message.includes("coach_conversation_fast")) {
        callback(
          null,
          JSON.stringify({
            payloads: [{ text: JSON.stringify({ fastResponse: "我先确认要撤销的记忆，再做最小安全动作。", status: "pending_full" }) }],
            meta: { durationMs: 700 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "memory-governor-agent" && message.includes("memory_governance")) {
        callback(
          null,
          JSON.stringify({
            payloads: [
              {
                text: JSON.stringify({
                  authorityAgent: "memory-governor-agent",
                  action: "delete_memory",
                  executionMode: "govern",
                  candidateId: null,
                  memoryId: recallTarget?.memoryId ?? null,
                  rationale: "用户明确要求忘记这条偏好。",
                  summary: "Data 已删除这条长期记忆。",
                }),
              },
            ],
            meta: { durationMs: 950 },
          }),
          "",
        );
        return {} as never;
      }

      if (agentId === "memory-governor-agent" && message.includes("coach_conversation_full")) {
        callback(
          null,
          JSON.stringify({
            payloads: [
              {
                text: JSON.stringify({
                  fastResponse: "我先确认要撤销的记忆，再做最小安全动作。",
                  fullResponse: "我已经撤销“偏好短句、明确下一步”这条长期记忆，后续不会再把它当作稳定偏好继续使用。",
                  status: "completed",
                }),
              },
            ],
            meta: { durationMs: 1000 },
          }),
          "",
        );
        return {} as never;
      }

      callback(new Error(`Unexpected original-runtime invocation for ${agentId}`), "", "");
      return {} as never;
    });

    const sessionResponse = await app.inject({
      method: "POST",
      url: "/coach/sessions",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        title: "original-runtime-data",
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
    expect(response.json().frontAgentState.currentFrontAgent).toBe("memory-governor-agent");

    let fetchedMessage = response.json().assistantMessage;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await sleep(25);
      const fetched = await app.inject({
        method: "GET",
        url: `/coach/messages/${response.json().assistantMessage.id}`,
        headers: {
          Authorization: "Bearer dev:coach-user:coach@example.com",
        },
      });
      fetchedMessage = fetched.json();
      if (fetchedMessage.status === "completed") {
        break;
      }
    }

    expect(fetchedMessage.status).toBe("completed");
    expect(fetchedMessage.fullResponse).toContain("长期记忆");

    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listRecallEligibleMemory("coach-user")).toHaveLength(0);

    const traceLookup = await app.inject({
      method: "GET",
      url: `/debug/traces/${response.json().traceId}`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(traceLookup.statusCode).toBe(200);
    const matchingEvents = traceLookup
      .json()
      .events.filter((event: { event: string }) => event.event === "openclaw.original-runtime.request.succeeded");
    expect(matchingEvents.some((event: { metadata?: { agentName?: string; workflow?: string } }) => event.metadata?.agentName === "director-agent" && event.metadata?.workflow === "coach_conversation_route")).toBe(true);
    expect(matchingEvents.some((event: { metadata?: { agentName?: string; workflow?: string } }) => event.metadata?.agentName === "memory-governor-agent" && event.metadata?.workflow === "memory_governance")).toBe(true);
    expect(matchingEvents.some((event: { metadata?: { agentName?: string; workflow?: string } }) => event.metadata?.agentName === "memory-governor-agent" && event.metadata?.workflow === "coach_conversation_full")).toBe(true);
  });
});
