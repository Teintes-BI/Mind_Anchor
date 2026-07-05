# M5 Production OpenClaw Runtime Final Completion Review（2026-04-24）

## 1. 最终判定

- 阶段：`M5 — Production OpenClaw Runtime`
- 最终结论：`M5 已完成（当前单用户自部署范围）`
- 判定时间：`2026-04-24`
- 判定依据：
  - 当前机器 production runtime 能稳定承接 `/health` 与 `/v1/tasks/execute`
  - Gateway `cluster-preferred` 路径可稳定命中 `cluster:/v1/tasks/execute`
  - 7 个核心 agent 在真实 runtime 下已有可重复 smoke / contracts / stability 证据
  - session lock 与 transport fallback 的已知高频问题已有 repro、短重试、diagnose/report/compare/investigate 与 12 轮稳定性观察证据
  - provider drift 已有统一执行入口 `with:openclaw-real-env`
  - Android 第二客户端已验证 LAN 外部访问
  - 跨机器 / 远端单节点 runtime host 从零部署实测因当前无第二台可运行 runtime 的机器被本轮显式豁免

## 2. 完成范围

本次 `M5` 完成范围限定为单用户自部署生产版的当前可执行范围：

- 一台长期运行的 OpenClaw production runtime
- 明确 LAN Base URL 暴露
- Gateway / Web / 外部客户端可通过 Base URL 访问 runtime
- 当前机器可完成 smoke、contracts、stability、transport diagnose
- provider 凭据边界与 profile 对齐入口明确
- 运维、部署、回滚、排障文档齐备

不纳入本次完成范围：

- 多租户平台
- 多节点调度
- 团队级权限与审计
- 云厂商级高可用
- 第二台 runtime host 从零部署实测

## 3. 关键证据

### 3.1 Runtime / execute / contracts

- `corepack pnpm --filter @mindanchor/api test`
  - 已通过
- `corepack pnpm test:core-phases:real:aligned -- --phases cluster-preferred --segments runtime-contracts`
  - 已通过
- `corepack pnpm status:openclaw-runtime-lan`
  - 当前 runtime `STATUS=running`
- `corepack pnpm health:openclaw-runtime-lan`
  - 当前 runtime health `ok=true`

### 3.2 Transport investigate

- 报告目录：`test-results/investigate-recheck-gateway-probed-2026-04-24T08-32-24Z/`
- Compare：`test-results/investigate-recheck-gateway-probed-2026-04-24T08-32-24Z/openclaw-runtime-transport-compare-2026-04-24T08-32-24-984Z.md`
- 结论：
  - `driftCodes=[]`
  - `route=cluster`
  - `selectedEndpoint=cluster:/v1/tasks/execute`
  - `issues=[]`

### 3.3 External cluster smoke

- 报告：`docs/openclaw-production-runtime-smoke-report-2026-04-24.md`
- 结论：
  - direct `/v1/tasks/execute` HTTP `200`
  - Gateway `/health` HTTP `200`
  - `/debug/openclaw/adapter` HTTP `200`
  - `chief-agent` probe HTTP `200`
  - 6 个 debug agent HTTP `200`
  - 7 个核心 agent 均显示 `route=cluster`

### 3.4 P0 短时稳定性观察

- 报告：`test-results/openclaw-runtime-stability-2026-04-24T13-51-02-899Z.md`
- 结论：
  - `roundsPlanned=12`
  - `roundsCompleted=12`
  - `clusterRouteCount=84`
  - `providerFallbackCount=0`
  - `failedCount=0`
  - `nonClusterCount=0`
  - `passed=true`

### 3.5 Android 第二客户端 LAN 验收

- 报告：`docs/openclaw-production-runtime-android-lan-verification-2026-04-24.md`
- 结论：
  - Android `NX733J` / Android `15`
  - 手机 Wi-Fi：`192.168.0.100/24`
  - Runtime：`http://192.168.0.104:8800`
  - 手机侧 `/health` HTTP `200`，`ok=true`
  - 手机侧 direct `/v1/tasks/execute` HTTP `200`
  - `success=true`
  - `parsed={"probe":"ok"}`

### 3.6 Provider drift 收口

- 入口：`corepack pnpm with:openclaw-real-env -- -- <command>`
- dry-run：`corepack pnpm with:openclaw-real-env -- --dry-run -- <command>`
- 测试：
  - `node --test scripts/__tests__/with-openclaw-real-env-entry.test.mjs scripts/__tests__/core-phase-provider-config-drift.test.mjs`
- 结论：
  - shell 默认 env 仍可用于 drift 诊断
  - 手工 provider-direct 对比已有统一 profile-aligned 执行入口
  - dry-run 不泄露 provider token

## 4. 豁免项 / accepted risk

### 4.1 跨机器 runtime host 从零部署实测

- 状态：`已豁免`
- 原因：当前没有第二台可运行 OpenClaw runtime 的机器
- 决策：本轮不再将该项作为 M5 当前范围完成阻塞
- 风险：
  - 尚未证明另一台 Mac / Linux / NAS / 云主机可按文档从零部署 runtime
  - 尚未证明 Gateway 从当前机器反向访问第二台 runtime host 的完整恢复链路
- 缓解：
  - 已完成 Android 第二客户端 LAN 验收
  - 已保留部署、运维、排障文档
  - 已保留后续 P1 补测入口与证据索引

## 5. 最终结论

在上述完成范围与豁免条件下，`M5 — Production OpenClaw Runtime` 可以标记为：

```text
M5 已完成（当前单用户自部署范围）
```

后续若获得第二台可运行 runtime 的机器，应将“跨机器 runtime host 从零部署实测”作为 post-M5 补测项，而不是阻塞当前 M5 结论。
