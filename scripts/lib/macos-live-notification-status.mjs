import path from "node:path";

export function defaultOpenClawRegistryE2EAppBundlePath(repoRoot) {
  return path.resolve(
    repoRoot,
    "apps/macos/.derived-data/openclaw-registry-e2e/Build/Products/Debug/MindAnchorMac.app",
  );
}

export function defaultOpenClawRegistryLiveNotificationStatusOutputPath(cwd = process.cwd()) {
  return path.resolve(cwd, "tmp", "mindanchor-openclaw-registry-live-notification-status.json");
}

export function normalizeOpenClawRegistryLiveNotificationState(state) {
  switch (state) {
    case "allowed":
      return "allowed";
    case "denied":
      return "denied";
    case "not_requested":
      return "not_requested";
    default:
      return "unknown";
  }
}
