import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { agentTeamAgentIds, agentTeamPersonaMetadata } from "@mindanchor/domain";
import { createLocalOpenClawServer } from "../../../openclaw/local-runtime/server.mjs";
import { buildGatewayTraceContext, buildOpenClawTaskEnvelope } from "../src/lib/openclaw-trace.js";
import { buildApp } from "../src/app.js";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";
import { MindAnchorStore } from "../src/store.js";

const expectCoachFrontAgentState = (value: unknown) => {
  expect(value).toEqual(
    expect.objectContaining({
      currentFrontAgent: expect.any(String),
      routingMode: expect.any(String),
      manualOverride: expect.any(Boolean),
    }),
  );

  const state = value as {
    currentFrontAgent: string;
    routingMode: string;
    manualOverride: boolean;
    consultedAgent: string | null;
    handoffReason: string | null;
    overrideSourceAgent: string | null;
    visibleSummary: string | null;
  };

  expect(Object.keys(state).sort()).toEqual(
    [
      "consultedAgent",
      "currentFrontAgent",
      "handoffReason",
      "manualOverride",
      "overrideSourceAgent",
      "routingMode",
      "visibleSummary",
    ].sort(),
  );
  expect(agentTeamAgentIds).toContain(state.currentFrontAgent);
  expect(["auto", "manual"]).toContain(state.routingMode);
  expect(Array.isArray(state.consultedAgent)).toBe(false);
  if (state.consultedAgent !== null) {
    expect(agentTeamAgentIds).toContain(state.consultedAgent);
  }
  if (state.handoffReason !== null) {
    expect(typeof state.handoffReason).toBe("string");
  }
  if (state.overrideSourceAgent !== null) {
    expect(agentTeamAgentIds).toContain(state.overrideSourceAgent);
  }
  if (state.visibleSummary !== null) {
    expect(typeof state.visibleSummary).toBe("string");
  }
};

const coreAgentContractCases = [
  {
    target: "chief-agent",
    workflow: "progress_summary",
    context: {
      workflow: "progress_summary",
      tasks: [
        { id: "task_1", title: "收口 Gateway", status: "in_progress", priority: "high", sortOrder: 0 },
        { id: "task_2", title: "补 smoke", status: "todo", priority: "medium", sortOrder: 1 },
      ],
      activeSession: { id: "session_1", taskId: "task_1", status: "active" },
      latestAssessment: { focusScore: 51 },
      latestRecoveryPlan: { taskId: "task_1" },
      openInterventions: 1,
    },
    assertParsed: (parsed: Record<string, unknown>) => {
      expect(typeof parsed.workflow).toBe("string");
      expect(typeof parsed.selectedAgent).toBe("string");
      expect(typeof parsed.reason).toBe("string");
      expect(typeof parsed.executionMode).toBe("string");
    },
  },
  {
    target: "state-insight-agent",
    workflow: "state_assessment",
    context: {
      workflow: "state_assessment",
      userId: "demo-user",
      recentSignals: [{ eventType: "window_switch", occurredAt: "2026-03-07T11:55:00.000Z" }],
      latestCheckin: { focusScore: 48, energyScore: 43, moodScore: 52 },
    },
    assertParsed: (parsed: Record<string, unknown>) => {
      expect(typeof parsed.summary).toBe("string");
      expect(typeof parsed.recommendedAction).toBe("string");
      expect(Array.isArray(parsed.activeInputs)).toBe(true);
    },
  },
  {
    target: "task-management-agent",
    workflow: "task_management",
    context: {
      workflow: "task_management",
      tasks: [
        { id: "task_a", title: "先做 contract", status: "in_progress", priority: "high", sortOrder: 0 },
        { id: "task_b", title: "再补文档", status: "todo", priority: "medium", sortOrder: 1 },
      ],
    },
    assertParsed: (parsed: Record<string, unknown>) => {
      expect(Array.isArray(parsed.orderedTaskIds)).toBe(true);
      expect(typeof parsed.summary).toBe("string");
    },
  },
  {
    target: "progress-feedback-agent",
    workflow: "progress_summary",
    context: {
      workflow: "progress_summary",
      dashboard: {
        tasks: [
          { id: "task_main", title: "推进 execute contract", status: "in_progress", priority: "high", sortOrder: 0 },
        ],
        activeSession: { id: "session_active", taskId: "task_main", status: "active" },
      },
    },
    assertParsed: (parsed: Record<string, unknown>) => {
      expect(typeof parsed.summaryHeadline).toBe("string");
      expect("suggestedFocusTaskId" in parsed).toBe(true);
    },
  },
  {
    target: "interruption-recovery-agent",
    workflow: "recovery_plan",
    context: {
      workflow: "recovery_plan",
      taskId: "task_main",
      tasks: [{ id: "task_main", title: "恢复主线", status: "in_progress", priority: "high", sortOrder: 0 }],
    },
    assertParsed: (parsed: Record<string, unknown>) => {
      expect(typeof parsed.reason).toBe("string");
      expect(typeof parsed.nextStep).toBe("string");
      expect(typeof parsed.suggestedMinutes).toBe("number");
      expect(Array.isArray(parsed.reprioritizedTaskIds)).toBe(true);
    },
  },
  {
    target: "reflection-coach-agent",
    workflow: "reflection_report",
    context: {
      workflow: "reflection_report",
      periodType: "weekly",
      tasks: [{ id: "task_blocked", title: "清理 fallback", status: "blocked", priority: "high", sortOrder: 0 }],
    },
    assertParsed: (parsed: Record<string, unknown>) => {
      expect(Array.isArray(parsed.highlights)).toBe(true);
      expect(Array.isArray(parsed.blockers)).toBe(true);
      expect(Array.isArray(parsed.trends)).toBe(true);
      expect(Array.isArray(parsed.nextSuggestions)).toBe(true);
    },
  },
  {
    target: "automation-agent",
    workflow: "notification_dispatch",
    context: {
      workflow: "notification_dispatch",
      conclusion: {
        summary: "高风险状态",
        suggestedAction: "先暂停并恢复",
        recommendedChannel: "mobile_push",
      },
    },
    assertParsed: (parsed: Record<string, unknown>) => {
      expect(typeof parsed.title).toBe("string");
      expect(typeof parsed.message).toBe("string");
      expect(typeof parsed.channel).toBe("string");
      expect(typeof parsed.deliver).toBe("boolean");
    },
  },
] as const;

describe("openclaw local runtime", () => {
  const servers: Array<ReturnType<typeof createLocalOpenClawServer>> = [];

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map(
        (runtime) =>
          new Promise<void>((resolve, reject) => {
            runtime.server.close((error) => (error ? reject(error) : resolve()));
          }),
      ),
    );
  });

  it("exposes health with manifest-driven agents", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const payload = (await response.json()) as {
      ok: boolean;
      runtime: string;
      runtimeVersion: string;
      responseMode: string;
      agentCount: number;
      agents: Array<{ name: string; worker: string; modelTarget: string; skillCount: number; supportedWorkflows: string[] }>;
      endpoints: string[];
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.runtime).toBe("openclaw-local-cluster");
    expect(payload.runtimeVersion).toBe("structured-local-runtime-phase1");
    expect(payload.responseMode).toBe("parsed");
    expect(payload.agentCount).toBe(payload.agents.length);
    expect(payload.agents.some((agent) => agent.name === "chief-agent" && agent.modelTarget === "chief-agent")).toBe(true);
    expect(
      payload.agents.some(
        (agent) =>
          agent.name === "chief-agent" &&
          agent.worker === "chief-agent-worker" &&
          agent.skillCount > 0 &&
          agent.supportedWorkflows.includes("state_assessment"),
      ),
    ).toBe(true);
    expect(payload.agents.some((agent) => agent.name === "state-insight-agent")).toBe(true);
    const personaTargets = Object.values(agentTeamPersonaMetadata).map((entry) => entry.agentId);
    const personaAgents = payload.agents.filter((agent) => personaTargets.includes(agent.name));
    expect(personaTargets).toHaveLength(6);
    expect(personaAgents).toHaveLength(6);
    personaTargets.forEach((target) => {
      expect(payload.agents.some((agent) => agent.name === target && agent.modelTarget === target)).toBe(true);
    });
    expect(payload.endpoints).toContain("/v1/tasks/execute");
  });

  it("returns parsed output for a known agent and rejects unknown targets with structured metadata", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;

    const knownResponse = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId: "task_1",
        target: "chief-agent",
        createdAt: "2026-03-07T12:00:00.000Z",
        trace: {
          traceId: "trace_1",
          source: "mindanchor-gateway",
          operation: "probe",
          agentName: "chief-agent",
          userId: "demo-user",
        },
        payload: {
          userPrompt: JSON.stringify({ workflow: "state_assessment" }),
        },
        mode: "debug",
      }),
    });
    const knownPayload = (await knownResponse.json()) as {
      success: boolean;
      parsed: { selectedAgent: string };
      metadata: {
        runtime: string;
        runtimeVersion: string;
        worker: string;
        agent: string;
        mode: string;
        responseMode: string;
        skillCount: number;
        supportedWorkflows: string[];
      };
    };

    expect(knownResponse.status).toBe(200);
    expect(knownPayload.success).toBe(true);
    expect(knownPayload.parsed.selectedAgent).toBe("state-insight-agent");
    expect(knownPayload.metadata.runtime).toBe("openclaw-local-cluster");
    expect(knownPayload.metadata.runtimeVersion).toBe("structured-local-runtime-phase1");
    expect(knownPayload.metadata.worker).toBe("chief-agent-worker");
    expect(knownPayload.metadata.agent).toBe("chief-agent");
    expect(knownPayload.metadata.mode).toBe("debug");
    expect(knownPayload.metadata.responseMode).toBe("parsed");
    expect(knownPayload.metadata.skillCount).toBeGreaterThan(0);
    expect(knownPayload.metadata.supportedWorkflows).toContain("state_assessment");

    const unknownResponse = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId: "task_2",
        target: "unknown-agent",
        createdAt: "2026-03-07T12:00:00.000Z",
        mode: "debug",
      }),
    });
    const unknownPayload = (await unknownResponse.json()) as {
      success: boolean;
      error: string;
      metadata: {
        runtime: string;
        runtimeVersion: string;
        errorCode: string;
        availableTargets: string[];
      };
    };

    expect(unknownResponse.status).toBe(400);
    expect(unknownPayload.success).toBe(false);
    expect(unknownPayload.error).toContain("Unknown agent target");
    expect(unknownPayload.metadata.runtime).toBe("openclaw-local-cluster");
    expect(unknownPayload.metadata.runtimeVersion).toBe("structured-local-runtime-phase1");
    expect(unknownPayload.metadata.errorCode).toBe("unknown_target");
    expect(unknownPayload.metadata.availableTargets).toContain("chief-agent");
  });

  it("supports outputText mode while keeping worker metadata", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0, responseMode: "outputText" });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId: "task_3",
        target: "state-insight-agent",
        mode: "probe",
      }),
    });
    const payload = (await response.json()) as {
      success: boolean;
      outputText: string;
      metadata: { responseMode: string; worker: string };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.outputText).toContain('"probe":"ok"');
    expect(payload.metadata.responseMode).toBe("outputText");
    expect(payload.metadata.worker).toBe("state-insight-agent-worker");
  });

  it("returns richer state insight content for multi-modal payloads", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId: "task_state_1",
        target: "state-insight-agent",
        createdAt: "2026-03-07T12:00:00.000Z",
        trace: {
          traceId: "trace_state_1",
          source: "mindanchor-gateway",
          operation: "generate",
          agentName: "state-insight-agent",
          userId: "demo-user",
        },
        payload: {
          userPrompt: JSON.stringify({
            userId: "demo-user",
            recentSignals: [
              {
                eventType: "window_switch",
                occurredAt: "2026-03-07T11:55:00.000Z",
              },
              {
                eventType: "idle",
                occurredAt: "2026-03-07T11:57:00.000Z",
              },
              {
                eventType: "lock",
                occurredAt: "2026-03-07T11:58:00.000Z",
              },
              {
                eventType: "unlock",
                occurredAt: "2026-03-07T11:59:00.000Z",
              },
            ],
            latestEmotionAssessment: {
              stressScore: 74,
              emotionLabel: "tense",
            },
            latestVideoAssessment: {
              fatigueScore: 68,
            },
            latestHealthSnapshot: {
              sleepMinutes: 325,
              oxygenSaturation: 97,
            },
            latestCheckin: {
              focusScore: 41,
              energyScore: 38,
              moodScore: 44,
            },
          }),
        },
        mode: "generate",
      }),
    });
    const payload = (await response.json()) as {
      success: boolean;
      parsed: {
        summary: string;
        recommendedAction: string;
        emotionSummary?: string;
        videoSummary?: string;
        healthSummary?: string;
        activeInputs: string[];
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.parsed.summary).toContain("注意力");
    expect(payload.parsed.recommendedAction).toContain("主任务");
    expect(payload.parsed.emotionSummary).toContain("音频侧");
    expect(payload.parsed.videoSummary).toContain("视频侧");
    expect(payload.parsed.healthSummary).toContain("健康数据");
    expect(payload.parsed.activeInputs).toEqual(
      expect.arrayContaining(["desktop_signal", "audio_server_inference", "video_server_inference", "health_bridge", "manual_checkin"]),
    );
  });

  it("returns director-agent front state with strict shape", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: "task_director_1",
        target: "director-agent",
        createdAt: "2026-03-07T12:00:00.000Z",
        payload: {
          userPrompt: JSON.stringify({
            contextSource: "manual_checkin",
            routingMode: "auto",
          }),
        },
        mode: "generate",
      }),
    });
    const payload = (await response.json()) as { success: boolean; parsed: unknown };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expectCoachFrontAgentState(payload.parsed);
    const parsed = payload.parsed as { currentFrontAgent: string; consultedAgent: string | null };
    expect(parsed.currentFrontAgent).not.toBe("memory-governor-agent");
    expect(parsed.consultedAgent === null || agentTeamAgentIds.includes(parsed.consultedAgent)).toBe(true);
  });

  it("returns director-agent summary for mixed inputs", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: "task_director_2",
        target: "director-agent",
        createdAt: "2026-03-07T12:10:00.000Z",
        payload: {
          userPrompt: JSON.stringify({
            contextSource: "mixed",
            latestEmotionAssessment: { stressScore: 62, emotionLabel: "tense" },
            latestVideoAssessment: { fatigueScore: 55 },
            recentSignals: [{ eventType: "window_switch", occurredAt: "2026-03-07T12:08:00.000Z" }],
          }),
        },
        mode: "generate",
      }),
    });
    const payload = (await response.json()) as { success: boolean; parsed: unknown };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expectCoachFrontAgentState(payload.parsed);
    const parsed = payload.parsed as {
      currentFrontAgent: string;
      consultedAgent: string | null;
      visibleSummary: string | null;
    };
    expect(parsed.consultedAgent).not.toBeNull();
    expect(parsed.consultedAgent).toEqual(expect.any(String));
    expect(agentTeamAgentIds).toContain(parsed.consultedAgent);
    expect(parsed.visibleSummary).toEqual(expect.any(String));
    expect(parsed.visibleSummary?.length).toBeGreaterThan(0);
    expect(parsed.visibleSummary).toContain(parsed.consultedAgent as string);
    expect(parsed.currentFrontAgent).not.toBe("director-agent");
    expect(parsed.currentFrontAgent).not.toBe("memory-governor-agent");
  });

  it("returns consistent front state for other persona targets", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: "task_companion_1",
        target: "companion-agent",
        createdAt: "2026-03-07T12:20:00.000Z",
        payload: {
          userPrompt: JSON.stringify({
            contextSource: "conversation",
          }),
        },
        mode: "generate",
      }),
    });
    const payload = (await response.json()) as { success: boolean; parsed: unknown };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expectCoachFrontAgentState(payload.parsed);
  });

  it("builds envelopes with workflow, frontAgent, and memoryScopes runtime context", () => {
    const trace = buildGatewayTraceContext({
      traceId: "trace-envelope-1",
      operation: "generate",
      agentName: "director-agent",
      workflow: "persona_routing",
      userId: "demo-user",
    });

    const envelope = buildOpenClawTaskEnvelope({
      target: "director-agent",
      trace,
      payload: {
        kind: "generate",
      },
      runtimeContext: {
        workflow: "persona_routing",
        userId: "demo-user",
        frontAgent: "director-agent",
        runtimeAgentId: "picard-runtime-agent",
        memoryScopes: ["preferences", "recentContext"],
        gatewayBaseUrl: "http://127.0.0.1:3999",
      },
    });

    expect(envelope.trace.workflow).toBe("persona_routing");
    expect(envelope.trace.userId).toBe("demo-user");
    expect(envelope.payload.frontAgent).toBe("director-agent");
    expect(envelope.payload.runtimeAgentId).toBe("picard-runtime-agent");
    expect(envelope.payload.memoryScopes).toEqual(["preferences", "recentContext"]);
    expect(envelope.payload.gatewayBaseUrl).toBe("http://127.0.0.1:3999");
  });

  it("loads scoped memory from Gateway before persona generation and exposes runtime metadata", async () => {
    let requestedPath = "";
    const gateway = createServer((request, response) => {
      requestedPath = request.url ?? "";
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      response.end(
        JSON.stringify({
          userId: "demo-user",
          agentId: "director-agent",
          scopes: ["preferences", "recentContext"],
          identity: [],
          preferences: [
            {
              memoryId: "memory-1",
              kind: "preference",
              summary: "用户更适合短句、明确、低压力的建议。",
              source: "gateway-memory",
              confidence: 0.82,
              updatedAt: "2026-03-22T08:00:00.000Z",
              recallAllowed: true,
            },
          ],
          habits: [],
          constraints: [],
          recentContext: [],
          metadata: {
            activeMemoryCount: 1,
            proposalCount: 0,
            retrievedAt: "2026-03-22T08:01:00.000Z",
          },
        }),
      );
    });
    await new Promise<void>((resolve, reject) => {
      gateway.once("error", reject);
      gateway.listen(0, "127.0.0.1", () => {
        gateway.off("error", reject);
        resolve();
      });
    });

    try {
      const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
      servers.push(runtime);
      await runtime.start();

      const gatewayAddress = gateway.address() as AddressInfo;
      const runtimeAddress = runtime.server.address() as AddressInfo;
      const trace = buildGatewayTraceContext({
        traceId: "trace-memory-1",
        operation: "generate",
        agentName: "director-agent",
        workflow: "persona_routing",
        userId: "demo-user",
      });

      const response = await fetch(`http://127.0.0.1:${runtimeAddress.port}/v1/tasks/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildOpenClawTaskEnvelope({
            target: "director-agent",
            trace,
            payload: {
              kind: "generate",
            },
            runtimeContext: {
              workflow: "persona_routing",
              userId: "demo-user",
              frontAgent: "director-agent",
              runtimeAgentId: "picard-runtime-agent",
              memoryScopes: ["preferences", "recentContext"],
              gatewayBaseUrl: `http://127.0.0.1:${gatewayAddress.port}`,
            },
          }),
          mode: "generate",
        }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        metadata: {
          workflow: string | null;
          frontAgent: string | null;
          runtimeAgentId: string | null;
          memoryScopes: string[];
          memoryFetch: { attempted: boolean; loaded: boolean; error: string | null };
          memoryContext: { preferences: Array<{ summary: string }> } | null;
        };
      };

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.metadata.workflow).toBe("persona_routing");
      expect(payload.metadata.frontAgent).toBe("director-agent");
      expect(payload.metadata.runtimeAgentId).toBe("picard-runtime-agent");
      expect(payload.metadata.memoryScopes).toEqual(["preferences", "recentContext"]);
      expect(payload.metadata.memoryFetch).toEqual({
        attempted: true,
        loaded: true,
        error: null,
      });
      expect(payload.metadata.memoryContext?.preferences[0]?.summary).toContain("短句");
      expect(requestedPath).toContain("/internal/agent-memory/context");
      expect(requestedPath).toContain("agentId=director-agent");
      expect(requestedPath).toContain("scopes=preferences%2CrecentContext");
    } finally {
      await new Promise<void>((resolve, reject) => {
        gateway.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("returns concrete recovery, reflection, and progress semantics", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const sharedTasks = [
      {
        id: "task_main",
        title: "收口适配器状态卡",
        status: "in_progress",
        priority: "high",
        estimatedMinutes: 30,
        sortOrder: 0,
      },
      {
        id: "task_blocked",
        title: "补齐恢复页真实内容",
        status: "blocked",
        priority: "critical",
        estimatedMinutes: 25,
        sortOrder: 1,
      },
      {
        id: "task_backlog",
        title: "整理本地 runtime 文档",
        status: "todo",
        priority: "medium",
        estimatedMinutes: 20,
        sortOrder: 2,
      },
    ];

    const recoveryResponse = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: "interruption-recovery-agent",
        mode: "generate",
        payload: {
          userPrompt: JSON.stringify({
            taskId: "task_main",
            reason: "manual_request",
            tasks: sharedTasks,
            latestAssessment: {
              focusScore: 39,
              energyScore: 43,
            },
          }),
        },
      }),
    });
    const recoveryPayload = (await recoveryResponse.json()) as {
      parsed: {
        reason: string;
        nextStep: string;
        suggestedMinutes: number;
        reprioritizedTaskIds: string[];
      };
    };

    expect(recoveryResponse.status).toBe(200);
    expect(recoveryPayload.parsed.reason).toBe("attention_shift_after_interruption");
    expect(recoveryPayload.parsed.nextStep).toContain("收口适配器状态卡");
    expect(recoveryPayload.parsed.suggestedMinutes).toBeGreaterThanOrEqual(10);
    expect(recoveryPayload.parsed.reprioritizedTaskIds[0]).toBe("task_main");

    const reflectionResponse = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: "reflection-coach-agent",
        mode: "generate",
        payload: {
          userPrompt: JSON.stringify({
            userId: "demo-user",
            periodType: "weekly",
            goals: [{ id: "goal_1", status: "active" }],
            tasks: sharedTasks,
            sessions: [
              { id: "session_1", status: "completed" },
              { id: "session_2", status: "interrupted" },
            ],
            assessments: [{ focusScore: 58, energyScore: 49 }],
            emotionAssessments: [{ stressScore: 67 }],
            videoAssessments: [{ fatigueScore: 64 }],
            healthSnapshots: [{ sleepMinutes: 340 }],
            callEvents: [{ status: "missed" }],
          }),
        },
      }),
    });
    const reflectionPayload = (await reflectionResponse.json()) as {
      parsed: {
        highlights: string[];
        blockers: string[];
        trends: string[];
        nextSuggestions: string[];
      };
    };

    expect(reflectionResponse.status).toBe(200);
    expect(reflectionPayload.parsed.highlights[0]).toContain("本周");
    expect(reflectionPayload.parsed.blockers.length).toBeGreaterThan(0);
    expect(reflectionPayload.parsed.trends.some((entry) => entry.includes("专注均值"))).toBe(true);
    expect(reflectionPayload.parsed.nextSuggestions.some((entry) => entry.includes("blocked") || entry.includes("中断后"))).toBe(true);

    const progressResponse = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: "progress-feedback-agent",
        mode: "generate",
        payload: {
          userPrompt: JSON.stringify({
            dashboard: {
              goals: [{ id: "goal_1", status: "active" }],
              tasks: sharedTasks,
              activeSession: { id: "session_active", taskId: "task_main", status: "active" },
              latestAssessment: { focusScore: 43 },
              latestBehaviorConclusion: {
                riskLevel: "high",
              },
              latestRecoveryPlan: {
                taskId: "task_main",
              },
              latestVideoAssessment: null,
              latestHealthSnapshot: null,
              mobileAudio: {
                enabled: false,
                latestDevice: null,
                latestSession: null,
                latestEmotionAssessment: null,
                latestCallEvent: null,
              },
              edgeDevices: [],
              inbox: [],
              openInterventions: 1,
            },
          }),
        },
      }),
    });
    const progressPayload = (await progressResponse.json()) as {
      parsed: {
        summaryHeadline: string;
        suggestedFocusTaskId: string | null;
      };
    };

    expect(progressResponse.status).toBe(200);
    expect(progressPayload.parsed.summaryHeadline).toContain("恢复方案");
    expect(progressPayload.parsed.suggestedFocusTaskId).toBe("task_main");
  });

  it("keeps a stable success envelope and minimum parsed contract for all 7 core agents", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;

    for (const contractCase of coreAgentContractCases) {
      const response = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: `contract_${contractCase.target}`,
          target: contractCase.target,
          createdAt: "2026-03-07T12:00:00.000Z",
          trace: {
            traceId: `trace_${contractCase.target}`,
            source: "mindanchor-gateway",
            operation: "generate",
            agentName: contractCase.target,
            workflow: contractCase.workflow,
            userId: "demo-user",
          },
          payload: {
            userPrompt: JSON.stringify(contractCase.context),
          },
          mode: "generate",
        }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        taskId?: string;
        trace?: { traceId?: string };
        parsed?: Record<string, unknown>;
        metadata?: {
          runtime?: string;
          runtimeVersion?: string;
          worker?: string;
          agent?: string;
          mode?: string;
          responseMode?: string;
        };
      };

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.taskId).toBe(`contract_${contractCase.target}`);
      expect(payload.trace?.traceId).toBe(`trace_${contractCase.target}`);
      expect(payload.metadata?.runtime).toBe("openclaw-local-cluster");
      expect(payload.metadata?.runtimeVersion).toBe("structured-local-runtime-phase1");
      expect(payload.metadata?.worker).toBe(`${contractCase.target}-worker`);
      expect(payload.metadata?.agent).toBe(contractCase.target);
      expect(payload.metadata?.mode).toBe("generate");
      expect(payload.metadata?.responseMode).toBe("parsed");
      expect(payload.parsed).toBeTruthy();
      contractCase.assertParsed(payload.parsed ?? {});
    }
  });

  it("exposes conversation coach agents and returns structured fast/full coach responses", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const health = await fetch(`http://127.0.0.1:${address.port}/health`);
    const healthPayload = (await health.json()) as {
      agents: Array<{ name: string; modelTarget: string; supportedWorkflows: string[] }>;
    };

    expect(healthPayload.agents.some((agent) => agent.name === "conversation-coach-fast-agent")).toBe(true);
    expect(healthPayload.agents.some((agent) => agent.name === "conversation-coach-agent")).toBe(true);

    const fastResponse = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId: "coach_fast_1",
        target: "conversation-coach-fast-agent",
        createdAt: "2026-03-21T00:00:00.000Z",
        trace: {
          traceId: "coach-trace-fast",
          source: "mindanchor-gateway",
          operation: "generate",
          agentName: "conversation-coach-fast-agent",
          workflow: "coach_conversation_fast",
          userId: "coach-user",
        },
        payload: {
          userPrompt: JSON.stringify({
            userText: "我现在很乱，不知道先做什么。",
          }),
        },
        mode: "generate",
      }),
    });
    const fastPayload = (await fastResponse.json()) as {
      success: boolean;
      parsed: {
        fastResponse: string;
        status: string;
      };
    };

    expect(fastResponse.status).toBe(200);
    expect(fastPayload.success).toBe(true);
    expect(fastPayload.parsed.fastResponse.length).toBeGreaterThan(0);
    expect(fastPayload.parsed.status).toBe("pending_full");

    const fullResponse = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId: "coach_full_1",
        target: "conversation-coach-agent",
        createdAt: "2026-03-21T00:00:00.000Z",
        trace: {
          traceId: "coach-trace-full",
          source: "mindanchor-gateway",
          operation: "generate",
          agentName: "conversation-coach-agent",
          workflow: "coach_conversation_full",
          userId: "coach-user",
        },
        payload: {
          userPrompt: JSON.stringify({
            userText: "我现在很乱，不知道先做什么。",
            recalledMemory: ["用户更适合明确的最小下一步"],
          }),
        },
        mode: "generate",
      }),
    });
    const fullPayload = (await fullResponse.json()) as {
      success: boolean;
      parsed: {
        fastResponse: string;
        fullResponse: string;
        status: string;
      };
    };

    expect(fullResponse.status).toBe(200);
    expect(fullPayload.success).toBe(true);
    expect(fullPayload.parsed.fastResponse.length).toBeGreaterThan(0);
    expect(fullPayload.parsed.fullResponse.length).toBeGreaterThan(0);
    expect(fullPayload.parsed.status).toBe("completed");
  });

  it("supports coach conversation workflows on persona targets", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const fastResponse = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: "persona_fast_1",
        target: "companion-agent",
        trace: {
          traceId: "persona-fast-trace",
          source: "mindanchor-gateway",
          operation: "generate",
          agentName: "companion-agent",
          workflow: "coach_conversation_fast",
          userId: "coach-user",
        },
        payload: {
          userPrompt: JSON.stringify({
            workflow: "coach_conversation_fast",
            userText: "我现在压力很大，很乱。",
          }),
        },
        mode: "generate",
      }),
    });
    const fastPayload = (await fastResponse.json()) as {
      success: boolean;
      parsed: {
        fastResponse: string;
        status: string;
      };
      metadata: {
        agent: string;
        workflow: string | null;
      };
    };

    expect(fastResponse.status).toBe(200);
    expect(fastPayload.success).toBe(true);
    expect(fastPayload.metadata.agent).toBe("companion-agent");
    expect(fastPayload.metadata.workflow).toBe("coach_conversation_fast");
    expect(fastPayload.parsed.fastResponse.length).toBeGreaterThan(0);
    expect(fastPayload.parsed.status).toBe("pending_full");

    const consultResponse = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: "persona_consult_1",
        target: "analyst-agent",
        trace: {
          traceId: "persona-consult-trace",
          source: "mindanchor-gateway",
          operation: "generate",
          agentName: "analyst-agent",
          workflow: "coach_conversation_consult",
          userId: "coach-user",
        },
        payload: {
          userPrompt: JSON.stringify({
            workflow: "coach_conversation_consult",
            userText: "我现在压力很大，很乱，还想知道现实上该怎么判断。",
            frontAgent: "companion-agent",
          }),
        },
        mode: "generate",
      }),
    });
    const consultPayload = (await consultResponse.json()) as {
      success: boolean;
      parsed: {
        consultSummary: string;
      };
      metadata: {
        agent: string;
        workflow: string | null;
      };
    };

    expect(consultResponse.status).toBe(200);
    expect(consultPayload.success).toBe(true);
    expect(consultPayload.metadata.agent).toBe("analyst-agent");
    expect(consultPayload.metadata.workflow).toBe("coach_conversation_consult");
    expect(consultPayload.parsed.consultSummary.length).toBeGreaterThan(0);
  });

  it("returns structured Jarvis authority output for plan adjustment workflow", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: "life-secretary-agent",
        mode: "generate",
        payload: {
          userPrompt: JSON.stringify({
            workflow: "plan_adjustment",
            action: "task_order",
            userId: "demo-user",
            goalId: "goal-1",
            riskLevel: "low",
            rationale: "下午精力更适合先做深度任务。",
            tasks: [
              { id: "task-a", title: "收邮箱", status: "todo", priority: "medium", sortOrder: 1 },
              { id: "task-b", title: "深度工作", status: "todo", priority: "high", sortOrder: 0 },
            ],
          }),
        },
      }),
    });
    const payload = (await response.json()) as {
      success: boolean;
      parsed: {
        authorityAgent: string;
        targetKind: string;
        executionMode: string;
        orderedTaskIds: string[];
        rationale: string;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.parsed.authorityAgent).toBe("life-secretary-agent");
    expect(payload.parsed.targetKind).toBe("task_order");
    expect(payload.parsed.executionMode).toBe("apply_direct");
    expect(payload.parsed.orderedTaskIds[0]).toBe("task-b");
    expect(payload.parsed.rationale).toContain("精力");
  });

  it("returns structured Data governance output for memory workflow", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/tasks/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: "memory-governor-agent",
        mode: "generate",
        payload: {
          userPrompt: JSON.stringify({
            workflow: "memory_governance",
            action: "accept_candidate",
            userId: "demo-user",
            candidateId: "candidate-1",
            rationale: "该候选记忆已在多轮对话中重复出现。",
          }),
        },
      }),
    });
    const payload = (await response.json()) as {
      success: boolean;
      parsed: {
        authorityAgent: string;
        action: string;
        executionMode: string;
        candidateId: string;
        rationale: string;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.parsed.authorityAgent).toBe("memory-governor-agent");
    expect(payload.parsed.action).toBe("accept_candidate");
    expect(payload.parsed.executionMode).toBe("govern");
    expect(payload.parsed.candidateId).toBe("candidate-1");
    expect(payload.parsed.rationale).toContain("多轮对话");
  });

  it("applies Jarvis authority through Gateway when applyAuthority is enabled", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-runtime-jarvis-"));
    let app: Awaited<ReturnType<typeof buildApp>> | null = null;

    try {
      const env: AppEnv = {
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

      const store = new MindAnchorStore(env.dataFile);
      await store.init();
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

      app = await buildApp(env);
      await app.listen({ port: 0, host: "127.0.0.1" });
      const gatewayAddress = app.server.address() as AddressInfo;

      const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
      servers.push(runtime);
      await runtime.start();
      const runtimeAddress = runtime.server.address() as AddressInfo;

      const response = await fetch(`http://127.0.0.1:${runtimeAddress.port}/v1/tasks/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "life-secretary-agent",
          mode: "generate",
          trace: {
            traceId: "trace-jarvis-apply-1",
            source: "mindanchor-gateway",
            operation: "generate",
            agentName: "life-secretary-agent",
            workflow: "plan_adjustment",
            userId: "demo-user",
          },
          payload: {
            userPrompt: JSON.stringify({
              workflow: "plan_adjustment",
              applyAuthority: true,
              gatewayBaseUrl: `http://127.0.0.1:${gatewayAddress.port}`,
              action: "task_order",
              userId: "demo-user",
              goalId: goal.id,
              riskLevel: "low",
              rationale: "下午精力更适合先做深度任务。",
              tasks: [
                { id: taskA.id, title: "收邮箱", status: "todo", priority: "medium", sortOrder: 1 },
                { id: taskB.id, title: "深度工作", status: "todo", priority: "high", sortOrder: 0 },
              ],
            }),
          },
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        metadata: {
          authorityApply?: {
            attempted: boolean;
            applied: boolean;
            error: string | null;
            endpoint: string | null;
            status: string | null;
            readModelRefresh?: {
              goalFlow?: {
                tasks: Array<{ id: string }>;
              };
            } | null;
          };
        };
      };

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.metadata.authorityApply).toEqual({
        attempted: true,
        applied: true,
        error: null,
        endpoint: "/internal/agent-authority/jarvis/execute",
        status: "applied",
        readModelRefresh: expect.objectContaining({
          goalFlow: expect.objectContaining({
            tasks: expect.arrayContaining([expect.objectContaining({ id: taskB.id })]),
          }),
        }),
      });

      const reloaded = new MindAnchorStore(env.dataFile);
      await reloaded.init();
      expect(reloaded.listTasks("demo-user", goal.id).map((task) => task.id)).toEqual([taskB.id, taskA.id]);
      expect(reloaded.listPlanChangeCommandLogs("demo-user")).toHaveLength(1);
    } finally {
      await app?.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  });

  it("applies Data governance through Gateway when applyAuthority is enabled", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-runtime-data-"));
    let app: Awaited<ReturnType<typeof buildApp>> | null = null;

    try {
      const env: AppEnv = {
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

      const store = new MindAnchorStore(env.dataFile);
      await store.init();
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

      app = await buildApp(env);
      await app.listen({ port: 0, host: "127.0.0.1" });
      const gatewayAddress = app.server.address() as AddressInfo;

      const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
      servers.push(runtime);
      await runtime.start();
      const runtimeAddress = runtime.server.address() as AddressInfo;

      const response = await fetch(`http://127.0.0.1:${runtimeAddress.port}/v1/tasks/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: "memory-governor-agent",
          mode: "generate",
          trace: {
            traceId: "trace-data-apply-1",
            source: "mindanchor-gateway",
            operation: "generate",
            agentName: "memory-governor-agent",
            workflow: "memory_governance",
            userId: "demo-user",
          },
          payload: {
            userPrompt: JSON.stringify({
              workflow: "memory_governance",
              applyAuthority: true,
              gatewayBaseUrl: `http://127.0.0.1:${gatewayAddress.port}`,
              action: "accept_candidate",
              userId: "demo-user",
              candidateId: candidate.candidateId,
              rationale: "该候选记忆已在多轮对话中重复出现。",
            }),
          },
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        metadata: {
          authorityApply?: {
            attempted: boolean;
            applied: boolean;
            error: string | null;
            endpoint: string | null;
            status: string | null;
          };
        };
      };

      expect(response.status).toBe(200);
      expect(payload.success).toBe(true);
      expect(payload.metadata.authorityApply).toEqual(
        expect.objectContaining({
          attempted: true,
          applied: true,
          error: null,
          endpoint: "/internal/agent-authority/data/execute",
          status: "accepted",
          readModelRefresh: expect.objectContaining({
            dashboard: expect.any(Object),
            goalFlow: expect.any(Object),
            inboxOverview: expect.any(Object),
          }),
        }),
      );

      const reloaded = new MindAnchorStore(env.dataFile);
      await reloaded.init();
      expect(reloaded.listRecallEligibleMemory("demo-user")).toHaveLength(1);
    } finally {
      await app?.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  });
});
