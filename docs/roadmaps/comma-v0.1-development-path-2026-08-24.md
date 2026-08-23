# Comma V0.1 完整软件开发路径

> 基于 `docs/architecture/comma-v0.1-technical-architecture-2026-08-24.md` 和 2026-08-24 讨论归档制定。
>
> 每阶段都必须有目标、边界、可运行结果、自动化验收和退出条件。未通过退出条件，不进入下一阶段。

## 0. 总体交付策略

Comma 采用“一个 Personal Core，多种终端”的路径。Desktop 是 V0.1 主终端，Web 是管理/调试入口，已有 Android capture 作为可选数据源；Watch、耳机、眼镜只在核心闭环稳定后验证一个设备。现有 Wayfinder、Consent、Health、Coach、OpenClaw 和多端代码继续工作，通过 typed contracts 和 repository adapter 逐步靠拢 Personal Core。

关键顺序：领域模型 -> API -> 本地管理 UI -> 一个模型能力 -> 选择闭环 -> 反馈学习 -> 语音 -> 桌面主动窗口 -> 外设试验 -> 个人 Alpha。

全程保持以下不可变约束：

- Personal Core 默认本地，P3 不出本机。
- Event 是事实日志，State/Memory/Action Model 是带来源和置信度的派生理解。
- Life Compass 只能通过用户确认更新。
- Choice Engine 给选择，不给命令；安全约束高于偏好。
- System Trace 与 Personal Memory 分离。
- 没有 consent、policy、approval 的输入或动作不得进入下一层。
- 所有重要写操作支持 user isolation、幂等、审计、导出和删除。

## 1. 阶段总览

| 阶段 | 目标 | 主要结果 | 不在范围 | 进入依赖 |
|---|---|---|---|---|
| V0.1-A | Personal Core Skeleton | SQLite、Event、State、Life Compass、权限/导出/删除 API | AI、Choice、语音、外设 | 当前 Wayfinder/JSON Store 可回归 |
| V0.1-B | Single Brain | Chat -> Context Packet -> 一个模型 -> 回复 | 七 Agent、自动任务执行 | A 的 Core API 稳定 |
| V0.1-C | Choice Engine | State + Compass + Action 假设生成 2-5 张 Choice Card，记录选择 | 自动执行、排行榜、连续打卡 | B 的 Context Builder |
| V0.1-D | Intervention Loop | Intervention、Follow-Up、Outcome、Action Effect 更新 | 医疗判断、强制提醒 | C 的 choice ledger |
| V0.1-E | Personal Memory | candidate、确认、FTS 检索、纠正/删除 | 向量数据库、自动长期记忆 | A 的隔离表和 D 的 evidence |
| V0.1-F | Agent + Skill | 每次接入一个 State/Task/Energy/Recovery/Emotion/Reflection/Research skill | 几十 Agent、无边界工具执行 | B-E 合约和 trace |
| V0.1-G | Voice Reflection | VAD + ASR adapter + Core chat + TTS，夜间 3-10 分钟复盘 | 全天候监听、端到端黑盒大脑 | B、D、E |
| V0.1-H | Desktop Decision Window | 活动检测、打断判断、低频卡片、快速反馈 | 相机常驻、强制干预 | C、D、G 的稳定性证据 |
| V0.1-I | Device Adapter Spike | 一个真实手表/耳机/眼镜的主动触发短片段 | 全厂商兼容、旁观者识别 | H 的 adapter contract |
| V0.1-J | Personal Alpha | 本人连续 14 天运行和红队/导出删除审计 | 小范围推广、大众发布 | A-I 退出门 |

## 2. V0.1-A：Personal Core Skeleton

### 目标

建立一个不依赖 AI 的单用户 Local-First Core。API 使用新的 `CoreRepository` 接口和 SQLite 实现；旧 `MindAnchorStore` 保持兼容，Wayfinder 旧测试继续通过。

### 边界

只做 `core_profiles`、append-only `core_events`、`core_state_snapshots`、Life Compass candidate/version、permissions、system traces、retention、export/delete。禁止将模型输出、OpenClaw route、原始音视频、健康诊断写进 Personal Core。

### 结果验收

空库可执行 migration；事件重复写入幂等且跨用户隔离；State latest revision 可读取；Compass 未确认不可成为 active；P0 到期删除；P3 egress guard 在未经授权时拒绝；trace 不出现在 memory retrieval；导出包含 Core 记录；删除后 API 查询为空。

### 退出条件

`corepack pnpm --filter @mindanchor/api test -- core`、API build、旧 Wayfinder 集成测试和 migration dry-run 全部通过；有一份手工导出/删除证据。

详细实施计划见 [`2026-08-24-comma-personal-core-skeleton.md`](../superpowers/plans/2026-08-24-comma-personal-core-skeleton.md)。

## 3. V0.1-B：Single Brain

### 目标

让用户能持续聊天，并让每次回复经过一个有界 Context Builder。Context Packet 只包含 Life Compass 投影、当前 State、少量授权 Memory、最近相关 Event 和隐私等级。

### 边界

只支持一个模型 adapter（stub、OpenAI-compatible、local 三选一配置）；模型只能返回文本和结构化 candidate，不能直接写 Core、改 Compass、执行任务或发通知。

### 结果验收

聊天 session 可持久化为 P1 interaction/event；云模型请求不含 P3 原文；模型失败返回明确状态；trace 记录 model tier、context hash 和 response id；用户可删除 session。

### 退出条件

10 个固定 fixture 中上下文包大小受限，P3 泄漏测试 100% 通过，模型不可用时 UI 仍可使用本地状态和手工 check-in。

## 4. V0.1-C：Choice Engine

### 目标

基于当前 State、Life Compass 和 Personal Action 假设生成 2-5 张 Action Card，展示第一步、成本、短期/长期影响、不确定性、可逆性、价值对齐和证据。

### 边界

Choice Engine 只建议，不自动执行。必须先过 safety filter 和 intervention policy；高风险选择必须显式 approval。状态极端时关闭游戏化和积分。

### 结果验收

每个 Decision Window 有 2-5 个可比较选项；用户可选择“暂不选择/我有别的想法”；choice ledger 记录生成输入、用户选择和 trace；错误模型响应不能伪造成功选项。

### 退出条件

选项数量、证据完整率、用户可理解度和重复提醒率有 fixture 统计；所有高风险动作仍没有直接执行路径。

## 5. V0.1-D：Intervention Loop

### 目标

把一次选择变成可观察的改变尝试：创建 Intervention、安排轻量 Follow-Up、记录 Outcome/Feedback，再更新 action effect 假设。

### 边界

Follow-Up 不是机械问卷；先问“发生了什么”，再可选问评分。更新只产生带 evidence 的新假设，不覆盖历史事件，不宣称因果。

### 结果验收

用户可以暂停/跳过 follow-up；同类干预有预算、静默时段和 dismiss 冷却；结果可以关联 decision、event 和 context；Action confidence 随证据更新但不会超过规则上限。

### 退出条件

14 天 fixture 能重放 intervention -> observation -> effect；误打扰和 follow-up 完成率可计算；撤回 consent 后未发送新的 follow-up。

## 6. V0.1-E：Personal Memory

### 目标

加入 Memory Candidate、用户确认、FTS5 检索、纠正、撤回和删除。只把用户确认或明确允许的长期信息纳入 P2/P3。

### 边界

不起向量数据库、不做全自动人格画像、不将系统 trace、prompt、agent 名、模型原文导入 Memory。

### 结果验收

候选有证据 Event ID、confidence、来源和状态；用户拒绝后不再召回；同一上下文检索只返回少量相关记忆；删除后业务 API 和导出都不再返回。

### 退出条件

FTS 查询、撤回、跨用户隔离、trace 污染红队和 export/delete 全部通过。

## 7. V0.1-F：Agent 与 Skill

### 目标

在 Core 稳定后逐个接能力。第一批建议顺序为 State、Task、Energy、Recovery、Emotion、Reflection、Research；每个 Skill 有版本、来源、适用范围、禁用范围和权限。

### 边界

Agent 是岗位，Skill 是知识工具箱，Model 是算力；三者都不能越过 Core repository、consent、policy 和 approval。哲学家的观点作为视角，不伪装成科学事实或未经证实的名言。

### 结果验收

每次调用 trace 记录 skill version、capability、model tier、evidence refs；worker 只能返回结构化建议；外部工具执行必须有独立 authority 和确认。

### 退出条件

每个已接入 Skill 有合同测试、越权测试和版本回滚路径，不以“接了七个 Agent”作为完成标准。

## 8. V0.1-G：Voice Reflection

### 目标

实现用户同意后、夜间 3-10 分钟的自然语音复盘：VAD -> ASR -> Core context -> LLM -> TTS。结束后抽取 Outcome、Hypothesis、Memory Candidate，候选仍需用户确认。

### 边界

不做全天候监听；不保存双方原始音轨；不把声音情绪当事实；ASR/TTS 使用可替换 adapter。没有 consentRef 的音频不进入 ASR。

### 结果验收

录音生命周期、指示灯、暂停、撤回、短缓存过期、断线重放均可测试；语音和文字聊天共享 Life Compass/Memory/Action Model；模型不可用时会话可结束并保留可审计状态。

### 退出条件

本人手工连续 7 天完成至少 3 次复盘，原始音频按 retention 删除，误识别候选可纠正，未出现未经确认的长期写入。

## 9. V0.1-H：Desktop Decision Window

### 目标

在现有桌面活动采集上增加低频、低打扰的 Decision Window：识别有意义岔路口，展示 Action Cards，接收 Quick Feedback。

### 边界

默认静默；不做常驻相机、不做后台无限录音、不把每个窗口切换当问题、不在 UI 中加入排行榜和惩罚。

### 结果验收

用户能看到为什么被提示、使用了哪些证据、如何暂停；intervention policy 统一约束频率；忽略率、误打扰率、interruption error 可统计。

### 退出条件

至少 7 天桌面使用中，关键提示有可追溯 trace，用户可一键关闭采集与通知，核心数据导出/删除不受桌面端影响。

## 10. V0.1-I：单一外设试验

### 目标

定义 Device Adapter contract，验证一个真实设备的主动按钮/短音频/通知/健康摘要中的一小组能力。

### 边界

不承诺全品牌兼容；眼镜不做持续摄像和旁观者识别；外设断线时降级到手机/桌面，不触发高风险动作。

### 结果验收

设备必须上报 battery、network、privacy indicator、consent state；撤销和断线有自动化测试；所有 adapter 都经过同一 policy guard。

## 11. V0.1-J：个人 Alpha

### 目标

只服务创建者本人，连续 14 天运行，验证 Comma 是否逐渐更懂用户而不是变得更吵。

### 每日记录

记录至少三个真实情境：识别是否正确、选项是否有差异、用户选择、实际结果、预测误差、是否打扰过多、是否纠正了 Memory。

### 发布门

只有全部条件满足才进入小范围试用：连续 14 天可用；无未处理高风险隐私事件；用户认为有帮助的情境不少于 50%；误打扰率低于 10%；所有数据可导出/删除。未达标时只修复 Core、策略或交互，不用增加硬件掩盖问题。

## 12. 统一任务验收模板

每个阶段的 PR/任务记录必须包含：

```markdown
### 目标
### 边界
### 修改文件
### 自动化测试（命令、退出码、通过数）
### 手工验证
### 数据/权限影响
### 降级路径
### 退出条件证据
```

## 13. 当前下一步

先评审架构基线中的三项技术决策，再按 [`2026-08-24-comma-personal-core-skeleton.md`](../superpowers/plans/2026-08-24-comma-personal-core-skeleton.md) 实施 V0.1-A。第一阶段完成前不开始模型、语音、智能眼镜和全自动 Decision Window 的代码开发。

