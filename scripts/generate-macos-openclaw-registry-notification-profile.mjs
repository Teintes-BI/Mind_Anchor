#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { openClawRegistryE2EBundleIdentifier } from "./lib/macos-e2e-bundle-ids.mjs";
import { resolveOpenClawRegistryBundleIdentifier } from "./lib/macos-openclaw-registry-bundle-id.mjs";
import { buildMacOSNotificationSettingsProfile } from "./lib/macos-notification-profile.mjs";
import { parseProfilesShowJson } from "./lib/macos-installed-profiles.mjs";
import {
  buildOpenClawRegistryNotificationPrepInstructions,
  configurationProfilesContainBundleIdentifier,
  configurationProfilesContainIdentifier,
  defaultOpenClawRegistryNotificationProfilePath,
  openClawRegistryNotificationPayloadIdentifier,
  openClawRegistryNotificationProfileDisplayName,
  openClawRegistryNotificationProfileIdentifier,
} from "./lib/macos-openclaw-registry-notification-prep.mjs";

function parseArgs(argv) {
  let outputPath = null;
  let shouldOpen = false;
  let bundleIdentifier = null;

  for (const arg of argv) {
    if (arg === "--open") {
      shouldOpen = true;
      continue;
    }
    if (arg.startsWith("--bundle-id=")) {
      bundleIdentifier = arg.slice("--bundle-id=".length);
      continue;
    }
    outputPath = path.resolve(process.cwd(), arg);
  }

  return {
    outputPath: outputPath ?? defaultOpenClawRegistryNotificationProfilePath(process.cwd()),
    shouldOpen,
    bundleIdentifier,
  };
}

function runCommand(command, args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    if (typeof input === "string") {
      child.stdin.write(input);
    }
    child.stdin.end();
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr || stdout || `${command} exited with ${code}`));
    });
  });
}

async function readInstalledProfilesJson() {
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

  return parseProfilesShowJson(json);
}

const { outputPath, shouldOpen, bundleIdentifier: explicitBundleIdentifier } = parseArgs(process.argv.slice(2));
const bundleIdentifier = resolveOpenClawRegistryBundleIdentifier({
  explicitBundleIdentifier,
});

const profile = buildMacOSNotificationSettingsProfile({
  bundleIdentifier,
  profileIdentifier: openClawRegistryNotificationProfileIdentifier,
  payloadIdentifier: openClawRegistryNotificationPayloadIdentifier,
  profileDisplayName: openClawRegistryNotificationProfileDisplayName,
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, profile, "utf8");
const installedProfiles = await readInstalledProfilesJson();
const alreadyInstalled =
  configurationProfilesContainIdentifier(
    installedProfiles,
    openClawRegistryNotificationProfileIdentifier,
  ) &&
  configurationProfilesContainBundleIdentifier(
    installedProfiles,
    bundleIdentifier,
  );

if (shouldOpen) {
  await runCommand("open", [outputPath]);
}

process.stdout.write(`${outputPath}\n`);
for (const line of buildOpenClawRegistryNotificationPrepInstructions({
  profilePath: outputPath,
  alreadyInstalled,
  bundleIdentifier,
})) {
  process.stdout.write(`${line}\n`);
}
