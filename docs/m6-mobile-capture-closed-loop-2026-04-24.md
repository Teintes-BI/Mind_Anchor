# M6 Mobile Capture + Recovery + Refresh Token Recovery Closed Loop（2026-04-24，更新于 2026-04-25）

## 1. 阶段定义

- 阶段：`M6 — Refresh Token Recovery Loop`
- 目标：
  - 用真实 Android 设备作为移动客户端
  - 通过 ADB + 手机侧 `curl` 向 Gateway 上报移动采集数据
  - 验证这些数据进入 `health/latest`、`dashboard/summary`、`client/inbox/overview`
  - 验证固定本地账号可走真实 `auth/register|login -> Bearer accessToken -> /me -> /client/bootstrap -> /client/inbox -> ack`
  - 验证固定时长内持续 polling `/client/bootstrap`、`/client/inbox`、`/client/inbox/overview`
  - 验证 access token 可在 Android 临时存储中持久化、重载，并恢复客户端会话
  - 验证 refresh token 可在 Android 临时存储中持久化、重载，通过 `/auth/refresh` 轮换会话
  - 验证旧 refresh token 轮换后不可复用，`/auth/logout` 后 refresh token 被撤销
  - 验证手机侧可以拉取 Inbox 并完成 `ack`，且 read model 反映该状态
  - 验证可以生成恢复计划，并在 `recovery/history`、`dashboard/summary`、`client/inbox/overview` 上保持一致
  - 验证多阶段移动采样会持续推进 `latestHealth`，并在 recovery 之后继续接受样本
- 不做：
  - Android 原生 App
  - 真实 push SDK / 系统通知集成
  - 新增移动采集业务 API 或修改移动采集存储结构

## 2. 第一版闭环范围

第一版覆盖以下写入与读取链路：

- 写入：
  - `/mobile/devices/register`
  - `/devices/register`
  - `/devices/heartbeat`
  - `/mobile/capture/sessions/start`
  - `/mobile/call-events`
  - `/emotion/assessments`
  - `/media/upload-sessions`
  - `/media/upload-sessions/:sessionId/parts`
  - `/media/upload-sessions/:sessionId/complete`
  - `/video/assessments`
  - `/health/snapshots`
  - `/mobile/capture/sessions/end`
  - `/recovery/plan`
- 读取：
  - `/recovery/history`
  - `/health/latest`
  - `/me`
  - `/client/inbox`
  - `/client/inbox/:messageId/ack`
  - `/client/bootstrap`
  - `/auth/refresh`
  - `/auth/logout`
  - `/dashboard/summary`
  - `/client/inbox/overview`

## 3. 当前实现状态

- 已完成：
  - 新增真机 e2e runner：`corepack pnpm e2e:m6-mobile-capture-adb`
  - 支持 `--scenario one-shot|cadenced`
  - 支持 `--with-client-session`
  - 支持 `--with-client-polling`
  - 支持 `--with-session-recovery`
  - 支持 `--with-refresh-token-recovery`
  - 本地账号已支持 refresh token 签发、轮换、旧 token 拒绝复用，以及 logout/revoke
  - dry-run 可用
  - 单测已覆盖 report summary 与 entry dry-run
  - 真机 ADB 闭环已跑通
  - 正式报告已产出：
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-24T15-58-54-055Z.json`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-24T15-58-54-055Z.md`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-24T16-49-03-278Z.json`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-24T16-49-03-278Z.md`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-24T17-27-34-830Z.json`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-24T17-27-34-830Z.md`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-25T13-52-24-921Z.json`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-25T13-52-24-921Z.md`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-25T14-25-52-052Z.json`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-25T14-25-52-052Z.md`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-25T14-36-20-228Z.json`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-25T14-36-20-228Z.md`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-25T14-55-21-510Z.json`
    - `test-results/m6-mobile-capture-adb-e2e-2026-04-25T14-55-21-510Z.md`

## 4. 真机验收结果（2026-04-25）

- 设备：
  - serial：`320146882257`
  - model：`NX733J`
  - Android：`15`
  - Wi-Fi：`192.168.0.100`
- Gateway LAN URL：`http://192.168.0.104:3011`
- Runtime LAN URL：`http://192.168.0.104:8800`
- preflight：
  - `adbDeviceConnected=true`
  - `wifiIpDetected=true`
  - `curlAvailable=true`
  - `gatewayLanHealthOk=true`
- 总体结果：
  - `passed=true`
  - `totalSteps=79`（最新 `cadenced + client-session + client-polling + session-recovery + refresh-token-recovery` 场景）
  - `failedSteps=0`
  - `healthLatestReflectsDevice=true`
  - `dashboardReflectsDevice=true`
  - `inboxOverviewOk=true`
  - `inboxAckReflected=true`
  - `recoveryPlanCreated=true`
  - `recoveryHistoryReflectsPlan=true`
  - `recoveryInboxConsistent=true`
  - `recoveryDashboardConsistent=true`
  - `phaseCount=5`
  - `latestHealthProgressed=true`
  - `recoveryPlanPersistedAcrossPhases=true`
  - `postRecoverySamplingAccepted=true`
  - `authMode=local-account`
  - `authRegistered=true`
  - `authLoggedIn=true`
  - `clientMeOk=true`
  - `clientBootstrapOk=true`
  - `clientInboxOk=true`
  - `clientAckReflected=true`
  - `clientPollingEnabled=true`
  - `clientPollingDurationMs=30000`
  - `clientPollingIntervalMs=5000`
  - `clientPollingPollCount=6`
  - `clientPollingCompleted=true`
  - `clientPollingAllOk=true`
  - `clientPollingBootstrapStable=true`
  - `clientPollingInboxReadable=true`
  - `clientPollingAckStatusStable=true`
  - `sessionRecoveryEnabled=true`
  - `sessionRecoveryTokenPersisted=true`
  - `sessionRecoveryTokenReloaded=true`
  - `sessionRecoveryMeOk=true`
  - `sessionRecoveryBootstrapOk=true`
  - `sessionRecoveryInboxOk=true`
  - `sessionRecoveryOverviewOk=true`
  - `sessionRecoveryUserStable=true`
  - `refreshTokenRecoveryEnabled=true`
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

关键 response IDs：

- `authUserId=da703a1f-8d1b-422a-8b76-d267c6aef9a6`
- `authEmail=m6-mobile-client@example.com`
- `mobileDeviceId=1b544b96-2cc7-4fe9-83dc-5fe9675d4706`
- `audioSessionId=f9022ab1-a519-4f60-990d-0099731633c5`
- `callEventId=3103a47e-3431-4d53-90a9-271e0921bf4c`
- `emotionAssessmentId=f22f639e-e170-4073-80c0-b7c6614c5bf2`
- `mediaUploadSessionId=354b5dc9-a280-44c0-b3c2-7b6eb06aeaf0`
- `completedMediaStatus=completed`
- `videoAssessmentId=b8ab8dbd-e3aa-45f9-b4f6-45d324378c84`
- `healthSnapshotId=c30b5c07-aa61-4df3-9276-ed481f537535`
- `recoveryPlanId=3bdb493a-5034-4ffc-98cd-51c6b50e9644`
- `recoveryHistoryLatestPlanId=3bdb493a-5034-4ffc-98cd-51c6b50e9644`
- `dashboardLatestRecoveryPlanId=3bdb493a-5034-4ffc-98cd-51c6b50e9644`
- `inboxLatestRecoveryPlanId=3bdb493a-5034-4ffc-98cd-51c6b50e9644`
- `cadencedRecoveryPlanId=47fb3312-060b-4398-8ffc-7812d8832a40`
- `cadencedLatestHealthId=eb4394a3-e4df-4ffa-8919-83bed60bdc7f`
- `inboxAckMessageId=3e966668-df84-4de0-8234-82ed1e54c29e`
- `inboxAckStatus=acknowledged`
- `latestHealthDeviceId=android-m6-capture`
- `dashboardEdgeDeviceCount=1`
- `inboxMessageCount=23`
- `inboxLatestRiskLevel=high`

最新 `client-session` 复跑关键 IDs（`2026-04-25T13-52-24-921Z`）：

- `authUserId=da703a1f-8d1b-422a-8b76-d267c6aef9a6`
- `authEmail=m6-mobile-client@example.com`
- `clientBootstrapUserId=da703a1f-8d1b-422a-8b76-d267c6aef9a6`
- `clientInboxAckMessageId=43630d76-ad7a-4457-bd72-ee463a842374`
- `recoveryPlanId=a940a442-3b90-48d3-939b-2ae08e3a983d`
- `latestHealthId=0dac58be-41e5-454a-b946-9188e874e2e4`
- `inboxAckMessageId=e695df98-b6dc-402f-98f7-1b7b68e9601c`
- `inboxAckStatus=acknowledged`

最新 `client-polling` 复跑关键 IDs（`2026-04-25T14-25-52-052Z`）：

- `authUserId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee`
- `authEmail=m6-mobile-client@example.com`
- `clientBootstrapUserId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee`
- `clientInboxAckMessageId=8f955fce-02d0-4e0c-b92d-07a4a50ebc42`
- `clientPollingPollCount=4`
- `recoveryPlanId=18db0d76-2cbd-49ef-bee8-9bfc46fa646f`
- `latestHealthId=4f7b1953-12a4-43ef-b659-c768d2ee4659`

最新 `session-recovery` 复跑关键 IDs（`2026-04-25T14-36-20-228Z`）：

- `authUserId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea`
- `authEmail=m6-mobile-client@example.com`
- `sessionRecoveryUserId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea`
- `clientBootstrapUserId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea`
- `clientPollingPollCount=6`
- `clientInboxAckMessageId=b98ffa05-dbf4-4c5a-8e02-48080923adff`
- `recoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41`
- `latestHealthId=396295e6-11c0-46bf-9311-7283cfcaa875`

最新 `refresh-token-recovery` 复跑关键 IDs（`2026-04-25T14-55-21-510Z`）：

- `authUserId=2ce24906-0b70-4e32-b039-a3248db27ed6`
- `authEmail=m6-mobile-client@example.com`
- `sessionRecoveryUserId=2ce24906-0b70-4e32-b039-a3248db27ed6`
- `refreshTokenRecoveryUserId=2ce24906-0b70-4e32-b039-a3248db27ed6`
- `refreshTokenRecoveryRecoveredUserId=2ce24906-0b70-4e32-b039-a3248db27ed6`
- `clientBootstrapUserId=2ce24906-0b70-4e32-b039-a3248db27ed6`
- `clientPollingPollCount=6`
- `clientInboxAckMessageId=5ac6f73f-47ad-4d98-9709-70c65a5fcbc0`
- `recoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c`
- `latestHealthId=232f936e-e205-491a-9451-57eb91d08788`
- `oldRefreshTokenRejected=true`
- `refreshTokenLogoutRevoked=true`
- `postLogoutRefreshRejected=true`

cadenced phases：

- `baseline` → `latestHealthId=63288bc7-b74f-40df-907a-151cc1f8bb76`
- `stress-build-up-1` → `latestHealthId=f2726378-b39c-4510-bba5-43601884c9f6`
- `stress-build-up-2` → `latestHealthId=1bb0972f-cb00-4126-93da-2d3d248aa7e8`
- `recovery-trigger` → `latestRecoveryPlanId=47fb3312-060b-4398-8ffc-7812d8832a40`
- `post-recovery` → `latestHealthId=eb4394a3-e4df-4ffa-8919-83bed60bdc7f`

## 5. 已实现入口

命令：

```bash
corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run
corepack pnpm e2e:m6-mobile-capture-adb
corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced
corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced
corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced --with-client-session
corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-session
corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced --with-client-polling
corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-polling
corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced --with-client-polling --with-session-recovery
corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-polling --with-session-recovery
corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced --with-client-polling --with-session-recovery --with-refresh-token-recovery
corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-polling --with-session-recovery --with-refresh-token-recovery
```

代码入口：

- `scripts/run-m6-mobile-capture-adb-e2e.mjs`
- `scripts/lib/m6-mobile-capture-adb-e2e-curl.mjs`
- `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`
- `scripts/lib/m6-mobile-capture-adb-e2e-scenarios.mjs`
- `scripts/__tests__/m6-mobile-capture-adb-e2e-curl.test.mjs`
- `scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`
- `scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`
- `scripts/__tests__/m6-mobile-capture-adb-e2e-scenarios.test.mjs`

## 6. 验收标准

- ADB 设备处于 `device` 状态
- 手机可识别 Wi-Fi IP
- 手机侧存在 `curl`
- 所有移动采集写入 endpoint 返回 `2xx`
- `recovery/plan` 返回 `2xx` 且产出 recovery plan
- `recovery/history` 返回 `2xx` 且能读到本次 recovery plan
- `health/latest` 能反映本次 Android device 的最新 health snapshot
- `client/inbox` 能返回消息，且 `ack` 调用成功
- 固定本地账号可通过真实 `login/register -> accessToken -> /me -> /client/bootstrap -> /client/inbox` 链路
- `client/bootstrap` 与 `client/inbox/overview` 在 `ack` 后能反映真实会话状态
- 启用 `--with-client-polling` 时，固定时长 polling 完成且 `clientPollingPollCount >= 2`
- polling 期间 `clientPollingAllOk=true`、`clientPollingBootstrapStable=true`、`clientPollingInboxReadable=true`
- 如果执行过客户端 `ack`，polling 期间 `clientPollingAckStatusStable=true`
- 启用 `--with-session-recovery` 时，access token 可写入 Android 临时文件、重新加载，并恢复 `/me`、`/client/bootstrap`、`/client/inbox`、`/client/inbox/overview`
- 启用 `--with-refresh-token-recovery` 时，refresh token 可写入 Android 临时文件、重新加载，并通过 `/auth/refresh` 取得新 access token 与新 refresh token
- refresh token 轮换后旧 token 必须被 `/auth/refresh` 拒绝
- `POST /auth/logout` 必须撤销轮换后的 refresh token，logout 后再次 refresh 必须被拒绝
- M6 报告不得包含未脱敏的 `accessToken` / `refreshToken` 明文
- `dashboard/summary` 能反映本次 edge/mobile device 与 latest health snapshot
- `client/inbox/overview` 能返回非空消息并显示 `mobile_push` 渠道计数
- `dashboard/summary` 与 `client/inbox/overview` 都能反映已 `acknowledged` 的 Inbox 消息
- `recovery/history`、`dashboard/summary`、`client/inbox/overview` 都能反映同一 `latestRecoveryPlan`
- `cadenced` 场景下 `phaseCount >= 4`
- `cadenced` 场景下 `latestHealthProgressed=true`
- `cadenced` 场景下 `recoveryPlanPersistedAcrossPhases=true`
- `cadenced` 场景下 `postRecoverySamplingAccepted=true`
- 当前真机 e2e 已满足以上标准

## 7. 下一步

- 在这个闭环基础上设计下一阶段，例如：
  - 从 ADB/curl 过渡到真实 Android 客户端
  - 模拟更长时间的客户端会话与恢复状态迁移
  - 将 refresh token 从 Android 临时文件过渡到真实客户端安全存储
- 设备或 payload 变化后，复跑：

```bash
corepack pnpm e2e:m6-mobile-capture-adb
```
