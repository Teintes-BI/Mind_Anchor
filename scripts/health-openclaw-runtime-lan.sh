#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENCLAW_PORT="${OPENCLAW_PORT:-8800}"
CURL_MAX_TIME="${OPENCLAW_HEALTH_CURL_MAX_TIME:-3}"

# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/openclaw-runtime-files.sh"
FILE_PREFIX="$(resolve_openclaw_runtime_file_prefix "$OPENCLAW_PORT")"
ENV_FILE="$ROOT_DIR/.logs/${FILE_PREFIX}.env"
PID_FILE="$ROOT_DIR/.logs/${FILE_PREFIX}.pid"
LOG_FILE="$ROOT_DIR/.logs/${FILE_PREFIX}.log"
HEALTH_URL="${OPENCLAW_HEALTH_URL:-}"
LAN_BASE_URL="${OPENCLAW_BASE_URL:-}"
SKIP_LAN_HEALTH="${OPENCLAW_SKIP_LAN_HEALTH:-0}"

if [[ -f "$ENV_FILE" && ( -z "$HEALTH_URL" || -z "$LAN_BASE_URL" ) ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

LOOPBACK_HEALTH_URL="${OPENCLAW_HEALTH_URL:-http://127.0.0.1:${OPENCLAW_PORT:-8800}/health}"
LAN_BASE_URL="${OPENCLAW_BASE_URL:-$LAN_BASE_URL}"
LAN_HEALTH_URL="${OPENCLAW_LAN_HEALTH_URL:-}"
if [[ -z "$LAN_HEALTH_URL" && -n "$LAN_BASE_URL" ]]; then
  LAN_HEALTH_URL="${LAN_BASE_URL%/}/health"
fi

curl_health() {
  local url="$1"
  curl --max-time "$CURL_MAX_TIME" -fsS "$url"
}

print_failure_context() {
  echo >&2
  echo "CHECK_FAILED=$1" >&2
  echo "LOOPBACK_HEALTH_URL=$LOOPBACK_HEALTH_URL" >&2
  echo "LAN_HEALTH_URL=${LAN_HEALTH_URL:-}" >&2
  echo "FILE_PREFIX=$FILE_PREFIX" >&2
  echo "PID_FILE=$PID_FILE" >&2
  echo "LOG_FILE=$LOG_FILE" >&2
  echo "ENV_FILE=$ENV_FILE" >&2
}

LOOPBACK_PAYLOAD="$(curl_health "$LOOPBACK_HEALTH_URL")" || {
  print_failure_context "loopback"
  exit 1
}

printf '%s\n' "$LOOPBACK_PAYLOAD"

if [[ "$SKIP_LAN_HEALTH" == "1" || -z "$LAN_HEALTH_URL" || "$LAN_HEALTH_URL" == "$LOOPBACK_HEALTH_URL" ]]; then
  exit 0
fi

if ! curl_health "$LAN_HEALTH_URL" >/dev/null; then
  print_failure_context "lan"
  exit 1
fi
