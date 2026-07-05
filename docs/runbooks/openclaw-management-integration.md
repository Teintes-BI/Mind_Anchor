# OpenClaw 管理接入 Runbook

## 目标

这份 runbook 对应：

- `B 档：运行接入`
- `Phase B｜OpenClaw 管理接入`

当前阶段的目标不是让原 OpenClaw 立刻接管全部运行链，而是先把这 6 个核心 persona agent 做成：

- 原 OpenClaw 中可见
- 可管理
- 可配置
- 可做 dry-run 对齐检查

当前覆盖对象：

- `Picard`
- `Deanna Troi`
- `Spock`
- `Guinan`
- `Jarvis`
- `Data`

## 当前真相源

当前管理接入的真相源顺序固定为：

1. `packages/domain/src/agent-team.ts`
2. `packages/domain/src/openclaw-management.ts`
3. `openclaw/management/agent-management-registry.mjs`
4. `openclaw/runtime/agent-registry.mjs`

如果这几层内容不一致，应以更上游的共享定义为准，而不是手改下游脚本输出。

## 前置条件

- 工作目录：`/Users/claw/mindanchor`
- Node / pnpm 可用
- 已完成：
  - `corepack pnpm --filter @mindanchor/domain build`
- 若要继续接入原 OpenClaw profile：
  - 本机已有 OpenClaw CLI
  - 已有一个可用的 profile，例如 `openclaw-dev`

## 第一步：导出 management pack

执行：

```bash
node scripts/export-openclaw-management-pack.mjs tmp/openclaw-management-pack.json
```

期望：

- 生成：
  - `tmp/openclaw-management-pack.json`
- 其中至少包含：
  - `schemaVersion`
  - `generatedAt`
  - `managementProfileKey`
  - `agents`

当前 pack 中每个 agent 至少应带：

- `agentId`
- `runtimeAgentId`
- `displayName`
- `soulFilePath`
- `managementWorkspaceName`
- `capabilities`
- `supportedWorkflows`

## 第二步：做 dry-run apply

执行：

```bash
node scripts/apply-openclaw-management-pack.mjs \
  tmp/openclaw-management-pack.json \
  tmp/openclaw-management-apply-report.json
```

如需显式指定目标 profile key：

```bash
node scripts/apply-openclaw-management-pack.mjs \
  --profile-key openclaw-dev \
  tmp/openclaw-management-pack.json \
  tmp/openclaw-management-apply-report.json
```

当前行为说明：

- 默认是 **dry-run**
- 当前不会直接修改用户 profile
- 只会生成“如果要同步，会同步什么”的计划报告

如果要进入真实 apply，目前支持的安全边界是：

```bash
node scripts/apply-openclaw-management-pack.mjs \
  --apply \
  --profile-home /absolute/path/to/openclaw-profile-home \
  tmp/openclaw-management-pack.json \
  tmp/openclaw-management-apply-report.json
```

当前真实 apply 的边界固定为：

- 会**创建缺失 agent**
- 会补最小：
  - `workspace`
  - `agentDir`
  - `auth-profiles.json`
- 如果已有 agent 只存在 `name / workspace / agentDir` 这类安全字段漂移
  - 当前会自动修正
  - 报告中会标成：
    - `updated_safe_fields`
- 如果存在更高风险差异（例如模型绑定差异）
  - 默认不会静默覆盖
  - 报告中会标成：
    - `blocked_update`
- 当前首个显式确认更新入口已经支持：
  - `--confirm-model-update`
  - 当且仅当你显式传入这个开关时，`model` 差异才允许自动更新
  - 这类更新在报告中会标成：
    - `updated_confirmed_fields`

期望：

- 生成：
  - `tmp/openclaw-management-apply-report.json`
- 报告中至少包含：
  - `dryRun`
  - `targetProfileKey`
  - `agentPlans`

当前 dry-run 下，agent plan 现在会按实际情况显示：

- `would_create`：目标 profile 中还没有这个 agent
- `would_update_safe_fields`：只有 `name / workspace / agentDir` 这类安全字段漂移
- `would_update`：存在更高风险差异，当前不会直接自动覆盖
- `would_update_confirmed_fields`：存在已确认可更新的高风险字段（当前首个支持的是 `model`）
- `would_keep`：当前已对齐

## 第三步：做 management doctor 对齐检查

执行：

```bash
node scripts/doctor-openclaw-management-pack.mjs \
  tmp/openclaw-management-pack.json \
  tmp/openclaw-management-pack.json \
  tmp/openclaw-management-doctor-report.json
```

说明：

- 第二个参数当前可传：
  - 纯 agent 数组 JSON
  - 或完整 pack JSON
- 当前最小样板里，为了验证 doctor 本身可用，直接拿同一份 pack 自比对

如果你已经有真实 OpenClaw profile home，当前也可以直接从 profile 读：

```bash
node scripts/doctor-openclaw-management-pack.mjs \
  --profile-key openclaw-dev \
  --profile-home /absolute/path/to/openclaw-profile-home \
  tmp/openclaw-management-pack.json \
  tmp/openclaw-management-doctor-report.json
```

这条链当前会：

- 读取 `openclaw.json`
- 提取 `agents.list`
- 用仓库内 canonical persona registry 补齐已知 agent 的管理描述
- 用真实 `workspace` 路径反推出 `managementWorkspaceName`

期望：

- 生成：
  - `tmp/openclaw-management-doctor-report.json`
- 报告中至少包含：
  - `aligned`
  - `missingAgents`
  - `extraAgents`
  - `fieldMismatches`

如果当前是 pack 自比对，期望：

- `aligned = true`
- `missingAgents = []`
- `extraAgents = []`
- `fieldMismatches = []`

## 第四步：从 Gateway 查看 managementIntegration 状态

如果你已经让 Gateway 指向一份“实际管理态”文件，可以设置：

```bash
export MINDANCHOR_OPENCLAW_MANAGEMENT_ACTUAL_PATH=/absolute/path/to/actual-managed-agents.json
```

如果你已经有真实 OpenClaw profile home，当前更推荐直接设置：

```bash
export MINDANCHOR_OPENCLAW_MANAGEMENT_PROFILE_HOME=/absolute/path/to/openclaw-profile-home
```

当前优先级固定为：

1. `MINDANCHOR_OPENCLAW_MANAGEMENT_PROFILE_HOME`
2. `MINDANCHOR_OPENCLAW_MANAGEMENT_ACTUAL_PATH`

然后启动 API，并访问：

```bash
curl http://127.0.0.1:3001/debug/openclaw/registry-visibility
```

当前期待返回中新增一块：

- `managementIntegration`

它至少包含：

- `configured`
- `targetProfileKey`
- `aligned`
- `expectedAgentCount`
- `actualAgentCount`
- `missingAgents`
- `extraAgents`
- `fieldMismatches`

这块的定位是：

- 不替代现有 `externalRuntime` contract 对齐
- 而是补一层“原 OpenClaw 管理态是否和仓库内 persona 定义一致”
- 当前已经支持直接读取真实 OpenClaw profile home，而不再只依赖手工准备的 actual JSON 文件

## 当前已通过的验证

### Focused tests

```bash
corepack pnpm --filter @mindanchor/domain build
node --test scripts/__tests__/openclaw-management-pack.test.mjs
```

### Gateway integration

如果本机临时目录空间不足，建议显式指定：

```bash
mkdir -p tmp/vitest-tmp
TMPDIR=/Users/claw/mindanchor/tmp/vitest-tmp \
corepack pnpm --filter @mindanchor/api exec vitest run \
  tests/openclaw-agent-visibility.integration.test.ts \
  --no-file-parallelism
```

### API build

```bash
corepack pnpm --filter @mindanchor/api build
```

## 当前阶段完成标准

Phase B 当前这一步能算“已达到基础可用”，至少要满足：

- management descriptor 已有共享 schema
- repo-side management registry 已可生成
- management pack 可稳定导出
- apply dry-run 可稳定生成计划报告
- doctor 可稳定生成对齐报告
- Gateway `registry-visibility` 已可带出 `managementIntegration`
- doctor 与 Gateway 都已支持直接读取真实 OpenClaw profile home

## 当前尚未完成的部分

当前还**没有**完成的内容包括：

- 真正写入并更新原 OpenClaw profile/workspace
- 在原 OpenClaw 控制面中真实确认 6 个 agent 可见
- 把 managementIntegration 继续带进 Web Agent Lab
- Phase B 的完整“实际接入验证”留档

也就是说：

- 当前已经进入“管理接入基础设施就位”
- 但还没到“原 OpenClaw 管理面已经完全接通并验收完毕”

## 推荐下一步

当前最自然的下一步固定为：

1. 选择一份真实的原 OpenClaw profile 作为目标
2. 先用 `--profile-home` 和 `MINDANCHOR_OPENCLAW_MANAGEMENT_PROFILE_HOME` 走一遍真实管理态对齐
3. 继续把 apply 从 `dry-run` 推进到真实同步
4. 把 `managementIntegration` 接进 Web / Agent Lab

## 当前已留档的真实样例

当前仓库已经新增一条更适合留档的包装脚本：

```bash
node scripts/run-openclaw-management-alignment.mjs \
  --profile-key openclaw-dev \
  --profile-home "$HOME/.openclaw-dev" \
  tmp/openclaw-management-pack.real.json \
  tmp/openclaw-management-profile-alignment-report.real.json
```

这条命令会一次产出：

- management pack
- 真实 profile 对齐报告

当前本机最近一轮真实结果是：

- 产物：
  - `tmp/openclaw-management-pack.real.json`
  - `tmp/openclaw-management-profile-alignment-report.real.json`
  - `tmp/openclaw-management-apply-report.real.json`
- 当前结论：
  - `aligned = true`
  - `expectedAgentCount = 6`
  - `actualAgentCount = 14`
  - 当前 `~/.openclaw-dev` 里同时存在两类 agent：
    - 新接入的 6 个 persona agent
    - 旧的运行型 agent
  - 当前 doctor 的 `aligned` 语义已经调整为：
    - **只要 6 个 persona agent 全部存在且字段无漂移，就视为核心对齐**
    - legacy extra agents 继续保留在 `extraAgents` 里上报，但不再阻塞 `aligned`
  - 当前 `extraAgents` 仍包括旧运行型 agent：
    - `chief-agent`
    - `state-insight-agent`
    - `task-management-agent`
    - `progress-feedback-agent`
    - `interruption-recovery-agent`
    - `reflection-coach-agent`
    - `automation-agent`
- 当前 post-apply dry-run 结果：
  - 6 个 persona agent 全部为 `would_keep`

这说明：

- 当前 Phase B 的基础设施已经够用
- 而且真实 `openclaw-dev` profile 已经进入 persona 管理态
- 下一步重点不再是“写不写进去”
- 而是：
  - 在原 OpenClaw 控制面里实际确认可见
  - 再把这层管理态作为 Web / Agent Lab 的正式验收面

## 原 OpenClaw 控制面验收（已实跑）

为了做这一步验收，这次本机临时使用了：

```bash
openclaw --dev gateway run --force --auth none --allow-unconfigured
```

说明：

- 这是**本机 loopback 验证用**启动方式
- 目的是让官方 Dashboard 能在本机打开并验收 agent 可见性
- 这不是最终生产安全配置
- 正式长期运行时仍应补上 gateway auth

本机这次实际结果：

- Dashboard URL：
  - `http://127.0.0.1:19001/`
- `GET /health`：
  - `{"ok":true,"status":"live"}`
- 已进入官方 `代理 /agents` 页面
- 当前 `Agent` 下拉中，已经能直接看到：
  - `director-agent`
  - `companion-agent`
  - `analyst-agent`
  - `balance-agent`
  - `life-secretary-agent`
  - `memory-governor-agent`
- 还实际切换验证了：
  - `director-agent`
  - 当前显示 workspace：
    - `/Users/claw/.openclaw-dev/workspaces/picard-runtime-agent`
  - 当前显示 model：
    - `codex/gpt-5.4@codex:manual`

这说明：

- 6 个 persona agent 不只是写进了 profile 文件
- 也已经能在原 OpenClaw 官方控制面里真实被枚举和切换查看

## 官方 Persona Workspace 同步（已实跑）

为了让原 OpenClaw 官方 runtime 真正按 MindAnchor persona 工作，这次又新增并实跑了：

```bash
node scripts/sync-openclaw-persona-workspaces.mjs --profile-home "$HOME/.openclaw-dev"
```

当前动作包括：

- 把仓库内 `openclaw/souls/*.md` 同步到官方 workspace 的 `SOUL.md`
- 写入固定人格的 `IDENTITY.md`
- 写入 MindAnchor 上下文的 `USER.md`
- 更新 `AGENTS.md`，明确当前 workspace 已是 canonical persona runtime
- 删除旧的 `BOOTSTRAP.md`，避免继续走“你是谁”式通用初始化

本机这次已同步：

- `director-agent -> ~/.openclaw-dev/workspaces/picard-runtime-agent`
- `companion-agent -> ~/.openclaw-dev/workspaces/troi-runtime-agent`
- `analyst-agent -> ~/.openclaw-dev/workspaces/spock-runtime-agent`
- `balance-agent -> ~/.openclaw-dev/workspaces/guinan-runtime-agent`
- `life-secretary-agent -> ~/.openclaw-dev/workspaces/jarvis-runtime-agent`
- `memory-governor-agent -> ~/.openclaw-dev/workspaces/data-runtime-agent`

## 官方 Persona Turn 验收（已实跑）

同步后，本机又实际运行了一次官方 persona turn：

```bash
openclaw --dev agent \
  --agent director-agent \
  --message '我现在有点乱，今天到底应该先做什么？' \
  --json \
  --local
```

当前真实结果：

- `director-agent` 已不再先问“我是谁”
- 已开始按 Picard 的协调/收束角色给出可执行建议
- 说明官方 runtime 里的 persona workspace 已经开始生效

这一步的意义是：

- Phase B 不只是“管理面可见”
- 还已经进一步进入：
  - 官方 runtime 的 persona 语气与职责开始对齐
  - 为后面的 Phase C 真实前台桥接做好了地基
