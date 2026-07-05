#!/usr/bin/env bash

set -euo pipefail

GATEWAY_URL=""
OPENCLAW_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --gateway-url)
      GATEWAY_URL="${2:-}"
      shift 2
      ;;
    --openclaw-url)
      OPENCLAW_URL="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 --gateway-url http://127.0.0.1:3001 [--openclaw-url http://127.0.0.1:8787]" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$GATEWAY_URL" ]]; then
  echo "Missing required --gateway-url" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required for the V1 preflight check." >&2
  exit 1
fi

echo "==> MindAnchor V1 preflight"
echo "Gateway URL : $GATEWAY_URL"
echo "OpenClaw URL: ${OPENCLAW_URL:-<not provided>}"
echo

gateway_health="$(curl -fsS "${GATEWAY_URL%/}/health")" || {
  echo "❌ Gateway health check failed: ${GATEWAY_URL%/}/health" >&2
  exit 1
}

echo "✅ Gateway health reachable"
echo "$gateway_health"
echo

if [[ "$gateway_health" != *'"ok":true'* ]]; then
  echo "❌ Gateway returned a non-healthy payload." >&2
  exit 1
fi

adapter_payload="$(curl -fsS "${GATEWAY_URL%/}/debug/openclaw/adapter" 2>/dev/null || true)"
if [[ -n "$adapter_payload" ]]; then
  echo "✅ Gateway adapter status reachable"
  echo "$adapter_payload"
  echo
fi

if [[ -n "$OPENCLAW_URL" ]]; then
  openclaw_health="$(curl -fsS "${OPENCLAW_URL%/}/health")" || {
    echo "❌ OpenClaw health check failed: ${OPENCLAW_URL%/}/health" >&2
    exit 1
  }
  echo "✅ OpenClaw health reachable"
  echo "$openclaw_health"
  echo
fi

echo "==> Suggested next steps"
echo "1. Confirm your Gateway env has auth + model routing configured."
echo "2. Launch the Mac client with MINDANCHOR_API_BASE_URL=${GATEWAY_URL%/}."
echo "3. In the Mac app, sign in and confirm Today / Reminders / Settings all load."
echo "4. Run: corepack pnpm test:macos:status-item"
echo "5. Run: corepack pnpm test:macos:reminder-e2e"
