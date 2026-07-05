import path from "node:path";

export const OPENCHRONICLE_DEFAULT_MCP_URL = "http://127.0.0.1:8742/mcp";

export const OPENCHRONICLE_REQUIRED_TOOLS = [
  "current_context",
  "recent_activity",
  "list_memories",
];

export function defaultOpenChronicleSidecarValidationJsonPath(cwd, stamp) {
  return path.resolve(cwd, "test-results", `openchronicle-sidecar-validation-${stamp}.json`);
}

export function defaultOpenChronicleSidecarValidationMarkdownPath(cwd, stamp) {
  return path.resolve(cwd, "test-results", `openchronicle-sidecar-validation-${stamp}.md`);
}

const ok = (value) => value === true;

export function buildOpenChronicleSidecarValidationSummary(report = {}) {
  const tools = Array.isArray(report.tools) ? report.tools : [];
  const toolNames = tools.map((tool) => tool.name).filter(Boolean);
  const calls = Array.isArray(report.toolCalls) ? report.toolCalls : [];
  const requiredToolsPresent = OPENCHRONICLE_REQUIRED_TOOLS.every((name) => toolNames.includes(name));
  const failedCalls = calls.filter((call) => call.ok === false);
  const successfulCalls = calls.filter((call) => call.ok === true);
  const errors = [
    ...(Array.isArray(report.errors) ? report.errors.map(String) : []),
    ...failedCalls.map((call) => `${call.name}: ${call.error ?? "tool call failed"}`),
    ...(requiredToolsPresent ? [] : [`missing required tools: ${OPENCHRONICLE_REQUIRED_TOOLS.filter((name) => !toolNames.includes(name)).join(", ")}`]),
  ].filter(Boolean);

  const passed =
    ok(report.preflight?.mcpReachable) &&
    ok(report.preflight?.initialized) &&
    requiredToolsPresent &&
    successfulCalls.length >= OPENCHRONICLE_REQUIRED_TOOLS.length &&
    failedCalls.length === 0 &&
    errors.length === 0;

  return {
    passed,
    mcpUrl: report.mcpUrl ?? OPENCHRONICLE_DEFAULT_MCP_URL,
    requiredToolsPresent,
    toolCount: tools.length,
    requiredToolCount: OPENCHRONICLE_REQUIRED_TOOLS.length,
    successfulCallCount: successfulCalls.length,
    failedCallCount: failedCalls.length,
    durationMs: report.durationMs ?? null,
    errorSamples: errors.slice(0, 10),
  };
}

const renderTools = (tools = []) => {
  if (!tools.length) {
    return "- 无";
  }
  return tools.map((tool) => `- ${tool.name}: ${tool.description ?? "—"}`).join("\n");
};

const renderToolCalls = (calls = []) => {
  if (!calls.length) {
    return "| tool | ok | summary |\n| --- | --- | --- |";
  }
  return `| tool | ok | summary |
| --- | --- | --- |
${calls
  .map((call) => `| ${call.name ?? "unknown"} | \`${call.ok === true}\` | ${call.summary ?? call.error ?? "—"} |`)
  .join("\n")}`;
};

const renderErrors = (errors = []) => {
  if (!errors.length) {
    return "- 无";
  }
  return errors.map((error) => `- ${error}`).join("\n");
};

export function renderOpenChronicleSidecarValidationMarkdown(report = {}) {
  const summary = report.summary ?? buildOpenChronicleSidecarValidationSummary(report);
  return `# OpenChronicle Sidecar Validation

- generatedAt: \`${report.generatedAt ?? "—"}\`
- startedAt: \`${report.startedAt ?? "—"}\`
- completedAt: \`${report.completedAt ?? "—"}\`
- durationMs: \`${summary.durationMs ?? "—"}\`
- mcpUrl: \`${summary.mcpUrl}\`
- passed: \`${summary.passed}\`

## Summary

- requiredToolsPresent: \`${summary.requiredToolsPresent}\`
- toolCount: \`${summary.toolCount}\`
- requiredToolCount: \`${summary.requiredToolCount}\`
- successfulCallCount: \`${summary.successfulCallCount}\`
- failedCallCount: \`${summary.failedCallCount}\`

## Tools

${renderTools(report.tools)}

## Tool Calls

${renderToolCalls(report.toolCalls)}

## Feasibility Conclusion

- 与 MindAnchor 桌面端旁路集成可行性: \`${summary.passed ? "可进入 adapter 原型" : "暂不满足"}\`
- 判断边界：本报告只验证 OpenChronicle MCP sidecar 的本机可达性、工具存在性和基础查询能力；不代表长期采集质量已经合格。

## Error Samples

${renderErrors(summary.errorSamples)}
`;
}
