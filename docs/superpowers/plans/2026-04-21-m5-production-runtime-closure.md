# M5 Production Runtime Closure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 MindAnchor 当前 `M5 — Production OpenClaw Runtime` 从“单机可跑的过渡态”推进到“单用户自部署生产版可验收完成态”，优先完成 `POST /v1/tasks/execute` 的结构稳定性与 7 个核心 agent 的真实 runtime 可重复验收，再收并发/session/fallback、跨机器恢复和最终发布材料。

**Architecture:** 先把 runtime 侧 execute contract 提升为第一优先级，把“成功返回但结构不稳定”的问题收口在 `openclaw` 层，而不是继续让 Gateway 靠 normalize/fallback 兜底。随后在不改变产品主链的前提下，补强 session/concurrency/fallback 观测与收敛，再做跨机器恢复与最终 smoke/doc 对齐，形成完整 M5 闭环。

**Tech Stack:** Node.js 22, TypeScript, Fastify, Vitest, pnpm, OpenClaw local/production runtime, Gateway trace/debug APIs, shell runbooks

---

## Scope Freeze

**In scope**

- `POST /v1/tasks/execute` 的稳定承接
- 7 个核心 agent 的返回结构一致性
- runtime 内部 contract 校验、结构化错误、metadata/trace 稳定性
- 并发 / session / fallback 观测与收口
- 单用户跨机器单节点恢复验收
- M5 smoke / docs / checklist / 结论统一

**Out of scope**

- 多租户、多节点编排、平台化能力
- Android / iOS 正式版
- 新的产品功能扩展
- 大规模 UI 重构

**Authoritative references**

- `docs/m5-production-runtime-completion-checklist.md`
- `tasks.md`
- `docs/spec.md`
- `docs/development-handoff-2026-03-07.md`
- `docs/openclaw-production-runtime-deployment.md`
- `docs/openclaw-production-runtime-ops-guide.md`
- `docs/core-phase-test-runbook.md`

---

## File Map

### Runtime core

- Modify: `openclaw/local-runtime/server.mjs`
  - 统一 `POST /v1/tasks/execute` 返回封装
  - 调用每个 agent/workflow 的 response contract normalize + validate
  - 让不可修复的成功响应转为结构化失败
- Modify: `openclaw/production-runtime-server.mjs`
  - 保持 canonical 入口最薄，但补必要的启动/health 约束说明
- Create: `openclaw/runtime/execute-contracts.mjs`
  - 维护 7 个核心 agent 的 `mode/workflow -> parsed schema/normalize/fallback/error policy`
- Create: `openclaw/runtime/execute-contracts.d.mts`
  - 若仓库已有同类 `.d.mts` 风格，则补类型声明以保持一致

### Shared schema / contract surface

- Modify: `packages/domain/src/index.ts`
  - 补 runtime execute envelope / metadata / agent parsed payload 的稳定 schema（若值得共享）
  - 保证 API、测试、Web 调试面可共用同一份 contract
- Modify: `packages/domain/package.json`
  - 若新增 shared schema 文件，仅保持现有 build 路径可工作

### Gateway integration / observability

- Modify: `apps/api/src/lib/model-bridge.ts`
  - 收紧 cluster 成功响应的验收逻辑
  - 明确 runtime contract failure 与 provider fallback 的区分
- Modify: `apps/api/src/lib/openclaw-cluster-client.ts`
  - 记录 contract mismatch / selected endpoint / runtime metadata
- Modify: `apps/api/src/app.ts`
  - 如有必要，在 debug adapter status 中暴露更精确的 runtime contract failure 原因

### Tests

- Modify: `apps/api/tests/openclaw-local-runtime.test.ts`
  - 7 个核心 agent 的 execute contract matrix 测试
- Modify: `apps/api/tests/api.integration.test.ts`
  - Gateway 消费 runtime 返回结构的稳定性测试
- Modify: `apps/api/tests/model-bridge.test.ts`
  - cluster success but malformed payload 的分类测试
- Modify: `scripts/__tests__/openclaw-production-runtime-entrypoint.test.mjs`
  - canonical runtime 入口存在性与最小约束
- Modify: `scripts/__tests__/openclaw-mainline-acceptance-report.test.mjs`
  - 如最终报告格式新增 runtime contract 统计，则同步更新

### Runtime operations / smoke / deployment

- Modify: `scripts/run-core-phase-tests.mjs`
  - 增加 runtime contract mismatch 统计或失败分类
- Modify: `scripts/smoke-openclaw-cluster.sh`
  - smoke 中加入 7 agent contract spot check
- Modify: `scripts/preflight-v1-stack.sh`
  - 补必要的 runtime execute contract preflight（若低成本）
- Modify: `scripts/start-openclaw-runtime-lan.sh`
  - 如需要，补启动时 contract mode / env 快照输出
- Modify: `scripts/health-openclaw-runtime-lan.sh`
  - 补最小 contract health probe

### Docs

- Modify: `docs/m5-production-runtime-completion-checklist.md`
- Modify: `tasks.md`
- Modify: `docs/openclaw-production-runtime-deployment.md`
- Modify: `docs/openclaw-production-runtime-ops-guide.md`
- Modify: `docs/core-phase-test-runbook.md`
- Create: `docs/openclaw-production-runtime-smoke-report-YYYY-MM-DD.md`
- Create: `docs/openclaw-production-runtime-manual-verification-YYYY-MM-DD.md`

---

## Chunk 1: Runtime Execute Contract Stabilization

### Task 1: Capture the current execute contract matrix

**Files:**
- Modify: `apps/api/tests/openclaw-local-runtime.test.ts`
- Reference: `docs/m5-production-runtime-completion-checklist.md`
- Reference: `tasks.md`

- [ ] **Step 1: Add a contract inventory table inside the test file comments or helper constants**

List the 7 core agents and their expected stable `parsed` shape:

- `chief-agent`
- `state-insight-agent`
- `task-management-agent`
- `progress-feedback-agent`
- `interruption-recovery-agent`
- `reflection-coach-agent`
- `automation-agent`

- [ ] **Step 2: Write one failing contract test per core agent**

Each test should assert:

- HTTP 200
- `success === true`
- `taskId` exists
- `trace.traceId` exists
- `metadata.runtime` / `metadata.runtimeVersion` / `metadata.worker` / `metadata.agent` / `metadata.mode` are present
- `parsed` contains the minimum required business fields for that agent

- [ ] **Step 3: Run the targeted runtime test file and confirm the new contract assertions fail where the structure is currently unstable**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run tests/openclaw-local-runtime.test.ts
```

Expected:

- At least one new assertion fails for malformed or under-specified success payloads

- [ ] **Step 4: Document the actual mismatch categories you observe**

Record concrete categories:

- missing top-level metadata field
- wrong `parsed` field name
- `parsed` missing required business field
- runtime success response present but not consumable by Gateway

- [ ] **Step 5: Commit the red test baseline**

```bash
git add apps/api/tests/openclaw-local-runtime.test.ts
git commit -m "test: capture runtime execute contract gaps"
```

### Task 2: Introduce a runtime-side contract enforcement module

**Files:**
- Create: `openclaw/runtime/execute-contracts.mjs`
- Create: `openclaw/runtime/execute-contracts.d.mts`
- Modify: `openclaw/local-runtime/server.mjs`
- Modify: `packages/domain/src/index.ts`

- [ ] **Step 1: Create the failing import path in runtime**

In `openclaw/local-runtime/server.mjs`, add the import for the future contract helper and wire one call site around `buildParsedPayload(...)`.

- [ ] **Step 2: Run the focused test to confirm module-missing or contract-missing failure**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run tests/openclaw-local-runtime.test.ts
```

Expected:

- Failure caused by missing helper or missing enforcement path

- [ ] **Step 3: Implement `openclaw/runtime/execute-contracts.mjs` with a registry keyed by `target`**

The registry should define, for each core agent:

- minimum required `parsed` fields
- normalize function
- default fill strategy
- irreparable failure rule

Suggested shape:

```js
export const runtimeExecuteContracts = {
  "state-insight-agent": {
    normalize(parsed, context) { ... },
    validate(parsed) { ... },
  },
};
```

- [ ] **Step 4: Keep normalization conservative**

Rules:

- do not invent semantically rich content if no source exists
- do fill stable mechanical defaults where a field is structurally required
- if the response is not safely normalizable, return a structured runtime error instead of `success: true`

- [ ] **Step 5: Optionally promote shared schemas into `packages/domain/src/index.ts`**

If shared schemas reduce duplication between runtime and API tests, add:

- execute success envelope schema
- execute metadata schema
- 7 core agent `parsed` schemas

- [ ] **Step 6: Run the runtime test file again**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run tests/openclaw-local-runtime.test.ts
```

Expected:

- the previously failing contract tests now pass

- [ ] **Step 7: Commit**

```bash
git add openclaw/runtime/execute-contracts.mjs openclaw/runtime/execute-contracts.d.mts openclaw/local-runtime/server.mjs packages/domain/src/index.ts apps/api/tests/openclaw-local-runtime.test.ts
git commit -m "feat: enforce runtime execute contracts"
```

### Task 3: Make irreparable success payloads fail explicitly

**Files:**
- Modify: `openclaw/local-runtime/server.mjs`
- Modify: `apps/api/tests/openclaw-local-runtime.test.ts`
- Modify: `apps/api/tests/model-bridge.test.ts`

- [ ] **Step 1: Add a failing test for malformed success payloads**

Test expectation:

- runtime should not return HTTP 200 + `success: true` if required `parsed` fields cannot be normalized
- runtime should return structured error metadata, for example:
  - `success: false`
  - `metadata.errorCode`
  - `metadata.contractTarget`
  - `metadata.contractFailureReason`

- [ ] **Step 2: Run the malformed-payload tests and confirm failure**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run tests/model-bridge.test.ts tests/openclaw-local-runtime.test.ts
```

- [ ] **Step 3: Implement explicit runtime-side error mapping**

Behavior:

- contract mismatch caused by runtime payload shape -> runtime error
- network / unavailable runtime -> cluster transport failure
- Gateway may still fallback, but the adapter reason must distinguish these classes

- [ ] **Step 4: Re-run the focused tests**

Expected:

- structured runtime contract failures are visible and correctly classified

- [ ] **Step 5: Commit**

```bash
git add openclaw/local-runtime/server.mjs apps/api/tests/openclaw-local-runtime.test.ts apps/api/tests/model-bridge.test.ts
git commit -m "feat: surface runtime contract failures explicitly"
```

---

## Chunk 2: Gateway Consumption and Read-Model Safety

### Task 4: Tighten Gateway cluster success acceptance

**Files:**
- Modify: `apps/api/src/lib/model-bridge.ts`
- Modify: `apps/api/src/lib/openclaw-cluster-client.ts`
- Modify: `apps/api/tests/model-bridge.test.ts`

- [ ] **Step 1: Add failing tests for cluster 200 responses that still should not be treated as valid business success**

Cases:

- `success: true` but invalid `parsed`
- missing `metadata.worker`
- mismatched `metadata.agent`
- empty `parsed` object for a contract that requires fields

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run tests/model-bridge.test.ts
```

- [ ] **Step 3: Update `model-bridge.ts` so cluster success requires contract-compliant payload**

Rules:

- accept cluster response only if runtime contract is satisfied
- classify invalid cluster business success as `cluster_contract_failure`
- preserve `selectedEndpoint`, `traceId`, `clusterAttempts`

- [ ] **Step 4: Update adapter decision bookkeeping**

`/debug/openclaw/adapter` and timeline should be able to distinguish:

- `cluster`
- `provider-direct`
- `provider-fallback`
- runtime contract failure that triggered fallback

- [ ] **Step 5: Re-run the model bridge tests**

Expected:

- invalid cluster payloads are not silently accepted

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/lib/model-bridge.ts apps/api/src/lib/openclaw-cluster-client.ts apps/api/tests/model-bridge.test.ts
git commit -m "feat: tighten gateway acceptance of runtime payloads"
```

### Task 5: Verify 7 core agents remain consumable by Gateway read models

**Files:**
- Modify: `apps/api/tests/api.integration.test.ts`
- Modify: `apps/api/tests/state-read-model-refresh.test.ts`

- [ ] **Step 1: Add one integration assertion per critical read-model chain**

Minimum coverage:

- `dashboard/summary`
- `goalflow/overview`
- `state/trends`
- `recovery/history`
- `reflections/overview`
- `client/inbox/overview`

- [ ] **Step 2: Make each test assert the returned runtime-originated data is structurally stable**

Example:

- no missing headline fields
- no missing IDs
- no `undefined` where the current UI assumes string/number/array

- [ ] **Step 3: Run the integration suites**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run tests/api.integration.test.ts tests/state-read-model-refresh.test.ts
```

- [ ] **Step 4: Fix any runtime-to-Gateway contract mismatch exposed by these tests**

Prefer fixing in runtime contract enforcement, not adding more Gateway heuristics.

- [ ] **Step 5: Commit**

```bash
git add apps/api/tests/api.integration.test.ts apps/api/tests/state-read-model-refresh.test.ts
git commit -m "test: lock gateway read models to stable runtime contracts"
```

---

## Chunk 3: Execute Stability Beyond Shape

### Task 6: Add structured metrics for runtime contract mismatch, timeout, and fallback

**Files:**
- Modify: `apps/api/src/lib/model-bridge.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `scripts/run-core-phase-tests.mjs`
- Modify: `docs/core-phase-test-runbook.md`

- [ ] **Step 1: Add failing tests or report assertions for new failure categories**

Need counts for:

- contract mismatch
- runtime timeout
- runtime HTTP 500
- provider fallback after contract mismatch

- [ ] **Step 2: Expose those categories in adapter status and phased report**

At minimum:

- recent timeline entries
- aggregate reason counts
- report markdown summary

- [ ] **Step 3: Re-run focused tests and report generators**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run tests/model-bridge.test.ts
corepack pnpm exec vitest run scripts/__tests__/core-phase-report-files.test.mjs
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/lib/model-bridge.ts apps/api/src/app.ts scripts/run-core-phase-tests.mjs docs/core-phase-test-runbook.md
git commit -m "feat: classify runtime execute failures in reports"
```

### Task 7: Soak-test the 7 core agents under real cluster-preferred conditions

**Files:**
- Modify: `scripts/smoke-openclaw-cluster.sh`
- Modify: `scripts/run-core-phase-tests.mjs`
- Create: `docs/openclaw-production-runtime-smoke-report-YYYY-MM-DD.md`

- [ ] **Step 1: Add a focused 7-agent contract spot-check mode to smoke**

The smoke should call all 7 core agents in a deterministic way and fail if any `parsed` contract is not satisfied.

- [ ] **Step 2: Add a phased-run segment dedicated to runtime contract stability**

Suggested segment name:

- `runtime-contracts`

- [ ] **Step 3: Run local contract smoke first**

Run:

```bash
corepack pnpm smoke:cluster
corepack pnpm test:core-phases:local -- --segments runtime-contracts
```

- [ ] **Step 4: Run real aligned contract smoke**

Run:

```bash
corepack pnpm test:core-phases:real:aligned -- --phases cluster-preferred --segments runtime-contracts
```

- [ ] **Step 5: Save the observed result into a dated smoke report**

Include:

- runtime base URL
- Gateway base URL
- 7 agent result matrix
- any fallback reasons
- final pass/fail conclusion

- [ ] **Step 6: Commit**

```bash
git add scripts/smoke-openclaw-cluster.sh scripts/run-core-phase-tests.mjs docs/openclaw-production-runtime-smoke-report-YYYY-MM-DD.md
git commit -m "test: add runtime contract smoke for m5"
```

### Task 8: Only after shape stability is green, tackle concurrency/session/fallback

**Files:**
- Modify: `openclaw/local-runtime/server.mjs`
- Modify: `scripts/health-openclaw-runtime-lan.sh`
- Modify: `docs/openclaw-production-runtime-ops-guide.md`

- [ ] **Step 1: Capture the current concurrency/session failure evidence**

Use real logs and adapter history:

- `.logs/openclaw-real-lan.log`
- `.logs/api-real-lan.log`
- `/debug/openclaw/adapter`

- [ ] **Step 2: Add targeted tests or reproduction script for high-frequency session/fallback failures**

Prefer a deterministic repro over random soak.

- [ ] **Step 3: Implement the smallest runtime-side fix**

Possible scope:

- per-agent serialization
- session path isolation
- retry/backoff only around known lock failure

- [ ] **Step 4: Re-run the targeted repro and core runtime contract smoke**

- [ ] **Step 5: Commit**

```bash
git add openclaw/local-runtime/server.mjs scripts/health-openclaw-runtime-lan.sh docs/openclaw-production-runtime-ops-guide.md
git commit -m "fix: reduce runtime session and fallback instability"
```

---

## Chunk 4: Cross-Machine Single-Node Recovery

### Task 9: Turn the current single-machine deployment into a reproducible cross-machine checklist

**Files:**
- Modify: `docs/openclaw-production-runtime-deployment.md`
- Modify: `docs/openclaw-production-runtime-ops-guide.md`
- Modify: `scripts/setup-openclaw-real-profile.sh`
- Modify: `scripts/start-openclaw-runtime-lan.sh`

- [ ] **Step 1: Enumerate every machine-local assumption that currently leaks into setup**

Examples:

- hardcoded paths
- implicit auth file locations
- required CLI path assumptions
- local-only IP detection assumptions

- [ ] **Step 2: Add explicit environment preflight checks for those assumptions**

Run:

```bash
bash scripts/setup-openclaw-real-profile.sh
corepack pnpm status:openclaw-runtime-lan
corepack pnpm health:openclaw-runtime-lan
```

Expected:

- clear failure message if a prerequisite is missing

- [ ] **Step 3: Write the exact new-machine recovery flow in the deployment doc**

Include:

- environment bootstrap
- profile creation
- runtime start
- health
- Gateway hookup
- smoke

- [ ] **Step 4: Perform a fresh-machine simulation on a second machine or clean user context**

Minimum evidence:

- health reachable
- `POST /v1/tasks/execute` works
- Gateway shows `cluster-preferred`

- [ ] **Step 5: Save a dated recovery verification record**

Create:

- `docs/openclaw-production-runtime-manual-verification-YYYY-MM-DD.md`

- [ ] **Step 6: Commit**

```bash
git add docs/openclaw-production-runtime-deployment.md docs/openclaw-production-runtime-ops-guide.md scripts/setup-openclaw-real-profile.sh scripts/start-openclaw-runtime-lan.sh docs/openclaw-production-runtime-manual-verification-YYYY-MM-DD.md
git commit -m "docs: verify cross-machine runtime recovery"
```

---

## Chunk 5: Final M5 Acceptance and Documentation Closure

### Task 10: Refresh checklist status from evidence, not assumptions

**Files:**
- Modify: `docs/m5-production-runtime-completion-checklist.md`
- Modify: `tasks.md`
- Modify: `docs/development-handoff-2026-03-07.md`

- [ ] **Step 1: Re-read the checklist and map every item to a proving command or report**

Do not mark anything complete without fresh evidence.

- [ ] **Step 2: Run the proving commands**

Minimum:

```bash
corepack pnpm --filter @mindanchor/api test
corepack pnpm --filter @mindanchor/api build
corepack pnpm test:core-phases:local -- --segments runtime-contracts
corepack pnpm test:core-phases:real:aligned -- --phases cluster-preferred --segments runtime-contracts
corepack pnpm smoke:cluster
pnpm smoke:web-console
```

- [ ] **Step 3: Update each checklist item with actual status**

Allowed statuses only:

- completed with evidence
- partial with explicit gap
- not completed

- [ ] **Step 4: Update `tasks.md` next priorities**

If execute stability is done, `P0` should move to:

- concurrency/session/fallback
- or cross-machine recovery

- [ ] **Step 5: Commit**

```bash
git add docs/m5-production-runtime-completion-checklist.md tasks.md docs/development-handoff-2026-03-07.md
git commit -m "docs: refresh m5 status from fresh evidence"
```

### Task 11: Produce the final M5 acceptance packet

**Files:**
- Create: `docs/openclaw-production-runtime-smoke-report-YYYY-MM-DD.md`
- Create: `docs/openclaw-production-runtime-manual-verification-YYYY-MM-DD.md`
- Modify: `docs/spec.md`

- [ ] **Step 1: Write the smoke report**

Must include:

- exact dates
- runtime base URL
- Gateway base URL
- health result
- 7 core agent contract matrix
- fallback summary
- conclusion

- [ ] **Step 2: Write the manual verification record**

Must include:

- Dashboard
- GoalFlow
- State
- Recovery
- Reflections
- Inbox
- Agent Lab

- [ ] **Step 3: Sync the final conclusion into `docs/spec.md`**

The spec should match:

- whether `M5` is now complete or still partial
- exact remaining gap if not complete

- [ ] **Step 4: Verify the packet is self-consistent**

Cross-check:

- checklist
- tasks
- spec
- smoke report
- manual verification

- [ ] **Step 5: Commit**

```bash
git add docs/openclaw-production-runtime-smoke-report-YYYY-MM-DD.md docs/openclaw-production-runtime-manual-verification-YYYY-MM-DD.md docs/spec.md
git commit -m "docs: finalize m5 runtime acceptance packet"
```

---

## Execution Order

1. Chunk 1: execute contract stabilization
2. Chunk 2: Gateway consumption safety
3. Chunk 3: runtime stability and fallback classification
4. Chunk 4: cross-machine recovery verification
5. Chunk 5: checklist/docs closure

Do not start Chunk 3 before Chunk 1 and Chunk 2 are green.  
Do not mark `M5` complete before Chunk 4 and Chunk 5 are backed by fresh evidence.

---

## Definition of Done

`M5` can only be declared complete when all of the following are true:

- `POST /v1/tasks/execute` returns stable, contract-compliant success payloads for all 7 core agents
- malformed runtime business success is turned into structured runtime failure, not silent success
- Gateway no longer needs broad heuristic normalization for cluster success payloads
- real cluster-preferred runs prove the 7 core agents are consumable by current read models
- cross-machine single-node recovery has been performed from docs, not just asserted
- smoke, checklist, spec, tasks, and verification records all agree on the same conclusion

---

## Ready-to-Run Command Set

### During Chunk 1–2

```bash
corepack pnpm --filter @mindanchor/api exec vitest run tests/openclaw-local-runtime.test.ts
corepack pnpm --filter @mindanchor/api exec vitest run tests/model-bridge.test.ts
corepack pnpm --filter @mindanchor/api exec vitest run tests/api.integration.test.ts
```

### During Chunk 3

```bash
corepack pnpm smoke:cluster
corepack pnpm test:core-phases:local -- --segments runtime-contracts
corepack pnpm test:core-phases:real:aligned -- --phases cluster-preferred --segments runtime-contracts
```

### During Chunk 4–5

```bash
corepack pnpm health:openclaw-runtime-lan
corepack pnpm status:openclaw-runtime-lan
pnpm smoke:web-console
```

---

Plan complete and saved to `docs/superpowers/plans/2026-04-21-m5-production-runtime-closure.md`. Ready to execute?
