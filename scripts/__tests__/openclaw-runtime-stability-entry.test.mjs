import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const ENTRY_FILE = resolve(ROOT_DIR, "scripts", "observe-openclaw-runtime-stability.mjs");

test("stability observer dry-run exposes default plan and paths", () => {
  const result = spawnSync(process.execPath, [ENTRY_FILE, "--dry-run"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      MINDANCHOR_OPENCLAW_RUNTIME_STABILITY_STAMP: "2026-04-24T09-00-00Z",
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.rounds, 12);
  assert.equal(payload.options.intervalMs, 60000);
  assert.equal(payload.options.profileName, "dev");
  assert.equal(payload.options.requiredSelectedEndpoint, "cluster:/v1/tasks/execute");
  assert.equal(payload.paths.json, resolve(ROOT_DIR, "test-results", "openclaw-runtime-stability-2026-04-24T09-00-00Z.json"));
  assert.equal(payload.paths.markdown, resolve(ROOT_DIR, "test-results", "openclaw-runtime-stability-2026-04-24T09-00-00Z.md"));
});

test("stability observer dry-run accepts rounds interval and out-dir overrides", () => {
  const result = spawnSync(
    process.execPath,
    [ENTRY_FILE, "--dry-run", "--rounds", "2", "--interval-ms", "1000", "--out-dir", "tmp/stability"],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        MINDANCHOR_OPENCLAW_RUNTIME_STABILITY_STAMP: "2026-04-24T09-01-00Z",
      },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.rounds, 2);
  assert.equal(payload.options.intervalMs, 1000);
  assert.equal(payload.paths.json, resolve(ROOT_DIR, "tmp", "stability", "openclaw-runtime-stability-2026-04-24T09-01-00Z.json"));
  assert.equal(payload.paths.markdown, resolve(ROOT_DIR, "tmp", "stability", "openclaw-runtime-stability-2026-04-24T09-01-00Z.md"));
});
