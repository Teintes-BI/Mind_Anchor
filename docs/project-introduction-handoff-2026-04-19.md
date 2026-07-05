# MindAnchor 项目介绍与接手文档

更新日期：`2026-04-19`

## 1. 文档目的

这份文档面向“准备继续接着这个仓库开发的人”。

目标不是重复所有历史材料，而是把当前仓库里最关键的信息收束成一份可直接接手的说明，包括：

- 项目背景
- 产品目标
- 当前架构
- 各工作区职责
- 当前真实进展
- 已确认卡点
- 启动与验证方式
- 接手时必须注意的工程事实

---

## 2. 一句话定位

**MindAnchor 不是普通待办工具，而是一个“以长期目标推进为核心、以状态感知为辅助、以 OpenClaw 为大脑”的个人执行支持系统。**

当前仓库的现实形态是：

- 客户端负责采集、展示、提醒、会话入口
- `apps/api` 是 Gateway / 兼容 API / 调试与聚合层
- `openclaw` 提供本地兼容运行时与管理/工作流入口
- Web 和 macOS 客户端已经具备可操作产品形态

---

## 3. 开发背景

### 3.1 初始设想

从 [`dev.md`](/Users/claw/mindanchor/dev.md) 可以看出，项目最早是按一个较完整的“个人认知与任务管理系统”规划推进的，包含：

- GoalFlow 目标与任务推进
- 状态理解
- 情绪与精力管理
- 中断恢复
- 自动化执行
- 周报/月报复盘

这是一份偏“功能蓝图”的计划。

### 3.2 后续收敛

从 [`README.md`](/Users/claw/mindanchor/README.md)、[`docs/development-handoff-2026-03-07.md`](/Users/claw/mindanchor/docs/development-handoff-2026-03-07.md)、[`docs/spec.md`](/Users/claw/mindanchor/docs/spec.md) 可以确认，项目后来完成了一个关键架构收敛：

- 不再把工作电脑当业务大脑
- 不再让桌面端或手机端承担主要推理
- 把 **OpenClaw runtime / cluster** 固定为系统大脑
- 把 **Gateway** 固定为接入与兼容层
- 把客户端固定为轻量入口/出口

最终拓扑被固定为：

`Client Apps -> Lobster Gateway -> OpenClaw Runtime / Workers -> Storage / Notification Providers -> Client Apps`

### 3.3 当前仓库所处阶段

这里有两个需要同时成立的结论：

- 从产品交付视角看，[`docs/mindanchor-v1-completion-report-2026-03-21.md`](/Users/claw/mindanchor/docs/mindanchor-v1-completion-report-2026-03-21.md) 认为 **单用户 V1 已完成**
- 从运行时与部署成熟度视角看，[`tasks.md`](/Users/claw/mindanchor/tasks.md) 和 [`docs/m5-production-runtime-completion-checklist.md`](/Users/claw/mindanchor/docs/m5-production-runtime-completion-checklist.md) 仍把 **M5 生产运行时收口** 当成未完全完成

接手时建议采用这个判断：

**产品已经有可用形态，但运行时稳定性、跨机器恢复和工程收口仍然存在后续工作。**

---

## 4. 产品目标

项目最终要解决的不是“记任务”本身，而是长期目标推进过程中的以下问题：

- 容易被打断
- 被打断后难以回到主线
- 状态下滑时不知道该硬顶还是休息
- 一天结束后只有焦虑，没有结构化复盘
- 一周或一月回看时，不知道哪些行为真的有帮助

最终产品要提供的能力包括：

- 目标推进与任务管理
- 状态感知与趋势判断
- 中断恢复建议
- 周报/月报复盘
- 多端提醒与回流
- Agent 调试、回归验证与可观测性

参考文档：

- [`docs/final-product-description.md`](/Users/claw/mindanchor/docs/final-product-description.md)
- [`docs/spec.md`](/Users/claw/mindanchor/docs/spec.md)

---

## 5. 当前架构与技术栈

### 5.1 Monorepo 结构

仓库使用 `pnpm workspace`，见 [`package.json`](/Users/claw/mindanchor/package.json) 和 [`pnpm-workspace.yaml`](/Users/claw/mindanchor/pnpm-workspace.yaml)。

主要工作区：

- `apps/api`
  - Fastify API
  - Gateway / 兼容 REST API
  - 调试路由
  - trace / regression / 场景种子
  - 本地 JSON 数据存储
- `apps/web`
  - React 19 + Vite Web 控制台
  - Dashboard / GoalFlow / Inbox / State / Recovery / Reflections / Agent Lab / Coach
- `apps/desktop`
  - Electron 桌面采集器旧链路
  - 保留为兼容/回退方向，不是当前主线
- `apps/macos`
  - 原生 macOS 客户端
  - 菜单栏、提醒、登录、仪表盘、Coach、状态采集与本地诊断
- `apps/android-recorder`
  - Android 音频 Beta 轨道
  - 明确仍是 Beta scaffold
- `packages/domain`
  - Zod schema 与共享类型契约
- `openclaw`
  - 本地兼容 runtime
  - runtime registry / workflow / management
- `scripts`
  - 运行、验收、smoke、诊断、macOS 发布与 OpenClaw 管理脚本

### 5.2 关键技术

- API：Fastify + TypeScript + Zod
- Web：React 19 + React Router 7 + Vite + Vitest
- Desktop：Electron
- macOS：SwiftUI / AppKit
- Shared contracts：Zod
- 包管理：`pnpm`
- Node 要求：`>=22`

### 5.3 当前运行模式

常见模式有两个：

- `MINDANCHOR_AGENT_MODE=stub`
  - 本地 deterministic stub，可离线跑主流程
- `MINDANCHOR_AGENT_MODE=openai-compatible`
  - 走真实 provider / OpenClaw cluster

当前默认开发数据仍主要落在 JSON 文件，而不是正式数据库：

- 默认数据文件：[`data/mindanchor.json`](/Users/claw/mindanchor/data/mindanchor.json)
- Supabase 目前是可选接入，主要用于 auth / 后续扩展，不是当前唯一依赖

---

## 6. 代码现实：当前已经落地到什么程度

### 6.1 API / Gateway

`apps/api` 是当前仓库最核心的工作区。

从 [`apps/api/src/app.ts`](/Users/claw/mindanchor/apps/api/src/app.ts) 可以确认，以下能力已经是代码级落地，而不是纯文档描述：

- 认证：
  - `/auth/register`
  - `/auth/login`
  - `/me`
- Coach 对话：
  - `/coach/front-agent`
  - `/coach/sessions`
  - `/coach/messages/:messageId`
  - `/coach/messages/:messageId/retry`
  - `/coach/messages/:messageId/feedback`
  - `/coach/memory`
  - `/coach/proposals`
- 调试与回归：
  - `/debug/model-probe/:agentName`
  - `/debug/agent-configs`
  - `/debug/openclaw/adapter`
  - `/debug/openclaw/native-agents`
  - `/debug/openclaw/registry-visibility`
  - `/debug/scenarios`
  - `/debug/regressions/full-run`
  - `/debug/regressions/matrix-run`
  - `/debug/traces/:traceId`
- 主业务：
  - goals / tasks / sessions
  - state signals / checkins / latest / trends
  - recovery / reflections / dashboard
  - devices / media / health / inbox

这说明 API 层已经不只是 MVP CRUD，而是一个真正的网关 + 调试面。

### 6.2 Web 控制台

从 [`apps/web/src/App.tsx`](/Users/claw/mindanchor/apps/web/src/App.tsx) 和 [`apps/web/src/api.ts`](/Users/claw/mindanchor/apps/web/src/api.ts) 看，Web 已经具备以下页面与数据接入：

- Dashboard
- Coach
- GoalFlow
- Inbox
- 状态趋势
- 恢复
- 复盘
- Agent Lab

其中 Agent Lab 不是装饰性页面，而是直接挂了：

- agent config audit
- adapter status
- scenario seed
- full regression
- matrix regression
- trace lookup
- run history

### 6.3 OpenClaw runtime

当前仓库内的 `production runtime` 还不是完全独立的一套复杂 runtime。

从 [`openclaw/production-runtime-server.mjs`](/Users/claw/mindanchor/openclaw/production-runtime-server.mjs) 可以看到，它当前本质上是对 [`openclaw/local-runtime/server.mjs`](/Users/claw/mindanchor/openclaw/local-runtime/server.mjs) 的包装与标准入口暴露。

这意味着：

- `production` 入口已经存在
- 但其底层现实仍然偏“local compatibility runtime”
- 这也解释了为什么 M5 文档一直把运行时稳定性、并发、session/fallback 收口当作后续重点

### 6.4 macOS 客户端

`apps/macos` 不是壳工程，已经是有产品完成度的原生客户端。

从 [`apps/macos/Sources/Core/AppViewModel.swift`](/Users/claw/mindanchor/apps/macos/Sources/Core/AppViewModel.swift) 和 [`apps/macos/Sources/Core/APIClient.swift`](/Users/claw/mindanchor/apps/macos/Sources/Core/APIClient.swift) 可确认：

- 有登录/注册
- 有 bootstrap 与 dashboard 拉取
- 有 Coach 会话与消息交互
- 有 inbox / reminders / state / reflection 拉取
- 有桌面活动采集与心跳
- 有通知、权限诊断、本地存储、Keychain 会话

从当前代码看，macOS 已经是主线客户端，而不是实验性分支。

### 6.5 Desktop / Android

- `apps/desktop` 仍保留 Electron 老链路，主要是兼容和回退价值
- `apps/android-recorder` 仍是 Android 音频 Beta scaffold，不是当前主线阻塞项

---

## 7. 当前进展判断

### 7.1 可以明确算“已完成/已具备”的部分

结合代码、文档和本地验证，当前可以明确判断已具备：

- Monorepo 基础工程已搭好
- API / Gateway 主链路已形成
- Web 控制台主要页面已成型
- macOS 原生客户端已具备 V1 级产品形态
- OpenClaw cluster-first 思路已完成架构收敛
- Debug / Trace / Scenario / Regression 体系已落地
- 本地兼容 runtime 已可运行
- 运行、smoke、诊断、发布脚本体系比较完整

### 7.2 当前更像“产品已可用，平台未彻底收口”

如果从“还能做什么”看，仓库已明显超出原型阶段。

如果从“是否已经达到长期可维护、跨机器稳定恢复、全仓测试稳定绿”看，答案仍是否定的。

所以项目当前最准确的阶段描述是：

**不是从零开始，也不是只剩发版；而是已经有完整产品主链，但底层运行时、对话教练链路和仓库整洁度仍有收口工作。**

---

## 8. 今天实际验证到的状态

我在当前机器做了轻量验证，结论如下。

### 8.1 通过

- `corepack pnpm --filter @mindanchor/web test`
  - 通过，`10` 个文件、`18` 个测试全绿
- `node --test scripts/__tests__/openclaw-production-runtime-entrypoint.test.mjs`
  - 通过

### 8.2 未全绿

- `corepack pnpm --filter @mindanchor/api test`
  - 总体大部分通过，但 **24 个测试文件中有 1 个文件失败**
  - 汇总为：`209 passed / 3 failed`

失败全部集中在 `apps/api/tests/conversation-coach.integration.test.ts`，具体表现为：

- stale helpful-feedback strengthening 场景里，后续消息请求返回 `404`
- mixed emotional + analytical 的 consulted-agent 路径里，`fullResponse` 未包含测试期望的“现实约束”
- retry mixed turn 时同样未满足上述期望

这说明：

- API 主体并没有全面崩溃
- 回归风险聚焦在 **conversation coach** 链路
- 当前最需要谨慎继续开发的模块之一，就是 `apps/api/src/services/conversation-coach-service.ts`

---

## 9. 当前卡点与技术债

### 9.1 Conversation Coach 回归风险

这是今天最明确、最直接的代码级卡点。

风险表现：

- helpful-feedback strengthening 的过期过滤逻辑与后续会话流程不完全稳定
- consulted-agent / mixed lane / retry lane 的行为与测试预期不一致
- Coach 是当前 API 中最复杂、跨记忆/路由/consult/authority 的子系统，继续改动时容易引入连锁回归

优先级：`P0`

### 9.2 Production runtime 仍然偏 wrapper

虽然入口名为 `production-runtime-server.mjs`，但当前仍主要包装本地兼容 runtime。

这意味着以下问题仍然合理存在：

- 并发与 session 管理未必彻底收口
- cluster 与 fallback 的边界还带有过渡态特征
- 文档里关于 M5 未完成的判断并不是历史遗留，而是和当前代码现实一致

优先级：`P0`

### 9.3 仓库存在双份前端源码

`apps/web/src` 与其测试目录中，同时存在：

- `.ts/.tsx`
- `.js`

而 Vite 入口明确指向 [`apps/web/index.html`](/Users/claw/mindanchor/apps/web/index.html) 中的 `src/main.tsx`。

接手时必须先统一认知：

- 当前主维护入口应当以 TypeScript 文件为准
- `.js` 副本是否为历史残留、编译产物手工保留、或兼容性拷贝，需要后续再收口

如果不先约定这一点，后续改 Web 很容易出现“改错文件”的问题。

优先级：`P1`

### 9.4 仓库有较大的运行/测试残留

我本地检查到：

- [`data/mindanchor.json`](/Users/claw/mindanchor/data/mindanchor.json) 约 `268 KB`
- `apps/api/data/mindanchor.json` 约 `185 MB`

其中 `.gitignore` 只忽略了 `data/*.json`，并没有忽略 `apps/api/data/*`。

这意味着：

- 仓库中很可能混入了较大的运行/测试数据残留
- 后续整理版本库时需要明确这些数据是否应被纳入源码管理
- 测试、切分支、打包、同步仓库时都会受影响

优先级：`P1`

### 9.5 Git 历史不可用

当前 `git status` 显示为：

- `No commits yet on main`

也就是说，本地仓库是一个**尚未形成正式提交历史的工作树快照**。

这会直接带来两个影响：

- 无法通过 git log / blame 理解演化历史
- 接手开发时只能依赖现有文档和代码现实，而不能依赖提交历史复原上下文

这不是功能卡点，但这是非常关键的协作风险。

优先级：`P1`

---

## 10. 接手开发时必须注意的点

### 10.1 先区分三类目标

后续开发前，先判断你正在推进的是哪一类：

- 产品功能推进
- 运行时/部署成熟度收口
- 仓库工程清理与稳定性修复

这三类工作很容易混在一起，但优先级和评估标准不同。

### 10.2 当前最危险的改动区域

优先需要小心的文件/模块：

- [`apps/api/src/services/conversation-coach-service.ts`](/Users/claw/mindanchor/apps/api/src/services/conversation-coach-service.ts)
- [`apps/api/src/lib/model-bridge.ts`](/Users/claw/mindanchor/apps/api/src/lib/model-bridge.ts)
- [`openclaw/local-runtime/server.mjs`](/Users/claw/mindanchor/openclaw/local-runtime/server.mjs)
- [`openclaw/production-runtime-server.mjs`](/Users/claw/mindanchor/openclaw/production-runtime-server.mjs)

原因是这些模块横跨：

- 路由
- agent 选择
- memory recall
- consult
- fallback
- runtime 执行链

### 10.3 当前最可信的“系统主线”

如果你想快速建立正确心智模型，建议把主线理解成：

1. `apps/macos` / `apps/web` 是用户入口
2. `apps/api` 是系统中枢外壳
3. `openclaw` 是大脑执行层
4. `packages/domain` 是所有契约的边界层

也就是说，**先读 API 与 domain，再读 runtime，再读客户端**，效率最高。

### 10.4 优先参考的文档顺序

建议按这个顺序读：

1. [`README.md`](/Users/claw/mindanchor/README.md)
2. [`docs/spec.md`](/Users/claw/mindanchor/docs/spec.md)
3. [`docs/development-handoff-2026-03-07.md`](/Users/claw/mindanchor/docs/development-handoff-2026-03-07.md)
4. [`tasks.md`](/Users/claw/mindanchor/tasks.md)
5. [`docs/m5-production-runtime-completion-checklist.md`](/Users/claw/mindanchor/docs/m5-production-runtime-completion-checklist.md)
6. 对应 runbook / macOS 安装文档 / core phase 测试手册

### 10.5 不要把所有文档结论当作完全同步

仓库文档整体质量不低，但当前存在一种“合理但需要显式说明”的并存状态：

- V1 文档强调“交付完成”
- M5 文档强调“运行时未完全收口”

两者不是互相否定，而是视角不同。

如果后续要继续推进开发，建议尽快重新统一一次：

- 当前产品完成度
- 当前运行时完成度
- 当前仓库健康度

避免后续团队对“到底算做完了吗”产生理解偏差。

---

## 11. 建议的后续开发顺序

### P0

- 修复 `conversation coach` 的三个失败集成测试
- 明确 consulted-agent / strengthening / retry lane 的预期行为
- 重新验证 `apps/api` 测试全绿

### P1

- 重新梳理 `production runtime` 与 `local runtime` 的边界
- 判断当前是否真的要继续推进 M5 运行时收口
- 如果继续推进，优先收并发、session、fallback 触发条件

### P2

- 统一 `apps/web` 中 `.ts/.tsx` 与 `.js` 双份源码策略
- 清理 `apps/api/data/mindanchor.json` 这类大体积运行残留
- 明确哪些文件属于源码、哪些属于运行状态或测试产物

### P3

- 如果目标是继续对外可交付：
  - 重新跑一遍 API / Web / macOS / core-phases 的最小验收
  - 更新 handoff / checklist / completion report 的统一结论

---

## 12. 常用命令

### 安装与开发

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm install
pnpm dev:openclaw
pnpm dev:api
pnpm dev:web
pnpm dev:desktop
```

### 测试

```bash
corepack pnpm --filter @mindanchor/api test
corepack pnpm --filter @mindanchor/web test
corepack pnpm test:core-phases:local
corepack pnpm test:core-phases:real:aligned
```

### 预检与 smoke

```bash
bash scripts/preflight-v1-stack.sh \
  --gateway-url http://127.0.0.1:3001 \
  --openclaw-url http://127.0.0.1:8787

pnpm smoke:web-console
pnpm smoke:cluster
```

### macOS

```bash
corepack pnpm --filter @mindanchor/macos generate
corepack pnpm --filter @mindanchor/macos test
corepack pnpm test:macos:status-item
corepack pnpm test:macos:reminder-e2e
```

---

## 13. 结论

如果只用一句话总结当前仓库：

**MindAnchor 已经是一个有真实产品主链、真实客户端、真实调试面和真实运行脚本的系统；但它还不是一个完全收口、全仓稳定绿、运行时边界彻底清晰的“维护期仓库”。**

因此，最合理的接手姿势不是“从零设计”，也不是“直接发版”，而是：

**在保留现有产品主线的前提下，优先修复 Coach 回归、厘清 runtime 边界、清理仓库工程债务，再继续新功能开发。**
