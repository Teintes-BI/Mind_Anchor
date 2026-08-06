import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPermissionsPromptState,
  clearSignalQueue,
  createInitialDesktopState,
  hydrateDesktopState,
  getNotifiableReminderMessages,
  getRecentActivitySummary,
  markReminderAcknowledged,
  markFlushFailure,
  markReminderSeen,
  recordCollectorSignal,
  setWindowTitleCaptureEnabled,
  setInboxOverview,
  snoozeReminder,
} from "../desktop-state.js";
import { buildFrontmostTransitionSignals, createDesktopSignal, shouldEmitIdleSignal } from "../collector-logic.js";

test("builds active_app and window_switch signals when the frontmost app changes", () => {
  const signals = buildFrontmostTransitionSignals("Code", "Safari", { userId: "demo-user" });

  assert.equal(signals.length, 2);
  assert.equal(signals[0].eventType, "active_app");
  assert.equal(signals[0].payload.app, "Safari");
  assert.equal(signals[1].eventType, "window_switch");
  assert.deepEqual(signals[1].payload, { from: "Code", to: "Safari" });
});

test("includes window titles only for an opted-in app transition", () => {
  const signals = buildFrontmostTransitionSignals("Code", "Safari", {
    userId: "demo-user",
    includeWindowTitle: true,
    previousWindowTitle: "main.js - Code",
    currentWindowTitle: "Inbox - Safari",
  });

  assert.deepEqual(signals[0].payload, { app: "Safari", windowTitle: "Inbox - Safari" });
  assert.deepEqual(signals[1].payload, {
    from: "Code",
    to: "Safari",
    fromWindowTitle: "main.js - Code",
    toWindowTitle: "Inbox - Safari",
  });
});

test("emits a window switch when only an opted-in title changes", () => {
  const signals = buildFrontmostTransitionSignals("Code", "Code", {
    includeWindowTitle: true,
    previousWindowTitle: "main.js - Code",
    currentWindowTitle: "README.md - Code",
  });

  assert.equal(signals.length, 1);
  assert.equal(signals[0].eventType, "window_switch");
  assert.deepEqual(signals[0].payload, {
    from: "Code",
    to: "Code",
    fromWindowTitle: "main.js - Code",
    toWindowTitle: "README.md - Code",
  });
});

test("defaults window title capture off and clears a title when disabled", () => {
  const state = createInitialDesktopState();
  assert.equal(state.settings.recordWindowTitles, false);

  const hydrated = hydrateDesktopState({ settings: { recordWindowTitles: true } });
  assert.equal(hydrated.settings.recordWindowTitles, true);

  recordCollectorSignal(
    hydrated,
    createDesktopSignal({ eventType: "active_app", payload: { app: "Code", windowTitle: "main.js - Code" } }),
  );
  assert.equal(hydrated.collector.lastFrontmostWindowTitle, "main.js - Code");

  setWindowTitleCaptureEnabled(hydrated, false);
  assert.equal(hydrated.settings.recordWindowTitles, false);
  assert.equal(hydrated.collector.lastFrontmostWindowTitle, "");
});

test("throttles idle signals until the cooldown expires", () => {
  assert.equal(
    shouldEmitIdleSignal({
      idleSeconds: 180,
      lastIdleSignalAt: new Date(Date.now() - 30_000).toISOString(),
      now: Date.now(),
    }),
    false,
  );

  assert.equal(
    shouldEmitIdleSignal({
      idleSeconds: 180,
      lastIdleSignalAt: new Date(Date.now() - 180_000).toISOString(),
      now: Date.now(),
    }),
    true,
  );
});

test("summarizes recent collector activity over the last hour", () => {
  const state = createInitialDesktopState();
  const now = Date.now();
  const signals = [
    createDesktopSignal({ eventType: "active_app", payload: { app: "Code" }, occurredAt: new Date(now - 2_000).toISOString() }),
    createDesktopSignal({ eventType: "window_switch", payload: { from: "Code", to: "Safari" }, occurredAt: new Date(now - 1_500).toISOString() }),
    createDesktopSignal({ eventType: "idle", payload: { idleSeconds: 245 }, occurredAt: new Date(now - 1_000).toISOString() }),
    createDesktopSignal({ eventType: "lock", occurredAt: new Date(now - 800).toISOString() }),
    createDesktopSignal({ eventType: "unlock", occurredAt: new Date(now - 200).toISOString() }),
  ];

  for (const signal of signals) {
    recordCollectorSignal(state, signal);
  }

  const summary = getRecentActivitySummary(state, now);
  assert.equal(summary.activeAppCount, 1);
  assert.equal(summary.windowSwitchCount, 1);
  assert.equal(summary.idleCount, 1);
  assert.equal(summary.lockCount, 1);
  assert.equal(summary.unlockCount, 1);
  assert.equal(summary.lastFrontmostApp, "Code");
  assert.equal(summary.lastIdleSeconds, 245);
});

test("tracks queue length and flush metadata for retry behavior", () => {
  const state = createInitialDesktopState();
  state.signalQueue.push(createDesktopSignal({ eventType: "idle", payload: { idleSeconds: 180 } }));
  state.collector.queueLength = state.signalQueue.length;

  markFlushFailure(state, "network down", new Date().toISOString());
  assert.equal(state.collector.queueLength, 1);
  assert.equal(state.collector.lastFlushError, "network down");

  clearSignalQueue(state, new Date().toISOString());
  assert.equal(state.collector.queueLength, 0);
  assert.equal(state.collector.lastFlushError, null);
});

test("prevents duplicate reminder notifications and respects snooze", () => {
  const state = createInitialDesktopState();
  setInboxOverview(state, {
    messages: [
      {
        id: "msg-1",
        title: "Resume task",
        message: "Return to the current focus block.",
        channel: "desktop_local",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ],
  });

  assert.equal(getNotifiableReminderMessages(state).length, 1);

  markReminderSeen(state, "msg-1");
  assert.equal(getNotifiableReminderMessages(state).length, 0);

  snoozeReminder(state, "msg-1", 15, Date.now());
  assert.equal(getNotifiableReminderMessages(state).length, 0);

  assert.equal(getNotifiableReminderMessages(state, Date.now() + 16 * 60_000).length, 1);
});

test("marks reminders as acknowledged and hides the first-run permissions card after dismissal", () => {
  const state = createInitialDesktopState();
  setInboxOverview(state, {
    messages: [
      {
        id: "msg-2",
        title: "Take a break",
        message: "Pause for a minute.",
        channel: "desktop_local",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ],
  });

  markReminderAcknowledged(state, "msg-2");
  assert.equal(state.reminders.latestInboxOverview.pendingMessages.length, 0);
  assert.equal(state.reminders.latestInboxOverview.acknowledgedMessages.length, 1);

  assert.equal(buildPermissionsPromptState(state).visible, true);
  state.permissions.promptDismissedAt = new Date().toISOString();
  assert.equal(buildPermissionsPromptState(state).visible, false);
});
