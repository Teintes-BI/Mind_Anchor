function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildMacOSNotificationSettingsProfile({
  bundleIdentifier,
  profileIdentifier,
  payloadIdentifier,
  profileDisplayName,
  payloadDisplayName = "MindAnchor Notifications",
}) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>NotificationSettings</key>
      <array>
        <dict>
          <key>BundleIdentifier</key>
          <string>${xmlEscape(bundleIdentifier)}</string>
          <key>NotificationsEnabled</key>
          <true/>
          <key>AlertType</key>
          <integer>2</integer>
          <key>ShowInNotificationCenter</key>
          <true/>
          <key>ShowInLockScreen</key>
          <true/>
          <key>BadgesEnabled</key>
          <true/>
          <key>SoundsEnabled</key>
          <true/>
        </dict>
      </array>
      <key>PayloadDisplayName</key>
      <string>${xmlEscape(payloadDisplayName)}</string>
      <key>PayloadIdentifier</key>
      <string>${xmlEscape(payloadIdentifier)}</string>
      <key>PayloadType</key>
      <string>com.apple.notificationsettings</string>
      <key>PayloadUUID</key>
      <string>${crypto.randomUUID()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDisplayName</key>
  <string>${xmlEscape(profileDisplayName)}</string>
  <key>PayloadIdentifier</key>
  <string>${xmlEscape(profileIdentifier)}</string>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${crypto.randomUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`;
}
