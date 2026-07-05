import test from "node:test";
import assert from "node:assert/strict";

import { buildMacOSNotificationSettingsOpenCandidates } from "../lib/macos-notification-settings-url.mjs";

test("buildMacOSNotificationSettingsOpenCandidates prefers a bundle-targeted deep link first", () => {
  assert.deepEqual(
    buildMacOSNotificationSettingsOpenCandidates("com.mindanchor.mac.openclaw.registry.e2e"),
    [
      "x-apple.systempreferences:com.apple.Notifications-Settings.extension?bundleIdentifier=com.mindanchor.mac.openclaw.registry.e2e",
      "x-apple.systempreferences:com.apple.Notifications-Settings.extension",
      "x-apple.systempreferences:com.apple.preference.notifications",
    ],
  );
});

test("buildMacOSNotificationSettingsOpenCandidates falls back when bundle identifier is missing", () => {
  assert.deepEqual(
    buildMacOSNotificationSettingsOpenCandidates(""),
    [
      "x-apple.systempreferences:com.apple.Notifications-Settings.extension",
      "x-apple.systempreferences:com.apple.preference.notifications",
    ],
  );
});
