#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export PATH="$ROOT_DIR/.tools/node/bin:$PATH"

OPENCLAW_HOST="${OPENCLAW_HOST:-0.0.0.0}"
OPENCLAW_PORT="${OPENCLAW_PORT:-8787}"
API_HOST="${MINDANCHOR_API_HOST:-127.0.0.1}"
API_PORT="${MINDANCHOR_API_PORT:-3001}"
WEB_HOST="${MINDANCHOR_WEB_HOST:-127.0.0.1}"
WEB_PORT="${MINDANCHOR_WEB_PORT:-5173}"
DATA_FILE="${MINDANCHOR_DATA_FILE:-$ROOT_DIR/data/mindanchor.json}"

mkdir -p "$ROOT_DIR/.logs"
OPENCLAW_LOG="$ROOT_DIR/.logs/openclaw-local.log"
API_LOG="$ROOT_DIR/.logs/api-local-cluster.log"
WEB_LOG="$ROOT_DIR/.logs/web-local-cluster.log"

cleanup() {
  local exit_code=$?
  kill "${WEB_PID:-}" >/dev/null 2>&1 || true
  kill "${API_PID:-}" >/dev/null 2>&1 || true
  kill "${OPENCLAW_PID:-}" >/dev/null 2>&1 || true
  exit "$exit_code"
}

trap cleanup INT TERM EXIT

echo "Preparing local-cluster verification stack..."
echo "Root: $ROOT_DIR"
echo "OpenClaw: http://127.0.0.1:${OPENCLAW_PORT}"
echo "API:      http://${API_HOST}:${API_PORT}"
echo "Web:      http://${WEB_HOST}:${WEB_PORT}"
echo
echo "Logs:"
echo "- $OPENCLAW_LOG"
echo "- $API_LOG"
echo "- $WEB_LOG"
echo

corepack pnpm --filter @mindanchor/domain build >/dev/null

OPENCLAW_HOST="$OPENCLAW_HOST" OPENCLAW_PORT="$OPENCLAW_PORT" \
  node openclaw/local-cluster-server.mjs >"$OPENCLAW_LOG" 2>&1 &
OPENCLAW_PID=$!

MINDANCHOR_API_PORT="$API_PORT" \
MINDANCHOR_DATA_FILE="$DATA_FILE" \
MINDANCHOR_AGENT_MODE="openai-compatible" \
MINDANCHOR_OPENCLAW_BASE_URL="http://127.0.0.1:${OPENCLAW_PORT}" \
  corepack pnpm --filter @mindanchor/api exec tsx src/index.ts >"$API_LOG" 2>&1 &
API_PID=$!

VITE_API_BASE_URL="http://${API_HOST}:${API_PORT}" \
  corepack pnpm --filter @mindanchor/web exec vite --host "$WEB_HOST" --port "$WEB_PORT" >"$WEB_LOG" 2>&1 &
WEB_PID=$!

wait_for_url() {
  local url="$1"
  local label="$2"
  for _ in $(seq 1 80); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "OK   $label ready at $url"
      return 0
    fi
    sleep 0.25
  done

  echo "FAIL $label did not become ready: $url"
  return 1
}

wait_for_url "http://127.0.0.1:${OPENCLAW_PORT}/health" "OpenClaw local cluster"
wait_for_url "http://${API_HOST}:${API_PORT}/health" "Gateway API"

for _ in $(seq 1 80); do
  if grep -q "Local:" "$WEB_LOG" 2>/dev/null; then
    echo "OK   Web UI ready (see $WEB_LOG)"
    break
  fi
  sleep 0.25
done

echo
echo "Local verification stack is up."
echo "Next:"
echo "1. Open http://${WEB_HOST}:${WEB_PORT}/agents"
echo "2. Run: corepack pnpm prepare:local-cluster-ui-check"
echo "3. Follow docs/local-cluster-manual-verification.md"
echo
echo "Press Ctrl-C to stop all three services."

wait
