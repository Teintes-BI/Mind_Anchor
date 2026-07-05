import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOpenClawRegistryNotificationInstallFlowInstructions,
  isOpenClawRegistryNotificationProfileFullyInstalled,
} from "../lib/macos-openclaw-registry-notification-prep.mjs";

test("isOpenClawRegistryNotificationProfileFullyInstalled returns true only for fully installed status", () => {
  assert.equal(
    isOpenClawRegistryNotificationProfileFullyInstalled({
      profileInstalled: true,
      bundleConfigured: true,
      fullyInstalled: true,
    }),
    true,
  );
  assert.equal(
    isOpenClawRegistryNotificationProfileFullyInstalled({
      profileInstalled: true,
      bundleConfigured: false,
      fullyInstalled: false,
    }),
    false,
  );
});

test("buildOpenClawRegistryNotificationInstallFlowInstructions explains timeout recovery", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationInstallFlowInstructions({
      profilePath: "/tmp/file.mobileconfig",
      timeoutSeconds: 120,
    }),
    [
      "已打开通知设置 profile，正在等待系统安装完成。",
      "如果 120 秒内仍未生效，请在系统设置中手动完成安装：/tmp/file.mobileconfig",
      "安装完成后可再次执行：corepack pnpm verify:macos:openclaw-registry-notifications",
    ],
  );
});

test("buildOpenClawRegistryNotificationInstallFlowInstructions includes bundle-specific verify command", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationInstallFlowInstructions({
      profilePath: "/tmp/file.mobileconfig",
      timeoutSeconds: 120,
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.temp",
    }),
    [
      "已打开通知设置 profile，正在等待系统安装完成。",
      "如果 120 秒内仍未生效，请在系统设置中手动完成安装：/tmp/file.mobileconfig",
      "安装完成后可再次执行：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm verify:macos:openclaw-registry-notifications",
    ],
  );
});
