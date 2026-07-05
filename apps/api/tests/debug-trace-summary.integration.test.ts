import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { MindAnchorStore } from "../src/store.js";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";

describe("debug trace conversation summary", () => {
  let dataDir = "";
  let env: AppEnv;
  let store: MindAnchorStore;
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-debug-trace-summary-"));
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

  it("marks provider-direct conversation traces as degraded with an explicit reason", async () => {
    const traceId = "trace-provider-direct-conversation";

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.route.selected",
      message: "Coach route selected",
      metadata: {
        frontAgent: "companion-agent",
        consultedAgent: "analyst-agent",
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "model-bridge",
      event: "openclaw.adapter.decision",
      message: "Adapter routed companion-agent via provider-direct",
      metadata: {
        agentName: "companion-agent",
        workflow: "coach_conversation_fast",
        route: "provider-direct",
        selectedEndpoint: "/v1/responses",
        fallbackReason: null,
      },
    });

    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: `/debug/traces/${traceId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().summary).toEqual(
      expect.objectContaining({
        conversationPath: expect.objectContaining({
          frontAgent: "companion-agent",
          consultedAgent: "analyst-agent",
          runtimeSource: "provider-direct",
          primaryRoute: "provider-direct",
          routeStatusSummary: "Provider-direct path: cluster was not used for this conversation.",
          degradedSummary: "Conversation degraded because cluster was bypassed and provider-direct handled the response.",
          usedOpenClaw: false,
          hadFallback: false,
          degraded: true,
          degradedReason: "cluster_disabled_or_not_used",
        }),
      }),
    );
  });

  it("marks original runtime conversation traces with an explicit runtime source", async () => {
    const traceId = "trace-original-runtime-conversation";

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.route.selected",
      message: "Coach route selected",
      metadata: {
        frontAgent: "companion-agent",
        consultedAgent: null,
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "model-bridge",
      event: "openclaw.original-runtime.request.succeeded",
      message: "Original OpenClaw runtime generate succeeded for companion-agent",
      metadata: {
        agentName: "companion-agent",
        workflow: "coach_conversation_fast",
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "model-bridge",
      event: "openclaw.adapter.decision",
      message: "Adapter routed companion-agent via cluster",
      metadata: {
        agentName: "companion-agent",
        workflow: "coach_conversation_fast",
        route: "cluster",
        selectedEndpoint: "cluster:/v1/tasks/execute",
        fallbackReason: null,
      },
    });

    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: `/debug/traces/${traceId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().summary).toEqual(
      expect.objectContaining({
        conversationPath: expect.objectContaining({
          frontAgent: "companion-agent",
          runtimeSource: "original-runtime",
          primaryRoute: "cluster",
          usedOpenClaw: true,
          hadFallback: false,
          degraded: false,
        }),
      }),
    );
  });

  it("includes memory usage summary inside conversation trace summaries", async () => {
    const traceId = "trace-conversation-memory-summary";

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.route.selected",
      message: "Coach route selected",
      metadata: {
        frontAgent: "companion-agent",
        consultedAgent: null,
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.memory.recalled",
      message: "Coach memory recalled",
      metadata: {
        count: 3,
        sourceCounts: {
          "coach-memory": 2,
          "front-agent-state": 1,
        },
        scopeEntryCounts: {
          preferences: 2,
          habits: 0,
          constraints: 0,
          recentContext: 1,
        },
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "model-bridge",
      event: "openclaw.adapter.decision",
      message: "Adapter routed companion-agent via cluster",
      metadata: {
        agentName: "companion-agent",
        workflow: "coach_conversation_fast",
        route: "cluster",
        selectedEndpoint: "cluster:/v1/tasks/execute",
        fallbackReason: null,
      },
    });

    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: `/debug/traces/${traceId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().summary).toEqual(
      expect.objectContaining({
        conversationPath: expect.objectContaining({
          frontAgent: "companion-agent",
          usedOpenClaw: true,
          memoryUsage: {
            recalledCount: 3,
            sourceCounts: {
              "coach-memory": 2,
              "front-agent-state": 1,
            },
            scopeEntryCounts: {
              preferences: 2,
              habits: 0,
              constraints: 0,
              recentContext: 1,
            },
          },
        }),
      }),
    );
  });

  it("includes route and authority summaries inside conversation trace summaries", async () => {
    const traceId = "trace-conversation-routing-and-authority-summary";

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.route.selected",
      message: "Coach route selected",
      metadata: {
        frontAgent: "life-secretary-agent",
        consultedAgent: "companion-agent",
        visibleSummary: "Picard routed this turn to Jarvis and consulted Deanna Troi.",
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.authority.handoff.completed",
      message: "Coach authority handoff completed",
      metadata: {
        authorityAgent: "life-secretary-agent",
        targetKind: "task_order",
        executionStatus: "applied",
        summary: "Jarvis reordered the next steps into a lower-pressure sequence.",
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "model-bridge",
      event: "openclaw.adapter.decision",
      message: "Adapter routed life-secretary-agent via cluster",
      metadata: {
        agentName: "life-secretary-agent",
        workflow: "coach_conversation_full",
        route: "cluster",
        selectedEndpoint: "cluster:/v1/tasks/execute",
        fallbackReason: null,
      },
    });

    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: `/debug/traces/${traceId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().summary).toEqual(
      expect.objectContaining({
        conversationPath: expect.objectContaining({
          frontAgent: "life-secretary-agent",
          consultedAgent: "companion-agent",
          authorityAgent: "life-secretary-agent",
          authorityTarget: "task_order",
          authorityExecutionStatus: "applied",
          routeStatusSummary: "Cluster path healthy: OpenClaw handled the conversation without fallback.",
          degradedSummary: null,
          routeSummary: "Picard routed this turn to Jarvis and consulted Deanna Troi.",
          authoritySummary: "Jarvis reordered the next steps into a lower-pressure sequence.",
        }),
      }),
    );
  });

  it("includes aggregated route metrics inside conversation trace summaries", async () => {
    const traceId = "trace-conversation-route-metrics";

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.route.selected",
      message: "Coach route selected",
      metadata: {
        frontAgent: "companion-agent",
        consultedAgent: "analyst-agent",
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "model-bridge",
      event: "openclaw.adapter.decision",
      message: "Adapter routed companion-agent via cluster",
      metadata: {
        agentName: "companion-agent",
        workflow: "coach_conversation_fast",
        route: "cluster",
        selectedEndpoint: "cluster:/v1/tasks/execute",
        fallbackReason: null,
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "model-bridge",
      event: "openclaw.adapter.decision",
      message: "Adapter routed analyst-agent via provider-fallback",
      metadata: {
        agentName: "analyst-agent",
        workflow: "coach_conversation_consult",
        route: "provider-fallback",
        selectedEndpoint: "/v1/responses",
        fallbackReason: "cluster_timeout",
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "model-bridge",
      event: "openclaw.adapter.decision",
      message: "Adapter routed companion-agent via provider-direct",
      metadata: {
        agentName: "companion-agent",
        workflow: "coach_conversation_full",
        route: "provider-direct",
        selectedEndpoint: "/v1/responses",
        fallbackReason: null,
      },
    });

    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: `/debug/traces/${traceId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().summary).toEqual(
      expect.objectContaining({
        conversationPath: expect.objectContaining({
          routeMetrics: {
            adapterDecisionCount: 3,
            agentCounts: {
              "companion-agent": 2,
              "analyst-agent": 1,
            },
            workflowCounts: {
              coach_conversation_fast: 1,
              coach_conversation_consult: 1,
              coach_conversation_full: 1,
            },
            routeCounts: {
              cluster: 1,
              "provider-fallback": 1,
              "provider-direct": 1,
            },
            fallbackReasonCounts: {
              cluster_timeout: 1,
            },
          },
        }),
      }),
    );
  });

  it("includes feedback-learning summaries inside conversation trace summaries", async () => {
    const traceId = "trace-conversation-feedback-learning-summary";

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.route.selected",
      message: "Coach route selected",
      metadata: {
        frontAgent: "companion-agent",
        consultedAgent: null,
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.feedback.strengthening.recalled",
      message: "Helpful-feedback strengthening candidates recalled for this turn",
      metadata: {
        candidateCount: 2,
        staleCandidateCount: 0,
        missingSourceMessageCount: 0,
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.feedback.strengthening.filtered",
      message: "Helpful-feedback strengthening candidates were filtered for this turn",
      metadata: {
        candidateCount: 0,
        staleCandidateCount: 1,
        missingSourceMessageCount: 1,
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "conversation-coach",
      event: "coach.feedback.strengthening.weakened",
      message: "Helpful-feedback strengthening candidates were weakened by unhelpful feedback",
      metadata: {
        rejectedCandidateCount: 1,
      },
    });

    await store.addTraceLogEvent({
      traceId,
      parentTraceId: undefined,
      level: "info",
      component: "model-bridge",
      event: "openclaw.adapter.decision",
      message: "Adapter routed companion-agent via cluster",
      metadata: {
        agentName: "companion-agent",
        workflow: "coach_conversation_full",
        route: "cluster",
        selectedEndpoint: "cluster:/v1/tasks/execute",
        fallbackReason: null,
      },
    });

    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: `/debug/traces/${traceId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().summary).toEqual(
      expect.objectContaining({
        conversationPath: expect.objectContaining({
          frontAgent: "companion-agent",
          feedbackLearning: {
            strengtheningRecalledCount: 2,
            staleFilteredCount: 1,
            missingSourceFilteredCount: 1,
            weakenedRejectedCandidateCount: 1,
          },
        }),
      }),
    );
  });
});
