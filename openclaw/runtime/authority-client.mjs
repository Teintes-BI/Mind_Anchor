const TRACE_HEADER_NAMES = {
  traceId: "x-mindanchor-trace-id",
  parentTraceId: "x-mindanchor-parent-trace-id",
  requestTraceId: "x-mindanchor-request-trace-id",
  gatewaySource: "x-mindanchor-gateway-source",
  operation: "x-mindanchor-operation",
  agentName: "x-mindanchor-agent-name",
  workflow: "x-mindanchor-workflow",
  scenarioId: "x-mindanchor-scenario-id",
  userId: "x-mindanchor-user-id",
};

const pickString = (...values) =>
  values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find((value) => value.length > 0);

const getArrayOfStrings = (value) =>
  Array.isArray(value) ? value.map((item) => pickString(item)).filter(Boolean) : [];

const buildHeaders = ({ trace, agentId, workflow }) =>
  Object.fromEntries(
    Object.entries({
      [TRACE_HEADER_NAMES.traceId]: trace?.traceId,
      [TRACE_HEADER_NAMES.parentTraceId]: trace?.parentTraceId,
      [TRACE_HEADER_NAMES.requestTraceId]: trace?.requestTraceId,
      [TRACE_HEADER_NAMES.gatewaySource]: trace?.source,
      [TRACE_HEADER_NAMES.operation]: trace?.operation ?? "generate",
      [TRACE_HEADER_NAMES.agentName]: agentId,
      [TRACE_HEADER_NAMES.workflow]: workflow ?? trace?.workflow,
      [TRACE_HEADER_NAMES.scenarioId]: trace?.scenarioId,
      [TRACE_HEADER_NAMES.userId]: trace?.userId,
      "Content-Type": "application/json",
    }).filter(([, value]) => typeof value === "string" && value.length > 0),
  );

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const assertOk = (response, payload, label) => {
  if (!response.ok) {
    throw new Error(payload?.message ?? `${label} failed with HTTP ${response.status}.`);
  }
};

export const applyJarvisAuthorityDecision = async ({ gatewayBaseUrl, decision, context, trace, workflow }) => {
  const endpoint = "/internal/agent-authority/jarvis/execute";
  const payload = {
    userId: pickString(context?.userId, trace?.userId) ?? "demo-user",
    goalId: pickString(context?.goalId),
    riskLevel: pickString(context?.riskLevel) ?? "low",
    authorityAgent: pickString(decision?.authorityAgent) ?? "life-secretary-agent",
    targetKind: pickString(decision?.targetKind) ?? "plan_change",
    executionMode: pickString(decision?.executionMode) ?? "proposal",
    orderedTaskIds: getArrayOfStrings(decision?.orderedTaskIds),
    rationale: pickString(decision?.rationale, context?.rationale) ?? "Jarvis authority apply requested.",
    summary: pickString(decision?.summary, context?.summary),
    beforeStateSummary: pickString(decision?.beforeStateSummary, context?.beforeStateSummary),
    afterStateSummary: pickString(decision?.afterStateSummary, context?.afterStateSummary),
    sessionId: pickString(context?.sessionId),
    taskId: pickString(context?.taskId),
    nextStep: pickString(decision?.nextStep, context?.nextStep),
    suggestedMinutes:
      typeof decision?.suggestedMinutes === "number"
        ? decision.suggestedMinutes
        : typeof context?.suggestedMinutes === "number"
          ? context.suggestedMinutes
          : undefined,
    reprioritizedTaskIds: getArrayOfStrings(decision?.reprioritizedTaskIds ?? context?.reprioritizedTaskIds),
  };

  const response = await fetch(new URL(endpoint, gatewayBaseUrl), {
    method: "POST",
    headers: buildHeaders({
      trace,
      agentId: payload.authorityAgent,
      workflow,
    }),
    body: JSON.stringify(payload),
  });
  const result = await parseJson(response);
  assertOk(response, result, "Gateway Jarvis authority apply");
  return { endpoint, result };
};

export const applyDataGovernanceDecision = async ({ gatewayBaseUrl, decision, trace, workflow }) => {
  const endpoint = "/internal/agent-authority/data/execute";
  const payload = {
    authorityAgent: pickString(decision?.authorityAgent) ?? "memory-governor-agent",
    action: pickString(decision?.action) ?? "accept_candidate",
    executionMode: pickString(decision?.executionMode) ?? "govern",
    candidateId: pickString(decision?.candidateId),
    memoryId: pickString(decision?.memoryId),
  };

  const response = await fetch(new URL(endpoint, gatewayBaseUrl), {
    method: "POST",
    headers: buildHeaders({
      trace,
      agentId: payload.authorityAgent,
      workflow,
    }),
    body: JSON.stringify(payload),
  });
  const result = await parseJson(response);
  assertOk(response, result, "Gateway Data authority apply");
  return { endpoint, result };
};
