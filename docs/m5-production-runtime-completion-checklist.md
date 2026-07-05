# M5 — Production OpenClaw Runtime Completion Checklist

## 1. 状态与目标

- 当前阶段定位：`M4 — Cluster-first Business Migration` 已完成；当前正式进入 `M5 — Production OpenClaw Runtime`。
- 当前最终结论：`M5 已完成（当前单用户自部署范围，跨机器 runtime host 实测已豁免）`。
- `M5` 的目标不是“团队级多节点平台”，而是**单用户自部署生产版**：
  - 用户可以把 OpenClaw runtime 部署在自己控制的一台长期在线机器上；
  - Gateway / Web / 客户端通过明确的 Base URL 访问它；
  - 别人在新机器上仅按文档也能独立部署成功。
- `M5` 的重点不再是继续证明 cluster-first 方向可行，而是把当前“单机 LAN + 真实 OpenClaw 常驻服务”的完成态推进到：
  - 更正式的 runtime 形态；
  - 更稳定的执行与并发管理；
  - 更可恢复的部署、运维与发布交付。
- 不属于本次 `M5` 完成范围的内容：
  - 多租户平台
  - 多节点编排系统
  - 团队级权限与审计平台
  - 云厂商级高可用集群

## 2. 完成定义

- 只有当以下六类门槛同时达标时，`M5` 才能标记为完成：
  - runtime 能力达标
  - 部署形态达标
  - 运维能力达标
  - 安全边界达标
  - 验收材料达标
  - 发布材料达标
- 下面这些情况都**不能**算 `M5` 完成：
  - 只有当前开发机能跑，换机器就不能恢复；
  - 仍把 `openclaw/real-cluster-server.mjs` 作为生产完成态核心依赖；
  - 关键链路仍频繁因为 runtime 并发 / session 问题掉到 `provider-fallback`；
  - 只有代码可运行，但没有“从零部署”“升级 / 回滚 / 排障”文档；
  - `spec`、handoff、checklist、验收报告之间结论不一致。
- 完成判定必须能回答两个问题：
  - **如何判断完成**：是否有可重复的技术标准与验收动作；
  - **当前仓库是否已完成**：当前状态是已完成、部分完成还是未完成。

## 3. 运行时能力清单

### 3.1 生产 runtime 核心地位

- 完成判定：
  - 生产完成态不再依赖 `openclaw/real-cluster-server.mjs` 作为核心执行层；
  - 它最多保留为迁移期包装层、兼容层或开发辅助脚本；
  - 正式 runtime 自身具备长期承接执行流量的结构与职责。
- 当前状态：`已完成`
  - 当前 canonical 入口已经切到 `openclaw/production-runtime-server.mjs`，`openclaw/real-cluster-server.mjs` 已降级为兼容包装层。

### 3.2 `POST /v1/tasks/execute` 稳定承接

- 完成判定：
  - 正式 runtime 能稳定承接 `POST /v1/tasks/execute`；
  - 对兼容入口 `/tasks/execute`、`/api/tasks/execute` 的支持策略明确；
  - 健康检查、trace、错误返回和 metadata 结构稳定。
- 当前状态：`已完成（当前机器；跨机器实测已豁免）`
  - 当前已能通过结构化 runtime 稳定承接单机 LAN 验收流量，并完成 `2026-04-22` smoke；
  - `2026-04-24` 已复跑当前机器 external cluster smoke，direct execute、Gateway health、adapter、chief probe 与 6 个 debug agent 均返回 `200`；
  - 当前机器恢复模拟也已证明 `POST /v1/tasks/execute` 可直接命中 `cluster:/v1/tasks/execute`；
  - `@mindanchor/api test` 已在 `2026-04-22` 与 `2026-04-24` 复跑通过；
  - `2026-04-24` 已用临时 Gateway 触发 `chief-agent` probe 后复查 transport，compare 结果为 `driftCodes=[]`、`route=cluster`、`selectedEndpoint=cluster:/v1/tasks/execute`、`issues=[]`；
  - 跨机器恢复实测本轮已显式豁免，不再阻塞当前机器 M5 收口判定。

### 3.3 核心 agent 真实 runtime 覆盖

- 完成判定：
  - 以下 agent 都能在真实 runtime 中稳定运行，并形成可重复验收：
    - `chief-agent`
    - `state-insight-agent`
    - `task-management-agent`
    - `progress-feedback-agent`
    - `interruption-recovery-agent`
    - `reflection-coach-agent`
    - `automation-agent`
  - 输出不只是“能返回”，而是能被 Gateway 当前 read-model 正常消费。
- 当前状态：`已完成`
  - 当前已经完成 7 core agent 的 local/runtime-contracts 验收、`2026-04-22` 外部 cluster smoke，以及 `real:aligned -- --phases cluster-preferred --segments runtime-contracts` 复跑通过；
  - `2026-04-24` external smoke 中 7 个核心 agent 均显示 `route=cluster`、`selectedEndpoint=cluster:/v1/tasks/execute`、HTTP `200`；
  - `Dashboard / State / Recovery / Reflections / Inbox` 对应读模型回归在 `@mindanchor/api test` 中也已恢复全绿。

### 3.4 并发、session 与 fallback 稳定性

- 完成判定：
  - 不再出现已知高频并发问题，例如 session lock 持续触发 `provider-fallback`；
  - 即使存在偶发失败，也能在 runtime 内部被稳定处理，不把 fallback 当作常态路径。
- 当前状态：`已完成（当前机器短时稳定性）`
  - 当前已补 `session file locked` 同 endpoint 短重试，并补了 transport / session-lock 两类 deterministic repro；
  - `2026-04-22` 已补瞬时 transport `fetch failed` 的同 endpoint 短重试，确认单次网络抖动恢复后仍保持 `route=cluster`；
  - `2026-04-24` 带 Gateway + probe 的 transport investigate 复查与健康基线无 drift，产物位于 `test-results/investigate-recheck-gateway-probed-2026-04-24T08-32-24Z/`；
  - `2026-04-24` 新增并跑通 `corepack pnpm observe:openclaw-runtime-stability`，12 轮 × 7 agent 共 `84` 次 cluster 路由全部通过，`providerFallbackCount=0`、`failedCount=0`、`nonClusterCount=0`，报告位于 `test-results/openclaw-runtime-stability-2026-04-24T13-51-02-899Z.md`；
  - 同时 health 已能区分 loopback 正常但 LAN URL 不可达；
  - 历史 `provider-fallback` 证据已有短时稳定性观察补强；跨机器 / 更长期运行观察后续按需补做，不再作为本轮阻塞项。

### 3.5 关键业务链路默认走 `cluster`

- 完成判定：
  - cluster 正常时，Dashboard / GoalFlow / Recovery / Reflections / State / Inbox 等关键链路默认走 `cluster`；
  - Gateway 本地逻辑只保留兜底，不再承担主要业务产出。
- 当前状态：`已完成（当前机器；跨机器实测已豁免）`
  - 当前 `M4` 已完成核心读模型的 cluster-first 迁移；
  - `2026-04-24` 当前机器 external smoke 已再次证明 7 个核心 debug/probe 链路在正常情况下默认走 `cluster`，证据见 `docs/openclaw-production-runtime-smoke-report-2026-04-24.md`。

## 4. 部署与运维清单

### 4.1 单用户跨机器单节点部署

- 完成判定：
  - 至少支持一套“单用户跨机器单节点部署”形态；
  - 可选目标可以是家用主机、NAS、第二台 Mac mini 或 Linux 小主机；
  - 部署完成后，Gateway / Web 可以通过非 loopback Base URL 访问 runtime。
- 当前状态：`已豁免`
  - 当前已完成单机 LAN 暴露验收，跨机器 / 远端单节点恢复实测未执行且已在本轮显式豁免。
  - `2026-04-24` 已补安卓手机第二客户端 LAN 验收，手机 `192.168.0.100` 可访问 runtime `http://192.168.0.104:8800/health` 与 direct `/v1/tasks/execute`，但这只证明外部客户端可达，不能替代第二台机器部署 runtime。
  - `2026-04-24` 由于当前没有第二台可运行 runtime 的机器，跨机器 / 远端单节点从零部署实测在本轮被显式豁免，不再作为继续推进本机 M5 收口的阻塞项；该豁免不等同于实测通过。

### 4.2 常驻运行与基础运维

- 完成判定：
  - 有明确的启动、停止、重启方式；
  - 有明确的日志位置、健康检查方式与最小故障判断流程；
  - 这些操作不依赖开发者临场口头说明。
- 当前状态：`已完成`
  - 当前已补齐启动、停止、重启、状态、健康检查脚本，以及 `launchd` 安装入口与运维指南。

### 4.3 Base URL 暴露方式

- 完成判定：
  - 至少有一套正式支持的 Base URL 暴露方式；
  - 最低要求支持 `LAN` 或 `Tailscale` 之一；
  - 文档中写清地址发现、绑定、校验与访问失败时的排查方式。
- 当前状态：`已完成`
  - 当前 `LAN` 方案已可跑通，并已形成 `M5` 级部署文档。

### 4.4 安全与凭据边界

- 完成判定：
  - provider 凭据只保留在 runtime 所在机器；
  - Gateway 不要求代管或转发 provider secrets；
  - 文档中说明凭据位置、最小权限原则与轮换/替换入口。
- 当前状态：`已完成（当前范围）`
  - 当前架构方向已符合该边界，且部署文档已明确“provider 凭据只留在 runtime 机器”；跨机器恢复实测本轮已豁免。

### 4.5 从零恢复能力

- 完成判定：
  - 在一台新机器上，仅按文档即可完成：
    - 环境准备
    - 配置写入
    - 服务启动
    - 健康检查
    - Gateway 对接
  - 不依赖原开发环境中的隐性上下文。
- 当前状态：`已豁免`
  - 当前机器已完成一次“停机后恢复 -> health -> direct execute -> Gateway cluster-preferred -> smoke:cluster”的恢复模拟；
  - 第二台机器按文档独立复跑本轮因无 runtime host 被显式豁免，后续有设备时再补。

## 5. 验收与发布门槛

### 5.1 正式 `smoke:cluster` 报告

- 完成判定：
  - 产出一份面向 `M5` 部署态的正式 smoke 报告；
  - 记录 runtime Base URL、Gateway Base URL、关键接口结果、失败项与结论；
  - 不再只引用 `M4` 的单机 LAN 验收报告。
- 当前状态：`已完成`
  - 当前已产出面向 `M5` 部署态的正式 smoke 报告，并补了 7 core agent 结果矩阵；
  - `2026-04-22` 与 `2026-04-24` 当前机器 smoke 均已执行并通过；
  - 跨机器恢复实测本轮已豁免，后续有第二台 runtime host 时再补。

### 5.2 正式页面人工验收记录

- 完成判定：
  - 产出一份正式人工验收记录；
  - 覆盖 `Dashboard`、`GoalFlow`、`State`、`Recovery`、`Reflections`、`Inbox`、`Agent Lab`；
  - 能证明真实部署态下页面内容可读且 cluster 路由符合预期。
- 当前状态：`已完成`
  - 当前已产出正式 `M5` 人工验收记录，结论为“页面基线可用，但 `Dashboard / GoalFlow` 仍建议补截图化留档”。

### 5.3 从零部署文档

- 完成判定：
  - 提供一份可独立执行的部署文档；
  - 覆盖依赖、配置、启动、健康检查、常见故障；
  - 目标是“别人按文档能独立部署成功”。
- 当前状态：`已完成`

### 5.4 升级 / 回滚 / 日志排查指南

- 完成判定：
  - 提供最小可用的升级、回滚、日志排查指南；
  - 能指导单用户自部署场景下的版本切换与故障自救。
- 当前状态：`已完成`

### 5.5 文档结论一致性

- 完成判定：
  - `docs/spec.md`
  - `docs/development-handoff-2026-03-07.md`
  - `docs/m5-production-runtime-completion-checklist.md`
  - `tasks.md`
  - 以及最终 smoke / 验收记录
  - 以上文档对 `M4 已完成 / M5 已完成` 的结论保持一致。
- 当前状态：`已完成`
  - 当前 `spec / handoff / checklist / smoke / manual verification` 的目标结论保持一致：`M4 已完成，M5 已完成（当前单用户自部署范围）`；
  - 其中允许保留显式豁免：`第二台机器独立复跑被跳过`。

## 6. 当前差距

### 6.1 已完成基础

- `M4` 已完成：当前仓库已达到“单机 LAN + 真实 OpenClaw 常驻服务 + 核心读模型 cluster-first”的完成态。
- 关键 cluster-first 业务迁移已完成：
  - `Dashboard`
  - `GoalFlow`
  - `State`
  - `Recovery`
  - `Reflections`
  - `Inbox`
- `Agent Lab` 已具备 adapter 路由可视化、timeline、trace 调试能力。

### 6.2 当前 `M5` 完成结论 / 豁免

- `已豁免`：真正的跨机器 / 远端单节点部署验收当前没有第二台 runtime host，本轮显式跳过；Android 第二客户端 LAN 验收只能作为外部客户端可达性补强，不等同于从零部署 runtime 通过。
- `已完成`：`@mindanchor/api test` 已在 `2026-04-22` 与 `2026-04-24` 复跑通过。
- `已完成`：`real:aligned -- --phases cluster-preferred --segments runtime-contracts` 已在 `2026-04-22` 与 `2026-04-24` 复跑通过。
- `已完成`：`2026-04-24` 带 Gateway + probe 的 transport investigate 复查无 drift，产物位于 `test-results/investigate-recheck-gateway-probed-2026-04-24T08-32-24Z/`。
- `已完成`：`2026-04-24` 当前机器 external cluster smoke 已复跑通过，产物为 `docs/openclaw-production-runtime-smoke-report-2026-04-24.md`。
- `已完成`：`2026-04-24` 当前机器 P0 短时稳定性观察已复跑通过，产物为 `test-results/openclaw-runtime-stability-2026-04-24T13-51-02-899Z.md`。
- `已完成`：`2026-04-24` 安卓手机第二客户端 LAN 验收已通过，产物为 `docs/openclaw-production-runtime-android-lan-verification-2026-04-24.md`。
- `已完成`：当前 shell 默认 `MINDANCHOR_DEFAULT_MODEL_*` 仍可作为 drift 诊断来源，但手工 provider-direct 对比已有 `corepack pnpm with:openclaw-real-env -- <command>` 统一入口，可从 OpenClaw profile 注入对齐后的 Gateway provider env。
- `已完成`：`openclaw/real-cluster-server.mjs` 已降级为兼容入口，正式入口改为 `openclaw/production-runtime-server.mjs`。
- `已完成`：把并发 / session 管理稳定性收敛到正式 runtime 内部的当前机器短时观察证据已补齐；后续更长期观察按需补做。
- `已完成`：从零部署文档、运维/升级/回滚/排障指南已经补齐。
- `已完成`：面向 `M5` 基线的正式 smoke 报告与人工验收记录已经产出。
- `已完成`：统一发布结论可标记为 `M5 已完成（当前单用户自部署范围）`；跨机器 runtime host 实测作为 accepted risk / post-M5 补测项保留。

### 6.3 当前推进顺序

- `M5`：已完成当前范围最终收口。
- `post-M5`：后续有第二台 runtime host 时，再补跨机器单节点部署实测。
- `post-M5`：按需继续做更长时间 stability observe。
