#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import {
  buildMacOSNotificationCenterClickGuidance,
  defaultMacOSNotificationCenterClickDiagnosticsHtmlPath,
  defaultMacOSNotificationCenterClickDiagnosticsReportPath,
  deriveMacOSNotificationCenterClickBoundary,
  renderMacOSNotificationCenterClickDiagnosticsHtml,
} from "./lib/macos-notification-center-click-diagnostics.mjs";
import { parseMacOSNotificationDebugLog } from "./lib/macos-notification-debug-log.mjs";
import { resolveOpenClawRegistryBundleIdentifier } from "./lib/macos-openclaw-registry-bundle-id.mjs";

const title = process.argv[2] || "";
const message = process.argv[3] || "";
const debugLogPath = process.argv[4] || "";
const reportPath = process.argv[5] || defaultMacOSNotificationCenterClickDiagnosticsReportPath(process.cwd());
const htmlPath = process.argv[6] || defaultMacOSNotificationCenterClickDiagnosticsHtmlPath(process.cwd());
const bundleIdentifier = resolveOpenClawRegistryBundleIdentifier();

function runOsa(language, source) {
  return new Promise((resolve, reject) => {
    const child = spawn("osascript", language ? ["-l", language] : ["-"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdin.write(source);
    child.stdin.end();
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr || stdout || `osascript exited with ${code}`));
    });
  });
}

async function clickSystemNotification(targetTitle, targetMessage) {
  const script = `
const targetTitle = ${JSON.stringify(targetTitle)};
const targetMessage = ${JSON.stringify(targetMessage)};
const se = Application("System Events");
function safe(fn, fallback = "") { try { return fn(); } catch (error) { return fallback; } }
function matchesText(candidateValue) {
  if (candidateValue === null || candidateValue === undefined) return false;
  const candidateText = String(candidateValue);
  if (!candidateText) return false;
  if (candidateText.includes(targetTitle) || targetTitle.includes(candidateText)) return true;
  if (targetMessage && (candidateText.includes(targetMessage) || targetMessage.includes(candidateText))) return true;
  return false;
}
function collectStaticTexts(element) {
  let values = [];
  let textElements = [];
  try { textElements = element.staticTexts(); } catch (error) { textElements = []; }
  for (const textElement of textElements) {
    values.push(safe(() => textElement.name(), ""));
    values.push(safe(() => textElement.value(), ""));
    values.push(safe(() => textElement.description(), ""));
  }
  return values.filter(Boolean);
}
function collectNotificationGroups(element) {
  let groups = [];
  let children = [];
  try { children = element.uiElements(); } catch (error) { children = []; }
  for (const child of children) {
    const role = safe(() => child.role(), "");
    const subrole = safe(() => child.attributes.byName("AXSubrole").value(), "");
    if (role === "AXGroup" && (subrole === "AXNotificationCenterBanner" || subrole === "AXNotificationCenterAlert")) {
      groups.push(child);
    }
    groups = groups.concat(collectNotificationGroups(child));
  }
  return groups;
}
function clickBannerGroup(group, resultPrefix) {
  try { const buttons = group.buttons(); if (buttons.length > 0) { buttons[0].click(); return resultPrefix + "-button"; } } catch (error) {}
  try { group.click(); return resultPrefix + "-group"; } catch (error) {}
  try { const elements = group.uiElements(); if (elements.length > 0) { elements[0].click(); return resultPrefix + "-child"; } } catch (error) {}
  return null;
}
function scanNotificationWindow(window, resultPrefix) {
  const groups = collectNotificationGroups(window);
  for (const group of groups) {
    const texts = collectStaticTexts(group);
    if (texts.some(matchesText)) {
      const clicked = clickBannerGroup(group, resultPrefix);
      if (clicked) return clicked;
    }
  }
  return null;
}
const notificationProcess = se.processes.byName("NotificationCenter");
notificationProcess.frontmost = true;
for (const window of notificationProcess.windows()) {
  const clicked = scanNotificationWindow(window, "clicked-live");
  if (clicked) { clicked; return; }
}
"not-found";
`;
  return runOsa("JavaScript", script).catch(() => "not-found");
}

async function dumpNotificationCenter() {
  const script = `
tell application "System Events"
  tell process "NotificationCenter"
    set frontmost to true
    set output to {}
    repeat with w in windows
      try
        set subroleValue to value of attribute "AXSubrole" of w as text
      on error
        set subroleValue to "unknown"
      end try
      set end of output to "window:" & (name of w as text) & " subrole:" & subroleValue
      try
        repeat with t in (name of every static text of entire contents of w)
          set end of output to "text:" & (t as text)
        end repeat
      end try
    end repeat
    return output
  end tell
end tell`;
  return runOsa("", script).catch((error) => String(error.message ?? error));
}

const debugSummary = debugLogPath
  ? parseMacOSNotificationDebugLog(await fs.readFile(debugLogPath, "utf8").catch(() => ""))
  : parseMacOSNotificationDebugLog("");
const clickResult = await clickSystemNotification(title, message);
const dump = await dumpNotificationCenter();
const boundary = deriveMacOSNotificationCenterClickBoundary({
  notificationDebugState: debugSummary.inferredState,
  clickResult,
});
const guidance = buildMacOSNotificationCenterClickGuidance({
  boundary,
  reportPath,
  htmlPath,
});

const report = {
  generatedAt: new Date().toISOString(),
  bundleIdentifier,
  title,
  message,
  debugLogPath,
  notificationDebugState: debugSummary.inferredState,
  clickResult,
  boundary,
  dump,
  guidance,
};

await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
await fs.writeFile(htmlPath, renderMacOSNotificationCenterClickDiagnosticsHtml(report), "utf8");

process.stdout.write(`notificationCenterClickDiagnosticsReport=${reportPath}\n`);
process.stdout.write(`notificationCenterClickDiagnosticsHtml=${htmlPath}\n`);
for (const line of guidance) {
  process.stdout.write(`${line}\n`);
}
