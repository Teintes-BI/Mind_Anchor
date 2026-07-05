import test from "node:test";
import assert from "node:assert/strict";

import {
  deriveOpenClawRegistryNotificationProfileStatus,
  formatOpenClawRegistryNotificationProfileStatus,
} from "../lib/macos-openclaw-registry-notification-prep.mjs";

test("deriveOpenClawRegistryNotificationProfileStatus marks installed when identifier and bundle are both present", () => {
  const status = deriveOpenClawRegistryNotificationProfileStatus({
    _computerLevel: [
      {
        PayloadIdentifier: "com.mindanchor.e2e.notifications.profile",
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
  }, "com.mindanchor.mac.openclaw.registry.e2e");

  assert.deepEqual(status, {
    profileInstalled: true,
    bundleConfigured: true,
    fullyInstalled: true,
  });
});

test("formatOpenClawRegistryNotificationProfileStatus renders a readable summary", () => {
  assert.equal(
    formatOpenClawRegistryNotificationProfileStatus({
      profileInstalled: true,
      bundleConfigured: false,
      fullyInstalled: false,
    }),
    "notificationProfile profileInstalled=true bundleConfigured=false fullyInstalled=false",
  );
});
