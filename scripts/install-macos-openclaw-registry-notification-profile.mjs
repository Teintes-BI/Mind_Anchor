#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";

import { openClawRegistryE2EBundleIdentifier } from "./lib/macos-e2e-bundle-ids.mjs";
import { parseProfilesShowJson } from "./lib/macos-installed-profiles.mjs";
import { resolveOpenClawRegistryBundleIdentifier } from "./lib/macos-openclaw-registry-bundle-id.mjs";
import {
  buildOpenClawRegistryNotificationInstallFlowInstructions,
  defaultOpenClawRegistryNotificationProfilePath,
  deriveOpenClawRegistryNotificationProfileStatus,
  formatOpenClawRegistryNotificationProfileStatus,
  isOpenClawRegistryNotificationProfileFullyInstalled,
} from "./lib/macos-openclaw-registry-notification-prep.mjs";

const timeoutSeconds = Number(process.env.MINDANCHOR_NOTIFICATION_INSTALL_TIMEOUT_SECONDS ?? 120);
const timeoutMs = Number.isFinite(timeoutSeconds) ? timeoutSeconds * 1000 : 120000;
const pollMs = 2000;
const profilePath = defaultOpenClawRegistryNotificationProfilePath(process.cwd());
const bundleIdentifier = resolveOpenClawRegistryBundleIdentifier();

function runCommand(command, args, { input, inherit = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: inherit ? "inherit" : ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    if (!inherit) {
      if (typeof input === "string") {
        child.stdin.write(input);
      }
      child.stdin.end();
      child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `${command} exited with ${code}`));
    });
  });
}

async function readInstalledStatus() {
  const { stdout: xml } = await runCommand("profiles", [
    "show",
    "-type",
    "configuration",
    "-output",
    "stdout-xml",
  ]).catch(() => ({ stdout: "" }));

  const { stdout: json } = await runCommand("plutil", ["-convert", "json", "-o", "-", "-"], {
    input: xml,
  }).catch(() => ({ stdout: "{}" }));

  return deriveOpenClawRegistryNotificationProfileStatus(
    parseProfilesShowJson(json),
    bundleIdentifier,
  );
}

await runCommand(process.execPath, [
  "scripts/generate-macos-openclaw-registry-notification-profile.mjs",
  `--bundle-id=${bundleIdentifier}`,
  profilePath,
], { inherit: true });

await runCommand("open", [profilePath]);

for (const line of buildOpenClawRegistryNotificationInstallFlowInstructions({
  profilePath,
  timeoutSeconds,
  bundleIdentifier,
})) {
  process.stdout.write(`${line}\n`);
}

const deadline = Date.now() + timeoutMs;
while (Date.now() < deadline) {
  const status = await readInstalledStatus();
  process.stdout.write(`${formatOpenClawRegistryNotificationProfileStatus(status)}\n`);
  if (isOpenClawRegistryNotificationProfileFullyInstalled(status)) {
    process.stdout.write("MindAnchor OpenClaw Registry E2E notifications profile is now installed.\n");
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, pollMs));
}

process.stderr.write("Timed out waiting for the notification profile to be installed.\n");
process.exitCode = 1;
