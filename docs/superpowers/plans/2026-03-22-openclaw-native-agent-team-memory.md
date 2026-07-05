# OpenClaw Native Agent Team Memory Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current named-agent shell into a real OpenClaw-native agent team that runs inside `openclaw/`, while keeping Gateway / existing storage as the single authority for long-term memory.

**Architecture:** Keep the current `Gateway -> OpenClaw` topology, but move agent identity, routing ownership, and memory access contracts into OpenClaw-native runtime files. Gateway stays the memory authority and exposes controlled memory context / proposal APIs; OpenClaw agents consume those APIs through skill-style adapters and never touch storage directly.

**Tech Stack:** TypeScript, Fastify, Zod, Vitest, Node.js ESM, OpenClaw local runtime, pnpm monorepo.

---

## File Structure

### Domain contracts

- Modify: `packages/domain/src/index.ts`
  - Add memory context bundle, memory proposal, memory scope, and native agent runtime contract schemas
- Modify: `packages/domain/src/agent-team.ts`
  - Add runtime-facing metadata such as allowed memory scopes, runtime registration names, and front-agent eligibility

### Gateway / API

- Create: `apps/api/src/services/agent-memory-service.ts`
  - Load scoped memory bundles for OpenClaw agents from existing storage
- Create: `apps/api/src/services/agent-memory-proposal-service.ts`
  - Accept / normalize memory proposals before governance
- Modify: `apps/api/src/store.ts`
  - Add persistence helpers for memory proposals and scoped memory retrieval
- Modify: `apps/api/src/app.ts`
  - Add internal memory context / proposal endpoints
- Modify: `apps/api/src/orchestrator.ts`
  - Include memory scopes and agent runtime metadata in task envelopes
- Modify: `apps/api/src/lib/openclaw-trace.ts`
  - Extend trace helpers to include memory-scope / runtime-agent metadata

### OpenClaw runtime

- Create: `openclaw/runtime/agent-registry.mjs`
  - Single source of runtime agent definitions
- Create: `openclaw/runtime/memory-client.mjs`
  - Gateway-facing memory read / proposal adapter
- Create: `openclaw/runtime/workflows/picard-router.mjs`
  - Native Picard routing entry
- Create: `openclaw/runtime/workflows/persona-executor.mjs`
  - Shared execution adapter for Troi / Spock / Guinan / Jarvis / Data
- Modify: `openclaw/local-runtime/server.mjs`
  - Register native agents, expose richer task execution flow, call memory adapter
- Modify: `openclaw/local-cluster-server.mjs`
  - Boot the updated runtime

### Tests

- Create: `apps/api/tests/agent-memory-service.test.ts`
- Create: `apps/api/tests/agent-memory.integration.test.ts`
- Create: `apps/api/tests/openclaw-native-agent-runtime.test.ts`
- Modify: `apps/api/tests/agent-team-service.test.ts`
- Modify: `apps/api/tests/openclaw-local-runtime.test.ts`

### Docs

- Modify: `docs/superpowers/specs/2026-03-19-mindanchor-v1-commercial-delivery-design.md`
  - Keep implementation notes aligned if field names drift
- Create: `docs/runbooks/openclaw-native-agent-team-local-check.md`
  - Local bring-up, probe, and smoke verification

---

## Chunk 1: Contracts and Memory APIs

### Task 1: Add failing domain tests for memory context and proposal contracts

**Files:**
- Modify: `packages/domain/src/index.ts`
- Modify: `packages/domain/src/agent-team.ts`
- Test: `apps/api/tests/agent-memory-service.test.ts`

- [ ] **Step 1: Write the failing contract tests**

Cover:
- `MemoryScope`
- `AgentMemoryContextBundle`
- `AgentMemoryProposal`
- `AgentRuntimeDescriptor`
- per-agent allowed memory scopes

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-memory-service.test.ts`

Expected: FAIL because memory contract schemas and metadata do not exist yet.

- [ ] **Step 3: Implement the minimal domain schemas**

Add:
- scoped memory bundle schema
- proposal write schema
- runtime agent descriptor schema
- agent metadata fields for:
  - `runtimeAgentId`
  - `memoryScopes`
  - `canFront`
  - `canConsult`
  - `canWritePlans`
  - `canGovernMemory`

- [ ] **Step 4: Re-run the focused test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-memory-service.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/index.ts packages/domain/src/agent-team.ts apps/api/tests/agent-memory-service.test.ts
git commit -m "feat: add native agent memory contracts"
```

### Task 2: Add Gateway internal memory read / proposal endpoints

**Files:**
- Create: `apps/api/src/services/agent-memory-service.ts`
- Create: `apps/api/src/services/agent-memory-proposal-service.ts`
- Modify: `apps/api/src/store.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/agent-memory.integration.test.ts`

- [ ] **Step 1: Write the failing integration tests**

Cover:
- `GET /internal/agent-memory/context`
- `POST /internal/agent-memory/proposals`
- scope filtering per agent
- rejection of out-of-scope memory requests

- [ ] **Step 2: Run the focused integration test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-memory.integration.test.ts`

Expected: FAIL because the internal memory endpoints do not exist.

- [ ] **Step 3: Implement minimal store and service helpers**

Add helpers that:
- load user memory from existing store
- split into `identity / preferences / habits / constraints / recentContext / metadata`
- filter by requested scopes
- accept proposal writes with normalized fields and timestamps

- [ ] **Step 4: Add the internal routes**

Expose routes such as:
- `GET /internal/agent-memory/context`
- `POST /internal/agent-memory/proposals`

Keep them Gateway-internal and traceable.

- [ ] **Step 5: Re-run the focused integration test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-memory.integration.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/services/agent-memory-service.ts apps/api/src/services/agent-memory-proposal-service.ts apps/api/src/store.ts apps/api/src/app.ts apps/api/tests/agent-memory.integration.test.ts
git commit -m "feat: add gateway agent memory endpoints"
```

---

## Chunk 2: OpenClaw Native Runtime Registration

### Task 3: Add failing runtime tests for native agent registry

**Files:**
- Create: `openclaw/runtime/agent-registry.mjs`
- Modify: `openclaw/local-runtime/server.mjs`
- Test: `apps/api/tests/openclaw-native-agent-runtime.test.ts`

- [ ] **Step 1: Write the failing runtime tests**

Cover:
- all six persona agents are registered
- `Picard` is front-eligible and routing-capable
- `Jarvis` is the only plan-write authority
- `Data` is the only memory-governance authority

- [ ] **Step 2: Run the focused runtime test**

Run: `corepack pnpm --filter @mindanchor/api test -- openclaw-native-agent-runtime.test.ts`

Expected: FAIL because native runtime registry does not exist.

- [ ] **Step 3: Implement `agent-registry.mjs`**

Define one runtime registry entry per agent:
- `director-agent`
- `companion-agent`
- `analyst-agent`
- `balance-agent`
- `life-secretary-agent`
- `memory-governor-agent`

Each entry should include:
- runtime id
- soul path
- model target
- supported workflows
- memory scopes
- authority flags

- [ ] **Step 4: Wire the local runtime to use the registry**

Refactor `openclaw/local-runtime/server.mjs` so runtime registration comes from the registry instead of a mostly static mixed list.

- [ ] **Step 5: Re-run the focused runtime test**

Run: `corepack pnpm --filter @mindanchor/api test -- openclaw-native-agent-runtime.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add openclaw/runtime/agent-registry.mjs openclaw/local-runtime/server.mjs apps/api/tests/openclaw-native-agent-runtime.test.ts
git commit -m "feat: register native openclaw agent team"
```

### Task 4: Add OpenClaw memory client and task envelope support

**Files:**
- Create: `openclaw/runtime/memory-client.mjs`
- Modify: `apps/api/src/orchestrator.ts`
- Modify: `apps/api/src/lib/openclaw-trace.ts`
- Modify: `openclaw/local-runtime/server.mjs`
- Test: `apps/api/tests/openclaw-local-runtime.test.ts`

- [ ] **Step 1: Write failing tests for task envelope memory fields**

Cover:
- envelope includes `frontAgent`
- envelope includes `memoryScopes`
- envelope includes `workflow`
- runtime can call Gateway memory endpoint before generating

- [ ] **Step 2: Run the focused test**

Run: `corepack pnpm --filter @mindanchor/api test -- openclaw-local-runtime.test.ts`

Expected: FAIL because envelope / memory adapter fields are missing.

- [ ] **Step 3: Implement `memory-client.mjs`**

Support:
- `fetchAgentMemoryContext`
- `submitAgentMemoryProposal`

Use Gateway URLs and trace headers only; no storage access.

- [ ] **Step 4: Extend the Gateway envelope builder**

Ensure downstream OpenClaw task payloads include:
- `userId`
- `traceId`
- `workflow`
- `frontAgent`
- `memoryScopes`

- [ ] **Step 5: Re-run the focused test**

Run: `corepack pnpm --filter @mindanchor/api test -- openclaw-local-runtime.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add openclaw/runtime/memory-client.mjs apps/api/src/orchestrator.ts apps/api/src/lib/openclaw-trace.ts openclaw/local-runtime/server.mjs apps/api/tests/openclaw-local-runtime.test.ts
git commit -m "feat: wire openclaw memory adapter and task envelopes"
```

---

## Chunk 3: Native Picard Routing and Persona Execution

### Task 5: Move front-agent routing ownership into Picard runtime workflow

**Files:**
- Create: `openclaw/runtime/workflows/picard-router.mjs`
- Create: `openclaw/runtime/workflows/persona-executor.mjs`
- Modify: `openclaw/local-runtime/server.mjs`
- Modify: `apps/api/tests/agent-team-service.test.ts`

- [ ] **Step 1: Write failing tests for Picard-owned routing**

Cover:
- `Picard` decides front persona from workflow + memory context
- consult / handoff result is structured
- Gateway no longer needs persona-specific hardcoded routing logic for the same step

- [ ] **Step 2: Run the focused test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-service.test.ts`

Expected: FAIL because routing still depends on shallow shell logic.

- [ ] **Step 3: Implement Picard routing workflow**

Add a runtime workflow that:
- reads the task envelope
- requests scoped memory
- chooses `frontAgent`
- optionally chooses one consulted agent
- returns structured route metadata

- [ ] **Step 4: Implement shared persona executor**

Create a minimal executor that:
- loads soul metadata
- loads scoped memory
- executes the persona-specific generation step
- can emit proposal candidates instead of direct writes

- [ ] **Step 5: Re-run the focused test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-service.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add openclaw/runtime/workflows/picard-router.mjs openclaw/runtime/workflows/persona-executor.mjs openclaw/local-runtime/server.mjs apps/api/tests/agent-team-service.test.ts
git commit -m "feat: move native front-agent routing into picard runtime"
```

### Task 6: Add local runbook and end-to-end smoke checkpoints

**Files:**
- Create: `docs/runbooks/openclaw-native-agent-team-local-check.md`
- Modify: `docs/superpowers/specs/2026-03-19-mindanchor-v1-commercial-delivery-design.md`

- [ ] **Step 1: Document local bring-up**

Include:
- Gateway start
- local OpenClaw runtime start
- required env vars
- probe endpoints

- [ ] **Step 2: Document memory smoke steps**

Include:
- fetch scoped memory for `Picard`
- submit memory proposal for `Deanna Troi`
- verify `Jarvis` / `Data` authority constraints

- [ ] **Step 3: Document expected pass criteria**

Include:
- registered native agents visible
- envelope includes memory scope
- `Picard` chooses front agent
- memory reads come from Gateway
- memory writes become proposals only

- [ ] **Step 4: Commit**

```bash
git add docs/runbooks/openclaw-native-agent-team-local-check.md docs/superpowers/specs/2026-03-19-mindanchor-v1-commercial-delivery-design.md
git commit -m "docs: add native openclaw agent team local runbook"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-03-22-openclaw-native-agent-team-memory.md`. Ready to execute?
