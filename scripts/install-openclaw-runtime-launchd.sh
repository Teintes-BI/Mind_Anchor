#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LABEL="${OPENCLAW_LAUNCHD_LABEL:-com.mindanchor.openclaw.runtime}"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/$LABEL.plist"
LOG_DIR="$ROOT_DIR/.logs"
STDOUT_LOG="$LOG_DIR/openclaw-launchd.log"
STDERR_LOG="$LOG_DIR/openclaw-launchd.err.log"
OPENCLAW_HOST="${OPENCLAW_HOST:-0.0.0.0}"
OPENCLAW_PORT="${OPENCLAW_PORT:-8800}"
OPENCLAW_REAL_PROFILE="${OPENCLAW_REAL_PROFILE:-dev}"
NODE_PATH="$ROOT_DIR/.tools/node/bin"
OPENCLAW_BIN_DIR="$HOME/.openclaw/bin"

mkdir -p "$PLIST_DIR" "$LOG_DIR"

cat >"$PLIST_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${LABEL}</string>
    <key>WorkingDirectory</key>
    <string>${ROOT_DIR}</string>
    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>${ROOT_DIR}/scripts/run-openclaw-runtime-service.sh</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
      <key>PATH</key>
      <string>${NODE_PATH}:${OPENCLAW_BIN_DIR}:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
      <key>OPENCLAW_HOST</key>
      <string>${OPENCLAW_HOST}</string>
      <key>OPENCLAW_PORT</key>
      <string>${OPENCLAW_PORT}</string>
      <key>OPENCLAW_REAL_PROFILE</key>
      <string>${OPENCLAW_REAL_PROFILE}</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${STDOUT_LOG}</string>
    <key>StandardErrorPath</key>
    <string>${STDERR_LOG}</string>
  </dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)" "$PLIST_FILE" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_FILE"
launchctl kickstart -k "gui/$(id -u)/${LABEL}"

echo "Installed launchd service: ${LABEL}"
echo "Plist: ${PLIST_FILE}"
echo "Stdout: ${STDOUT_LOG}"
echo "Stderr: ${STDERR_LOG}"
