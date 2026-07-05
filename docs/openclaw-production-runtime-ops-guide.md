# OpenClaw Production Runtime 运维指南

## 1. 常用命令

### 1.1 后台常驻

```bash
corepack pnpm start:openclaw-runtime-lan
corepack pnpm stop:openclaw-runtime-lan
corepack pnpm restart:openclaw-runtime-lan
corepack pnpm status:openclaw-runtime-lan
corepack pnpm health:openclaw-runtime-lan
```

### 1.2 launchd

```bash
corepack pnpm install:openclaw-runtime-launchd
corepack pnpm status:openclaw-runtime-launchd
corepack pnpm uninstall:openclaw-runtime-launchd
```

## 2. 日志与状态文件

- 默认端口 `8800` 时：
  - 运行日志：`.logs/openclaw-real-lan.log`
  - pid：`.logs/openclaw-real-lan.pid`
  - 环境快照：`.logs/openclaw-real-lan.env`
- 非默认端口时：
  - 运行日志：`.logs/openclaw-real-lan-<port>.log`
  - pid：`.logs/openclaw-real-lan-<port>.pid`
  - 环境快照：`.logs/openclaw-real-lan-<port>.env`
- 如果设置了 `OPENCLAW_RUNTIME_INSTANCE`，前缀会变成：
  - `.logs/openclaw-runtime-<instance>.log`
  - `.logs/openclaw-runtime-<instance>.pid`
  - `.logs/openclaw-runtime-<instance>.env`
- launchd stdout：`.logs/openclaw-launchd.log`
- launchd stderr：`.logs/openclaw-launchd.err.log`

建议排障顺序：

1. 先看 `corepack pnpm status:openclaw-runtime-lan`
2. 再看 `corepack pnpm health:openclaw-runtime-lan`
3. 记录 `status-openclaw-runtime-lan` 输出里的 `FILE_PREFIX` / `LOG_FILE` / `ENV_FILE`
4. 再打开对应 `LOG_FILE`
4. 若使用 launchd，再看 `.logs/openclaw-launchd.err.log`

## 3. 健康检查

默认健康地址：

```bash
curl -fsS http://127.0.0.1:8800/health
```

脚本健康检查：

- `corepack pnpm health:openclaw-runtime-lan` 会先检查 loopback
- 如果 env snapshot 中存在 `OPENCLAW_BASE_URL`，会继续检查该 LAN URL 的 `/health`
- 仅当你明确知道当前机器无法回连自己的 LAN IP 时，才临时使用 `OPENCLAW_SKIP_LAN_HEALTH=1`

健康返回重点关注：

- `runtime`
- `runtimeVersion`
- `profile`
- `agentCount`
- `queue.activeCount`
- `queue.queuedCount`

## 4. 升级流程

最小升级流程：

1. 记录当前可用版本与当前 Base URL
2. 备份：
   - `.logs/openclaw-real-lan.env`
   - 当前 provider 配置方式
   - 当前 smoke 报告
3. 停止服务：
   - `corepack pnpm stop:openclaw-runtime-lan`
   - 或先 `corepack pnpm uninstall:openclaw-runtime-launchd`
4. 更新代码与依赖：
   - `corepack pnpm install`
5. 如有需要，重新执行：
   - `bash scripts/setup-openclaw-real-profile.sh`
6. 启动服务：
   - `corepack pnpm start:openclaw-runtime-lan`
   - 或 `corepack pnpm install:openclaw-runtime-launchd`
7. 运行健康检查与 `smoke:cluster`

## 5. 回滚流程

如果升级后出现问题：

1. 停止新服务
2. 切回上一个确认可用的代码目录或发布快照
3. 恢复上一次可用的 provider / profile 配置
4. 重新启动 runtime
5. 重新跑：
   - `corepack pnpm health:openclaw-runtime-lan`
   - `corepack pnpm smoke:cluster`

回滚完成的最小判定：

- `/health` 恢复正常
- `Agent Lab` 再次显示 `route · cluster`
- 关键 debug agent 恢复为 `cluster`

## 6. 常见故障

### 6.1 `session file locked`

症状：

- adapter timeline 出现 `provider-fallback`
- runtime log 中出现 `session file locked`

当前处理：

- Gateway 会对已知 `session file locked` 的 cluster `HTTP 500` 做同一 endpoint 的短重试，再决定是否 fallback
- 如果短重试后仍失败，adapter 仍会记录为 `provider-fallback` 或 `failed`

如果仍频繁出现：

1. 先观察是否集中在某一个 agent
2. 查看 `GET /debug/openclaw/adapter` 的 `lastFallback.clusterAttempts`
3. 如果连续同一 endpoint 都是 `HTTP 500` 且 preview 含 `session file locked`，优先判断 runtime 内部 session 管理仍未稳定
4. 降低同一时刻的并发 probe / debug 操作
5. 重启 runtime 后再跑 smoke

可直接执行的最小复现：

- `corepack pnpm repro:openclaw:session-lock-recovery`
- 预期：首次 `session file locked` 后在同一 `/v1/tasks/execute` 重试恢复，`adapter.lastDecision.route=cluster`

### 6.2 `/health` 不通

排查：

1. `corepack pnpm status:openclaw-runtime-lan`
2. 记录 `PID_FILE` / `LOG_FILE` / `ENV_FILE`
3. 检查端口是否被占用
4. 打开 `LOG_FILE`
5. 若使用 launchd，检查 `.logs/openclaw-launchd.err.log`

### 6.3 `fetch failed`

症状：

- adapter timeline 出现 `provider-fallback`
- `lastFallback.fallbackReason=fetch failed`
- `clusterAttempts` 全是 `ok=false`，且没有有效 `status`

当前处理：

- Gateway 现在会对已知 `fetch failed` 类瞬时 transport error 做同一 endpoint 的短重试
- 如果第二次立即恢复，adapter 应继续记为 `route=cluster`
- 只有整轮 endpoint 都不可达时，才仍应进入 transport fallback

可直接执行的最小复现：

- `corepack pnpm repro:openclaw:transport-fallback`
- 预期：当 cluster base URL 整体不可达时，仍会得到 `failureCategory=cluster_transport_error`
- 当前脚本还会额外输出：
  - `clusterAttemptSummary.totalAttempts=6`
  - `clusterAttemptSummary.uniqueEndpoints=["/v1/tasks/execute","/tasks/execute","/api/tasks/execute"]`
  - `clusterAttemptSummary.allErrorsFetchFailed=true`
  - 这能直接对应历史 real-lan 日志里“3 个 endpoint 全部 fetch failed”的模式

### 6.4 Gateway 仍走 `provider-direct` 或 `provider-fallback`

排查：

1. 确认 Gateway 上的 `MINDANCHOR_OPENCLAW_BASE_URL`
2. 访问 `GET /debug/openclaw/adapter`
3. 查看最近 `fallbackReason` 和 `failureCategory`
4. 用 `GET /debug/model-probe/chief-agent` 和 `GET /debug/agent/state-insight` 做单点验证

当前已确认的一类真实失稳证据不是 contract 漂移，而是 transport 级失败：

- 历史 `.logs/api-real-lan.log` 中存在多次 `cluster request error` / `cluster.fallback`
- 对应 `adapter.route=provider-fallback`
- `fallbackReason=fetch failed`

另一个需要单独区分的已知类别是 session lock：

- 如果 `clusterAttempts.preview` 含 `session file locked`，这不是 transport 失败
- Gateway 会先对同一 endpoint 做短重试
- 只有重试后仍失败，才继续进入 fallback 统计

transport 级失败则可直接用：

- `corepack pnpm repro:openclaw:transport-fallback`
- 预期：`adapter.lastFallback.failureCategory=cluster_transport_error`

如果要一键抓当前现场并自动和健康基线对比，优先用：

- `corepack pnpm investigate:openclaw-runtime-transport --baseline <baseline.json> --out-dir <dir>`
- 它会顺序完成：
  - incident report
  - compare report
- 适合 real-lan 异常刚出现时直接执行

如果要先做一次真实环境轻量采样，再决定是否深挖日志：

- `corepack pnpm diagnose:openclaw-runtime-transport-lan`
- 输出会一次性包含：
  - runtime `filePrefix / pidFile / logFile / envFile / status`
  - loopback / LAN health 结果
  - `/debug/openclaw/adapter` 最近一次决策
  - `clusterAttemptSummary`

如果要把这次采样直接落成可归档文件：

- `MINDANCHOR_API_URL=http://127.0.0.1:3011 corepack pnpm report:openclaw-runtime-transport-lan`
- 会写出：
  - `tmp/openclaw-runtime-transport-report.json`
  - `tmp/openclaw-runtime-transport-report.md`
- 如果未显式提供可用的 `MINDANCHOR_API_URL`，报告里会保留 `adapter_unreachable`，这说明只采到了 runtime 健康面，没有采到 Gateway adapter 状态

如果要把异常现场和健康基线自动对比：

- `corepack pnpm compare:openclaw-runtime-transport <baseline.json> <current.json> <compare.json> <compare.md>`
- 典型用法：
  - baseline 用健康基线报告
  - current 用刚抓到的异常现场报告
- 输出会给出：
  - `driftCodes`
  - baseline/current 的关键摘要
  - 当前 `clusterAttemptSummary`
- `investigate:` 只是把这两步连起来，方便现场直接留档

在处理这两类问题前，先确认 runtime 进程和实际 `LOG_FILE` 存在，再决定是否继续往 transport 或 session/lock 方向排查。

## 7. 当前运维边界

- 当前生产形态仍是**单用户单节点**
- 当前最稳妥暴露方式仍是 `LAN`
- provider secrets 仍应只留在 runtime 所在机器
- Gateway 不应代管 provider secret

## 8. 关联文档

- `docs/openclaw-production-runtime-deployment.md`
- `docs/m5-production-runtime-completion-checklist.md`
- `docs/openclaw-cluster-real-smoke-report-2026-03-08.md`
