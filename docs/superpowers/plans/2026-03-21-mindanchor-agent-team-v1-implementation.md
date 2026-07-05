# MindAnchor Agent Team V1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first testable MindAnchor multi-agent Coach experience on macOS with a single Coach entry, visible front agent, Picard routing, Jarvis-only plan writes, Data-governed memory candidates, and soul-file-backed visible personas.

**Architecture:** Reuse the existing Gateway/OpenClaw single-agent foundation, then layer a metadata-driven agent-team system on top. Keep V1 intentionally narrow: one visible front agent, at most one background consult, Jarvis-only durable plan changes, Data-only memory candidate governance, and shared read-model fields that the existing macOS app can consume without a full chat-platform rewrite.

**Tech Stack:** TypeScript, Fastify, Zod, Vitest, SwiftUI, AppKit, XCTest, OpenClaw local runtime, pnpm monorepo.

---

## File Structure

### Domain and shared contracts

- Modify: `packages/domain/src/index.ts`
  - Add agent-team metadata types
  - Add shared read-model fields
  - Add Jarvis proposal schema
  - Add Data memory candidate schema
- Create: `packages/domain/src/agent-team.ts`
  - Shared stable `agentId` → display metadata → soul file path mapping

### Gateway / API

- Create: `apps/api/src/services/agent-team-service.ts`
  - Picard routing, front-agent selection, one-consult orchestration summary
- Create: `apps/api/src/services/jarvis-command-service.ts`
  - Low-risk auto-apply vs high-risk proposal logic
- Create: `apps/api/src/services/data-memory-service.ts`
  - Candidate queue, accept/reject/delete/recall-block behavior
- Modify: `apps/api/src/env.ts`
  - Agent-team metadata configuration
- Modify: `apps/api/src/lib/agent-contracts.ts`
  - Stable agent IDs and prompt hooks for soul files
- Modify: `apps/api/src/orchestrator.ts`
  - Team routing entrypoint, Jarvis/Data authority enforcement
- Modify: `apps/api/src/app.ts`
  - Coach/team read-model, override, proposal, memory routes
- Modify: `apps/api/src/store.ts`
  - Persist proposals, memory candidates, memory items, front-agent state

### OpenClaw runtime and soul files

- Create: `openclaw/souls/picard.md`
- Create: `openclaw/souls/deanna-troi.md`
- Create: `openclaw/souls/spock.md`
- Create: `openclaw/souls/guinan.md`
- Create: `openclaw/souls/jarvis.md`
- Create: `openclaw/souls/data.md`
- Modify: `openclaw/local-runtime/server.mjs`
  - Add agent-team targets and stub behaviors

### macOS client

- Create: `apps/macos/Sources/Features/Coach/CoachView.swift`
- Create: `apps/macos/Sources/Features/Coach/CoachSupportViews.swift`
- Modify: `apps/macos/Sources/App/MainWindowShell.swift`
  - Add Coach entry
- Modify: `apps/macos/Sources/Core/AppModels.swift`
  - Add team read-model payloads
- Modify: `apps/macos/Sources/Core/MindAnchorAPIProviding.swift`
  - Add Coach/team API surface
- Modify: `apps/macos/Sources/Core/APIClient.swift`
  - Implement Coach/team requests
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
  - Load front-agent status, manual override, proposals, memory

### Tests

- Create: `apps/api/tests/agent-team-service.test.ts`
- Create: `apps/api/tests/agent-team.integration.test.ts`
- Create: `apps/api/tests/agent-team-souls.test.ts`
- Modify: `apps/api/tests/openclaw-local-runtime.test.ts`
- Modify: `apps/api/tests/env.test.ts`
- Create: `apps/macos/Tests/MindAnchorMacTests/CoachAgentTeamTests.swift`
- Modify: `apps/macos/Tests/MindAnchorMacTests/APIClientTests.swift`

### Docs

- Modify: `docs/superpowers/specs/2026-03-21-mindanchor-agent-team-v1-design.md`
  - Keep in sync with implementation clarifications if needed
- Create: `docs/runbooks/macos-agent-team-v1-local-test.md`
  - Local test runbook for the first testable version

---

## Chunk 1: Metadata, Soul Files, and Domain Contracts

### Task 1: Add stable agent-team metadata

**Files:**
- Create: `packages/domain/src/agent-team.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `apps/api/tests/env.test.ts`

- [ ] **Step 1: Write failing metadata tests**

Add assertions for:
- stable internal `agentId`
- user-visible `displayName`
- `soulFilePath`
- metadata coverage for all 6 personas

- [ ] **Step 2: Run the focused test**

Run: `corepack pnpm --filter @mindanchor/api test -- env.test.ts`
Expected: FAIL because agent-team metadata config does not exist yet.

- [ ] **Step 3: Implement metadata loader**

Add a metadata map shaped like:

```ts
export const AGENT_TEAM = {
  picard: { agentId: "director-agent", displayName: "Picard", soulFilePath: "openclaw/souls/picard.md" },
  troi: { agentId: "companion-agent", displayName: "Deanna Troi", soulFilePath: "openclaw/souls/deanna-troi.md" },
};
```

Export it from `packages/domain/src/index.ts` so both `apps/api` and `openclaw/local-runtime/server.mjs` can rely on the same source of truth.

- [ ] **Step 4: Re-run the focused test**

Run: `corepack pnpm --filter @mindanchor/api test -- env.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/agent-team.ts packages/domain/src/index.ts apps/api/tests/env.test.ts
git commit -m "feat: add agent team metadata registry"
```

### Task 2: Add soul files for visible personas

**Files:**
- Create: `openclaw/souls/picard.md`
- Create: `openclaw/souls/deanna-troi.md`
- Create: `openclaw/souls/spock.md`
- Create: `openclaw/souls/guinan.md`
- Create: `openclaw/souls/jarvis.md`
- Create: `openclaw/souls/data.md`
- Test: `apps/api/tests/agent-team-souls.test.ts`

- [ ] **Step 1: Draft a shared soul-file template**

Each file must include:
- source
- original archetype
- MindAnchor identity
- mission
- values and judgment bias
- tone
- strengths / preferred scenarios
- forbidden actions
- collaboration rules
- typical appearance triggers
- default attitude toward the user
- memory authority boundary

- [ ] **Step 2: Write Picard and Troi first**

Start with the two most routing-critical personas:
- `Picard`
- `Deanna Troi`

- [ ] **Step 3: Write Spock, Guinan, Jarvis, Data**

Keep tone differentiated, but avoid cosplay and copyrighted quotes.

- [ ] **Step 4: Manual review**

Check that:
- each file has one clear responsibility
- Jarvis and Data explicitly describe exclusive powers
- no file implies direct business writes except Jarvis

- [ ] **Step 5: Add automated soul-file validation**

Add tests that assert:
- all 6 metadata entries have matching soul files
- every soul file includes the required headings
- Jarvis and Data explicitly mention exclusive powers

- [ ] **Step 6: Run the soul-file test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-souls.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add openclaw/souls apps/api/tests/agent-team-souls.test.ts packages/domain/src/agent-team.ts packages/domain/src/index.ts
git commit -m "feat: add first-pass agent team soul files"
```

### Task 3: Add domain schemas for team read-models, proposals, and memory candidates

**Files:**
- Modify: `packages/domain/src/index.ts`
- Test: `apps/api/tests/agent-team-service.test.ts`

- [ ] **Step 1: Write failing schema tests**

Add tests for:
- `currentFrontAgent`
- `routingMode`
- `manualOverride`
- `consultedAgent`
- `handoffReason`
- `overrideSourceAgent`
- `visibleSummary`
- `JarvisPlanProposal`
- `DataMemoryCandidate`

- [ ] **Step 2: Run the schema test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-service.test.ts`
Expected: FAIL because these schemas do not exist.

- [ ] **Step 3: Add minimal schemas**

Model the new structures like:

```ts
const coachFrontAgentStateSchema = z.object({
  currentFrontAgent: z.string(),
  routingMode: z.enum(["auto", "manual"]),
  manualOverride: z.boolean(),
  consultedAgent: z.string().nullable(),
  handoffReason: z.string().nullable(),
  overrideSourceAgent: z.string().nullable(),
  visibleSummary: z.string().nullable(),
});
```

```ts
const dataMemoryCandidateSchema = z.object({
  candidateId: z.string(),
  memoryId: z.string().nullable(),
  status: z.enum(["candidate", "accepted", "rejected", "deleted", "recall_blocked"]),
  sourceAgent: z.string(),
  sourceTurnRef: z.string(),
  effectiveAt: z.string().nullable(),
  recallBlockedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
});
```

- [ ] **Step 4: Re-run the schema test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/index.ts apps/api/tests/agent-team-service.test.ts
git commit -m "feat: add agent team domain contracts"
```

## Chunk 1 Review Checkpoint

- [ ] Dispatch a reviewer for **Chunk 1 only**
- [ ] Address any issues before starting Chunk 2

---

## Chunk 2: Gateway Store, Read-Models, and Authority Rules

### Task 4: Persist front-agent state, proposals, and Data memory candidates

**Files:**
- Modify: `apps/api/src/store.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `apps/api/tests/agent-team.integration.test.ts`

- [ ] **Step 1: Write failing persistence tests**

Cover:
- front-agent state save/load
- Jarvis proposal save/load
- Data candidate accept/reject/delete/recall-block
- recall-eligible reads exclude deleted and recall-blocked memories
- agent-authored durable writes must go through one command/change-log path

- [ ] **Step 2: Run the persistence test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team.integration.test.ts`
Expected: FAIL because store methods and arrays do not exist.

- [ ] **Step 3: Add store collections and methods**

Add arrays and methods for:
- `coachFrontAgentStates`
- `jarvisPlanProposals`
- `jarvisCommandLogs`
- `dataMemoryCandidates`
- `dataMemoryItems`

Add methods such as:
- `getCoachFrontAgentState(userId)`
- `saveCoachFrontAgentState(state)`
- `createJarvisProposal(input)`
- `approveJarvisProposal(id)`
- `rejectJarvisProposal(id)`
- `appendJarvisCommandLog(entry)`
- `createDataMemoryCandidate(input)`
- `acceptDataMemoryCandidate(id)`
- `rejectDataMemoryCandidate(id)`
- `deleteDataMemory(memoryId)`
- `blockMemoryRecall(memoryId)`
- `listRecallEligibleMemory(userId)`

- [ ] **Step 4: Re-run the persistence test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team.integration.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/store.ts packages/domain/src/index.ts apps/api/tests/agent-team.integration.test.ts
git commit -m "feat: persist agent team state and proposals"
```

### Task 5: Implement Jarvis authority boundaries

**Files:**
- Create: `apps/api/src/services/jarvis-command-service.ts`
- Modify: `apps/api/src/orchestrator.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/store.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `apps/api/tests/agent-team-service.test.ts`

- [ ] **Step 1: Write failing authority tests**

Cover:
- only `Jarvis` can produce durable plan writes
- low-risk changes auto-apply
- high-risk changes become proposals
- all durable writes record `actorType`, `actorAgent`, `riskLevel`, `proposalId`, `approvedAt`
- all agent-originated plan writes are forced through one command gate
- direct store/orchestrator write paths are rejected or wrapped by the gate

- [ ] **Step 2: Run the authority test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-service.test.ts`
Expected: FAIL because no Jarvis command service exists.

- [ ] **Step 3: Implement minimal command service**

Limit V1 durable writes to:
- task ordering
- recovery blocks
- approved plan changes

Everything else returns a proposal or suggestion-only result.

Add a durable command/change-log carrier rather than trying to backfill these fields onto every existing task/recovery entity immediately. The command log should carry:

```ts
{
  commandId: "string",
  actorType: "agent",
  actorAgent: "jarvis",
  riskLevel: "low|high",
  proposalId: "string | null",
  approvedAt: "ISO-8601 | null",
}
```

Then route every agent-authored plan mutation through that command gate.

- [ ] **Step 4: Re-run the authority test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/jarvis-command-service.ts apps/api/src/orchestrator.ts apps/api/src/app.ts apps/api/src/store.ts packages/domain/src/index.ts apps/api/tests/agent-team-service.test.ts
git commit -m "feat: enforce Jarvis-only plan write authority"
```

### Task 6: Implement Data candidate governance

**Files:**
- Create: `apps/api/src/services/data-memory-service.ts`
- Modify: `apps/api/src/orchestrator.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/agent-team-service.test.ts`

- [ ] **Step 1: Write failing Data governance tests**

Cover:
- candidate submission from Troi/Spock/Guinan/Jarvis
- Data-only accept/reject
- delete stops recall
- recall-block stops recall without deleting source candidate
- recall-eligible reads only return accepted, non-deleted, non-blocked memory

- [ ] **Step 2: Run the governance test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-service.test.ts`
Expected: FAIL because no Data governance service exists.

- [ ] **Step 3: Implement minimal Data service**

Keep V1 small:
- no merge
- no decay
- no advanced conflict graphs

- [ ] **Step 4: Re-run the governance test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/data-memory-service.ts apps/api/src/orchestrator.ts apps/api/src/app.ts apps/api/tests/agent-team-service.test.ts
git commit -m "feat: add first-pass Data memory governance"
```

## Chunk 2 Review Checkpoint

- [ ] Dispatch a reviewer for **Chunk 2 only**
- [ ] Address any issues before starting Chunk 3

---

## Chunk 3: Picard Routing, Shared Read-Models, and OpenClaw Runtime

### Task 7: Add Picard-led front-agent routing with one consult

**Files:**
- Create: `apps/api/src/services/agent-team-service.ts`
- Modify: `apps/api/src/orchestrator.ts`
- Modify: `apps/api/src/lib/agent-contracts.ts`
- Test: `apps/api/tests/agent-team-service.test.ts`

- [ ] **Step 1: Write failing routing tests**

Cover:
- auto-route to Troi for emotional/confused input
- auto-route to Spock for analysis input
- auto-route to Guinan for balance input
- auto-route to Jarvis for planning input
- auto-route to Picard for mixed/unknown input
- Data is never selected as a default front persona
- manual override wins for the turn
- manual override only hands off on Jarvis/Data/user-release cases
- no more than one background consult per turn

- [ ] **Step 2: Run the routing test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-service.test.ts`
Expected: FAIL because routing service does not exist.

- [ ] **Step 3: Implement minimal routing service**

Return a structure like:

```ts
{
  currentFrontAgent: "jarvis",
  routingMode: "auto",
  manualOverride: false,
  consultedAgent: "spock",
  handoffReason: null,
  overrideSourceAgent: null,
  visibleSummary: "Picard asked Spock for one reality check before handing the turn to Jarvis."
}
```

When explicit handoff happens under manual override, require a second shape:

```ts
{
  currentFrontAgent: "jarvis",
  routingMode: "manual",
  manualOverride: true,
  consultedAgent: null,
  handoffReason: "plan_write_requires_jarvis",
  overrideSourceAgent: "spock",
  visibleSummary: "You chose Spock, but Jarvis must handle the requested plan change."
}
```

- [ ] **Step 4: Re-run the routing test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/agent-team-service.ts apps/api/src/orchestrator.ts apps/api/src/lib/agent-contracts.ts apps/api/tests/agent-team-service.test.ts
git commit -m "feat: add Picard-led front-agent routing"
```

### Task 8: Expose shared read-model and handoff state

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/orchestrator.ts`
- Test: `apps/api/tests/agent-team.integration.test.ts`

- [ ] **Step 1: Write failing read-model tests**

Cover:
- bootstrap/dashboard includes `currentFrontAgent`
- manual override sets `manualOverride=true`
- handoff card includes reason and next speaker
- visible summary appears without chain-of-thought

- [ ] **Step 2: Run the integration test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team.integration.test.ts`
Expected: FAIL because these fields are missing from read-models.

- [ ] **Step 3: Wire fields into existing read-models**

Prefer extending existing payloads over introducing a full new chat schema in V1.

- [ ] **Step 4: Re-run the integration test**

Run: `corepack pnpm --filter @mindanchor/api test -- agent-team.integration.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/app.ts apps/api/src/orchestrator.ts apps/api/tests/agent-team.integration.test.ts
git commit -m "feat: expose agent team read-model fields"
```

### Task 9: Add local runtime support for visible personas

**Files:**
- Modify: `openclaw/local-runtime/server.mjs`
- Modify: `apps/api/src/lib/agent-contracts.ts`
- Modify: `apps/api/src/orchestrator.ts`
- Test: `apps/api/tests/openclaw-local-runtime.test.ts`

- [ ] **Step 1: Write failing local-runtime tests**

Cover:
- visible persona targets resolve correctly
- Picard can route to one front agent
- one consult summary returns parsed JSON

- [ ] **Step 2: Run the runtime test**

Run: `corepack pnpm --filter @mindanchor/api test -- openclaw-local-runtime.test.ts`
Expected: FAIL because these runtime targets do not exist.

- [ ] **Step 3: Implement stub targets**

Add minimal stub target behavior for:
- `director-agent`
- `companion-agent`
- `analyst-agent`
- `balance-agent`
- `life-secretary-agent`
- `memory-governor-agent`

Map display names through metadata instead of hardcoding them in test assertions.
Require the same contract to flow through:
- `apps/api/src/lib/agent-contracts.ts`
- `apps/api/src/orchestrator.ts`
- `openclaw/local-runtime/server.mjs`

Do not let Gateway invent a separate hidden routing schema that bypasses OpenClaw.

- [ ] **Step 4: Re-run the runtime test**

Run: `corepack pnpm --filter @mindanchor/api test -- openclaw-local-runtime.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add openclaw/local-runtime/server.mjs apps/api/src/lib/agent-contracts.ts apps/api/src/orchestrator.ts apps/api/tests/openclaw-local-runtime.test.ts
git commit -m "feat: add local runtime support for agent team personas"
```

## Chunk 3 Review Checkpoint

- [ ] Dispatch a reviewer for **Chunk 3 only**
- [ ] Address any issues before starting Chunk 4

---

## Chunk 4: macOS Coach Entry, Current Persona UI, and Approvals

### Task 10: Add macOS models and API surface for the team read-model

**Files:**
- Modify: `apps/macos/Sources/Core/AppModels.swift`
- Modify: `apps/macos/Sources/Core/MindAnchorAPIProviding.swift`
- Modify: `apps/macos/Sources/Core/APIClient.swift`
- Modify: `apps/macos/Tests/MindAnchorMacTests/APIClientTests.swift`

- [ ] **Step 1: Write failing API/model tests**

Cover decoding and request methods for:
- front-agent state
- manual override
- consulted agent summary
- Jarvis proposals
- Data memory candidates

- [ ] **Step 2: Run the focused macOS test**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
```

Expected: FAIL in `APIClientTests.swift` because the payloads and endpoints do not exist.

- [ ] **Step 3: Add the payloads and request methods**

Introduce minimal payloads:
- `CoachFrontAgentPayload`
- `JarvisProposalPayload`
- `DataMemoryPayload`

- [ ] **Step 4: Re-run the macOS test**

Run: `corepack pnpm --filter @mindanchor/macos test`
Expected: PASS for the updated API client coverage.

- [ ] **Step 5: Commit**

```bash
git add apps/macos/Sources/Core/AppModels.swift apps/macos/Sources/Core/MindAnchorAPIProviding.swift apps/macos/Sources/Core/APIClient.swift apps/macos/Tests/MindAnchorMacTests/APIClientTests.swift
git commit -m "feat: add macOS API support for agent team payloads"
```

### Task 11: Add Coach entry, current persona shell, and switcher

**Files:**
- Create: `apps/macos/Sources/Features/Coach/CoachView.swift`
- Create: `apps/macos/Sources/Features/Coach/CoachSupportViews.swift`
- Modify: `apps/macos/Sources/App/MainWindowShell.swift`
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/CoachAgentTeamTests.swift`

- [ ] **Step 1: Write failing UI/view-model tests**

Cover:
- one Coach entry appears in sidebar
- current front agent badge renders
- lightweight persona switcher exposes `Picard/Troi/Spock/Guinan/Jarvis` and excludes `Data`
- manual override toggle updates view-model state
- consulted-agent summary is visible
- handoff card shows source persona, intervention reason, and next speaker

- [ ] **Step 2: Run the targeted macOS test**

Run:

```bash
rm -rf apps/macos/MindAnchorMac.xcodeproj && \
xcodegen generate --spec apps/macos/project.yml --project apps/macos && \
xcodebuild -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -configuration Debug -destination 'platform=macOS,arch=arm64' CODE_SIGNING_ALLOWED=NO -only-testing:MindAnchorMacTests/CoachAgentTeamTests test
```

Expected: FAIL because Coach UI does not exist.

- [ ] **Step 3: Build the minimal Coach shell**

The V1 UI should show:
- Coach entry
- current front agent
- lightweight persona switcher
- manual/auto routing indicator
- one consulted-agent summary
- handoff card summary

- [ ] **Step 4: Re-run the targeted macOS test**

Run the same `xcodegen + xcodebuild` command.
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/macos/Sources/Features/Coach apps/macos/Sources/App/MainWindowShell.swift apps/macos/Sources/Core/AppViewModel.swift apps/macos/Tests/MindAnchorMacTests/CoachAgentTeamTests.swift
git commit -m "feat: add macOS coach entry and persona shell"
```

### Task 12: Add Jarvis approval UI and Data memory panel

**Files:**
- Modify: `apps/macos/Sources/Features/Coach/CoachView.swift`
- Modify: `apps/macos/Sources/Features/Reminders/RemindersView.swift`
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Tests/MindAnchorMacTests/CoachAgentTeamTests.swift`

- [ ] **Step 1: Write failing UI tests**

Cover:
- Jarvis proposal reuses the reminder/inbox shell instead of introducing a separate approval surface
- Jarvis proposal shows before/after diff
- approve/reject actions update state
- memory panel shows source, effectiveAt, recall-block/delete state
- deletion makes item disappear from recall-eligible list

- [ ] **Step 2: Run the targeted macOS test**

Run the same `xcodegen + xcodebuild` command from Task 11.
Expected: FAIL because approval and memory views are incomplete.

- [ ] **Step 3: Implement minimal approval and memory surfaces**

Keep V1 narrow:
- reuse inbox/reminder-like approval cards
- prefer extending `RemindersView.swift` shared card patterns over inventing a Coach-only approval stack
- no full multi-thread conversation UI
- no Data front persona chat

- [ ] **Step 4: Re-run the targeted macOS test**

Run the same `xcodegen + xcodebuild` command.
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/macos/Sources/Features/Coach/CoachView.swift apps/macos/Sources/Features/Reminders/RemindersView.swift apps/macos/Sources/Core/AppViewModel.swift apps/macos/Tests/MindAnchorMacTests/CoachAgentTeamTests.swift
git commit -m "feat: add Jarvis approvals and Data memory panel"
```

## Chunk 4 Review Checkpoint

- [ ] Dispatch a reviewer for **Chunk 4 only**
- [ ] Address any issues before starting Chunk 5

---

## Chunk 5: End-to-End Verification and Runbook

### Task 13: Add end-to-end integration coverage for core negative paths

**Files:**
- Modify: `apps/api/tests/agent-team.integration.test.ts`
- Modify: `apps/macos/Tests/MindAnchorMacTests/CoachAgentTeamTests.swift`

- [ ] **Step 1: Write failing negative-path tests**

Cover:
- wrong route recovery
- manual override conflict and handoff card
- Jarvis proposal reject / timeout
- low-risk misclassification
- deleted memory still recalled (should fail before fix)
- Data/Jarvis unavailable fallback messaging
- background consult failure visible explanation
- front persona remains singular
- no scenario produces more than one background consult
- handoff card includes source persona, intervention reason, and next speaker
- approval card includes before/after diff, risk level, and rationale
- user-language contract stays visible: "Jarvis changes plans", "Data manages long-term memory"

- [ ] **Step 2: Run API and macOS tests**

Run:

```bash
corepack pnpm --filter @mindanchor/api test
corepack pnpm --filter @mindanchor/macos test
```

Expected: FAIL on the newly added negative-path tests.

- [ ] **Step 3: Implement only the minimal fixes needed**

Do not add extra platform scope; keep fixes inside the V1 read-model, routing, proposal, and memory surfaces.

- [ ] **Step 4: Re-run API and macOS tests**

Run the same two commands.
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/tests/agent-team.integration.test.ts apps/macos/Tests/MindAnchorMacTests/CoachAgentTeamTests.swift
git commit -m "test: cover agent team negative paths"
```

### Task 14: Write a local test runbook

**Files:**
- Create: `docs/runbooks/macos-agent-team-v1-local-test.md`

- [ ] **Step 1: Draft the runbook outline**

Include:
- required services
- startup order
- sample override / routing / approval flows
- expected visible UI states
- negative-path drills for wrong route recovery, Jarvis/Data unavailable states, and consult failure explanation

- [ ] **Step 2: Add exact commands**

Include:

```bash
corepack pnpm dev:api
corepack pnpm dev:openclaw
corepack pnpm --filter @mindanchor/macos build
corepack pnpm --filter @mindanchor/api test
corepack pnpm --filter @mindanchor/macos test
```

- [ ] **Step 3: Add manual acceptance checklist**

Verify:
- current persona banner
- manual override
- handoff card
- Jarvis high-risk approval
- Data delete/recall-block behavior
- only one front persona is visible at a time
- at most one consulted agent appears per turn
- wrong route recovery is explained in user language
- Jarvis/Data unavailable states show clear fallback messaging
- approval cards include before/after diff, risk, and rationale

- [ ] **Step 4: Review the runbook for accuracy**

Check every command, path, and UI label against the implemented code.

- [ ] **Step 5: Commit**

```bash
git add docs/runbooks/macos-agent-team-v1-local-test.md
git commit -m "docs: add macOS agent team v1 local runbook"
```

## Chunk 5 Review Checkpoint

- [ ] Dispatch a reviewer for **Chunk 5 only**
- [ ] Address any issues before execution handoff

---

## Execution Notes

- Start with **Chunk 1** and do not parallelize tasks that modify `packages/domain/src/index.ts`, `apps/api/src/store.ts`, or `apps/api/src/orchestrator.ts` at the same time.
- Prefer parallel work only when file ownership is clearly disjoint:
  - soul files vs domain schemas
  - macOS Coach views vs API service internals
  - runbook docs vs runtime stub updates
- Keep visible persona names in metadata, not in stable agent IDs or schema names.
- Do not build a full multi-thread conversation platform in V1.
- Keep V1 read-model driven wherever possible.

Plan complete and saved to `docs/superpowers/plans/2026-03-21-mindanchor-agent-team-v1-implementation.md`. Ready to execute?
