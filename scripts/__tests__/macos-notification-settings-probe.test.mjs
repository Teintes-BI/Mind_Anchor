import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMacOSNotificationSettingsProbeGuidance,
  deriveMacOSNotificationSettingsAutomationBoundary,
  summarizeMacOSNotificationSettingsProbe,
} from "../lib/macos-notification-settings-probe.mjs";

test("summarizeMacOSNotificationSettingsProbe marks self-referential app window shape as unsupported", () => {
  assert.deepEqual(
    summarizeMacOSNotificationSettingsProbe({
      appFound: true,
      windowCount: 1,
      firstWindowRole: "AXApplication",
      firstWindowTitle: "系统设置",
      childRoles: ["AXApplication", "AXMenuBar"],
      matchedTexts: ["AXMenuItem | 通知 |  | ", "AXMenuItem | MindAnchorMac |  | "],
    }),
    {
      appFound: true,
      unsupportedWindowShape: true,
      textHitsFound: true,
      likelyAutomatable: false,
    },
  );
});

test("summarizeMacOSNotificationSettingsProbe marks a normal window tree as likely automatable", () => {
  assert.deepEqual(
    summarizeMacOSNotificationSettingsProbe({
      appFound: true,
      windowCount: 1,
      firstWindowRole: "AXWindow",
      firstWindowTitle: "通知",
      childRoles: ["AXGroup", "AXScrollArea"],
      matchedTexts: ["AXStaticText | MindAnchorMac |  | "],
    }),
    {
      appFound: true,
      unsupportedWindowShape: false,
      textHitsFound: true,
      likelyAutomatable: true,
    },
  );
});

test("buildMacOSNotificationSettingsProbeGuidance explains unsupported host shape", () => {
  assert.deepEqual(
    buildMacOSNotificationSettingsProbeGuidance({
      appFound: true,
      unsupportedWindowShape: true,
      textHitsFound: true,
      likelyAutomatable: false,
    }),
    [
      "当前主机上的 System Settings 通知页已经能命中目标文本，但 AX 窗口结构异常。",
      "这说明通知设置页不是完全不可见，而是当前宿主把窗口树暴露成了自引用形态。",
      "这类主机上应优先继续走 open/repair/recover 的半自动恢复链，而不要假设可以直接点到开关。",
    ],
  );
});

test("buildMacOSNotificationSettingsProbeGuidance explains healthy automatable host shape", () => {
  assert.deepEqual(
    buildMacOSNotificationSettingsProbeGuidance({
      appFound: true,
      unsupportedWindowShape: false,
      textHitsFound: true,
      likelyAutomatable: true,
    }),
    [
      "当前主机上的 System Settings 通知页已经暴露出正常窗口树。",
      "可以继续尝试做目标应用行和开关的自动定位。",
    ],
  );
});

test("deriveMacOSNotificationSettingsAutomationBoundary marks unsupported host as manual_recommended", () => {
  assert.equal(
    deriveMacOSNotificationSettingsAutomationBoundary({
      appFound: true,
      unsupportedWindowShape: true,
      textHitsFound: true,
      likelyAutomatable: false,
    }),
    "manual_recommended",
  );
});

test("deriveMacOSNotificationSettingsAutomationBoundary marks healthy host as automation_candidate", () => {
  assert.equal(
    deriveMacOSNotificationSettingsAutomationBoundary({
      appFound: true,
      unsupportedWindowShape: false,
      textHitsFound: true,
      likelyAutomatable: true,
    }),
    "automation_candidate",
  );
});
