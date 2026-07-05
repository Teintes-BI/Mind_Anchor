import path from "node:path";

export const MACOS_MODEL_EFFECT_SCENARIO_PLAN = [
  {
    id: "next-action",
    title: "明确下一步",
    prompt: "我现在有点散，请只给我一个可以立刻开始的下一步，并说明为什么是它。",
    feedbackLabel: "helpful",
    feedbackReason: "答案需要短、明确、可执行。",
  },
  {
    id: "interruption-recovery",
    title: "中断恢复",
    prompt: "我刚刚被打断了十分钟，现在想回到工作状态。请帮我恢复节奏。",
    feedbackLabel: "helpful",
    feedbackReason: "答案需要帮助我恢复上下文并降低启动成本。",
  },
  {
    id: "over-notification",
    title: "减少打扰",
    prompt: "如果你准备提醒我，请先判断这条提醒是不是现在真的必要。",
    feedbackLabel: "helpful",
    feedbackReason: "答案需要体现少打扰和必要性判断。",
  },
];

export function defaultMacosModelEffectObservationJsonPath(cwd, stamp) {
  return path.resolve(cwd, "test-results", `macos-model-effect-observation-${stamp}.json`);
}

export function defaultMacosModelEffectObservationMarkdownPath(cwd, stamp) {
  return path.resolve(cwd, "test-results", `macos-model-effect-observation-${stamp}.md`);
}

const bool = (value) => value === true;

export function buildMacosModelEffectObservationSummary(report = {}) {
  const turns = Array.isArray(report.turns) ? report.turns : [];
  const failedTurns = turns.filter((turn) => bool(turn.passed) === false);
  const completedTurnCount = turns.filter((turn) => turn.assistantStatus === "completed").length;
  const openClawTrailCount = turns.filter((turn) => bool(turn.executionTrailIncludesOpenClaw)).length;
  const feedbackPersistedCount = turns.filter((turn) => bool(turn.feedbackPersisted)).length;
  const fastResponseCount = turns.filter((turn) => Number(turn.fastResponseLength ?? 0) > 0).length;
  const fullResponseCount = turns.filter((turn) => Number(turn.fullResponseLength ?? 0) > 0).length;
  const openChronicleMemoryTurnCount = turns.filter((turn) => turn.memoryVariant === "openchronicle").length;
  const baselineTurnCount = turns.filter((turn) => turn.memoryVariant === "baseline" || !turn.memoryVariant).length;
  const memoryReadSuccessCount = turns.filter((turn) => turn.desktopMemory?.summary?.readSucceeded === true).length;
  const memoryReadFailedCount = turns.filter(
    (turn) => turn.memoryVariant === "openchronicle" && turn.desktopMemory?.summary?.readSucceeded !== true,
  ).length;
  const averageFullResponseLength =
    turns.length === 0
      ? 0
      : Math.round(turns.reduce((sum, turn) => sum + Number(turn.fullResponseLength ?? 0), 0) / turns.length);
  const errors = [
    ...(Array.isArray(report.errors) ? report.errors.map(String) : []),
    ...failedTurns.flatMap((turn) => (Array.isArray(turn.errors) ? turn.errors.map((error) => `${turn.id}: ${error}`) : [])),
  ];

  const passed =
    turns.length > 0 &&
    failedTurns.length === 0 &&
    bool(report.preflight?.apiHealthy) &&
    bool(report.preflight?.macAppSignedIn) &&
    bool(report.preflight?.openClawReachable) &&
    errors.length === 0;

  return {
    passed,
    plannedTurnCount: Number(report.plannedTurnCount ?? turns.length),
    completedTurnCount,
    turnCount: turns.length,
    failedTurnCount: failedTurns.length,
    openClawTrailCount,
    feedbackPersistedCount,
    fastResponseCount,
    fullResponseCount,
    baselineTurnCount,
    openChronicleMemoryTurnCount,
    memoryReadSuccessCount,
    memoryReadFailedCount,
    averageFullResponseLength,
    durationMs: report.durationMs ?? null,
    traceIds: turns.map((turn) => turn.traceId).filter(Boolean),
    errorSamples: errors.slice(0, 10),
  };
}

const renderErrors = (errors) => {
  if (!errors?.length) {
    return "- 无";
  }
  return errors.map((error) => `- ${error}`).join("\n");
};

const renderTurns = (turns = []) => {
  if (!turns.length) {
    return "| turn | memory | status | traceId | fullLength | feedback | errors |\n| --- | --- | --- | --- | --- | --- | --- |";
  }
  return `| turn | memory | status | traceId | fullLength | feedback | errors |
| --- | --- | --- | --- | --- | --- | --- |
${turns
  .map(
    (turn) =>
      `| ${turn.id ?? "unknown"} | \`${turn.memoryVariant ?? "baseline"}:${turn.desktopMemory?.summary?.readSucceeded === true ? "read" : "—"}\` | \`${turn.assistantStatus ?? "unknown"}\` | \`${turn.traceId ?? "—"}\` | \`${turn.fullResponseLength ?? 0}\` | \`${turn.feedbackLabel ?? "—"}:${turn.feedbackPersisted === true ? "persisted" : "missing"}\` | ${Array.isArray(turn.errors) && turn.errors.length ? turn.errors.join("; ") : "—"} |`,
  )
  .join("\n")}`;
};

const renderCell = (value) =>
  String(value ?? "—")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>")
    .trim() || "—";

const renderResponseReview = (turns = []) => {
  if (!turns.length) {
    return "- 无";
  }
  return `| turn | memory | prompt | fullResponseExcerpt |
| --- | --- | --- | --- |
${turns
  .map(
    (turn) =>
      `| ${renderCell(turn.id ?? "unknown")} | \`${renderCell(turn.memoryVariant ?? "baseline")}\` | ${renderCell(turn.prompt)} | ${renderCell(turn.fullResponseExcerpt)} |`,
  )
  .join("\n")}`;
};

export function renderMacosModelEffectObservationMarkdown(report = {}) {
  const summary = report.summary ?? buildMacosModelEffectObservationSummary(report);
  return `# M7 macOS 桌面模型效果观察

- generatedAt: \`${report.generatedAt ?? "—"}\`
- startedAt: \`${report.startedAt ?? "—"}\`
- completedAt: \`${report.completedAt ?? "—"}\`
- durationMs: \`${summary.durationMs ?? "—"}\`
- apiBaseUrl: \`${report.apiBaseUrl ?? "—"}\`
- openClawBaseUrl: \`${report.openClawBaseUrl ?? "—"}\`
- accountEmail: \`${report.accountEmail ?? "—"}\`
- memoryMode: \`${report.memoryMode ?? "off"}\`
- openChronicleMcpUrl: \`${report.openChronicleMcpUrl ?? "—"}\`
- passed: \`${summary.passed}\`

## Summary

- plannedTurnCount: \`${summary.plannedTurnCount}\`
- completedTurnCount: \`${summary.completedTurnCount}\`
- failedTurnCount: \`${summary.failedTurnCount}\`
- openClawTrailCount: \`${summary.openClawTrailCount}\`
- feedbackPersistedCount: \`${summary.feedbackPersistedCount}\`
- fastResponseCount: \`${summary.fastResponseCount}\`
- fullResponseCount: \`${summary.fullResponseCount}\`
- baselineTurnCount: \`${summary.baselineTurnCount}\`
- openChronicleMemoryTurnCount: \`${summary.openChronicleMemoryTurnCount}\`
- memoryReadSuccessCount: \`${summary.memoryReadSuccessCount}\`
- memoryReadFailedCount: \`${summary.memoryReadFailedCount}\`
- averageFullResponseLength: \`${summary.averageFullResponseLength}\`

## Turns

${renderTurns(report.turns)}

## Response Review

${renderResponseReview(report.turns)}

## Conclusion

- M7 桌面模型效果观察门槛: \`${summary.passed ? "达到" : "未达到"}\`
- 说明：该观察验证桌面客户端真实链路、OpenClaw 执行轨迹、响应完成度与反馈闭环；不替代人工语义质量评审。

## Error Samples

${renderErrors(summary.errorSamples)}
`;
}
