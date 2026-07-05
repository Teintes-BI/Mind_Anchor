# M7.1 OpenChronicle 旁路验证

## 目标

- 验证 OpenChronicle 是否适合作为 MindAnchor 桌面端的旁路本地记忆层。
- 第一阶段只验证 MCP sidecar，不把 OpenChronicle 写入 MindAnchor 主链。
- 当前默认 MCP 地址：`http://127.0.0.1:8742/mcp`。

## 为什么先旁路

- OpenChronicle 当前定位为 macOS only / early alpha，本阶段不能作为生产核心依赖。
- MindAnchor 已有桌面端主链、OpenClaw、Coach、提醒和反馈闭环；OpenChronicle 应先作为上下文增强源。
- 旁路验证可以明确判断：它是否能提供 `current_context`、`recent_activity`、`list_memories` 这类可消费数据。

## 新增命令

- dry-run：`corepack pnpm validate:openchronicle-sidecar -- --dry-run`
- 默认验证：`corepack pnpm validate:openchronicle-sidecar`
- 指定 MCP：`corepack pnpm validate:openchronicle-sidecar -- --mcp-url http://127.0.0.1:8742/mcp`
- 指定查询：`corepack pnpm validate:openchronicle-sidecar -- --query "focus recovery"`

## OpenChronicle 前置启动

OpenChronicle 官方 README 给出的安装/运行方式：

```bash
git clone https://github.com/Einsia/OpenChronicle.git
cd openchronicle
bash install.sh
openchronicle start
openchronicle status
```

如果本机未监听 `127.0.0.1:8742`，MindAnchor 只能完成 validator 自检，不能完成 sidecar 可用性验收。

## 成功标准

- OpenChronicle MCP endpoint 可达。
- JSON-RPC `initialize` 成功。
- `tools/list` 返回以下必需工具：
  - `current_context`
  - `recent_activity`
  - `list_memories`
- 三个工具均可被 `tools/call` 成功调用。
- 报告 `summary.passed=true`。

## 输出

- JSON：`test-results/openchronicle-sidecar-validation-<timestamp>.json`
- Markdown：`test-results/openchronicle-sidecar-validation-<timestamp>.md`

## 当前集成边界

- 不复制 OpenChronicle 代码。
- 不修改 MindAnchor 数据模型。
- 不让 OpenChronicle 决定提醒或 Coach 输出。
- 已新增 `DesktopMemoryAdapter` 原型，只读 OpenChronicle MCP，并在 M7 模型效果观察中支持“有记忆 / 无记忆”的输出差异对照。

## 本轮结果

- Validator 单测通过：`node --test scripts/__tests__/openchronicle-sidecar-validation-report.test.mjs scripts/__tests__/openchronicle-sidecar-validation-entry.test.mjs`。
- Validator dry-run 通过：`corepack pnpm validate:openchronicle-sidecar -- --dry-run`。
- 默认真实验证未通过：`test-results/openchronicle-sidecar-validation-2026-04-25T16-36-38-590Z.md`。
- 失败原因：本机 `127.0.0.1:8742/mcp` 未可达，`current_context`、`recent_activity`、`list_memories` 未能探测。
- 已克隆到本机旁路工具目录：`.tools/OpenChronicle`。
- 已执行 `bash install.sh --no-client-config`，避免自动改写 Codex / Claude 等全局 MCP client 配置。
- 已启动 OpenChronicle daemon，确认 `127.0.0.1:8742` 处于监听状态。
- 默认真实验证已通过：`test-results/openchronicle-sidecar-validation-2026-04-25T16-45-02-423Z.md`。
- 通过结果：`requiredToolsPresent=true`、`toolCount=8`、`successfulCallCount=3`、`failedCallCount=0`、`passed=true`。
- 已新增只读 adapter：`scripts/lib/desktop-memory-adapter.mjs`。
- 已新增 adapter 单测：`scripts/__tests__/desktop-memory-adapter.test.mjs`。
- 已在 M7 观察入口新增 `--with-openchronicle-memory`、`--compare-openchronicle-memory` 与 `--memory-mode off|openchronicle|compare`。
- 已跑通真实桌面短对照：`test-results/macos-model-effect-observation-2026-04-25T16-51-29-813Z.md`。
- 短对照结果：`plannedTurnCount=2`、`baselineTurnCount=1`、`openChronicleMemoryTurnCount=1`、`memoryReadSuccessCount=1`、`memoryReadFailedCount=0`、`passed=true`。
- 已跑通 3 场景完整桌面对照：`test-results/macos-model-effect-observation-2026-04-25T16-54-42-892Z.md`。
- 完整对照结果：`plannedTurnCount=6`、`completedTurnCount=6`、`openClawTrailCount=6`、`feedbackPersistedCount=6`、`baselineTurnCount=3`、`openChronicleMemoryTurnCount=3`、`memoryReadSuccessCount=3`、`memoryReadFailedCount=0`、`passed=true`。
- 已补充带回答摘录的完整对照：`test-results/macos-model-effect-observation-2026-04-25T17-06-29-174Z.md`。
- 工程语义初评已完成：`docs/m7-openchronicle-memory-semantic-review-2026-04-26.md`。
- 初评结论：OpenChronicle 旁路技术链路可行，但当前上下文噪声会污染 Coach 输出，暂不进入桌面端长期实验。

## 已知风险

- 本机必须先启动 OpenChronicle sidecar。
- macOS Accessibility 权限会影响 OpenChronicle 采集质量。
- MCP 可达只证明工具链可接入，不证明长期记忆质量或隐私边界已经合格。
- 当前对照仍是观察 runner 级 prompt 增强，不是桌面端产品内长期记忆集成。
- 后续必须先做上下文过滤和 prompt 注入收口，再重新做语义对照。
