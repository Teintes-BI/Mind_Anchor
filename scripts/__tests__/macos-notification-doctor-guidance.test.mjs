import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOpenClawRegistryNotificationDoctorGuidance,
  buildOpenClawRegistryNotificationRecoveryInstructions,
  deriveOpenClawRegistryNotificationRecoveryAction,
} from "../lib/macos-openclaw-registry-notification-prep.mjs";

test("doctor guidance recommends install flow when SecurityAgent blocks and profile is missing", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationDoctorGuidance({
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
      notificationProfileStatus: {
        profileInstalled: false,
        bundleConfigured: false,
        fullyInstalled: false,
      },
      notificationDebugState: "request_in_flight",
      hasSecurityAgentWindow: true,
    }),
    [
      "首次通知授权仍卡在 SecurityAgent 系统弹窗。",
      "建议优先执行：corepack pnpm recover:macos:openclaw-registry-notifications <notification-debug.log>",
      "建议直接执行：corepack pnpm install:macos:openclaw-registry-notifications",
      "安装完成后执行：corepack pnpm verify:macos:openclaw-registry-notifications",
      "目标 bundle: com.mindanchor.mac.openclaw.registry.e2e",
    ],
  );
});

test("doctor guidance surfaces denied state before asking for another E2E run", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationDoctorGuidance({
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
      notificationProfileStatus: {
        profileInstalled: true,
        bundleConfigured: true,
        fullyInstalled: true,
      },
      notificationDebugState: "denied",
      hasSecurityAgentWindow: false,
    }),
    [
      "当前稳定 E2E bundle 的通知权限已经进入 denied。",
      "建议先执行：corepack pnpm repair:macos:openclaw-registry-notifications",
      "确认后再执行：corepack pnpm test:macos:openclaw-registry-e2e",
      "目标 bundle: com.mindanchor.mac.openclaw.registry.e2e",
    ],
  );
});

test("doctor guidance still recommends install when profile is incomplete without SecurityAgent evidence", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationDoctorGuidance({
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
      notificationProfileStatus: {
        profileInstalled: true,
        bundleConfigured: false,
        fullyInstalled: false,
      },
      notificationDebugState: "unknown",
      hasSecurityAgentWindow: false,
    }),
    [
      "当前通知准备链还没有完全安装到位。",
      "建议执行：corepack pnpm install:macos:openclaw-registry-notifications",
      "安装完成后执行：corepack pnpm verify:macos:openclaw-registry-notifications",
      "目标 bundle: com.mindanchor.mac.openclaw.registry.e2e",
    ],
  );
});

test("doctor guidance includes bundle-specific commands for non-default bundle ids", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationDoctorGuidance({
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.temp",
      notificationProfileStatus: {
        profileInstalled: false,
        bundleConfigured: false,
        fullyInstalled: false,
      },
      notificationDebugState: "request_in_flight",
      hasSecurityAgentWindow: true,
    }),
    [
      "首次通知授权仍卡在 SecurityAgent 系统弹窗。",
      "建议优先执行：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm recover:macos:openclaw-registry-notifications <notification-debug.log>",
      "建议直接执行：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm install:macos:openclaw-registry-notifications",
      "安装完成后执行：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm verify:macos:openclaw-registry-notifications",
      "目标 bundle: com.mindanchor.mac.openclaw.registry.e2e.temp",
    ],
  );
});

test("deriveOpenClawRegistryNotificationRecoveryAction chooses open_settings for denied state", () => {
  assert.equal(
    deriveOpenClawRegistryNotificationRecoveryAction({
      notificationProfileStatus: {
        profileInstalled: true,
        bundleConfigured: true,
        fullyInstalled: true,
      },
      notificationDebugState: "denied",
      hasSecurityAgentWindow: false,
    }),
    "open_settings",
  );
});

test("deriveOpenClawRegistryNotificationRecoveryAction chooses install_profile when profile is incomplete", () => {
  assert.equal(
    deriveOpenClawRegistryNotificationRecoveryAction({
      notificationProfileStatus: {
        profileInstalled: false,
        bundleConfigured: false,
        fullyInstalled: false,
      },
      notificationDebugState: "unknown",
      hasSecurityAgentWindow: false,
    }),
    "install_profile",
  );
});

test("buildOpenClawRegistryNotificationRecoveryInstructions explains the settings recovery path", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationRecoveryInstructions({
      recoveryAction: "open_settings",
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
    }),
    [
      "已为你打开 macOS 通知设置，请把目标应用改回允许通知。",
      "完成后建议先执行：corepack pnpm doctor:macos:openclaw-registry-notifications",
      "确认恢复后再执行：corepack pnpm test:macos:openclaw-registry-e2e",
      "目标 bundle: com.mindanchor.mac.openclaw.registry.e2e",
    ],
  );
});

test("buildOpenClawRegistryNotificationRecoveryInstructions explains the profile install path", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationRecoveryInstructions({
      recoveryAction: "install_profile",
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
    }),
    [
      "已开始通知准备链恢复流程。",
      "请在系统设置里完成 profile 安装。",
      "安装后执行：corepack pnpm verify:macos:openclaw-registry-notifications",
      "确认恢复后再执行：corepack pnpm test:macos:openclaw-registry-e2e",
      "目标 bundle: com.mindanchor.mac.openclaw.registry.e2e",
    ],
  );
});

test("buildOpenClawRegistryNotificationRecoveryInstructions explains incomplete install without stack-oriented wording", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationRecoveryInstructions({
      recoveryAction: "install_profile",
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
      actionCompleted: false,
    }),
    [
      "通知准备链恢复动作已经触发，但目前还没有完成。",
      "这通常说明 profile 还需要你在系统设置里完成最后一步安装。",
      "完成后执行：corepack pnpm verify:macos:openclaw-registry-notifications",
      "确认恢复后再执行：corepack pnpm test:macos:openclaw-registry-e2e",
      "目标 bundle: com.mindanchor.mac.openclaw.registry.e2e",
    ],
  );
});
