export function buildMacOSNotificationSettingsOpenCandidates(bundleIdentifier) {
  const normalizedBundleIdentifier = String(bundleIdentifier ?? "").trim();
  const candidates = [];

  if (normalizedBundleIdentifier) {
    candidates.push(
      `x-apple.systempreferences:com.apple.Notifications-Settings.extension?bundleIdentifier=${normalizedBundleIdentifier}`,
    );
  }

  candidates.push("x-apple.systempreferences:com.apple.Notifications-Settings.extension");
  candidates.push("x-apple.systempreferences:com.apple.preference.notifications");

  return candidates;
}
