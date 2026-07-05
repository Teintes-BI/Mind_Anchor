# MindAnchor Core Mainline Phased Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 MindAnchor 当前主线收敛为一个真正可长期使用的核心系统：`Mac Coach + Gateway + OpenClaw + Memory`，优先解决对话、记忆、反馈学习与可解释性，而不是继续扩散外围功能。

**Architecture:** 先收敛 `apps/api + openclaw`，让对话、memory、authority、feedback 真正形成单一主链；再收敛 `apps/macos`，把这条主链稳定、清楚、可解释地展示给用户；最后才处理更外层的 Web、发布工程和非主线能力。

**Tech Stack:** TypeScript, Fastify, Vitest, SwiftUI/AppKit, OpenClaw local runtime, Gateway trace/debug APIs

---

## Phase 0：纠偏冻结与主线守护

**目标**

- 把“什么是主线，什么不是主线”冻结下来。
- 防止继续被发布工程、外围平台、非主线 UI 工作分散。

**主模块**

- `docs/superpowers/specs/2026-03-19-mindanchor-v1-commercial-delivery-design.md`
- `docs/mindanchor-completed-work-report-2026-03-22.html`

**完成标准**

- [x] 主 spec 已有 `Product Decision Ledger`
- [x] 主 spec 已有 `Current Execution Priority Override`
- [x] 主 spec 已有 `Current Working Tree And Correction`
- [ ] 后续所有新决定都继续增写到主 spec，不再另起主规约

**阶段结论**

- 当前主线固定为：
  - `apps/api`
  - `openclaw`
  - `apps/macos`
- 当前顺序固定为：
  1. `apps/api + openclaw`
  2. `apps/macos`
  3. Web / 发布工程 / 外围能力

---

## Phase 1：Conversation 真正收敛到 OpenClaw 主路径

**目标**

- 让用户看到的对话内容，尽量稳定地来自 OpenClaw 主路径。
- 让 `Picard -> front agent -> consult -> authority` 成为单一可追踪主链。

**涉及文件**

- Modify: `apps/api/src/services/conversation-coach-service.ts`
- Modify: `apps/api/src/lib/model-bridge.ts`
- Modify: `openclaw/local-runtime/server.mjs`
- Test: `apps/api/tests/conversation-coach.integration.test.ts`
- Test: `apps/api/tests/openclaw-local-runtime.test.ts`

**重点任务**

- [ ] 明确 `fast / full / consult / authority` 每一段的 OpenClaw 主路径行为
- [ ] 把 fallback 改成“显式降级”，而不是默默替代主路径
- [ ] 让 trace 中清楚显示：
  - 当前谁是 front agent
  - 是否 consult
  - 是否 authority handoff
  - 是 cluster 还是 fallback
- [ ] 补回归，覆盖：
  - front-only
  - front + consult
  - Jarvis authority
  - Data authority

**完成标准**

- [ ] conversation 主要输出默认由 OpenClaw 主路径生成
- [ ] fallback 发生时，trace 和 UI 都能看出来
- [ ] 不再出现“看起来是 OpenClaw，实际是别的路径”的混淆

---

## Phase 2：Memory 真相源与可解释性收敛

**目标**

- 让 memory 成为统一、可控、可解释的系统能力。
- 解决“用了哪些记忆、为什么用了、用户怎么撤回”。

**涉及文件**

- Modify: `apps/api/src/services/agent-memory-service.ts`
- Modify: `apps/api/src/services/conversation-coach-service.ts`
- Modify: `apps/api/src/store.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `apps/api/tests/agent-memory-service.behavior.test.ts`
- Test: `apps/api/tests/agent-memory.integration.test.ts`
- Test: `apps/api/tests/conversation-coach.integration.test.ts`

**重点任务**

- [ ] 继续完善 `top-k / budget / compaction`
- [ ] 增加跨 scope 优先级：
  - `preferences`
  - `habits`
  - `constraints`
  - `recentContext`
- [ ] 建立 `usedMemoryIds / usedMemorySources / usedMemorySummaries` 的统一解释结构
- [ ] 明确：
  - 哪些记忆来自 `coach-memory`
  - 哪些来自 `gateway-memory`
  - 哪些只是 `recentContext`
- [ ] 保证被 revoke / blocked / deleted 的 memory 后续不会再被召回

**完成标准**

- [ ] 每条 assistant reply 都能更清楚说明用了哪些记忆
- [ ] 不同 scope 的优先级规则固定下来
- [ ] memory explainability 能被 API、trace、Mac UI 共同消费

---

## Phase 3：Feedback → Preference / Habit Learning 闭环

**目标**

- 让系统开始真正“越用越懂你”，但先做偏好和习惯，不做重训练。

**涉及文件**

- Modify: `apps/api/src/services/conversation-coach-service.ts`
- Modify: `apps/api/src/services/agent-memory-proposal-service.ts`
- Modify: `apps/api/src/services/data-memory-service.ts`
- Modify: `apps/api/src/store.ts`
- Test: `apps/api/tests/conversation-coach.integration.test.ts`
- Test: `apps/api/tests/agent-memory.integration.test.ts`

**重点任务**

- [ ] 把 `helpful` 从“记录一下”推进到真正影响后续 retrieval / routing
- [ ] 区分：
  - preference strengthening
  - habit strengthening
  - noise / 偶然反馈
- [ ] 建立 weakening / revoke / 反向修正能力
- [ ] 让 feedback 的结果先进入 proposal / governance，而不是直接写死

**完成标准**

- [ ] 系统能对相似场景逐步更贴合用户
- [ ] 用户能撤回或纠正已经学错的偏好
- [ ] learning 行为能被 trace 和 debug 接口看见

---

## Phase 4：`apps/macos` 主链展示收敛

**目标**

- 不再扩很多新壳，而是把已经打通的主链在 Mac 上清楚稳定地呈现出来。

**涉及文件**

- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Sources/Core/AppModels.swift`
- Modify: `apps/macos/Sources/Features/Coach/CoachConversationViews.swift`
- Modify: `apps/macos/Sources/Core/APIClient.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/CoachConversationTests.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/APIClientTests.swift`
- Test: `scripts/run-macos-coach-conversation-e2e.mjs`

**重点任务**

- [ ] 在 Coach UI 中显示“本轮用了哪些记忆”
- [ ] 清楚区分：
  - fast
  - full
  - consult
  - authority
  - memory revoke
- [ ] 让 `Authority · Data`、`Consult · Spock` 这类轨迹更容易理解
- [ ] 减少自动化和真实 GUI 状态不同步的问题

**完成标准**

- [ ] 用户能从 UI 看懂这一轮回答为什么会这样说
- [ ] Mac 端不再只是“能看见消息”，而是能看懂背后的主链

---

## Phase 5：延迟、质量、稳定性优化

**目标**

- 在主链已经真实成立之后，开始把体验做得更快、更稳、更像长期助手。

**涉及文件**

- Modify: `apps/api/src/lib/model-bridge.ts`
- Modify: `apps/api/src/services/conversation-coach-service.ts`
- Modify: `apps/api/src/orchestrator.ts`
- Modify: `openclaw/local-runtime/server.mjs`
- Test: `apps/api/tests/conversation-coach.integration.test.ts`
- Test: `apps/api/tests/openclaw-local-runtime.test.ts`

**重点任务**

- [ ] 补 latency 指标：
  - fast
  - full
  - consult
  - authority
  - memory retrieve
- [ ] 补质量指标：
  - feedback
  - revoke
  - fallback
- [ ] 优化高频慢路径：
  - memory fetch
  - full completion
  - authority 后的收尾

**完成标准**

- [ ] 能知道慢在哪里
- [ ] 能区分是模型问题、memory 问题还是 routing 问题
- [ ] 对话体验明显更快更稳

---

## 当前阶段性里程碑

### 里程碑 M1：主链成立

- [ ] OpenClaw 主路径下的 conversation 稳定可追踪
- [ ] authority handoff 稳定
- [ ] memory 统一来源成立

### 里程碑 M2：主链可解释

- [ ] 用户能知道这轮回答用了哪些 memory
- [ ] trace / API / Mac UI 三端解释一致

### 里程碑 M3：主链可学习

- [ ] feedback 能逐步影响 preference / habit
- [ ] 用户能撤回和纠错

### 里程碑 M4：主链够稳定

- [ ] GUI、API、local runtime 三边回归稳定
- [ ] 延迟与 fallback 可量化

---

## 当前不要优先做的事

- [ ] 继续扩很多非主线 Web 功能
- [ ] 扩 Android / iOS 正式版
- [ ] 扩音频 / 视频 / 健康正式链路
- [ ] 把大量时间花在更广发布包装、签名、公证外围
- [ ] 给 Mac 端继续堆新壳，而不是解释和稳定主链

---

## 从现在开始的实际执行顺序

1. `Phase 1`：Conversation 主路径收敛
2. `Phase 2`：Memory explainability 收敛
3. `Phase 3`：Feedback learning 闭环
4. `Phase 4`：Mac 展示收敛
5. `Phase 5`：延迟 / 质量 / 稳定性优化

---

Plan complete and saved to `docs/superpowers/plans/2026-03-22-mindanchor-core-mainline-phased-plan.md`. Ready to execute?
