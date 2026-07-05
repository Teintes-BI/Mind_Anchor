export const buildRegistryPhaseSummary = (payload) => {
  const externalRuntime = payload?.externalRuntime ?? {};
  const nativeRegistry = payload?.nativeRegistry ?? {};
  const issueBreakdown = {
    missingPersona: Number(externalRuntime.healthIssueCounts?.missingPersonaCount ?? 0),
    contractMismatch: Number(externalRuntime.healthIssueCounts?.contractMismatchCount ?? 0),
    runtimeContractMismatch: Number(externalRuntime.healthIssueCounts?.runtimeContractMismatchCount ?? 0),
    workflowContractMismatch: Number(externalRuntime.healthIssueCounts?.workflowContractMismatchCount ?? 0),
    workflowResponseContractMismatch: Number(externalRuntime.healthIssueCounts?.workflowResponseContractMismatchCount ?? 0),
    workflowExecutionContractMismatch: Number(externalRuntime.healthIssueCounts?.workflowExecutionContractMismatchCount ?? 0),
    workflowExecutionProbeMismatch: Number(externalRuntime.healthIssueCounts?.workflowExecutionProbeMismatchCount ?? 0),
    unknownExternalAgent: Number(externalRuntime.healthIssueCounts?.unknownExternalAgentCount ?? 0),
  };

  return {
    healthStatus: externalRuntime.healthStatus ?? "not_configured",
    healthReasonCodes: Array.isArray(externalRuntime.healthReasonCodes) ? externalRuntime.healthReasonCodes : [],
    totalIssueCount: Number(externalRuntime.healthIssueCounts?.totalIssueCount ?? 0),
    missingPersonaCount: issueBreakdown.missingPersona,
    contractMismatchCount: issueBreakdown.contractMismatch,
    runtimeContractMismatchCount: issueBreakdown.runtimeContractMismatch,
    workflowContractMismatchCount: issueBreakdown.workflowContractMismatch,
    workflowResponseContractMismatchCount: issueBreakdown.workflowResponseContractMismatch,
    workflowExecutionContractMismatchCount: issueBreakdown.workflowExecutionContractMismatch,
    workflowExecutionProbeMismatchCount: issueBreakdown.workflowExecutionProbeMismatch,
    unknownExternalAgentCount: issueBreakdown.unknownExternalAgent,
    issueBreakdown,
    reachable: Boolean(externalRuntime.reachable),
    configured: Boolean(externalRuntime.configured),
    baseUrl: externalRuntime.baseUrl ?? null,
    runtime: externalRuntime.runtime ?? null,
    runtimeVersion: externalRuntime.runtimeVersion ?? null,
    matchedAgentCount: Array.isArray(externalRuntime.matchedAgentIds) ? externalRuntime.matchedAgentIds.length : 0,
    nativeAgentCount: Number(nativeRegistry.totalAgents ?? 0),
  };
};

export const evaluateRegistryPhaseGate = ({ phaseTitle, shouldEnforceCluster, registrySummary }) => {
  if (!shouldEnforceCluster) {
    return;
  }

  if (!registrySummary) {
    throw new Error(`${phaseTitle} expected OpenClaw registry summary, but none was captured.`);
  }

  if (registrySummary.healthStatus !== "aligned") {
    const reasonCodes =
      Array.isArray(registrySummary.healthReasonCodes) && registrySummary.healthReasonCodes.length > 0
        ? registrySummary.healthReasonCodes.join(", ")
        : "unknown";
    const issueBreakdown =
      registrySummary.issueBreakdown && typeof registrySummary.issueBreakdown === "object"
        ? Object.entries(registrySummary.issueBreakdown)
            .filter(([, value]) => Number(value) > 0)
            .map(([key, value]) => `${key}=${value}`)
            .join(", ")
        : "";
    throw new Error(
      `${phaseTitle} expected OpenClaw registry healthStatus=aligned, got ${registrySummary.healthStatus} (${reasonCodes})${issueBreakdown ? `; issue breakdown: ${issueBreakdown}` : ""}.`,
    );
  }
};
