# M4 Cluster-first Read-model Audit

## 状态

- 最后更新：`2026-03-08`
- 目的：明确当前 Web 控制台各读模型是否已进入 `cluster-first`，以及 Gateway 本地 heuristic 还剩什么角色

---

## 1. 总结

截至当前仓库状态：

- **Web 控制台核心读模型已经基本进入 `cluster-first`**
- Gateway 本地 heuristic 仍存在，但主要已经退到：
  - `stub`
  - cluster 不可用时的 fallback
  - schema normalize / 安全兜底
  - 场景 seed / 本地 compatibility runtime

换句话说：

**在 `openai-compatible + MINDANCHOR_OPENCLAW_BASE_URL` 打开时，核心业务页已不再主要依赖本地 heuristic 才能出业务结论。**

---

## 2. 核心读模型审计

### 2.1 `GET /dashboard/summary`

- 主路径：`chief-agent -> progress-feedback-agent`
- 读取前刷新：
  - `ensureFreshStateOutputs()`
- 当前状态：`cluster-first`
- 本地 heuristic 角色：
  - `buildDashboardSummaryFallback()` 仅在 cluster/provider 失败时兜底

### 2.2 `GET /goalflow/overview`

- 主路径：复用 `getDashboardSummary()`
- 读取前刷新：
  - 同 `dashboard/summary`
- 当前状态：`cluster-first`
- 本地 heuristic 角色：
  - 不再直接主导 summary
  - 仅复用 fallback summary 作为兜底

### 2.3 `GET /state/latest`

- 主路径：`chief-agent -> state-insight-agent`
- 读取前刷新：
  - `ensureFreshStateOutputs()`
- 当前状态：`cluster-first`
- 本地 heuristic 角色：
  - `scoreState()` 仅作为 fallback assessment

### 2.4 `GET /state/trends`

- 主路径：复用 `ensureFreshStateOutputs()`
- 读取前刷新：
  - `ensureFreshStateOutputs()`
- 当前状态：`cluster-first`
- 本地 heuristic 角色：
  - assessment / behavior 仍有 fallback，但不再是首选主路径

### 2.5 `GET /recovery/history`

- 主路径：
  - `ensureFreshStateOutputs()`
  - `chief-agent -> task-management-agent`
- 读取前刷新：
  - state / behavior freshness
  - recovery candidate ordering
- 当前状态：`cluster-first`
- 本地 heuristic 角色：
  - `buildRecoveryPlan()` 仍用于 fallback recovery plan
  - `buildTaskManagementFallback()` 仍用于 fallback ordering

### 2.6 `GET /reflections/overview`

- 主路径：`chief-agent -> reflection-coach-agent`
- 读取前刷新：
  - `ensureFreshReflectionOutputs()`
- 当前状态：`cluster-first`
- 本地 heuristic 角色：
  - `generateReflectionReport()` 仍作为 fallback reflection 生成器

### 2.7 `GET /client/inbox/overview`

- 主路径：
  - `ensureFreshStateOutputs()`
  - `chief-agent -> automation-agent`（行为结论）
  - `chief-agent -> automation-agent`（通知内容）
- 读取前刷新：
  - state
  - behavior
  - notification message
- 当前状态：`cluster-first`
- 本地 heuristic 角色：
  - `buildInboxMessage()` 仅作为 fallback notification copy

---

## 3. 仍存在的本地 heuristic / fallback

下面这些仍然存在，但当前应视为**兜底层**，而不是主导层：

### 3.1 状态相关

- `scoreState()`
  - 作用：state assessment fallback
  - 当前定位：`fallback only`

### 3.2 恢复相关

- `buildRecoveryPlan()`
  - 作用：recovery plan fallback
  - 当前定位：`fallback only`

### 3.3 任务排序相关

- `buildTaskManagementFallback()`
  - 作用：task ordering / suggested tasks fallback
  - 当前定位：`fallback only`

### 3.4 进展摘要相关

- `buildDashboardSummaryFallback()`
  - 作用：dashboard summary fallback
  - 当前定位：`fallback only`

### 3.5 复盘相关

- `generateReflectionReport()`
  - 作用：reflection fallback
  - 当前定位：`fallback only`

### 3.6 行为结论 / 通知相关

- `buildBehaviorConclusion()`
  - 作用：behavior conclusion fallback
  - 当前定位：`fallback only`

- `buildInboxMessage()`
  - 作用：notification copy fallback
  - 当前定位：`fallback only`

---

## 4. Freshness Policy

当前建议把“读模型新鲜度规则”固定为：

### A. State family

- `state/latest`
- `state/trends`
- `dashboard/summary`
- `goalflow/overview`
- `recovery/history`
- `client/inbox/overview`

这些页面在读取前都允许触发：

- assessment refresh
- behavior conclusion refresh

条件：

- 没有 assessment，但已有更新输入
- 输入时间晚于最新 assessment
- 没有 behavior conclusion，但已有 assessment

### B. Reflection family

- `reflections/overview`

读取前允许触发：

- weekly / monthly reflection refresh

条件：

- 没有报告
- 或输入时间晚于最新报告

### C. Fallback rule

只要 cluster/provider 任一层失败：

- 允许退回本地 fallback
- 但必须保留 trace / adapter 决策可见性

---

## 5. 现在还没完成的，不是工程侧，而是验收侧

如果只看工程与代码结构，M4 已经很接近收口。

当前真正还没完成的关键阻塞主要是：

- **真实外部 OpenClaw cluster 的正式端到端 smoke**
- **基于真实外部 cluster 的完整人工验收**

因此当前更准确的判断是：

**M4 的工程侧核心迁移已基本完成，但正式完成判断仍缺真实外部 cluster 验证。**
