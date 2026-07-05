import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultOpenClawRegistryE2EAppBundlePath,
  defaultOpenClawRegistryLiveNotificationStatusOutputPath,
  normalizeOpenClawRegistryLiveNotificationState,
} from "../lib/macos-live-notification-status.mjs";

test("defaultOpenClawRegistryE2EAppBundlePath resolves to the registry e2e build product", () => {
  assert.equal(
    defaultOpenClawRegistryE2EAppBundlePath("/repo"),
    "/repo/apps/macos/.derived-data/openclaw-registry-e2e/Build/Products/Debug/MindAnchorMac.app",
  );
});

test("defaultOpenClawRegistryLiveNotificationStatusOutputPath resolves under tmp", () => {
  assert.equal(
    defaultOpenClawRegistryLiveNotificationStatusOutputPath("/repo"),
    "/repo/tmp/mindanchor-openclaw-registry-live-notification-status.json",
  );
});

test("normalizeOpenClawRegistryLiveNotificationState maps app payload states into doctor states", () => {
  assert.equal(normalizeOpenClawRegistryLiveNotificationState("allowed"), "allowed");
  assert.equal(normalizeOpenClawRegistryLiveNotificationState("denied"), "denied");
  assert.equal(normalizeOpenClawRegistryLiveNotificationState("not_requested"), "not_requested");
  assert.equal(normalizeOpenClawRegistryLiveNotificationState("checking"), "unknown");
  assert.equal(normalizeOpenClawRegistryLiveNotificationState("weird"), "unknown");
});
