# M6 Authenticated Client Session Loop Design

## Context

- 当前 `M6` 已完成：
  - 真机移动采集闭环
  - Inbox 拉取与 `ack`
  - Recovery plan 闭环
  - `cadenced` 多阶段采样与 recovery 持续性验证
- 当前仍缺少的是**更像真实客户端的会话层**：
  - 现有真机 runner 主要验证写入和读模型
  - 但尚未通过真实本地账号 + 真实 `accessToken` 走完客户端读取链路

## Goal

在现有真机 `cadenced` 闭环基础上，增加真实客户端认证与会话读取，证明系统可以：

1. 使用固定本地账号完成真实 `login`
2. 首次账号不存在时自动完成一次 `register`
3. 用真实 `Bearer <accessToken>` 访问客户端接口
4. 让 `bootstrap`、`inbox`、`overview`、`ack` 在真实认证上下文下成立

## Non-Goals

- 不实现 refresh token
- 不做 token 续期
- 不做 Android 本地 token 持久化
- 不做原生 Android UI
- 不引入新的客户端业务 API

## Chosen Approach

复用现有 `scripts/run-m6-mobile-capture-adb-e2e.mjs`，在 `cadenced` 场景上增加一个显式开关，例如：

- `--with-client-session`

而不是新建一个单独 runner。

认证策略固定为：

- 使用固定邮箱/密码
- 优先 `POST /auth/login`
- 失败时自动 `POST /auth/register` 一次
- 注册后再次 `POST /auth/login`
- 拿到 `accessToken` 后，后续客户端读取统一走 `Authorization: Bearer <token>`

推荐原因：

- 现有 `cadenced` 已经有最强的数据层证据
- 下一块只是在此基础上增加“真实客户端身份”
- 用 feature flag 比拆出第二 runner 更容易保持证据集中

## Data Flow

### Phase 1: Existing cadenced data flow

保持现有 `cadenced` 场景不变：

- baseline
- stress-build-up
- recovery-trigger
- post-recovery

确保在进入客户端会话之前，已经存在：

- health snapshot
- inbox message
- latest recovery plan

### Phase 2: Authenticated client session

1. `POST /auth/login`
2. 如果登录失败且账号不存在，再：
   - `POST /auth/register`
   - `POST /auth/login`
3. 使用真实 token 请求：
   - `GET /me`
   - `GET /client/bootstrap`
   - `GET /client/inbox`
   - 如有 pending message，`POST /client/inbox/:messageId/ack`
   - `GET /client/inbox/overview`
   - 可选再次 `GET /client/bootstrap`

## Success Criteria

整体成功要求：

- 真实认证成功：
  - `authLoggedIn=true`
  - 首次不存在时允许 `authRegistered=true`
- `GET /me` 成功且用户与固定账号一致
- `GET /client/bootstrap` 成功，返回：
  - `me`
  - `dashboard`
  - `inboxOverview`
  - `goalFlow`
  - `permissions`
- `GET /client/inbox` 成功
- 如果执行 `ack`：
  - `client/inbox/overview` 或 `client/bootstrap.inboxOverview` 反映 `acknowledged`

新增 summary 字段：

- `authMode`
- `authRegistered`
- `authLoggedIn`
- `clientMeOk`
- `clientBootstrapOk`
- `clientInboxOk`
- `clientAckReflected`

## Failure Semantics

以下任一情况视为整体失败：

- 登录失败，且自动注册后仍无法登录
- `accessToken` 为空
- `GET /me` 非 `2xx` 或返回用户不匹配
- `GET /client/bootstrap` 非 `2xx`
- `GET /client/inbox` 非 `2xx`
- 执行 `ack` 后，`bootstrap` 或 `overview` 未反映 `acknowledged`

如果当前没有 pending message：

- 不算失败
- 但报告必须显式写出“未执行 ack，因为本轮无 pending message”

## File Structure

建议边界：

- `scripts/run-m6-mobile-capture-adb-e2e.mjs`
  - 增加 `--with-client-session`
  - 负责认证流程编排
- `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`
  - 增加 client session summary 和 Markdown 渲染
- `scripts/lib/m6-mobile-capture-adb-e2e-scenarios.mjs`
  - 保持只负责采样 phase，不承载认证逻辑

## Test Strategy

### Unit tests

- dry-run 暴露 `withClientSession`
- report summary 覆盖：
  - 登录成功
  - 注册后登录成功
  - bootstrap 失败
  - ack 未反映

### Real-device verification

- `corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced --with-client-session`
- `corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-session`

## Result

这一阶段完成后，`M6` 将从“数据与读模型闭环”提升到“真实认证客户端会话闭环”，为后续 Android 真实客户端、token 持久化和更接近产品态的 polling 链路打基础。
