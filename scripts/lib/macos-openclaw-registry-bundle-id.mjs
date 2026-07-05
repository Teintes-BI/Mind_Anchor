import { openClawRegistryE2EBundleIdentifier } from "./macos-e2e-bundle-ids.mjs";

export function resolveOpenClawRegistryBundleIdentifier({
  explicitBundleIdentifier,
  environmentBundleIdentifier,
} = {}) {
  const resolved =
    explicitBundleIdentifier ||
    environmentBundleIdentifier ||
    process.env.MINDANCHOR_OPENCLAW_REGISTRY_E2E_BUNDLE_ID ||
    openClawRegistryE2EBundleIdentifier;

  return String(resolved).trim() || openClawRegistryE2EBundleIdentifier;
}
