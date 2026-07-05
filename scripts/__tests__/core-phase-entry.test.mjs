import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const ENTRY_FILE = resolve(ROOT_DIR, "scripts", "run-core-phase-entry.mjs");

test("core phase entry forwards extra CLI args to the runner command", () => {
  const result = spawnSync(
    process.execPath,
    [ENTRY_FILE, "--cluster-mode", "local", "--dry-run", "--segments", "runtime-contracts"],
    {
      cwd: ROOT_DIR,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.commands[0], [process.execPath, "scripts/clean-appledouble.mjs", "--quiet"]);
  assert.deepEqual(payload.commands[1], [
    process.execPath,
    "scripts/run-core-phase-tests.mjs",
    "--cluster-mode",
    "local",
    "--segments",
    "runtime-contracts",
  ]);
  assert.deepEqual(payload.commands[2], [process.execPath, "scripts/clean-appledouble.mjs", "--quiet"]);
});
