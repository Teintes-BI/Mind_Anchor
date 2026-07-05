# M7.1 OpenChronicle 旁路记忆语义评审

## 结论

- 技术链路：通过。OpenChronicle MCP 可达，`DesktopMemoryAdapter` 可读，M7 桌面观察可完成“无记忆 / 有记忆”对照。
- 语义效果：暂不合格。当前 OpenChronicle 旁路上下文会把内部路由痕迹和历史回答片段带进 Coach 输出。
- 当前决策：不把 OpenChronicle 旁路记忆纳入桌面端长期实验，先修正记忆筛选、上下文压缩和 Coach prompt 注入策略。

## 评审依据

- 可评审报告：`test-results/macos-model-effect-observation-2026-04-25T17-06-29-174Z.md`
- 运行命令：`corepack pnpm observe:macos:model-effect -- --turns 3 --compare-openchronicle-memory --interval-ms 1000 --response-timeout-ms 60000 --response-excerpt-chars 1600`
- 结果指标：
  - `plannedTurnCount=6`
  - `completedTurnCount=6`
  - `openClawTrailCount=6`
  - `feedbackPersistedCount=6`
  - `baselineTurnCount=3`
  - `openChronicleMemoryTurnCount=3`
  - `memoryReadSuccessCount=3`
  - `memoryReadFailedCount=0`
  - `passed=true`

## 观察到的问题

- `next-action` 场景中，有记忆版本增加了“当前协调状态 / Picard routed this turn”这类内部实现细节，对用户无价值。
- `interruption-recovery` 场景中，有记忆版本和无记忆版本都出现了“已验证偏好候选”重复堆叠，说明历史回答片段正在污染当前回答。
- `over-notification` 场景中，有记忆版本仍混入 `analyst-agent` / `balance-agent` 路由信息，没有真正完成“是否必要提醒”的判断。
- 多个场景回答都复用“我先帮你把问题拆成一个可执行起点”模板，缺少针对任务的具体行动建议。

## 评分

| 维度 | 无记忆 | 有 OpenChronicle 记忆 | 判断 |
| --- | --- | --- | --- |
| 可执行性 | 2/5 | 2/5 | 两者都偏模板化，下一步不够具体 |
| 上下文相关性 | 2/5 | 2/5 | 有记忆版本读到了上下文，但未筛出有用信息 |
| 噪声控制 | 3/5 | 1/5 | 有记忆版本暴露内部 agent / router 细节 |
| 打扰控制 | 2/5 | 2/5 | 没有形成明确提醒必要性判断 |
| 产品可用性 | 2/5 | 1/5 | 当前不适合进入真实桌面体验 |

## 下一步修正方向

- `DesktopMemoryAdapter` 增加上下文过滤：
  - 过滤 `Picard routed`、`agent`、`trace`、`已验证偏好候选` 等内部痕迹。
  - 只保留用户意图、当前窗口主题、最近任务目标、明确偏好。
- Coach prompt 注入改成结构化字段：
  - `currentTask`
  - `recentUserIntent`
  - `knownPreference`
  - `doNotExposeInternalContext`
- M7 观察脚本增加语义门槛：
  - 禁止输出内部路由词。
  - 要求每个回答包含一个具体下一步。
  - `over-notification` 必须输出“提醒 / 不提醒”判断。
- 重新跑 3 场景对照后，再判断是否进入长期实验。

## 你需要配合的评审方式

你只需要打开 `test-results/macos-model-effect-observation-2026-04-25T17-06-29-174Z.md` 的 `Response Review` 部分，按下面三个问题给结论：

1. 哪一版更像你愿意每天使用的桌面助手：`baseline` 还是 `openchronicle`？
2. 你是否能接受回答里出现 `Picard routed`、`balance-agent`、`analyst-agent` 这类内部词？
3. 你希望它优先变成哪种风格：更短、更具体、更少打扰、还是更能恢复上下文？

在你确认前，工程判断先按“OpenChronicle 旁路记忆暂不进入产品长期实验”处理。
