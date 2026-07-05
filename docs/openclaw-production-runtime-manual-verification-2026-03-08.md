# OpenClaw Production Runtime 页面人工验收记录（2026-03-08）

## 1. 验收范围

本记录对应 `M5 — Production OpenClaw Runtime` 的当前基线验收，关注：

- runtime 已切换到结构化真实 runtime 入口；
- Gateway 已指向 `http://192.168.0.102:8800`；
- 页面是否能读到真实 cluster 路径产出的内容；
- 哪些页面已经足以判定“可用”，哪些还需要补截图或更严格留档。

## 2. 当前环境

- Runtime Base URL：`http://192.168.0.102:8800`
- Gateway Base URL：`http://127.0.0.1:3024`
- Web Base URL：`http://127.0.0.1:5184`
- Gateway mode：`openai-compatible`
- execution strategy：`cluster-preferred`

## 3. 同机人工验收结论

### 3.1 已通过

- `Agent Lab`：通过
  - `strategy · cluster-preferred` 已出现
  - `route · cluster` 已出现
  - adapter 卡、config 卡、timeline 可读
  - 长 agent prefix 溢出问题已处理到更贴近人类使用习惯的布局
- `Recovery`：通过
  - 恢复计划和恢复验证内容已出现真实内容
- `Reflections`：通过
  - 周报 / 月报已有真实内容
- `State Trends`：通过
  - 当前状态评估与趋势内容可读
- `Inbox`：通过
  - 消息内容与渠道统计可读

### 3.2 部分通过

- `Dashboard`：部分通过
  - 同日浏览器端已有正向观察，但加载真实聚合内容相对更慢
  - 当前 API 复核已返回真实聚合数据，见本记录第 4 节
  - 仍建议补一轮稳定截图或录屏
- `GoalFlow`：部分通过
  - 页面入口与 API 数据已确认
  - 当前 API 复核已返回真实 goals / tasks / suggested focus
  - 仍建议补一轮稳定截图或录屏

## 4. 当前 API 复核证据

### 4.1 `GET /dashboard/summary?userId=demo-user`

当前返回已包含真实聚合字段，包括：

- `goalCount = 1`
- `taskCount = 3`
- `inProgressTaskCount = 1`
- `suggestedFocusTaskId` 已返回
- `activeSession` 已返回
- `latestAssessment.summary` 已返回真实中文总结

这说明 `Dashboard` 背后的 cluster-first 聚合管线当前是活的。

### 4.2 `GET /goalflow/overview?userId=demo-user`

当前返回已包含真实目标与任务字段，包括：

- 1 个 active goal
- 3 个任务
- 1 个 `in_progress` 高优任务
- 任务标题、优先级、预计时长均已返回

这说明 `GoalFlow` 背后的 cluster-first 聚合管线当前是活的。

## 5. 当前判断

- 这份记录足以证明：
  - 真实 runtime 没有把 Web 控制台主链路打断；
  - `Agent Lab` 与多页面 cluster 内容已经能被同机人工读到；
  - `Dashboard / GoalFlow` 的真实数据已通过 API 再次确认。
- 这份记录仍不足以单独宣告 `M5` 完成，因为还缺：
  - 跨机器 / 新机器恢复验收
  - `Dashboard / GoalFlow` 更严格的截图化留档
  - 更正式的跨版本升级 / 回滚实战记录

## 6. 配套材料

- `docs/openclaw-production-runtime-smoke-report-2026-03-08.md`
- `docs/openclaw-production-runtime-deployment.md`
- `docs/openclaw-production-runtime-ops-guide.md`
- `docs/m5-production-runtime-completion-checklist.md`
