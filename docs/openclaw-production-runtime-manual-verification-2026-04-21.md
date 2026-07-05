# OpenClaw Production Runtime Manual Verification（2026-04-21）

用于记录一次 **M5 生产运行时恢复验证** 的实际执行结果。

本次记录不是第二台机器的正式复跑，而是当前机器按“停机后重新拉起 runtime -> 获取真实 LAN Base URL -> Gateway 接回 cluster-preferred -> 跑完整 smoke”这条链路做的一次恢复模拟。

---

## 1. 基本信息

- 日期：2026-04-21
- 执行人：Codex
- 机器：当前本地 OpenClaw 计划部署机
- Gateway 提交/版本：当前工作区源码
- Cluster 提交/版本：本地兼容 OpenClaw execute 服务
- runtime 启动方式：`corepack pnpm start:openclaw-runtime-lan`
- runtime 实际 Node：`/Users/claw/.nvm/versions/node/v24.14.0/bin/node`
- 关键恢复点：`start-openclaw-runtime-lan` 已能在 `.tools/node/bin/node` 过旧时自动切到兼容 Node
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
- `traceId`：`7bc735b8-a971-4259-ba1f-07dc2a5fc260`
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
- `traceId`：6d80a3e5-f4f1-49ed-82df-c159e99a26d1
- 结果：通过

### `/debug/agent/interruption-recovery`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：44409c53-4e9f-432b-a150-35b0021fd39b
- 结果：通过

### `/debug/agent/reflection`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：b9ef507b-563e-4812-aa6e-ab259d2bf927
- 结果：通过

### `/debug/agent/task-management`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：76af99c5-b066-456e-9866-83644b1c73c7
- 结果：通过

### `/debug/agent/progress-feedback`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：9d5f8fc2-7197-41aa-ad83-73cea0670b09
- 结果：通过

### `/debug/agent/automation`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：add746cb-6935-4340-8278-3fdd75ceaee6
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
  - direct execute trace：`manual-verify-trace-1`
  - chief probe trace：`810414b8-81cf-4152-9b5c-1ae994d02c0f`
  - state-insight debug trace：`6d80a3e5-f4f1-49ed-82df-c159e99a26d1`
  - interruption-recovery debug trace：`44409c53-4e9f-432b-a150-35b0021fd39b`
  - reflection debug trace：`b9ef507b-563e-4812-aa6e-ab259d2bf927`
  - task-management debug trace：`76af99c5-b066-456e-9866-83644b1c73c7`
  - progress-feedback debug trace：`9d5f8fc2-7197-41aa-ad83-73cea0670b09`
  - automation debug trace：`add746cb-6935-4340-8278-3fdd75ceaee6`
- 关键日志文件位置：
  - runtime：`.logs/openclaw-real-lan.log`
  - runtime env：`.logs/openclaw-real-lan.env`
  - temporary gateway：`.logs/api-manual-verification.log`
- `debug/openclaw/adapter` 返回快照是否已保存：是

## 7. 最终判定

- 直连 cluster 合同：通过
- Gateway cluster-preferred：通过
- Web 控制台：本次未做浏览器人工验收
- 综合判定：当前机器恢复模拟通过

## 8. 问题与后续动作

- 发现的问题：
  1. 仓库自带 `.tools/node/bin/node` 当前是 `22.14.0`，低于 OpenClaw 要求的 `>=22.16.0`
  2. `start-openclaw-runtime-lan` 之前会在 runtime 实际已退出时仍报成功，本次已收口
  3. 这份记录仍不是第二台机器的独立复跑，正式 cross-machine 验收仍待补

- 建议的下一步：
  1. 在第二台机器上按 [openclaw-production-runtime-deployment.md](/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/docs/openclaw-production-runtime-deployment.md) 完整复跑一次
  2. 保持 `.tools/node` 与当前兼容 Node 版本对齐，避免每次依赖 fallback 选择
  3. 完成 second-machine 复跑后，再刷新 `docs/m5-production-runtime-completion-checklist.md`

---

可和以下文档配合使用：

- `docs/openclaw-cluster-smoke-checklist.md`
- `docs/web-console-smoke-checklist.md`
- `docs/development-handoff-2026-03-07.md`

## Script Snapshot

- Captured at: 2026-04-21T03:52:51Z
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
{"gatewayMode":"openai-compatible","clusterEnabled":true,"executionStrategy":"cluster-preferred","openClawBaseUrl":"http://192.168.0.104:8800","clusterEndpoints":["/v1/tasks/execute","/tasks/execute","/api/tasks/execute"],"lastDecision":{"traceId":"add746cb-6935-4340-8278-3fdd75ceaee6","parentTraceId":"7bb2d73d-f460-4b3e-be61-7e08672a8de6","createdAt":"2026-04-21T03:52:51.521Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"lastFallback":null,"failureCategoryCounts":{},"recentTimeline":[{"traceId":"add746cb-6935-4340-8278-3fdd75ceaee6","parentTraceId":"7bb2d73d-f460-4b3e-be61-7e08672a8de6","createdAt":"2026-04-21T03:52:51.521Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},{"traceId":"9d5f8fc2-7197-41aa-ad83-73cea0670b09","parentTraceId":"b9357d05-9a31-4c9d-a7be-01e38689264c","createdAt":"2026-04-21T03:52:51.501Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"c1c1cd21-92aa-49ce-ade1-cf2089f8279a\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}]},{"traceId":"76af99c5-b066-456e-9866-83644b1c73c7","parentTraceId":"3cfde423-c43d-4d57-b23c-b3d0bd87792c","createdAt":"2026-04-21T03:52:51.481Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"c1c1cd21-92aa-49ce-ade1-cf2089f8279a\",\"74e6ac72-e5cd-43c4-91eb-99db607be6b3\",\"dc946dbd-91cf-4601-bdc3-bbb11d117a8e\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}]},{"traceId":"b9ef507b-563e-4812-aa6e-ab259d2bf927","parentTraceId":"0572a408-d370-4560-9055-0f3298646fef","createdAt":"2026-04-21T03:52:51.462Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-14T03:52:51.460Z\",\"periodEnd\":\"2026-04-21T03:52:51.460Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}]},{"traceId":"44409c53-4e9f-432b-a150-35b0021fd39b","parentTraceId":"9dfff188-8219-4187-baec-006f18249963","createdAt":"2026-04-21T03:52:51.444Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"c1c1cd21-92aa-49ce-ade1-cf2089f8279a\",\"74e6ac72-e5cd-43c4-91eb-99db607be6b3\",\"d"}]},{"traceId":"6d80a3e5-f4f1-49ed-82df-c159e99a26d1","parentTraceId":"761619ed-f155-4ea0-899a-2debca722c8e","createdAt":"2026-04-21T03:52:51.425Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-21T03:37:51.422Z\",\"windowEnd\":\"2026-04-21T03:52:51.422Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}]},{"traceId":"7bc735b8-a971-4259-ba1f-07dc2a5fc260","parentTraceId":"cfb48979-3ef3-4539-a9a8-b0d257fc5209","createdAt":"2026-04-21T03:52:51.266Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]},{"traceId":"810414b8-81cf-4152-9b5c-1ae994d02c0f","parentTraceId":"6ae3f640-e750-447b-b5ea-a3bfa85351ec","createdAt":"2026-04-21T03:52:40.156Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]}]}
```

### Chief Probe Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"chief-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}],"parsed":{"probe":"ok"},"adapter":{"traceId":"7bc735b8-a971-4259-ba1f-07dc2a5fc260","parentTraceId":"cfb48979-3ef3-4539-a9a8-b0d257fc5209","createdAt":"2026-04-21T03:52:51.267Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]},"runId":"9f4c9b63-b596-4cc0-a1d8-faf706d3c87b","traceId":"7bc735b8-a971-4259-ba1f-07dc2a5fc260","parentTraceId":"cfb48979-3ef3-4539-a9a8-b0d257fc5209","createdAt":"2026-04-21T03:52:51.267Z"}
```

### Scenario Seed Response

```json
{"scenarioId":"focus-recovery-loop","title":"Focus recovery loop","description":"低专注 + 高压力媒体信号 + 活跃专注会话，用来调试 state / recovery / notification。","userId":"debug-focus-user","goalId":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","taskId":"c1c1cd21-92aa-49ce-ade1-cf2089f8279a","sessionId":"d227a200-c6b6-436f-a233-621ea6e03a06","recommendedWorkflows":["state_assessment","recovery_plan","notification_dispatch"],"notes":["包含活跃专注会话、一次历史中断与恢复计划。","音频、视频、健康桥三类信号都已写入，适合联调 state / recovery / notification。"],"counts":{"goals":1,"tasks":3,"sessions":2,"assessments":1,"recoveryPlans":1,"reflections":0,"inbox":1},"runId":"171df16f-7637-41e2-923e-0fe75de88649","traceId":"a4f1cebb-98a8-4d85-8741-294aad33b2b3","parentTraceId":"12dbe030-badc-436e-a3a5-114a5987adda","createdAt":"2026-04-21T03:52:51.307Z"}
```

### State Insight Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"state-insight-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-21T03:37:51.422Z\",\"windowEnd\":\"2026-04-21T03:52:51.422Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}],"extractedJson":{"userId":"debug-focus-user","windowStart":"2026-04-21T03:37:51.422Z","windowEnd":"2026-04-21T03:52:51.422Z","focusScore":40,"energyScore":45,"moodScore":49,"summary":"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。","recommendedAction":"先收拢干扰源，回到主任务，只推进一个最小可验证步骤，再决定是否继续扩展。","emotionSummary":"音频侧提示紧张和压力抬升，说明当前更适合减少切换而不是继续并行处理。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示疲劳和视觉稳定度下降，说明持续专注能力正在变弱。","healthSummary":"健康数据显示恢复基础一般，健康数据提示应优先保证节奏稳定而不是强行加码。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"mixed"},"normalizedJson":{"userId":"debug-focus-user","windowStart":"2026-04-21T03:37:51.422Z","windowEnd":"2026-04-21T03:52:51.422Z","focusScore":40,"energyScore":45,"moodScore":49,"summary":"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。","recommendedAction":"先收拢干扰源，回到主任务，只推进一个最小可验证步骤，再决定是否继续扩展。","emotionSummary":"音频侧提示紧张和压力抬升，说明当前更适合减少切换而不是继续并行处理。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示疲劳和视觉稳定度下降，说明持续专注能力正在变弱。","healthSummary":"健康数据显示恢复基础一般，健康数据提示应优先保证节奏稳定而不是强行加码。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"mixed"},"adapter":{"traceId":"6d80a3e5-f4f1-49ed-82df-c159e99a26d1","parentTraceId":"761619ed-f155-4ea0-899a-2debca722c8e","createdAt":"2026-04-21T03:52:51.426Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-04-21T03:37:51.422Z\",\"windowEnd\":\"2026-04-21T03:52:51.422Z\",\"focusScore\":40,\"energyScore\":45,\"moodScore\":49,\"summary\":\"当前注意力已有下滑迹象，最近桌面活动显示切换与空闲增加；如果继续扩散上下文，主任务推进质量会继续下降。\",\"recommendedAction\""}]},"runId":"347457df-d9d9-43fa-9fd8-41f085afb164","traceId":"6d80a3e5-f4f1-49ed-82df-c159e99a26d1","parentTraceId":"761619ed-f155-4ea0-899a-2debca722c8e","createdAt":"2026-04-21T03:52:51.426Z"}
```

### Recovery Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"interruption-recovery-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"c1c1cd21-92aa-49ce-ade1-cf2089f8279a\",\"74e6ac72-e5cd-43c4-91eb-99db607be6b3\",\"d"}],"extractedJson":{"reason":"attention_shift_after_interruption","nextStep":"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。","suggestedMinutes":25,"reprioritizedTaskIds":["c1c1cd21-92aa-49ce-ade1-cf2089f8279a","74e6ac72-e5cd-43c4-91eb-99db607be6b3","dc946dbd-91cf-4601-bdc3-bbb11d117a8e"]},"normalizedJson":{"reason":"attention_shift_after_interruption","nextStep":"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。","suggestedMinutes":25,"reprioritizedTaskIds":["c1c1cd21-92aa-49ce-ade1-cf2089f8279a","74e6ac72-e5cd-43c4-91eb-99db607be6b3","dc946dbd-91cf-4601-bdc3-bbb11d117a8e"]},"adapter":{"traceId":"44409c53-4e9f-432b-a150-35b0021fd39b","parentTraceId":"9dfff188-8219-4187-baec-006f18249963","createdAt":"2026-04-21T03:52:51.445Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"attention_shift_after_interruption\",\"nextStep\":\"先回到「验证 chief-agent 在压力场景下的路由」，只推进一个最小切片，避免继续切去处理旁支任务。\",\"suggestedMinutes\":25,\"reprioritizedTaskIds\":[\"c1c1cd21-92aa-49ce-ade1-cf2089f8279a\",\"74e6ac72-e5cd-43c4-91eb-99db607be6b3\",\"d"}]},"runId":"f8808d04-80b0-4a34-99c9-4e4993923df5","traceId":"44409c53-4e9f-432b-a150-35b0021fd39b","parentTraceId":"9dfff188-8219-4187-baec-006f18249963","createdAt":"2026-04-21T03:52:51.445Z"}
```

### Reflection Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"reflection-coach-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-14T03:52:51.460Z\",\"periodEnd\":\"2026-04-21T03:52:51.460Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}],"extractedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-04-14T03:52:51.460Z","periodEnd":"2026-04-21T03:52:51.460Z","highlights":["本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。"],"blockers":["本周的主要阻力来自中断后回到主线的成本偏高。"],"trends":["本周专注均值仍有波动，但在恢复方案介入后开始重新聚焦。"],"nextSuggestions":["中断后先执行 10 到 25 分钟的最小恢复块，而不是立即重开多个任务。"]},"normalizedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-04-14T03:52:51.460Z","periodEnd":"2026-04-21T03:52:51.460Z","highlights":["本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。"],"blockers":["本周的主要阻力来自中断后回到主线的成本偏高。"],"trends":["本周专注均值仍有波动，但在恢复方案介入后开始重新聚焦。"],"nextSuggestions":["中断后先执行 10 到 25 分钟的最小恢复块，而不是立即重开多个任务。"]},"adapter":{"traceId":"b9ef507b-563e-4812-aa6e-ab259d2bf927","parentTraceId":"0572a408-d370-4560-9055-0f3298646fef","createdAt":"2026-04-21T03:52:51.464Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-04-14T03:52:51.460Z\",\"periodEnd\":\"2026-04-21T03:52:51.460Z\",\"highlights\":[\"本周已经形成一条相对清晰的执行主线，至少有一个任务被持续推进。\"],\"blockers\":[\"本周的主要阻力来自中断后回到主线的成本偏高。\"],\"trends\":[\"本周专注均值仍有波动，"}]},"runId":"64504668-fe0f-434a-af0c-8038c4b0a7af","traceId":"b9ef507b-563e-4812-aa6e-ab259d2bf927","parentTraceId":"0572a408-d370-4560-9055-0f3298646fef","createdAt":"2026-04-21T03:52:51.464Z"}
```

### Task Management Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"task-management-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"c1c1cd21-92aa-49ce-ade1-cf2089f8279a\",\"74e6ac72-e5cd-43c4-91eb-99db607be6b3\",\"dc946dbd-91cf-4601-bdc3-bbb11d117a8e\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}],"extractedJson":{"orderedTaskIds":["c1c1cd21-92aa-49ce-ade1-cf2089f8279a","74e6ac72-e5cd-43c4-91eb-99db607be6b3","dc946dbd-91cf-4601-bdc3-bbb11d117a8e"],"summary":"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。","suggestedTasks":[]},"normalizedJson":{"orderedTaskIds":["c1c1cd21-92aa-49ce-ade1-cf2089f8279a","74e6ac72-e5cd-43c4-91eb-99db607be6b3","dc946dbd-91cf-4601-bdc3-bbb11d117a8e"],"summary":"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。","suggestedTasks":[]},"adapter":{"traceId":"76af99c5-b066-456e-9866-83644b1c73c7","parentTraceId":"3cfde423-c43d-4d57-b23c-b3d0bd87792c","createdAt":"2026-04-21T03:52:51.483Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"c1c1cd21-92aa-49ce-ade1-cf2089f8279a\",\"74e6ac72-e5cd-43c4-91eb-99db607be6b3\",\"dc946dbd-91cf-4601-bdc3-bbb11d117a8e\"],\"summary\":\"本地 OpenClaw cluster 已将当前最值得继续推进的任务排在最前面，优先保持主线连续性。\",\"suggestedTasks\":[]}"}]},"runId":"4076577f-2926-43d2-9189-c79c1a899e57","traceId":"76af99c5-b066-456e-9866-83644b1c73c7","parentTraceId":"3cfde423-c43d-4d57-b23c-b3d0bd87792c","createdAt":"2026-04-21T03:52:51.483Z"}
```

### Progress Feedback Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"progress-feedback-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"c1c1cd21-92aa-49ce-ade1-cf2089f8279a\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}],"extractedJson":{"goalCount":1,"taskCount":3,"completedTaskCount":0,"inProgressTaskCount":1,"blockedTaskCount":0,"completionRate":0,"openInterventions":1,"suggestedFocusTaskId":"c1c1cd21-92aa-49ce-ade1-cf2089f8279a","summaryHeadline":"当前已有恢复方案，建议先按恢复方案收拢主线，再继续推进最重要任务。","activeSession":{"id":"d227a200-c6b6-436f-a233-621ea6e03a06","userId":"debug-focus-user","goalId":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","taskId":"c1c1cd21-92aa-49ce-ade1-cf2089f8279a","status":"active","startedAt":"2026-04-21T03:24:51.294Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"a95abcbc-8c30-4d87-95c6-290ed45c2c10","userId":"debug-focus-user","windowStart":"2026-04-21T03:27:51.294Z","windowEnd":"2026-04-21T03:48:51.294Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示眨眼频率偏高，视线稳定度下降。","healthSummary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-04-21T03:50:51.303Z"},"latestRecoveryPlan":{"id":"fc1130df-3c71-492b-aff3-2d86652c160c","userId":"debug-focus-user","sessionId":"c832f7c3-2fbd-4885-9fcc-674fef2580aa","taskId":"74e6ac72-e5cd-43c4-91eb-99db607be6b3","reason":"energy_drop","nextStep":"Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["c1c1cd21-92aa-49ce-ade1-cf2089f8279a","74e6ac72-e5cd-43c4-91eb-99db607be6b3","dc946dbd-91cf-4601-bdc3-bbb11d117a8e"],"createdAt":"2026-04-21T02:52:51.304Z"},"latestBehaviorConclusion":{"id":"dfa6f465-64d1-4ae2-b3b1-0f001854d2c3","createdAt":"2026-04-21T03:52:51.305Z","userId":"debug-focus-user","assessmentId":"a95abcbc-8c30-4d87-95c6-290ed45c2c10","sessionId":"d227a200-c6b6-436f-a233-621ea6e03a06","taskId":"c1c1cd21-92aa-49ce-ade1-cf2089f8279a","riskLevel":"high","summary":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"61e64889-631e-4ce1-9ed1-5c3fe3aff6fa","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"d227a200-c6b6-436f-a233-621ea6e03a06","windowStart":"2026-04-21T03:39:51.296Z","windowEnd":"2026-04-21T03:45:51.296Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"视频侧显示眨眼频率偏高，视线稳定度下降。","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-04-21T03:52:51.296Z"},"latestHealthSnapshot":{"id":"919d114b-0d5c-4ff0-bf2e-4dc628583089","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-04-20T15:52:51.297Z","windowEnd":"2026-04-20T23:52:51.297Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","createdAt":"2026-04-21T03:52:51.297Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"06430fd1-bda7-4a23-981a-734c10273101","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"调试 Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-04-21T01:52:51.285Z","lastSeenAt":"2026-04-21T03:52:51.286Z","createdAt":"2026-04-21T03:52:51.286Z","updatedAt":"2026-04-21T03:52:51.286Z"},"latestSession":null,"latestEmotionAssessment":{"id":"3958f037-773d-4557-9948-b91b055a682d","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"d227a200-c6b6-436f-a233-621ea6e03a06","chunkSequence":2,"windowStart":"2026-04-21T03:41:51.295Z","windowEnd":"2026-04-21T03:46:51.295Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-04-21T03:52:51.295Z"},"latestCallEvent":null},"edgeDevices":[{"id":"eb21c8d2-d18a-473e-86dd-5d8936b3ce90","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"调试专注手机端","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-21T03:52:51.284Z","createdAt":"2026-04-21T03:52:51.284Z","updatedAt":"2026-04-21T03:52:51.284Z"},{"id":"ae4f45bb-b9c2-446d-827f-c95ca44e62ce","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"调试专注桌面端","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-21T03:52:51.283Z","createdAt":"2026-04-21T03:52:51.283Z","updatedAt":"2026-04-21T03:52:51.283Z"}],"inbox":[{"id":"63d874d8-27a1-47e9-9742-4793a374baa6","createdAt":"2026-04-21T03:52:51.306Z","status":"pending","userId":"debug-focus-user","title":"建议立即恢复主线","message":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","userId":"debug-focus-user","title":"在深度工作中找回注意力","description":"用于状态、恢复和通知 agent 联调的示例场景。","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-04-21T03:52:51.287Z","updatedAt":"2026-04-21T03:52:51.292Z"}],"tasks":[{"id":"c1c1cd21-92aa-49ce-ade1-cf2089f8279a","userId":"debug-focus-user","goalId":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","title":"验证 chief-agent 在压力场景下的路由","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-04-21T03:52:51.288Z","updatedAt":"2026-04-21T03:52:51.292Z"},{"id":"74e6ac72-e5cd-43c4-91eb-99db607be6b3","userId":"debug-focus-user","goalId":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","title":"调整收件箱提醒文案","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-04-21T03:52:51.289Z","updatedAt":"2026-04-21T03:52:51.289Z"},{"id":"dc946dbd-91cf-4601-bdc3-bbb11d117a8e","userId":"debug-focus-user","goalId":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","title":"检查复盘亮点摘要","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-04-21T03:52:51.290Z","updatedAt":"2026-04-21T03:52:51.290Z"}]},"normalizedJson":{"goalCount":1,"taskCount":3,"completedTaskCount":0,"inProgressTaskCount":1,"blockedTaskCount":0,"completionRate":0,"openInterventions":1,"suggestedFocusTaskId":"c1c1cd21-92aa-49ce-ade1-cf2089f8279a","summaryHeadline":"当前已有恢复方案，建议先按恢复方案收拢主线，再继续推进最重要任务。","coachFrontAgent":{"currentFrontAgent":"director-agent","routingMode":"auto","manualOverride":false,"consultedAgent":null,"handoffReason":null,"overrideSourceAgent":null,"visibleSummary":"Picard is currently coordinating the team."},"activeSession":{"id":"d227a200-c6b6-436f-a233-621ea6e03a06","userId":"debug-focus-user","goalId":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","taskId":"c1c1cd21-92aa-49ce-ade1-cf2089f8279a","status":"active","startedAt":"2026-04-21T03:24:51.294Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"a95abcbc-8c30-4d87-95c6-290ed45c2c10","userId":"debug-focus-user","windowStart":"2026-04-21T03:27:51.294Z","windowEnd":"2026-04-21T03:48:51.294Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: 音频侧推断近期压力偏高，语速与语气都更紧绷。 Video inference: 视频侧显示眨眼频率偏高，视线稳定度下降。 健康桥接显示睡眠不足，疲劳影响延续到了今天。","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"视频侧显示眨眼频率偏高，视线稳定度下降。","healthSummary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-04-21T03:50:51.303Z"},"latestRecoveryPlan":{"id":"fc1130df-3c71-492b-aff3-2d86652c160c","userId":"debug-focus-user","sessionId":"c832f7c3-2fbd-4885-9fcc-674fef2580aa","taskId":"74e6ac72-e5cd-43c4-91eb-99db607be6b3","reason":"energy_drop","nextStep":"Resume \"调整收件箱提醒文案\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["c1c1cd21-92aa-49ce-ade1-cf2089f8279a","74e6ac72-e5cd-43c4-91eb-99db607be6b3","dc946dbd-91cf-4601-bdc3-bbb11d117a8e"],"createdAt":"2026-04-21T02:52:51.304Z"},"latestBehaviorConclusion":{"id":"dfa6f465-64d1-4ae2-b3b1-0f001854d2c3","createdAt":"2026-04-21T03:52:51.305Z","userId":"debug-focus-user","assessmentId":"a95abcbc-8c30-4d87-95c6-290ed45c2c10","sessionId":"d227a200-c6b6-436f-a233-621ea6e03a06","taskId":"c1c1cd21-92aa-49ce-ade1-cf2089f8279a","riskLevel":"high","summary":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"61e64889-631e-4ce1-9ed1-5c3fe3aff6fa","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"d227a200-c6b6-436f-a233-621ea6e03a06","windowStart":"2026-04-21T03:39:51.296Z","windowEnd":"2026-04-21T03:45:51.296Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"视频侧显示眨眼频率偏高，视线稳定度下降。","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-04-21T03:52:51.296Z"},"latestHealthSnapshot":{"id":"919d114b-0d5c-4ff0-bf2e-4dc628583089","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-04-20T15:52:51.297Z","windowEnd":"2026-04-20T23:52:51.297Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"健康桥接显示睡眠不足，疲劳影响延续到了今天。","createdAt":"2026-04-21T03:52:51.297Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"06430fd1-bda7-4a23-981a-734c10273101","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"调试 Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-04-21T01:52:51.285Z","lastSeenAt":"2026-04-21T03:52:51.286Z","createdAt":"2026-04-21T03:52:51.286Z","updatedAt":"2026-04-21T03:52:51.286Z"},"latestSession":null,"latestEmotionAssessment":{"id":"3958f037-773d-4557-9948-b91b055a682d","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"d227a200-c6b6-436f-a233-621ea6e03a06","chunkSequence":2,"windowStart":"2026-04-21T03:41:51.295Z","windowEnd":"2026-04-21T03:46:51.295Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"音频侧推断近期压力偏高，语速与语气都更紧绷。","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-04-21T03:52:51.295Z"},"latestCallEvent":null},"edgeDevices":[{"id":"eb21c8d2-d18a-473e-86dd-5d8936b3ce90","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"调试专注手机端","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-21T03:52:51.284Z","createdAt":"2026-04-21T03:52:51.284Z","updatedAt":"2026-04-21T03:52:51.284Z"},{"id":"ae4f45bb-b9c2-446d-827f-c95ca44e62ce","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"调试专注桌面端","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-04-21T03:52:51.283Z","createdAt":"2026-04-21T03:52:51.283Z","updatedAt":"2026-04-21T03:52:51.283Z"}],"inbox":[{"id":"63d874d8-27a1-47e9-9742-4793a374baa6","createdAt":"2026-04-21T03:52:51.306Z","status":"pending","userId":"debug-focus-user","title":"建议立即恢复主线","message":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。 Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","userId":"debug-focus-user","title":"在深度工作中找回注意力","description":"用于状态、恢复和通知 agent 联调的示例场景。","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-04-21T03:52:51.287Z","updatedAt":"2026-04-21T03:52:51.292Z"}],"tasks":[{"id":"c1c1cd21-92aa-49ce-ade1-cf2089f8279a","userId":"debug-focus-user","goalId":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","title":"验证 chief-agent 在压力场景下的路由","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-04-21T03:52:51.288Z","updatedAt":"2026-04-21T03:52:51.292Z"},{"id":"74e6ac72-e5cd-43c4-91eb-99db607be6b3","userId":"debug-focus-user","goalId":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","title":"调整收件箱提醒文案","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-04-21T03:52:51.289Z","updatedAt":"2026-04-21T03:52:51.289Z"},{"id":"dc946dbd-91cf-4601-bdc3-bbb11d117a8e","userId":"debug-focus-user","goalId":"e3078dc9-90fc-4d89-8abb-4f43d7e9ea53","title":"检查复盘亮点摘要","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-04-21T03:52:51.290Z","updatedAt":"2026-04-21T03:52:51.290Z"}]},"adapter":{"traceId":"9d5f8fc2-7197-41aa-ad83-73cea0670b09","parentTraceId":"b9357d05-9a31-4c9d-a7be-01e38689264c","createdAt":"2026-04-21T03:52:51.503Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":1,\"taskCount\":3,\"completedTaskCount\":0,\"inProgressTaskCount\":1,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":1,\"suggestedFocusTaskId\":\"c1c1cd21-92aa-49ce-ade1-cf2089f8279a\",\"summaryHeadline\":\"当前已有恢复方案，建议先按恢复方案收拢主线"}]},"runId":"677192f4-0dde-46e9-8cc8-c1b4b31cc5f2","traceId":"9d5f8fc2-7197-41aa-ad83-73cea0670b09","parentTraceId":"b9357d05-9a31-4c9d-a7be-01e38689264c","createdAt":"2026-04-21T03:52:51.503Z"}
```

### Automation Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"automation-agent","baseUrl":"http://192.168.0.104:8800","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}],"extractedJson":{"title":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","message":"Pause for a short reset before resuming the next small task step.","channel":"mobile_push","deliver":true},"normalizedJson":{"title":"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。","message":"Pause for a short reset before resuming the next small task step.","channel":"mobile_push","deliver":true},"adapter":{"traceId":"add746cb-6935-4340-8278-3fdd75ceaee6","parentTraceId":"7bb2d73d-f460-4b3e-be61-7e08672a8de6","createdAt":"2026-04-21T03:52:51.523Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"failureCategory":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"runId":"312ddf20-1ec1-4b9a-b667-6bac18e74183","traceId":"add746cb-6935-4340-8278-3fdd75ceaee6","parentTraceId":"7bb2d73d-f460-4b3e-be61-7e08672a8de6","createdAt":"2026-04-21T03:52:51.523Z"}
```
