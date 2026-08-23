# Comma V0.1 技术架构基线

> 状态：Draft，供下一阶段开发评审。原始讨论逐字归档见 [`comma-v0.1-architecture-discussion-2026-08-24.md`](./comma-v0.1-architecture-discussion-2026-08-24.md)。
>
> 本文不是旧 MindAnchor/Wayfinder 文档的替换，而是把 2026-08-24 讨论整理成当前工程可执行的架构基线。

## 1. 产品定义

Comma V0.1 是一个 Local-First 的长期个人 AI 陪伴系统。它不以 Agent 数量、任务自动执行或提醒频率为核心，而以一个属于用户本人的 Personal Core 为核心：理解用户想过怎样的生活，观察用户当前处境，调用适合的知识与能力，呈现少量可比较的路径，把选择权交还给用户，再通过真实结果和后续反馈逐渐学习什么对这个人有效。

核心闭环：

```text
Life Compass
  -> 当前 Personal State
  -> Event / Context
  -> 相关 Memory 与 Action Model
  -> 2-5 个 Choice 及影响/不确定性
  -> 用户选择
  -> Intervention / Follow-Up
  -> Outcome / Feedback
  -> 更新个人理解
```

五个顶层对象的边界如下：

| 对象 | 解决的问题 | V0.1 写入规则 |
|---|---|---|
| Life Compass | 用户想去哪、怎样生活 | AI 只能产生 candidate；用户确认后形成版本 |
| Personal State | 用户现在怎么样 | 每个字段保存 source、confidence、用户确认状态；不做诊断 |
| Personal Memory | 过去发生过什么 | 用户记忆和系统 trace 分离；普通聊天不自动成为长期记忆 |
| Personal Action Model | 什么行动在什么情境对这个人有效 | 以 evidence、context、confidence 维护假设，不宣称因果 |
| Choice Engine | 现在有哪些路、各自可能影响 | 输出 2-5 个选择，不输出命令；安全约束高于偏好 |

## 2. 现有工程与目标架构的映射

当前仓库使用 Node 22、pnpm workspace、Fastify、TypeScript、Zod。主要入口为 `apps/api`、`apps/desktop`、`apps/web`、`apps/macos`、`apps/android-recorder` 和 `apps/ios-wayfinder`（若对应目录存在）。当前 API 的 `MindAnchorStore` 将完整 `Database` 写入 JSON，Wayfinder 已经具备 event、situation、option、decision、outcome、consent、intervention policy、health signal、audio candidate 和审计 trace。

迁移原则是保留可复用能力，不做破坏性重写：

| 当前能力 | V0.1 处理 | 原因 |
|---|---|---|
| `MindAnchorStore` JSON | 保留为 legacy store；新增 Core repository 抽象 | 旧 Goal/Task/Coach/Agent 测试和数据不能被一次迁移破坏 |
| `apps/api/src/services/wayfinder/*` | 继续作为 Choice/Intervention 的现有实现；后续改为依赖 Core repository | 已有 consent、风险确认、幂等和 trace 语义 |
| `apps/packages/domain` | 增加 `core` schema，与旧 Wayfinder schema 并存 | 共享契约已有 Zod 基础 |
| `apps/desktop/wayfinder-client.js` | 复用交互模式；新增 Core client 只读入口 | 桌面是 V0.1 主终端 |
| Web Wayfinder 页面 | 保留为管理/调试入口 | Web 不重复推理，只展示 API 结果 |
| OpenClaw/Agent/Skill | 放在 capability/runtime adapter 层 | Personal Core 不依赖某一个 Agent runtime |
| 旧 Agent memory | 不作为 Personal Memory 真相源 | 防止 route、prompt、模型输出污染用户记忆 |

第一阶段只新增 `apps/api/src/core/` 领域边界和 SQLite 实现。旧 JSON Store 不迁移为 SQLite 的唯一真相，直到 Core 的导出、删除、重放和回归验收完成。

## 3. 分层架构

```text
终端：Desktop / Web / Mobile / Watch / Glasses
             |
             v
Fastify Gateway + auth + typed contracts
             |
             v
Comma Personal Core
  Life Compass | State | Events | Memory | Actions
  Choices      | Interventions | Reflection | Privacy
             |
             v
Context Builder / Skill Router / Capability Adapter / Model Router
             |
             v
OpenClaw、未来 Hermes、Rule Engine、Fast/Deep Model
```

终端只是 Sensor 和 Interaction Surface，不拥有第二套人格或数据库。OpenClaw 是可替换的 Agent runtime，不是 Personal Core 的持久化层。V0.1 先以 TypeScript 完成核心；只有本地 ASR、特殊 ML 等确有必要时才增加 Python worker。

## 4. 数据与隐私边界

数据分为四级：

| 级别 | 内容 | 默认策略 |
|---|---|---|
| P0 Ephemeral | 原始音频、瞬时传感器缓冲 | 尽快处理并删除；必须有过期时间 |
| P1 Event | 结构化事件、用户自述、设备活动摘要 | 本地保存；不可变；可导出/删除 |
| P2 Personal Memory | 用户确认的长期事实、偏好、行为经验 | 默认本地；可查看、修改、纠正、删除 |
| P3 Deep Personal Model | Life Compass、动态模型、敏感偏好 | 默认仅本地；未经授权不得出境 |

所有可持久化记录至少带 `userId/profileId`、`privacyLevel`、`source`、`confidence`、`createdAt`、`retentionClass`。P3 不得进入云模型 payload；未来需要云调用时只能发送由 Context Builder 生成的最小投影，并记录用户授权、模型层级和 Decision ID。

`system_traces` 与 `memories` 使用不同表和不同 repository 方法。路由、Agent 名称、内部 prompt、模型原文、debug trace 默认永远不进入长期 Personal Memory。

Comma 可观察、提醒、提出假设，但不进行医疗/心理诊断。情绪或健康信号只能作为弱信号，必须同时记录 source、confidence 和 user confirmation。Agency Guard 必须拒绝命令、羞辱、恐吓、积分惩罚和过度诱导式输出。安全约束永远高于兴趣偏好。

## 5. V0.1-A Personal Core Skeleton

第一阶段的技术目标：在本机 API 进程中建立一个单用户、单写者、SQLite + FTS5 的 Personal Core，使以下能力可独立于模型验收：

1. append-only Event 写入、幂等和时间范围查询。
2. Current State latest projection/revision；只有明确的 state report 或用户确认才能改变状态。
3. Life Compass candidate -> user confirm -> immutable version；不允许 AI 直接覆盖。
4. 数据等级、同意和本地存储元数据。
5. System Trace 与 Personal Memory 物理隔离。
6. 用户级导出、删除和 P0 retention 清理。
7. 版本化 API contract，旧 Wayfinder API 保持可用。

本阶段明确不做：模型调用、七 Agent、Skill routing、Choice 生成、自动执行、语音/VAD/ASR/TTS、健康诊断、眼镜/手表客户端、向量数据库、云端同步、多用户协作。

## 6. 第一阶段数据模型

首版 SQLite 表：

| 表 | 关键字段 | 不变量 |
|---|---|---|
| `core_profiles` | `id`, `user_id`, `timezone`, `revision`, `created_at`, `updated_at` | V0.1 每个本地实例一个 profile |
| `core_events` | `id`, `profile_id`, `client_event_id`, `event_type`, `occurred_at`, `payload_json`, `privacy_level`, `confidence`, `expires_at` | 原始事实不可更新；`profile_id + client_event_id` 唯一 |
| `core_state_snapshots` | `id`, `profile_id`, energy/emotion/load/noise/focus/fatigue/recovery, `source_json`, `confidence`, `user_confirmed`, `revision` | 只追加；current 取最新有效 revision |
| `core_life_compass_versions` | `id`, `profile_id`, `version`, `content_json`, `confirmed_at`, `supersedes_id` | 只有确认事务能成为 active version |
| `core_life_compass_candidates` | `id`, `profile_id`, `content_json`, `evidence_event_ids_json`, `status`, `created_at` | candidate 不影响 active compass |
| `core_permissions` | `profile_id`, `purpose`, `scope`, `status`, `data_level`, `updated_at` | revoked 后新写入被拒绝 |
| `core_system_traces` | `decision_id`, input/context/memory/skill/model/options/choice/outcome JSON | 不被 memory retrieval 查询 |
| `core_schema_migrations` | `version`, `applied_at`, `checksum` | 迁移按序、可重放 |

时间全部以 UTC ISO-8601 输入并以 SQLite UTC 文本保存；profile timezone 只用于 UI 和周期调度。所有写操作通过单写者队列或 SQLite transaction；跨请求更新使用 `expectedRevision` 乐观并发检查。

## 7. 事件、状态与 Life Compass 生命周期

Event 是数据库根，但 Event 不会因为被观察就自动改变人格模型。V0.1 中只有两种状态写入：

- `state_report`：用户显式提交，直接生成已标注来源的 State Snapshot。
- `state_projection`：确定性规则从已存 Event 生成，必须标记 `user_confirmed=false`，不能写入 P2/P3。

Life Compass 采用严格确认闭环：创建 candidate -> 展示来源与差异 -> 用户 confirm/reject -> confirm 时在一个事务中递增 version、写入新 active version、保留旧版本 -> trace 记录 candidate 和确认动作。任何 `PATCH active compass` 都被转换成 candidate，不存在无审计的直接覆盖。

## 8. 核心 API 契约

首阶段 API 使用 `/v1/core` 前缀，handler 只负责认证、Zod 校验、调用 repository、映射错误：

```text
POST /v1/core/events
GET  /v1/core/events?from=&to=&limit=
GET  /v1/core/state/current
POST /v1/core/state/reports
GET  /v1/core/life-compass
POST /v1/core/life-compass/candidates
POST /v1/core/life-compass/candidates/:id/confirm
GET  /v1/core/privacy
GET  /v1/core/export
POST /v1/core/retention/run
DELETE /v1/core/data
```

身份从现有 bearer auth 获取，客户端 body 的 `userId` 不覆盖认证身份。Event 支持 `Idempotency-Key`/`clientEventId`；相同 key 和相同 payload 返回既有记录，不同 payload 返回 409。删除操作需要当前用户确认，并在事务中删除该 profile 的 Core 表记录；旧 legacy JSON 数据只在明确选择迁移后删除。

## 9. 后续能力路线的约束

V0.1-B 才接 Single Brain：chat -> bounded Context Packet -> 一个模型 -> 回复。V0.1-C 才接 Choice Engine；V0.1-D 才接 Intervention/Follow-Up；V0.1-E 才接 Memory candidate/retrieval；V0.1-F 逐个接 Agent/Skill；V0.1-G 接 Voice Reflection；V0.1-H 最后接 Desktop Decision Window。任何阶段不得把后续层直接写入 Core 的长期真相。

## 10. 验收标准

V0.1 的完整产品验收以原讨论中的十项能力为准：持续聊天、Life Compass 查看/修改、Event/State 保存、少量 Memory 检索、2-5 个 Choice、记录选择、Intervention/Follow-Up、Action Model 更新、晚间自然语音复盘、Personal Core 本地且可查看/修改/导出/删除。V0.1-A 只验收其中的持久化与隐私基础，不把未实现的 AI/语音能力标成完成。

第一阶段退出条件：SQLite schema migration 可从空库重复执行；API contract tests 通过；事件幂等、跨用户隔离、状态 revision、Life Compass confirmation、P0 retention、P3 egress guard、trace/memory 隔离、export/delete 都有自动化证据；旧 API 测试不回归；工作树中用户已有改动未被覆盖。

## 11. 需要用户在实施前确认的三项决策

1. 是否接受 `better-sqlite3` 作为 API 进程的 SQLite driver；它提供成熟的事务/FTS5，但需要 Node 原生模块安装，桌面 Electron 不直接加载它。
2. 是否接受 V0.1-A 采用单本机单用户 profile；多用户和云同步推迟到个人 Alpha 之后。
3. 是否接受旧 JSON Store 在整个迁移完成前保持只读兼容，而不是第一步直接重写。

