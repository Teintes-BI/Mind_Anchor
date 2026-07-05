import path from "node:path";

export function defaultOpenClawRuntimeTransportReportPath(cwd) {
  return path.resolve(cwd, "tmp", "openclaw-runtime-transport-report.json");
}

export function defaultOpenClawRuntimeTransportReportMarkdownPath(cwd) {
  return path.resolve(cwd, "tmp", "openclaw-runtime-transport-report.md");
}

const formatCounts = (counts) => {
  const entries = Object.entries(counts ?? {});
  if (entries.length === 0) {
    return "无";
  }
  return entries.map(([key, value]) => `- \`${key}\`: ${value}`).join("\n");
};

const formatIssues = (issues) => {
  if (!Array.isArray(issues) || issues.length === 0) {
    return "- 无";
  }
  return issues.map((issue) => `- [${issue.code}] ${issue.message}`).join("\n");
};

const formatAttemptSummary = (summary) => {
  if (!summary || summary.totalAttempts === 0) {
    return "- 无 cluster attempt 摘要";
  }

  const endpointLines = Object.entries(summary.attemptsPerEndpoint ?? {})
    .map(([endpoint, count]) => `- \`${endpoint}\`: ${count}`)
    .join("\n");

  return [
    `- totalAttempts: \`${summary.totalAttempts}\``,
    `- uniqueEndpoints: ${summary.uniqueEndpoints.map((endpoint) => `\`${endpoint}\``).join(", ")}`,
    `- allErrorsFetchFailed: \`${summary.allErrorsFetchFailed}\``,
    "- attemptsPerEndpoint:",
    endpointLines,
  ].join("\n");
};

export function renderOpenClawRuntimeTransportReportMarkdown(report) {
  const snapshot = report.snapshot ?? {};
  const runtimeFiles = snapshot.runtimeFiles ?? {};
  const runtimeHealth = snapshot.runtimeHealth ?? {};
  const adapter = snapshot.adapter ?? {};

  return `# OpenClaw Runtime Transport Report

- generatedAt: \`${report.generatedAt}\`
- diagnoseCommand: \`${report.diagnoseCommand}\`

## Runtime Files

- filePrefix: \`${runtimeFiles.filePrefix ?? "—"}\`
- status: \`${runtimeFiles.status ?? "—"}\`
- pidFile: \`${runtimeFiles.pidFile ?? "—"}\`
- logFile: \`${runtimeFiles.logFile ?? "—"}\`
- envFile: \`${runtimeFiles.envFile ?? "—"}\`

## Runtime Health

- loopback: \`${runtimeHealth.loopback?.ok ?? false}\` status=\`${runtimeHealth.loopback?.status ?? "ERR"}\` url=\`${runtimeHealth.loopback?.url ?? "—"}\`
- lan: \`${runtimeHealth.lan?.ok ?? false}\` status=\`${runtimeHealth.lan?.status ?? "ERR"}\` url=\`${runtimeHealth.lan?.url ?? "—"}\`

## Adapter

- httpStatus: \`${adapter.httpStatus ?? "ERR"}\`
- clusterEnabled: \`${adapter.clusterEnabled ?? "—"}\`
- executionStrategy: \`${adapter.executionStrategy ?? "—"}\`
- lastDecision.route: \`${adapter.lastDecision?.route ?? "—"}\`
- lastDecision.target: \`${adapter.lastDecision?.target ?? "—"}\`
- lastFallback.failureCategory: \`${adapter.lastFallback?.failureCategory ?? "—"}\`
- lastFallback.fallbackReason: \`${adapter.lastFallback?.fallbackReason ?? "—"}\`

## Failure Category Counts

${formatCounts(adapter.failureCategoryCounts)}

## Cluster Attempt Summary

${formatAttemptSummary(adapter.clusterAttemptSummary)}

## Issues

${formatIssues(snapshot.issues)}
`;
}
