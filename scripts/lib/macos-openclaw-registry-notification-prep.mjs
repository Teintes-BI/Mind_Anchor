import path from "node:path";
import { openClawRegistryE2EBundleIdentifier } from "./macos-e2e-bundle-ids.mjs";

export const openClawRegistryNotificationProfileIdentifier =
  "com.mindanchor.e2e.notifications.profile";
export const openClawRegistryNotificationPayloadIdentifier =
  "com.mindanchor.e2e.notifications.payload";
export const openClawRegistryNotificationProfileDisplayName =
  "MindAnchor OpenClaw Registry E2E Notifications";

export function defaultOpenClawRegistryNotificationProfilePath(cwd = process.cwd()) {
  return path.resolve(cwd, "tmp", "mindanchor-openclaw-registry-e2e-notifications.mobileconfig");
}

function deepSearch(value, predicate) {
  if (predicate(value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => deepSearch(item, predicate));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => deepSearch(item, predicate));
  }

  return false;
}

export function configurationProfilesContainIdentifier(payload, identifier) {
  return deepSearch(payload, (value) => value === identifier);
}

export function configurationProfilesContainBundleIdentifier(payload, bundleIdentifier) {
  return deepSearch(payload, (value) => value === bundleIdentifier);
}

export function deriveOpenClawRegistryNotificationProfileStatus(payload, bundleIdentifier) {
  const profileInstalled = configurationProfilesContainIdentifier(
    payload,
    openClawRegistryNotificationProfileIdentifier,
  );
  const bundleConfigured = configurationProfilesContainBundleIdentifier(
    payload,
    bundleIdentifier,
  );

  return {
    profileInstalled,
    bundleConfigured,
    fullyInstalled: profileInstalled && bundleConfigured,
  };
}

export function formatOpenClawRegistryNotificationProfileStatus(status) {
  return `notificationProfile profileInstalled=${status.profileInstalled} bundleConfigured=${status.bundleConfigured} fullyInstalled=${status.fullyInstalled}`;
}

export function isOpenClawRegistryNotificationProfileFullyInstalled(status) {
  return Boolean(status?.fullyInstalled);
}

export function buildOpenClawRegistryNotificationInstallFlowInstructions({
  profilePath,
  timeoutSeconds,
  bundleIdentifier,
}) {
  const verifyCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm verify:macos:openclaw-registry-notifications",
  );
  return [
    "已打开通知设置 profile，正在等待系统安装完成。",
    `如果 ${timeoutSeconds} 秒内仍未生效，请在系统设置中手动完成安装：${profilePath}`,
    `安装完成后可再次执行：${verifyCommand}`,
  ];
}

export function buildOpenClawRegistryNotificationPrepInstructions({
  profilePath,
  alreadyInstalled,
  bundleIdentifier,
}) {
  const verifyCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm verify:macos:openclaw-registry-notifications",
  );
  const removeCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm remove:macos:openclaw-registry-notifications",
  );
  if (alreadyInstalled) {
    return [
      "通知设置 profile 已生成，而且系统里已经检测到同标识 profile。",
      `如需重新安装，可重新打开：open ${profilePath}`,
      `当前可直接继续验证：${verifyCommand}`,
      `如需回滚可执行：${removeCommand}`,
    ];
  }

  return [
    "已生成通知设置 profile。",
    `打开它并在系统设置中完成安装：open ${profilePath}`,
    `安装后可执行验证：${verifyCommand}`,
    `如需回滚可执行：${removeCommand}`,
  ];
}

export function buildOpenClawRegistryNotificationDoctorGuidance({
  bundleIdentifier,
  notificationProfileStatus,
  notificationDebugState,
  hasSecurityAgentWindow,
}) {
  const installCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm install:macos:openclaw-registry-notifications",
  );
  const recoverCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm recover:macos:openclaw-registry-notifications <notification-debug.log>",
  );
  const verifyCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm verify:macos:openclaw-registry-notifications",
  );
  const repairCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm repair:macos:openclaw-registry-notifications",
  );
  const e2eCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm test:macos:openclaw-registry-e2e",
  );
  const recoveryAction = deriveOpenClawRegistryNotificationRecoveryAction({
    notificationProfileStatus,
    notificationDebugState,
    hasSecurityAgentWindow,
  });

  if (recoveryAction === "open_settings") {
    return [
      "当前稳定 E2E bundle 的通知权限已经进入 denied。",
      `建议先执行：${repairCommand}`,
      `确认后再执行：${e2eCommand}`,
      `目标 bundle: ${bundleIdentifier}`,
    ];
  }

  if (recoveryAction === "install_profile" && hasSecurityAgentWindow) {
    return [
      "首次通知授权仍卡在 SecurityAgent 系统弹窗。",
      `建议优先执行：${recoverCommand}`,
      `建议直接执行：${installCommand}`,
      `安装完成后执行：${verifyCommand}`,
      `目标 bundle: ${bundleIdentifier}`,
    ];
  }

  if (recoveryAction === "install_profile") {
    return [
      "当前通知准备链还没有完全安装到位。",
      `建议执行：${installCommand}`,
      `安装完成后执行：${verifyCommand}`,
      `目标 bundle: ${bundleIdentifier}`,
    ];
  }

  return [];
}

export function deriveOpenClawRegistryNotificationRecoveryAction({
  notificationProfileStatus,
  notificationDebugState,
  hasSecurityAgentWindow,
}) {
  if (notificationDebugState === "denied") {
    return "open_settings";
  }

  if (hasSecurityAgentWindow || !notificationProfileStatus?.fullyInstalled) {
    return "install_profile";
  }

  return "none";
}

export function buildOpenClawRegistryNotificationRecoveryInstructions({
  recoveryAction,
  bundleIdentifier,
  actionCompleted = true,
}) {
  const doctorCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm doctor:macos:openclaw-registry-notifications",
  );
  const verifyCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm verify:macos:openclaw-registry-notifications",
  );
  const e2eCommand = formatOpenClawRegistryNotificationCommand(
    bundleIdentifier,
    "corepack pnpm test:macos:openclaw-registry-e2e",
  );
  if (recoveryAction === "open_settings") {
    return [
      "已为你打开 macOS 通知设置，请把目标应用改回允许通知。",
      `完成后建议先执行：${doctorCommand}`,
      `确认恢复后再执行：${e2eCommand}`,
      `目标 bundle: ${bundleIdentifier}`,
    ];
  }

  if (recoveryAction === "install_profile") {
    if (!actionCompleted) {
      return [
        "通知准备链恢复动作已经触发，但目前还没有完成。",
        "这通常说明 profile 还需要你在系统设置里完成最后一步安装。",
        `完成后执行：${verifyCommand}`,
        `确认恢复后再执行：${e2eCommand}`,
        `目标 bundle: ${bundleIdentifier}`,
      ];
    }

    return [
      "已开始通知准备链恢复流程。",
      "请在系统设置里完成 profile 安装。",
      `安装后执行：${verifyCommand}`,
      `确认恢复后再执行：${e2eCommand}`,
      `目标 bundle: ${bundleIdentifier}`,
    ];
  }

  return [];
}

export function formatOpenClawRegistryNotificationCommand(bundleIdentifier, command) {
  if (!bundleIdentifier || bundleIdentifier === openClawRegistryE2EBundleIdentifier) {
    return command;
  }
  return `MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=${bundleIdentifier} ${command}`;
}
