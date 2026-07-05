#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export PATH="$ROOT_DIR/.tools/node/bin:$HOME/.openclaw/bin:$PATH"
OPENCLAW_NODE_BIN="${OPENCLAW_NODE_BIN:-$ROOT_DIR/.tools/node/bin/node}"

if [[ ! -x "$OPENCLAW_NODE_BIN" ]]; then
  echo "Node runtime not found: $OPENCLAW_NODE_BIN" >&2
  echo "Set OPENCLAW_NODE_BIN or restore .tools/node/bin/node before starting the runtime service." >&2
  exit 1
fi

export PATH="$(dirname "$OPENCLAW_NODE_BIN"):$HOME/.openclaw/bin:$PATH"

bash scripts/setup-openclaw-real-profile.sh >/dev/null

exec "$OPENCLAW_NODE_BIN" openclaw/production-runtime-server.mjs
