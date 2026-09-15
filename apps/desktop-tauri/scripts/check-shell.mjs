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

if (!/id="f-token"[\s\S]{0,200}?type="password"/.test(html)) {
  failures.push("index.html: the token field must be type=password");
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

if (failures.length) {
  console.error("desktop-tauri shell check FAILED:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("desktop-tauri shell check passed (shadow-mode invariants hold)");
