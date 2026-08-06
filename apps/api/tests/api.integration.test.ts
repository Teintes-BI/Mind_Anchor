import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";

describe("MindAnchor API integration", () => {
  let dataDir = "";
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-api-"));
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
    app = await buildApp(env);
  });

  afterEach(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("returns an empty OpenClaw adapter status before any debug runs", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/adapter",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().clusterEnabled).toBe(false);
    expect(response.json().executionStrategy).toBe("provider-direct");
    expect(response.json().lastDecision).toBeNull();
    expect(response.json().lastFallback).toBeNull();
    expect(response.json().recentTimeline).toEqual([]);
    expect(response.json().failureCategoryCounts).toEqual({});
  });

  it("returns 401 for /me without a bearer token and resolves dev bypass auth when provided", async () => {
    const unauthorized = await app.inject({
      method: "GET",
      url: "/me",
    });
    expect(unauthorized.statusCode).toBe(401);

    const authorized = await app.inject({
      method: "GET",
      url: "/me",
      headers: {
        Authorization: "Bearer dev:mac-user:mac@example.com",
      },
    });

    expect(authorized.statusCode).toBe(200);
    expect(authorized.json()).toEqual({
      authenticated: true,
      user: {
        id: "mac-user",
        email: "mac@example.com",
        provider: "dev-bypass",
      },
    });
  });

  it("returns authenticated bootstrap data for the current bearer user", async () => {
    await app.inject({
      method: "POST",
      url: "/goals",
      headers: {
        Authorization: "Bearer dev:bootstrap-user:bootstrap@example.com",
      },
      payload: {
        title: "Bootstrap goal",
        description: "Validate /client/bootstrap",
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/client/bootstrap",
      headers: {
        Authorization: "Bearer dev:bootstrap-user:bootstrap@example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().me.user.id).toBe("bootstrap-user");
    expect(response.json().me.authenticated).toBe(true);
    expect(response.json().dashboard.goals.length).toBeGreaterThan(0);
    expect(response.json().dashboard.summaryHeadline).toBeTypeOf("string");
    expect(response.json().inboxOverview).toBeDefined();
    expect(response.json().inboxOverview.metricCounts.totalMessages).toBeGreaterThanOrEqual(0);
    expect(response.json().goalFlow.goals.length).toBeGreaterThan(0);
    expect(response.json().goalFlow.summaryHeadline).toBeTypeOf("string");
    expect(response.json().permissions.notificationChannelRecommended).toBeTypeOf("string");
    expect(response.json().permissions.desktopSignalsExpected).toBe(true);
  });

  it("prefers the bearer user over an explicit query userId when reading state history", async () => {
    await app.inject({
      method: "POST",
      url: "/state/checkins",
      headers: {
        Authorization: "Bearer dev:token-history-user:history@example.com",
      },
      payload: {
        userId: "other-user",
        focusScore: 64,
        energyScore: 59,
        moodScore: 61,
        note: "Bearer identity should win over explicit userId.",
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/state/history?userId=other-user",
      headers: {
        Authorization: "Bearer dev:token-history-user:history@example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().assessments.length).toBeGreaterThan(0);
    expect(response.json().assessments[0].userId).toBe("token-history-user");
  });

  it("supports gateway-local registration and password login", async () => {
    const registerResponse = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "native-mac@example.com",
        password: "Password123",
        displayName: "Native Mac User",
      },
    });

    expect(registerResponse.statusCode).toBe(200);
    expect(registerResponse.json().user.email).toBe("native-mac@example.com");
    expect(registerResponse.json().user.provider).toBe("gateway-local");
    expect(typeof registerResponse.json().accessToken).toBe("string");
    expect(typeof registerResponse.json().refreshToken).toBe("string");

    const loginResponse = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "native-mac@example.com",
        password: "Password123",
      },
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.json().user.email).toBe("native-mac@example.com");
    expect(loginResponse.json().user.provider).toBe("gateway-local");
    expect(typeof loginResponse.json().refreshToken).toBe("string");

    const meResponse = await app.inject({
      method: "GET",
      url: "/me",
      headers: {
        Authorization: `Bearer ${loginResponse.json().accessToken}`,
      },
    });

    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json().authenticated).toBe(true);
    expect(meResponse.json().user.email).toBe("native-mac@example.com");
    expect(meResponse.json().user.provider).toBe("gateway-local");
  });

  it("rotates gateway-local refresh tokens and rejects reuse", async () => {
    const registerResponse = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "refresh-rotation@example.com",
        password: "Password123",
        displayName: "Refresh Rotation User",
      },
    });

    expect(registerResponse.statusCode).toBe(200);
    const firstRefreshToken = registerResponse.json().refreshToken;
    expect(typeof firstRefreshToken).toBe("string");

    const refreshResponse = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: {
        refreshToken: firstRefreshToken,
      },
    });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.json().user.email).toBe("refresh-rotation@example.com");
    expect(typeof refreshResponse.json().accessToken).toBe("string");
    expect(typeof refreshResponse.json().refreshToken).toBe("string");
    expect(refreshResponse.json().refreshToken).not.toBe(firstRefreshToken);

    const meResponse = await app.inject({
      method: "GET",
      url: "/me",
      headers: {
        Authorization: `Bearer ${refreshResponse.json().accessToken}`,
      },
    });

    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json().user.email).toBe("refresh-rotation@example.com");

    const oldRefreshReuse = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: {
        refreshToken: firstRefreshToken,
      },
    });

    expect(oldRefreshReuse.statusCode).toBe(401);
  });

  it("revokes gateway-local refresh tokens on logout", async () => {
    const registerResponse = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        email: "logout-revoke@example.com",
        password: "Password123",
        displayName: "Logout Revoke User",
      },
    });

    expect(registerResponse.statusCode).toBe(200);
    const refreshToken = registerResponse.json().refreshToken;

    const logoutResponse = await app.inject({
      method: "POST",
      url: "/auth/logout",
      payload: {
        refreshToken,
      },
    });

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.json()).toEqual({ revoked: true });

    const postLogoutRefresh = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      payload: {
        refreshToken,
      },
    });

    expect(postLogoutRefresh.statusCode).toBe(401);
  });

  it("returns aggregated recovery history after an interrupted focus session", async () => {
    const goalResponse = await app.inject({
      method: "POST",
      url: "/goals",
      payload: {
        userId: "demo-user",
        title: "Recover work rhythm",
        description: "Validate the recovery view read model",
      },
    });
    const goal = goalResponse.json();

    const taskResponse = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        userId: "demo-user",
        goalId: goal.id,
        title: "Resume deep work",
        priority: "high",
        estimatedMinutes: 45,
      },
    });
    const task = taskResponse.json();

    const startResponse = await app.inject({
      method: "POST",
      url: "/sessions/start",
      payload: {
        userId: "demo-user",
        taskId: task.id,
        goalId: goal.id,
      },
    });
    const session = startResponse.json();

    const endResponse = await app.inject({
      method: "POST",
      url: "/sessions/end",
      payload: {
        sessionId: session.id,
        interrupted: true,
        summary: "Interrupted by context switching.",
      },
    });

    expect(endResponse.statusCode).toBe(200);
    expect(endResponse.json().recoveryPlan).not.toBeNull();

    const historyResponse = await app.inject({
      method: "GET",
      url: "/recovery/history",
    });

    expect(historyResponse.statusCode).toBe(200);
    expect(historyResponse.json().activeSession).toBeNull();
    expect(historyResponse.json().interruptedSessions).toHaveLength(1);
    expect(historyResponse.json().interruptedSessions[0].id).toBe(session.id);
    expect(historyResponse.json().recoveryPlans.length).toBeGreaterThan(0);
    expect(historyResponse.json().recoveryPlans[0].taskId).toBe(task.id);
    expect(historyResponse.json().interventions.length).toBeGreaterThan(0);
    expect(historyResponse.json().pendingTasks.some((item: { id: string }) => item.id === task.id)).toBe(true);
    expect(typeof historyResponse.json().suggestedFocusTaskId).toBe("string");
  });

  it("uses cluster-first task ordering when building recovery history", async () => {
    const clusterRequests: Array<{ target: string; body: string }> = [];
    const providerRequests: Array<{ auth: string; body: string }> = [];

    const cluster = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const parsed = JSON.parse(body) as { target?: string };
        clusterRequests.push({
          target: String(parsed.target ?? ""),
          body,
        });

        const payload =
          parsed.target === "chief-agent"
            ? {
                workflow: "task_management",
                selectedAgent: "task-management-agent",
                reason: "Recovery history should be ordered by task-management-agent.",
                executionMode: "agent",
                confidence: 0.97,
              }
            : {
                orderedTaskIds: ["task_recovery", "task_active", "task_backlog"],
                summary: "Cluster reordered recovery candidates.",
                suggestedTasks: [],
              };

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            taskId: "cluster-task",
            trace: {
              traceId: "cluster-trace",
              parentTraceId: req.headers["x-mindanchor-trace-id"] ?? undefined,
            },
            parsed: payload,
            metadata: {
              runtime: "openclaw-cluster",
              worker: "cluster-worker",
            },
          }),
        );
      });
    });

    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        providerRequests.push({
          auth: String(req.headers.authorization ?? ""),
          body,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: "{}" }));
      });
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-recovery-cluster-first.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: clusterBaseUrl,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey: `${agentName}-key`,
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const goalResponse = await openAiApp.inject({
          method: "POST",
          url: "/goals",
          payload: {
            userId: "recovery-cluster-user",
            title: "Cluster-first Recovery",
            description: "Verify recovery history migration",
          },
        });
        expect(goalResponse.statusCode).toBe(201);
        const goal = goalResponse.json();

        const activeTaskResponse = await openAiApp.inject({
          method: "POST",
          url: "/tasks",
          payload: {
            userId: "recovery-cluster-user",
            goalId: goal.id,
            title: "Active task",
            priority: "high",
            estimatedMinutes: 30,
            sortOrder: 0,
          },
        });
        const recoveryTaskResponse = await openAiApp.inject({
          method: "POST",
          url: "/tasks",
          payload: {
            userId: "recovery-cluster-user",
            goalId: goal.id,
            title: "Recovery candidate",
            priority: "critical",
            estimatedMinutes: 20,
            sortOrder: 1,
          },
        });
        const backlogTaskResponse = await openAiApp.inject({
          method: "POST",
          url: "/tasks",
          payload: {
            userId: "recovery-cluster-user",
            goalId: goal.id,
            title: "Backlog task",
            priority: "low",
            estimatedMinutes: 15,
            sortOrder: 2,
          },
        });

        const activeTask = activeTaskResponse.json();
        const recoveryTask = recoveryTaskResponse.json();
        const backlogTask = backlogTaskResponse.json();

        await openAiApp.inject({
          method: "PATCH",
          url: `/tasks/${activeTask.id}`,
          payload: {
            status: "in_progress",
          },
        });

        const sessionStart = await openAiApp.inject({
          method: "POST",
          url: "/sessions/start",
          payload: {
            userId: "recovery-cluster-user",
            taskId: activeTask.id,
            goalId: goal.id,
          },
        });
        const session = sessionStart.json();

        await openAiApp.inject({
          method: "POST",
          url: "/sessions/end",
          payload: {
            sessionId: session.id,
            interrupted: true,
            summary: "Interrupted during migration test.",
          },
        });

        clusterRequests.length = 0;
        providerRequests.length = 0;

        const historyResponse = await openAiApp.inject({
          method: "GET",
          url: "/recovery/history?userId=recovery-cluster-user",
        });

        expect(historyResponse.statusCode).toBe(200);
        expect(historyResponse.json().pendingTasks.map((task: { id: string }) => task.id).slice(0, 3)).toEqual([
          recoveryTask.id,
          activeTask.id,
          backlogTask.id,
        ]);
        expect(historyResponse.json().suggestedFocusTaskId).toBe(activeTask.id);
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(clusterRequests).toHaveLength(2);
    expect(clusterRequests.map((request) => request.target)).toEqual(["chief-agent", "task-management-agent"]);
    expect(providerRequests).toHaveLength(0);
  });

  it("uses cluster-first behavior conclusions and notification content", async () => {
    const clusterRequests: Array<{ target: string; body: string }> = [];
    const providerRequests: Array<{ auth: string; body: string }> = [];

    const cluster = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const parsed = JSON.parse(body) as { target?: string; payload?: { userPrompt?: string } };
        const target = String(parsed.target ?? "");
        const promptPayload =
          typeof parsed.payload?.userPrompt === "string" && parsed.payload.userPrompt.length > 0 ? JSON.parse(parsed.payload.userPrompt) : {};

        clusterRequests.push({
          target,
          body,
        });

        let responsePayload: Record<string, unknown>;
        if (target === "chief-agent") {
          const workflow = promptPayload?.workflow ?? promptPayload?.chiefRoute?.workflow ?? "state_assessment";
          responsePayload = {
            workflow,
            selectedAgent: workflow === "state_assessment" ? "state-insight-agent" : "automation-agent",
            reason: `Route ${workflow} through cluster.`,
            executionMode: "agent",
            confidence: 0.98,
          };
        } else if (target === "state-insight-agent") {
          responsePayload = {
            userId: "cluster-behavior-user",
            windowStart: new Date(Date.now() - 60_000).toISOString(),
            windowEnd: new Date().toISOString(),
            focusScore: 28,
            energyScore: 31,
            moodScore: 42,
            summary: "cluster-state-summary",
            recommendedAction: "cluster-recommended-action",
            activeInputs: ["desktop_signal", "health_bridge"],
            mediaFreshness: "fresh",
          };
        } else if (target === "automation-agent" && promptPayload?.intent === "behavior_conclusion") {
          responsePayload = {
            userId: "cluster-behavior-user",
            riskLevel: "high",
            summary: "cluster-behavior-summary",
            suggestedAction: "cluster-behavior-action",
            trigger: "high_risk_state",
            recommendedChannel: "mobile_push",
          };
        } else {
          responsePayload = {
            title: "cluster-notification-title",
            message: "cluster-notification-message",
            channel: "mobile_push",
            deliver: true,
          };
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            taskId: "cluster-task",
            trace: {
              traceId: "cluster-trace",
              parentTraceId: req.headers["x-mindanchor-trace-id"] ?? undefined,
            },
            parsed: responsePayload,
            metadata: {
              runtime: "openclaw-cluster",
              worker: "cluster-worker",
            },
          }),
        );
      });
    });

    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        providerRequests.push({
          auth: String(req.headers.authorization ?? ""),
          body,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: "{}" }));
      });
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-behavior-cluster-first.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: clusterBaseUrl,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey: `${agentName}-key`,
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        await openAiApp.inject({
          method: "POST",
          url: "/devices/register",
          payload: {
            userId: "cluster-behavior-user",
            deviceId: "cluster-mobile",
            label: "Cluster Mobile",
            deviceType: "mobile",
            platform: "android",
            capabilities: ["notifications", "health_bridge"],
          },
        });

        clusterRequests.length = 0;
        providerRequests.length = 0;

        const signalResponse = await openAiApp.inject({
          method: "POST",
          url: "/state/signals/batch",
          payload: {
            events: [
              {
                userId: "cluster-behavior-user",
                source: "desktop",
                eventType: "idle",
                occurredAt: new Date().toISOString(),
                payload: { idleSeconds: 420 },
              },
            ],
          },
        });
        expect(signalResponse.statusCode).toBe(200);

        const latestStateResponse = await openAiApp.inject({
          method: "GET",
          url: "/state/latest?userId=cluster-behavior-user",
        });
        expect(latestStateResponse.statusCode).toBe(200);
        expect(latestStateResponse.json().latestAssessment.summary).toBe("cluster-state-summary");
        expect(latestStateResponse.json().latestBehaviorConclusion.summary).toBe("cluster-behavior-summary");
        expect(latestStateResponse.json().latestBehaviorConclusion.suggestedAction).toBe("cluster-behavior-action");
        expect(latestStateResponse.json().latestBehaviorConclusion.recommendedChannel).toBe("mobile_push");

        const inboxOverviewResponse = await openAiApp.inject({
          method: "GET",
          url: "/client/inbox/overview?userId=cluster-behavior-user",
        });
        expect(inboxOverviewResponse.statusCode).toBe(200);
        expect(inboxOverviewResponse.json().messages[0].title).toBe("cluster-notification-title");
        expect(inboxOverviewResponse.json().messages[0].message).toContain("cluster-notification-message");
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(clusterRequests.map((request) => request.target)).toEqual([
      "chief-agent",
      "state-insight-agent",
      "chief-agent",
      "automation-agent",
      "chief-agent",
      "automation-agent",
    ]);
    expect(providerRequests).toHaveLength(0);
  });

  it("returns a state trends read model for the State page", async () => {
    const signalResponse = await app.inject({
      method: "POST",
      url: "/state/signals/batch",
      payload: {
        events: [
          {
            userId: "demo-user",
            source: "desktop",
            eventType: "idle",
            occurredAt: new Date().toISOString(),
            payload: { idleSeconds: 180 },
          },
        ],
      },
    });

    expect(signalResponse.statusCode).toBe(200);

    const healthConsent = await app.inject({
      method: "PATCH",
      url: "/wayfinder/consent/health",
      headers: { authorization: "Bearer dev:demo-user:demo@example.com" },
      payload: {
        purpose: "wayfinder_health_summary",
        scope: "health_summary",
        status: "granted",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 30,
        modelSharing: "local_only",
      },
    });
    expect(healthConsent.statusCode).toBe(200);

    const healthResponse = await app.inject({
      method: "POST",
      url: "/health/snapshots",
      headers: { authorization: "Bearer dev:demo-user:demo@example.com" },
      payload: {
        userId: "demo-user",
        sourcePlatform: "ios",
        sourceProvider: "healthkit",
        windowStart: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        windowEnd: new Date().toISOString(),
        heartRate: 61,
        oxygenSaturation: 98,
        sleepMinutes: 430,
        summary: "Recovered well overnight.",
        consentRef: healthConsent.json().id,
      },
    });

    expect(healthResponse.statusCode).toBe(201);

    const trendsResponse = await app.inject({
      method: "GET",
      url: "/state/trends",
    });

    expect(trendsResponse.statusCode).toBe(200);
    expect(trendsResponse.json().currentAssessment).not.toBeNull();
    expect(trendsResponse.json().metricCounts.assessments).toBeGreaterThan(0);
    expect(trendsResponse.json().metricCounts.healthSnapshots).toBeGreaterThan(0);
    expect(Array.isArray(trendsResponse.json().activeInputs)).toBe(true);
    expect(trendsResponse.json().assessments.length).toBeGreaterThan(0);
    expect(trendsResponse.json().healthSnapshots.length).toBeGreaterThan(0);
    expect(trendsResponse.json().latestBehaviorConclusion).not.toBeNull();
  });

  it("returns a reflections overview read model with weekly and monthly reports", async () => {
    const goalResponse = await app.inject({
      method: "POST",
      url: "/goals",
      payload: {
        userId: "demo-user",
        title: "Review a delivery week",
        description: "Seed enough context for reflection generation",
      },
    });
    const goal = goalResponse.json();

    await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        userId: "demo-user",
        goalId: goal.id,
        title: "Ship the reflection read model",
        priority: "high",
        estimatedMinutes: 60,
      },
    });

    await app.inject({
      method: "POST",
      url: "/state/checkins",
      payload: {
        userId: "demo-user",
        focusScore: 72,
        energyScore: 68,
        moodScore: 63,
        note: "Solid progress with a small interruption.",
      },
    });

    const overviewResponse = await app.inject({
      method: "GET",
      url: "/reflections/overview",
    });

    expect(overviewResponse.statusCode).toBe(200);
    expect(overviewResponse.json().latestWeekly).not.toBeNull();
    expect(overviewResponse.json().latestMonthly).not.toBeNull();
    expect(overviewResponse.json().reports.length).toBeGreaterThan(0);
    expect(overviewResponse.json().metricCounts.weeklyReports).toBeGreaterThan(0);
    expect(overviewResponse.json().metricCounts.monthlyReports).toBeGreaterThan(0);
    expect(overviewResponse.json().metricCounts.assessments).toBeGreaterThan(0);
  });

  it("returns an inbox overview read model with channel counts and ack state", async () => {
    const goalResponse = await app.inject({
      method: "POST",
      url: "/goals",
      payload: {
        userId: "demo-user",
        title: "Triage notifications",
        description: "Generate inbox activity",
      },
    });
    const goal = goalResponse.json();

    const taskResponse = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        userId: "demo-user",
        goalId: goal.id,
        title: "Ship inbox overview",
        priority: "high",
        estimatedMinutes: 30,
      },
    });
    const task = taskResponse.json();

    await app.inject({
      method: "POST",
      url: "/sessions/start",
      payload: {
        userId: "demo-user",
        goalId: goal.id,
        taskId: task.id,
      },
    });

    await app.inject({
      method: "POST",
      url: "/state/signals/batch",
      payload: {
        events: [
          {
            userId: "demo-user",
            source: "desktop",
            eventType: "idle",
            occurredAt: new Date().toISOString(),
            payload: { idleSeconds: 420 },
          },
        ],
      },
    });

    const inboxResponse = await app.inject({
      method: "GET",
      url: "/client/inbox",
    });
    expect(inboxResponse.statusCode).toBe(200);
    expect(inboxResponse.json().messages.length).toBeGreaterThan(0);

    const firstMessageId = inboxResponse.json().messages[0].id;
    await app.inject({
      method: "POST",
      url: `/client/inbox/${firstMessageId}/ack`,
    });

    const overviewResponse = await app.inject({
      method: "GET",
      url: "/client/inbox/overview",
    });

    expect(overviewResponse.statusCode).toBe(200);
    expect(overviewResponse.json().metricCounts.totalMessages).toBeGreaterThan(0);
    expect(overviewResponse.json().metricCounts.acknowledgedMessages).toBeGreaterThan(0);
    expect(Array.isArray(overviewResponse.json().channelCounts)).toBe(true);
    expect(overviewResponse.json().channelCounts.length).toBeGreaterThan(0);
    expect(overviewResponse.json().latestBehaviorConclusion).not.toBeNull();
    expect(overviewResponse.json().activeSession).not.toBeNull();
    expect(
      overviewResponse.json().acknowledgedMessages.some((message: { id: string; status: string }) => message.id === firstMessageId && message.status === "acknowledged"),
    ).toBe(true);
  });

  it("returns a GoalFlow overview read model with task metrics and focus suggestion", async () => {
    const goalResponse = await app.inject({
      method: "POST",
      url: "/goals",
      payload: {
        userId: "demo-user",
        title: "Ship GoalFlow overview",
        description: "Aggregate tasks, sessions, and focus hints",
      },
    });
    const goal = goalResponse.json();

    const taskResponse = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        userId: "demo-user",
        goalId: goal.id,
        title: "Implement GoalFlow read model",
        priority: "high",
        estimatedMinutes: 45,
      },
    });
    const task = taskResponse.json();

    await app.inject({
      method: "POST",
      url: "/sessions/start",
      payload: {
        userId: "demo-user",
        taskId: task.id,
        goalId: goal.id,
      },
    });

    const overviewResponse = await app.inject({
      method: "GET",
      url: "/goalflow/overview",
    });

    expect(overviewResponse.statusCode).toBe(200);
    expect(overviewResponse.json().goals.length).toBeGreaterThan(0);
    expect(overviewResponse.json().tasks.length).toBeGreaterThan(0);
    expect(overviewResponse.json().activeSession).not.toBeNull();
    expect(overviewResponse.json().suggestedFocusTaskId).toBe(task.id);
    expect(overviewResponse.json().metricCounts.goals).toBeGreaterThan(0);
    expect(overviewResponse.json().metricCounts.totalTasks).toBeGreaterThan(0);
    expect(typeof overviewResponse.json().summaryHeadline).toBe("string");
  });

  it("uses cluster-first progress summary when building the GoalFlow overview", async () => {
    const clusterRequests: Array<{ target: string; body: string }> = [];
    const providerRequests: Array<{ auth: string; body: string }> = [];

    const cluster = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const parsed = JSON.parse(body) as { target?: string };
        clusterRequests.push({
          target: String(parsed.target ?? ""),
          body,
        });

        let payload: Record<string, unknown> = {
          success: true,
          taskId: "cluster-task",
          trace: {
            traceId: "cluster-trace",
            parentTraceId: req.headers["x-mindanchor-trace-id"] ?? undefined,
          },
          metadata: {
            runtime: "openclaw-cluster",
            worker: "cluster-worker",
          },
        };

        if (parsed.target === "chief-agent") {
          payload = {
            ...payload,
            parsed: {
              workflow: "progress_summary",
              selectedAgent: "progress-feedback-agent",
              reason: "Route GoalFlow overview through progress feedback.",
              executionMode: "agent",
              confidence: 0.98,
            },
          };
        } else {
          payload = {
            ...payload,
            parsed: {
              summaryHeadline: "Cluster GoalFlow headline",
              completionRate: 0.5,
              completedTaskCount: 1,
              inProgressTaskCount: 1,
            },
          };
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(payload));
      });
    });

    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        providerRequests.push({
          auth: String(req.headers.authorization ?? ""),
          body,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: "{}" }));
      });
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-goalflow-cluster-first.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: clusterBaseUrl,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey: `${agentName}-key`,
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const goalResponse = await openAiApp.inject({
          method: "POST",
          url: "/goals",
          payload: {
            userId: "goalflow-cluster-user",
            title: "Cluster-first GoalFlow",
            description: "Verify read-model migration",
          },
        });
        expect(goalResponse.statusCode).toBe(201);
        const goal = goalResponse.json();

        const taskResponse = await openAiApp.inject({
          method: "POST",
          url: "/tasks",
          payload: {
            userId: "goalflow-cluster-user",
            goalId: goal.id,
            title: "Ship cluster-first GoalFlow overview",
            priority: "high",
            estimatedMinutes: 30,
          },
        });
        expect(taskResponse.statusCode).toBe(201);
        const task = taskResponse.json();

        await openAiApp.inject({
          method: "POST",
          url: "/sessions/start",
          payload: {
            userId: "goalflow-cluster-user",
            taskId: task.id,
            goalId: goal.id,
          },
        });

        clusterRequests.length = 0;
        providerRequests.length = 0;

        const overviewResponse = await openAiApp.inject({
          method: "GET",
          url: "/goalflow/overview?userId=goalflow-cluster-user",
        });

        expect(overviewResponse.statusCode).toBe(200);
        expect(overviewResponse.json().summaryHeadline).toBe("Cluster GoalFlow headline");
        expect(overviewResponse.json().suggestedFocusTaskId).toBe(task.id);
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(clusterRequests).toHaveLength(2);
    expect(clusterRequests.map((request) => request.target)).toEqual(["chief-agent", "progress-feedback-agent"]);
    expect(providerRequests).toHaveLength(0);
  });

  it("bootstraps demo-user data for local cluster manual verification", async () => {
    const bootstrapResponse = await app.inject({
      method: "POST",
      url: "/debug/local-cluster/bootstrap",
    });

    expect(bootstrapResponse.statusCode).toBe(200);
    expect(bootstrapResponse.json().userId).toBe("demo-user");
    expect(bootstrapResponse.json().sourceScenarioId).toBe("focus-recovery-loop");
    expect(bootstrapResponse.json().counts.tasks).toBeGreaterThan(0);
    expect(bootstrapResponse.json().counts.reflections).toBeGreaterThan(0);

    const recoveryResponse = await app.inject({
      method: "GET",
      url: "/recovery/history",
    });
    expect(recoveryResponse.statusCode).toBe(200);
    expect(recoveryResponse.json().recoveryPlans.length).toBeGreaterThan(0);

    const reflectionsResponse = await app.inject({
      method: "GET",
      url: "/reflections/overview",
    });
    expect(reflectionsResponse.statusCode).toBe(200);
    expect(reflectionsResponse.json().latestWeekly).not.toBeNull();

    const goalflowResponse = await app.inject({
      method: "GET",
      url: "/goalflow/overview",
    });
    expect(goalflowResponse.statusCode).toBe(200);
    expect(goalflowResponse.json().tasks.length).toBeGreaterThan(0);

    const inboxResponse = await app.inject({
      method: "GET",
      url: "/client/inbox/overview",
    });
    expect(inboxResponse.statusCode).toBe(200);
    expect(inboxResponse.json().messages.length).toBeGreaterThan(0);
  });

  it("runs the core gateway flow with backward-compatible endpoints", async () => {
    const goalResponse = await app.inject({
      method: "POST",
      url: "/goals",
      payload: {
        userId: "demo-user",
        title: "Ship MVP",
        description: "Build the first vertical slice",
      },
    });
    expect(goalResponse.statusCode).toBe(201);
    const goal = goalResponse.json();

    const taskResponse = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        userId: "demo-user",
        goalId: goal.id,
        title: "Implement gateway",
        priority: "high",
        estimatedMinutes: 30,
      },
    });
    expect(taskResponse.statusCode).toBe(201);
    const task = taskResponse.json();

    const sessionResponse = await app.inject({
      method: "POST",
      url: "/sessions/start",
      payload: {
        userId: "demo-user",
        taskId: task.id,
        goalId: goal.id,
      },
    });
    expect(sessionResponse.statusCode).toBe(201);
    const session = sessionResponse.json();

    const registerDeviceResponse = await app.inject({
      method: "POST",
      url: "/devices/register",
      payload: {
        userId: "demo-user",
        deviceId: "desktop-1",
        label: "Work Mac",
        deviceType: "desktop",
        platform: "macos",
        capabilities: ["desktop_signals", "video_capture", "notifications"],
        appVersion: "0.2.0",
      },
    });
    expect(registerDeviceResponse.statusCode).toBe(201);

    const signalResponse = await app.inject({
      method: "POST",
      url: "/state/signals/batch",
      payload: {
        events: [
          {
            userId: "demo-user",
            source: "desktop",
            eventType: "idle",
            occurredAt: new Date().toISOString(),
            payload: { idleSeconds: 300 },
          },
          {
            userId: "demo-user",
            source: "desktop",
            eventType: "window_switch",
            occurredAt: new Date().toISOString(),
            payload: { from: "Code", to: "Browser" },
          },
        ],
      },
    });
    expect(signalResponse.statusCode).toBe(200);
    expect(signalResponse.json().acceptedCount).toBe(2);

    const latestStateResponse = await app.inject({
      method: "GET",
      url: "/state/latest",
    });
    expect(latestStateResponse.statusCode).toBe(200);
    expect(latestStateResponse.json().latestAssessment).not.toBeNull();
    expect(latestStateResponse.json().latestBehaviorConclusion).not.toBeNull();

    const sessionEndResponse = await app.inject({
      method: "POST",
      url: "/sessions/end",
      payload: {
        sessionId: session.id,
        interrupted: true,
        summary: "Interrupted by context switching",
      },
    });
    expect(sessionEndResponse.statusCode).toBe(200);
    expect(sessionEndResponse.json().recoveryPlan).not.toBeNull();

    const inboxResponse = await app.inject({
      method: "GET",
      url: "/client/inbox",
    });
    expect(inboxResponse.statusCode).toBe(200);
    expect(inboxResponse.json().messages.length).toBeGreaterThan(0);
    const inboxMessageId = inboxResponse.json().messages[0]?.id;

    const acknowledgeResponse = await app.inject({
      method: "POST",
      url: `/client/inbox/${inboxMessageId}/ack`,
    });
    expect(acknowledgeResponse.statusCode).toBe(200);
    expect(acknowledgeResponse.json().status).toBe("acknowledged");

    const dashboardResponse = await app.inject({
      method: "GET",
      url: "/dashboard/summary",
    });
    expect(dashboardResponse.statusCode).toBe(200);
    expect(dashboardResponse.json().goalCount).toBe(1);
    expect(dashboardResponse.json().completionRate).toBeGreaterThanOrEqual(0);
    expect(dashboardResponse.json().edgeDevices.length).toBe(1);
    expect(dashboardResponse.json().inbox.some((message: { id: string; status: string }) => message.id === inboxMessageId && message.status === "acknowledged")).toBe(true);
  });

  it("creates starter task drafts automatically when a goal is created", async () => {
    const goalResponse = await app.inject({
      method: "POST",
      url: "/goals",
      payload: {
        userId: "draft-user",
        title: "Ship task drafts",
        description: "Validate automatic goal planning",
      },
    });
    expect(goalResponse.statusCode).toBe(201);
    const goal = goalResponse.json();

    const tasksResponse = await app.inject({
      method: "GET",
      url: `/tasks?userId=draft-user&goalId=${goal.id}`,
    });
    expect(tasksResponse.statusCode).toBe(200);
    const tasks = tasksResponse.json().tasks;

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].goalId).toBe(goal.id);
    expect(tasks.some((task: { title: string }) => task.title.includes("Ship task drafts"))).toBe(true);
  });

  it("seeds a debug scenario with deterministic agent test data", async () => {
    const scenarioListResponse = await app.inject({
      method: "GET",
      url: "/debug/scenarios",
    });
    expect(scenarioListResponse.statusCode).toBe(200);
    expect(scenarioListResponse.json().scenarios.length).toBeGreaterThan(0);

    const seedResponse = await app.inject({
      method: "POST",
      url: "/debug/scenarios/focus-recovery-loop/seed",
    });
    expect(seedResponse.statusCode).toBe(200);
    const seeded = seedResponse.json();
    expect(seeded.userId).toBe("debug-focus-user");
    expect(seeded.counts.tasks).toBeGreaterThan(0);
    expect(seeded.counts.assessments).toBeGreaterThan(0);
    expect(seeded.counts.inbox).toBeGreaterThan(0);

    const latestStateResponse = await app.inject({
      method: "GET",
      url: `/state/latest?userId=${seeded.userId}`,
    });
    expect(latestStateResponse.statusCode).toBe(200);
    expect(latestStateResponse.json().latestAssessment).not.toBeNull();
    expect(latestStateResponse.json().latestBehaviorConclusion).not.toBeNull();

    const inboxResponse = await app.inject({
      method: "GET",
      url: `/client/inbox?userId=${seeded.userId}`,
    });
    expect(inboxResponse.statusCode).toBe(200);
    expect(inboxResponse.json().messages.length).toBeGreaterThan(0);

    const debugResponse = await app.inject({
      method: "GET",
      url: `/debug/agent/state-insight?userId=${seeded.userId}&scenarioId=focus-recovery-loop`,
    });
    expect(debugResponse.statusCode).toBe(200);
    expect(typeof debugResponse.json().fallbackLikely).toBe("boolean");
    expect(typeof debugResponse.json().traceId).toBe("string");
    expect(typeof debugResponse.headers["x-mindanchor-trace-id"]).toBe("string");

    const historyResponse = await app.inject({
      method: "GET",
      url: `/debug/runs?userId=${seeded.userId}`,
    });
    expect(historyResponse.statusCode).toBe(200);
    expect(historyResponse.json().runs.some((run: { scenarioId?: string; agentName: string }) => run.scenarioId === "focus-recovery-loop" && run.agentName === "state-insight-agent")).toBe(true);
    expect(historyResponse.json().runs.every((run: { traceId: string }) => typeof run.traceId === "string")).toBe(true);

    const traceLookupResponse = await app.inject({
      method: "GET",
      url: `/debug/traces/${debugResponse.json().traceId}`,
    });
    expect(traceLookupResponse.statusCode).toBe(200);
    expect(traceLookupResponse.json().agentRuns.some((run: { traceId: string }) => run.traceId === debugResponse.json().traceId)).toBe(true);
    expect(traceLookupResponse.json().events.length).toBeGreaterThan(0);

    const clearHistoryResponse = await app.inject({
      method: "POST",
      url: "/debug/runs/clear",
      payload: { userId: seeded.userId },
    });
    expect(clearHistoryResponse.statusCode).toBe(200);

    const emptyHistoryResponse = await app.inject({
      method: "GET",
      url: `/debug/runs?userId=${seeded.userId}`,
    });
    expect(emptyHistoryResponse.statusCode).toBe(200);
    expect(emptyHistoryResponse.json().runs.length).toBe(0);
  });

  it("runs the full debug regression suite endpoint", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/debug/regressions/full-run",
    });

    expect(response.statusCode).toBe(200);
    const suite = response.json();
    expect(suite.suiteName).toBe("full-agent-regression");
    expect(typeof suite.traceId).toBe("string");
    expect(suite.probeSteps.length).toBeGreaterThan(0);
    expect(suite.probeSteps.every((step: { traceId?: string }) => typeof step.traceId === "string")).toBe(true);
    expect(suite.scenarioResults.length).toBe(3);
    expect(suite.totalSteps).toBeGreaterThan(suite.probeSteps.length);
    expect(suite.scenarioResults.some((scenario: { scenarioId: string; steps: Array<{ kind: string }> }) => scenario.scenarioId === "focus-recovery-loop" && scenario.steps.some((step) => step.kind === "seed"))).toBe(true);
  });

  it("lists and runs targeted override matrix regression cases", async () => {
    const caseListResponse = await app.inject({
      method: "GET",
      url: "/debug/regressions/matrix-cases",
    });

    expect(caseListResponse.statusCode).toBe(200);
    const caseList = caseListResponse.json() as {
      cases: Array<{ id: string; focusAgent: string }>;
    };
    expect(caseList.cases.length).toBeGreaterThanOrEqual(6);

    const response = await app.inject({
      method: "POST",
      url: "/debug/regressions/matrix-run",
      payload: {
        caseIds: ["automation-medium", "progress-high"],
      },
    });

    expect(response.statusCode).toBe(200);
    const matrix = response.json() as {
      matrixName: string;
      caseResults: Array<{
        caseId: string;
        focusAgent: string;
        resolvedConfigs: Array<{ target: string; reasoningEffort: string | null }>;
        steps: Array<{ label: string }>;
      }>;
      totalSteps: number;
    };

    expect(matrix.matrixName).toBe("agent-override-matrix");
    expect(typeof matrix.traceId).toBe("string");
    expect(matrix.caseResults).toHaveLength(2);
    expect(matrix.totalSteps).toBe(10);
    expect(matrix.caseResults.map((result) => result.caseId)).toEqual(["automation-medium", "progress-high"]);
    expect(matrix.caseResults.every((result) => result.steps.length === 5)).toBe(true);
    expect(matrix.caseResults.every((result) => typeof (result as { traceId?: string }).traceId === "string")).toBe(true);

    const automationCase = matrix.caseResults.find((result) => result.caseId === "automation-medium");
    const progressCase = matrix.caseResults.find((result) => result.caseId === "progress-high");
    expect(automationCase?.focusAgent).toBe("automation-agent");
    expect(progressCase?.focusAgent).toBe("progress-feedback-agent");
    expect(automationCase?.resolvedConfigs.some((config) => config.target === "automation-agent" && config.reasoningEffort === "medium")).toBe(true);
    expect(progressCase?.resolvedConfigs.some((config) => config.target === "progress-feedback-agent" && config.reasoningEffort === "high")).toBe(true);

    const historyResponse = await app.inject({
      method: "GET",
      url: "/debug/regressions/matrix-runs?limit=5",
    });

    expect(historyResponse.statusCode).toBe(200);
    const history = historyResponse.json() as {
      runs: Array<{
        id: string;
        requestedCaseIds: string[];
        caseResults: Array<{ caseId: string }>;
      }>;
    };
    expect(history.runs.length).toBeGreaterThanOrEqual(1);
    expect(history.runs[0]?.requestedCaseIds).toEqual(["automation-medium", "progress-high"]);
    expect(history.runs[0]?.caseResults.map((result) => result.caseId)).toEqual(["automation-medium", "progress-high"]);
    expect(typeof history.runs[0]?.traceId).toBe("string");

    const matrixTraceLookupResponse = await app.inject({
      method: "GET",
      url: `/debug/traces/${matrix.traceId}`,
    });
    expect(matrixTraceLookupResponse.statusCode).toBe(200);
    expect(matrixTraceLookupResponse.json().matrixRuns.some((run: { traceId: string }) => run.traceId === matrix.traceId)).toBe(true);
    expect(matrixTraceLookupResponse.json().events.length).toBeGreaterThan(0);

    const clearHistoryResponse = await app.inject({
      method: "POST",
      url: "/debug/regressions/matrix-runs/clear",
    });
    expect(clearHistoryResponse.statusCode).toBe(200);
    expect(clearHistoryResponse.json()).toEqual({ cleared: true });

    const emptyHistoryResponse = await app.inject({
      method: "GET",
      url: "/debug/regressions/matrix-runs?limit=5",
    });
    expect(emptyHistoryResponse.statusCode).toBe(200);
    expect(emptyHistoryResponse.json().runs).toHaveLength(0);
  });

  it("syncs task status with session lifecycle", async () => {
    const goalResponse = await app.inject({
      method: "POST",
      url: "/goals",
      payload: {
        userId: "demo-user",
        title: "Manual task lifecycle test",
        description: "Verify session-driven task transitions",
      },
    });
    expect(goalResponse.statusCode).toBe(201);
    const goal = goalResponse.json();

    const taskResponse = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        userId: "demo-user",
        goalId: goal.id,
        title: "Focus on integration wiring",
        priority: "high",
        estimatedMinutes: 20,
      },
    });
    expect(taskResponse.statusCode).toBe(201);
    const task = taskResponse.json();

    const sessionResponse = await app.inject({
      method: "POST",
      url: "/sessions/start",
      payload: {
        userId: "demo-user",
        taskId: task.id,
      },
    });
    expect(sessionResponse.statusCode).toBe(201);
    const session = sessionResponse.json();
    expect(session.goalId).toBe(goal.id);

    const tasksAfterStart = await app.inject({
      method: "GET",
      url: "/tasks",
    });
    expect(tasksAfterStart.statusCode).toBe(200);
    expect(tasksAfterStart.json().tasks.find((candidate: { id: string }) => candidate.id === task.id)?.status).toBe("in_progress");

    const sessionEndResponse = await app.inject({
      method: "POST",
      url: "/sessions/end",
      payload: {
        sessionId: session.id,
        interrupted: false,
        completeTask: true,
        summary: "Finished the planned focus block",
      },
    });
    expect(sessionEndResponse.statusCode).toBe(200);
    expect(sessionEndResponse.json().recoveryPlan).toBeNull();

    const tasksAfterEnd = await app.inject({
      method: "GET",
      url: "/tasks",
    });
    expect(tasksAfterEnd.statusCode).toBe(200);
    expect(tasksAfterEnd.json().tasks.find((candidate: { id: string }) => candidate.id === task.id)?.status).toBe("done");
  });

  it("updates task status and reflects progress in the dashboard summary", async () => {
    const goalResponse = await app.inject({
      method: "POST",
      url: "/goals",
      payload: {
        userId: "progress-user",
        title: "Track progress",
        description: "Validate task updates",
      },
    });
    const goal = goalResponse.json();

    const tasksResponse = await app.inject({
      method: "GET",
      url: `/tasks?userId=progress-user&goalId=${goal.id}`,
    });
    const firstTask = tasksResponse.json().tasks[0];

    const updateResponse = await app.inject({
      method: "PATCH",
      url: `/tasks/${firstTask.id}`,
      payload: {
        status: "done",
      },
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().status).toBe("done");

    const dashboardResponse = await app.inject({
      method: "GET",
      url: "/dashboard/summary?userId=progress-user",
    });
    expect(dashboardResponse.statusCode).toBe(200);
    expect(dashboardResponse.json().completedTaskCount).toBeGreaterThanOrEqual(1);
    expect(dashboardResponse.json().completionRate).toBeGreaterThan(0);
  });

  it("creates media upload sessions and server-side stub assessments", async () => {
    await app.inject({
      method: "POST",
      url: "/devices/register",
      payload: {
        userId: "demo-user",
        deviceId: "desktop-2",
        label: "Personal Desktop",
        deviceType: "desktop",
        platform: "windows",
        capabilities: ["video_capture", "notifications"],
      },
    });

    const uploadSessionResponse = await app.inject({
      method: "POST",
      url: "/media/upload-sessions",
      payload: {
        userId: "demo-user",
        deviceId: "desktop-2",
        mediaType: "video",
        contentType: "video/webm",
        plannedPartCount: 2,
        captureStartedAt: new Date(Date.now() - 15_000).toISOString(),
        captureEndedAt: new Date().toISOString(),
      },
    });
    expect(uploadSessionResponse.statusCode).toBe(201);
    const uploadSession = uploadSessionResponse.json();

    const partResponse = await app.inject({
      method: "POST",
      url: `/media/upload-sessions/${uploadSession.id}/parts`,
      payload: {
        sessionId: uploadSession.id,
        sequence: 0,
        checksum: "part-0",
        sizeBytes: 4096,
        startedAt: new Date(Date.now() - 15_000).toISOString(),
        endedAt: new Date(Date.now() - 10_000).toISOString(),
      },
    });
    expect(partResponse.statusCode).toBe(201);

    const completeResponse = await app.inject({
      method: "POST",
      url: `/media/upload-sessions/${uploadSession.id}/complete`,
      payload: {},
    });
    expect(completeResponse.statusCode).toBe(200);
    expect(completeResponse.json().status).toBe("completed");

    const latestStateResponse = await app.inject({
      method: "GET",
      url: "/state/latest",
    });
    expect(latestStateResponse.statusCode).toBe(200);
    expect(latestStateResponse.json().latestVideoAssessment).not.toBeNull();
  });

  it("records health snapshots and exposes them through health endpoints", async () => {
    const healthConsent = await app.inject({
      method: "PATCH",
      url: "/wayfinder/consent/health",
      headers: { authorization: "Bearer dev:demo-user:demo@example.com" },
      payload: {
        purpose: "wayfinder_health_summary",
        scope: "health_summary",
        status: "granted",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 30,
        modelSharing: "local_only",
      },
    });
    expect(healthConsent.statusCode).toBe(200);

    const snapshotResponse = await app.inject({
      method: "POST",
      url: "/health/snapshots",
      headers: { authorization: "Bearer dev:demo-user:demo@example.com" },
      payload: {
        userId: "demo-user",
        deviceId: "ios-1",
        sourcePlatform: "ios",
        sourceProvider: "healthkit",
        windowStart: new Date(Date.now() - 3_600_000).toISOString(),
        windowEnd: new Date().toISOString(),
        heartRate: 62,
        oxygenSaturation: 98,
        restingHeartRate: 58,
        sleepMinutes: 420,
        summary: "Recovered well overnight.",
        consentRef: healthConsent.json().id,
      },
    });
    expect(snapshotResponse.statusCode).toBe(201);

    const healthResponse = await app.inject({
      method: "GET",
      url: "/health/latest",
      headers: { authorization: "Bearer dev:demo-user:demo@example.com" },
    });
    expect(healthResponse.statusCode).toBe(200);
    expect(healthResponse.json().latest).not.toBeNull();

    const dashboardResponse = await app.inject({
      method: "GET",
      url: "/dashboard/summary",
    });
    expect(dashboardResponse.statusCode).toBe(200);
    expect(dashboardResponse.json().latestHealthSnapshot?.sourceProvider).toBe("healthkit");
  });

  it("routes agent calls through per-agent model config in openai-compatible mode", async () => {
    const requests: string[] = [];
    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        requests.push(String(req.headers.authorization ?? ""));
        const auth = String(req.headers.authorization ?? "");
        let output = "{}";

        if (auth === "Bearer state-key") {
          output = JSON.stringify({
            userId: "demo-user",
            windowStart: new Date(Date.now() - 60_000).toISOString(),
            windowEnd: new Date().toISOString(),
            focusScore: 77,
            energyScore: 66,
            moodScore: 61,
            summary: "state-from-provider",
            recommendedAction: "keep-going",
            activeInputs: ["desktop_signal"],
          });
        } else if (auth === "Bearer recovery-key") {
          output = JSON.stringify({
            reason: "provider-reason",
            nextStep: "provider-next-step",
            suggestedMinutes: 18,
            reprioritizedTaskIds: [],
          });
        } else if (auth === "Bearer reflection-key") {
          output = JSON.stringify({
            userId: "demo-user",
            periodType: "weekly",
            periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            periodEnd: new Date().toISOString(),
            highlights: ["provider-highlight"],
            blockers: ["provider-blocker"],
            trends: ["provider-trend"],
            nextSuggestions: ["provider-next"],
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: output, raw: body }));
      });
    });

    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));
    const address = provider.address() as AddressInfo;
    const providerBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-openai.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: undefined,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey:
                agentName === "state-insight-agent"
                  ? "state-key"
                  : agentName === "interruption-recovery-agent"
                    ? "recovery-key"
                    : agentName === "reflection-coach-agent"
                      ? "reflection-key"
                      : "default-key",
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        await openAiApp.inject({
          method: "POST",
          url: "/state/signals/batch",
          payload: {
            events: [
              {
                userId: "demo-user",
                source: "desktop",
                eventType: "idle",
                occurredAt: new Date().toISOString(),
                payload: { idleSeconds: 180 },
              },
            ],
          },
        });

        const stateResponse = await openAiApp.inject({ method: "GET", url: "/state/latest" });
        expect(stateResponse.json().latestAssessment.summary).toBe("state-from-provider");

        const recoveryResponse = await openAiApp.inject({
          method: "POST",
          url: "/recovery/plan",
          payload: {
            userId: "demo-user",
            reason: "manual_request",
          },
        });
        expect(recoveryResponse.json().nextStep).toBe("provider-next-step");

        const reflectionResponse = await openAiApp.inject({
          method: "GET",
          url: "/reflections/latest?periodType=weekly",
        });
        expect(reflectionResponse.json().reports[0].highlights[0]).toBe("provider-highlight");
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(requests).toContain("Bearer state-key");
    expect(requests).toContain("Bearer recovery-key");
    expect(requests).toContain("Bearer reflection-key");
  });

  it("exposes safe resolved agent config audit data without leaking keys", async () => {
    const env: AppEnv = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor-config-audit.json"),
      agentMode: "openai-compatible",
      openClawBaseUrl: undefined,
      feishuBotWebhookUrl: undefined,
      telegramBotToken: undefined,
      telegramChatId: undefined,
      defaultModelConfig: {
        baseUrl: "https://default.example",
        apiKey: "default-key",
        model: "gpt-5.4",
        wireApi: "responses",
        reasoningEffort: "xhigh",
        disableResponseStorage: true,
      },
      agentModelConfigs: Object.fromEntries(
        OPENCLAW_AGENT_NAMES.map((agentName) => [
          agentName,
          {
            baseUrl: "https://default.example",
            apiKey: agentName === "state-insight-agent" ? "state-key" : "default-key",
            model: agentName === "state-insight-agent" ? "state-specialist" : "gpt-5.4",
            wireApi: "responses",
            reasoningEffort: agentName === "state-insight-agent" ? "high" : "xhigh",
            disableResponseStorage: agentName === "state-insight-agent" ? false : true,
          },
        ]),
      ),
    };

    const openAiApp = await buildApp(env);
    try {
      const response = await openAiApp.inject({
        method: "GET",
        url: "/debug/agent-configs",
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json() as {
        defaultModelConfig: {
          hasApiKey: boolean;
        };
        agents: Array<{
          target: string;
          envPrefix: string;
          hasApiKey: boolean;
          differsFromDefault: Record<string, boolean>;
        }>;
      };
      const stateInsight = payload.agents.find((agent) => agent.target === "state-insight-agent");
      const chief = payload.agents.find((agent) => agent.target === "chief-agent");

      expect(payload.defaultModelConfig.hasApiKey).toBe(true);
      expect(stateInsight).toMatchObject({
        envPrefix: "MINDANCHOR_AGENT_STATE_INSIGHT_AGENT",
        hasApiKey: true,
        differsFromDefault: {
          baseUrl: false,
          apiKey: true,
          model: true,
          wireApi: false,
          reasoningEffort: true,
          disableResponseStorage: true,
        },
      });
      expect(chief?.differsFromDefault).toEqual({
        baseUrl: false,
        apiKey: false,
        model: false,
        wireApi: false,
        reasoningEffort: false,
        disableResponseStorage: false,
      });
      expect(response.body).not.toContain("default-key");
      expect(response.body).not.toContain("state-key");
    } finally {
      await openAiApp.close();
    }
  });

  it("prefers the remote OpenClaw cluster for debug routes and keeps the provider as fallback only", async () => {
    const clusterRequests: Array<{
      url: string;
      headers: Record<string, string | string[] | undefined>;
      body: string;
    }> = [];
    const providerRequests: Array<{
      url: string;
      headers: Record<string, string | string[] | undefined>;
      body: string;
    }> = [];

    const cluster = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        clusterRequests.push({
          url: req.url ?? "",
          headers: req.headers,
          body,
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            taskId: "cluster-task-1",
            trace: {
              traceId: "cluster-generated-trace",
              parentTraceId: req.headers["x-mindanchor-trace-id"] ?? undefined,
            },
            parsed: {
              userId: "debug-focus-user",
              windowStart: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              windowEnd: new Date().toISOString(),
              focusScore: 78,
              energyScore: 64,
              moodScore: 58,
              summary: "cluster-state-summary",
              recommendedAction: "cluster-next-action",
              activeInputs: ["desktop_signal", "health_bridge"],
              mediaFreshness: "fresh",
            },
            metadata: {
              runtime: "openclaw-cluster",
              worker: "state-insight-worker",
            },
          }),
        );
      });
    });

    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        providerRequests.push({
          url: req.url ?? "",
          headers: req.headers,
          body,
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            output_text: JSON.stringify({
              userId: "debug-focus-user",
              windowStart: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              windowEnd: new Date().toISOString(),
              focusScore: 10,
              energyScore: 10,
              moodScore: 10,
              summary: "provider-should-not-run",
              recommendedAction: "provider-should-not-run",
              activeInputs: ["desktop_signal"],
            }),
          }),
        );
      });
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-cluster-debug.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: clusterBaseUrl,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey: `${agentName}-key`,
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const seedResponse = await openAiApp.inject({
          method: "POST",
          url: "/debug/scenarios/focus-recovery-loop/seed",
        });
        expect(seedResponse.statusCode).toBe(200);

        const debugResponse = await openAiApp.inject({
          method: "GET",
          url: "/debug/agent/state-insight?userId=debug-focus-user&scenarioId=focus-recovery-loop",
          headers: {
            "x-mindanchor-trace-id": "request-trace-123",
          },
        });

        expect(debugResponse.statusCode).toBe(200);
        expect(debugResponse.json().success).toBe(true);
        expect(debugResponse.json().fallbackLikely).toBe(false);
        expect(debugResponse.json().normalizedJson.summary).toBe("cluster-state-summary");
        expect(debugResponse.json().config.baseUrl).toBe(clusterBaseUrl);

        const adapterResponse = await openAiApp.inject({
          method: "GET",
          url: "/debug/openclaw/adapter",
        });
        expect(adapterResponse.statusCode).toBe(200);
        expect(adapterResponse.json().executionStrategy).toBe("cluster-preferred");
        expect(adapterResponse.json().lastDecision.route).toBe("cluster");
        expect(adapterResponse.json().lastDecision.target).toBe("state-insight-agent");
        expect(adapterResponse.json().recentTimeline.length).toBeGreaterThan(0);
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(clusterRequests).toHaveLength(1);
    expect(clusterRequests[0]?.url).toBe("/v1/tasks/execute");
    expect(clusterRequests[0]?.headers["authorization"]).toBeUndefined();
    expect(clusterRequests[0]?.headers["x-mindanchor-parent-trace-id"]).toBe("request-trace-123");
    expect(providerRequests).toHaveLength(0);

    const clusterBody = JSON.parse(clusterRequests[0]?.body ?? "{}") as {
      target: string;
      mode: string;
      payload: {
        config: Record<string, unknown>;
      };
    };
    expect(clusterBody.target).toBe("state-insight-agent");
    expect(clusterBody.mode).toBe("debug");
    expect(clusterBody.payload.config).toEqual({
      wireApi: "responses",
      reasoningEffort: "xhigh",
      disableResponseStorage: true,
    });
  });

  it("exposes provider-fallback adapter status when cluster fails and provider succeeds", async () => {
    const cluster = createServer((_, res) => {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "cluster unavailable" }));
    });

    const provider = createServer((_, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          output_text: JSON.stringify({
            probe: "ok",
          }),
        }),
      );
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-cluster-fallback.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: clusterBaseUrl,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey: `${agentName}-key`,
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const probeResponse = await openAiApp.inject({
          method: "GET",
          url: "/debug/model-probe/state-insight-agent?userId=demo-user",
        });

        expect(probeResponse.statusCode).toBe(200);
        expect(probeResponse.json().success).toBe(true);
        expect(probeResponse.json().adapter.route).toBe("provider-fallback");

        const adapterResponse = await openAiApp.inject({
          method: "GET",
          url: "/debug/openclaw/adapter",
        });

        expect(adapterResponse.statusCode).toBe(200);
        expect(adapterResponse.json().lastDecision.route).toBe("provider-fallback");
        expect(adapterResponse.json().lastDecision.target).toBe("state-insight-agent");
        expect(adapterResponse.json().lastFallback.fallbackReason).toContain("HTTP 503");
        expect(adapterResponse.json().lastFallback.failureCategory).toBe("cluster_http_error");
        expect(adapterResponse.json().failureCategoryCounts).toEqual({
          cluster_http_error: 1,
        });
        expect(adapterResponse.json().recentTimeline[0].route).toBe("provider-fallback");
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("keeps adapter status on cluster when a known session lock recovers on same endpoint", async () => {
    const clusterRequests: string[] = [];
    const providerRequests: string[] = [];

    const cluster = createServer((req, res) => {
      clusterRequests.push(String(req.url ?? ""));
      if (clusterRequests.length === 1) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error:
              '[diagnostic] lane task error: lane=main durationMs=11485 error="Error: session file locked (timeout 10000ms): pid=15843 /Users/claw/.openclaw-dev/agents/state-insight-agent/sessions/demo"',
          }),
        );
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          taskId: "cluster-task-retry",
          trace: {
            traceId: "cluster-trace-retry",
          },
          parsed: {
            probe: "ok",
          },
          metadata: {
            runtime: "openclaw-cluster",
          },
        }),
      );
    });

    const provider = createServer((req, res) => {
      providerRequests.push(String(req.url ?? ""));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          output_text: JSON.stringify({
            probe: "ok",
          }),
        }),
      );
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-cluster-session-lock-retry.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: clusterBaseUrl,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey: `${agentName}-key`,
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const probeResponse = await openAiApp.inject({
          method: "GET",
          url: "/debug/model-probe/state-insight-agent?userId=demo-user",
        });

        expect(probeResponse.statusCode).toBe(200);
        expect(probeResponse.json().success).toBe(true);
        expect(probeResponse.json().adapter.route).toBe("cluster");
        expect(probeResponse.json().adapter.selectedEndpoint).toBe("cluster:/v1/tasks/execute");

        const adapterResponse = await openAiApp.inject({
          method: "GET",
          url: "/debug/openclaw/adapter",
        });

        expect(adapterResponse.statusCode).toBe(200);
        expect(adapterResponse.json().lastDecision.route).toBe("cluster");
        expect(adapterResponse.json().lastDecision.target).toBe("state-insight-agent");
        expect(adapterResponse.json().lastDecision.selectedEndpoint).toBe("cluster:/v1/tasks/execute");
        expect(adapterResponse.json().lastFallback).toBeNull();
        expect(adapterResponse.json().failureCategoryCounts).toEqual({});
        expect(adapterResponse.json().recentTimeline[0].route).toBe("cluster");
        expect(adapterResponse.json().recentTimeline[0].clusterAttempts).toEqual([
          expect.objectContaining({
            endpoint: "/v1/tasks/execute",
            ok: false,
            status: 500,
          }),
          expect.objectContaining({
            endpoint: "/v1/tasks/execute",
            ok: true,
            status: 200,
          }),
        ]);
        expect(clusterRequests).toEqual(["/v1/tasks/execute", "/v1/tasks/execute"]);
        expect(providerRequests).toEqual([]);
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("keeps adapter status on cluster when a transient transport error recovers on same endpoint", async () => {
    const clusterRequests: string[] = [];
    const providerRequests: string[] = [];

    const cluster = createServer((req, res) => {
      clusterRequests.push(String(req.url ?? ""));
      if (clusterRequests.length === 1) {
        req.socket.destroy();
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          taskId: "cluster-task-transport-retry",
          trace: {
            traceId: "cluster-trace-transport-retry",
          },
          parsed: {
            probe: "ok",
          },
          metadata: {
            runtime: "openclaw-cluster",
          },
        }),
      );
    });

    const provider = createServer((req, res) => {
      providerRequests.push(String(req.url ?? ""));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          output_text: JSON.stringify({
            probe: "ok",
          }),
        }),
      );
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-cluster-transport-retry.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: clusterBaseUrl,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey: `${agentName}-key`,
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const probeResponse = await openAiApp.inject({
          method: "GET",
          url: "/debug/model-probe/state-insight-agent?userId=demo-user",
        });

        expect(probeResponse.statusCode).toBe(200);
        expect(probeResponse.json().success).toBe(true);
        expect(probeResponse.json().adapter.route).toBe("cluster");
        expect(probeResponse.json().adapter.selectedEndpoint).toBe("cluster:/v1/tasks/execute");

        const adapterResponse = await openAiApp.inject({
          method: "GET",
          url: "/debug/openclaw/adapter",
        });

        expect(adapterResponse.statusCode).toBe(200);
        expect(adapterResponse.json().lastDecision.route).toBe("cluster");
        expect(adapterResponse.json().lastDecision.target).toBe("state-insight-agent");
        expect(adapterResponse.json().lastDecision.selectedEndpoint).toBe("cluster:/v1/tasks/execute");
        expect(adapterResponse.json().lastFallback).toBeNull();
        expect(adapterResponse.json().failureCategoryCounts).toEqual({});
        expect(adapterResponse.json().recentTimeline[0].route).toBe("cluster");
        expect(adapterResponse.json().recentTimeline[0].clusterAttempts).toEqual([
          expect.objectContaining({
            endpoint: "/v1/tasks/execute",
            ok: false,
            error: "fetch failed",
          }),
          expect.objectContaining({
            endpoint: "/v1/tasks/execute",
            ok: true,
            status: 200,
          }),
        ]);
        expect(clusterRequests).toEqual(["/v1/tasks/execute", "/v1/tasks/execute"]);
        expect(providerRequests).toEqual([]);
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("falls back at the gateway when a cluster debug payload only becomes valid after normalization", async () => {
    const clusterRequests: Array<{ url: string; body: string }> = [];
    const providerRequests: Array<{ url: string; body: string }> = [];

    const cluster = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        clusterRequests.push({
          url: String(req.url ?? ""),
          body,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            taskId: "cluster-task-invalid-debug",
            trace: {
              traceId: "cluster-trace-invalid-debug",
            },
            parsed: {
              unexpected: true,
            },
            metadata: {
              runtime: "openclaw-cluster",
            },
          }),
        );
      });
    });

    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        providerRequests.push({
          url: String(req.url ?? ""),
          body,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            output_text: JSON.stringify({
              userId: "debug-focus-user",
              windowStart: "2026-04-21T00:00:00.000Z",
              windowEnd: "2026-04-21T00:30:00.000Z",
              focusScore: 61,
              energyScore: 58,
              moodScore: 63,
              summary: "provider-state-summary",
              recommendedAction: "provider-next-step",
              activeInputs: ["desktop_signal"],
            }),
          }),
        );
      });
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-cluster-invalid-debug.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: clusterBaseUrl,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey: `${agentName}-key`,
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const seedResponse = await openAiApp.inject({
          method: "POST",
          url: "/debug/scenarios/focus-recovery-loop/seed",
        });
        expect(seedResponse.statusCode).toBe(200);

        const debugResponse = await openAiApp.inject({
          method: "GET",
          url: "/debug/agent/state-insight?userId=debug-focus-user&scenarioId=focus-recovery-loop",
        });

        expect(debugResponse.statusCode).toBe(200);
        expect(debugResponse.json().success).toBe(true);
        expect(debugResponse.json().fallbackLikely).toBe(true);
        expect(debugResponse.json().normalizedJson.summary).toBe("provider-state-summary");
        expect(debugResponse.json().adapter.route).toBe("provider-fallback");
        expect(debugResponse.json().adapter.fallbackReason).toContain("state-insight");
        expect(debugResponse.json().adapter.failureCategory).toBe("cluster_contract_failure");
        expect(debugResponse.json().config.baseUrl).toBe(providerBaseUrl);

        const adapterResponse = await openAiApp.inject({
          method: "GET",
          url: "/debug/openclaw/adapter",
        });

        expect(adapterResponse.statusCode).toBe(200);
        expect(adapterResponse.json().lastDecision.route).toBe("provider-fallback");
        expect(adapterResponse.json().lastDecision.target).toBe("state-insight-agent");
        expect(adapterResponse.json().lastFallback.fallbackReason).toContain("state-insight");
        expect(adapterResponse.json().lastFallback.failureCategory).toBe("cluster_contract_failure");
        expect(adapterResponse.json().failureCategoryCounts).toEqual({
          cluster_contract_failure: 1,
        });
        expect(adapterResponse.json().recentTimeline[0].route).toBe("provider-fallback");
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(clusterRequests).toHaveLength(1);
    expect(providerRequests).toHaveLength(1);
    expect(clusterRequests[0]?.url).toBe("/v1/tasks/execute");
    expect(providerRequests[0]?.url).toBe("/responses");
  });

  it("refreshes only the requested reflection period first, then keeps overview idempotent until inputs change", async () => {
    const requests: Array<{ auth: string; url: string }> = [];
    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const auth = String(req.headers.authorization ?? "");
        requests.push({ auth, url: String(req.url ?? "") });

        let output = "{}";
        if (auth === "Bearer chief-key") {
          output = JSON.stringify({
            workflow: "reflection_report",
            selectedAgent: "reflection-coach-agent",
            reason: "The request is about generating a reflection report.",
            executionMode: "agent",
            confidence: 0.99,
          });
        } else if (auth === "Bearer reflection-key") {
          const periodType = /\\"periodType\\":\s*\\"monthly\\"/.test(body) ? "monthly" : "weekly";
          output = JSON.stringify({
            userId: "reflection-freshness-user",
            periodType,
            periodStart:
              periodType === "monthly"
                ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            periodEnd: new Date().toISOString(),
            highlights: [`${periodType}-highlight`],
            blockers: [`${periodType}-blocker`],
            trends: [`${periodType}-trend`],
            nextSuggestions: [`${periodType}-next`],
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: output }));
      });
    });

    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));
    const address = provider.address() as AddressInfo;
    const providerBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-reflection-freshness.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: undefined,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey:
                agentName === "chief-agent"
                  ? "chief-key"
                  : agentName === "reflection-coach-agent"
                    ? "reflection-key"
                    : "default-key",
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const goalResponse = await openAiApp.inject({
          method: "POST",
          url: "/goals",
          payload: {
            userId: "reflection-freshness-user",
            title: "Validate reflection freshness",
            description: "Avoid duplicate weekly refreshes",
          },
        });
        expect(goalResponse.statusCode).toBe(201);
        const goal = goalResponse.json() as { id: string };

        const taskResponse = await openAiApp.inject({
          method: "POST",
          url: "/tasks",
          payload: {
            userId: "reflection-freshness-user",
            goalId: goal.id,
            title: "Create the initial reflection task",
            priority: "high",
            estimatedMinutes: 30,
          },
        });
        expect(taskResponse.statusCode).toBe(201);
        const task = taskResponse.json() as { id: string };

        const countRequests = (auth: string) => requests.filter((request) => request.auth === auth).length;
        requests.length = 0;

        const latestWeeklyResponse = await openAiApp.inject({
          method: "GET",
          url: "/reflections/latest?userId=reflection-freshness-user&periodType=weekly",
        });
        expect(latestWeeklyResponse.statusCode).toBe(200);
        expect(latestWeeklyResponse.json().reports).toHaveLength(1);
        expect(latestWeeklyResponse.json().reports[0].periodType).toBe("weekly");
        expect(latestWeeklyResponse.json().reports[0].highlights[0]).toBe("weekly-highlight");
        expect(countRequests("Bearer chief-key")).toBe(1);
        expect(countRequests("Bearer reflection-key")).toBe(1);

        const firstOverviewResponse = await openAiApp.inject({
          method: "GET",
          url: "/reflections/overview?userId=reflection-freshness-user",
        });
        expect(firstOverviewResponse.statusCode).toBe(200);
        expect(firstOverviewResponse.json().latestWeekly.highlights[0]).toBe("weekly-highlight");
        expect(firstOverviewResponse.json().latestMonthly.highlights[0]).toBe("monthly-highlight");
        expect(countRequests("Bearer chief-key")).toBe(2);
        expect(countRequests("Bearer reflection-key")).toBe(2);

        const secondOverviewResponse = await openAiApp.inject({
          method: "GET",
          url: "/reflections/overview?userId=reflection-freshness-user",
        });
        expect(secondOverviewResponse.statusCode).toBe(200);
        expect(countRequests("Bearer chief-key")).toBe(2);
        expect(countRequests("Bearer reflection-key")).toBe(2);

        const updateTaskResponse = await openAiApp.inject({
          method: "PATCH",
          url: `/tasks/${task.id}`,
          payload: {
            title: "Update reflection inputs to force refresh",
          },
        });
        expect(updateTaskResponse.statusCode).toBe(200);

        const refreshedOverviewResponse = await openAiApp.inject({
          method: "GET",
          url: "/reflections/overview?userId=reflection-freshness-user",
        });
        expect(refreshedOverviewResponse.statusCode).toBe(200);
        expect(countRequests("Bearer chief-key")).toBeGreaterThanOrEqual(4);
        expect(countRequests("Bearer reflection-key")).toBe(4);
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it("supports mixed chief and automation agent configs for notification debug flows", async () => {
    const requests: Array<{ auth: string; body: string }> = [];
    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const auth = String(req.headers.authorization ?? "");
        requests.push({ auth, body });

        let output = "{}";
        if (auth === "Bearer chief-key") {
          output = JSON.stringify({
            workflow: "notification_dispatch",
            selectedAgent: "automation-agent",
            reason: "The request is explicitly about dispatching a reminder, so route it to the automation agent.",
            executionMode: "agent",
            confidence: 0.99,
          });
        } else if (auth === "Bearer automation-key") {
          output = JSON.stringify({
            title: "Automation provider title",
            message: "Automation provider message",
            channel: "telegram_bot",
            deliver: true,
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: output, raw: body }));
      });
    });

    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));
    const address = provider.address() as AddressInfo;
    const providerBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-openai-chief-automation.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: undefined,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey:
                agentName === "chief-agent"
                  ? "chief-key"
                  : agentName === "automation-agent"
                    ? "automation-key"
                    : "default-key",
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: agentName === "automation-agent" ? "medium" : "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const seedResponse = await openAiApp.inject({
          method: "POST",
          url: "/debug/scenarios/focus-recovery-loop/seed",
        });
        expect(seedResponse.statusCode).toBe(200);
        const seeded = seedResponse.json() as { userId: string; scenarioId: string };

        const chiefRouteResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/chief-route?workflow=notification_dispatch&userId=${seeded.userId}&scenarioId=${seeded.scenarioId}`,
        });
        expect(chiefRouteResponse.statusCode).toBe(200);
        expect(chiefRouteResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "chief-agent",
            wireApi: "responses",
            reasoningEffort: "xhigh",
          },
          normalizedJson: {
            selectedAgent: "automation-agent",
            workflow: "notification_dispatch",
          },
        });

        const automationResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/automation?userId=${seeded.userId}&scenarioId=${seeded.scenarioId}`,
        });
        expect(automationResponse.statusCode).toBe(200);
        expect(automationResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "automation-agent",
            wireApi: "responses",
            reasoningEffort: "medium",
          },
          normalizedJson: {
            title: "Automation provider title",
            message: "Automation provider message",
            channel: "telegram_bot",
            deliver: true,
          },
        });
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(requests.some((request) => request.auth === "Bearer chief-key")).toBe(true);
    expect(requests.some((request) => request.auth === "Bearer automation-key")).toBe(true);
  });

  it("supports mixed chief and state-insight agent configs for state debug flows", async () => {
    const requests: Array<{ auth: string; body: string }> = [];
    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const auth = String(req.headers.authorization ?? "");
        requests.push({ auth, body });

        let output = "{}";
        if (auth === "Bearer chief-key") {
          output = JSON.stringify({
            workflow: "state_assessment",
            selectedAgent: "state-insight-agent",
            reason: "The request is a state assessment, so it should be routed to state-insight-agent.",
            executionMode: "agent",
            confidence: 0.98,
          });
        } else if (auth === "Bearer state-key") {
          output = JSON.stringify({
            userId: "debug-focus-user",
            windowStart: "2026-03-01T00:00:00.000Z",
            windowEnd: "2026-03-01T00:20:00.000Z",
            focusScore: 44,
            energyScore: 52,
            moodScore: 49,
            summary: "State provider summary",
            recommendedAction: "State provider action",
            activeInputs: ["desktop_signal", "manual_checkin"],
            mediaFreshness: "fresh",
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: output, raw: body }));
      });
    });

    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));
    const address = provider.address() as AddressInfo;
    const providerBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-openai-chief-state.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: undefined,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey:
                agentName === "chief-agent"
                  ? "chief-key"
                  : agentName === "state-insight-agent"
                    ? "state-key"
                    : "default-key",
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: agentName === "state-insight-agent" ? "high" : "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const seedResponse = await openAiApp.inject({
          method: "POST",
          url: "/debug/scenarios/focus-recovery-loop/seed",
        });
        expect(seedResponse.statusCode).toBe(200);
        const seeded = seedResponse.json() as { userId: string; scenarioId: string };

        const chiefRouteResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/chief-route?workflow=state_assessment&userId=${seeded.userId}&scenarioId=${seeded.scenarioId}`,
        });
        expect(chiefRouteResponse.statusCode).toBe(200);
        expect(chiefRouteResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "chief-agent",
            wireApi: "responses",
            reasoningEffort: "xhigh",
          },
          normalizedJson: {
            selectedAgent: "state-insight-agent",
            workflow: "state_assessment",
          },
        });

        const stateResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/state-insight?userId=${seeded.userId}&scenarioId=${seeded.scenarioId}`,
        });
        expect(stateResponse.statusCode).toBe(200);
        expect(stateResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "state-insight-agent",
            wireApi: "responses",
            reasoningEffort: "high",
          },
          normalizedJson: {
            summary: "State provider summary",
            recommendedAction: "State provider action",
            focusScore: 44,
            energyScore: 52,
            moodScore: 49,
          },
        });
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(requests.some((request) => request.auth === "Bearer chief-key")).toBe(true);
    expect(requests.some((request) => request.auth === "Bearer state-key")).toBe(true);
  });

  it("supports mixed chief and reflection agent configs for reflection debug flows", async () => {
    const requests: Array<{ auth: string; body: string }> = [];
    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const auth = String(req.headers.authorization ?? "");
        requests.push({ auth, body });

        let output = "{}";
        if (auth === "Bearer chief-key") {
          output = JSON.stringify({
            workflow: "reflection_report",
            selectedAgent: "reflection-coach-agent",
            reason: "The request is for a structured weekly reflection, so the reflection coach agent is the best fit.",
            executionMode: "agent",
            confidence: 0.98,
          });
        } else if (auth === "Bearer reflection-key") {
          output = JSON.stringify({
            userId: "debug-reflection-user",
            periodType: "weekly",
            periodStart: "2026-03-01T00:00:00.000Z",
            periodEnd: "2026-03-07T00:00:00.000Z",
            highlights: ["Reflection provider highlight"],
            blockers: ["Reflection provider blocker"],
            trends: ["Reflection provider trend"],
            nextSuggestions: ["Reflection provider next step"],
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: output, raw: body }));
      });
    });

    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));
    const address = provider.address() as AddressInfo;
    const providerBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-openai-chief-reflection.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: undefined,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey:
                agentName === "chief-agent"
                  ? "chief-key"
                  : agentName === "reflection-coach-agent"
                    ? "reflection-key"
                    : "default-key",
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: agentName === "reflection-coach-agent" ? "high" : "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const seedResponse = await openAiApp.inject({
          method: "POST",
          url: "/debug/scenarios/weekly-reflection-mix/seed",
        });
        expect(seedResponse.statusCode).toBe(200);
        const seeded = seedResponse.json() as { userId: string; scenarioId: string; periodType: "weekly" | "monthly" };

        const chiefRouteResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/chief-route?workflow=reflection_report&userId=${seeded.userId}&periodType=${seeded.periodType}&scenarioId=${seeded.scenarioId}`,
        });
        expect(chiefRouteResponse.statusCode).toBe(200);
        expect(chiefRouteResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "chief-agent",
            wireApi: "responses",
            reasoningEffort: "xhigh",
          },
          normalizedJson: {
            selectedAgent: "reflection-coach-agent",
            workflow: "reflection_report",
          },
        });

        const reflectionResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/reflection?userId=${seeded.userId}&periodType=${seeded.periodType}&scenarioId=${seeded.scenarioId}`,
        });
        expect(reflectionResponse.statusCode).toBe(200);
        expect(reflectionResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "reflection-coach-agent",
            wireApi: "responses",
            reasoningEffort: "high",
          },
          normalizedJson: {
            highlights: ["Reflection provider highlight"],
            blockers: ["Reflection provider blocker"],
            trends: ["Reflection provider trend"],
            nextSuggestions: ["Reflection provider next step"],
          },
        });
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(requests.some((request) => request.auth === "Bearer chief-key")).toBe(true);
    expect(requests.some((request) => request.auth === "Bearer reflection-key")).toBe(true);
  });

  it("supports mixed chief and task-management agent configs for goalflow debug flows", async () => {
    const requests: Array<{ auth: string; body: string }> = [];
    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const auth = String(req.headers.authorization ?? "");
        requests.push({ auth, body });

        let output = "{}";
        if (auth === "Bearer chief-key") {
          output = JSON.stringify({
            workflow: "task_management",
            selectedAgent: "task-management-agent",
            reason: "The request is for task prioritization and planning, so it should be handled by task-management-agent.",
            executionMode: "agent",
            confidence: 0.98,
          });
        } else if (auth === "Bearer task-key") {
          output = JSON.stringify({
            orderedTaskIds: [
              "task-top",
              "task-second",
              "task-third",
            ],
            summary: "Provider says to finish the in-progress task first, then move to the highest-risk regression item.",
            suggestedTasks: [],
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: output, raw: body }));
      });
    });

    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));
    const address = provider.address() as AddressInfo;
    const providerBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-openai-chief-task.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: undefined,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey:
                agentName === "chief-agent"
                  ? "chief-key"
                  : agentName === "task-management-agent"
                    ? "task-key"
                    : "default-key",
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: agentName === "task-management-agent" ? "high" : "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const seedResponse = await openAiApp.inject({
          method: "POST",
          url: "/debug/scenarios/goal-reprioritization/seed",
        });
        expect(seedResponse.statusCode).toBe(200);
        const seeded = seedResponse.json() as { userId: string; scenarioId: string; goalId?: string };

        const chiefRouteResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/chief-route?workflow=task_management&userId=${seeded.userId}&scenarioId=${seeded.scenarioId}`,
        });
        expect(chiefRouteResponse.statusCode).toBe(200);
        expect(chiefRouteResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "chief-agent",
            wireApi: "responses",
            reasoningEffort: "xhigh",
          },
          normalizedJson: {
            selectedAgent: "task-management-agent",
            workflow: "task_management",
          },
        });

        const taskResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/task-management?userId=${seeded.userId}&goalId=${seeded.goalId}&scenarioId=${seeded.scenarioId}`,
        });
        expect(taskResponse.statusCode).toBe(200);
        expect(taskResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "task-management-agent",
            wireApi: "responses",
            reasoningEffort: "high",
          },
          normalizedJson: {
            summary: "Provider says to finish the in-progress task first, then move to the highest-risk regression item.",
          },
        });
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(requests.some((request) => request.auth === "Bearer chief-key")).toBe(true);
    expect(requests.some((request) => request.auth === "Bearer task-key")).toBe(true);
  });

  it("supports mixed chief and progress-feedback agent configs for dashboard debug flows", async () => {
    const requests: Array<{ auth: string; body: string }> = [];
    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const auth = String(req.headers.authorization ?? "");
        requests.push({ auth, body });

        let output = "{}";
        if (auth === "Bearer chief-key") {
          output = JSON.stringify({
            workflow: "progress_summary",
            selectedAgent: "progress-feedback-agent",
            reason: "The request is for a dashboard progress rollup, so route it to progress-feedback-agent.",
            executionMode: "agent",
            confidence: 0.97,
          });
        } else if (auth === "Bearer progress-key") {
          output = JSON.stringify({
            summaryHeadline: "Provider progress headline",
            completionRate: 0.42,
            completedTaskCount: 2,
            inProgressTaskCount: 1,
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: output, raw: body }));
      });
    });

    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));
    const address = provider.address() as AddressInfo;
    const providerBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-openai-chief-progress.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: undefined,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey:
                agentName === "chief-agent"
                  ? "chief-key"
                  : agentName === "progress-feedback-agent"
                    ? "progress-key"
                    : "default-key",
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: agentName === "progress-feedback-agent" ? "high" : "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const seedResponse = await openAiApp.inject({
          method: "POST",
          url: "/debug/scenarios/goal-reprioritization/seed",
        });
        expect(seedResponse.statusCode).toBe(200);
        const seeded = seedResponse.json() as { userId: string; scenarioId: string };

        const chiefRouteResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/chief-route?workflow=progress_summary&userId=${seeded.userId}&scenarioId=${seeded.scenarioId}`,
        });
        expect(chiefRouteResponse.statusCode).toBe(200);
        expect(chiefRouteResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "chief-agent",
            wireApi: "responses",
            reasoningEffort: "xhigh",
          },
          normalizedJson: {
            selectedAgent: "progress-feedback-agent",
            workflow: "progress_summary",
          },
        });

        const progressResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/progress-feedback?userId=${seeded.userId}&scenarioId=${seeded.scenarioId}`,
        });
        expect(progressResponse.statusCode).toBe(200);
        expect(progressResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "progress-feedback-agent",
            wireApi: "responses",
            reasoningEffort: "high",
          },
          normalizedJson: {
            summaryHeadline: "Provider progress headline",
            completionRate: 0.42,
            completedTaskCount: 2,
            inProgressTaskCount: 1,
          },
        });
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(requests.some((request) => request.auth === "Bearer chief-key")).toBe(true);
    expect(requests.some((request) => request.auth === "Bearer progress-key")).toBe(true);
  });

  it("supports mixed chief and interruption-recovery agent configs for recovery debug flows", async () => {
    const requests: Array<{ auth: string; body: string }> = [];
    const provider = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        const auth = String(req.headers.authorization ?? "");
        requests.push({ auth, body });

        let output = "{}";
        if (auth === "Bearer chief-key") {
          output = JSON.stringify({
            workflow: "recovery_plan",
            selectedAgent: "interruption-recovery-agent",
            reason: "The request is to recover from interruption, so interruption-recovery-agent should handle it.",
            executionMode: "agent",
            confidence: 0.98,
          });
        } else if (auth === "Bearer recovery-key") {
          output = JSON.stringify({
            reason: "provider-recovery-reason",
            nextStep: "provider-recovery-step",
            suggestedMinutes: 22,
            reprioritizedTaskIds: ["task-a", "task-b"],
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ output_text: output, raw: body }));
      });
    });

    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));
    const address = provider.address() as AddressInfo;
    const providerBaseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const env: AppEnv = {
        apiPort: 3001,
        dataFile: join(dataDir, "mindanchor-openai-chief-recovery.json"),
        agentMode: "openai-compatible",
        openClawBaseUrl: undefined,
        feishuBotWebhookUrl: undefined,
        telegramBotToken: undefined,
        telegramChatId: undefined,
        defaultModelConfig: {
          baseUrl: providerBaseUrl,
          apiKey: "default-key",
          model: "gpt-5.4",
          wireApi: "responses",
          reasoningEffort: "xhigh",
          disableResponseStorage: true,
        },
        agentModelConfigs: Object.fromEntries(
          OPENCLAW_AGENT_NAMES.map((agentName) => [
            agentName,
            {
              baseUrl: providerBaseUrl,
              apiKey:
                agentName === "chief-agent"
                  ? "chief-key"
                  : agentName === "interruption-recovery-agent"
                    ? "recovery-key"
                    : "default-key",
              model: "gpt-5.4",
              wireApi: "responses",
              reasoningEffort: agentName === "interruption-recovery-agent" ? "high" : "xhigh",
              disableResponseStorage: true,
            },
          ]),
        ),
      };

      const openAiApp = await buildApp(env);
      try {
        const seedResponse = await openAiApp.inject({
          method: "POST",
          url: "/debug/scenarios/focus-recovery-loop/seed",
        });
        expect(seedResponse.statusCode).toBe(200);
        const seeded = seedResponse.json() as { userId: string; scenarioId: string; taskId?: string };

        const chiefRouteResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/chief-route?workflow=recovery_plan&userId=${seeded.userId}&taskId=${seeded.taskId}&scenarioId=${seeded.scenarioId}`,
        });
        expect(chiefRouteResponse.statusCode).toBe(200);
        expect(chiefRouteResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "chief-agent",
            wireApi: "responses",
            reasoningEffort: "xhigh",
          },
          normalizedJson: {
            selectedAgent: "interruption-recovery-agent",
            workflow: "recovery_plan",
          },
        });

        const recoveryResponse = await openAiApp.inject({
          method: "GET",
          url: `/debug/agent/interruption-recovery?userId=${seeded.userId}&taskId=${seeded.taskId}&scenarioId=${seeded.scenarioId}`,
        });
        expect(recoveryResponse.statusCode).toBe(200);
        expect(recoveryResponse.json()).toMatchObject({
          success: true,
          fallbackLikely: false,
          config: {
            target: "interruption-recovery-agent",
            wireApi: "responses",
            reasoningEffort: "high",
          },
          normalizedJson: {
            reason: "provider-recovery-reason",
            nextStep: "provider-recovery-step",
            suggestedMinutes: 22,
            reprioritizedTaskIds: ["task-a", "task-b"],
          },
        });
      } finally {
        await openAiApp.close();
      }
    } finally {
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(requests.some((request) => request.auth === "Bearer chief-key")).toBe(true);
    expect(requests.some((request) => request.auth === "Bearer recovery-key")).toBe(true);
  });

  it("requires bearer authentication and binds health signal/calibration routes to that user", async () => {
    const unauthorizedSignals = await app.inject({ method: "GET", url: "/health/signals" });
    expect(unauthorizedSignals.statusCode).toBe(401);

    const unauthorizedCalibration = await app.inject({ method: "GET", url: "/health/calibration" });
    expect(unauthorizedCalibration.statusCode).toBe(401);

    const unauthorizedLatest = await app.inject({ method: "GET", url: "/health/latest" });
    expect(unauthorizedLatest.statusCode).toBe(401);

    const unauthorizedCalibrationWrite = await app.inject({
      method: "POST",
      url: "/health/calibration",
      payload: {
        userId: "other-user",
        windowStart: "2026-08-05T00:00:00.000Z",
        windowEnd: "2026-08-06T00:00:00.000Z",
        recommendation: "continue",
        predictedEnergyBand: "medium",
        actualEnergyBand: "high",
        outcome: "completed",
      },
    });
    expect(unauthorizedCalibrationWrite.statusCode).toBe(401);

    const auth = { authorization: "Bearer dev:health-user:health@example.com" };
    const consent = await app.inject({
      method: "PATCH",
      url: "/wayfinder/consent/health",
      headers: auth,
      payload: {
        purpose: "wayfinder_health_summary",
        scope: "health_summary",
        status: "granted",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 30,
        modelSharing: "local_only",
      },
    });
    expect(consent.statusCode).toBe(200);

    const summary = await app.inject({
      method: "POST",
      url: "/health/summaries",
      headers: auth,
      payload: {
        userId: "spoofed-user",
        deviceId: "health-device",
        sourcePlatform: "ios",
        sourceProvider: "healthkit",
        windowStart: "2026-08-05T00:00:00.000Z",
        windowEnd: "2026-08-06T00:00:00.000Z",
        sleepMinutes: 420,
        consentRef: consent.json().id,
      },
    });
    expect(summary.statusCode).toBe(201);
    expect(summary.json().snapshot).toMatchObject({
      userId: "health-user",
      consentRef: consent.json().id,
    });

    const signals = await app.inject({
      method: "GET",
      url: "/health/signals?userId=other-user",
      headers: auth,
    });
    expect(signals.statusCode).toBe(200);
    expect(signals.json().summaries).toHaveLength(1);
    expect(signals.json().summaries[0].sourceDevice).toBe("health-device");

    const calibration = await app.inject({
      method: "POST",
      url: "/health/calibration",
      headers: auth,
      payload: {
        userId: "spoofed-user",
        windowStart: "2026-08-05T00:00:00.000Z",
        windowEnd: "2026-08-06T00:00:00.000Z",
        recommendation: "continue",
        predictedEnergyBand: "medium",
        actualEnergyBand: "high",
        outcome: "completed",
      },
    });
    expect(calibration.statusCode).toBe(201);
    expect(calibration.json().userId).toBe("health-user");

    const calibrationList = await app.inject({
      method: "GET",
      url: "/health/calibration?userId=other-user",
      headers: auth,
    });
    expect(calibrationList.statusCode).toBe(200);
    expect(calibrationList.json().records).toHaveLength(1);
    expect(calibrationList.json().records[0].userId).toBe("health-user");
  });
});
