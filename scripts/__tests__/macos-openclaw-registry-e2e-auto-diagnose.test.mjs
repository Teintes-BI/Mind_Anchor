import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOpenClawRegistryE2EAutoDiagnoseCommand,
  buildOpenClawRegistryE2EAutoDiagnoseEnv,
  shouldAutoDiagnoseOpenClawRegistryE2EFailure,
} from "../lib/macos-openclaw-registry-e2e-auto-diagnose.mjs";

test("shouldAutoDiagnoseOpenClawRegistryE2EFailure only triggers when notifications are already allowed", () => {
  assert.equal(
    shouldAutoDiagnoseOpenClawRegistryE2EFailure({
      notificationDebugState: "allowed",
      environment: {},
    }),
    true,
  );
  assert.equal(
    shouldAutoDiagnoseOpenClawRegistryE2EFailure({
      notificationDebugState: "request_in_flight",
      environment: {},
    }),
    false,
  );
});

test("shouldAutoDiagnoseOpenClawRegistryE2EFailure can be disabled explicitly", () => {
  assert.equal(
    shouldAutoDiagnoseOpenClawRegistryE2EFailure({
      notificationDebugState: "allowed",
      environment: { MINDANCHOR_OPENCLAW_REGISTRY_E2E_AUTO_DIAGNOSE: "0" },
    }),
    false,
  );
});

test("buildOpenClawRegistryE2EAutoDiagnoseEnv keeps bundle override and disables nested diagnose", () => {
  assert.deepEqual(
    buildOpenClawRegistryE2EAutoDiagnoseEnv({
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.temp",
      baseEnv: { FOO: "bar" },
    }),
    {
      FOO: "bar",
      MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID: "com.mindanchor.mac.openclaw.registry.e2e.temp",
      MINDANCHOR_OPENCLAW_REGISTRY_E2E_AUTO_DIAGNOSE: "0",
    },
  );
});

test("buildOpenClawRegistryE2EAutoDiagnoseCommand includes title message debug log and report outputs", () => {
  assert.deepEqual(
    buildOpenClawRegistryE2EAutoDiagnoseCommand({
      title: "OpenClaw Registry 不可达",
      message: "runtime unreachable",
      debugLogPath: "/tmp/notification-debug.log",
      reportPath: "/tmp/click.json",
      htmlPath: "/tmp/click.html",
    }),
    [
      "pnpm",
      "diagnose:macos:notification-center-click",
      "OpenClaw Registry 不可达",
      "runtime unreachable",
      "/tmp/notification-debug.log",
      "/tmp/click.json",
      "/tmp/click.html",
    ],
  );
});
