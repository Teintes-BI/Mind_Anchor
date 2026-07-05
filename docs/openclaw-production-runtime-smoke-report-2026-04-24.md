# OpenClaw Cluster Smoke Report（2026-04-24）

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

- 日期：2026-04-24
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
- `traceId`：`4d9d1cbd-7ee3-4bc1-97d3-acaf56f982c2`
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
- `traceId`：01cd1bd4-ec0b-476e-bfc0-f43e0330f901
- 结果：通过

### `/debug/agent/interruption-recovery`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：2302b0ca-1bdb-4701-8ca0-64b6f975211c
- 结果：通过

### `/debug/agent/reflection`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：cd2df8b1-45fe-4f90-8bc3-cda9322e5159
- 结果：通过

### `/debug/agent/task-management`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：b03c1e9c-3310-4df5-bc45-3ccdeaaf858e
- 结果：通过

### `/debug/agent/progress-feedback`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：d9903637-884e-48c9-8b2b-95eb48c9e465
- 结果：通过

### `/debug/agent/automation`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：da81a463-2a03-45fd-9e3f-52d07230b63f
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

- Captured at: 2026-04-24T08:52:26Z
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
{"gatewayMode":"openai-compatible","clusterEnabled":true,"executionStrategy":"cluster-preferred","openClawBaseUrl":"http://192.168.0.104:8800","clusterEndpoints":["/v1/tasks/execute","/tasks/execute","/api/tasks/execute"],"lastDecision":{"traceId":"da81a463-2a03-45fd-9e3f-52d07230b63f","parentTraceId":"632e62be-e663-47c2-ad3a-ad0065117ab9","createdAt":"2026-04-24T08:52:26.828Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"lastFallback":null,"failureCategoryCounts":{},"recentTimeline":[{"traceId":"da81a463-2a03-45fd-9e3f-52d07230b63f","parentTraceId":"632e62be-e663-47c2-ad3a-ad0065117ab9","createdAt":"2026-04-24T08:52:26.828Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},{"traceId":"d9903637-884e-48c9-8b2b-95eb48c9e465","parentTraceId":"6d2b7b7d-eaae-49c5-b29b-e2ec1a70d482","createdAt":"2026-04-24T08:52:26.810Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"3bd294e0-0fc6-44ad-be1a-9ad636252005\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}]},{"traceId":"b03c1e9c-3310-4df5-bc45-3ccdeaaf858e","parentTraceId":"a8b76654-fe6d-45f3-a21c-e4f42a80d27a","createdAt":"2026-04-24T08:52:26.790Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"3bd294e0-0fc6-44ad-be1a-9ad636252005\",\"9fd7ac9a-d544-4eb2-a303-eba9f1465f59\",\"c47ed61c-217b-408e-8022-6cb4181a5e86\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}]},{"traceId":"cd2df8b1-45fe-4f90-8bc3-cda9322e5159","parentTraceId":"a39d9cc6-3873-40d4-87e4-7ccd25b8e375","createdAt":"2026-04-24T08:52:26.773Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-17T08:52:26.771Z\",\"periodEnd\":\"2026-04-24T08:52:26.771Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}]},{"traceId":"2302b0ca-1bdb-4701-8ca0-64b6f975211c","parentTraceId":"053a977b-85b6-433c-a001-c7585e62df2e","createdAt":"2026-04-24T08:52:26.756Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"3bd294e0-0fc6-44ad-be1a-9ad636252005\",\"9fd7ac9a-d544-4eb2-a303-eba9f1465f59\",\"c"}]},{"traceId":"01cd1bd4-ec0b-476e-bfc0-f43e0330f901","parentTraceId":"6bd81756-425d-4443-99af-7ef13dda4590","createdAt":"2026-04-24T08:52:26.739Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-24T08:37:26.736Z\",\"windowEnd\":\"2026-04-24T08:52:26.736Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}]},{"traceId":"4d9d1cbd-7ee3-4bc1-97d3-acaf56f982c2","parentTraceId":"22807195-8168-4740-97b9-68864b928140","createdAt":"2026-04-24T08:52:26.571Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]}]}
```

### Chief Probe Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"chief-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}],"parsed":{"probe":"ok"},"adapter":{"traceId":"4d9d1cbd-7ee3-4bc1-97d3-acaf56f982c2","parentTraceId":"22807195-8168-4740-97b9-68864b928140","createdAt":"2026-04-24T08:52:26.572Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]},"runId":"ff644d8d-7cc3-4109-a381-9ec455f4af48","traceId":"4d9d1cbd-7ee3-4bc1-97d3-acaf56f982c2","parentTraceId":"22807195-8168-4740-97b9-68864b928140","createdAt":"2026-04-24T08:52:26.572Z"}
```

### Scenario Seed Response

```json
{"scenarioId":"focus-recovery-loop","title":"Focus recovery loop","description":"低专注 + 高压力媒体信号 + 活跃专注会话，用来调试 state / recovery / notification。","userId":"debug-focus-user","goalId":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","taskId":"3bd294e0-0fc6-44ad-be1a-9ad636252005","sessionId":"0a5403bb-d4f0-4c91-a4a3-e02c1386c55c","recommendedWorkflows":["state_assessment","recovery_plan","notification_dispatch"],"notes":["包含活跃专注会话、一次历史中断与恢复计划。","音频、视频、健康桥三类信号都已写入，适合联调 state / recovery / notification。"],"counts":{"goals":1,"tasks":3,"sessions":2,"assessments":1,"recoveryPlans":1,"reflections":0,"inbox":1},"runId":"1f23d4d4-ae4d-4a17-8272-4391952c1a89","traceId":"3892167e-f239-49dd-9a90-1e689ad3fdbe","parentTraceId":"0d0372eb-303e-46f1-8e06-7faf5e528f76","createdAt":"2026-04-24T08:52:26.610Z"}
```

### State Insight Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"state-insight-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-24T08:37:26.736Z\",\"windowEnd\":\"2026-04-24T08:52:26.736Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}],"extractedJson":{"userId":"debug-focus-user","windowStart":"2026-04-24T08:37:26.736Z","windowEnd":"2026-04-24T08:52:26.736Z","focusScore":40,"energyScore":45,"moodScore":49,"summary":"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。","recommendedAction":"先收拢干扰源，回到主任务，只推进一个最小可验证步骤，再决定是否继续扩展。","emotionSummary":"音频侧提示紧张和压力抬升，说明当前更适合减少切换而不是继续并行处理。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示疲劳和视觉稳定度下降，说明持续专注能力正在变弱。","healthSummary":"健康数据显示恢复基础一般，健康数据提示应优先保证节奏稳定而不是强行加码。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"mixed"},"normalizedJson":{"userId":"debug-focus-user","windowStart":"2026-04-24T08:37:26.736Z","windowEnd":"2026-04-24T08:52:26.736Z","focusScore":40,"energyScore":45,"moodScore":49,"summary":"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。","recommendedAction":"先收拢干扰源，回到主任务，只推进一个最小可验证步骤，再决定是否继续扩展。","emotionSummary":"音频侧提示紧张和压力抬升，说明当前更适合减少切换而不是继续并行处理。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示疲劳和视觉稳定度下降，说明持续专注能力正在变弱。","healthSummary":"健康数据显示恢复基础一般，健康数据提示应优先保证节奏稳定而不是强行加码。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"mixed"},"adapter":{"traceId":"01cd1bd4-ec0b-476e-bfc0-f43e0330f901","parentTraceId":"6bd81756-425d-4443-99af-7ef13dda4590","createdAt":"2026-04-24T08:52:26.740Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-24T08:37:26.736Z\",\"windowEnd\":\"2026-04-24T08:52:26.736Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}]},"runId":"b6117a6c-9ef8-4db0-80ed-adc56267ceb2","traceId":"01cd1bd4-ec0b-476e-bfc0-f43e0330f901","parentTraceId":"6bd81756-425d-4443-99af-7ef13dda4590","createdAt":"2026-04-24T08:52:26.740Z"}
```

### Recovery Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"interruption-recovery-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"3bd294e0-0fc6-44ad-be1a-9ad636252005\",\"9fd7ac9a-d544-4eb2-a303-eba9f1465f59\",\"c"}],"extractedJson":{"reason":"attention_shift_after_interruption","nextStep":"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。","suggestedMinutes":25,"reprioritizedTaskIds":["3bd294e0-0fc6-44ad-be1a-9ad636252005","9fd7ac9a-d544-4eb2-a303-eba9f1465f59","c47ed61c-217b-408e-8022-6cb4181a5e86"]},"normalizedJson":{"reason":"attention_shift_after_interruption","nextStep":"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。","suggestedMinutes":25,"reprioritizedTaskIds":["3bd294e0-0fc6-44ad-be1a-9ad636252005","9fd7ac9a-d544-4eb2-a303-eba9f1465f59","c47ed61c-217b-408e-8022-6cb4181a5e86"]},"adapter":{"traceId":"2302b0ca-1bdb-4701-8ca0-64b6f975211c","parentTraceId":"053a977b-85b6-433c-a001-c7585e62df2e","createdAt":"2026-04-24T08:52:26.757Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"3bd294e0-0fc6-44ad-be1a-9ad636252005\",\"9fd7ac9a-d544-4eb2-a303-eba9f1465f59\",\"c"}]},"runId":"a6c67a87-1c21-41c0-bd87-a9c76bc8cc0d","traceId":"2302b0ca-1bdb-4701-8ca0-64b6f975211c","parentTraceId":"053a977b-85b6-433c-a001-c7585e62df2e","createdAt":"2026-04-24T08:52:26.757Z"}
```

### Reflection Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"reflection-coach-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-17T08:52:26.771Z\",\"periodEnd\":\"2026-04-24T08:52:26.771Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}],"extractedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-04-17T08:52:26.771Z","periodEnd":"2026-04-24T08:52:26.771Z","highlights":["本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。"],"blockers":["本周的主要阻力来自中断后回到主线的成本偏高。"],"trends":["本周专注均值仍有波动，但在恢复方案介入后开始重新聚焦。"],"nextSuggestions":["中断后先执行 10 到 25 分钟的最小恢复块，而不是立即重开多个任务。"]},"normalizedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-04-17T08:52:26.771Z","periodEnd":"2026-04-24T08:52:26.771Z","highlights":["本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。"],"blockers":["本周的主要阻力来自中断后回到主线的成本偏高。"],"trends":["本周专注均值仍有波动，但在恢复方案介入后开始重新聚焦。"],"nextSuggestions":["中断后先执行 10 到 25 分钟的最小恢复块，而不是立即重开多个任务。"]},"adapter":{"traceId":"cd2df8b1-45fe-4f90-8bc3-cda9322e5159","parentTraceId":"a39d9cc6-3873-40d4-87e4-7ccd25b8e375","createdAt":"2026-04-24T08:52:26.774Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-17T08:52:26.771Z\",\"periodEnd\":\"2026-04-24T08:52:26.771Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}]},"runId":"763f7c6a-4cfd-4f0e-9ab9-4e91411e6c92","traceId":"cd2df8b1-45fe-4f90-8bc3-cda9322e5159","parentTraceId":"a39d9cc6-3873-40d4-87e4-7ccd25b8e375","createdAt":"2026-04-24T08:52:26.774Z"}
```

### Task Management Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"task-management-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"3bd294e0-0fc6-44ad-be1a-9ad636252005\",\"9fd7ac9a-d544-4eb2-a303-eba9f1465f59\",\"c47ed61c-217b-408e-8022-6cb4181a5e86\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}],"extractedJson":{"orderedTaskIds":["3bd294e0-0fc6-44ad-be1a-9ad636252005","9fd7ac9a-d544-4eb2-a303-eba9f1465f59","c47ed61c-217b-408e-8022-6cb4181a5e86"],"summary":"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。","suggestedTasks":[]},"normalizedJson":{"orderedTaskIds":["3bd294e0-0fc6-44ad-be1a-9ad636252005","9fd7ac9a-d544-4eb2-a303-eba9f1465f59","c47ed61c-217b-408e-8022-6cb4181a5e86"],"summary":"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。","suggestedTasks":[]},"adapter":{"traceId":"b03c1e9c-3310-4df5-bc45-3ccdeaaf858e","parentTraceId":"a8b76654-fe6d-45f3-a21c-e4f42a80d27a","createdAt":"2026-04-24T08:52:26.791Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"3bd294e0-0fc6-44ad-be1a-9ad636252005\",\"9fd7ac9a-d544-4eb2-a303-eba9f1465f59\",\"c47ed61c-217b-408e-8022-6cb4181a5e86\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}]},"runId":"58e36b2d-ac89-4230-81d5-087e56482af4","traceId":"b03c1e9c-3310-4df5-bc45-3ccdeaaf858e","parentTraceId":"a8b76654-fe6d-45f3-a21c-e4f42a80d27a","createdAt":"2026-04-24T08:52:26.791Z"}
```

### Progress Feedback Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"progress-feedback-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"3bd294e0-0fc6-44ad-be1a-9ad636252005\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}],"extractedJson":{"goalCount":1,"taskCount":3,"completedTaskCount":0,"inProgressTaskCount":1,"blockedTaskCount":0,"completionRate":0,"openInterventions":1,"suggestedFocusTaskId":"3bd294e0-0fc6-44ad-be1a-9ad636252005","summaryHeadline":"当前已有恢复方案，建议先按恢复方案收拢主线，再继续推进最重要任务。","activeSession":{"id":"0a5403bb-d4f0-4c91-a4a3-e02c1386c55c","userId":"debug-focus-user","goalId":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","taskId":"3bd294e0-0fc6-44ad-be1a-9ad636252005","status":"active","startedAt":"2026-04-24T08:24:26.597Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"6a0c2d2a-be1a-4186-be68-99432068418a","userId":"debug-focus-user","windowStart":"2026-04-24T08:27:26.597Z","windowEnd":"2026-04-24T08:48:26.597Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示眨眼频率偏高，视线稳定度下降。","healthSummary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-04-24T08:50:26.606Z"},"latestRecoveryPlan":{"id":"c7e4c04c-f422-4297-8e0c-e16c214ba5b4","userId":"debug-focus-user","sessionId":"de810835-b7a9-49ee-8653-9d5708dffcae","taskId":"9fd7ac9a-d544-4eb2-a303-eba9f1465f59","reason":"energy_drop","nextStep":"Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["3bd294e0-0fc6-44ad-be1a-9ad636252005","9fd7ac9a-d544-4eb2-a303-eba9f1465f59","c47ed61c-217b-408e-8022-6cb4181a5e86"],"createdAt":"2026-04-24T07:52:26.608Z"},"latestBehaviorConclusion":{"id":"c8d5fedb-767c-4922-8e61-43e00696df03","createdAt":"2026-04-24T08:52:26.608Z","userId":"debug-focus-user","assessmentId":"6a0c2d2a-be1a-4186-be68-99432068418a","sessionId":"0a5403bb-d4f0-4c91-a4a3-e02c1386c55c","taskId":"3bd294e0-0fc6-44ad-be1a-9ad636252005","riskLevel":"high","summary":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"81633d99-4f15-4aae-a1ec-be1727553bf5","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"0a5403bb-d4f0-4c91-a4a3-e02c1386c55c","windowStart":"2026-04-24T08:39:26.599Z","windowEnd":"2026-04-24T08:45:26.599Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"视频侧显示眨眼频率偏高，视线稳定度下降。","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-04-24T08:52:26.599Z"},"latestHealthSnapshot":{"id":"e6f221b1-f2a9-40c9-8f81-598ca3282c0b","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-04-23T20:52:26.600Z","windowEnd":"2026-04-24T04:52:26.600Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","createdAt":"2026-04-24T08:52:26.600Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"f0cd7b76-5893-4133-8e2a-0d226f0a6306","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"调试 Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-04-24T06:52:26.590Z","lastSeenAt":"2026-04-24T08:52:26.590Z","createdAt":"2026-04-24T08:52:26.590Z","updatedAt":"2026-04-24T08:52:26.590Z"},"latestSession":null,"latestEmotionAssessment":{"id":"62d5ccba-f1ba-49e5-909b-2eb5a2aee0b0","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"0a5403bb-d4f0-4c91-a4a3-e02c1386c55c","chunkSequence":2,"windowStart":"2026-04-24T08:41:26.598Z","windowEnd":"2026-04-24T08:46:26.598Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-04-24T08:52:26.598Z"},"latestCallEvent":null},"edgeDevices":[{"id":"7156d683-f019-4297-a301-7583f33e4bf4","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"调试专注桌面端","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-24T08:52:26.589Z","createdAt":"2026-04-24T08:52:26.589Z","updatedAt":"2026-04-24T08:52:26.589Z"},{"id":"d08eb924-56b4-422c-b8ab-7f85da6db505","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"调试专注手机端","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-24T08:52:26.589Z","createdAt":"2026-04-24T08:52:26.589Z","updatedAt":"2026-04-24T08:52:26.589Z"}],"inbox":[{"id":"a685c7fa-0f0c-4a50-a312-0d5562b84ca2","createdAt":"2026-04-24T08:52:26.609Z","status":"pending","userId":"debug-focus-user","title":"建议立即恢复主线","message":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","userId":"debug-focus-user","title":"在深度工作中找回注意力","description":"用于状态、恢复和通知 agent 联调的示例场景。","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-04-24T08:52:26.591Z","updatedAt":"2026-04-24T08:52:26.594Z"}],"tasks":[{"id":"3bd294e0-0fc6-44ad-be1a-9ad636252005","userId":"debug-focus-user","goalId":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","title":"验证 chief-agent 在压力场景下的路由","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-04-24T08:52:26.592Z","updatedAt":"2026-04-24T08:52:26.594Z"},{"id":"9fd7ac9a-d544-4eb2-a303-eba9f1465f59","userId":"debug-focus-user","goalId":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","title":"调整收件箱提醒文案","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-04-24T08:52:26.593Z","updatedAt":"2026-04-24T08:52:26.593Z"},{"id":"c47ed61c-217b-408e-8022-6cb4181a5e86","userId":"debug-focus-user","goalId":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","title":"检查复盘亮点摘要","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-04-24T08:52:26.593Z","updatedAt":"2026-04-24T08:52:26.593Z"}]},"normalizedJson":{"goalCount":1,"taskCount":3,"completedTaskCount":0,"inProgressTaskCount":1,"blockedTaskCount":0,"completionRate":0,"openInterventions":1,"suggestedFocusTaskId":"3bd294e0-0fc6-44ad-be1a-9ad636252005","summaryHeadline":"当前已有恢复方案，建议先按恢复方案收拢主线，再继续推进最重要任务。","coachFrontAgent":{"currentFrontAgent":"director-agent","routingMode":"auto","manualOverride":false,"consultedAgent":null,"handoffReason":null,"overrideSourceAgent":null,"visibleSummary":"Picard is currently coordinating the team."},"activeSession":{"id":"0a5403bb-d4f0-4c91-a4a3-e02c1386c55c","userId":"debug-focus-user","goalId":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","taskId":"3bd294e0-0fc6-44ad-be1a-9ad636252005","status":"active","startedAt":"2026-04-24T08:24:26.597Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"6a0c2d2a-be1a-4186-be68-99432068418a","userId":"debug-focus-user","windowStart":"2026-04-24T08:27:26.597Z","windowEnd":"2026-04-24T08:48:26.597Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示眨眼频率偏高，视线稳定度下降。","healthSummary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-04-24T08:50:26.606Z"},"latestRecoveryPlan":{"id":"c7e4c04c-f422-4297-8e0c-e16c214ba5b4","userId":"debug-focus-user","sessionId":"de810835-b7a9-49ee-8653-9d5708dffcae","taskId":"9fd7ac9a-d544-4eb2-a303-eba9f1465f59","reason":"energy_drop","nextStep":"Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["3bd294e0-0fc6-44ad-be1a-9ad636252005","9fd7ac9a-d544-4eb2-a303-eba9f1465f59","c47ed61c-217b-408e-8022-6cb4181a5e86"],"createdAt":"2026-04-24T07:52:26.608Z"},"latestBehaviorConclusion":{"id":"c8d5fedb-767c-4922-8e61-43e00696df03","createdAt":"2026-04-24T08:52:26.608Z","userId":"debug-focus-user","assessmentId":"6a0c2d2a-be1a-4186-be68-99432068418a","sessionId":"0a5403bb-d4f0-4c91-a4a3-e02c1386c55c","taskId":"3bd294e0-0fc6-44ad-be1a-9ad636252005","riskLevel":"high","summary":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"81633d99-4f15-4aae-a1ec-be1727553bf5","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"0a5403bb-d4f0-4c91-a4a3-e02c1386c55c","windowStart":"2026-04-24T08:39:26.599Z","windowEnd":"2026-04-24T08:45:26.599Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"视频侧显示眨眼频率偏高，视线稳定度下降。","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-04-24T08:52:26.599Z"},"latestHealthSnapshot":{"id":"e6f221b1-f2a9-40c9-8f81-598ca3282c0b","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-04-23T20:52:26.600Z","windowEnd":"2026-04-24T04:52:26.600Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","createdAt":"2026-04-24T08:52:26.600Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"f0cd7b76-5893-4133-8e2a-0d226f0a6306","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"调试 Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-04-24T06:52:26.590Z","lastSeenAt":"2026-04-24T08:52:26.590Z","createdAt":"2026-04-24T08:52:26.590Z","updatedAt":"2026-04-24T08:52:26.590Z"},"latestSession":null,"latestEmotionAssessment":{"id":"62d5ccba-f1ba-49e5-909b-2eb5a2aee0b0","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"0a5403bb-d4f0-4c91-a4a3-e02c1386c55c","chunkSequence":2,"windowStart":"2026-04-24T08:41:26.598Z","windowEnd":"2026-04-24T08:46:26.598Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-04-24T08:52:26.598Z"},"latestCallEvent":null},"edgeDevices":[{"id":"7156d683-f019-4297-a301-7583f33e4bf4","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"调试专注桌面端","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-24T08:52:26.589Z","createdAt":"2026-04-24T08:52:26.589Z","updatedAt":"2026-04-24T08:52:26.589Z"},{"id":"d08eb924-56b4-422c-b8ab-7f85da6db505","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"调试专注手机端","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-24T08:52:26.589Z","createdAt":"2026-04-24T08:52:26.589Z","updatedAt":"2026-04-24T08:52:26.589Z"}],"inbox":[{"id":"a685c7fa-0f0c-4a50-a312-0d5562b84ca2","createdAt":"2026-04-24T08:52:26.609Z","status":"pending","userId":"debug-focus-user","title":"建议立即恢复主线","message":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","userId":"debug-focus-user","title":"在深度工作中找回注意力","description":"用于状态、恢复和通知 agent 联调的示例场景。","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-04-24T08:52:26.591Z","updatedAt":"2026-04-24T08:52:26.594Z"}],"tasks":[{"id":"3bd294e0-0fc6-44ad-be1a-9ad636252005","userId":"debug-focus-user","goalId":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","title":"验证 chief-agent 在压力场景下的路由","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-04-24T08:52:26.592Z","updatedAt":"2026-04-24T08:52:26.594Z"},{"id":"9fd7ac9a-d544-4eb2-a303-eba9f1465f59","userId":"debug-focus-user","goalId":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","title":"调整收件箱提醒文案","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-04-24T08:52:26.593Z","updatedAt":"2026-04-24T08:52:26.593Z"},{"id":"c47ed61c-217b-408e-8022-6cb4181a5e86","userId":"debug-focus-user","goalId":"5c8e9997-26a3-440f-9b71-9ae979a1cf20","title":"检查复盘亮点摘要","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-04-24T08:52:26.593Z","updatedAt":"2026-04-24T08:52:26.593Z"}]},"adapter":{"traceId":"d9903637-884e-48c9-8b2b-95eb48c9e465","parentTraceId":"6d2b7b7d-eaae-49c5-b29b-e2ec1a70d482","createdAt":"2026-04-24T08:52:26.811Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"3bd294e0-0fc6-44ad-be1a-9ad636252005\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}]},"runId":"b2bd7068-86df-41af-92a3-5ae3e2c12dab","traceId":"d9903637-884e-48c9-8b2b-95eb48c9e465","parentTraceId":"6d2b7b7d-eaae-49c5-b29b-e2ec1a70d482","createdAt":"2026-04-24T08:52:26.811Z"}
```

### Automation Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"automation-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}],"extractedJson":{"title":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","message":"Pause for a short reset before resuming the next small task step.","channel":"mobile_push","deliver":true},"normalizedJson":{"title":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","message":"Pause for a short reset before resuming the next small task step.","channel":"mobile_push","deliver":true},"adapter":{"traceId":"da81a463-2a03-45fd-9e3f-52d07230b63f","parentTraceId":"632e62be-e663-47c2-ad3a-ad0065117ab9","createdAt":"2026-04-24T08:52:26.829Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"runId":"9dd79490-8d9e-49fa-b658-fbe21ed56906","traceId":"da81a463-2a03-45fd-9e3f-52d07230b63f","parentTraceId":"632e62be-e663-47c2-ad3a-ad0065117ab9","createdAt":"2026-04-24T08:52:26.829Z"}
```
