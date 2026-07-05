type TraceEventLike = {
  event: string;
  metadata?: Record<string, unknown> | null;
};

export type ConversationAdapterRoute = {
  agentName: string;
  workflow: string | null;
  route: string;
  selectedEndpoint: string | null;
  fallbackReason: string | null;
};

export type ConversationRouteMetrics = {
  adapterDecisionCount: number;
  agentCounts: Record<string, number>;
  workflowCounts: Record<string, number>;
  routeCounts: Record<string, number>;
  fallbackReasonCounts: Record<string, number>;
};

export type ConversationRuntimeSource =
  | "original-runtime"
  | "managed-runtime"
  | "provider-direct"
  | "failed";

function incrementCount(record: Record<string, number>, key: string | null) {
  if (!key || key.length === 0) {
    return;
  }
  record[key] = (record[key] ?? 0) + 1;
}

export function collectConversationRouteData(events: TraceEventLike[]) {
  let usedOpenClaw = false;
  let hadFallback = false;
  let primaryRoute: string | null = null;
  let usedOriginalRuntime = false;
  const adapterRoutes: ConversationAdapterRoute[] = [];
  const agentCounts: Record<string, number> = {};
  const workflowCounts: Record<string, number> = {};
  const routeCounts: Record<string, number> = {};
  const fallbackReasonCounts: Record<string, number> = {};

  for (const event of events) {
    if (event.event === "openclaw.original-runtime.request.succeeded") {
      usedOriginalRuntime = true;
    }

    if (event.event !== "openclaw.adapter.decision") {
      continue;
    }

    const route = typeof event.metadata?.route === "string" ? event.metadata.route : null;
    const agentName = typeof event.metadata?.agentName === "string" ? event.metadata.agentName : null;
    if (!route || !agentName) {
      continue;
    }

    const workflow = typeof event.metadata?.workflow === "string" ? event.metadata.workflow : null;
    const fallbackReason = typeof event.metadata?.fallbackReason === "string" ? event.metadata.fallbackReason : null;

    primaryRoute ??= route;
    if (route === "cluster") {
      usedOpenClaw = true;
    }
    if (route === "provider-fallback" || fallbackReason !== null) {
      hadFallback = true;
    }

    adapterRoutes.push({
      agentName,
      workflow,
      route,
      selectedEndpoint: typeof event.metadata?.selectedEndpoint === "string" ? event.metadata.selectedEndpoint : null,
      fallbackReason,
    });
    incrementCount(agentCounts, agentName);
    incrementCount(workflowCounts, workflow);
    incrementCount(routeCounts, route);
    incrementCount(fallbackReasonCounts, fallbackReason);
  }

  const runtimeSource: ConversationRuntimeSource | null = usedOriginalRuntime
    ? "original-runtime"
    : usedOpenClaw
      ? "managed-runtime"
      : primaryRoute === "provider-direct"
        ? "provider-direct"
        : primaryRoute === "failed"
          ? "failed"
          : null;

  return {
    primaryRoute,
    usedOpenClaw,
    hadFallback,
    runtimeSource,
    adapterRoutes,
    routeMetrics:
      adapterRoutes.length > 0
        ? {
            adapterDecisionCount: adapterRoutes.length,
            agentCounts,
            workflowCounts,
            routeCounts,
            fallbackReasonCounts,
          }
        : null,
  };
}
