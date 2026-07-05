import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ModelBridge } from "../src/lib/model-bridge.js";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";
import { TRACE_HEADER_NAMES } from "../src/lib/openclaw-trace.js";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

const buildEnv = (): AppEnv => ({
  apiPort: 3001,
  dataFile: "/tmp/mindanchor.json",
  agentMode: "openai-compatible",
  openClawBaseUrl: undefined,
  openClawOriginalRuntimeMode: "disabled",
  openClawOriginalRuntimePath: undefined,
  openClawOriginalRuntimeProfile: undefined,
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
        baseUrl: "https://agents.example",
        apiKey: `${agentName}-key`,
        model: "gpt-5.4",
        wireApi: "responses",
        reasoningEffort: "xhigh",
        disableResponseStorage: true,
      },
    ]),
  ),
});

const buildClusterEnv = (): AppEnv => ({
  ...buildEnv(),
  openClawBaseUrl: "https://cluster.example",
});

const createClusterResponse = (payload: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(payload),
});

const createProviderResponse = (payload: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => payload,
  text: async () => JSON.stringify(payload),
});

describe("model-bridge", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses per-agent config with responses API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          answer: "ok",
        }),
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const bridge = new ModelBridge(buildEnv());
    const result = await bridge.generateJson({
      target: "state-insight-agent",
      systemPrompt: "Return JSON.",
      userPrompt: "Test",
      schema: z.object({ answer: z.string() }),
      fallback: () => ({ answer: "fallback" }),
    });

    expect(result.answer).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://agents.example/responses");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer state-insight-agent-key",
    });
  });

  it("falls back when the provider returns invalid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          output_text: "not-json",
        }),
      }),
    );

    const bridge = new ModelBridge(buildEnv());
    const result = await bridge.generateJson({
      target: "reflection-coach-agent",
      systemPrompt: "Return JSON.",
      userPrompt: "Test",
      schema: z.object({ answer: z.string() }),
      fallback: () => ({ answer: "fallback" }),
    });

    expect(result.answer).toBe("fallback");
  });

  it("normalizes provider output before schema validation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            stateSummary: "Recovered from schema drift.",
            nextAction: "Resume with a smaller block.",
          }),
        }),
      }),
    );

    const bridge = new ModelBridge(buildEnv());
    const result = await bridge.generateJson({
      target: "state-insight-agent",
      systemPrompt: "Return JSON.",
      userPrompt: "Test",
      schema: z.object({
        summary: z.string(),
        recommendedAction: z.string(),
      }),
      normalize: (raw) => {
        const record = raw as { stateSummary?: string; nextAction?: string };
        return {
          summary: record.stateSummary ?? "fallback",
          recommendedAction: record.nextAction ?? "fallback",
        };
      },
      fallback: () => ({ summary: "fallback", recommendedAction: "fallback" }),
    });

    expect(result.summary).toBe("Recovered from schema drift.");
    expect(result.recommendedAction).toBe("Resume with a smaller block.");
  });

  it("prefers the remote OpenClaw cluster and forwards trace headers without provider secrets", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createClusterResponse({
        success: true,
        taskId: "cluster-task-1",
        trace: {
          traceId: "cluster-trace-1",
        },
        parsed: {
          answer: "remote",
        },
        metadata: {
          runtime: "openclaw-cluster",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const bridge = new ModelBridge(buildClusterEnv());
    const result = await bridge.generateJson({
      target: "state-insight-agent",
      systemPrompt: "Return JSON.",
      userPrompt: "Test",
      schema: z.object({ answer: z.string() }),
      fallback: () => ({ answer: "fallback" }),
      traceContext: {
        traceId: "trace-generate-1",
        parentTraceId: "parent-trace-1",
        requestTraceId: "request-trace-1",
        source: "mindanchor-gateway",
        operation: "generate",
        agentName: "state-insight-agent",
        workflow: "state_assessment",
        scenarioId: "focus-recovery-loop",
        userId: "demo-user",
      },
    });

    expect(result.answer).toBe("remote");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://cluster.example/v1/tasks/execute");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      [TRACE_HEADER_NAMES.traceId]: "trace-generate-1",
      [TRACE_HEADER_NAMES.parentTraceId]: "parent-trace-1",
      [TRACE_HEADER_NAMES.requestTraceId]: "request-trace-1",
      [TRACE_HEADER_NAMES.operation]: "generate",
      [TRACE_HEADER_NAMES.agentName]: "state-insight-agent",
      [TRACE_HEADER_NAMES.workflow]: "state_assessment",
      [TRACE_HEADER_NAMES.scenarioId]: "focus-recovery-loop",
      [TRACE_HEADER_NAMES.userId]: "demo-user",
    });
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();

    const body = JSON.parse(String(init.body)) as {
      mode: string;
      target: string;
      trace: { traceId: string };
      payload: {
        systemPrompt: string;
        userPrompt: string;
        config: Record<string, unknown>;
      };
    };
    expect(body.mode).toBe("generate");
    expect(body.target).toBe("state-insight-agent");
    expect(body.trace.traceId).toBe("trace-generate-1");
    expect(body.payload.systemPrompt).toBe("Return JSON.");
    expect(body.payload.userPrompt).toBe("Test");
    expect(body.payload.config).toEqual({
      wireApi: "responses",
      reasoningEffort: "xhigh",
      disableResponseStorage: true,
    });
  });

  it("falls back to the provider when the cluster result cannot satisfy the schema", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createClusterResponse({
          success: true,
          taskId: "cluster-task-2",
          parsed: {
            unexpected: true,
          },
          metadata: {
            runtime: "openclaw-cluster",
          },
        }),
      )
      .mockResolvedValueOnce(
        createProviderResponse({
          output_text: JSON.stringify({
            answer: "provider-ok",
          }),
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const bridge = new ModelBridge(buildClusterEnv());
    const result = await bridge.generateJson({
      target: "reflection-coach-agent",
      systemPrompt: "Return JSON.",
      userPrompt: "Test",
      schema: z.object({ answer: z.string() }),
      fallback: () => ({ answer: "fallback" }),
    });

    expect(result.answer).toBe("provider-ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0]?.[0] as URL).toString()).toBe("https://cluster.example/v1/tasks/execute");
    expect((fetchMock.mock.calls[1]?.[0] as URL).toString()).toBe("https://agents.example/responses");
  });

  it("uses cluster probe output text and skips the direct provider path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createClusterResponse({
        success: true,
        taskId: "cluster-task-3",
        outputText: '{"probe":"ok"}',
        metadata: {
          runtime: "openclaw-cluster",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const bridge = new ModelBridge(buildClusterEnv());
    const result = await bridge.probe("chief-agent", {
      traceId: "trace-probe-1",
      source: "mindanchor-gateway",
      operation: "probe",
      agentName: "chief-agent",
    });

    expect(result.success).toBe(true);
    expect(result.fallbackLikely).toBe(false);
    expect(result.parsed).toEqual({ probe: "ok" });
    expect(result.adapter.route).toBe("cluster");
    expect(result.adapter.strategy).toBe("cluster-preferred");
    expect(result.adapter.clusterAttempts).toEqual([
      expect.objectContaining({
        endpoint: "/v1/tasks/execute",
        ok: true,
        status: 200,
      }),
    ]);
    expect(result.attempts).toEqual([
      expect.objectContaining({
        endpoint: "cluster:/v1/tasks/execute",
        ok: true,
        status: 200,
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to the provider when the cluster probe payload breaks the contract", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createClusterResponse({
          success: true,
          taskId: "cluster-task-4",
          parsed: {
            unexpected: true,
          },
          metadata: {
            runtime: "openclaw-cluster",
          },
        }),
      )
      .mockResolvedValueOnce(
        createProviderResponse({
          output_text: JSON.stringify({
            probe: "ok",
          }),
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const bridge = new ModelBridge(buildClusterEnv());
    const result = await bridge.probe("chief-agent");

    expect(result.success).toBe(true);
    expect(result.fallbackLikely).toBe(true);
    expect(result.parsed).toEqual({ probe: "ok" });
    expect(result.adapter.strategy).toBe("cluster-preferred");
    expect(result.adapter.route).toBe("provider-fallback");
    expect(result.adapter.fallbackReason).toContain("probe");
    expect(result.adapter.failureCategory).toBe("cluster_contract_failure");
    expect(result.adapter.clusterAttempts).toEqual([
      expect.objectContaining({
        endpoint: "/v1/tasks/execute",
        ok: true,
        status: 200,
      }),
    ]);
    expect(result.attempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          endpoint: "cluster:/v1/tasks/execute",
          ok: true,
          status: 200,
        }),
        expect.objectContaining({
          endpoint: "cluster:invalid-response",
          ok: false,
        }),
        expect.objectContaining({
          endpoint: "/responses",
          ok: true,
          status: 200,
        }),
      ]),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("marks provider-direct when cluster is disabled and the provider succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createProviderResponse({
          output_text: JSON.stringify({
            probe: "ok",
          }),
        }),
      ),
    );

    const bridge = new ModelBridge(buildEnv());
    const result = await bridge.probe("chief-agent");

    expect(result.success).toBe(true);
    expect(result.adapter.strategy).toBe("provider-direct");
    expect(result.adapter.route).toBe("provider-direct");
    expect(result.adapter.fallbackReason).toBeNull();
    expect(result.adapter.clusterAttempts).toEqual([]);
  });

  it("marks provider-fallback and preserves the cluster fallback reason", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createClusterResponse({ success: false, error: "cluster said no" }))
      .mockResolvedValueOnce(createClusterResponse({ success: false, error: "cluster said no" }))
      .mockResolvedValueOnce(createClusterResponse({ success: false, error: "cluster said no" }))
      .mockResolvedValueOnce(
        createProviderResponse({
          output_text: JSON.stringify({
            probe: "ok",
          }),
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const bridge = new ModelBridge(buildClusterEnv());
    const result = await bridge.probe("state-insight-agent");

    expect(result.success).toBe(true);
    expect(result.adapter.strategy).toBe("cluster-preferred");
    expect(result.adapter.route).toBe("provider-fallback");
    expect(result.adapter.fallbackReason).toBe("cluster said no");
    expect(result.adapter.failureCategory).toBe("cluster_http_error");
    expect(result.adapter.selectedEndpoint).toBe("/responses");
    expect(result.adapter.clusterAttempts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          endpoint: "/v1/tasks/execute",
          ok: false,
          error: "cluster said no",
        }),
        expect.objectContaining({
          endpoint: "/tasks/execute",
          ok: false,
          error: "cluster said no",
        }),
      ]),
    );
  });

  it("classifies aborted cluster requests as cluster_timeout before provider fallback succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("The operation timed out."))
      .mockRejectedValueOnce(new Error("The operation timed out."))
      .mockRejectedValueOnce(new Error("The operation timed out."))
      .mockResolvedValueOnce(
        createProviderResponse({
          output_text: JSON.stringify({
            probe: "ok",
          }),
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const bridge = new ModelBridge(buildClusterEnv());
    const result = await bridge.probe("state-insight-agent");

    expect(result.success).toBe(true);
    expect(result.adapter.route).toBe("provider-fallback");
    expect(result.adapter.failureCategory).toBe("cluster_timeout");
    expect(result.adapter.fallbackReason).toContain("timed out");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("retries a known session lock on the same cluster endpoint before falling back", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createClusterResponse(
          {
            success: false,
            error:
              '[diagnostic] lane task error: lane=main durationMs=11485 error="Error: session file locked (timeout 10000ms): pid=15843 /Users/claw/.openclaw-dev/agents/progress-feedback-agent/sessions/demo"',
          },
          500,
        ),
      )
      .mockResolvedValueOnce(
        createClusterResponse({
          success: true,
          taskId: "cluster-task-5",
          parsed: {
            answer: "cluster-recovered",
          },
          metadata: {
            runtime: "openclaw-cluster",
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const bridge = new ModelBridge(buildClusterEnv());
    const result = await bridge.generateJson({
      target: "progress-feedback-agent",
      systemPrompt: "Return JSON.",
      userPrompt: "Test",
      schema: z.object({ answer: z.string() }),
      fallback: () => ({ answer: "fallback" }),
    });

    expect(result.answer).toBe("cluster-recovered");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0]?.[0] as URL).toString()).toBe("https://cluster.example/v1/tasks/execute");
    expect((fetchMock.mock.calls[1]?.[0] as URL).toString()).toBe("https://cluster.example/v1/tasks/execute");
  });

  it("retries a transient transport error on the same cluster endpoint before falling back", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(
        createClusterResponse({
          success: true,
          taskId: "cluster-task-transport-retry",
          parsed: {
            probe: "ok",
          },
          metadata: {
            runtime: "openclaw-cluster",
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const bridge = new ModelBridge(buildClusterEnv());
    const result = await bridge.probe("state-insight-agent");

    expect(result.success).toBe(true);
    expect(result.adapter.route).toBe("cluster");
    expect(result.adapter.selectedEndpoint).toBe("cluster:/v1/tasks/execute");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0]?.[0] as URL).toString()).toBe("https://cluster.example/v1/tasks/execute");
    expect((fetchMock.mock.calls[1]?.[0] as URL).toString()).toBe("https://cluster.example/v1/tasks/execute");
  });

  it("marks failed when cluster cannot be used and provider config is missing", async () => {
    const env = buildClusterEnv();
    env.defaultModelConfig = {
      ...env.defaultModelConfig,
      baseUrl: undefined,
      model: undefined,
    };
    env.agentModelConfigs = Object.fromEntries(
      OPENCLAW_AGENT_NAMES.map((agentName) => [
        agentName,
        {
          ...env.agentModelConfigs[agentName],
          baseUrl: undefined,
          model: undefined,
        },
      ]),
    );

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(createClusterResponse({ success: false, error: "cluster unavailable" }, 503)));

    const bridge = new ModelBridge(env);
    const result = await bridge.debugJson({
      target: "reflection-coach-agent",
      systemPrompt: "Return JSON.",
      userPrompt: "Test",
      schema: z.object({ answer: z.string() }),
    });

    expect(result.success).toBe(false);
    expect(result.adapter.route).toBe("failed");
    expect(result.adapter.strategy).toBe("cluster-preferred");
    expect(result.adapter.fallbackReason).toBe("Missing baseUrl or model");
    expect(result.validationError).toBe("Missing baseUrl or model");
  });

  it("can route persona generation through original OpenClaw CLI runtime", async () => {
    const childProcess = await import("node:child_process");
    vi.mocked(childProcess.execFile).mockImplementation((...args: unknown[]) => {
      const callback = args[args.length - 1] as (error: Error | null, stdout?: string, stderr?: string) => void;
      callback(
        null,
        JSON.stringify({
          payloads: [
            {
              text: JSON.stringify({
                answer: "official-runtime",
              }),
            },
          ],
          meta: {
            durationMs: 1200,
          },
        }),
        "",
      );
      return {} as never;
    });

    const env = buildEnv();
    env.openClawOriginalRuntimeMode = "cli-local";
    env.openClawOriginalRuntimePath = "/Users/claw/.openclaw/bin/openclaw";
    env.openClawOriginalRuntimeProfile = "dev";

    const bridge = new ModelBridge(env);
    const result = await bridge.generateJson({
      target: "director-agent",
      systemPrompt: "Return exactly one JSON object with key answer.",
      userPrompt: "Test",
      schema: z.object({ answer: z.string() }),
      fallback: () => ({ answer: "fallback" }),
    });

    expect(result.answer).toBe("official-runtime");
    expect(vi.mocked(childProcess.execFile)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(childProcess.execFile).mock.calls[0]?.[0]).toBe("/Users/claw/.openclaw/bin/openclaw");
    expect(vi.mocked(childProcess.execFile).mock.calls[0]?.[1]).toEqual(
      expect.arrayContaining(["--dev", "agent", "--agent", "director-agent", "--json", "--local"]),
    );
  });
});
