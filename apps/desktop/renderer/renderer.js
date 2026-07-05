const statusText = document.getElementById("status-text");
const queueMeta = document.getElementById("queue-meta");
const collectorSummary = document.getElementById("collector-summary");
const dashboardState = document.getElementById("dashboard-state");
const dashboardRecovery = document.getElementById("dashboard-recovery");
const permissionCard = document.getElementById("permissions-card");
const permissionList = document.getElementById("permissions-list");
const dismissPermissionsButton = document.getElementById("dismiss-permissions");
const flushButton = document.getElementById("flush-button");
const refreshButton = document.getElementById("refresh-button");
const checkinButton = document.getElementById("checkin-button");
const focusInput = document.getElementById("focus-input");
const energyInput = document.getElementById("energy-input");
const moodInput = document.getElementById("mood-input");
const focusValue = document.getElementById("focus-value");
const energyValue = document.getElementById("energy-value");
const moodValue = document.getElementById("mood-value");
const noteInput = document.getElementById("note-input");
const goalCount = document.getElementById("goal-count");
const taskCount = document.getElementById("task-count");
const interventionCount = document.getElementById("intervention-count");
const reminderList = document.getElementById("reminder-list");
const reminderMeta = document.getElementById("reminder-meta");

let latestStatus = null;

function syncRanges() {
  focusValue.textContent = focusInput.value;
  energyValue.textContent = energyInput.value;
  moodValue.textContent = moodInput.value;
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function renderPermissions(permissions) {
  permissionList.replaceChildren();
  if (!permissions?.visible) {
    permissionCard.hidden = true;
    return;
  }

  permissionCard.hidden = false;
  for (const itemText of permissions.items ?? []) {
    const item = document.createElement("li");
    item.textContent = itemText;
    permissionList.appendChild(item);
  }
}

function renderCollector(status) {
  const collector = status?.collector ?? {};
  const activitySummary = collector.activitySummary ?? {};
  statusText.textContent = status?.message ?? "Ready.";
  queueMeta.textContent = [
    `API ${status?.apiBaseUrl ?? "—"}`,
    `队列 ${collector.queueLength ?? 0}`,
    `最近同步 ${formatDateTime(collector.lastFlushAt)}`,
    collector.lastFlushError ? `失败：${collector.lastFlushError}` : "同步正常",
  ].join(" · ");

  collectorSummary.innerHTML = "";
  const items = [
    `当前前台应用：${collector.lastFrontmostApp || "未获取"}`,
    `最近 idle 秒数：${collector.lastIdleSeconds ?? 0}`,
    `最近锁屏：${formatDateTime(activitySummary.lastLockAt)}`,
    `最近解锁：${formatDateTime(activitySummary.lastUnlockAt)}`,
    `1h active_app：${activitySummary.activeAppCount ?? 0}`,
    `1h window_switch：${activitySummary.windowSwitchCount ?? 0}`,
    `1h idle：${activitySummary.idleCount ?? 0}`,
    collector.frontmostAppAvailable === false ? `前台应用采集不可用：${collector.lastFrontmostAppError ?? "请检查权限"}` : "前台应用采集可用",
  ];

  for (const itemText of items) {
    const item = document.createElement("li");
    item.textContent = itemText;
    collectorSummary.appendChild(item);
  }
}

function renderDashboard(summary) {
  goalCount.textContent = String(summary?.goalCount ?? 0);
  taskCount.textContent = String(summary?.taskCount ?? 0);
  interventionCount.textContent = String(summary?.openInterventions ?? 0);
  dashboardState.textContent = summary?.latestAssessment?.summary ?? "暂无状态评估。";
  dashboardRecovery.textContent = summary?.latestRecoveryPlan?.nextStep ?? "暂无恢复建议。";
}

function buildReminderActions(message) {
  const actions = document.createElement("div");
  actions.className = "inline";

  const snoozeButton = document.createElement("button");
  snoozeButton.className = "secondary";
  snoozeButton.textContent = "稍后 15 分钟";
  snoozeButton.addEventListener("click", async () => {
    await window.mindanchorDesktop.snoozeReminder(message.id, 15);
    await refreshAll();
  });

  const ackButton = document.createElement("button");
  ackButton.className = "primary";
  ackButton.textContent = "标记已处理";
  ackButton.disabled = message.status !== "pending";
  ackButton.addEventListener("click", async () => {
    await window.mindanchorDesktop.ackInboxMessage(message.id);
    await refreshAll();
  });

  const openButton = document.createElement("button");
  openButton.className = "secondary";
  openButton.textContent = "打开主窗口";
  openButton.addEventListener("click", async () => {
    await window.mindanchorDesktop.openMainWindow({ focusReminders: true });
  });

  actions.append(snoozeButton, ackButton, openButton);
  return actions;
}

function renderReminders(status, inboxOverview) {
  const reminders = status?.reminders ?? {};
  const messages = inboxOverview?.messages ?? reminders.latestInboxOverview?.messages ?? [];
  reminderList.replaceChildren();
  reminderMeta.textContent = [
    `最近拉取 ${formatDateTime(reminders.lastInboxPollAt)}`,
    `待处理桌面提醒 ${reminders.pendingDesktopLocalCount ?? 0}`,
    `本地 snooze ${Object.keys(reminders.snoozedUntilByMessageId ?? {}).length}`,
    reminders.lastInboxPollError ? `拉取失败：${reminders.lastInboxPollError}` : "提醒同步正常",
  ].join(" · ");

  if (messages.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "暂无提醒。";
    reminderList.appendChild(empty);
    return;
  }

  for (const message of messages.slice(0, 10)) {
    const item = document.createElement("li");
    item.className = "message-card";

    const title = document.createElement("strong");
    title.textContent = message.title ?? "未命名提醒";

    const meta = document.createElement("p");
    meta.className = "muted";
    const snoozedUntil = reminders.snoozedUntilByMessageId?.[message.id];
    meta.textContent = [
      `渠道 ${message.channel ?? "—"}`,
      `状态 ${message.status ?? "—"}`,
      `创建于 ${formatDateTime(message.createdAt)}`,
      snoozedUntil ? `snooze 到 ${formatDateTime(snoozedUntil)}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const body = document.createElement("p");
    body.textContent = message.message ?? message.summary ?? "无提醒内容。";

    item.append(title, meta, body, buildReminderActions(message));
    reminderList.appendChild(item);
  }
}

async function refreshAll() {
  latestStatus = await window.mindanchorDesktop.getStatus();
  renderCollector(latestStatus);
  renderPermissions(latestStatus.permissions);
  renderDashboard(await window.mindanchorDesktop.getDashboard());
  renderReminders(latestStatus, await window.mindanchorDesktop.getInboxOverview());
}

window.mindanchorDesktop.onStatus((payload) => {
  latestStatus = payload;
  renderCollector(payload);
  renderPermissions(payload.permissions);
  void window.mindanchorDesktop.getDashboard().then(renderDashboard);
  void window.mindanchorDesktop.getInboxOverview().then((overview) => renderReminders(payload, overview));
});

window.mindanchorDesktop.onCommand((payload) => {
  if (payload?.type === "focus-reminders") {
    document.getElementById("reminders-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

[focusInput, energyInput, moodInput].forEach((input) => input.addEventListener("input", syncRanges));
syncRanges();

dismissPermissionsButton.addEventListener("click", async () => {
  await window.mindanchorDesktop.dismissPermissionsPrompt();
  await refreshAll();
});

flushButton.addEventListener("click", async () => {
  await window.mindanchorDesktop.flushQueue();
  await refreshAll();
});

refreshButton.addEventListener("click", async () => {
  await refreshAll();
});

checkinButton.addEventListener("click", async () => {
  await window.mindanchorDesktop.submitCheckin({
    focusScore: Number(focusInput.value),
    energyScore: Number(energyInput.value),
    moodScore: Number(moodInput.value),
    note: noteInput.value,
  });
  noteInput.value = "";
  await refreshAll();
});

void refreshAll();
