#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  buildAlignedRunnerProviderDriftWarning,
  buildGatewayProviderEnvOverrides,
  readOpenClawProfileProviderConfig,
} from "./lib/core-phase-provider-config-drift.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");

const profileName = process.env.OPENCLAW_REAL_PROFILE ?? "dev";
const openClaw = await readOpenClawProfileProviderConfig({ profileName });
const overrides = buildGatewayProviderEnvOverrides(openClaw);
const shellProviderConfig = {
  baseUrl: process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL ?? null,
  model: process.env.MINDANCHOR_DEFAULT_MODEL_NAME ?? null,
  wireApi: process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API === "chat-completions" ? "chat-completions" : "responses",
  apiKey: process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY ?? null,
};

if (!openClaw || !overrides) {
  process.stderr.write(
    `Unable to derive aligned provider env from OpenClaw profile '${profileName}'. Check your profile config first.\n`,
  );
  process.exit(1);
}

process.stdout.write(`Aligning Gateway provider-direct env from OpenClaw profile '${profileName}'.\n`);
process.stdout.write(`- baseUrl=${openClaw.baseUrl}\n`);
process.stdout.write(`- model=${openClaw.model}\n`);
process.stdout.write(`- wireApi=${openClaw.wireApi}\n`);
process.stdout.write(`- apiKeyPresent=${overrides.MINDANCHOR_DEFAULT_MODEL_API_KEY ? "true" : "false"}\n`);

const driftWarning = buildAlignedRunnerProviderDriftWarning({
  gateway: shellProviderConfig,
  openClaw,
});

if (driftWarning) {
  process.stdout.write("Warning: detected provider env drift between the current shell and the OpenClaw profile.\n");
  process.stdout.write(`- driftCodes=${driftWarning.driftCodes.join(",")}\n`);
  process.stdout.write(`- shellBaseUrl=${driftWarning.shellSummary.baseUrl ?? "null"}\n`);
  process.stdout.write(`- profileBaseUrl=${driftWarning.profileSummary.baseUrl ?? "null"}\n`);
  process.stdout.write(
    `- alignedRunnerOverrides=${Object.keys(driftWarning.alignedEnvOverrides).join(",")}\n`,
  );
  process.stdout.write(
    "- note=the aligned runner will override MINDANCHOR_DEFAULT_MODEL_* from the OpenClaw profile before starting core phase tests.\n",
  );
}

const child = spawn(
  process.execPath,
  [resolve(ROOT_DIR, "scripts/run-core-phase-tests.mjs"), "--cluster-mode", "real", ...process.argv.slice(2)],
  {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      ...overrides,
    },
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
