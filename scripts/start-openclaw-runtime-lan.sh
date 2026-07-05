#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export PATH="$ROOT_DIR/.tools/node/bin:$HOME/.openclaw/bin:$PATH"

OPENCLAW_PORT="${OPENCLAW_PORT:-8800}"
OPENCLAW_HOST="${OPENCLAW_HOST:-0.0.0.0}"
OPENCLAW_REAL_PROFILE="${OPENCLAW_REAL_PROFILE:-dev}"
CURL_BIN="${OPENCLAW_CURL_BIN:-$(command -v curl || true)}"
HEALTH_WAIT_ATTEMPTS="${OPENCLAW_START_HEALTH_WAIT_ATTEMPTS:-120}"
HEALTH_WAIT_INTERVAL="${OPENCLAW_START_HEALTH_WAIT_INTERVAL:-0.5}"
OPENCLAW_MIN_NODE_MAJOR=22
OPENCLAW_MIN_NODE_MINOR=16
OPENCLAW_MIN_NODE_PATCH=0

trim_node_version() {
  local raw="${1#v}"
  printf '%s\n' "$raw"
}

is_compatible_node_version() {
  local version
  version="$(trim_node_version "$1")"
  local major minor patch
  IFS=. read -r major minor patch <<<"$version"
  major="${major:-0}"
  minor="${minor:-0}"
  patch="${patch:-0}"

  if (( major != OPENCLAW_MIN_NODE_MAJOR )); then
    (( major > OPENCLAW_MIN_NODE_MAJOR ))
    return
  fi
  if (( minor != OPENCLAW_MIN_NODE_MINOR )); then
    (( minor > OPENCLAW_MIN_NODE_MINOR ))
    return
  fi
  (( patch >= OPENCLAW_MIN_NODE_PATCH ))
}

resolve_openclaw_node_bin() {
  if [[ -n "${OPENCLAW_NODE_BIN:-}" ]]; then
    if [[ ! -x "$OPENCLAW_NODE_BIN" ]]; then
      echo "Node runtime not found: $OPENCLAW_NODE_BIN" >&2
      echo "Set OPENCLAW_NODE_BIN or restore .tools/node/bin/node before starting the runtime service." >&2
      return 1
    fi
    printf '%s\n' "$OPENCLAW_NODE_BIN"
    return 0
  fi

  local candidates=()
  local checked=()
  if [[ -x "$ROOT_DIR/.tools/node/bin/node" ]]; then
    candidates+=("$ROOT_DIR/.tools/node/bin/node")
  fi
  while IFS= read -r candidate; do
    [[ -n "$candidate" ]] || continue
    candidates+=("$candidate")
  done < <(which -a node 2>/dev/null | awk '!seen[$0]++')

  local candidate version
  for candidate in "${candidates[@]}"; do
    [[ -x "$candidate" ]] || continue
    version="$("$candidate" -v 2>/dev/null || true)"
    checked+=("${candidate}:${version:-unknown}")
    if [[ -n "$version" ]] && is_compatible_node_version "$version"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  echo "No compatible Node runtime found for OpenClaw (requires >= ${OPENCLAW_MIN_NODE_MAJOR}.${OPENCLAW_MIN_NODE_MINOR}.${OPENCLAW_MIN_NODE_PATCH})." >&2
  printf 'Checked candidates:\n' >&2
  printf '  %s\n' "${checked[@]}" >&2
  echo "Set OPENCLAW_NODE_BIN explicitly to a compatible node binary." >&2
  return 1
}

OPENCLAW_NODE_BIN="$(resolve_openclaw_node_bin)"

if [[ ! -x "$OPENCLAW_NODE_BIN" ]]; then
  echo "Node runtime not found: $OPENCLAW_NODE_BIN" >&2
  echo "Set OPENCLAW_NODE_BIN or restore .tools/node/bin/node before starting the runtime service." >&2
  exit 1
fi

if [[ ! -x "$CURL_BIN" ]]; then
  echo "curl not found: ${CURL_BIN:-<unset>}" >&2
  echo "Install curl or set OPENCLAW_CURL_BIN before starting the runtime service." >&2
  exit 1
fi

if [[ -n "${OPENCLAW_LAN_IP:-}" ]]; then
  LAN_IP="$OPENCLAW_LAN_IP"
elif ! LAN_IP="$(bash scripts/detect-lan-ip.sh)"; then
  echo "Failed to detect LAN IP. Set OPENCLAW_LAN_IP explicitly before starting the runtime service." >&2
  exit 1
fi

# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/openclaw-runtime-files.sh"
FILE_PREFIX="$(resolve_openclaw_runtime_file_prefix "$OPENCLAW_PORT")"

mkdir -p "$ROOT_DIR/.logs"
PID_FILE="$ROOT_DIR/.logs/${FILE_PREFIX}.pid"
LOG_FILE="$ROOT_DIR/.logs/${FILE_PREFIX}.log"
ENV_FILE="$ROOT_DIR/.logs/${FILE_PREFIX}.env"

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE")"
  if ps -p "$OLD_PID" >/dev/null 2>&1; then
    echo "Stopping existing OpenClaw runtime service ($OLD_PID)..."
    kill "$OLD_PID" >/dev/null 2>&1 || true
    sleep 1
  fi
  rm -f "$PID_FILE"
fi

nohup env OPENCLAW_HOST="$OPENCLAW_HOST" OPENCLAW_PORT="$OPENCLAW_PORT" OPENCLAW_REAL_PROFILE="$OPENCLAW_REAL_PROFILE" OPENCLAW_NODE_BIN="$OPENCLAW_NODE_BIN" \
  bash scripts/run-openclaw-runtime-service.sh >"$LOG_FILE" 2>&1 < /dev/null &
PID=$!
echo "$PID" >"$PID_FILE"

cat >"$ENV_FILE" <<EOF
OPENCLAW_HOST=$OPENCLAW_HOST
OPENCLAW_PORT=$OPENCLAW_PORT
OPENCLAW_REAL_PROFILE=$OPENCLAW_REAL_PROFILE
OPENCLAW_LAN_IP=$LAN_IP
OPENCLAW_BASE_URL=http://$LAN_IP:$OPENCLAW_PORT
OPENCLAW_HEALTH_URL=http://127.0.0.1:$OPENCLAW_PORT/health
OPENCLAW_RUNTIME_ENTRYPOINT=openclaw/production-runtime-server.mjs
PID=$PID
EOF

for _ in $(seq 1 "$HEALTH_WAIT_ATTEMPTS"); do
  if "$CURL_BIN" -fsS "http://127.0.0.1:${OPENCLAW_PORT}/health" >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep "$HEALTH_WAIT_INTERVAL"
done

if [[ "${HEALTHY:-0}" != "1" ]]; then
  if ps -p "$PID" >/dev/null 2>&1; then
    kill "$PID" >/dev/null 2>&1 || true
  fi
  rm -f "$PID_FILE"
  echo "OpenClaw runtime failed to become healthy on http://127.0.0.1:${OPENCLAW_PORT}/health" >&2
  echo "Check log: $LOG_FILE" >&2
  exit 1
fi

echo "OpenClaw runtime service started."
echo "PID:  $PID"
echo "Node: $OPENCLAW_NODE_BIN"
echo "Loopback health: http://127.0.0.1:${OPENCLAW_PORT}/health"
echo "LAN base URL:    http://${LAN_IP}:${OPENCLAW_PORT}"
echo "Log: $LOG_FILE"
