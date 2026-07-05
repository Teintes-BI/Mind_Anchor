import path from "node:path";

export const REQUIRED_OPENCLAW_STABILITY_ENDPOINT = "cluster:/v1/tasks/execute";

export function defaultOpenClawRuntimeStabilityJsonPath(cwd, stamp) {
  return path.resolve(cwd, "test-results", `openclaw-runtime-stability-${stamp}.json`);
}

export function defaultOpenClawRuntimeStabilityMarkdownPath(cwd, stamp) {
  return path.resolve(cwd, "test-results", `openclaw-runtime-stability-${stamp}.md`);
}

const increment = (counts, key) => {
  if (!key) {
    return;
  }
  counts[key] = (counts[key] ?? 0) + 1;
};

const readChecks = (report) => (Array.isArray(report?.rounds) ? report.rounds.flatMap((round) => round.checks ?? []) : []);

export function buildOpenClawRuntimeStabilitySummary(report) {
  const checks = readChecks(report);
  const routeCounts = {};
  const failureCategoryCounts = {};
  const latestByAgent = {};
  let clusterRouteCount = 0;
  let providerFallbackCount = 0;
  let failedCount = 0;
  let nonClusterCount = 0;

  for (const check of checks) {
    const route = check?.route ?? "unknown";
    increment(routeCounts, route);
    if (route === "cluster" && check?.selectedEndpoint === REQUIRED_OPENCLAW_STABILITY_ENDPOINT && !check?.fallbackReason && !check?.failureCategory) {
      clusterRouteCount += 1;
    } else if (route === "provider-fallback") {
      providerFallbackCount += 1;
      nonClusterCount += 1;
    } else {
      nonClusterCount += 1;
    }
    if (route === "failed" || route === "provider-fallback" || check?.httpStatus >= 400 || check?.error) {
      failedCount += 1;
    }
    increment(failureCategoryCounts, check?.failureCategory);
    if (check?.target && check.target !== "gateway-health" && check.target !== "scenario-seed" && check.target !== "adapter-status") {
      latestByAgent[check.target] = {
        route: check.route ?? null,
        selectedEndpoint: check.selectedEndpoint ?? null,
        traceId: check.traceId ?? null,
        fallbackReason: check.fallbackReason ?? null,
        failureCategory: check.failureCategory ?? null,
      };
    }
  }

  const rounds = Array.isArray(report?.rounds) ? report.rounds : [];
  const roundErrors = rounds.flatMap((round) => round.errors ?? []);
  const passed =
    rounds.length === (report?.roundsPlanned ?? rounds.length) &&
    rounds.every((round) => round.status === "passed") &&
    providerFallbackCount === 0 &&
    failedCount === 0 &&
    nonClusterCount === 0 &&
    roundErrors.length === 0;

  return {
    passed,
    roundsPlanned: report?.roundsPlanned ?? rounds.length,
    roundsCompleted: rounds.length,
    durationMs: report?.durationMs ?? null,
    clusterRouteCount,
    providerFallbackCount,
    failedCount,
    nonClusterCount,
    routeCounts,
    failureCategoryCounts,
    latestByAgent,
    errorSamples: roundErrors.slice(0, 10),
  };
}

const renderCounts = (counts) => {
  const entries = Object.entries(counts ?? {});
  if (entries.length === 0) {
    return "- 无";
  }
  return entries.map(([key, value]) => `- ${key}: \`${value}\``).join("\n");
};

const renderLatestByAgent = (latestByAgent) => {
  const entries = Object.entries(latestByAgent ?? {});
  if (entries.length === 0) {
    return "| Agent | route | selectedEndpoint | traceId | fallbackReason | failureCategory |\n| --- | --- | --- | --- | --- | --- |\n";
  }
  return `| Agent | route | selectedEndpoint | traceId | fallbackReason | failureCategory |
| --- | --- | --- | --- | --- | --- |
${entries
  .map(
    ([agent, value]) =>
      `| ${agent} | \`${value.route ?? "—"}\` | \`${value.selectedEndpoint ?? "—"}\` | \`${value.traceId ?? "—"}\` | \`${value.fallbackReason ?? "—"}\` | \`${value.failureCategory ?? "—"}\` |`,
  )
  .join("\n")}`;
};

const renderErrors = (errors) => {
  if (!errors?.length) {
    return "- 无";
  }
  return errors.map((error) => `- ${error}`).join("\n");
};

export function renderOpenClawRuntimeStabilityMarkdown(report) {
  const summary = report.summary ?? buildOpenClawRuntimeStabilitySummary(report);
  return `# OpenClaw Runtime M5 P0 短时稳定性观察

- generatedAt: \`${report.generatedAt ?? "—"}\`
- startedAt: \`${report.startedAt ?? "—"}\`
- completedAt: \`${report.completedAt ?? "—"}\`
- durationMs: \`${summary.durationMs ?? report.durationMs ?? "—"}\`
- apiBaseUrl: \`${report.apiBaseUrl ?? "—"}\`
- openClawBaseUrl: \`${report.openClawBaseUrl ?? "—"}\`
- roundsPlanned: \`${summary.roundsPlanned}\`
- roundsCompleted: \`${summary.roundsCompleted}\`
- intervalMs: \`${report.intervalMs ?? "—"}\`
- passed: \`${summary.passed}\`

## Summary

- clusterRouteCount: \`${summary.clusterRouteCount}\`
- providerFallbackCount: \`${summary.providerFallbackCount}\`
- failedCount: \`${summary.failedCount}\`
- nonClusterCount: \`${summary.nonClusterCount}\`
- requiredSelectedEndpoint: \`${REQUIRED_OPENCLAW_STABILITY_ENDPOINT}\`

## Route Counts

${renderCounts(summary.routeCounts)}

## Failure Category Counts

${renderCounts(summary.failureCategoryCounts)}

## Latest By Agent

${renderLatestByAgent(summary.latestByAgent)}

## Error Samples

${renderErrors(summary.errorSamples)}
`;
}
