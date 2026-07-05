import { buildOpenClawRegistryNotificationChildProcessEnv } from "./macos-openclaw-registry-notification-recovery-check.mjs";

export function shouldAutoRecoverOpenClawRegistryE2EFailure(environment = process.env) {
  const raw = String(environment.MINDANCHOR_OPENCLAW_REGISTRY_E2E_AUTO_RECOVER ?? "").trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(raw)) {
    return false;
  }
  return true;
}

export function buildOpenClawRegistryE2EAutoRecoverEnv({
  bundleIdentifier,
  baseEnv = process.env,
}) {
  return {
    ...buildOpenClawRegistryNotificationChildProcessEnv(bundleIdentifier, baseEnv),
    MINDANCHOR_OPENCLAW_REGISTRY_E2E_AUTO_RECOVER: "0",
  };
}

export function buildOpenClawRegistryE2EAutoRecoverCommand({
  debugLogPath,
  reportPath,
}) {
  return [
    "pnpm",
    "recover:macos:openclaw-registry-notifications",
    debugLogPath,
    reportPath,
  ];
}
