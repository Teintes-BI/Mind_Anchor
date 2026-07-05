import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";
import { MindAnchorStore } from "../src/store.js";

describe("agent authority execution integration", () => {
  let dataDir = "";
  let app: Awaited<ReturnType<typeof buildApp>>;
  let store: MindAnchorStore;
  let env: AppEnv;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-agent-authority-"));
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
    app = await buildApp(env);
  });

  afterEach(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("executes a low-risk Jarvis task ordering decision", async () => {
    const goal = await store.createGoal({
      userId: "demo-user",
      title: "稳定今天的主线",
    });
    const taskA = await store.createTask({
      userId: "demo-user",
      goalId: goal.id,
      title: "收邮箱",
      sortOrder: 1,
    });
    const taskB = await store.createTask({
      userId: "demo-user",
      goalId: goal.id,
      title: "深度工作",
      priority: "high",
      sortOrder: 0,
    });
    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "POST",
      url: "/internal/agent-authority/jarvis/execute",
      payload: {
        userId: "demo-user",
        goalId: goal.id,
        riskLevel: "low",
        authorityAgent: "life-secretary-agent",
        targetKind: "task_order",
        executionMode: "apply_direct",
        orderedTaskIds: [taskB.id, taskA.id],
        rationale: "下午精力更适合先做深度任务。",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("applied");
    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listTasks("demo-user", goal.id).map((task) => task.id)).toEqual([taskB.id, taskA.id]);
    expect(reloaded.listPlanChangeCommandLogs("demo-user")).toHaveLength(1);
  });

  it("returns refreshed dashboard and goalflow read models after a low-risk Jarvis recovery block apply", async () => {
    const goal = await store.createGoal({
      userId: "demo-user",
      title: "稳定今天的主线",
    });
    const task = await store.createTask({
      userId: "demo-user",
      goalId: goal.id,
      title: "深度工作",
      priority: "high",
      sortOrder: 0,
    });
    const session = await store.addSession({
      id: "session-jarvis-refresh",
      userId: "demo-user",
      goalId: goal.id,
      taskId: task.id,
      status: "active",
      startedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
      interruptionCount: 0,
      summary: "",
    });
    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "POST",
      url: "/internal/agent-authority/jarvis/execute",
      payload: {
        userId: "demo-user",
        riskLevel: "low",
        authorityAgent: "life-secretary-agent",
        targetKind: "recovery_block",
        executionMode: "apply_direct",
        sessionId: session.id,
        taskId: task.id,
        rationale: "当前中断成本变高，先插入恢复块。",
        nextStep: "先清空干扰，再回到唯一主任务。",
        suggestedMinutes: 15,
        reprioritizedTaskIds: [task.id],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        status: "applied",
        readModelRefresh: expect.objectContaining({
          dashboard: expect.objectContaining({
            latestRecoveryPlan: expect.objectContaining({
              taskId: task.id,
              nextStep: "先清空干扰，再回到唯一主任务。",
              suggestedMinutes: 15,
            }),
          }),
          goalFlow: expect.objectContaining({
            latestRecoveryPlan: expect.objectContaining({
              taskId: task.id,
              nextStep: "先清空干扰，再回到唯一主任务。",
            }),
          }),
          inboxOverview: expect.objectContaining({
            latestRecoveryPlan: expect.objectContaining({
              taskId: task.id,
            }),
          }),
        }),
      }),
    );
  });

  it("turns a high-risk Jarvis plan change into a proposal", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/agent-authority/jarvis/execute",
      payload: {
        userId: "demo-user",
        riskLevel: "high",
        authorityAgent: "life-secretary-agent",
        targetKind: "plan_change",
        executionMode: "proposal",
        summary: "把明天下午的计划挪到下周二。",
        beforeStateSummary: "明天下午 14:00-16:00 客户沟通",
        afterStateSummary: "下周二 14:00-16:00 客户沟通",
        rationale: "当前情绪负荷偏高，不适合今天继续压缩。",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("proposal");
    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listPlanChangeProposals("demo-user")).toHaveLength(1);
    expect(reloaded.listPlanChangeProposals("demo-user")[0]?.status).toBe("proposal");
  });

  it("keeps a low-risk Jarvis task ordering request as a proposal when executionMode explicitly says proposal", async () => {
    const goal = await store.createGoal({
      userId: "demo-user",
      title: "稳定今天的主线",
    });
    const taskA = await store.createTask({
      userId: "demo-user",
      goalId: goal.id,
      title: "收邮箱",
      sortOrder: 1,
    });
    const taskB = await store.createTask({
      userId: "demo-user",
      goalId: goal.id,
      title: "深度工作",
      priority: "high",
      sortOrder: 0,
    });
    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "POST",
      url: "/internal/agent-authority/jarvis/execute",
      payload: {
        userId: "demo-user",
        goalId: goal.id,
        riskLevel: "low",
        authorityAgent: "life-secretary-agent",
        targetKind: "task_order",
        executionMode: "proposal",
        orderedTaskIds: [taskB.id, taskA.id],
        summary: "先把今天的顺序调一调，但先别自动落库。",
        beforeStateSummary: "1. 收邮箱 → 2. 深度工作",
        afterStateSummary: "1. 深度工作 → 2. 收邮箱",
        rationale: "先作为提案保留给前台确认。",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("proposal");

    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listTasks("demo-user", goal.id).map((task) => task.id)).toEqual([taskB.id, taskA.id]);
    expect(reloaded.listPlanChangeCommandLogs("demo-user")).toHaveLength(0);
    expect(reloaded.listPlanChangeProposals("demo-user")).toHaveLength(1);
    expect(reloaded.listPlanChangeProposals("demo-user")[0]?.status).toBe("proposal");
  });

  it("downgrades a low-risk Jarvis task ordering request to proposal when goalId is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/agent-authority/jarvis/execute",
      payload: {
        userId: "demo-user",
        riskLevel: "low",
        authorityAgent: "life-secretary-agent",
        targetKind: "task_order",
        executionMode: "apply_direct",
        orderedTaskIds: ["task-1", "task-2"],
        rationale: "没有明确 goal 目标时，不应该直接落库。",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("proposal");

    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listPlanChangeCommandLogs("demo-user")).toHaveLength(0);
    expect(reloaded.listPlanChangeProposals("demo-user")).toHaveLength(1);
    expect(reloaded.listPlanChangeProposals("demo-user")[0]?.status).toBe("proposal");
  });

  it("executes a Data accept-candidate governance decision", async () => {
    const candidate = await store.createMemoryCandidate({
      userId: "demo-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "companion-agent",
      sourceTurnRef: "turn-1",
      summary: "用户在高压时更适合简短温和的建议。",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });
    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "POST",
      url: "/internal/agent-authority/data/execute",
      payload: {
        authorityAgent: "memory-governor-agent",
        action: "accept_candidate",
        executionMode: "govern",
        candidateId: candidate.candidateId,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("accepted");
    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listRecallEligibleMemory("demo-user")).toHaveLength(1);
  });

  it("executes a Data recall-block governance decision", async () => {
    const candidate = await store.createMemoryCandidate({
      userId: "demo-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "analyst-agent",
      sourceTurnRef: "turn-2",
      summary: "用户偏好显式权衡语言。",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });
    const accepted = await store.acceptMemoryCandidate(candidate.candidateId);
    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "POST",
      url: "/internal/agent-authority/data/execute",
      payload: {
        authorityAgent: "memory-governor-agent",
        action: "block_recall",
        executionMode: "govern",
        memoryId: accepted!.memoryId,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("recall_blocked");
    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listRecallEligibleMemory("demo-user")).toHaveLength(0);
  });

  it("rejects invalid Data governance requests that omit required target ids", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/internal/agent-authority/data/execute",
      payload: {
        authorityAgent: "memory-governor-agent",
        action: "delete_memory",
        executionMode: "govern",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        message: "Invalid request.",
      }),
    );
  });
});
