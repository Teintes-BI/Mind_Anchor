#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[compat] start-openclaw-real-lan.sh -> start-openclaw-runtime-lan.sh"
exec bash scripts/start-openclaw-runtime-lan.sh
