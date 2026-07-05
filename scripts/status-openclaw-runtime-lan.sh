#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENCLAW_PORT="${OPENCLAW_PORT:-8800}"

# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/openclaw-runtime-files.sh"
FILE_PREFIX="$(resolve_openclaw_runtime_file_prefix "$OPENCLAW_PORT")"
ENV_FILE="$ROOT_DIR/.logs/${FILE_PREFIX}.env"
PID_FILE="$ROOT_DIR/.logs/${FILE_PREFIX}.pid"
LOG_FILE="$ROOT_DIR/.logs/${FILE_PREFIX}.log"

echo "FILE_PREFIX=$FILE_PREFIX"
echo "PID_FILE=$PID_FILE"
echo "LOG_FILE=$LOG_FILE"
echo "ENV_FILE=$ENV_FILE"

if [[ -f "$ENV_FILE" ]]; then
  cat "$ENV_FILE"
else
  echo "No runtime env snapshot found at $ENV_FILE"
fi

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if ps -p "$PID" >/dev/null 2>&1; then
    echo "STATUS=running"
  else
    echo "STATUS=stale-pid"
  fi
else
  echo "STATUS=stopped"
fi
