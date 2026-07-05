#!/usr/bin/env bash
set -euo pipefail

resolve_openclaw_runtime_file_prefix() {
  local port="${1:-${OPENCLAW_PORT:-8800}}"
  local instance="${OPENCLAW_RUNTIME_INSTANCE:-}"

  if [[ -n "$instance" ]]; then
    printf '%s\n' "openclaw-runtime-${instance}"
    return 0
  fi

  if [[ "$port" == "8800" ]]; then
    printf '%s\n' "openclaw-real-lan"
    return 0
  fi

  printf '%s\n' "openclaw-real-lan-${port}"
}
