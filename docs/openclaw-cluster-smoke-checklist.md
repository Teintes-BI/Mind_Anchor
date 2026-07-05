# OpenClaw Cluster E2E Smoke Checklist

这份清单专门用于验证“**真实外部 OpenClaw 集群**”是否已经和 MindAnchor Gateway 打通。

它覆盖两层检查：

1. **直连 cluster 合同检查**
2. **通过 Gateway 的 cluster-preferred 路径检查**

这份清单对应当前仍未完全落地的事项：`docs/development-handoff-2026-03-07.md` 中提到的“真实外部 OpenClaw 集群端到端 smoke”。

## 前置条件

- 已启动 `apps/api`
- 你手上有一个可访问的 OpenClaw cluster Base URL
- Gateway 已配置：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
export MINDANCHOR_API_URL=http://127.0.0.1:3001
export MINDANCHOR_OPENCLAW_BASE_URL=http://your-openclaw-host:8787
export MINDANCHOR_AGENT_MODE=openai-compatible
```

可选 provider fallback：

```bash
export MINDANCHOR_DEFAULT_MODEL_BASE_URL=https://your-openai-compatible-endpoint
export MINDANCHOR_DEFAULT_MODEL_API_KEY=replace-me
export MINDANCHOR_DEFAULT_MODEL_NAME=gpt-5.4
export MINDANCHOR_DEFAULT_MODEL_WIRE_API=responses
```

## 一键 smoke

仓库内置一个轻量脚本：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
MINDANCHOR_API_URL=http://127.0.0.1:3001 \
MINDANCHOR_OPENCLAW_BASE_URL=http://your-openclaw-host:8787 \
bash scripts/smoke-openclaw-cluster.sh
```

默认行为：

- 如果当天报告文件不存在，脚本会自动创建：
  - `docs/openclaw-cluster-smoke-report-YYYY-MM-DD.md`
- 并把本次直连 cluster / Gateway / adapter / chief probe 的返回快照追加进去

它会做两类检查：

- 直接对 cluster 候选执行端点发样例任务
- 再通过 Gateway 检查：
  - `GET /health`
  - `GET /debug/model-probe/chief-agent`
  - `POST /debug/scenarios/focus-recovery-loop/seed`
  - `GET /debug/agent/state-insight`
  - `GET /debug/agent/interruption-recovery`
  - `GET /debug/agent/reflection`
  - `GET /debug/openclaw/adapter`

建议在执行前先复制一份结果模板：

- `docs/openclaw-cluster-smoke-report-template.md`
- `docs/openclaw-cluster-first-smoke-report-2026-03-07.md`（首次联调可直接改这份样例）
- `bash scripts/new-openclaw-cluster-smoke-report.sh 2026-03-07`（快速生成当天报告文件）

如果你想指定报告文件名，也可以这样执行：

```bash
MINDANCHOR_CLUSTER_SMOKE_REPORT_FILE=docs/openclaw-cluster-smoke-report-my-host.md \
bash scripts/smoke-openclaw-cluster.sh
```

## 第 1 层：直连 cluster 合同

预期 cluster 至少兼容以下一个端点：

- `POST /v1/tasks/execute`
- `POST /tasks/execute`
- `POST /api/tasks/execute`

### 成功标准

- 其中至少一个端点返回 `2xx`
- 返回体含有 `success`
- 如果 `success=true`，返回体至少包含以下之一：
  - `parsed`
  - `outputText`

### 建议关注点

- cluster 是否正确接受 `trace` 字段
- cluster 是否返回自己的 `traceId`
- cluster 是否保留 `taskId`
- cluster 是否返回结构化 `metadata.runtime` / `metadata.worker`

### 建议保存的结果

- 直连 cluster 的成功返回体
- 实际命中的端点路径
- cluster 返回的 `traceId`
- cluster 返回的 `metadata`

## 第 2 层：Gateway cluster-preferred 路径

### 检查 1：Gateway 健康

```bash
curl -s "$MINDANCHOR_API_URL/health"
```

预期：

- `mode=openai-compatible`
- `openClawBaseUrl` 为当前 cluster URL

### 检查 2：Adapter 状态

```bash
curl -s "$MINDANCHOR_API_URL/debug/openclaw/adapter"
```

预期：

- `clusterEnabled=true`
- `executionStrategy=cluster-preferred`

### 检查 3：单 agent probe

```bash
curl -s "$MINDANCHOR_API_URL/debug/model-probe/chief-agent?userId=demo-user"
```

预期：

- 返回 `success=true`
- `adapter.route` 为：
  - `cluster`，或者
  - `provider-fallback`（如果 cluster 不可用但 provider fallback 成功）
- 记录返回的 `traceId`

### 检查 4：Agent Lab

启动 Web 后，打开 Agent Lab：

- 顶部 `OpenClaw adapter` 卡片能显示当前 cluster 策略
- 跑一次 `Probe chief-agent`
- 跑一次 `state-insight-agent` debug
- 最近时间线能看到 cluster / provider-fallback 记录

## 记录结果

建议每次真实 cluster smoke 都保存一份结果记录：

1. 复制 `docs/openclaw-cluster-smoke-report-template.md`
2. 或直接复制 `docs/openclaw-cluster-first-smoke-report-2026-03-07.md` 作为第一次真实联调样例
3. 把实际执行时间、环境变量、直连 cluster 返回、Gateway adapter 快照、traceId 都填进去
4. 如果失败，把排障动作和最终结论一并落档

这样下次换机器、换 cluster、换 worker 或换 provider 时，可以直接横向对比。

当前报告模板已经拆成两层：

- 自动 smoke 结果（脚本可回填）
- 页面人工验收结果（执行人手工补充）

## 结果判定

### 通过

- cluster 直连合同至少一个执行端点可用
- Gateway `adapter` 状态明确显示 `cluster-preferred`
- Probe / debug 至少有一次能真实显示 `cluster` 或 `provider-fallback`
- 无密钥、无 provider 鉴权头泄漏到 cluster 请求体或 Gateway debug 输出

### 部分通过

- cluster 直连不可用，但 Gateway 能稳定落到 `provider-fallback`
- 这种状态说明产品仍可跑，但远程 cluster 尚未真正接入成功

### 不通过

- cluster 三个候选端点全部不可用
- Gateway 仍显示 `provider-direct`
- `debug/openclaw/adapter` 没有时间线或没有最近一次决策

## 下一步排查

如果 smoke 未通过，优先按下面顺序排查：

1. `GET /health`
2. `GET /debug/agent-configs`
3. cluster Base URL 是否可访问
4. cluster 执行端点是否是 `/v1/tasks/execute`
5. `GET /debug/openclaw/adapter`
6. `GET /debug/traces/:traceId`

## 常见失败模式

### 1. 三个 cluster 端点都 404 / 405

说明：

- Base URL 可访问，但 cluster 执行端点路径不兼容当前 Gateway 探测列表

优先处理：

- 确认真实 cluster 是否暴露了 `/v1/tasks/execute`
- 如果不是，优先让 cluster 兼容这个 canonical path

### 2. 直连 cluster 成功，但 Gateway 仍显示 `provider-direct`

说明：

- 大概率是 Gateway 进程没有读到 `MINDANCHOR_OPENCLAW_BASE_URL`

优先处理：

- 重看 `GET /health`
- 重启 `apps/api`
- 确认当前 shell/session 已导出环境变量

### 3. Gateway 显示 `cluster-preferred`，但 probe 仍然一直 `provider-fallback`

说明：

- Gateway 已尝试 cluster，但 cluster 返回不可用 / 不合格载荷

优先处理：

- 看 `GET /debug/openclaw/adapter`
- 看 `recentTimeline` 里的 `fallbackReason`
- 再用 `GET /debug/traces/:traceId` 看 cluster response invalid / rejected / failed 事件

### 4. Agent Lab 页面正常，但没有任何 adapter timeline

说明：

- 可能只打开了页面，还没有真的触发 probe/debug

优先处理：

- 在 Agent Lab 先执行：
  - `Probe chief-agent`
  - `state-insight-agent` debug

### 5. cluster 成功返回，但页面仍显示 `failed`

说明：

- 多半是 cluster 返回结构与 Gateway 当前 schema 不匹配

优先处理：

- 检查 cluster 返回的是 `parsed` 还是 `outputText`
- 检查字段命名是否满足 Gateway 当前 agent contract
- 对照 `openclaw/README.md` 的 execute contract 样例

## 关联文档

- `docs/development-handoff-2026-03-07.md`
- `docs/local-development.md`
- `docs/web-console-smoke-checklist.md`
- `docs/web-console-read-models.md`
- `docs/openclaw-cluster-smoke-report-template.md`
- `docs/openclaw-cluster-first-smoke-report-2026-03-07.md`
- `openclaw/README.md`
