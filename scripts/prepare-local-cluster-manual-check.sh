#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${MINDANCHOR_API_URL:-http://127.0.0.1:3001}"
WEB_BASE_URL="${MINDANCHOR_WEB_URL:-http://127.0.0.1:5173}"
REPORT_FILE="${MINDANCHOR_CLUSTER_SMOKE_REPORT_FILE:-}"
REPORT_DATE="${MINDANCHOR_CLUSTER_SMOKE_REPORT_DATE:-}"

if [[ "${1:-}" == "--help" ]]; then
  cat <<EOF
Usage:
  MINDANCHOR_API_URL=http://127.0.0.1:3001 \\
  MINDANCHOR_WEB_URL=http://127.0.0.1:5173 \\
  bash scripts/prepare-local-cluster-manual-check.sh

Checks cluster-preferred readiness, seeds the focus recovery scenario,
and prints the page URLs plus the key human checks.

Optional:
  MINDANCHOR_CLUSTER_SMOKE_REPORT_DATE=YYYY-MM-DD
  MINDANCHOR_CLUSTER_SMOKE_REPORT_FILE=docs/openclaw-cluster-smoke-report-YYYY-MM-DD.md
EOF
  exit 0
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

resolve_report_file() {
  if [[ -n "$REPORT_FILE" ]]; then
    return 0
  fi

  if [[ -n "$REPORT_DATE" ]]; then
    REPORT_FILE="docs/openclaw-cluster-smoke-report-${REPORT_DATE}.md"
    return 0
  fi

  REPORT_DATE="$(date +%F)"
  REPORT_FILE="docs/openclaw-cluster-smoke-report-${REPORT_DATE}.md"
}

ensure_report_file() {
  resolve_report_file

  if [[ -e "$REPORT_FILE" ]]; then
    return 0
  fi

  if [[ -n "${MINDANCHOR_CLUSTER_SMOKE_REPORT_FILE:-}" ]]; then
    mkdir -p "$(dirname "$REPORT_FILE")"
    cp "docs/openclaw-cluster-smoke-report-template.md" "$REPORT_FILE"
    python3 - <<'PY' "$REPORT_FILE" "${REPORT_DATE:-$(date +%F)}"
from pathlib import Path
import sys

target = Path(sys.argv[1])
report_date = sys.argv[2]
text = target.read_text(encoding="utf-8")
text = text.replace(
    "# OpenClaw Cluster Smoke Report Template",
    f"# OpenClaw Cluster Smoke Report（{report_date}）",
    1,
)
target.write_text(text, encoding="utf-8")
PY
    return 0
  fi

  bash scripts/new-openclaw-cluster-smoke-report.sh "${REPORT_DATE}"
}

append_manual_prep_snapshot() {
  local report_file="$1"
  local health_file="$2"
  local adapter_file="$3"
  local seed_file="$4"
  local bootstrap_file="$5"
  local dashboard_file="$6"
  local goalflow_file="$7"
  local state_file="$8"
  local recovery_file="$9"
  local reflections_file="${10}"
  local inbox_file="${11}"

  python3 - <<'PY' "$report_file" "$health_file" "$adapter_file" "$seed_file" "$bootstrap_file" "$WEB_BASE_URL" "$dashboard_file" "$goalflow_file" "$state_file" "$recovery_file" "$reflections_file" "$inbox_file"
from pathlib import Path
import json
import sys

report_file = Path(sys.argv[1])
health = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
adapter = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))
seed = json.loads(Path(sys.argv[4]).read_text(encoding="utf-8"))
bootstrap = json.loads(Path(sys.argv[5]).read_text(encoding="utf-8"))
web_base = sys.argv[6]
dashboard = json.loads(Path(sys.argv[7]).read_text(encoding="utf-8"))
goalflow = json.loads(Path(sys.argv[8]).read_text(encoding="utf-8"))
state = json.loads(Path(sys.argv[9]).read_text(encoding="utf-8"))
recovery = json.loads(Path(sys.argv[10]).read_text(encoding="utf-8"))
reflections = json.loads(Path(sys.argv[11]).read_text(encoding="utf-8"))
inbox = json.loads(Path(sys.argv[12]).read_text(encoding="utf-8"))

with report_file.open("a", encoding="utf-8") as handle:
    handle.write("\n## Manual Verification Prep Snapshot\n\n")
    handle.write(f"- Captured at: {__import__('datetime').datetime.utcnow().isoformat()}Z\n")
    handle.write(f"- Gateway mode: `{health.get('mode')}`\n")
    handle.write(f"- OpenClaw base URL: `{health.get('openClawBaseUrl')}`\n")
    handle.write(f"- Adapter strategy: `{adapter.get('executionStrategy')}`\n")
    handle.write(f"- Business-page bootstrap user: `{bootstrap.get('userId')}`\n")
    handle.write(f"- Seeded scenario: `{seed.get('scenarioId')}` / user `{seed.get('userId')}`\n")
    handle.write("- Web console smoke: `passed`\n")
    handle.write(f"- Dashboard taskCount: `{dashboard.get('taskCount', 0)}`\n")
    handle.write(f"- GoalFlow totalTasks: `{goalflow.get('metricCounts', {}).get('totalTasks', 0)}`\n")
    handle.write(f"- State assessments: `{len(state.get('assessments', []))}`\n")
    handle.write(f"- Recovery plans: `{len(recovery.get('recoveryPlans', []))}`\n")
    handle.write(f"- Reflection reports: `{len(reflections.get('reports', []))}`\n")
    handle.write(f"- Inbox messages: `{len(inbox.get('messages', []))}`\n")
    handle.write("\n### Open these pages\n\n")
    for path in ["/agents", "/recovery", "/reflections", "/tasks", "/state", "/inbox"]:
        handle.write(f"- {web_base}{path}\n")
    handle.write("\n### Human checks\n\n")
    handle.write("- Agent Lab: strategy should be `cluster-preferred`\n")
    handle.write("- Agent Lab: probe/debug route badges should become `cluster`\n")
    handle.write("- Recovery: latest recovery plan should be populated\n")
    handle.write("- Reflections: weekly/monthly reports should show business text\n")
    handle.write("- GoalFlow: suggested focus tag and focus session area should be visible\n")
    handle.write("- State Trends: current assessment should show concrete scores\n")
    handle.write("- Inbox: channel distribution and message queues should not be empty\n")
PY
}

check_json_endpoint() {
  local path="$1"
  local expected="$2"
  local label="$3"
  local body_file="$tmp_dir/$(echo "$path" | tr '/:?' '_').json"
  local status

  status="$(curl -sS -o "$body_file" -w "%{http_code}" "${API_BASE_URL}${path}")"

  if [[ "$status" =~ ^2 ]] && grep -q "$expected" "$body_file"; then
    printf 'OK   %-28s %s\n' "$label" "$path" >&2
    echo "$body_file"
    return 0
  fi

  printf 'FAIL %-28s %s (status %s)\n' "$label" "$path" "$status" >&2
  cat "$body_file" >&2
  exit 1
}

post_json_endpoint() {
  local path="$1"
  local expected="$2"
  local label="$3"
  local payload="${4:-{}}"
  local body_file="$tmp_dir/$(echo "$path" | tr '/:?' '_')_post.json"
  local status

  status="$(curl -sS -o "$body_file" -w "%{http_code}" -H "Content-Type: application/json" -d "$payload" "${API_BASE_URL}${path}")"

  if [[ "$status" =~ ^2 ]] && grep -q "$expected" "$body_file"; then
    printf 'OK   %-28s %s\n' "$label" "$path" >&2
    echo "$body_file"
    return 0
  fi

  printf 'FAIL %-28s %s (status %s)\n' "$label" "$path" "$status" >&2
  cat "$body_file" >&2
  exit 1
}

extract_json_value() {
  local body_file="$1"
  local expression="$2"
  python3 - <<'PY' "$body_file" "$expression"
from pathlib import Path
import json
import sys

payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
expression = sys.argv[2]
value = eval(expression, {}, {"payload": payload})
print("" if value is None else value)
PY
}

echo "Preparing local-cluster manual verification"
echo "API: ${API_BASE_URL}"
echo "WEB: ${WEB_BASE_URL}"
echo

health_file="$(check_json_endpoint "/health" "\"openClawBaseUrl\"" "gateway-health")"
adapter_file="$(check_json_endpoint "/debug/openclaw/adapter" "\"clusterEnabled\":true" "adapter-status")"
bootstrap_file="$(post_json_endpoint "/debug/local-cluster/bootstrap" "\"sourceScenarioId\"" "local-bootstrap")"
seed_file="$(post_json_endpoint "/debug/scenarios/focus-recovery-loop/seed" "\"scenarioId\"" "scenario-seed")"
bootstrap_user_id="$(extract_json_value "$bootstrap_file" "payload.get('userId', 'demo-user')")"

MINDANCHOR_API_URL="$API_BASE_URL" \
MINDANCHOR_WEB_SMOKE_USER_ID="$bootstrap_user_id" \
MINDANCHOR_WEB_SMOKE_BOOTSTRAP_DEMO_USER=0 \
MINDANCHOR_WEB_SMOKE_REQUIRE_CONTENT=1 \
  bash scripts/smoke-web-console.sh

dashboard_file="$(check_json_endpoint "/dashboard/summary?userId=${bootstrap_user_id}" "\"taskCount\"" "dashboard-ready")"
goalflow_file="$(check_json_endpoint "/goalflow/overview?userId=${bootstrap_user_id}" "\"metricCounts\"" "goalflow-ready")"
state_file="$(check_json_endpoint "/state/trends?userId=${bootstrap_user_id}" "\"metricCounts\"" "state-ready")"
recovery_file="$(check_json_endpoint "/recovery/history?userId=${bootstrap_user_id}" "\"recoveryPlans\"" "recovery-ready")"
reflections_file="$(check_json_endpoint "/reflections/overview?userId=${bootstrap_user_id}" "\"reports\"" "reflections-ready")"
inbox_file="$(check_json_endpoint "/client/inbox/overview?userId=${bootstrap_user_id}" "\"messages\"" "inbox-ready")"

ensure_report_file
append_manual_prep_snapshot "$REPORT_FILE" "$health_file" "$adapter_file" "$seed_file" "$bootstrap_file" "$dashboard_file" "$goalflow_file" "$state_file" "$recovery_file" "$reflections_file" "$inbox_file"

python3 - <<'PY' "$health_file" "$adapter_file" "$seed_file" "$WEB_BASE_URL" "$REPORT_FILE" "$bootstrap_file" "$dashboard_file" "$goalflow_file" "$state_file" "$recovery_file" "$reflections_file" "$inbox_file"
from pathlib import Path
import json
import sys

health = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
adapter = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
seed = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))
web_base = sys.argv[4]
report_file = sys.argv[5]
bootstrap = json.loads(Path(sys.argv[6]).read_text(encoding="utf-8"))
dashboard = json.loads(Path(sys.argv[7]).read_text(encoding="utf-8"))
goalflow = json.loads(Path(sys.argv[8]).read_text(encoding="utf-8"))
state = json.loads(Path(sys.argv[9]).read_text(encoding="utf-8"))
recovery = json.loads(Path(sys.argv[10]).read_text(encoding="utf-8"))
reflections = json.loads(Path(sys.argv[11]).read_text(encoding="utf-8"))
inbox = json.loads(Path(sys.argv[12]).read_text(encoding="utf-8"))

print()
print("==== Ready to verify ====")
print(f"Gateway mode: {health.get('mode')}")
print(f"OpenClaw base URL: {health.get('openClawBaseUrl')}")
print(f"Adapter strategy: {adapter.get('executionStrategy')}")
print(f"Business-page user: {bootstrap.get('userId')}")
print(f"Seeded scenario: {seed.get('scenarioId')} / user {seed.get('userId')}")
print(f"Dashboard taskCount: {dashboard.get('taskCount', 0)}")
print(f"GoalFlow totalTasks: {goalflow.get('metricCounts', {}).get('totalTasks', 0)}")
print(f"State assessments: {len(state.get('assessments', []))}")
print(f"Recovery plans: {len(recovery.get('recoveryPlans', []))}")
print(f"Reflection reports: {len(reflections.get('reports', []))}")
print(f"Inbox messages: {len(inbox.get('messages', []))}")
print()
print("Open these pages:")
for path in ["/agents", "/recovery", "/reflections", "/tasks", "/state", "/inbox"]:
    print(f"- {web_base}{path}")
print()
print("Key checks:")
print("- Agent Lab: strategy should be cluster-preferred")
print("- Agent Lab: probe/debug route badges should become cluster")
print("- Recovery: latest recovery plan should be populated")
print("- Reflections: weekly/monthly reports should show business text")
print("- GoalFlow: suggested focus tag and focus session area should be visible")
print("- State Trends: current assessment should show concrete scores")
print("- Inbox: channel distribution and message queues should not be empty")
print()
print(f"Prep snapshot appended to: {report_file}")
PY
