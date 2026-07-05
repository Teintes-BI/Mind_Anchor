# OpenClaw Production Runtime Smoke Report（2026-04-22）

用于记录一次 **M5 当前机器外部 cluster smoke** 的执行结果。

本次 smoke 的边界：

- 已验证：当前机器上的 runtime 常驻、Gateway `cluster-preferred`、7 core agent spot-check
- 未验证：第二台机器独立复跑、浏览器人工页面验收
- 另有独立补充：`real:aligned -- --phases cluster-preferred --segments runtime-contracts` 已在同日复跑通过

---

## 1. 基本信息

- 日期：2026-04-22
- 执行人：Codex
- 机器：当前本地 OpenClaw 计划部署机
- Gateway 提交/版本：当前工作区源码
- Cluster 提交/版本：本地兼容 OpenClaw execute 服务
- 执行环境：
  - `MINDANCHOR_API_URL`：`http://127.0.0.1:3011`
  - `MINDANCHOR_OPENCLAW_BASE_URL`：`http://192.168.0.104:8800`
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
- `openClawBaseUrl`：`http://192.168.0.104:8800`
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
- `traceId`：`78e071e6-393d-447c-9ae4-0c3f04ec876d`
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
- `traceId`：2f803983-4589-47b2-b98d-b61a04f938dd
- 结果：通过

### `/debug/agent/interruption-recovery`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：6c50ab59-bb18-498c-a5a7-a28c97711c10
- 结果：通过

### `/debug/agent/reflection`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：882d08b4-066f-4d66-9873-80dc85093ca9
- 结果：通过

### `/debug/agent/task-management`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：555800de-7910-4afa-8450-6085f4ad39b0
- 结果：通过

### `/debug/agent/progress-feedback`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：feda9388-e523-4bbc-9ea7-0e941301438a
- 结果：通过

### `/debug/agent/automation`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：82ff7eaa-73af-4418-9c45-a95b559dad26
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
  - chief probe trace：`78e071e6-393d-447c-9ae4-0c3f04ec876d`
  - state-insight debug trace：`2f803983-4589-47b2-b98d-b61a04f938dd`
  - interruption-recovery debug trace：`6c50ab59-bb18-498c-a5a7-a28c97711c10`
  - reflection debug trace：`882d08b4-066f-4d66-9873-80dc85093ca9`
  - task-management debug trace：`555800de-7910-4afa-8450-6085f4ad39b0`
  - progress-feedback debug trace：`feda9388-e523-4bbc-9ea7-0e941301438a`
  - automation debug trace：`82ff7eaa-73af-4418-9c45-a95b559dad26`
- 关键日志文件位置：
  - runtime：`.logs/openclaw-real-lan.log`
  - runtime env：`.logs/openclaw-real-lan.env`
  - temporary gateway：`.logs/api-task10.log`
- `debug/openclaw/adapter` 返回快照是否已保存：是

## 7. 最终判定

- 直连 cluster 合同：通过
- Gateway cluster-preferred：通过
- Web 控制台：本次未验证
- 综合判定：当前机器 smoke 通过，但 M5 仍未完成

## 8. 问题与后续动作

- 发现的问题：
  1. 当前 shell 默认 `MINDANCHOR_DEFAULT_MODEL_*` 仍与 `~/.openclaw-dev/openclaw.json` 存在 drift，手工做 provider-direct 对比前要先对齐
  2. 第二台机器独立复跑被跳过，因此 cross-machine 仍未完成

- 建议的下一步：
  1. 继续追 transport 类 `provider-fallback` 的长期稳定性，而不是再把重点放在已通过的 runtime-contracts phased 上
  2. 如需手工做 provider-direct 对比，先用 OpenClaw profile 对齐 `MINDANCHOR_DEFAULT_MODEL_*`
  3. 如后续恢复第二台机器复跑，再把这份 smoke 与 manual verification 一起升级成最终 M5 acceptance packet

---

可和以下文档配合使用：

- `docs/openclaw-cluster-smoke-checklist.md`
- `docs/web-console-smoke-checklist.md`
- `docs/development-handoff-2026-03-07.md`

## Script Snapshot

- Captured at: 2026-04-22T07:04:18Z
- API Base URL: `http://127.0.0.1:3011`
- Cluster Base URL: `http://192.168.0.104:8800`
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
{"ok":true,"mode":"openai-compatible","topology":"gateway->openclaw-cluster","openClawBaseUrl":"http://192.168.0.104:8800"}
```

### Adapter Response

```json
{"gatewayMode":"openai-compatible","clusterEnabled":true,"executionStrategy":"cluster-preferred","openClawBaseUrl":"http://192.168.0.104:8800","clusterEndpoints":["/v1/tasks/execute","/tasks/execute","/api/tasks/execute"],"lastDecision":{"traceId":"82ff7eaa-73af-4418-9c45-a95b559dad26","parentTraceId":"ddb07860-bb8d-4678-b665-da201776eb2c","createdAt":"2026-04-22T07:04:17.985Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"lastFallback":null,"failureCategoryCounts":{},"recentTimeline":[{"traceId":"82ff7eaa-73af-4418-9c45-a95b559dad26","parentTraceId":"ddb07860-bb8d-4678-b665-da201776eb2c","createdAt":"2026-04-22T07:04:17.985Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},{"traceId":"feda9388-e523-4bbc-9ea7-0e941301438a","parentTraceId":"b7ff9d3a-e4ce-47cf-b342-03b6a30fc856","createdAt":"2026-04-22T07:04:17.964Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}]},{"traceId":"555800de-7910-4afa-8450-6085f4ad39b0","parentTraceId":"715d4ceb-266b-49d7-9a0a-2d79d1eb6f28","createdAt":"2026-04-22T07:04:17.938Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc\",\"f2211d25-35b3-490c-ae7e-50841926dbf1\",\"90673890-c50b-4dce-8dc2-08fef9450d37\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}]},{"traceId":"882d08b4-066f-4d66-9873-80dc85093ca9","parentTraceId":"4a000953-af02-433d-a81d-963ae417169f","createdAt":"2026-04-22T07:04:17.919Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-15T07:04:17.916Z\",\"periodEnd\":\"2026-04-22T07:04:17.916Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}]},{"traceId":"6c50ab59-bb18-498c-a5a7-a28c97711c10","parentTraceId":"fde23575-1fc6-4d5e-972b-34f7089652ab","createdAt":"2026-04-22T07:04:17.896Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc\",\"f2211d25-35b3-490c-ae7e-50841926dbf1\",\"9"}]},{"traceId":"2f803983-4589-47b2-b98d-b61a04f938dd","parentTraceId":"53a72dc8-74ea-4572-a29d-2033b7b0d77c","createdAt":"2026-04-22T07:04:17.873Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-22T06:49:17.868Z\",\"windowEnd\":\"2026-04-22T07:04:17.868Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}]},{"traceId":"78e071e6-393d-447c-9ae4-0c3f04ec876d","parentTraceId":"34015627-bfd8-4401-a20b-19e6aa60151c","createdAt":"2026-04-22T07:04:17.662Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]}]}
```

### Chief Probe Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"chief-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}],"parsed":{"probe":"ok"},"adapter":{"traceId":"78e071e6-393d-447c-9ae4-0c3f04ec876d","parentTraceId":"34015627-bfd8-4401-a20b-19e6aa60151c","createdAt":"2026-04-22T07:04:17.664Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]},"runId":"36c09d6f-2a98-465a-af5c-a0c9291a52f6","traceId":"78e071e6-393d-447c-9ae4-0c3f04ec876d","parentTraceId":"34015627-bfd8-4401-a20b-19e6aa60151c","createdAt":"2026-04-22T07:04:17.664Z"}
```

### Scenario Seed Response

```json
{"scenarioId":"focus-recovery-loop","title":"Focus recovery loop","description":"低专注 + 高压力媒体信号 + 活跃专注会话，用来调试 state / recovery / notification。","userId":"debug-focus-user","goalId":"c581caa2-73e8-434b-bc4a-84815445dd46","taskId":"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","sessionId":"5c94dcf2-f450-403a-b988-1fe546410da9","recommendedWorkflows":["state_assessment","recovery_plan","notification_dispatch"],"notes":["包含活跃专注会话、一次历史中断与恢复计划。","音频、视频、健康桥三类信号都已写入，适合联调 state / recovery / notification。"],"counts":{"goals":1,"tasks":3,"sessions":2,"assessments":1,"recoveryPlans":1,"reflections":0,"inbox":1},"runId":"9ed2d1a2-322e-445e-8687-b55f4e0ee46d","traceId":"8d64e42f-3041-4d2e-ab31-1b2fd8ca6f89","parentTraceId":"a9237665-a656-4b55-ace8-b9961e9fdcb9","createdAt":"2026-04-22T07:04:17.708Z"}
```

### State Insight Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"state-insight-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-22T06:49:17.868Z\",\"windowEnd\":\"2026-04-22T07:04:17.868Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}],"extractedJson":{"userId":"debug-focus-user","windowStart":"2026-04-22T06:49:17.868Z","windowEnd":"2026-04-22T07:04:17.868Z","focusScore":40,"energyScore":45,"moodScore":49,"summary":"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。","recommendedAction":"先收拢干扰源，回到主任务，只推进一个最小可验证步骤，再决定是否继续扩展。","emotionSummary":"音频侧提示紧张和压力抬升，说明当前更适合减少切换而不是继续并行处理。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示疲劳和视觉稳定度下降，说明持续专注能力正在变弱。","healthSummary":"健康数据显示恢复基础一般，健康数据提示应优先保证节奏稳定而不是强行加码。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"mixed"},"normalizedJson":{"userId":"debug-focus-user","windowStart":"2026-04-22T06:49:17.868Z","windowEnd":"2026-04-22T07:04:17.868Z","focusScore":40,"energyScore":45,"moodScore":49,"summary":"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。","recommendedAction":"先收拢干扰源，回到主任务，只推进一个最小可验证步骤，再决定是否继续扩展。","emotionSummary":"音频侧提示紧张和压力抬升，说明当前更适合减少切换而不是继续并行处理。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示疲劳和视觉稳定度下降，说明持续专注能力正在变弱。","healthSummary":"健康数据显示恢复基础一般，健康数据提示应优先保证节奏稳定而不是强行加码。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"mixed"},"adapter":{"traceId":"2f803983-4589-47b2-b98d-b61a04f938dd","parentTraceId":"53a72dc8-74ea-4572-a29d-2033b7b0d77c","createdAt":"2026-04-22T07:04:17.874Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-22T06:49:17.868Z\",\"windowEnd\":\"2026-04-22T07:04:17.868Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}]},"runId":"597f7c01-6d74-4e68-b2a2-f296b65e16c5","traceId":"2f803983-4589-47b2-b98d-b61a04f938dd","parentTraceId":"53a72dc8-74ea-4572-a29d-2033b7b0d77c","createdAt":"2026-04-22T07:04:17.874Z"}
```

### Recovery Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"interruption-recovery-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc\",\"f2211d25-35b3-490c-ae7e-50841926dbf1\",\"9"}],"extractedJson":{"reason":"attention_shift_after_interruption","nextStep":"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。","suggestedMinutes":25,"reprioritizedTaskIds":["9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","f2211d25-35b3-490c-ae7e-50841926dbf1","90673890-c50b-4dce-8dc2-08fef9450d37"]},"normalizedJson":{"reason":"attention_shift_after_interruption","nextStep":"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。","suggestedMinutes":25,"reprioritizedTaskIds":["9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","f2211d25-35b3-490c-ae7e-50841926dbf1","90673890-c50b-4dce-8dc2-08fef9450d37"]},"adapter":{"traceId":"6c50ab59-bb18-498c-a5a7-a28c97711c10","parentTraceId":"fde23575-1fc6-4d5e-972b-34f7089652ab","createdAt":"2026-04-22T07:04:17.897Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc\",\"f2211d25-35b3-490c-ae7e-50841926dbf1\",\"9"}]},"runId":"fc227a74-165c-44b8-b6a8-88db93003da0","traceId":"6c50ab59-bb18-498c-a5a7-a28c97711c10","parentTraceId":"fde23575-1fc6-4d5e-972b-34f7089652ab","createdAt":"2026-04-22T07:04:17.897Z"}
```

### Reflection Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"reflection-coach-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-15T07:04:17.916Z\",\"periodEnd\":\"2026-04-22T07:04:17.916Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}],"extractedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-04-15T07:04:17.916Z","periodEnd":"2026-04-22T07:04:17.916Z","highlights":["本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。"],"blockers":["本周的主要阻力来自中断后回到主线的成本偏高。"],"trends":["本周专注均值仍有波动，但在恢复方案介入后开始重新聚焦。"],"nextSuggestions":["中断后先执行 10 到 25 分钟的最小恢复块，而不是立即重开多个任务。"]},"normalizedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-04-15T07:04:17.916Z","periodEnd":"2026-04-22T07:04:17.916Z","highlights":["本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。"],"blockers":["本周的主要阻力来自中断后回到主线的成本偏高。"],"trends":["本周专注均值仍有波动，但在恢复方案介入后开始重新聚焦。"],"nextSuggestions":["中断后先执行 10 到 25 分钟的最小恢复块，而不是立即重开多个任务。"]},"adapter":{"traceId":"882d08b4-066f-4d66-9873-80dc85093ca9","parentTraceId":"4a000953-af02-433d-a81d-963ae417169f","createdAt":"2026-04-22T07:04:17.920Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-15T07:04:17.916Z\",\"periodEnd\":\"2026-04-22T07:04:17.916Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}]},"runId":"0e75c0db-95b7-4175-be66-ea9b280db7fb","traceId":"882d08b4-066f-4d66-9873-80dc85093ca9","parentTraceId":"4a000953-af02-433d-a81d-963ae417169f","createdAt":"2026-04-22T07:04:17.920Z"}
```

### Task Management Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"task-management-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc\",\"f2211d25-35b3-490c-ae7e-50841926dbf1\",\"90673890-c50b-4dce-8dc2-08fef9450d37\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}],"extractedJson":{"orderedTaskIds":["9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","f2211d25-35b3-490c-ae7e-50841926dbf1","90673890-c50b-4dce-8dc2-08fef9450d37"],"summary":"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。","suggestedTasks":[]},"normalizedJson":{"orderedTaskIds":["9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","f2211d25-35b3-490c-ae7e-50841926dbf1","90673890-c50b-4dce-8dc2-08fef9450d37"],"summary":"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。","suggestedTasks":[]},"adapter":{"traceId":"555800de-7910-4afa-8450-6085f4ad39b0","parentTraceId":"715d4ceb-266b-49d7-9a0a-2d79d1eb6f28","createdAt":"2026-04-22T07:04:17.939Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc\",\"f2211d25-35b3-490c-ae7e-50841926dbf1\",\"90673890-c50b-4dce-8dc2-08fef9450d37\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}]},"runId":"4a270930-3655-4d91-9941-6377cb02f577","traceId":"555800de-7910-4afa-8450-6085f4ad39b0","parentTraceId":"715d4ceb-266b-49d7-9a0a-2d79d1eb6f28","createdAt":"2026-04-22T07:04:17.939Z"}
```

### Progress Feedback Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"progress-feedback-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}],"extractedJson":{"goalCount":1,"taskCount":3,"completedTaskCount":0,"inProgressTaskCount":1,"blockedTaskCount":0,"completionRate":0,"openInterventions":1,"suggestedFocusTaskId":"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","summaryHeadline":"当前已有恢复方案，建议先按恢复方案收拢主线，再继续推进最重要任务。","activeSession":{"id":"5c94dcf2-f450-403a-b988-1fe546410da9","userId":"debug-focus-user","goalId":"c581caa2-73e8-434b-bc4a-84815445dd46","taskId":"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","status":"active","startedAt":"2026-04-22T06:36:17.690Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"e6d55a6a-eaad-4264-bf23-ca68f8d6f0c7","userId":"debug-focus-user","windowStart":"2026-04-22T06:39:17.691Z","windowEnd":"2026-04-22T07:00:17.691Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示眨眼频率偏高，视线稳定度下降。","healthSummary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-04-22T07:02:17.700Z"},"latestRecoveryPlan":{"id":"de7290fb-d1f5-43b7-bb3c-14a22e5a6859","userId":"debug-focus-user","sessionId":"8eef5267-c9c0-4fb0-9bfe-99867349f516","taskId":"f2211d25-35b3-490c-ae7e-50841926dbf1","reason":"energy_drop","nextStep":"Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","f2211d25-35b3-490c-ae7e-50841926dbf1","90673890-c50b-4dce-8dc2-08fef9450d37"],"createdAt":"2026-04-22T06:04:17.704Z"},"latestBehaviorConclusion":{"id":"8fbde4bc-ad60-4f1d-b57a-3c47e51bf519","createdAt":"2026-04-22T07:04:17.706Z","userId":"debug-focus-user","assessmentId":"e6d55a6a-eaad-4264-bf23-ca68f8d6f0c7","sessionId":"5c94dcf2-f450-403a-b988-1fe546410da9","taskId":"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","riskLevel":"high","summary":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"39e874ee-fbbe-40f5-8699-a975bd4eb1bc","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"5c94dcf2-f450-403a-b988-1fe546410da9","windowStart":"2026-04-22T06:51:17.693Z","windowEnd":"2026-04-22T06:57:17.693Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"视频侧显示眨眼频率偏高，视线稳定度下降。","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-04-22T07:04:17.693Z"},"latestHealthSnapshot":{"id":"aa959c37-271b-499b-909d-65071f235e73","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-04-21T19:04:17.693Z","windowEnd":"2026-04-22T03:04:17.693Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","createdAt":"2026-04-22T07:04:17.693Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"2622df2c-4b52-4773-98e3-d38db328d882","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"调试 Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-04-22T05:04:17.683Z","lastSeenAt":"2026-04-22T07:04:17.683Z","createdAt":"2026-04-22T07:04:17.683Z","updatedAt":"2026-04-22T07:04:17.683Z"},"latestSession":null,"latestEmotionAssessment":{"id":"56a61831-1299-4bed-8532-36723847498e","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"5c94dcf2-f450-403a-b988-1fe546410da9","chunkSequence":2,"windowStart":"2026-04-22T06:53:17.692Z","windowEnd":"2026-04-22T06:58:17.692Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-04-22T07:04:17.692Z"},"latestCallEvent":null},"edgeDevices":[{"id":"21e9f559-30f7-4cec-be3f-57ff51ac1b3f","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"调试专注手机端","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-22T07:04:17.683Z","createdAt":"2026-04-22T07:04:17.683Z","updatedAt":"2026-04-22T07:04:17.683Z"},{"id":"b39dc5f6-178a-444f-8585-df982e283708","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"调试专注桌面端","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-22T07:04:17.681Z","createdAt":"2026-04-22T07:04:17.681Z","updatedAt":"2026-04-22T07:04:17.681Z"}],"inbox":[{"id":"7e1909be-4918-4734-8ad6-e00cbd1c613b","createdAt":"2026-04-22T07:04:17.707Z","status":"pending","userId":"debug-focus-user","title":"建议立即恢复主线","message":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"c581caa2-73e8-434b-bc4a-84815445dd46","userId":"debug-focus-user","title":"在深度工作中找回注意力","description":"用于状态、恢复和通知 agent 联调的示例场景。","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-04-22T07:04:17.684Z","updatedAt":"2026-04-22T07:04:17.688Z"}],"tasks":[{"id":"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","userId":"debug-focus-user","goalId":"c581caa2-73e8-434b-bc4a-84815445dd46","title":"验证 chief-agent 在压力场景下的路由","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-04-22T07:04:17.685Z","updatedAt":"2026-04-22T07:04:17.688Z"},{"id":"f2211d25-35b3-490c-ae7e-50841926dbf1","userId":"debug-focus-user","goalId":"c581caa2-73e8-434b-bc4a-84815445dd46","title":"调整收件箱提醒文案","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-04-22T07:04:17.686Z","updatedAt":"2026-04-22T07:04:17.686Z"},{"id":"90673890-c50b-4dce-8dc2-08fef9450d37","userId":"debug-focus-user","goalId":"c581caa2-73e8-434b-bc4a-84815445dd46","title":"检查复盘亮点摘要","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-04-22T07:04:17.687Z","updatedAt":"2026-04-22T07:04:17.687Z"}]},"normalizedJson":{"goalCount":1,"taskCount":3,"completedTaskCount":0,"inProgressTaskCount":1,"blockedTaskCount":0,"completionRate":0,"openInterventions":1,"suggestedFocusTaskId":"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","summaryHeadline":"当前已有恢复方案，建议先按恢复方案收拢主线，再继续推进最重要任务。","coachFrontAgent":{"currentFrontAgent":"director-agent","routingMode":"auto","manualOverride":false,"consultedAgent":null,"handoffReason":null,"overrideSourceAgent":null,"visibleSummary":"Picard is currently coordinating the team."},"activeSession":{"id":"5c94dcf2-f450-403a-b988-1fe546410da9","userId":"debug-focus-user","goalId":"c581caa2-73e8-434b-bc4a-84815445dd46","taskId":"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","status":"active","startedAt":"2026-04-22T06:36:17.690Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"e6d55a6a-eaad-4264-bf23-ca68f8d6f0c7","userId":"debug-focus-user","windowStart":"2026-04-22T06:39:17.691Z","windowEnd":"2026-04-22T07:00:17.691Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示眨眼频率偏高，视线稳定度下降。","healthSummary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-04-22T07:02:17.700Z"},"latestRecoveryPlan":{"id":"de7290fb-d1f5-43b7-bb3c-14a22e5a6859","userId":"debug-focus-user","sessionId":"8eef5267-c9c0-4fb0-9bfe-99867349f516","taskId":"f2211d25-35b3-490c-ae7e-50841926dbf1","reason":"energy_drop","nextStep":"Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","f2211d25-35b3-490c-ae7e-50841926dbf1","90673890-c50b-4dce-8dc2-08fef9450d37"],"createdAt":"2026-04-22T06:04:17.704Z"},"latestBehaviorConclusion":{"id":"8fbde4bc-ad60-4f1d-b57a-3c47e51bf519","createdAt":"2026-04-22T07:04:17.706Z","userId":"debug-focus-user","assessmentId":"e6d55a6a-eaad-4264-bf23-ca68f8d6f0c7","sessionId":"5c94dcf2-f450-403a-b988-1fe546410da9","taskId":"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","riskLevel":"high","summary":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"39e874ee-fbbe-40f5-8699-a975bd4eb1bc","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"5c94dcf2-f450-403a-b988-1fe546410da9","windowStart":"2026-04-22T06:51:17.693Z","windowEnd":"2026-04-22T06:57:17.693Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"视频侧显示眨眼频率偏高，视线稳定度下降。","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-04-22T07:04:17.693Z"},"latestHealthSnapshot":{"id":"aa959c37-271b-499b-909d-65071f235e73","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-04-21T19:04:17.693Z","windowEnd":"2026-04-22T03:04:17.693Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","createdAt":"2026-04-22T07:04:17.693Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"2622df2c-4b52-4773-98e3-d38db328d882","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"调试 Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-04-22T05:04:17.683Z","lastSeenAt":"2026-04-22T07:04:17.683Z","createdAt":"2026-04-22T07:04:17.683Z","updatedAt":"2026-04-22T07:04:17.683Z"},"latestSession":null,"latestEmotionAssessment":{"id":"56a61831-1299-4bed-8532-36723847498e","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"5c94dcf2-f450-403a-b988-1fe546410da9","chunkSequence":2,"windowStart":"2026-04-22T06:53:17.692Z","windowEnd":"2026-04-22T06:58:17.692Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-04-22T07:04:17.692Z"},"latestCallEvent":null},"edgeDevices":[{"id":"21e9f559-30f7-4cec-be3f-57ff51ac1b3f","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"调试专注手机端","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-22T07:04:17.683Z","createdAt":"2026-04-22T07:04:17.683Z","updatedAt":"2026-04-22T07:04:17.683Z"},{"id":"b39dc5f6-178a-444f-8585-df982e283708","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"调试专注桌面端","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-22T07:04:17.681Z","createdAt":"2026-04-22T07:04:17.681Z","updatedAt":"2026-04-22T07:04:17.681Z"}],"inbox":[{"id":"7e1909be-4918-4734-8ad6-e00cbd1c613b","createdAt":"2026-04-22T07:04:17.707Z","status":"pending","userId":"debug-focus-user","title":"建议立即恢复主线","message":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"c581caa2-73e8-434b-bc4a-84815445dd46","userId":"debug-focus-user","title":"在深度工作中找回注意力","description":"用于状态、恢复和通知 agent 联调的示例场景。","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-04-22T07:04:17.684Z","updatedAt":"2026-04-22T07:04:17.688Z"}],"tasks":[{"id":"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc","userId":"debug-focus-user","goalId":"c581caa2-73e8-434b-bc4a-84815445dd46","title":"验证 chief-agent 在压力场景下的路由","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-04-22T07:04:17.685Z","updatedAt":"2026-04-22T07:04:17.688Z"},{"id":"f2211d25-35b3-490c-ae7e-50841926dbf1","userId":"debug-focus-user","goalId":"c581caa2-73e8-434b-bc4a-84815445dd46","title":"调整收件箱提醒文案","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-04-22T07:04:17.686Z","updatedAt":"2026-04-22T07:04:17.686Z"},{"id":"90673890-c50b-4dce-8dc2-08fef9450d37","userId":"debug-focus-user","goalId":"c581caa2-73e8-434b-bc4a-84815445dd46","title":"检查复盘亮点摘要","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-04-22T07:04:17.687Z","updatedAt":"2026-04-22T07:04:17.687Z"}]},"adapter":{"traceId":"feda9388-e523-4bbc-9ea7-0e941301438a","parentTraceId":"b7ff9d3a-e4ce-47cf-b342-03b6a30fc856","createdAt":"2026-04-22T07:04:17.965Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"9e9d74d9-6a0f-4d0f-9c62-85e8a71a98dc\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}]},"runId":"2e58723f-fd6d-4380-9b1b-339120ab0723","traceId":"feda9388-e523-4bbc-9ea7-0e941301438a","parentTraceId":"b7ff9d3a-e4ce-47cf-b342-03b6a30fc856","createdAt":"2026-04-22T07:04:17.965Z"}
```

### Automation Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"automation-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}],"extractedJson":{"title":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","message":"Pause for a short reset before resuming the next small task step.","channel":"mobile_push","deliver":true},"normalizedJson":{"title":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","message":"Pause for a short reset before resuming the next small task step.","channel":"mobile_push","deliver":true},"adapter":{"traceId":"82ff7eaa-73af-4418-9c45-a95b559dad26","parentTraceId":"ddb07860-bb8d-4678-b665-da201776eb2c","createdAt":"2026-04-22T07:04:17.987Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"runId":"c6aac4fa-297c-45b5-93d2-ddf70027e1f3","traceId":"82ff7eaa-73af-4418-9c45-a95b559dad26","parentTraceId":"ddb07860-bb8d-4678-b665-da201776eb2c","createdAt":"2026-04-22T07:04:17.987Z"}
```
