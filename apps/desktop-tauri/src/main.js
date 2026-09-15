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

// Human-readable text for an error coming back from a Tauri command.
//
// The backend returns a nested structure (`{ kind: "upload", reason: ... }`),
// so interpolating it directly produced the useless string "[object Object]"
// and made every failure undiagnosable. This flattens it to a sentence naming
// the specific reason.
//
// `reason` is declared as a bare snake_case variant name by serde, but an
// internally-tagged enum can also arrive wrapped, so both shapes are unwrapped.
function formatError(error) {
  if (error == null) return "未知错误";
  if (typeof error === "string") return error;

  const REASONS = {
    collection_disabled: "采集未开启",
    upload_disabled: "上传开关未开启",
    endpoint_not_configured: "端点未配置",
    insecure_endpoint_rejected: "端点必须是 https://（本地回环可用 http://）",
    empty_queue: "待上传队列为空",
    pin_required: "该 https 端点必须填写证书指纹",
    malformed_pin: "证书指纹格式错误（需要 64 位十六进制）",
    fingerprint_mismatch: "证书指纹不匹配，已中止上传",
    unreadable: "无法读取服务器证书",
  };

  const unwrap = (value, depth = 0) => {
    if (typeof value === "string") return REASONS[value] ?? value;
    if (value == null || typeof value !== "object" || depth > 4) {
      return String(value ?? "");
    }
    // Try the known wrappers in order, then fall back to the only string field.
    for (const key of ["reason", "message", "kind"]) {
      if (value[key] != null) return unwrap(value[key], depth + 1);
    }
    const strings = Object.values(value).filter((v) => typeof v === "string");
    if (strings.length === 1) return unwrap(strings[0], depth + 1);
    return JSON.stringify(value);
  };

  const detail = unwrap(error);
  // Transport/HTTP errors carry free-form context that is worth keeping.
  const context =
    (typeof error.message === "string" && error.message) ||
    (typeof error?.reason?.message === "string" && error.reason.message) ||
    null;
  if (context && context !== detail) return `${detail}（${context}）`;
  return detail || "未知错误";
}

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

function renderError(message, anchorId = "poll") {
  const existing = document.querySelector(".error");
  if (existing) existing.remove();
  const node = document.createElement("p");
  node.className = "error";
  node.textContent = message;
  // Anchor the message next to the control that failed. Previously this was
  // hardcoded to the sample button, so a failure from the relay panel showed up
  // in a different section and looked like nothing had happened.
  const anchor = $(anchorId) ?? $("poll");
  anchor.after(node);
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
    // The window is null when the rule is off; reading the hours off it
    // unconditionally would throw and take the whole refresh down.
    const quietWindow = status.quiet_hours_window;
    $("s-quiet").textContent = quietWindow
      ? `开启（${String(quietWindow.start_hour).padStart(2, "0")}:00–${String(
          quietWindow.end_hour,
        ).padStart(2, "0")}:00）`
      : "已关闭";
    $("s-level").textContent = status.data_level;
    $("s-interval").textContent = `${status.sample_interval_ms} ms`;
    $("s-samples").textContent = String(status.sample_count);
    $("s-decisions").textContent = String(status.decision_count);

    $("toggle-enabled").checked = status.collection_enabled;
    $("toggle-upload").checked = status.upload_enabled;
    $("toggle-quiet").checked = status.quiet_hours_enabled;

    // Relay status. These live on `upload_status`, NOT on `collector_status`:
    // StatusSnapshot carries no endpoint/token/pin fields at all, so reading
    // them off `status` produced `undefined` and the panel reported
    // "（未配置）" even for a relay that was configured and working. That
    // mismatch was reported as "configuration does not stick" and cost real
    // debugging time.
    const upload = await invoke("upload_status");

    // Secrets are never echoed back: only whether they are set.
    $("u-endpoint").textContent = upload.endpoint ?? "（未配置）";
    $("u-token").textContent = upload.token_configured ? "已设置" : "未设置";
    $("u-pin").textContent = upload.certificate_pin_configured ? "已固定" : "未固定";

    $("u-queue").textContent =
      `待发 ${upload.pending} · 已送达 ${upload.delivered} · 失败 ${upload.failed}`;

    // Only prefill the endpoint when the box is empty. Overwriting it on every
    // refresh would discard what the user is mid-way through typing, which is
    // how a failed save appeared to erase the form.
    if ($("f-endpoint").value.trim() === "") {
      $("f-endpoint").value = upload.endpoint ?? "";
    }

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
    renderError(`读取状态失败：${formatError(error)}`);
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
    renderError(`采样失败：${formatError(error)}`);
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

$("toggle-quiet").addEventListener("change", async (event) => {
  if (!invoke) return;
  try {
    await invoke("set_collection_state", { quietHoursEnabled: event.target.checked });
    await refresh();
  } catch (error) {
    renderError(`切换静默时段失败：${formatError(error)}`, "toggle-quiet");
  }
});

$("purge").addEventListener("click", async () => {
  if (!invoke) return;
  await invoke("purge_local_data");
  await refresh();
});

$("save-relay").addEventListener("click", async () => {
  if (!invoke) return;
  // Only send fields the user actually touched. The backend treats a missing
  // field as "leave as is" and an empty string as "clear", so sending "" for an
  // untouched box used to wipe the stored value - which is how a save attempt
  // could make a working configuration disappear.
  const typed = (id) => {
    const raw = $(id).value;
    return raw.trim() === "" ? null : raw;
  };
  const payload = {};
  const endpoint = typed("f-endpoint");
  const token = typed("f-token");
  const pin = typed("f-pin");
  if (endpoint !== null) payload.endpoint = endpoint;
  if (token !== null) payload.token = token;
  if (pin !== null) payload.certificatePin = pin;

  try {
    if (Object.keys(payload).length > 0) {
      await invoke("set_upload_endpoint", payload);
    }
    await invoke("set_upload_interval", {
      intervalMs: Number($("f-interval").value),
    });
    // Clear only the token, and only after a successful save: it is the one
    // value the backend deliberately never echoes back, so leaving it on screen
    // would misrepresent what is stored. The pin stays visible because the user
    // needs to be able to check it against the server by eye.
    $("f-token").value = "";
    await refresh();
    renderError("中继配置已保存", "save-relay");
  } catch (error) {
    // Report next to the button and keep the typed values so the user can
    // correct them instead of retyping from scratch.
    renderError(`保存失败：${formatError(error)}`, "save-relay");
  }
});

$("flush").addEventListener("click", async () => {
  if (!invoke) return;
  try {
    // One step: build the aggregate, enqueue it, then deliver. Calling flush
    // alone would report "queue empty" on a fresh install and look broken.
    const result = await invoke("send_now", { limit: 20 });
    await refresh();
    if (result.pending === 0 && result.failed === 0) {
      renderError(`上传完成：已送达 ${result.delivered} 条`, "flush");
    }
  } catch (error) {
    renderError(`上传失败：${formatError(error)}`, "flush");
  }
});

$("clear-failed").addEventListener("click", async () => {
  if (!invoke) return;
  try {
    // Failed rows are kept so they can be inspected, but nothing clears them
    // automatically, so without this the failure count is permanent noise.
    // Pending and delivered rows are untouched by the backend.
    const before = await invoke("upload_status");
    await invoke("clear_failed_uploads");
    await refresh();
    renderError(`已清除 ${before.failed} 条失败记录`, "clear-failed");
  } catch (error) {
    renderError(`清除失败：${formatError(error)}`, "clear-failed");
  }
});

void refresh();
setInterval(() => void refresh(), 10_000);
