#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$HOME/.openclaw/bin:$PATH"
if [[ -n "${OPENCLAW_NODE_BIN:-}" ]]; then
  export PATH="$(dirname "$OPENCLAW_NODE_BIN"):$PATH"
fi

PROFILE="${OPENCLAW_REAL_PROFILE:-dev}"
BASE_URL="${OPENCLAW_REAL_BASE_URL:-https://gmncode.cn}"
MODEL_ID="${OPENCLAW_REAL_MODEL_ID:-gpt-5.4}"
OPENCLAW_BIN="${OPENCLAW_BIN:-$HOME/.openclaw/bin/openclaw}"
AUTH_JSON_PATH="${OPENCLAW_REAL_AUTH_JSON_PATH:-$HOME/.codex/auth.json}"
PYTHON_BIN="${OPENCLAW_PYTHON_BIN:-$(command -v python3 || true)}"

if [[ ! -x "$OPENCLAW_BIN" ]]; then
  echo "OpenClaw binary not found: $OPENCLAW_BIN" >&2
  exit 1
fi

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "Python 3 runtime not found: ${PYTHON_BIN:-<unset>}" >&2
  echo "Set OPENCLAW_PYTHON_BIN or install python3 so auth.json and profile files can be prepared." >&2
  exit 1
fi

resolve_api_key() {
  if [[ -n "${OPENCLAW_REAL_API_KEY:-}" ]]; then
    printf '%s' "$OPENCLAW_REAL_API_KEY"
    return 0
  fi

  if [[ -n "${OPENAI_API_KEY:-}" ]]; then
    printf '%s' "$OPENAI_API_KEY"
    return 0
  fi

  if [[ -f "$AUTH_JSON_PATH" ]]; then
    "$PYTHON_BIN" - <<'PY' "$AUTH_JSON_PATH"
from pathlib import Path
import json
import sys

path = Path(sys.argv[1]).expanduser()
obj = json.loads(path.read_text(encoding="utf-8"))
value = obj.get("OPENAI_API_KEY", "")
print(value, end="")
PY
    return 0
  fi

  return 1
}

OPENAI_KEY="$(resolve_api_key || true)"
if [[ -z "$OPENAI_KEY" ]]; then
  echo "No API key found. Set OPENCLAW_REAL_API_KEY or OPENAI_API_KEY, or populate $AUTH_JSON_PATH." >&2
  exit 1
fi

if [[ "$PROFILE" == "dev" ]]; then
  PROFILE_ARGS=(--dev)
  PROFILE_HOME="$HOME/.openclaw-dev"
else
  PROFILE_ARGS=(--profile "$PROFILE")
  PROFILE_HOME="$HOME/.openclaw-$PROFILE"
fi

CONFIG_PATH="$PROFILE_HOME/openclaw.json"

rm -f "$CONFIG_PATH"
mkdir -p "$PROFILE_HOME"

"$OPENCLAW_BIN" "${PROFILE_ARGS[@]}" config set 'models' "{\"mode\":\"replace\",\"providers\":{\"codex\":{\"baseUrl\":\"$BASE_URL\",\"auth\":\"token\",\"api\":\"openai-responses\",\"models\":[{\"id\":\"$MODEL_ID\",\"name\":\"$MODEL_ID\",\"api\":\"openai-responses\",\"reasoning\":true,\"input\":[\"text\",\"image\"],\"contextWindow\":1000000,\"maxTokens\":128000,\"compat\":{\"supportsReasoningEffort\":true,\"supportsStore\":true}}]}}}" --strict-json >/dev/null
"$OPENCLAW_BIN" "${PROFILE_ARGS[@]}" config set 'agents.defaults.model' "{\"primary\":\"codex/$MODEL_ID@codex:manual\",\"fallbacks\":[]}" --strict-json >/dev/null

"$PYTHON_BIN" - <<'PY' "$PROFILE_HOME" "$OPENAI_KEY"
from pathlib import Path
import json
import sys

profile_home = Path(sys.argv[1]).expanduser()
api_key = sys.argv[2]
agents = [
    "main",
    "chief-agent",
    "state-insight-agent",
    "task-management-agent",
    "progress-feedback-agent",
    "interruption-recovery-agent",
    "reflection-coach-agent",
    "automation-agent",
]

store = {
    "version": 1,
    "profiles": {
        "codex:manual": {
            "type": "token",
            "provider": "codex",
            "token": api_key,
        }
    },
    "order": {"codex": ["codex:manual"]},
    "lastGood": {"codex": "codex:manual"},
}

for agent in agents:
    auth_path = profile_home / "agents" / agent / "agent" / "auth-profiles.json"
    auth_path.parent.mkdir(parents=True, exist_ok=True)
    auth_path.write_text(json.dumps(store, ensure_ascii=False, indent=2), encoding="utf-8")
PY

for agent in chief-agent state-insight-agent task-management-agent progress-feedback-agent interruption-recovery-agent reflection-coach-agent automation-agent; do
  "$OPENCLAW_BIN" "${PROFILE_ARGS[@]}" agents add "$agent" --non-interactive --workspace "$PROFILE_HOME/workspaces/$agent" --model "codex/$MODEL_ID@codex:manual" --json >/dev/null 2>&1 || true
done

"$OPENCLAW_BIN" "${PROFILE_ARGS[@]}" config validate >/dev/null

echo "Configured OpenClaw profile '$PROFILE' for model '$MODEL_ID' via $BASE_URL."
echo "Config: $CONFIG_PATH"
echo
echo "If you want MindAnchor Gateway provider-direct to mirror this OpenClaw profile, export:"
echo "  export MINDANCHOR_DEFAULT_MODEL_BASE_URL=\"$BASE_URL\""
echo "  export MINDANCHOR_DEFAULT_MODEL_NAME=\"$MODEL_ID\""
echo "  export MINDANCHOR_DEFAULT_MODEL_WIRE_API=\"responses\""
