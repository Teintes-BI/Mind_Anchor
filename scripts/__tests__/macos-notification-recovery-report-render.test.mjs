import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultOpenClawRegistryNotificationRecoveryHtmlReportPath,
  renderOpenClawRegistryNotificationRecoveryHtml,
} from "../lib/macos-notification-recovery-report-render.mjs";

test("defaultOpenClawRegistryNotificationRecoveryHtmlReportPath resolves under tmp", () => {
  assert.equal(
    defaultOpenClawRegistryNotificationRecoveryHtmlReportPath("/repo"),
    "/repo/tmp/mindanchor-openclaw-registry-notification-recovery-report.html",
  );
});

test("renderOpenClawRegistryNotificationRecoveryHtml renders key recovery fields", () => {
  const html = renderOpenClawRegistryNotificationRecoveryHtml({
    bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.temp",
    recoveryAction: "install_profile",
    result: "waiting_for_profile_install",
    startedAt: "2026-03-29T00:00:00.000Z",
    completedAt: "2026-03-29T00:03:00.000Z",
    debugLogPath: "/tmp/notification-debug.log",
    reportPath: "/tmp/recovery-report.json",
    repairExitCode: 0,
    plan: {
      waitStrategy: "verify_profile_then_rerun",
      shouldRunDoctorFirst: false,
      shouldRunVerifyFirst: true,
      shouldRunRegistryE2E: true,
    },
    verifyAttempts: [
      {
        at: "2026-03-29T00:01:00.000Z",
        exitCode: 1,
        stdout: "bundleIdentifier=com.mindanchor.mac.openclaw.registry.e2e.temp",
        stderr: "not fully installed",
      },
    ],
    doctorAttempts: [],
    registryE2EAttempts: [],
    settingsProbe: null,
  });

  assert.match(html, /MindAnchor macOS 通知恢复报告/);
  assert.match(html, /com\.mindanchor\.mac\.openclaw\.registry\.e2e\.temp/);
  assert.match(html, /waiting_for_profile_install/);
  assert.match(html, /install_profile/);
  assert.match(html, /verify_profile_then_rerun/);
  assert.match(html, /notification-debug\.log/);
  assert.match(html, /not fully installed/);
  assert.match(html, /<html/);
});
