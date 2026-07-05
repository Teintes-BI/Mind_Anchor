# M6 Refresh Token Recovery Loop Design

## Context

M6 已完成 Android 真机移动采集、recovery、cadenced sampling、固定本地账号认证、固定时长 polling，以及 access token 临时持久化恢复。上一阶段仍只证明 access token 重载，不能证明长期客户端会话的 refresh / rotate / logout-revoke 语义。

本阶段补齐本地账号 refresh token 能力，并把它纳入 Android 真机 ADB/curl 闭环。

## Goal

- 本地账号登录与注册返回非空 `refreshToken`
- `POST /auth/refresh` 用 refresh token 签发新 access token，并轮换新 refresh token
- 轮换后的旧 refresh token 不能复用
- `POST /auth/logout` 可撤销 refresh token
- logout 后同一 refresh token 再 refresh 必须失败
- Android 真机 runner 可把 refresh token 写入 `/data/local/tmp`、重新加载并完成上述链路
- 报告中不泄露 `accessToken` / `refreshToken` 明文

## Non-Goals

- 不实现 Android 原生安全存储
- 不做真实 Android App
- 不引入第三方 auth provider
- 不改变移动采集业务 API
- 不缩短 access token TTL 来模拟过期

## Chosen Approach

- refresh token 使用高熵随机 opaque token，服务端只保存 SHA-256 hash
- refresh token 默认有效期 30 天
- 注册 / 登录都会创建一个 refresh token 记录
- refresh 成功后创建新 refresh token，并 revoke 当前 refresh token
- logout 按 refresh token hash 找到 active token 并 revoke，保持幂等返回 `{ revoked: boolean }`
- M6 runner 新增：

```bash
--with-refresh-token-recovery
```

该开关自动启用 `--with-client-session`。

推荐真机命令：

```bash
corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-polling --with-session-recovery --with-refresh-token-recovery
```

## Success Criteria

- `refreshTokenIssued=true`
- `refreshTokenPersisted=true`
- `refreshTokenReloaded=true`
- `refreshTokenRotated=true`
- `oldRefreshTokenRejected=true`
- `refreshTokenMeOk=true`
- `refreshTokenBootstrapOk=true`
- `refreshTokenLogoutRevoked=true`
- `postLogoutRefreshRejected=true`
- `refreshTokenUserStable=true`

## Test Strategy

- API integration 覆盖注册/登录返回 refresh token、refresh 轮换、旧 token 拒绝、logout revoke
- runner dry-run 覆盖 `--with-refresh-token-recovery`
- report summary 覆盖 refresh recovery 成功与旧 token 未拒绝失败
- 真机 e2e 覆盖完整 cadenced + polling + access recovery + refresh token recovery
