# M5 Production Runtime Evidence Index（2026-04-24）

这份索引用于汇总当前 `M5 — Production OpenClaw Runtime` 已有证据、可复跑入口、以及剩余缺口。

## 1. 当前总判断

- `M4 已完成`
- `M5 已完成（当前单用户自部署范围）`
- 当前机器上的 OpenClaw production runtime 基线可用
- 当前机器 P0 稳定性、transport 诊断、external smoke、Android 第二客户端 LAN 可达性均已有证据
- 真正的 P1 跨机器 / 远端单节点“从零部署 runtime”当前无第二台 runtime host，本轮按用户决策显式豁免，不再作为本机 M5 收口阻塞项
- 最终完成评审：`docs/m5-production-runtime-final-completion-review-2026-04-24.md`

## 2. 当前运行态基线

- Runtime entrypoint：`openclaw/production-runtime-server.mjs`
- Runtime status：`corepack pnpm status:openclaw-runtime-lan`
- Runtime health：`corepack pnpm health:openclaw-runtime-lan`
- Runtime LAN Base URL：以 `.logs/openclaw-real-lan.env` / `corepack pnpm status:openclaw-runtime-lan` 输出为准
- 当前已验证 LAN Base URL：`http://192.168.0.104:8800`
- 预期 execute endpoint：`cluster:/v1/tasks/execute`

## 3. 关键工具入口

### 3.1 Runtime 运维

- 启动：`corepack pnpm start:openclaw-runtime-lan`
- 停止：`corepack pnpm stop:openclaw-runtime-lan`
- 重启：`corepack pnpm restart:openclaw-runtime-lan`
- 状态：`corepack pnpm status:openclaw-runtime-lan`
- 健康：`corepack pnpm health:openclaw-runtime-lan`

### 3.2 Transport / fallback 诊断

- 诊断采样：`corepack pnpm diagnose:openclaw-runtime-transport-lan`
- 生成报告：`corepack pnpm report:openclaw-runtime-transport-lan`
- 对比报告：`corepack pnpm compare:openclaw-runtime-transport`
- 一键调查：`corepack pnpm investigate:openclaw-runtime-transport`

### 3.3 稳定性 / smoke

- 当前机器 external smoke：`corepack pnpm smoke:cluster`
- P0 短时稳定性观察：`corepack pnpm observe:openclaw-runtime-stability`
- 真实 aligned runtime contracts：`corepack pnpm test:core-phases:real:aligned -- --phases cluster-preferred --segments runtime-contracts`

### 3.4 Provider env 对齐

- 手工命令注入 OpenClaw profile provider env：

```bash
corepack pnpm with:openclaw-real-env -- -- <command>
```

- 非密钥 dry-run：

```bash
corepack pnpm with:openclaw-real-env -- --dry-run -- <command>
```

## 4. 2026-04-24 关键证据

### 4.1 Transport investigate 复查

- 目录：`test-results/investigate-recheck-gateway-probed-2026-04-24T08-32-24Z/`
- Incident JSON：`test-results/investigate-recheck-gateway-probed-2026-04-24T08-32-24Z/openclaw-runtime-transport-incident-2026-04-24T08-32-24-984Z.json`
- Incident Markdown：`test-results/investigate-recheck-gateway-probed-2026-04-24T08-32-24Z/openclaw-runtime-transport-incident-2026-04-24T08-32-24-984Z.md`
- Compare JSON：`test-results/investigate-recheck-gateway-probed-2026-04-24T08-32-24Z/openclaw-runtime-transport-compare-2026-04-24T08-32-24-984Z.json`
- Compare Markdown：`test-results/investigate-recheck-gateway-probed-2026-04-24T08-32-24Z/openclaw-runtime-transport-compare-2026-04-24T08-32-24-984Z.md`
- 结论：`driftCodes=[]`，`route=cluster`，`selectedEndpoint=cluster:/v1/tasks/execute`，`issues=[]`

### 4.2 当前机器 external cluster smoke

- 报告：`docs/openclaw-production-runtime-smoke-report-2026-04-24.md`
- 结论：
  - direct `/v1/tasks/execute` HTTP `200`
  - Gateway `/health` HTTP `200`
  - `/debug/openclaw/adapter` HTTP `200`
  - `chief-agent` probe HTTP `200`
  - 6 个 debug agent HTTP `200`
  - 7 个核心 agent 均显示 `route=cluster`

### 4.3 P0 短时稳定性观察

- JSON：`test-results/openclaw-runtime-stability-2026-04-24T13-51-02-899Z.json`
- Markdown：`test-results/openclaw-runtime-stability-2026-04-24T13-51-02-899Z.md`
- 结论：
  - `roundsPlanned=12`
  - `roundsCompleted=12`
  - `clusterRouteCount=84`
  - `providerFallbackCount=0`
  - `failedCount=0`
  - `nonClusterCount=0`
  - `passed=true`

### 4.4 Android 第二客户端 LAN 验收

- 报告：`docs/openclaw-production-runtime-android-lan-verification-2026-04-24.md`
- 设备：`NX733J`
- Android：`15`
- 手机 Wi-Fi：`192.168.0.100/24`
- Runtime：`http://192.168.0.104:8800`
- 结论：
  - 手机侧 `/health` HTTP `200`，`ok=true`
  - 手机侧 direct `/v1/tasks/execute` HTTP `200`
  - `success=true`
  - `metadata.worker=chief-agent-worker`
  - `parsed={"probe":"ok"}`
- 注意：该证据证明第二客户端 LAN 可达性，但不替代第二台机器从零部署 runtime。

### 4.5 Provider drift 根治入口

- 入口：`corepack pnpm with:openclaw-real-env -- -- <command>`
- 测试：`scripts/__tests__/with-openclaw-real-env-entry.test.mjs`
- 结论：
  - shell 默认 `MINDANCHOR_DEFAULT_MODEL_*` 仍可作为 drift 诊断来源
  - 手工 provider-direct 对比已有统一执行入口，可从 OpenClaw profile 注入对齐后的 Gateway provider env
  - dry-run 不泄露 provider token，只输出 `apiKeyPresent`

## 5. 当前剩余缺口

### 5.1 本轮显式豁免项

- 第二台机器 / 远端单节点从零部署 runtime 当前未实测
- 原因：当前没有第二台可运行 runtime 的机器
- 本轮处理：显式跳过 / accepted risk，不再阻塞继续推进 M5 本机收口
- 重要说明：该豁免不等同于以下动作已实测通过：
  - 环境准备
  - OpenClaw profile / provider credentials 配置
  - runtime 启动
  - LAN / remote Base URL 暴露
  - Mac Gateway/Web 反向访问该 runtime
  - smoke / stability / investigate 验收

### 5.2 不再作为当前主阻塞

- `real:aligned` runtime-contracts 已通过
- provider drift 已有统一 wrapper 入口收口
- 当前机器短时 provider-fallback 稳定性已有 12 轮观察证据
- Android 手机已证明第二客户端 LAN 可达性
- 跨机器 runtime host 实测已被显式豁免

## 6. 后续推荐顺序

1. M5 当前范围已完成，后续进入 post-M5 补测 / 观察。
2. 若未来有第二台可运行 Node/runtime 的机器，再按部署文档补 P1 从零部署验收。
3. 在 post-M5 P1 环境上跑：
   - `health`
   - direct `/v1/tasks/execute`
   - Gateway `cluster-preferred`
   - `smoke:cluster`
   - `observe:openclaw-runtime-stability`
3. 如果出现异常，立即跑：

```bash
corepack pnpm investigate:openclaw-runtime-transport \
  --baseline test-results/openclaw-runtime-transport-2026-04-22T09-19-21Z.json \
  --out-dir test-results/investigate-incident-$(date -u +%Y-%m-%dT%H-%M-%SZ)
```

4. 若 P1 后续补测通过，再统一更新 `tasks.md`、`docs/m5-production-runtime-completion-checklist.md`、handoff 与最终 smoke/report 结论。
