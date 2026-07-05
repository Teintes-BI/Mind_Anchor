import { buildOpenClawRegistryNotificationChildProcessEnv } from "./macos-openclaw-registry-notification-recovery-check.mjs";

export function shouldAutoDiagnoseOpenClawRegistryE2EFailure({
  notificationDebugState,
  environment = process.env,
}) {
  const raw = String(environment.MINDANCHOR_OPENCLAW_REGISTRY_E2E_AUTO_DIAGNOSE ?? "").trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(raw)) {
    return false;
  }
  return notificationDebugState === "allowed";
}

export function buildOpenClawRegistryE2EAutoDiagnoseEnv({
  bundleIdentifier,
  baseEnv = process.env,
}) {
  return {
    ...buildOpenClawRegistryNotificationChildProcessEnv(bundleIdentifier, baseEnv),
    MINDANCHOR_OPENCLAW_REGISTRY_E2E_AUTO_DIAGNOSE: "0",
  };
}

export function buildOpenClawRegistryE2EAutoDiagnoseCommand({
  title,
  message,
  debugLogPath,
  reportPath,
  htmlPath,
}) {
  return [
    "pnpm",
    "diagnose:macos:notification-center-click",
    title,
    message,
    debugLogPath,
    reportPath,
    htmlPath,
  ];
}
