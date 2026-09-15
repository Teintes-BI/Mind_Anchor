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
    unauthorized: "令牌被拒绝（401），可尝试「立即续期令牌」",
    consent_required: "尚未授予同意，无法记录笔记",
    empty_note: "笔记内容为空",
    option_unavailable: "该方案已失效，请重新读取",
  };

  // The server's own message, when it sent one. `HttpStatus` carries the body
  // verbatim, and without this the panel printed the whole nested structure
  // (`{"http_status":{"message":"{\"message\":\"Invalid request.\"...`) instead
  // of the sentence inside it. Reported by the user, who saw exactly that.
  const serverMessage = (value) => {
    if (value == null || typeof value !== "object") return null;
    const raw = value.http_status?.message ?? value.message;
    if (typeof raw !== "string") return null;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.message === "string") {
        // Validation failures name the offending field, which is the part worth
        // surfacing: "actionStatus" beats "Invalid request."
        const issue = Array.isArray(parsed.issues) ? parsed.issues[0] : null;
        return issue?.path?.length
          ? `${parsed.message}（${issue.path.join(".")}：${issue.message ?? ""}）`
          : parsed.message;
      }
    } catch {
      // Not JSON; fall through and use it as-is.
    }
    return raw.length > 240 ? `${raw.slice(0, 240)}…` : raw;
  };

  const unwrap = (value, depth = 0) => {
    if (typeof value === "string") return REASONS[value] ?? value;
    if (value == null || typeof value !== "object" || depth > 4) {
      return String(value ?? "");
    }
    // The server's sentence first: it is written for a human and names the
    // offending field, which the generic labels below cannot.
    const fromServer = serverMessage(value);
    if (fromServer) return fromServer;
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

    // The home view repeats the quiet window next to the judgement, because
    // "why is it silent" is usually the quiet hours rather than the activity.
    $("quiet-source").textContent = quietWindow
      ? `静默时段来自本机学习结果：${String(quietWindow.start_hour).padStart(2, "0")}:00–${String(
          quietWindow.end_hour,
        ).padStart(2, "0")}:00（可在上方关闭）`
      : "静默时段当前已关闭，判定不会因时段而静默。";

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

    // Renewal state. Showing hours-to-expiry is the point: a token that lapses
    // turns every upload into a 401, and without this the panel gives no hint
    // that anything is about to break.
    if (!upload.refresh_token_configured) {
      $("u-renew").textContent = "未配置刷新令牌（令牌过期后需手动更换）";
    } else if (upload.token_expires_in_hours === null) {
      $("u-renew").textContent = "已配置（到期时间未知）";
    } else {
      const hours = upload.token_expires_in_hours;
      // Defensive: a stored expiry far in the past is stale state, not a
      // meaningful countdown. Rendering it raw once produced "-497075 小时",
      // which reads as a broken clock rather than an expired token.
      if (hours < -24) {
        $("u-renew").textContent = "已配置 · 到期时间无效，点「立即续期令牌」重建";
      } else if (hours <= 0) {
        $("u-renew").textContent = "已配置 · 已过期，将自动续期";
      } else {
        $("u-renew").textContent = `已配置 · 约 ${hours} 小时后到期`;
      }
    }

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
  const payload = {
    endpoint: typed("f-endpoint"),
    token: typed("f-token"),
    certificatePin: typed("f-pin"),
    refreshToken: typed("f-refresh"),
  };

  try {
    await invoke("set_upload_endpoint", payload);
    await invoke("set_upload_interval", {
      intervalMs: Number($("f-interval").value),
    });
    // Clear only the token, and only after a successful save: it is the one
    // value the backend deliberately never echoes back, so leaving it on screen
    // would misrepresent what is stored. The pin stays visible because the user
    // needs to be able to check it against the server by eye. The refresh token
    // is cleared for the same reason as the access token.
    $("f-token").value = "";
    $("f-refresh").value = "";
    await refresh();
    renderError("中继配置已保存", "save-relay");
  } catch (error) {
    // Report next to the button and keep the typed values so the user can
    // correct them instead of retyping from scratch.
    renderError(`保存失败：${formatError(error)}`, "save-relay");
  }
});

$("renew-token").addEventListener("click", async () => {
  if (!invoke) return;
  try {
    // Recovery path for an already-expired token, so the user is not stuck
    // waiting for the scheduled margin to come round.
    const result = await invoke("renew_token_now");
    await refresh();
    const hours = result.token_expires_in_hours;
    renderError(
      hours === null ? "已续期（到期时间未知）" : `已续期：约 ${hours} 小时后到期`,
      "renew-token",
    );
  } catch (error) {
    renderError(`续期失败：${formatError(error)}`, "renew-token");
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

// Render the reminder inbox.
//
// `reachable: false` is a normal outcome, not an exception: the relay may be
// down, the token stale, or the response self-contradicting. In every case the
// reason is shown in the state line rather than left to guesswork.
function renderInbox(view) {
  const list = $("inbox-list");
  list.replaceChildren();

  if (!view.reachable) {
    $("i-state").textContent = "读取失败";
    $("i-pending").textContent = "—";
    $("i-interventions").textContent = "—";
    $("i-acked").textContent = "—";
    const empty = $("inbox-empty");
    empty.hidden = false;
    empty.textContent = view.error ?? "无法读取收件箱。";
    return;
  }

  $("i-state").textContent = "已连接";
  $("i-pending").textContent = String(view.pending_count);
  $("i-interventions").textContent = String(view.open_interventions);
  $("i-acked").textContent = String(view.acknowledged_count);

  // A pending reminder is the one thing worth signalling through the tray: the
  // window is usually hidden, so without this the user has to open the panel to
  // learn there was anything to see. Fired only when the count is non-zero, so
  // an ordinary empty read does not colour the icon.
  if (view.pending_count > 0) {
    invoke("flash_tray_attention").catch(() => {
      // The tray is a convenience; a failure here must not break the panel.
    });
  }

  const empty = $("inbox-empty");
  empty.hidden = view.messages.length > 0;
  empty.textContent = "没有待处理的提醒。";

  for (const message of view.messages) {
    const item = document.createElement("li");
    item.className = "inbox-item";

    const title = document.createElement("p");
    title.className = "inbox-title";
    title.textContent = message.title;

    const body = document.createElement("p");
    body.className = "inbox-body";
    body.textContent = message.body;

    const meta = document.createElement("p");
    meta.className = "hint";
    // textContent throughout: the title and body come from the server and must
    // never be interpolated as markup.
    meta.textContent = `${message.channel_label} · ${message.created_at}`;

    const ack = document.createElement("button");
    ack.type = "button";
    ack.textContent = "确认";
    ack.addEventListener("click", async () => {
      ack.disabled = true;
      try {
        const updated = await invoke("inbox_acknowledge", { messageId: message.id });
        renderInbox(updated);
      } catch (error) {
        ack.disabled = false;
        renderError(`确认失败：${formatError(error)}`, "inbox-refresh");
      }
    });

    item.append(title, body, meta, ack);
    list.append(item);
  }
}

async function refreshInbox() {
  if (!invoke) return;
  try {
    renderInbox(await invoke("inbox_overview"));
  } catch (error) {
    renderInbox({ reachable: false, error: formatError(error), messages: [] });
  }
}

$("inbox-refresh").addEventListener("click", async () => {
  if (!invoke) return;
  await refreshInbox();
});

// Render the Wayfinder panel.
//
// The note box is left untouched by rendering: it holds text the user typed and
// has not submitted, and clearing it on every poll would destroy their input.

// The situation id from the most recent render, so a button click acts on the
// situation the user was looking at rather than on whatever the server returns
// if it is re-fetched between render and click.
let lastSituationId = null;

function currentSituationId() {
  return lastSituationId;
}

function renderWayfinder(view) {
  const list = $("wf-options");
  list.replaceChildren();
  lastSituationId = view.situation ? view.situation.id : null;

  const empty = $("wf-empty");
  if (!view.reachable) {
    $("w-state").textContent = "读取失败";
    $("w-consent").textContent = "—";
    $("w-situation").textContent = "—";
    $("w-risk").textContent = "—";
    empty.hidden = false;
    empty.textContent = view.error ?? "无法读取 Wayfinder。";
    return;
  }

  $("w-state").textContent = "已连接";
  $("w-consent").textContent = view.consent_granted ? "已授予" : "未授予";

  const situation = view.situation;
  $("w-situation").textContent = situation ? situation.summary : "无";
  $("w-risk").textContent = situation ? situation.risk_level : "—";

  // The button is disabled rather than hidden, so the reason it is unavailable
  // stays visible on the panel instead of the control vanishing.
  // Confirming is only meaningful while awaiting confirmation; once confirmed
  // the work is choosing an option, so the button says so.
  const confirmButton = $("wf-confirm");
  const awaiting = situation !== null && situation.status === "awaiting_confirmation";
  confirmButton.disabled = !awaiting;
  confirmButton.textContent = situation
    ? awaiting
      ? "确认情境"
      : "已确认"
    : "确认情境";

  if (!situation) {
    empty.hidden = false;
    empty.textContent = view.consent_granted
      ? "没有待处理的情境。记录一条笔记即可开始。"
      : "先授予同意，然后记录一条笔记。";
    return;
  }

  empty.hidden = view.options.length > 0;
  empty.textContent = awaiting
    ? "该情境还没有生成方案。点「确认情境」让中继生成。"
    : "该情境没有可选方案。";

  for (const option of view.options) {
    const item = document.createElement("li");
    item.className = "inbox-item";

    const action = document.createElement("p");
    action.className = "inbox-title";
    action.textContent = option.action;

    const step = document.createElement("p");
    step.className = "inbox-body";
    step.textContent = `第一步：${option.first_step}`;

    const rationale = document.createElement("p");
    rationale.className = "hint";
    rationale.textContent = option.rationale;

    // Risky options say so before the click, not after.
    if (option.requires_approval) {
      const warning = document.createElement("p");
      warning.className = "needs-approval";
      warning.textContent = `需要确认（风险：${option.risk_level}）`;
      item.append(action, step, rationale, warning);
    } else {
      item.append(action, step, rationale);
    }

    const choose = document.createElement("button");
    choose.type = "button";
    choose.textContent = "选这个";
    choose.addEventListener("click", async () => {
      choose.disabled = true;
      try {
        renderWayfinder(
          await invoke("wayfinder_select_option", {
            situationId: situation.id,
            optionId: option.id,
          }),
        );
      } catch (error) {
        choose.disabled = false;
        renderError(`选择失败：${formatError(error)}`, "wf-refresh");
      }
    });

    item.append(choose);
    list.append(item);
  }
}

async function refreshWayfinder() {
  if (!invoke) return;
  try {
    renderWayfinder(await invoke("wayfinder_state"));
  } catch (error) {
    renderWayfinder({ reachable: false, error: formatError(error), options: [] });
  }
}

// All three mutating calls return the new state, so the panel always reflects
// what the server reported rather than what the client assumed.
async function wayfinderAction(operation, label) {
  try {
    renderWayfinder(await operation());
  } catch (error) {
    renderError(`${label}失败：${formatError(error)}`, "wf-refresh");
  }
}

$("wf-refresh").addEventListener("click", async () => {
  if (!invoke) return;
  await refreshWayfinder();
});

$("wf-grant").addEventListener("click", async () => {
  if (!invoke) return;
  await wayfinderAction(() => invoke("wayfinder_grant_consent"), "授予同意");
});

$("wf-confirm").addEventListener("click", async () => {
  if (!invoke) return;
  // The id is read from the last render rather than re-fetched, so the click
  // applies to the situation the user was looking at.
  const situationId = currentSituationId();
  if (!situationId) {
    renderError("没有可确认的情境", "wf-confirm");
    return;
  }
  await wayfinderAction(
    () => invoke("wayfinder_confirm", { situationId }),
    "确认情境",
  );
});

$("wf-capture").addEventListener("click", async () => {
  if (!invoke) return;
  const note = $("f-note").value.trim();
  if (!note) {
    renderError("请先填写笔记", "wf-capture");
    return;
  }
  // Cleared only on success: a failed capture must not lose what was typed.
  try {
    const view = await invoke("wayfinder_capture", { note });
    $("f-note").value = "";
    renderWayfinder(view);
  } catch (error) {
    renderError(`记录失败：${formatError(error)}`, "wf-capture");
  }
});

void refresh();
void refreshInbox();
void refreshWayfinder();
setInterval(() => void refresh(), 10_000);

// Tab switching. Both views are in the DOM from the start and one is hidden,
// so switching costs nothing and no state is lost between them.
function showTab(name) {
  const home = name === "home";
  $("view-home").hidden = !home;
  $("view-settings").hidden = home;
  $("tab-home").classList.toggle("is-active", home);
  $("tab-settings").classList.toggle("is-active", !home);
  $("tab-home").setAttribute("aria-selected", String(home));
  $("tab-settings").setAttribute("aria-selected", String(!home));
}

$("tab-home").addEventListener("click", () => showTab("home"));
$("tab-settings").addEventListener("click", () => showTab("settings"));
showTab("home");
