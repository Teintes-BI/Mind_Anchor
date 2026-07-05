import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..", "..");
const ENTRY_FILE = resolve(ROOT_DIR, "scripts", "validate-openchronicle-sidecar.mjs");

test("OpenChronicle sidecar validator dry-run exposes default plan", () => {
  const result = spawnSync(process.execPath, [ENTRY_FILE, "--dry-run"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      MINDANCHOR_OPENCHRONICLE_VALIDATION_STAMP: "2026-04-26T01-00-00Z",
    },
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.mcpUrl, "http://127.0.0.1:8742/mcp");
  assert.equal(payload.options.query, "MindAnchor desktop model effect loop");
  assert.equal(payload.options.timeoutMs, 10000);
  assert.deepEqual(payload.options.requiredTools, ["current_context", "recent_activity", "list_memories"]);
  assert.equal(payload.paths.json, resolve(ROOT_DIR, "test-results", "openchronicle-sidecar-validation-2026-04-26T01-00-00Z.json"));
  assert.equal(payload.paths.markdown, resolve(ROOT_DIR, "test-results", "openchronicle-sidecar-validation-2026-04-26T01-00-00Z.md"));
  assert.deepEqual(payload.plan, [
    "POST initialize to OpenChronicle MCP endpoint",
    "send notifications/initialized",
    "POST tools/list",
    "call current_context",
    "call recent_activity",
    "call list_memories",
    "write JSON and Markdown report",
  ]);
});

test("OpenChronicle sidecar validator dry-run accepts overrides", () => {
  const result = spawnSync(
    process.execPath,
    [
      ENTRY_FILE,
      "--dry-run",
      "--mcp-url",
      "http://127.0.0.1:9999/mcp",
      "--out-dir",
      "tmp/openchronicle",
      "--query",
      "focus recovery",
      "--timeout-ms",
      "2500",
    ],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        MINDANCHOR_OPENCHRONICLE_VALIDATION_STAMP: "2026-04-26T01-05-00Z",
      },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.options.mcpUrl, "http://127.0.0.1:9999/mcp");
  assert.equal(payload.options.query, "focus recovery");
  assert.equal(payload.options.timeoutMs, 2500);
  assert.equal(payload.paths.json, resolve(ROOT_DIR, "tmp", "openchronicle", "openchronicle-sidecar-validation-2026-04-26T01-05-00Z.json"));
  assert.equal(payload.paths.markdown, resolve(ROOT_DIR, "tmp", "openchronicle", "openchronicle-sidecar-validation-2026-04-26T01-05-00Z.md"));
});
