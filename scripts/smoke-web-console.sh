#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

node "${ROOT_DIR}/scripts/clean-appledouble.mjs" --quiet --root "${ROOT_DIR}"

API_BASE_URL="${MINDANCHOR_API_URL:-http://127.0.0.1:3001}"
SMOKE_USER_ID="${MINDANCHOR_WEB_SMOKE_USER_ID:-demo-user}"
BOOTSTRAP_DEMO_USER="${MINDANCHOR_WEB_SMOKE_BOOTSTRAP_DEMO_USER:-1}"
REQUIRE_CONTENT="${MINDANCHOR_WEB_SMOKE_REQUIRE_CONTENT:-1}"

if [[ "${1:-}" == "--help" ]]; then
  cat <<EOF
Usage: MINDANCHOR_API_URL=http://127.0.0.1:3001 bash scripts/smoke-web-console.sh

Checks the core read-model and debug endpoints used by the Web console.

Optional:
  MINDANCHOR_WEB_SMOKE_USER_ID=demo-user
  MINDANCHOR_WEB_SMOKE_BOOTSTRAP_DEMO_USER=1
  MINDANCHOR_WEB_SMOKE_REQUIRE_CONTENT=1
EOF
  exit 0
fi

tmp_dir="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_dir"
  node "${ROOT_DIR}/scripts/clean-appledouble.mjs" --quiet --root "${ROOT_DIR}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

pass_count=0
LAST_BODY_FILE=""

post_endpoint() {
  local path="$1"
  local expected="$2"
  local label="$3"
  local body_file="$tmp_dir/$(echo "$path" | tr '/:?' '_')_post.json"
  local status

  status="$(curl -sS -o "$body_file" -w "%{http_code}" -H "Content-Type: application/json" -d "{}" "${API_BASE_URL}${path}")"

  if [[ "$status" =~ ^2 ]] && grep -q "$expected" "$body_file"; then
    printf 'OK   %-28s %s\n' "$label" "$path" >&2
    pass_count=$((pass_count + 1))
    LAST_BODY_FILE="$body_file"
    return 0
  fi

  printf 'FAIL %-28s %s (status %s)\n' "$label" "$path" "$status" >&2
  cat "$body_file" >&2
  return 1
}

check_endpoint() {
  local path="$1"
  local expected="$2"
  local label="$3"
  local body_file="$tmp_dir/$(echo "$path" | tr '/:?' '_').json"
  local status

  status="$(curl -sS -o "$body_file" -w "%{http_code}" "${API_BASE_URL}${path}")"

  if [[ "$status" =~ ^2 ]] && grep -q "$expected" "$body_file"; then
    printf 'OK   %-28s %s\n' "$label" "$path" >&2
    pass_count=$((pass_count + 1))
    LAST_BODY_FILE="$body_file"
    return 0
  fi

  printf 'FAIL %-28s %s (status %s)\n' "$label" "$path" "$status" >&2
  cat "$body_file" >&2
  return 1
}

assert_json_condition() {
  local body_file="$1"
  local label="$2"
  local expression="$3"
  python3 - <<'PY' "$body_file" "$label" "$expression"
from pathlib import Path
import json
import sys

body_file = Path(sys.argv[1])
label = sys.argv[2]
expression = sys.argv[3]
payload = json.loads(body_file.read_text(encoding="utf-8"))

if not bool(eval(expression, {}, {"payload": payload})):
    print(f"FAIL {label}: content assertion failed -> {expression}", file=sys.stderr)
    print(json.dumps(payload, ensure_ascii=False, indent=2), file=sys.stderr)
    raise SystemExit(1)
PY
}

echo "Running Web console smoke checks against ${API_BASE_URL}"
echo "Smoke user: ${SMOKE_USER_ID}"

if [[ "$BOOTSTRAP_DEMO_USER" != "0" ]]; then
  post_endpoint "/debug/local-cluster/bootstrap" "\"userId\"" "bootstrap-demo-user"
fi

check_endpoint "/health" "\"ok\":true" "health"
check_endpoint "/dashboard/summary?userId=${SMOKE_USER_ID}" "\"goalCount\"" "dashboard"
dashboard_body="$LAST_BODY_FILE"
check_endpoint "/goalflow/overview?userId=${SMOKE_USER_ID}" "\"metricCounts\"" "goalflow"
goalflow_body="$LAST_BODY_FILE"
check_endpoint "/state/trends?userId=${SMOKE_USER_ID}" "\"metricCounts\"" "state-trends"
state_body="$LAST_BODY_FILE"
check_endpoint "/recovery/history?userId=${SMOKE_USER_ID}" "\"recoveryPlans\"" "recovery"
recovery_body="$LAST_BODY_FILE"
check_endpoint "/reflections/overview?userId=${SMOKE_USER_ID}" "\"reports\"" "reflections"
reflections_body="$LAST_BODY_FILE"
check_endpoint "/client/inbox/overview?userId=${SMOKE_USER_ID}" "\"messages\"" "inbox"
inbox_body="$LAST_BODY_FILE"
check_endpoint "/debug/openclaw/adapter" "\"executionStrategy\"" "adapter"
check_endpoint "/debug/agent-configs" "\"agents\"" "agent-configs"
check_endpoint "/debug/scenarios" "\"scenarios\"" "debug-scenarios"

if [[ "$REQUIRE_CONTENT" != "0" ]]; then
  assert_json_condition "$dashboard_body" "dashboard" "payload.get('taskCount', 0) > 0 and payload.get('latestAssessment') is not None and payload.get('latestRecoveryPlan') is not None"
  assert_json_condition "$goalflow_body" "goalflow" "payload.get('metricCounts', {}).get('totalTasks', 0) > 0 and payload.get('latestAssessment') is not None"
  assert_json_condition "$state_body" "state-trends" "payload.get('currentAssessment') is not None and len(payload.get('assessments', [])) > 0"
  assert_json_condition "$recovery_body" "recovery" "len(payload.get('recoveryPlans', [])) > 0 and len(payload.get('pendingTasks', [])) > 0"
  assert_json_condition "$reflections_body" "reflections" "payload.get('latestWeekly') is not None and payload.get('latestMonthly') is not None and len(payload.get('reports', [])) > 0"
  assert_json_condition "$inbox_body" "inbox" "len(payload.get('messages', [])) > 0 and len(payload.get('channelCounts', [])) > 0"
  echo "Content checks passed for ${SMOKE_USER_ID}."
fi

echo "Completed ${pass_count} smoke checks successfully."
