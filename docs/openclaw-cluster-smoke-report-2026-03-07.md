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

- 日期：
- 执行人：
- 机器：
- Gateway 提交/版本：
- Cluster 提交/版本：
- 执行环境：
  - `MINDANCHOR_API_URL`：
  - `MINDANCHOR_OPENCLAW_BASE_URL`：
  - `MINDANCHOR_AGENT_MODE`：
  - provider fallback 是否配置：

## 2. 直连 cluster 合同检查

| Endpoint | HTTP Status | success 字段 | parsed / outputText | 结果 |
| --- | --- | --- | --- | --- |
| `/v1/tasks/execute` |  |  |  |  |
| `/tasks/execute` |  |  |  |  |
| `/api/tasks/execute` |  |  |  |  |

### 原始结论

- 实际命中的 cluster 兼容端点：
- 是否返回 `trace.traceId`：
- 是否返回 `taskId`：
- 是否返回 `metadata.runtime` / `metadata.worker`：

## 3. Gateway cluster-preferred 检查

### `/health`

- HTTP Status：
- `mode`：
- `openClawBaseUrl`：
- 结果：通过 / 不通过

### `/debug/openclaw/adapter`

- HTTP Status：
- `clusterEnabled`：
- `executionStrategy`：
- `lastDecision.route`：
- `lastDecision.selectedEndpoint`：
- `lastFallback.fallbackReason`：
- `recentTimeline` 是否有记录：
- 结果：通过 / 不通过

### `/debug/model-probe/chief-agent`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `adapter.fallbackReason`：
- `traceId`：
- 结果：通过 / 不通过

### `POST /debug/scenarios/focus-recovery-loop/seed`

- HTTP Status：
- `scenarioId`：
- `userId`：
- 结果：通过 / 不通过

### `/debug/agent/state-insight`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `traceId`：
- 结果：通过 / 不通过

### `/debug/agent/interruption-recovery`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `traceId`：
- 结果：通过 / 不通过

### `/debug/agent/reflection`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `traceId`：
- 结果：通过 / 不通过

### `/debug/agent/task-management`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `traceId`：
- 结果：通过 / 不通过

### `/debug/agent/progress-feedback`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `traceId`：
- 结果：通过 / 不通过

### `/debug/agent/automation`

- HTTP Status：
- `success`：
- `adapter.route`：
- `adapter.selectedEndpoint`：
- `traceId`：
- 结果：通过 / 不通过

## 4. Web / Agent Lab 检查

- Dashboard 可打开：是 / 否
- GoalFlow 可打开：是 / 否
- State Trends 可打开：是 / 否
- Recovery 可打开：是 / 否
- Reflections 可打开：是 / 否
- Inbox 可打开：是 / 否
- Agent Lab 可打开：是 / 否

### Agent Lab 重点

- adapter 状态卡显示正常：是 / 否
- `Probe chief-agent` 显示路径：`cluster / provider-fallback / provider-direct / failed`
- `state-insight-agent` debug 显示路径：`cluster / provider-fallback / provider-direct / failed`
- `interruption-recovery-agent` debug 显示路径：`cluster / provider-fallback / provider-direct / failed`
- `reflection-coach-agent` debug 显示路径：`cluster / provider-fallback / provider-direct / failed`
- `task-management-agent` debug 显示路径：`cluster / provider-fallback / provider-direct / failed`
- `progress-feedback-agent` debug 显示路径：`cluster / provider-fallback / provider-direct / failed`
- `automation-agent` debug 显示路径：`cluster / provider-fallback / provider-direct / failed`
- Trace Inspector 能查到事件：是 / 否

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

## Manual Verification Prep Snapshot

- Captured at: 2026-03-07T11:39:40.229318Z
- Gateway mode: `openai-compatible`
- OpenClaw base URL: `http://127.0.0.1:8787`
- Adapter strategy: `cluster-preferred`
- Seeded scenario: `focus-recovery-loop` / user `debug-focus-user`

### Open these pages

- http://127.0.0.1:5173/agents
- http://127.0.0.1:5173/recovery
- http://127.0.0.1:5173/reflections
- http://127.0.0.1:5173/tasks
- http://127.0.0.1:5173/state
- http://127.0.0.1:5173/inbox

### Human checks

- Agent Lab: strategy should be `cluster-preferred`
- Agent Lab: probe/debug route badges should become `cluster`
- Recovery: latest recovery plan should be populated
- Reflections: weekly/monthly reports should show business text
- GoalFlow: suggested focus tag and focus session area should be visible
- State Trends: current assessment should show concrete scores
- Inbox: channel distribution and message queues should not be empty

## Manual Verification Prep Snapshot

- Captured at: 2026-03-07T13:34:24.565560Z
- Gateway mode: `openai-compatible`
- OpenClaw base URL: `http://127.0.0.1:8787`
- Adapter strategy: `cluster-preferred`
- Business-page bootstrap user: `demo-user`
- Seeded scenario: `focus-recovery-loop` / user `debug-focus-user`

### Open these pages

- http://127.0.0.1:5173/agents
- http://127.0.0.1:5173/recovery
- http://127.0.0.1:5173/reflections
- http://127.0.0.1:5173/tasks
- http://127.0.0.1:5173/state
- http://127.0.0.1:5173/inbox

### Human checks

- Agent Lab: strategy should be `cluster-preferred`
- Agent Lab: probe/debug route badges should become `cluster`
- Recovery: latest recovery plan should be populated
- Reflections: weekly/monthly reports should show business text
- GoalFlow: suggested focus tag and focus session area should be visible
- State Trends: current assessment should show concrete scores
- Inbox: channel distribution and message queues should not be empty

## Manual Verification Prep Snapshot

- Captured at: 2026-03-07T14:57:21.938563Z
- Gateway mode: `openai-compatible`
- OpenClaw base URL: `http://127.0.0.1:8790`
- Adapter strategy: `cluster-preferred`
- Business-page bootstrap user: `demo-user`
- Seeded scenario: `focus-recovery-loop` / user `debug-focus-user`

### Open these pages

- http://127.0.0.1:5174/agents
- http://127.0.0.1:5174/recovery
- http://127.0.0.1:5174/reflections
- http://127.0.0.1:5174/tasks
- http://127.0.0.1:5174/state
- http://127.0.0.1:5174/inbox

### Human checks

- Agent Lab: strategy should be `cluster-preferred`
- Agent Lab: probe/debug route badges should become `cluster`
- Recovery: latest recovery plan should be populated
- Reflections: weekly/monthly reports should show business text
- GoalFlow: suggested focus tag and focus session area should be visible
- State Trends: current assessment should show concrete scores
- Inbox: channel distribution and message queues should not be empty

## Manual Verification Prep Snapshot

- Captured at: 2026-03-07T15:01:03.209757Z
- Gateway mode: `openai-compatible`
- OpenClaw base URL: `http://127.0.0.1:8791`
- Adapter strategy: `cluster-preferred`
- Business-page bootstrap user: `demo-user`
- Seeded scenario: `focus-recovery-loop` / user `debug-focus-user`

### Open these pages

- http://127.0.0.1:5175/agents
- http://127.0.0.1:5175/recovery
- http://127.0.0.1:5175/reflections
- http://127.0.0.1:5175/tasks
- http://127.0.0.1:5175/state
- http://127.0.0.1:5175/inbox

### Human checks

- Agent Lab: strategy should be `cluster-preferred`
- Agent Lab: probe/debug route badges should become `cluster`
- Recovery: latest recovery plan should be populated
- Reflections: weekly/monthly reports should show business text
- GoalFlow: suggested focus tag and focus session area should be visible
- State Trends: current assessment should show concrete scores
- Inbox: channel distribution and message queues should not be empty

## Manual Verification Prep Snapshot

- Captured at: 2026-03-07T15:29:25.741080Z
- Gateway mode: `openai-compatible`
- OpenClaw base URL: `http://127.0.0.1:8792`
- Adapter strategy: `cluster-preferred`
- Business-page bootstrap user: `demo-user`
- Seeded scenario: `focus-recovery-loop` / user `debug-focus-user`

### Open these pages

- http://127.0.0.1:5176/agents
- http://127.0.0.1:5176/recovery
- http://127.0.0.1:5176/reflections
- http://127.0.0.1:5176/tasks
- http://127.0.0.1:5176/state
- http://127.0.0.1:5176/inbox

### Human checks

- Agent Lab: strategy should be `cluster-preferred`
- Agent Lab: probe/debug route badges should become `cluster`
- Recovery: latest recovery plan should be populated
- Reflections: weekly/monthly reports should show business text
- GoalFlow: suggested focus tag and focus session area should be visible
- State Trends: current assessment should show concrete scores
- Inbox: channel distribution and message queues should not be empty

## Manual Verification Prep Snapshot

- Captured at: 2026-03-07T15:31:29.770349Z
- Gateway mode: `openai-compatible`
- OpenClaw base URL: `http://127.0.0.1:8793`
- Adapter strategy: `cluster-preferred`
- Business-page bootstrap user: `demo-user`
- Seeded scenario: `focus-recovery-loop` / user `debug-focus-user`

### Open these pages

- http://127.0.0.1:5177/agents
- http://127.0.0.1:5177/recovery
- http://127.0.0.1:5177/reflections
- http://127.0.0.1:5177/tasks
- http://127.0.0.1:5177/state
- http://127.0.0.1:5177/inbox

### Human checks

- Agent Lab: strategy should be `cluster-preferred`
- Agent Lab: probe/debug route badges should become `cluster`
- Recovery: latest recovery plan should be populated
- Reflections: weekly/monthly reports should show business text
- GoalFlow: suggested focus tag and focus session area should be visible
- State Trends: current assessment should show concrete scores
- Inbox: channel distribution and message queues should not be empty

## Manual Verification Prep Snapshot

- Captured at: 2026-03-07T15:37:01.117192Z
- Gateway mode: `openai-compatible`
- OpenClaw base URL: `http://127.0.0.1:8794`
- Adapter strategy: `cluster-preferred`
- Business-page bootstrap user: `demo-user`
- Seeded scenario: `focus-recovery-loop` / user `debug-focus-user`

### Open these pages

- http://127.0.0.1:5178/agents
- http://127.0.0.1:5178/recovery
- http://127.0.0.1:5178/reflections
- http://127.0.0.1:5178/tasks
- http://127.0.0.1:5178/state
- http://127.0.0.1:5178/inbox

### Human checks

- Agent Lab: strategy should be `cluster-preferred`
- Agent Lab: probe/debug route badges should become `cluster`
- Recovery: latest recovery plan should be populated
- Reflections: weekly/monthly reports should show business text
- GoalFlow: suggested focus tag and focus session area should be visible
- State Trends: current assessment should show concrete scores
- Inbox: channel distribution and message queues should not be empty

## Manual Verification Prep Snapshot

- Captured at: 2026-03-07T15:52:13.926291Z
- Gateway mode: `openai-compatible`
- OpenClaw base URL: `http://127.0.0.1:8797`
- Adapter strategy: `cluster-preferred`
- Business-page bootstrap user: `demo-user`
- Seeded scenario: `focus-recovery-loop` / user `debug-focus-user`
- Web console smoke: `passed`
- Dashboard taskCount: `3`
- GoalFlow totalTasks: `3`
- State assessments: `1`
- Recovery plans: `1`
- Reflection reports: `2`
- Inbox messages: `2`

### Open these pages

- http://127.0.0.1:5181/agents
- http://127.0.0.1:5181/recovery
- http://127.0.0.1:5181/reflections
- http://127.0.0.1:5181/tasks
- http://127.0.0.1:5181/state
- http://127.0.0.1:5181/inbox

### Human checks

- Agent Lab: strategy should be `cluster-preferred`
- Agent Lab: probe/debug route badges should become `cluster`
- Recovery: latest recovery plan should be populated
- Reflections: weekly/monthly reports should show business text
- GoalFlow: suggested focus tag and focus session area should be visible
- State Trends: current assessment should show concrete scores
- Inbox: channel distribution and message queues should not be empty
