import test from "node:test";
import assert from "node:assert/strict";

import { openClawRegistryE2EBundleIdentifier } from "../lib/macos-e2e-bundle-ids.mjs";
import { resolveOpenClawRegistryBundleIdentifier } from "../lib/macos-openclaw-registry-bundle-id.mjs";

test("resolveOpenClawRegistryBundleIdentifier falls back to the stable default", () => {
  assert.equal(
    resolveOpenClawRegistryBundleIdentifier(),
    openClawRegistryE2EBundleIdentifier,
  );
});

test("resolveOpenClawRegistryBundleIdentifier prefers explicit argument", () => {
  assert.equal(
    resolveOpenClawRegistryBundleIdentifier({
      explicitBundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.temp",
      environmentBundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.env",
    }),
    "com.mindanchor.mac.openclaw.registry.e2e.temp",
  );
});

test("resolveOpenClawRegistryBundleIdentifier falls back to environment override", () => {
  assert.equal(
    resolveOpenClawRegistryBundleIdentifier({
      environmentBundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e.env",
    }),
    "com.mindanchor.mac.openclaw.registry.e2e.env",
  );
});
