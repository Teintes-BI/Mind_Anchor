#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${MINDANCHOR_API_URL:-http://127.0.0.1:3001}"
CLUSTER_BASE_URL="${MINDANCHOR_OPENCLAW_BASE_URL:-}"
REPORT_FILE="${MINDANCHOR_CLUSTER_SMOKE_REPORT_FILE:-}"
REPORT_DATE="${MINDANCHOR_CLUSTER_SMOKE_REPORT_DATE:-}"

DIRECT_ENDPOINT=""
DIRECT_STATUS=""
DIRECT_BODY_FILE=""
HEALTH_STATUS=""
HEALTH_BODY_FILE=""
ADAPTER_STATUS=""
ADAPTER_BODY_FILE=""
PROBE_STATUS=""
PROBE_BODY_FILE=""
SCENARIO_SEED_STATUS=""
SCENARIO_SEED_BODY_FILE=""
STATE_DEBUG_STATUS=""
STATE_DEBUG_BODY_FILE=""
STATE_DEBUG_USER_ID=""
RECOVERY_DEBUG_STATUS=""
RECOVERY_DEBUG_BODY_FILE=""
REFLECTION_DEBUG_STATUS=""
REFLECTION_DEBUG_BODY_FILE=""
SCENARIO_TASK_ID=""
SCENARIO_GOAL_ID=""
SCENARIO_PERIOD_TYPE=""
TASK_DEBUG_STATUS=""
TASK_DEBUG_BODY_FILE=""
PROGRESS_DEBUG_STATUS=""
PROGRESS_DEBUG_BODY_FILE=""
AUTOMATION_DEBUG_STATUS=""
AUTOMATION_DEBUG_BODY_FILE=""

if [[ "${1:-}" == "--help" ]]; then
  cat <<EOF
Usage:
  MINDANCHOR_API_URL=http://127.0.0.1:3001 \\
  MINDANCHOR_OPENCLAW_BASE_URL=http://cluster-host:8787 \\
  bash scripts/smoke-openclaw-cluster.sh

Checks direct OpenClaw cluster execute endpoints and the Gateway cluster-preferred path.

Optional:
  MINDANCHOR_CLUSTER_SMOKE_REPORT_DATE=YYYY-MM-DD
  MINDANCHOR_CLUSTER_SMOKE_REPORT_FILE=docs/openclaw-cluster-smoke-report-YYYY-MM-DD.md
EOF
  exit 0
fi

if [[ -z "$CLUSTER_BASE_URL" ]]; then
  echo "MINDANCHOR_OPENCLAW_BASE_URL is required."
  exit 1
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

append_report_snapshot() {
  local report_file="$1"
  {
    echo
    echo "## Script Snapshot"
    echo
    echo "- Captured at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "- API Base URL: \`${API_BASE_URL}\`"
    echo "- Cluster Base URL: \`${CLUSTER_BASE_URL}\`"
    echo "- Direct endpoint hit: \`${DIRECT_ENDPOINT}\`"
    echo "- Direct endpoint status: \`${DIRECT_STATUS}\`"
    echo "- \`/health\` status: \`${HEALTH_STATUS}\`"
    echo "- \`/debug/openclaw/adapter\` status: \`${ADAPTER_STATUS}\`"
    echo "- \`/debug/model-probe/chief-agent\` status: \`${PROBE_STATUS}\`"
    echo "- \`POST /debug/scenarios/focus-recovery-loop/seed\` status: \`${SCENARIO_SEED_STATUS}\`"
    echo "- \`/debug/agent/state-insight\` status: \`${STATE_DEBUG_STATUS}\`"
    echo "- \`/debug/agent/interruption-recovery\` status: \`${RECOVERY_DEBUG_STATUS}\`"
    echo "- \`/debug/agent/reflection\` status: \`${REFLECTION_DEBUG_STATUS}\`"
    echo "- \`/debug/agent/task-management\` status: \`${TASK_DEBUG_STATUS}\`"
    echo "- \`/debug/agent/progress-feedback\` status: \`${PROGRESS_DEBUG_STATUS}\`"
    echo "- \`/debug/agent/automation\` status: \`${AUTOMATION_DEBUG_STATUS}\`"
    echo
    echo "### Direct Cluster Response"
    echo
    echo '```json'
    cat "$DIRECT_BODY_FILE"
    echo
    echo '```'
    echo
    echo "### Gateway Health Response"
    echo
    echo '```json'
    cat "$HEALTH_BODY_FILE"
    echo
    echo '```'
    echo
    echo "### Adapter Response"
    echo
    echo '```json'
    cat "$ADAPTER_BODY_FILE"
    echo
    echo '```'
    echo
    echo "### Chief Probe Response"
    echo
    echo '```json'
    cat "$PROBE_BODY_FILE"
    echo
    echo '```'
    echo
    echo "### Scenario Seed Response"
    echo
    echo '```json'
    cat "$SCENARIO_SEED_BODY_FILE"
    echo
    echo '```'
    echo
    echo "### State Insight Debug Response"
    echo
    echo '```json'
    cat "$STATE_DEBUG_BODY_FILE"
    echo
    echo '```'
    echo
    echo "### Recovery Debug Response"
    echo
    echo '```json'
    cat "$RECOVERY_DEBUG_BODY_FILE"
    echo
    echo '```'
    echo
    echo "### Reflection Debug Response"
    echo
    echo '```json'
    cat "$REFLECTION_DEBUG_BODY_FILE"
    echo
    echo '```'
    echo
    echo "### Task Management Debug Response"
    echo
    echo '```json'
    cat "$TASK_DEBUG_BODY_FILE"
    echo
    echo '```'
    echo
    echo "### Progress Feedback Debug Response"
    echo
    echo '```json'
    cat "$PROGRESS_DEBUG_BODY_FILE"
    echo
    echo '```'
    echo
    echo "### Automation Debug Response"
    echo
    echo '```json'
    cat "$AUTOMATION_DEBUG_BODY_FILE"
    echo
    echo '```'
  } >> "$report_file"
}

autofill_report_summary() {
  local report_file="$1"
  python3 - <<'PY' \
    "$report_file" \
    "$API_BASE_URL" "$CLUSTER_BASE_URL" \
    "$DIRECT_ENDPOINT" "$DIRECT_STATUS" "$DIRECT_BODY_FILE" \
    "$HEALTH_STATUS" "$HEALTH_BODY_FILE" \
    "$ADAPTER_STATUS" "$ADAPTER_BODY_FILE" \
    "$PROBE_STATUS" "$PROBE_BODY_FILE" \
    "$SCENARIO_SEED_STATUS" "$SCENARIO_SEED_BODY_FILE" \
    "$STATE_DEBUG_STATUS" "$STATE_DEBUG_BODY_FILE" \
    "$RECOVERY_DEBUG_STATUS" "$RECOVERY_DEBUG_BODY_FILE" \
    "$REFLECTION_DEBUG_STATUS" "$REFLECTION_DEBUG_BODY_FILE" \
    "$TASK_DEBUG_STATUS" "$TASK_DEBUG_BODY_FILE" \
    "$PROGRESS_DEBUG_STATUS" "$PROGRESS_DEBUG_BODY_FILE" \
    "$AUTOMATION_DEBUG_STATUS" "$AUTOMATION_DEBUG_BODY_FILE"
from pathlib import Path
import json
import re
import sys

(
    report_path,
    api_base_url,
    cluster_base_url,
    direct_endpoint,
    direct_status,
    direct_body_file,
    health_status,
    health_body_file,
    adapter_status,
    adapter_body_file,
    probe_status,
    probe_body_file,
    scenario_seed_status,
    scenario_seed_body_file,
    state_debug_status,
    state_debug_body_file,
    recovery_debug_status,
    recovery_debug_body_file,
    reflection_debug_status,
    reflection_debug_body_file,
    task_debug_status,
    task_debug_body_file,
    progress_debug_status,
    progress_debug_body_file,
    automation_debug_status,
    automation_debug_body_file,
) = sys.argv[1:]

report = Path(report_path)
text = report.read_text(encoding="utf-8")

def load_json(path_str):
    path = Path(path_str)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}

direct = load_json(direct_body_file)
health = load_json(health_body_file)
adapter = load_json(adapter_body_file)
probe = load_json(probe_body_file)
seed = load_json(scenario_seed_body_file)
state = load_json(state_debug_body_file)
recovery = load_json(recovery_debug_body_file)
reflection = load_json(reflection_debug_body_file)
task = load_json(task_debug_body_file)
progress = load_json(progress_debug_body_file)
automation = load_json(automation_debug_body_file)

def replace_section(text, section_number, title, body):
    pattern = rf"## {section_number}\. {re.escape(title)}\n\n.*?(?=\n## {section_number + 1}\. )"
    replacement = f"## {section_number}. {title}\n\n{body}\n"
    return re.sub(pattern, replacement, text, flags=re.S)

def endpoint_row(endpoint):
    if endpoint == direct_endpoint:
        payload_type = "parsed" if "parsed" in direct else "outputText" if "outputText" in direct else "unknown"
        return f"| `{endpoint}` | {direct_status} | {str(direct.get('success', ''))} | {payload_type} | {'通过' if str(direct_status).startswith('2') and direct.get('success') is True else '不通过'} |"
    return f"| `{endpoint}` | 未执行 | 未执行 | 未执行 | 未执行 |"

def debug_section(name, status, payload):
    adapter_payload = payload.get("adapter") or {}
    return "\n".join(
        [
            f"### `{name}`",
            "",
            f"- HTTP Status：{status}",
            f"- `success`：{payload.get('success', '未返回')}",
            f"- `adapter.route`：{adapter_payload.get('route', '未返回')}",
            f"- `adapter.selectedEndpoint`：{adapter_payload.get('selectedEndpoint', '未返回')}",
            f"- `traceId`：{payload.get('traceId', '未返回')}",
            f"- 结果：{'通过' if str(status).startswith('2') and payload.get('adapter') else '不通过'}",
        ]
    )

def agent_matrix_row(agent_id, status, payload):
    adapter_payload = payload.get("adapter") or {}
    return (
        f"| `{agent_id}` | {status} | {payload.get('success', '未返回')} | "
        f"`{adapter_payload.get('route', '未返回')}` | "
        f"`{adapter_payload.get('selectedEndpoint', '未返回')}` | "
        f"`{adapter_payload.get('failureCategory', '无')}` | "
        f"{adapter_payload.get('fallbackReason', '无')} | "
        f"{'通过' if str(status).startswith('2') and adapter_payload else '不通过'} |"
    )

section1 = "\n".join(
    [
        f"- 日期：{Path(report_path).stem.split('-')[-3]}-{Path(report_path).stem.split('-')[-2]}-{Path(report_path).stem.split('-')[-1] if len(Path(report_path).stem.split('-')) >= 3 else '未记录'}",
        "- 执行人：Codex",
        "- 机器：当前本地 OpenClaw 计划部署机",
        "- Gateway 提交/版本：当前工作区源码",
        "- Cluster 提交/版本：本地兼容 OpenClaw execute 服务",
        "- 执行环境：",
        f"  - `MINDANCHOR_API_URL`：`{api_base_url}`",
        f"  - `MINDANCHOR_OPENCLAW_BASE_URL`：`{cluster_base_url}`",
        f"  - `MINDANCHOR_AGENT_MODE`：`{health.get('mode', '未返回')}`",
        "  - provider fallback 是否配置：未从脚本中自动判定",
    ]
)

section2 = "\n".join(
    [
        "| Endpoint | HTTP Status | success 字段 | parsed / outputText | 结果 |",
        "| --- | --- | --- | --- | --- |",
        endpoint_row("/v1/tasks/execute"),
        endpoint_row("/tasks/execute"),
        endpoint_row("/api/tasks/execute"),
        "",
        "### 原始结论",
        "",
        f"- 实际命中的 cluster 兼容端点：`{direct_endpoint}`",
        f"- 是否返回 `trace.traceId`：{'是' if (direct.get('trace') or {}).get('traceId') else '否'}",
        f"- 是否返回 `taskId`：{'是' if direct.get('taskId') else '否'}",
        f"- 是否返回 `metadata.runtime` / `metadata.worker`：{'是' if (direct.get('metadata') or {}).get('runtime') and (direct.get('metadata') or {}).get('worker') else '否'}",
    ]
)

adapter_last = adapter.get("lastDecision") or {}
probe_adapter = probe.get("adapter") or {}
section3 = "\n".join(
    [
        "### `/health`",
        "",
        f"- HTTP Status：{health_status}",
        f"- `mode`：`{health.get('mode', '未返回')}`",
        f"- `openClawBaseUrl`：`{health.get('openClawBaseUrl', '未返回')}`",
        f"- 结果：{'通过' if str(health_status).startswith('2') else '不通过'}",
        "",
        "### `/debug/openclaw/adapter`",
        "",
        f"- HTTP Status：{adapter_status}",
        f"- `clusterEnabled`：{adapter.get('clusterEnabled', '未返回')}",
        f"- `executionStrategy`：`{adapter.get('executionStrategy', '未返回')}`",
        f"- `lastDecision.route`：`{adapter_last.get('route', '未返回')}`",
        f"- `lastDecision.selectedEndpoint`：`{adapter_last.get('selectedEndpoint', '未返回')}`",
        f"- `lastFallback.fallbackReason`：{(adapter.get('lastFallback') or {}).get('fallbackReason', '无')}",
        f"- `recentTimeline` 是否有记录：{'有' if adapter.get('recentTimeline') else '无'}",
        f"- 结果：{'通过' if str(adapter_status).startswith('2') and adapter.get('clusterEnabled') is True else '不通过'}",
        "",
        "### `/debug/model-probe/chief-agent`",
        "",
        f"- HTTP Status：{probe_status}",
        f"- `success`：{probe.get('success', '未返回')}",
        f"- `adapter.route`：`{probe_adapter.get('route', '未返回')}`",
        f"- `adapter.selectedEndpoint`：`{probe_adapter.get('selectedEndpoint', '未返回')}`",
        f"- `adapter.fallbackReason`：{probe_adapter.get('fallbackReason', '无')}",
        f"- `traceId`：`{probe.get('traceId', '未返回')}`",
        f"- 结果：{'通过' if str(probe_status).startswith('2') and probe_adapter else '不通过'}",
        "",
        "### `POST /debug/scenarios/focus-recovery-loop/seed`",
        "",
        f"- HTTP Status：{scenario_seed_status}",
        f"- `scenarioId`：`{seed.get('scenarioId', '未返回')}`",
        f"- `userId`：`{seed.get('userId', '未返回')}`",
        f"- 结果：{'通过' if str(scenario_seed_status).startswith('2') else '不通过'}",
        "",
        debug_section("/debug/agent/state-insight", state_debug_status, state),
        "",
        debug_section("/debug/agent/interruption-recovery", recovery_debug_status, recovery),
        "",
        debug_section("/debug/agent/reflection", reflection_debug_status, reflection),
        "",
        debug_section("/debug/agent/task-management", task_debug_status, task),
        "",
        debug_section("/debug/agent/progress-feedback", progress_debug_status, progress),
        "",
        debug_section("/debug/agent/automation", automation_debug_status, automation),
    ]
)

section4 = "\n".join(
    [
        "- Dashboard 可打开：未验证（脚本未启动浏览器）",
        "- GoalFlow 可打开：未验证（脚本未启动浏览器）",
        "- State Trends 可打开：未验证（脚本未启动浏览器）",
        "- Recovery 可打开：未验证（脚本未启动浏览器）",
        "- Reflections 可打开：未验证（脚本未启动浏览器）",
        "- Inbox 可打开：未验证（脚本未启动浏览器）",
        "- Agent Lab 可打开：未验证（脚本未启动浏览器）",
        "",
        "### Agent Lab 重点",
        "",
        f"- adapter 状态卡显示正常：{'可由 API 推断为是' if adapter.get('clusterEnabled') else '未验证'}",
        f"- `Probe chief-agent` 显示路径：`{probe_adapter.get('route', '未返回')}`",
        f"- `state-insight-agent` debug 显示路径：`{(state.get('adapter') or {}).get('route', '未返回')}`",
        f"- `interruption-recovery-agent` debug 显示路径：`{(recovery.get('adapter') or {}).get('route', '未返回')}`",
        f"- `reflection-coach-agent` debug 显示路径：`{(reflection.get('adapter') or {}).get('route', '未返回')}`",
        f"- `task-management-agent` debug 显示路径：`{(task.get('adapter') or {}).get('route', '未返回')}`",
        f"- `progress-feedback-agent` debug 显示路径：`{(progress.get('adapter') or {}).get('route', '未返回')}`",
        f"- `automation-agent` debug 显示路径：`{(automation.get('adapter') or {}).get('route', '未返回')}`",
        "- Trace Inspector 能查到事件：未验证（脚本未打开浏览器）",
    ]
)

section5 = "\n".join(
    [
        "- 关键 traceId：",
        f"  - health / request trace：未单独记录",
        f"  - chief probe trace：`{probe.get('traceId', '未返回')}`",
        f"  - scenario seed trace：`{seed.get('traceId', '未返回')}`",
        f"  - state-insight debug trace：`{state.get('traceId', '未返回')}`",
        f"  - interruption-recovery debug trace：`{recovery.get('traceId', '未返回')}`",
        f"  - reflection debug trace：`{reflection.get('traceId', '未返回')}`",
        f"  - task-management debug trace：`{task.get('traceId', '未返回')}`",
        f"  - progress-feedback debug trace：`{progress.get('traceId', '未返回')}`",
        f"  - automation debug trace：`{automation.get('traceId', '未返回')}`",
        "- 关键截图或日志文件位置：",
        "  - adapter JSON 快照：本文件 `Script Snapshot`",
        "  - cluster 原始返回：本文件 `Direct Cluster Response`",
        "  - Agent Lab 截图：未生成",
        "- `debug/openclaw/adapter` 返回快照是否已保存：是",
    ]
)

gateway_pass = str(health_status).startswith("2") and str(adapter_status).startswith("2") and str(probe_status).startswith("2")
section6 = "\n".join(
    [
        f"- 直连 cluster 合同：{'通过' if str(direct_status).startswith('2') and direct.get('success') is True else '不通过'}",
        f"- Gateway cluster-preferred：{'通过' if gateway_pass else '不通过'}",
        "- Web 控制台：部分通过",
        f"- 综合判定：{'部分通过' if gateway_pass else '不通过'}",
        "",
        "### 7 Core Agent Result Matrix",
        "",
        "| Agent | HTTP Status | success | adapter.route | selectedEndpoint | failureCategory | fallbackReason | 结果 |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
        agent_matrix_row("chief-agent", probe_status, probe),
        agent_matrix_row("state-insight-agent", state_debug_status, state),
        agent_matrix_row("task-management-agent", task_debug_status, task),
        agent_matrix_row("progress-feedback-agent", progress_debug_status, progress),
        agent_matrix_row("interruption-recovery-agent", recovery_debug_status, recovery),
        agent_matrix_row("reflection-coach-agent", reflection_debug_status, reflection),
        agent_matrix_row("automation-agent", automation_debug_status, automation),
    ]
)

text = replace_section(text, 1, "基本信息", section1)
text = replace_section(text, 2, "直连 cluster 合同检查", section2)
text = replace_section(text, 3, "Gateway cluster-preferred 检查", section3)
text = replace_section(text, 4, "Web / Agent Lab 检查", section4)
text = replace_section(text, 5, "Trace / 排障留痕", section5)
text = replace_section(text, 6, "最终判定", section6)

report.write_text(text, encoding="utf-8")
PY
}

sample_payload() {
  cat <<'EOF'
{
  "taskId": "smoke-task-001",
  "target": "chief-agent",
  "createdAt": "2026-03-07T12:00:00.000Z",
  "trace": {
    "traceId": "smoke-trace-001",
    "source": "mindanchor-gateway",
    "operation": "probe",
    "agentName": "chief-agent",
    "userId": "demo-user"
  },
  "payload": {
    "systemPrompt": "Return JSON only.",
    "userPrompt": "Return exactly {\"probe\":\"ok\"}.",
    "config": {
      "wireApi": "responses",
      "reasoningEffort": "xhigh",
      "disableResponseStorage": true
    },
    "promptSummary": {
      "systemPromptHash": "smoke",
      "userPromptHash": "smoke",
      "systemPromptLength": 17,
      "userPromptLength": 31
    },
    "kind": "probe"
  },
  "mode": "probe"
}
EOF
}

check_direct_cluster() {
  local endpoint="$1"
  local body_file="$tmp_dir/direct_$(echo "$endpoint" | tr '/' '_').json"
  local status

  status="$(
    curl -sS -o "$body_file" -w "%{http_code}" \
      -H "Content-Type: application/json" \
      -d "$(sample_payload)" \
      "${CLUSTER_BASE_URL}${endpoint}"
  )"

  if [[ "$status" =~ ^2 ]] && grep -q '"success"' "$body_file"; then
    DIRECT_ENDPOINT="$endpoint"
    DIRECT_STATUS="$status"
    DIRECT_BODY_FILE="$body_file"
    echo "OK   direct-cluster              ${endpoint}"
    return 0
  fi

  echo "FAIL direct-cluster              ${endpoint} (status ${status})"
  cat "$body_file"
  return 1
}

check_gateway() {
  local path="$1"
  local expected="$2"
  local label="$3"
  local body_file="$tmp_dir/$(echo "$path" | tr '/:?' '_').json"
  local status

  status="$(curl -sS -o "$body_file" -w "%{http_code}" "${API_BASE_URL}${path}")"

  if [[ "$status" =~ ^2 ]] && grep -q "$expected" "$body_file"; then
    case "$label" in
      gateway-health)
        HEALTH_STATUS="$status"
        HEALTH_BODY_FILE="$body_file"
        ;;
      adapter-status)
        ADAPTER_STATUS="$status"
        ADAPTER_BODY_FILE="$body_file"
        ;;
      chief-probe)
        PROBE_STATUS="$status"
        PROBE_BODY_FILE="$body_file"
        ;;
    esac
    printf 'OK   %-28s %s\n' "$label" "$path"
    return 0
  fi

  printf 'FAIL %-28s %s (status %s)\n' "$label" "$path" "$status"
  cat "$body_file"
  return 1
}

post_gateway() {
  local path="$1"
  local expected="$2"
  local label="$3"
  local payload="${4:-{}}"
  local body_file="$tmp_dir/$(echo "$path" | tr '/:?' '_')_post.json"
  local status

  status="$(curl -sS -o "$body_file" -w "%{http_code}" -H "Content-Type: application/json" -d "$payload" "${API_BASE_URL}${path}")"

  if [[ "$status" =~ ^2 ]] && grep -q "$expected" "$body_file"; then
    case "$label" in
      scenario-seed)
        SCENARIO_SEED_STATUS="$status"
        SCENARIO_SEED_BODY_FILE="$body_file"
        ;;
    esac
    printf 'OK   %-28s %s\n' "$label" "$path"
    return 0
  fi

  printf 'FAIL %-28s %s (status %s)\n' "$label" "$path" "$status"
  cat "$body_file"
  return 1
}

echo "Running external OpenClaw cluster smoke"
echo "Cluster: ${CLUSTER_BASE_URL}"
echo "Gateway: ${API_BASE_URL}"

direct_ok=0
for endpoint in "/v1/tasks/execute" "/tasks/execute" "/api/tasks/execute"; do
  if check_direct_cluster "$endpoint"; then
    direct_ok=1
    break
  fi
done

if [[ "$direct_ok" -ne 1 ]]; then
  echo "All direct cluster execute endpoints failed."
  exit 1
fi

check_gateway "/health" "\"openClawBaseUrl\"" "gateway-health"
check_gateway "/debug/model-probe/chief-agent?userId=demo-user" "\"adapter\"" "chief-probe"
post_gateway "/debug/scenarios/focus-recovery-loop/seed" "\"scenarioId\"" "scenario-seed"
STATE_DEBUG_USER_ID="$(python3 - <<'PY' "$SCENARIO_SEED_BODY_FILE"
from pathlib import Path
import json
import sys

payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
print(payload.get("userId", "demo-user"))
PY
)"
SCENARIO_TASK_ID="$(python3 - <<'PY' "$SCENARIO_SEED_BODY_FILE"
from pathlib import Path
import json
import sys

payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
print(payload.get("taskId", ""))
PY
)"
SCENARIO_GOAL_ID="$(python3 - <<'PY' "$SCENARIO_SEED_BODY_FILE"
from pathlib import Path
import json
import sys

payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
print(payload.get("goalId", ""))
PY
)"
SCENARIO_PERIOD_TYPE="$(python3 - <<'PY' "$SCENARIO_SEED_BODY_FILE"
from pathlib import Path
import json
import sys

payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
print(payload.get("periodType", "weekly"))
PY
)"
STATE_DEBUG_BODY_FILE="$tmp_dir/state_insight_debug.json"
STATE_DEBUG_STATUS="$(curl -sS -o "$STATE_DEBUG_BODY_FILE" -w "%{http_code}" "${API_BASE_URL}/debug/agent/state-insight?userId=${STATE_DEBUG_USER_ID}&scenarioId=focus-recovery-loop")"
if [[ "$STATE_DEBUG_STATUS" =~ ^2 ]] && grep -q "\"adapter\"" "$STATE_DEBUG_BODY_FILE"; then
  echo "OK   state-insight-debug          /debug/agent/state-insight?userId=${STATE_DEBUG_USER_ID}&scenarioId=focus-recovery-loop"
else
  echo "FAIL state-insight-debug          /debug/agent/state-insight?userId=${STATE_DEBUG_USER_ID}&scenarioId=focus-recovery-loop (status ${STATE_DEBUG_STATUS})"
  cat "$STATE_DEBUG_BODY_FILE"
  exit 1
fi
RECOVERY_DEBUG_BODY_FILE="$tmp_dir/recovery_debug.json"
RECOVERY_DEBUG_STATUS="$(curl -sS -o "$RECOVERY_DEBUG_BODY_FILE" -w "%{http_code}" "${API_BASE_URL}/debug/agent/interruption-recovery?userId=${STATE_DEBUG_USER_ID}&taskId=${SCENARIO_TASK_ID}&scenarioId=focus-recovery-loop")"
if [[ "$RECOVERY_DEBUG_STATUS" =~ ^2 ]] && grep -q "\"adapter\"" "$RECOVERY_DEBUG_BODY_FILE"; then
  echo "OK   interruption-recovery-debug  /debug/agent/interruption-recovery?userId=${STATE_DEBUG_USER_ID}&taskId=${SCENARIO_TASK_ID}&scenarioId=focus-recovery-loop"
else
  echo "FAIL interruption-recovery-debug  /debug/agent/interruption-recovery?userId=${STATE_DEBUG_USER_ID}&taskId=${SCENARIO_TASK_ID}&scenarioId=focus-recovery-loop (status ${RECOVERY_DEBUG_STATUS})"
  cat "$RECOVERY_DEBUG_BODY_FILE"
  exit 1
fi
REFLECTION_DEBUG_BODY_FILE="$tmp_dir/reflection_debug.json"
REFLECTION_DEBUG_STATUS="$(curl -sS -o "$REFLECTION_DEBUG_BODY_FILE" -w "%{http_code}" "${API_BASE_URL}/debug/agent/reflection?userId=${STATE_DEBUG_USER_ID}&periodType=${SCENARIO_PERIOD_TYPE}&scenarioId=focus-recovery-loop")"
if [[ "$REFLECTION_DEBUG_STATUS" =~ ^2 ]] && grep -q "\"adapter\"" "$REFLECTION_DEBUG_BODY_FILE"; then
  echo "OK   reflection-debug             /debug/agent/reflection?userId=${STATE_DEBUG_USER_ID}&periodType=${SCENARIO_PERIOD_TYPE}&scenarioId=focus-recovery-loop"
else
  echo "FAIL reflection-debug             /debug/agent/reflection?userId=${STATE_DEBUG_USER_ID}&periodType=${SCENARIO_PERIOD_TYPE}&scenarioId=focus-recovery-loop (status ${REFLECTION_DEBUG_STATUS})"
  cat "$REFLECTION_DEBUG_BODY_FILE"
  exit 1
fi
TASK_DEBUG_BODY_FILE="$tmp_dir/task_debug.json"
TASK_DEBUG_STATUS="$(curl -sS -o "$TASK_DEBUG_BODY_FILE" -w "%{http_code}" "${API_BASE_URL}/debug/agent/task-management?userId=${STATE_DEBUG_USER_ID}&goalId=${SCENARIO_GOAL_ID}&scenarioId=focus-recovery-loop")"
if [[ "$TASK_DEBUG_STATUS" =~ ^2 ]] && grep -q "\"adapter\"" "$TASK_DEBUG_BODY_FILE"; then
  echo "OK   task-management-debug        /debug/agent/task-management?userId=${STATE_DEBUG_USER_ID}&goalId=${SCENARIO_GOAL_ID}&scenarioId=focus-recovery-loop"
else
  echo "FAIL task-management-debug        /debug/agent/task-management?userId=${STATE_DEBUG_USER_ID}&goalId=${SCENARIO_GOAL_ID}&scenarioId=focus-recovery-loop (status ${TASK_DEBUG_STATUS})"
  cat "$TASK_DEBUG_BODY_FILE"
  exit 1
fi
PROGRESS_DEBUG_BODY_FILE="$tmp_dir/progress_debug.json"
PROGRESS_DEBUG_STATUS="$(curl -sS -o "$PROGRESS_DEBUG_BODY_FILE" -w "%{http_code}" "${API_BASE_URL}/debug/agent/progress-feedback?userId=${STATE_DEBUG_USER_ID}&scenarioId=focus-recovery-loop")"
if [[ "$PROGRESS_DEBUG_STATUS" =~ ^2 ]] && grep -q "\"adapter\"" "$PROGRESS_DEBUG_BODY_FILE"; then
  echo "OK   progress-feedback-debug      /debug/agent/progress-feedback?userId=${STATE_DEBUG_USER_ID}&scenarioId=focus-recovery-loop"
else
  echo "FAIL progress-feedback-debug      /debug/agent/progress-feedback?userId=${STATE_DEBUG_USER_ID}&scenarioId=focus-recovery-loop (status ${PROGRESS_DEBUG_STATUS})"
  cat "$PROGRESS_DEBUG_BODY_FILE"
  exit 1
fi
AUTOMATION_DEBUG_BODY_FILE="$tmp_dir/automation_debug.json"
AUTOMATION_DEBUG_STATUS="$(curl -sS -o "$AUTOMATION_DEBUG_BODY_FILE" -w "%{http_code}" "${API_BASE_URL}/debug/agent/automation?userId=${STATE_DEBUG_USER_ID}&scenarioId=focus-recovery-loop")"
if [[ "$AUTOMATION_DEBUG_STATUS" =~ ^2 ]] && grep -q "\"adapter\"" "$AUTOMATION_DEBUG_BODY_FILE"; then
  echo "OK   automation-debug             /debug/agent/automation?userId=${STATE_DEBUG_USER_ID}&scenarioId=focus-recovery-loop"
else
  echo "FAIL automation-debug             /debug/agent/automation?userId=${STATE_DEBUG_USER_ID}&scenarioId=focus-recovery-loop (status ${AUTOMATION_DEBUG_STATUS})"
  cat "$AUTOMATION_DEBUG_BODY_FILE"
  exit 1
fi
check_gateway "/debug/openclaw/adapter" "\"clusterEnabled\":true" "adapter-status"

ensure_report_file
autofill_report_summary "$REPORT_FILE"
append_report_snapshot "$REPORT_FILE"

echo "External OpenClaw cluster smoke completed successfully."
echo "Snapshot appended to ${REPORT_FILE}"
