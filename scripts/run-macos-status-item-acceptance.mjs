#!/usr/bin/env node

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const macosDir = path.join(repoRoot, "apps", "macos");
const derivedDataDir = path.join(macosDir, ".derived-data", "status-item-acceptance");
const projectPath = path.join(macosDir, "MindAnchorMac.xcodeproj");
const projectSpecPath = path.join(macosDir, "project.yml");
const appBundlePath = path.join(
  derivedDataDir,
  "Build",
  "Products",
  "Debug",
  "MindAnchorMac.app",
);
const appBinaryPath = path.join(
  appBundlePath,
  "Contents",
  "MacOS",
  "MindAnchorMac",
);

const runId = `${Date.now()}-${process.pid}`;
const runDir = path.join(os.tmpdir(), `mindanchor-macos-status-item-${runId}`);
const commandFile = path.join(runDir, "automation-command.json");
const responseFile = path.join(runDir, "automation-response.json");
const commandTimeoutMs = 15000;
const commandPollMs = 200;

const launchEnvironment = {
  MINDANCHOR_API_BASE_URL: process.env.MINDANCHOR_API_BASE_URL ?? "http://127.0.0.1:3001",
  MINDANCHOR_AUTOMATION_ENABLED: "1",
  MINDANCHOR_AUTOMATION_COMMAND_FILE: commandFile,
  MINDANCHOR_AUTOMATION_RESPONSE_FILE: responseFile,
};

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
  const { quiet = false, ...spawnOptions } = options;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
      ...spawnOptions,
    });

    let stdout = "";
    let stderr = "";

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

async function buildMacApp() {
  log("==> 生成 Xcode 工程");
  await fs.rm(projectPath, { recursive: true, force: true });
  await spawnCommand("xcodegen", ["generate", "--spec", projectSpecPath, "--project", macosDir], {
    cwd: repoRoot,
  });

  log("==> 构建 MindAnchorMac Debug 包");
  await fs.rm(derivedDataDir, { recursive: true, force: true });
  await spawnCommand(
    "xcodebuild",
    [
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
      "build",
    ],
    { cwd: repoRoot },
  );
}

async function writeCommand(action) {
  const id = `${action}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await fs.rm(responseFile, { force: true });
  await fs.writeFile(
    commandFile,
    JSON.stringify({ id, action }, null, 2),
    "utf8",
  );
  return id;
}

async function waitForResponse(expectedId) {
  const deadline = Date.now() + commandTimeoutMs;

  while (Date.now() < deadline) {
    try {
      const payload = JSON.parse(await fs.readFile(responseFile, "utf8"));
      if (payload.id === expectedId) {
        return payload;
      }
    } catch {
      // keep polling until the app writes a response
    }

    await sleep(commandPollMs);
  }

  throw new Error(`等待自动化响应超时：${expectedId}`);
}

async function sendAndAssert(action, validator) {
  const id = await writeCommand(action);
  const response = await waitForResponse(id);
  assert(response.ok === true, `${action} 返回 ok=false`);
  validator(response);
  return response;
}

async function getMatchingAppPIDs() {
  const { stdout } = await spawnCommand("ps", ["-axo", "pid=,command="], {
    cwd: repoRoot,
    quiet: true,
  });

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
    } catch {
      // ignore missing processes
    }
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
    } catch {
      // ignore missing processes
    }
  }
}

async function setLaunchEnvironment() {
  for (const [key, value] of Object.entries(launchEnvironment)) {
    await spawnCommand("launchctl", ["setenv", key, value], { cwd: repoRoot });
  }
}

async function clearLaunchEnvironment() {
  for (const key of Object.keys(launchEnvironment)) {
    try {
      await spawnCommand("launchctl", ["unsetenv", key], { cwd: repoRoot });
    } catch {
      // ignore cleanup errors
    }
  }
}

async function launchAppBundle() {
  await terminateAppPIDs();
  await setLaunchEnvironment();
  log("==> 启动 MindAnchorMac 自动验收实例");
  await spawnCommand("open", ["-na", appBundlePath], { cwd: repoRoot });
}

async function main() {
  await ensureCleanDirectory(runDir);
  await buildMacApp();
  await launchAppBundle();

  try {
    await sleep(2500);

    log("==> 校验初始主窗口可见");
    await sendAndAssert("snapshot", (response) => {
      assert(
        response.snapshot.mainWindowVisible === true,
        `初始主窗口应可见，实际为 ${response.snapshot.mainWindowVisible}`,
      );
      assert(
        response.snapshot.selectedDestination === "today",
        `初始目标页应为 today，实际为 ${response.snapshot.selectedDestination}`,
      );
    });

    log("==> 校验主窗口可被隐藏");
    await sendAndAssert("close_main_window", (response) => {
      assert(
        response.snapshot.mainWindowVisible === false,
        `关闭后主窗口应隐藏，实际为 ${response.snapshot.mainWindowVisible}`,
      );
    });

    log("==> 校验状态项可恢复主窗口到 Today");
    await sendAndAssert("status_item_open_main_window", (response) => {
      assert(
        response.snapshot.mainWindowVisible === true,
        `状态项恢复后主窗口应可见，实际为 ${response.snapshot.mainWindowVisible}`,
      );
      assert(
        response.snapshot.selectedDestination === "today",
        `状态项恢复后应落到 today，实际为 ${response.snapshot.selectedDestination}`,
      );
    });

    log("==> 校验状态项可打开 Reminders");
    await sendAndAssert("status_item_open_reminders", (response) => {
      assert(
        response.snapshot.mainWindowVisible === true,
        `打开提醒后主窗口应可见，实际为 ${response.snapshot.mainWindowVisible}`,
      );
      assert(
        response.snapshot.selectedDestination === "reminders",
        `打开提醒后应落到 reminders，实际为 ${response.snapshot.selectedDestination}`,
      );
    });

    log("");
    log("✅ macOS 状态项恢复主窗口自动验收通过");
    log(`- app bundle: ${appBundlePath}`);
    log(`- command file: ${commandFile}`);
    log(`- response file: ${responseFile}`);
  } finally {
    await terminateAppPIDs();
    await clearLaunchEnvironment();
  }
}

main().catch((error) => {
  process.stderr.write(`\n❌ macOS 状态项自动验收失败\n${error.stack || error.message}\n`);
  process.stderr.write(`- command file: ${commandFile}\n`);
  process.stderr.write(`- response file: ${responseFile}\n`);
  process.exitCode = 1;
});
