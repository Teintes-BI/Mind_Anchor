import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultMacOSNotificationCenterClickDiagnosticsHtmlPath,
  defaultMacOSNotificationCenterClickDiagnosticsReportPath,
  deriveMacOSNotificationCenterClickBoundary,
  buildMacOSNotificationCenterClickGuidance,
} from "../lib/macos-notification-center-click-diagnostics.mjs";

test("defaultMacOSNotificationCenterClickDiagnosticsReportPath resolves under tmp", () => {
  assert.equal(
    defaultMacOSNotificationCenterClickDiagnosticsReportPath("/repo"),
    "/repo/tmp/macos-notification-center-click-diagnostics.json",
  );
});

test("defaultMacOSNotificationCenterClickDiagnosticsHtmlPath resolves under tmp", () => {
  assert.equal(
    defaultMacOSNotificationCenterClickDiagnosticsHtmlPath("/repo"),
    "/repo/tmp/macos-notification-center-click-diagnostics.html",
  );
});

test("deriveMacOSNotificationCenterClickBoundary returns permission_not_ready when notifications are not allowed", () => {
  assert.equal(
    deriveMacOSNotificationCenterClickBoundary({
      notificationDebugState: "not_requested",
      clickResult: "not-found",
    }),
    "permission_not_ready",
  );
});

test("deriveMacOSNotificationCenterClickBoundary returns notification_center_click_boundary when authorized but click still fails", () => {
  assert.equal(
    deriveMacOSNotificationCenterClickBoundary({
      notificationDebugState: "allowed",
      clickResult: "not-found",
    }),
    "notification_center_click_boundary",
  );
});

test("buildMacOSNotificationCenterClickGuidance explains click boundary with report outputs", () => {
  assert.deepEqual(
    buildMacOSNotificationCenterClickGuidance({
      boundary: "notification_center_click_boundary",
      reportPath: "/tmp/click.json",
      htmlPath: "/tmp/click.html",
    }),
    [
      "通知权限已经就绪，但当前仍无法在 Notification Center 中稳定命中并点击目标通知。",
      "这说明当前主机的剩余问题集中在 Notification Center 展示 / 点击自动化边界。",
      "诊断 JSON：/tmp/click.json",
      "诊断 HTML：/tmp/click.html",
    ],
  );
});
