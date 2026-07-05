# MindAnchor 开发交接记录（2026-03-07）

本文档用于在另一台电脑上无缝接续当前开发工作。它覆盖架构结论、当前代码状态、已完成事项、待继续事项、环境准备、启动命令、调试入口、测试结果和建议的下一步。

## 0. 2026-04-22 状态更新

这是一次面向 `M5` 收口的后续更新，优先级高于本文后面的旧时间点描述。

- 当前结论仍是：`M4 已完成，M5 未完成`
- 当前机器已经完成一次 `runtime 恢复 -> health -> direct execute -> Gateway cluster-preferred -> smoke:cluster` 的恢复模拟
- `start-openclaw-runtime-lan` 现在会自动选择兼容 OpenClaw 的 Node；当前实际选中的是 `/Users/claw/.nvm/versions/node/v24.14.0/bin/node`
- `session file locked` 已补同 endpoint 短重试；transport fallback 与 session-lock recovery 都已有 deterministic repro
- `health-openclaw-runtime-lan` 现在不仅检查 loopback，还会检查 env snapshot 里的 `OPENCLAW_BASE_URL/health`
- 当前仍未完成的关键缺口：
  - 第二台机器独立复跑被跳过，cross-machine 仍未完成
  - shell 默认 `MINDANCHOR_DEFAULT_MODEL_*` 仍可能与 `~/.openclaw-dev/openclaw.json` 漂移，手工做 provider-direct 对比时要先对齐
- `corepack pnpm --filter @mindanchor/api test` 已在 `2026-04-22` 复跑通过
- `corepack pnpm test:core-phases:real:aligned -- --phases cluster-preferred --segments runtime-contracts` 已在 `2026-04-22` 复跑通过
- 最新证据文件：
  - `docs/openclaw-production-runtime-smoke-report-2026-04-22.md`
  - `docs/openclaw-production-runtime-manual-verification-2026-04-21.md`
  - `docs/m5-production-runtime-completion-checklist.md`

## 1. 当前项目定位

- 当前仓库已经从“本地工作电脑跑智能体/模型”的方向，收敛为：
  - **客户端只是入口/出口**
  - **OpenClaw 集群才是真正的大脑**
  - **`apps/api` 是 Lobster Gateway / 兼容 API 层**
- 目标拓扑固定为：
  - `Client Apps -> Lobster Gateway -> OpenClaw Cluster -> Storage / Workers / Notification Providers -> Client Apps`
- 当前实现上，`apps/api` 同时承担：
  - 开发期 stub
  - 旧接口兼容层
  - 调试面
  - 未来远程 OpenClaw 集群的接入网关

## 2. 当前工作区结构

- `apps/api`
  - 当前最核心工作区
  - 已具备 Gateway、调试路由、场景种子、回归测试、trace 记录、cluster-first 适配
- `apps/web`
  - 已有 Dashboard / GoalFlow / State Trends / Recovery / Reflections / Inbox / Agent Lab 页面
  - 主要业务页面已切换到正式 read-model 接口
- `apps/desktop`
  - 现存桌面采集器与旧桥接能力保留
  - 目前不是本轮主线开发重点
- `apps/android-recorder`
  - Android 音频 Beta 轨道保留
  - 目前不是主线阻塞项
- `packages/domain`
  - 共享 Zod schema、类型契约、OpenClaw/Gateway 结构定义
- `openclaw`
  - 当前用于存放 OpenClaw 集群侧配置约定、agent manifest、说明文档

## 3. 已确认的核心架构决策

### 3.1 智能中枢位置

- 不在工作电脑部署本地模型
- 不在手机部署业务推理
- 用户可在非工作设备、家用主机、NAS、云主机等位置部署 OpenClaw 集群

### 3.2 Gateway 角色

- `apps/api` 不再是“业务大脑”
- 它负责：
  - 设备注册
  - 事件接收
  - 媒体上传会话管理
  - 旧 REST API 兼容
  - 转发到 OpenClaw 集群
  - 聚合部分读模型
  - 调试、trace、回归验证

### 3.3 Agent 配置规则

- 每个 agent 都保留自己的独立模型配置名
- 当前可临时全部共用同一个 GPT-5.4 提供方
- 变量命名模式固定为：
  - 默认共享配置：`MINDANCHOR_DEFAULT_MODEL_*`
  - 单 agent 配置：`MINDANCHOR_AGENT_<AGENT_NAME>_*`

示例：

- `MINDANCHOR_AGENT_CHIEF_AGENT_MODEL`
- `MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_BASE_URL`
- `MINDANCHOR_AGENT_REFLECTION_COACH_AGENT_REASONING_EFFORT`

### 3.4 模式切换

- `MINDANCHOR_AGENT_MODE=stub`
  - 不调远程模型
  - 本地 deterministic stub 跑完整流程
- `MINDANCHOR_AGENT_MODE=openai-compatible`
  - 走真实 provider / 远程 OpenClaw cluster

### 3.5 集群优先策略

- 一旦设置 `MINDANCHOR_OPENCLAW_BASE_URL`
  - Gateway 会优先调用远程 OpenClaw 集群
- 当集群不可用、返回不可解析、或 schema 不合格时
  - 自动回退到 provider-direct 路径
- Gateway **不会**把 provider API 密钥转发到集群

## 4. 已完成的开发工作

### 4.1 基础网关与领域流程

已经完成并可运行：

- Goal / Task / Session / State / Reflection 主流程
- 旧 MVP 兼容接口
- 设备注册与心跳
- Client Inbox 拉取与 ack
- Health Snapshot 上传与查询
- Media upload session / parts / complete 流程

主要接口已存在：

- `POST /goals`
- `POST /tasks`
- `PATCH /tasks/:taskId`
- `POST /sessions/start`
- `POST /sessions/end`
- `POST /state/signals/batch`
- `POST /state/checkins`
- `GET /state/latest`
- `GET /goalflow/overview`
- `GET /state/trends`
- `GET /recovery/history`
- `GET /dashboard/summary`
- `GET /reflections/latest`
- `GET /reflections/overview`
- `POST /devices/register`
- `POST /devices/heartbeat`
- `POST /media/upload-sessions`
- `POST /media/upload-sessions/:sessionId/parts`
- `POST /media/upload-sessions/:sessionId/complete`
- `GET /client/inbox`
- `GET /client/inbox/overview`
- `POST /client/inbox/:messageId/ack`
- `POST /health/snapshots`
- `GET /health/latest`
- `GET /debug/openclaw/adapter`

### 4.2 每个 agent 独立配置能力

已经完成：

- 默认模型配置解析
- 每个 agent 的独立模型配置覆盖
- 安全审计接口，不泄露密钥

相关入口：

- `GET /debug/agent-configs`

关键文件：

- `/Users/claw/mindanchor/apps/api/src/env.ts`
- `/Users/claw/mindanchor/apps/api/src/app.ts`

### 4.3 Agent 调试入口

已经完成单 agent 调试接口：

- `GET /debug/model-probe/:agentName`
- `GET /debug/agent/chief-route`
- `GET /debug/agent/state-insight`
- `GET /debug/agent/interruption-recovery`
- `GET /debug/agent/reflection`
- `GET /debug/agent/task-management`
- `GET /debug/agent/progress-feedback`
- `GET /debug/agent/automation`

### 4.4 场景种子与完整回归套件

已经完成：

- 调试场景种子写入
- 全量 agent 回归执行
- 单点 probe + 场景 seed + agent debug 的全链路回归

当前场景：

- `focus-recovery-loop`
- `goal-reprioritization`
- `weekly-reflection-mix`

相关接口：

- `GET /debug/scenarios`
- `POST /debug/scenarios/:scenarioId/seed`
- `POST /debug/regressions/full-run`
- `GET /debug/runs`
- `POST /debug/runs/clear`

### 4.5 Matrix 回归与历史对比

已经完成：

- matrix case 定义
- matrix run 执行
- matrix history 存储
- Web Agent Lab 的左右对比视图
- 变化类别高亮：
  - `improved`
  - `regressed`
  - `changed`
  - `added`
  - `removed`
  - `unchanged`

相关接口：

- `GET /debug/regressions/matrix-cases`
- `POST /debug/regressions/matrix-run`
- `GET /debug/regressions/matrix-runs`
- `POST /debug/regressions/matrix-runs/clear`

### 4.6 Trace / Correlation 系统

已经完成：

- `traceId` / `parentTraceId` 贯穿 request、agent debug、matrix、suite
- request header 透传
- trace 日志结构化存储
- trace 查询接口
- Agent Lab Trace Inspector

trace 相关 header：

- `x-mindanchor-trace-id`
- `x-mindanchor-parent-trace-id`
- `x-mindanchor-request-trace-id`
- `x-mindanchor-gateway-source`
- `x-mindanchor-operation`
- `x-mindanchor-agent-name`
- `x-mindanchor-workflow`
- `x-mindanchor-scenario-id`
- `x-mindanchor-user-id`

相关接口：

- `GET /debug/traces/:traceId`

关键文件：

- `/Users/claw/mindanchor/apps/api/src/lib/openclaw-trace.ts`
- `/Users/claw/mindanchor/apps/api/src/lib/trace-logger.ts`
- `/Users/claw/mindanchor/apps/api/src/store.ts`

### 4.7 远程 OpenClaw 集群适配

已经完成基础实现：

- OpenClaw cluster request/response schema
- `OpenClawClusterClient`
- `ModelBridge` cluster-first 调用链
- cluster -> provider fallback 逻辑
- `probe` / `debugJson` / `generateJson` 已支持优先走 cluster

当前兼容的集群端点：

- `/v1/tasks/execute`
- `/tasks/execute`
- `/api/tasks/execute`

关键文件：

- `/Users/claw/mindanchor/apps/api/src/lib/openclaw-cluster-client.ts`
- `/Users/claw/mindanchor/apps/api/src/lib/model-bridge.ts`
- `/Users/claw/mindanchor/packages/domain/src/index.ts`

### 4.8 远程集群适配的测试补强

本轮新增并已通过：

- `cluster-first` 单测
- cluster 返回不合格时回退 provider 的单测
- `probe` 走 cluster 的单测
- trace 头转发与“不转发 provider 鉴权头”的单测
- API 级调试路由联调测试，验证 `/debug/agent/state-insight` 真实走 cluster-first

关键文件：

- `/Users/claw/mindanchor/apps/api/tests/model-bridge.test.ts`
- `/Users/claw/mindanchor/apps/api/tests/api.integration.test.ts`

### 4.9 OpenClaw 集群契约文档

已经补充：

- `POST /v1/tasks/execute` 请求示例
- 返回示例
- 兼容端点说明
- `parsed` / `outputText` 双返回路径说明

关键文件：

- `/Users/claw/mindanchor/openclaw/README.md`

### 4.10 OpenClaw adapter 可视化与 Agent Lab 展示

已经完成：

- `GET /debug/openclaw/adapter`
- adapter route / strategy / fallback reason / cluster attempts 统一建模
- `openclaw.adapter.decision` trace event
- Agent Lab 顶部 adapter 状态卡
- Probe / Debug / Run history 中直接显示 `cluster / provider-direct / provider-fallback / failed`

关键文件：

- `/Users/claw/mindanchor/apps/api/src/app.ts`
- `/Users/claw/mindanchor/apps/api/src/lib/model-bridge.ts`
- `/Users/claw/mindanchor/apps/api/src/lib/openclaw-cluster-client.ts`
- `/Users/claw/mindanchor/apps/api/src/orchestrator.ts`
- `/Users/claw/mindanchor/apps/web/src/pages/AgentLabPage.tsx`

### 4.11 Web 控制台读模型收敛

已经完成：

- `GET /goalflow/overview`
- `GET /state/trends`
- `GET /recovery/history`
- `GET /reflections/overview`
- `GET /client/inbox/overview`
- 对应页面已切到正式读模型而不是前端自行拼原始接口

关键文件：

- `/Users/claw/mindanchor/apps/api/src/app.ts`
- `/Users/claw/mindanchor/apps/api/src/orchestrator.ts`
- `/Users/claw/mindanchor/packages/domain/src/index.ts`
- `/Users/claw/mindanchor/apps/web/src/pages/TasksPage.tsx`
- `/Users/claw/mindanchor/apps/web/src/pages/StatePage.tsx`
- `/Users/claw/mindanchor/apps/web/src/pages/RecoveryPage.tsx`
- `/Users/claw/mindanchor/apps/web/src/pages/ReflectionsPage.tsx`
- `/Users/claw/mindanchor/apps/web/src/pages/InboxPage.tsx`

### 4.12 Web / Cluster smoke 文档与脚本

已经完成：

- Web console read-model 索引文档
- Web console smoke checklist
- 外部 OpenClaw cluster e2e smoke checklist
- `pnpm smoke:web-console`
- `pnpm smoke:cluster`
- `smoke-web-console` 现在会默认为 `demo-user` 做 bootstrap，并检查业务读模型不只是 `2xx`，而且已经有内容
- `prepare-local-cluster-manual-check` 现在会先跑一轮 `smoke-web-console`，再输出 Dashboard / GoalFlow / State / Recovery / Reflections / Inbox 的就绪计数

关键文件：

- `/Users/claw/mindanchor/docs/web-console-read-models.md`
- `/Users/claw/mindanchor/docs/web-console-smoke-checklist.md`
- `/Users/claw/mindanchor/docs/openclaw-cluster-smoke-checklist.md`
- `/Users/claw/mindanchor/docs/openclaw-cluster-first-smoke-report-2026-03-07.md`
- `/Users/claw/mindanchor/scripts/new-openclaw-cluster-smoke-report.sh`
- `/Users/claw/mindanchor/docs/spec.md`
- `/Users/claw/mindanchor/scripts/smoke-web-console.sh`
- `/Users/claw/mindanchor/scripts/smoke-openclaw-cluster.sh`
- `/Users/claw/mindanchor/package.json`

### 4.13 本地最小 OpenClaw 兼容服务

已经完成：

- 本地最小 OpenClaw-compatible execute server
- 支持：
  - `POST /v1/tasks/execute`
  - `POST /tasks/execute`
  - `POST /api/tasks/execute`
- 支持本地 deterministic `parsed` 输出：
  - `chief-agent`
  - `state-insight-agent`
  - `task-management-agent`
  - `progress-feedback-agent`
  - `interruption-recovery-agent`
  - `reflection-coach-agent`
  - `automation-agent`
- 根命令入口：
  - `pnpm dev:openclaw`

关键文件：

- `/Users/claw/mindanchor/openclaw/local-cluster-server.mjs`
- `/Users/claw/mindanchor/openclaw/README.md`
- `/Users/claw/mindanchor/package.json`

### 4.14 本地最小部署 smoke 结果

已经完成：

- 使用本地最小 OpenClaw 兼容服务完成了一次 cluster smoke
- 结果：
  - 直连 `/v1/tasks/execute`：通过
  - Gateway `cluster-preferred`：通过
  - `chief-agent` probe：走 `cluster`
  - `focus-recovery-loop` 场景 seed：通过
  - `state-insight-agent` debug：走 `cluster`
  - `interruption-recovery-agent` debug：走 `cluster`
  - `reflection-coach-agent` debug：走 `cluster`
  - `task-management-agent` debug：走 `cluster`
  - `progress-feedback-agent` debug：走 `cluster`
  - `automation-agent` debug：走 `cluster`
  - smoke 报告前 6 节会自动回填已执行结果，不再只追加原始快照
- 当前结果文件：
  - `/Users/claw/mindanchor/docs/openclaw-cluster-smoke-report-local-2026-03-07.md`

### 4.15 Structured Local Runtime 当前阶段结论

截至 2026-03-07 当前机器，`M3 — Structured Local Runtime` 的第一轮已经完成：

- 本地 runtime 已从单文件兼容脚本收束为：
  - `constants`
  - `contract`
  - `task`
  - `registry`
  - `router`
  - `server`
- 本地 worker 输出已补强为更接近真实业务语义：
  - `state-insight-agent`
  - `interruption-recovery-agent`
  - `reflection-coach-agent`
  - `task-management-agent`
  - `progress-feedback-agent`
  - `automation-agent`
- `smoke-web-console` 现在会默认准备 `demo-user`，并验证业务页不是空壳 `2xx`
- `prepare-local-cluster-manual-check` 现在会先跑 web smoke，再输出：
  - Dashboard taskCount
  - GoalFlow totalTasks
  - State assessments
  - Recovery plans
  - Reflection reports
  - Inbox messages
- Web Console 与 Agent Lab 第一轮中文优先收口已完成

这意味着当前仓库已经具备：

- 本地 cluster 可运行
- 本地 cluster 可调试
- 本地 cluster 可 smoke
- 本地 cluster 可人工验收
- Web / Agent Lab 对路径、原因、历史与业务内容都已更可读

## 5. 当前已验证通过的测试与构建

截至 2026-03-07 当前机器重新验证通过：

- `corepack pnpm --filter @mindanchor/api test`
- `corepack pnpm --filter @mindanchor/api build`
- `corepack pnpm --filter @mindanchor/web build`

已通过状态：

- API 测试：`58` 项通过
- API 构建：通过
- Web 构建：通过

## 6. 当前最重要的代码入口

如果换电脑继续开发，优先从这些文件读起：

- Gateway 主入口
  - `/Users/claw/mindanchor/apps/api/src/app.ts`
- Orchestrator
  - `/Users/claw/mindanchor/apps/api/src/orchestrator.ts`
- 环境变量解析与 agent 独立配置
  - `/Users/claw/mindanchor/apps/api/src/env.ts`
- 远程 OpenClaw cluster client
  - `/Users/claw/mindanchor/apps/api/src/lib/openclaw-cluster-client.ts`
- 模型桥接与 fallback 逻辑
  - `/Users/claw/mindanchor/apps/api/src/lib/model-bridge.ts`
- Trace 头与任务 envelope
  - `/Users/claw/mindanchor/apps/api/src/lib/openclaw-trace.ts`
- Trace logger
  - `/Users/claw/mindanchor/apps/api/src/lib/trace-logger.ts`
- 共享 schema
  - `/Users/claw/mindanchor/packages/domain/src/index.ts`
- Web 调试面 API
  - `/Users/claw/mindanchor/apps/web/src/api.ts`
- Dashboard
  - `/Users/claw/mindanchor/apps/web/src/pages/DashboardPage.tsx`
- GoalFlow
  - `/Users/claw/mindanchor/apps/web/src/pages/TasksPage.tsx`
- State Trends
  - `/Users/claw/mindanchor/apps/web/src/pages/StatePage.tsx`
- Recovery
  - `/Users/claw/mindanchor/apps/web/src/pages/RecoveryPage.tsx`
- Reflections
  - `/Users/claw/mindanchor/apps/web/src/pages/ReflectionsPage.tsx`
- Inbox
  - `/Users/claw/mindanchor/apps/web/src/pages/InboxPage.tsx`
- Agent Lab 页面
  - `/Users/claw/mindanchor/apps/web/src/pages/AgentLabPage.tsx`
- OpenClaw 集群说明
  - `/Users/claw/mindanchor/openclaw/README.md`
- 本地开发说明
  - `/Users/claw/mindanchor/docs/local-development.md`
- Web 控制台读模型索引
  - `/Users/claw/mindanchor/docs/web-console-read-models.md`
- Web 控制台 smoke 清单
  - `/Users/claw/mindanchor/docs/web-console-smoke-checklist.md`
- 外部 OpenClaw cluster smoke 清单
  - `/Users/claw/mindanchor/docs/openclaw-cluster-smoke-checklist.md`

## 7. 在另一台电脑接续开发的步骤

### 7.1 准备代码

把整个仓库拷贝到新机器，例如：

```bash
cd /Users/yourname
cp -R /path/to/mindanchor /Users/yourname/mindanchor
cd /Users/yourname/mindanchor
```

### 7.2 确保 Node 运行时可用

当前仓库依赖 `.tools/node/bin` 下的便携式 Node/runtime。

进入项目后先执行：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm --version
```

如果 `corepack` 不存在，通常是 PATH 没带上；先确认上一行 `export PATH=...` 已执行。

### 7.3 安装依赖

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm install
```

### 7.4 设置环境变量

最少建议先设这些：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
export MINDANCHOR_API_PORT=3001
export MINDANCHOR_DATA_FILE="$PWD/data/mindanchor.json"
export MINDANCHOR_API_URL=http://127.0.0.1:3001
export MINDANCHOR_AGENT_MODE=stub
```

如果要连真实 provider：

```bash
export MINDANCHOR_AGENT_MODE=openai-compatible
export MINDANCHOR_DEFAULT_MODEL_BASE_URL=你的模型兼容地址
export MINDANCHOR_DEFAULT_MODEL_API_KEY=你的密钥
export MINDANCHOR_DEFAULT_MODEL_NAME=gpt-5.4
export MINDANCHOR_DEFAULT_MODEL_WIRE_API=responses
export MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT=xhigh
export MINDANCHOR_DEFAULT_MODEL_DISABLE_RESPONSE_STORAGE=true
```

如果要优先走远程 OpenClaw 集群：

```bash
export MINDANCHOR_OPENCLAW_BASE_URL=http://你的-openclaw-host:端口
```

注意：

- 不要把真实密钥写进仓库
- 推荐只写到本机 shell 配置或本机私有 `.env.local`
- 当前实现支持所有 agent 临时共用一套默认模型配置

### 7.5 启动服务

API：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm dev:api
```

Web：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm dev:web
```

### 7.6 先做自检

启动后优先访问：

- `GET http://127.0.0.1:3001/health`
- `GET http://127.0.0.1:3001/debug/agent-configs`
- `GET http://127.0.0.1:3001/debug/scenarios`

建议顺序：

1. `stub` 模式先确认 API / Web / Agent Lab 都正常
2. 再切 `openai-compatible`
3. 再配置 `MINDANCHOR_OPENCLAW_BASE_URL`
4. 再开始真实集群联调

## 8. 当前最推荐的调试路径

### 8.1 先看 Gateway 是否健康

- `GET /health`

用途：

- 看 agent mode
- 看 topology
- 看 `openClawBaseUrl` 是否生效

### 8.2 再看 agent 配置是否解析正确

- `GET /debug/agent-configs`

用途：

- 确认每个 agent 是否拿到了预期配置
- 确认是否使用了默认配置或单独覆盖
- 不会泄露密钥明文

### 8.3 再跑单 agent 探针

- `GET /debug/model-probe/chief-agent`
- `GET /debug/model-probe/state-insight-agent`

### 8.4 再跑单 agent 调试

- `GET /debug/agent/state-insight`
- `GET /debug/agent/interruption-recovery`
- `GET /debug/agent/reflection`
- `GET /debug/agent/task-management`
- `GET /debug/agent/progress-feedback`
- `GET /debug/agent/automation`

### 8.5 再跑场景与回归

- `POST /debug/scenarios/focus-recovery-loop/seed`
- `POST /debug/regressions/full-run`
- `POST /debug/regressions/matrix-run`

## 9. 目前还没有完成、需要继续的工作

### 9.1 优先级最高

- 用真实外部 OpenClaw cluster 跑完端到端 smoke
  - 当前文档和脚本都已准备好：
    - `docs/openclaw-cluster-smoke-checklist.md`
    - `scripts/smoke-openclaw-cluster.sh`
    - `pnpm smoke:cluster`
  - 需要在真实外部 cluster 环境里完成首次验证
- 验证 cluster-preferred 模式下的真实路径
  - 目标不是“本地 mock cluster 测试通过”
  - 而是确认真实远程 cluster 至少能通过一个执行端点：
    - `/v1/tasks/execute`
    - `/tasks/execute`
    - `/api/tasks/execute`
  - 再通过 Gateway 看到：
    - `cluster`
    - 或 `provider-fallback`
    - 且时间线与 trace 可追踪

### 9.2 中期工作

- 把更多业务结论真正迁移为“由远程 OpenClaw 集群产出”
- 减少 `apps/api` 里的本地 heuristics / stub 对业务结果的主导
- 梳理 `openclaw/` 目录下真正可部署的 agent manifest / skill contract / worker 接口
- 继续把当前 Web 页面读模型做稳，包括后续可能的 Dashboard / ops 验收说明补强

### 9.3 客户端主线仍待继续

- 桌面端统一客户端路线还未真正重构完成
- Android / iOS 的 thin client 路线还处在规划和局部保留状态
- 媒体直传对象存储 + 集群异步处理目前仍是接口和 stub 先行

### 9.4 媒体与健康轨道仍待继续

- 音频 Beta：
  - 目前是可选轨道，非主线阻塞
- 视频 Beta：
  - 目前还是方案与候选模型阶段
- 健康数据：
  - schema 和入口已有基础，但距离真实系统健康中枢接入还有距离

## 10. 已知注意事项

- 当前目录不是 Git 仓库工作树根；不能依赖 `git status` 获取变更历史
- 新机器若执行 `corepack` 报错，大概率是没有先把 `.tools/node/bin` 加入 PATH
- 不要在用户输出或文档中明写真实 provider 密钥
- 当前远程 OpenClaw adapter、Web 读模型与 smoke 工具都已落地
- 但真实外部 OpenClaw cluster 的端到端 smoke 仍需要在真实环境实际执行一次

## 11. 建议的下一步执行顺序

建议严格按下面顺序继续：

1. 新机器先按本文档完成环境恢复
2. 启动 `apps/api`
3. 访问 `/health` 和 `/debug/agent-configs`
4. 在 `stub` 模式执行 `pnpm smoke:web-console`
   - 这一步现在会默认准备 `demo-user`，并验证关键业务页数据不为空
5. 打开 Web，确认 Dashboard / GoalFlow / State / Recovery / Reflections / Inbox / Agent Lab 页面都能访问
6. 切 `openai-compatible`（provider-direct）
7. 跑 `GET /debug/model-probe/chief-agent`
8. 配置 `MINDANCHOR_OPENCLAW_BASE_URL`
9. 执行 `pnpm smoke:cluster`
10. 再回到 Agent Lab 跑 `Probe chief-agent` 和 `/debug/agent/state-insight`
11. 再跑 full regression 和 matrix regression
12. 如果本地链路都稳定，再执行真实外部 OpenClaw cluster smoke
13. 最后开始推进“更多业务结论迁移到远程 cluster 产出”

## 12. 本次交接时的结论

- 项目当前最成熟、最可继续推进的部分是：
  - `apps/api`
  - `packages/domain`
  - `apps/web` 的正式控制台页面
  - `apps/web` 的 Agent Lab 调试面
  - 文档与 smoke 工具链
- 远程 OpenClaw cluster-first 方向已经具备稳定基础
- 当前以“单机 + 非 loopback LAN + 真实 OpenClaw 常驻服务”为目标的 `M4` 已完成
- 现在最值得继续做的是：
  - 继续推进 `M5 — Production OpenClaw Runtime`
  - 按 `docs/m5-production-runtime-completion-checklist.md` 逐项收口
  - 把当前单机 LAN 部署态继续演进为更正式的跨机器 / 云主机部署
  - 最后再继续推进客户端能力接入
- 如果要判断 `M4` 什么时候才算真正完成，直接看：
  - `/Users/claw/mindanchor/docs/m4-cluster-first-completion-checklist.md`
- 如果要判断当前 `M5` 还缺什么、何时才算真正完成，直接看：
  - `/Users/claw/mindanchor/docs/m5-production-runtime-completion-checklist.md`
- 当前 `M5` 已经补齐的基线材料：
  - `/Users/claw/mindanchor/docs/openclaw-production-runtime-deployment.md`
  - `/Users/claw/mindanchor/docs/openclaw-production-runtime-ops-guide.md`
  - `/Users/claw/mindanchor/docs/openclaw-production-runtime-smoke-report-2026-03-08.md`
  - `/Users/claw/mindanchor/docs/openclaw-production-runtime-manual-verification-2026-03-08.md`
