import test from "node:test";
import assert from "node:assert/strict";

import { parseMacOSNotificationDebugLog } from "../lib/macos-notification-debug-log.mjs";

test("parseMacOSNotificationDebugLog infers request_in_flight from a started request without completion", () => {
  const summary = parseMacOSNotificationDebugLog(`
[2026-03-24T00:00:00.000Z] notification settings refreshed context=bootstrap status=notDetermined
[2026-03-24T00:00:02.000Z] requestAuthorization starting context=automation-command status=notDetermined
`);

  assert.equal(summary.lastAuthorizationStatus, "notDetermined");
  assert.equal(summary.lastContext, "automation-command");
  assert.equal(summary.requestStarted, true);
  assert.equal(summary.requestReturned, false);
  assert.equal(summary.requestThrew, false);
  assert.equal(summary.inferredState, "request_in_flight");
});

test("parseMacOSNotificationDebugLog infers denied from the last refreshed authorization status", () => {
  const summary = parseMacOSNotificationDebugLog(`
[2026-03-24T00:00:00.000Z] requestAuthorization starting context=automation-command status=notDetermined
[2026-03-24T00:00:03.000Z] notification settings refreshed context=automation-command-after-request status=denied
`);

  assert.equal(summary.lastAuthorizationStatus, "denied");
  assert.equal(summary.lastContext, "automation-command-after-request");
  assert.equal(summary.inferredState, "denied");
});

test("parseMacOSNotificationDebugLog infers allowed from an authorized refresh", () => {
  const summary = parseMacOSNotificationDebugLog(`
[2026-03-24T00:00:00.000Z] requestAuthorization starting context=automation-command status=notDetermined
[2026-03-24T00:00:01.000Z] requestAuthorization returned context=automation-command granted=true
[2026-03-24T00:00:02.000Z] notification settings refreshed context=automation-command-after-request status=authorized
`);

  assert.equal(summary.requestReturned, true);
  assert.equal(summary.inferredState, "allowed");
});

test("parseMacOSNotificationDebugLog stays unknown for empty input", () => {
  const summary = parseMacOSNotificationDebugLog("");

  assert.deepEqual(summary, {
    lastAuthorizationStatus: null,
    lastContext: null,
    requestStarted: false,
    requestReturned: false,
    requestThrew: false,
    inferredState: "unknown",
  });
});
