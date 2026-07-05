const isStrictlyPassedStep = (step) => step.conclusion === "passed" && step.success !== false;

const formatFailureCategoryCounts = (counts) => {
  const entries = Object.entries(counts ?? {});
  if (entries.length === 0) {
    return "无";
  }
  return entries
    .sort(([left], [right]) => left.localeCompare(right, "en"))
    .map(([category, count]) => `\`${category}=${count}\``)
    .join(", ");
};

export const buildCorePhaseReportMarkdown = ({
  report,
  apiBaseUrl,
  webBaseUrl,
  clusterBaseUrl,
  clusterMode,
  providerMode,
  jsonFile,
  logsDir,
  responsesDir,
}) => {
  const phaseRows = report.phases
    .map((phase) => {
      const passedSteps = phase.steps.filter(isStrictlyPassedStep).length;
      return `| ${phase.title} | ${phase.status} | ${phase.agentMode} | ${phase.registrySummary?.healthStatus ?? "—"} | ${phase.openClawBaseUrl ?? "—"} | ${passedSteps}/${phase.steps.length} |`;
    })
    .join("\n");

  const failureSection =
    report.failures.length === 0
      ? "- 无失败记录。"
      : report.failures.map((failure) => `- [${failure.phaseId}] ${failure.label}: ${failure.message}`).join("\n");

  const preflightSection = report.preflight
    ? `## Preflight

- 状态：\`${report.preflight.ok ? "passed" : "failed"}\`
- Issues：\`${report.preflight.issues?.length ?? 0}\`
${report.preflight.providerAuthProbeEnabled ? `- Provider auth probe：\`${report.preflight.providerAuthProbe?.ok ? "passed" : "failed"}\`
- Provider auth accepted via：\`${report.preflight.providerAuthProbe?.acceptedVia ?? "—"}\`
- Provider auth endpoint：\`${report.preflight.providerAuthProbe?.selectedEndpoint ?? "—"}\`` : "- Provider auth probe：`skipped`"}
${report.preflight.providerConfigDrift ? `- Provider config drift：\`${report.preflight.providerConfigDrift.aligned ? "aligned" : "drifted"}\`
- Gateway baseUrl：\`${report.preflight.providerConfigDrift.summary?.gateway?.baseUrl ?? "—"}\`
- OpenClaw baseUrl：\`${report.preflight.providerConfigDrift.summary?.openClaw?.baseUrl ?? "—"}\`` : ""}
${report.preflight.issues?.length ? report.preflight.issues.map((issue) => `- [${issue.code}] ${issue.message} ${issue.guidance}`).join("\n") : "- 无 preflight 问题。"}
`
    : "";

  const phaseDetails = report.phases
    .map((phase) => {
      const rows = phase.steps
        .map(
          (step) =>
            `| ${step.label} | ${step.statusCode ?? "ERR"} | ${step.traceId ?? "—"} | ${step.adapterRoute ?? "—"} | ${step.selectedEndpoint ?? "—"} | ${step.fallbackLikely ?? "—"} | ${step.fallbackReason ?? "—"} | ${step.conclusion} |`,
        )
        .join("\n");

      return `## ${phase.title}

- 状态：\`${phase.status}\`
- Agent mode：\`${phase.agentMode}\`
- Registry health：\`${phase.registrySummary?.healthStatus ?? "未记录"}\`
- OpenClaw Base URL：\`${phase.openClawBaseUrl ?? "未配置"}\`
- Failure categories：${formatFailureCategoryCounts(phase.failureCategoryCounts)}
${phase.registrySummary ? `- Registry issues：\`${phase.registrySummary.totalIssueCount}\`（missing persona: \`${phase.registrySummary.missingPersonaCount}\`）
- Registry reasons：${phase.registrySummary.healthReasonCodes.length > 0 ? phase.registrySummary.healthReasonCodes.map((code) => `\`${code}\``).join(", ") : "无"}
- Registry issue breakdown：contract=\`${phase.registrySummary.contractMismatchCount}\` / runtime=\`${phase.registrySummary.runtimeContractMismatchCount}\` / workflow=\`${phase.registrySummary.workflowContractMismatchCount}\` / workflow-response=\`${phase.registrySummary.workflowResponseContractMismatchCount}\` / workflow-execution=\`${phase.registrySummary.workflowExecutionContractMismatchCount}\` / execution-probe=\`${phase.registrySummary.workflowExecutionProbeMismatchCount}\` / unknown-external=\`${phase.registrySummary.unknownExternalAgentCount}\`
- Registry runtime：\`${phase.registrySummary.runtime ?? "未上报"}\` / \`${phase.registrySummary.runtimeVersion ?? "未上报"}\`
- Registry matched agents：\`${phase.registrySummary.matchedAgentCount}/${phase.registrySummary.nativeAgentCount}\`` : ""}

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows}
`;
    })
    .join("\n");

  return `# Core Phase Test Report

- Started: \`${report.startedAt}\`
- Completed: \`${report.completedAt ?? "in-progress"}\`
- API Base URL: \`${apiBaseUrl}\`
- Web Base URL: \`${webBaseUrl}\`
- Cluster Mode: \`${clusterMode}\`
- Provider Mode: \`${providerMode}\`
- Cluster Base URL: \`${clusterBaseUrl || "未配置"}\`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
${phaseRows}

## Failures

${failureSection}

${preflightSection}

## Artifacts

- JSON report: \`${jsonFile}\`
- Logs: \`${logsDir}\`
- Responses: \`${responsesDir}\`

${phaseDetails}
`;
};
