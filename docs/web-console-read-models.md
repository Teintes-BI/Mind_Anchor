# Web Console Read Models

这份文档记录当前 Web 控制台各页面对应的正式读模型接口，便于继续开发、联调和回归验证。

## 页面到接口映射

- `Dashboard`
  - `GET /dashboard/summary`
  - 用途：总览指标、最新状态、最新恢复计划、设备、Inbox 摘要

- `GoalFlow / Tasks`
  - `GET /goalflow/overview`
  - 用途：目标列表、任务列表、当前专注会话、建议聚焦任务、最新恢复/状态上下文

- `State Trends`
  - `GET /state/trends`
  - 用途：当前状态、多模态趋势、行为结论、通话/健康/视频/音频趋势

- `Recovery`
  - `GET /recovery/history`
  - 用途：中断会话、恢复计划、最新干预、待恢复任务

- `Reflections`
  - `GET /reflections/overview`
  - 用途：周报/月报概览、报告列表、支撑输入计数

- `Inbox`
  - `GET /client/inbox/overview`
  - 用途：消息队列、pending/ack 分布、渠道统计、最新行为结论与恢复上下文

- `Agent Lab`
  - `GET /debug/openclaw/adapter`
  - `GET /debug/agent-configs`
  - `GET /debug/model-probe/:agentName`
  - `GET /debug/agent/*`
  - `GET /debug/scenarios`
  - `POST /debug/scenarios/:scenarioId/seed`
  - `POST /debug/regressions/full-run`
  - `POST /debug/regressions/matrix-run`
  - `GET /debug/traces/:traceId`

## 兼容接口

以下接口仍保留，用于兼容旧页面逻辑或更细粒度的调试：

- `GET /goals`
- `GET /tasks`
- `GET /sessions`
- `GET /state/latest`
- `GET /state/history`
- `GET /reflections/latest`
- `GET /client/inbox`

原则上，新的 Web 页面优先消费正式读模型接口；兼容接口保留给写操作后的回流、局部调试和旧代码路径。

## 推荐联调顺序

1. `GET /dashboard/summary`
2. `GET /goalflow/overview`
3. `GET /state/trends`
4. `GET /recovery/history`
5. `GET /reflections/overview`
6. `GET /client/inbox/overview`
7. `GET /debug/openclaw/adapter`

对应的实际联调顺序与页面验收清单见 `docs/web-console-smoke-checklist.md`。

## 当前状态

- 上述接口都已在 Web 控制台对应页面接入
- `Agent Lab` 已能显示 cluster/provider/fallback 路径
- 后续优先方向不再是“继续让页面自己拼原始接口”，而是继续扩展这些读模型的稳定性与可解释性
