const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mindanchorDesktop", {
  getStatus: () => ipcRenderer.invoke("desktop:status"),
  flushQueue: () => ipcRenderer.invoke("desktop:flush"),
  emitSignal: (eventType, payload = {}) => ipcRenderer.invoke("desktop:emit", eventType, payload),
  submitCheckin: (payload) => ipcRenderer.invoke("desktop:checkin", payload),
  getDashboard: () => ipcRenderer.invoke("desktop:dashboard"),
  getInboxOverview: () => ipcRenderer.invoke("desktop:inbox-overview"),
  ackInboxMessage: (messageId) => ipcRenderer.invoke("desktop:ack-inbox-message", messageId),
  snoozeReminder: (messageId, minutes = 15) => ipcRenderer.invoke("desktop:snooze-reminder", messageId, minutes),
  openMainWindow: (options = {}) => ipcRenderer.invoke("desktop:open-window", options),
  dismissPermissionsPrompt: () => ipcRenderer.invoke("desktop:dismiss-permissions-prompt"),
  setWindowTitleCaptureEnabled: (enabled) => ipcRenderer.invoke("desktop:set-window-title-capture", Boolean(enabled)),
  wayfinder: {
    getStatus: () => ipcRenderer.invoke("wayfinder:status"),
    refresh: () => ipcRenderer.invoke("wayfinder:refresh"),
    grantConsent: () => ipcRenderer.invoke("wayfinder:grant-consent"),
    capture: (summary) => ipcRenderer.invoke("wayfinder:capture", summary),
    confirm: (status = "confirmed") => ipcRenderer.invoke("wayfinder:confirm", status),
    selectOption: (optionId) => ipcRenderer.invoke("wayfinder:select-option", optionId),
  },
  onStatus: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("desktop:status", listener);
    return () => ipcRenderer.removeListener("desktop:status", listener);
  },
  onCommand: (handler) => {
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("desktop:command", listener);
    return () => ipcRenderer.removeListener("desktop:command", listener);
  },
});
