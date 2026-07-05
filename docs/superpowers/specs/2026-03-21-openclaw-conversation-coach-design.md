# MindAnchor OpenClaw Conversation Coach 设计

## Goal

在现有 MindAnchor V1 基础上，新增一个**独立的 OpenClaw 对话式教练能力**，优先落在 `macOS` 客户端，用对话的方式为用户提供更自然、更个性化、更可持续优化的建议闭环。

这个子项目要解决两个核心问题：

1. **模型反馈延迟**
   - 当前系统更偏“批处理型读模型与提醒输出”，缺少一条低摩擦、快速可交互的对话链路
   - 用户需要更快得到“先说一句有用的话，再补完整解释”的反馈

2. **模型质量与个性化**
   - 当前模型输出主要来自通用业务 agent 逻辑，还不够“像这个用户”
   - 系统需要通过长期 memory 和人类反馈逐渐形成对个人生活 / 工作习惯的理解

一句话概括：

**新增一个独立的 Coach 子系统，由 OpenClaw 作为最终信息生成来源，在 macOS 端提供两段式对话建议，并通过可见、可撤回的 memory 与人类反馈不断变得更懂用户。**

## Positioning

本设计是 **Post-V1 增量子项目**，不改写已经确认完成的 V1 商用交付门槛。

它的定位是：

- 在现有 `macOS Client + Gateway + OpenClaw + Web` 体系之上新增一条对话链路
- 不替换现有 `state / task / recovery / reflection / automation` 主业务链
- 不改变 V1 已完成的桌面活动采集、提醒、状态、任务、复盘主闭环
- 不把 Coach Phase 1 变成新的 V1 首发阻塞项

### V1 不变 / Coach 新增

| 维度 | V1 现状 | Coach 新增 |
| --- | --- | --- |
| 智能中枢 | OpenClaw 负责结构化业务输出 | OpenClaw 新增独立对话教练能力 |
| Mac 客户端 | Today / Goals / State / Reflections / Reminders / Settings | 新增 `Coach` 页面与轻提示入口 |
| 业务 agent | `chief/state/task/progress/recovery/reflection/automation` | 新增独立 coach lane，不污染现有 agent |
| 数据 | 任务、状态、提醒、复盘读模型 | 新增对话 session、message、feedback、memory、training candidate |
| 发布门槛 | V1 已完成 | Coach 为下一阶段功能，不回改 V1 完成定义 |

## Current State

当前仓库已经具备：

- Gateway / OpenClaw 主链路
- `macOS` 原生客户端
- Web 控制台
- 状态、任务、恢复、复盘、提醒主闭环
- 单用户登录与设备绑定基础
- 完整的测试与发布工程

当前缺少：

- 独立的对话 agent lane
- 对话 session / message / feedback / memory / training candidate 数据模型
- 面向“个人偏好 / 习惯”的长期 memory
- 用户可见、可删、可撤回的 memory 管理 UI
- 两段式响应协议
- 面向 coach 的故障降级与 trace 规范

## Problem Statement

现有系统擅长：

- 状态评估
- 恢复建议
- 复盘总结
- 提醒决策

但不擅长：

- 用户主动发起自然语言对话
- 连续几轮对话中逐渐理解这个人的偏好
- 在不同生活 / 工作情境下形成越来越贴身的建议风格
- 把“有帮助 / 没帮助”沉淀成个性化优化数据

如果直接把对话能力塞进现有 `chief-agent` 或其他业务 agent，会带来几个问题：

1. prompt 污染
2. memory 污染
3. 反馈数据污染
4. 难以做独立延迟优化
5. 难以为后续个性化训练保留干净边界

因此必须新增**完全独立**的对话 agent lane。

## Chosen Direction

### 核心方向

采用以下方案：

- `macOS` 客户端优先
- 新增独立的 coach lane
- 第一阶段固定为**只读建议型**
- 最终答案始终由 **OpenClaw** 生成
- memory 同时覆盖：
  - 偏好 / 习惯
  - 稳定工作方式偏好
- 但第一阶段以**偏好 / 习惯**为主，不沉淀业务事实真相
- memory 自动提取写入，用户可见、可删、可撤回
- 反馈采用**中反馈**
- 响应采用**两段式**
- 交互上以用户主动打开为主，在关键时刻只给轻提示

### 不采用的方案

不采用：

- 将对话能力并入 `chief-agent`
- 直接让对话 agent 修改任务 / 发提醒
- 第一阶段就做完整 RL 训练闭环
- 第一阶段就把 Android / Web 同步作为主阻塞项
- 第一阶段就引入 SSE / Realtime 流式协议

## Scope

## Coach Phase 1 范围

### 本阶段必须做

- 独立 coach agent lane
- Gateway 侧新增对话 session / message / memory / feedback API
- `macOS` 客户端新增 `Coach` 页面
- 两段式响应：
  - `fastResponse`
  - `fullResponse`
- memory 自动写入与可撤回
- 中反馈闭环
- 对话相关训练样本候选沉淀
- 明确的 trace、鉴权、失败降级与数据生命周期

### 第二阶段写入计划但不本轮实现

- **半自动型**
  - 生成待确认的任务调整草稿
  - 生成待确认的提醒草稿
  - 生成待确认的恢复建议草稿

### 第三阶段写入计划但不本轮实现

- **可执行型**
  - 在用户授权下直接写回任务、提醒、恢复动作
  - 成为可执行的个人教练 agent

## Out Of Scope

本轮明确不做：

- 让对话 agent 直接写业务对象
- Android / iOS 首发对话入口
- 复杂多模态对话输入
- 完整 reward model / RLHF 训练流水线
- 直接替代现有业务 agent
- 把 Coach 做成新的系统首页或主入口

## Phase Boundaries

| 维度 | Phase 1 只读建议型 | Phase 2 半自动型 | Phase 3 可执行型 |
| --- | --- | --- | --- |
| 输出形态 | 文本建议 | 文本建议 + 结构化草稿 | 文本建议 + 草稿 + 执行动作 |
| 是否生成结构化 draft | 否 | 是 | 是 |
| 是否写回业务对象 | 否 | 否 | 是，需显式授权 |
| 是否需要用户确认 | 不适用 | 必须 | 必须或按授权策略 |
| 个性化优化 | 检索、排序、memory 权重 | 检索、排序、draft 质量 | 检索、排序、执行策略 |
| 模型训练 | 仅沉淀样本候选 | 样本候选 + 离线评估 | 个性化训练 / 偏好优化 |

## Product Experience

## 1. 入口与触发

第一版对话入口优先落在 `macOS`：

- 侧边栏新增 `Coach`
- Today / State 页允许出现轻提示：
  - “想聊聊怎么恢复吗？”
  - “需要我帮你把下一步想清楚吗？”

触发规则：

- **用户主动打开为主**
- 系统只在关键时刻显示轻提示
- 不做侵入式主动打断
- 轻提示只出现在 `Today` 或 `State` 页面
- 默认每天最多 `3` 次
- 用户 dismiss 后 `6 小时` 内不再提示同类入口
- Active focus session 期间不主动打断

## 2. 会话模型

Phase 1 中，`session` 是**轻量可见概念**，但不做复杂线程管理。

页面规则固定为：

- 默认打开最近一次 coach 会话
- 提供显式 `新对话` 按钮
- 不做复杂命名、归档、标签和多级筛选
- Today / State 的轻提示进入时，默认复用最近会话；若最近会话已结束太久或上下文不相关，再创建新会话

## 3. 响应形态

第一版采用两段式响应：

### fastResponse

用途：

- 先在较短时间内给出一个“最小可用判断”

目标时延：

- 约 `5 秒内`

内容风格：

- 一句状态判断
- 一句最小动作建议

### fullResponse

用途：

- 给出更完整、结合长期 memory 的解释与建议

目标时延：

- 约 `15–30 秒`

内容风格：

- 解释为什么
- 给出个性化建议
- 必要时补一个追问或后续选项

### 协议约束

Phase 1 不默认采用 SSE。协议固定为：

1. 客户端调用 `POST /coach/sessions/:sessionId/messages`
2. Gateway 同步返回：
   - 用户消息已落库
   - `fastResponse`
   - assistant message 基本信息
   - `assistantMessage.status = "pending_full"`（若 full 仍在生成）
3. 客户端通过：
   - `GET /coach/sessions/:sessionId`
   - 或 `GET /coach/messages/:messageId`
   轮询完整结果
4. 当 `fullResponse` 完成后，assistant message 状态更新为 `completed`

## 4. 反馈形态

Phase 1 的“中反馈”固定为：

- `有帮助`
- `没帮助`

若为负反馈，追加标签：

- `太啰嗦`
- `不懂我`
- `建议不现实`
- `时机不对`

另外允许用户补充一句自由文本原因。

反馈对象固定为：

- 默认针对整条 assistant 回复（`fast + full` 这一组）
- UI 主要挂在 `fullResponse` 完成后
- 若 `fullResponse` 未完成或失败，允许用户仅对 `fastResponse` 给反馈

## 5. Memory 可见性与撤回

用户可在 macOS 客户端看到当前 coach 的 memory：

- 能浏览
- 能删除
- 能撤回误记忆

Phase 1 中，“撤回”分成两层：

1. **即时 Undo**
   - 新写入 memory 后，最近一次回复下方提供短时 `撤回` 入口
   - 默认撤回窗口为 `10 分钟`

2. **长期 Delete**
   - 在 memory 面板中删除任意历史 memory

实现语义固定为：

- 即时 Undo 与长期 Delete 都调用同一个删除语义
- 服务端做 **soft revoke**
- 被撤回 / 删除的 memory 立即停止参与召回

## 6. 失败与降级

必须定义以下状态：

1. `fastResponse failed`
   - UI 显示发送成功但快速回复失败
   - 用户可手动重试
   - 不阻断历史对话可读

2. `fullResponse pending`
   - UI 明确显示“正在补充完整建议”
   - 保留 `fastResponse`

3. `fullResponse failed`
   - UI 保留 `fastResponse`
   - 提供“重试完整回复”
   - 允许用户继续下一轮输入

4. `OpenClaw unavailable`
   - UI 显示服务不可用
   - 不生成本地伪答案
   - 历史会话仍可查看

5. `memory write pending/failed`
   - 不阻塞 `fastResponse`
   - 只影响后续 personalization
   - UI 在本条回复上提示“记忆写入稍后重试”或“未写入”

### `pending_full` 恢复策略

由于 Phase 1 仍基于单进程 Gateway + 本地持久化，不引入独立队列 worker，因此必须定义扫尾规则：

- `pending_full` 消息由 Gateway 启动时和定时任务共同扫描
- 若消息在 `pending_full` 状态下超过 `90 秒` 且没有完成，则转为 `failed`
- `errorCode` 固定写入 `full_generation_interrupted` 或更具体的失败原因
- 用户可通过重试接口重新触发 `fullResponse`
- Phase 1 不承诺 Gateway 重启后自动续跑中断的 full generation，只承诺状态一致与可重试

## Architecture

## 1. 独立 Coach Lane

新增逻辑能力：

- `conversation-coach`

新增 OpenClaw 执行 target：

- `conversation-coach-fast-agent`
- `conversation-coach-agent`

说明：

- 这是同一个 coach 能力的两个执行 target
- 二者共享 coach 专属 prompt / memory 空间 / 反馈数据边界
- 但和现有业务 agent **严格隔离**

必须隔离的对象包括：

- `chief-agent`
- `state-insight-agent`
- `task-management-agent`
- `progress-feedback-agent`
- `interruption-recovery-agent`
- `reflection-coach-agent`
- `automation-agent`

隔离范围包括：

- prompt
- model target
- memory 空间
- 反馈数据
- 训练样本

## 2. 工作流边界

新增 Gateway 内部 workflow：

- `conversation_coaching`

这里必须明确：

- `conversation_coaching` 是 **Gateway 内部 orchestration 名称**
- 它**不进入**现有 `chiefRouteWorkflowSchema`
- Coach 走独立 route + 独立 orchestrator entrypoint
- 不通过 `chief-agent` 做路由分发

## 3. 执行链

执行链固定为：

1. 客户端发起用户消息
2. Gateway 聚合只读上下文
3. Gateway 召回相关 memory
4. Gateway 调用 `conversation-coach-fast-agent`
5. Gateway 返回 `fastResponse`
6. Gateway 异步调用 `conversation-coach-agent`
7. Gateway 持久化 `fullResponse`
8. Gateway 异步落库：
   - memory 候选
   - training sample 候选

用户反馈不在消息生成时自动落库，而是：

- 由客户端后置调用 `POST /coach/messages/:messageId/feedback`
- 单独写入 feedback 存储
- 再异步影响排序权重与个性化统计

## 4. 最终信息来源

本能力的最终信息来源固定为：

- **OpenClaw**

不允许：

- 客户端本地拼接最终答案
- Gateway 本地 heuristic 直接替代完整回复

Gateway 只负责：

- 上下文聚合
- memory 召回
- 结果持久化
- 结果流回客户端
- trace 与失败处理

## 5. 上下文边界

Coach Phase 1 允许读取：

- 当前用户的目标 / 任务 / session 摘要
- 最新状态、恢复、复盘、提醒摘要
- 用户对 Coach 的历史 memory
- 当前会话最近若干轮对话摘要

Coach Phase 1 禁止沉淀：

- 任务真相源
- 状态真相源
- 原始敏感正文的大段复制
- 其他业务 agent 的私有 memory

## Memory Model

## 1. 分层结构

### Profile Memory

存偏好 / 习惯类信息，例如：

- 喜欢什么语气
- 更适合哪种提醒方式
- 哪个时间段更容易做深度工作
- 不喜欢怎样的建议表达

### Workstyle Preference Memory

只存**稳定工作方式偏好**，例如：

- 更喜欢先拆小再执行
- 更适合单线程还是并行
- 偏好怎样的恢复建议表达

明确不包含：

- 当前任务事实
- 目标进展事实
- 某次中断的事件判断

### Conversation Memory

存近期对话里的短期上下文，例如：

- 本周压力状态的自述摘要
- 当前犹豫点
- 最近明确表达过的即时偏好

这是短期 memory，不是长期事实库。

## 2. 写入策略

第一版采用：

- **自动提取**
- **默认写入**
- **用户可撤回**

同时每条 memory 带内部置信度：

- `high`
- `tentative`

并带状态：

- `active`
- `revoked`
- `suppressed`

规则：

- 新写入 memory 默认先进入 `tentative + active`
- 负反馈持续出现时可自动降权或转为 `suppressed`
- 用户删除时转为 `revoked`
- `revoked` 与 `suppressed` 都不参与默认召回

## 3. 读取策略

每轮对话不直接灌全部 memory。

策略固定为：

1. 先基于当前问题做检索
2. 召回最相关 memory
3. 再做上下文压缩
4. 最后送入 coach agent

这样做是为了同时优化：

- 延迟
- token 成本
- 回复质量

## 4. Memory 可解释性

Phase 1 必须能向用户解释：

- 这条回复用了哪些 memory
- 系统记住了哪些长期偏好
- 某条 memory 来自哪条消息摘要

UI 至少分为两层：

1. 本次回复用到的 memory
2. 全部 Coach Memory

## Feedback And Personalization

## 1. 在线层

第一阶段先做在线优化，而不是直接做完整 RL：

- 负反馈影响 memory 权重
- 负反馈影响回复风格权重
- 高频被否定的建议模式被抑制
- 高频被认可的建议风格被强化

这层优化只改变：

- 检索排序
- memory 权重
- 风格选择

不改变：

- 业务对象真相源
- 自动执行权限

## 2. 数据沉淀层

每次对话都可沉淀训练样本候选，至少包含：

- 用户输入摘要
- 上下文摘要
- 被召回的 memory 摘要
- `fastResponse`
- `fullResponse`
- 用户反馈
- 后续行为结果（若可关联）

默认要求：

- 优先存**摘要化 / 脱敏版本**
- 不默认把整段原始对话正文作为长期训练资产

## 3. 后续训练层

本轮只为后续训练做准备，不在本轮落地完整训练系统。

后续升级路径明确保留：

- reranker 优化
- 偏好模型
- reward model
- 个性化强化学习 / DPO / 蒸馏

## APIs And Types

## 1. 鉴权与 owner 规则

所有 `/coach/*` 接口必须：

- 强制 `Authorization: Bearer`
- 不接受 body/query 中的显式 `userId`
- 服务端从 auth context 派生真实用户
- 对 `sessionId / messageId / memoryId` 做 owner 校验

返回规则：

- 未授权：`401`
- 资源不存在：`404`
- 资源存在但不属于当前用户：优先 `404`，必要时保留 `403`

`demo-user` 开发绕过不适用于 `/coach/*` 正式接口。

## 2. 新增 API

建议新增：

- `POST /coach/sessions`
- `GET /coach/sessions`
- `GET /coach/sessions/:sessionId`
- `DELETE /coach/sessions/:sessionId`
- `POST /coach/sessions/:sessionId/messages`
- `GET /coach/messages/:messageId`
- `POST /coach/messages/:messageId/retry`
- `POST /coach/messages/:messageId/feedback`
- `GET /coach/memory`
- `DELETE /coach/memory/:memoryId`

其中关键接口语义固定为：

### `POST /coach/sessions/:sessionId/messages`

请求：

- 用户输入内容
- 可选的轻量上下文标签

响应：

- `userMessage`
- `assistantMessage`
- `fastResponse`
- `assistantMessage.status`
- `traceId`

### `GET /coach/messages/:messageId`

用于查询：

- `assistantMessage.status`
- `fastResponse`
- `fullResponse`
- `errorCode`
- `traceId`

### `POST /coach/messages/:messageId/retry`

用于：

- 当 `fastResponse` 失败时，重新尝试该条 assistant 回复
- 当 `fullResponse` 失败或中断时，仅重试 `fullResponse`

语义固定为：

- 若 `fastResponse` 不存在，则按“补 fast，再补 full”的顺序重试
- 若 `fastResponse` 已存在而 `fullResponse` 失败，则只重试 `fullResponse`
- 同一 message 只允许一个进行中的 retry

## 3. 新增类型

建议新增：

- `CoachSession`
- `CoachMessage`
- `CoachResponse`
- `CoachFeedback`
- `CoachMemoryItem`
- `CoachMemorySource`
- `CoachContextSnapshot`
- `CoachTrainingExample`

### `CoachSession`

至少包含：

- `id`
- `userId`
- `title`
- `status`
- `createdAt`
- `updatedAt`
- `lastMessageAt`

### `CoachMessage`

至少包含：

- `id`
- `sessionId`
- `role`
- `status`
- `userText`
- `fastResponse`
- `fullResponse`
- `traceId`
- `errorCode`
- `createdAt`
- `updatedAt`

其中 `status` 固定为：

- `pending_fast`
- `pending_full`
- `completed`
- `failed`

### `CoachMemoryItem`

至少包含：

- `id`
- `userId`
- `kind`
- `summary`
- `confidence`
- `status`
- `sourceMessageId`
- `sourceExcerpt`
- `createdAt`
- `lastUsedAt`
- `revokedAt`

其中：

- `sourceExcerpt` 必须是**摘要化 / 脱敏后的来源说明**
- 不允许直接保存原始用户句子或大段敏感正文片段

其中 `status` 固定为：

- `active`
- `revoked`
- `suppressed`

### `CoachTrainingExample`

至少包含：

- `id`
- `userId`
- `sourceSessionId`
- `sourceMessageId`
- `contextSnapshotId`
- `status`
- `createdAt`

## Mac Client

## 页面

新增 `Coach` 页面，至少包含：

- 对话线程区
- 输入区
- 正在生成状态
- “本次回复用了哪些 memory” 侧栏或抽屉
- “全部 Coach Memory” 管理区
- 反馈按钮区

## 页面行为

Phase 1 固定行为：

- 默认打开最近会话
- 支持新对话
- 支持查看两段式回复状态
- 支持删除 memory
- 支持对 assistant 回复打反馈

暂不做：

- 多线程高级管理
- 复杂搜索
- 批量编辑 memory

## Data And Privacy

第一版必须明确：

- memory 只记录与个人偏好 / 习惯 / 稳定工作方式偏好相关信息
- 不自动记入敏感正文内容
- 用户能看到并删除 memory
- 对话 agent 不直接污染其他业务 agent 的记忆空间
- trace 不记录原始对话正文

### 数据生命周期

| 数据 | 存储内容 | 默认保留 | 用户可见 | 删除方式 | 删除后效果 |
| --- | --- | --- | --- | --- | --- |
| Coach Sessions / Messages | 对话历史与回复结果 | `180 天` 或用户删除会话 | 是 | `DELETE /coach/sessions/:sessionId` | 停止展示，停止后续 memory 提取 |
| Coach Memory | 摘要化偏好 / 习惯 / 工作方式偏好 | 直到用户删除 | 是 | `DELETE /coach/memory/:memoryId` | 立即停止召回，状态转 `revoked` |
| Coach Feedback | 有帮助 / 没帮助 / 标签 / 文本原因 | `365 天` | 局部可见 | 跟随消息 / 会话清理 | 停止参与个性化统计 |
| Coach Training Examples | 摘要化训练样本候选 | `30 天`，默认脱敏 | 否，Phase 1 不直出 | 自动过期或随源会话失效 | 不再用于后续训练准备 |
| Trace Logs | traceId、阶段、状态、长度/哈希摘要 | 按现有 trace 策略 | 否 | 运维清理 | 不含原文，不参与用户画像 |

### 删除会话后的派生数据语义

`DELETE /coach/sessions/:sessionId` 后，规则固定为：

- 该 session 及其 messages 从用户视图中移除
- 该 session 不再参与后续 memory 提取
- 来源仅指向该 session 的 memory 自动转为 `revoked`
- 绑定该 session 的 feedback 停止参与个性化统计
- 绑定该 session 的 training example 转为失效，等待后续清理
- trace 只保留脱敏运行痕迹，不保留可回放原文

## Performance Targets

第一版目标：

- `fastResponse`：约 `5 秒内`
- `fullResponse`：约 `15–30 秒`

实现策略：

- 两段式生成
- 召回预算固定
- 上下文先摘要
- feedback / memory 提取异步化
- `conversation-coach-fast-agent` 与 `conversation-coach-agent` 分离配置

## Trace And Observability

Coach 必须复用现有 Gateway trace 体系，并新增事件：

- `coach.session.created`
- `coach.message.fast.started`
- `coach.message.fast.completed`
- `coach.message.fast.failed`
- `coach.message.full.started`
- `coach.message.full.completed`
- `coach.message.full.failed`
- `coach.memory.recalled`
- `coach.memory.persisted`
- `coach.feedback.recorded`

要求：

- trace 传递 `traceId / sessionId / messageId`
- trace 不落原始消息正文
- 失败必须能定位到 fast / full / memory / feedback 的具体阶段

## Testing Strategy

## 单元测试

- memory 提取
- memory 召回排序
- feedback 持久化
- 两段式响应状态机
- soft revoke 后不再召回
- partial success 状态处理

## 集成测试

- Mac 消息 -> Gateway -> OpenClaw -> `fast/full response`
- feedback -> memory 权重变化
- delete memory -> 不再召回
- auth / owner 校验
- trace 透传
- legacy DB migration

## 端到端测试

- 打开 Coach
- 发消息
- 收到 `fastResponse`
- 等待 `fullResponse`
- 点反馈
- 查看 memory 面板变化
- 删除 memory 后再次发起相似问题，确认不再召回

## Migration Order

实施顺序固定为：

1. 先定协议，不先做 UI
2. 扩展 `packages/domain` 与 store schema
3. 新增 Gateway coach routes / orchestrator / trace
4. 新增 OpenClaw coach targets 与本地 stub
5. 最后落地 macOS `Coach` 页面
6. 基本链路稳定后，再加 Today 轻提示和 memory 面板联动

## Success Criteria

第一阶段完成时，应满足：

1. `macOS` 客户端有独立 `Coach` 对话入口
2. 最终答案来自 OpenClaw 的 coach lane
3. 回复具备两段式结构
4. memory 自动写入且用户可见可删
5. 中反馈闭环可用
6. 对话数据可以沉淀为后续个性化训练样本候选
7. 对话 agent 不污染现有业务 agent
8. `/coach/*` 强制鉴权且 owner 校验完整
9. `fast/full` 的失败态、重试与 trace 可观测

## Future Phases

## 阶段 2：半自动型

允许生成待确认草稿：

- 任务调整草稿
- 恢复建议草稿
- 提醒草稿

## 阶段 3：可执行型

在明确授权下允许：

- 直接写回任务
- 直接生成并发送提醒
- 直接触发系统动作链
