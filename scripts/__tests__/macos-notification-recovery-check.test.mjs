import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOpenClawRegistryNotificationChildProcessEnv,
  deriveOpenClawRegistryNotificationRecoveryHtmlReportPath,
  buildOpenClawRegistryNotificationRecoveryResultGuidance,
  buildOpenClawRegistryNotificationRecoveryCheckInstructions,
  defaultOpenClawRegistryNotificationRecoveryReportPath,
  deriveOpenClawRegistryNotificationRecoveryResult,
  deriveOpenClawRegistryNotificationRecoveryCheckPlan,
} from "../lib/macos-openclaw-registry-notification-recovery-check.mjs";

test("deriveOpenClawRegistryNotificationRecoveryCheckPlan uses delayed rerun for open_settings recovery", () => {
  assert.deepEqual(
    deriveOpenClawRegistryNotificationRecoveryCheckPlan("open_settings"),
    {
      waitStrategy: "doctor_then_rerun",
      shouldUseDebugLogForDoctorPolling: false,
      shouldRunDoctorFirst: true,
      shouldRunVerifyFirst: false,
      shouldRunRegistryE2E: true,
    },
  );
});

test("deriveOpenClawRegistryNotificationRecoveryCheckPlan uses verify-first rerun for install_profile recovery", () => {
  assert.deepEqual(
    deriveOpenClawRegistryNotificationRecoveryCheckPlan("install_profile"),
    {
      waitStrategy: "verify_profile_then_rerun",
      shouldUseDebugLogForDoctorPolling: false,
      shouldRunDoctorFirst: false,
      shouldRunVerifyFirst: true,
      shouldRunRegistryE2E: true,
    },
  );
});

test("deriveOpenClawRegistryNotificationRecoveryCheckPlan stays idle when no recovery action is needed", () => {
  assert.deepEqual(
    deriveOpenClawRegistryNotificationRecoveryCheckPlan("none"),
    {
      waitStrategy: "none",
      shouldUseDebugLogForDoctorPolling: false,
      shouldRunDoctorFirst: false,
      shouldRunVerifyFirst: false,
      shouldRunRegistryE2E: false,
    },
  );
});

test("buildOpenClawRegistryNotificationRecoveryCheckInstructions explains delayed rerun path", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationRecoveryCheckInstructions({
      recoveryAction: "open_settings",
      timeoutSeconds: 180,
    }),
    [
      "已触发通知权限恢复动作，接下来会等待你的系统设置操作完成。",
      "等待上限：180 秒。",
      "等待期间会先轮询 doctor 状态，确认不再是 denied 后再重跑 OpenClaw Registry E2E。",
    ],
  );
});

test("buildOpenClawRegistryNotificationRecoveryCheckInstructions explains verify-first path", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationRecoveryCheckInstructions({
      recoveryAction: "install_profile",
      timeoutSeconds: 240,
    }),
    [
      "已触发通知准备链恢复动作，接下来会等待 profile 安装完成。",
      "等待上限：240 秒。",
      "检测到 verify 成功后，会继续自动重跑 OpenClaw Registry E2E。",
    ],
  );
});

test("defaultOpenClawRegistryNotificationRecoveryReportPath resolves under tmp", () => {
  assert.equal(
    defaultOpenClawRegistryNotificationRecoveryReportPath("/repo"),
    "/repo/tmp/mindanchor-openclaw-registry-notification-recovery-report.json",
  );
});

test("deriveOpenClawRegistryNotificationRecoveryResult marks manual host as waiting_for_manual_step", () => {
  assert.equal(
    deriveOpenClawRegistryNotificationRecoveryResult({
      registryPassed: false,
      verifyPassed: false,
      timedOut: true,
      recoveryAction: "open_settings",
      settingsAutomationBoundary: "manual_recommended",
    }),
    "waiting_for_manual_step",
  );
});

test("deriveOpenClawRegistryNotificationRecoveryResult marks install path as waiting_for_profile_install", () => {
  assert.equal(
    deriveOpenClawRegistryNotificationRecoveryResult({
      registryPassed: false,
      verifyPassed: false,
      timedOut: true,
      recoveryAction: "install_profile",
      settingsAutomationBoundary: "unknown",
    }),
    "waiting_for_profile_install",
  );
});

test("deriveOpenClawRegistryNotificationRecoveryResult marks success when registry rerun passes", () => {
  assert.equal(
    deriveOpenClawRegistryNotificationRecoveryResult({
      registryPassed: true,
      verifyPassed: true,
      timedOut: false,
      recoveryAction: "open_settings",
      settingsAutomationBoundary: "manual_recommended",
    }),
    "passed",
  );
});

test("buildOpenClawRegistryNotificationRecoveryResultGuidance explains manual step result", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationRecoveryResultGuidance("waiting_for_manual_step"),
    [
      "当前恢复流程已经跑完，但系统权限最后一步仍在等待用户手动完成。",
      "这在 `manual_recommended` host 上属于预期内结果，不应再误判成脚本故障。",
    ],
  );
});

test("buildOpenClawRegistryNotificationChildProcessEnv keeps default bundle environment unchanged", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationChildProcessEnv(
      "com.mindanchor.mac.openclaw.registry.e2e",
      { FOO: "bar" },
    ),
    { FOO: "bar" },
  );
});

test("buildOpenClawRegistryNotificationChildProcessEnv injects custom bundle override for child processes", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationChildProcessEnv(
      "com.mindanchor.mac.openclaw.registry.e2e.temp",
      { FOO: "bar" },
    ),
    {
      FOO: "bar",
      MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID: "com.mindanchor.mac.openclaw.registry.e2e.temp",
    },
  );
});

test("deriveOpenClawRegistryNotificationRecoveryHtmlReportPath swaps json report to html report", () => {
  assert.equal(
    deriveOpenClawRegistryNotificationRecoveryHtmlReportPath(
      "/repo/tmp/mindanchor-openclaw-registry-notification-recovery-report.json",
    ),
    "/repo/tmp/mindanchor-openclaw-registry-notification-recovery-report.html",
  );
});
