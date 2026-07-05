import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";
import { MindAnchorOrchestrator } from "../src/orchestrator.js";
import { MindAnchorStore } from "../src/store.js";

describe("state read-model refresh", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("refreshes latest state and behavior conclusion via cluster-first when inputs are newer than assessments", async () => {
    const clusterRequests: string[] = [];
    const providerRequests: string[] = [];

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
        clusterRequests.push(target);

        let responsePayload: Record<string, unknown>;
        if (target === "chief-agent") {
          const workflow = promptPayload?.workflow ?? "state_assessment";
          responsePayload = {
            workflow,
            selectedAgent: workflow === "state_assessment" ? "state-insight-agent" : "automation-agent",
            reason: `Route ${workflow} through cluster.`,
            executionMode: "agent",
            confidence: 0.98,
          };
        } else if (target === "state-insight-agent") {
          responsePayload = {
            userId: "read-model-user",
            windowStart: new Date(Date.now() - 60_000).toISOString(),
            windowEnd: new Date().toISOString(),
            focusScore: 72,
            energyScore: 61,
            moodScore: 58,
            summary: "cluster-refreshed-state",
            recommendedAction: "cluster-refreshed-action",
            activeInputs: ["desktop_signal"],
            mediaFreshness: "fresh",
          };
        } else {
          responsePayload = {
            userId: "read-model-user",
            riskLevel: "low",
            summary: "cluster-refreshed-behavior",
            suggestedAction: "cluster-behavior-action",
            trigger: "stable_focus_state",
            recommendedChannel: "desktop_local",
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
      providerRequests.push(String(req.headers.authorization ?? ""));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ output_text: "{}" }));
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-state-refresh-"));
    tempDirs.push(dataDir);
    const store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();

    const env: AppEnv = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
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

    try {
      const orchestrator = new MindAnchorOrchestrator(env, store);
      await store.addSignals([
        {
          userId: "read-model-user",
          source: "desktop",
          eventType: "idle",
          occurredAt: new Date().toISOString(),
          payload: { idleSeconds: 180 },
        },
      ]);

      const latest = await orchestrator.getLatestState("read-model-user");
      expect(latest.latestAssessment?.summary).toBe("cluster-refreshed-state");
      expect(latest.latestBehaviorConclusion?.summary).toBe("cluster-refreshed-behavior");

      const trends = await orchestrator.getStateTrends("read-model-user", 20);
      expect(trends.currentAssessment?.summary).toBe("cluster-refreshed-state");
      expect(trends.latestBehaviorConclusion?.summary).toBe("cluster-refreshed-behavior");
      expect(trends.assessments.length).toBeGreaterThan(0);
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(clusterRequests).toEqual(["chief-agent", "state-insight-agent", "chief-agent", "automation-agent"]);
    expect(providerRequests).toHaveLength(0);
  });

  it("refreshes dashboard summary via cluster-first before returning read-model fields", async () => {
    const clusterRequests: string[] = [];
    const providerRequests: string[] = [];

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
        clusterRequests.push(target);

        let responsePayload: Record<string, unknown>;
        if (target === "chief-agent") {
          const workflow = promptPayload?.workflow ?? "state_assessment";
          responsePayload = {
            workflow,
            selectedAgent:
              workflow === "state_assessment" ? "state-insight-agent" : workflow === "notification_dispatch" ? "automation-agent" : "progress-feedback-agent",
            reason: `Route ${workflow} through cluster.`,
            executionMode: "agent",
            confidence: 0.98,
          };
        } else if (target === "state-insight-agent") {
          responsePayload = {
            userId: "dashboard-refresh-user",
            windowStart: new Date(Date.now() - 60_000).toISOString(),
            windowEnd: new Date().toISOString(),
            focusScore: 74,
            energyScore: 59,
            moodScore: 63,
            summary: "dashboard-cluster-state",
            recommendedAction: "dashboard-cluster-action",
            activeInputs: ["desktop_signal"],
            mediaFreshness: "fresh",
          };
        } else if (target === "automation-agent" && promptPayload?.intent === "behavior_conclusion") {
          responsePayload = {
            userId: "dashboard-refresh-user",
            riskLevel: "medium",
            summary: "dashboard-cluster-behavior",
            suggestedAction: "dashboard-cluster-behavior-action",
            trigger: "attention_shift_detected",
            recommendedChannel: "desktop_local",
          };
        } else if (target === "automation-agent") {
          responsePayload = {
            title: "dashboard-cluster-notification",
            message: "dashboard-cluster-notification-message",
            channel: "desktop_local",
            deliver: true,
          };
        } else {
          responsePayload = {
            summaryHeadline: "dashboard-cluster-headline",
            suggestedFocusTaskId: "task_dashboard_focus",
            completionRate: 0.4,
            completedTaskCount: 1,
            inProgressTaskCount: 1,
            blockedTaskCount: 0,
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
      providerRequests.push(String(req.headers.authorization ?? ""));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ output_text: "{}" }));
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-dashboard-refresh-"));
    tempDirs.push(dataDir);
    const store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();

    const env: AppEnv = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
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

    try {
      const orchestrator = new MindAnchorOrchestrator(env, store);
      const goal = await orchestrator.createGoal({
        userId: "dashboard-refresh-user",
        title: "Dashboard refresh",
        description: "Verify dashboard read-model migration",
      });
      const focusTask = await orchestrator.createTask({
        userId: "dashboard-refresh-user",
        goalId: goal.id,
        title: "Dashboard focus task",
        priority: "high",
        estimatedMinutes: 25,
      });
      await orchestrator.startSession({
        userId: "dashboard-refresh-user",
        taskId: focusTask.id,
        goalId: goal.id,
      });
      await store.addSignals([
        {
          userId: "dashboard-refresh-user",
          source: "desktop",
          eventType: "window_switch",
          occurredAt: new Date().toISOString(),
          payload: { from: "Editor", to: "Browser" },
        },
      ]);

      clusterRequests.length = 0;
      providerRequests.length = 0;

      const summary = await orchestrator.getDashboardSummary("dashboard-refresh-user");
      expect(summary.latestAssessment?.summary).toBe("dashboard-cluster-state");
      expect(summary.latestBehaviorConclusion?.summary).toBe("dashboard-cluster-behavior");
      expect(summary.summaryHeadline).toBe("dashboard-cluster-headline");
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(clusterRequests).toEqual([
      "chief-agent",
      "state-insight-agent",
      "chief-agent",
      "automation-agent",
      "chief-agent",
      "automation-agent",
      "chief-agent",
      "progress-feedback-agent",
    ]);
    expect(providerRequests).toHaveLength(0);
  });

  it("refreshes inbox overview via cluster-first and emits notification content on read", async () => {
    const clusterRequests: string[] = [];
    const providerRequests: string[] = [];

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
        clusterRequests.push(target);

        let responsePayload: Record<string, unknown>;
        if (target === "chief-agent") {
          const workflow = promptPayload?.workflow ?? "state_assessment";
          responsePayload = {
            workflow,
            selectedAgent:
              workflow === "state_assessment" ? "state-insight-agent" : "automation-agent",
            reason: `Route ${workflow} through cluster.`,
            executionMode: "agent",
            confidence: 0.98,
          };
        } else if (target === "state-insight-agent") {
          responsePayload = {
            userId: "inbox-refresh-user",
            windowStart: new Date(Date.now() - 60_000).toISOString(),
            windowEnd: new Date().toISOString(),
            focusScore: 29,
            energyScore: 34,
            moodScore: 44,
            summary: "inbox-cluster-state",
            recommendedAction: "inbox-cluster-action",
            activeInputs: ["desktop_signal"],
            mediaFreshness: "fresh",
          };
        } else if (target === "automation-agent" && promptPayload?.intent === "behavior_conclusion") {
          responsePayload = {
            userId: "inbox-refresh-user",
            riskLevel: "high",
            summary: "inbox-cluster-behavior",
            suggestedAction: "inbox-cluster-behavior-action",
            trigger: "high_risk_state",
            recommendedChannel: "mobile_push",
          };
        } else {
          responsePayload = {
            title: "cluster-inbox-title",
            message: "cluster-inbox-message",
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
      providerRequests.push(String(req.headers.authorization ?? ""));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ output_text: "{}" }));
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-inbox-refresh-"));
    tempDirs.push(dataDir);
    const store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();

    const env: AppEnv = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
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

    try {
      const orchestrator = new MindAnchorOrchestrator(env, store);
      await orchestrator.registerEdgeDevice({
        userId: "inbox-refresh-user",
        deviceId: "inbox-mobile",
        label: "Inbox Mobile",
        deviceType: "mobile",
        platform: "android",
        capabilities: ["notifications"],
      });
      await store.addSignals([
        {
          userId: "inbox-refresh-user",
          source: "desktop",
          eventType: "idle",
          occurredAt: new Date().toISOString(),
          payload: { idleSeconds: 420 },
        },
      ]);

      const overview = await orchestrator.getClientInboxOverview("inbox-refresh-user", 20);
      expect(overview.latestBehaviorConclusion?.summary).toBe("inbox-cluster-behavior");
      expect(overview.messages[0]?.title).toBe("cluster-inbox-title");
      expect(overview.messages[0]?.message).toContain("cluster-inbox-message");
      expect(overview.channelCounts.some((entry) => entry.channel === "mobile_push" && entry.total > 0)).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(clusterRequests).toEqual([
      "chief-agent",
      "state-insight-agent",
      "chief-agent",
      "automation-agent",
      "chief-agent",
      "automation-agent",
    ]);
    expect(providerRequests).toHaveLength(0);
  });

  it("refreshes recovery history via cluster-first before returning latest state fields", async () => {
    const clusterRequests: string[] = [];
    const providerRequests: string[] = [];

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
        clusterRequests.push(target);

        let responsePayload: Record<string, unknown>;
        if (target === "chief-agent") {
          const workflow = promptPayload?.workflow ?? "state_assessment";
          responsePayload = {
            workflow,
            selectedAgent:
              workflow === "state_assessment" ? "state-insight-agent" : workflow === "notification_dispatch" ? "automation-agent" : "task-management-agent",
            reason: `Route ${workflow} through cluster.`,
            executionMode: "agent",
            confidence: 0.98,
          };
        } else if (target === "state-insight-agent") {
          responsePayload = {
            userId: "recovery-refresh-user",
            windowStart: new Date(Date.now() - 60_000).toISOString(),
            windowEnd: new Date().toISOString(),
            focusScore: 33,
            energyScore: 37,
            moodScore: 46,
            summary: "recovery-refresh-state",
            recommendedAction: "recovery-refresh-action",
            activeInputs: ["desktop_signal"],
            mediaFreshness: "fresh",
          };
        } else if (target === "automation-agent") {
          responsePayload =
            promptPayload?.intent === "behavior_conclusion"
              ? {
                  userId: "recovery-refresh-user",
                  riskLevel: "medium",
                  summary: "recovery-refresh-behavior",
                  suggestedAction: "recovery-refresh-behavior-action",
                  trigger: "attention_shift_detected",
                  recommendedChannel: "desktop_local",
                }
              : {
                  title: "recovery-refresh-notification",
                  message: "recovery-refresh-notification-message",
                  channel: "desktop_local",
                  deliver: true,
                };
        } else {
          responsePayload = {
            orderedTaskIds: ["task_interrupt", "task_active"],
            summary: "Recovery history reordered by cluster.",
            suggestedTasks: [],
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
      providerRequests.push(String(req.headers.authorization ?? ""));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ output_text: "{}" }));
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-recovery-refresh-"));
    tempDirs.push(dataDir);
    const store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();

    const env: AppEnv = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
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

    try {
      const orchestrator = new MindAnchorOrchestrator(env, store);
      const goal = await orchestrator.createGoal({
        userId: "recovery-refresh-user",
        title: "Recovery refresh",
        description: "Verify recovery read-model refresh",
      });
      const activeTask = await orchestrator.createTask({
        userId: "recovery-refresh-user",
        goalId: goal.id,
        title: "Active recovery task",
        priority: "high",
        estimatedMinutes: 30,
      });
      const interruptTask = await orchestrator.createTask({
        userId: "recovery-refresh-user",
        goalId: goal.id,
        title: "Interrupted recovery task",
        priority: "critical",
        estimatedMinutes: 20,
      });
      const session = await orchestrator.startSession({
        userId: "recovery-refresh-user",
        taskId: activeTask.id,
        goalId: goal.id,
      });
      await orchestrator.endSession({
        sessionId: session.id,
        interrupted: true,
        summary: "Recovery refresh interruption.",
      });
      await store.addSignals([
        {
          userId: "recovery-refresh-user",
          source: "desktop",
          eventType: "idle",
          occurredAt: new Date().toISOString(),
          payload: { idleSeconds: 300 },
        },
      ]);

      const history = await orchestrator.getRecoveryHistory("recovery-refresh-user", 20);
      expect(history.latestAssessment?.summary).toBe("recovery-refresh-state");
      expect(history.latestBehaviorConclusion?.summary).toBe("recovery-refresh-behavior");
      expect(history.pendingTasks[0]?.id).toBe(interruptTask.id);
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(clusterRequests).toContain("state-insight-agent");
    expect(clusterRequests).toContain("task-management-agent");
    expect(providerRequests).toHaveLength(0);
  });

  it("refreshes reflection overview via cluster-first when newer inputs exist", async () => {
    const clusterRequests: string[] = [];
    const providerRequests: string[] = [];

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
        clusterRequests.push(target);

        let responsePayload: Record<string, unknown>;
        if (target === "chief-agent") {
          const workflow = promptPayload?.workflow ?? "reflection_report";
          responsePayload = {
            workflow,
            selectedAgent:
              workflow === "state_assessment" ? "state-insight-agent" : workflow === "notification_dispatch" ? "automation-agent" : "reflection-coach-agent",
            reason: `Route ${workflow} through cluster.`,
            executionMode: "agent",
            confidence: 0.98,
          };
        } else if (target === "state-insight-agent") {
          responsePayload = {
            userId: "reflection-refresh-user",
            windowStart: new Date(Date.now() - 60_000).toISOString(),
            windowEnd: new Date().toISOString(),
            focusScore: 66,
            energyScore: 61,
            moodScore: 64,
            summary: "reflection-refresh-state",
            recommendedAction: "reflection-refresh-action",
            activeInputs: ["desktop_signal"],
            mediaFreshness: "fresh",
          };
        } else if (target === "automation-agent") {
          responsePayload = {
            userId: "reflection-refresh-user",
            riskLevel: "low",
            summary: "reflection-refresh-behavior",
            suggestedAction: "reflection-refresh-behavior-action",
            trigger: "stable_focus_state",
            recommendedChannel: "desktop_local",
          };
        } else {
          responsePayload = {
            userId: "reflection-refresh-user",
            periodType: promptPayload?.periodType ?? "weekly",
            periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            periodEnd: new Date().toISOString(),
            highlights: ["reflection-refresh-highlight"],
            blockers: ["reflection-refresh-blocker"],
            trends: ["reflection-refresh-trend"],
            nextSuggestions: ["reflection-refresh-next"],
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
      providerRequests.push(String(req.headers.authorization ?? ""));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ output_text: "{}" }));
    });

    await new Promise<void>((resolve) => cluster.listen(0, "127.0.0.1", () => resolve()));
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", () => resolve()));

    const clusterAddress = cluster.address() as AddressInfo;
    const providerAddress = provider.address() as AddressInfo;
    const clusterBaseUrl = `http://127.0.0.1:${clusterAddress.port}`;
    const providerBaseUrl = `http://127.0.0.1:${providerAddress.port}`;

    const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-reflection-refresh-"));
    tempDirs.push(dataDir);
    const store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();

    const env: AppEnv = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
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

    try {
      const orchestrator = new MindAnchorOrchestrator(env, store);
      const goal = await orchestrator.createGoal({
        userId: "reflection-refresh-user",
        title: "Reflection refresh",
        description: "Verify reflection read-model refresh",
      });
      await orchestrator.createTask({
        userId: "reflection-refresh-user",
        goalId: goal.id,
        title: "Reflection task",
        priority: "high",
        estimatedMinutes: 30,
      });
      await store.addSignals([
        {
          userId: "reflection-refresh-user",
          source: "desktop",
          eventType: "window_switch",
          occurredAt: new Date().toISOString(),
          payload: { from: "Editor", to: "Browser" },
        },
      ]);

      clusterRequests.length = 0;
      providerRequests.length = 0;

      const overview = await orchestrator.getReflectionOverview("reflection-refresh-user", 10);
      expect(overview.latestWeekly?.highlights[0]).toBe("reflection-refresh-highlight");
      expect(overview.latestMonthly?.highlights[0]).toBe("reflection-refresh-highlight");
    } finally {
      await new Promise<void>((resolve, reject) => cluster.close((error) => (error ? reject(error) : resolve())));
      await new Promise<void>((resolve, reject) => provider.close((error) => (error ? reject(error) : resolve())));
    }

    expect(clusterRequests).toContain("reflection-coach-agent");
    expect(providerRequests).toHaveLength(0);
  });
});
