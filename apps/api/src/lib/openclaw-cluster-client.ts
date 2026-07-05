import {
  openClawClusterTaskRequestSchema,
  openClawClusterTaskResponseSchema,
  type GatewayTraceContext,
  type OpenClawAdapterClusterAttempt,
  type OpenClawClusterTaskMode,
  type OpenClawClusterTaskResponse,
} from "@mindanchor/domain";
import { type AgentModelConfig, type AppEnv } from "../env.js";
import {
  buildGatewayTraceHeaders,
  buildOpenClawTaskEnvelope,
  summarizeTaskPrompt,
  type OpenClawRuntimeContext,
} from "./openclaw-trace.js";
import type { MindAnchorTraceLogger } from "./trace-logger.js";

export type ClusterExecutionResult = {
  endpoint?: string;
  status?: number;
  ok: boolean;
  taskId?: string;
  traceId?: string;
  parentTraceId?: string;
  outputText?: string;
  parsed?: unknown;
  metadata: Record<string, unknown>;
  error?: string;
  attempts: OpenClawAdapterClusterAttempt[];
};

export const OPENCLAW_CLUSTER_ENDPOINTS = ["/v1/tasks/execute", "/tasks/execute", "/api/tasks/execute"] as const;
const RETRIABLE_SESSION_LOCK_FRAGMENT = "session file locked";
const RETRIABLE_SESSION_LOCK_MAX_RETRIES = 2;
const RETRIABLE_SESSION_LOCK_BACKOFF_MS = 25;
const RETRIABLE_TRANSPORT_ERROR_FRAGMENTS = ["fetch failed", "econnreset", "econnrefused", "socket hang up", "und_err"];
const RETRIABLE_TRANSPORT_MAX_RETRIES = 1;
const RETRIABLE_TRANSPORT_BACKOFF_MS = 25;
const delay = async (ms: number) => await new Promise((resolve) => setTimeout(resolve, ms));

export class OpenClawClusterClient {
  constructor(
    private readonly env: AppEnv,
    private readonly traceLogger?: MindAnchorTraceLogger,
  ) {}

  isEnabled() {
    return Boolean(this.env.openClawBaseUrl);
  }

  private isRetriableSessionLock(status: number, raw: string) {
    return status === 500 && raw.toLowerCase().includes(RETRIABLE_SESSION_LOCK_FRAGMENT);
  }

  private isRetriableTransportError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error ?? "");
    const normalized = message.toLowerCase();
    return RETRIABLE_TRANSPORT_ERROR_FRAGMENTS.some((fragment) => normalized.includes(fragment));
  }

  async execute({
    target,
    mode,
    traceContext,
    config,
    systemPrompt,
    userPrompt,
    extraPayload,
    runtimeContext,
  }: {
    target: string;
    mode: OpenClawClusterTaskMode;
    traceContext: GatewayTraceContext;
    config: AgentModelConfig;
    systemPrompt: string;
    userPrompt: string;
    extraPayload?: Record<string, unknown>;
    runtimeContext?: OpenClawRuntimeContext;
  }): Promise<ClusterExecutionResult | null> {
    if (!this.env.openClawBaseUrl) {
      return null;
    }

    const attempts: OpenClawAdapterClusterAttempt[] = [];
    const request = openClawClusterTaskRequestSchema.parse({
      ...buildOpenClawTaskEnvelope({
        target,
        trace: traceContext,
        payload: {
          systemPrompt,
          userPrompt,
          config: {
            wireApi: config.wireApi,
            reasoningEffort: config.reasoningEffort ?? null,
            disableResponseStorage: config.disableResponseStorage,
          },
          promptSummary: summarizeTaskPrompt({ systemPrompt, userPrompt }),
          ...(extraPayload ?? {}),
        },
        runtimeContext,
      }),
      mode,
    });

    for (const endpoint of OPENCLAW_CLUSTER_ENDPOINTS) {
      for (let retryIndex = 0; retryIndex <= RETRIABLE_SESSION_LOCK_MAX_RETRIES; retryIndex += 1) {
        let responseStatus: number | undefined;
        try {
          await this.traceLogger?.info({
            traceId: traceContext.traceId,
            parentTraceId: traceContext.parentTraceId,
            event: "openclaw.cluster.request.started",
            message: `Cluster dispatch started for ${target}`,
            metadata: {
              target,
              endpoint,
              mode,
              taskId: request.taskId,
              retryIndex,
            },
          });

          const response = await fetch(new URL(endpoint, this.env.openClawBaseUrl), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...buildGatewayTraceHeaders(traceContext, runtimeContext),
            },
            body: JSON.stringify(request),
          });
          responseStatus = response.status;

          const raw = await response.text();

          if (!response.ok) {
            const retriableSessionLock = this.isRetriableSessionLock(response.status, raw);
            attempts.push({
              endpoint,
              status: response.status,
              ok: false,
              preview: raw.slice(0, 240),
              error: `Cluster returned HTTP ${response.status}.`,
            });
            await this.traceLogger?.warn({
              traceId: traceContext.traceId,
              parentTraceId: traceContext.parentTraceId,
              event: retriableSessionLock ? "openclaw.cluster.request.retrying" : "openclaw.cluster.request.failed",
              message: retriableSessionLock
                ? `Cluster session lock detected for ${target}; retrying ${endpoint}`
                : `Cluster dispatch failed for ${target}`,
              metadata: {
                target,
                endpoint,
                mode,
                status: response.status,
                preview: raw.slice(0, 240),
                retryIndex,
                retriableSessionLock,
              },
            });
            if (retriableSessionLock && retryIndex < RETRIABLE_SESSION_LOCK_MAX_RETRIES) {
              await delay(RETRIABLE_SESSION_LOCK_BACKOFF_MS * (retryIndex + 1));
              continue;
            }
            break;
          }

          const payload = openClawClusterTaskResponseSchema.parse(JSON.parse(raw) as OpenClawClusterTaskResponse);

          if (!payload.success) {
            attempts.push({
              endpoint,
              status: response.status,
              ok: false,
              preview: raw.slice(0, 240),
              error: payload.error ?? "Cluster rejected the execution request.",
            });
            await this.traceLogger?.warn({
              traceId: traceContext.traceId,
              parentTraceId: traceContext.parentTraceId,
              event: "openclaw.cluster.response.rejected",
              message: `Cluster execution rejected for ${target}`,
              metadata: {
                target,
                endpoint,
                mode,
                error: payload.error ?? null,
                retryIndex,
              },
            });
            break;
          }

          attempts.push({
            endpoint,
            status: response.status,
            ok: true,
            preview:
              typeof payload.outputText === "string" && payload.outputText.length > 0
                ? payload.outputText.slice(0, 240)
                : JSON.stringify(payload.parsed ?? {}).slice(0, 240),
          });
          await this.traceLogger?.info({
            traceId: payload.trace?.traceId ?? traceContext.traceId,
            parentTraceId: payload.trace?.parentTraceId ?? traceContext.parentTraceId,
            event: "openclaw.cluster.request.succeeded",
            message: `Cluster dispatch succeeded for ${target}`,
            metadata: {
              target,
              endpoint,
              mode,
              taskId: payload.taskId ?? request.taskId,
              retryIndex,
            },
          });

          return {
            endpoint,
            status: response.status,
            ok: true,
            taskId: payload.taskId ?? request.taskId,
            traceId: payload.trace?.traceId ?? traceContext.traceId,
            parentTraceId: payload.trace?.parentTraceId ?? traceContext.parentTraceId,
            outputText: payload.outputText,
            parsed: payload.parsed,
            metadata: payload.metadata,
            error: payload.error,
            attempts,
          };
        } catch (error) {
          const retriableTransportError = this.isRetriableTransportError(error);
          attempts.push({
            endpoint,
            status: responseStatus,
            ok: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          await this.traceLogger?.error({
            traceId: traceContext.traceId,
            parentTraceId: traceContext.parentTraceId,
            event: "openclaw.cluster.request.error",
            message: `Cluster dispatch error for ${target}`,
            metadata: {
              target,
              endpoint,
              mode,
              error: error instanceof Error ? error.message : "Unknown error",
              retryIndex,
              retriableTransportError,
            },
          });
          if (retriableTransportError && retryIndex < RETRIABLE_TRANSPORT_MAX_RETRIES) {
            await this.traceLogger?.warn({
              traceId: traceContext.traceId,
              parentTraceId: traceContext.parentTraceId,
              event: "openclaw.cluster.request.retrying",
              message: `Cluster transport error detected for ${target}; retrying ${endpoint}`,
              metadata: {
                target,
                endpoint,
                mode,
                error: error instanceof Error ? error.message : "Unknown error",
                retryIndex,
                retriableTransportError,
              },
            });
            await delay(RETRIABLE_TRANSPORT_BACKOFF_MS * (retryIndex + 1));
            continue;
          }
          break;
        }
      }
    }

    return {
      ok: false,
      metadata: {},
      error: attempts.at(-1)?.error,
      attempts,
    };
  }
}
