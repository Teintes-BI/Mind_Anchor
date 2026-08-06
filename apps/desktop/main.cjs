const { app, BrowserWindow, ipcMain, Menu, Notification, Tray, nativeImage, powerMonitor } = require("electron");
const { existsSync, mkdirSync, readFileSync } = require("node:fs");
const { execFile } = require("node:child_process");
const { join } = require("node:path");
const { createWindowsForegroundReader } = require("./windows-foreground.cjs");

const apiBaseUrl = process.env.MINDANCHOR_API_URL ?? "http://localhost:3001";
const inboxLimit = 10;
const reminderPollMs = 30_000;
const frontmostPollMs = 10_000;
const idlePollMs = 30_000;
const flushPollMs = 60_000;
const snoozeMinutes = 15;

let createAudioBridge;
let createWayfinderClient;
let buildFrontmostTransitionSignals;
let createDesktopSignal;
let DESKTOP_USER_ID;
let shouldEmitIdleSignal;
let buildPermissionsPromptState;
let clearSignalQueue;
let createInitialDesktopState;
let dismissPermissionsPrompt;
let getNotifiableReminderMessages;
let getRecentActivitySummary;
let markFlushFailure;
let markFrontmostAvailable;
let markFrontmostUnavailable;
let markReminderAcknowledged;
let markReminderSeen;
let markSignalDelivered;
let readDesktopState;
let setDashboardSummary;
let setInboxOverview;
let setWindowTitleCaptureEnabled;
let applyReminderSnooze;
let writeDesktopState;

let mainWindow = null;
let appStateDir = "";
let stateFile = "";
let legacyQueueFile = "";
let desktopState = null;
let tray = null;
let isQuitting = false;
let remoteRefreshPromise = null;
let latestStatusMessage = "Ready.";
let audioBridge = null;
let wayfinderClient = null;
const windowsForegroundReader =
  process.platform === "win32" ? createWindowsForegroundReader({ execFileImpl: execFile }) : null;

async function loadHelpers() {
  ({ createAudioBridge } = await import("./audio-bridge.js"));
  ({ createWayfinderClient } = await import("./wayfinder-client.js"));
  ({
    buildFrontmostTransitionSignals,
    createDesktopSignal,
    DESKTOP_USER_ID,
    shouldEmitIdleSignal,
  } = await import("./collector-logic.js"));
  ({
    buildPermissionsPromptState,
    clearSignalQueue,
    createInitialDesktopState,
    dismissPermissionsPrompt,
    getNotifiableReminderMessages,
    getRecentActivitySummary,
    markFlushFailure,
    markFrontmostAvailable,
    markFrontmostUnavailable,
    markReminderAcknowledged,
    markReminderSeen,
    markSignalDelivered,
    readDesktopState,
    setDashboardSummary,
    setInboxOverview,
    setWindowTitleCaptureEnabled,
    snoozeReminder: applyReminderSnooze,
    writeDesktopState,
  } = await import("./desktop-state.js"));
  desktopState = createInitialDesktopState();
}

function ensureStateFiles() {
  const userData = app.getPath("userData");
  appStateDir = join(userData, ".mindanchor-desktop");
  mkdirSync(appStateDir, { recursive: true });
  stateFile = join(appStateDir, "desktop-state.json");
  legacyQueueFile = join(appStateDir, "signals-queue.json");
  desktopState = readDesktopState(stateFile);

  if (existsSync(legacyQueueFile) && desktopState.signalQueue.length === 0) {
    try {
      const legacyQueue = JSON.parse(readFileSync(legacyQueueFile, "utf8"));
      if (Array.isArray(legacyQueue)) {
        desktopState.signalQueue = legacyQueue;
        desktopState.collector.queueLength = legacyQueue.length;
      }
    } catch {}
  }

  persistDesktopState();
}

function persistDesktopState() {
  writeDesktopState(stateFile, desktopState);
}

function updateDesktopState(mutator) {
  mutator(desktopState);
  desktopState.collector.queueLength = desktopState.signalQueue.length;
  persistDesktopState();
}

function createSignal({ eventType, payload = {}, source = "desktop" }) {
  return createDesktopSignal({
    userId: DESKTOP_USER_ID,
    source,
    eventType,
    payload,
  });
}

async function postJson(path, payload) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return response.json();
}

async function getJson(path) {
  const response = await fetch(`${apiBaseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }
  return response.json();
}

async function postSignals(events) {
  return postJson("/state/signals/batch", { events });
}

async function flushQueue() {
  const queue = [...desktopState.signalQueue];
  if (queue.length === 0) {
    publishStatus("Queue is empty.");
    await refreshRemoteState("Queue is empty.");
    return { sent: 0 };
  }

  try {
    await postSignals(queue);
    updateDesktopState((state) => {
      clearSignalQueue(state);
    });
    await refreshRemoteState(`Uploaded ${queue.length} queued signals.`);
    return { sent: queue.length };
  } catch (error) {
    updateDesktopState((state) => {
      markFlushFailure(state, error instanceof Error ? error.message : "Failed to flush queue.");
    });
    publishStatus(error instanceof Error ? error.message : "Failed to flush queue.");
    return { sent: 0 };
  }
}

async function enqueueSignal(signal) {
  updateDesktopState((state) => {
    markSignalDelivered(state, signal);
  });
  try {
    await postSignals([signal]);
    publishStatus(`Sent ${signal.eventType} signal.`);
  } catch (error) {
    updateDesktopState((state) => {
      state.signalQueue.push(signal);
      state.collector.queueLength = state.signalQueue.length;
      markFlushFailure(state, error instanceof Error ? error.message : "Failed to send signal.");
    });
    publishStatus(`Queued ${signal.eventType} signal for retry.`);
  }
}

async function getDashboardSummary() {
  try {
    return desktopState.reminders.latestDashboardSummary ?? (await getJson(`/dashboard/summary?userId=${DESKTOP_USER_ID}`));
  } catch {
    return null;
  }
}

async function getInboxOverview() {
  return desktopState.reminders.latestInboxOverview;
}

function getPendingDesktopLocalReminderCount() {
  return desktopState.reminders.latestInboxOverview.messages.filter(
    (message) => message.status === "pending" && message.channel === "desktop_local",
  ).length;
}

function buildStatusPayload(message = latestStatusMessage, audioOverride) {
  latestStatusMessage = message;
  const permissions = buildPermissionsPromptState(desktopState);
  return {
    message,
    queueLength: desktopState.signalQueue.length,
    apiBaseUrl,
    collector: {
      ...desktopState.collector,
      activitySummary: getRecentActivitySummary(desktopState),
    },
    reminders: {
      ...desktopState.reminders,
      pendingDesktopLocalCount: getPendingDesktopLocalReminderCount(),
    },
    permissions,
    settings: { ...desktopState.settings },
    audioBridge: audioOverride ?? audioBridge?.getSummary?.() ?? null,
    wayfinder: wayfinderClient?.getStatus?.() ?? { configured: false, connected: false, message: "Wayfinder is starting." },
  };
}

function publishStatus(message = "Ready.", audioOverride) {
  const payload = buildStatusPayload(message, audioOverride);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("desktop:status", payload);
  }
  updateTray(payload);
}

function buildTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="7" fill="black" />
      <circle cx="9" cy="9" r="2" fill="white" />
    </svg>
  `.trim();
  const icon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`);
  icon.setTemplateImage(true);
  return icon;
}

function showMainWindow(options = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
  }

  mainWindow.show();
  mainWindow.focus();

  if (options.focusReminders) {
    mainWindow.webContents.send("desktop:command", { type: "focus-reminders" });
  }
}

function updateTray(payload = buildStatusPayload()) {
  if (!tray) return;
  const pendingCount = payload.reminders.pendingDesktopLocalCount;
  tray.setToolTip(`MindAnchor · queued ${payload.queueLength} · reminders ${pendingCount}`);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "打开 MindAnchor", click: () => showMainWindow() },
      {
        label: "立即同步",
        click: () => {
          void flushQueue();
          void refreshRemoteState("Synced from tray.");
        },
      },
      {
        label: `查看最近提醒${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
        click: () => showMainWindow({ focusReminders: true }),
      },
      { type: "separator" },
      {
        label: "退出",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
}

function ensureTray() {
  if (tray) return tray;
  tray = new Tray(buildTrayIcon());
  tray.on("click", () => showMainWindow());
  updateTray();
  return tray;
}

function removeLocalReminderState(messageId) {
  updateDesktopState((state) => {
    markReminderAcknowledged(state, messageId);
  });
}

function getFrontmostApp() {
  return new Promise((resolve) => {
    if (process.platform === "win32") {
      void windowsForegroundReader.read({ includeWindowTitle: desktopState?.settings?.recordWindowTitles === true }).then(resolve).catch((error) => {
        resolve({
          appName: "",
          error: error instanceof Error ? error.message : String(error),
        });
      });
      return;
    }

    if (process.platform !== "darwin") {
      resolve({ appName: "", error: "Frontmost app capture is unavailable on this platform." });
      return;
    }

    execFile(
      "osascript",
      ["-e", 'tell application "System Events" to get name of first application process whose frontmost is true'],
      (error, stdout) => {
        if (error) {
          resolve({ appName: "", error: error.message });
          return;
        }

        resolve({ appName: stdout.trim(), error: null });
      },
    );
  });
}

async function pollFrontmostApp() {
  const { appName, windowTitle = "", error } = await getFrontmostApp();
  if (!appName) {
    updateDesktopState((state) => {
      markFrontmostUnavailable(state, error ?? "Frontmost app is unavailable.");
    });
    publishStatus("Frontmost app capture is unavailable.");
    return;
  }

  updateDesktopState((state) => {
    markFrontmostAvailable(state);
  });

  const includeWindowTitle = desktopState.settings.recordWindowTitles === true;
  const transitionSignals = buildFrontmostTransitionSignals(desktopState.collector.lastFrontmostApp, String(appName), {
    userId: DESKTOP_USER_ID,
    includeWindowTitle,
    previousWindowTitle: desktopState.collector.lastFrontmostWindowTitle,
    currentWindowTitle: includeWindowTitle ? String(windowTitle) : "",
  });

  for (const signal of transitionSignals) {
    await enqueueSignal(signal);
  }
}

async function pollIdleState() {
  const idleSeconds = powerMonitor.getSystemIdleTime();
  if (
    shouldEmitIdleSignal({
      idleSeconds,
      lastIdleSignalAt: desktopState.collector.lastIdleSignalAt,
    })
  ) {
    await enqueueSignal(createSignal({ eventType: "idle", payload: { idleSeconds } }));
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 980,
    minHeight: 760,
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.loadFile(join(__dirname, "renderer/index.html"));
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    publishStatus();
  });
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function buildReminderNotificationBody(message) {
  const parts = [message.message ?? message.summary ?? ""].filter(Boolean);
  if (message.createdAt) {
    parts.push(`创建于 ${new Date(message.createdAt).toLocaleString()}`);
  }
  return parts.join("\n");
}

function showReminderNotification(message) {
  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title: message.title ?? "MindAnchor 提醒",
    body: buildReminderNotificationBody(message),
    actions: [{ type: "button", text: "稍后提醒" }, { type: "button", text: "打开主窗口" }],
    closeButtonText: "关闭",
    silent: false,
  });

  notification.on("click", () => showMainWindow({ focusReminders: true }));
  notification.on("action", (_event, index) => {
    if (index === 0) {
      void snoozeReminder(message.id, snoozeMinutes);
      return;
    }
    showMainWindow({ focusReminders: true });
  });
  notification.show();
}

async function refreshRemoteState(message = "Refreshed remote state.") {
  if (remoteRefreshPromise) {
    return remoteRefreshPromise;
  }

  remoteRefreshPromise = (async () => {
    const timestamp = new Date().toISOString();
    const [dashboardResult, inboxResult] = await Promise.allSettled([
      getJson(`/dashboard/summary?userId=${DESKTOP_USER_ID}`),
      getJson(`/client/inbox/overview?userId=${DESKTOP_USER_ID}&limit=${inboxLimit}`),
    ]);

    updateDesktopState((state) => {
      if (dashboardResult.status === "fulfilled") {
        setDashboardSummary(state, dashboardResult.value, timestamp, null);
      } else {
        setDashboardSummary(state, state.reminders.latestDashboardSummary, timestamp, dashboardResult.reason?.message ?? "Dashboard fetch failed.");
      }

      if (inboxResult.status === "fulfilled") {
        setInboxOverview(state, inboxResult.value, timestamp, null);
      } else {
        setInboxOverview(state, state.reminders.latestInboxOverview, timestamp, inboxResult.reason?.message ?? "Inbox fetch failed.");
      }
    });

    if (inboxResult.status === "fulfilled") {
      const notifications = getNotifiableReminderMessages(desktopState);
      if (notifications.length > 0) {
        updateDesktopState((state) => {
          for (const reminder of notifications) {
            markReminderSeen(state, reminder.id);
          }
        });
        for (const reminder of notifications) {
          showReminderNotification(reminder);
        }
      }
    }

    publishStatus(message);
    return {
      dashboard: dashboardResult.status === "fulfilled" ? dashboardResult.value : null,
      inbox: inboxResult.status === "fulfilled" ? inboxResult.value : null,
    };
  })();

  try {
    return await remoteRefreshPromise;
  } finally {
    remoteRefreshPromise = null;
  }
}

async function acknowledgeInboxMessage(messageId) {
  const response = await postJson(`/client/inbox/${messageId}/ack`, {});
  removeLocalReminderState(messageId);
  await refreshRemoteState("Marked reminder as handled.");
  return response;
}

async function snoozeReminder(messageId, minutes = snoozeMinutes) {
  updateDesktopState((state) => {
    applyReminderSnooze(state, messageId, minutes);
  });
  publishStatus(`Snoozed reminder for ${minutes} minutes.`);
  return {
    messageId,
    snoozedUntil: desktopState.reminders.snoozedUntilByMessageId[messageId],
  };
}

async function bootstrap() {
  await loadHelpers();

  app.whenReady().then(async () => {
    ensureStateFiles();
    createWindow();
    ensureTray();

    audioBridge = createAudioBridge({
      dataDir: appStateDir,
      apiBaseUrl,
      publishStatus,
    });
    wayfinderClient = createWayfinderClient({
      apiBaseUrl,
      token: process.env.MINDANCHOR_API_TOKEN ?? "",
      sourceDeviceId: `${process.platform}-desktop`,
    });

    powerMonitor.on("lock-screen", () => void enqueueSignal(createSignal({ eventType: "lock" })));
    powerMonitor.on("unlock-screen", () => void enqueueSignal(createSignal({ eventType: "unlock" })));

    setInterval(() => void pollFrontmostApp(), frontmostPollMs);
    setInterval(() => void pollIdleState(), idlePollMs);
    setInterval(() => void flushQueue(), flushPollMs);
    setInterval(() => void refreshRemoteState("Polled remote state."), reminderPollMs);

    await pollFrontmostApp();
    await refreshRemoteState("Desktop collector is ready.");
  });

  app.on("activate", () => {
    showMainWindow();
  });

  app.on("before-quit", () => {
    isQuitting = true;
    tray?.destroy?.();
    audioBridge?.dispose?.();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  ipcMain.handle("desktop:status", async () => buildStatusPayload());
  ipcMain.handle("desktop:flush", async () => flushQueue());
  ipcMain.handle("desktop:emit", async (_event, eventType, payload) => {
    await enqueueSignal(createSignal({ eventType, payload }));
    return { ok: true };
  });
  ipcMain.handle("desktop:checkin", async (_event, payload) => {
    updateDesktopState((state) => {
      markSignalDelivered(
        state,
        createSignal({
          eventType: "manual_checkin",
          payload: {
            focusScore: payload.focusScore,
            energyScore: payload.energyScore,
            moodScore: payload.moodScore,
          },
        }),
      );
    });
    const response = await postJson("/state/checkins", {
      userId: DESKTOP_USER_ID,
      ...payload,
    });

    await refreshRemoteState("Submitted manual check-in.");
    return response;
  });
  ipcMain.handle("desktop:audio-status", async () => audioBridge?.getSummary?.() ?? null);
  ipcMain.handle("desktop:audio-rotate-pair-code", async () => audioBridge?.rotatePairCode?.() ?? null);
  ipcMain.handle("desktop:dashboard", async () => getDashboardSummary());
  ipcMain.handle("desktop:inbox-overview", async () => getInboxOverview());
  ipcMain.handle("desktop:ack-inbox-message", async (_event, messageId) => acknowledgeInboxMessage(messageId));
  ipcMain.handle("desktop:snooze-reminder", async (_event, messageId, minutes = snoozeMinutes) => snoozeReminder(messageId, minutes));
  ipcMain.handle("desktop:open-window", async (_event, options = {}) => {
    showMainWindow(options);
    return { ok: true };
  });
  ipcMain.handle("desktop:dismiss-permissions-prompt", async () => {
    updateDesktopState((state) => {
      dismissPermissionsPrompt(state);
    });
    publishStatus("Dismissed permissions prompt.");
    return buildPermissionsPromptState(desktopState);
  });
  ipcMain.handle("desktop:set-window-title-capture", async (_event, enabled) => {
    updateDesktopState((state) => {
      setWindowTitleCaptureEnabled(state, enabled);
    });
    publishStatus(desktopState.settings.recordWindowTitles ? "Window title capture enabled." : "Window title capture disabled.");
    return buildStatusPayload();
  });
  ipcMain.handle("wayfinder:status", async () => wayfinderClient?.getStatus?.() ?? null);
  ipcMain.handle("wayfinder:refresh", async () => {
    const status = await wayfinderClient.refresh();
    publishStatus("Wayfinder state refreshed.");
    return status;
  });
  ipcMain.handle("wayfinder:grant-consent", async () => {
    const grant = await wayfinderClient.grantConsent();
    publishStatus("Wayfinder consent granted.");
    return { grant, status: wayfinderClient.getStatus() };
  });
  ipcMain.handle("wayfinder:capture", async (_event, summary) => {
    const result = await wayfinderClient.capture(summary);
    publishStatus("Wayfinder situation captured.");
    return { result, status: wayfinderClient.getStatus() };
  });
  ipcMain.handle("wayfinder:confirm", async (_event, status = "confirmed") => {
    const result = await wayfinderClient.confirm(status);
    publishStatus(status === "confirmed" ? "Wayfinder situation confirmed." : "Wayfinder situation dismissed.");
    return { result, status: wayfinderClient.getStatus() };
  });
  ipcMain.handle("wayfinder:select-option", async (_event, optionId) => {
    const decision = await wayfinderClient.selectOption(optionId);
    publishStatus("Wayfinder choice recorded.");
    return { decision, status: wayfinderClient.getStatus() };
  });
}

bootstrap().catch((error) => {
  console.error(error);
  app.exit(1);
});
