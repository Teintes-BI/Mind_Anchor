import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOpenClawRegistryE2EAutoRecoverCommand,
  buildOpenClawRegistryE2EAutoRecoverEnv,
  shouldAutoRecoverOpenClawRegistryE2EFailure,
} from "../lib/macos-openclaw-registry-e2e-auto-recover.mjs";

test("shouldAutoRecoverOpenClawRegistryE2EFailure defaults to enabled", () => {
  assert.equal(
    shouldAutoRecoverOpenClawRegistryE2EFailure({}),
    true,
  );
});

test("shouldAutoRecoverOpenClawRegistryE2EFailure disables when explicitly turned off", () => {
  assert.equal(
    shouldAutoRecoverOpenClawRegistryE2EFailure({
      MINDANCHOR_OPENCLAW_REGISTRY_E2E_AUTO_RECOVER: "0",
    }),
    false,
  );
});

test("buildOpenClawRegistryE2EAutoRecoverEnv disables nested auto recover", () => {
  assert.deepEqual(
    buildOpenClawRegistryE2EAutoRecoverEnv({
      bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.temp",
      baseEnv: { FOO: "bar" },
    }),
    {
      FOO: "bar",
      MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID: "com.mindanchor.mac.openclaw.registry.e2e.temp",
      MINDANCHOR_OPENCLAW_REGISTRY_E2E_AUTO_RECOVER: "0",
    },
  );
});

test("buildOpenClawRegistryE2EAutoRecoverCommand includes debug log and report path", () => {
  assert.deepEqual(
    buildOpenClawRegistryE2EAutoRecoverCommand({
      debugLogPath: "/tmp/notification-debug.log",
      reportPath: "/tmp/recovery-report.json",
    }),
    [
      "pnpm",
      "recover:macos:openclaw-registry-notifications",
      "/tmp/notification-debug.log",
      "/tmp/recovery-report.json",
    ],
  );
});
