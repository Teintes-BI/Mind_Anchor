# M6 Cadenced Capture Loop Design

## Context

- 当前 `M6` 已完成真机 `ADB + curl` 的单次移动采集闭环：
  - 移动采集写入
  - Inbox 拉取与 `ack`
  - Recovery plan 创建与 `recovery/history` 一致性验证
- 当前缺口不是 API 覆盖面，而是**时间维度**：
  - 现有 e2e 证明“单次样本可闭环”
  - 但尚未证明系统能处理**连续、分阶段的移动信号演进**

## Goal

把现有 `M6` runner 从“一次性闭环”扩展为“阶段化采样闭环”，证明当前系统可以在同一真机会话中：

1. 按时间顺序接收多轮采样
2. 持续推进 `health/latest`
3. 在压力升高后创建并保持 Recovery plan
4. 在 recovery 之后继续接收样本且不破坏读模型一致性

## Non-Goals

- 不新增业务 API
- 不引入 Android 原生 App
- 不引入真实 push SDK / provider
- 不引入真实长时间等待或后台常驻进程
- 不做认证/token/bootstrap 流程

## Chosen Approach

复用现有 `scripts/run-m6-mobile-capture-adb-e2e.mjs`，增加一个**cadenced scenario 模式**，而不是新建第二个 runner。

推荐结构：

- 保留当前默认 one-shot 流程，避免破坏已有 M6 证据
- 新增 `--scenario cadenced` 或等价开关
- 将阶段定义与 payload 模板抽到独立 helper，避免继续膨胀主 runner

理由：

- 当前 runner 已具备真机 preflight、临时 Gateway、LAN 访问、JSON/Markdown 报告
- 下一阶段重点是流程编排和报告扩展，不是运行框架重写
- 主 runner 目前已较长，新增阶段化逻辑时应顺带抽出 phase builder，降低后续维护成本

## Phase Model

### Phase A: baseline

写入一轮初始数据：

- `POST /devices/heartbeat`
- `POST /emotion/assessments`
- `POST /video/assessments`
- `POST /health/snapshots`

读取：

- `GET /health/latest`
- `GET /dashboard/summary`
- `GET /client/inbox/overview`

目标：

- 建立初始最新 health snapshot
- 记录基线 inbox / dashboard / recovery 状态

### Phase B: stress build-up

连续执行 2–3 轮更差的数据：

- 更高 `stressScore`
- 更低 `focusScore`
- 更差 `sleepMinutes` / 更高 `heartRate`

每轮后都读取：

- `GET /health/latest`
- `GET /dashboard/summary`
- `GET /client/inbox/overview`

目标：

- 证明最新 snapshot 会被后续轮次推进
- 证明风险/消息摘要在连续输入下保持可读

### Phase C: recovery trigger

调用：

- `POST /recovery/plan`
- `GET /recovery/history`
- `GET /dashboard/summary`
- `GET /client/inbox/overview`

目标：

- 生成 recovery plan
- 在 history / dashboard / inbox overview 中看到同一 `latestRecoveryPlan`

### Phase D: post-recovery sample

再打一轮略微恢复的数据：

- 较低 `stressScore`
- 略高 `focusScore`
- 较好 `heartRate` / `fatigueScore`

然后读取：

- `GET /health/latest`
- `GET /dashboard/summary`
- `GET /client/inbox/overview`
- 必要时 `GET /client/inbox` + `POST /client/inbox/:messageId/ack`

目标：

- 证明 recovery 之后仍可继续采样
- 证明读模型不分裂
- 不强制要求风险等级一定下降，只要求 latest IDs 与时序继续推进

## Success Criteria

整体成功要求：

- 所有关键 endpoint 都返回 `2xx`
- 至少产生 4 个阶段摘要：
  - `baseline`
  - `stress-build-up`
  - `recovery-trigger`
  - `post-recovery`
- `latestHealth` 在后续阶段持续推进
- `latestRecoveryPlan` 在 recovery 阶段创建后，后续阶段仍可读到同一 plan
- post-recovery 样本被系统接受，且 dashboard / inbox overview / recovery history 不分裂

新增顶层 summary 字段：

- `phaseCount`
- `phaseResults`
- `latestHealthProgressed`
- `recoveryPlanPersistedAcrossPhases`
- `postRecoverySamplingAccepted`

## Failure Semantics

以下任一情况视为整体失败：

- 任一关键 endpoint 非 `2xx`
- 任一阶段没有产出可用摘要
- `latestHealth` 没有被后续阶段推进
- `recovery/plan` 创建成功，但下游阶段读不到同一 `latestRecoveryPlan`
- post-recovery 样本写入后，`dashboard/summary`、`client/inbox/overview`、`recovery/history` 任一读坏或分裂

## File Structure

建议文件边界如下：

- `scripts/run-m6-mobile-capture-adb-e2e.mjs`
  - CLI 参数解析
  - ADB preflight
  - Gateway 启停
  - scenario orchestration
- `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`
  - 顶层 summary
  - Markdown 渲染
  - cadence phase 摘要渲染
- `scripts/lib/m6-mobile-capture-adb-e2e-scenarios.mjs`
  - one-shot / cadenced scenario 定义
  - phase payload builders
  - phase labels and expected checks

## Test Strategy

### Unit tests

- dry-run 能暴露 `scenario` 和 phase plan
- report summary 能覆盖：
  - cadence 全绿
  - `latestHealthProgressed=false`
  - `recoveryPlanPersistedAcrossPhases=false`
  - `postRecoverySamplingAccepted=false`

### Real-device verification

- `corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced`
- `corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced`

## Result

这一阶段完成后，`M6` 会从“单次闭环”提升到“带时间演进的真机采样闭环”，为下一步客户端 bootstrap/token/polling 和更真实 Android 客户端行为打基础。
