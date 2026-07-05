#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { deleteAppleDoubleFiles } from "./lib/appledouble-cleanup.mjs";
import { buildNotificationPermissionClickAppleScript } from "./lib/macos-notification-permission.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const macosDir = path.join(repoRoot, "apps", "macos");
const apiDir = path.join(repoRoot, "apps", "api");
const derivedDataDir = path.join(macosDir, ".derived-data", "reminder-notification-e2e");
const projectPath = path.join(macosDir, "MindAnchorMac.xcodeproj");
const projectSpecPath = path.join(macosDir, "project.yml");
const appBundlePath = path.join(
  derivedDataDir,
  "Build",
  "Products",
  "Debug",
  "MindAnchorMac.app",
);
const appBinaryPath = path.join(appBundlePath, "Contents", "MacOS", "MindAnchorMac");

const runId = `${Date.now()}-${process.pid}`;
const runDir = path.join(os.tmpdir(), `mindanchor-macos-reminder-e2e-${runId}`);
const commandFile = path.join(runDir, "automation-command.json");
const responseFile = path.join(runDir, "automation-response.json");
const apiLogFile = path.join(runDir, "api.log");
const commandTimeoutMs = 15000;
const apiHealthTimeoutMs = 90000;
const e2eBundleIdentifier = `com.mindanchor.mac.e2e.${runId.replace(/[^a-zA-Z0-9]/g, "")}`;

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
    const server = createServer();
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
  await deleteAppleDoubleFiles(appBundlePath);
  await spawnCommand("codesign", ["--force", "--deep", "--sign", "-", appBundlePath]);
}

async function startApiServer({ port, dataFile }) {
  const inherited = { ...process.env };
  const hasCluster = typeof inherited.MINDANCHOR_OPENCLAW_BASE_URL === "string" && inherited.MINDANCHOR_OPENCLAW_BASE_URL.length > 0;
  const hasProvider =
    (typeof inherited.MINDANCHOR_DEFAULT_MODEL_BASE_URL === "string" && inherited.MINDANCHOR_DEFAULT_MODEL_BASE_URL.length > 0 &&
      typeof inherited.MINDANCHOR_DEFAULT_MODEL_API_KEY === "string" &&
      inherited.MINDANCHOR_DEFAULT_MODEL_API_KEY.length > 0) ||
    (typeof inherited.MINDANCHOR_OPENAI_BASE_URL === "string" &&
      inherited.MINDANCHOR_OPENAI_BASE_URL.length > 0 &&
      typeof inherited.MINDANCHOR_OPENAI_API_KEY === "string" &&
      inherited.MINDANCHOR_OPENAI_API_KEY.length > 0);

  assert(
    hasCluster || hasProvider,
    "未检测到可用的真实模型环境。请先配置 `MINDANCHOR_OPENCLAW_BASE_URL`，或配置 `MINDANCHOR_DEFAULT_MODEL_BASE_URL` + `MINDANCHOR_DEFAULT_MODEL_API_KEY`。",
  );

  const env = {
    ...inherited,
    MINDANCHOR_API_PORT: String(port),
    MINDANCHOR_DATA_FILE: dataFile,
    MINDANCHOR_AGENT_MODE: "openai-compatible",
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

async function postJson(url, body, token) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return getJson(url, {
    method: "POST",
    headers,
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

async function setLaunchEnvironment(environment) {
  for (const [key, value] of Object.entries(environment)) {
    await spawnCommand("launchctl", ["setenv", key, value], { quiet: true });
  }
}

async function clearLaunchEnvironment(environmentKeys) {
  for (const key of environmentKeys) {
    try {
      await spawnCommand("launchctl", ["unsetenv", key], { quiet: true });
    } catch {}
  }
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
  await setLaunchEnvironment(environment);
  log("==> 启动 MindAnchorMac");
  await spawnCommand("open", ["-na", appBundlePath], { quiet: true });
}

async function clickNotificationPermissionAllowIfPresent() {
  return runAppleScript(buildNotificationPermissionClickAppleScript());
}

async function waitForSignedInApp(expectedEmail) {
  const deadline = Date.now() + 45000;
  let permissionAccepted = false;
  while (Date.now() < deadline) {
    try {
      const permissionResult = await clickNotificationPermissionAllowIfPresent().catch(() => "not-found");
      if (permissionResult !== "not-found" && !permissionAccepted) {
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
        log(`==> 客户端通知状态：${snapshot.snapshot.notificationStatus}`);
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

async function createReminderSignalChain({ apiBaseUrl, token, userId }) {
  const now = Date.now();
  const events = [
    {
      userId,
      source: "desktop",
      eventType: "active_app",
      occurredAt: new Date(now - 1_000).toISOString(),
      clientEventId: `app-${runId}`,
      payload: { app: "Cursor" },
    },
    {
      userId,
      source: "desktop",
      eventType: "window_switch",
      occurredAt: new Date(now - 2_000).toISOString(),
      clientEventId: `switch-a-${runId}`,
      payload: { from: "Cursor", to: "Chrome" },
    },
    {
      userId,
      source: "desktop",
      eventType: "window_switch",
      occurredAt: new Date(now - 3_000).toISOString(),
      clientEventId: `switch-b-${runId}`,
      payload: { from: "Chrome", to: "Slack" },
    },
    {
      userId,
      source: "desktop",
      eventType: "idle",
      occurredAt: new Date(now - 4_000).toISOString(),
      clientEventId: `idle-${runId}`,
      payload: { idleSeconds: 240 },
    },
  ];

  await postJson(`${apiBaseUrl}/state/signals/batch`, { events }, token);
}

async function runAppleScript(source) {
  const { stdout } = await spawnCommand("osascript", ["-"], {
    input: source,
    quiet: true,
  });
  return stdout.trim();
}

async function activateBackgroundApp() {
  await runAppleScript(`
tell application "Finder"
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
  const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
  const dataFile = path.join(runDir, "mindanchor-e2e.json");
  const email = `mac-reminder-e2e-${runId}@example.com`;
  const password = `MindAnchor-${runId}`;
  const displayName = "MindAnchor Reminder E2E";
  const appLaunchEnvironment = {
    MINDANCHOR_API_BASE_URL: apiBaseUrl,
    MINDANCHOR_AUTH_BOOTSTRAP_MODE: "login",
    MINDANCHOR_AUTH_BOOTSTRAP_EMAIL: email,
    MINDANCHOR_AUTH_BOOTSTRAP_PASSWORD: password,
    MINDANCHOR_AUTH_BOOTSTRAP_DISPLAY_NAME: displayName,
    MINDANCHOR_AUTH_SESSION_ACCOUNT: `mindanchor-auth-session-e2e-${runId}`,
    MINDANCHOR_AUTOMATION_ENABLED: "1",
    MINDANCHOR_AUTOMATION_COMMAND_FILE: commandFile,
    MINDANCHOR_AUTOMATION_RESPONSE_FILE: responseFile,
    MINDANCHOR_INBOX_POLL_INTERVAL_SECONDS: "2",
    MINDANCHOR_HEARTBEAT_INTERVAL_SECONDS: "5",
    MINDANCHOR_REMINDER_POLLING_ONLY: "1",
    MINDANCHOR_AUTO_REQUEST_NOTIFICATIONS_ON_BOOTSTRAP: "1",
    MINDANCHOR_DISABLE_COLLECTOR: "1",
  };

  let api;
  try {
    await buildMacApp();
    api = await startApiServer({ port: apiPort, dataFile });

    const authSession = await registerOrLoginUser({
      apiBaseUrl,
      email,
      password,
      displayName,
    });
    const token = authSession.accessToken;
    const userId = authSession.user.id;
    log(`==> 测试用户：${email}`);

    await launchMacApp(appLaunchEnvironment);
    await waitForSignedInApp(email);

    const hiddenSnapshot = await sendAutomationCommand("close_main_window");
    assert(hiddenSnapshot.snapshot.mainWindowVisible === false, "主窗口未成功隐藏，无法稳定观察系统通知。");
    await activateBackgroundApp();

    log("==> 发送真实上游事件，触发提醒生成");
    await createReminderSignalChain({ apiBaseUrl, token, userId });

    const inboxOverview = await waitForCondition(
      "desktop_local pending inbox message",
      async () => {
        const overview = await getJson(`${apiBaseUrl}/client/inbox/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return overview.pendingMessages?.find((message) => message.channel === "desktop_local") ? overview : null;
      },
      120000,
      1500,
    );

    const pendingMessage = inboxOverview.pendingMessages.find((message) => message.channel === "desktop_local");
    assert(pendingMessage, "服务端没有生成 desktop_local 提醒。");
    log(`==> 已生成待提醒消息：${pendingMessage.title}`);

    await sendAutomationCommand("status_item_sync_now", 4000);

    log("==> 等待客户端接入提醒并确认系统通知层已接管");
    const reminderReadySnapshot = await waitForCondition(
      "macOS client pending reminder count",
      async () => {
        const snapshot = await sendAutomationCommand("snapshot", 4000);
        return snapshot.snapshot.pendingReminderCount > 0 ? snapshot : null;
      },
      60000,
      1000,
    );
    log(`==> 待提醒已入客户端，通知状态：${reminderReadySnapshot.snapshot.notificationStatus}`);

    const notificationAcceptedSnapshot = await waitForCondition(
      "system notification request accepted",
      async () => {
        const snapshot = await sendAutomationCommand("snapshot", 4000);
        return snapshot.snapshot.systemNotificationRequestIDs?.includes(pendingMessage.id) ? snapshot : null;
      },
      45000,
      1000,
    );
    log(`==> 系统通知层已接管 request：${pendingMessage.id}`);

    await sendAutomationCommand("status_item_open_reminders", 4000);

    await waitForCondition(
      "main window restored from status item",
      async () => {
        const snapshot = await sendAutomationCommand("snapshot", 4000);
        return snapshot.snapshot.mainWindowVisible === true &&
          snapshot.snapshot.selectedDestination === "reminders"
          ? snapshot
          : null;
      },
      30000,
      1000,
    );

    log("==> 通过应用自动化命令回写 Acknowledge");
    const ackCommandResponse = await waitForCondition(
      "automation acknowledge command",
      async () => {
        const response = await sendAutomationCommand(
          "acknowledge_reminder",
          4000,
          { messageID: pendingMessage.id },
        );
        return response.ok ? response : null;
      },
      15000,
      1000,
    );
    log(`==> 应用内 ack 已触发，当前页面：${ackCommandResponse.snapshot.selectedDestination}`);

    await waitForCondition(
      "inbox acknowledged state",
      async () => {
        const overview = await getJson(`${apiBaseUrl}/client/inbox/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const acknowledged = overview.acknowledgedMessages?.find((message) => message.id === pendingMessage.id);
        return acknowledged ? overview : null;
      },
      30000,
      1000,
    );

    const finalSnapshot = await sendAutomationCommand("snapshot", 4000);

    log("");
    log("✅ macOS 提醒通知整链路自动验收通过");
    log(`- API: ${apiBaseUrl}`);
    log(`- Adapter strategy: ${api.adapter.strategy}`);
    log(`- app bundle: ${appBundlePath}`);
    log(`- selected destination: ${finalSnapshot.snapshot.selectedDestination}`);
    log(`- pending reminder count after ack: ${finalSnapshot.snapshot.pendingReminderCount}`);
    log(`- system notification request ids: ${notificationAcceptedSnapshot.snapshot.systemNotificationRequestIDs.join(",")}`);
    log(`- command file: ${commandFile}`);
    log(`- response file: ${responseFile}`);
    log(`- api log: ${apiLogFile}`);
  } finally {
    await terminateAppPIDs();
    await clearLaunchEnvironment(Object.keys(appLaunchEnvironment));
    await stopApiServer(api);
  }
}

main().catch((error) => {
  process.stderr.write(`\n❌ macOS 提醒通知整链路自动验收失败\n${error.stack || error.message}\n`);
  process.stderr.write(`- command file: ${commandFile}\n`);
  process.stderr.write(`- response file: ${responseFile}\n`);
  process.stderr.write(`- api log: ${apiLogFile}\n`);
  process.exitCode = 1;
});
