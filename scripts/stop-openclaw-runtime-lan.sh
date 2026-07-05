#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENCLAW_PORT="${OPENCLAW_PORT:-8800}"

# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/openclaw-runtime-files.sh"
FILE_PREFIX="$(resolve_openclaw_runtime_file_prefix "$OPENCLAW_PORT")"
PID_FILE="$ROOT_DIR/.logs/${FILE_PREFIX}.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "No OpenClaw runtime pid file found."
  exit 0
fi

PID="$(cat "$PID_FILE")"
if ps -p "$PID" >/dev/null 2>&1; then
  kill "$PID" >/dev/null 2>&1 || true
  echo "Stopped OpenClaw runtime service ($PID)."
else
  echo "PID $PID is not running."
fi

rm -f "$PID_FILE"
