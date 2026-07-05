# M6 Session Recovery Loop Design

## Context

M6 已经完成真实 Android 设备采集、recovery、cadenced sampling、真实本地账号认证，以及固定时长 client polling。当前后端本地账号登录返回 `accessToken`，`refreshToken` 仍为 `null`，没有 refresh token 端点。

因此本阶段不伪造 refresh token 语义，先验证更基础但实际可用的客户端恢复能力：客户端把 access token 持久化后，模拟重启并用重新加载的 token 恢复 `/me`、`/client/bootstrap`、`/client/inbox` 与 `/client/inbox/overview`。

## Goal

增加可选 `--with-session-recovery` 子流程，证明：

- 真实本地账号 access token 可被客户端持久化
- 从持久化文件重新加载 token 后，认证上下文仍可用
- 恢复后的 `/me` 与原认证用户一致
- 恢复后的 `bootstrap`、`inbox`、`overview` 持续可读
- 不在报告中泄露 token 明文

## Non-Goals

- 不新增 refresh token
- 不新增 logout/revoke
- 不实现 Android 安全存储
- 不做原生 Android App
- 不改变现有 auth API schema

## Chosen Approach

复用 `scripts/run-m6-mobile-capture-adb-e2e.mjs`，新增：

```bash
--with-session-recovery
```

该开关自动启用 `--with-client-session`。实际真机推荐命令：

```bash
corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-polling --with-session-recovery
```

流程：

1. 登录并取得 access token
2. 将 `{ accessToken, email, userId, savedAt }` 写入 Android `/data/local/tmp`
3. 在主链路和 polling 后，读取该文件
4. 用读回 token 重新请求：
   - `GET /me`
   - `GET /client/bootstrap`
   - `GET /client/inbox`
   - `GET /client/inbox/overview`
5. 删除 Android 临时 token 文件

## Success Criteria

启用 recovery 时，整体成功要求：

- `sessionRecoveryTokenPersisted=true`
- `sessionRecoveryTokenReloaded=true`
- `sessionRecoveryMeOk=true`
- `sessionRecoveryBootstrapOk=true`
- `sessionRecoveryInboxOk=true`
- `sessionRecoveryOverviewOk=true`
- `sessionRecoveryUserStable=true`

## Test Strategy

单测：

- dry-run 暴露 `withSessionRecovery` 与 recovery plan
- report summary 覆盖 recovery 全绿
- report summary 覆盖 token 未加载失败
- report summary 覆盖恢复用户不一致失败

真机：

```bash
corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced --with-client-polling --with-session-recovery
corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-polling --with-session-recovery
```
