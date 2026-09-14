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

/// Labels for the scheduler's skip reasons, so the UI can say *why* it is not
/// uploading instead of leaving the user to guess.
const SKIP_LABELS = {
  flush: "将执行上传",
  Disabled: "自动上传已关闭",
  CollectionOff: "采集未开启",
  UploadSwitchOff: "上传开关未开",
  EndpointNotConfigured: "端点未配置",
  QueueEmpty: "队列为空",
};

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

    // Relay status. Secrets are never echoed back: only whether they are set.
    $("u-endpoint").textContent = status.endpoint ?? "（未配置）";
    $("u-token").textContent = status.token_configured ? "已设置" : "未设置";
    $("u-pin").textContent = status.certificate_pin_configured ? "已固定" : "未固定";

    const upload = await invoke("upload_status");
    $("u-queue").textContent =
      `待发 ${upload.pending} · 已送达 ${upload.delivered} · 失败 ${upload.failed}`;
    $("f-endpoint").value = upload.endpoint ?? "";
    $("f-interval").value = String(upload.upload_interval_ms ?? 0);
    // Only prefill the interval when it matches a known option, so a value set
    // elsewhere is not silently rewritten to the first option.
    if ($("f-interval").value !== String(upload.upload_interval_ms ?? 0)) {
      $("f-interval").value = "0";
    }

    const tick = await invoke("upload_schedule_preview");
    $("u-tick").textContent = SKIP_LABELS[tick.reason] ?? tick.reason;

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

$("save-relay").addEventListener("click", async () => {
  if (!invoke) return;
  try {
    await invoke("set_upload_endpoint", {
      endpoint: $("f-endpoint").value,
      // Empty means "clear", which the backend turns into None rather than an
      // empty string that would look configured.
      token: $("f-token").value,
      certificatePin: $("f-pin").value,
    });
    await invoke("set_upload_interval", {
      intervalMs: Number($("f-interval").value),
    });
    // Clear the secret fields after a successful save: the backend never echoes
    // them back, so leaving them populated would misrepresent stored state.
    $("f-token").value = "";
    $("f-pin").value = "";
    await refresh();
  } catch (error) {
    renderError(`保存失败：${error}`);
  }
});

$("flush").addEventListener("click", async () => {
  if (!invoke) return;
  try {
    await invoke("flush_uploads", { limit: 20 });
    await refresh();
  } catch (error) {
    renderError(`上传失败：${error}`);
  }
});

void refresh();
setInterval(() => void refresh(), 10_000);
