import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultOpenClawRegistryNotificationProfilePath,
  openClawRegistryNotificationPayloadIdentifier,
  openClawRegistryNotificationProfileDisplayName,
  openClawRegistryNotificationProfileIdentifier,
  configurationProfilesContainBundleIdentifier,
  configurationProfilesContainIdentifier,
  buildOpenClawRegistryNotificationPrepInstructions,
} from "../lib/macos-openclaw-registry-notification-prep.mjs";

test("notification prep constants stay stable", () => {
  assert.equal(
    openClawRegistryNotificationProfileIdentifier,
    "com.mindanchor.e2e.notifications.profile",
  );
  assert.equal(
    openClawRegistryNotificationPayloadIdentifier,
    "com.mindanchor.e2e.notifications.payload",
  );
  assert.equal(
    openClawRegistryNotificationProfileDisplayName,
    "MindAnchor OpenClaw Registry E2E Notifications",
  );
});

test("defaultOpenClawRegistryNotificationProfilePath resolves under tmp", () => {
  assert.equal(
    defaultOpenClawRegistryNotificationProfilePath("/repo"),
    "/repo/tmp/mindanchor-openclaw-registry-e2e-notifications.mobileconfig",
  );
});

test("configurationProfilesContainIdentifier finds nested payload identifiers", () => {
  const payload = {
    _computerLevel: [
      {
        PayloadIdentifier: "com.example.other",
      },
      {
        PayloadContent: [
          {
            PayloadIdentifier: "com.mindanchor.e2e.notifications.profile",
          },
        ],
      },
    ],
  };

  assert.equal(
    configurationProfilesContainIdentifier(payload, "com.mindanchor.e2e.notifications.profile"),
    true,
  );
});

test("configurationProfilesContainBundleIdentifier finds nested bundle identifiers", () => {
  const payload = {
    user: [
      {
        PayloadContent: [
          {
            NotificationSettings: [
              {
                BundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
              },
            ],
          },
        ],
      },
    ],
  };

  assert.equal(
    configurationProfilesContainBundleIdentifier(payload, "com.mindanchor.mac.openclaw.registry.e2e"),
    true,
  );
});

test("buildOpenClawRegistryNotificationPrepInstructions explains next steps", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationPrepInstructions({
      profilePath: "/repo/tmp/file.mobileconfig",
      alreadyInstalled: false,
    }),
    [
      "已生成通知设置 profile。",
      "打开它并在系统设置中完成安装：open /repo/tmp/file.mobileconfig",
      "安装后可执行验证：corepack pnpm verify:macos:openclaw-registry-notifications",
      "如需回滚可执行：corepack pnpm remove:macos:openclaw-registry-notifications",
    ],
  );
});

test("buildOpenClawRegistryNotificationPrepInstructions explains installed state", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationPrepInstructions({
      profilePath: "/repo/tmp/file.mobileconfig",
      alreadyInstalled: true,
    }),
    [
      "通知设置 profile 已生成，而且系统里已经检测到同标识 profile。",
      "如需重新安装，可重新打开：open /repo/tmp/file.mobileconfig",
      "当前可直接继续验证：corepack pnpm verify:macos:openclaw-registry-notifications",
      "如需回滚可执行：corepack pnpm remove:macos:openclaw-registry-notifications",
    ],
  );
});

test("buildOpenClawRegistryNotificationPrepInstructions includes bundle-specific verify/remove commands", () => {
  assert.deepEqual(
    buildOpenClawRegistryNotificationPrepInstructions({
      profilePath: "/repo/tmp/file.mobileconfig",
      alreadyInstalled: false,
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.temp",
    }),
    [
      "已生成通知设置 profile。",
      "打开它并在系统设置中完成安装：open /repo/tmp/file.mobileconfig",
      "安装后可执行验证：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm verify:macos:openclaw-registry-notifications",
      "如需回滚可执行：MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID=com.mindanchor.mac.openclaw.registry.e2e.temp corepack pnpm remove:macos:openclaw-registry-notifications",
    ],
  );
});
