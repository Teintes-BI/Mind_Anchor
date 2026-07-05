import path from "node:path";
import { openClawRegistryE2EBundleIdentifier } from "./macos-e2e-bundle-ids.mjs";

export function defaultOpenClawRegistryNotificationRecoveryReportPath(cwd = process.cwd()) {
  return path.resolve(cwd, "tmp", "mindanchor-openclaw-registry-notification-recovery-report.json");
}

export function deriveOpenClawRegistryNotificationRecoveryHtmlReportPath(reportPath) {
  return String(reportPath).replace(/\.json$/i, ".html");
}

export function buildOpenClawRegistryNotificationChildProcessEnv(bundleIdentifier, baseEnv = process.env) {
  if (!bundleIdentifier || bundleIdentifier === openClawRegistryE2EBundleIdentifier) {
    return { ...baseEnv };
  }

  return {
    ...baseEnv,
    MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID: bundleIdentifier,
  };
}

export function deriveOpenClawRegistryNotificationRecoveryCheckPlan(recoveryAction) {
  if (recoveryAction === "open_settings") {
    return {
      waitStrategy: "doctor_then_rerun",
      shouldUseDebugLogForDoctorPolling: false,
      shouldRunDoctorFirst: true,
      shouldRunVerifyFirst: false,
      shouldRunRegistryE2E: true,
    };
  }

  if (recoveryAction === "install_profile") {
    return {
      waitStrategy: "verify_profile_then_rerun",
      shouldUseDebugLogForDoctorPolling: false,
      shouldRunDoctorFirst: false,
      shouldRunVerifyFirst: true,
      shouldRunRegistryE2E: true,
    };
  }

  return {
    waitStrategy: "none",
    shouldUseDebugLogForDoctorPolling: false,
    shouldRunDoctorFirst: false,
    shouldRunVerifyFirst: false,
    shouldRunRegistryE2E: false,
  };
}

export function buildOpenClawRegistryNotificationRecoveryCheckInstructions({
  recoveryAction,
  timeoutSeconds,
}) {
  if (recoveryAction === "open_settings") {
    return [
      "已触发通知权限恢复动作，接下来会等待你的系统设置操作完成。",
      `等待上限：${timeoutSeconds} 秒。`,
      "等待期间会先轮询 doctor 状态，确认不再是 denied 后再重跑 OpenClaw Registry E2E。",
    ];
  }

  if (recoveryAction === "install_profile") {
    return [
      "已触发通知准备链恢复动作，接下来会等待 profile 安装完成。",
      `等待上限：${timeoutSeconds} 秒。`,
      "检测到 verify 成功后，会继续自动重跑 OpenClaw Registry E2E。",
    ];
  }

  return [
    "当前没有检测到需要恢复的通知问题。",
  ];
}

export function deriveOpenClawRegistryNotificationRecoveryResult({
  registryPassed,
  verifyPassed,
  timedOut,
  recoveryAction,
  settingsAutomationBoundary,
}) {
  if (registryPassed) {
    return "passed";
  }

  if (recoveryAction === "open_settings" && settingsAutomationBoundary === "manual_recommended") {
    return "waiting_for_manual_step";
  }

  if (recoveryAction === "install_profile" && !verifyPassed) {
    return "waiting_for_profile_install";
  }

  if (timedOut) {
    return "timed_out";
  }

  return "incomplete";
}

export function buildOpenClawRegistryNotificationRecoveryResultGuidance(result) {
  if (result === "waiting_for_manual_step") {
    return [
      "当前恢复流程已经跑完，但系统权限最后一步仍在等待用户手动完成。",
      "这在 `manual_recommended` host 上属于预期内结果，不应再误判成脚本故障。",
    ];
  }

  if (result === "waiting_for_profile_install") {
    return [
      "当前恢复流程已经跑完，但 profile 还没有安装完成。",
      "这说明下一步仍然是继续完成系统设置里的 profile 安装。",
    ];
  }

  if (result === "passed") {
    return [
      "当前恢复流程已经成功跨过通知权限门槛。",
    ];
  }

  return [];
}
