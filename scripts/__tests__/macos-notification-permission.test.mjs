import test from "node:test";
import assert from "node:assert/strict";

import { buildNotificationPermissionClickAppleScript } from "../lib/macos-notification-permission.mjs";

test("notification permission click script scans entire process contents", () => {
  const script = buildNotificationPermissionClickAppleScript();

  assert.match(script, /every button of entire contents/);
  assert.match(script, /UserNotificationsUIService/);
  assert.match(script, /UserNotificationCenter/);
  assert.match(script, /SecurityAgent/);
  assert.match(script, /CoreServicesUIAgent/);
  assert.doesNotMatch(script, /every button of entire contents of w/);
  assert.match(script, /security-agent-present/);
});
