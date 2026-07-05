#!/usr/bin/env node

import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";

import { openClawRegistryE2EBundleIdentifier } from "./lib/macos-e2e-bundle-ids.mjs";
import { parseProfilesShowJson } from "./lib/macos-installed-profiles.mjs";
import { parseMacOSNotificationDebugLog } from "./lib/macos-notification-debug-log.mjs";
import { normalizeOpenClawRegistryLiveNotificationState } from "./lib/macos-live-notification-status.mjs";
import { resolveOpenClawRegistryBundleIdentifier } from "./lib/macos-openclaw-registry-bundle-id.mjs";
import {
  buildOpenClawRegistryNotificationDoctorGuidance,
  deriveOpenClawRegistryNotificationProfileStatus,
  formatOpenClawRegistryNotificationProfileStatus,
} from "./lib/macos-openclaw-registry-notification-prep.mjs";
import { buildSecurityAgentWindowSummary, findSecurityAgentWindow } from "./lib/macos-security-agent-window.mjs";

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
  const { stdout } = await runCommand("swift", ["-"], {
    input: source,
  }).catch(() => ({ stdout: "" }));

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
const liveProbe = await runCommand(process.execPath, [
  "scripts/read-macos-openclaw-registry-live-notification-status.mjs",
  `--bundle-id=${bundleIdentifier}`,
]).then(({ stdout }) => {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}).catch(() => null);
const securityAgentWindow = await querySecurityAgentWindow();
const notificationProfileStatus = await queryInstalledNotificationProfileStatus();
const effectiveNotificationState = liveProbe
  ? normalizeOpenClawRegistryLiveNotificationState(liveProbe.notificationAuthorizationState)
  : debugSummary.inferredState;

process.stdout.write(`bundleIdentifier=${bundleIdentifier}\n`);
process.stdout.write(`${formatOpenClawRegistryNotificationProfileStatus(notificationProfileStatus)}\n`);
if (liveProbe) {
  process.stdout.write(`notificationLiveState=${effectiveNotificationState}\n`);
  process.stdout.write(`notificationLiveStatusDescription=${liveProbe.notificationStatusDescription ?? "unknown"}\n`);
}
process.stdout.write(`notificationDebugState=${debugSummary.inferredState}\n`);
process.stdout.write(`notificationDebugStatus=${debugSummary.lastAuthorizationStatus ?? "unknown"}\n`);
process.stdout.write(`notificationDebugContext=${debugSummary.lastContext ?? "unknown"}\n`);
process.stdout.write(`${buildSecurityAgentWindowSummary(securityAgentWindow)}\n`);
if (debugLogPath) {
  process.stdout.write(`notificationDebugLog=${debugLogPath}\n`);
}

for (const line of buildOpenClawRegistryNotificationDoctorGuidance({
  bundleIdentifier,
  notificationProfileStatus,
  notificationDebugState: effectiveNotificationState,
  hasSecurityAgentWindow: Boolean(securityAgentWindow),
})) {
  process.stdout.write(`${line}\n`);
}

if (buildOpenClawRegistryNotificationDoctorGuidance({
  bundleIdentifier,
  notificationProfileStatus,
  notificationDebugState: effectiveNotificationState,
  hasSecurityAgentWindow: Boolean(securityAgentWindow),
}).length > 0) {
  process.exitCode = 1;
}
