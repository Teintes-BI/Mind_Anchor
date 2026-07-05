import test from "node:test";
import assert from "node:assert/strict";

import { openClawRegistryE2EBundleIdentifier } from "../lib/macos-e2e-bundle-ids.mjs";

test("openClawRegistryE2EBundleIdentifier stays stable for notification preauthorization", () => {
  assert.equal(
    openClawRegistryE2EBundleIdentifier,
    "com.mindanchor.mac.openclaw.registry.e2e",
  );
});
