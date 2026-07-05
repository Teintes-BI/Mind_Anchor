#!/usr/bin/env bash
set -euo pipefail

ROUTE_BIN="$(command -v route || true)"
IPCONFIG_BIN="$(command -v ipconfig || true)"
ROUTE_BIN="${ROUTE_BIN:-/sbin/route}"
IPCONFIG_BIN="${IPCONFIG_BIN:-/usr/sbin/ipconfig}"

DEFAULT_IF="$($ROUTE_BIN -n get default 2>/dev/null | awk '/interface:/{print $2; exit}')"
LAN_IP=""

if [[ -n "$DEFAULT_IF" ]]; then
  LAN_IP="$($IPCONFIG_BIN getifaddr "$DEFAULT_IF" 2>/dev/null || true)"
fi

if [[ -z "$LAN_IP" ]]; then
  LAN_IP="$(python3 - <<'PY'
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    sock.connect(("8.8.8.8", 80))
    print(sock.getsockname()[0], end="")
finally:
    sock.close()
PY
)"
fi

if [[ -z "$LAN_IP" ]]; then
  echo "Failed to detect LAN IP." >&2
  exit 1
fi

echo "$LAN_IP"
