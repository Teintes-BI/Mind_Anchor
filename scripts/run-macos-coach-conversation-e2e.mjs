#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { deleteAppleDoubleFiles } from "./lib/appledouble-cleanup.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const macosDir = path.join(repoRoot, "apps", "macos");
const projectPath = path.join(macosDir, "MindAnchorMac.xcodeproj");
const projectSpecPath = path.join(macosDir, "project.yml");
const derivedDataDir = path.join(macosDir, ".derived-data", "coach-conversation-e2e");
const appBundlePath = path.join(
  derivedDataDir,
  "Build",
  "Products",
  "Debug",
  "MindAnchorMac.app",
);
const appBinaryPath = path.join(appBundlePath, "Contents", "MacOS", "MindAnchorMac");

const runId = `${Date.now()}-${process.pid}`;
const runDir = path.join(os.tmpdir(), `mindanchor-macos-coach-conversation-${runId}`);
const commandFile = path.join(runDir, "automation-command.json");
const responseFile = path.join(runDir, "automation-response.json");
const apiLogFile = path.join(runDir, "api.log");
const runtimeLogFile = path.join(runDir, "openclaw-runtime.log");
const commandTimeoutMs = 20000;
const healthTimeoutMs = 90000;
const e2eBundleIdentifier = `com.mindanchor.mac.coach.${runId.replace(/[^a-zA-Z0-9]/g, "")}`;
const draftText = "我更适合先拿到一个短句、明确、能立刻开始的下一步。";
const governanceText = "请忘记我偏好短句这条记忆。";

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
    }
    child.stdin?.end();

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
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}\n${stderr || stdout}`));
    });
  });
}

async function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address !== "object") {
        reject(new Error("Unable to allocate a TCP port."));
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
  log("==> Generating Xcode project");
  await fs.rm(projectPath, { recursive: true, force: true });
  await spawnCommand("xcodegen", ["generate", "--spec", projectSpecPath, "--project", macosDir]);

  log("==> Building MindAnchorMac Debug app");
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

  log("==> Applying ad-hoc signature");
  await deleteAppleDoubleFiles(appBundlePath);
  await spawnCommand("codesign", ["--force", "--deep", "--sign", "-", appBundlePath], { quiet: true });
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
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return getJson(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function listCoachMemories(apiBaseUrl, token) {
  return getJson(`${apiBaseUrl}/coach/memories`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
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
  const deadline = Date.now() + healthTimeoutMs;
  while (Date.now() < deadline) {
    if (runtimeProcess.exitCode !== null) {
      break;
    }
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        return {
          process: runtimeProcess,
          baseUrl,
          logHandle,
        };
      }
    } catch {}
    await sleep(500);
  }

  const runtimeLog = await fs.readFile(runtimeLogFile, "utf8").catch(() => "");
  throw new Error(`OpenClaw local runtime failed to start.\n${runtimeLog}`);
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
  const deadline = Date.now() + healthTimeoutMs;
  while (Date.now() < deadline) {
    if (apiProcess.exitCode !== null) {
      break;
    }
    try {
      const health = await getJson(`${baseUrl}/health`);
      if (health.ok) {
        return { process: apiProcess, baseUrl, logHandle };
      }
    } catch {}
    await sleep(500);
  }

  const apiLog = await fs.readFile(apiLogFile, "utf8").catch(() => "");
  throw new Error(`API failed to start.\n${apiLog}`);
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
  throw new Error(`Timed out waiting for automation response: ${expectedId}`);
}

async function sendAutomationCommand(action, extra = {}, timeoutMs = commandTimeoutMs) {
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
  log("==> Launching MindAnchorMac");
  await spawnCommand("open", ["-na", appBundlePath], { quiet: true });
}

async function waitForSignedInApp(expectedEmail) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    try {
      const snapshot = await sendAutomationCommand("snapshot", {}, 4000);
      if (
        snapshot.snapshot.isSignedIn === true &&
        snapshot.snapshot.accountEmail === expectedEmail
      ) {
        return snapshot;
      }
    } catch {}
    await sleep(500);
  }
  throw new Error("Timed out waiting for macOS app sign-in.");
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
  throw new Error(`Timed out waiting for condition: ${label}`);
}

async function readVisibleStaticTexts() {
  const script = `
const se = Application("System Events");
const p = se.processes.byName("MindAnchorMac");
let texts = [];
try {
  const windows = p.windows();
  if (windows.length > 0) {
    texts = windows[0].entireContents().filter((e) => {
      try {
        const role = e.role();
        return role === "AXStaticText" || role === "AXTextArea" || role === "AXTextField";
      } catch (err) {
        return false;
      }
    }).map((e) => {
      try { return e.value(); } catch (err) { return ""; }
    }).filter(Boolean);
  }
} catch (err) {}
console.log(texts.join("\\n"));
`;
  const { stdout } = await spawnCommand("osascript", ["-l", "JavaScript", "-e", script], { quiet: true });
  return stdout;
}

async function readComposerValue() {
  const script = `
const se = Application("System Events");
const p = se.processes.byName("MindAnchorMac");
try {
  const windows = p.windows();
  if (windows.length > 0) {
    const fields = windows[0].entireContents().filter((e) => {
      try { return e.role() === "AXTextArea"; } catch (err) { return false; }
    });
    if (fields.length > 0) {
      console.log(String(fields[0].value()));
    }
  }
} catch (err) {
}
`;
  const { stdout } = await spawnCommand("osascript", ["-l", "JavaScript", "-e", script], { quiet: true });
  return stdout.trim();
}

async function main() {
  await ensureCleanDirectory(runDir);

  const apiPort = await findAvailablePort();
  const dataFile = path.join(runDir, "mindanchor-e2e.json");
  const runtimePort = await findAvailablePort();
  const runtime = await startLocalOpenClawRuntime({ port: runtimePort });
  const api = await startApiServer({ port: apiPort, dataFile, openClawBaseUrl: runtime.baseUrl });
  const apiBaseUrl = api.baseUrl;

  const email = `coach-e2e-${runId}@example.com`;
  const password = "Password123";
  const displayName = "Coach E2E";
  const session = await registerOrLoginUser({ apiBaseUrl, email, password, displayName });
  const token = session.accessToken;

  const launchEnvironment = {
    MINDANCHOR_API_BASE_URL: apiBaseUrl,
    MINDANCHOR_AUTOMATION_ENABLED: "1",
    MINDANCHOR_AUTOMATION_COMMAND_FILE: commandFile,
    MINDANCHOR_AUTOMATION_RESPONSE_FILE: responseFile,
    MINDANCHOR_AUTH_BOOTSTRAP_MODE: "login",
    MINDANCHOR_AUTH_BOOTSTRAP_EMAIL: email,
    MINDANCHOR_AUTH_BOOTSTRAP_PASSWORD: password,
    MINDANCHOR_AUTH_SESSION_ACCOUNT: `mindanchor-auth-session-coach-e2e-${runId}`,
    MINDANCHOR_DISABLE_COLLECTOR: "1",
  };

  await buildMacApp();
  await launchMacApp(launchEnvironment);

  try {
    log("==> Waiting for signed-in app");
    await waitForSignedInApp(email);

    log("==> Opening Coach page");
    let response = await sendAutomationCommand("open_coach");
    assert(response.snapshot.selectedDestination === "coach", `Expected coach destination, got ${response.snapshot.selectedDestination}`);

    log("==> Setting composer draft");
    response = await sendAutomationCommand("set_coach_draft_text", { text: draftText });
    assert(response.snapshot.coach?.draftText === draftText, "Automation snapshot did not store the coach draft text.");

    log("==> Sending coach message");
    await sendAutomationCommand("send_coach_message");

    const pendingSnapshot = await waitForCondition("assistant fast response", async () => {
      const snapshot = await sendAutomationCommand("snapshot");
      const coach = snapshot.snapshot.coach;
      if (!coach) {
        return null;
      }
      if (
        coach.messageCount >= 2 &&
        coach.lastUserMessageText === draftText &&
        typeof coach.lastAssistantFastResponse === "string" &&
        coach.lastAssistantFastResponse.length > 0
      ) {
        return snapshot;
      }
      return null;
    });

    assert(
      ["pending_full", "completed"].includes(pendingSnapshot.snapshot.coach?.lastAssistantStatus ?? ""),
      `Expected pending_full or completed after send, got ${pendingSnapshot.snapshot.coach?.lastAssistantStatus}`,
    );

    const completedSnapshot = await waitForCondition("assistant full response", async () => {
      const snapshot = await sendAutomationCommand("refresh_coach");
      const coach = snapshot.snapshot.coach;
      if (!coach) {
        return null;
      }
      if ((coach.lastAssistantFullResponse ?? "").length > 0) {
        return snapshot;
      }
      return null;
    }, 60000, 1000);

    assert(completedSnapshot.snapshot.coach?.lastAssistantStatus === "completed", "Assistant message did not complete.");
    assert(
      (completedSnapshot.snapshot.coach?.lastAssistantExecutionTrail ?? []).some((line) => line.includes("OpenClaw")),
      `Expected execution trail to include OpenClaw route context, got ${(completedSnapshot.snapshot.coach?.lastAssistantExecutionTrail ?? []).join(" | ")}`,
    );

    await sendAutomationCommand("open_coach");

    assert(completedSnapshot.snapshot.coach?.lastUserMessageText === draftText, "App snapshot does not show the raw user message text.");
    const visibleTexts = await readVisibleStaticTexts();
    if (visibleTexts.includes("Fast Response") && visibleTexts.includes("Full Response")) {
      log("==> Accessibility confirms Fast Response / Full Response are visible");
    } else {
      log("==> Accessibility could not stably confirm Fast Response / Full Response; relying on app snapshot for pass/fail");
    }

    log("==> Submitting helpful feedback");
    const feedbackSnapshot = await waitForCondition("helpful feedback persisted", async () => {
      const snapshot = await sendAutomationCommand("coach_feedback_helpful");
      if (snapshot.snapshot.coach?.lastFeedbackLabel === "helpful") {
        return snapshot;
      }
      return null;
    }, 20000, 500);
    assert(feedbackSnapshot.snapshot.coach?.lastFeedbackLabel === "helpful", "Coach feedback did not persist.");

    log("==> Revoking active conversation memory");
    const memoriesBeforeRevoke = await waitForCondition("active memory available", async () => {
      const memories = await listCoachMemories(apiBaseUrl, token);
      return memories.some((memory) => memory.status === "active") ? memories : null;
    }, 20000, 500);
    await sendAutomationCommand("coach_revoke_memory");
    const revokeResult = await waitForCondition("memory revoked", async () => {
      const memories = await listCoachMemories(apiBaseUrl, token);
      const revokedCount = memories.filter((memory) => memory.status === "revoked").length;
      if (revokedCount > memoriesBeforeRevoke.filter((memory) => memory.status === "revoked").length) {
        return { memories, revokedCount };
      }
      return null;
    }, 20000, 500);

    const revokeSnapshot = await sendAutomationCommand("refresh_coach");
    assert(revokeResult.revokedCount >= 1, "Conversation memory revoke did not persist.");

    const finalTexts = await readVisibleStaticTexts();
    if (finalTexts.includes("Helpful") && finalTexts.includes("Revoked")) {
      log("==> Accessibility confirms Helpful / Revoked are visible");
    } else {
      log("==> Accessibility could not stably confirm Helpful / Revoked; relying on app snapshot for pass/fail");
    }

    log("==> Sending memory governance message");
    response = await sendAutomationCommand("set_coach_draft_text", { text: governanceText });
    assert(response.snapshot.coach?.draftText === governanceText, "Automation snapshot did not store the governance draft text.");
    await sendAutomationCommand("send_coach_message");

    const governanceSnapshot = await waitForCondition("assistant execution trail", async () => {
      const snapshot = await sendAutomationCommand("refresh_coach");
      const coach = snapshot.snapshot.coach;
      if (!coach) {
        return null;
      }
      const trail = coach.lastAssistantExecutionTrail ?? [];
      if (
        coach.lastUserMessageText === governanceText &&
        coach.lastAssistantStatus === "completed" &&
        trail.some((line) => line.includes("Authority · Data"))
      ) {
        return snapshot;
      }
      return null;
    }, 60000, 1000);

    assert(
      governanceSnapshot.snapshot.coach?.lastAssistantExecutionTrail?.some((line) => line.includes("Authority · Data")),
      `Expected execution trail to include Authority · Data, got ${(governanceSnapshot.snapshot.coach?.lastAssistantExecutionTrail ?? []).join(" | ")}`,
    );

    const governanceTexts = await readVisibleStaticTexts();
    if (governanceTexts.includes("Authority · Data")) {
      log("==> Accessibility confirms Authority · Data is visible");
    } else {
      log("==> Accessibility could not stably confirm Authority · Data; relying on automation snapshot for pass/fail");
    }

    log("");
    log("PASS macOS coach conversation e2e");
    log(`app bundle: ${appBundlePath}`);
    log(`api base: ${apiBaseUrl}`);
    log(`command file: ${commandFile}`);
    log(`response file: ${responseFile}`);
    log(`data file: ${dataFile}`);
  } finally {
    await terminateAppPIDs();
    await clearLaunchEnvironment(Object.keys(launchEnvironment));
    await stopApiServer(api);
    if (runtime?.process?.exitCode === null) {
      runtime.process.kill("SIGTERM");
      await sleep(500);
      if (runtime.process.exitCode === null) {
        runtime.process.kill("SIGKILL");
      }
    }
    await runtime?.logHandle?.close?.();
  }
}

main().catch((error) => {
  process.stderr.write(`\nFAIL macOS coach conversation e2e\n${error.stack || error.message}\n`);
  process.stderr.write(`command file: ${commandFile}\n`);
  process.stderr.write(`response file: ${responseFile}\n`);
  process.stderr.write(`api log: ${apiLogFile}\n`);
  process.exitCode = 1;
});
