#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT_DIR = resolve(import.meta.dirname, "..");

const argv = [...process.argv.slice(2)];
let runner = "scripts/run-core-phase-tests.mjs";
let dryRun = false;
const runnerArgs = [];

for (let index = 0; index < argv.length; index += 1) {
  const token = argv[index];
  if (token === "--dry-run") {
    dryRun = true;
    continue;
  }
  if (token === "--runner") {
    runner = argv[index + 1] ?? runner;
    index += 1;
    continue;
  }
  runnerArgs.push(token);
}

const commands = [
  [process.execPath, "scripts/clean-appledouble.mjs", "--quiet"],
  [process.execPath, runner, ...runnerArgs],
  [process.execPath, "scripts/clean-appledouble.mjs", "--quiet"],
];

if (dryRun) {
  process.stdout.write(`${JSON.stringify({ commands })}\n`);
  process.exit(0);
}

for (const command of commands) {
  const [bin, ...args] = command;
  const result = spawnSync(bin, args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
