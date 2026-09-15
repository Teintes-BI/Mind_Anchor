// Proves the three data-loss guards in check-shell.mjs actually fire.
//
// They protect against regressions that shipped once and destroyed user input:
// submitting "" for untouched fields (backend reads that as "clear"), refresh
// overwriting a half-typed endpoint, and clearing the pin field.
import { mkdtempSync, readFileSync, writeFileSync, rmSync, cpSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");

function runChecker(root, scriptPath) {
  try {
    execFileSync(process.execPath, [scriptPath], { cwd: root, stdio: "pipe", encoding: "utf8" });
    return { failed: false, output: "" };
  } catch (error) {
    return { failed: true, output: (error.stdout ?? "") + (error.stderr ?? "") };
  }
}

const work = mkdtempSync(join(tmpdir(), "comma-guard-"));
let failures = 0;

const cases = [
  {
    name: "untouched fields sent as empty strings",
    from: 'return raw.trim() === "" ? null : raw;',
    to: "return raw;",
    expect: /untouched relay fields must not be sent as empty strings/,
  },
  {
    name: "refresh overwrites a half-typed endpoint",
    from: 'if ($("f-endpoint").value.trim() === "") {',
    to: "if (true) {",
    expect: /refresh must not overwrite a half-typed endpoint/,
  },
  {
    name: "pin field is cleared after save",
    from: '$("f-token").value = "";',
    to: '$("f-token").value = "";\n    $("f-pin").value = "";',
    expect: /pin field must not be cleared/,
  },
];

try {
  mkdirSync(join(work, "src"), { recursive: true });
  mkdirSync(join(work, "scripts"), { recursive: true });
  cpSync(join(appRoot, "src", "main.js"), join(work, "src", "main.js"));
  cpSync(join(appRoot, "src", "index.html"), join(work, "src", "index.html"));
  cpSync(join(appRoot, "scripts", "check-shell.mjs"), join(work, "scripts", "check-shell.mjs"));
  // The actionStatus guard in check-shell.mjs reads this Rust module. Without the
  // mirror the checker throws ENOENT here and every case below reports a failure
  // for the wrong reason.
  mkdirSync(join(work, "src-tauri", "src", "wayfinder"), { recursive: true });
  cpSync(
    join(appRoot, "src-tauri", "src", "wayfinder", "mod.rs"),
    join(work, "src-tauri", "src", "wayfinder", "mod.rs"),
  );
  // The tray guards in check-shell.mjs read these.
  cpSync(join(appRoot, "src-tauri", "src", "tray.rs"), join(work, "src-tauri", "src", "tray.rs"));
  cpSync(join(appRoot, "src-tauri", "src", "lib.rs"), join(work, "src-tauri", "src", "lib.rs"));
  cpSync(
    join(appRoot, "src-tauri", "src", "inbox", "mod.rs"),
    join(work, "src-tauri", "src", "inbox", "mod.rs"),
  );

  const checker = join(work, "scripts", "check-shell.mjs");
  const mainPath = join(work, "src", "main.js");
  const original = readFileSync(mainPath, "utf8");

  const baseline = runChecker(work, checker);
  if (baseline.failed) {
    console.error("baseline failed unexpectedly:\n" + baseline.output);
    failures += 1;
  } else {
    console.log("ok   baseline copy passes");
  }

  for (const testCase of cases) {
    if (!original.includes(testCase.from)) {
      console.error(`FAIL case setup: needle not found for "${testCase.name}"`);
      failures += 1;
      continue;
    }
    writeFileSync(mainPath, original.replace(testCase.from, testCase.to));
    const result = runChecker(work, checker);
    if (result.failed && testCase.expect.test(result.output)) {
      console.log(`ok   ${testCase.name} is rejected`);
    } else {
      console.error(`FAIL ${testCase.name} was not rejected:\n${result.output}`);
      failures += 1;
    }
    writeFileSync(mainPath, original);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures) {
  console.error(`data-loss guard self-test FAILED (${failures} case(s))`);
  process.exit(1);
}
console.log("data-loss guard self-test passed (all three guards fire)");
