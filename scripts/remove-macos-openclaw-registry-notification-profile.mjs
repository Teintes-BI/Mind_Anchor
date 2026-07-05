#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";

import { openClawRegistryNotificationProfileIdentifier } from "./lib/macos-openclaw-registry-notification-prep.mjs";

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

try {
  await runCommand("profiles", [
    "remove",
    "-type",
    "configuration",
    "-identifier",
    openClawRegistryNotificationProfileIdentifier,
    "-forced",
  ]);
  process.stdout.write(`Removed profile ${openClawRegistryNotificationProfileIdentifier}\n`);
} catch (error) {
  process.stdout.write(
    `No removable installed profile found for ${openClawRegistryNotificationProfileIdentifier}, or removal requires manual action.\n`,
  );
  process.stdout.write(`${error.message}\n`);
}
