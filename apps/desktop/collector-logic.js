import { randomUUID } from "node:crypto";

export const DESKTOP_USER_ID = "demo-user";
export const IDLE_THRESHOLD_SECONDS = 120;
export const IDLE_THROTTLE_MS = 120_000;

export function createDesktopSignal({
  eventType,
  payload = {},
  source = "desktop",
  userId = DESKTOP_USER_ID,
  occurredAt = new Date().toISOString(),
  clientEventId = randomUUID(),
}) {
  return {
    userId,
    source,
    eventType,
    occurredAt,
    clientEventId,
    payload,
  };
}

export function buildFrontmostTransitionSignals(previousApp, currentApp, options = {}) {
  const {
    includeWindowTitle = false,
    previousWindowTitle = "",
    currentWindowTitle = "",
    ...signalOptions
  } = options;
  const appChanged = Boolean(currentApp) && currentApp !== previousApp;
  const titleChanged = Boolean(includeWindowTitle && currentWindowTitle && currentWindowTitle !== previousWindowTitle);

  if (!appChanged && !titleChanged) {
    return [];
  }

  const signals = [];
  const currentPayload = { app: currentApp };
  if (includeWindowTitle && currentWindowTitle) {
    currentPayload.windowTitle = currentWindowTitle;
  }

  if (appChanged) {
    signals.push(
      createDesktopSignal({
        ...signalOptions,
        eventType: "active_app",
        payload: currentPayload,
      }),
    );
  }

  if (previousApp && (appChanged || titleChanged)) {
    const switchPayload = { from: previousApp, to: currentApp };
    if (includeWindowTitle && previousWindowTitle) {
      switchPayload.fromWindowTitle = previousWindowTitle;
    }
    if (includeWindowTitle && currentWindowTitle) {
      switchPayload.toWindowTitle = currentWindowTitle;
    }
    signals.push(
      createDesktopSignal({
        ...signalOptions,
        eventType: "window_switch",
        payload: switchPayload,
      }),
    );
  }

  return signals;
}

export function shouldEmitIdleSignal({
  idleSeconds,
  lastIdleSignalAt,
  now = Date.now(),
  thresholdSeconds = IDLE_THRESHOLD_SECONDS,
  throttleMs = IDLE_THROTTLE_MS,
}) {
  if (idleSeconds <= thresholdSeconds) {
    return false;
  }

  const lastTimestamp =
    typeof lastIdleSignalAt === "string"
      ? Date.parse(lastIdleSignalAt)
      : typeof lastIdleSignalAt === "number"
        ? lastIdleSignalAt
        : 0;

  return !lastTimestamp || now - lastTimestamp >= throttleMs;
}
