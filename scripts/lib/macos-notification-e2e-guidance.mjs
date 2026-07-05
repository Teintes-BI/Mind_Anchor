import { buildOpenClawRegistryNotificationDoctorGuidance, formatOpenClawRegistryNotificationCommand } from "./macos-openclaw-registry-notification-prep.mjs";

export function buildMacOSNotificationE2EGuidance({
  bundleIdentifier,
  title,
  message,
  debugLogPath,
  recoveryReportPath,
  recoveryHtmlReportPath,
  clickDiagnosticsReportPath,
  clickDiagnosticsHtmlPath,
  hasSecurityAgentWindow,
  notificationProfileStatus,
  notificationDebugState,
}) {
  if (
    notificationDebugState === "allowed" &&
    debugLogPath &&
    recoveryReportPath &&
    recoveryHtmlReportPath &&
    clickDiagnosticsReportPath &&
    clickDiagnosticsHtmlPath
  ) {
    const clickDiagnosticsCommand = formatOpenClawRegistryNotificationCommand(
      bundleIdentifier,
      `corepack pnpm diagnose:macos:notification-center-click ${title} ${message} ${debugLogPath} ${clickDiagnosticsReportPath} ${clickDiagnosticsHtmlPath}`,
    );
    const recoverCommand = formatOpenClawRegistryNotificationCommand(
      bundleIdentifier,
      `corepack pnpm recover:macos:openclaw-registry-notifications ${debugLogPath} ${recoveryReportPath}`,
    );
    return [
      "通知权限已经就绪，当前剩余问题集中在 Notification Center 展示 / 点击自动化边界。",
      `建议点击诊断：${clickDiagnosticsCommand}`,
      `点击诊断 JSON：${clickDiagnosticsReportPath}`,
      `点击诊断 HTML：${clickDiagnosticsHtmlPath}`,
      `建议优先执行：${recoverCommand}`,
      `预期恢复报告：${recoveryReportPath}`,
      `预期恢复 HTML：${recoveryHtmlReportPath}`,
      `目标 bundle: ${bundleIdentifier}`,
    ];
  }

  const lines = buildOpenClawRegistryNotificationDoctorGuidance({
    bundleIdentifier,
    notificationProfileStatus,
    notificationDebugState,
    hasSecurityAgentWindow,
  });

  if (hasSecurityAgentWindow && debugLogPath && recoveryReportPath && recoveryHtmlReportPath) {
    const recoverCommand = formatOpenClawRegistryNotificationCommand(
      bundleIdentifier,
      `corepack pnpm recover:macos:openclaw-registry-notifications ${debugLogPath} ${recoveryReportPath}`,
    );
    return [
      ...lines.slice(0, 2),
      `建议 recover 实参：${recoverCommand}`,
      `预期恢复报告：${recoveryReportPath}`,
      `预期恢复 HTML：${recoveryHtmlReportPath}`,
      ...lines.slice(2),
    ];
  }

  return lines;
}
