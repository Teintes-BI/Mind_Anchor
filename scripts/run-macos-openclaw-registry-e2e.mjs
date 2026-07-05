#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  assertNoRegistryContractDrift,
  summarizeRegistryContractSummaryLines,
} from "./openclaw-registry-e2e-assertions.mjs";
import { launchMacAppProcess } from "./lib/macos-app-launcher.mjs";
import { buildNotificationPermissionClickAppleScript } from "./lib/macos-notification-permission.mjs";
import {
  buildSecurityAgentWindowSummary,
  findSecurityAgentWindow,
} from "./lib/macos-security-agent-window.mjs";
import { openClawRegistryE2EBundleIdentifier } from "./lib/macos-e2e-bundle-ids.mjs";
import { buildMacOSNotificationE2EGuidance } from "./lib/macos-notification-e2e-guidance.mjs";
import {
  buildOpenClawRegistryE2EAutoRecoverCommand,
  buildOpenClawRegistryE2EAutoRecoverEnv,
  shouldAutoRecoverOpenClawRegistryE2EFailure,
} from "./lib/macos-openclaw-registry-e2e-auto-recover.mjs";
import {
  buildOpenClawRegistryE2EAutoDiagnoseCommand,
  buildOpenClawRegistryE2EAutoDiagnoseEnv,
  shouldAutoDiagnoseOpenClawRegistryE2EFailure,
} from "./lib/macos-openclaw-registry-e2e-auto-diagnose.mjs";
import { parseProfilesShowJson } from "./lib/macos-installed-profiles.mjs";
import {
  deriveOpenClawRegistryNotificationProfileStatus,
  formatOpenClawRegistryNotificationCommand,
  formatOpenClawRegistryNotificationProfileStatus,
} from "./lib/macos-openclaw-registry-notification-prep.mjs";
import {
  defaultOpenClawRegistryNotificationRecoveryReportPath,
  deriveOpenClawRegistryNotificationRecoveryHtmlReportPath,
} from "./lib/macos-openclaw-registry-notification-recovery-check.mjs";
import {
  defaultMacOSNotificationCenterClickDiagnosticsHtmlPath,
  defaultMacOSNotificationCenterClickDiagnosticsReportPath,
} from "./lib/macos-notification-center-click-diagnostics.mjs";
import { parseMacOSNotificationDebugLog } from "./lib/macos-notification-debug-log.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const macosDir = path.join(repoRoot, "apps", "macos");
const projectPath = path.join(macosDir, "MindAnchorMac.xcodeproj");
const projectSpecPath = path.join(macosDir, "project.yml");
const derivedDataDir = path.join(macosDir, ".derived-data", "openclaw-registry-e2e");
const appBundlePath = path.join(
  derivedDataDir,
  "Build",
  "Products",
  "Debug",
  "MindAnchorMac.app",
);
const appBinaryPath = path.join(appBundlePath, "Contents", "MacOS", "MindAnchorMac");

const runId = `${Date.now()}-${process.pid}`;
const runDir = path.join(os.tmpdir(), `mindanchor-macos-openclaw-registry-${runId}`);
const commandFile = path.join(runDir, "automation-command.json");
const responseFile = path.join(runDir, "automation-response.json");
const apiLogFile = path.join(runDir, "api.log");
const runtimeLogFile = path.join(runDir, "openclaw-runtime.log");
const notificationDebugLogFile = path.join(runDir, "notification-debug.log");
const recoveryReportFile = defaultOpenClawRegistryNotificationRecoveryReportPath(repoRoot);
const recoveryHtmlReportFile = deriveOpenClawRegistryNotificationRecoveryHtmlReportPath(recoveryReportFile);
const clickDiagnosticsReportFile = defaultMacOSNotificationCenterClickDiagnosticsReportPath(repoRoot);
const clickDiagnosticsHtmlReportFile = defaultMacOSNotificationCenterClickDiagnosticsHtmlPath(repoRoot);
const commandTimeoutMs = 15000;
const apiHealthTimeoutMs = 90000;
const e2eBundleIdentifier =
  process.env.MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID ||
  openClawRegistryE2EBundleIdentifier;
const operationalAlertID = "mindanchor-openclaw-registry-alert";

function log(message) {
  process.stdout.write(`${message}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertReadableOutageRecovery(snapshot, checkpoint) {
  assert(
    typeof snapshot.openClawRegistryStatusTitle === "string" &&
      snapshot.openClawRegistryStatusTitle.includes("OpenClaw"),
    `${checkpoint}: 缺少可读的 OpenClaw 告警标题`,
  );
  assert(
    typeof snapshot.openClawRegistryStatusMessage === "string" &&
      snapshot.openClawRegistryStatusMessage.includes("OpenClaw") &&
      (
        snapshot.openClawRegistryStatusMessage.includes("请检查 OpenClaw runtime / Registry 是否在线") ||
        snapshot.openClawRegistryStatusMessage.includes("Check the OpenClaw runtime / Registry")
      ),
    `${checkpoint}: 缺少用户可执行的 OpenClaw 恢复指引`,
  );
}

async function ensureCleanDirectory(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
  await fs.mkdir(targetPath, { recursive: true });
}

function spawnCommand(command, args, options = {}) {
  const { quiet = false, input, ...spawnOptions } = options;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: ["pipe", "pipe", "pipe"],
      ...spawnOptions,
    });

    let stdout = "";
    let stderr = "";

    if (typeof input === "string" && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    } else {
      child.stdin?.end();
    }

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (!quiet) {
        process.stdout.write(text);
      }
    });

    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (!quiet) {
        process.stderr.write(text);
      }
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed with exit code ${code}\n${stderr || stdout}`,
        ),
      );
    });
  });
}

async function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address !== "object") {
        reject(new Error("Unable to allocate a free TCP port."));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
    server.on("error", reject);
  });
}

async function buildMacApp() {
  log("==> 生成 macOS Xcode 工程");
  await fs.rm(projectPath, { recursive: true, force: true });
  await spawnCommand("xcodegen", ["generate", "--spec", projectSpecPath, "--project", macosDir]);

  log("==> 构建 MindAnchorMac Debug 包");
  await fs.rm(derivedDataDir, { recursive: true, force: true });
  await spawnCommand("xcodebuild", [
    "-project",
    projectPath,
    "-scheme",
    "MindAnchorMac",
    "-configuration",
    "Debug",
    "-derivedDataPath",
    derivedDataDir,
    "-destination",
    "platform=macOS,arch=arm64",
    "CODE_SIGNING_ALLOWED=NO",
    `PRODUCT_BUNDLE_IDENTIFIER=${e2eBundleIdentifier}`,
    "build",
  ]);

  log("==> 对 E2E App 做 ad-hoc 签名");
  await spawnCommand("codesign", ["--force", "--deep", "--sign", "-", appBundlePath]);
}

async function startLocalOpenClawRuntime({ port }) {
  const env = {
    ...process.env,
    OPENCLAW_HOST: "127.0.0.1",
    OPENCLAW_PORT: String(port),
    OPENCLAW_RESPONSE_MODE: "parsed",
  };

  const logHandle = await fs.open(runtimeLogFile, "w");
  const runtimeProcess = spawn("node", ["openclaw/local-cluster-server.mjs"], {
    cwd: repoRoot,
    env,
    stdio: ["ignore", logHandle.fd, logHandle.fd],
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + apiHealthTimeoutMs;
  while (Date.now() < deadline) {
    if (runtimeProcess.exitCode !== null) {
      break;
    }

    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return {
          baseUrl,
          process: runtimeProcess,
          logHandle,
          stop: async () => {
            if (runtimeProcess.exitCode === null) {
              runtimeProcess.kill("SIGTERM");
              const stopDeadline = Date.now() + 5000;
              while (Date.now() < stopDeadline && runtimeProcess.exitCode === null) {
                await sleep(100);
              }
              if (runtimeProcess.exitCode === null) {
                runtimeProcess.kill("SIGKILL");
              }
            }
            await logHandle.close();
          },
        };
      }
    } catch {}

    await sleep(500);
  }

  const runtimeLog = await fs.readFile(runtimeLogFile, "utf8").catch(() => "");
  throw new Error(`OpenClaw local runtime 启动失败或超时。\n${runtimeLog}`);
}

async function startApiServer({ port, dataFile, openClawBaseUrl }) {
  const env = {
    ...process.env,
    MINDANCHOR_API_PORT: String(port),
    MINDANCHOR_DATA_FILE: dataFile,
    MINDANCHOR_AGENT_MODE: "openai-compatible",
    MINDANCHOR_OPENCLAW_BASE_URL: openClawBaseUrl,
  };

  const logHandle = await fs.open(apiLogFile, "w");
  const apiProcess = spawn(
    "corepack",
    ["pnpm", "--filter", "@mindanchor/api", "exec", "tsx", "src/index.ts"],
    {
      cwd: repoRoot,
      env,
      stdio: ["ignore", logHandle.fd, logHandle.fd],
    },
  );

  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + apiHealthTimeoutMs;
  while (Date.now() < deadline) {
    if (apiProcess.exitCode !== null) {
      break;
    }

    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        const adapter = await getJson(`${baseUrl}/debug/openclaw/adapter`);
        log(`==> API 已启动：${baseUrl}`);
        log(`==> Adapter strategy: ${adapter.strategy ?? adapter.adapter?.strategy ?? "unknown"}`);
        return {
          process: apiProcess,
          baseUrl,
          logHandle,
          adapter,
        };
      }
    } catch {}

    await sleep(500);
  }

  const apiLog = await fs.readFile(apiLogFile, "utf8").catch(() => "");
  throw new Error(`API 启动失败或超时。\n${apiLog}`);
}

async function stopApiServer(api) {
  if (!api) {
    return;
  }
  if (api.process.exitCode === null) {
    api.process.kill("SIGTERM");
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline && api.process.exitCode === null) {
      await sleep(100);
    }
    if (api.process.exitCode === null) {
      api.process.kill("SIGKILL");
    }
  }
  await api.logHandle?.close();
}

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method ?? "GET"} ${url} failed with ${response.status}: ${text}`);
  }
  return text.length > 0 ? JSON.parse(text) : {};
}

async function postJson(url, body) {
  return getJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function registerOrLoginUser({ apiBaseUrl, email, password, displayName }) {
  try {
    return await postJson(`${apiBaseUrl}/auth/register`, { email, password, displayName });
  } catch (error) {
    if (String(error).includes("409")) {
      return postJson(`${apiBaseUrl}/auth/login`, { email, password });
    }
    throw error;
  }
}

async function writeAutomationCommand(action, extra = {}) {
  const id = `${action}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await fs.rm(responseFile, { force: true });
  await fs.writeFile(commandFile, JSON.stringify({ id, action, ...extra }, null, 2), "utf8");
  return id;
}

async function waitForAutomationResponse(expectedId, timeoutMs = commandTimeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const payload = JSON.parse(await fs.readFile(responseFile, "utf8"));
      if (payload.id === expectedId) {
        return payload;
      }
    } catch {}
    await sleep(200);
  }
  throw new Error(`等待自动化响应超时：${expectedId}`);
}

async function sendAutomationCommand(action, timeoutMs = commandTimeoutMs, extra = {}) {
  const id = await writeAutomationCommand(action, extra);
  return waitForAutomationResponse(id, timeoutMs);
}

async function getMatchingAppPIDs() {
  const { stdout } = await spawnCommand("ps", ["-axo", "pid=,command="], { quiet: true });
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const firstSpace = line.indexOf(" ");
      return {
        pid: Number(line.slice(0, firstSpace)),
        command: line.slice(firstSpace + 1),
      };
    })
    .filter((entry) => entry.command.includes(appBinaryPath))
    .map((entry) => entry.pid);
}

async function terminateAppPIDs() {
  const pids = await getMatchingAppPIDs();
  if (pids.length === 0) {
    return;
  }

  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {}
  }

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const remaining = await getMatchingAppPIDs();
    if (remaining.length === 0) {
      return;
    }
    await sleep(100);
  }

  for (const pid of await getMatchingAppPIDs()) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
  }
}

async function launchMacApp(environment) {
  await terminateAppPIDs();
  log("==> 启动 MindAnchorMac");
  const child = launchMacAppProcess({
    appBundlePath,
    environment,
    cwd: repoRoot,
  });
  child.unref();
}

async function runAppleScript(source) {
  const { stdout } = await spawnCommand("osascript", ["-"], {
    input: source,
    quiet: true,
  });
  return stdout.trim();
}

async function clickNotificationPermissionAllowIfPresent() {
  return runAppleScript(buildNotificationPermissionClickAppleScript());
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
  const { stdout } = await spawnCommand("swift", ["-"], {
    input: source,
    quiet: true,
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
  const { stdout: xml } = await spawnCommand("profiles", [
    "show",
    "-type",
    "configuration",
    "-output",
    "stdout-xml",
  ], { quiet: true }).catch(() => ({ stdout: "" }));

  const { stdout: json } = await spawnCommand("plutil", ["-convert", "json", "-o", "-", "-"], {
    input: xml,
    quiet: true,
  }).catch(() => ({ stdout: "{}" }));

  return deriveOpenClawRegistryNotificationProfileStatus(
    parseProfilesShowJson(json),
    e2eBundleIdentifier,
  );
}

async function waitForSignedInApp(expectedEmail) {
  const deadline = Date.now() + 45000;
  let permissionAccepted = false;
  let securityAgentDetected = false;
  while (Date.now() < deadline) {
    try {
      const permissionResult = await clickNotificationPermissionAllowIfPresent().catch(() => "not-found");
      if (permissionResult === "security-agent-present") {
        if (!securityAgentDetected) {
          log("==> 已检测到 SecurityAgent 通知授权窗");
          securityAgentDetected = true;
        }
      } else if (permissionResult !== "not-found" && !permissionAccepted) {
        log(`==> 已接受通知权限：${permissionResult}`);
        permissionAccepted = true;
      }

      const snapshot = await sendAutomationCommand("snapshot", 4000);
      if (snapshot.snapshot.currentError) {
        throw new Error(`macOS 客户端启动失败：${snapshot.snapshot.currentError}`);
      }

      if (
        snapshot.snapshot.isSignedIn === true &&
        snapshot.snapshot.accountEmail === expectedEmail
      ) {
        return snapshot;
      }
    } catch (error) {
      if (String(error).includes("启动失败")) {
        throw error;
      }
    }

    await sleep(500);
  }

  throw new Error("等待 macOS 客户端登录超时。");
}

async function ensureNotificationPermissionGranted() {
  await activateMindAnchorApp().catch(() => {});
  await sendAutomationCommand("request_notification_permission", 4000);

  const deadline = Date.now() + 30000;
  let permissionAccepted = false;
  let securityAgentDetected = false;
  while (Date.now() < deadline) {
    await activateMindAnchorApp().catch(() => {});
    const permissionResult = await clickNotificationPermissionAllowIfPresent().catch(() => "not-found");
    if (permissionResult === "security-agent-present") {
      if (!securityAgentDetected) {
        log("==> 已检测到 SecurityAgent 通知授权窗");
        securityAgentDetected = true;
      }
    } else if (permissionResult !== "not-found" && !permissionAccepted) {
      log(`==> 已接受通知权限：${permissionResult}`);
      permissionAccepted = true;
    }

    try {
      const snapshot = await sendAutomationCommand("snapshot", 4000);
      if (snapshot.snapshot.notificationStatus === "Notifications allowed") {
        log(`==> 客户端通知状态：${snapshot.snapshot.notificationStatus}`);
        return snapshot;
      }
    } catch {}

    await sleep(500);
  }

  throw new Error("等待 macOS 通知权限就绪超时。");
}

async function waitForCondition(label, predicate, timeoutMs = 45000, intervalMs = 500) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await predicate();
    if (result) {
      return result;
    }
    await sleep(intervalMs);
  }
  throw new Error(`等待条件超时：${label}`);
}

async function activateBackgroundApp() {
  await runAppleScript(`
tell application "Finder"
  activate
end tell
`);
}

async function activateMindAnchorApp() {
  await runAppleScript(`
tell application "MindAnchorMac"
  activate
end tell
`);
}

async function clickSystemNotification({ title, message }) {
  const script = `
const targetTitle = ${JSON.stringify(title)};
const targetMessage = ${JSON.stringify(message)};
const se = Application("System Events");

function safe(fn, fallback = "") {
  try { return fn(); } catch (error) { return fallback; }
}

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
    if (
      role === "AXGroup" &&
      (subrole === "AXNotificationCenterBanner" || subrole === "AXNotificationCenterAlert")
    ) {
      groups.push(child);
    }
    groups = groups.concat(collectNotificationGroups(child));
  }

  return groups;
}

function clickBannerGroup(group, resultPrefix) {
  try {
    const buttons = group.buttons();
    if (buttons.length > 0) {
      buttons[0].click();
      return resultPrefix + "-button";
    }
  } catch (error) {}

  try {
    group.click();
    return resultPrefix + "-group";
  } catch (error) {}

  try {
    const elements = group.uiElements();
    if (elements.length > 0) {
      elements[0].click();
      return resultPrefix + "-child";
    }
  } catch (error) {}

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
  if (clicked) {
    clicked;
    return;
  }
}

try {
  const controlCenter = se.processes.byName("ControlCenter");
  controlCenter.menuBars[0].menuBarItems().slice(-1)[0].click();
} catch (error) {}

delay(0.75);

notificationProcess.frontmost = true;
for (const window of notificationProcess.windows()) {
  const clicked = scanNotificationWindow(window, "clicked-history");
  if (clicked) {
    clicked;
    return;
  }
}

"not-found";
`;

  const { stdout } = await spawnCommand("osascript", ["-l", "JavaScript"], {
    input: script,
    quiet: true,
  });
  return stdout.trim();
}

async function dumpNotificationCenter() {
  const script = `
tell application "System Events"
  tell process "NotificationCenter"
    try
      set historyWindowVisible to exists (first window whose name is "Notification Center")
    on error
      set historyWindowVisible to false
    end try
  end tell

  if historyWindowVisible is false then
    tell process "ControlCenter"
      try
        click last menu bar item of menu bar 1
      end try
    end tell
  end if
end tell

delay 0.75

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
      try
        repeat with g in (every group of entire contents of w)
          try
            set gSubrole to value of attribute "AXSubrole" of g as text
          on error
            set gSubrole to ""
          end try
          try
            set gDesc to value of attribute "AXDescription" of g as text
          on error
            set gDesc to ""
          end try
          if gSubrole is not "" or gDesc is not "" then
            set end of output to "group:" & gSubrole & "|" & gDesc
          end if
        end repeat
      end try
    end repeat
    return output
  end tell
end tell
`;
  return runAppleScript(script);
}

async function main() {
  await ensureCleanDirectory(runDir);

  const apiPort = await findAvailablePort();
  const runtimePort = await findAvailablePort();
  let runtime = await startLocalOpenClawRuntime({ port: runtimePort });
  const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
  const dataFile = path.join(runDir, "mindanchor-openclaw-registry-e2e.json");
  const email = `mac-registry-e2e-${runId}@example.com`;
  const password = `MindAnchor-${runId}`;
  const displayName = "MindAnchor Registry E2E";
  const appLaunchEnvironment = {
    MINDANCHOR_API_BASE_URL: apiBaseUrl,
    MINDANCHOR_AUTH_BOOTSTRAP_MODE: "login",
    MINDANCHOR_AUTH_BOOTSTRAP_EMAIL: email,
    MINDANCHOR_AUTH_BOOTSTRAP_PASSWORD: password,
    MINDANCHOR_AUTH_BOOTSTRAP_DISPLAY_NAME: displayName,
    MINDANCHOR_AUTH_SESSION_ACCOUNT: `mindanchor-auth-session-registry-e2e-${runId}`,
    MINDANCHOR_AUTOMATION_ENABLED: "1",
    MINDANCHOR_AUTOMATION_COMMAND_FILE: commandFile,
    MINDANCHOR_AUTOMATION_RESPONSE_FILE: responseFile,
    MINDANCHOR_INBOX_POLL_INTERVAL_SECONDS: "2",
    MINDANCHOR_HEARTBEAT_INTERVAL_SECONDS: "5",
    MINDANCHOR_REMINDER_POLLING_ONLY: "1",
    MINDANCHOR_AUTO_REQUEST_NOTIFICATIONS_ON_BOOTSTRAP: "0",
    MINDANCHOR_DISABLE_COLLECTOR: "1",
    MINDANCHOR_NOTIFICATION_DEBUG_LOG_FILE: notificationDebugLogFile,
  };

  let api;
  try {
    await buildMacApp();
    api = await startApiServer({ port: apiPort, dataFile, openClawBaseUrl: runtime.baseUrl });

    await registerOrLoginUser({
      apiBaseUrl,
      email,
      password,
      displayName,
    });
    log(`==> 测试用户：${email}`);

    await launchMacApp(appLaunchEnvironment);
    await waitForSignedInApp(email);
    await ensureNotificationPermissionGranted();

    const todaySnapshot = await waitForCondition(
      "today openclaw aligned callout",
      async () => {
        await sendAutomationCommand("status_item_open_main_window", 4000);
        await sendAutomationCommand("refresh_openclaw_registry", 4000);
        const response = await sendAutomationCommand("snapshot", 4000);
        const snapshot = response.snapshot;
        if (
          snapshot.mainWindowVisible === true &&
          snapshot.selectedDestination === "today" &&
          snapshot.openClawRegistryStatusTone === "good"
        ) {
          return response;
        }
        return null;
      },
      30000,
      1000,
    );

    assertNoRegistryContractDrift(todaySnapshot.snapshot, "today aligned registry");
    log(`==> Today 已对齐：${todaySnapshot.snapshot.openClawRegistryStatusTitle}`);
    log(
      `==> Today contract summary: ${summarizeRegistryContractSummaryLines(
        todaySnapshot.snapshot.openClawRegistryContractSummaryLines,
      )}`,
    );

    await sendAutomationCommand("close_main_window", 4000);
    await activateBackgroundApp();

    log("==> 关闭外部 OpenClaw runtime，制造真实不可达");
    await runtime.stop();
    runtime = null;

    const outageSnapshot = await waitForCondition(
      "openclaw registry unreachable notification",
      async () => {
        await sendAutomationCommand("refresh_openclaw_registry", 4000);
        const snapshot = await sendAutomationCommand("snapshot", 4000);
        if (
          snapshot.snapshot.openClawRegistryStatusTone === "danger" &&
          snapshot.snapshot.systemNotificationRequestIDs.includes(operationalAlertID)
        ) {
          return snapshot;
        }
        return null;
      },
      45000,
      1500,
    );

    log(`==> 已进入告警状态：${outageSnapshot.snapshot.openClawRegistryStatusTitle}`);
    assertReadableOutageRecovery(outageSnapshot.snapshot, "outage snapshot");

    const notificationClickResult = await waitForCondition(
      "system notification click",
      async () => {
        const result = await clickSystemNotification({
          title: outageSnapshot.snapshot.openClawRegistryStatusTitle,
          message: outageSnapshot.snapshot.openClawRegistryStatusMessage,
        }).catch(() => "not-found");
        return result !== "not-found" ? result : null;
      },
      30000,
      1500,
    );

    log(`==> 已点击真实系统通知：${notificationClickResult}`);

    const settingsSnapshot = await waitForCondition(
      "notification click opens settings",
      async () => {
        const snapshot = await sendAutomationCommand("snapshot", 4000);
        if (
          snapshot.snapshot.mainWindowVisible === true &&
          snapshot.snapshot.selectedDestination === "settings" &&
          snapshot.snapshot.openClawRegistryStatusTone === "danger"
        ) {
          return snapshot;
        }
        return null;
      },
      30000,
      1000,
    );
    assertReadableOutageRecovery(settingsSnapshot.snapshot, "settings snapshot");

    log("");
    log("✅ macOS OpenClaw registry 告警链路自动验收通过");
    log(`- API: ${apiBaseUrl}`);
    log(`- OpenClaw runtime: ${runtime.baseUrl}`);
    log(`- app bundle: ${appBundlePath}`);
    log(`- today status: ${todaySnapshot.snapshot.openClawRegistryStatusTitle}`);
    log(
      `- today contract summary: ${summarizeRegistryContractSummaryLines(
        todaySnapshot.snapshot.openClawRegistryContractSummaryLines,
      )}`,
    );
    log(`- outage status: ${settingsSnapshot.snapshot.openClawRegistryStatusTitle}`);
    log(`- outage recovery: ${settingsSnapshot.snapshot.openClawRegistryStatusMessage}`);
    log(
      `- outage contract summary: ${summarizeRegistryContractSummaryLines(
        settingsSnapshot.snapshot.openClawRegistryContractSummaryLines,
      )}`,
    );
    log(`- final destination: ${settingsSnapshot.snapshot.selectedDestination}`);
    log(`- notification request ids: ${settingsSnapshot.snapshot.systemNotificationRequestIDs.join(",")}`);
    log(`- command file: ${commandFile}`);
    log(`- response file: ${responseFile}`);
    log(`- api log: ${apiLogFile}`);
    log(`- runtime log: ${runtimeLogFile}`);
    log(`- notification debug log: ${notificationDebugLogFile}`);
  } finally {
    await terminateAppPIDs();
    if (runtime) {
      await runtime.stop().catch(() => {});
    }
    await stopApiServer(api);
  }
}

main().catch(async (error) => {
  process.stderr.write(`\n❌ macOS OpenClaw registry 告警链路自动验收失败\n${error.stack || error.message}\n`);
  let notificationDebugLog = "";
  let notificationDebugSummary = parseMacOSNotificationDebugLog("");
  try {
    notificationDebugLog = await fs.readFile(notificationDebugLogFile, "utf8");
    notificationDebugSummary = parseMacOSNotificationDebugLog(notificationDebugLog);
  } catch {}
  try {
    const dump = await dumpNotificationCenter();
    process.stderr.write(`\n--- Notification Center Dump ---\n${dump}\n`);
  } catch {}
  process.stderr.write(`- command file: ${commandFile}\n`);
  process.stderr.write(`- response file: ${responseFile}\n`);
  process.stderr.write(`- api log: ${apiLogFile}\n`);
  process.stderr.write(`- runtime log: ${runtimeLogFile}\n`);
  process.stderr.write(`- notification debug log: ${notificationDebugLogFile}\n`);
  try {
    const securityAgentWindow = await querySecurityAgentWindow();
    const notificationProfileStatus = await queryInstalledNotificationProfileStatus();
    process.stderr.write(`- ${buildSecurityAgentWindowSummary(securityAgentWindow)}\n`);
    process.stderr.write(`- ${formatOpenClawRegistryNotificationProfileStatus(notificationProfileStatus)}\n`);
    process.stderr.write(`- notificationDebugState=${notificationDebugSummary.inferredState}\n`);
    process.stderr.write(`- notificationDebugStatus=${notificationDebugSummary.lastAuthorizationStatus ?? "unknown"}\n`);
    process.stderr.write(`- notificationDebugContext=${notificationDebugSummary.lastContext ?? "unknown"}\n`);
    for (const line of buildMacOSNotificationE2EGuidance({
      bundleIdentifier: e2eBundleIdentifier,
      title: "OpenClaw Registry 不可达",
      message: "已配置外部 OpenClaw runtime，但当前无法连通",
      debugLogPath: notificationDebugLogFile,
      recoveryReportPath: recoveryReportFile,
      recoveryHtmlReportPath: recoveryHtmlReportFile,
      clickDiagnosticsReportPath: clickDiagnosticsReportFile,
      clickDiagnosticsHtmlPath: clickDiagnosticsHtmlReportFile,
      hasSecurityAgentWindow: Boolean(securityAgentWindow),
      notificationProfileStatus,
      notificationDebugState: notificationDebugSummary.inferredState,
    })) {
      process.stderr.write(`- ${line}\n`);
    }
  } catch {}
  const doctorCommand = formatOpenClawRegistryNotificationCommand(
    e2eBundleIdentifier,
    `corepack pnpm doctor:macos:openclaw-registry-notifications ${notificationDebugLogFile}`,
  );
  process.stderr.write(`- doctor command: ${doctorCommand}\n`);
  if (shouldAutoDiagnoseOpenClawRegistryE2EFailure({
    notificationDebugState: notificationDebugSummary.inferredState,
    environment: process.env,
  })) {
    const diagnoseArgs = buildOpenClawRegistryE2EAutoDiagnoseCommand({
      title: "OpenClaw Registry 不可达",
      message: "已配置外部 OpenClaw runtime，但当前无法连通",
      debugLogPath: notificationDebugLogFile,
      reportPath: clickDiagnosticsReportFile,
      htmlPath: clickDiagnosticsHtmlReportFile,
    });
    const diagnoseEnv = buildOpenClawRegistryE2EAutoDiagnoseEnv({
      bundleIdentifier: e2eBundleIdentifier,
      baseEnv: process.env,
    });
    process.stderr.write(`- auto diagnose: starting\n`);
    const diagnoseResult = await spawnCommand("corepack", diagnoseArgs, {
      env: diagnoseEnv,
      quiet: true,
    }).catch((diagnoseError) => ({
      stdout: "",
      stderr: String(diagnoseError?.message ?? diagnoseError),
      failed: true,
    }));
    process.stderr.write(`- auto diagnose report: ${clickDiagnosticsReportFile}\n`);
    process.stderr.write(`- auto diagnose html: ${clickDiagnosticsHtmlReportFile}\n`);
    if (diagnoseResult.stdout?.trim()) {
      process.stderr.write(`\n--- Auto Diagnose Stdout ---\n${diagnoseResult.stdout}\n`);
    }
    if (diagnoseResult.stderr?.trim()) {
      process.stderr.write(`\n--- Auto Diagnose Stderr ---\n${diagnoseResult.stderr}\n`);
    }
  }
  if (shouldAutoRecoverOpenClawRegistryE2EFailure(process.env)) {
    const recoverArgs = buildOpenClawRegistryE2EAutoRecoverCommand({
      debugLogPath: notificationDebugLogFile,
      reportPath: recoveryReportFile,
    });
    const recoverEnv = buildOpenClawRegistryE2EAutoRecoverEnv({
      bundleIdentifier: e2eBundleIdentifier,
      baseEnv: process.env,
    });
    process.stderr.write(`- auto recover: starting\n`);
    const recoverResult = await spawnCommand("corepack", recoverArgs, {
      env: recoverEnv,
      quiet: true,
    }).catch((recoverError) => ({
      stdout: "",
      stderr: String(recoverError?.message ?? recoverError),
      failed: true,
    }));
    process.stderr.write(`- auto recover report: ${recoveryReportFile}\n`);
    process.stderr.write(`- auto recover html: ${recoveryHtmlReportFile}\n`);
    if (recoverResult.stdout?.trim()) {
      process.stderr.write(`\n--- Auto Recover Stdout ---\n${recoverResult.stdout}\n`);
    }
    if (recoverResult.stderr?.trim()) {
      process.stderr.write(`\n--- Auto Recover Stderr ---\n${recoverResult.stderr}\n`);
    }
  }
  if (notificationDebugLog.trim()) {
    process.stderr.write(`\n--- Notification Debug Log ---\n${notificationDebugLog}\n`);
  }
  process.exitCode = 1;
});
