# Conversation Handoff 2026-04-24

这份文件用于把当前对话中的开发进展、关键结论、产物路径、以及下一步建议完整迁移到一个新对话中继续推进。

## 1. 当前仓库与运行态

- canonical workspace:
  - `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor`
- 当前 shell 入口虽然可能显示为 `/Users/claw/mindanchor`，但实际物理路径以上面的 canonical path 为准
- 当前时间点：
  - `2026-04-24`
- 当前 runtime 状态：
  - `corepack pnpm status:openclaw-runtime-lan` 显示 `STATUS=running`
  - `OPENCLAW_BASE_URL=http://192.168.0.104:8800`
  - `OPENCLAW_HEALTH_URL=http://127.0.0.1:8800/health`
- 当前 runtime health：
  - `corepack pnpm health:openclaw-runtime-lan` 返回 `ok=true`
- 当前没有残留的临时 `3011` Gateway：
  - `lsof -ti tcp:3011` 返回空

## 2. 当前阶段结论

- 主线仍是：
  - `M4 已完成`
  - `M5 已完成（当前单用户自部署范围）`
- 现在已经收口到 `M5 production runtime` 的后半段，重点是：
  - `execute` 结构稳定性
  - 7 个核心 agent 的返回结构一致性
  - session lock / transport fallback 的失稳证据、repro、诊断、留档

## 3. 本轮对话中已完成的关键工作

### 3.1 execute / 合同稳定性

- 收掉了 `cluster success=true` 但 payload 漂移的误判问题
- `probe` 成功载荷强制收敛到显式合同 `{ probe: "ok" }`
- 对 7 个核心 agent 的 cluster 原始 payload 契约信号做了统一校验
- adapter 增加了结构化 `failureCategory`

对应关键文件：

- `apps/api/src/lib/model-bridge.ts`
- `apps/api/src/lib/agent-contracts.ts`
- `packages/domain/src/index.ts`
- `apps/api/tests/model-bridge.test.ts`
- `apps/api/tests/api.integration.test.ts`

### 3.2 phased / smoke / runner 收口

- 修复了 `test:core-phases:local` 和 `test:core-phases:real:aligned` 的参数透传问题
- 新增并跑通 `runtime-contracts` segment
- 本地与 real-aligned 的 `runtime-contracts` 都已跑通

关键文件：

- `scripts/run-core-phase-entry.mjs`
- `scripts/run-core-phase-tests.mjs`
- `scripts/run-core-phase-tests-real-aligned.mjs`
- `scripts/lib/core-phase-segments.mjs`

### 3.3 session lock / transport fallback 收口

- 已补 `session file locked` 的同 endpoint 短重试
- 已补瞬时 transport `fetch failed` 的同 endpoint 短重试
- 两类 deterministic repro 已补齐：
  - `repro:openclaw:session-lock-recovery`
  - `repro:openclaw:transport-fallback`

关键文件：

- `apps/api/src/lib/openclaw-cluster-client.ts`
- `scripts/repro-openclaw-session-lock-recovery.mjs`
- `scripts/repro-openclaw-transport-fallback.mjs`
- `scripts/__tests__/repro-openclaw-session-lock-recovery.test.mjs`
- `scripts/__tests__/repro-openclaw-transport-fallback.test.mjs`

### 3.4 provider drift / phased aligned guardrail

- shell 默认 `MINDANCHOR_DEFAULT_MODEL_*` 和 OpenClaw profile 漂移时，`real:aligned` 现在会明确打印 warning
- warning 不阻断 aligned runner
- 真实 `real:aligned` 已复跑通过
- 后续又补了统一执行入口：
  - `corepack pnpm with:openclaw-real-env -- -- <command>`
  - 用于手工 provider-direct 对比时从 OpenClaw profile 注入对齐后的 `MINDANCHOR_DEFAULT_MODEL_*`
  - `--dry-run` 只输出非密钥摘要，不泄露 provider token

关键文件：

- `scripts/lib/core-phase-provider-config-drift.mjs`
- `scripts/run-core-phase-tests-real-aligned.mjs`
- `scripts/with-openclaw-real-env.mjs`
- `scripts/__tests__/core-phase-provider-config-drift.test.mjs`
- `scripts/__tests__/with-openclaw-real-env-entry.test.mjs`

### 3.5 真实 runtime 恢复与当前机器验证

- 当前机器已完成：
  - runtime 停机后恢复
  - `health`
  - direct `POST /v1/tasks/execute`
  - Gateway `cluster-preferred`
  - `smoke:cluster`
- 当前机器恢复模拟已通过，但第二台机器独立复跑仍被跳过

关键文档：

- `docs/openclaw-production-runtime-manual-verification-2026-04-21.md`
- `docs/openclaw-production-runtime-deployment.md`
- `docs/m5-production-runtime-completion-checklist.md`

### 3.6 transport 诊断 / 报告 / 对比 / 一键调查链

这条线是当前对话中最后补齐的工具链。

已完成的 4 个入口：

- `corepack pnpm diagnose:openclaw-runtime-transport-lan`
  - 一次输出 runtime files、health、adapter、clusterAttemptSummary
- `corepack pnpm report:openclaw-runtime-transport-lan`
  - 把当前采样写成 `json + md`
- `corepack pnpm compare:openclaw-runtime-transport`
  - 把健康基线和异常现场自动对比成 `driftCodes + markdown`
- `corepack pnpm investigate:openclaw-runtime-transport`
  - 一键串联 `incident report + compare`

新增/关键文件：

- `scripts/diagnose-openclaw-runtime-transport-lan.mjs`
- `scripts/report-openclaw-runtime-transport-lan.mjs`
- `scripts/compare-openclaw-runtime-transport-reports.mjs`
- `scripts/investigate-openclaw-runtime-transport-lan.mjs`
- `scripts/lib/openclaw-runtime-transport-report.mjs`
- `scripts/lib/openclaw-runtime-transport-compare-report.mjs`
- `scripts/__tests__/diagnose-openclaw-runtime-transport-lan.test.mjs`
- `scripts/__tests__/openclaw-runtime-transport-report.test.mjs`
- `scripts/__tests__/openclaw-runtime-transport-compare-report.test.mjs`
- `scripts/__tests__/openclaw-runtime-transport-investigate-entry.test.mjs`

### 3.7 P0 短时稳定性观察

本轮后续新增了短时稳定性观察入口：

- `corepack pnpm observe:openclaw-runtime-stability`
  - 默认 12 轮、每轮 60 秒
  - 自动启动临时 Gateway
  - 每轮顺序触发 7 个核心 agent
  - 聚合 `route` / `selectedEndpoint` / `fallbackReason` / `failureCategory`
  - 输出 `json + md`

正式 12 轮产物：

- `test-results/openclaw-runtime-stability-2026-04-24T13-51-02-899Z.json`
- `test-results/openclaw-runtime-stability-2026-04-24T13-51-02-899Z.md`

核心结论：

- `roundsPlanned=12`
- `roundsCompleted=12`
- `clusterRouteCount=84`
- `providerFallbackCount=0`
- `failedCount=0`
- `nonClusterCount=0`
- `passed=true`

关键文件：

- `scripts/observe-openclaw-runtime-stability.mjs`
- `scripts/lib/openclaw-runtime-stability-report.mjs`
- `scripts/__tests__/openclaw-runtime-stability-report.test.mjs`
- `scripts/__tests__/openclaw-runtime-stability-entry.test.mjs`

### 3.8 Android 第二客户端 LAN 验收

由于当前没有第二台可部署 runtime 的机器，本轮使用已连接安卓手机作为第二客户端补强 LAN 外部访问证据。

报告：

- `docs/openclaw-production-runtime-android-lan-verification-2026-04-24.md`

设备与网络：

- 设备：`NX733J`
- Android：`15`
- 手机 Wi-Fi：`192.168.0.100/24`
- Runtime：`http://192.168.0.104:8800`

验证结果：

- 手机侧 `/health` HTTP `200`，`ok=true`
- 手机侧 direct `/v1/tasks/execute` HTTP `200`
- `success=true`
- `metadata.worker=chief-agent-worker`
- `parsed={"probe":"ok"}`

注意：这只证明第二客户端 LAN 可达性，不替代第二台机器从零部署 runtime。

### 3.9 M5 证据索引

新增总索引：

- `docs/m5-production-runtime-evidence-index-2026-04-24.md`

用途：

- 汇总当前 M5 已有证据
- 列出可复跑入口
- 指向关键报告路径
- 明确 P1 跨机器 / 远端单节点从零部署 runtime 已因无第二台 runtime host 被本轮显式豁免

## 4. 当前关键验证结论

### 4.1 通过的验证

- `corepack pnpm --filter @mindanchor/api test`
  - 已通过
- `corepack pnpm test:core-phases:real:aligned -- --phases cluster-preferred --segments runtime-contracts`
  - 已通过
- `corepack pnpm observe:openclaw-runtime-stability`
  - 已通过，12 轮、84 次 cluster route、0 fallback
- `corepack pnpm with:openclaw-real-env -- --dry-run -- node -e 'console.log(process.env.MINDANCHOR_DEFAULT_MODEL_NAME)'`
  - 已通过，能从 OpenClaw profile 输出非密钥 env 摘要
- `node --test scripts/__tests__/repro-openclaw-transport-fallback.test.mjs`
  - 已通过
- `node --test scripts/__tests__/diagnose-openclaw-runtime-transport-lan.test.mjs`
  - 已通过
- `node --test scripts/__tests__/openclaw-runtime-transport-report.test.mjs`
  - 已通过
- `node --test scripts/__tests__/openclaw-runtime-transport-compare-report.test.mjs`
  - 已通过
- `node --test scripts/__tests__/openclaw-runtime-transport-investigate-entry.test.mjs`
  - 已通过
- `node --test scripts/__tests__/openclaw-runtime-stability-report.test.mjs scripts/__tests__/openclaw-runtime-stability-entry.test.mjs`
  - 已通过
- `node --test scripts/__tests__/with-openclaw-real-env-entry.test.mjs scripts/__tests__/core-phase-provider-config-drift.test.mjs`
  - 已通过

### 4.2 当前剩余问题不是这些

下面这些曾经是问题，但当前已不再是主阻塞：

- `state-read-model-refresh` 的 2 个失败
  - 已修复并全绿
- `real:aligned` provider auth 401
  - 当前已复跑通过

## 5. 重要留档与基线产物

### 5.1 健康 transport 基线

- 健康基线报告：
  - `test-results/openclaw-runtime-transport-2026-04-22T09-19-21Z.json`
  - `test-results/openclaw-runtime-transport-2026-04-22T09-19-21Z.md`

这份基线的核心状态：

- runtime `running`
- loopback / LAN health 都是 `200`
- adapter `httpStatus=200`
- `executionStrategy=cluster-preferred`
- `route=cluster`
- `selectedEndpoint=cluster:/v1/tasks/execute`
- `issues=[]`

### 5.2 一次“未带可用 MINDANCHOR_API_URL”的 compare 样例

- `tmp/openclaw-runtime-transport-report.json`
- `tmp/openclaw-runtime-transport-report.md`
- `tmp/openclaw-runtime-transport-compare-real.json`
- `tmp/openclaw-runtime-transport-compare-real.md`

这组产物很有用，因为它展示了一个典型非 transport 问题：

- runtime 健康面正常
- 但 adapter 采样失败
- compare 提炼出：
  - `adapter_http_status_changed`
  - `adapter_route_changed`
  - `selected_endpoint_changed`
  - `issue_codes_changed`

说明当前工具链已经能区分：

- 健康面变化
- adapter 面变化
- 真正 transport/fallback 变化

### 5.3 investigate 一键产物样例

- `tmp/investigate-real/openclaw-runtime-transport-incident-2026-04-23T01-25-00Z.json`
- `tmp/investigate-real/openclaw-runtime-transport-incident-2026-04-23T01-25-00Z.md`
- `tmp/investigate-real/openclaw-runtime-transport-compare-2026-04-23T01-25-00Z.json`
- `tmp/investigate-real/openclaw-runtime-transport-compare-2026-04-23T01-25-00Z.md`

以及一轮重新验证：

- `tmp/investigate-recheck/openclaw-runtime-transport-incident-2026-04-23T02-10-00Z.json`
- `tmp/investigate-recheck/openclaw-runtime-transport-incident-2026-04-23T02-10-00Z.md`
- `tmp/investigate-recheck/openclaw-runtime-transport-compare-2026-04-23T02-10-00Z.json`
- `tmp/investigate-recheck/openclaw-runtime-transport-compare-2026-04-23T02-10-00Z.md`

## 6. 当前文档状态

已对齐的主文档：

- `tasks.md`
- `docs/m5-production-runtime-completion-checklist.md`
- `docs/m5-production-runtime-evidence-index-2026-04-24.md`
- `docs/development-handoff-2026-03-07.md`
- `docs/openclaw-production-runtime-ops-guide.md`
- `docs/openclaw-production-runtime-smoke-report-2026-04-22.md`
- `docs/openclaw-production-runtime-smoke-report-2026-04-24.md`
- `docs/openclaw-production-runtime-android-lan-verification-2026-04-24.md`

当前这些文档的一致结论是：

- `M4 已完成`
- `M5 已完成（当前单用户自部署范围）`
- 当前机器 runtime 基线可用
- 第二台机器独立复跑当前无设备，本轮已按用户决策显式豁免
- transport / session / fallback 的工具链已经补齐
- P0 短时稳定性观察已通过
- provider drift 已有统一 wrapper 入口收口
- Android 第二客户端 LAN 可达性已通过，但不能替代第二台 runtime host

## 7. 当前 post-M5 项

### 7.1 本轮豁免 / accepted risk

- 第二台机器独立复跑未实测，但本轮已显式豁免；这不是实测通过
- transport 类 `provider-fallback` 已有当前机器 12 轮短时稳定性观察证据，但还没有第二台 runtime host 上的长期证据
- 当前 shell 默认 `MINDANCHOR_DEFAULT_MODEL_*` 仍可作为 drift 诊断来源
  - 手工对齐执行已通过 `corepack pnpm with:openclaw-real-env -- -- <command>` 收口

### 7.2 当前最值得继续做的方向

当前 M5 已在豁免后的范围内完成。后续属于 post-M5 补测 / 观察。

没有第二台 runtime host 时，可做的低风险工作：

- 继续按需跑更长时间 `observe:openclaw-runtime-stability`
- 保持 `docs/m5-production-runtime-evidence-index-2026-04-24.md` 作为证据入口
- 若 real-lan 真异常，再用 investigate/report/compare 抓现场
- 有第二台 runtime host 后，补做跨机器从零部署实测
- 按需继续跑更长时间 stability observe

推荐顺序：

1. 当 real-lan 真的再次出现异常时，立刻执行：

```bash
corepack pnpm investigate:openclaw-runtime-transport \
  --baseline test-results/openclaw-runtime-transport-2026-04-22T09-19-21Z.json \
  --out-dir test-results/investigate-incident-$(date -u +%Y-%m-%dT%H-%M-%SZ)
```

2. 看 compare 结果里的 `driftCodes`

3. 根据 driftCodes 走分支：

- 如果是 `adapter_unreachable`
  - 优先排 Gateway / `MINDANCHOR_API_URL`
- 如果是 `lan_health_failed`
  - 优先排 LAN 可达性
- 如果是 `cluster_transport_error`
  - 再回到 runtime transport 方向深挖
- 如果出现 `clusterAttemptSummary.allErrorsFetchFailed=true`
  - 可直接对应历史 `.logs/api-real-lan.log` 的“三个 endpoint 全部 fetch failed”模式

## 8. 新对话建议起手式

建议在新对话里直接给下面这段：

```md
请先阅读并以此为唯一 handoff 基线继续工作：

/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/docs/conversation-handoff-2026-04-24.md

当前重点不是再补工具，而是在 real-lan 真出异常时，用现有 investigate/report/compare 工具链抓一份异常现场，并和健康基线对比。
```

## 9. 这份 handoff 的目的

它不是通用项目介绍，而是：

- 当前对话的完整进展导出
- 当前代码与文档状态的同步快照
- 新对话继续推进时的最低上下文成本入口
