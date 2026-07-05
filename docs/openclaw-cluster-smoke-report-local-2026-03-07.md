# OpenClaw Cluster Smoke Report（2026-03-07）

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

- 日期：2026-03-07
- 执行人：Codex
- 机器：当前本地 OpenClaw 计划部署机
- Gateway 提交/版本：当前工作区源码
- Cluster 提交/版本：本地兼容 OpenClaw execute 服务
- 执行环境：
  - `MINDANCHOR_API_URL`：`http://127.0.0.1:3002`
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
- `traceId`：`702eb69d-6a38-4b19-98c0-4e8029f55c2e`
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
- `traceId`：7739aa8f-ae77-44d0-a143-2c92e4edf43e
- 结果：通过

### `/debug/agent/interruption-recovery`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：33e9773d-c704-454a-a8df-5d5a333b874c
- 结果：通过

### `/debug/agent/reflection`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：d9dd65d2-a600-4645-977e-dca170f9a23f
- 结果：通过

### `/debug/agent/task-management`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：f790dc55-4a2b-416f-91d8-43d9990e5f32
- 结果：通过

### `/debug/agent/progress-feedback`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：dde05fa4-9f94-4d6f-8d00-bc5f2dd79b5d
- 结果：通过

### `/debug/agent/automation`

- HTTP Status：200
- `success`：True
- `adapter.route`：cluster
- `adapter.selectedEndpoint`：cluster:/v1/tasks/execute
- `traceId`：90a02f50-a1c9-45a1-94a0-59d6f13946c4
- 结果：通过

## 4. Web / Agent Lab 检查

- Dashboard 可打开：是（已通过本地浏览器验收）
- GoalFlow 可打开：是（已通过本地浏览器验收）
- State Trends 可打开：是（已通过本地浏览器验收）
- Recovery 可打开：是（已通过本地浏览器验收）
- Reflections 可打开：是（已通过本地浏览器验收）
- Inbox 可打开：是（已通过本地浏览器验收）
- Agent Lab 可打开：是（已通过本地浏览器验收）

### Agent Lab 重点

- adapter 状态卡显示正常：可由 API 推断为是
- `Probe chief-agent` 显示路径：`cluster`
- `state-insight-agent` debug 显示路径：`cluster`
- `interruption-recovery-agent` debug 显示路径：`cluster`
- `reflection-coach-agent` debug 显示路径：`cluster`
- `task-management-agent` debug 显示路径：`cluster`
- `progress-feedback-agent` debug 显示路径：`cluster`
- `automation-agent` debug 显示路径：`cluster`
- Trace Inspector 能查到事件：是（已通过浏览器联调检查）

## 5. 页面人工验收

### 5.1 Dashboard

- 顶部 `Workspace shortcuts` 是否显示完整：是
- `Latest state` 卡是否可读：是
- `Behavior conclusion` 卡是否可读：是
- `Open Recovery page` 跳转是否正常：是

### 5.2 GoalFlow

- Goal 列表是否正常显示：是
- Task 列表是否正常显示：是
- `suggested focus` 标签是否出现：是
- Focus session 区域是否正常：是

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
  - health / request trace：未单独记录
  - chief probe trace：`702eb69d-6a38-4b19-98c0-4e8029f55c2e`
  - scenario seed trace：`c908d29b-0196-403a-bbd7-033345759e01`
  - state-insight debug trace：`7739aa8f-ae77-44d0-a143-2c92e4edf43e`
  - interruption-recovery debug trace：`33e9773d-c704-454a-a8df-5d5a333b874c`
  - reflection debug trace：`d9dd65d2-a600-4645-977e-dca170f9a23f`
  - task-management debug trace：`f790dc55-4a2b-416f-91d8-43d9990e5f32`
  - progress-feedback debug trace：`dde05fa4-9f94-4d6f-8d00-bc5f2dd79b5d`
  - automation debug trace：`90a02f50-a1c9-45a1-94a0-59d6f13946c4`
- 关键截图或日志文件位置：
  - adapter JSON 快照：本文件 `Script Snapshot`
  - cluster 原始返回：本文件 `Direct Cluster Response`
  - Agent Lab 截图：未生成
- `debug/openclaw/adapter` 返回快照是否已保存：是

## 7. 最终判定

- 直连 cluster 合同：通过
- Gateway cluster-preferred：通过
- Web 控制台：通过
- 综合判定：通过（基于本地 compatibility runtime）

## 8. 问题与后续动作

- 发现的问题：
  1. 仍保留少量英文技术专有词，例如 `Agent Lab`、`OpenClaw`、`cluster`、`provider-direct`，这是有意保留，不影响使用。
  2. 这份报告对应的是本地 compatibility runtime，不代表真实外部 OpenClaw cluster 的第一次正式端到端 smoke 已完成。
  3. 更多业务结论仍待继续迁移为远程 cluster 真实产出，而不是长期停留在 Gateway / 本地 worker 的过渡逻辑。

- 建议的下一步：
  1. 在真实外部 OpenClaw cluster 上执行一次正式 `smoke:cluster` 并生成独立报告。
  2. 开始推进 `M4 — Cluster-first Business Migration`，把更多业务结论迁到 cluster 侧。
  3. 继续按需要补充 Agent Lab 深层调试词汇与验收报告回填。

---

可和以下文档配合使用：

- `docs/openclaw-cluster-smoke-checklist.md`
- `docs/web-console-smoke-checklist.md`
- `docs/development-handoff-2026-03-07.md`

## Script Snapshot

- Captured at: 2026-03-07T10:41:47Z
- API Base URL: `http://127.0.0.1:3002`
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
{"success":true,"taskId":"smoke-task-001","trace":{"traceId":"2aa7df41-0134-4812-8f77-cd7bcf1bbf55","parentTraceId":"smoke-trace-001"},"parsed":{"probe":"ok"},"metadata":{"runtime":"openclaw-local-cluster","worker":"chief-agent-worker","mode":"probe"}}
```

### Gateway Health Response

```json
{"ok":true,"mode":"openai-compatible","topology":"gateway->openclaw-cluster","openClawBaseUrl":"http://127.0.0.1:8787"}
```

### Adapter Response

```json
{"gatewayMode":"openai-compatible","clusterEnabled":true,"executionStrategy":"cluster-preferred","openClawBaseUrl":"http://127.0.0.1:8787","clusterEndpoints":["/v1/tasks/execute","/tasks/execute","/api/tasks/execute"],"lastDecision":{"traceId":"90a02f50-a1c9-45a1-94a0-59d6f13946c4","parentTraceId":"13c76fe6-16c6-4303-a771-71803a518893","createdAt":"2026-03-07T10:41:47.364Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"Behavior reminder\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"lastFallback":null,"recentTimeline":[{"traceId":"90a02f50-a1c9-45a1-94a0-59d6f13946c4","parentTraceId":"13c76fe6-16c6-4303-a771-71803a518893","createdAt":"2026-03-07T10:41:47.364Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"Behavior reminder\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},{"traceId":"dde05fa4-9f94-4d6f-8d00-bc5f2dd79b5d","parentTraceId":"27a74eba-2112-411b-a6e8-7b26bca981a0","createdAt":"2026-03-07T10:41:47.348Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":0,\"taskCount\":0,\"completedTaskCount\":0,\"inProgressTaskCount\":0,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":0,\"suggestedFocusTaskId\":null,\"summaryHeadline\":\"Local OpenClaw cluster sees no tasks yet.\"}"}]},{"traceId":"f790dc55-4a2b-416f-91d8-43d9990e5f32","parentTraceId":"64afd7d0-ff1b-4f92-ab32-31d79513e171","createdAt":"2026-03-07T10:41:47.331Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"d1866803-2fff-4ee1-9a4b-dcb44df7481f\",\"0d607fc0-7561-4851-be3d-c0606ad25221\",\"4a3fa806-cfc4-47f3-b61a-43fcf722b199\"],\"summary\":\"Local OpenClaw cluster prepared a GoalFlow plan for Recover attention during deep work.\",\"su"}]},{"traceId":"d9dd65d2-a600-4645-977e-dca170f9a23f","parentTraceId":"abefd66c-4732-4d4d-acf1-2bb1ab799443","createdAt":"2026-03-07T10:41:47.316Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-02-28T10:41:47.314Z\",\"periodEnd\":\"2026-03-07T10:41:47.314Z\",\"highlights\":[\"Completed core Gateway + Web console read-model work.\"],\"blockers\":[\"Real external OpenClaw cl"}]},{"traceId":"33e9773d-c704-454a-a8df-5d5a333b874c","parentTraceId":"9af55728-dbae-455b-bae6-97cb9b4e0d09","createdAt":"2026-03-07T10:41:47.298Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"manual_request\",\"nextStep\":\"Resume with the smallest unfinished step and defer all secondary context switches.\",\"suggestedMinutes\":20,\"reprioritizedTaskIds\":[\"d1866803-2fff-4ee1-9a4b-dcb44df7481f\",\"0d607fc0-7561-4851-be3d-c0606ad"}]},{"traceId":"7739aa8f-ae77-44d0-a143-2c92e4edf43e","parentTraceId":"4d93976e-4b0c-4d5a-8027-d74e245aa24c","createdAt":"2026-03-07T10:41:47.284Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-03-07T10:36:47.282Z\",\"windowEnd\":\"2026-03-07T10:41:47.282Z\",\"focusScore\":78,\"energyScore\":66,\"moodScore\":61,\"summary\":\"Local OpenClaw cluster judges focus as mostly stable with mild drift ris"}]},{"traceId":"702eb69d-6a38-4b19-98c0-4e8029f55c2e","parentTraceId":"1ad613b3-ddc8-402d-8549-3bd82029e41f","createdAt":"2026-03-07T10:41:47.105Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]}]}
```

### Chief Probe Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"chief-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}],"parsed":{"probe":"ok"},"adapter":{"traceId":"702eb69d-6a38-4b19-98c0-4e8029f55c2e","parentTraceId":"1ad613b3-ddc8-402d-8549-3bd82029e41f","createdAt":"2026-03-07T10:41:47.106Z","target":"chief-agent","mode":"probe","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"probe\":\"ok\"}"}]},"runId":"95e5c650-abd6-4c28-a7c8-bd2fef3cf611","traceId":"702eb69d-6a38-4b19-98c0-4e8029f55c2e","parentTraceId":"1ad613b3-ddc8-402d-8549-3bd82029e41f","createdAt":"2026-03-07T10:41:47.106Z"}
```

### Scenario Seed Response

```json
{"scenarioId":"focus-recovery-loop","title":"Focus recovery loop","description":"低专注 + 高压力媒体信号 + 活跃专注会话，用来调试 state / recovery / notification。","userId":"debug-focus-user","goalId":"d0ca98f7-bbd8-40eb-a569-8ce4dc52d231","taskId":"d1866803-2fff-4ee1-9a4b-dcb44df7481f","sessionId":"5aabd215-07d2-40b0-a446-7223389aa723","recommendedWorkflows":["state_assessment","recovery_plan","notification_dispatch"],"notes":["包含活跃专注会话、一次历史中断与恢复计划。","音频、视频、健康桥三类信号都已写入，适合联调 state / recovery / notification。"],"counts":{"goals":1,"tasks":3,"sessions":2,"assessments":1,"recoveryPlans":1,"reflections":0,"inbox":1},"runId":"b486ea27-af2e-4f08-97ab-ebb68542fe05","traceId":"c908d29b-0196-403a-bbd7-033345759e01","parentTraceId":"f7ccf57d-1905-4c07-a772-9cd28d70b98a","createdAt":"2026-03-07T10:41:47.132Z"}
```

### State Insight Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"state-insight-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-03-07T10:36:47.282Z\",\"windowEnd\":\"2026-03-07T10:41:47.282Z\",\"focusScore\":78,\"energyScore\":66,\"moodScore\":61,\"summary\":\"Local OpenClaw cluster judges focus as mostly stable with mild drift ris"}],"extractedJson":{"userId":"debug-focus-user","windowStart":"2026-03-07T10:36:47.282Z","windowEnd":"2026-03-07T10:41:47.282Z","focusScore":78,"energyScore":66,"moodScore":61,"summary":"Local OpenClaw cluster judges focus as mostly stable with mild drift risk.","recommendedAction":"Continue the current task for 20 minutes, then review distractions.","emotionSummary":"Audio tension remains manageable.","emotionConfidence":0.74,"fatigueScore":42,"videoSummary":"Video cues show mild fatigue but acceptable attention.","healthSummary":"Health summary suggests acceptable recovery and moderate energy.","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh"},"normalizedJson":{"userId":"debug-focus-user","windowStart":"2026-03-07T10:36:47.282Z","windowEnd":"2026-03-07T10:41:47.282Z","focusScore":78,"energyScore":66,"moodScore":61,"summary":"Local OpenClaw cluster judges focus as mostly stable with mild drift risk.","recommendedAction":"Continue the current task for 20 minutes, then review distractions.","emotionSummary":"Audio tension remains manageable.","emotionConfidence":0.74,"fatigueScore":42,"videoSummary":"Video cues show mild fatigue but acceptable attention.","healthSummary":"Health summary suggests acceptable recovery and moderate energy.","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh"},"adapter":{"traceId":"7739aa8f-ae77-44d0-a143-2c92e4edf43e","parentTraceId":"4d93976e-4b0c-4d5a-8027-d74e245aa24c","createdAt":"2026-03-07T10:41:47.284Z","target":"state-insight-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"windowStart\":\"2026-03-07T10:36:47.282Z\",\"windowEnd\":\"2026-03-07T10:41:47.282Z\",\"focusScore\":78,\"energyScore\":66,\"moodScore\":61,\"summary\":\"Local OpenClaw cluster judges focus as mostly stable with mild drift ris"}]},"runId":"00b2a85c-84dc-4c50-befb-77de0e20718b","traceId":"7739aa8f-ae77-44d0-a143-2c92e4edf43e","parentTraceId":"4d93976e-4b0c-4d5a-8027-d74e245aa24c","createdAt":"2026-03-07T10:41:47.284Z"}
```

### Recovery Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"interruption-recovery-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"manual_request\",\"nextStep\":\"Resume with the smallest unfinished step and defer all secondary context switches.\",\"suggestedMinutes\":20,\"reprioritizedTaskIds\":[\"d1866803-2fff-4ee1-9a4b-dcb44df7481f\",\"0d607fc0-7561-4851-be3d-c0606ad"}],"extractedJson":{"reason":"manual_request","nextStep":"Resume with the smallest unfinished step and defer all secondary context switches.","suggestedMinutes":20,"reprioritizedTaskIds":["d1866803-2fff-4ee1-9a4b-dcb44df7481f","0d607fc0-7561-4851-be3d-c0606ad25221","4a3fa806-cfc4-47f3-b61a-43fcf722b199"]},"normalizedJson":{"reason":"manual_request","nextStep":"Resume with the smallest unfinished step and defer all secondary context switches.","suggestedMinutes":20,"reprioritizedTaskIds":["d1866803-2fff-4ee1-9a4b-dcb44df7481f","0d607fc0-7561-4851-be3d-c0606ad25221","4a3fa806-cfc4-47f3-b61a-43fcf722b199"]},"adapter":{"traceId":"33e9773d-c704-454a-a8df-5d5a333b874c","parentTraceId":"9af55728-dbae-455b-bae6-97cb9b4e0d09","createdAt":"2026-03-07T10:41:47.299Z","target":"interruption-recovery-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"reason\":\"manual_request\",\"nextStep\":\"Resume with the smallest unfinished step and defer all secondary context switches.\",\"suggestedMinutes\":20,\"reprioritizedTaskIds\":[\"d1866803-2fff-4ee1-9a4b-dcb44df7481f\",\"0d607fc0-7561-4851-be3d-c0606ad"}]},"runId":"e32b2dac-d4a0-4f7e-888b-88ca1fe44025","traceId":"33e9773d-c704-454a-a8df-5d5a333b874c","parentTraceId":"9af55728-dbae-455b-bae6-97cb9b4e0d09","createdAt":"2026-03-07T10:41:47.299Z"}
```

### Reflection Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"reflection-coach-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-02-28T10:41:47.314Z\",\"periodEnd\":\"2026-03-07T10:41:47.314Z\",\"highlights\":[\"Completed core Gateway + Web console read-model work.\"],\"blockers\":[\"Real external OpenClaw cl"}],"extractedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-02-28T10:41:47.314Z","periodEnd":"2026-03-07T10:41:47.314Z","highlights":["Completed core Gateway + Web console read-model work."],"blockers":["Real external OpenClaw cluster smoke is still pending."],"trends":["Execution visibility improved through adapter status and trace tooling."],"nextSuggestions":["Run the first real cluster smoke and begin migrating more outputs to remote workers."]},"normalizedJson":{"userId":"debug-focus-user","periodType":"weekly","periodStart":"2026-02-28T10:41:47.314Z","periodEnd":"2026-03-07T10:41:47.314Z","highlights":["Completed core Gateway + Web console read-model work."],"blockers":["Real external OpenClaw cluster smoke is still pending."],"trends":["Execution visibility improved through adapter status and trace tooling."],"nextSuggestions":["Run the first real cluster smoke and begin migrating more outputs to remote workers."]},"adapter":{"traceId":"d9dd65d2-a600-4645-977e-dca170f9a23f","parentTraceId":"abefd66c-4732-4d4d-acf1-2bb1ab799443","createdAt":"2026-03-07T10:41:47.316Z","target":"reflection-coach-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"userId\":\"debug-focus-user\",\"periodType\":\"weekly\",\"periodStart\":\"2026-02-28T10:41:47.314Z\",\"periodEnd\":\"2026-03-07T10:41:47.314Z\",\"highlights\":[\"Completed core Gateway + Web console read-model work.\"],\"blockers\":[\"Real external OpenClaw cl"}]},"runId":"be1ee7cd-4a2d-4841-b1a0-12f69fbe7f69","traceId":"d9dd65d2-a600-4645-977e-dca170f9a23f","parentTraceId":"abefd66c-4732-4d4d-acf1-2bb1ab799443","createdAt":"2026-03-07T10:41:47.316Z"}
```

### Task Management Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"task-management-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"d1866803-2fff-4ee1-9a4b-dcb44df7481f\",\"0d607fc0-7561-4851-be3d-c0606ad25221\",\"4a3fa806-cfc4-47f3-b61a-43fcf722b199\"],\"summary\":\"Local OpenClaw cluster prepared a GoalFlow plan for Recover attention during deep work.\",\"su"}],"extractedJson":{"orderedTaskIds":["d1866803-2fff-4ee1-9a4b-dcb44df7481f","0d607fc0-7561-4851-be3d-c0606ad25221","4a3fa806-cfc4-47f3-b61a-43fcf722b199"],"summary":"Local OpenClaw cluster prepared a GoalFlow plan for Recover attention during deep work.","suggestedTasks":[]},"normalizedJson":{"orderedTaskIds":["d1866803-2fff-4ee1-9a4b-dcb44df7481f","0d607fc0-7561-4851-be3d-c0606ad25221","4a3fa806-cfc4-47f3-b61a-43fcf722b199"],"summary":"Local OpenClaw cluster prepared a GoalFlow plan for Recover attention during deep work.","suggestedTasks":[]},"adapter":{"traceId":"f790dc55-4a2b-416f-91d8-43d9990e5f32","parentTraceId":"64afd7d0-ff1b-4f92-ab32-31d79513e171","createdAt":"2026-03-07T10:41:47.331Z","target":"task-management-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"orderedTaskIds\":[\"d1866803-2fff-4ee1-9a4b-dcb44df7481f\",\"0d607fc0-7561-4851-be3d-c0606ad25221\",\"4a3fa806-cfc4-47f3-b61a-43fcf722b199\"],\"summary\":\"Local OpenClaw cluster prepared a GoalFlow plan for Recover attention during deep work.\",\"su"}]},"runId":"f3c73123-9597-4cbf-b90a-abe66a2dec94","traceId":"f790dc55-4a2b-416f-91d8-43d9990e5f32","parentTraceId":"64afd7d0-ff1b-4f92-ab32-31d79513e171","createdAt":"2026-03-07T10:41:47.331Z"}
```

### Progress Feedback Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"progress-feedback-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":0,\"taskCount\":0,\"completedTaskCount\":0,\"inProgressTaskCount\":0,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":0,\"suggestedFocusTaskId\":null,\"summaryHeadline\":\"Local OpenClaw cluster sees no tasks yet.\"}"}],"extractedJson":{"goalCount":0,"taskCount":0,"completedTaskCount":0,"inProgressTaskCount":0,"blockedTaskCount":0,"completionRate":0,"openInterventions":0,"suggestedFocusTaskId":null,"summaryHeadline":"Local OpenClaw cluster sees no tasks yet."},"normalizedJson":{"goalCount":0,"taskCount":0,"completedTaskCount":0,"inProgressTaskCount":0,"blockedTaskCount":0,"completionRate":0,"openInterventions":0,"suggestedFocusTaskId":"d1866803-2fff-4ee1-9a4b-dcb44df7481f","summaryHeadline":"Local OpenClaw cluster sees no tasks yet.","activeSession":{"id":"5aabd215-07d2-40b0-a446-7223389aa723","userId":"debug-focus-user","goalId":"d0ca98f7-bbd8-40eb-a569-8ce4dc52d231","taskId":"d1866803-2fff-4ee1-9a4b-dcb44df7481f","status":"active","startedAt":"2026-03-07T10:13:47.123Z","interruptionCount":0,"summary":""},"latestAssessment":{"id":"cfccc3a4-a06c-4be3-a924-f46a8c8bbc96","userId":"debug-focus-user","windowStart":"2026-03-07T10:16:47.123Z","windowEnd":"2026-03-07T10:37:47.123Z","focusScore":20,"energyScore":21,"moodScore":30,"summary":"Context switching is high. Energy is running low. Mood trend suggests frustration. Audio inference: Audio cluster inference suggests elevated stress and tense speech cadence. Video inference: Camera inference shows heavy blinking and lowered gaze stability. Health bridge shows short sleep and mild fatigue carry-over.","recommendedAction":"Pause for a short reset before resuming the next small task step.","emotionSummary":"Audio cluster inference suggests elevated stress and tense speech cadence.","emotionConfidence":0.82,"fatigueScore":79,"videoSummary":"Camera inference shows heavy blinking and lowered gaze stability.","healthSummary":"Health bridge shows short sleep and mild fatigue carry-over.","activeInputs":["desktop_signal","audio_server_inference","video_server_inference","health_bridge"],"mediaFreshness":"fresh","source":"manual","createdAt":"2026-03-07T10:39:47.131Z"},"latestRecoveryPlan":{"id":"b610c9b4-b834-4cbb-94cf-99ab60d77a7e","userId":"debug-focus-user","sessionId":"ed70cbba-3157-4a45-ae3a-e85d73970a8f","taskId":"0d607fc0-7561-4851-be3d-c0606ad25221","reason":"energy_drop","nextStep":"Resume \"Patch inbox reminder wording\" by completing the next visible sub-step.","suggestedMinutes":10,"reprioritizedTaskIds":["d1866803-2fff-4ee1-9a4b-dcb44df7481f","0d607fc0-7561-4851-be3d-c0606ad25221","4a3fa806-cfc4-47f3-b61a-43fcf722b199"],"createdAt":"2026-03-07T09:41:47.131Z"},"latestBehaviorConclusion":{"id":"e009a7b5-b5f6-460d-a7f7-72f28f193a31","createdAt":"2026-03-07T10:41:47.131Z","userId":"debug-focus-user","assessmentId":"cfccc3a4-a06c-4be3-a924-f46a8c8bbc96","sessionId":"5aabd215-07d2-40b0-a446-7223389aa723","taskId":"d1866803-2fff-4ee1-9a4b-dcb44df7481f","riskLevel":"high","summary":"OpenClaw cluster detected a high-risk state that likely needs intervention.","suggestedAction":"Pause for a short reset before resuming the next small task step.","trigger":"high_risk_state","recommendedChannel":"mobile_push"},"latestVideoAssessment":{"id":"17c4d59c-b368-41ea-8137-ac896502df7e","userId":"debug-focus-user","deviceId":"debug-desktop-focus","sessionId":"5aabd215-07d2-40b0-a446-7223389aa723","windowStart":"2026-03-07T10:28:47.124Z","windowEnd":"2026-03-07T10:34:47.124Z","fatigueScore":79,"focusScore":36,"confidence":0.78,"summary":"Camera inference shows heavy blinking and lowered gaze stability.","modelName":"debug-video-seed","featureSummary":"landmarks+blink+headpose","source":"cluster-stub","createdAt":"2026-03-07T10:41:47.124Z"},"latestHealthSnapshot":{"id":"55f48696-5aa0-4efb-931a-71222da06c52","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sourcePlatform":"android","sourceProvider":"health_connect","windowStart":"2026-03-06T22:41:47.124Z","windowEnd":"2026-03-07T06:41:47.124Z","heartRate":81,"oxygenSaturation":93,"restingHeartRate":70,"sleepMinutes":295,"summary":"Health bridge shows short sleep and mild fatigue carry-over.","createdAt":"2026-03-07T10:41:47.124Z"},"mobileAudio":{"enabled":true,"latestDevice":{"id":"a432ba75-6e82-4519-beb0-9622bbdd2dc3","userId":"debug-focus-user","deviceId":"debug-mobile-focus","deviceName":"Debug Android","platform":"android","appVersion":"debug-scenario","pairingState":"paired","desktopHost":"debug-focus.local","consentAcknowledgedAt":"2026-03-07T08:41:47.122Z","lastSeenAt":"2026-03-07T10:41:47.122Z","createdAt":"2026-03-07T10:41:47.122Z","updatedAt":"2026-03-07T10:41:47.122Z"},"latestSession":null,"latestEmotionAssessment":{"id":"49fc6ac4-77f2-4f51-81a2-732e83b4b2e4","userId":"debug-focus-user","deviceId":"debug-mobile-focus","sessionId":"5aabd215-07d2-40b0-a446-7223389aa723","chunkSequence":2,"windowStart":"2026-03-07T10:30:47.124Z","windowEnd":"2026-03-07T10:35:47.124Z","emotionLabel":"tense","valenceScore":32,"arousalScore":76,"stressScore":84,"confidence":0.82,"summary":"Audio cluster inference suggests elevated stress and tense speech cadence.","modelName":"debug-audio-seed","source":"cluster-stub","createdAt":"2026-03-07T10:41:47.124Z"},"latestCallEvent":null},"edgeDevices":[{"id":"7ccbe864-e00b-42b3-bc64-fc0498d09794","userId":"debug-focus-user","deviceId":"debug-desktop-focus","label":"Debug Focus Desktop","deviceType":"desktop","platform":"macos","capabilities":["desktop_signals","notifications","video_capture"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-03-07T10:41:47.122Z","createdAt":"2026-03-07T10:41:47.122Z","updatedAt":"2026-03-07T10:41:47.122Z"},{"id":"1670a2d3-1473-4fa0-8c37-07c5e80159b0","userId":"debug-focus-user","deviceId":"debug-mobile-focus","label":"Debug Focus Phone","deviceType":"mobile","platform":"android","capabilities":["notifications","health_bridge"],"status":"online","appVersion":"debug-scenario","queueDepth":0,"lastSeenAt":"2026-03-07T10:41:47.122Z","createdAt":"2026-03-07T10:41:47.122Z","updatedAt":"2026-03-07T10:41:47.122Z"}],"inbox":[{"id":"e46c3765-7b27-47f4-9755-ca058339362f","createdAt":"2026-03-07T10:41:47.131Z","status":"pending","userId":"debug-focus-user","title":"Recovery recommended","message":"OpenClaw cluster detected a high-risk state that likely needs intervention. Pause for a short reset before resuming the next small task step.","channel":"mobile_push"}],"goals":[{"id":"d0ca98f7-bbd8-40eb-a569-8ce4dc52d231","userId":"debug-focus-user","title":"Recover attention during deep work","description":"Seeded scenario for state, recovery, and notification agent tests.","status":"active","taskSummary":{"total":3,"completed":0},"createdAt":"2026-03-07T10:41:47.122Z","updatedAt":"2026-03-07T10:41:47.123Z"}],"tasks":[{"id":"d1866803-2fff-4ee1-9a4b-dcb44df7481f","userId":"debug-focus-user","goalId":"d0ca98f7-bbd8-40eb-a569-8ce4dc52d231","title":"Validate chief-agent routing under stress","status":"in_progress","priority":"high","estimatedMinutes":35,"sortOrder":0,"createdAt":"2026-03-07T10:41:47.122Z","updatedAt":"2026-03-07T10:41:47.123Z"},{"id":"0d607fc0-7561-4851-be3d-c0606ad25221","userId":"debug-focus-user","goalId":"d0ca98f7-bbd8-40eb-a569-8ce4dc52d231","title":"Patch inbox reminder wording","status":"todo","priority":"medium","estimatedMinutes":20,"sortOrder":1,"createdAt":"2026-03-07T10:41:47.123Z","updatedAt":"2026-03-07T10:41:47.123Z"},{"id":"4a3fa806-cfc4-47f3-b61a-43fcf722b199","userId":"debug-focus-user","goalId":"d0ca98f7-bbd8-40eb-a569-8ce4dc52d231","title":"Review reflection highlights","status":"todo","priority":"low","estimatedMinutes":15,"sortOrder":2,"createdAt":"2026-03-07T10:41:47.123Z","updatedAt":"2026-03-07T10:41:47.123Z"}]},"adapter":{"traceId":"dde05fa4-9f94-4d6f-8d00-bc5f2dd79b5d","parentTraceId":"27a74eba-2112-411b-a6e8-7b26bca981a0","createdAt":"2026-03-07T10:41:47.348Z","target":"progress-feedback-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"goalCount\":0,\"taskCount\":0,\"completedTaskCount\":0,\"inProgressTaskCount\":0,\"blockedTaskCount\":0,\"completionRate\":0,\"openInterventions\":0,\"suggestedFocusTaskId\":null,\"summaryHeadline\":\"Local OpenClaw cluster sees no tasks yet.\"}"}]},"runId":"f7683829-03e8-4974-8c26-a3590e22ae63","traceId":"dde05fa4-9f94-4d6f-8d00-bc5f2dd79b5d","parentTraceId":"27a74eba-2112-411b-a6e8-7b26bca981a0","createdAt":"2026-03-07T10:41:47.348Z"}
```

### Automation Debug Response

```json
{"success":true,"fallbackLikely":false,"config":{"target":"automation-agent","baseUrl":"http://127.0.0.1:8787","model":"gpt-5.4","wireApi":"responses","reasoningEffort":"xhigh","disableResponseStorage":true,"hasApiKey":true},"attempts":[{"endpoint":"cluster:/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"Behavior reminder\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}],"extractedJson":{"title":"Behavior reminder","message":"Pause for a short reset before resuming the next small task step.","channel":"mobile_push","deliver":true},"normalizedJson":{"title":"Behavior reminder","message":"Pause for a short reset before resuming the next small task step.","channel":"mobile_push","deliver":true},"adapter":{"traceId":"90a02f50-a1c9-45a1-94a0-59d6f13946c4","parentTraceId":"13c76fe6-16c6-4303-a771-71803a518893","createdAt":"2026-03-07T10:41:47.364Z","target":"automation-agent","mode":"debug","strategy":"cluster-preferred","route":"cluster","success":true,"selectedEndpoint":"cluster:/v1/tasks/execute","fallbackReason":null,"clusterAttempts":[{"endpoint":"/v1/tasks/execute","status":200,"ok":true,"preview":"{\"title\":\"Behavior reminder\",\"message\":\"Pause for a short reset before resuming the next small task step.\",\"channel\":\"mobile_push\",\"deliver\":true}"}]},"runId":"602f540b-a46e-4b43-8774-5d959abd3719","traceId":"90a02f50-a1c9-45a1-94a0-59d6f13946c4","parentTraceId":"13c76fe6-16c6-4303-a771-71803a518893","createdAt":"2026-03-07T10:41:47.364Z"}
```
