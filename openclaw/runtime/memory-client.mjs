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

export const fetchAgentMemoryContext = async ({ gatewayBaseUrl, userId, agentId, scopes, trace, workflow }) => {
  const url = new URL("/internal/agent-memory/context", gatewayBaseUrl);
  url.searchParams.set("userId", userId);
  url.searchParams.set("agentId", agentId);
  if (Array.isArray(scopes) && scopes.length > 0) {
    url.searchParams.set("scopes", scopes.join(","));
  }

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders({ trace, agentId, workflow }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message ?? `Gateway memory context request failed with HTTP ${response.status}.`);
  }
  return payload;
};

export const submitAgentMemoryProposal = async ({ gatewayBaseUrl, proposal, trace, workflow }) => {
  const response = await fetch(new URL("/internal/agent-memory/proposals", gatewayBaseUrl), {
    method: "POST",
    headers: buildHeaders({ trace, agentId: proposal?.sourceAgent, workflow }),
    body: JSON.stringify(proposal),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message ?? `Gateway memory proposal request failed with HTTP ${response.status}.`);
  }
  return payload;
};
