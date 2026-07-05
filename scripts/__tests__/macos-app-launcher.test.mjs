import test from "node:test";
import assert from "node:assert/strict";

import {
  appBinaryPathFromBundle,
  launchMacAppProcess,
} from "../lib/macos-app-launcher.mjs";

test("appBinaryPathFromBundle resolves the app executable path", () => {
  assert.equal(
    appBinaryPathFromBundle("/tmp/MindAnchorMac.app"),
    "/tmp/MindAnchorMac.app/Contents/MacOS/MindAnchorMac",
  );
});

test("launchMacAppProcess launches the app bundle through open with explicit environment", () => {
  const calls = [];
  const fakeChild = { pid: 1234 };

  const child = launchMacAppProcess({
    appBundlePath: "/tmp/MindAnchorMac.app",
    environment: {
      MINDANCHOR_API_BASE_URL: "http://127.0.0.1:3001",
      MINDANCHOR_AUTOMATION_ENABLED: "1",
    },
    cwd: "/Users/claw/mindanchor",
    spawnImpl(command, args, options) {
      calls.push({ command, args, options });
      return fakeChild;
    },
  });

  assert.equal(child, fakeChild);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, "open");
  assert.deepEqual(calls[0].args, [
    "-n",
    "-a",
    "/tmp/MindAnchorMac.app",
    "--stdin",
    "/dev/null",
    "--stdout",
    "/dev/null",
    "--stderr",
    "/dev/null",
    "--env",
    "MINDANCHOR_API_BASE_URL=http://127.0.0.1:3001",
    "--env",
    "MINDANCHOR_AUTOMATION_ENABLED=1",
    "--args",
  ]);
  assert.equal(calls[0].options.cwd, "/Users/claw/mindanchor");
  assert.equal(calls[0].options.detached, true);
  assert.equal(calls[0].options.stdio, "ignore");
});
