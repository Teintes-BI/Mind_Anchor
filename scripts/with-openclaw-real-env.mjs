#!/usr/bin/env node
import { spawn } from "node:child_process";
import { resolve } from "node:path";

import {
  buildGatewayProviderEnvOverrides,
  compareProviderConfigDrift,
  readOpenClawProfileProviderConfig,
} from "./lib/core-phase-provider-config-drift.mjs";

let argv = [...process.argv.slice(2)];
let dryRun = false;
let profileName = process.env.OPENCLAW_REAL_PROFILE ?? "dev";
let leadingSeparator = false;

if (argv[0] === "--") {
  leadingSeparator = true;
  argv = argv.slice(1);
}

let separatorIndex = argv.indexOf("--");

for (let index = 0; index < argv.length; index += 1) {
  const token = argv[index];
  if (token === "--") {
    separatorIndex = index;
    break;
  }
  if (token === "--dry-run") {
    dryRun = true;
    continue;
  }
  if (token === "--profile") {
    profileName = argv[index + 1] ?? profileName;
    index += 1;
  }
}

const command = separatorIndex >= 0 ? argv.slice(separatorIndex + 1) : leadingSeparator ? argv : [];

if (command.length === 0) {
  process.stderr.write("Usage: node scripts/with-openclaw-real-env.mjs [--profile dev] [--dry-run] -- <command> [args...]\n");
  process.exit(1);
}

const openClaw = await readOpenClawProfileProviderConfig({ profileName });
const overrides = buildGatewayProviderEnvOverrides(openClaw);

if (!openClaw || !overrides) {
  process.stderr.write(`Unable to derive Gateway provider env from OpenClaw profile '${profileName}'.\n`);
  process.exit(1);
}

const shellProviderConfig = {
  baseUrl: process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL ?? null,
  model: process.env.MINDANCHOR_DEFAULT_MODEL_NAME ?? null,
  wireApi: process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API === "chat-completions" ? "chat-completions" : "responses",
  apiKey: process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY ?? null,
};
const drift = compareProviderConfigDrift({ gateway: shellProviderConfig, openClaw });

const envSummary = {
  MINDANCHOR_DEFAULT_MODEL_BASE_URL: overrides.MINDANCHOR_DEFAULT_MODEL_BASE_URL,
  MINDANCHOR_DEFAULT_MODEL_NAME: overrides.MINDANCHOR_DEFAULT_MODEL_NAME,
  MINDANCHOR_DEFAULT_MODEL_WIRE_API: overrides.MINDANCHOR_DEFAULT_MODEL_WIRE_API,
  MINDANCHOR_DEFAULT_MODEL_API_KEY_PRESENT: Boolean(overrides.MINDANCHOR_DEFAULT_MODEL_API_KEY),
};

if (dryRun) {
  process.stdout.write(
    `${JSON.stringify(
      {
        profileName,
        profileConfigPath: openClaw.configPath,
        command,
        envSummary,
        driftCodes: drift.issues.map((issue) => issue.code),
      },
      null,
      2,
    )}\n`,
  );
  process.exit(0);
}

const child = spawn(command[0], command.slice(1), {
  cwd: process.cwd(),
  env: {
    ...process.env,
    ...overrides,
    PATH: [resolve(process.cwd(), ".tools/node/bin"), `${process.env.HOME ?? ""}/.openclaw/bin`, process.env.PATH ?? ""]
      .filter(Boolean)
      .join(":"),
  },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
