export function summarizeMacOSNotificationSettingsProbe({
  appFound,
  windowCount,
  firstWindowRole,
  firstWindowTitle,
  childRoles = [],
  matchedTexts = [],
}) {
  const unsupportedWindowShape =
    appFound === true &&
    windowCount > 0 &&
    firstWindowRole === "AXApplication" &&
    childRoles.includes("AXApplication");

  const textHitsFound = Array.isArray(matchedTexts) && matchedTexts.length > 0;
  const likelyAutomatable =
    appFound === true &&
    windowCount > 0 &&
    firstWindowRole === "AXWindow" &&
    textHitsFound === true;

  return {
    appFound: Boolean(appFound),
    unsupportedWindowShape,
    textHitsFound,
    likelyAutomatable,
  };
}

export function deriveMacOSNotificationSettingsAutomationBoundary(summary) {
  if (summary.likelyAutomatable) {
    return "automation_candidate";
  }

  if (summary.unsupportedWindowShape || summary.textHitsFound) {
    return "manual_recommended";
  }

  return "unknown";
}

export function buildMacOSNotificationSettingsProbeGuidance(summary) {
  if (summary.likelyAutomatable) {
    return [
      "当前主机上的 System Settings 通知页已经暴露出正常窗口树。",
      "可以继续尝试做目标应用行和开关的自动定位。",
    ];
  }

  if (summary.unsupportedWindowShape && summary.textHitsFound) {
    return [
      "当前主机上的 System Settings 通知页已经能命中目标文本，但 AX 窗口结构异常。",
      "这说明通知设置页不是完全不可见，而是当前宿主把窗口树暴露成了自引用形态。",
      "这类主机上应优先继续走 open/repair/recover 的半自动恢复链，而不要假设可以直接点到开关。",
    ];
  }

  if (!summary.appFound) {
    return [
      "当前没有探测到 System Settings 进程。",
      "这说明通知设置页还没有被成功拉起，或主机没有把它暴露给当前探测进程。",
    ];
  }

  return [
    "当前主机上的 System Settings 通知页还没有暴露出足够稳定的自动化线索。",
    "建议继续使用 open/repair/recover 路径，并保留这次 probe 结果作主机差异记录。",
  ];
}
