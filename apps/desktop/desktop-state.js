import { existsSync, readFileSync, writeFileSync } from "node:fs";

const STATE_VERSION = 1;
const RECENT_SIGNAL_WINDOW_MS = 60 * 60 * 1000;
const MAX_RECENT_SIGNALS = 500;
const REMINDER_CHANNELS = ["desktop_local", "mobile_push", "feishu_bot", "telegram_bot"];

export function createEmptyInboxOverview() {
  return {
    messages: [],
    pendingMessages: [],
    acknowledgedMessages: [],
    channelCounts: REMINDER_CHANNELS.map((channel) => ({
      channel,
      total: 0,
      pending: 0,
      acknowledged: 0,
    })),
    metricCounts: {
      totalMessages: 0,
      pendingMessages: 0,
      acknowledgedMessages: 0,
    },
  };
}

export function createInitialDesktopState() {
  return {
    version: STATE_VERSION,
    signalQueue: [],
    collector: {
      queueLength: 0,
      lastFlushAt: null,
      lastFlushError: null,
      lastFrontmostApp: "",
      lastFrontmostWindowTitle: "",
      lastFrontmostAppCheckedAt: null,
      frontmostAppAvailable: true,
      lastFrontmostAppError: null,
      lastIdleSignalAt: null,
      lastIdleSeconds: 0,
      lastLockAt: null,
      lastUnlockAt: null,
      recentSignals: [],
    },
    reminders: {
      seenMessageIds: [],
      snoozedUntilByMessageId: {},
      lastInboxPollAt: null,
      lastInboxPollError: null,
      latestInboxOverview: createEmptyInboxOverview(),
      lastDashboardPollAt: null,
      lastDashboardPollError: null,
      latestDashboardSummary: null,
    },
    permissions: {
      promptDismissedAt: null,
    },
    settings: {
      recordWindowTitles: false,
    },
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeRecentSignals(recentSignals) {
  return asArray(recentSignals)
    .filter((signal) => signal && typeof signal.eventType === "string" && typeof signal.occurredAt === "string")
    .slice(-MAX_RECENT_SIGNALS);
}

function recalculateInboxCollections(overview) {
  const messages = asArray(overview?.messages);
  const pendingMessages = messages.filter((message) => message?.status === "pending");
  const acknowledgedMessages = messages.filter((message) => message?.status === "acknowledged");
  const channelCounts = REMINDER_CHANNELS.map((channel) => {
    const channelMessages = messages.filter((message) => message?.channel === channel);
    return {
      channel,
      total: channelMessages.length,
      pending: channelMessages.filter((message) => message?.status === "pending").length,
      acknowledged: channelMessages.filter((message) => message?.status === "acknowledged").length,
    };
  });

  return {
    messages,
    pendingMessages,
    acknowledgedMessages,
    channelCounts,
    metricCounts: {
      totalMessages: messages.length,
      pendingMessages: pendingMessages.length,
      acknowledgedMessages: acknowledgedMessages.length,
    },
  };
}

export function hydrateDesktopState(rawState = {}) {
  const base = createInitialDesktopState();
  const raw = asObject(rawState);
  const rawCollector = asObject(raw.collector);
  const rawReminders = asObject(raw.reminders);
  const rawPermissions = asObject(raw.permissions);
  const rawSettings = asObject(raw.settings);
  const inboxOverview = recalculateInboxCollections(rawReminders.latestInboxOverview ?? createEmptyInboxOverview());

  const state = {
    version: STATE_VERSION,
    signalQueue: asArray(raw.signalQueue),
    collector: {
      ...base.collector,
      ...rawCollector,
      recentSignals: normalizeRecentSignals(rawCollector.recentSignals),
    },
    reminders: {
      ...base.reminders,
      ...rawReminders,
      seenMessageIds: asArray(rawReminders.seenMessageIds).filter((messageId) => typeof messageId === "string"),
      snoozedUntilByMessageId: Object.fromEntries(
        Object.entries(asObject(rawReminders.snoozedUntilByMessageId)).filter(
          ([messageId, snoozedUntil]) => typeof messageId === "string" && typeof snoozedUntil === "string",
        ),
      ),
      latestInboxOverview: inboxOverview,
    },
    permissions: {
      ...base.permissions,
      ...rawPermissions,
    },
    settings: {
      ...base.settings,
      recordWindowTitles: rawSettings.recordWindowTitles === true,
    },
  };

  state.collector.queueLength = state.signalQueue.length;
  return state;
}

export function readDesktopState(stateFile) {
  if (!existsSync(stateFile)) {
    return createInitialDesktopState();
  }

  try {
    return hydrateDesktopState(JSON.parse(readFileSync(stateFile, "utf8")));
  } catch {
    return createInitialDesktopState();
  }
}

export function writeDesktopState(stateFile, state) {
  writeFileSync(stateFile, JSON.stringify(hydrateDesktopState(state), null, 2), "utf8");
}

function pruneRecentSignals(recentSignals, nowMs = Date.now()) {
  const cutoff = nowMs - RECENT_SIGNAL_WINDOW_MS;
  return normalizeRecentSignals(recentSignals).filter((signal) => Date.parse(signal.occurredAt) >= cutoff).slice(-MAX_RECENT_SIGNALS);
}

export function recordCollectorSignal(state, signal) {
  const nextState = state;
  nextState.collector.recentSignals = pruneRecentSignals([...nextState.collector.recentSignals, signal]);

  switch (signal.eventType) {
    case "active_app":
      nextState.collector.lastFrontmostApp = String(signal.payload?.app ?? nextState.collector.lastFrontmostApp ?? "");
      nextState.collector.lastFrontmostWindowTitle = String(signal.payload?.windowTitle ?? "");
      nextState.collector.lastFrontmostAppCheckedAt = signal.occurredAt;
      nextState.collector.frontmostAppAvailable = true;
      nextState.collector.lastFrontmostAppError = null;
      break;
    case "window_switch":
      if (Object.prototype.hasOwnProperty.call(signal.payload ?? {}, "toWindowTitle")) {
        nextState.collector.lastFrontmostWindowTitle = String(signal.payload?.toWindowTitle ?? "");
      }
      break;
    case "idle":
      nextState.collector.lastIdleSignalAt = signal.occurredAt;
      nextState.collector.lastIdleSeconds = Number(signal.payload?.idleSeconds ?? nextState.collector.lastIdleSeconds ?? 0);
      break;
    case "lock":
      nextState.collector.lastLockAt = signal.occurredAt;
      break;
    case "unlock":
      nextState.collector.lastUnlockAt = signal.occurredAt;
      break;
    default:
      break;
  }

  nextState.collector.queueLength = nextState.signalQueue.length;
  return nextState;
}

export function queueSignalForRetry(state, signal, errorMessage, timestamp = new Date().toISOString()) {
  const nextState = state;
  nextState.signalQueue.push(signal);
  recordCollectorSignal(nextState, signal);
  nextState.collector.queueLength = nextState.signalQueue.length;
  nextState.collector.lastFlushAt = timestamp;
  nextState.collector.lastFlushError = errorMessage;
  return nextState;
}

export function markSignalDelivered(state, signal, timestamp = new Date().toISOString()) {
  const nextState = state;
  recordCollectorSignal(nextState, signal);
  nextState.collector.lastFlushAt = timestamp;
  nextState.collector.lastFlushError = null;
  nextState.collector.queueLength = nextState.signalQueue.length;
  return nextState;
}

export function clearSignalQueue(state, timestamp = new Date().toISOString()) {
  const nextState = state;
  nextState.signalQueue = [];
  nextState.collector.queueLength = 0;
  nextState.collector.lastFlushAt = timestamp;
  nextState.collector.lastFlushError = null;
  return nextState;
}

export function markFlushFailure(state, errorMessage, timestamp = new Date().toISOString()) {
  const nextState = state;
  nextState.collector.lastFlushAt = timestamp;
  nextState.collector.lastFlushError = errorMessage;
  nextState.collector.queueLength = nextState.signalQueue.length;
  return nextState;
}

export function markFrontmostUnavailable(state, errorMessage, checkedAt = new Date().toISOString()) {
  const nextState = state;
  nextState.collector.frontmostAppAvailable = false;
  nextState.collector.lastFrontmostAppError = errorMessage;
  nextState.collector.lastFrontmostAppCheckedAt = checkedAt;
  return nextState;
}

export function markFrontmostAvailable(state, checkedAt = new Date().toISOString()) {
  const nextState = state;
  nextState.collector.frontmostAppAvailable = true;
  nextState.collector.lastFrontmostAppError = null;
  nextState.collector.lastFrontmostAppCheckedAt = checkedAt;
  return nextState;
}

export function getRecentActivitySummary(state, nowMs = Date.now()) {
  const recentSignals = pruneRecentSignals(state.collector.recentSignals, nowMs);
  return {
    windowStart: new Date(nowMs - RECENT_SIGNAL_WINDOW_MS).toISOString(),
    totalSignals: recentSignals.length,
    activeAppCount: recentSignals.filter((signal) => signal.eventType === "active_app").length,
    windowSwitchCount: recentSignals.filter((signal) => signal.eventType === "window_switch").length,
    idleCount: recentSignals.filter((signal) => signal.eventType === "idle").length,
    lockCount: recentSignals.filter((signal) => signal.eventType === "lock").length,
    unlockCount: recentSignals.filter((signal) => signal.eventType === "unlock").length,
    lastLockAt: state.collector.lastLockAt,
    lastUnlockAt: state.collector.lastUnlockAt,
    lastFrontmostApp: state.collector.lastFrontmostApp,
    lastFrontmostWindowTitle: state.collector.lastFrontmostWindowTitle,
    lastIdleSeconds: state.collector.lastIdleSeconds,
  };
}

export function setDashboardSummary(state, summary, timestamp = new Date().toISOString(), errorMessage = null) {
  const nextState = state;
  nextState.reminders.latestDashboardSummary = summary;
  nextState.reminders.lastDashboardPollAt = timestamp;
  nextState.reminders.lastDashboardPollError = errorMessage;
  return nextState;
}

export function setInboxOverview(state, overview, timestamp = new Date().toISOString(), errorMessage = null) {
  const nextState = state;
  nextState.reminders.latestInboxOverview = recalculateInboxCollections(overview ?? createEmptyInboxOverview());
  nextState.reminders.lastInboxPollAt = timestamp;
  nextState.reminders.lastInboxPollError = errorMessage;
  return reconcileReminderState(nextState, Date.parse(timestamp));
}

export function reconcileReminderState(state, nowMs = Date.now()) {
  const nextState = state;
  const overview = recalculateInboxCollections(nextState.reminders.latestInboxOverview);
  nextState.reminders.latestInboxOverview = overview;

  const activePendingIds = new Set(
    overview.messages
      .filter((message) => message?.status === "pending")
      .map((message) => String(message.id)),
  );

  nextState.reminders.seenMessageIds = nextState.reminders.seenMessageIds.filter((messageId) => activePendingIds.has(messageId));

  for (const [messageId, snoozedUntil] of Object.entries(nextState.reminders.snoozedUntilByMessageId)) {
    if (!activePendingIds.has(messageId) || Date.parse(snoozedUntil) <= nowMs) {
      delete nextState.reminders.snoozedUntilByMessageId[messageId];
    }
  }

  return nextState;
}

export function getNotifiableReminderMessages(state, nowMs = Date.now()) {
  const nextState = reconcileReminderState(state, nowMs);
  return nextState.reminders.latestInboxOverview.messages.filter((message) => {
    const messageId = String(message?.id ?? "");
    const snoozedUntil = nextState.reminders.snoozedUntilByMessageId[messageId];
    return (
      message &&
      message.status === "pending" &&
      message.channel === "desktop_local" &&
      !nextState.reminders.seenMessageIds.includes(messageId) &&
      (!snoozedUntil || Date.parse(snoozedUntil) <= nowMs)
    );
  });
}

export function markReminderSeen(state, messageId) {
  const nextState = state;
  if (!nextState.reminders.seenMessageIds.includes(messageId)) {
    nextState.reminders.seenMessageIds.push(messageId);
  }
  return nextState;
}

export function snoozeReminder(state, messageId, minutes = 15, nowMs = Date.now()) {
  const nextState = state;
  nextState.reminders.snoozedUntilByMessageId[messageId] = new Date(nowMs + minutes * 60_000).toISOString();
  nextState.reminders.seenMessageIds = nextState.reminders.seenMessageIds.filter((candidate) => candidate !== messageId);
  return nextState;
}

export function markReminderAcknowledged(state, messageId) {
  const nextState = state;
  nextState.reminders.seenMessageIds = nextState.reminders.seenMessageIds.filter((candidate) => candidate !== messageId);
  delete nextState.reminders.snoozedUntilByMessageId[messageId];

  const messages = nextState.reminders.latestInboxOverview.messages.map((message) =>
    String(message?.id ?? "") === messageId ? { ...message, status: "acknowledged" } : message,
  );
  nextState.reminders.latestInboxOverview = recalculateInboxCollections({
    ...nextState.reminders.latestInboxOverview,
    messages,
  });
  return nextState;
}

export function dismissPermissionsPrompt(state, timestamp = new Date().toISOString()) {
  const nextState = state;
  nextState.permissions.promptDismissedAt = timestamp;
  return nextState;
}

export function setWindowTitleCaptureEnabled(state, enabled) {
  const nextState = state;
  nextState.settings.recordWindowTitles = Boolean(enabled);
  if (!nextState.settings.recordWindowTitles) {
    nextState.collector.lastFrontmostWindowTitle = "";
  }
  return nextState;
}

export function buildPermissionsPromptState(state) {
  return {
    visible: !state.permissions.promptDismissedAt,
    dismissedAt: state.permissions.promptDismissedAt,
    items: [
      "允许通知权限，用于显示桌面提醒。",
      "如果前台应用采集不可用，请检查系统的桌面应用权限。",
      "MindAnchor 第一阶段不会采集键入内容、截图、聊天正文或文档正文。",
    ],
  };
}
