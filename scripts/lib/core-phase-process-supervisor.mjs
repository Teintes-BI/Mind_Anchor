import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const shouldUseDetachedProcessGroups = (platform = process.platform) => platform !== "win32";

export const buildManagedSpawnOptions = ({
  cwd,
  env,
  platform = process.platform,
}) => ({
  cwd,
  env,
  detached: shouldUseDetachedProcessGroups(platform),
  stdio: ["ignore", "pipe", "pipe"],
});

export const waitForChildExit = (child, timeoutMs = 4000) =>
  Promise.race([
    new Promise((resolve) => {
      if (!child || child.exitCode !== null) {
        resolve(undefined);
        return;
      }
      child.once("exit", () => resolve(undefined));
    }),
    delay(timeoutMs),
  ]);

export const spawnManagedLoggedProcess = async ({
  name,
  command,
  args,
  env,
  logFile,
  cwd,
  platform = process.platform,
  spawnImpl = spawn,
  createWriteStreamImpl = createWriteStream,
  ensureDirImpl = (path) => mkdir(path, { recursive: true }),
}) => {
  await ensureDirImpl(dirname(logFile));
  const stream = createWriteStreamImpl(logFile, { flags: "a" });
  const child = spawnImpl(command, args, buildManagedSpawnOptions({ cwd, env, platform }));
  child.stdout?.pipe(stream);
  child.stderr?.pipe(stream);
  child.on("exit", (code, signal) => {
    stream.write(`\n[${new Date().toISOString()}] process=${name} exit code=${code ?? "null"} signal=${signal ?? "null"}\n`);
  });
  return { child, stream, logFile, name };
};

const killProcessGroup = ({ child, signal, killImpl, platform }) => {
  if (!child?.pid || !shouldUseDetachedProcessGroups(platform)) {
    return false;
  }
  killImpl(-child.pid, signal);
  return true;
};

export const stopManagedChild = async (
  child,
  {
    gracePeriodMs = 4000,
    platform = process.platform,
    killImpl = process.kill,
    waitForExitImpl = waitForChildExit,
  } = {},
) => {
  if (!child || child.exitCode !== null || child.killed) {
    return { attempted: false, usedProcessGroup: false };
  }

  let usedProcessGroup = false;
  try {
    usedProcessGroup = killProcessGroup({
      child,
      signal: "SIGTERM",
      killImpl,
      platform,
    });
    if (!usedProcessGroup) {
      child.kill("SIGTERM");
    }
  } catch {
    child.kill("SIGTERM");
  }

  await waitForExitImpl(child, gracePeriodMs);

  if (child.exitCode === null && !child.killed) {
    try {
      const killedGroup = killProcessGroup({
        child,
        signal: "SIGKILL",
        killImpl,
        platform,
      });
      usedProcessGroup = usedProcessGroup || killedGroup;
      if (!killedGroup) {
        child.kill("SIGKILL");
      }
    } catch {
      child.kill("SIGKILL");
    }
    await waitForExitImpl(child, gracePeriodMs);
  }

  return { attempted: true, usedProcessGroup };
};

export const collectUniqueChildren = ({ directChildren = [], processEntries = [] }) => [
  ...new Set([
    ...directChildren.filter(Boolean),
    ...processEntries.map((processEntry) => processEntry?.child).filter(Boolean),
  ]),
];

export const cleanupManagedProcesses = async ({
  directChildren = [],
  processEntries = [],
  stopChildImpl = stopManagedChild,
  closeMockProviderImpl = null,
}) => {
  const children = collectUniqueChildren({ directChildren, processEntries });
  for (const child of children.reverse()) {
    // eslint-disable-next-line no-await-in-loop
    await stopChildImpl(child);
  }

  if (closeMockProviderImpl) {
    await closeMockProviderImpl();
  }

  for (const processEntry of processEntries) {
    processEntry?.stream?.end?.();
  }

  return { stoppedChildren: children.length };
};
