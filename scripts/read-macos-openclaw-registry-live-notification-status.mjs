#!/usr/bin/env node

import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import process from "node:process";

import { appBinaryPathFromBundle } from "./lib/macos-app-launcher.mjs";
import { openClawRegistryE2EBundleIdentifier } from "./lib/macos-e2e-bundle-ids.mjs";
import { resolveOpenClawRegistryBundleIdentifier } from "./lib/macos-openclaw-registry-bundle-id.mjs";
import {
  defaultOpenClawRegistryE2EBuildSourcePaths,
  shouldRebuildOpenClawRegistryE2EApp,
} from "./lib/macos-openclaw-registry-e2e-app-build.mjs";
import {
  defaultOpenClawRegistryE2EAppBundlePath,
  defaultOpenClawRegistryLiveNotificationStatusOutputPath,
} from "./lib/macos-live-notification-status.mjs";

const repoRoot = process.cwd();
function parseArgs(argv) {
  let appBundlePath = null;
  let outputPath = null;
  let bundleIdentifier = null;
  for (const arg of argv) {
    if (arg.startsWith("--bundle-id=")) {
      bundleIdentifier = arg.slice("--bundle-id=".length);
      continue;
    }
    if (!appBundlePath) {
      appBundlePath = arg;
      continue;
    }
    if (!outputPath) {
      outputPath = arg;
    }
  }
  return { appBundlePath, outputPath, bundleIdentifier };
}

const parsedArgs = parseArgs(process.argv.slice(2));
const appBundlePath = parsedArgs.appBundlePath || defaultOpenClawRegistryE2EAppBundlePath(repoRoot);
const outputPath = parsedArgs.outputPath || defaultOpenClawRegistryLiveNotificationStatusOutputPath(repoRoot);
const bundleIdentifier = resolveOpenClawRegistryBundleIdentifier({
  explicitBundleIdentifier: parsedArgs.bundleIdentifier,
});
const timeoutSeconds = Number(process.env.MINDANCHOR_LIVE_NOTIFICATION_STATUS_TIMEOUT_SECONDS ?? 20);
const timeoutMs = Number.isFinite(timeoutSeconds) ? timeoutSeconds * 1000 : 20000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

try {
  await fs.access(appBundlePath);
} catch {
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: ["ignore", "pipe", "pipe"],
    });
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

async function statMtime(targetPath) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.mtimeMs;
  } catch {
    return null;
  }
}

const appBundleMTimeMs = await statMtime(appBundlePath);
const sourceMTimeMsList = await Promise.all(
  defaultOpenClawRegistryE2EBuildSourcePaths(repoRoot).map(statMtime),
);

if (shouldRebuildOpenClawRegistryE2EApp({ appBundleMTimeMs, sourceMTimeMsList })) {
  const macosDir = `${repoRoot}/apps/macos`;
  const projectPath = `${macosDir}/MindAnchorMac.xcodeproj`;
  const derivedDataDir = `${macosDir}/.derived-data/openclaw-registry-e2e`;

  await fs.rm(projectPath, { recursive: true, force: true });
  await runCommand("xcodegen", ["generate", "--spec", `${macosDir}/project.yml`, "--project", macosDir]);
  await fs.rm(derivedDataDir, { recursive: true, force: true });
  await runCommand("xcodebuild", [
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
    `PRODUCT_BUNDLE_IDENTIFIER=${bundleIdentifier}`,
    "build",
  ]);
  await runCommand("codesign", ["--force", "--deep", "--sign", "-", appBundlePath]);
}

await fs.rm(outputPath, { force: true }).catch(() => {});
const child = spawn(
  appBinaryPathFromBundle(appBundlePath),
  [],
  {
    cwd: repoRoot,
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      MINDANCHOR_API_BASE_URL: process.env.MINDANCHOR_API_BASE_URL ?? "http://127.0.0.1:3001",
      MINDANCHOR_NOTIFICATION_STATUS_DIAGNOSTIC_OUTPUT_FILE: outputPath,
      MINDANCHOR_DISABLE_COLLECTOR: "1",
      MINDANCHOR_AUTOMATION_ENABLED: "0",
    },
  },
);
child.unref();

const deadline = Date.now() + timeoutMs;
while (Date.now() < deadline) {
  try {
    const raw = await fs.readFile(outputPath, "utf8");
    process.stdout.write(raw);
    process.stdout.write("\n");
    process.exit(0);
  } catch {}
  await sleep(500);
}

process.stderr.write(`Timed out waiting for live notification status output: ${outputPath}\n`);
process.exit(1);
