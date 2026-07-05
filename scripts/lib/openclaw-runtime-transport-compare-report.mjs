import path from "node:path";

export function defaultOpenClawRuntimeTransportComparePath(cwd) {
  return path.resolve(cwd, "tmp", "openclaw-runtime-transport-compare.json");
}

export function defaultOpenClawRuntimeTransportCompareMarkdownPath(cwd) {
  return path.resolve(cwd, "tmp", "openclaw-runtime-transport-compare.md");
}

const readIssueCodes = (report) =>
  Array.isArray(report?.snapshot?.issues)
    ? report.snapshot.issues.map((issue) => issue?.code).filter(Boolean)
    : [];

const readView = (report) => ({
  runtimeStatus: report?.snapshot?.runtimeFiles?.status ?? null,
  loopbackOk: report?.snapshot?.runtimeHealth?.loopback?.ok ?? null,
  lanOk: report?.snapshot?.runtimeHealth?.lan?.ok ?? null,
  adapterHttpStatus: report?.snapshot?.adapter?.httpStatus ?? null,
  adapterRoute: report?.snapshot?.adapter?.lastDecision?.route ?? null,
  selectedEndpoint: report?.snapshot?.adapter?.lastDecision?.selectedEndpoint ?? null,
  fallbackCategory: report?.snapshot?.adapter?.lastFallback?.failureCategory ?? null,
  issueCodes: readIssueCodes(report),
  clusterAttemptSummary: report?.snapshot?.adapter?.clusterAttemptSummary ?? {
    totalAttempts: 0,
    uniqueEndpoints: [],
    attemptsPerEndpoint: {},
    allErrorsFetchFailed: false,
  },
});

export function compareOpenClawRuntimeTransportReports({ baselineReport, currentReport }) {
  const baseline = readView(baselineReport);
  const current = readView(currentReport);
  const driftCodes = [];

  if (baseline.runtimeStatus !== current.runtimeStatus) {
    driftCodes.push("runtime_status_changed");
  }
  if (baseline.loopbackOk !== current.loopbackOk) {
    driftCodes.push("loopback_health_changed");
  }
  if (baseline.lanOk !== current.lanOk) {
    driftCodes.push("lan_health_changed");
  }
  if (baseline.adapterHttpStatus !== current.adapterHttpStatus) {
    driftCodes.push("adapter_http_status_changed");
  }
  if (baseline.adapterRoute !== current.adapterRoute) {
    driftCodes.push("adapter_route_changed");
  }
  if (baseline.selectedEndpoint !== current.selectedEndpoint) {
    driftCodes.push("selected_endpoint_changed");
  }
  if (baseline.fallbackCategory !== current.fallbackCategory) {
    driftCodes.push("fallback_category_changed");
  }
  if (JSON.stringify(baseline.issueCodes) !== JSON.stringify(current.issueCodes)) {
    driftCodes.push("issue_codes_changed");
  }
  if (JSON.stringify(baseline.clusterAttemptSummary) !== JSON.stringify(current.clusterAttemptSummary)) {
    driftCodes.push("cluster_attempt_summary_changed");
  }

  return {
    driftCodes,
    baseline,
    current,
  };
}

const renderIssueCodes = (codes) => (codes.length > 0 ? codes.map((code) => `\`${code}\``).join(", ") : "无");

export function renderOpenClawRuntimeTransportCompareMarkdown(report) {
  const comparison = report.comparison;

  return `# OpenClaw Runtime Transport Compare Report

- generatedAt: \`${report.generatedAt}\`
- baselinePath: \`${report.baselinePath}\`
- currentPath: \`${report.currentPath}\`

## Drift Codes

${comparison.driftCodes.length > 0 ? comparison.driftCodes.map((code) => `- \`${code}\``).join("\n") : "- 无"}

## Baseline

- runtimeStatus: \`${comparison.baseline.runtimeStatus ?? "—"}\`
- loopbackOk: \`${comparison.baseline.loopbackOk}\`
- lanOk: \`${comparison.baseline.lanOk}\`
- adapterHttpStatus: \`${comparison.baseline.adapterHttpStatus ?? "—"}\`
- adapterRoute: \`${comparison.baseline.adapterRoute ?? "—"}\`
- selectedEndpoint: \`${comparison.baseline.selectedEndpoint ?? "—"}\`
- fallbackCategory: \`${comparison.baseline.fallbackCategory ?? "—"}\`
- issueCodes: ${renderIssueCodes(comparison.baseline.issueCodes)}

## Current

- runtimeStatus: \`${comparison.current.runtimeStatus ?? "—"}\`
- loopbackOk: \`${comparison.current.loopbackOk}\`
- lanOk: \`${comparison.current.lanOk}\`
- adapterHttpStatus: \`${comparison.current.adapterHttpStatus ?? "—"}\`
- adapterRoute: \`${comparison.current.adapterRoute ?? "—"}\`
- selectedEndpoint: \`${comparison.current.selectedEndpoint ?? "—"}\`
- fallbackCategory: \`${comparison.current.fallbackCategory ?? "—"}\`
- issueCodes: ${renderIssueCodes(comparison.current.issueCodes)}

## Current Cluster Attempt Summary

- totalAttempts: \`${comparison.current.clusterAttemptSummary.totalAttempts}\`
- uniqueEndpoints: ${comparison.current.clusterAttemptSummary.uniqueEndpoints.map((endpoint) => `\`${endpoint}\``).join(", ") || "无"}
- allErrorsFetchFailed: \`${comparison.current.clusterAttemptSummary.allErrorsFetchFailed}\`
`;
}
