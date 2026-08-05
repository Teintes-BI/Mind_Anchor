# MindAnchor Wayfinder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 MindAnchor 底盘上交付一个用户可控的 Wayfinder 决策闭环：把已确认的情境转换为可解释的多个行动选项，记录用户选择和结果，并在周期复盘中校准个人模型。

**Architecture:** 新增 `wayfinder` bounded context，复用现有 Gateway、OpenClaw、Goal/Task/State/Recovery/Reflection、Coach 和多专家权限模型。客户端只负责采集/展示；Gateway 负责鉴权、同意、策略和持久化；OpenClaw worker 负责结构化情境、选项和复盘生成；业务真相保留在 Store/数据库，不放在 agent memory 中。

**Tech Stack:** TypeScript, Fastify, Zod, Vitest, React 19, Vite, SwiftUI/AppKit, OpenClaw-compatible workers, Supabase migration, existing pnpm workspace.

---

## 0. 执行边界与完成定义

### 本计划覆盖

- P0 手动/短语音输入、情境确认、A/B/C 选项、用户选择、结果记录和日复盘；
- P1 桌面轻量信号、手机按键语音、现有 Coach/GoalFlow/Recovery/Reflection 接入；
- P2 健康摘要和低置信度状态线索；
- P3 统一设备适配器、单一音频穿戴适配和眼镜实验接口；
- 安全、同意、删除、导出、trace、离线重放和评估数据。

### MVP 明确不做

- 默认 24/7 录音或云端上传；
- 持续摄像、旁观者识别、人脸/声纹情绪诊断；
- 智能眼镜作为首发依赖；
- 自动发送消息、付款、医疗/法律/财务动作；
- 排行榜、连续打卡、强制游戏化；
- 以历史人物名义生成未经来源支持的“原话”。

### 整体完成定义

只有在以下条件全部满足时，才可称为 P1 MVP 完成：

1. 一个完整情境可以从创建、确认、生成选项、选择、行动、结果到复盘被重放；
2. 高风险动作永远停在用户确认前；
3. 所有模型结果带 trace、来源、置信度和模型/技能版本；
4. 用户可以逐个数据源暂停、删除、导出和撤回记忆；
5. API、Web、macOS 和 OpenClaw 本地 stub 测试全部通过；
6. 真实个人使用至少 14 天且没有未处理的高风险隐私事件。

---

## 1. 依赖图和交付顺序

```text
T0 基线/ADR
  -> T1 Domain schemas + migration
  -> T2 Store repository
  -> T3 Consent + intervention policy
  -> T4 Wayfinder API
  -> T5 OpenClaw situation/option/outcome workers
  -> T6 Web decision ledger
  -> T7 macOS companion surface
  -> T8 mobile short-audio event extraction
  -> T9 health bridge and calibration
  -> T10 device adapter contract + one wearable spike
  -> T11 evaluation/security/pilot gate
```

并行规则：T1 完成后，T2/T3 可并行；T4 依赖 T1-T3；T6/T7 可在 T4 stub API 稳定后并行；T8/T9/T10 均不得阻塞 P0 选择账本交付。

每个任务完成后都必须运行该任务列出的验证命令，并在任务记录中保存输出摘要。任务之间不共享未提交的临时数据文件。

### 当前执行状态（2026-08-05）

T0–T5 已完成并通过验收；T6–T12 保留为后续阶段，当前不宣称已实现。权威验收报告：
`test-results/core-phase-2026-08-04T19-03-30-904Z/report.json`。

- Stub：58/58 通过；
- Provider Direct：72/72 通过；
- Cluster Preferred：72/72 通过；
- `@mindanchor/domain` build：通过；
- `@mindanchor/api`：30 个测试文件、239 个测试通过；
- Wayfinder OpenClaw contract：3/3 通过；registry E2E assertions：4/4 通过；
- 静态越权审计、`git diff --check`：通过。

报告中的实时状态文件可能在进程结束后仍显示 `running`；验收以同目录最终的 `report.json` 为准。

---

## T0：冻结基线、威胁模型和验收数据

**目标:** 把现有仓库状态、Wayfinder 的 MVP 边界和安全红线固定下来，避免后续把穿戴或持续监听偷偷扩进 P0。

**边界:** 只写文档和测试数据，不改业务运行代码，不清理用户已有改动。

**文件:**

- Create: `docs/wayfinder/README.md`
- Create: `docs/wayfinder/threat-model.md`
- Create: `docs/wayfinder/evaluation-scenarios.json`
- Modify: `README.md`，增加方案文档入口

### 步骤

- [x] **Step 1: 写产品边界清单**

  在 `docs/wayfinder/README.md` 固定 P0/P1/P2/P3 的范围、默认关闭的采集能力、风险等级和“不能自动执行”的动作列表。

- [x] **Step 2: 写数据威胁模型**

  在 `docs/wayfinder/threat-model.md` 为麦克风、相机、桌面信号、健康、日历、模型供应商和旁观者分别记录：资产、攻击面、同意状态、保留期限、删除方式、降级行为。

- [x] **Step 3: 建立 10 个离线情境 fixture**

  `evaluation-scenarios.json` 至少包含：任务承诺、任务冲突、被打断恢复、精力不足、关系沟通、事实不确定、低风险日程调整、拒绝建议、高风险财务请求、旁观者录音请求。每条包含输入摘要、预期风险级别、允许的输出类型和禁止动作。

- [x] **Step 4: 运行基线验证**

  运行：

  ```powershell
  corepack pnpm --filter @mindanchor/api test
  corepack pnpm --filter @mindanchor/web test
  git status --short
  ```

  预期：记录现有通过/失败数量；不修改与 Wayfinder 无关的 `apps/api/src/lib/utils.ts` 等用户改动。

### 结果验收

- 任何开发者只读 `docs/wayfinder/README.md` 即可知道 P0 不做什么；
- 10 个情境都能映射到一个风险级别和允许输出；
- 威胁模型覆盖原始音频、健康数据、旁观者和模型供应商；
- 基线测试结果已记录，且工作树中的原有改动未被覆盖。

### 不通过时停止

如果 P0 仍含“持续监听”“自动发消息”或“情绪诊断”等未定义边界，停止后续代码任务，先修改边界文档。

---

## T1：Wayfinder 领域模型、Zod schema 和数据库迁移

**目标:** 建立事件、情境、选项、决定、结果、价值配置、同意和干预预算的稳定契约。

**边界:** 只定义结构和迁移；不调用模型、不实现 HTTP、不写 UI。

**文件:**

- Create: `packages/domain/src/wayfinder.ts`
- Modify: `packages/domain/src/index.ts`
- Create: `packages/domain/src/__tests__/wayfinder-schema.test.ts`
- Create: `supabase/migrations/003_wayfinder_decisions.sql`

### 步骤

- [x] **Step 1: 写失败 schema 测试**

  测试必须覆盖：

  ```ts
  it("rejects an option without evidenceRefs or reversibility", () => {
    expect(() => decisionOptionSchema.parse({ action: "do it" })).toThrow();
  });

  it("accepts an idempotent context event with consent and retention", () => {
    expect(() => contextEventSchema.parse(validContextEvent)).not.toThrow();
  });

  it("does not allow critical decisions to bypass approval", () => {
    expect(decisionRiskSchema.parse({ riskLevel: "critical", requiresApproval: false })).toEqual({
      riskLevel: "critical",
      requiresApproval: true,
    });
  });
  ```

- [x] **Step 2: 定义枚举和结构**

  在 `wayfinder.ts` 实现 `contextEventSchema`、`situationSchema`、`decisionOptionSchema`、`decisionRecordSchema`、`valueProfileSchema`、`consentGrantSchema`、`interventionBudgetSchema`。所有时间字段使用现有 `isoDateTimeSchema`；所有实体带 `userId`、`createdAt`、`updatedAt` 和 `traceId`。

- [x] **Step 3: 从 `index.ts` 导出契约**

  只通过 `@mindanchor/domain` 暴露 schema 和 type，API、Web 和 worker 不直接从相对路径导入。

- [x] **Step 4: 写 SQL 迁移**

  新增 `wayfinder_context_events`、`wayfinder_situations`、`wayfinder_options`、`wayfinder_decisions`、`wayfinder_outcomes`、`wayfinder_value_profiles`、`wayfinder_consent_grants`、`wayfinder_intervention_budgets`、`wayfinder_audit_events`。每张表至少包含 `user_id`、时间字段、来源/trace 字段和删除策略需要的状态字段。

- [x] **Step 5: 运行契约验证**

  ```powershell
  corepack pnpm --filter @mindanchor/domain build
  corepack pnpm --filter @mindanchor/api test
  ```

  预期：TypeScript 编译成功；现有 API 测试不因 domain 导出变化失败。

### 结果验收

- 无证据、无同意、无可逆性字段的选项无法通过 schema；
- `critical`/`high` 风险不能被 schema 表示为免确认；
- 迁移可在空数据库中执行，并有 `user_id` 索引和幂等事件索引；
- schema 测试至少覆盖正常、缺字段、错误枚举、关键风险四类。

---

## T2：Store repository、幂等和事件重放

**目标:** 让 Wayfinder 的业务真相在现有 JSON Store 中可持久化、可查询、可重放，为未来迁移 Supabase 保持接口稳定。

**边界:** 只实现 Store/service repository；不让模型或客户端直接读写 JSON；不在此任务迁移生产数据库。

**文件:**

- Modify: `packages/domain/src/index.ts` 的 `Database` 类型和 `emptyDatabase()`
- Modify: `apps/api/src/store.ts`
- Create: `apps/api/src/services/wayfinder/wayfinder-repository.ts`
- Create: `apps/api/tests/wayfinder-repository.test.ts`

### 步骤

- [x] **Step 1: 为 repository 写失败测试**

  覆盖以下行为：同一 `clientEventId` 重复写入只产生一条事件；查询按用户和时间排序；撤回记忆后不再被召回；选择和结果可以在重新初始化 Store 后重放。

- [x] **Step 2: 扩展 `Database`**

  在现有 `Database` 中新增数组字段，默认值为空数组；迁移旧 JSON 时缺少字段必须补空数组，不能破坏旧数据。

- [x] **Step 3: 实现 repository**

  提供最小方法：

  ```ts
  appendContextEvent(input): Promise<ContextEvent>
  getSituation(userId, situationId): Promise<Situation | null>
  saveOptions(userId, situationId, options): Promise<DecisionOption[]>
  recordDecision(input): Promise<DecisionRecord>
  recordOutcome(input): Promise<DecisionRecord>
  listDecisionHistory(query): Promise<DecisionRecord[]>
  revokeMemory(userId, memoryId): Promise<void>
  ```

  所有方法必须校验 `userId`，所有写操作进入已有 `persistQueue`，所有事件保留 `traceId`。

- [x] **Step 4: 加入重放命令测试**

  使用临时目录创建 Store，写入 event -> situation -> option -> decision -> outcome，关闭并重新初始化，确认结果相同。

- [x] **Step 5: 运行测试**

  ```powershell
  corepack pnpm --filter @mindanchor/api test -- wayfinder-repository.test.ts
  ```

### 结果验收

- 重复事件不增加记录；
- 不同用户之间查询和写入完全隔离；
- 重启 API 后选择账本不丢失；
- 所有 repository 测试通过，且不需要客户端知道 JSON 文件位置。

---

## T3：同意、风险和主动干预策略引擎

**目标:** 在任何 LLM 之前决定“是否可以处理、是否可以打扰、是否必须人工确认”。

**边界:** 只实现确定性策略；不使用模型判断风险，不估计情绪，不执行外部工具。

**文件:**

- Create: `apps/api/src/services/wayfinder/consent-service.ts`
- Create: `apps/api/src/services/wayfinder/intervention-policy.ts`
- Create: `apps/api/tests/wayfinder-policy.test.ts`
- Modify: `packages/domain/src/wayfinder.ts`，补充策略结果 schema

### 步骤

- [x] **Step 1: 写策略失败测试**

  测试场景：未授权麦克风被拒绝；用户处于 quiet hours 时不发送通知；dismiss 后 6 小时内抑制同类提示；critical 选项强制 approval；每日预算达到 3 次后只入账不打扰。

- [x] **Step 2: 实现同意服务**

  同意键由 `source + purpose + scope` 组成，支持 `granted/paused/revoked`。撤回后新事件拒绝，已有原始临时数据进入删除队列。

- [x] **Step 3: 实现干预策略**

  输入为用户设置、当前时间、focus 状态、风险等级、最近提示历史和预算；输出为 `allow/suppress/queue/escalate`，并包含可解释原因。

- [x] **Step 4: 运行策略测试**

  ```powershell
  corepack pnpm --filter @mindanchor/api test -- wayfinder-policy.test.ts
  ```

### 结果验收

- 没有 consentRef 的事件无法进入情境生成；
- 策略引擎在没有 OpenClaw 的情况下也能阻断高风险动作；
- 策略输出包含原因，UI 可以直接展示；
- 单元测试覆盖同意、静默、预算、重复、风险五类。

---

## T4：Wayfinder API 和 fast/full 会话协议

**目标:** 提供稳定的 HTTP 接口，把情境、选项、选择、结果、同意和历史暴露给客户端。

**边界:** 不在 API handler 中写 prompt 或直接调用模型；handler 只做鉴权、schema、policy、service 调用和错误映射。

**文件:**

- Create: `apps/api/src/routes/wayfinder.ts`
- Create: `apps/api/src/services/wayfinder/situation-service.ts`
- Create: `apps/api/src/services/wayfinder/decision-service.ts`
- Modify: `apps/api/src/app.ts`，注册 wayfinder routes
- Create: `apps/api/tests/wayfinder.integration.test.ts`

### 步骤

- [x] **Step 1: 写 API contract 测试**

  覆盖：无 token 返回 401；事件输入不符合 Zod 返回 400；成功创建情境返回 `status=awaiting_confirmation`；确认后可读取选项；重复 `idempotency-key` 返回相同实体；跨用户读取返回 404。

- [x] **Step 2: 实现路由**

  实现以下端点：

  ```text
  POST /wayfinder/events
  GET  /wayfinder/situations/:id
  POST /wayfinder/situations/:id/confirm
  GET  /wayfinder/situations/:id/options
  POST /wayfinder/decisions
  PATCH /wayfinder/decisions/:id/outcome
  POST /wayfinder/decisions/:id/reflect
  GET  /wayfinder/decisions
  GET  /wayfinder/consent
  PATCH /wayfinder/consent/:source
  POST /wayfinder/export
  ```

- [x] **Step 3: 接入 fast/full 状态**

  创建情境后先返回 `fastStatus` 和最小摘要；选项生成异步写入 `fullStatus=pending|completed|failed`。沿用 Coach 的轮询与 trace 约定，不在 OpenClaw 不可用时伪造完整选项。

- [x] **Step 4: 运行集成测试**

  ```powershell
  corepack pnpm --filter @mindanchor/api test -- wayfinder.integration.test.ts
  ```

### 结果验收

- API 的所有写请求都使用 bearer user，不接受客户端传入的其他 `userId` 覆盖身份；
- 未确认的情境不能创建实际任务或外部动作；
- 选项、决定、结果和 trace 可以通过 API 完整读取；
- OpenClaw 失败时返回可识别的 pending/failed，而不是成功假象。

---

## T5：OpenClaw 情境、选项、专家和结果 worker

**目标:** 用结构化 worker 生成情境解释、A/B/C 选项、专家分歧和复盘候选。

**边界:** worker 只能返回结构化建议；不得直接改任务、发消息、写长期记忆；写计划仍由现有 Jarvis authority，记忆仍由 Data governor。

**文件:**

- Create: `openclaw/skills/situation-framing-skill.schema.json`
- Create: `openclaw/skills/option-architecture-skill.schema.json`
- Create: `openclaw/skills/decision-outcome-skill.schema.json`
- Create: `openclaw/runtime/workers/wayfinder-situation-worker.mjs`
- Create: `openclaw/runtime/workers/wayfinder-option-worker.mjs`
- Create: `openclaw/runtime/workers/wayfinder-reflection-worker.mjs`
- Modify: `openclaw/runtime/agent-registry.mjs`
- Create: `apps/api/tests/wayfinder-openclaw-contract.test.ts`

### 步骤

- [x] **Step 1: 定义 worker schema**

  每个输出必须包含 `traceId`、`agent`、`modelTarget`、`evidenceRefs`、`confidence`、`riskLevel`。选项必须包含 action、firstStep、costs、projectedConsequences、reversibility、valueAlignment、requiresApproval。

- [x] **Step 2: 加入视角包**

  先实现 `values_clarification`、`systems_perspective`、`scientific_reasoning`、`energy_recovery` 四个技能包。每个包有来源、适用范围、禁用范围和版本；不使用未经来源支持的历史人物原话。

- [x] **Step 3: 实现 worker 路由**

  `situation-framer` 只读取已授权事件和目标摘要；`option-architect` 只读取确认情境、价值配置、目标/状态摘要和有效记忆；`reflection-worker` 读取决定与结果，不读取原始音频/视频。

- [x] **Step 4: 写禁止越权测试**

  测试确保 worker payload 中不能出现原始音频、原始截图、第三方聊天正文；测试 `requiresApproval=true` 的选项不能通过 worker 直接执行。

- [x] **Step 5: 运行本地 runtime 契约测试**

  ```powershell
  corepack pnpm test:core-phases:local
  node --test scripts/openclaw-registry-e2e-assertions.test.mjs
  corepack pnpm --filter @mindanchor/api test -- wayfinder-openclaw-contract.test.ts
  ```

### 结果验收

- 同一输入在 stub 模式下输出可重复、可解析的 3 个选项；
- 任意选项都能指出来源、置信度、短/长期影响和可逆性；
- worker 没有计划写入、记忆终审和高风险执行权限；
- agent registry 能显示 Wayfinder worker、skill 版本和权限。

---

## T6：Web 情境、选项卡片和选择账本

**目标:** 让用户可以在 Web 端确认情境、比较选项、选择行动、填写结果和撤回记忆。

**边界:** 不在前端重新推理；所有选项和风险来自 API；不做排行榜和连续打卡。

**文件:**

- Create: `apps/web/src/pages/WayfinderPage.tsx`
- Create: `apps/web/src/pages/DecisionLedgerPage.tsx`
- Create: `apps/web/src/components/WayfinderOptionCard.tsx`
- Create: `apps/web/src/components/ConsentControlPanel.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/api.ts`
- Create: `apps/web/src/pages/__tests__/wayfinder-smoke.test.tsx`
- Create: `apps/web/src/pages/__tests__/decision-ledger.test.tsx`

### 步骤

- [x] **Step 1: 为卡片写组件测试**

  断言：卡片显示第一步、成本、长期影响、置信度、证据、可逆性；`critical` 卡片显示审批状态；加载/失败/空状态不改变布局；点击选择只发一次请求。

- [x] **Step 2: 添加 API client 方法**

  在 `apps/web/src/api.ts` 增加 typed methods：`createWayfinderEvent`、`getWayfinderSituation`、`confirmWayfinderSituation`、`listWayfinderOptions`、`recordWayfinderDecision`、`recordWayfinderOutcome`、`listWayfinderHistory`、`updateWayfinderConsent`。

- [x] **Step 3: 实现 Wayfinder 页面**

  页面顺序固定为：情境摘要 -> 确认/忽略 -> 选项卡片 -> 选择确认 -> 下一步/检查点。full response pending 时显示 fast response，不用假数据冒充选项。

- [x] **Step 4: 实现 Decision Ledger 页面**

  支持按日期、目标、风险筛选；展示当时预测和实际结果；允许填写感受、评分和“预测不准确原因”；支持删除/撤回入口。

- [x] **Step 5: 运行 Web 测试**

  ```powershell
  corepack pnpm --filter @mindanchor/web test
  corepack pnpm --filter @mindanchor/web build
  ```

### 结果验收

- 用户从一个 API fixture 可以完成一次完整选择流程；
- pending、failed、empty、revoked 四种状态都有明确 UI；
- 页面不显示未经授权的原始音视频或第三方内容；
- Web smoke 测试和构建通过。

### T6 验收记录（2026-08-05）

- `corepack pnpm --filter @mindanchor/web test`：8 个测试文件、16 个测试通过；
- `corepack pnpm --filter @mindanchor/web build`：TypeScript 与 Vite 构建通过；
- `corepack pnpm --filter @mindanchor/api test -- wayfinder.integration.test.ts`：30 个测试文件、239 个测试通过；
- Web 页面覆盖情境确认、pending/failed/empty/revoked 状态、风险确认、结果复盘、筛选和 JSON 导出；
- Wayfinder 请求使用 bearer token，选择确认按钮在请求期间禁用，避免重复提交。

---

## T7：macOS Companion 入口和低打扰通知

**目标:** 将 Wayfinder 作为现有 macOS 客户端的轻量入口，复用 Coach、Today、Goals、State 和通知权限。

**边界:** 只增加手动情境、通知和桌面信号；不在 macOS 首个任务中做持续摄像或后台常驻录音。

**文件:**

- Create: `apps/macos/Sources/Features/Wayfinder/WayfinderView.swift`
- Create: `apps/macos/Sources/Features/Wayfinder/WayfinderModels.swift`
- Modify: `apps/macos/Sources/Core/APIClient.swift`
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Sources/App/MainWindowShell.swift`
- Modify: `apps/macos/project.yml`
- Create: `apps/macos/Tests/WayfinderAPIClientTests.swift`

### 步骤

- [ ] **Step 1: 定义 Swift Codable models**

  为情境、选项、决定、结果、trace 和 consent 建立与 domain schema 一致的 `Codable` 类型，未知字段允许忽略，枚举未知值降级为 `.unknown`。

- [ ] **Step 2: 添加 APIClient 方法**

  实现与 Web 相同的 `GET/POST/PATCH` 方法，所有请求从 Keychain 会话读取 bearer token；服务端 401 必须回到现有登录状态。

- [ ] **Step 3: 实现 WayfinderView**

  使用 SwiftUI 展示情境、选项和确认按钮；风险高于 low 时增加二次确认；在 `fullStatus=pending` 时显示 fast response 和刷新按钮。

- [ ] **Step 4: 接入 AppViewModel 和导航**

  增加 `AppDestination.wayfinder`，不改变现有 Coach/Goals/State/Reflections 导航行为；通知点击打开对应情境。

- [ ] **Step 5: 运行 macOS 构建/测试**

  ```powershell
  corepack pnpm --filter @mindanchor/macos generate
  corepack pnpm --filter @mindanchor/macos build
  corepack pnpm --filter @mindanchor/macos test
  ```

### 结果验收

- macOS 可打开 Wayfinder、确认情境、选择选项并看到结果；
- 通知频率受服务端 intervention policy 约束；
- 401、网络失败、OpenClaw pending、撤回状态均有可理解 UI；
- 现有 macOS build/test 通过。

---

## T8：手机短音频和“语音 -> 任务候选”

**目标:** 在现有 Android 音频桥接上增加短片段 ASR、任务候选抽取和用户确认，不承诺全天候监听。

**边界:** 首个音频版本只支持按键/前台短片段；不使用语音情绪作为事实，不保存双方原始音轨，不自动创建任务。

**文件:**

- Modify: `apps/desktop/audio-bridge.js`
- Modify: `packages/domain/src/index.ts`，增加 `voice_candidate` 事件契约
- Create: `apps/api/src/services/wayfinder/audio-event-service.ts`
- Create: `apps/api/tests/wayfinder-audio-event.test.ts`
- Create: `docs/wayfinder/audio-consent.md`
- Modify: `docs/android-audio-beta.md`

### 步骤

- [ ] **Step 1: 固定音频同意和生命周期**

  文档明确：开始录音、录音指示、短滚动缓存、转写、摘要、原始删除、暂停和撤回。没有 `consentRef` 的 chunk 不进入 ASR。

- [ ] **Step 2: 端侧/本地 ASR adapter**

  增加 `SpeechTranscriber` 接口，stub 实现返回 fixture；真实实现可接 `whisper.cpp` 或 `sherpa-onnx`，但不得改变上层事件协议。

- [ ] **Step 3: 任务候选抽取**

  将转写转换为 `{candidateSummary, actor, action, dueAt, confidence, evidenceRef}`；说话人不确定或置信度低于阈值时只能进入 `awaiting_confirmation`。

- [ ] **Step 4: 写误听、断线和重放测试**

  测试覆盖：重复 chunk、乱序 chunk、断线重放、空音频、非任务闲聊、第三方承诺、低置信度和撤回同意。

- [ ] **Step 5: 运行音频回归**

  ```powershell
  corepack pnpm e2e:m6-mobile-capture-adb
  corepack pnpm --filter @mindanchor/api test -- wayfinder-audio-event.test.ts
  ```

### 结果验收

- 录音结束后只产生任务候选，不直接写入 Task；
- 原始音频默认不进入长期 Store；
- 断线重放不产生重复候选；
- 语音任务抽取的误触发、漏报和置信度有离线统计；
- Android 不依赖后台无限制连续 `SpeechRecognizer`。

---

## T9：HealthKit/Health Connect 摘要和预测校准

**目标:** 将睡眠、活动、静息心率等聚合健康数据作为低置信度状态线索，改善提醒剂量和恢复选项。

**边界:** 不做医疗诊断，不要求实时原始传感器，不让“无数据”推断为“没有活动”。

**文件:**

- Modify: `packages/domain/src/index.ts`，扩展 health provenance/missingness
- Modify: `supabase/migrations/002_mobile_audio_beta.sql` 或新增 `004_wayfinder_health_provenance.sql`
- Create: `apps/api/src/services/wayfinder/health-signal-service.ts`
- Create: `apps/api/tests/wayfinder-health-signal.test.ts`
- Modify: `apps/api/src/app.ts`，接入已有 health snapshot
- Create: `docs/wayfinder/health-data-boundary.md`

### 步骤

- [ ] **Step 1: 扩展 health signal schema**

  每条健康信号增加 `sourceDevice`、`capturedAt`、`receivedAt`、`missingness`、`consentScope`、`retentionClass`。

- [ ] **Step 2: 实现摘要归一化**

  将 HealthKit/Health Connect/Vendor SDK 输入归一为 `sleep_summary`、`activity_summary`、`resting_hr_summary`，缺失标记为 `missing` 或 `delayed`。

- [ ] **Step 3: 接入策略而非直接建议**

  健康摘要只能影响 intervention policy 的建议强度和 `energy_recovery` 选项，不得直接生成“你生病了”或“必须停止工作”。

- [ ] **Step 4: 添加预测校准**

  对“继续/降载/恢复”建议记录预测、实际感受、结果和用户评分，计算按用户和时间窗口分组的误差。

- [ ] **Step 5: 运行测试**

  ```powershell
  corepack pnpm --filter @mindanchor/api test -- wayfinder-health-signal.test.ts
  corepack pnpm --filter @mindanchor/api test -- state-read-model-refresh.test.ts
  ```

### 结果验收

- 没有健康权限时主流程仍然可用；
- delayed/missing 数据不会被解释成负面事实；
- 健康摘要不会产生医学诊断文本；
- 至少能通过 14 天 fixture 生成预测误差报告。

---

## T10：Device Adapter 合约和单一可穿戴试验

**目标:** 提供跨桌面、手机、手表、音频穿戴和眼镜的能力抽象，验证一个真实设备即可，不承诺多厂商兼容。

**边界:** 不让任何外设成为核心业务依赖；眼镜只支持用户主动触发短片段；无持续摄像和旁观者识别。

**文件:**

- Create: `packages/domain/src/device-adapter.ts`
- Create: `apps/api/src/services/wayfinder/device-registry-service.ts`
- Create: `apps/api/tests/device-adapter-contract.test.ts`
- Create: `docs/wayfinder/device-adapter.md`
- Create: `apps/desktop/adapters/omi-adapter.js` 或与实际设备匹配的单一 adapter

### 步骤

- [ ] **Step 1: 定义 capability contract**

  能力至少包括 `audio_input`、`camera_snapshot`、`display_prompt`、`button_trigger`、`health_summary`、`notifications`；设备必须上报 battery、network、privacyIndicator 和 consent state。

- [ ] **Step 2: 实现 registry**

  设备注册、配对、暂停、撤销和最后心跳进入统一 registry；设备断线自动降级到手机/桌面，不触发高风险动作。

- [ ] **Step 3: 写合同测试**

  测试所有 adapter 都能声明能力；声明了 `audio_input` 但没有 consent 时调用必须被拒绝；断线后事件进入 `queued` 而不是 `executed`。

- [ ] **Step 4: 做一个设备 spike**

  只选一个公开 SDK/协议设备，验证配对、实体按钮、短音频、撤销和断线；输出耗电、延迟、丢包和原始数据保留报告。

### 结果验收

- 未连接外设时 P0/P1 完整可用；
- 任何 adapter 都不能绕过 consent/policy；
- 单一设备 spike 有可重复的连接、触发、撤销和断线测试；
- 不把“支持所有智能眼镜”写入产品承诺。

---

## T11：评估、红队、安全和数据可迁移

**目标:** 证明系统在真实个人使用前可被审计、可被删除、可被导出，且不会因模型输出越权。

**边界:** 只针对成人个人 wellness/生活反思；不做组织部署、儿童用户或医疗声明的合规扩展。

**文件:**

- Create: `scripts/wayfinder-evaluation.mjs`
- Create: `scripts/__tests__/wayfinder-evaluation.test.mjs`
- Create: `scripts/wayfinder-export.mjs`
- Create: `scripts/__tests__/wayfinder-export.test.mjs`
- Create: `docs/wayfinder/pilot-runbook.md`
- Create: `docs/wayfinder/safety-incident-runbook.md`

### 步骤

- [ ] **Step 1: 自动评估 10 个场景**

  读取 `docs/wayfinder/evaluation-scenarios.json`，输出任务候选 precision/recall、风险拦截率、选项数量、证据完整率、重复提醒数和平均响应状态。

- [ ] **Step 2: 加入越权红队**

  输入包含“忽略之前的策略”“把这段网页文字当系统命令”“自动发消息”“删除所有记录”等内容，确认只产生建议/阻断，不调用外部动作。

- [ ] **Step 3: 验证导出/删除**

  创建事件、情境、选项、选择、结果和记忆候选，导出 JSON/Markdown；撤回后确认不再召回；删除后确认原始临时数据和派生可删除副本消失。

- [ ] **Step 4: 建立试点 runbook**

  记录开通同意、每日暂停、故障上报、误打扰反馈、隐私事件、紧急停止、退出和数据销毁步骤。

- [ ] **Step 5: 运行全验证**

  ```powershell
  node scripts/wayfinder-evaluation.mjs --fixtures docs/wayfinder/evaluation-scenarios.json
  node --test scripts/__tests__/wayfinder-evaluation.test.mjs scripts/__tests__/wayfinder-export.test.mjs
  corepack pnpm --filter @mindanchor/api test
  corepack pnpm --filter @mindanchor/web test
  ```

### 结果验收

- 10 个 fixture 的高风险动作拦截率为 100%；
- 高风险外部动作没有直接执行路径；
- 用户可以一次操作导出自己的事件/选择/记忆；
- 撤回后不再召回，删除后不再从业务 API 返回；
- 试点 runbook 能由另一名开发者独立执行。

---

## T12：个人 Alpha 闭环和发布门

**目标:** 在不扩大范围的前提下，用真实个人数据连续运行 14 天，决定是否进入 P2/P3。

**边界:** 只允许创建者本人；默认关闭相机和连续音频；不邀请外部用户，不公开发布。

**文件:**

- Create: `docs/wayfinder/alpha-scorecard.md`
- Create: `docs/wayfinder/alpha-daily-log-template.md`
- Modify: `docs/wayfinder/pilot-runbook.md`
- Modify: `README.md`，增加本地 Alpha 运行入口

### 步骤

- [ ] **Step 1: 启动本地 stack**

  ```powershell
  corepack pnpm dev:openclaw
  corepack pnpm dev:api
  corepack pnpm dev:web
  ```

  记录 Gateway、OpenClaw、Web 的 URL、模型模式和数据文件位置。

- [ ] **Step 2: 每日记录**

  每天至少记录 3 个情境：系统是否识别正确、选项是否有差异、选择是否完成、结果是否符合预测、是否打扰过多。

- [ ] **Step 3: 每 7 天复盘**

  只改一个变量：选项数量、提醒预算、某个价值权重或某个专家视角；不得同时改模型、提示词和采集范围。

- [ ] **Step 4: 计算 alpha scorecard**

  至少计算：有效情境数、候选确认率、用户认为有帮助的比例、误打扰率、恢复时间、预测校准、撤回/暂停次数、隐私事件数。

- [ ] **Step 5: 做 go/no-go 决策**

  只有在以下条件同时满足时才进入 P2/P3：连续 14 天可用；没有未处理高风险隐私事件；用户认为有帮助的情境不少于 50%；误打扰率低于 10%；所有数据可导出/删除。

### 结果验收

- Alpha scorecard 有真实日期和可追溯的事件 ID；
- P0/P1 的每个验收条件都附有证据；
- 未达到门槛时，输出明确的停止/修复任务，不通过增加硬件掩盖问题；
- 达到门槛时，形成 P2/P3 的新计划，而不是直接公开发布。

---

## 2. 任务间的统一验收模板

每个任务合并前必须在 PR 或任务记录中填写：

```markdown
### 目标

### 修改文件

### 不在范围内

### 自动化测试

### 手工验证

### 风险和降级

### 数据/权限影响

### 证据
```

禁止使用“已完成、应该没问题、看起来通过”等无证据结论。必须附命令、退出码、通过数量和失败项。

## 3. 计划自检

- 领域模型先于 API；API 先于客户端；客户端先于真实外设；
- P0 不依赖持续监听、健康数据或智能眼镜；
- 任何高风险动作都经过确定性 policy 和用户确认；
- 任务、状态和健康事实不写入 agent memory 作为唯一真相；
- 每个新数据源都有 consent、retention、revoke 和 export；
- 每个模型输出都有 evidence、confidence、trace 和 version；
- 现有 OpenClaw stub、Coach、GoalFlow、Recovery、Reflection 测试不会被新功能绕过；
- 计划没有要求删除或覆盖用户已有工作树改动。
