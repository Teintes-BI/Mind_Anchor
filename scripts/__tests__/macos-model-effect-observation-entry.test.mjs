import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const ENTRY_FILE = resolve(ROOT_DIR, "scripts", "observe-macos-model-effect.mjs");

test("macOS model effect observer dry-run exposes default plan and paths", () => {
  const result = spawnSync(process.execPath, [ENTRY_FILE, "--dry-run"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      MINDANCHOR_M7_MACOS_MODEL_EFFECT_STAMP: "2026-04-26T10-00-00Z",
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.turnCount, 3);
  assert.equal(payload.options.intervalMs, 1000);
  assert.equal(payload.options.responseTimeoutMs, 90000);
  assert.equal(payload.options.preferredApiPort, 3011);
  assert.equal(payload.options.profileName, "dev");
  assert.equal(payload.options.accountEmail, "m7-desktop-model-effect@example.com");
  assert.equal(payload.options.responseExcerptChars, 1200);
  assert.equal(payload.paths.json, resolve(ROOT_DIR, "test-results", "macos-model-effect-observation-2026-04-26T10-00-00Z.json"));
  assert.equal(payload.paths.markdown, resolve(ROOT_DIR, "test-results", "macos-model-effect-observation-2026-04-26T10-00-00Z.md"));
  assert.deepEqual(payload.scenarioPlan.map((scenario) => scenario.id), ["next-action", "interruption-recovery", "over-notification"]);
  assert.deepEqual(payload.requirements, [
    "macOS GUI session",
    "OpenClaw real runtime reachable",
    "OpenClaw profile provider env",
    "xcodegen",
    "xcodebuild",
  ]);
});

test("macOS model effect observer dry-run accepts overrides", () => {
  const result = spawnSync(
    process.execPath,
    [
      ENTRY_FILE,
      "--dry-run",
      "--turns",
      "2",
      "--interval-ms",
      "2500",
      "--response-timeout-ms",
      "30000",
      "--out-dir",
      "tmp/m7",
      "--email",
      "desktop@example.com",
    ],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        MINDANCHOR_M7_MACOS_MODEL_EFFECT_STAMP: "2026-04-26T10-05-00Z",
      },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.turnCount, 2);
  assert.equal(payload.options.intervalMs, 2500);
  assert.equal(payload.options.responseTimeoutMs, 30000);
  assert.equal(payload.options.accountEmail, "desktop@example.com");
  assert.equal(payload.paths.json, resolve(ROOT_DIR, "tmp", "m7", "macos-model-effect-observation-2026-04-26T10-05-00Z.json"));
  assert.equal(payload.paths.markdown, resolve(ROOT_DIR, "tmp", "m7", "macos-model-effect-observation-2026-04-26T10-05-00Z.md"));
  assert.deepEqual(payload.scenarioPlan.map((scenario) => scenario.id), ["next-action", "interruption-recovery"]);
});

test("macOS model effect observer dry-run supports OpenChronicle comparison mode", () => {
  const result = spawnSync(
    process.execPath,
    [
      ENTRY_FILE,
      "--dry-run",
      "--turns",
      "1",
      "--compare-openchronicle-memory",
      "--openchronicle-mcp-url",
      "http://127.0.0.1:9999/mcp",
      "--memory-timeout-ms",
      "2500",
      "--response-excerpt-chars",
      "800",
    ],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        MINDANCHOR_M7_MACOS_MODEL_EFFECT_STAMP: "2026-04-26T10-10-00Z",
      },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.memoryMode, "compare");
  assert.equal(payload.options.openChronicleMcpUrl, "http://127.0.0.1:9999/mcp");
  assert.equal(payload.options.memoryTimeoutMs, 2500);
  assert.equal(payload.options.responseExcerptChars, 800);
  assert.deepEqual(payload.scenarioPlan.map((scenario) => scenario.id), ["next-action-baseline", "next-action-openchronicle"]);
  assert.deepEqual(payload.scenarioPlan.map((scenario) => scenario.memoryVariant), ["baseline", "openchronicle"]);
  assert.match(payload.requirements.join("\n"), /OpenChronicle MCP sidecar reachable/);
  assert.match(payload.plan.join("\n"), /DesktopMemoryAdapter/);
});
