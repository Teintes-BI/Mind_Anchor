// Proves the endpoint guard in check-shell.mjs actually fires.
// Copies the shell sources to a temp dir, injects a hardcoded endpoint, runs
// the checker against the copy, and asserts it fails. Cleans up after itself.
import { mkdtempSync, readFileSync, writeFileSync, rmSync, cpSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");

function runChecker(root, scriptPath) {
  try {
    execFileSync(process.execPath, [scriptPath], {
      cwd: root,
      stdio: "pipe",
      encoding: "utf8",
    });
    return { failed: false, output: "" };
  } catch (error) {
    return { failed: true, output: (error.stdout ?? "") + (error.stderr ?? "") };
  }
}

const work = mkdtempSync(join(tmpdir(), "comma-shellcheck-"));
let failures = 0;

try {
  // Mirror the app layout the checker expects: <root>/src and <root>/scripts.
  mkdirSync(join(work, "src"), { recursive: true });
  mkdirSync(join(work, "scripts"), { recursive: true });
  cpSync(join(appRoot, "src", "main.js"), join(work, "src", "main.js"));
  cpSync(join(appRoot, "src", "index.html"), join(work, "src", "index.html"));
  cpSync(join(appRoot, "scripts", "check-shell.mjs"), join(work, "scripts", "check-shell.mjs"));
  // The actionStatus guard reads the Rust module, so the mirror needs it too.
  // Without this the checker throws ENOENT and every case "passes" by crashing.
  mkdirSync(join(work, "src-tauri", "src", "wayfinder"), { recursive: true });
  cpSync(
    join(appRoot, "src-tauri", "src", "wayfinder", "mod.rs"),
    join(work, "src-tauri", "src", "wayfinder", "mod.rs"),
  );
  const checker = join(work, "scripts", "check-shell.mjs");

  // 1. An untouched copy must pass, otherwise the negative tests prove nothing.
  const clean = runChecker(work, checker);
  if (clean.failed) {
    console.error("baseline failed unexpectedly:\n" + clean.output);
    failures += 1;
  } else {
    console.log("ok   baseline copy passes");
  }

  // 2. A hardcoded endpoint must be rejected.
  const mainPath = join(work, "src", "main.js");
  const original = readFileSync(mainPath, "utf8");
  writeFileSync(
    mainPath,
    `const DEFAULT_ENDPOINT = "https://evil.example.com/v1/core/events";\n${original}`,
  );
  const injected = runChecker(work, checker);
  if (injected.failed && /hardcode a relay endpoint/.test(injected.output)) {
    console.log("ok   hardcoded endpoint is rejected");
  } else {
    console.error("FAIL hardcoded endpoint was not rejected:\n" + injected.output);
    failures += 1;
  }
  writeFileSync(mainPath, original);

  // 3. A password field downgraded to text must be rejected.
  const htmlPath = join(work, "src", "index.html");
  const htmlOriginal = readFileSync(htmlPath, "utf8");
  writeFileSync(htmlPath, htmlOriginal.replace('id="f-token"\n            type="password"', 'id="f-token"\n            type="text"'));
  const relaxed = runChecker(work, checker);
  if (relaxed.failed && /type=password/.test(relaxed.output)) {
    console.log("ok   token field downgraded to text is rejected");
  } else {
    console.error("FAIL token field guard did not fire:\n" + relaxed.output);
    failures += 1;
  }
  writeFileSync(htmlPath, htmlOriginal);

  // 4. Removing the backend read must be rejected.
  //    Replace every occurrence: upload_status is called from more than one
  //    handler, and leaving one behind would mask the violation.
  writeFileSync(
    mainPath,
    original.split('invoke("upload_status")').join('invoke("collector_status")'),
  );
  const noBackend = runChecker(work, checker);
  if (noBackend.failed && /read from the backend/.test(noBackend.output)) {
    console.log("ok   missing backend read is rejected");
  } else {
    console.error("FAIL backend read guard did not fire:\n" + noBackend.output);
    failures += 1;
  }
  writeFileSync(mainPath, original);

  // 5. Interpolating a raw error must be rejected. This is the regression that
  //    put "[object Object]" on screen.
  writeFileSync(
    mainPath,
    original.replace("${formatError(error)}", "${error}"),
  );
  const rawError = runChecker(work, checker);
  if (rawError.failed && /interpolate errors via formatError/.test(rawError.output)) {
    console.log("ok   raw error interpolation is rejected");
  } else {
    console.error("FAIL raw-error guard did not fire:\n" + rawError.output);
    failures += 1;
  }
  writeFileSync(mainPath, original);

  // 6. formatError itself must stay present.
  writeFileSync(mainPath, original.replace("function formatError(error) {", "function gone(error) {"));
  const noFormatter = runChecker(work, checker);
  if (noFormatter.failed && /formatError is required/.test(noFormatter.output)) {
    console.log("ok   removing formatError is rejected");
  } else {
    console.error("FAIL formatError-presence guard did not fire:\n" + noFormatter.output);
    failures += 1;
  }
  writeFileSync(mainPath, original);

  // 7. The inbox must not render server text as markup. Reminder titles and
  //    bodies come from the relay, so innerHTML there would let them inject
  //    script into the app's own window.
  writeFileSync(
    mainPath,
    original.replace("title.textContent = message.title;", "title.innerHTML = message.title;"),
  );
  const inboxInjected = runChecker(work, checker);
  if (inboxInjected.failed && /must not use innerHTML on reminder text/.test(inboxInjected.output)) {
    console.log("ok   innerHTML in the inbox renderer is rejected");
  } else {
    console.error("FAIL inbox innerHTML guard did not fire:\n" + inboxInjected.output);
    failures += 1;
  }
  writeFileSync(mainPath, original);

  // 8. Dropping the failed-read distinction would leave stale reminders on
  //    screen after a failed refresh, looking current when they are not.
  //    Every occurrence must go: the same check now exists in renderWayfinder
  //    too, so removing only the first would leave the guard satisfied by the
  //    other one and prove nothing.
  {
    const removed = original.split("if (!view.reachable) {").join("if (false) {");
    if (removed === original) {
      console.error("FAIL could not construct the failed-read case");
      failures += 1;
    } else {
      writeFileSync(mainPath, removed);
      const noFailedState = runChecker(work, checker);
      if (
        noFailedState.failed &&
        /distinguish a failed read from an empty one/.test(noFailedState.output)
      ) {
        console.log("ok   losing the failed-read state is rejected");
      } else {
        console.error("FAIL failed-read guard did not fire:\n" + noFailedState.output);
        failures += 1;
      }
      writeFileSync(mainPath, original);
    }
  }

  // 9. Clearing the note before the capture succeeds would destroy what the
  //    user typed whenever the relay refuses the request. main.js uses CRLF, so
  //    the pattern is built with the file's own line ending.
  {
    const eol = original.includes("\r\n") ? "\r\n" : "\n";
    const from = `    const view = await invoke("wayfinder_capture", { note });${eol}    $("f-note").value = "";`;
    const to = `    $("f-note").value = "";${eol}    const view = await invoke("wayfinder_capture", { note });`;
    const moved = original.replace(from, to);
    if (moved === original) {
      console.error("FAIL could not construct the early-clear case (pattern moved)");
      failures += 1;
    } else {
      writeFileSync(mainPath, moved);
      const premature = runChecker(work, checker);
      if (
        premature.failed &&
        /must not be cleared before the capture succeeds/.test(premature.output)
      ) {
        console.log("ok   clearing the note before capture is rejected");
      } else {
        console.error("FAIL note-ordering guard did not fire:\n" + premature.output);
        failures += 1;
      }
      writeFileSync(mainPath, original);
    }
  }
  // 10. The confirm button must not be enabled for a situation that is already
  //     confirmed: the action there is choosing an option, not re-confirming.
  {
    const relaxed = original.replace(
      'confirmButton.disabled = !awaiting;',
      "confirmButton.disabled = !situation;",
    );
    if (relaxed === original) {
      console.error("FAIL could not construct the ungated-confirm case");
      failures += 1;
    } else {
      writeFileSync(mainPath, relaxed);
      const ungated = runChecker(work, checker);
      if (
        ungated.failed &&
        /confirm button must be gated on awaiting confirmation/.test(ungated.output)
      ) {
        console.log("ok   an ungated confirm button is rejected");
      } else {
        console.error("FAIL confirm-gating guard did not fire:\n" + ungated.output);
        failures += 1;
      }
      writeFileSync(mainPath, original);
    }
  }
  // 11. An actionStatus outside the set the relay accepts must be rejected.
  //     "planned" looked plausible and only surfaced as a 400 in front of the
  //     user, so this guard is worth proving.
  {
    const rustPath = join(work, "src-tauri", "src", "wayfinder", "mod.rs");
    const rust = readFileSync(rustPath, "utf8");
    const broken = rust.replace('"actionStatus": "not_started"', '"actionStatus": "planned"');
    if (broken === rust) {
      console.error("FAIL could not construct the bad-actionStatus case");
      failures += 1;
    } else {
      writeFileSync(rustPath, broken);
      const badStatus = runChecker(work, checker);
      if (badStatus.failed && /actionStatus planned is not one of/.test(badStatus.output)) {
        console.log("ok   an invalid actionStatus is rejected");
      } else {
        console.error("FAIL actionStatus guard did not fire:\n" + badStatus.output);
        failures += 1;
      }
      writeFileSync(rustPath, rust);
    }
  }

  // 12. Losing the server-message unwrapping would put the raw nested error back
  //     on screen, which is what the user reported.
  writeFileSync(
    mainPath,
    original.replace("const fromServer = serverMessage(value);", "const fromServer = null;"),
  );
  const rawNested = runChecker(work, checker);
  if (rawNested.failed && /server message must be used by the unwrap chain/.test(rawNested.output)) {
    console.log("ok   dropping the server-message unwrap is rejected");
  } else {
    console.error("FAIL server-message guard did not fire:\n" + rawNested.output);
    failures += 1;
  }
  writeFileSync(mainPath, original);
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures) {
  console.error(`check-shell self-test FAILED (${failures} case(s))`);
  process.exit(1);
}
console.log("check-shell self-test passed (guards are load-bearing)");
