import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, stat, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

test("legacy migration is dry-run by default and apply is idempotent", async () => {
  const directory = await mkdtemp(join(tmpdir(), "comma-migrate-"));
  const input = join(directory, "legacy.json");
  const sqlite = join(directory, "core.sqlite");
  await writeFile(input, JSON.stringify({ userId: "u-1", wayfinderContextEvents: [{ id: "c1", occurredAt: "2026-08-24T10:00:00.000Z", payload: { text: "context" } }], stateAssessments: [{ id: "s1", energyScore: 60, focusScore: 70, createdAt: "2026-08-24T10:00:00.000Z" }], wayfinderValueProfiles: [{ id: "v1" }], traceLogEvents: [{ id: "t1", message: "secret" }] }));
  const cwd = process.cwd();
  const dry = await exec(process.execPath, ["scripts/migrate-json-to-core.mjs", "--input", input, "--sqlite", sqlite, "--dry-run"], { cwd });
  assert.equal(JSON.parse(dry.stdout).dryRun, true);
  await assert.rejects(stat(sqlite));
  const applied = await exec(process.execPath, ["scripts/migrate-json-to-core.mjs", "--input", input, "--sqlite", sqlite, "--apply"], { cwd });
  assert.equal(JSON.parse(applied.stdout).imported.events, 1);
  const repeated = await exec(process.execPath, ["scripts/migrate-json-to-core.mjs", "--input", input, "--sqlite", sqlite, "--apply"], { cwd });
  assert.equal(JSON.parse(repeated.stdout).imported.events, 0);
  assert.equal(JSON.parse(repeated.stdout).unmapped.traceLogEvents, 1);
  await rm(directory, { recursive: true, force: true });
});
