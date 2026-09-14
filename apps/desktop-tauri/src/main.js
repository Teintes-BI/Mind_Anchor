// Frontend shell for Phase 0.
//
// Shadow mode is a hard constraint here, not a preference: this file contains
// no notification, popup, sound or dialog call. A decision is rendered as text
// on the page and nothing else. `scripts/check-shell.mjs` enforces that.

const invoke = window.__TAURI__?.core?.invoke;

const DECISION_LABELS = {
  interrupt: "值得打扰（仅记录）",
  defer: "暂不打扰",
  silence: "静默",
};

const REASON_LABELS = {
  idle_too_short: "用户正在操作",
  idle_too_long: "已离开太久",
  focus_too_brief: "专注时长不足",
  switch_storm: "窗口切换过于频繁",
  outside_quiet_hours: "处于静默时段",
  daily_budget_exhausted: "今日额度已用完",
  cooldown_active: "冷却中",
  eligible: "条件允许",
};

const $ = (id) => document.getElementById(id);

function renderError(message) {
  const existing = document.querySelector(".error");
  if (existing) existing.remove();
  const node = document.createElement("p");
  node.className = "error";
  node.textContent = message;
  $("poll").after(node);
}

async function refresh() {
  if (!invoke) {
    renderError("未检测到 Tauri 运行时；请通过 tauri 启动本应用。");
    return null;
  }
  try {
    const status = await invoke("collector_status");
    $("s-shadow").textContent = status.shadow_mode ? "Shadow（不打扰）" : "Active";
    $("s-enabled").textContent = status.collection_enabled ? "开启" : "关闭";
    $("s-title").textContent = status.capture_window_title ? "开启（已脱敏）" : "关闭（默认）";
    $("s-upload").textContent = status.upload_enabled ? "开启" : "关闭（默认）";
    $("s-level").textContent = status.data_level;
    $("s-interval").textContent = `${status.sample_interval_ms} ms`;
    $("s-samples").textContent = String(status.sample_count);
    $("s-decisions").textContent = String(status.decision_count);

    $("toggle-enabled").checked = status.collection_enabled;
    $("toggle-upload").checked = status.upload_enabled;

    if (status.last_decision) {
      renderDecision(status.last_decision);
    }
    if (status.last_sample) {
      const when = new Date(status.last_sample.observed_at_ms).toLocaleTimeString();
      $("d-sample").textContent =
        `样本 ${when} · 应用 ${status.last_sample.app || "（无）"} · 空闲 ${status.last_sample.idle_seconds}s`;
    }
    return status;
  } catch (error) {
    renderError(`读取状态失败：${error}`);
    return null;
  }
}

function renderDecision(view) {
  const label = DECISION_LABELS[view.decision] ?? view.decision;
  const node = $("d-decision");
  node.textContent = label;
  node.dataset.kind = view.decision;
  const reasons = (view.reasons ?? [])
    .map((code) => REASON_LABELS[code] ?? code)
    .join(" · ");
  $("d-reasons").textContent = reasons ? `理由：${reasons}　置信度 ${view.score}/100` : "";
}

$("poll").addEventListener("click", async () => {
  if (!invoke) return;
  try {
    const view = await invoke("poll_once");
    renderDecision(view);
    await refresh();
  } catch (error) {
    renderError(`采样失败：${error}`);
  }
});

$("toggle-enabled").addEventListener("change", async (event) => {
  if (!invoke) return;
  await invoke("set_collection_state", { enabled: event.target.checked });
  await refresh();
});

$("toggle-upload").addEventListener("change", async (event) => {
  if (!invoke) return;
  await invoke("set_collection_state", { uploadEnabled: event.target.checked });
  await refresh();
});

$("purge").addEventListener("click", async () => {
  if (!invoke) return;
  await invoke("purge_local_data");
  await refresh();
});

void refresh();
setInterval(() => void refresh(), 10_000);
