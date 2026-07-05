export function buildNotificationPermissionClickAppleScript() {
  return `
set allowLabels to {"Allow", "允许", "好", "OK", "允许通知"}
set sawSecurityAgent to false
tell application "System Events"
  repeat with processName in {"MindAnchorMac", "MindAnchor for Mac", "NotificationCenter", "UserNotificationsUIService", "UserNotificationCenter", "SecurityAgent", "CoreServicesUIAgent"}
    if exists process processName then
      if (processName as text) is "SecurityAgent" then
        set sawSecurityAgent to true
      end if
      tell process processName
        set buttonsToScan to {}
        try
          set buttonsToScan to every button of entire contents
        on error
          set buttonsToScan to {}
        end try
        repeat with b in buttonsToScan
          try
            set buttonName to name of b as text
            if allowLabels contains buttonName then
              click b
              return (processName as text) & ":" & buttonName
            end if
          end try
        end repeat
      end tell
    end if
  end repeat
end tell
if sawSecurityAgent then
  return "security-agent-present"
end if
return "not-found"
`;
}
