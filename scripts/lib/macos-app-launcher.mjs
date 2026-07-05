import { spawn } from "node:child_process";
import path from "node:path";

export function appBinaryPathFromBundle(appBundlePath) {
  return path.join(appBundlePath, "Contents", "MacOS", "MindAnchorMac");
}

export function launchMacAppProcess({
  appBundlePath,
  environment,
  cwd,
  spawnImpl = spawn,
}) {
  const envArgs = Object.entries(environment ?? {}).flatMap(([key, value]) => [
    "--env",
    `${key}=${value ?? ""}`,
  ]);

  return spawnImpl("open", [
    "-n",
    "-a",
    appBundlePath,
    "--stdin",
    "/dev/null",
    "--stdout",
    "/dev/null",
    "--stderr",
    "/dev/null",
    ...envArgs,
    "--args",
  ], {
    cwd,
    detached: true,
    stdio: "ignore",
  });
}
