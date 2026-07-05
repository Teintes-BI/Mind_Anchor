#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[compat] stop-openclaw-real-lan.sh -> stop-openclaw-runtime-lan.sh"
exec bash scripts/stop-openclaw-runtime-lan.sh
