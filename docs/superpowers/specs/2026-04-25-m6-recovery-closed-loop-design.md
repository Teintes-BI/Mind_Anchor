# M6 Recovery Closed Loop Design

## Context

- 当前 `M6` 已完成 Android 真机采集闭环：
  - 真机通过 ADB + 手机侧 `curl` 写入移动采集数据
  - `health/latest`、`dashboard/summary`、`client/inbox`、`client/inbox/overview` 已验证
  - `client/inbox/:messageId/ack` 已纳入真机闭环
- 现有 Gateway API 已提供：
  - `POST /recovery/plan`
  - `GET /recovery/history`
- 当前缺口不是新增 API，而是把“采集风险 → 恢复计划 → 客户端读取 → 读模型一致性”串成同一条真机链路。

## Goal

将现有 `M6` 真机 ADB e2e 从“移动采集闭环”扩展为“移动采集 + Recovery 闭环”，证明当前系统可以：

1. 生成恢复计划
2. 从 `recovery/history` 读取本次恢复计划
3. 在 `dashboard/summary` 与 `client/inbox/overview` 上保持读模型一致

## Non-Goals

- 不新增业务 API
- 不修改现有 schema
- 不引入 Android 原生 App
- 不引入真实 push provider
- 不做多轮恢复状态迁移或长时间回放

## Chosen Approach

复用现有 runner `scripts/run-m6-mobile-capture-adb-e2e.mjs`，直接扩展 endpoint plan 和报告逻辑，而不是新建第二个 runner。

理由：

- 现有 runner 已具备 ADB preflight、临时 Gateway、LAN 访问、真机报告输出
- 现有 M6 成功报告和单测可直接延伸
- 新增 Recovery 闭环只是在现有采集上下文之后增加恢复计划和读取验证，不需要新的执行框架

## Data Flow

### Existing mobile capture chain

1. `POST /mobile/devices/register`
2. `POST /devices/register`
3. `POST /devices/heartbeat`
4. `POST /mobile/capture/sessions/start`
5. `POST /mobile/call-events`
6. `POST /emotion/assessments`
7. `POST /media/upload-sessions`
8. `POST /media/upload-sessions/:sessionId/parts`
9. `POST /media/upload-sessions/:sessionId/complete`
10. `POST /video/assessments`
11. `POST /health/snapshots`
12. `POST /mobile/capture/sessions/end`

### Added recovery chain

13. `POST /recovery/plan`
14. `GET /recovery/history`
15. `GET /client/inbox`
16. `POST /client/inbox/:messageId/ack`
17. `GET /dashboard/summary`
18. `GET /client/inbox/overview`

`/recovery/plan` 的输入只使用现有最小 schema：`userId`、`sessionId?`、`taskId?`、`reason`。

## Success Criteria

本次真机 e2e 仅在以下条件全部满足时判定为成功：

- 所有 endpoint 返回 `2xx`
- `POST /recovery/plan` 成功，并产出可跟踪的恢复计划 ID
- `GET /recovery/history` 成功，并能读到本次恢复计划
- `client/inbox/overview` 正常返回，且恢复链路未破坏 Inbox 读模型
- `dashboard/summary` 正常返回，且恢复链路未破坏 Dashboard 读模型

新增报告字段：

- `recoveryPlanCreated`
- `recoveryHistoryReflectsPlan`
- `recoveryInboxConsistent`
- `recoveryDashboardConsistent`
- `recoveryPlanId`

## Failure Semantics

以下任一情况视为整体失败并非 `0` 退出：

- `recovery/plan` 非 `2xx`
- `recovery/history` 非 `2xx`
- 恢复计划创建成功，但 `recovery/history` 未反映该计划
- `dashboard/summary` 或 `client/inbox/overview` 在恢复链路后返回错误
- recovery 相关一致性字段任一为 `false`

## Implementation Scope

### Files to modify

- `scripts/run-m6-mobile-capture-adb-e2e.mjs`
- `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`
- `scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`
- `scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`
- `docs/m6-mobile-capture-closed-loop-2026-04-24.md`
- `tasks.md`

## Test Strategy

### Unit tests

- dry-run endpoint plan 包含：
  - `POST /recovery/plan`
  - `GET /recovery/history`
- report summary：
  - 全绿通过
  - `recoveryPlanCreated=false` 时失败
  - `recoveryHistoryReflectsPlan=false` 时失败
  - recovery endpoint 失败时失败

### Real-device verification

- `corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run`
- `corepack pnpm e2e:m6-mobile-capture-adb`

## Result

这一阶段完成后，`M6` 的当前定义从“Mobile Capture Closed Loop”扩展为“Mobile Capture + Recovery Closed Loop”，为后续更真实采样节奏和更像真实客户端的行为验证打基础。
