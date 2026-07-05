#!/usr/bin/env node

import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";

import { openClawRegistryE2EBundleIdentifier } from "./lib/macos-e2e-bundle-ids.mjs";
import { parseProfilesShowJson } from "./lib/macos-installed-profiles.mjs";
import { parseMacOSNotificationDebugLog } from "./lib/macos-notification-debug-log.mjs";
import { resolveOpenClawRegistryBundleIdentifier } from "./lib/macos-openclaw-registry-bundle-id.mjs";
import {
  buildOpenClawRegistryNotificationRecoveryInstructions,
  deriveOpenClawRegistryNotificationProfileStatus,
  deriveOpenClawRegistryNotificationRecoveryAction,
} from "./lib/macos-openclaw-registry-notification-prep.mjs";
import { findSecurityAgentWindow } from "./lib/macos-security-agent-window.mjs";

const bundleIdentifier = resolveOpenClawRegistryBundleIdentifier();

function runCommand(command, args, { input, inherit = false } = {}) {
  return new Promise((resolve) => {
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
    child.on("error", (error) => {
      resolve({
        code: 1,
        stdout,
        stderr: stderr || String(error),
      });
    });
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

async function querySecurityAgentWindow() {
  const source = `
import Foundation
import CoreGraphics

let infoList = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
if let target = infoList.first(where: { ($0[kCGWindowOwnerName as String] as? String) == "SecurityAgent" }) {
    let data = try JSONSerialization.data(withJSONObject: target, options: [])
    FileHandle.standardOutput.write(data)
}
`;
  const { stdout } = await runCommand("swift", ["-"], { input: source }).catch(() => ({ stdout: "" }));
  const payload = stdout.trim();
  if (!payload) {
    return null;
  }
  try {
    return findSecurityAgentWindow([JSON.parse(payload)]);
  } catch {
    return null;
  }
}

async function queryInstalledNotificationProfileStatus() {
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

const debugLogPath = process.argv[2] || process.env.MINDANCHOR_NOTIFICATION_DEBUG_LOG_FILE || "";
const debugLogText = debugLogPath
  ? await fs.readFile(debugLogPath, "utf8").catch(() => "")
  : "";
const debugSummary = parseMacOSNotificationDebugLog(debugLogText);
const notificationProfileStatus = await queryInstalledNotificationProfileStatus();
const hasSecurityAgentWindow = Boolean(await querySecurityAgentWindow());

const recoveryAction = deriveOpenClawRegistryNotificationRecoveryAction({
  notificationProfileStatus,
  notificationDebugState: debugSummary.inferredState,
  hasSecurityAgentWindow,
});

let actionCompleted = true;

if (recoveryAction === "open_settings") {
  const result = await runCommand(process.execPath, [
    "scripts/open-macos-openclaw-registry-notification-settings.mjs",
    bundleIdentifier,
  ], { inherit: true });
  actionCompleted = result.code === 0;
}

if (recoveryAction === "install_profile") {
  const result = await runCommand("corepack", [
    "pnpm",
    "install:macos:openclaw-registry-notifications",
  ], { inherit: true });
  actionCompleted = result.code === 0;
}

for (const line of buildOpenClawRegistryNotificationRecoveryInstructions({
  recoveryAction,
  bundleIdentifier,
  actionCompleted,
})) {
  process.stdout.write(`${line}\n`);
}

if (!actionCompleted) {
  process.exitCode = 1;
}
