import { z } from "zod";
import type {
  GatewayTraceContext,
  OpenClawAdapterClusterAttempt,
  OpenClawAdapterDecision,
  OpenClawAdapterFailureCategory,
  OpenClawAdapterRoute,
  OpenClawAdapterStrategy,
} from "@mindanchor/domain";
import type { AgentModelConfig, AppEnv, OpenClawAgentName } from "../env.js";
import {
  buildGatewayTraceHeaders,
  buildOpenClawTaskEnvelope,
  summarizeTaskPrompt,
  type OpenClawRuntimeContext,
} from "./openclaw-trace.js";
import { OpenClawClusterClient } from "./openclaw-cluster-client.js";
import { OpenClawOriginalRuntimeClient } from "./openclaw-original-runtime-client.js";
import type { MindAnchorTraceLogger } from "./trace-logger.js";
import { createId } from "./utils.js";

type ModelTarget = OpenClawAgentName | string;
type ProbeAttempt = OpenClawAdapterClusterAttempt;
type SafeConfig = {
  target: ModelTarget;
  baseUrl: string | null;
  model: string | null;
  wireApi: AgentModelConfig["wireApi"];
  reasoningEffort: AgentModelConfig["reasoningEffort"] | null;
  disableResponseStorage: boolean;
  hasApiKey: boolean;
};
type ModelRunResultBase = {
  success: boolean;
  fallbackLikely: boolean;
  config: SafeConfig;
  attempts: ProbeAttempt[];
  adapter: OpenClawAdapterDecision;
};
type ProbeResult = ModelRunResultBase & {
  parsed?: unknown;
  validationError?: string;
};
type DebugJsonResult = ModelRunResultBase & {
  content?: string;
  extractedJson?: unknown;
  normalizedJson?: unknown;
  validationError?: string;
};

const extractJsonCandidate = (content: string) => {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
};

const getResponsesOutputText = (payload: unknown) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof record.output_text === "string" && record.output_text.length > 0) {
    return record.output_text;
  }

  const text = record.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => typeof content.text === "string")?.text;

  return text ?? null;
};

const buildResponsesBodies = ({
  model,
  systemPrompt,
  userPrompt,
  reasoningEffort,
  disableResponseStorage,
}: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  reasoningEffort?: AgentModelConfig["reasoningEffort"];
  disableResponseStorage: boolean;
}) => {
  const baseMessage = `${systemPrompt}\nReturn JSON only.`;
  const commonFlags = {
    store: disableResponseStorage ? false : true,
  };

  return [
    {
      model,
      input: [
        { role: "system", content: [{ type: "input_text", text: baseMessage }] },
        { role: "user", content: [{ type: "input_text", text: userPrompt }] },
      ],
      ...(reasoningEffort ? { reasoning: { effort: reasoningEffort } } : {}),
      ...commonFlags,
    },
    {
      model,
      input: [
        { role: "system", content: baseMessage },
        { role: "user", content: userPrompt },
      ],
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      ...(disableResponseStorage ? { disable_response_storage: true } : {}),
      ...commonFlags,
    },
    {
      model,
      input: `${baseMessage}\n\n${userPrompt}`,
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      ...(disableResponseStorage ? { disable_response_storage: true } : {}),
      ...commonFlags,
    },
  ];
};

const buildChatBodies = ({
  model,
  systemPrompt,
  userPrompt,
}: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
}) => [
  {
    model,
    messages: [
      { role: "system", content: `${systemPrompt}\nReturn JSON only.` },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  },
];

const buildRequestVariants = ({
  config,
  systemPrompt,
  userPrompt,
}: {
  config: AgentModelConfig & { model: string };
  systemPrompt: string;
  userPrompt: string;
}) =>
  config.wireApi === "responses"
    ? buildResponsesBodies({
        model: config.model,
        systemPrompt,
        userPrompt,
        reasoningEffort: config.reasoningEffort,
        disableResponseStorage: config.disableResponseStorage,
      }).flatMap((body) => [
        { endpoint: "/responses", body },
        { endpoint: "/v1/responses", body },
      ])
    : buildChatBodies({ model: config.model, systemPrompt, userPrompt }).flatMap((body) => [
        { endpoint: "/chat/completions", body },
        { endpoint: "/v1/chat/completions", body },
      ]);

const extractContent = (payload: unknown, wireApi: AgentModelConfig["wireApi"]) =>
  wireApi === "responses"
    ? getResponsesOutputText(payload)
    : (payload as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content;

const probePayloadSchema = z.object({
  probe: z.literal("ok"),
});

const parseProbePayload = (payload: unknown) => probePayloadSchema.parse(payload);

export class ModelBridge {
  private readonly clusterClient: OpenClawClusterClient;
  private readonly originalRuntimeClient: OpenClawOriginalRuntimeClient;

  constructor(private readonly env: AppEnv, private readonly traceLogger?: MindAnchorTraceLogger) {
    this.clusterClient = new OpenClawClusterClient(env, traceLogger);
    this.originalRuntimeClient = new OpenClawOriginalRuntimeClient(env);
  }

  private resolveConfig(target: ModelTarget): AgentModelConfig {
    return this.env.agentModelConfigs[target] ?? this.env.defaultModelConfig;
  }

  private async logModelEvent({
    level = "info",
    traceContext,
    event,
    message,
    metadata,
  }: {
    level?: "info" | "warn" | "error";
    traceContext?: GatewayTraceContext;
    event: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    if (!this.traceLogger || !traceContext?.traceId) {
      return;
    }

    await this.traceLogger[level]({
      traceId: traceContext.traceId,
      parentTraceId: traceContext.parentTraceId,
      event,
      message,
      metadata: {
        operation: traceContext.operation,
        agentName: traceContext.agentName,
        workflow: traceContext.workflow,
        scenarioId: traceContext.scenarioId,
        userId: traceContext.userId,
        ...metadata,
      },
    });
  }

  private buildSafeConfig(target: ModelTarget, config: AgentModelConfig): SafeConfig {
    return {
      target,
      baseUrl: config.baseUrl ?? null,
      model: config.model ?? null,
      wireApi: config.wireApi,
      reasoningEffort: config.reasoningEffort ?? null,
      disableResponseStorage: config.disableResponseStorage,
      hasApiKey: Boolean(config.apiKey),
    };
  }

  private buildClusterSafeConfig(target: ModelTarget, config: AgentModelConfig): SafeConfig {
    return {
      target,
      baseUrl: this.env.openClawBaseUrl ?? config.baseUrl ?? null,
      model: config.model ?? null,
      wireApi: config.wireApi,
      reasoningEffort: config.reasoningEffort ?? null,
      disableResponseStorage: config.disableResponseStorage,
      hasApiKey: Boolean(config.apiKey),
    };
  }

  private ensureTraceContext(traceContext: GatewayTraceContext | undefined, target: ModelTarget, operation: GatewayTraceContext["operation"]) {
    return (
      traceContext ?? {
        traceId: createId(),
        source: "mindanchor-gateway",
        operation,
        agentName: String(target),
      }
    );
  }

  private getAdapterStrategy(): OpenClawAdapterStrategy {
    return this.clusterClient.isEnabled() ? "cluster-preferred" : "provider-direct";
  }

  private toDisplayClusterAttempts(attempts: OpenClawAdapterClusterAttempt[]): ProbeAttempt[] {
    return attempts.map((attempt) => ({
      ...attempt,
      endpoint: `cluster:${attempt.endpoint}`,
    }));
  }

  private getLatestFailureReason(attempts: Array<Pick<ProbeAttempt, "error" | "ok" | "status">>): string | null {
    for (let index = attempts.length - 1; index >= 0; index -= 1) {
      const attempt = attempts[index];
      if (attempt?.error) {
        return attempt.error;
      }
      if (attempt && attempt.ok === false && typeof attempt.status === "number") {
        return `Request returned HTTP ${attempt.status}.`;
      }
    }

    return null;
  }

  private isTimeoutError(message: string | null | undefined) {
    if (!message) {
      return false;
    }

    const normalized = message.toLowerCase();
    return normalized.includes("timeout") || normalized.includes("timed out") || normalized.includes("abort");
  }

  private classifyClusterFailure({
    fallbackReason,
    clusterAttempts,
  }: {
    fallbackReason?: string | null;
    clusterAttempts?: OpenClawAdapterClusterAttempt[];
  }): OpenClawAdapterFailureCategory | null {
    const normalizedReason = fallbackReason?.toLowerCase() ?? "";
    if (
      normalizedReason.includes("contract") ||
      normalizedReason.includes("schema") ||
      normalizedReason.includes("validation")
    ) {
      return "cluster_contract_failure";
    }

    const lastAttempt = clusterAttempts?.at(-1);
    if (typeof lastAttempt?.status === "number" && lastAttempt.ok === false) {
      return "cluster_http_error";
    }

    if (this.isTimeoutError(fallbackReason ?? lastAttempt?.error)) {
      return "cluster_timeout";
    }

    if ((fallbackReason ?? lastAttempt?.error)?.length) {
      return "cluster_transport_error";
    }

    return null;
  }

  private classifyProviderFailure({
    providerFailureReason,
    strategy,
    clusterFallbackReason,
    clusterAttempts,
    hasProviderConfig,
  }: {
    providerFailureReason?: string | null;
    strategy: OpenClawAdapterStrategy;
    clusterFallbackReason?: string | null;
    clusterAttempts?: OpenClawAdapterClusterAttempt[];
    hasProviderConfig: boolean;
  }): OpenClawAdapterFailureCategory | null {
    if (!hasProviderConfig) {
      return "missing_provider_config";
    }

    if (providerFailureReason) {
      if (providerFailureReason.includes("HTTP")) {
        return "provider_http_error";
      }
      if (this.isTimeoutError(providerFailureReason)) {
        return "provider_timeout";
      }
      return "provider_invalid_response";
    }

    if (strategy === "cluster-preferred") {
      return this.classifyClusterFailure({
        fallbackReason: clusterFallbackReason,
        clusterAttempts,
      });
    }

    return null;
  }

  private buildAdapterDecision({
    traceContext,
    target,
    mode,
    strategy,
    route,
    success,
    selectedEndpoint,
    fallbackReason,
    failureCategory,
    clusterAttempts,
  }: {
    traceContext: GatewayTraceContext;
    target: ModelTarget;
    mode: "probe" | "debug" | "generate";
    strategy: OpenClawAdapterStrategy;
    route: OpenClawAdapterRoute;
    success: boolean;
    selectedEndpoint?: string | null;
    fallbackReason?: string | null;
    failureCategory?: OpenClawAdapterFailureCategory | null;
    clusterAttempts?: OpenClawAdapterClusterAttempt[];
  }): OpenClawAdapterDecision {
    return {
      traceId: traceContext.traceId,
      parentTraceId: traceContext.parentTraceId,
      target: String(target),
      mode,
      strategy,
      route,
      success,
      selectedEndpoint: selectedEndpoint ?? null,
      fallbackReason: fallbackReason ?? null,
      failureCategory: failureCategory ?? null,
      clusterAttempts: clusterAttempts ?? [],
    };
  }

  private async recordAdapterDecision(decision: OpenClawAdapterDecision, traceContext: GatewayTraceContext) {
    await this.logModelEvent({
      traceContext,
      event: "openclaw.adapter.decision",
      message: `Adapter routed ${decision.target} via ${decision.route}`,
      metadata: {
        target: decision.target,
        mode: decision.mode,
        strategy: decision.strategy,
        route: decision.route,
        success: decision.success,
        selectedEndpoint: decision.selectedEndpoint,
        fallbackReason: decision.fallbackReason,
        failureCategory: decision.failureCategory,
        clusterAttempts: decision.clusterAttempts,
      },
    });
  }

  private async attachAdapterDecision<T extends Record<string, unknown>>(
    result: T,
    decision: OpenClawAdapterDecision,
    traceContext: GatewayTraceContext,
  ): Promise<T & { adapter: OpenClawAdapterDecision }> {
    const adapter = {
      ...decision,
      traceId: traceContext.traceId,
      parentTraceId: traceContext.parentTraceId,
    } satisfies OpenClawAdapterDecision;
    await this.recordAdapterDecision(adapter, traceContext);
    return {
      ...result,
      adapter,
    };
  }

  async probe(target: ModelTarget, traceContext?: GatewayTraceContext): Promise<ProbeResult> {
    const config = this.resolveConfig(target);
    const attempts: ProbeAttempt[] = [];
    const effectiveTrace = this.ensureTraceContext(traceContext, target, "probe");
    const safeConfig = this.buildSafeConfig(target, config);
    const strategy = this.getAdapterStrategy();

    const clusterResult = await this.clusterClient.execute({
      target: String(target),
      mode: "probe",
      traceContext: effectiveTrace,
      config,
      systemPrompt: "Return exactly one JSON object with key probe and value ok.",
      userPrompt: "Probe the model connection for this agent.",
      extraPayload: {
        kind: "probe",
      },
    });
    const clusterAttempts = clusterResult?.attempts ?? [];
    attempts.push(...this.toDisplayClusterAttempts(clusterAttempts));

    let clusterFallbackReason = this.getLatestFailureReason(clusterAttempts);

    if (clusterResult?.ok) {
      try {
        const parsed = parseProbePayload(
          clusterResult.parsed ??
          (typeof clusterResult.outputText === "string" ? JSON.parse(extractJsonCandidate(clusterResult.outputText)) : undefined),
        );
        return this.attachAdapterDecision(
          {
            success: true,
            fallbackLikely: false,
            config: this.buildClusterSafeConfig(target, config),
            attempts,
            parsed,
          },
          this.buildAdapterDecision({
            traceContext: effectiveTrace,
            target,
            mode: "probe",
            strategy,
            route: "cluster",
            success: true,
            selectedEndpoint: clusterResult.endpoint ? `cluster:${clusterResult.endpoint}` : null,
            clusterAttempts,
          }),
          effectiveTrace,
        );
      } catch (error) {
        clusterFallbackReason =
          error instanceof z.ZodError
            ? "Cluster probe payload failed contract validation."
            : error instanceof Error
              ? error.message
              : "Cluster returned an invalid probe payload.";
      }

      attempts.push({
        endpoint: "cluster:invalid-response",
        ok: false,
        error: clusterFallbackReason,
      });
    }

    if (!config.baseUrl || !config.model) {
      const fallbackReason = "Missing baseUrl or model";
      return this.attachAdapterDecision(
        {
          success: false,
          fallbackLikely: true,
          config: this.clusterClient.isEnabled() ? this.buildClusterSafeConfig(target, config) : safeConfig,
          attempts,
          validationError: fallbackReason,
        },
        this.buildAdapterDecision({
          traceContext: effectiveTrace,
          target,
          mode: "probe",
          strategy,
          route: "failed",
          success: false,
          fallbackReason,
          failureCategory: this.classifyProviderFailure({
            strategy,
            clusterFallbackReason,
            clusterAttempts,
            hasProviderConfig: false,
          }),
          clusterAttempts,
        }),
        effectiveTrace,
      );
    }

    const variants = buildRequestVariants({
      config: { ...config, model: config.model },
      systemPrompt: "Return exactly one JSON object with key probe and value ok.",
      userPrompt: "Probe the model connection for this agent.",
    });
    const taskEnvelope = buildOpenClawTaskEnvelope({
      target: String(target),
      trace: effectiveTrace,
      payload: {
        kind: "probe",
        wireApi: config.wireApi,
        reasoningEffort: config.reasoningEffort ?? null,
      },
    });

    let providerFailureReason: string | null = null;
    let lastProviderEndpoint: string | null = null;

    for (const variant of variants) {
      lastProviderEndpoint = variant.endpoint;
      try {
        await this.logModelEvent({
          traceContext: effectiveTrace,
          event: "openclaw.provider.request.started",
          message: `Probe request started for ${target}`,
          metadata: {
            target,
            endpoint: variant.endpoint,
            taskEnvelope,
          },
        });
        const response = await fetch(new URL(variant.endpoint, config.baseUrl), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
            ...buildGatewayTraceHeaders(effectiveTrace),
          },
          body: JSON.stringify(variant.body),
        });

        const raw = await response.text();
        const preview = raw.slice(0, 240);
        attempts.push({
          endpoint: variant.endpoint,
          status: response.status,
          ok: response.ok,
          preview,
        });

        if (!response.ok) {
          providerFailureReason = `Provider returned HTTP ${response.status}.`;
          await this.logModelEvent({
            level: "warn",
            traceContext: effectiveTrace,
            event: "openclaw.provider.request.failed",
            message: `Probe request failed for ${target}`,
            metadata: {
              target,
              endpoint: variant.endpoint,
              status: response.status,
            },
          });
          continue;
        }

        const payload = JSON.parse(raw);
        const content = extractContent(payload, config.wireApi);
        if (!content) {
          providerFailureReason = "Provider response did not include output text.";
          continue;
        }

        const parsed = parseProbePayload(JSON.parse(extractJsonCandidate(content)));
        await this.logModelEvent({
          traceContext: effectiveTrace,
          event: "openclaw.provider.request.succeeded",
          message: `Probe request succeeded for ${target}`,
          metadata: {
            target,
            endpoint: variant.endpoint,
            status: response.status,
          },
        });
        return this.attachAdapterDecision(
          {
            success: true,
            fallbackLikely: strategy === "cluster-preferred",
            config: safeConfig,
            attempts,
            parsed,
          },
          this.buildAdapterDecision({
            traceContext: effectiveTrace,
            target,
            mode: "probe",
            strategy,
            route: strategy === "cluster-preferred" ? "provider-fallback" : "provider-direct",
            success: true,
            selectedEndpoint: variant.endpoint,
            fallbackReason: strategy === "cluster-preferred" ? clusterFallbackReason : null,
            failureCategory:
              strategy === "cluster-preferred"
                ? this.classifyClusterFailure({
                    fallbackReason: clusterFallbackReason,
                    clusterAttempts,
                  })
                : null,
            clusterAttempts,
          }),
          effectiveTrace,
        );
      } catch (error) {
        providerFailureReason = error instanceof Error ? error.message : "Unknown error";
        await this.logModelEvent({
          level: "error",
          traceContext: effectiveTrace,
          event: "openclaw.provider.request.error",
          message: `Probe request error for ${target}`,
          metadata: {
            target,
            endpoint: variant.endpoint,
            error: providerFailureReason,
          },
        });
        attempts.push({
          endpoint: variant.endpoint,
          ok: false,
          error: providerFailureReason,
        });
      }
    }

    return this.attachAdapterDecision(
      {
        success: false,
        fallbackLikely: true,
        config: safeConfig,
        attempts,
        validationError: providerFailureReason ?? clusterFallbackReason ?? "No successful provider response variant produced JSON.",
      },
      this.buildAdapterDecision({
        traceContext: effectiveTrace,
        target,
        mode: "probe",
        strategy,
        route: "failed",
        success: false,
        selectedEndpoint: lastProviderEndpoint,
        fallbackReason: providerFailureReason ?? clusterFallbackReason ?? "No successful provider response variant produced JSON.",
        failureCategory: this.classifyProviderFailure({
          providerFailureReason,
          strategy,
          clusterFallbackReason,
          clusterAttempts,
          hasProviderConfig: true,
        }),
        clusterAttempts,
      }),
      effectiveTrace,
    );
  }

  async debugJson<T>({
    target,
    systemPrompt,
    userPrompt,
    schema,
    normalize,
    validateClusterPayload,
    traceContext,
    runtimeContext,
  }: {
    target: ModelTarget;
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodType<T, z.ZodTypeDef, unknown>;
    normalize?: (raw: unknown) => unknown;
    validateClusterPayload?: (raw: unknown) => void;
    traceContext?: GatewayTraceContext;
    runtimeContext?: OpenClawRuntimeContext;
  }): Promise<DebugJsonResult> {
    const config = this.resolveConfig(target);
    const attempts: ProbeAttempt[] = [];
    const effectiveTrace = this.ensureTraceContext(traceContext, target, "debug");
    const safeConfig = this.buildSafeConfig(target, config);
    const strategy = this.getAdapterStrategy();

    const clusterResult = await this.clusterClient.execute({
      target: String(target),
      mode: "debug",
      traceContext: effectiveTrace,
      config,
      systemPrompt,
      userPrompt,
      extraPayload: { kind: "debug" },
      runtimeContext,
    });
    const clusterAttempts = clusterResult?.attempts ?? [];
    attempts.push(...this.toDisplayClusterAttempts(clusterAttempts));

    let clusterFallbackReason = this.getLatestFailureReason(clusterAttempts);

    if (clusterResult?.ok) {
      try {
        const extractedJson =
          clusterResult.parsed ??
          (typeof clusterResult.outputText === "string" ? JSON.parse(extractJsonCandidate(clusterResult.outputText)) : undefined);
        validateClusterPayload?.(extractedJson);
        const normalizedJson = extractedJson !== undefined && normalize ? normalize(extractedJson) : extractedJson;
        schema.parse(normalizedJson);
        return this.attachAdapterDecision(
          {
            success: true,
            fallbackLikely: false,
            config: this.buildClusterSafeConfig(target, config),
            attempts,
            content: clusterResult.outputText,
            extractedJson,
            normalizedJson,
          },
          this.buildAdapterDecision({
            traceContext: effectiveTrace,
            target,
            mode: "debug",
            strategy,
            route: "cluster",
            success: true,
            selectedEndpoint: clusterResult.endpoint ? `cluster:${clusterResult.endpoint}` : null,
            clusterAttempts,
          }),
          effectiveTrace,
        );
      } catch (error) {
        clusterFallbackReason = error instanceof Error ? error.message : "Cluster returned invalid debug payload";
        attempts.push({
          endpoint: "cluster:invalid-response",
          ok: false,
          error: clusterFallbackReason,
        });
      }
    }

    if (!config.baseUrl || !config.model) {
      const fallbackReason = "Missing baseUrl or model";
      return this.attachAdapterDecision(
        {
          success: false,
          fallbackLikely: true,
          config: this.clusterClient.isEnabled() ? this.buildClusterSafeConfig(target, config) : safeConfig,
          attempts,
          validationError: fallbackReason,
        },
        this.buildAdapterDecision({
          traceContext: effectiveTrace,
          target,
          mode: "debug",
          strategy,
          route: "failed",
          success: false,
          fallbackReason,
          failureCategory: this.classifyProviderFailure({
            strategy,
            clusterFallbackReason,
            clusterAttempts,
            hasProviderConfig: false,
          }),
          clusterAttempts,
        }),
        effectiveTrace,
      );
    }

    const variants = buildRequestVariants({
      config: { ...config, model: config.model },
      systemPrompt,
      userPrompt,
    });
    const taskEnvelope = buildOpenClawTaskEnvelope({
      target: String(target),
      trace: effectiveTrace,
      payload: {
        kind: "debug",
        wireApi: config.wireApi,
        reasoningEffort: config.reasoningEffort ?? null,
        ...summarizeTaskPrompt({ systemPrompt, userPrompt }),
      },
      runtimeContext,
    });

    let providerFailureReason: string | null = null;
    let lastProviderEndpoint: string | null = null;

    for (const variant of variants) {
      lastProviderEndpoint = variant.endpoint;
      try {
        await this.logModelEvent({
          traceContext: effectiveTrace,
          event: "openclaw.provider.request.started",
          message: `Debug request started for ${target}`,
          metadata: {
            target,
            endpoint: variant.endpoint,
            taskEnvelope,
          },
        });
        const response = await fetch(new URL(variant.endpoint, config.baseUrl), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
            ...buildGatewayTraceHeaders(effectiveTrace, runtimeContext),
          },
          body: JSON.stringify(variant.body),
        });

        const raw = await response.text();
        attempts.push({
          endpoint: variant.endpoint,
          status: response.status,
          ok: response.ok,
          preview: raw.slice(0, 240),
        });

        if (!response.ok) {
          providerFailureReason = `Provider returned HTTP ${response.status}.`;
          await this.logModelEvent({
            level: "warn",
            traceContext: effectiveTrace,
            event: "openclaw.provider.request.failed",
            message: `Debug request failed for ${target}`,
            metadata: {
              target,
              endpoint: variant.endpoint,
              status: response.status,
            },
          });
          continue;
        }

        const payload = JSON.parse(raw);
        const content = extractContent(payload, config.wireApi);
        if (!content) {
          providerFailureReason = "Provider response did not include output text.";
          continue;
        }

        try {
          const extractedJson = JSON.parse(extractJsonCandidate(content));
          const normalizedJson = normalize ? normalize(extractedJson) : extractedJson;
          schema.parse(normalizedJson);
          await this.logModelEvent({
            traceContext: effectiveTrace,
            event: "openclaw.provider.request.succeeded",
            message: `Debug request succeeded for ${target}`,
            metadata: {
              target,
              endpoint: variant.endpoint,
              status: response.status,
            },
          });
          return this.attachAdapterDecision(
            {
              success: true,
              fallbackLikely: strategy === "cluster-preferred",
              config: safeConfig,
              attempts,
              content,
              extractedJson,
              normalizedJson,
            },
            this.buildAdapterDecision({
              traceContext: effectiveTrace,
              target,
              mode: "debug",
              strategy,
              route: strategy === "cluster-preferred" ? "provider-fallback" : "provider-direct",
              success: true,
              selectedEndpoint: variant.endpoint,
              fallbackReason: strategy === "cluster-preferred" ? clusterFallbackReason : null,
              failureCategory:
                strategy === "cluster-preferred"
                  ? this.classifyClusterFailure({
                      fallbackReason: clusterFallbackReason,
                      clusterAttempts,
                    })
                  : null,
              clusterAttempts,
            }),
            effectiveTrace,
          );
        } catch (error) {
          const extractedJson = (() => {
            try {
              return JSON.parse(extractJsonCandidate(content));
            } catch {
              return undefined;
            }
          })();
          const normalizedJson = extractedJson !== undefined && normalize ? normalize(extractedJson) : extractedJson;
          providerFailureReason = error instanceof Error ? error.message : "Schema validation failed";
          await this.logModelEvent({
            level: "warn",
            traceContext: effectiveTrace,
            event: "openclaw.provider.response.invalid",
            message: `Debug response validation failed for ${target}`,
            metadata: {
              target,
              endpoint: variant.endpoint,
              error: providerFailureReason,
            },
          });
          return this.attachAdapterDecision(
            {
              success: false,
              fallbackLikely: true,
              config: safeConfig,
              attempts,
              content,
              extractedJson,
              normalizedJson,
              validationError: providerFailureReason,
            },
            this.buildAdapterDecision({
              traceContext: effectiveTrace,
              target,
              mode: "debug",
              strategy,
              route: "failed",
              success: false,
              selectedEndpoint: variant.endpoint,
              fallbackReason: providerFailureReason,
              failureCategory: this.classifyProviderFailure({
                providerFailureReason,
                strategy,
                clusterFallbackReason,
                clusterAttempts,
                hasProviderConfig: true,
              }),
              clusterAttempts,
            }),
            effectiveTrace,
          );
        }
      } catch (error) {
        providerFailureReason = error instanceof Error ? error.message : "Unknown error";
        await this.logModelEvent({
          level: "error",
          traceContext: effectiveTrace,
          event: "openclaw.provider.request.error",
          message: `Debug request error for ${target}`,
          metadata: {
            target,
            endpoint: variant.endpoint,
            error: providerFailureReason,
          },
        });
        attempts.push({
          endpoint: variant.endpoint,
          ok: false,
          error: providerFailureReason,
        });
      }
    }

    const fallbackReason = providerFailureReason ?? clusterFallbackReason ?? "No successful response variant produced schema-valid JSON";
    return this.attachAdapterDecision(
      {
        success: false,
        fallbackLikely: true,
        config: safeConfig,
        attempts,
        validationError: fallbackReason,
      },
      this.buildAdapterDecision({
        traceContext: effectiveTrace,
        target,
        mode: "debug",
        strategy,
        route: "failed",
        success: false,
        selectedEndpoint: lastProviderEndpoint,
        fallbackReason,
        failureCategory: this.classifyProviderFailure({
          providerFailureReason,
          strategy,
          clusterFallbackReason,
          clusterAttempts,
          hasProviderConfig: true,
        }),
        clusterAttempts,
      }),
      effectiveTrace,
    );
  }

  async generateJson<T>({
    target,
    systemPrompt,
    userPrompt,
    schema,
    normalize,
    validateClusterPayload,
    fallback,
    traceContext,
    runtimeContext,
  }: {
    target: ModelTarget;
    systemPrompt: string;
    userPrompt: string;
    schema: z.ZodType<T, z.ZodTypeDef, unknown>;
    normalize?: (raw: unknown) => unknown;
    validateClusterPayload?: (raw: unknown) => void;
    fallback: () => T;
    traceContext?: GatewayTraceContext;
    runtimeContext?: OpenClawRuntimeContext;
  }): Promise<T> {
    if (this.env.agentMode !== "openai-compatible") {
      return fallback();
    }

    const effectiveTrace = this.ensureTraceContext(traceContext, target, "generate");
    const originalRuntimeResult = await this.originalRuntimeClient.generateJson({
      target: String(target),
      systemPrompt,
      userPrompt,
    });
    if (originalRuntimeResult?.ok) {
      try {
        const result = schema.parse(normalize ? normalize(originalRuntimeResult.parsed) : originalRuntimeResult.parsed);
        await this.logModelEvent({
          traceContext: effectiveTrace,
          event: "openclaw.original-runtime.request.succeeded",
          message: `Original OpenClaw runtime generate succeeded for ${target}`,
          metadata: {
            target,
            durationMs: originalRuntimeResult.durationMs ?? null,
          },
        });
        return result;
      } catch (error) {
        await this.logModelEvent({
          level: "warn",
          traceContext: effectiveTrace,
          event: "openclaw.original-runtime.response.invalid",
          message: `Original OpenClaw runtime response validation failed for ${target}`,
          metadata: {
            target,
            error: error instanceof Error ? error.message : "Unknown validation error",
          },
        });
      }
    } else if (originalRuntimeResult?.error) {
      await this.logModelEvent({
        level: "warn",
        traceContext: effectiveTrace,
        event: "openclaw.original-runtime.request.failed",
        message: `Original OpenClaw runtime generate failed for ${target}`,
        metadata: {
          target,
          error: originalRuntimeResult.error,
        },
      });
    }

    const config = this.resolveConfig(target);
    const strategy = this.getAdapterStrategy();

    const clusterResult = await this.clusterClient.execute({
      target: String(target),
      mode: "generate",
      traceContext: effectiveTrace,
      config,
      systemPrompt,
      userPrompt,
      extraPayload: { kind: "generate" },
      runtimeContext,
    });
    const clusterAttempts = clusterResult?.attempts ?? [];
    let clusterFallbackReason = this.getLatestFailureReason(clusterAttempts);

    if (clusterResult?.ok) {
      try {
        const parsed =
          clusterResult.parsed ??
          (typeof clusterResult.outputText === "string" ? JSON.parse(extractJsonCandidate(clusterResult.outputText)) : undefined);
        validateClusterPayload?.(parsed);
        const result = schema.parse(normalize ? normalize(parsed) : parsed);
        await this.recordAdapterDecision(
          this.buildAdapterDecision({
            traceContext: effectiveTrace,
            target,
            mode: "generate",
            strategy,
            route: "cluster",
            success: true,
            selectedEndpoint: clusterResult.endpoint ? `cluster:${clusterResult.endpoint}` : null,
            clusterAttempts,
          }),
          effectiveTrace,
        );
        return result;
      } catch (error) {
        clusterFallbackReason = error instanceof Error ? error.message : "Cluster response validation failed.";
        await this.logModelEvent({
          level: "warn",
          traceContext: effectiveTrace,
          event: "openclaw.cluster.response.invalid",
          message: `Cluster response validation failed for ${target}`,
          metadata: {
            target,
            endpoint: clusterResult.endpoint,
          },
        });
      }
    } else if (this.clusterClient.isEnabled()) {
      await this.logModelEvent({
        level: "warn",
        traceContext: effectiveTrace,
        event: "openclaw.cluster.fallback",
        message: `Falling back to provider for ${target}`,
        metadata: {
          target,
        },
      });
    }

    if (!config.baseUrl || !config.model) {
      await this.recordAdapterDecision(
        this.buildAdapterDecision({
          traceContext: effectiveTrace,
          target,
          mode: "generate",
          strategy,
          route: "failed",
          success: false,
          fallbackReason: "Missing baseUrl or model",
          failureCategory: this.classifyProviderFailure({
            strategy,
            clusterFallbackReason,
            clusterAttempts,
            hasProviderConfig: false,
          }),
          clusterAttempts,
        }),
        effectiveTrace,
      );
      return fallback();
    }

    try {
      const variants = buildRequestVariants({
        config: { ...config, model: config.model },
        systemPrompt,
        userPrompt,
      });
      const taskEnvelope = buildOpenClawTaskEnvelope({
        target: String(target),
        trace: effectiveTrace,
        payload: {
          kind: "generate",
          wireApi: config.wireApi,
          reasoningEffort: config.reasoningEffort ?? null,
          ...summarizeTaskPrompt({ systemPrompt, userPrompt }),
        },
        runtimeContext,
      });

      let providerFailureReason: string | null = null;
      let lastProviderEndpoint: string | null = null;

      for (const variant of variants) {
        lastProviderEndpoint = variant.endpoint;
        await this.logModelEvent({
          traceContext: effectiveTrace,
          event: "openclaw.provider.request.started",
          message: `Generate request started for ${target}`,
          metadata: {
            target,
            endpoint: variant.endpoint,
            taskEnvelope,
          },
        });
        const response = await fetch(new URL(variant.endpoint, config.baseUrl), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
            ...buildGatewayTraceHeaders(effectiveTrace, runtimeContext),
          },
          body: JSON.stringify(variant.body),
        });

        if (!response.ok) {
          providerFailureReason = `Provider returned HTTP ${response.status}.`;
          await this.logModelEvent({
            level: "warn",
            traceContext: effectiveTrace,
            event: "openclaw.provider.request.failed",
            message: `Generate request failed for ${target}`,
            metadata: {
              target,
              endpoint: variant.endpoint,
              status: response.status,
            },
          });
          continue;
        }

        const payload = (await response.json()) as
          | {
              choices?: Array<{ message?: { content?: string } }>;
            }
          | unknown;

        const content = extractContent(payload, config.wireApi);

        if (!content) {
          providerFailureReason = "Provider response did not include output text.";
          continue;
        }

        const parsed = JSON.parse(extractJsonCandidate(content));
        await this.logModelEvent({
          traceContext: effectiveTrace,
          event: "openclaw.provider.request.succeeded",
          message: `Generate request succeeded for ${target}`,
          metadata: {
            target,
            endpoint: variant.endpoint,
            status: response.status,
          },
        });
        const result = schema.parse(normalize ? normalize(parsed) : parsed);
        await this.recordAdapterDecision(
          this.buildAdapterDecision({
            traceContext: effectiveTrace,
            target,
            mode: "generate",
            strategy,
            route: strategy === "cluster-preferred" ? "provider-fallback" : "provider-direct",
            success: true,
            selectedEndpoint: variant.endpoint,
            fallbackReason: strategy === "cluster-preferred" ? clusterFallbackReason : null,
            failureCategory:
              strategy === "cluster-preferred"
                ? this.classifyClusterFailure({
                    fallbackReason: clusterFallbackReason,
                    clusterAttempts,
                  })
                : null,
            clusterAttempts,
          }),
          effectiveTrace,
        );
        return result;
      }

      await this.recordAdapterDecision(
        this.buildAdapterDecision({
          traceContext: effectiveTrace,
          target,
          mode: "generate",
          strategy,
          route: "failed",
          success: false,
          selectedEndpoint: lastProviderEndpoint,
          fallbackReason: providerFailureReason ?? clusterFallbackReason ?? "No successful provider response variant produced schema-valid JSON.",
          failureCategory: this.classifyProviderFailure({
            providerFailureReason,
            strategy,
            clusterFallbackReason,
            clusterAttempts,
            hasProviderConfig: true,
          }),
          clusterAttempts,
        }),
        effectiveTrace,
      );
      return fallback();
    } catch (error) {
      await this.logModelEvent({
        level: "error",
        traceContext: effectiveTrace,
        event: "openclaw.provider.request.error",
        message: `Generate request error for ${target}`,
        metadata: {
          target,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      await this.recordAdapterDecision(
        this.buildAdapterDecision({
          traceContext: effectiveTrace,
          target,
          mode: "generate",
          strategy,
          route: "failed",
          success: false,
          fallbackReason: error instanceof Error ? error.message : "Unknown error",
          failureCategory: this.classifyProviderFailure({
            providerFailureReason: error instanceof Error ? error.message : "Unknown error",
            strategy,
            clusterFallbackReason,
            clusterAttempts,
            hasProviderConfig: true,
          }),
          clusterAttempts,
        }),
        effectiveTrace,
      );
      return fallback();
    }
  }
}
