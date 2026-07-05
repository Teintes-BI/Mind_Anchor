# MindAnchor macOS Conversation Coach Phase 1 本地测试 Runbook

这份 runbook 用于在本地环境稳定复现并验收 `OpenClaw Conversation Coach Phase 1` 的核心链路。

当前验收重点是：

- `Coach` 页面里的对话区已经接上 `OpenClaw conversation lane`
- 一次对话能先收到 `fastResponse`，随后补齐 `fullResponse`
- 对话 memory 可见、可撤回，且能显示“本次回复用到了哪些 memory”
- feedback、retry、memory revoke 这三条动作链在 macOS 客户端里可调用

本文档对应当前实现：

- macOS 客户端：`apps/macos`
- Gateway：`apps/api`
- OpenClaw 本地 runtime：`openclaw/local-runtime`
- Coach 设计文档：`docs/superpowers/specs/2026-03-21-openclaw-conversation-coach-design.md`

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

推荐先生成一次工程：

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

说明：

- 本 runbook 默认按 `cluster-preferred` 验收口径来写。
- `Conversation Coach` 仍然是薄客户端：客户端只发起会话、发送消息、轮询消息和展示 memory / feedback。
- 最终建议文本必须来自 OpenClaw 路径，而不是客户端本地 heuristics。

---

## 2. 推荐环境变量

推荐的最小环境变量如下：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
export MINDANCHOR_API_PORT=3001
export MINDANCHOR_OPENCLAW_BASE_URL=http://127.0.0.1:8787
export MINDANCHOR_AGENT_MODE=openai-compatible
export MINDANCHOR_DEFAULT_MODEL_BASE_URL=https://gmncode.cn
export MINDANCHOR_DEFAULT_MODEL_API_KEY=你的密钥
export MINDANCHOR_DEFAULT_MODEL_NAME=gpt-5.4
export MINDANCHOR_DEFAULT_MODEL_WIRE_API=responses
export MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT=xhigh
```

如果只想做结构验证，也可以把 `MINDANCHOR_AGENT_MODE=stub`；但本 runbook 默认按真实 `OpenClaw + GPT-5.4` 口径验收。

---

## 3. 启动顺序

推荐固定按下面顺序启动，避免问题来源混淆：

1. 导出环境变量
2. 启动 `OpenClaw`
3. 启动 `Gateway`
4. 跑 API 会话教练测试
5. 跑 macOS conversation / coach 测试
6. 打开 macOS 客户端进入 `Coach`

精确命令：

```bash
corepack pnpm dev:openclaw
corepack pnpm dev:api
corepack pnpm --filter @mindanchor/api test -- conversation-coach.integration.test.ts
xcodegen generate --spec apps/macos/project.yml --project apps/macos
xcodebuild -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -configuration Debug -destination 'platform=macOS,arch=arm64' CODE_SIGNING_ALLOWED=NO -only-testing:MindAnchorMacTests/APIClientTests -only-testing:MindAnchorMacTests/CoachConversationTests -only-testing:MindAnchorMacTests/CoachAgentTeamTests test
```

客户端启动方式：

### 方式 A：Xcode 直接运行

```bash
corepack pnpm --filter @mindanchor/macos generate
open apps/macos/MindAnchorMac.xcodeproj
```

打开后选择 `MindAnchorMac` scheme，点击 Run。

### 方式 B：打开最近一次 Debug 产物

```bash
corepack pnpm --filter @mindanchor/macos build
open "$(find ~/Library/Developer/Xcode/DerivedData -path '*Build/Products/Debug/MindAnchorMac.app' -print -quit)"
```

---

## 4. 验收目标

本轮本地测试主要验证下面五类能力：

- `Coach` 页中 `Conversation Coach` 区块可见
- 会话列表、线程、composer、memory panel 同时可见
- 发消息后先看到 `pending_full + fastResponse`
- 刷新线程后看到 `completed + fullResponse`
- `Helpful` / `Unhelpful` / `Retry` / `Revoke memory` 可调用

---

## 5. 样例流程

### 5.1 打开 Coach 会话区

操作：

1. 登录并进入 `Coach`
2. 确认页面中出现 `Conversation Coach`
3. 确认里面至少有：
   - `Sessions`
   - `Thread`
   - `Composer`
   - `Conversation Memory`

预期：

- `Conversation Coach` 区块与既有 `Persona Switcher`、`Jarvis Approvals`、`Data Memory` 同时存在
- 旧 `Agent Team V1` 能力没有被替换或隐藏

### 5.2 新建会话并发送一条消息

推荐消息：

```text
我更适合先拿到一个短句、明确、能立刻开始的下一步。
```

操作：

1. 点击 `New Conversation`
2. 在 composer 里输入上面的句子
3. 点击 `Send`

预期：

- 左侧 `Sessions` 出现新会话
- `Thread` 中新增一条 user message 和一条 assistant message
- assistant message 初始状态为 `Pending_full`
- assistant message 已显示 `Fast Response`
- 右侧 `Conversation Memory` 稍后会多出一条偏好记忆

说明：

- 当前后端是“先 fast，后 full”的两段式语义。
- `fullResponse` 不是同步阻塞返回，而是异步补齐。

### 5.3 刷新并确认 fullResponse 补齐

操作：

1. 发出消息后等待约 `1–5s`
2. 点击 `Refresh Thread`

预期：

- 原来的 assistant message 从 `Pending_full` 变为 `Completed`
- `Full Response` 文本出现
- 若该回复使用了 memory，卡片中会出现 `Used In This Reply`

如果没有补齐：

- 先看 API 端是否仍有请求日志
- 再检查 `GET /debug/openclaw/adapter`
- 最后检查 `apps/api/tests/conversation-coach.integration.test.ts` 是否仍可通过

### 5.4 Helpful / Unhelpful 反馈

操作：

1. 找到一条 assistant message
2. 点击 `Helpful` 或 `Unhelpful`

预期：

- 对应消息卡片上的 feedback 状态更新
- 不需要刷新整个 App
- 不会影响旧 `Jarvis` / `Data` 治理区块

### 5.5 Retry 行为

操作：

1. 对一条 `pending_full` 或失败消息点击 `Retry`

预期：

- 该消息重新进入更新流程
- 刷新后看到新的 `traceId` 或更新后的 `updatedAt`
- 已有 `fastResponse` 时，重点应放在补齐 `fullResponse`

### 5.6 Conversation memory 撤回

操作：

1. 在右侧 `Conversation Memory` 面板里选一条 `active` memory
2. 点击 `Revoke`

预期：

- 该条 memory 状态改成 `revoked`
- 它不应再出现在后续回复的 `Used In This Reply` 里

---

## 6. 关键测试命令

只跑 API 会话教练回归：

```bash
corepack pnpm --filter @mindanchor/api test -- conversation-coach.integration.test.ts
```

只跑 macOS conversation / coach 回归：

```bash
xcodegen generate --spec apps/macos/project.yml --project apps/macos
xcodebuild -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -configuration Debug -destination 'platform=macOS,arch=arm64' CODE_SIGNING_ALLOWED=NO -only-testing:MindAnchorMacTests/APIClientTests -only-testing:MindAnchorMacTests/CoachConversationTests -only-testing:MindAnchorMacTests/CoachAgentTeamTests test
```

整包 macOS 测试：

```bash
corepack pnpm --filter @mindanchor/macos test
```

---

## 7. 常见问题

### 7.1 只看到 fast，看不到 full

优先检查：

- `MINDANCHOR_OPENCLAW_BASE_URL` 是否正确
- `OpenClaw` 本地 runtime 是否已启动
- `GET /debug/openclaw/adapter` 最近 decision 是否出现 `conversation-coach-fast-agent` 与 `conversation-coach-agent`

### 7.2 能发消息，但 memory 不出现

说明：

- 当前 memory 提取只会对“偏好 / 习惯”表达较明确的输入触发。
- 如果输入太泛，比如“我现在很乱”，不一定写出长期偏好 memory。

优先使用类似下面的句子复测：

```text
我更适合先拿到一个短句、明确、能立刻开始的下一步。
```

### 7.3 Coach 页面里 conversation 区块不出现

优先检查：

- Xcode 工程是否重新生成过
- 当前运行的是否是最新 Debug 构建
- `apps/macos/Sources/Features/Coach/CoachView.swift` 中是否已经挂上 `Conversation Coach`

---

## 8. 当前完成定义

当满足下面条件时，可以认为 `Conversation Coach Phase 1` 本地链路已经跑通：

- API 会话教练回归为绿
- macOS conversation / coach 测试为绿
- `Coach` 页面里可以看到 conversation workspace
- 一次真实消息能经历 `fastResponse -> fullResponse`
- 至少一条 conversation memory 可见且可撤回

---

## 9. 后续衔接

这份 runbook 跑通后，下一步优先建议是：

1. 补一轮真实 GUI 手工验收记录
2. 再补 `README` / 交接文档里的入口链接
3. 然后推进 Phase 1 剩余的文档与端到端验收整理
