#!/usr/bin/env bash
set -euo pipefail

LABEL="${OPENCLAW_LAUNCHD_LABEL:-com.mindanchor.openclaw.runtime}"
PLIST_FILE="$HOME/Library/LaunchAgents/$LABEL.plist"

if [[ ! -f "$PLIST_FILE" ]]; then
  echo "No launchd plist found at $PLIST_FILE"
  exit 0
fi

echo "PLIST=$PLIST_FILE"
launchctl print "gui/$(id -u)/$LABEL"
