# OpenClaw Phase B Management Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `Picard / Deanna Troi / Spock / Guinan / Jarvis / Data` 这 6 个核心 persona agent 以“原 OpenClaw 可见、可管理、可配置”的形式正式接入，而不破坏当前 MindAnchor 主链。

**Architecture:** 继续保留 `packages/domain -> openclaw/runtime/agent-registry -> apps/api registry-visibility` 这条现有真相链，同时新增一层“OpenClaw 管理接入描述层”和“同步/校验脚本层”。原 OpenClaw 在 Phase B 只接管 management/control-plane，不接管 memory authority 和产品 read model。

**Tech Stack:** TypeScript, Node.js ESM, pnpm monorepo, OpenClaw CLI/profile config, Vitest / node:test, existing Gateway debug endpoints.

## Progress Update (2026-03-28)

- 已完成：
  - Task 1：canonical management descriptor
  - Task 2：repo-side management registry
  - Task 3：management pack export
  - Task 4：safe dry-run / minimum real apply
  - Task 5：doctor
  - Task 6：Gateway `managementIntegration`
  - Task 7：runbook 初版
- 本轮新增完成：
  - 真实 OpenClaw profile home 读取 helper：
    - `openclaw/management/actual-managed-agents.mjs`
  - doctor 已支持：
    - `--profile-home`
  - Gateway 已支持：
    - `MINDANCHOR_OPENCLAW_MANAGEMENT_PROFILE_HOME`
  - Web Agent Lab 已显示 `managementIntegration` 摘要：
    - `apps/web/src/pages/AgentLabPage.tsx`
  - 新增真实 profile 留档脚本：
    - `scripts/run-openclaw-management-alignment.mjs`
  - 新验证已通过：
    - `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
    - `TMPDIR=/Users/claw/mindanchor/tmp/vitest-tmp corepack pnpm --filter @mindanchor/api exec vitest run tests/openclaw-agent-visibility.integration.test.ts --no-file-parallelism`
    - `corepack pnpm --filter @mindanchor/web exec vitest run src/pages/__tests__/agent-lab-registry-smoke.test.tsx`
    - `corepack pnpm --filter @mindanchor/web build`
- 本机真实留档结论：
  - `~/.openclaw-dev` 已完成 persona real apply
  - post-apply 对齐结果：
    - `aligned = true`
    - `actualAgentCount = 14`
    - `extraAgents` 里仍保留 legacy runtime agents
  - post-apply dry-run 结论：
    - 6 个 persona agent 全部 `would_keep`
  - 当前 `aligned` 语义已明确为：
    - 核心 persona 集合存在且字段一致即可
    - legacy extra agents 不再阻塞判定

---

## File Structure

### Existing files to reuse

- `packages/domain/src/agent-team.ts`
  - 当前 persona 元数据的主来源
- `openclaw/runtime/agent-registry.mjs`
  - 当前 native runtime registry
- `openclaw/runtime/agent-registry.d.mts`
  - runtime registry 类型
- `apps/api/src/app.ts`
  - 当前 `registry-visibility` / `agent-configs` debug 出口
- `apps/api/tests/openclaw-agent-visibility.integration.test.ts`
  - 当前 external runtime contract 对齐测试基础
- `openclaw/souls/*.md`
  - persona soul 文本

### New files to create

- `packages/domain/src/openclaw-management.ts`
  - OpenClaw 管理接入描述 schema / helper
- `openclaw/management/agent-management-registry.mjs`
  - 从当前 persona metadata / native registry 生成“原 OpenClaw 管理视图”的 canonical descriptor
- `openclaw/management/agent-management-registry.d.mts`
  - descriptor 类型导出
- `scripts/export-openclaw-management-pack.mjs`
  - 导出当前 6 个 agent 的 management pack（JSON）
- `scripts/apply-openclaw-management-pack.mjs`
  - 把 management pack 同步到指定 OpenClaw profile / workspace
- `scripts/doctor-openclaw-management-pack.mjs`
  - 检查原 OpenClaw 当前实际 agent 管理状态是否与仓库内 registry 对齐
- `scripts/__tests__/openclaw-management-pack.test.mjs`
  - management pack 构建 / 导出 / 对齐的 focused tests
- `docs/runbooks/openclaw-management-integration.md`
  - Phase B 管理接入 runbook

### Existing files to modify

- `packages/domain/src/index.ts`
  - 导出新 schema / type
- `openclaw/runtime/agent-registry.mjs`
  - 明确复用 management descriptor 的字段来源，避免双写漂移
- `apps/api/src/app.ts`
  - 新增 management integration debug endpoint，显示“仓库 registry vs 原 OpenClaw 管理态”差异
- `apps/api/tests/openclaw-agent-visibility.integration.test.ts`
  - 扩展对 management 对齐结果的断言
- `docs/mindanchor-tree-status-2026-03-23.md`
  - 回写 Phase B 进度与验证结果

---

## Chunk 1: Canonical Management Descriptor

### Task 1: Define the OpenClaw management descriptor schema

**Files:**
- Create: `packages/domain/src/openclaw-management.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `scripts/__tests__/openclaw-management-pack.test.mjs`

- [ ] **Step 1: Write the failing test**

Add a test that expects a canonical management descriptor for each of the 6 persona agents, with at least:

- `agentId`
- `runtimeAgentId`
- `displayName`
- `soulFilePath`
- `managementProfileKey`
- `managementWorkspaceName`
- `capabilities`
- `supportedWorkflows`

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
Expected: FAIL because the new schema / exports do not exist yet.

- [ ] **Step 3: Implement minimal schema**

Create `packages/domain/src/openclaw-management.ts` and export:

- management descriptor schema
- `OpenClawManagementAgentDescriptor`
- helper to derive descriptor from current persona metadata

Update `packages/domain/src/index.ts` to export them.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
Expected: PASS for schema existence and basic shape.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/openclaw-management.ts packages/domain/src/index.ts scripts/__tests__/openclaw-management-pack.test.mjs
git commit -m "feat: add openclaw management descriptor schema"
```

## Chunk 2: Repo-Side Management Registry

### Task 2: Build a canonical management registry from current persona metadata

**Files:**
- Create: `openclaw/management/agent-management-registry.mjs`
- Create: `openclaw/management/agent-management-registry.d.mts`
- Modify: `openclaw/runtime/agent-registry.mjs`
- Test: `scripts/__tests__/openclaw-management-pack.test.mjs`

- [ ] **Step 1: Write the failing test**

Add a test asserting:

- 6 management descriptors are emitted
- each descriptor reuses the same `agentId / runtimeAgentId / soulFilePath`
- capabilities match current `canFront / canConsult / canWritePlans / canGovernMemory`

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
Expected: FAIL because `openclaw/management/agent-management-registry.mjs` does not exist.

- [ ] **Step 3: Implement the management registry**

Build a canonical management registry using:

- `packages/domain/src/agent-team.ts`
- current native runtime registry

Then refactor `openclaw/runtime/agent-registry.mjs` so management-facing shared fields come from the same canonical source rather than being re-declared twice.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
Expected: PASS with 6 descriptors and aligned fields.

- [ ] **Step 5: Commit**

```bash
git add openclaw/management/agent-management-registry.mjs openclaw/management/agent-management-registry.d.mts openclaw/runtime/agent-registry.mjs scripts/__tests__/openclaw-management-pack.test.mjs
git commit -m "feat: add canonical openclaw management registry"
```

## Chunk 3: Export and Apply Management Pack

### Task 3: Export a repo-managed OpenClaw agent pack

**Files:**
- Create: `scripts/export-openclaw-management-pack.mjs`
- Test: `scripts/__tests__/openclaw-management-pack.test.mjs`

- [ ] **Step 1: Write the failing test**

Add a test expecting an export command to produce a JSON pack that contains:

- 6 management descriptors
- source version / generatedAt
- soul file references
- OpenClaw profile-facing config fields

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
Expected: FAIL because the export script does not exist.

- [ ] **Step 3: Implement export script**

Create a script that writes a deterministic JSON file, for example:

- `tmp/openclaw-management-pack.json`

The script should not mutate user profile state yet; only export.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
Expected: PASS and export shape is stable.

- [ ] **Step 5: Commit**

```bash
git add scripts/export-openclaw-management-pack.mjs scripts/__tests__/openclaw-management-pack.test.mjs
git commit -m "feat: export openclaw management pack"
```

### Task 4: Apply management pack to a target OpenClaw profile safely

**Files:**
- Create: `scripts/apply-openclaw-management-pack.mjs`
- Test: `scripts/__tests__/openclaw-management-pack.test.mjs`

- [ ] **Step 1: Write the failing test**

Add a test that expects apply logic to:

- read exported management pack
- map each persona agent to a target OpenClaw profile/workspace
- support dry-run mode
- report planned changes without mutating when dry-run is enabled

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
Expected: FAIL because apply script does not exist.

- [ ] **Step 3: Implement minimal apply script**

Implement:

- `--dry-run`
- target profile selection
- clear JSON report of what would be created / updated

Do not yet depend on all runtime behavior migration; this is Phase B management only.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
Expected: PASS for dry-run and report generation.

- [ ] **Step 5: Commit**

```bash
git add scripts/apply-openclaw-management-pack.mjs scripts/__tests__/openclaw-management-pack.test.mjs
git commit -m "feat: add openclaw management pack apply script"
```

## Chunk 4: Management Visibility and Doctoring

### Task 5: Add a management integration doctor script

**Files:**
- Create: `scripts/doctor-openclaw-management-pack.mjs`
- Test: `scripts/__tests__/openclaw-management-pack.test.mjs`

- [ ] **Step 1: Write the failing test**

Add a test expecting doctor output to compare:

- repo management registry
- target OpenClaw managed agents
- missing / extra / mismatched fields

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
Expected: FAIL because doctor script does not exist.

- [ ] **Step 3: Implement minimal doctor**

Doctor report should at least output:

- `missingAgents`
- `extraAgents`
- `fieldMismatches`
- `aligned`

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
Expected: PASS with deterministic doctor summary.

- [ ] **Step 5: Commit**

```bash
git add scripts/doctor-openclaw-management-pack.mjs scripts/__tests__/openclaw-management-pack.test.mjs
git commit -m "feat: add openclaw management pack doctor"
```

### Task 6: Surface management alignment in Gateway debug output

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/tests/openclaw-agent-visibility.integration.test.ts`
- Test: `apps/api/tests/openclaw-agent-visibility.integration.test.ts`

- [ ] **Step 1: Write the failing integration test**

Extend the existing registry visibility integration test to expect a management alignment block, for example:

- `managementIntegration.configured`
- `managementIntegration.aligned`
- `managementIntegration.missingAgents`
- `managementIntegration.fieldMismatches`

- [ ] **Step 2: Run test to verify it fails**

Run: `corepack pnpm --filter @mindanchor/api exec vitest run tests/openclaw-agent-visibility.integration.test.ts --no-file-parallelism`
Expected: FAIL because the management integration block is missing.

- [ ] **Step 3: Implement minimal Gateway debug block**

Expose the doctor summary through a Gateway debug endpoint path that fits current patterns, ideally by extending:

- `/debug/openclaw/registry-visibility`

Avoid creating a separate truth source; reuse the management registry / doctor outputs.

- [ ] **Step 4: Run test to verify it passes**

Run: `corepack pnpm --filter @mindanchor/api exec vitest run tests/openclaw-agent-visibility.integration.test.ts --no-file-parallelism`
Expected: PASS with the new management alignment block.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/app.ts apps/api/tests/openclaw-agent-visibility.integration.test.ts
git commit -m "feat: expose openclaw management integration status"
```

## Chunk 5: Runbook and Phase Exit

### Task 7: Add runbook and phase exit checklist

**Files:**
- Create: `docs/runbooks/openclaw-management-integration.md`
- Modify: `docs/mindanchor-tree-status-2026-03-23.md`

- [ ] **Step 1: Write the runbook**

Document:

- how to export the management pack
- how to dry-run apply it
- how to inspect alignment
- how to verify the 6 persona agents are visible in original OpenClaw

- [ ] **Step 2: Update tree-status progress**

Add:

- Phase B task progress
- current completed / remaining packets
- exact verification artifacts

- [ ] **Step 3: Verify docs are internally consistent**

Run:

```bash
rg -n "Phase B|management pack|OpenClaw 管理接入|registry-visibility" docs/superpowers/specs/2026-03-19-mindanchor-v1-commercial-delivery-design.md docs/mindanchor-tree-status-2026-03-23.md docs/runbooks/openclaw-management-integration.md
```

Expected:

- all three docs describe the same Phase B boundaries

- [ ] **Step 4: Commit**

```bash
git add docs/runbooks/openclaw-management-integration.md docs/mindanchor-tree-status-2026-03-23.md
git commit -m "docs: add openclaw management integration runbook"
```

---

## Success Criteria

Phase B is considered complete only when:

- 6 persona agents have a canonical management descriptor
- repo can export a deterministic OpenClaw management pack
- apply script supports safe dry-run and explicit target profile
- doctor script can prove alignment / misalignment
- Gateway debug output surfaces management alignment
- runbook exists and points to exact verification steps

## Verification Summary

Minimum verification set for this plan:

- `node --test scripts/__tests__/openclaw-management-pack.test.mjs`
- `corepack pnpm --filter @mindanchor/api exec vitest run tests/openclaw-agent-visibility.integration.test.ts --no-file-parallelism`
- one dry-run management pack apply against the chosen OpenClaw profile

## Recommended Execution Order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7

This order keeps the truth source stable first, then export/apply tooling, then Gateway visibility, then documentation.
