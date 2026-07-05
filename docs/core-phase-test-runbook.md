# Core Phase 测试运行手册

这份手册对应 `MindAnchor 核心链路逐步测试计划（stub -> provider-direct -> cluster-preferred）` 的自动化执行器。

## 1. 目标

这个测试器会自动完成三阶段验证：

- Phase 1：`stub`
- Phase 2：`provider-direct`
- Phase 3：`cluster-preferred`

覆盖范围：

- Gateway `/health`、`/debug/openclaw/adapter`、`/debug/agent-configs`
- Gateway `/debug/openclaw/registry-visibility`
- 单 agent probe / debug
- scenario seed
- full regression
- matrix regression
- 核心业务链路
- Web 路由壳与 Web 读模型接口

其中反思链路的当前约定是：

- `GET /reflections/latest?periodType=weekly` 只刷新 `weekly`
- `GET /reflections/latest?periodType=monthly` 只刷新 `monthly`
- `GET /reflections/overview` 会按需补齐周报与月报，但不会紧跟着重复刷新刚刚已经生成过的同周期报告

不覆盖：

- 桌面端原生采集
- Android 音频 Beta
- 视频 Beta
- 健康真实桥接

## 2. 默认命令

### 2.1 推荐：真实 OpenClaw runtime

```bash
export PATH="$PWD/.tools/node/bin:$HOME/.openclaw/bin:$PATH"
corepack pnpm test:core-phases:real
```

适用：

- 验收前
- 检查真实 OpenClaw CLI / profile / cluster-preferred 链路
- 预计耗时明显高于 `local` 模式
- `provider-direct` 阶段的 probe、full regression 与 matrix regression 可能持续较久，脚本已为这一阶段放宽超时上限
- 除显式长回归外，provider-direct 阶段的普通 agent 调试请求也会自动使用更长的默认超时
- 默认 `providerMode=real`
- 脚本现在会先做一轮 `real` 模式预检：
  - 检查 `MINDANCHOR_DEFAULT_MODEL_*` 关键环境变量
  - 检查 Gateway `provider-direct` 直连 provider 的轻量认证探针
  - 检查 `OPENCLAW_BIN` / `~/.openclaw/bin/openclaw`
  - 如果缺前置条件，会在启动前直接失败，并给出明确缺项
- 如果 provider key 无效，也会在启动前直接失败，而不是等 full real 长跑结束后才暴露

如果你希望 `provider-direct` 自动镜像当前 OpenClaw real profile，而不是手动写环境变量，现在还有一个更稳的入口：

```bash
export PATH="$PWD/.tools/node/bin:$HOME/.openclaw/bin:$PATH"
corepack pnpm test:core-phases:real:aligned
```

它会自动读取当前 OpenClaw real profile，并把下面这些 Gateway 默认模型环境对齐过去：

- `MINDANCHOR_DEFAULT_MODEL_BASE_URL`
- `MINDANCHOR_DEFAULT_MODEL_NAME`
- `MINDANCHOR_DEFAULT_MODEL_WIRE_API`
- `MINDANCHOR_DEFAULT_MODEL_API_KEY`

### 2.2 本地兼容 cluster

```bash
export PATH="$PWD/.tools/node/bin:$HOME/.openclaw/bin:$PATH"
corepack pnpm test:core-phases:local
```

适用：

- 日常回归
- 快速验证 Gateway / Web / cluster-preferred 契约
- 不依赖真实 OpenClaw CLI 调用远端模型
- 默认 `providerMode=mock`，让 `provider-direct` 走可复现的契约级验证

### 2.3 通用入口

```bash
export PATH="$PWD/.tools/node/bin:$HOME/.openclaw/bin:$PATH"
corepack pnpm test:core-phases
```

默认 `test:core-phases` 会走：

- `--cluster-mode real`

## 3. 环境要求

### Provider-direct 阶段至少需要

- `MINDANCHOR_DEFAULT_MODEL_BASE_URL`
- `MINDANCHOR_DEFAULT_MODEL_API_KEY`
- `MINDANCHOR_DEFAULT_MODEL_NAME`
- `MINDANCHOR_DEFAULT_MODEL_WIRE_API`

### Real cluster 阶段至少需要

- `openclaw` CLI 可执行
- `~/.openclaw/bin/openclaw` 可访问，或显式设置 `OPENCLAW_BIN`
- provider 凭据已被 OpenClaw runtime 所在环境读取

如果只是想先看自己还缺什么，可以直接理解成：

- 缺 provider 变量 → `provider-direct` 这段不该开跑
- 缺 `openclaw` CLI → `cluster-mode real` 不该开跑
- 现在脚本会在正式起服务前先把这两类问题拦下来

如果真实回归太长，可以先分段跑：

```bash
corepack pnpm test:core-phases:real -- --phases provider-direct
corepack pnpm test:core-phases:real -- --phases cluster-preferred
corepack pnpm test:core-phases:real -- --phases provider-direct --segments baseline,probes
```

适用：

- 先只验证真实 provider-direct
- 或在 provider-direct 已确认后，单独盯 cluster-preferred
- 或在单个 phase 里继续缩到：
  - `baseline`
  - `web`
  - `seed`
  - `probes`
  - `routes`
  - `debugs`
  - `business`
  - `business-core`
  - `business-web-dashboard`
  - `business-web-goalflow`
  - `business-web-state`
  - `business-web-recovery`
  - `business-web-reflections`
  - `business-web-inbox`
  - `regressions`

其中新的 `business` 细分口径用于解决 `provider-direct real` 的长链超时问题：

- `business-core`
  - 只跑业务写入 / 会话 / inbox / reflection 基础链
- `business-web-*`
  - 会先准备最小 business core 数据
  - 再只跑一个指定的 Web 读模型检查

推荐示例：

```bash
corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-core
corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-dashboard
corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-goalflow
corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-state
corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-recovery
corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-reflections
corepack pnpm test:core-phases:real -- --phases provider-direct --segments business-web-inbox
```

当前已经补齐的 `provider-direct business-web-* real` 留档包括：

- `business-web-dashboard`
- `business-web-goalflow`
- `business-web-state`
- `business-web-recovery`
- `business-web-reflections`
- `business-web-inbox`

最小可复现口径示例：

```bash
corepack pnpm test:core-phases:local -- --phases stub --segments baseline
```

这一条适合快速确认：

- phase 过滤是否生效
- segment 过滤是否生效
- `report.live.*` / `report.*` 是否正常产出

## 3.1 资源隔离与中断清理

当前 `run-core-phase-tests.mjs` 已额外收口了 runner 进程管理：

- `api` / `vite` / `openclaw` 这类子进程默认会以 detached process group 方式启动
- 清理时会优先尝试回收整组进程，而不是只杀直接 child
- `SIGINT` / `SIGTERM` 路径都会先落最终 `report.*`，再做清理
- `cleanup` 后会主动清空 runner 内部的进程跟踪状态，避免污染下一轮

如果要快速验证“中断后有没有收干净”，可以参考这一条真实复验口径：

```bash
REPORT_DIR="test-results/core-phase-sigterm-check-$(date +%Y%m%d-%H%M%S)"
MINDANCHOR_PHASED_MOCK_PROVIDER_PORT=9432 \
node scripts/run-core-phase-tests.mjs \
  --cluster-mode local \
  --phases stub \
  --segments baseline \
  --api-port 4034 \
  --web-port 5174 \
  --cluster-port 9888 \
  --report-dir "$REPORT_DIR" &
RUN_PID=$!
sleep 25
kill -TERM "$RUN_PID"
wait "$RUN_PID" || true
lsof -nP -iTCP:4034 -iTCP:5174 -iTCP:9888 -iTCP:9432 -sTCP:LISTEN
```

这条最近一轮真实结果是：

- runner 退出码：
  - `143`
- `report.md` 已正常生成
- 上面 4 个端口在中断后都已释放

另外已经补过一轮“timebox 强退后同端口立刻重跑”的真实复验：

- 第一轮强退报告：
  - `test-results/core-phase-timebox-stop-20260329-223550/report.md`
- 第二轮重跑报告：
  - `test-results/core-phase-timebox-rerun-20260329-223550/report.md`
- 第一轮退出码：
  - `143`
- 第二轮退出码：
  - `0`
- 同端口 `4034 / 5174 / 9888 / 9432` 已确认无残留监听

## 4. 常用参数

```bash
node scripts/run-core-phase-tests.mjs --help
```

主要参数：

- `--cluster-mode real|local|external`
- `--provider-mode real|mock`
- `--phases stub,provider-direct,cluster-preferred`
- `--report-dir <path>`
- `--api-port <port>`
- `--web-port <port>`
- `--cluster-port <port>`
- `--external-cluster-base-url <url>`

也支持环境变量：

- `MINDANCHOR_PHASED_CLUSTER_MODE`
- `MINDANCHOR_PHASED_PHASES`
- `MINDANCHOR_PHASED_REPORT_DIR`
- `MINDANCHOR_PHASED_API_PORT`
- `MINDANCHOR_PHASED_WEB_PORT`
- `MINDANCHOR_PHASED_CLUSTER_PORT`
- `MINDANCHOR_PHASED_CLUSTER_BASE_URL`
- `MINDANCHOR_PHASED_SKIP_PROVIDER_AUTH_PROBE=1`
- `MINDANCHOR_PHASED_PROVIDER_AUTH_PROBE_TIMEOUT_MS=<ms>`

## 5. 输出结果

每次运行会生成一个目录：

- `test-results/core-phase-<timestamp>/`

里面包含：

- `report.md`
- `report.json`
- `report.live.md`
- `report.live.json`
- `logs/`
- `responses/`

其中：

- `report.md` 适合人工阅读
- `report.json` 适合后续脚本分析
- `report.live.md` / `report.live.json` 适合长链运行中途查看当前进度
- `logs/` 存放 API / Web / OpenClaw 运行日志
- `responses/` 存放每一步接口的原始返回快照
- `report.json` / `report.live.json` 里的每个 phase 现在还会额外记录：
  - `failureCategoryCounts`
  - 每个 step 的 `failureCategory`
- `responses/<phase>/adapter-status.json` 现在会额外给出：
  - `failureCategoryCounts`
- 每个 phase 现在还会额外记录一份压缩后的 Registry 健康摘要：
  - `healthStatus`
  - `healthReasonCodes`
  - `totalIssueCount`
  - `missingPersonaCount`
  - `contractMismatchCount`
  - `runtimeContractMismatchCount`
  - `workflowContractMismatchCount`
  - `workflowResponseContractMismatchCount`
  - `workflowExecutionContractMismatchCount`
  - `workflowExecutionProbeMismatchCount`
  - `unknownExternalAgentCount`
  - `matchedAgentCount / nativeAgentCount`

## 6. 通过标准

脚本返回码为：

- `0`：三阶段全部通过
- 非 `0`：任意阶段失败

特别注意：

- `cluster-preferred` 阶段会额外要求：
  - 所有核心 agent 调试与 probe 至少成功经由 OpenClaw 路径一次
  - full regression 无 fallback
  - matrix regression 无 fallback
  - `registry-visibility.externalRuntime.healthStatus` 必须是 `aligned`
  - 如果没对齐，失败信息现在会直接带：
    - `healthReasonCodes`
    - `issue breakdown`
    - 方便立刻分辨是 persona contract、runtime contract、workflow response，还是 execution probe 在漂

- `stub` / `provider-direct` 阶段不会因为 Registry 没有 `aligned` 而直接失败：
  - 这两个阶段的目标不是验收最终 cluster 对齐
  - 但 `report.md` / `report.json` 仍会把 Registry 健康摘要完整记下来，方便连续调试

## 7. 常见 real 失败判断

### 7.1 `provider-direct` 失败，但 `cluster-preferred` 通过

如果完整 `real` 报告出现这种组合：

- `Phase 2 Provider Direct = failed`
- `Phase 3 Cluster Preferred = passed`

优先按下面这个方向判断：

- 不是先怀疑 OpenClaw 主脑
- 先检查 Gateway 直连 provider 的默认模型配置

最近一轮真实样例：

- 完整报告：
  - `test-results/core-phase-real-full-20260329-1/report.md`
- 关键信号：
  - `probe-chief-agent | route=failed | fallback=true | Provider returned HTTP 401.`
  - 响应里能看到：
    - `INVALID_API_KEY`

这类情况通常说明：

- `MINDANCHOR_DEFAULT_MODEL_API_KEY` 存在
- 但值无效，或和 `MINDANCHOR_DEFAULT_MODEL_BASE_URL` 当前服务不匹配

优先检查：

- `MINDANCHOR_DEFAULT_MODEL_BASE_URL`
- `MINDANCHOR_DEFAULT_MODEL_API_KEY`
- `MINDANCHOR_DEFAULT_MODEL_NAME`
- `MINDANCHOR_DEFAULT_MODEL_WIRE_API`

同时注意：

- `cluster-preferred` 通过，只能证明 OpenClaw runtime 自己的 provider 配置可用
- 不能自动说明 Gateway 的 `provider-direct` 直连配置也可用

### 7.2 `real` 在 preflight 就失败：`invalid_provider_api_key`

现在 `providerMode=real` 默认会先跑一轮轻量认证探针。

最近一轮真实样例：

- `test-results/core-phase-real-provider-preflight-20260329-1/report.md`

如果看到：

- `Preflight -> Provider auth probe = failed`
- `[invalid_provider_api_key]`
- `HTTP 401`

说明：

- 不是 phase runner 本身挂了
- 也不是 OpenClaw cluster 主脑先出问题
- 而是 Gateway 直连 provider 的默认模型 key 现在无效

这时优先修：

- `MINDANCHOR_DEFAULT_MODEL_API_KEY`
- `MINDANCHOR_DEFAULT_MODEL_BASE_URL`

如果你只是想临时继续验证 cluster 主脑链，而不是验证 Gateway 直连 provider，可显式跳过：

```bash
MINDANCHOR_PHASED_SKIP_PROVIDER_AUTH_PROBE=1 corepack pnpm test:core-phases:real
```

但这只适合临时调试，不适合正式质量门槛。

### 7.3 `provider-direct` 失败其实是 `baseUrl` 漂移

现在仓库里还新增了一个正式漂移诊断：

```bash
corepack pnpm diagnose:core-phases:provider-drift
```

最近一轮真实结果已经确认：

- Gateway 当前默认：
  - `MINDANCHOR_DEFAULT_MODEL_BASE_URL=https://cdn-gmn.chuangzuoli.com`
- OpenClaw `dev` profile 当前实际：
  - `https://gmncode.cn`

如果诊断输出里看到：

- `provider_base_url_drift`
- `recommendedEnvOverrides.MINDANCHOR_DEFAULT_MODEL_BASE_URL`

优先先按推荐值做一次临时对齐，再跑小口径真实验证。

最近一轮真实样例：

```bash
MINDANCHOR_DEFAULT_MODEL_BASE_URL='https://gmncode.cn' \
corepack pnpm test:core-phases:real -- --phases provider-direct --segments baseline,probes --report-dir test-results/core-phase-real-provider-direct-aligned-baseurl-20260329-1
```

对应结果：

- `test-results/core-phase-real-provider-direct-aligned-baseurl-20260329-1/report.md`
- `Phase 2 Provider Direct = passed`
- `21/21`

这说明当前这个问题已经不是：

- token 本身无效
- OpenClaw 主脑不可用

而是：

- Gateway `provider-direct` 默认 `baseUrl` 和 OpenClaw real profile 没对齐

### 7.4 使用自动对齐入口后，`provider-direct` 已恢复通过

现在已经有正式入口：

```bash
corepack pnpm test:core-phases:real:aligned -- --phases provider-direct --segments baseline,probes
```

最近一轮真实留档：

- `test-results/core-phase-real-aligned-wrapper-20260329-1/report.md`

当前结果：

- `Phase 2 Provider Direct = passed`
- `21/21`

另外，完整 `full real` 也已经在对齐 `baseUrl` 后通过：

- `test-results/core-phase-real-full-aligned-baseurl-20260329-1/report.md`

补充说明：

- `corepack pnpm test:core-phases:real:aligned ...` 现在会在启动前主动比对当前 shell 的 `MINDANCHOR_DEFAULT_MODEL_*` 和 OpenClaw profile
- 如果两边漂移，它会先打印 warning，再继续用 profile 覆盖值启动 runner
- 所以：
  - 看到 warning 不代表 aligned runner 失败
  - 它只说明你当前 shell 里的 provider-direct 默认环境不可信，不能直接拿来和 aligned 结果做一一对照
- 如果要手工复现 aligned runner 之外的 provider-direct 行为，先跑：

```bash
corepack pnpm diagnose:core-phases:provider-drift
```

再决定是否需要临时导出推荐的 override。

## 7. 建议排障顺序

如果失败，先按这个顺序看：

1. `report.md`
2. `report.json`
3. `logs/api-*.log`
4. `logs/openclaw-*.log`
5. `responses/<phase>/adapter-status.json`
6. `responses/<phase>/probe-*.json`
7. `responses/<phase>/debug-*.json`

如果是 cluster 阶段失败，再优先看：

- `adapter.route`
- `selectedEndpoint`
- `failureCategory`
- `failureCategoryCounts`
- `fallbackReason`
- 对应 `traceId`
- `responses/<phase>/registry-visibility.json`
- `report.md` 里的 `Registry health / Registry reasons / Registry matched agents`
- `report.md` 里的 `Registry issue breakdown`

目前已经结构化区分的典型失败类别包括：

- `cluster_contract_failure`
- `cluster_http_error`
- `cluster_timeout`
- `provider_http_error`
- `provider_timeout`
- `provider_invalid_response`
- `missing_provider_config`

## 8. 建议配合文档

- `docs/development-handoff-2026-03-07.md`
- `docs/local-development.md`
- `docs/local-cluster-manual-verification.md`
- `docs/openclaw-production-runtime-deployment.md`
