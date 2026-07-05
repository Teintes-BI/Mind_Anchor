import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultOpenClawRegistryE2EBuildSourcePaths,
  shouldRebuildOpenClawRegistryE2EApp,
} from "../lib/macos-openclaw-registry-e2e-app-build.mjs";

test("defaultOpenClawRegistryE2EBuildSourcePaths includes key notification diagnostic files", () => {
  assert.deepEqual(
    defaultOpenClawRegistryE2EBuildSourcePaths("/repo"),
    [
      "/repo/apps/macos/Sources/App/MindAnchorMacApp.swift",
      "/repo/apps/macos/Sources/Core/AppConfiguration.swift",
      "/repo/apps/macos/Sources/Core/NotificationStatusDiagnosticRunner.swift",
      "/repo/apps/macos/project.yml",
    ],
  );
});

test("shouldRebuildOpenClawRegistryE2EApp returns true when bundle is missing", () => {
  assert.equal(
    shouldRebuildOpenClawRegistryE2EApp({
      appBundleMTimeMs: null,
      sourceMTimeMsList: [100, 200],
    }),
    true,
  );
});

test("shouldRebuildOpenClawRegistryE2EApp returns true when any source is newer", () => {
  assert.equal(
    shouldRebuildOpenClawRegistryE2EApp({
      appBundleMTimeMs: 100,
      sourceMTimeMsList: [50, 150],
    }),
    true,
  );
});

test("shouldRebuildOpenClawRegistryE2EApp returns false when bundle is newer than all tracked sources", () => {
  assert.equal(
    shouldRebuildOpenClawRegistryE2EApp({
      appBundleMTimeMs: 200,
      sourceMTimeMsList: [50, 150],
    }),
    false,
  );
});
