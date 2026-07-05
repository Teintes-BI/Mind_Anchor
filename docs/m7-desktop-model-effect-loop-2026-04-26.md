# M7 桌面端模型效果闭环

## 当前结论

- M7 目标：先把桌面端作为主客户端做硬，再用真实桌面链路观察模型效果。
- 移动端暂缓：M6 已有真机闭环证据，但后续扩展必须等桌面端模型效果稳定后再继续。
- 第一版观察入口：`corepack pnpm observe:macos:model-effect`。
- `2026-04-26` 已跑通默认 3 回合观察：`test-results/macos-model-effect-observation-2026-04-25T16-16-11-085Z.md`。
- `2026-04-26` 已接入 OpenChronicle 旁路记忆对照模式，并跑通 1 组“无记忆 / 有记忆”真实桌面短观察：`test-results/macos-model-effect-observation-2026-04-25T16-51-29-813Z.md`。
- `2026-04-26` 已跑通 3 场景完整“无记忆 / 有记忆”对照：`test-results/macos-model-effect-observation-2026-04-25T16-54-42-892Z.md`。
- `2026-04-26` 已补充带回答摘录的可评审对照报告，并完成工程语义初评：`docs/m7-openchronicle-memory-semantic-review-2026-04-26.md`。

## 观察范围

- 构建并启动 `MindAnchorMac` Debug App。
- 启动临时 Gateway API，使用临时 data file，不污染长期服务数据。
- 复用 OpenClaw real profile 对齐 Gateway provider env。
- 通过 macOS automation bridge 在真实桌面客户端里打开 Coach、发送提示、等待完整回复、提交反馈。
- 可选通过 `DesktopMemoryAdapter` 从 OpenChronicle MCP 读取只读旁路上下文，并在观察 prompt 中做“有记忆 / 无记忆”对照。
- 输出 JSON 与 Markdown 报告。

## 默认场景

- `next-action`：验证模型能否给出短、明确、可执行的下一步。
- `interruption-recovery`：验证模型能否帮助用户从中断中恢复上下文。
- `over-notification`：验证模型是否体现少打扰和必要性判断。

## 成功标准

- OpenClaw runtime `/health` 可达。
- 临时 Gateway `/health` 可达。
- macOS App 自动登录固定本地账号成功。
- 每个 turn 都完成：
  - assistant 状态为 `completed`
  - fast response 非空
  - full response 非空
  - execution trail 包含 OpenClaw 路由语义
  - feedback 持久化成功
- 报告 `summary.passed=true`。

## 命令

- dry-run：`corepack pnpm observe:macos:model-effect -- --dry-run`
- 短观察：`corepack pnpm observe:macos:model-effect -- --turns 2 --interval-ms 1000`
- OpenChronicle 旁路记忆短对照：`corepack pnpm observe:macos:model-effect -- --turns 1 --compare-openchronicle-memory`
- 只跑有 OpenChronicle 记忆版本：`corepack pnpm observe:macos:model-effect -- --turns 1 --with-openchronicle-memory`
- 默认观察：`corepack pnpm observe:macos:model-effect`
- 单测：
  - `node --test scripts/__tests__/desktop-memory-adapter.test.mjs`
  - `node --test scripts/__tests__/macos-model-effect-observation-report.test.mjs`
  - `node --test scripts/__tests__/macos-model-effect-observation-entry.test.mjs`

## 限制

- 当前报告验证的是链路完整性、响应完成度、OpenClaw 路由轨迹和反馈闭环。
- OpenChronicle 当前只作为观察 runner 的旁路上下文源，不进入 MindAnchor 主链，也不改写桌面端数据模型。
- “有记忆 / 无记忆”短对照只证明 adapter 可读且模型能消费上下文，不证明记忆质量已经长期稳定。
- 当前语义初评显示 OpenChronicle 上下文会暴露内部路由噪声，不应直接进入桌面端长期实验。
- 当前报告不替代人工语义质量评审；真正的“模型是否有用”仍需要用户在长期桌面使用中对提醒、复盘和建议进行真实反馈。
- 当前版本默认禁用桌面 collector，避免把采集稳定性和模型效果观察混在同一次测试里。

## 本轮证据

- M7 report 单测通过：`node --test scripts/__tests__/macos-model-effect-observation-report.test.mjs`。
- M7 entry dry-run 单测通过：`node --test scripts/__tests__/macos-model-effect-observation-entry.test.mjs`。
- DesktopMemoryAdapter 单测通过：`node --test scripts/__tests__/desktop-memory-adapter.test.mjs`。
- M7 dry-run 通过：`corepack pnpm observe:macos:model-effect -- --dry-run`。
- OpenChronicle 旁路记忆对照 dry-run 通过：`corepack pnpm observe:macos:model-effect -- --dry-run --turns 1 --compare-openchronicle-memory`。
- OpenClaw runtime health 通过：`corepack pnpm health:openclaw-runtime-lan`。
- 最短 1 回合桌面观察通过：`test-results/macos-model-effect-observation-2026-04-25T16-10-06-728Z.md`。
- 状态栏恢复主窗口验收通过：`corepack pnpm test:macos:status-item`。
- 桌面提醒通知整链路验收通过：`corepack pnpm test:macos:reminder-e2e`。
- 默认 3 回合桌面观察通过：`test-results/macos-model-effect-observation-2026-04-25T16-16-11-085Z.md`。
- OpenChronicle 旁路记忆短对照通过：`test-results/macos-model-effect-observation-2026-04-25T16-51-29-813Z.md`，其中 `baselineTurnCount=1`、`openChronicleMemoryTurnCount=1`、`memoryReadSuccessCount=1`、`memoryReadFailedCount=0`。
- OpenChronicle 旁路记忆 3 场景完整对照通过：`test-results/macos-model-effect-observation-2026-04-25T16-54-42-892Z.md`，其中 `plannedTurnCount=6`、`completedTurnCount=6`、`openClawTrailCount=6`、`feedbackPersistedCount=6`、`baselineTurnCount=3`、`openChronicleMemoryTurnCount=3`、`memoryReadSuccessCount=3`、`memoryReadFailedCount=0`。
- 带回答摘录的 3 场景完整对照通过：`test-results/macos-model-effect-observation-2026-04-25T17-06-29-174Z.md`。
- 工程语义初评：`docs/m7-openchronicle-memory-semantic-review-2026-04-26.md`。
