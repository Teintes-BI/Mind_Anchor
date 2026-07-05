#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MACOS_DIR="$ROOT_DIR/apps/macos"
PROJECT_PATH="$MACOS_DIR/MindAnchorMac.xcodeproj"
PROJECT_SPEC="$MACOS_DIR/project.yml"
SCHEME="MindAnchorMac"

OUTPUT_DIR="${MINDANCHOR_MACOS_RELEASE_OUTPUT_DIR:-$ROOT_DIR/dist/macos-release}"
API_BASE_URL="${MINDANCHOR_MACOS_API_BASE_URL:-}"
SUPABASE_URL="${MINDANCHOR_MACOS_SUPABASE_URL:-}"
SUPABASE_ANON_KEY="${MINDANCHOR_MACOS_SUPABASE_ANON_KEY:-}"
MARKETING_VERSION_OVERRIDE="${MINDANCHOR_MACOS_MARKETING_VERSION:-}"
BUILD_NUMBER_OVERRIDE="${MINDANCHOR_MACOS_BUILD_NUMBER:-}"
SIGNING_IDENTITY="${MINDANCHOR_MACOS_SIGNING_IDENTITY:-}"
TEAM_ID="${MINDANCHOR_MACOS_TEAM_ID:-}"
NOTARY_PROFILE="${MINDANCHOR_MACOS_NOTARY_PROFILE:-}"
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage:
  bash scripts/build-macos-release.sh [options]

Options:
  --output-dir <path>       Release output directory
  --api-base-url <url>      Inject MINDANCHOR_API_BASE_URL into Release build
  --supabase-url <url>      Inject MINDANCHOR_SUPABASE_URL into Release build
  --supabase-anon-key <k>   Inject MINDANCHOR_SUPABASE_ANON_KEY into Release build
  --version <semver>        Override MARKETING_VERSION
  --build-number <n>        Override CURRENT_PROJECT_VERSION
  --signing-identity <id>   Apple signing identity for Release signing
  --team-id <id>            Apple team ID used with manual signing
  --notary-profile <name>   notarytool keychain profile for notarization
  --dry-run                 Print planned commands without executing
  --help                    Show this help

Environment equivalents:
  MINDANCHOR_MACOS_RELEASE_OUTPUT_DIR
  MINDANCHOR_MACOS_API_BASE_URL
  MINDANCHOR_MACOS_SUPABASE_URL
  MINDANCHOR_MACOS_SUPABASE_ANON_KEY
  MINDANCHOR_MACOS_MARKETING_VERSION
  MINDANCHOR_MACOS_BUILD_NUMBER
  MINDANCHOR_MACOS_SIGNING_IDENTITY
  MINDANCHOR_MACOS_TEAM_ID
  MINDANCHOR_MACOS_NOTARY_PROFILE
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --api-base-url)
      API_BASE_URL="$2"
      shift 2
      ;;
    --supabase-url)
      SUPABASE_URL="$2"
      shift 2
      ;;
    --supabase-anon-key)
      SUPABASE_ANON_KEY="$2"
      shift 2
      ;;
    --version)
      MARKETING_VERSION_OVERRIDE="$2"
      shift 2
      ;;
    --build-number)
      BUILD_NUMBER_OVERRIDE="$2"
      shift 2
      ;;
    --signing-identity)
      SIGNING_IDENTITY="$2"
      shift 2
      ;;
    --team-id)
      TEAM_ID="$2"
      shift 2
      ;;
    --notary-profile)
      NOTARY_PROFILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
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

ARCHIVE_PATH="$OUTPUT_DIR/MindAnchorMac.xcarchive"
APP_STAGING_DIR="$OUTPUT_DIR/staging"
APP_PATH="$APP_STAGING_DIR/MindAnchorMac.app"
SUMMARY_PATH="$OUTPUT_DIR/release-summary.json"

xcodebuild_args=(
  -project "$PROJECT_PATH"
  -scheme "$SCHEME"
  -configuration Release
  -archivePath "$ARCHIVE_PATH"
  -destination "generic/platform=macOS"
  archive
)

if [[ -n "$API_BASE_URL" ]]; then
  xcodebuild_args+=("MINDANCHOR_API_BASE_URL=$API_BASE_URL")
fi
if [[ -n "$SUPABASE_URL" ]]; then
  xcodebuild_args+=("MINDANCHOR_SUPABASE_URL=$SUPABASE_URL")
fi
if [[ -n "$SUPABASE_ANON_KEY" ]]; then
  xcodebuild_args+=("MINDANCHOR_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY")
fi
if [[ -n "$MARKETING_VERSION_OVERRIDE" ]]; then
  xcodebuild_args+=("MARKETING_VERSION=$MARKETING_VERSION_OVERRIDE")
fi
if [[ -n "$BUILD_NUMBER_OVERRIDE" ]]; then
  xcodebuild_args+=("CURRENT_PROJECT_VERSION=$BUILD_NUMBER_OVERRIDE")
fi

SIGNED_MODE=0
if [[ -n "$SIGNING_IDENTITY" ]]; then
  SIGNED_MODE=1
  xcodebuild_args+=("CODE_SIGN_STYLE=Manual" "CODE_SIGN_IDENTITY=$SIGNING_IDENTITY")
  if [[ -n "$TEAM_ID" ]]; then
    xcodebuild_args+=("DEVELOPMENT_TEAM=$TEAM_ID")
  fi
else
  xcodebuild_args+=("CODE_SIGNING_ALLOWED=NO")
fi

print_plan() {
  cat <<EOF
MindAnchor macOS release plan
root: $ROOT_DIR
macos dir: $MACOS_DIR
output dir: $OUTPUT_DIR
archive path: $ARCHIVE_PATH
staged app path: $APP_PATH
summary path: $SUMMARY_PATH
signed mode: $SIGNED_MODE
notary profile: ${NOTARY_PROFILE:-<none>}

Commands:
  rm -rf "$PROJECT_PATH"
  xcodegen generate --spec "$PROJECT_SPEC" --project "$MACOS_DIR"
  xcodebuild archive ${xcodebuild_args[*]}
  ditto "<archive-app>" "$APP_PATH"
  hdiutil create "$OUTPUT_DIR/MindAnchorMac-<version>+<build>.dmg" -volname "MindAnchor" -srcfolder "$APP_STAGING_DIR" -ov -format UDZO
EOF
}

if [[ "$DRY_RUN" -eq 1 ]]; then
  print_plan
  exit 0
fi

mkdir -p "$OUTPUT_DIR"
rm -rf "$PROJECT_PATH" "$ARCHIVE_PATH" "$APP_STAGING_DIR"

(
  cd "$MACOS_DIR"
  xcodegen generate --spec "$PROJECT_SPEC" --project .
)

xcodebuild "${xcodebuild_args[@]}"

ARCHIVED_APP_PATH="$ARCHIVE_PATH/Products/Applications/MindAnchorMac.app"
if [[ ! -d "$ARCHIVED_APP_PATH" ]]; then
  echo "Archived app not found at $ARCHIVED_APP_PATH" >&2
  exit 1
fi

mkdir -p "$APP_STAGING_DIR"
ditto "$ARCHIVED_APP_PATH" "$APP_PATH"

if [[ "$SIGNED_MODE" -eq 1 ]]; then
  codesign --force --deep --options runtime --sign "$SIGNING_IDENTITY" "$APP_PATH"
fi

APP_INFO_PLIST="$APP_PATH/Contents/Info.plist"
APP_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP_INFO_PLIST")"
APP_BUILD_NUMBER="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$APP_INFO_PLIST")"
DMG_PATH="$OUTPUT_DIR/MindAnchorMac-${APP_VERSION}+${APP_BUILD_NUMBER}.dmg"

rm -f "$DMG_PATH"
hdiutil create "$DMG_PATH" -volname "MindAnchor" -srcfolder "$APP_STAGING_DIR" -ov -format UDZO >/dev/null

NOTARIZED=0
if [[ -n "$NOTARY_PROFILE" ]]; then
  xcrun notarytool submit "$DMG_PATH" --keychain-profile "$NOTARY_PROFILE" --wait
  xcrun stapler staple "$DMG_PATH"
  NOTARIZED=1
fi

GENERATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
cat >"$SUMMARY_PATH" <<EOF
{
  "generatedAt": "$GENERATED_AT",
  "archivePath": "$ARCHIVE_PATH",
  "appPath": "$APP_PATH",
  "dmgPath": "$DMG_PATH",
  "version": "$APP_VERSION",
  "buildNumber": "$APP_BUILD_NUMBER",
  "signed": $( [[ "$SIGNED_MODE" -eq 1 ]] && echo true || echo false ),
  "notarized": $( [[ "$NOTARIZED" -eq 1 ]] && echo true || echo false ),
  "apiBaseUrl": "${API_BASE_URL:-}",
  "supabaseUrl": "${SUPABASE_URL:-}"
}
EOF

echo "✅ macOS release candidate created"
echo "- archive: $ARCHIVE_PATH"
echo "- app: $APP_PATH"
echo "- dmg: $DMG_PATH"
echo "- summary: $SUMMARY_PATH"
