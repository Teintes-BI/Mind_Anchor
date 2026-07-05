export const executePersonaTurn = ({ targetAgent, routeDecision, contextSource }) => {
  const frontAgent = routeDecision?.frontAgent ?? targetAgent;
  const consultedAgent = routeDecision?.consultedAgent ?? null;
  const routingMode = routeDecision?.routingMode ?? "auto";
  const manualOverride = Boolean(routeDecision?.manualOverride);
  const handoffReason = routeDecision?.handoffReason ?? null;
  const overrideSourceAgent = routeDecision?.overrideSourceAgent ?? null;
  const visibleSummary =
    routeDecision?.visibleSummary ??
    (contextSource === "manual_checkin"
      ? `Picard exposed ${frontAgent} after a manual check-in.`
      : `Picard exposed ${frontAgent} for the current turn.`);

  return {
    currentFrontAgent: frontAgent,
    routingMode,
    manualOverride,
    consultedAgent,
    handoffReason,
    overrideSourceAgent,
    visibleSummary,
  };
};
