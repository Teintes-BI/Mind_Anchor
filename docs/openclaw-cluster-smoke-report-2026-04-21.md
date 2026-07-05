# OpenClaw Cluster Smoke Report（2026-04-21）

用于记录一次**真实外部 OpenClaw cluster 端到端 smoke** 的执行结果。

快速生成当天文件：

```bash
bash scripts/new-openclaw-cluster-smoke-report.sh 2026-03-07
```

建议每次在以下场景各跑一次并单独存档：

- 新机器首次接入
- 更换 cluster 部署
- 更换 provider fallback 配置
- 更换 Gateway 版本
- 更换 agent / worker / contract

---

## 1. 基本信息

- 日期：2026-04-21
- 执行人：Codex
- 机器：当前本地 OpenClaw 计划部署机
- Gateway 提交/版本：当前工作区源码
- Cluster 提交/版本：本地兼容 OpenClaw execute 服务
- 执行环境：
  - `MINDANCHOR_API_URL`：`http://127.0.0.1:3001`
  - `MINDANCHOR_OPENCLAW_BASE_URL`：`http://127.0.0.1:8787`
  - `MINDANCHOR_AGENT_MODE`：`openai-compatible`
  - provider fallback 是否配置：未从脚本中自动判定

## 2. 直连 cluster 合同检查

| Endpoint | HTTP Status | success 字段 | parsed / outputText | 结果 |
| --- | --- | --- | --- | --- |
| `/v1/tasks/execute` | 200 | True | parsed | 通过 |
| `/tasks/execute` | 未执行 | 未执行 | 未执行 | 未执行 |
| `/api/tasks/execute` | 未执行 | 未执行 | 未执行 | 未执行 |

### 原始结论

- 实际命中的 cluster 兼容端点：`/v1/tasks/execute`
- 是否返回 `trace.traceId`：是
- 是否返回 `taskId`：是
- 是否返回 `metadata.runtime` / `metadata.worker`：是

## 3. Gateway cluster-preferred 检查

### `/health`

- HTTP Status：200
- `mode`：`openai-compatible`
- `openClawBaseUrl`：`http://127.0.0.1:8787`
- 结果：通过

### `/debug/openclaw/adapter`

- HTTP Status：200
- `clusterEnabled`：True
- `executionStrategy`：`cluster-preferred`
- `lastDecision.route`：`cluster`
- `lastDecision.selectedEndpoint`：`cluster:/v1/tasks/execute`
- `lastFallback.fallbackReason`：无
- `recentTimeline` 是否有记录：有
- 结果：通过

### `/debug/model-probe/chief-agent`

- HTTP Status：200
- `success`：True
- `adapter.route`：`cluster`
- `adapter.selectedEndpoint`：`cluster:/v1/tasks/execute`
- `adapter.fallbackReason`：None
- `traceId`：`78ec3e18-e8fe-4453-bbcc-c111ec0664ed`
- 结果：通过

### `POST /debug/scenarios/focus-recovery-loop/seed`

- HTTP Status：200
- `scenarioId`：`focus-recovery-loop`
- `userId`：`debug-focus-user`
- 结果：通过

### `/debug/agent/state-insight`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：74bf69f4-6aee-4251-b65b-75cc5b4cd6fb
- 结果：通过

### `/debug/agent/interruption-recovery`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：f6edca26-55d0-4ad9-8020-f8a605451f38
- 结果：通过

### `/debug/agent/reflection`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：9b9c7263-7de9-484f-8715-1a6d0a69de5f
- 结果：通过

### `/debug/agent/task-management`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：0baa85a9-bd83-4621-bbfb-60d9afbe598b
- 结果：通过

### `/debug/agent/progress-feedback`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：8c1e3c25-b755-4ec6-a020-6095cbdeaf5c
- 结果：通过

### `/debug/agent/automation`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：d20869a8-e51f-44ac-9213-1569b8181010
- 结果：通过

## 4. Web / Agent Lab 检查

- Dashboard 可打开：未验证（脚本未启动浏览器）
- GoalFlow 可打开：未验证（脚本未启动浏览器）
- State Trends 可打开：未验证（脚本未启动浏览器）
- Recovery 可打开：未验证（脚本未启动浏览器）
- Reflections 可打开：未验证（脚本未启动浏览器）
- Inbox 可打开：未验证（脚本未启动浏览器）
- Agent Lab 可打开：未验证（脚本未启动浏览器）

### Agent Lab 重点

- adapter 状态卡显示正常：可由 API 推断为是
- `Probe chief-agent` 显示路径：`cluster`
- `state-insight-agent` debug 显示路径：`cluster`
- `interruption-recovery-agent` debug 显示路径：`cluster`
- `reflection-coach-agent` debug 显示路径：`cluster`
- `task-management-agent` debug 显示路径：`cluster`
- `progress-feedback-agent` debug 显示路径：`cluster`
- `automation-agent` debug 显示路径：`cluster`
- Trace Inspector 能查到事件：未验证（脚本未打开浏览器）

## 5. 页面人工验收

### 5.1 Dashboard

- 顶部 `Workspace shortcuts` 是否显示完整：是 / 否
- `Latest state` 卡是否可读：是 / 否
- `Behavior conclusion` 卡是否可读：是 / 否
- `Open Recovery page` 跳转是否正常：是 / 否

### 5.2 GoalFlow

- Goal 列表是否正常显示：是 / 否
- Task 列表是否正常显示：是 / 否
- `suggested focus` 标签是否出现：是 / 否
- Focus session 区域是否正常：是 / 否

### 5.3 State / Recovery / Reflections / Inbox

- `State Trends` 页面当前评估 + 趋势列表是否可读：是 / 否
- `Recovery` 页面恢复计划与中断列表是否可读：是 / 否
- `Reflections` 页面周报/月报是否可读：是 / 否
- `Inbox` 页面消息队列与渠道统计是否可读：是 / 否

### 5.4 Agent Lab 人工观察

- `Resolved agent configs` 卡片无长文本溢出：是 / 否
- `OpenClaw adapter` 卡片显示的 `strategy / route` 是否符合预期：是 / 否
- `Prefix / Base URL / endpoint` 文本无卡片溢出：是 / 否
- 长列表滚动和 code block 是否可读：是 / 否

## 6. Trace / 排障留痕

- 关键 traceId：
  - health / request trace：
  - chief probe trace：
  - scenario seed trace：
  - state-insight debug trace：
  - interruption-recovery debug trace：
  - reflection debug trace：
  - task-management debug trace：
  - progress-feedback debug trace：
  - automation debug trace：
- 关键截图或日志文件位置：
- `debug/openclaw/adapter` 返回快照是否已保存：是 / 否

## 7. 最终判定

- 直连 cluster 合同：通过 / 部分通过 / 不通过
- Gateway cluster-preferred：通过 / 部分通过 / 不通过
- Web 控制台：通过 / 部分通过 / 不通过
- 综合判定：通过 / 部分通过 / 不通过

## 8. 问题与后续动作

- 发现的问题：
  1.
  2.
  3.

- 建议的下一步：
  1.
  2.
  3.

---

可和以下文档配合使用：

- `docs/openclaw-cluster-smoke-checklist.md`
- `docs/web-console-smoke-checklist.md`
- `docs/development-handoff-2026-03-07.md`

## Script Snapshot

- Captured at: 2026-04-21T02:15:11Z
- API Base URL: `http://127.0.0.1:3001`
- Cluster Base URL: `http://127.0.0.1:8787`
- Direct endpoint hit: `/v1/tasks/execute`
- Direct endpoint status: `200`
- `/health` status: `200`
- `/debug/openclaw/adapter` status: `200`
- `/debug/model-probe/chief-agent` status: `200`
- `POST /debug/scenarios/focus-recovery-loop/seed` status: `200`
- `/debug/agent/state-insight` status: `200`
- `/debug/agent/interruption-recovery` status: `200`
- `/debug/agent/reflection` status: `200`
- `/debug/agent/task-management` status: `200`
- `/debug/agent/progress-feedback` status: `200`
- `/debug/agent/automation` status: `200`

### Direct Cluster Response

```json
{"success":true,"taskId":"smoke-task-001","trace":{"traceId":"smoke-trace-001","source":"mindanchor-gateway","operation":"probe","agentName":"chief-agent","userId":"demo-user"},"metadata":{"runtime":"openclaw-local-cluster","runtimeVersion":"structured-local-runtime-phase1","worker":"chief-agent-worker","agent":"chief-agent","modelTarget":"chief-agent","mode":"probe","responseMode":"parsed","skillCount":1,"skills":["state-score-skill"],"supportedWorkflows":["state_assessment","task_management","progress_summary","recovery_plan","reflection_report","notification_dispatch"],"workflow":null,"frontAgent":null,"runtimeAgentId":null,"memoryScopes":[],"memoryFetch":{"attempted":false,"loaded":false,"error":null},"memoryContext":null,"authorityApplied":false,"authorityApply":{"attempted":false,"applied":false,"error":null,"endpoint":null,"status":null,"readModelRefresh":null}},"parsed":{"probe":"ok"}}
```

### Gateway Health Response

```json
{"ok":true,"mode":"openai-compatible","topology":"gateway->openclaw-cluster","openClawBaseUrl":"http://127.0.0.1:8787"}
```

### Adapter Response

```json
{"gatewayMode":"openai-compatible","clusterEnabled":true,"executionStrategy":"cluster-preferred","openClawBaseUrl":"http://127.0.0.1:8787","clusterEndpoints":["/v1/tasks/execute","/tasks/execute","/api/tasks/execute"],"lastDecision":{"traceId":"d20869a8-e51f-44ac-9213-1569b8181010","parentTraceId":"f1e16c64-7e9a-4144-923e-c6a97d7097a0","createdAt":"2026-04-21T02:15:11.056Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"lastFallback":null,"failureCategoryCounts":{},"recentTimeline":[{"traceId":"d20869a8-e51f-44ac-9213-1569b8181010","parentTraceId":"f1e16c64-7e9a-4144-923e-c6a97d7097a0","createdAt":"2026-04-21T02:15:11.056Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},{"traceId":"8c1e3c25-b755-4ec6-a020-6095cbdeaf5c","parentTraceId":"926ace84-62ea-4bfd-a669-8c7e01cfc517","createdAt":"2026-04-21T02:15:11.033Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"08d74c58-dcaa-4aae-bc07-565c612b620e\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}]},{"traceId":"0baa85a9-bd83-4621-bbfb-60d9afbe598b","parentTraceId":"1b06f46a-8667-4dde-8df3-47556bc54398","createdAt":"2026-04-21T02:15:11.007Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"08d74c58-dcaa-4aae-bc07-565c612b620e\",\"f8a34027-1bf6-4717-adec-cd0a39027154\",\"b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}]},{"traceId":"9b9c7263-7de9-484f-8715-1a6d0a69de5f","parentTraceId":"b0746079-560f-4de9-9ddc-0569f14f57e2","createdAt":"2026-04-21T02:15:10.982Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-14T02:15:10.978Z\",\"periodEnd\":\"2026-04-21T02:15:10.978Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}]},{"traceId":"f6edca26-55d0-4ad9-8020-f8a605451f38","parentTraceId":"00735de1-7774-4311-8317-e2a29622bfdb","createdAt":"2026-04-21T02:15:10.955Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"08d74c58-dcaa-4aae-bc07-565c612b620e\",\"f8a34027-1bf6-4717-adec-cd0a39027154\",\"b"}]},{"traceId":"74bf69f4-6aee-4251-b65b-75cc5b4cd6fb","parentTraceId":"c3cea41b-d3ae-4fb9-beac-9b20a2d8adda","createdAt":"2026-04-21T02:15:10.931Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-21T02:00:10.927Z\",\"windowEnd\":\"2026-04-21T02:15:10.927Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}]},{"traceId":"78ec3e18-e8fe-4453-bbcc-c111ec0664ed","parentTraceId":"86bffedc-3e12-4a9d-b4af-fc6f77d0d36f","createdAt":"2026-04-21T02:15:10.707Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]},{"traceId":"cd426d4d-47e8-49a5-9bb2-6462f8423e37","parentTraceId":"1ad38232-fde7-4e6b-86ed-b935a4c2e65f","createdAt":"2026-03-07T13:45:08.727Z","target":"progress-feedback-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"ddde06b3-1c82-4cc1-bb59-42af866e217a\",\"summaryHeadline\":\"Local OpenClaw cluste"}]},{"traceId":"1ad38232-fde7-4e6b-86ed-b935a4c2e65f","createdAt":"2026-03-07T13:45:08.722Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"progress_summary\",\"selectedAgent\":\"progress-feedback-agent\",\"reason\":\"Local OpenClaw cluster routed progress_summary to progress-feedback-agent.\",\"executionMode\":\"agent\",\"confidence\":0.9}"}]},{"traceId":"c92d736b-25f9-408d-8f70-8082a799ebb7","parentTraceId":"f7d67b44-372c-409a-9455-cad9a8195d0e","createdAt":"2026-03-07T13:45:08.711Z","target":"progress-feedback-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"ddde06b3-1c82-4cc1-bb59-42af866e217a\",\"summaryHeadline\":\"Local OpenClaw cluste"}]},{"traceId":"f7d67b44-372c-409a-9455-cad9a8195d0e","createdAt":"2026-03-07T13:45:08.706Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"progress_summary\",\"selectedAgent\":\"progress-feedback-agent\",\"reason\":\"Local OpenClaw cluster routed progress_summary to progress-feedback-agent.\",\"executionMode\":\"agent\",\"confidence\":0.9}"}]},{"traceId":"3acc5690-a6a4-4b8d-a592-777b743c19c4","parentTraceId":"d9fe6873-94e2-4c1a-acca-0120c2cdf6ca","createdAt":"2026-03-07T13:36:03.338Z","target":"progress-feedback-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"ddde06b3-1c82-4cc1-bb59-42af866e217a\",\"summaryHeadline\":\"Local OpenClaw cluste"}]},{"traceId":"d9fe6873-94e2-4c1a-acca-0120c2cdf6ca","createdAt":"2026-03-07T13:36:03.334Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"progress_summary\",\"selectedAgent\":\"progress-feedback-agent\",\"reason\":\"Local OpenClaw cluster routed progress_summary to progress-feedback-agent.\",\"executionMode\":\"agent\",\"confidence\":0.9}"}]},{"traceId":"a6cd6f45-03b5-4ccf-a585-602c93d78c09","parentTraceId":"a33a50fc-d304-42c4-837b-95ad3643b3ce","createdAt":"2026-03-07T13:35:47.534Z","target":"progress-feedback-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"ddde06b3-1c82-4cc1-bb59-42af866e217a\",\"summaryHeadline\":\"Local OpenClaw cluste"}]},{"traceId":"a33a50fc-d304-42c4-837b-95ad3643b3ce","createdAt":"2026-03-07T13:35:47.529Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"progress_summary\",\"selectedAgent\":\"progress-feedback-agent\",\"reason\":\"Local OpenClaw cluster routed progress_summary to progress-feedback-agent.\",\"executionMode\":\"agent\",\"confidence\":0.9}"}]},{"traceId":"e33cd401-6eab-4a8f-92a5-d92019915aa7","parentTraceId":"42baa975-86e9-48f4-af69-692f2b5821c1","createdAt":"2026-03-07T13:35:47.521Z","target":"progress-feedback-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"ddde06b3-1c82-4cc1-bb59-42af866e217a\",\"summaryHeadline\":\"Local OpenClaw cluste"}]},{"traceId":"42baa975-86e9-48f4-af69-692f2b5821c1","createdAt":"2026-03-07T13:35:47.512Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"progress_summary\",\"selectedAgent\":\"progress-feedback-agent\",\"reason\":\"Local OpenClaw cluster routed progress_summary to progress-feedback-agent.\",\"executionMode\":\"agent\",\"confidence\":0.9}"}]},{"traceId":"e3600e7b-9c8e-4460-a651-584b2b29dc65","parentTraceId":"5c491e99-472a-40cd-a2e8-02cc71a6198a","createdAt":"2026-03-07T13:34:24.478Z","target":"reflection-coach-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"demo-user\",\"periodType\":\"monthly\",\"periodStart\":\"2026-02-05T13:34:24.477Z\",\"periodEnd\":\"2026-03-07T13:34:24.477Z\",\"highlights\":[\"Captured a full week of execution context for review.\",\"Handled 1 interrupted session.\"],\"blockers\":"}]},{"traceId":"5c491e99-472a-40cd-a2e8-02cc71a6198a","createdAt":"2026-03-07T13:34:24.474Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"reflection_report\",\"selectedAgent\":\"reflection-coach-agent\",\"reason\":\"Local OpenClaw cluster routed reflection_report to reflection-coach-agent.\",\"executionMode\":\"agent\",\"confidence\":0.9}"}]},{"traceId":"48ace7b0-8f76-4de8-82ec-146a97d58add","parentTraceId":"9acc2e6d-63ce-4ba0-bcd1-524c4bf24b28","createdAt":"2026-03-07T13:34:24.469Z","target":"reflection-coach-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"demo-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-02-28T13:34:24.468Z\",\"periodEnd\":\"2026-03-07T13:34:24.468Z\",\"highlights\":[\"Captured a full week of execution context for review.\",\"Handled 1 interrupted session.\"],\"blockers\":["}]}]}
```

### Chief Probe Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"chief-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}],"parsed":{"probe":"ok"},"adapter":{"traceId":"78ec3e18-e8fe-4453-bbcc-c111ec0664ed","parentTraceId":"86bffedc-3e12-4a9d-b4af-fc6f77d0d36f","createdAt":"2026-04-21T02:15:10.710Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]},"runId":"e56e384f-0a12-4710-991e-68a63be2ae47","traceId":"78ec3e18-e8fe-4453-bbcc-c111ec0664ed","parentTraceId":"86bffedc-3e12-4a9d-b4af-fc6f77d0d36f","createdAt":"2026-04-21T02:15:10.710Z"}
```

### Scenario Seed Response

```json
{"scenarioId":"focus-recovery-loop","title":"Focus recovery loop","description":"低专注 + 高压力媒体信号 + 活跃专注会话，用来调试 state / recovery / notification。","userId":"debug-focus-user","goalId":"ea9305ed-3870-4c26-8fd3-c9292a828f68","taskId":"08d74c58-dcaa-4aae-bc07-565c612b620e","sessionId":"423a7a7e-e4f2-40cb-a1ee-25d7efa345ab","recommendedWorkflows":["state_assessment","recovery_plan","notification_dispatch"],"notes":["包含活跃专注会话、一次历史中断与恢复计划。","音频、视频、健康桥三类信号都已写入，适合联调 state / recovery / notification。"],"counts":{"goals":1,"tasks":3,"sessions":2,"assessments":1,"recoveryPlans":1,"reflections":0,"inbox":1},"runId":"077b0bdf-a97c-439f-b69d-03a9e29b31bb","traceId":"5176d3b1-1457-439d-9274-80b08d5acdbd","parentTraceId":"a6a91aa3-f4d7-44bf-bc6f-c758de6c10de","createdAt":"2026-04-21T02:15:10.779Z"}
```

### State Insight Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"state-insight-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-21T02:00:10.927Z\",\"windowEnd\":\"2026-04-21T02:15:10.927Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}],"extractedJson":{"userId":"debug-focus-user","windowStart":"2026-04-21T02:00:10.927Z","windowEnd":"2026-04-21T02:15:10.927Z","focusScore":40,"energyScore":45,"moodScore":49,"summary":"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。","recommendedAction":"先收拢干扰源，回到主任务，只推进一个最小可验证步骤，再决定是否继续扩展。","emotionSummary":"音频侧提示紧张和压力抬升，说明当前更适合减少切换而不是继续并行处理。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示疲劳和视觉稳定度下降，说明持续专注能力正在变弱。","healthSummary":"健康数据显示恢复基础一般，健康数据提示应优先保证节奏稳定而不是强行加码。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"mixed"},"normalizedJson":{"userId":"debug-focus-user","windowStart":"2026-04-21T02:00:10.927Z","windowEnd":"2026-04-21T02:15:10.927Z","focusScore":40,"energyScore":45,"moodScore":49,"summary":"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。","recommendedAction":"先收拢干扰源，回到主任务，只推进一个最小可验证步骤，再决定是否继续扩展。","emotionSummary":"音频侧提示紧张和压力抬升，说明当前更适合减少切换而不是继续并行处理。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示疲劳和视觉稳定度下降，说明持续专注能力正在变弱。","healthSummary":"健康数据显示恢复基础一般，健康数据提示应优先保证节奏稳定而不是强行加码。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"mixed"},"adapter":{"traceId":"74bf69f4-6aee-4251-b65b-75cc5b4cd6fb","parentTraceId":"c3cea41b-d3ae-4fb9-beac-9b20a2d8adda","createdAt":"2026-04-21T02:15:10.933Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-21T02:00:10.927Z\",\"windowEnd\":\"2026-04-21T02:15:10.927Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}]},"runId":"d3bc6ad9-99ca-4011-a948-009ff9adcb3f","traceId":"74bf69f4-6aee-4251-b65b-75cc5b4cd6fb","parentTraceId":"c3cea41b-d3ae-4fb9-beac-9b20a2d8adda","createdAt":"2026-04-21T02:15:10.933Z"}
```

### Recovery Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"interruption-recovery-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"08d74c58-dcaa-4aae-bc07-565c612b620e\",\"f8a34027-1bf6-4717-adec-cd0a39027154\",\"b"}],"extractedJson":{"reason":"attention_shift_after_interruption","nextStep":"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。","suggestedMinutes":25,"reprioritizedTaskIds":["08d74c58-dcaa-4aae-bc07-565c612b620e","f8a34027-1bf6-4717-adec-cd0a39027154","b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f"]},"normalizedJson":{"reason":"attention_shift_after_interruption","nextStep":"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。","suggestedMinutes":25,"reprioritizedTaskIds":["08d74c58-dcaa-4aae-bc07-565c612b620e","f8a34027-1bf6-4717-adec-cd0a39027154","b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f"]},"adapter":{"traceId":"f6edca26-55d0-4ad9-8020-f8a605451f38","parentTraceId":"00735de1-7774-4311-8317-e2a29622bfdb","createdAt":"2026-04-21T02:15:10.958Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"08d74c58-dcaa-4aae-bc07-565c612b620e\",\"f8a34027-1bf6-4717-adec-cd0a39027154\",\"b"}]},"runId":"6588a646-3bfb-4855-a2b6-f7ae15f32569","traceId":"f6edca26-55d0-4ad9-8020-f8a605451f38","parentTraceId":"00735de1-7774-4311-8317-e2a29622bfdb","createdAt":"2026-04-21T02:15:10.958Z"}
```

### Reflection Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"reflection-coach-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-14T02:15:10.978Z\",\"periodEnd\":\"2026-04-21T02:15:10.978Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}],"extractedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-04-14T02:15:10.978Z","periodEnd":"2026-04-21T02:15:10.978Z","highlights":["本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。"],"blockers":["本周的主要阻力来自中断后回到主线的成本偏高。"],"trends":["本周专注均值仍有波动，但在恢复方案介入后开始重新聚焦。"],"nextSuggestions":["中断后先执行 10 到 25 分钟的最小恢复块，而不是立即重开多个任务。"]},"normalizedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-04-14T02:15:10.978Z","periodEnd":"2026-04-21T02:15:10.978Z","highlights":["本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。"],"blockers":["本周的主要阻力来自中断后回到主线的成本偏高。"],"trends":["本周专注均值仍有波动，但在恢复方案介入后开始重新聚焦。"],"nextSuggestions":["中断后先执行 10 到 25 分钟的最小恢复块，而不是立即重开多个任务。"]},"adapter":{"traceId":"9b9c7263-7de9-484f-8715-1a6d0a69de5f","parentTraceId":"b0746079-560f-4de9-9ddc-0569f14f57e2","createdAt":"2026-04-21T02:15:10.984Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-14T02:15:10.978Z\",\"periodEnd\":\"2026-04-21T02:15:10.978Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}]},"runId":"a97c64c7-5271-413e-a850-469d31a01285","traceId":"9b9c7263-7de9-484f-8715-1a6d0a69de5f","parentTraceId":"b0746079-560f-4de9-9ddc-0569f14f57e2","createdAt":"2026-04-21T02:15:10.984Z"}
```

### Task Management Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"task-management-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"08d74c58-dcaa-4aae-bc07-565c612b620e\",\"f8a34027-1bf6-4717-adec-cd0a39027154\",\"b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}],"extractedJson":{"orderedTaskIds":["08d74c58-dcaa-4aae-bc07-565c612b620e","f8a34027-1bf6-4717-adec-cd0a39027154","b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f"],"summary":"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。","suggestedTasks":[]},"normalizedJson":{"orderedTaskIds":["08d74c58-dcaa-4aae-bc07-565c612b620e","f8a34027-1bf6-4717-adec-cd0a39027154","b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f"],"summary":"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。","suggestedTasks":[]},"adapter":{"traceId":"0baa85a9-bd83-4621-bbfb-60d9afbe598b","parentTraceId":"1b06f46a-8667-4dde-8df3-47556bc54398","createdAt":"2026-04-21T02:15:11.010Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"08d74c58-dcaa-4aae-bc07-565c612b620e\",\"f8a34027-1bf6-4717-adec-cd0a39027154\",\"b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}]},"runId":"f7f01c90-fd87-4c86-b430-090bc6743d77","traceId":"0baa85a9-bd83-4621-bbfb-60d9afbe598b","parentTraceId":"1b06f46a-8667-4dde-8df3-47556bc54398","createdAt":"2026-04-21T02:15:11.010Z"}
```

### Progress Feedback Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"progress-feedback-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"08d74c58-dcaa-4aae-bc07-565c612b620e\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}],"extractedJson":{"goalCount":1,"taskCount":3,"completedTaskCount":0,"inProgressTaskCount":1,"blockedTaskCount":0,"completionRate":0,"openInterventions":1,"suggestedFocusTaskId":"08d74c58-dcaa-4aae-bc07-565c612b620e","summaryHeadline":"当前已有恢复方案，建议先按恢复方案收拢主线，再继续推进最重要任务。","activeSession":{"id":"423a7a7e-e4f2-40cb-a1ee-25d7efa345ab","userId":"debug-focus-user","goalId":"ea9305ed-3870-4c26-8fd3-c9292a828f68","taskId":"08d74c58-dcaa-4aae-bc07-565c612b620e","status":"active","startedAt":"2026-04-21T01:47:10.749Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"ea141f40-55a1-4ea2-85ba-3e836a41566e","userId":"debug-focus-user","windowStart":"2026-04-21T01:50:10.751Z","windowEnd":"2026-04-21T02:11:10.751Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示眨眼频率偏高，视线稳定度下降。","healthSummary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-04-21T02:13:10.766Z"},"latestRecoveryPlan":{"id":"33b58f2d-09a9-4517-9467-b89f02357e47","userId":"debug-focus-user","sessionId":"96fbecff-9413-46f5-9233-5e5570e21555","taskId":"f8a34027-1bf6-4717-adec-cd0a39027154","reason":"energy_drop","nextStep":"Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["08d74c58-dcaa-4aae-bc07-565c612b620e","f8a34027-1bf6-4717-adec-cd0a39027154","b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f"],"createdAt":"2026-04-21T01:15:10.771Z"},"latestBehaviorConclusion":{"id":"c5898539-c54f-4658-a9dc-003ca488ec9d","createdAt":"2026-04-21T02:15:10.774Z","userId":"debug-focus-user","assessmentId":"ea141f40-55a1-4ea2-85ba-3e836a41566e","sessionId":"423a7a7e-e4f2-40cb-a1ee-25d7efa345ab","taskId":"08d74c58-dcaa-4aae-bc07-565c612b620e","riskLevel":"high","summary":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"e05ee47c-acdc-47f6-92f6-58fc5cf4e14d","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"423a7a7e-e4f2-40cb-a1ee-25d7efa345ab","windowStart":"2026-04-21T02:02:10.756Z","windowEnd":"2026-04-21T02:08:10.756Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"视频侧显示眨眼频率偏高，视线稳定度下降。","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-04-21T02:15:10.756Z"},"latestHealthSnapshot":{"id":"c22e68ba-24f8-48a4-aad7-29ddad1fd228","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-04-20T14:15:10.758Z","windowEnd":"2026-04-20T22:15:10.758Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","createdAt":"2026-04-21T02:15:10.758Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"6bfa3e6e-5b09-4d67-8fbe-7f85d115c0ec","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"调试 Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-04-21T00:15:10.734Z","lastSeenAt":"2026-04-21T02:15:10.734Z","createdAt":"2026-04-21T02:15:10.734Z","updatedAt":"2026-04-21T02:15:10.734Z"},"latestSession":null,"latestEmotionAssessment":{"id":"c3adfdb5-69c3-4d06-b53b-09aa5dacfa5b","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"423a7a7e-e4f2-40cb-a1ee-25d7efa345ab","chunkSequence":2,"windowStart":"2026-04-21T02:04:10.753Z","windowEnd":"2026-04-21T02:09:10.753Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-04-21T02:15:10.753Z"},"latestCallEvent":null},"edgeDevices":[{"id":"a6053d44-0e8d-42bd-8148-6b27f843023b","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"调试专注手机端","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-21T02:15:10.732Z","createdAt":"2026-04-21T02:15:10.732Z","updatedAt":"2026-04-21T02:15:10.732Z"},{"id":"1508e882-2fe8-47fb-b003-b8f9048c5134","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"调试专注桌面端","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-21T02:15:10.730Z","createdAt":"2026-04-21T02:15:10.730Z","updatedAt":"2026-04-21T02:15:10.730Z"}],"inbox":[{"id":"8f9de4ce-9747-45d2-ac35-ce2695f17466","createdAt":"2026-04-21T02:15:10.776Z","status":"pending","userId":"debug-focus-user","title":"建议立即恢复主线","message":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"ea9305ed-3870-4c26-8fd3-c9292a828f68","userId":"debug-focus-user","title":"在深度工作中找回注意力","description":"用于状态、恢复和通知 agent 联调的示例场景。","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-04-21T02:15:10.736Z","updatedAt":"2026-04-21T02:15:10.744Z"}],"tasks":[{"id":"08d74c58-dcaa-4aae-bc07-565c612b620e","userId":"debug-focus-user","goalId":"ea9305ed-3870-4c26-8fd3-c9292a828f68","title":"验证 chief-agent 在压力场景下的路由","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-04-21T02:15:10.738Z","updatedAt":"2026-04-21T02:15:10.744Z"},{"id":"f8a34027-1bf6-4717-adec-cd0a39027154","userId":"debug-focus-user","goalId":"ea9305ed-3870-4c26-8fd3-c9292a828f68","title":"调整收件箱提醒文案","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-04-21T02:15:10.740Z","updatedAt":"2026-04-21T02:15:10.740Z"},{"id":"b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f","userId":"debug-focus-user","goalId":"ea9305ed-3870-4c26-8fd3-c9292a828f68","title":"检查复盘亮点摘要","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-04-21T02:15:10.742Z","updatedAt":"2026-04-21T02:15:10.742Z"}]},"normalizedJson":{"goalCount":1,"taskCount":3,"completedTaskCount":0,"inProgressTaskCount":1,"blockedTaskCount":0,"completionRate":0,"openInterventions":1,"suggestedFocusTaskId":"08d74c58-dcaa-4aae-bc07-565c612b620e","summaryHeadline":"当前已有恢复方案，建议先按恢复方案收拢主线，再继续推进最重要任务。","coachFrontAgent":{"currentFrontAgent":"director-agent","routingMode":"auto","manualOverride":false,"consultedAgent":null,"handoffReason":null,"overrideSourceAgent":null,"visibleSummary":"Picard is currently coordinating the team."},"activeSession":{"id":"423a7a7e-e4f2-40cb-a1ee-25d7efa345ab","userId":"debug-focus-user","goalId":"ea9305ed-3870-4c26-8fd3-c9292a828f68","taskId":"08d74c58-dcaa-4aae-bc07-565c612b620e","status":"active","startedAt":"2026-04-21T01:47:10.749Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"ea141f40-55a1-4ea2-85ba-3e836a41566e","userId":"debug-focus-user","windowStart":"2026-04-21T01:50:10.751Z","windowEnd":"2026-04-21T02:11:10.751Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示眨眼频率偏高，视线稳定度下降。","healthSummary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-04-21T02:13:10.766Z"},"latestRecoveryPlan":{"id":"33b58f2d-09a9-4517-9467-b89f02357e47","userId":"debug-focus-user","sessionId":"96fbecff-9413-46f5-9233-5e5570e21555","taskId":"f8a34027-1bf6-4717-adec-cd0a39027154","reason":"energy_drop","nextStep":"Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["08d74c58-dcaa-4aae-bc07-565c612b620e","f8a34027-1bf6-4717-adec-cd0a39027154","b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f"],"createdAt":"2026-04-21T01:15:10.771Z"},"latestBehaviorConclusion":{"id":"c5898539-c54f-4658-a9dc-003ca488ec9d","createdAt":"2026-04-21T02:15:10.774Z","userId":"debug-focus-user","assessmentId":"ea141f40-55a1-4ea2-85ba-3e836a41566e","sessionId":"423a7a7e-e4f2-40cb-a1ee-25d7efa345ab","taskId":"08d74c58-dcaa-4aae-bc07-565c612b620e","riskLevel":"high","summary":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"e05ee47c-acdc-47f6-92f6-58fc5cf4e14d","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"423a7a7e-e4f2-40cb-a1ee-25d7efa345ab","windowStart":"2026-04-21T02:02:10.756Z","windowEnd":"2026-04-21T02:08:10.756Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"视频侧显示眨眼频率偏高，视线稳定度下降。","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-04-21T02:15:10.756Z"},"latestHealthSnapshot":{"id":"c22e68ba-24f8-48a4-aad7-29ddad1fd228","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-04-20T14:15:10.758Z","windowEnd":"2026-04-20T22:15:10.758Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","createdAt":"2026-04-21T02:15:10.758Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"6bfa3e6e-5b09-4d67-8fbe-7f85d115c0ec","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"调试 Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-04-21T00:15:10.734Z","lastSeenAt":"2026-04-21T02:15:10.734Z","createdAt":"2026-04-21T02:15:10.734Z","updatedAt":"2026-04-21T02:15:10.734Z"},"latestSession":null,"latestEmotionAssessment":{"id":"c3adfdb5-69c3-4d06-b53b-09aa5dacfa5b","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"423a7a7e-e4f2-40cb-a1ee-25d7efa345ab","chunkSequence":2,"windowStart":"2026-04-21T02:04:10.753Z","windowEnd":"2026-04-21T02:09:10.753Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-04-21T02:15:10.753Z"},"latestCallEvent":null},"edgeDevices":[{"id":"a6053d44-0e8d-42bd-8148-6b27f843023b","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"调试专注手机端","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-21T02:15:10.732Z","createdAt":"2026-04-21T02:15:10.732Z","updatedAt":"2026-04-21T02:15:10.732Z"},{"id":"1508e882-2fe8-47fb-b003-b8f9048c5134","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"调试专注桌面端","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-21T02:15:10.730Z","createdAt":"2026-04-21T02:15:10.730Z","updatedAt":"2026-04-21T02:15:10.730Z"}],"inbox":[{"id":"8f9de4ce-9747-45d2-ac35-ce2695f17466","createdAt":"2026-04-21T02:15:10.776Z","status":"pending","userId":"debug-focus-user","title":"建议立即恢复主线","message":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"ea9305ed-3870-4c26-8fd3-c9292a828f68","userId":"debug-focus-user","title":"在深度工作中找回注意力","description":"用于状态、恢复和通知 agent 联调的示例场景。","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-04-21T02:15:10.736Z","updatedAt":"2026-04-21T02:15:10.744Z"}],"tasks":[{"id":"08d74c58-dcaa-4aae-bc07-565c612b620e","userId":"debug-focus-user","goalId":"ea9305ed-3870-4c26-8fd3-c9292a828f68","title":"验证 chief-agent 在压力场景下的路由","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-04-21T02:15:10.738Z","updatedAt":"2026-04-21T02:15:10.744Z"},{"id":"f8a34027-1bf6-4717-adec-cd0a39027154","userId":"debug-focus-user","goalId":"ea9305ed-3870-4c26-8fd3-c9292a828f68","title":"调整收件箱提醒文案","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-04-21T02:15:10.740Z","updatedAt":"2026-04-21T02:15:10.740Z"},{"id":"b64624fa-fbf8-45eb-bfa0-fe5e0be7cd2f","userId":"debug-focus-user","goalId":"ea9305ed-3870-4c26-8fd3-c9292a828f68","title":"检查复盘亮点摘要","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-04-21T02:15:10.742Z","updatedAt":"2026-04-21T02:15:10.742Z"}]},"adapter":{"traceId":"8c1e3c25-b755-4ec6-a020-6095cbdeaf5c","parentTraceId":"926ace84-62ea-4bfd-a669-8c7e01cfc517","createdAt":"2026-04-21T02:15:11.035Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"08d74c58-dcaa-4aae-bc07-565c612b620e\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}]},"runId":"2e96bcb4-574e-40b8-aff4-a053e9957359","traceId":"8c1e3c25-b755-4ec6-a020-6095cbdeaf5c","parentTraceId":"926ace84-62ea-4bfd-a669-8c7e01cfc517","createdAt":"2026-04-21T02:15:11.035Z"}
```

### Automation Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"automation-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}],"extractedJson":{"title":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","message":"Pause for a short reset before resuming the next small task step.","channel":"mobile_push","deliver":true},"normalizedJson":{"title":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","message":"Pause for a short reset before resuming the next small task step.","channel":"mobile_push","deliver":true},"adapter":{"traceId":"d20869a8-e51f-44ac-9213-1569b8181010","parentTraceId":"f1e16c64-7e9a-4144-923e-c6a97d7097a0","createdAt":"2026-04-21T02:15:11.058Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"runId":"bbb38c31-e5d9-43e6-b2bb-033d00e3ccf6","traceId":"d20869a8-e51f-44ac-9213-1569b8181010","parentTraceId":"f1e16c64-7e9a-4144-923e-c6a97d7097a0","createdAt":"2026-04-21T02:15:11.058Z"}
```
