import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const ENTRY_FILE = resolve(ROOT_DIR, "scripts", "investigate-openclaw-runtime-transport-lan.mjs");

test("investigate transport entry plans a report-only run when no baseline is provided", () => {
  const result = spawnSync(process.execPath, [ENTRY_FILE, "--dry-run", "--out-dir", "tmp/investigate"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_INVESTIGATION_STAMP: "2026-04-23T01-30-00Z",
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.deepEqual(payload.paths, {
    outDir: resolve(ROOT_DIR, "tmp/investigate"),
    incidentJson: resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-incident-2026-04-23T01-30-00Z.json"),
    incidentMarkdown: resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-incident-2026-04-23T01-30-00Z.md"),
    compareJson: null,
    compareMarkdown: null,
  });
  assert.deepEqual(payload.commands, [
    {
      command: process.execPath,
      args: [
        resolve(ROOT_DIR, "scripts", "report-openclaw-runtime-transport-lan.mjs"),
        resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-incident-2026-04-23T01-30-00Z.json"),
        resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-incident-2026-04-23T01-30-00Z.md"),
      ],
    },
  ]);
});

test("investigate transport entry plans report and compare when a baseline is provided", () => {
  const baselinePath = resolve(ROOT_DIR, "test-results", "baseline.json");
  const result = spawnSync(
    process.execPath,
    [ENTRY_FILE, "--dry-run", "--out-dir", "tmp/investigate", "--baseline", baselinePath],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_INVESTIGATION_STAMP: "2026-04-23T01-31-00Z",
      },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.deepEqual(payload.paths, {
    outDir: resolve(ROOT_DIR, "tmp/investigate"),
    incidentJson: resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-incident-2026-04-23T01-31-00Z.json"),
    incidentMarkdown: resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-incident-2026-04-23T01-31-00Z.md"),
    compareJson: resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-compare-2026-04-23T01-31-00Z.json"),
    compareMarkdown: resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-compare-2026-04-23T01-31-00Z.md"),
  });
  assert.deepEqual(payload.commands, [
    {
      command: process.execPath,
      args: [
        resolve(ROOT_DIR, "scripts", "report-openclaw-runtime-transport-lan.mjs"),
        resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-incident-2026-04-23T01-31-00Z.json"),
        resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-incident-2026-04-23T01-31-00Z.md"),
      ],
    },
    {
      command: process.execPath,
      args: [
        resolve(ROOT_DIR, "scripts", "compare-openclaw-runtime-transport-reports.mjs"),
        baselinePath,
        resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-incident-2026-04-23T01-31-00Z.json"),
        resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-compare-2026-04-23T01-31-00Z.json"),
        resolve(ROOT_DIR, "tmp/investigate", "openclaw-runtime-transport-compare-2026-04-23T01-31-00Z.md"),
      ],
    },
  ]);
});
