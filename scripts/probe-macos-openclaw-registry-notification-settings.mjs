#!/usr/bin/env node

import { spawn } from "node:child_process";

import {
  buildMacOSNotificationSettingsProbeGuidance,
  deriveMacOSNotificationSettingsAutomationBoundary,
  summarizeMacOSNotificationSettingsProbe,
} from "./lib/macos-notification-settings-probe.mjs";

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

await runCommand("corepack", ["pnpm", "open:macos:openclaw-registry-notification-settings"]);

const swiftProbe = `
import Cocoa
import ApplicationServices

func attr(_ element: AXUIElement, _ key: String) -> Any? {
    var value: CFTypeRef?
    let status = AXUIElementCopyAttributeValue(element, key as CFString, &value)
    guard status == .success else { return nil }
    return value
}

func str(_ any: Any?) -> String {
    if let s = any as? String { return s }
    return ""
}

let apps = ["com.apple.systempreferences", "com.apple.SystemSettings"].flatMap { NSRunningApplication.runningApplications(withBundleIdentifier: $0) }
guard let app = apps.first else {
    print("{\\"appFound\\":false}")
    exit(0)
}

let appElement = AXUIElementCreateApplication(app.processIdentifier)
var windowsRef: CFTypeRef?
let windowsStatus = AXUIElementCopyAttributeValue(appElement, kAXWindowsAttribute as CFString, &windowsRef)
let windows = (windowsStatus == .success ? (windowsRef as? [AXUIElement] ?? []) : [])
let firstWindow = windows.first
let firstWindowRole = firstWindow.map { str(attr($0, kAXRoleAttribute)) } ?? ""
let firstWindowTitle = firstWindow.map { str(attr($0, kAXTitleAttribute)) } ?? ""
let childRoles = (firstWindow.flatMap { attr($0, kAXChildrenAttribute) as? [AXUIElement] } ?? []).map { str(attr($0, kAXRoleAttribute)) }

var hits: [String] = []
func walk(_ element: AXUIElement, depth: Int, maxDepth: Int) {
    if depth > maxDepth { return }
    let role = str(attr(element, kAXRoleAttribute))
    let title = str(attr(element, kAXTitleAttribute))
    let desc = str(attr(element, kAXDescriptionAttribute))
    let value = str(attr(element, kAXValueAttribute))
    let combined = [role, title, desc, value].joined(separator: " | ")
    let hay = combined.lowercased()
    if hay.contains("mindanchor") || hay.contains("openclaw") || hay.contains("registry") || hay.contains("通知") {
        hits.append(combined)
    }
    if let children = attr(element, kAXChildrenAttribute) as? [AXUIElement] {
        for child in children.prefix(80) {
            walk(child, depth: depth + 1, maxDepth: maxDepth)
        }
    }
}
for win in windows { walk(win, depth: 0, maxDepth: 6) }

let payload: [String: Any] = [
    "appFound": true,
    "windowCount": windows.count,
    "firstWindowRole": firstWindowRole,
    "firstWindowTitle": firstWindowTitle,
    "childRoles": childRoles,
    "matchedTexts": hits
]
let data = try JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys])
FileHandle.standardOutput.write(data)
`;

const { stdout } = await runCommand("swift", ["-"], { input: swiftProbe });
const payload = JSON.parse(stdout);
const summary = summarizeMacOSNotificationSettingsProbe(payload);
const automationBoundary = deriveMacOSNotificationSettingsAutomationBoundary(summary);

process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`notificationSettingsAutomationBoundary=${automationBoundary}\n`);
for (const line of buildMacOSNotificationSettingsProbeGuidance(summary)) {
  process.stdout.write(`${line}\n`);
}
