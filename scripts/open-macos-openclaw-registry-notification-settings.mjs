#!/usr/bin/env node

import { spawn } from "node:child_process";
import { openClawRegistryE2EBundleIdentifier } from "./lib/macos-e2e-bundle-ids.mjs";
import { buildMacOSNotificationSettingsOpenCandidates } from "./lib/macos-notification-settings-url.mjs";
import { resolveOpenClawRegistryBundleIdentifier } from "./lib/macos-openclaw-registry-bundle-id.mjs";

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `${command} exited with ${code}`));
    });
  });
}

const bundleIdentifier = resolveOpenClawRegistryBundleIdentifier({
  explicitBundleIdentifier: process.argv[2] || undefined,
});
const candidates = buildMacOSNotificationSettingsOpenCandidates(bundleIdentifier);

let openedURL = candidates[candidates.length - 1];
let opened = false;
for (const candidate of candidates) {
  try {
    await runCommand("open", [candidate]);
    openedURL = candidate;
    opened = true;
    break;
  } catch {}
}

if (!opened) {
  throw new Error("无法打开 macOS 通知设置。");
}

await runCommand("osascript", [
  "-e",
  'tell application "System Settings" to activate',
]).catch(() => {});

process.stdout.write(`${openedURL}\n`);
process.stdout.write("已尝试打开 macOS 通知设置。\n");
process.stdout.write("请把 MindAnchor OpenClaw Registry E2E 对应应用改回允许通知。\n");
