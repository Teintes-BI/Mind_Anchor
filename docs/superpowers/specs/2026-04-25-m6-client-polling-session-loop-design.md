# M6 Client Polling Session Loop Design

## Context

M6 已经具备 Android 真机移动采集、recovery、cadenced sampling，以及真实本地账号客户端会话。当前客户端会话只做一次 `/me`、`/client/bootstrap`、`/client/inbox`、`ack`、`/client/inbox/overview` 读取。

下一步需要验证更接近真实客户端的持续读取行为：在同一个 access token 下，客户端在固定时长内持续轮询 bootstrap、inbox 和 overview，且状态保持可读、一致、可追踪。

## Goal

增加一个可选的固定时长客户端 polling 子流程，证明：

- 真实 `Bearer <accessToken>` 可以支撑持续客户端读取
- `/client/bootstrap`、`/client/inbox`、`/client/inbox/overview` 在多轮 polling 中持续返回 `2xx`
- `bootstrap.me.user.id` 在轮询期间保持为固定本地账号
- 如果本轮执行过 `ack`，后续 polling 仍能看到 acknowledged 状态

## Non-Goals

- 不实现 refresh token
- 不做后台常驻进程
- 不做 Android 原生 App
- 不引入 websocket 或 push SDK
- 不要求 polling 期间一定产生新消息

## Chosen Approach

在现有 runner 上新增显式开关：

```bash
corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-session --with-client-polling
```

`--with-client-polling` 会自动启用 `--with-client-session` 的语义，因为 polling 依赖真实 access token。

默认参数：

- `clientPollDurationMs=30000`
- `clientPollIntervalMs=5000`

可通过 CLI 或环境变量覆盖：

- `--client-poll-duration-ms`
- `--client-poll-interval-ms`
- `MINDANCHOR_M6_CLIENT_POLL_DURATION_MS`
- `MINDANCHOR_M6_CLIENT_POLL_INTERVAL_MS`

## Data Flow

在 authenticated client session 完成一次 bootstrap/inbox/ack 后，如果启用 polling：

1. 记录 polling startedAt
2. 循环直到固定时长结束
3. 每轮请求：
   - `GET /client/bootstrap`
   - `GET /client/inbox`
   - `GET /client/inbox/overview`
4. 每轮记录：
   - `round`
   - `elapsedMs`
   - `bootstrapOk`
   - `inboxOk`
   - `overviewOk`
   - `bootstrapUserId`
   - `inboxMessageCount`
   - `overviewMessageCount`
   - `acknowledgedMessageVisible`
5. 汇总 polling 结果并写入 JSON / Markdown 报告

## Success Criteria

启用 polling 时，整体成功要求：

- `clientPollingCompleted=true`
- `clientPollingPollCount >= 2`
- `clientPollingAllOk=true`
- `clientPollingBootstrapStable=true`
- `clientPollingInboxReadable=true`
- 如果执行过 client-session ack，则 `clientPollingAckStatusStable=true`

失败时脚本非 0 退出，并在报告中写出 polling 失败样本。

## Test Strategy

单测：

- dry-run 暴露 `withClientPolling` 与默认 duration / interval
- report summary 覆盖 polling 全绿
- report summary 覆盖 polling 某轮 endpoint 失败
- report summary 覆盖 polling 中 ack 状态未保持

真机验证：

```bash
corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced --with-client-session --with-client-polling
corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-session --with-client-polling
```
