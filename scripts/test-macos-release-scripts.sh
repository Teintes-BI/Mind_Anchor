#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_SCRIPT="$ROOT_DIR/scripts/build-macos-release.sh"
SIGNING_CHECK_SCRIPT="$ROOT_DIR/scripts/check-macos-signing-prereqs.sh"

if [[ ! -x "$RELEASE_SCRIPT" ]]; then
  echo "Missing executable release script: $RELEASE_SCRIPT" >&2
  exit 1
fi

help_output="$("$RELEASE_SCRIPT" --help)"
if [[ "$help_output" != *"Usage:"* ]]; then
  echo "Release script help output must include Usage:" >&2
  exit 1
fi

dry_run_output="$("$RELEASE_SCRIPT" --dry-run --output-dir "$ROOT_DIR/dist/test-macos-release")"
if [[ "$dry_run_output" != *"xcodebuild archive"* ]]; then
  echo "Dry run must mention xcodebuild archive." >&2
  exit 1
fi

if [[ "$dry_run_output" != *".dmg"* ]]; then
  echo "Dry run must mention the DMG output path." >&2
  exit 1
fi

echo "macOS release script regression passed"

if [[ ! -x "$SIGNING_CHECK_SCRIPT" ]]; then
  echo "Missing executable signing preflight script: $SIGNING_CHECK_SCRIPT" >&2
  exit 1
fi

signing_help="$("$SIGNING_CHECK_SCRIPT" --help)"
if [[ "$signing_help" != *"Usage:"* ]]; then
  echo "Signing preflight help output must include Usage:" >&2
  exit 1
fi

report_output="$("$SIGNING_CHECK_SCRIPT" --report-only)"
if [[ "$report_output" != *"Signing prerequisites report"* ]]; then
  echo "Signing preflight report output must include a report header." >&2
  exit 1
fi

echo "macOS signing preflight regression passed"
