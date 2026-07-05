#!/usr/bin/env node

import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";

import { openClawRegistryE2EBundleIdentifier } from "./lib/macos-e2e-bundle-ids.mjs";
import { parseProfilesShowJson } from "./lib/macos-installed-profiles.mjs";
import { parseMacOSNotificationDebugLog } from "./lib/macos-notification-debug-log.mjs";
import { resolveOpenClawRegistryBundleIdentifier } from "./lib/macos-openclaw-registry-bundle-id.mjs";
import {
  deriveOpenClawRegistryNotificationProfileStatus,
  deriveOpenClawRegistryNotificationRecoveryAction,
} from "./lib/macos-openclaw-registry-notification-prep.mjs";
import {
  buildOpenClawRegistryNotificationChildProcessEnv,
  buildOpenClawRegistryNotificationRecoveryResultGuidance,
  buildOpenClawRegistryNotificationRecoveryCheckInstructions,
  defaultOpenClawRegistryNotificationRecoveryReportPath,
  deriveOpenClawRegistryNotificationRecoveryHtmlReportPath,
  deriveOpenClawRegistryNotificationRecoveryResult,
  deriveOpenClawRegistryNotificationRecoveryCheckPlan,
} from "./lib/macos-openclaw-registry-notification-recovery-check.mjs";
import { findSecurityAgentWindow } from "./lib/macos-security-agent-window.mjs";

const timeoutSeconds = Number(process.env.MINDANCHOR_NOTIFICATION_RECOVERY_TIMEOUT_SECONDS ?? 180);
const timeoutMs = Number.isFinite(timeoutSeconds) ? timeoutSeconds * 1000 : 180000;
const pollMs = 5000;
function parseArgs(argv) {
  let bundleIdentifier = null;
  const positionals = [];

  for (const arg of argv) {
    if (arg.startsWith("--bundle-id=")) {
      bundleIdentifier = arg.slice("--bundle-id=".length);
      continue;
    }
    positionals.push(arg);
  }

  return {
    explicitBundleIdentifier: bundleIdentifier,
    debugLogPath: positionals[0] || process.env.MINDANCHOR_NOTIFICATION_DEBUG_LOG_FILE || "",
    reportPath: positionals[1] || process.env.MINDANCHOR_NOTIFICATION_RECOVERY_REPORT_FILE || defaultOpenClawRegistryNotificationRecoveryReportPath(process.cwd()),
  };
}

const parsedArgs = parseArgs(process.argv.slice(2));
const debugLogPath = parsedArgs.debugLogPath;
const reportPath = parsedArgs.reportPath;
const bundleIdentifier = resolveOpenClawRegistryBundleIdentifier({
  explicitBundleIdentifier: parsedArgs.explicitBundleIdentifier,
});
const childEnv = buildOpenClawRegistryNotificationChildProcessEnv(bundleIdentifier);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command, args, { input, inherit = false, env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      env: env ? { ...process.env, ...env } : process.env,
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
      resolve({ code: 1, stdout, stderr: stderr || String(error) });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
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
  const result = await runCommand("swift", ["-"], { input: source });
  const payload = result.stdout.trim();
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
  const xmlResult = await runCommand("profiles", [
    "show",
    "-type",
    "configuration",
    "-output",
    "stdout-xml",
  ]);

  const jsonResult = await runCommand("plutil", ["-convert", "json", "-o", "-", "-"], {
    input: xmlResult.code === 0 ? xmlResult.stdout : "",
  });

  return deriveOpenClawRegistryNotificationProfileStatus(
    parseProfilesShowJson(jsonResult.code === 0 ? jsonResult.stdout : "{}"),
    bundleIdentifier,
  );
}

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
const plan = deriveOpenClawRegistryNotificationRecoveryCheckPlan(recoveryAction);

for (const line of buildOpenClawRegistryNotificationRecoveryCheckInstructions({
  recoveryAction,
  timeoutSeconds,
})) {
  process.stdout.write(`${line}\n`);
}

const report = {
  bundleIdentifier,
  debugLogPath,
  reportPath,
  startedAt: new Date().toISOString(),
  recoveryAction,
  plan,
  settingsProbe: null,
  doctorAttempts: [],
  verifyAttempts: [],
  registryE2EAttempts: [],
  result: "pending",
};

const repairArgs = ["pnpm", "repair:macos:openclaw-registry-notifications"];
if (debugLogPath) {
  repairArgs.push(debugLogPath);
}
const repairResult = await runCommand("corepack", repairArgs, { inherit: true, env: childEnv });
report.repairExitCode = repairResult.code;

if (recoveryAction === "open_settings") {
  const settingsProbeResult = await runCommand("corepack", [
    "pnpm",
    "probe:macos:openclaw-registry-notification-settings",
    bundleIdentifier,
  ], { env: childEnv });
  report.settingsProbe = {
    exitCode: settingsProbeResult.code,
    stdout: settingsProbeResult.stdout,
    stderr: settingsProbeResult.stderr,
  };
}

const deadline = Date.now() + timeoutMs;

if (plan.shouldRunDoctorFirst) {
  while (Date.now() < deadline) {
    const doctorArgs = ["pnpm", "doctor:macos:openclaw-registry-notifications"];
    if (plan.shouldUseDebugLogForDoctorPolling && debugLogPath) {
      doctorArgs.push(debugLogPath);
    }
    const doctorResult = await runCommand("corepack", doctorArgs, { env: childEnv });
    report.doctorAttempts.push({
      at: new Date().toISOString(),
      exitCode: doctorResult.code,
      stdout: doctorResult.stdout,
      stderr: doctorResult.stderr,
    });
    if (doctorResult.code === 0) {
      break;
    }
    await sleep(pollMs);
  }
}

if (plan.shouldRunVerifyFirst) {
  while (Date.now() < deadline) {
    const verifyResult = await runCommand("corepack", [
      "pnpm",
      "verify:macos:openclaw-registry-notifications",
    ], { env: childEnv });
    report.verifyAttempts.push({
      at: new Date().toISOString(),
      exitCode: verifyResult.code,
      stdout: verifyResult.stdout,
      stderr: verifyResult.stderr,
    });
    if (verifyResult.code === 0) {
      break;
    }
    await sleep(pollMs);
  }
}

let registryResult = { code: 1, stdout: "", stderr: "" };
if (plan.shouldRunRegistryE2E) {
  while (Date.now() < deadline) {
    registryResult = await runCommand("corepack", [
      "pnpm",
      "test:macos:openclaw-registry-e2e",
    ], { env: childEnv });
    report.registryE2EAttempts.push({
      at: new Date().toISOString(),
      exitCode: registryResult.code,
      stdout: registryResult.stdout,
      stderr: registryResult.stderr,
    });
    if (registryResult.code === 0) {
      report.result = "passed";
      break;
    }
    if (plan.waitStrategy !== "doctor_then_rerun") {
      break;
    }
    await sleep(pollMs);
  }
}

const settingsAutomationBoundary = report.settingsProbe?.stdout?.match(/notificationSettingsAutomationBoundary=([^\n]+)/)?.[1] ?? "unknown";
const verifyPassed = report.verifyAttempts.some((attempt) => attempt.exitCode === 0);
const registryPassed = report.registryE2EAttempts.some((attempt) => attempt.exitCode === 0);
report.result = deriveOpenClawRegistryNotificationRecoveryResult({
  registryPassed,
  verifyPassed,
  timedOut: report.result !== "passed",
  recoveryAction,
  settingsAutomationBoundary,
});

report.completedAt = new Date().toISOString();
await fs.mkdir(reportPath.split("/").slice(0, -1).join("/"), { recursive: true }).catch(() => {});
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

const htmlReportPath = deriveOpenClawRegistryNotificationRecoveryHtmlReportPath(reportPath);
const htmlReportResult = await runCommand(process.execPath, [
  "scripts/generate-macos-openclaw-registry-notification-recovery-report.mjs",
  reportPath,
  htmlReportPath,
], { env: childEnv });
report.htmlReportPath = htmlReportPath;
report.htmlReportExitCode = htmlReportResult.code;
if (htmlReportResult.stdout) {
  report.htmlReportStdout = htmlReportResult.stdout;
}
if (htmlReportResult.stderr) {
  report.htmlReportStderr = htmlReportResult.stderr;
}
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

process.stdout.write(`notificationRecoveryReport=${reportPath}\n`);
process.stdout.write(`notificationRecoveryHtmlReport=${htmlReportPath}\n`);
for (const line of buildOpenClawRegistryNotificationRecoveryResultGuidance(report.result)) {
  process.stdout.write(`${line}\n`);
}

if (report.result !== "passed") {
  process.exitCode = 1;
}
