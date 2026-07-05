# Structured Local Runtime Plan

## 状态

- 当前阶段：`M3 — Structured Local Runtime`
- 当前主模块：`OpenClaw 本地运行时结构化升级`
- 最后更新：`2026-03-07`
- Phase 1 状态：`已完成`
- Phase 2 状态：`已完成第一轮`
- Phase 3 状态：`已完成第一轮`
- Phase 4 状态：`已完成第一轮`
- 当前下一步：`继续推进 M4，把 State / Inbox / Dashboard 的更多业务结论迁到 cluster-first`
- 对齐文档：
  - `docs/spec.md`
  - `docs/development-handoff-2026-03-07.md`
  - `docs/final-product-description.md`

## 1. 这是不是当前最重要的大模块

是。

当前仓库里：

- `Gateway + Web Console` 已经达到“可运行、可调试、可验收”的程度
- `Agent Lab` 的 adapter 可视化、cluster/provider 路由可见性、debug/read-model 页面已经基本成型
- 本地 OpenClaw cluster 也已经能跑通 smoke 与人工验收链路

但真正限制后续质量的核心瓶颈，已经从“页面有没有”变成：

- 本地 cluster 仍偏**最小兼容服务**
- worker 结构还不够正式
- manifest / runtime / worker / verification 之间还不够收束
- 一部分业务语义仍依赖 Gateway heuristics，而不是更真实的 cluster 输出

所以，当前最值得单独立详细计划的模块，就是：

**把本地 OpenClaw 从“可跑的兼容服务”推进到“结构化、可扩展、可持续演进的本地运行时”。**

---

## 2. 当前基线

### 已完成基线

- `apps/api` 已提供 cluster-first Gateway 与 read-model 聚合
- `apps/web` 已提供 Dashboard / GoalFlow / State / Recovery / Reflections / Inbox / Agent Lab
- `GET /debug/openclaw/adapter` 已可查看 adapter 状态
- 本地 cluster 已可通过：
  - `corepack pnpm dev:openclaw`
  - `corepack pnpm dev:local-cluster-stack`
  - `corepack pnpm smoke:cluster`
  - `corepack pnpm smoke:web-console`
- 本地 runtime 已从单文件开始拆出：
  - `openclaw/local-runtime/manifest.mjs`
  - `openclaw/local-runtime/context.mjs`
  - `openclaw/local-runtime/workers.mjs`
  - `openclaw/local-runtime/server.mjs`

### 当前不足

- runtime 仍是单进程、最小兼容形态
- worker registry 仍偏轻量，边界不够清晰
- agent 输出虽然已有业务语义，但还不够统一、可维护、可扩展
- runtime 元数据与 smoke/调试页面的联动还可以更正式
- 第一版 UI 文案还没有完成“默认中文化”的统一收口

---

## 3. 模块目标

本模块的目标不是再做一遍 Gateway，也不是去做正式生产集群，而是：

1. 把本地 OpenClaw 升级为更正式的 `runtime / router / worker / manifest` 结构
2. 保持现有 Gateway / Web / smoke / 手工验收链路持续可用
3. 让本地 worker 输出更接近真实业务结论，而不是空壳或演示文本
4. 让调试、trace、验证、页面展示都能稳定消费 runtime 结果
5. 把第一版 Web Console 文案收束为“以中文为主，仅保留必要专有名词”

---

## 4. 非目标

当前计划**不**直接覆盖以下事项：

- 正式生产级多 worker 部署
- 远程 OpenClaw 集群真正上线运维
- 桌面端 / 手机端最终统一化
- 健康中枢真实系统接入
- 把全部 Gateway heuristics 一次性迁空

这些属于后续 `M4 / M5`。

---

## 5. 工作流拆解

### 5.1 Runtime Kernel

目标：先把“骨架”做稳。

### 要做什么

- 收束本地 runtime 入口，明确：
  - server 负责什么
  - router 负责什么
  - worker registry 负责什么
  - worker handler 负责什么
- 统一 task envelope 的读取、校验、错误返回和 metadata 结构
- 让 runtime health / execute contract / manifest 信息具备稳定输出
- 让 metadata 固定带上：
  - `runtime`
  - `worker`
  - `agent`
  - `modelTarget`
  - `skills`

### 完成判定

- 运行时入口清晰，不再依赖单文件堆叠
- 新增或替换 worker 时，不需要改一大片 server 逻辑
- smoke 可以稳定读取并验证 runtime 元信息

### 5.2 Worker Registry 与 Manifest 对齐

目标：让 worker 不再是“散的函数集合”，而是受 manifest 驱动的注册体系。

### 要做什么

- 以 `openclaw/agents/manifest.json` 为核心注册来源
- 统一 worker descriptor 结构
- 每个 agent 至少定义：
  - `name`
  - `modelTarget`
  - `skills`
  - `supported workflows`
  - `response builder`
- chief/state/recovery/reflection/task/progress/automation 的映射关系明确化

### 完成判定

- manifest 改动能稳定反映到本地 runtime
- registry 能输出“当前有哪些 worker、对应哪个 agent、用什么 modelTarget”
- debug / smoke / health 可以看到稳定一致的 worker 描述

### 5.3 更接近真实业务的 Worker 输出

目标：让本地 cluster 的返回不只是“能过 schema”，而是能支撑人工验收。

### 要做什么

- `state-insight-agent`
  - 输出更像真实状态判断、风险解释、建议动作
- `interruption-recovery-agent`
  - 输出更完整的恢复计划、恢复窗口、候选下一步
- `reflection-coach-agent`
  - 输出更像周报/月报摘要，而不是占位文本
- `task-management-agent`
  - 输出更贴近 GoalFlow 排序、拆分、建议 focus
- `progress-feedback-agent`
  - 输出更像最近进展总结
- `automation-agent`
  - 输出更像通知决策建议

### 完成判定

- Recovery / Reflections / GoalFlow / State Trends 页面内容具备业务语义
- “Latest recovery plan 为空壳”这类问题不再出现
- 人工验收时，页面内容可以被人类快速理解

### 5.4 Gateway / Adapter / Read-model 对齐

目标：保证 runtime 升级不会把已有链路打断。

### 要做什么

- 保持 `cluster-preferred -> cluster` 路由在 Agent Lab 中持续可见
- 保持 `provider-fallback` 路由仍可被验证
- 保持 Gateway 当前 schema 能消费 runtime 输出
- 逐步减少“仅靠 Gateway 本地 heuristics 才能出内容”的情况

### 完成判定

- `GET /debug/openclaw/adapter` 仍然准确
- `Probe chief-agent`、`state-insight debug` 能稳定显示 `route = cluster`
- 业务页的数据来源更多体现 cluster 输出

### 5.5 Verification 自动化与人工验收

目标：把“能跑一次”变成“可重复验证”。

### 要做什么

- 保持 `prepare:local-cluster-ui-check` 可稳定准备演示数据
- 保持 `demo-user` 与人工验收路径一致
- smoke 报告持续自动回填
- 页面人工验收手册与脚本持续同步
- 必要时补充 browser MCP 下的人工验收记录

### 完成判定

- 新机器上按文档就能恢复本地验收环境
- 业务页不是空白，且不需要手工找隐藏初始化步骤
- smoke 与人工验收结论能够收敛

### 5.6 中文优先 UI 文案收口

目标：第一版 UI 先做到“人能看懂、默认中文”。

### 文案原则

- 默认使用中文
- 仅保留高频专有名词或技术词：
  - `Dashboard`
  - `GoalFlow`
  - `Agent Lab`
  - `OpenClaw`
  - `Gateway`
  - `traceId`
  - `route`
  - `cluster`
  - `provider`
- 调试页也优先使用中文解释，而不是堆英文标签
- 状态、错误、空态、按钮、说明文案都纳入收口范围

### 优先级

1. `AgentLabPage.tsx`
2. `DashboardPage.tsx`
3. `RecoveryPage.tsx`
4. `ReflectionsPage.tsx`
5. `TasksPage.tsx`
6. `StatePage.tsx`
7. `InboxPage.tsx`

### 完成判定

- 首屏关键卡片、按钮、空态、说明基本为中文
- 保留少量必要专有名词后，页面仍清晰专业
- 不为了“翻译”牺牲技术可读性

---

## 6. 分阶段执行顺序

### Phase 1：Runtime 骨架收束

- 固化 server / registry / worker 边界
- 固化 metadata 结构
- 保证现有 smoke 不回退

### Phase 2：Worker 语义增强

- 重点补强：
  - `state-insight-agent`
  - `interruption-recovery-agent`
  - `reflection-coach-agent`
- 让页面内容先“有真实感”

### Phase 3：验收链路稳固

- 让 bootstrap、manual verification、smoke report 一致
- 降低“某页为空是因为没 seed 到正确用户”的问题

### Phase 4：UI 中文化收口

- 先改调试台与核心业务页
- 再统一按钮、空态、说明文案

### Phase 5：M3 收尾，转入 M4

- 当本地 structured runtime 稳定后
- 再推进“更多业务结论真正迁到 cluster 侧产出”

---

## 7. 详细任务清单

### 7.1 代码层

- 整理 `openclaw/local-runtime/server.mjs`
- 强化 `openclaw/local-runtime/workers.mjs`
- 继续利用 `openclaw/local-runtime/manifest.mjs`
- 必要时新增 `router` 或 `registry` 模块，避免 server 继续变胖
- 检查 `apps/api/src/lib/openclaw-cluster-client.ts` 与 runtime metadata 的契约一致性
- 检查 `apps/api/src/orchestrator.ts` 是否继续正确消费 cluster 输出

### 7.2 验证层

- 保持 `scripts/dev-local-cluster-stack.sh` 可用
- 保持 `scripts/prepare-local-cluster-manual-check.sh` 可用
- 保持 `scripts/smoke-openclaw-cluster.sh` 可用
- 保持 `scripts/smoke-web-console.sh` 可用
- 必要时回填：
  - `docs/openclaw-cluster-smoke-report-local-2026-03-07.md`
  - `docs/development-handoff-2026-03-07.md`

### 7.3 文案层

- 统一 `apps/web/src/pages/` 下核心页面的中文优先文案
- 先处理人最常看到的顶部区域、关键卡片、按钮、状态徽章
- 对专有名词保持统一，不做来回混翻

---

## 8. 风险与防回退

### 风险 1：runtime 结构化时打断现有 smoke

防回退方式：

- 每次优先保住 `smoke:cluster`
- 再保住 `smoke:web-console`
- 再做更大重构

### 风险 2：worker 输出变复杂后 schema 不兼容

防回退方式：

- 先对齐 Gateway 当前 schema
- 保持“先可消费，再变丰富”

### 风险 3：UI 中文化时技术含义变模糊

防回退方式：

- 保留必要专有名词
- 中文解释优先，关键技术词保留英文原词

### 风险 4：人工验收与自动化环境脱节

防回退方式：

- 手册、脚本、smoke report 同步更新
- `demo-user` 作为默认人工验收用户固定下来

---

## 9. 完成 M3 的退出标准

满足以下条件，才算 `Structured Local Runtime` 这一大模块基本完成：

- 本地 cluster 已不是单纯“最小兼容脚本”，而是清晰的 runtime 结构
- manifest / worker / metadata / smoke 彼此一致
- 关键业务 agent 输出具备真实业务语义
- Agent Lab 能稳定看到 `cluster-preferred` 与 `route = cluster`
- Recovery / Reflections / GoalFlow / State / Inbox / Dashboard 不再主要靠空壳数据支撑
- 核心 Web Console 文案第一版已完成中文优先收口

---

## 10. 当前建议的直接下一步

如果按“最稳健”顺序继续做，建议马上执行：

1. 继续收束本地 runtime 的 registry / worker 边界
2. 优先补强 `recovery` 与 `reflection` 的真实业务输出
3. 跑一轮 `smoke:cluster` 与 `smoke:web-console`
4. 开始核心页面中文文案收口
5. 回填 spec / handoff / smoke report

这条路径最符合当前仓库状态，也最贴近最终产品定义。
