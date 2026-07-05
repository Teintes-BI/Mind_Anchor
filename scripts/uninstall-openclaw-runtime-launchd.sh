#!/usr/bin/env bash
set -euo pipefail

LABEL="${OPENCLAW_LAUNCHD_LABEL:-com.mindanchor.openclaw.runtime}"
PLIST_FILE="$HOME/Library/LaunchAgents/$LABEL.plist"

if [[ -f "$PLIST_FILE" ]]; then
  launchctl bootout "gui/$(id -u)" "$PLIST_FILE" >/dev/null 2>&1 || true
  rm -f "$PLIST_FILE"
  echo "Removed launchd service: ${LABEL}"
else
  echo "No launchd plist found at $PLIST_FILE"
fi
