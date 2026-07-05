#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const argv = [...process.argv.slice(2)];

let dryRun = false;
let baselinePath = process.env.MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_BASELINE_REPORT ?? "";
let outDir = resolve(ROOT_DIR, process.env.MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_INVESTIGATION_DIR ?? "test-results");

for (let index = 0; index < argv.length; index += 1) {
  const token = argv[index];
  if (token === "--dry-run") {
    dryRun = true;
    continue;
  }
  if (token === "--baseline") {
    baselinePath = argv[index + 1] ?? baselinePath;
    index += 1;
    continue;
  }
  if (token === "--out-dir") {
    outDir = resolve(ROOT_DIR, argv[index + 1] ?? outDir);
    index += 1;
    continue;
  }
}

const stamp = process.env.MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_INVESTIGATION_STAMP ??
  new Date().toISOString().replace(/[:.]/g, "-");

const paths = {
  outDir,
  incidentJson: resolve(outDir, `openclaw-runtime-transport-incident-${stamp}.json`),
  incidentMarkdown: resolve(outDir, `openclaw-runtime-transport-incident-${stamp}.md`),
  compareJson: baselinePath ? resolve(outDir, `openclaw-runtime-transport-compare-${stamp}.json`) : null,
  compareMarkdown: baselinePath ? resolve(outDir, `openclaw-runtime-transport-compare-${stamp}.md`) : null,
};

const commands = [
  {
    command: process.execPath,
    args: [
      resolve(ROOT_DIR, "scripts", "report-openclaw-runtime-transport-lan.mjs"),
      paths.incidentJson,
      paths.incidentMarkdown,
    ],
  },
];

if (baselinePath) {
  commands.push({
    command: process.execPath,
    args: [
      resolve(ROOT_DIR, "scripts", "compare-openclaw-runtime-transport-reports.mjs"),
      baselinePath,
      paths.incidentJson,
      paths.compareJson,
      paths.compareMarkdown,
    ],
  });
}

if (dryRun) {
  process.stdout.write(`${JSON.stringify({ paths, commands })}\n`);
  process.exit(0);
}

for (const entry of commands) {
  const result = spawnSync(entry.command, entry.args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
