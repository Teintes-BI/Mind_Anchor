#!/usr/bin/env bash

set -euo pipefail

STRICT=0
REPORT_ONLY=0

usage() {
  cat <<'EOF'
Usage:
  bash scripts/check-macos-signing-prereqs.sh [--report-only] [--strict] [--help]

Modes:
  --report-only   Print a human-readable readiness report and always exit 0
  --strict        Exit 1 if any required signing/notarization prerequisite is missing
  --help          Show this help

Environment checked:
  MINDANCHOR_MACOS_SIGNING_IDENTITY
  MINDANCHOR_MACOS_TEAM_ID
  MINDANCHOR_MACOS_NOTARY_PROFILE
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --report-only)
      REPORT_ONLY=1
      shift
      ;;
    --strict)
      STRICT=1
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$STRICT" -eq 1 && "$REPORT_ONLY" -eq 1 ]]; then
  echo "Use either --report-only or --strict, not both." >&2
  exit 1
fi

SIGNING_IDENTITY="${MINDANCHOR_MACOS_SIGNING_IDENTITY:-}"
TEAM_ID="${MINDANCHOR_MACOS_TEAM_ID:-}"
NOTARY_PROFILE="${MINDANCHOR_MACOS_NOTARY_PROFILE:-}"

missing_count=0

print_status() {
  local label="$1"
  local status="$2"
  local detail="$3"
  printf '%-28s %-8s %s\n' "$label" "$status" "$detail"
}

require_command() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    print_status "$cmd" "OK" "available"
  else
    print_status "$cmd" "MISSING" "not found in PATH"
    missing_count=$((missing_count + 1))
  fi
}

echo "Signing prerequisites report"
echo "==========================="

require_command xcodebuild
require_command xcrun
require_command security
require_command hdiutil

if [[ -n "$SIGNING_IDENTITY" ]]; then
  if security find-identity -v -p codesigning 2>/dev/null | grep -F "$SIGNING_IDENTITY" >/dev/null 2>&1; then
    print_status "Signing identity" "OK" "$SIGNING_IDENTITY"
  else
    print_status "Signing identity" "MISSING" "env set, but not found in local keychain"
    missing_count=$((missing_count + 1))
  fi
else
  print_status "Signing identity" "MISSING" "set MINDANCHOR_MACOS_SIGNING_IDENTITY"
  missing_count=$((missing_count + 1))
fi

if [[ -n "$TEAM_ID" ]]; then
  print_status "Team ID" "OK" "$TEAM_ID"
else
  print_status "Team ID" "MISSING" "set MINDANCHOR_MACOS_TEAM_ID"
  missing_count=$((missing_count + 1))
fi

if [[ -n "$NOTARY_PROFILE" ]]; then
  print_status "Notary profile" "OK" "$NOTARY_PROFILE (profile existence not auto-verified)"
else
  print_status "Notary profile" "MISSING" "set MINDANCHOR_MACOS_NOTARY_PROFILE"
  missing_count=$((missing_count + 1))
fi

echo
echo "Suggested next steps"
echo "1. Install a Developer ID Application certificate into the active login keychain."
echo "2. Export MINDANCHOR_MACOS_SIGNING_IDENTITY, MINDANCHOR_MACOS_TEAM_ID, and MINDANCHOR_MACOS_NOTARY_PROFILE."
echo "3. Re-run this script with --strict."
echo "4. Then run: corepack pnpm release:macos"

if [[ "$REPORT_ONLY" -eq 1 ]]; then
  exit 0
fi

if [[ "$STRICT" -eq 1 && "$missing_count" -gt 0 ]]; then
  exit 1
fi

exit 0
