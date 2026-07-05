import test from "node:test";
import assert from "node:assert/strict";

import { buildMacOSNotificationE2EGuidance } from "../lib/macos-notification-e2e-guidance.mjs";

test("buildMacOSNotificationE2EGuidance suggests the notification install flow when SecurityAgent blocks first-run permission", () => {
  const lines = buildMacOSNotificationE2EGuidance({
    bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
    debugLogPath: "/tmp/notification-debug.log",
    recoveryReportPath: "/repo/tmp/recovery-report.json",
    recoveryHtmlReportPath: "/repo/tmp/recovery-report.html",
    hasSecurityAgentWindow: true,
    notificationProfileStatus: {
      profileInstalled: false,
      bundleConfigured: false,
      fullyInstalled: false,
    },
    notificationDebugState: "request_in_flight",
  });

  assert.deepEqual(lines, [
    "首次通知授权仍卡在 SecurityAgent 系统弹窗。",
    "建议优先执行：corepack pnpm recover:macos:openclaw-registry-notifications <notification-debug.log>",
    "建议 recover 实参：corepack pnpm recover:macos:openclaw-registry-notifications /tmp/notification-debug.log /repo/tmp/recovery-report.json",
    "预期恢复报告：/repo/tmp/recovery-report.json",
    "预期恢复 HTML：/repo/tmp/recovery-report.html",
    "建议直接执行：corepack pnpm install:macos:openclaw-registry-notifications",
    "安装完成后执行：corepack pnpm verify:macos:openclaw-registry-notifications",
    "目标 bundle: com.mindanchor.mac.openclaw.registry.e2e",
  ]);
});

test("buildMacOSNotificationE2EGuidance stays empty when no SecurityAgent evidence exists", () => {
  assert.deepEqual(
    buildMacOSNotificationE2EGuidance({
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
      hasSecurityAgentWindow: false,
      notificationProfileStatus: {
        profileInstalled: true,
        bundleConfigured: true,
        fullyInstalled: true,
      },
      notificationDebugState: "unknown",
    }),
    [],
  );
});

test("buildMacOSNotificationE2EGuidance explains notification center click boundary after authorization is already granted", () => {
  const lines = buildMacOSNotificationE2EGuidance({
    bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.temp",
    title: "OpenClaw Registry 不可达",
    message: "runtime unreachable",
    debugLogPath: "/tmp/notification-debug.log",
    recoveryReportPath: "/repo/tmp/recovery-report.json",
    recoveryHtmlReportPath: "/repo/tmp/recovery-report.html",
    clickDiagnosticsReportPath: "/repo/tmp/click.json",
    clickDiagnosticsHtmlPath: "/repo/tmp/click.html",
    hasSecurityAgentWindow: false,
    notificationProfileStatus: {
      profileInstalled: false,
      bundleConfigured: false,
      fullyInstalled: false,
    },
    notificationDebugState: "allowed",
  });

  assert.deepEqual(lines, [
    "通知权限已经就绪，当前剩余问题集中在 Notification Center 展示 / 点击自动化边界。",
    "建议点击诊断：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm diagnose:macos:notification-center-click OpenClaw Registry 不可达 runtime unreachable /tmp/notification-debug.log /repo/tmp/click.json /repo/tmp/click.html",
    "点击诊断 JSON：/repo/tmp/click.json",
    "点击诊断 HTML：/repo/tmp/click.html",
    "建议优先执行：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm recover:macos:openclaw-registry-notifications /tmp/notification-debug.log /repo/tmp/recovery-report.json",
    "预期恢复报告：/repo/tmp/recovery-report.json",
    "预期恢复 HTML：/repo/tmp/recovery-report.html",
    "目标 bundle: com.mindanchor.mac.openclaw.registry.e2e.temp",
  ]);
});

test("buildMacOSNotificationE2EGuidance includes custom bundle commands when using a temporary bundle", () => {
  const lines = buildMacOSNotificationE2EGuidance({
    bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.temp",
    debugLogPath: "/tmp/notification-debug.log",
    recoveryReportPath: "/repo/tmp/recovery-report.json",
    recoveryHtmlReportPath: "/repo/tmp/recovery-report.html",
    hasSecurityAgentWindow: true,
    notificationProfileStatus: {
      profileInstalled: false,
      bundleConfigured: false,
      fullyInstalled: false,
    },
    notificationDebugState: "request_in_flight",
  });

  assert.deepEqual(lines, [
    "首次通知授权仍卡在 SecurityAgent 系统弹窗。",
    "建议优先执行：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm recover:macos:openclaw-registry-notifications <notification-debug.log>",
    "建议 recover 实参：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm recover:macos:openclaw-registry-notifications /tmp/notification-debug.log /repo/tmp/recovery-report.json",
    "预期恢复报告：/repo/tmp/recovery-report.json",
    "预期恢复 HTML：/repo/tmp/recovery-report.html",
    "建议直接执行：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm install:macos:openclaw-registry-notifications",
    "安装完成后执行：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm verify:macos:openclaw-registry-notifications",
    "目标 bundle: com.mindanchor.mac.openclaw.registry.e2e.temp",
  ]);
});
