#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { resolveOpenClawRegistryBundleIdentifier } from "./lib/macos-openclaw-registry-bundle-id.mjs";

const scriptPath = path.resolve(
  process.cwd(),
  "scripts",
  "generate-macos-openclaw-registry-notification-profile.mjs",
);
const bundleIdentifier = resolveOpenClawRegistryBundleIdentifier({
  explicitBundleIdentifier: process.argv[2] || undefined,
});

const { spawn } = await import("node:child_process");

const child = spawn(process.execPath, [scriptPath, "--open", `--bundle-id=${bundleIdentifier}`], {
  stdio: "inherit",
});

child.on("close", (code) => {
  process.exitCode = code ?? 0;
});
