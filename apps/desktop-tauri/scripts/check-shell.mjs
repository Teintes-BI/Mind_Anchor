// Guards the frontend shell the same way `node --check` guards the Electron
// app: parse every source file and assert the shadow-mode invariants hold.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "..", "src");

const files = ["main.js", "index.html"];
const failures = [];

for (const file of files) {
  const text = readFileSync(join(src, file), "utf8");

  if (/\b(from|require\()\s*["']https?:/.test(text)) {
    failures.push(`${file}: must not import a remote module`);
  }

  if (file.endsWith(".js") && !text.trim().length) {
    failures.push(`${file}: is empty`);
  }
}

// The shell must never contain a notification or popup call: Phase 0 is shadow
// mode, so the only permitted presentation of a decision is text on the page.
const shell = readFileSync(join(src, "main.js"), "utf8");
for (const forbidden of [
  "Notification",
  "requestPermission",
  "alert(",
  "confirm(",
  "prompt(",
  "new Audio",
  "window.open",
]) {
  if (shell.includes(forbidden)) {
    failures.push(`main.js: shadow mode forbids ${forbidden}`);
  }
}

const html = readFileSync(join(src, "index.html"), "utf8");
if (/<script[^>]+src=["']https?:/.test(html)) {
  failures.push("index.html: must not load a remote script");
}

// T2 added a relay client. Two properties must survive future edits:
//
// 1. The UI must never invent a destination. A hardcoded endpoint would defeat
//    the rule that an unconfigured relay means "send nowhere".
// 2. The token field must be a password input so a secret is not rendered in
//    the clear on screen.
const hardcodedEndpoint = /https?:\/\/(?!host:port)[a-z0-9.-]+\.[a-z]{2,}[^\s"']*/i;
for (const file of ["main.js", "index.html"]) {
  const text = readFileSync(join(src, file), "utf8");
  for (const line of text.split(/\r?\n/)) {
    // Ignore the placeholder, which is illustrative rather than a default.
    if (line.includes("placeholder")) continue;
    if (hardcodedEndpoint.test(line)) {
      failures.push(`${file}: must not hardcode a relay endpoint -> ${line.trim()}`);
    }
  }
}

// Credential fields must be type=password. Each one is checked separately, and
// the match is anchored to the element it names: an earlier version allowed 200
// characters between the id and the type, so once a second password field
// existed the pattern could be satisfied by the wrong element - the token guard
// kept passing while the token field itself was downgraded to text.
for (const field of ["f-token", "f-refresh"]) {
  const at = html.indexOf(`id="${field}"`);
  if (at < 0) {
    failures.push(`index.html: the ${field} field is missing`);
    continue;
  }
  // Look only inside this tag: from the id to the next '>' and no further.
  const tagEnd = html.indexOf(">", at);
  const tag = html.slice(at, tagEnd < 0 ? at + 200 : tagEnd);
  if (!/type="password"/.test(tag)) {
    failures.push(`index.html: the ${field} field must be type=password`);
  }
}

// Where is the endpoint read from? It must come from Rust state, never from a
// literal in the shell.
if (!shell.includes('invoke("upload_status")')) {
  failures.push("main.js: relay config must be read from the backend");
}

// Every error shown to the user must go through formatError. Interpolating the
// raw value is exactly how "[object Object]" reached the screen and made a
// rejected save undiagnosable.
if (!shell.includes("function formatError(")) {
  failures.push("main.js: formatError is required to render backend errors");
}
for (const [lineNumber, line] of shell.split(/\r?\n/).entries()) {
  // Only look inside a template literal interpolation, i.e. ${...}.
  const interpolation = line.match(/\$\{([^}]*)\}/g) ?? [];
  for (const token of interpolation) {
    const inner = token.slice(2, -1);
    if (/\berror\b/.test(inner) && !inner.includes("formatError")) {
      failures.push(
        `main.js:${lineNumber + 1}: interpolate errors via formatError, not the raw value -> ${inner}`,
      );
    }
  }
}

// A save must never destroy what the user typed, and must never wipe stored
// configuration because a box was left blank. Both regressions shipped once:
// the form was submitted with "" for untouched fields (which the backend reads
// as "clear"), and every refresh overwrote the endpoint box.
if (!/\.trim\(\) === "" \? null : /.test(shell)) {
  failures.push("main.js: untouched relay fields must not be sent as empty strings");
}
if (!shell.includes('$("f-endpoint").value.trim() === ""')) {
  failures.push("main.js: refresh must not overwrite a half-typed endpoint");
}
// The token may be cleared after a successful save, but the pin must stay
// visible so the user can check it against the server.
if (/\$\("f-pin"\)\.value = "";/.test(shell)) {
  failures.push("main.js: the pin field must not be cleared; it is not a secret");
}

// The relay panel's fields live on upload_status, not collector_status.
// Reading e.g. `status.endpoint` yields undefined and reports "（未配置）" for a
// working relay, which was reported as "the configuration does not stick".
for (const field of ["endpoint", "token_configured", "certificate_pin_configured"]) {
  if (new RegExp(`status\\.${field}\\b`).test(shell)) {
    failures.push(`main.js: ${field} must be read from upload_status, not collector_status`);
  }
}

// The refresh token is a credential: like the access token it must be a
// password field and must be cleared after a successful save.
if (!/<input[^>]+id="f-refresh"[^>]*type="password"/s.test(html)) {
  failures.push("index.html: the refresh token field must be type=password");
}
if (!/\$\("f-refresh"\)\.value = ""/.test(shell)) {
  failures.push("main.js: the refresh token must be cleared after a successful save");
}

// Reminder inbox. The panel reads server-controlled text, so it must render via
// textContent. innerHTML here would let a reminder title inject markup into the
// app's own window.
if (!html.includes('id="inbox-list"')) {
  failures.push("index.html: the inbox panel must be present");
}
if (!shell.includes('invoke("inbox_overview")')) {
  failures.push("main.js: the inbox must be readable from the backend");
}
// Answering a reminder records *why*, not just that it was seen. The plain
// acknowledge path is no longer used: the three responses carry the reason, and
// the server stores the reason alongside the acknowledgement.
if (!shell.includes('invoke("inbox_respond"')) {
  failures.push("main.js: a reminder must be answerable");
}
// Every response the panel offers must be one the server will accept.
for (const response of ["start_chat", "i_am_fine", "dismissed"]) {
  if (!new RegExp(`"${response}"`).test(shell)) {
    failures.push(`main.js: the ${response} response must be reachable`);
  }
}
// Every assignment that touches server-sourced reminder text must be
// textContent. A `.innerHTML =` anywhere in the reminder renderer is the mistake
// this guards against.
//
// Boundaries are found with a regex rather than a literal "\nasync function":
// main.js uses CRLF, so an LF-only literal never matched, indexOf returned -1,
// and the slice silently ran to the end of the file - where renderWayfinder's
// code made the "no innerHTML" assertion pass for the wrong reason.
{
  const start = shell.search(/function renderInbox\s*\(/);
  const rest = start < 0 ? "" : shell.slice(start + 1);
  const nextFn = rest.search(/\r?\n(?:async\s+)?function\s+\w+/);
  const body = start < 0 ? "" : rest.slice(0, nextFn < 0 ? rest.length : nextFn);
  if (body.length === 0) {
    failures.push("main.js: renderInbox must exist");
  } else if (/\.innerHTML\s*=/.test(body)) {
    failures.push("main.js: renderInbox must not use innerHTML on reminder text");
  }
  if (body.length && !/\.textContent\s*=/.test(body)) {
    failures.push("main.js: renderInbox must render reminder text via textContent");
  }
}
// A failed read is an expected state, so the panel must render a reason instead
// of leaving the previous contents on screen as if they were current.
if (!shell.includes("view.reachable")) {
  failures.push("main.js: the inbox must distinguish a failed read from an empty one");
}

// The confirm button must be gated on the situation's status, not merely on a
// situation existing. Confirming an already-confirmed situation is not the
// action, and gating on existence alone left the panel offering a button whose
// only effect was a server error.
//
// Checking that the status string merely appears is not enough: the string is
// also used for the label, so a version that computed it and then ignored it
// when setting `disabled` would still pass. The assertion is on the binding.
{
  const awaitingAt = shell.indexOf('const awaiting = situation !== null && situation.status === "awaiting_confirmation"');
  const gatedAt = shell.indexOf("confirmButton.disabled = !awaiting");
  if (awaitingAt < 0) {
    failures.push("main.js: the awaiting-confirmation state must be derived from the status");
  } else if (gatedAt < 0) {
    failures.push(
      "main.js: the confirm button must be gated on awaiting confirmation, not on existence",
    );
  }
}

// Wayfinder. Same reasoning as the inbox: server-controlled text, and a capture
// that must not lose what the user typed.
if (!html.includes('id="wf-options"')) {
  failures.push("index.html: the Wayfinder panel must be present");
}
if (!shell.includes('invoke("wayfinder_state")')) {
  failures.push("main.js: Wayfinder state must be readable from the backend");
}
if (!shell.includes('invoke("wayfinder_grant_consent")')) {
  failures.push("main.js: consent must be grantable from the panel");
}
if (!shell.includes('invoke("wayfinder_capture"')) {
  failures.push("main.js: a note must be capturable from the panel");
}
if (!shell.includes('invoke("wayfinder_confirm"')) {
  failures.push("main.js: a situation must be confirmable from the panel");
}
if (!shell.includes('invoke("wayfinder_select_option"')) {
  failures.push("main.js: an option must be selectable from the panel");
}
{
  const start = shell.indexOf("function renderWayfinder");
  const renderer = shell.slice(start);
  const body = renderer.slice(0, renderer.indexOf("\nasync function refreshWayfinder"));
  if (start < 0 || body.length === 0) {
    failures.push("main.js: renderWayfinder must exist");
  } else if (/\.innerHTML\s*=/.test(body)) {
    failures.push("main.js: renderWayfinder must not use innerHTML");
  }
}
// The note must survive a failed capture. Clearing it on any outcome would
// destroy text the user typed whenever the relay happens to be down. The
// ordering check below is the real guard; this only asserts the clear exists.
if (!shell.includes('$("f-note").value = ""')) {
  failures.push("main.js: the note field must be cleared by the capture flow");
}
{
  // Slice to the end of the capture handler. `indexOf("});")` would stop at the
  // first nested call's braces, so this walks to the listener's own terminator.
  const start = shell.indexOf('$("wf-capture")');
  const rest = shell.slice(start);
  const end = rest.indexOf("});\n");
  const body = end > 0 ? rest.slice(0, end) : rest;
  const clearAt = body.indexOf('$("f-note").value = ""');
  const invokeAt = body.indexOf('invoke("wayfinder_capture"');
  if (invokeAt < 0) {
    failures.push("main.js: the capture handler must invoke wayfinder_capture");
  } else if (clearAt < 0) {
    failures.push("main.js: the capture handler must clear the note after success");
  } else if (clearAt < invokeAt) {
    failures.push("main.js: the note must not be cleared before the capture succeeds");
  }
}

// The decision body's actionStatus must be a member of the set the relay
// actually accepts. "planned" looked plausible and was rejected with a 400 that
// the user saw, so this asserts membership rather than trusting the literal.
{
  const allowed = ["not_started", "in_progress", "completed", "abandoned"];
  const m = shell.match(/actionStatus:\s*"([a-z_]+)"/);
  // Read from the same mirror the checker sees: the checker resolves the Rust
  // file relative to its own directory, so reading appRoot here could disagree
  // with what the checker actually validated.
  const rust = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "src-tauri", "src", "wayfinder", "mod.rs"),
    "utf8",
  );
  const rm = rust.match(/"actionStatus":\s*"([a-z_]+)"/);
  const sent = rm?.[1] ?? m?.[1];
  if (!sent) {
    failures.push("main.js: actionStatus could not be located");
  } else if (!allowed.includes(sent)) {
    failures.push(`actionStatus ${sent} is not one of ${allowed.join(" | ")}`);
  }
}

// A non-2xx response must not be printed as raw structure. The user saw
// `{"http_status":{"message":"{\"message\":\"Invalid request.\"..."` instead of
// the sentence inside it, which is unreadable and hides the useful part.
if (!/const serverMessage = \(value\)/.test(shell)) {
  failures.push("main.js: formatError must unwrap the server's own message");
}
if (!/const fromServer = serverMessage\(value\)/.test(shell)) {
  failures.push("main.js: the server message must be used by the unwrap chain");
}

// Renewal must be reachable by hand, so an expired token is recoverable without
// restarting the app or waiting for the margin.
if (!shell.includes('invoke("renew_token_now")')) {
  failures.push("main.js: the manual renew action must call renew_token_now");
}

// Closing the window must not quit. The app's value is that it runs while the
// user is doing something else, so reverting to the default close behaviour
// would silently stop collection the first time anyone dismissed the window.
// Checked against the Rust source, which is where the rule lives.
const traySource = readFileSync(join(root, "..", "src-tauri", "src", "tray.rs"), "utf8");
const rustLib = readFileSync(join(root, "..", "src-tauri", "src", "lib.rs"), "utf8");
const inboxSource = readFileSync(join(root, "..", "src-tauri", "src", "inbox", "mod.rs"), "utf8");
if (!/CloseRequested/.test(traySource) || !/prevent_close\(\)/.test(traySource)) {
  failures.push("tray.rs: a close request must be prevented, not acted on");
}
if (!/window\.hide\(\)/.test(traySource)) {
  failures.push("tray.rs: closing the window must hide it rather than quit");
}
if (!/tray::install/.test(rustLib)) {
  failures.push("lib.rs: the tray must be installed at setup");
}
if (!/tray::handle_window_event/.test(rustLib)) {
  failures.push("lib.rs: the window event handler must route to the tray rule");
}

// The attention colour must be gated on there being something to attend to.
// Firing it unconditionally would leave the tray permanently green, which is
// worse than no signal at all: it trains the user to ignore it.
if (!/pending_count > 0/.test(shell)) {
  failures.push("main.js: the tray flash must be gated on a pending count");
}
if (!/flash_tray_attention/.test(shell)) {
  failures.push("main.js: a pending reminder must flash the tray icon");
}
if (!/fn flash_tray_attention/.test(rustLib)) {
  failures.push("lib.rs: flash_tray_attention must exist as a command");
}
// The reset must be timed. Without it the attention colour never clears.
if (!/ATTENTION_MS/.test(traySource)) {
  failures.push("tray.rs: the attention colour must reset after a fixed window");
}

// Answering a reminder must clear the tray immediately. Relying on the timer
// would leave the icon asking for attention after the user had already dealt
// with the thing it was pointing at.
if (!/invoke\("clear_tray_attention"\)/.test(shell)) {
  failures.push("main.js: answering a reminder must clear the tray attention now");
}
if (!/fn clear_tray_attention/.test(rustLib)) {
  failures.push("lib.rs: clear_tray_attention must exist as a command");
}

// Reminders are shown one at a time. Rendering the whole list turns several
// decisions into a wall the user scrolls past.
if (!/inbox-position/.test(shell) || !/inboxIndex/.test(shell)) {
  failures.push("main.js: reminders must be paged one at a time");
}
// The home view shows either the reminder or the judgement, never both.
if (!/function showHomePane/.test(shell)) {
  failures.push("main.js: the home view must switch between reminder and judgement");
}

// A response must be one the server will accept, and an unknown one must be
// refused rather than silently dropped.
if (!/RESPONSES/.test(inboxSource)) {
  failures.push("inbox/mod.rs: the response set must be declared");
}
if (!/unknown reminder response/.test(inboxSource)) {
  failures.push("inbox/mod.rs: an unknown response must be rejected, not dropped");
}

if (failures.length) {
  console.error("desktop-tauri shell check FAILED:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("desktop-tauri shell check passed (shadow-mode invariants hold)");
