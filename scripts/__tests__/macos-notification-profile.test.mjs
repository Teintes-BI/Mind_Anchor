import test from "node:test";
import assert from "node:assert/strict";

import { buildMacOSNotificationSettingsProfile } from "../lib/macos-notification-profile.mjs";

test("buildMacOSNotificationSettingsProfile renders a notifications payload for the target bundle", () => {
  const profile = buildMacOSNotificationSettingsProfile({
    bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
    profileIdentifier: "com.mindanchor.e2e.notifications",
    payloadIdentifier: "com.mindanchor.e2e.notifications.payload",
    profileDisplayName: "MindAnchor E2E Notifications",
  });

  assert.match(profile, /<string>com\.apple\.notificationsettings<\/string>/);
  assert.match(profile, /<key>BundleIdentifier<\/key>\s*<string>com\.mindanchor\.mac\.openclaw\.registry\.e2e<\/string>/);
  assert.match(profile, /<key>NotificationsEnabled<\/key>\s*<true\/>/);
  assert.match(profile, /<key>AlertType<\/key>\s*<integer>2<\/integer>/);
  assert.match(profile, /<string>MindAnchor E2E Notifications<\/string>/);
});
