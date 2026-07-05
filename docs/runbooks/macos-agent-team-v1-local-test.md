# MindAnchor macOS Agent Team V1 本地测试 Runbook

这份 runbook 用于在本地环境稳定复现并验收 `macOS Coach / Agent Team V1` 的核心链路。

当前验收重点不是整条提醒主链路，而是：

- `Coach` 页面能正确读取并展示前台人格状态
- 手动 override / handoff / consulted context 可见
- `Jarvis Approvals` 与 `Data Memory` 两条治理动作链可调用
- 关键负路径在 UI 或测试里有清晰、可追踪的回退说明

本文档对应当前实现：

- macOS 客户端：`apps/macos`
- Gateway：`apps/api`
- Agent Team 测试计划：`docs/superpowers/plans/2026-03-21-mindanchor-agent-team-v1-implementation.md`

相关补充：

- 如果要验收新的对话教练链路，请直接看 `docs/runbooks/macos-conversation-coach-phase1-local-test.md`

---

## 0. 前置准备

如果是在另一台电脑第一次接手，先完成下面这组最小准备：

```bash
corepack pnpm install
xcodebuild -version
xcodegen --version
corepack pnpm --version
```

确认点：

- `pnpm` 可用
- `xcodebuild` 可用
- `xcodegen` 可用
- 仓库依赖已经安装

推荐先打开工程看一眼：

```bash
corepack pnpm --filter @mindanchor/macos generate
open apps/macos/MindAnchorMac.xcodeproj
```

---

## 1. 所需服务

本地验证至少需要以下组件：

- `OpenClaw` 本地入口：`corepack pnpm dev:openclaw`
- `Gateway / API`：`corepack pnpm dev:api`
- `macOS` 原生客户端构建能力：`xcodebuild`、`xcodegen`
- `pnpm` / `corepack`
- 可用的模型或 OpenClaw 路径：
  - 优先：`MINDANCHOR_OPENCLAW_BASE_URL`
  - 兼容：`MINDANCHOR_DEFAULT_MODEL_*`

说明：

- 本地 `Coach` 页面依赖 Gateway 的 `/coach/*` 路由和 bootstrap 读模型。
- `Jarvis` 计划治理与 `Data` 记忆治理由服务端读写模型提供，客户端只负责展示和动作发起。

---

## 2. 启动顺序

推荐固定按下面顺序启动，避免混淆问题来源：

1. 导出基础环境变量
2. 启动 `OpenClaw`
3. 启动 `Gateway`
4. 构建 macOS 客户端
5. 跑 API / macOS 测试，确认基线为绿
6. 打开 macOS 客户端进入 `Coach` 页面做手工验收

推荐的最小环境变量：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
export MINDANCHOR_API_PORT=3001
export MINDANCHOR_OPENCLAW_BASE_URL=http://127.0.0.1:8787
export MINDANCHOR_DEFAULT_MODEL_BASE_URL=https://gmncode.cn
export MINDANCHOR_DEFAULT_MODEL_API_KEY=你的密钥
export MINDANCHOR_DEFAULT_MODEL_NAME=gpt-5.4
export MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT=xhigh
```

如果当前只想做本地结构验证，也可以保留现有 stub / provider 配置；但本 runbook 默认按 `Gateway + OpenClaw` 联调口径写。

---

## 3. 精确命令

Task 14 要求的基础命令如下：

```bash
corepack pnpm dev:openclaw
corepack pnpm dev:api
corepack pnpm --filter @mindanchor/macos build
corepack pnpm --filter @mindanchor/api test
corepack pnpm --filter @mindanchor/macos test
```

建议执行顺序：

```bash
corepack pnpm dev:openclaw
corepack pnpm dev:api
corepack pnpm --filter @mindanchor/api test
corepack pnpm --filter @mindanchor/macos test
corepack pnpm --filter @mindanchor/macos build
```

可选增强验证：

```bash
corepack pnpm test:macos:status-item
corepack pnpm test:macos:reminder-e2e
```

客户端实际启动方式：

### 方式 A：Xcode 直接运行

```bash
corepack pnpm --filter @mindanchor/macos generate
open apps/macos/MindAnchorMac.xcodeproj
```

打开后选择 `MindAnchorMac` scheme，直接点击 Run。

### 方式 B：打开已构建产物

先执行：

```bash
corepack pnpm --filter @mindanchor/macos build
```

再打开最近一次 Debug 产物：

```bash
open "$(find ~/Library/Developer/Xcode/DerivedData -path '*Build/Products/Debug/MindAnchorMac.app' -print -quit)"
```

---

## 4. 本地验证目标

本轮本地测试主要验证下面四类能力：

- **前台人格状态**
  - `Current Coach`
  - `Manual override` / `Auto routing`
  - `Consulted Context`
  - `Handoff`

- **Jarvis 治理动作**
  - `Jarvis Approvals`
  - 高风险 proposal 的 `Approve` / `Reject`
  - proposal metadata 中的 `Risk / Before / After / Rationale`

- **Data 治理动作**
  - `Data Memory`
  - `Recall Block`
  - `Delete`

- **负路径解释**
  - wrong-route / authority mismatch 时的 handoff
  - `Jarvis unavailable`
  - `Data unavailable`
  - `Support agent unavailable`

---

## 5. 样例流程

### 5.1 Persona override / routing 流程

目标：确认 `Coach` 页面能正确持久化和显示前台人格状态。

操作：

1. 登录并进入 `Coach`
2. 观察 `Current Coach` 卡片
3. 在 `Persona Switcher` 中打开 `Manual override`
4. 选择 `Picard`、`Deanna Troi`、`Spock`、`Guinan` 或 `Jarvis`

预期：

- `Current Coach` 里的人格徽标同步变化
- 顶部 badge 显示 `Manual override`
- 当前被选中的人格卡显示 `Current`
- 当前按钮文案从 `Switch Here` 变为 `Selected`
- `Data` 不应出现在前台可切换人格列表中

说明：

- 前台可切换人格固定为：`Picard`、`Deanna Troi`、`Spock`、`Guinan`、`Jarvis`
- `Data` 只负责长期记忆治理，不是常规前台人格

### 5.2 Handoff / authority recovery 流程

目标：确认 authority mismatch 会被解释为可见 handoff，而不是静默换人。

推荐触发方式 A：直接注入一个已知 handoff 状态

```bash
curl -X POST http://127.0.0.1:3001/coach/front-agent \
  -H 'Authorization: Bearer dev:coach-user:coach@example.com' \
  -H 'Content-Type: application/json' \
  -d '{
    "currentFrontAgent": "life-secretary-agent",
    "routingMode": "manual",
    "manualOverride": true,
    "consultedAgent": null,
    "handoffReason": "plan_write_requires_jarvis",
    "overrideSourceAgent": "companion-agent",
    "visibleSummary": "Jarvis must handle the requested plan write."
  }'
```

然后刷新 `Coach` 页面。

说明：上面的 `Bearer dev:...` 写法依赖开发环境默认开启的 auth dev bypass，本地开发默认可用。

推荐触发方式 B：直接运行现有回归测试

```bash
rm -rf apps/macos/MindAnchorMac.xcodeproj && \
xcodegen generate --spec apps/macos/project.yml --project apps/macos && \
xcodebuild -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -configuration Debug -destination 'platform=macOS,arch=arm64' CODE_SIGNING_ALLOWED=NO -only-testing:MindAnchorMacTests/CoachAgentTeamTests test
```

观察 `testCoachViewModelSurfacesFrontAgentBadgeConsultSummaryAndHandoff`。

手工观察点：

- 页面出现 `Handoff` 区块
- 卡片包含：
  - `From`
  - `Reason`
  - `Next Speaker`
- 当 reason 为 `plan_write_requires_jarvis` 时，标题为 `Plan writes require Jarvis`
- 当 reason 为 `memory_governance_requires_data` 时，标题为 `Memory governance requires Data`

### 5.3 Jarvis approval 流程

目标：确认高风险计划变更以 proposal 形式出现，并可从客户端触发批准/拒绝。

操作：

1. 准备至少一条高风险 Jarvis proposal
2. 打开 `Jarvis Approvals`
3. 点击 `Approve`
4. 再次准备 proposal 并点击 `Reject`

预期：

- proposal 卡片展示：
  - `Risk: ...`
  - `Before: ...`
  - `After: ...`
  - `Rationale: ...`
  - `Created: ...`
- `Approve` 后状态更新为 `approved`
- `Reject` 后状态更新为 `rejected`
- 客户端动作分别命中：
  - `POST /coach/proposals/:proposalId/approve`
  - `POST /coach/proposals/:proposalId/reject`

### 5.4 Data memory 流程

目标：确认记忆治理动作能正确反映在 `Data Memory` 面板。

操作：

1. 准备至少一条 `accepted` 状态的 memory
2. 在 `Data Memory` 中点击 `Recall Block`
3. 再点击 `Delete`

预期：

- 卡片能显示来源人格与 turn 信息
- `Recall Block` 后项目状态变为 `recall_blocked`
- `Delete` 后项目状态变为 `deleted`
- recall-eligible 列表中不再展示被 block / delete 的项目
- 客户端动作分别命中：
  - `POST /coach/memory/:memoryId/recall-block`
  - `POST /coach/memory/:memoryId/delete`

---

## 6. 预期可见 UI 状态

本地验收时，页面上的关键可见状态应与当前实现一致：

- `Current Coach`
  - 显示当前前台人格名
  - 显示 `Manual override` 或 `Auto routing`
  - 显示当前 `visibleSummary`

- `Persona Switcher`
  - 顶部有 `Manual override` 开关
  - 每张人格卡有 `Switch Here` / `Selected`
  - 当前选中卡显示 `Current`

- `Consulted Context`
  - 只在 `consultedAgent != nil` 时显示
  - 文案形式为 `Consulted <Persona> · <visibleSummary>`

- `Handoff`
  - 只在 `handoffReason` 和 `overrideSourceAgent` 同时存在时显示
  - 必须有 `From`、`Reason`、`Next Speaker`

- `Jarvis Approvals`
  - 空状态显示 `No approval items right now.`
  - proposal 状态下显示 `Approve` / `Reject`

- `Authority Boundaries`
  - 必须可见两条用户语言契约：
    - `Jarvis changes plans.`
    - `Data manages long-term memory.`

- `Data Memory`
  - 展示 source / turn / status
  - `accepted` 状态可执行 `Recall Block` 或 `Delete`

---

## 7. 负路径演练

本节重点不是“随便看到错误”，而是确认错误被清楚地解释给用户。

### 7.1 Wrong route / authority mismatch

验证目标：

- 非法前台人格不会直接执行不属于自己的 durable action
- UI 会通过 `Handoff` 明确说明为什么需要换到 `Jarvis` 或 `Data`

建议验证方式：

- 直接复用 `5.2 Handoff / authority recovery 流程` 里的 `POST /coach/front-agent` 注入方式
- 或直接运行 `CoachAgentTeamTests`，观察 `testCoachViewModelSurfacesFrontAgentBadgeConsultSummaryAndHandoff`
- 观察 `Handoff` 卡片是否明确展示：
  - source persona
  - intervention reason
  - next speaker

### 7.2 Jarvis unavailable

验证目标：

- proposal 动作失败时，客户端不静默吞错

推荐触发方式：

- 直接运行 `CoachAgentTeamTests`，重点看 `testCoachUnavailableActionsShowFallbackMessaging`
- 当前本地 App 没有单独的“强制 Jarvis unavailable”开发开关，因此这条负路径以测试回归为主

预期文案：

- 标题：`Jarvis unavailable`
- 正文：`Jarvis is unavailable right now, so no plan changes were applied.`

### 7.3 Data unavailable

验证目标：

- memory 治理动作失败时，客户端明确说明长期记忆未变更

推荐触发方式：

- 直接运行 `CoachAgentTeamTests`，重点看 `testCoachUnavailableActionsShowFallbackMessaging`
- 当前本地 App 没有单独的“强制 Data unavailable”开发开关，因此这条负路径以测试回归为主

预期文案：

- 标题：`Data unavailable`
- 正文：`Data is unavailable right now, so long-term memory was left unchanged.`

### 7.4 Consult failure explanation

验证目标：

- supporting agent 不可用时，仍保持单一 front persona，不制造多前台混乱

推荐触发方式：

- 直接运行 `CoachAgentTeamTests`，重点看 `testCoachConsultFailureExplainsFallbackAndKeepsSingleFrontPersona`
- 如果只做手工观察，可在读模型缺失 `coachFrontAgent` 且 `fetchCoachFrontAgent` 失败的情况下观察回退，但当前最稳的入口仍是测试回归

预期文案：

- 标题：`Support agent unavailable`
- 正文：`A supporting agent was unavailable, so MindAnchor stayed with one clear front persona and explained the best next step it could.`

说明：

- 当前实现里，`consult failure` 与 `single front persona` 的保证以 `CoachAgentTeamTests` 回归覆盖为主。

---

## 8. 手动验收检查清单

- `Current Coach` 显示当前人格与正确的 routing badge
- `Manual override` 打开后，前台人格切换立即反映到 UI
- `Handoff` 卡片出现时，包含 `From / Reason / Next Speaker`
- `Jarvis Approvals` 中高风险 proposal 展示 `Before / After / Risk / Rationale`
- `Approve` / `Reject` 能更新 proposal 状态
- `Data Memory` 中 `Recall Block` / `Delete` 能更新 memory 状态
- 任意时刻只有一个 front persona 对外可见
- `Consulted Context` 最多只体现一个 consulted agent
- `Data` 不出现在前台人格切换列表
- authority mismatch 时有明确 handoff，而不是静默切换
- `Jarvis unavailable` / `Data unavailable` / `Support agent unavailable` 都有清晰 callout
- `Authority Boundaries` 两条用户语言契约始终可见

---

## 9. 推荐的自动化回归基线

每次改动 `Coach` 相关 UI、ViewModel 或 `/coach/*` 路由后，建议至少重跑：

```bash
corepack pnpm --filter @mindanchor/api test -- agent-team.integration.test.ts
corepack pnpm --filter @mindanchor/macos test
```

如果只想快速检查 `Coach` 本身：

- `apps/api/tests/agent-team.integration.test.ts`
- `apps/macos/Tests/MindAnchorMacTests/CoachAgentTeamTests.swift`

这两处目前覆盖了：

- front persona 读模型
- manual override / handoff
- proposal approve / reject
- memory recall-block / delete
- unavailable fallback messaging
- single front persona / consult 可见性约束

---

## 10. 维护说明

- 本文档的 UI 名称直接对齐当前实现中的分组标题与文案。
- 本文档中的命令直接对齐根目录 `package.json` 与 `apps/macos/package.json`。
- 如果未来修改了以下任一项，应同步更新本文档：
  - `Coach` 页面分组标题
  - `/coach/*` 路由
  - `Jarvis` / `Data` fallback 文案
  - `pnpm` 脚本名
