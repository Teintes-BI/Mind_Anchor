# OpenClaw Production Runtime Smoke Report（2026-03-08）

用于记录一次**面向 M5 基线的真实 OpenClaw production runtime smoke** 执行结果。

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

- 日期：2026-03-08
- 执行人：Codex
- 机器：当前本地 OpenClaw 计划部署机
- Gateway 提交/版本：当前工作区源码
- Cluster 提交/版本：`openclaw/production-runtime-server.mjs` + `openclaw/real-runtime/*`
- 执行环境：
  - `MINDANCHOR_API_URL`：`http://127.0.0.1:3024`
  - `MINDANCHOR_OPENCLAW_BASE_URL`：`http://192.168.0.102:8800`
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
- `openClawBaseUrl`：`http://192.168.0.102:8800`
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
- `traceId`：`d8c8b80b-02e4-4b95-9a6b-cd3f2169d40b`
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
- `traceId`：39307220-42b2-4d02-a88f-a6b3fadf294c
- 结果：通过

### `/debug/agent/interruption-recovery`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：c895c466-950d-4bdd-b0aa-1cfdc41ad19c
- 结果：通过

### `/debug/agent/reflection`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：8a5d65ad-c33c-4fd8-ac04-ab74b75b13c8
- 结果：通过

### `/debug/agent/task-management`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：2093dcce-94d5-4256-94b7-fe18b5aec4f5
- 结果：通过

### `/debug/agent/progress-feedback`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：a65098ee-5444-43e2-8017-14208ac2f0da
- 结果：通过

### `/debug/agent/automation`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：dba1da6a-8ee2-4fd2-a13c-2538765ad005
- 结果：通过

## 4. Web / Agent Lab 检查

- Dashboard 可打开：部分验证（当前 smoke 未直接启动浏览器；同日 API 与人工记录见 `docs/openclaw-production-runtime-manual-verification-2026-03-08.md`）
- GoalFlow 可打开：部分验证（当前 smoke 未直接启动浏览器；同日 API 与人工记录见 `docs/openclaw-production-runtime-manual-verification-2026-03-08.md`）
- State Trends 可打开：是（同日同机人工验收）
- Recovery 可打开：是（同日同机人工验收）
- Reflections 可打开：是（同日同机人工验收）
- Inbox 可打开：是（同日同机人工验收）
- Agent Lab 可打开：是（同日同机人工验收）

### Agent Lab 重点

- adapter 状态卡显示正常：是（同日同机人工验收）
- `Probe chief-agent` 显示路径：`cluster`
- `state-insight-agent` debug 显示路径：`cluster`
- `interruption-recovery-agent` debug 显示路径：`cluster`
- `reflection-coach-agent` debug 显示路径：`cluster`
- `task-management-agent` debug 显示路径：`cluster`
- `progress-feedback-agent` debug 显示路径：`cluster`
- `automation-agent` debug 显示路径：`cluster`
- Trace Inspector 能查到事件：是（同日同机人工验收）

## 5. 页面人工验收

### 5.1 Dashboard

- 顶部 `Workspace shortcuts` 是否显示完整：部分验证（同日浏览器已有正向观察，建议补截图）
- `Latest state` 卡是否可读：部分验证（当前 API 已返回真实聚合内容）
- `Behavior conclusion` 卡是否可读：部分验证（当前 API 已返回真实聚合内容）
- `Open Recovery page` 跳转是否正常：部分验证

### 5.2 GoalFlow

- Goal 列表是否正常显示：部分验证（当前 API 已返回真实 goals）
- Task 列表是否正常显示：部分验证（当前 API 已返回真实 tasks）
- `suggested focus` 标签是否出现：部分验证（当前 API 已返回真实字段）
- Focus session 区域是否正常：部分验证（当前 API 已返回真实字段）

### 5.3 State / Recovery / Reflections / Inbox

- `State Trends` 页面当前评估 + 趋势列表是否可读：是
- `Recovery` 页面恢复计划与中断列表是否可读：是
- `Reflections` 页面周报/月报是否可读：是
- `Inbox` 页面消息队列与渠道统计是否可读：是

### 5.4 Agent Lab 人工观察

- `Resolved agent configs` 卡片无长文本溢出：是
- `OpenClaw adapter` 卡片显示的 `strategy / route` 是否符合预期：是
- `Prefix / Base URL / endpoint` 文本无卡片溢出：是
- 长列表滚动和 code block 是否可读：是

## 6. Trace / 排障留痕

- 关键 traceId：
  - direct cluster trace：`0ca01aca-534a-4397-a6cb-7ba519481e2d`
  - chief probe trace：`d8c8b80b-02e4-4b95-9a6b-cd3f2169d40b`
  - state-insight debug trace：`39307220-42b2-4d02-a88f-a6b3fadf294c`
  - interruption-recovery debug trace：`c895c466-950d-4bdd-b0aa-1cfdc41ad19c`
  - reflection debug trace：`8a5d65ad-c33c-4fd8-ac04-ab74b75b13c8`
  - task-management debug trace：`2093dcce-94d5-4256-94b7-fe18b5aec4f5`
  - progress-feedback debug trace：`a65098ee-5444-43e2-8017-14208ac2f0da`
  - automation debug trace：`dba1da6a-8ee2-4fd2-a13c-2538765ad005`
- 关键截图或日志文件位置：
  - runtime log：`.logs/openclaw-real-lan.log`
  - runtime env snapshot：`.logs/openclaw-real-lan.env`
  - manual verification：`docs/openclaw-production-runtime-manual-verification-2026-03-08.md`
- `debug/openclaw/adapter` 返回快照是否已保存：是

## 7. 最终判定

- 直连 cluster 合同：通过
- Gateway cluster-preferred：通过
- Web 控制台：部分通过
- 综合判定：部分通过（已达到 `M5` 基线 smoke 可运行态，但尚未达到 `M5` 完成态）

## 8. 问题与后续动作

- 发现的问题：
  1. `Dashboard / GoalFlow` 当前虽然已有 API 级真实数据证据，但仍缺一轮更严格的浏览器截图化留档。
  2. 当前 runtime 已完成结构化拆分，但底层执行仍依赖本机 OpenClaw CLI，本质上仍是单用户单节点形态。
  3. 当前还没有完成跨机器 / 新机器恢复 smoke，因此不能把 `M5` 标记为完成。

- 建议的下一步：
  1. 继续收口 runtime 的并发 / session 管理，并观察是否仍会高频触发 `provider-fallback`。
  2. 在另一台机器或新环境按 `docs/openclaw-production-runtime-deployment.md` 跑一次完整恢复与 smoke。
  3. 补一轮 `Dashboard / GoalFlow` 的稳定截图或录屏，并与 `spec / handoff / checklist` 一起收口。

---

可和以下文档配合使用：

- `docs/openclaw-cluster-smoke-checklist.md`
- `docs/web-console-smoke-checklist.md`
- `docs/development-handoff-2026-03-07.md`
- `docs/openclaw-production-runtime-manual-verification-2026-03-08.md`

## Script Snapshot

- Captured at: 2026-03-07T19:54:53Z
- API Base URL: `http://127.0.0.1:3024`
- Cluster Base URL: `http://192.168.0.102:8800`
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
{"success":true,"taskId":"smoke-task-001","trace":{"traceId":"0ca01aca-534a-4397-a6cb-7ba519481e2d","parentTraceId":"smoke-trace-001"},"parsed":{"probe":"ok"},"outputText":"{\"probe\":\"ok\"}","metadata":{"runtime":"openclaw-real-cluster","runtimeVersion":"m5-structured-real-runtime-phase1","worker":"chief-agent-worker","agent":"chief-agent","modelTarget":"chief-agent","promptFile":"./chief-agent.md","skills":["state-ingest-skill","state-score-skill","goalflow-plan-skill","task-reprioritize-skill","progress-summary-skill","interruption-recovery-skill","reflection-report-skill","notification-skill"],"skillCount":8,"mode":"probe","profile":"dev","provider":"codex","model":"gpt-5.4","execution":"serialized-per-agent","attemptCount":1,"messageLength":49,"sessionId":"0ca01aca-534a-4397-a6cb-7ba519481e2d"}}
```

### Gateway Health Response

```json
{"ok":true,"mode":"openai-compatible","topology":"gateway->openclaw-cluster","openClawBaseUrl":"http://192.168.0.102:8800"}
```

### Adapter Response

```json
{"gatewayMode":"openai-compatible","clusterEnabled":true,"executionStrategy":"cluster-preferred","openClawBaseUrl":"http://192.168.0.102:8800","clusterEndpoints":["/v1/tasks/execute","/tasks/execute","/api/tasks/execute"],"lastDecision":{"traceId":"dba1da6a-8ee2-4fd2-a13c-2538765ad005","parentTraceId":"fa85ebbf-1009-489a-9980-34bba6f26f17","createdAt":"2026-03-07T19:54:53.525Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"高风险状态，立即暂停\",\"message\":\"先暂停，做一次短暂重置，再继续下一个最小任务步骤。\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"lastFallback":null,"recentTimeline":[{"traceId":"dba1da6a-8ee2-4fd2-a13c-2538765ad005","parentTraceId":"fa85ebbf-1009-489a-9980-34bba6f26f17","createdAt":"2026-03-07T19:54:53.525Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"高风险状态，立即暂停\",\"message\":\"先暂停，做一次短暂重置，再继续下一个最小任务步骤。\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},{"traceId":"a65098ee-5444-43e2-8017-14208ac2f0da","parentTraceId":"feb9165e-ffed-4655-85f9-17ef61973e17","createdAt":"2026-03-07T19:54:40.410Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"summaryHeadline\":\"Focus on the next hig"}]},{"traceId":"fd5d2c49-8bef-4880-973d-8a31af3a80da","parentTraceId":"384aa698-03cb-4810-a69d-a88c3d315cd4","createdAt":"2026-03-07T19:53:45.740Z","target":"progress-feedback-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":2,\"suggestedFocusTaskId\":\"2691ec4f-9954-416d-83aa-3e5e2dd0dc06\",\"summaryHeadline\":\"Focus on the next hig"}]},{"traceId":"1cc9b598-30f2-4616-9bcd-b4b269bcf4e4","parentTraceId":"5c580c61-20a1-4d23-ab7f-557d12d4a90d","createdAt":"2026-03-07T19:52:47.457Z","target":"progress-feedback-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":2,\"suggestedFocusTaskId\":\"2691ec4f-9954-416d-83aa-3e5e2dd0dc06\",\"summaryHeadline\":\"Focus on the next hig"}]},{"traceId":"49b991c3-3654-4ff5-b262-4c0c5814171e","parentTraceId":"68986b41-b2b2-41bc-917f-839dda06c8ef","createdAt":"2026-03-07T19:51:49.147Z","target":"progress-feedback-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":2,\"suggestedFocusTaskId\":\"2691ec4f-9954-416d-83aa-3e5e2dd0dc06\",\"summaryHeadline\":\"Focus on the next hig"}]},{"traceId":"2093dcce-94d5-4256-94b7-fe18b5aec4f5","parentTraceId":"3b5f60c7-449f-4bee-a8a3-421a46dcf2ac","createdAt":"2026-03-07T19:51:44.445Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"8690b47c-618e-4210-b727-307f62bb443d\",\"5a422b6c-bbda-427b-9ce2-0c5f7a85dc98\"],\"summary\":\"当前状态显示上下文切换频繁、精力偏低且疲劳明显，最优顺序是先短暂重置后继续推进已经在进行中的高优先级任务，以降低切换到新任务的成本并更容易回到主线。随后处理范围较小、负担适中的提醒文案"}]},{"traceId":"8a5d65ad-c33c-4fd8-ac04-ab74b75b13c8","parentTraceId":"ff56a007-5593-43b2-bf03-d5600447a769","createdAt":"2026-03-07T19:51:33.592Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-03-07T00:00:00.000Z\",\"periodEnd\":\"2026-03-07T19:50:21.107Z\",\"highlights\":[\"本周已围绕“在深度工作中找回注意力”建立活跃目标，并持续推进高优先级任务“验证 chief-agent 在压力场景下的路由”。\",\"当前仍有一段进行中的专注会话，说明用户没有完全脱离主线，"}]},{"traceId":"384aa698-03cb-4810-a69d-a88c3d315cd4","createdAt":"2026-03-07T19:51:08.049Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"progress_summary\",\"selectedAgent\":\"progress-feedback-agent\",\"reason\":\"The workflow is progress_summary and the structured context includes progress-related signals across goals, tasks, open interventions, the latest assessment,"}]},{"traceId":"c895c466-950d-4bdd-b0aa-1cfdc41ad19c","parentTraceId":"0aa0fa32-91ca-4256-9a43-1a29d825c553","createdAt":"2026-03-07T19:51:04.463Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"当前状态显示上下文切换频繁、精力偏低且疲劳明显，继续在多个任务之间来回切换只会进一步放大阻力。最合理的是先短暂重置，再把注意力收回到已在进行中的高优先级任务，只推进一个最小可完成的验证步骤。\",\"nextStep\":\"先暂停几分钟做一次短重置，然后开启一个25分钟专注块，只处理“验证 chief-agent 在压力场景下的路由”的一个最小切片：选定1个最关键压力场景，完成1次路由验证并记录结果；这一轮不要切换去调整收件箱提醒文案或检查复盘亮点摘要。\",\""}]},{"traceId":"5c580c61-20a1-4d23-ab7f-557d12d4a90d","createdAt":"2026-03-07T19:50:56.935Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"progress_summary\",\"selectedAgent\":\"progress-feedback-agent\",\"reason\":\"The workflow is progress_summary and the structured context includes progress-related signals across goals, tasks, open interventions, the latest assessment,"}]},{"traceId":"68986b41-b2b2-41bc-917f-839dda06c8ef","createdAt":"2026-03-07T19:50:40.515Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"progress_summary\",\"selectedAgent\":\"progress-feedback-agent\",\"reason\":\"The workflow is progress_summary and the structured context includes progress-related signals across goals, tasks, open interventions, the latest assessment,"}]},{"traceId":"39307220-42b2-4d02-a88f-a6b3fadf294c","parentTraceId":"a52079cd-cef1-49e0-b7fe-06c89bd63884","createdAt":"2026-03-07T19:50:37.930Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-03-07T19:39:21.084Z\",\"windowEnd\":\"2026-03-07T19:50:21.101Z\",\"focusScore\":33,\"energyScore\":27,\"moodScore\":35,\"summary\":\"近期专注与精力偏低，状态较散且紧绷；手动反馈显示被中断后难以回到主线，桌面切换与较长空闲也支持这一判断，同时视频与健康信号显示疲劳在累积。\",\""}]},{"traceId":"d8c8b80b-02e4-4b95-9a6b-cd3f2169d40b","parentTraceId":"d0417df2-0a03-442b-ad8c-f3045158a2a6","createdAt":"2026-03-07T19:50:20.737Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]},{"traceId":"59ba68a8-d27d-4a81-a514-ef1118b83375","parentTraceId":"5769135c-1b70-4d88-ab89-5d6796e73c94","createdAt":"2026-03-07T19:14:31.709Z","target":"progress-feedback-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":2,\"suggestedFocusTaskId\":\"2691ec4f-9954-416d-83aa-3e5e2dd0dc06\",\"summaryHeadline\":\"Focus on the next hig"}]},{"traceId":"5769135c-1b70-4d88-ab89-5d6796e73c94","createdAt":"2026-03-07T19:13:31.762Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"progress_summary\",\"selectedAgent\":\"progress-feedback-agent\",\"reason\":\"The workflow is progress_summary and the structured context includes progress-related signals across goals, tasks, open interventions, the latest assessment,"}]},{"traceId":"6f2dc3a7-b34e-4a3f-bbed-49ff54ab865d","parentTraceId":"7f2a231f-4144-410f-863a-83de23d257f5","createdAt":"2026-03-07T19:13:08.305Z","target":"reflection-coach-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"demo-user\",\"periodType\":\"monthly\",\"periodStart\":\"2026-03-01T00:00:00.000Z\",\"periodEnd\":\"2026-03-07T19:11:59.751Z\",\"highlights\":[\"本月已明确一个核心目标“在深度工作中找回注意力”，并把主要精力放在高优先级任务“验证 chief-agent 在压力场景下的路由”上。\",\"当前仍保持一段进行中的专注会话，说明即使状态波动，用户仍在持"}]},{"traceId":"7f2a231f-4144-410f-863a-83de23d257f5","createdAt":"2026-03-07T19:12:54.027Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"reflection_report\",\"selectedAgent\":\"reflection-coach-agent\",\"reason\":\"The workflow is reflection_report and the structured context provides monthly review inputs including goals, tasks, sessions, assessments, and summary highli"}]},{"traceId":"bae462f3-0da9-4b83-90e2-6a158678c767","parentTraceId":"d9e8b087-d22f-44fe-a33f-aacd6803d2ad","createdAt":"2026-03-07T19:12:45.336Z","target":"reflection-coach-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"demo-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-03-07T00:00:00.000Z\",\"periodEnd\":\"2026-03-07T19:11:59.751Z\",\"highlights\":[\"本周已明确一个核心目标“在深度工作中找回注意力”，并将当前重心放在高优先级任务“验证 chief-agent 在压力场景下的路由”。\",\"当前仍保持一段进行中的专注会话，说明用户虽然状态波动，但还在持续"}]},{"traceId":"d9e8b087-d22f-44fe-a33f-aacd6803d2ad","createdAt":"2026-03-07T19:12:25.710Z","target":"chief-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"workflow\":\"reflection_report\",\"selectedAgent\":\"reflection-coach-agent\",\"reason\":\"The workflow is reflection_report and the structured context provides weekly review inputs including goals, tasks, sessions, assessments, and summary highlig"}]},{"traceId":"211bb0e7-3a62-4c46-8701-5bad0b6ba6da","parentTraceId":"5c7006f5-ebb6-47c8-9c47-0fa847a64504","createdAt":"2026-03-07T19:12:18.005Z","target":"interruption-recovery-agent","mode":"generate","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"这次中断后，当前评估仍显示专注和精力偏低、疲劳在累积，如果转去处理中优先级的文案任务，容易继续停留在分散状态。更合理的是先短暂恢复，再把优先级拉回到正在进行的核心验证任务，其余任务顺延。\",\"nextStep\":\"先休息几分钟、补水并远离消息干扰，然后开启一个25分钟专注块，只回到“验证 chief-agent 在压力场景下的路由”：选定1个最关键压力场景，完成1次路由验证并记录结果；这一轮不要切去调整收件箱提醒文案或检查复盘亮点摘要。\",\"sugges"}]}]}
```

### Chief Probe Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"chief-agent","baseUrl":"http://192.168.0.102:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}],"parsed":{"probe":"ok"},"adapter":{"traceId":"d8c8b80b-02e4-4b95-9a6b-cd3f2169d40b","parentTraceId":"d0417df2-0a03-442b-ad8c-f3045158a2a6","createdAt":"2026-03-07T19:50:20.803Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]},"runId":"f635c133-f846-4818-8f79-6efaf29ffdcf","traceId":"d8c8b80b-02e4-4b95-9a6b-cd3f2169d40b","parentTraceId":"d0417df2-0a03-442b-ad8c-f3045158a2a6","createdAt":"2026-03-07T19:50:20.803Z"}
```

### Scenario Seed Response

```json
{"scenarioId":"focus-recovery-loop","title":"Focus recovery loop","description":"低专注 + 高压力媒体信号 + 活跃专注会话，用来调试 state / recovery / notification。","userId":"debug-focus-user","goalId":"e6e972d7-8ac5-4951-bd38-71445fdd813b","taskId":"68d56cdd-5170-4f96-93f8-9885c9456542","sessionId":"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0","recommendedWorkflows":["state_assessment","recovery_plan","notification_dispatch"],"notes":["包含活跃专注会话、一次历史中断与恢复计划。","音频、视频、健康桥三类信号都已写入，适合联调 state / recovery / notification。"],"counts":{"goals":1,"tasks":3,"sessions":2,"assessments":1,"recoveryPlans":1,"reflections":0,"inbox":1},"runId":"8dd6255b-c0ce-48c3-b479-94c5d2694006","traceId":"81a30927-09ba-441c-b043-1310cd045173","parentTraceId":"5b7eacb1-e99e-443d-98c8-075cf1a1df09","createdAt":"2026-03-07T19:50:21.140Z"}
```

### State Insight Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"state-insight-agent","baseUrl":"http://192.168.0.102:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-03-07T19:39:21.084Z\",\"windowEnd\":\"2026-03-07T19:50:21.101Z\",\"focusScore\":33,\"energyScore\":27,\"moodScore\":35,\"summary\":\"近期专注与精力偏低，状态较散且紧绷；手动反馈显示被中断后难以回到主线，桌面切换与较长空闲也支持这一判断，同时视频与健康信号显示疲劳在累积。\",\""}],"content":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-03-07T19:39:21.084Z\",\"windowEnd\":\"2026-03-07T19:50:21.101Z\",\"focusScore\":33,\"energyScore\":27,\"moodScore\":35,\"summary\":\"近期专注与精力偏低，状态较散且紧绷；手动反馈显示被中断后难以回到主线，桌面切换与较长空闲也支持这一判断，同时视频与健康信号显示疲劳在累积。\",\"recommendedAction\":\"先休息10到15分钟并远离消息干扰，补水后只选一个最重要任务，用短时专注块重新回到主线。\",\"emotionSummary\":\"近期情绪偏紧张、压力较高，语速和语气更紧绷。\",\"emotionConfidence\":0.82,\"fatigueScore\":81,\"videoSummary\":\"视频侧显示眨眼频率偏高、视线稳定度下降，说明疲劳较明显且专注稳定性不足。\",\"healthSummary\":\"健康数据提示睡眠不足，疲劳影响延续到今天；当前恢复状态一般，精力基础偏弱。\",\"activeInputs\":[\"web_manual_checkin\",\"desktop_window_switch\",\"desktop_idle\",\"desktop_active_app\",\"desktop_unlock\",\"audio_emotion_assessment\",\"video_assessment\",\"health_snapshot\"],\"mediaFreshness\":\"emotion and video assessments are recent; health snapshot is from earlier today\"}","extractedJson":{"userId":"debug-focus-user","windowStart":"2026-03-07T19:39:21.084Z","windowEnd":"2026-03-07T19:50:21.101Z","focusScore":33,"energyScore":27,"moodScore":35,"summary":"近期专注与精力偏低，状态较散且紧绷；手动反馈显示被中断后难以回到主线，桌面切换与较长空闲也支持这一判断，同时视频与健康信号显示疲劳在累积。","recommendedAction":"先休息10到15分钟并远离消息干扰，补水后只选一个最重要任务，用短时专注块重新回到主线。","emotionSummary":"近期情绪偏紧张、压力较高，语速和语气更紧绷。","emotionConfidence":0.82,"fatigueScore":81,"videoSummary":"视频侧显示眨眼频率偏高、视线稳定度下降，说明疲劳较明显且专注稳定性不足。","healthSummary":"健康数据提示睡眠不足，疲劳影响延续到今天；当前恢复状态一般，精力基础偏弱。","activeInputs":["web_manual_checkin","desktop_window_switch","desktop_idle","desktop_active_app","desktop_unlock","audio_emotion_assessment","video_assessment","health_snapshot"],"mediaFreshness":"emotion and video assessments are recent; health snapshot is from earlier today"},"normalizedJson":{"userId":"debug-focus-user","windowStart":"2026-03-07T19:39:21.084Z","windowEnd":"2026-03-07T19:50:21.101Z","focusScore":33,"energyScore":27,"moodScore":35,"summary":"近期专注与精力偏低，状态较散且紧绷；手动反馈显示被中断后难以回到主线，桌面切换与较长空闲也支持这一判断，同时视频与健康信号显示疲劳在累积。","recommendedAction":"先休息10到15分钟并远离消息干扰，补水后只选一个最重要任务，用短时专注块重新回到主线。","emotionSummary":"近期情绪偏紧张、压力较高，语速和语气更紧绷。","emotionConfidence":0.82,"fatigueScore":81,"videoSummary":"视频侧显示眨眼频率偏高、视线稳定度下降，说明疲劳较明显且专注稳定性不足。","healthSummary":"健康数据提示睡眠不足，疲劳影响延续到今天；当前恢复状态一般，精力基础偏弱。","activeInputs":["web_manual_checkin","desktop_window_switch","desktop_idle","desktop_active_app","desktop_unlock","audio_emotion_assessment","video_assessment","health_bridge"],"mediaFreshness":"emotion and video assessments are recent; health snapshot is from earlier today"},"adapter":{"traceId":"39307220-42b2-4d02-a88f-a6b3fadf294c","parentTraceId":"a52079cd-cef1-49e0-b7fe-06c89bd63884","createdAt":"2026-03-07T19:50:37.940Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-03-07T19:39:21.084Z\",\"windowEnd\":\"2026-03-07T19:50:21.101Z\",\"focusScore\":33,\"energyScore\":27,\"moodScore\":35,\"summary\":\"近期专注与精力偏低，状态较散且紧绷；手动反馈显示被中断后难以回到主线，桌面切换与较长空闲也支持这一判断，同时视频与健康信号显示疲劳在累积。\",\""}]},"runId":"4e283e8e-730f-4922-bcb3-33b8f33d210d","traceId":"39307220-42b2-4d02-a88f-a6b3fadf294c","parentTraceId":"a52079cd-cef1-49e0-b7fe-06c89bd63884","createdAt":"2026-03-07T19:50:37.940Z"}
```

### Recovery Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"interruption-recovery-agent","baseUrl":"http://192.168.0.102:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"当前状态显示上下文切换频繁、精力偏低且疲劳明显，继续在多个任务之间来回切换只会进一步放大阻力。最合理的是先短暂重置，再把注意力收回到已在进行中的高优先级任务，只推进一个最小可完成的验证步骤。\",\"nextStep\":\"先暂停几分钟做一次短重置，然后开启一个25分钟专注块，只处理“验证 chief-agent 在压力场景下的路由”的一个最小切片：选定1个最关键压力场景，完成1次路由验证并记录结果；这一轮不要切换去调整收件箱提醒文案或检查复盘亮点摘要。\",\""}],"content":"{\"reason\":\"当前状态显示上下文切换频繁、精力偏低且疲劳明显，继续在多个任务之间来回切换只会进一步放大阻力。最合理的是先短暂重置，再把注意力收回到已在进行中的高优先级任务，只推进一个最小可完成的验证步骤。\",\"nextStep\":\"先暂停几分钟做一次短重置，然后开启一个25分钟专注块，只处理“验证 chief-agent 在压力场景下的路由”的一个最小切片：选定1个最关键压力场景，完成1次路由验证并记录结果；这一轮不要切换去调整收件箱提醒文案或检查复盘亮点摘要。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"8690b47c-618e-4210-b727-307f62bb443d\",\"5a422b6c-bbda-427b-9ce2-0c5f7a85dc98\"]}","extractedJson":{"reason":"当前状态显示上下文切换频繁、精力偏低且疲劳明显，继续在多个任务之间来回切换只会进一步放大阻力。最合理的是先短暂重置，再把注意力收回到已在进行中的高优先级任务，只推进一个最小可完成的验证步骤。","nextStep":"先暂停几分钟做一次短重置，然后开启一个25分钟专注块，只处理“验证 chief-agent 在压力场景下的路由”的一个最小切片：选定1个最关键压力场景，完成1次路由验证并记录结果；这一轮不要切换去调整收件箱提醒文案或检查复盘亮点摘要。","suggestedMinutes":25,"reprioritizedTaskIds":["68d56cdd-5170-4f96-93f8-9885c9456542","8690b47c-618e-4210-b727-307f62bb443d","5a422b6c-bbda-427b-9ce2-0c5f7a85dc98"]},"normalizedJson":{"reason":"当前状态显示上下文切换频繁、精力偏低且疲劳明显，继续在多个任务之间来回切换只会进一步放大阻力。最合理的是先短暂重置，再把注意力收回到已在进行中的高优先级任务，只推进一个最小可完成的验证步骤。","nextStep":"先暂停几分钟做一次短重置，然后开启一个25分钟专注块，只处理“验证 chief-agent 在压力场景下的路由”的一个最小切片：选定1个最关键压力场景，完成1次路由验证并记录结果；这一轮不要切换去调整收件箱提醒文案或检查复盘亮点摘要。","suggestedMinutes":25,"reprioritizedTaskIds":["68d56cdd-5170-4f96-93f8-9885c9456542","8690b47c-618e-4210-b727-307f62bb443d","5a422b6c-bbda-427b-9ce2-0c5f7a85dc98"]},"adapter":{"traceId":"c895c466-950d-4bdd-b0aa-1cfdc41ad19c","parentTraceId":"0aa0fa32-91ca-4256-9a43-1a29d825c553","createdAt":"2026-03-07T19:51:04.477Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"当前状态显示上下文切换频繁、精力偏低且疲劳明显，继续在多个任务之间来回切换只会进一步放大阻力。最合理的是先短暂重置，再把注意力收回到已在进行中的高优先级任务，只推进一个最小可完成的验证步骤。\",\"nextStep\":\"先暂停几分钟做一次短重置，然后开启一个25分钟专注块，只处理“验证 chief-agent 在压力场景下的路由”的一个最小切片：选定1个最关键压力场景，完成1次路由验证并记录结果；这一轮不要切换去调整收件箱提醒文案或检查复盘亮点摘要。\",\""}]},"runId":"b7bfc9cb-d48f-4d6b-9315-46633ca7d2bb","traceId":"c895c466-950d-4bdd-b0aa-1cfdc41ad19c","parentTraceId":"0aa0fa32-91ca-4256-9a43-1a29d825c553","createdAt":"2026-03-07T19:51:04.477Z"}
```

### Reflection Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"reflection-coach-agent","baseUrl":"http://192.168.0.102:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-03-07T00:00:00.000Z\",\"periodEnd\":\"2026-03-07T19:50:21.107Z\",\"highlights\":[\"本周已围绕“在深度工作中找回注意力”建立活跃目标，并持续推进高优先级任务“验证 chief-agent 在压力场景下的路由”。\",\"当前仍有一段进行中的专注会话，说明用户没有完全脱离主线，"}],"content":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-03-07T00:00:00.000Z\",\"periodEnd\":\"2026-03-07T19:50:21.107Z\",\"highlights\":[\"本周已围绕“在深度工作中找回注意力”建立活跃目标，并持续推进高优先级任务“验证 chief-agent 在压力场景下的路由”。\",\"当前仍有一段进行中的专注会话，说明用户没有完全脱离主线，仍在尝试维持推进。\",\"本次复盘已整合桌面、音频、视频与健康桥接等多源信号，为判断专注下降原因提供了较完整依据。\"],\"blockers\":[\"频繁切换上下文已打断上一段专注块，削弱了深度工作的连续性。\",\"最新评估显示专注、能量和情绪分数都偏低，疲劳与挫败感正在明显压制执行状态。\",\"睡眠不足影响延续到今天，视频侧也显示疲劳明显，进一步拉低了专注稳定性。\"],\"trends\":[\"任务完成度仍为0/3，说明当前主要处于维持与恢复专注的阶段，而非稳定产出阶段。\",\"压力信号持续偏高：音频侧呈现紧绷状态，视频侧显示眨眼频率偏高与视线稳定度下降。\",\"专注模式呈现“容易被打断、恢复较吃力”的趋势，当前虽有活跃会话，但整体恢复仍不稳固。\"],\"nextSuggestions\":[\"先按建议做一次短暂恢复，暂停几分钟、补水并离开干扰源，再继续当前任务。\",\"回到工作时只保留一个最小下一步，例如先完成“验证路由”的单一检查点，避免并行处理其他待办。\",\"下一段专注块里尽量减少窗口切换和提醒干扰，优先保住一个完整、不被打断的工作时段。\"]}","extractedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-03-07T00:00:00.000Z","periodEnd":"2026-03-07T19:50:21.107Z","highlights":["本周已围绕“在深度工作中找回注意力”建立活跃目标，并持续推进高优先级任务“验证 chief-agent 在压力场景下的路由”。","当前仍有一段进行中的专注会话，说明用户没有完全脱离主线，仍在尝试维持推进。","本次复盘已整合桌面、音频、视频与健康桥接等多源信号，为判断专注下降原因提供了较完整依据。"],"blockers":["频繁切换上下文已打断上一段专注块，削弱了深度工作的连续性。","最新评估显示专注、能量和情绪分数都偏低，疲劳与挫败感正在明显压制执行状态。","睡眠不足影响延续到今天，视频侧也显示疲劳明显，进一步拉低了专注稳定性。"],"trends":["任务完成度仍为0/3，说明当前主要处于维持与恢复专注的阶段，而非稳定产出阶段。","压力信号持续偏高：音频侧呈现紧绷状态，视频侧显示眨眼频率偏高与视线稳定度下降。","专注模式呈现“容易被打断、恢复较吃力”的趋势，当前虽有活跃会话，但整体恢复仍不稳固。"],"nextSuggestions":["先按建议做一次短暂恢复，暂停几分钟、补水并离开干扰源，再继续当前任务。","回到工作时只保留一个最小下一步，例如先完成“验证路由”的单一检查点，避免并行处理其他待办。","下一段专注块里尽量减少窗口切换和提醒干扰，优先保住一个完整、不被打断的工作时段。"]},"normalizedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-03-07T00:00:00.000Z","periodEnd":"2026-03-07T19:50:21.107Z","highlights":["本周已围绕“在深度工作中找回注意力”建立活跃目标，并持续推进高优先级任务“验证 chief-agent 在压力场景下的路由”。","当前仍有一段进行中的专注会话，说明用户没有完全脱离主线，仍在尝试维持推进。","本次复盘已整合桌面、音频、视频与健康桥接等多源信号，为判断专注下降原因提供了较完整依据。"],"blockers":["频繁切换上下文已打断上一段专注块，削弱了深度工作的连续性。","最新评估显示专注、能量和情绪分数都偏低，疲劳与挫败感正在明显压制执行状态。","睡眠不足影响延续到今天，视频侧也显示疲劳明显，进一步拉低了专注稳定性。"],"trends":["任务完成度仍为0/3，说明当前主要处于维持与恢复专注的阶段，而非稳定产出阶段。","压力信号持续偏高：音频侧呈现紧绷状态，视频侧显示眨眼频率偏高与视线稳定度下降。","专注模式呈现“容易被打断、恢复较吃力”的趋势，当前虽有活跃会话，但整体恢复仍不稳固。"],"nextSuggestions":["先按建议做一次短暂恢复，暂停几分钟、补水并离开干扰源，再继续当前任务。","回到工作时只保留一个最小下一步，例如先完成“验证路由”的单一检查点，避免并行处理其他待办。","下一段专注块里尽量减少窗口切换和提醒干扰，优先保住一个完整、不被打断的工作时段。"]},"adapter":{"traceId":"8a5d65ad-c33c-4fd8-ac04-ab74b75b13c8","parentTraceId":"ff56a007-5593-43b2-bf03-d5600447a769","createdAt":"2026-03-07T19:51:33.602Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-03-07T00:00:00.000Z\",\"periodEnd\":\"2026-03-07T19:50:21.107Z\",\"highlights\":[\"本周已围绕“在深度工作中找回注意力”建立活跃目标，并持续推进高优先级任务“验证 chief-agent 在压力场景下的路由”。\",\"当前仍有一段进行中的专注会话，说明用户没有完全脱离主线，"}]},"runId":"a5b4519b-8d92-42ed-9a30-96473e956d38","traceId":"8a5d65ad-c33c-4fd8-ac04-ab74b75b13c8","parentTraceId":"ff56a007-5593-43b2-bf03-d5600447a769","createdAt":"2026-03-07T19:51:33.602Z"}
```

### Task Management Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"task-management-agent","baseUrl":"http://192.168.0.102:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"8690b47c-618e-4210-b727-307f62bb443d\",\"5a422b6c-bbda-427b-9ce2-0c5f7a85dc98\"],\"summary\":\"当前状态显示上下文切换频繁、精力偏低且疲劳明显，最优顺序是先短暂重置后继续推进已经在进行中的高优先级任务，以降低切换到新任务的成本并更容易回到主线。随后处理范围较小、负担适中的提醒文案"}],"content":"{\"orderedTaskIds\":[\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"8690b47c-618e-4210-b727-307f62bb443d\",\"5a422b6c-bbda-427b-9ce2-0c5f7a85dc98\"],\"summary\":\"当前状态显示上下文切换频繁、精力偏低且疲劳明显，最优顺序是先短暂重置后继续推进已经在进行中的高优先级任务，以降低切换到新任务的成本并更容易回到主线。随后处理范围较小、负担适中的提醒文案调整，最后再完成更轻量的复盘亮点摘要检查。\",\"suggestedTasks\":[]}","extractedJson":{"orderedTaskIds":["68d56cdd-5170-4f96-93f8-9885c9456542","8690b47c-618e-4210-b727-307f62bb443d","5a422b6c-bbda-427b-9ce2-0c5f7a85dc98"],"summary":"当前状态显示上下文切换频繁、精力偏低且疲劳明显，最优顺序是先短暂重置后继续推进已经在进行中的高优先级任务，以降低切换到新任务的成本并更容易回到主线。随后处理范围较小、负担适中的提醒文案调整，最后再完成更轻量的复盘亮点摘要检查。","suggestedTasks":[]},"normalizedJson":{"orderedTaskIds":["68d56cdd-5170-4f96-93f8-9885c9456542","8690b47c-618e-4210-b727-307f62bb443d","5a422b6c-bbda-427b-9ce2-0c5f7a85dc98"],"summary":"当前状态显示上下文切换频繁、精力偏低且疲劳明显，最优顺序是先短暂重置后继续推进已经在进行中的高优先级任务，以降低切换到新任务的成本并更容易回到主线。随后处理范围较小、负担适中的提醒文案调整，最后再完成更轻量的复盘亮点摘要检查。","suggestedTasks":[]},"adapter":{"traceId":"2093dcce-94d5-4256-94b7-fe18b5aec4f5","parentTraceId":"3b5f60c7-449f-4bee-a8a3-421a46dcf2ac","createdAt":"2026-03-07T19:51:44.454Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"8690b47c-618e-4210-b727-307f62bb443d\",\"5a422b6c-bbda-427b-9ce2-0c5f7a85dc98\"],\"summary\":\"当前状态显示上下文切换频繁、精力偏低且疲劳明显，最优顺序是先短暂重置后继续推进已经在进行中的高优先级任务，以降低切换到新任务的成本并更容易回到主线。随后处理范围较小、负担适中的提醒文案"}]},"runId":"7f6ff287-8ee6-4976-b467-ec88bd88a9e5","traceId":"2093dcce-94d5-4256-94b7-fe18b5aec4f5","parentTraceId":"3b5f60c7-449f-4bee-a8a3-421a46dcf2ac","createdAt":"2026-03-07T19:51:44.454Z"}
```

### Progress Feedback Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"progress-feedback-agent","baseUrl":"http://192.168.0.102:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"summaryHeadline\":\"Focus on the next hig"}],"content":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"summaryHeadline\":\"Focus on the next high priority task.\",\"activeSession\":{\"id\":\"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0\",\"userId\":\"debug-focus-user\",\"goalId\":\"e6e972d7-8ac5-4951-bd38-71445fdd813b\",\"taskId\":\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"status\":\"active\",\"startedAt\":\"2026-03-07T19:22:21.063Z\",\"interruptionCount\":0,\"summary\":\"\"},\"latestAssessment\":{\"id\":\"66b733f4-d2cf-4e05-bab9-699093ce276d\",\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-03-07T19:25:21.074Z\",\"windowEnd\":\"2026-03-07T19:46:21.074Z\",\"focusScore\":20,\"energyScore\":21,\"moodScore\":30,\"summary\":\"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。\",\"recommendedAction\":\"Pause for a short reset before resuming the next small task step.\",\"emotionSummary\":\"音频侧推断近期压力偏高，语速与语气都更紧绷。\",\"emotionConfidence\":0.82,\"fatigueScore\":79,\"videoSummary\":\"视频侧显示眨眼频率偏高，视线稳定度下降。\",\"healthSummary\":\"健康桥接显示睡眠不足，疲劳影响延续到了今天。\",\"activeInputs\":[\"desktop_signal\",\"audio_server_inference\",\"video_server_inference\",\"health_bridge\"],\"mediaFreshness\":\"fresh\",\"source\":\"manual\",\"createdAt\":\"2026-03-07T19:48:21.107Z\"},\"latestRecoveryPlan\":{\"id\":\"d8327234-6fbc-4653-9f3d-d0307d227dce\",\"userId\":\"debug-focus-user\",\"sessionId\":\"10e58707-9283-47c2-8115-e6c64ef98e73\",\"taskId\":\"8690b47c-618e-4210-b727-307f62bb443d\",\"reason\":\"energy_drop\",\"nextStep\":\"Resume \\\"调整收件箱提醒文案\\\" by completing the next visible sub-step.\",\"suggestedMinutes\":10,\"reprioritizedTaskIds\":[\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"8690b47c-618e-4210-b727-307f62bb443d\",\"5a422b6c-bbda-427b-9ce2-0c5f7a85dc98\"],\"createdAt\":\"2026-03-07T18:50:21.121Z\"},\"latestBehaviorConclusion\":{\"id\":\"707a651a-fd64-41c5-ae0c-0961f966ec39\",\"createdAt\":\"2026-03-07T19:50:21.128Z\",\"userId\":\"debug-focus-user\",\"assessmentId\":\"66b733f4-d2cf-4e05-bab9-699093ce276d\",\"sessionId\":\"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0\",\"taskId\":\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"riskLevel\":\"high\",\"summary\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"suggestedAction\":\"Pause for a short reset before resuming the next small task step.\",\"trigger\":\"high_risk_state\",\"recommendedChannel\":\"mobile_push\"},\"latestVideoAssessment\":{\"id\":\"8be5b744-d23d-46ce-9f77-84c0a7a0358c\",\"userId\":\"debug-focus-user\",\"deviceId\":\"debug-desktop-focus\",\"sessionId\":\"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0\",\"windowStart\":\"2026-03-07T19:37:21.093Z\",\"windowEnd\":\"2026-03-07T19:43:21.093Z\",\"fatigueScore\":79,\"focusScore\":36,\"confidence\":0.78,\"summary\":\"视频侧显示眨眼频率偏高，视线稳定度下降。\",\"modelName\":\"debug-video-seed\",\"featureSummary\":\"landmarks+blink+headpose\",\"source\":\"cluster-stub\",\"createdAt\":\"2026-03-07T19:50:21.093Z\"},\"latestHealthSnapshot\":{\"id\":\"c2e92583-d188-4a58-aab7-554f51240561\",\"userId\":\"debug-focus-user\",\"deviceId\":\"debug-mobile-focus\",\"sourcePlatform\":\"android\",\"sourceProvider\":\"health_connect\",\"windowStart\":\"2026-03-07T07:50:21.101Z\",\"windowEnd\":\"2026-03-07T15:50:21.101Z\",\"heartRate\":81,\"oxygenSaturation\":93,\"restingHeartRate\":70,\"sleepMinutes\":295,\"summary\":\"健康桥接显示睡眠不足，疲劳影响延续到了今天。\",\"createdAt\":\"2026-03-07T19:50:21.101Z\"},\"mobileAudio\":{\"enabled\":true,\"latestDevice\":{\"id\":\"1032c9ec-ed3d-411c-957e-f456df6101c4\",\"userId\":\"debug-focus-user\",\"deviceId\":\"debug-mobile-focus\",\"deviceName\":\"调试 Android\",\"platform\":\"android\",\"appVersion\":\"debug-scenario\",\"pairingState\":\"paired\",\"desktopHost\":\"debug-focus.local\",\"consentAcknowledgedAt\":\"2026-03-07T17:50:20.984Z\",\"lastSeenAt\":\"2026-03-07T19:50:20.984Z\",\"createdAt\":\"2026-03-07T19:50:20.984Z\",\"updatedAt\":\"2026-03-07T19:50:20.984Z\"},\"latestSession\":null,\"latestEmotionAssessment\":{\"id\":\"e006b047-acc8-4a66-974b-680bebc2f641\",\"userId\":\"debug-focus-user\",\"deviceId\":\"debug-mobile-focus\",\"sessionId\":\"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0\",\"chunkSequence\":2,\"windowStart\":\"2026-03-07T19:39:21.084Z\",\"windowEnd\":\"2026-03-07T19:44:21.084Z\",\"emotionLabel\":\"tense\",\"valenceScore\":32,\"arousalScore\":76,\"stressScore\":84,\"confidence\":0.82,\"summary\":\"音频侧推断近期压力偏高，语速与语气都更紧绷。\",\"modelName\":\"debug-audio-seed\",\"source\":\"cluster-stub\",\"createdAt\":\"2026-03-07T19:50:21.084Z\"},\"latestCallEvent\":null},\"edgeDevices\":[{\"id\":\"6bb9fae6-ef65-4035-b994-02c7855b19db\",\"userId\":\"debug-focus-user\",\"deviceId\":\"debug-mobile-focus\",\"label\":\"调试专注手机端\",\"deviceType\":\"mobile\",\"platform\":\"android\",\"capabilities\":[\"notifications\",\"health_bridge\"],\"status\":\"online\",\"appVersion\":\"debug-scenario\",\"queueDepth\":0,\"lastSeenAt\":\"2026-03-07T19:50:20.969Z\",\"createdAt\":\"2026-03-07T19:50:20.969Z\",\"updatedAt\":\"2026-03-07T19:50:20.969Z\"},{\"id\":\"3a39e6c2-a3b7-4b36-9b00-354122183959\",\"userId\":\"debug-focus-user\",\"deviceId\":\"debug-desktop-focus\",\"label\":\"调试专注桌面端\",\"deviceType\":\"desktop\",\"platform\":\"macos\",\"capabilities\":[\"desktop_signals\",\"notifications\",\"video_capture\"],\"status\":\"online\",\"appVersion\":\"debug-scenario\",\"queueDepth\":0,\"lastSeenAt\":\"2026-03-07T19:50:20.950Z\",\"createdAt\":\"2026-03-07T19:50:20.950Z\",\"updatedAt\":\"2026-03-07T19:50:20.950Z\"}],\"inbox\":[{\"id\":\"a8c03c48-6c76-49bd-af79-947f6923d021\",\"createdAt\":\"2026-03-07T19:50:21.134Z\",\"status\":\"pending\",\"userId\":\"debug-focus-user\",\"title\":\"建议立即恢复主线\",\"message\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\"}],\"goals\":[{\"id\":\"e6e972d7-8ac5-4951-bd38-71445fdd813b\",\"userId\":\"debug-focus-user\",\"title\":\"在深度工作中找回注意力\",\"description\":\"用于状态、恢复和通知 agent 联调的示例场景。\",\"status\":\"active\",\"taskSummary\":{\"total\":3,\"completed\":0},\"createdAt\":\"2026-03-07T19:50:20.997Z\",\"updatedAt\":\"2026-03-07T19:50:21.043Z\"}],\"tasks\":[{\"id\":\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"userId\":\"debug-focus-user\",\"goalId\":\"e6e972d7-8ac5-4951-bd38-71445fdd813b\",\"title\":\"验证 chief-agent 在压力场景下的路由\",\"status\":\"in_progress\",\"priority\":\"high\",\"estimatedMinutes\":35,\"sortOrder\":0,\"createdAt\":\"2026-03-07T19:50:21.014Z\",\"updatedAt\":\"2026-03-07T19:50:21.043Z\"},{\"id\":\"8690b47c-618e-4210-b727-307f62bb443d\",\"userId\":\"debug-focus-user\",\"goalId\":\"e6e972d7-8ac5-4951-bd38-71445fdd813b\",\"title\":\"调整收件箱提醒文案\",\"status\":\"todo\",\"priority\":\"medium\",\"estimatedMinutes\":20,\"sortOrder\":1,\"createdAt\":\"2026-03-07T19:50:21.025Z\",\"updatedAt\":\"2026-03-07T19:50:21.025Z\"},{\"id\":\"5a422b6c-bbda-427b-9ce2-0c5f7a85dc98\",\"userId\":\"debug-focus-user\",\"goalId\":\"e6e972d7-8ac5-4951-bd38-71445fdd813b\",\"title\":\"检查复盘亮点摘要\",\"status\":\"todo\",\"priority\":\"low\",\"estimatedMinutes\":15,\"sortOrder\":2,\"createdAt\":\"2026-03-07T19:50:21.034Z\",\"updatedAt\":\"2026-03-07T19:50:21.034Z\"}]}","extractedJson":{"goalCount":1,"taskCount":3,"completedTaskCount":0,"inProgressTaskCount":1,"blockedTaskCount":0,"completionRate":0,"openInterventions":1,"suggestedFocusTaskId":"68d56cdd-5170-4f96-93f8-9885c9456542","summaryHeadline":"Focus on the next high priority task.","activeSession":{"id":"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0","userId":"debug-focus-user","goalId":"e6e972d7-8ac5-4951-bd38-71445fdd813b","taskId":"68d56cdd-5170-4f96-93f8-9885c9456542","status":"active","startedAt":"2026-03-07T19:22:21.063Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"66b733f4-d2cf-4e05-bab9-699093ce276d","userId":"debug-focus-user","windowStart":"2026-03-07T19:25:21.074Z","windowEnd":"2026-03-07T19:46:21.074Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示眨眼频率偏高，视线稳定度下降。","healthSummary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-03-07T19:48:21.107Z"},"latestRecoveryPlan":{"id":"d8327234-6fbc-4653-9f3d-d0307d227dce","userId":"debug-focus-user","sessionId":"10e58707-9283-47c2-8115-e6c64ef98e73","taskId":"8690b47c-618e-4210-b727-307f62bb443d","reason":"energy_drop","nextStep":"Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["68d56cdd-5170-4f96-93f8-9885c9456542","8690b47c-618e-4210-b727-307f62bb443d","5a422b6c-bbda-427b-9ce2-0c5f7a85dc98"],"createdAt":"2026-03-07T18:50:21.121Z"},"latestBehaviorConclusion":{"id":"707a651a-fd64-41c5-ae0c-0961f966ec39","createdAt":"2026-03-07T19:50:21.128Z","userId":"debug-focus-user","assessmentId":"66b733f4-d2cf-4e05-bab9-699093ce276d","sessionId":"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0","taskId":"68d56cdd-5170-4f96-93f8-9885c9456542","riskLevel":"high","summary":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"8be5b744-d23d-46ce-9f77-84c0a7a0358c","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0","windowStart":"2026-03-07T19:37:21.093Z","windowEnd":"2026-03-07T19:43:21.093Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"视频侧显示眨眼频率偏高，视线稳定度下降。","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-03-07T19:50:21.093Z"},"latestHealthSnapshot":{"id":"c2e92583-d188-4a58-aab7-554f51240561","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-03-07T07:50:21.101Z","windowEnd":"2026-03-07T15:50:21.101Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","createdAt":"2026-03-07T19:50:21.101Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"1032c9ec-ed3d-411c-957e-f456df6101c4","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"调试 Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-03-07T17:50:20.984Z","lastSeenAt":"2026-03-07T19:50:20.984Z","createdAt":"2026-03-07T19:50:20.984Z","updatedAt":"2026-03-07T19:50:20.984Z"},"latestSession":null,"latestEmotionAssessment":{"id":"e006b047-acc8-4a66-974b-680bebc2f641","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0","chunkSequence":2,"windowStart":"2026-03-07T19:39:21.084Z","windowEnd":"2026-03-07T19:44:21.084Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-03-07T19:50:21.084Z"},"latestCallEvent":null},"edgeDevices":[{"id":"6bb9fae6-ef65-4035-b994-02c7855b19db","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"调试专注手机端","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-03-07T19:50:20.969Z","createdAt":"2026-03-07T19:50:20.969Z","updatedAt":"2026-03-07T19:50:20.969Z"},{"id":"3a39e6c2-a3b7-4b36-9b00-354122183959","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"调试专注桌面端","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-03-07T19:50:20.950Z","createdAt":"2026-03-07T19:50:20.950Z","updatedAt":"2026-03-07T19:50:20.950Z"}],"inbox":[{"id":"a8c03c48-6c76-49bd-af79-947f6923d021","createdAt":"2026-03-07T19:50:21.134Z","status":"pending","userId":"debug-focus-user","title":"建议立即恢复主线","message":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"e6e972d7-8ac5-4951-bd38-71445fdd813b","userId":"debug-focus-user","title":"在深度工作中找回注意力","description":"用于状态、恢复和通知 agent 联调的示例场景。","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-03-07T19:50:20.997Z","updatedAt":"2026-03-07T19:50:21.043Z"}],"tasks":[{"id":"68d56cdd-5170-4f96-93f8-9885c9456542","userId":"debug-focus-user","goalId":"e6e972d7-8ac5-4951-bd38-71445fdd813b","title":"验证 chief-agent 在压力场景下的路由","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-03-07T19:50:21.014Z","updatedAt":"2026-03-07T19:50:21.043Z"},{"id":"8690b47c-618e-4210-b727-307f62bb443d","userId":"debug-focus-user","goalId":"e6e972d7-8ac5-4951-bd38-71445fdd813b","title":"调整收件箱提醒文案","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-03-07T19:50:21.025Z","updatedAt":"2026-03-07T19:50:21.025Z"},{"id":"5a422b6c-bbda-427b-9ce2-0c5f7a85dc98","userId":"debug-focus-user","goalId":"e6e972d7-8ac5-4951-bd38-71445fdd813b","title":"检查复盘亮点摘要","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-03-07T19:50:21.034Z","updatedAt":"2026-03-07T19:50:21.034Z"}]},"normalizedJson":{"goalCount":1,"taskCount":3,"completedTaskCount":0,"inProgressTaskCount":1,"blockedTaskCount":0,"completionRate":0,"openInterventions":1,"suggestedFocusTaskId":"68d56cdd-5170-4f96-93f8-9885c9456542","summaryHeadline":"Focus on the next high priority task.","activeSession":{"id":"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0","userId":"debug-focus-user","goalId":"e6e972d7-8ac5-4951-bd38-71445fdd813b","taskId":"68d56cdd-5170-4f96-93f8-9885c9456542","status":"active","startedAt":"2026-03-07T19:22:21.063Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"66b733f4-d2cf-4e05-bab9-699093ce276d","userId":"debug-focus-user","windowStart":"2026-03-07T19:25:21.074Z","windowEnd":"2026-03-07T19:46:21.074Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示眨眼频率偏高，视线稳定度下降。","healthSummary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-03-07T19:48:21.107Z"},"latestRecoveryPlan":{"id":"d8327234-6fbc-4653-9f3d-d0307d227dce","userId":"debug-focus-user","sessionId":"10e58707-9283-47c2-8115-e6c64ef98e73","taskId":"8690b47c-618e-4210-b727-307f62bb443d","reason":"energy_drop","nextStep":"Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["68d56cdd-5170-4f96-93f8-9885c9456542","8690b47c-618e-4210-b727-307f62bb443d","5a422b6c-bbda-427b-9ce2-0c5f7a85dc98"],"createdAt":"2026-03-07T18:50:21.121Z"},"latestBehaviorConclusion":{"id":"707a651a-fd64-41c5-ae0c-0961f966ec39","createdAt":"2026-03-07T19:50:21.128Z","userId":"debug-focus-user","assessmentId":"66b733f4-d2cf-4e05-bab9-699093ce276d","sessionId":"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0","taskId":"68d56cdd-5170-4f96-93f8-9885c9456542","riskLevel":"high","summary":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"8be5b744-d23d-46ce-9f77-84c0a7a0358c","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0","windowStart":"2026-03-07T19:37:21.093Z","windowEnd":"2026-03-07T19:43:21.093Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"视频侧显示眨眼频率偏高，视线稳定度下降。","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-03-07T19:50:21.093Z"},"latestHealthSnapshot":{"id":"c2e92583-d188-4a58-aab7-554f51240561","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-03-07T07:50:21.101Z","windowEnd":"2026-03-07T15:50:21.101Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","createdAt":"2026-03-07T19:50:21.101Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"1032c9ec-ed3d-411c-957e-f456df6101c4","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"调试 Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-03-07T17:50:20.984Z","lastSeenAt":"2026-03-07T19:50:20.984Z","createdAt":"2026-03-07T19:50:20.984Z","updatedAt":"2026-03-07T19:50:20.984Z"},"latestSession":null,"latestEmotionAssessment":{"id":"e006b047-acc8-4a66-974b-680bebc2f641","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"59cb702e-ddc4-4699-9e4c-8d0ad08c0ab0","chunkSequence":2,"windowStart":"2026-03-07T19:39:21.084Z","windowEnd":"2026-03-07T19:44:21.084Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-03-07T19:50:21.084Z"},"latestCallEvent":null},"edgeDevices":[{"id":"6bb9fae6-ef65-4035-b994-02c7855b19db","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"调试专注手机端","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-03-07T19:50:20.969Z","createdAt":"2026-03-07T19:50:20.969Z","updatedAt":"2026-03-07T19:50:20.969Z"},{"id":"3a39e6c2-a3b7-4b36-9b00-354122183959","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"调试专注桌面端","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-03-07T19:50:20.950Z","createdAt":"2026-03-07T19:50:20.950Z","updatedAt":"2026-03-07T19:50:20.950Z"}],"inbox":[{"id":"a8c03c48-6c76-49bd-af79-947f6923d021","createdAt":"2026-03-07T19:50:21.134Z","status":"pending","userId":"debug-focus-user","title":"建议立即恢复主线","message":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"e6e972d7-8ac5-4951-bd38-71445fdd813b","userId":"debug-focus-user","title":"在深度工作中找回注意力","description":"用于状态、恢复和通知 agent 联调的示例场景。","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-03-07T19:50:20.997Z","updatedAt":"2026-03-07T19:50:21.043Z"}],"tasks":[{"id":"68d56cdd-5170-4f96-93f8-9885c9456542","userId":"debug-focus-user","goalId":"e6e972d7-8ac5-4951-bd38-71445fdd813b","title":"验证 chief-agent 在压力场景下的路由","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-03-07T19:50:21.014Z","updatedAt":"2026-03-07T19:50:21.043Z"},{"id":"8690b47c-618e-4210-b727-307f62bb443d","userId":"debug-focus-user","goalId":"e6e972d7-8ac5-4951-bd38-71445fdd813b","title":"调整收件箱提醒文案","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-03-07T19:50:21.025Z","updatedAt":"2026-03-07T19:50:21.025Z"},{"id":"5a422b6c-bbda-427b-9ce2-0c5f7a85dc98","userId":"debug-focus-user","goalId":"e6e972d7-8ac5-4951-bd38-71445fdd813b","title":"检查复盘亮点摘要","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-03-07T19:50:21.034Z","updatedAt":"2026-03-07T19:50:21.034Z"}]},"adapter":{"traceId":"a65098ee-5444-43e2-8017-14208ac2f0da","parentTraceId":"feb9165e-ffed-4655-85f9-17ef61973e17","createdAt":"2026-03-07T19:54:40.419Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"68d56cdd-5170-4f96-93f8-9885c9456542\",\"summaryHeadline\":\"Focus on the next hig"}]},"runId":"90446a9c-01cb-4f97-b9f1-3ec93ab4320d","traceId":"a65098ee-5444-43e2-8017-14208ac2f0da","parentTraceId":"feb9165e-ffed-4655-85f9-17ef61973e17","createdAt":"2026-03-07T19:54:40.419Z"}
```

### Automation Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"automation-agent","baseUrl":"http://192.168.0.102:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"高风险状态，立即暂停\",\"message\":\"先暂停，做一次短暂重置，再继续下一个最小任务步骤。\",\"channel\":\"mobile_push\",\"deliver\":true}"}],"content":"{\"title\":\"高风险状态，立即暂停\",\"message\":\"先暂停，做一次短暂重置，再继续下一个最小任务步骤。\",\"channel\":\"mobile_push\",\"deliver\":true}","extractedJson":{"title":"高风险状态，立即暂停","message":"先暂停，做一次短暂重置，再继续下一个最小任务步骤。","channel":"mobile_push","deliver":true},"normalizedJson":{"title":"高风险状态，立即暂停","message":"先暂停，做一次短暂重置，再继续下一个最小任务步骤。","channel":"mobile_push","deliver":true},"adapter":{"traceId":"dba1da6a-8ee2-4fd2-a13c-2538765ad005","parentTraceId":"fa85ebbf-1009-489a-9980-34bba6f26f17","createdAt":"2026-03-07T19:54:53.535Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"高风险状态，立即暂停\",\"message\":\"先暂停，做一次短暂重置，再继续下一个最小任务步骤。\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"runId":"10b71b95-15ad-4f17-883b-fbd1254458b4","traceId":"dba1da6a-8ee2-4fd2-a13c-2538765ad005","parentTraceId":"fa85ebbf-1009-489a-9980-34bba6f26f17","createdAt":"2026-03-07T19:54:53.535Z"}
```
