# Tasks

## 当前时间点

- 日期：`2026-04-26`
- 当前阶段：`M7 — macOS Desktop Model Effect Loop`
- 当前判断：`M4 已完成；M5 已完成；M6 真机移动闭环已暂停扩展；当前优先把桌面端应用与模型效果闭环做硬`

---

## 当前主清单

- 主清单：`docs/m7-desktop-model-effect-loop-2026-04-26.md`
- 上阶段移动闭环：`docs/m6-mobile-capture-closed-loop-2026-04-24.md`
- 上阶段结论：`docs/m5-production-runtime-final-completion-review-2026-04-24.md`
- 规格引用：`docs/spec.md`
- 交接引用：`docs/development-handoff-2026-03-07.md`

---

## 当前服务状态

### 真实 OpenClaw（LAN 暴露）

- LAN Base URL：`以 corepack pnpm status:openclaw-runtime-lan 输出的 ENV_FILE / OPENCLAW_BASE_URL 为准`
- 健康检查：`以 corepack pnpm health:openclaw-runtime-lan 最新结果为准`
- 启动脚本：`corepack pnpm start:openclaw-runtime-lan`
- 停止脚本：`corepack pnpm stop:openclaw-runtime-lan`
- 重启脚本：`corepack pnpm restart:openclaw-runtime-lan`
- 状态脚本：`corepack pnpm status:openclaw-runtime-lan`
- 健康脚本：`corepack pnpm health:openclaw-runtime-lan`
- 配置脚本：`scripts/setup-openclaw-real-profile.sh`
- 正式入口：`openclaw/production-runtime-server.mjs`
- 兼容入口：`openclaw/real-cluster-server.mjs`

### 当前 API / Web 验收栈

- API：`按 phased / smoke / 手工验证当次启动结果为准`
- Web：`按 phased / smoke / 手工验证当次启动结果为准`

### 当前日志 / pid

- OpenClaw pid：默认 `.logs/openclaw-real-lan.pid`
- API pid：`.logs/api-real-lan.pid`
- Web pid：`.logs/web-real-lan.pid`
- OpenClaw log：默认 `.logs/openclaw-real-lan.log`
- API log：`.logs/api-real-lan.log`
- Web log：`.logs/web-real-lan.log`
- 非默认端口或自定义实例名时，先执行 `corepack pnpm status:openclaw-runtime-lan` 查看当前 `FILE_PREFIX` / `LOG_FILE` / `ENV_FILE`

---

## 已完成

### M4 代码迁移

- [x] `GoalFlow overview` 已走 cluster-first
- [x] `Recovery history` 已走 cluster-first
- [x] `behavior conclusion` 已走 cluster-first
- [x] `Inbox notification content` 已走 cluster-first
- [x] `state/latest` 已支持读时 cluster-first refresh
- [x] `state/trends` 已支持读时 cluster-first refresh
- [x] `dashboard/summary` 已支持读时 cluster-first refresh
- [x] `client/inbox/overview` 已支持读时 cluster-first refresh
- [x] `reflections/overview` 已支持读时 cluster-first refresh

### 工程验证

- [x] `corepack pnpm --filter @mindanchor/api test`
- [x] `corepack pnpm --filter @mindanchor/api build`
- [x] 真实 OpenClaw CLI 本地 `--dev --local` 可跑
- [x] 通过 `LAN IP` 方式跑通 `smoke:cluster`
- [x] 结构化真实 runtime `/health` 与 `POST /v1/tasks/execute` 可跑
- [x] canonical 启停脚本 / 状态脚本 / 健康脚本可跑
- [x] `corepack pnpm test:core-phases:local -- --segments runtime-contracts`
- [x] `corepack pnpm test:core-phases:real:aligned -- --phases cluster-preferred --segments runtime-contracts`
- [x] `2026-04-24` 复跑 `@mindanchor/api test` 通过
- [x] `2026-04-24` 复跑 `real:aligned -- --phases cluster-preferred --segments runtime-contracts` 通过
- [x] `2026-04-24` 带 Gateway + probe 的 transport investigate 复查无 drift：`test-results/investigate-recheck-gateway-probed-2026-04-24T08-32-24Z/openclaw-runtime-transport-compare-2026-04-24T08-32-24-984Z.md`
- [x] `2026-04-24` 复跑当前机器 external cluster smoke：`docs/openclaw-production-runtime-smoke-report-2026-04-24.md`
- [x] `2026-04-24` 新增并跑通 `corepack pnpm observe:openclaw-runtime-stability`，12 轮短时稳定性观察通过：`test-results/openclaw-runtime-stability-2026-04-24T13-51-02-899Z.md`
- [x] `2026-04-24` 安卓手机作为第二客户端完成 LAN `/health` 与 direct `/v1/tasks/execute` 验收：`docs/openclaw-production-runtime-android-lan-verification-2026-04-24.md`
- [x] `2026-04-24` 新增 `corepack pnpm with:openclaw-real-env -- <command>`，手工 provider-direct 对比可统一从 OpenClaw profile 注入 `MINDANCHOR_DEFAULT_MODEL_*`
- [x] `2026-04-24` 新增 M5 证据索引：`docs/m5-production-runtime-evidence-index-2026-04-24.md`
- [x] `2026-04-24` 产出 M5 最终完成评审：`docs/m5-production-runtime-final-completion-review-2026-04-24.md`
- 当前注意点：裸跑 `node scripts/diagnose-core-phase-provider-drift.mjs` 仍可用于发现 shell 默认 env 漂移；需要真实对齐执行时，使用 `corepack pnpm with:openclaw-real-env -- <command>` 或 `test:core-phases:real:aligned`

### 人工验收

- [x] `Agent Lab` 已能显示 `strategy · cluster-preferred`
- [x] `Agent Lab` 已能显示真实 `route · cluster`
- [x] `Recovery` 页面已有真实恢复计划内容
- [x] `Reflections` 页面已有真实周报 / 月报内容
- [x] `State Trends` 页面已有真实状态评估与趋势内容
- [x] `Inbox` 页面已有真实消息与渠道统计内容
- [x] `docs/openclaw-production-runtime-manual-verification-2026-03-08.md` 已产出

---

## 当前待完成

### M7 桌面端模型效果闭环

- [x] 明确当前阶段移动端暂缓，桌面端优先
- [x] 新增 `corepack pnpm observe:macos:model-effect`
- [x] 新增 M7 dry-run 与 report 单测
- [x] 新增阶段文档：`docs/m7-desktop-model-effect-loop-2026-04-26.md`
- [x] 复跑 `corepack pnpm test:macos:status-item`
- [x] 复跑 `corepack pnpm test:macos:reminder-e2e`
- [x] 运行 `corepack pnpm observe:macos:model-effect -- --turns 1 --interval-ms 1000 --response-timeout-ms 45000`：`test-results/macos-model-effect-observation-2026-04-25T16-10-06-728Z.md`
- [x] 运行默认 M7 桌面模型效果观察并产出正式报告：`test-results/macos-model-effect-observation-2026-04-25T16-16-11-085Z.md`
- [ ] 基于正式报告和 OpenChronicle 记忆对照决定先改桌面核心逻辑还是恢复移动端扩展

### M7.1 OpenChronicle 旁路验证

- [x] 明确 OpenChronicle 只作为旁路本地记忆层验证，不进入主链
- [x] 新增 `corepack pnpm validate:openchronicle-sidecar`
- [x] 新增 OpenChronicle sidecar dry-run 与 report 单测
- [x] 新增阶段文档：`docs/m7-openchronicle-sidecar-validation-2026-04-26.md`
- [x] 本机默认验证已执行并产出失败报告：`test-results/openchronicle-sidecar-validation-2026-04-25T16-36-38-590Z.md`
- [x] 当前失败原因确认：本机未监听 `127.0.0.1:8742/mcp`
- [x] 本机已安装并启动 OpenChronicle sidecar，安装时使用 `--no-client-config` 避免改写全局 MCP client 配置
- [x] 本机启动 OpenChronicle sidecar 后运行默认验证通过：`test-results/openchronicle-sidecar-validation-2026-04-25T16-45-02-423Z.md`
- [x] 新增 `DesktopMemoryAdapter` 原型：`scripts/lib/desktop-memory-adapter.mjs`
- [x] 新增 adapter 单测：`scripts/__tests__/desktop-memory-adapter.test.mjs`
- [x] 在 M7 模型效果观察中增加“有 OpenChronicle 记忆 / 无记忆”对照
- [x] 跑通短对照：`test-results/macos-model-effect-observation-2026-04-25T16-51-29-813Z.md`
- [x] 跑通 3 场景完整对照：`test-results/macos-model-effect-observation-2026-04-25T16-54-42-892Z.md`
- [x] 补充带回答摘录的可评审对照报告：`test-results/macos-model-effect-observation-2026-04-25T17-06-29-174Z.md`
- [x] 完成工程语义初评：`docs/m7-openchronicle-memory-semantic-review-2026-04-26.md`
- [x] 当前判断：OpenChronicle 旁路技术链路可行，但语义噪声未收口，暂不进入桌面端长期实验
- [ ] 用户主观确认语义评审结论
- [ ] 修正 `DesktopMemoryAdapter` 上下文过滤与 Coach prompt 注入策略

### M6 真机闭环

- [x] 让 Android 设备重新出现在 `adb devices` 的 `device` 状态
- [x] 跑通 `corepack pnpm e2e:m6-mobile-capture-adb`
- [x] 产出 `test-results/m6-mobile-capture-adb-e2e-2026-04-24T15-58-54-055Z.json`
- [x] 产出 `test-results/m6-mobile-capture-adb-e2e-2026-04-24T15-58-54-055Z.md`
- [x] 用真机结果更新 `docs/m6-mobile-capture-closed-loop-2026-04-24.md`
- [x] 扩展真机闭环覆盖 `POST /recovery/plan` 与 `GET /recovery/history`
- [x] `2026-04-25` 跑通移动采集 + Recovery 闭环：`test-results/m6-mobile-capture-adb-e2e-2026-04-24T16-49-03-278Z.md`
- [x] `2026-04-25` 验证 `recoveryPlanCreated=true`、`recoveryHistoryReflectsPlan=true`、`recoveryInboxConsistent=true`、`recoveryDashboardConsistent=true`
- [x] 新增 `--scenario cadenced` 多阶段真机采样模式
- [x] `2026-04-25` 跑通多阶段 cadence：`test-results/m6-mobile-capture-adb-e2e-2026-04-24T17-27-34-830Z.md`
- [x] `2026-04-25` 验证 `phaseCount=5`、`latestHealthProgressed=true`、`recoveryPlanPersistedAcrossPhases=true`、`postRecoverySamplingAccepted=true`
- [x] 新增 `--with-client-session`，固定本地账号走真实 `auth/register|login -> Bearer accessToken -> /me -> /client/bootstrap -> /client/inbox`
- [x] `2026-04-25` 跑通 authenticated client session：`test-results/m6-mobile-capture-adb-e2e-2026-04-25T13-52-24-921Z.md`
- [x] `2026-04-25` 验证 `authMode=local-account`、`authLoggedIn=true`、`clientMeOk=true`、`clientBootstrapOk=true`、`clientInboxOk=true`、`clientAckReflected=true`
- [x] 新增 `--with-client-polling`，默认固定时长 `30000ms`、间隔 `5000ms`，自动启用真实客户端会话
- [x] `2026-04-25` 跑通固定时长 client polling：`test-results/m6-mobile-capture-adb-e2e-2026-04-25T14-25-52-052Z.md`
- [x] `2026-04-25` 验证 `clientPollingCompleted=true`、`clientPollingPollCount=4`、`clientPollingAllOk=true`、`clientPollingBootstrapStable=true`、`clientPollingInboxReadable=true`、`clientPollingAckStatusStable=true`
- [x] 新增 `--with-session-recovery`，将 access token 写入 Android 临时文件、重新加载并恢复客户端会话
- [x] `2026-04-25` 跑通 session recovery：`test-results/m6-mobile-capture-adb-e2e-2026-04-25T14-36-20-228Z.md`
- [x] `2026-04-25` 验证 `sessionRecoveryTokenPersisted=true`、`sessionRecoveryTokenReloaded=true`、`sessionRecoveryMeOk=true`、`sessionRecoveryBootstrapOk=true`、`sessionRecoveryInboxOk=true`、`sessionRecoveryOverviewOk=true`、`sessionRecoveryUserStable=true`
- [x] 新增本地账号 refresh token 签发、`/auth/refresh` 轮换、旧 refresh token 拒绝复用、`/auth/logout` revoke
- [x] 新增 `--with-refresh-token-recovery`，将 refresh token 写入 Android 临时文件、重新加载、轮换、验证旧 token 失败，再 logout 并验证 post-logout refresh 失败
- [x] `2026-04-25` 跑通 refresh token recovery：`test-results/m6-mobile-capture-adb-e2e-2026-04-25T14-55-21-510Z.md`
- [x] `2026-04-25` 验证 `refreshTokenIssued=true`、`refreshTokenPersisted=true`、`refreshTokenReloaded=true`、`refreshTokenRotated=true`、`oldRefreshTokenRejected=true`、`refreshTokenLogoutRevoked=true`、`postLogoutRefreshRejected=true`、`refreshTokenUserStable=true`

### 1. Runtime 能力

- [x] 降低 `openclaw/real-cluster-server.mjs` 的生产核心地位
- [x] 让正式 runtime 稳定承接 `POST /v1/tasks/execute`
- [x] 让 7 个核心 agent 在真实 runtime 下形成可重复稳定验收
- [x] 收口并发 / session lock / 高频 `provider-fallback` 的当前机器短时观察证据
- [x] 让关键业务链路在正常情况下默认走 `cluster`

### 2. 部署 / 运维 / 安全

- [x] 完成单用户跨机器单节点部署验收豁免记录（本轮跳过第二台 runtime host 实测）
- [x] 固化常驻启动、停止、重启、日志、健康检查方案
- [x] 固化 `LAN` Base URL 暴露方案
- [x] 保持 provider 凭据只留在 runtime 机器并完成文档化
- [x] 完成“新机器按文档独立恢复”验证豁免记录（本轮无第二台 runtime host）

### 3. 验收 / 发布材料

- [x] 产出正式 `smoke:cluster` 报告
- [x] 产出正式页面人工验收记录
- [x] 补齐“从零部署”文档
- [x] 补齐“升级 / 回滚 / 日志排查”指南
- [x] 保持 `spec` / handoff / checklist / 报告 结论一致

---

## 下一步优先顺序

### P0

- [x] 先把正式 runtime 的 execute、并发与 agent 稳定性收口
- [x] 明确 `real-cluster-server` 在生产完成态中的降级定位
- [x] 继续观察关键链路是否仍会高频掉到 `provider-fallback`
- [x] 当前已确认一类真实历史失稳证据：`.logs/api-real-lan.log` 多次出现 `cluster request error` / `fallbackReason=fetch failed`，已通过 repro、短重试、investigate 与 stability 观察收口为当前机器非复现
- [x] 已补已知 `session file locked` 的同 endpoint 短重试，避免首次 lock 即直接掉到 `provider-fallback`
- [x] 已补瞬时 transport `fetch failed` 的同 endpoint 短重试，避免单次网络抖动立即切到下一个 endpoint 或 provider fallback
- [x] 已补 `corepack pnpm diagnose:openclaw-runtime-transport-lan`，可一次采样 runtime files、health、adapter 与 clusterAttempts 摘要
- [x] 已生成一份当前机器 transport 现场留档：`test-results/openclaw-runtime-transport-2026-04-22T09-19-21Z.md`
- [x] 已补 `corepack pnpm compare:openclaw-runtime-transport`，可把健康基线和异常现场自动对比成 `driftCodes + markdown`
- [x] 已补 `corepack pnpm investigate:openclaw-runtime-transport`，可一键产出 incident + compare 产物
- [x] `2026-04-24` 已用临时 Gateway 触发 `chief-agent` probe 后复查 transport：`driftCodes=[]`，`route=cluster`，`selectedEndpoint=cluster:/v1/tasks/execute`，`issues=[]`
- [x] `2026-04-24` external smoke 覆盖 direct execute、Gateway health、adapter、chief probe、6 个 debug agent，结果均为 `200` 且 7 个核心 agent 均显示 `route=cluster`
- [x] `2026-04-24` P0 短时稳定性观察覆盖 12 轮 × 7 agent，共 `84` 次 cluster 路由；`providerFallbackCount=0`、`failedCount=0`、`nonClusterCount=0`
- [x] `2026-04-24` 安卓手机 `NX733J / Android 15 / 192.168.0.100` 已通过 Wi-Fi 访问 runtime LAN：`/health` HTTP `200` 且 direct execute HTTP `200`、`success=true`、`parsed.probe=ok`
- [x] 收掉 `state-read-model-refresh` 的 cluster-first provider 残留断言失败
- [x] 复跑通过 `real:aligned` runtime-contracts；当前剩余问题是 shell 默认 provider env drift，不是 phased runner 持续 401
- [x] 新增 `with:openclaw-real-env` 统一执行入口，避免手工 provider-direct 对比继续依赖漂移的 shell 默认 env

### P1

- [x] 完成单用户跨机器单节点部署验收豁免记录（当前无第二台 runtime host，本轮不再阻塞 M5 本机收口）
- [x] 完成安卓手机第二客户端 LAN 可达性验收
- [x] 当前机器已完成一次“停机后恢复 -> health -> direct execute -> Gateway cluster-preferred -> smoke:cluster”的恢复模拟
- [x] 补齐“从零部署”与“恢复”文档
- [x] 固化 Base URL 暴露、日志与健康检查手册

### P2

- [x] 产出正式 `M5` smoke 报告
- [x] 产出 `2026-04-22` 当前机器 smoke 报告
- [x] 产出正式页面人工验收记录
- [x] 补齐升级 / 回滚 / 日志排查指南
- [x] 在 `spec` / handoff / checklist / 报告 中统一当前结论

---

## 关键文件

- `openclaw/production-runtime-server.mjs`
- `openclaw/real-cluster-server.mjs`
- `openclaw/real-runtime/server.mjs`
- `openclaw/real-runtime/registry.mjs`
- `scripts/setup-openclaw-real-profile.sh`
- `scripts/start-openclaw-runtime-lan.sh`
- `scripts/stop-openclaw-runtime-lan.sh`
- `scripts/restart-openclaw-runtime-lan.sh`
- `scripts/status-openclaw-runtime-lan.sh`
- `scripts/health-openclaw-runtime-lan.sh`
- `docs/openclaw-production-runtime-deployment.md`
- `docs/openclaw-production-runtime-ops-guide.md`
- `docs/openclaw-production-runtime-smoke-report-2026-03-08.md`
- `docs/openclaw-production-runtime-manual-verification-2026-03-08.md`
- `.logs/api-real-lan.log`
- `docs/openclaw-cluster-real-smoke-report-2026-03-08.md`
- `docs/m4-cluster-first-completion-checklist.md`
- `docs/m5-production-runtime-completion-checklist.md`

---

## 一句话总结

**M4 已完成；M5 已完成（当前单用户自部署范围）。M6 真机移动闭环已完成阶段性验证并暂停扩展；M7 当前转向 macOS 桌面端模型效果闭环。**
### M6 基础准备

- [x] 明确 M6 第一版范围为 Android 真机移动采集闭环
- [x] 新增 `corepack pnpm e2e:m6-mobile-capture-adb`
- [x] 新增 M6 真机 e2e dry-run 与 report 单测
- [x] 新增阶段文档：`docs/m6-mobile-capture-closed-loop-2026-04-24.md`
- [x] `2026-04-24` 真机跑通 `corepack pnpm e2e:m6-mobile-capture-adb`：`test-results/m6-mobile-capture-adb-e2e-2026-04-24T15-58-54-055Z.md`
- [x] `2026-04-24` 真机闭环已覆盖 Inbox 拉取与 `ack` 反映：`inboxAckStatus=acknowledged`
- [x] `2026-04-25` 真机闭环已扩展为 Recovery 闭环：`recoveryPlanId=3bdb493a-5034-4ffc-98cd-51c6b50e9644` 且 history / dashboard / inbox overview 一致
- [x] `2026-04-25` 真机闭环已扩展为 cadence：5 个 phase 持续推进 latest health，并在 recovery 后继续采样：`recoveryPlanId=47fb3312-060b-4398-8ffc-7812d8832a40`
- [x] `2026-04-25` 真机闭环已扩展为 authenticated client session：固定账号 `m6-mobile-client@example.com` 通过真实 token 跑通 `/me`、`/client/bootstrap`、`/client/inbox`、`ack`、`/client/inbox/overview`
- [x] `2026-04-25` 真机闭环已扩展为固定时长 polling session：30 秒窗口内 4 轮 `/client/bootstrap`、`/client/inbox`、`/client/inbox/overview` 全部通过，ack 状态持续可见
- [x] `2026-04-25` 真机闭环已扩展为 session recovery：access token 在 Android 临时文件中持久化后重新加载，恢复后的 `/me`、`/client/bootstrap`、`/client/inbox`、`/client/inbox/overview` 全部通过且用户一致
- [x] `2026-04-25` 真机闭环已扩展为 refresh token recovery：refresh token 在 Android 临时文件中持久化后重新加载，轮换成功，旧 token 和 logout 后 token 均被拒绝
