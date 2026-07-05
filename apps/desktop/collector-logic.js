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
  if (!currentApp || currentApp === previousApp) {
    return [];
  }

  const signals = [
    createDesktopSignal({
      ...options,
      eventType: "active_app",
      payload: { app: currentApp },
    }),
  ];

  if (previousApp) {
    signals.push(
      createDesktopSignal({
        ...options,
        eventType: "window_switch",
        payload: { from: previousApp, to: currentApp },
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
