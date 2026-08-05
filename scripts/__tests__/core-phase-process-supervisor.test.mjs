import test from "node:test";
import assert from "node:assert/strict";

import {
  buildManagedSpawnOptions,
  cleanupManagedProcesses,
  collectUniqueChildren,
  shouldUseDetachedProcessGroups,
  spawnManagedLoggedProcess,
  stopManagedChild,
} from "../lib/core-phase-process-supervisor.mjs";

test("shouldUseDetachedProcessGroups enables detached groups on unix-like platforms", () => {
  assert.equal(shouldUseDetachedProcessGroups("darwin"), true);
  assert.equal(shouldUseDetachedProcessGroups("linux"), true);
  assert.equal(shouldUseDetachedProcessGroups("win32"), false);
});

test("buildManagedSpawnOptions enables detached pipe-based spawn on darwin", () => {
  assert.deepEqual(
    buildManagedSpawnOptions({
      cwd: "/Users/claw/mindanchor",
      env: { FOO: "bar" },
      platform: "darwin",
    }),
    {
      cwd: "/Users/claw/mindanchor",
      env: { FOO: "bar" },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
});

test("spawnManagedLoggedProcess uses managed spawn options and pipes logs", async () => {
  const pipedTargets = [];
  const writes = [];
  const exitHandlers = [];
  const child = {
    stdout: { pipe(target) { pipedTargets.push(["stdout", target]); } },
    stderr: { pipe(target) { pipedTargets.push(["stderr", target]); } },
    on(event, handler) {
      exitHandlers.push([event, handler]);
    },
    exitCode: null,
    pid: 123,
  };
  const stream = {
    write(chunk) {
      writes.push(chunk);
    },
  };
  const spawnCalls = [];

  const result = await spawnManagedLoggedProcess({
    name: "api-provider-direct",
    command: "corepack",
    args: ["pnpm", "test"],
    env: { PATH: "/tmp/bin" },
    logFile: "/tmp/core-phase/api.log",
    cwd: "/Users/claw/mindanchor",
    platform: "darwin",
    ensureDirImpl: async () => undefined,
    createWriteStreamImpl() {
      return stream;
    },
    spawnImpl(command, args, options) {
      spawnCalls.push({ command, args, options });
      return child;
    },
  });

  assert.equal(result.child, child);
  assert.equal(result.stream, stream);
  assert.equal(spawnCalls.length, 1);
  assert.equal(spawnCalls[0].command, "corepack");
  assert.deepEqual(spawnCalls[0].args, ["pnpm", "test"]);
  assert.equal(spawnCalls[0].options.detached, true);
  assert.deepEqual(spawnCalls[0].options.stdio, ["ignore", "pipe", "pipe"]);
  assert.deepEqual(
    pipedTargets,
    [
      ["stdout", stream],
      ["stderr", stream],
    ],
  );

  assert.equal(exitHandlers.length, 1);
  exitHandlers[0][1](0, null);
  assert.equal(writes.length, 1);
  assert.match(writes[0], /process=api-provider-direct exit code=0 signal=null/);
});

test("stopManagedChild prefers process group signaling for detached children", async () => {
  const killCalls = [];
  const childKillCalls = [];
  const child = {
    pid: 4321,
    exitCode: null,
    killed: false,
    kill(signal) {
      childKillCalls.push(signal);
    },
  };

  const result = await stopManagedChild(child, {
    platform: "darwin",
    killImpl(pid, signal) {
      killCalls.push([pid, signal]);
      if (signal === "SIGKILL") {
        child.exitCode = 0;
      }
    },
    waitForExitImpl: async () => undefined,
  });

  assert.deepEqual(killCalls, [
    [-4321, "SIGTERM"],
    [-4321, "SIGKILL"],
  ]);
  assert.deepEqual(childKillCalls, []);
  assert.deepEqual(result, { attempted: true, usedProcessGroup: true });
});

test("stopManagedChild falls back to child.kill when process group signal fails", async () => {
  const childKillCalls = [];
  const child = {
    pid: 5678,
    exitCode: null,
    killed: false,
    kill(signal) {
      childKillCalls.push(signal);
      if (signal === "SIGKILL") {
        child.exitCode = 0;
      }
    },
  };

  const result = await stopManagedChild(child, {
    platform: "darwin",
    killImpl() {
      throw new Error("ESRCH");
    },
    waitForExitImpl: async () => undefined,
  });

  assert.deepEqual(childKillCalls, ["SIGTERM", "SIGKILL"]);
  assert.deepEqual(result, { attempted: true, usedProcessGroup: false });
});

test("stopManagedChild terminates the full descendant tree on Windows", async () => {
  const taskkillCalls = [];
  const childKillCalls = [];
  const child = {
    pid: 6789,
    exitCode: null,
    killed: false,
    kill(signal) {
      childKillCalls.push(signal);
    },
  };

  const result = await stopManagedChild(child, {
    platform: "win32",
    taskkillImpl(command, args, options) {
      taskkillCalls.push({ command, args, options });
      child.exitCode = 0;
      return { status: 0 };
    },
    waitForExitImpl: async () => undefined,
  });

  assert.deepEqual(taskkillCalls, [
    {
      command: "taskkill.exe",
      args: ["/PID", "6789", "/T", "/F"],
      options: { windowsHide: true, stdio: "ignore" },
    },
  ]);
  assert.deepEqual(childKillCalls, []);
  assert.deepEqual(result, { attempted: true, usedProcessGroup: true });
});

test("collectUniqueChildren deduplicates direct and tracked children", () => {
  const childA = { pid: 1 };
  const childB = { pid: 2 };
  assert.deepEqual(
    collectUniqueChildren({
      directChildren: [childA, childB, childA, null],
      processEntries: [{ child: childB }, { child: childA }, { child: null }],
    }),
    [childA, childB],
  );
});

test("cleanupManagedProcesses stops unique children in reverse order and closes streams", async () => {
  const calls = [];
  const childA = { pid: 1 };
  const childB = { pid: 2 };
  let mockClosed = false;
  let streamAClosed = false;
  let streamBClosed = false;

  const result = await cleanupManagedProcesses({
    directChildren: [childA, childB],
    processEntries: [
      { child: childA, stream: { end() { streamAClosed = true; } } },
      { child: childB, stream: { end() { streamBClosed = true; } } },
    ],
    stopChildImpl: async (child) => {
      calls.push(child.pid);
    },
    closeMockProviderImpl: async () => {
      mockClosed = true;
    },
  });

  assert.deepEqual(calls, [2, 1]);
  assert.equal(mockClosed, true);
  assert.equal(streamAClosed, true);
  assert.equal(streamBClosed, true);
  assert.deepEqual(result, { stoppedChildren: 2 });
});
