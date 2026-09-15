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
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures) {
  console.error(`check-shell self-test FAILED (${failures} case(s))`);
  process.exit(1);
}
console.log("check-shell self-test passed (guards are load-bearing)");
