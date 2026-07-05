#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";

import { openClawRegistryE2EBundleIdentifier } from "./lib/macos-e2e-bundle-ids.mjs";
import { parseProfilesShowJson } from "./lib/macos-installed-profiles.mjs";
import { resolveOpenClawRegistryBundleIdentifier } from "./lib/macos-openclaw-registry-bundle-id.mjs";
import {
  deriveOpenClawRegistryNotificationProfileStatus,
  formatOpenClawRegistryNotificationProfileStatus,
  openClawRegistryNotificationProfileIdentifier,
} from "./lib/macos-openclaw-registry-notification-prep.mjs";

function runCommand(command, args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    if (typeof input === "string") {
      child.stdin.write(input);
    }
    child.stdin.end();
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `${command} exited with ${code}`));
    });
  });
}

const bundleIdentifier = resolveOpenClawRegistryBundleIdentifier();

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

const installedProfiles = parseProfilesShowJson(json);
const status = deriveOpenClawRegistryNotificationProfileStatus(
  installedProfiles,
  bundleIdentifier,
);
const { profileInstalled, bundleConfigured, fullyInstalled } = status;

process.stdout.write(`profileInstalled=${profileInstalled}\n`);
process.stdout.write(`bundleConfigured=${bundleConfigured}\n`);
process.stdout.write(`fullyInstalled=${fullyInstalled}\n`);
process.stdout.write(`profileIdentifier=${openClawRegistryNotificationProfileIdentifier}\n`);
process.stdout.write(`bundleIdentifier=${bundleIdentifier}\n`);
process.stdout.write(`${formatOpenClawRegistryNotificationProfileStatus(status)}\n`);

if (fullyInstalled) {
  process.stdout.write("MindAnchor OpenClaw Registry E2E notifications profile is installed.\n");
} else {
  process.stderr.write("MindAnchor OpenClaw Registry E2E notifications profile is not fully installed.\n");
  process.exitCode = 1;
}
