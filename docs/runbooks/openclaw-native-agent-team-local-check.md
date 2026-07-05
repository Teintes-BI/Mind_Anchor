# OpenClaw Native Agent Team 本地联调 Runbook

## 目标

验证以下链路已经在本地可工作：

- Gateway 提供受控 memory context / proposal API
- OpenClaw local runtime 暴露原生 persona registry
- `Picard` 以原生 routing owner 身份参与路由
- runtime 在生成前可向 Gateway 拉取 scoped memory
- memory 写入仍走 proposal，而不是 agent direct write

## 前置条件

- 工作目录：`/Users/claw/mindanchor`
- Node / pnpm 可用
- `apps/api` 可本地启动
- `openclaw/local-runtime/server.mjs` 可本地启动

## 启动顺序

### 1. 启动 Gateway

在仓库根目录执行：

```bash
corepack pnpm --filter @mindanchor/api dev
```

默认监听：

- `http://127.0.0.1:3001`

### 2. 启动 OpenClaw local runtime

另开一个终端：

```bash
node openclaw/local-runtime/server.mjs
```

默认监听：

- `http://127.0.0.1:8788`

如需显式指定：

```bash
OPENCLAW_HOST=127.0.0.1 OPENCLAW_PORT=8788 node openclaw/local-runtime/server.mjs
```

## 基础探针

### Gateway health

```bash
curl http://127.0.0.1:3001/health
```

期望：

- `ok: true`
- `topology: "gateway->openclaw-cluster"`

### OpenClaw runtime health

```bash
curl http://127.0.0.1:8788/health
```

期望：

- `runtime: "openclaw-local-cluster"`
- `agentCount` 包含 6 个 persona agent
- `director-agent` 的 `supportedWorkflows` 含 `persona_routing`
- `life-secretary-agent` 的 `supportedWorkflows` 含 `plan_adjustment`
- `memory-governor-agent` 的 `supportedWorkflows` 含 `memory_governance`

## Memory smoke

### 1. 读取 `Picard` scoped memory

```bash
curl "http://127.0.0.1:3001/internal/agent-memory/context?userId=demo-user&agentId=director-agent&scopes=preferences,recentContext"
```

期望：

- 返回 `agentId: "director-agent"`
- `scopes` 仅为请求的 scopes
- `preferences` / `recentContext` 为结构化 bundle

### 2. 验证 scope 隔离

```bash
curl "http://127.0.0.1:3001/internal/agent-memory/context?userId=demo-user&agentId=companion-agent&scopes=constraints"
```

期望：

- HTTP `403`
- message 包含 `out of scope`

### 3. 提交 `Deanna Troi` memory proposal

```bash
curl -X POST http://127.0.0.1:3001/internal/agent-memory/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
    "sourceAgent": "companion-agent",
    "targetScope": "preferences",
    "kind": "preference",
    "summary": "用户在压力高时更接受温和语气。",
    "rationale": "最近多轮对话里，柔和表述的反馈更好。",
    "sourceTurnRef": "turn-local-check",
    "confidence": 0.78
  }'
```

期望：

- 返回 `proposalId`
- `status: "proposal"`
- 没有 direct write 到 persisted memory item

## Runtime smoke

### 1. 验证 runtime envelope 带上 routing / memory context

```bash
curl -X POST http://127.0.0.1:8788/v1/tasks/execute \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "local-check-1",
    "target": "director-agent",
    "createdAt": "2026-03-22T00:00:00.000Z",
    "trace": {
      "traceId": "trace-local-check-1",
      "source": "mindanchor-gateway",
      "operation": "generate",
      "agentName": "director-agent",
      "workflow": "persona_routing",
      "userId": "demo-user"
    },
    "payload": {
      "kind": "generate",
      "workflow": "persona_routing",
      "frontAgent": "director-agent",
      "runtimeAgentId": "picard-runtime-agent",
      "memoryScopes": ["preferences", "recentContext"],
      "gatewayBaseUrl": "http://127.0.0.1:3001",
      "userPrompt": "{\"contextSource\":\"mixed\"}"
    },
    "mode": "generate"
  }'
```

期望：

- `metadata.workflow === "persona_routing"`
- `metadata.frontAgent === "director-agent"`
- `metadata.runtimeAgentId === "picard-runtime-agent"`
- `metadata.memoryFetch.attempted === true`

### 2. 验证 `Picard` 拥有 routing owner 身份

重点看返回的 `parsed`：

- `currentFrontAgent` 可以不是 `director-agent`
- 但 `visibleSummary` 应体现 `Picard` 在做路由
- mixed 场景下允许：
  - `currentFrontAgent = "companion-agent"`
  - `consultedAgent = "analyst-agent"`

## 本地回归命令

### 定向回归

```bash
corepack pnpm --filter @mindanchor/api exec vitest run \
  tests/agent-memory-service.test.ts \
  tests/agent-memory.integration.test.ts \
  tests/openclaw-native-agent-runtime.test.ts \
  tests/openclaw-local-runtime.test.ts \
  tests/agent-team-service.test.ts
```

### 全量 API 回归

```bash
corepack pnpm --filter @mindanchor/api test
```

## 通过标准

本地联调通过时，至少满足：

- 6 个 persona agent 已由 `openclaw/runtime/agent-registry.mjs` 注册
- `Picard` 是 routing owner，而不是 Gateway 本地硬编码 owner
- Gateway memory 读取只返回 scoped bundle
- Gateway memory 写入只返回 proposal
- runtime metadata 能看见：
  - `workflow`
  - `frontAgent`
  - `runtimeAgentId`
  - `memoryScopes`
  - `memoryFetch`
- 全量 API 测试通过

## 当前落地范围

当前已经落地的是：

- native registry
- Gateway memory context / proposal API
- envelope runtime context
- local runtime memory prefetch
- Picard-owned routing helper

当前还未完全落地的是：

- `Picard -> persona executor` 的更深层 workflow 编排
- `Jarvis` / `Data` 的完整 authority workflow 下沉
- Data-governed proposal 审核闭环在 OpenClaw runtime 内的原生化
