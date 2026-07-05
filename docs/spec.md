# MindAnchor Unified Spec

本文件是当前仓库的**统一规格文档**。  
它不替代交接记录，也不替代最终产品愿景文档，而是把：

- 当前真实代码状态
- 当前已完成能力
- 目标架构
- OpenClaw 运行时方向
- Web 控制台职责
- 验收标准
- 下一阶段里程碑

统一收束为一份可直接执行的规格。

---

## 1. 产品定义

MindAnchor 是一个：

- 以长期目标推进为核心
- 以状态感知为辅助
- 以 OpenClaw cluster 为大脑
- 以桌面 / 手机 / Web 为入口与出口

的个人智能执行支持系统。

它不是：

- 企业监控工具
- 键盘记录器
- 截图监控工具
- 自动远程控制机器人

长期目标是：  
让用户在专注、被打断、疲惫、恢复、复盘这些关键节点上，始终获得**结构化、可解释、可执行**的支持。

---

## 2. 当前状态

### 2.1 已完成

- Gateway 主流程稳定可用
- cluster-first / provider-fallback 路径可见
- `Agent Lab` 可视化 cluster / provider 路由
- Web 控制台核心页面已切到正式 read-model：
  - Dashboard
  - GoalFlow
  - State Trends
  - Recovery
  - Reflections
  - Inbox
- 本地最小 OpenClaw-compatible cluster 已可运行
- 本地 cluster smoke 已可自动执行并自动生成 / 回填报告
- 页面人工验收手册与准备脚本已完成

### 2.2 当前运行形态

当前仓库中的实际形态是：

- `apps/api`
  - Lobster Gateway
  - REST 兼容层
  - 调试与 trace 入口
  - read-model 聚合层
- `apps/web`
  - 控制台 / 调试台
- `openclaw/local-cluster-server.mjs`
  - 本地最小兼容 OpenClaw execute 服务

### 2.3 当前限制

- 当前本地 cluster 仍然是**最小兼容运行时**
- 不是正式生产级 OpenClaw runtime / multi-worker 架构
- 业务输出仍有一部分来自 Gateway fallback / heuristics

---

## 3. 目标架构

目标拓扑固定为：

```text
Client Apps -> Lobster Gateway -> OpenClaw Runtime / Workers -> Storage / Notification Providers -> Client Apps
```

### 3.1 Client Apps

- 桌面端
- 手机端
- Web 控制台

职责：

- 采集或展示
- 不承担业务大脑

### 3.2 Gateway

职责：

- 鉴权
- 接收客户端事件
- 管理上传会话
- 聚合 read-model
- 调试 / trace / regression
- 把结构化任务转发给 OpenClaw

### 3.3 OpenClaw Runtime

职责：

- 接收 Gateway task envelope
- 根据 `target` 路由到相应 worker
- 执行 agent 逻辑
- 返回 `parsed` 或 `outputText`
- 记录 trace / metadata / worker 信息

---

## 4. OpenClaw Runtime Spec

### 4.1 Canonical execute contract

必须兼容以下至少一个执行端点：

- `POST /v1/tasks/execute`
- `POST /tasks/execute`
- `POST /api/tasks/execute`

请求 / 响应结构以 `openclaw/README.md` 中的 contract 为准。

### 4.2 Runtime phases

#### 当前阶段：Local Compatibility Runtime

入口：

- `openclaw/local-cluster-server.mjs`

特点：

- 单进程
- 本地 deterministic / context-aware 返回
- 面向 cluster contract 验证与本地人工验收

#### 下一阶段：Structured Local Runtime

目标：

- 从单文件服务升级为更正式的：
  - runtime
  - router
  - workers
  - manifest-driven registry

要求：

- worker 按 agent manifest 注册
- runtime metadata 中携带：
  - `runtime`
  - `worker`
  - `agent`
  - `modelTarget`
  - `skills`

#### 后续阶段：Production Runtime

目标：

- 多 worker / 更真实 agent 执行
- 更接近正式 OpenClaw 运行时
- 长期运行、可部署、可观测

### 4.3 Worker responsibilities

- `chief-agent`
  - 路由与编排入口
- `state-insight-agent`
  - 状态理解
- `task-management-agent`
  - GoalFlow 排序 / 拆解建议
- `progress-feedback-agent`
  - 聚合进展总结
- `interruption-recovery-agent`
  - 恢复建议
- `reflection-coach-agent`
  - 周 / 月报
- `automation-agent`
  - 提醒与消息分发决策

### 4.4 Runtime quality bar

本地 / 正式 OpenClaw runtime 至少都要满足：

- contract 兼容
- traceId 回传
- metadata 中可识别 worker
- 输出不只是空对象
- 输出可被 Gateway 当前 schema 正常消费

---

## 5. Web Console Spec

### 5.1 Dashboard

接口：

- `GET /dashboard/summary`

职责：

- 总览指标
- 最新状态
- 最新恢复计划
- 设备与 inbox 摘要
- 工作台入口

### 5.2 GoalFlow

接口：

- `GET /goalflow/overview`

职责：

- 目标列表
- 任务列表
- suggested focus
- 当前 focus session
- 最新恢复 / 状态上下文

### 5.3 State Trends

接口：

- `GET /state/trends`

职责：

- 当前评估
- 多模态趋势
- 最新行为结论

### 5.4 Recovery

接口：

- `GET /recovery/history`

职责：

- 恢复计划
- 中断会话
- resume candidates

### 5.5 Reflections

接口：

- `GET /reflections/overview`

职责：

- 周报
- 月报
- 报告内容与支撑计数

### 5.6 Inbox

接口：

- `GET /client/inbox/overview`

职责：

- pending / acknowledged
- channel distribution
- 行为结论与恢复上下文

### 5.7 Agent Lab

接口：

- `GET /debug/openclaw/adapter`
- `GET /debug/agent-configs`
- `GET /debug/model-probe/:agentName`
- `GET /debug/agent/*`
- `GET /debug/scenarios`
- `POST /debug/scenarios/:scenarioId/seed`
- `POST /debug/regressions/full-run`
- `POST /debug/regressions/matrix-run`
- `GET /debug/traces/:traceId`

职责：

- 配置可见
- 路径可见
- trace 可见
- 单 agent / 场景 / 回归可验证

### 5.8 UI 文案原则

- 第一版 UI 默认使用中文
- 仅保留必要高频专有名词：
  - `Dashboard`
  - `GoalFlow`
  - `Agent Lab`
  - `OpenClaw`
  - `Gateway`
  - `traceId`
  - `route`
  - `cluster`
  - `provider`
- 调试与控制台页面也应优先提供中文解释，而不是纯英文标签
- 详细执行拆解见 `docs/structured-local-runtime-plan.md`

---

## 6. Verification Spec

### 6.1 自动 smoke

#### Web console smoke

- `pnpm smoke:web-console`

目标：

- 验证 read-model 和关键 debug 接口都返回 `2xx`
- 默认对 `demo-user` 执行 bootstrap，并确认 Dashboard / GoalFlow / State / Recovery / Reflections / Inbox 已有可读内容

#### Cluster smoke

- `pnpm smoke:cluster`

目标：

- 验证直连 cluster contract
- 验证 Gateway `cluster-preferred`
- 验证主要 agent debug 路径
- 自动回填 smoke report

### 6.2 页面人工验收

入口：

- `pnpm dev:local-cluster-stack`
- `pnpm prepare:local-cluster-ui-check`
- `docs/local-cluster-manual-verification.md`

当前人工验收重点：

- `Agent Lab`
- `Recovery`
- `Reflections`
- `GoalFlow`
- `State Trends`
- `Inbox`
- `Dashboard`

说明：

- `prepare:local-cluster-ui-check` 现在会先跑一轮 `smoke:web-console`
- 其输出会直接显示 `demo-user` 在各业务页的就绪计数，避免页面打开后才发现数据为空

### 6.3 验收判定标准

一轮本地 cluster 验收至少要满足：

- `cluster-preferred`
- `chief-agent probe -> cluster`
- `state-insight-agent debug -> cluster`
- 业务页不是空白
- 内容有业务语义
- 页面布局不溢出

---

## 7. Milestones

### M1 — Gateway + Console Stable

目标：

- Gateway / Web 控制台稳定可跑
- read-model 收敛
- Agent Lab 路径可视化

状态：

- 已基本完成

### M2 — Local OpenClaw Compatibility Runtime

目标：

- 本地最小 cluster 可启动
- contract 可用
- smoke 可跑
- 关键 agent 输出可用

状态：

- 已完成第一版

### M3 — Structured Local Runtime

目标：

- 从单文件兼容服务升级为更正式的 runtime / router / worker 结构
- 与 manifest / skills 更紧密对齐

状态：

- 已完成第一轮
- 当前已落地：
  - runtime / task / registry / router / contract 分层
  - 本地 worker 语义增强
  - smoke / manual verification / report 链路收束
  - Web Console 与 Agent Lab 中文优先收口第一轮

### M4 — Cluster-first Business Migration

目标：

- 更多业务结论由 OpenClaw cluster 真正产出
- 继续减少 Gateway 本地 heuristics 主导

状态：

- 已完成（以单机 LAN + 真实 OpenClaw 常驻服务为验收目标）
- 当前已落地：
  - `GoalFlow overview` 不再直接读取本地 fallback summary
  - `GoalFlow overview` 现在复用 cluster-first 的 `DashboardSummary` 管线
  - `Recovery history` 的候选任务排序与 `suggestedFocusTaskId` 不再只靠本地 heuristics
  - `Recovery history` 现在通过 `chief-agent -> task-management-agent` 的 cluster-first 路径生成恢复候选顺序
  - `behavior conclusion` 不再只靠本地 heuristics 生成
  - `behavior conclusion -> inbox notification` 现在通过 `chief-agent -> automation-agent` 的 cluster-first 路径生成
  - `state/latest` 与 `state/trends` 不再只依赖写入时刷新
  - `state/latest` / `state/trends` 现在会在读时按需触发 cluster-first 的 assessment / behavior refresh
  - `dashboard/summary` 不再只读取缓存状态
  - `dashboard/summary` 现在会在读取前按需触发 cluster-first 的 state / behavior refresh
  - `client/inbox/overview` 不再只读取旧消息缓存
  - `client/inbox/overview` 现在会在读取前按需触发 cluster-first 的 state / behavior / notification refresh
  - `recovery/history` 现在会在读取前按需触发 cluster-first 的 state / behavior refresh
  - `reflections/overview` 现在会在读取前按需触发 cluster-first 的 reflection refresh（在输入比报告更新时）
  - 当前机器已经能跑通一套基于真实 OpenClaw CLI 的本地 real-cluster smoke
  - 当前机器已经能通过非 loopback 局域网地址 `http://192.168.0.102:8800` 完成真实部署态 smoke
- 退出标准见 `docs/m4-cluster-first-completion-checklist.md`
- 当前读模型审计与 freshness policy 见 `docs/m4-cluster-first-read-model-audit.md`

### M5 — Production OpenClaw Runtime

目标：

- 更正式的本地 / 远程 OpenClaw runtime
- 面向单用户自部署生产版的部署、运维与发布形态
- 让“别人按文档也能独立部署成功”成为完成门槛

状态：

- 未完成
- 退出标准见 `docs/m5-production-runtime-completion-checklist.md`
- 当前基线材料见：
  - `docs/openclaw-production-runtime-deployment.md`
  - `docs/openclaw-production-runtime-ops-guide.md`
  - `docs/openclaw-production-runtime-smoke-report-2026-03-08.md`
  - `docs/openclaw-production-runtime-manual-verification-2026-03-08.md`

---

## 8. 非当前阶段目标

当前不优先处理：

- 桌面端最终统一化
- Android / iOS thin client 真正重构完成
- 正式对象存储 + 媒体异步处理闭环
- 健康中枢真实系统接入
- 正式生产级远程 OpenClaw 多 worker 部署

这些仍属于后续阶段。

---

## 9. 当前推荐执行顺序

1. 保持 Gateway / Web / Runtime 验收链路可启动
2. 按 `docs/m5-production-runtime-completion-checklist.md` 收口 runtime 稳定性
3. 完成单用户跨机器单节点部署与恢复文档
4. 补齐正式 smoke / 人工验收 / 升级回滚材料
5. 最后推进客户端深化与后续阶段目标

---

## 10. 本规格的作用

当你继续开发时，这份 `spec.md` 应该回答三个问题：

1. 当前系统到底已经做到什么程度
2. 下一步应该优先做什么，而不是乱做什么
3. 如何判断某个阶段已经“真正完成”
