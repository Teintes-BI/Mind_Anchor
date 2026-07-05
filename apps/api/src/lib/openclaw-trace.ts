import { createHash } from "node:crypto";
import { createId, now } from "./utils.js";
import type { GatewayTraceContext, OpenClawTaskEnvelope } from "@mindanchor/domain";

export const TRACE_HEADER_NAMES = {
  traceId: "x-mindanchor-trace-id",
  parentTraceId: "x-mindanchor-parent-trace-id",
  requestTraceId: "x-mindanchor-request-trace-id",
  gatewaySource: "x-mindanchor-gateway-source",
  operation: "x-mindanchor-operation",
  agentName: "x-mindanchor-agent-name",
  workflow: "x-mindanchor-workflow",
  scenarioId: "x-mindanchor-scenario-id",
  userId: "x-mindanchor-user-id",
  frontAgent: "x-mindanchor-front-agent",
  runtimeAgentId: "x-mindanchor-runtime-agent-id",
  memoryScopes: "x-mindanchor-memory-scopes",
} as const;

export type OpenClawRuntimeContext = {
  workflow?: string;
  userId?: string;
  frontAgent?: string;
  runtimeAgentId?: string;
  memoryScopes?: string[];
  gatewayBaseUrl?: string;
};

export type TraceOperation =
  | "gateway-request"
  | "probe"
  | "debug"
  | "generate"
  | "regression-suite"
  | "regression-matrix"
  | "scenario-seed";

export const buildGatewayTraceContext = ({
  traceId,
  parentTraceId,
  requestTraceId,
  operation,
  agentName,
  workflow,
  scenarioId,
  userId,
}: {
  traceId?: string;
  parentTraceId?: string;
  requestTraceId?: string;
  operation: TraceOperation | string;
  agentName?: string;
  workflow?: string;
  scenarioId?: string;
  userId?: string;
}): GatewayTraceContext => ({
  traceId: traceId ?? createId(),
  parentTraceId,
  requestTraceId,
  source: "mindanchor-gateway",
  operation,
  agentName,
  workflow,
  scenarioId,
  userId,
});

export const buildGatewayTraceHeaders = (trace: GatewayTraceContext, runtimeContext?: OpenClawRuntimeContext) =>
  Object.fromEntries(
    Object.entries({
      [TRACE_HEADER_NAMES.traceId]: trace.traceId,
      [TRACE_HEADER_NAMES.parentTraceId]: trace.parentTraceId,
      [TRACE_HEADER_NAMES.requestTraceId]: trace.requestTraceId,
      [TRACE_HEADER_NAMES.gatewaySource]: trace.source,
      [TRACE_HEADER_NAMES.operation]: trace.operation,
      [TRACE_HEADER_NAMES.agentName]: trace.agentName,
      [TRACE_HEADER_NAMES.workflow]: runtimeContext?.workflow ?? trace.workflow,
      [TRACE_HEADER_NAMES.scenarioId]: trace.scenarioId,
      [TRACE_HEADER_NAMES.userId]: runtimeContext?.userId ?? trace.userId,
      [TRACE_HEADER_NAMES.frontAgent]: runtimeContext?.frontAgent,
      [TRACE_HEADER_NAMES.runtimeAgentId]: runtimeContext?.runtimeAgentId,
      [TRACE_HEADER_NAMES.memoryScopes]:
        runtimeContext?.memoryScopes && runtimeContext.memoryScopes.length > 0
          ? runtimeContext.memoryScopes.join(",")
          : undefined,
    }).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0),
  );

const hashText = (value: string) => createHash("sha256").update(value).digest("hex");

export const summarizeTaskPrompt = (input: { systemPrompt: string; userPrompt: string }) => ({
  systemPromptHash: hashText(input.systemPrompt),
  userPromptHash: hashText(input.userPrompt),
  systemPromptLength: input.systemPrompt.length,
  userPromptLength: input.userPrompt.length,
});

export const buildOpenClawTaskEnvelope = ({
  target,
  trace,
  payload,
  runtimeContext,
}: {
  target: string;
  trace: GatewayTraceContext;
  payload: Record<string, unknown>;
  runtimeContext?: OpenClawRuntimeContext;
}): OpenClawTaskEnvelope => ({
  taskId: createId(),
  target,
  createdAt: now(),
  trace: {
    ...trace,
    workflow: runtimeContext?.workflow ?? trace.workflow,
    userId: runtimeContext?.userId ?? trace.userId,
  },
  payload: {
    ...payload,
    userId: runtimeContext?.userId ?? trace.userId ?? payload.userId,
    workflow: runtimeContext?.workflow ?? trace.workflow ?? payload.workflow,
    frontAgent: runtimeContext?.frontAgent ?? payload.frontAgent,
    runtimeAgentId: runtimeContext?.runtimeAgentId ?? payload.runtimeAgentId,
    memoryScopes: runtimeContext?.memoryScopes ?? payload.memoryScopes,
    gatewayBaseUrl: runtimeContext?.gatewayBaseUrl ?? payload.gatewayBaseUrl,
  },
});
