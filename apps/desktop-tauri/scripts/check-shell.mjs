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

if (failures.length) {
  console.error("desktop-tauri shell check FAILED:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("desktop-tauri shell check passed (shadow-mode invariants hold)");
