# Web Console Smoke Checklist

这份清单用于在另一台机器、切换模型配置、或接入远程 OpenClaw 集群后，快速验证当前 Web 控制台是否仍然完整可用。

## 前置条件

- 已把 Node runtime 加到 `PATH`
- 已启动 `apps/api`
- 需要看页面时再启动 `apps/web`

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm install
corepack pnpm dev:api
corepack pnpm dev:web
```

默认 API 地址：

```bash
export MINDANCHOR_API_URL=http://127.0.0.1:3001
```

## 一键接口 smoke

仓库内置了一个轻量脚本，会逐个检查 Web 控制台当前依赖的正式读模型与关键 debug 接口：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
MINDANCHOR_API_URL=http://127.0.0.1:3001 bash scripts/smoke-web-console.sh
```

默认情况下，这个脚本还会：

- 调用 `POST /debug/local-cluster/bootstrap`
- 为默认的 `demo-user` 准备业务页数据
- 检查关键读模型不只是 `2xx`，而且已经**有内容**

可选开关：

```bash
export MINDANCHOR_WEB_SMOKE_USER_ID=demo-user
export MINDANCHOR_WEB_SMOKE_BOOTSTRAP_DEMO_USER=1
export MINDANCHOR_WEB_SMOKE_REQUIRE_CONTENT=1
```

如果你只是想做“纯接口可达性”检查，而不想写入 `demo-user` 调试数据，可以关闭：

```bash
export MINDANCHOR_WEB_SMOKE_BOOTSTRAP_DEMO_USER=0
export MINDANCHOR_WEB_SMOKE_REQUIRE_CONTENT=0
```

它会检查：

- `GET /health`
- `GET /dashboard/summary`
- `GET /goalflow/overview`
- `GET /state/trends`
- `GET /recovery/history`
- `GET /reflections/overview`
- `GET /client/inbox/overview`
- `GET /debug/openclaw/adapter`
- `GET /debug/agent-configs`
- `GET /debug/scenarios`

在默认内容检查开启时，还会额外确认：

- `Dashboard` 已有 task / state / recovery 数据
- `GoalFlow` 已有 goal / task / suggested focus
- `State Trends` 已有当前评估与历史样本
- `Recovery` 已有 recovery plan 与 pending tasks
- `Reflections` 已有周报 / 月报
- `Inbox` 已有消息和渠道统计

## 模式一：`stub`

推荐先在 `stub` 模式验证完整页面闭环。

```bash
export MINDANCHOR_AGENT_MODE=stub
unset MINDANCHOR_OPENCLAW_BASE_URL
```

### 预期

- `GET /health` 返回 `mode=stub`
- `GET /debug/openclaw/adapter` 返回：
  - `clusterEnabled=false`
  - `executionStrategy=provider-direct`
- Web 页面可打开：
  - Dashboard
  - GoalFlow
  - State Trends
  - Recovery
  - Reflections
  - Inbox
  - Agent Lab

### 页面重点

- `GoalFlow` 能创建 goal/task，并能启动 focus session
- `Recovery` 能看到恢复计划入口
- `State Trends` 能展示当前评估和趋势卡
- `Reflections` 无报告时会自动生成周/月报
- `Inbox` 能看到 pending/acknowledged 消息分组
- `Agent Lab` 能正常加载 adapter 状态卡

## 模式二：`openai-compatible`（provider-direct）

```bash
export MINDANCHOR_AGENT_MODE=openai-compatible
unset MINDANCHOR_OPENCLAW_BASE_URL
export MINDANCHOR_DEFAULT_MODEL_BASE_URL=https://your-openai-compatible-endpoint
export MINDANCHOR_DEFAULT_MODEL_API_KEY=replace-me
export MINDANCHOR_DEFAULT_MODEL_NAME=gpt-5.4
export MINDANCHOR_DEFAULT_MODEL_WIRE_API=responses
```

### 预期

- `GET /health` 返回 `mode=openai-compatible`
- `GET /debug/openclaw/adapter` 返回：
  - `clusterEnabled=false`
  - `executionStrategy=provider-direct`
- `GET /debug/model-probe/chief-agent` 成功
- Agent Lab 单 agent debug 能成功返回
- Adapter 状态卡和运行结果徽章显示 `provider-direct`

## 模式三：`openai-compatible`（cluster-preferred）

```bash
export MINDANCHOR_AGENT_MODE=openai-compatible
export MINDANCHOR_OPENCLAW_BASE_URL=http://127.0.0.1:8787
```

### 预期

- `GET /debug/openclaw/adapter` 返回：
  - `clusterEnabled=true`
  - `executionStrategy=cluster-preferred`
- Agent Lab 运行后：
  - 如果 cluster 成功，显示 `cluster`
  - 如果 cluster 失败而 provider 成功，显示 `provider-fallback`
  - `recentTimeline` 能看到最近 decision 事件

## 回归最小集合

每次切换模型、切换 Base URL、切换机器后，至少验证：

1. `GET /health`
2. `GET /goalflow/overview`
3. `GET /state/trends`
4. `GET /recovery/history`
5. `GET /reflections/overview`
6. `GET /client/inbox/overview`
7. `GET /debug/openclaw/adapter`
8. Agent Lab 跑一次：
   - `GET /debug/model-probe/chief-agent`
   - `GET /debug/agent/state-insight`

## 验收标准

- 所有正式读模型接口返回 `2xx`
- Dashboard 和 5 个业务页面都能打开
- Agent Lab 能显示 adapter 路径
- 在 `cluster-preferred` 模式下，cluster/provider/fallback 路径至少有一条可见记录
- 无密钥、无原始 provider 鉴权头、无高敏感原始输入泄露到页面或 debug 输出

如果要进一步确认“真实外部 cluster 本身”是否已经可用，继续执行 `docs/openclaw-cluster-smoke-checklist.md`。
