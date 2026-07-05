# OpenClaw Conversation Coach Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first end-to-end OpenClaw conversation coach lane on macOS with authenticated `/coach/*` APIs, two-stage responses (`fastResponse` + `fullResponse`), visible/revocable memory, and a minimal native Coach conversation UI.

**Architecture:** Reuse the current Gateway/OpenClaw/macOS foundation, but keep the new conversation lane isolated from the existing Agent Team V1 routing/proposal/memory-governance lane. Phase 1 stays read-only: all final content comes from OpenClaw, the Gateway owns persistence and owner checks, and the macOS client only renders sessions/messages/memory/feedback without writing business objects like tasks or reminders.

**Tech Stack:** TypeScript, Fastify, Zod, JSON-file store, existing OpenClaw local runtime, SwiftUI/AppKit, XCTest, Vitest.

---

## File Map

### Domain / shared contracts

- Modify: `packages/domain/src/index.ts`
  - Add Coach conversation schemas, response envelopes, feedback/memory/training types, and database collections.

### Gateway persistence / orchestration

- Modify: `apps/api/src/store.ts`
  - Add CRUD helpers for coach sessions, messages, feedback, memory items, and training examples.
- Create: `apps/api/src/services/conversation-coach-service.ts`
  - Encapsulate session/message workflow, retry semantics, feedback persistence, memory visibility, and training-example creation.
- Modify: `apps/api/src/orchestrator.ts`
  - Add a dedicated coach lane entrypoint that calls OpenClaw and emits trace events without touching Agent Team V1 logic.
- Modify: `apps/api/src/app.ts`
  - Add authenticated `/coach/sessions`, `/coach/messages`, `/coach/memory` routes.
- Modify: `apps/api/src/env.ts`
  - Register coach-lane execution targets and per-agent config support.

### OpenClaw local runtime

- Modify: `openclaw/local-runtime/server.mjs`
  - Add coach lane targets and stub responses for `fastResponse`/`fullResponse`.

### macOS client

- Modify: `apps/macos/Sources/Core/AppModels.swift`
  - Add Coach session/message/feedback/memory payloads.
- Modify: `apps/macos/Sources/Core/MindAnchorAPIProviding.swift`
  - Add Coach conversation API surface.
- Modify: `apps/macos/Sources/Core/APIClient.swift`
  - Implement authenticated Coach session/message/memory calls.
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
  - Add conversation state, send/retry/feedback/delete-memory flows.
- Modify: `apps/macos/Sources/Features/Coach/CoachView.swift`
  - Extend existing Coach page with conversation thread, composer, response status, used-memory panel entry, and full memory list.
- Create: `apps/macos/Sources/Features/Coach/CoachConversationViews.swift`
  - Keep new conversation UI broken into focused subviews instead of inflating `CoachView.swift`.

### Tests / docs

- Create: `apps/api/tests/conversation-coach.integration.test.ts`
  - End-to-end Gateway/store/owner-check coverage for the new `/coach/*` conversation routes.
- Modify: `apps/api/tests/openclaw-local-runtime.test.ts`
  - Add coach lane stub/runtime coverage.
- Create: `apps/macos/Tests/MindAnchorMacTests/CoachConversationTests.swift`
  - macOS ViewModel/UI contract coverage for sessions/messages/memory/feedback.
- Modify: `docs/runbooks/macos-agent-team-v1-local-test.md`
  - Link out to the new Coach conversation verification once Phase 1 is implemented.
- Create: `docs/runbooks/macos-conversation-coach-phase1-local-test.md`
  - Local runbook for the new conversation lane.

---

## Chunk 1: Domain Contracts and Store Foundation

### Task 1: Add shared Coach conversation schemas

**Files:**
- Modify: `packages/domain/src/index.ts`
- Test: `apps/api/tests/conversation-coach.integration.test.ts`

- [ ] **Step 1: Write the failing contract test**

Cover:
- `CoachSession`
- `CoachMessage`
- `CoachFeedback`
- `CoachMemoryItem`
- `CoachTrainingExample`
- conversation-related database collections

- [ ] **Step 2: Run the targeted API test to verify it fails**

Run:

```bash
corepack pnpm --filter @mindanchor/api test -- conversation-coach.integration.test.ts
```

Expected: FAIL because the schemas and route contracts do not exist yet.

- [ ] **Step 3: Add minimal shared schemas**

Add at least:
- `coachSessionSchema`
- `coachMessageSchema`
- `coachFeedbackSchema`
- `coachMemoryItemSchema`
- `coachTrainingExampleSchema`
- `coachMessageStatusSchema`
- `coachSessionStatusSchema`
- `coachMemoryStatusSchema`
- `coachFeedbackLabelSchema`

Also add response/query schemas for:
- `POST /coach/sessions`
- `GET /coach/sessions`
- `GET /coach/sessions/:sessionId`
- `POST /coach/sessions/:sessionId/messages`
- `GET /coach/messages/:messageId`
- `POST /coach/messages/:messageId/retry`
- `POST /coach/messages/:messageId/feedback`
- `GET /coach/memory`
- `DELETE /coach/memory/:memoryId`

- [ ] **Step 4: Extend the database schema**

Add default arrays for:
- `coachSessions`
- `coachMessages`
- `coachFeedback`
- `coachMemoryItems`
- `coachTrainingExamples`

- [ ] **Step 5: Re-run the targeted API test**

Run:

```bash
corepack pnpm --filter @mindanchor/api test -- conversation-coach.integration.test.ts
```

Expected: FAIL later in store/route behavior, but schema parse errors are gone.

### Task 2: Add store helpers for Coach sessions, messages, feedback, and memory

**Files:**
- Modify: `apps/api/src/store.ts`
- Test: `apps/api/tests/conversation-coach.integration.test.ts`

- [ ] **Step 1: Write failing store-behavior tests**

Cover:
- create/list/get/delete session
- create/list/get/update message
- revoke memory item
- create/list feedback
- create/list training example
- owner isolation by `userId`

- [ ] **Step 2: Run the targeted API test to verify it fails**

Run:

```bash
corepack pnpm --filter @mindanchor/api test -- conversation-coach.integration.test.ts
```

Expected: FAIL because store helpers are missing.

- [ ] **Step 3: Add minimal store methods**

Implement focused helpers such as:
- `createCoachSession`
- `listCoachSessions`
- `getCoachSession`
- `deleteCoachSession`
- `createCoachMessage`
- `updateCoachMessage`
- `getCoachMessage`
- `listCoachMessagesBySession`
- `createCoachFeedback`
- `listCoachFeedbackByMessage`
- `createCoachMemoryItem`
- `listCoachMemoryItems`
- `revokeCoachMemoryItem`
- `touchCoachMemoryItemLastUsed`
- `createCoachTrainingExample`

- [ ] **Step 4: Encode delete semantics**

For `deleteCoachSession`, ensure:
- session becomes unavailable to the user
- session messages no longer participate in later extraction
- derived memory items from that session are revoked
- linked training examples are marked invalid/superseded rather than left active

- [ ] **Step 5: Re-run the targeted API test**

Run:

```bash
corepack pnpm --filter @mindanchor/api test -- conversation-coach.integration.test.ts
```

Expected: FAIL next in route/service orchestration, with store behavior now passing.

## Chunk 1 Review Checkpoint

- [ ] Dispatch a reviewer for **Chunk 1 only**
- [ ] Address any issues before starting Chunk 2

---

## Chunk 2: Gateway Coach Conversation API

### Task 3: Add conversation coach service and authenticated routes

**Files:**
- Create: `apps/api/src/services/conversation-coach-service.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/conversation-coach.integration.test.ts`

- [ ] **Step 1: Write failing integration tests for `/coach/*`**

Cover:
- create/list/get/delete session
- send a message into an existing session
- get a single assistant message
- retry a failed or partial message
- submit feedback
- list memory
- revoke memory
- owner mismatch returns `404`
- no explicit `userId` accepted in body/query

- [ ] **Step 2: Run the targeted API test to verify it fails**

Run:

```bash
corepack pnpm --filter @mindanchor/api test -- conversation-coach.integration.test.ts
```

Expected: FAIL because the routes and service do not exist.

- [ ] **Step 3: Implement the service with phase-1 semantics**

Rules:
- authenticated user context only
- `fastResponse` may succeed before `fullResponse`
- `retry` follows the spec:
  - no `fastResponse` → retry fast then full
  - failed `fullResponse` with existing `fastResponse` → retry full only
- one in-flight retry per message
- feedback accepted on `fastResponse`-only or `completed` messages
- memory list returns only visible, summarized items

- [ ] **Step 4: Add Fastify routes**

Add:
- `POST /coach/sessions`
- `GET /coach/sessions`
- `GET /coach/sessions/:sessionId`
- `DELETE /coach/sessions/:sessionId`
- `POST /coach/sessions/:sessionId/messages`
- `GET /coach/messages/:messageId`
- `POST /coach/messages/:messageId/retry`
- `POST /coach/messages/:messageId/feedback`
- `GET /coach/memory`
- `DELETE /coach/memory/:memoryId`

- [ ] **Step 5: Re-run the targeted API test**

Run:

```bash
corepack pnpm --filter @mindanchor/api test -- conversation-coach.integration.test.ts
```

Expected: PASS

### Task 4: Emit trace events and keep the lane isolated

**Files:**
- Modify: `apps/api/src/orchestrator.ts`
- Modify: `apps/api/tests/conversation-coach.integration.test.ts`

- [ ] **Step 1: Write failing trace assertions**

Cover:
- `coach.session.created`
- `coach.message.fast.started/completed/failed`
- `coach.message.full.started/completed/failed`
- `coach.memory.recalled`
- `coach.memory.persisted`
- `coach.feedback.recorded`

- [ ] **Step 2: Run the targeted API test to verify it fails**

- [ ] **Step 3: Add orchestrator entrypoints**

Requirements:
- dedicated coach lane, not `chief-agent`
- no mutation of GoalFlow/Recovery/Inbox business objects
- trace events contain `traceId`, `sessionId`, `messageId`
- traces do not store raw user text, only hashes/summary-safe metadata

- [ ] **Step 4: Re-run the targeted API test**

Expected: PASS

## Chunk 2 Review Checkpoint

- [ ] Dispatch a reviewer for **Chunk 2 only**
- [ ] Address any issues before starting Chunk 3

---

## Chunk 3: OpenClaw Runtime and Local Stub Path

### Task 5: Add coach lane targets to env and local runtime

**Files:**
- Modify: `apps/api/src/env.ts`
- Modify: `openclaw/local-runtime/server.mjs`
- Modify: `apps/api/tests/openclaw-local-runtime.test.ts`

- [ ] **Step 1: Write failing runtime tests**

Cover:
- coach-fast target
- coach-full target
- normalized `fastResponse`
- normalized `fullResponse`
- response status transitions

- [ ] **Step 2: Run the targeted runtime test**

Run:

```bash
corepack pnpm --filter @mindanchor/api test -- openclaw-local-runtime.test.ts
```

Expected: FAIL because coach runtime targets do not exist.

- [ ] **Step 3: Register dedicated coach targets**

Add separate execution targets for:
- fast coach response
- full coach response

Keep them isolated from existing Agent Team V1 personas and workflows.

- [ ] **Step 4: Return deterministic stub outputs**

The local runtime should return:
- short `fastResponse`
- richer `fullResponse`
- optional recalled memory summaries
- no raw sensitive echo beyond test-safe structured text

- [ ] **Step 5: Re-run the targeted runtime test**

Expected: PASS

## Chunk 3 Review Checkpoint

- [ ] Dispatch a reviewer for **Chunk 3 only**
- [ ] Address any issues before starting Chunk 4

---

## Chunk 4: macOS Coach Conversation UI and Client API

### Task 6: Add macOS Coach conversation payloads and API client surface

**Files:**
- Modify: `apps/macos/Sources/Core/AppModels.swift`
- Modify: `apps/macos/Sources/Core/MindAnchorAPIProviding.swift`
- Modify: `apps/macos/Sources/Core/APIClient.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/APIClientTests.swift`

- [ ] **Step 1: Write failing API client tests**

Cover:
- create/list/get sessions
- send message
- retry message
- submit feedback
- list memory
- delete memory

- [ ] **Step 2: Run the targeted API client test**

- [ ] **Step 3: Add minimal payload models and client methods**

Do not reuse Agent Team V1 proposal/memory payloads for conversation-lane objects.

- [ ] **Step 4: Re-run the targeted API client test**

Expected: PASS

### Task 7: Extend the existing Coach page with conversation lane UI

**Files:**
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Sources/Features/Coach/CoachView.swift`
- Create: `apps/macos/Sources/Features/Coach/CoachConversationViews.swift`
- Create: `apps/macos/Tests/MindAnchorMacTests/CoachConversationTests.swift`

- [ ] **Step 1: Write failing macOS tests**

Cover:
- default recent session load
- new conversation creation
- send message lifecycle
- visible `fastResponse`
- later `fullResponse`
- pending/failed/retry states
- feedback actions
- memory list and revoke action
- “used in this reply” memory visibility

- [ ] **Step 2: Run the targeted macOS test**

Run:

```bash
rm -rf apps/macos/MindAnchorMac.xcodeproj && \
xcodegen generate --spec apps/macos/project.yml --project apps/macos && \
xcodebuild -project apps/macos/MindAnchorMac.xcodeproj -scheme MindAnchorMac -configuration Debug -destination 'platform=macOS,arch=arm64' CODE_SIGNING_ALLOWED=NO -only-testing:MindAnchorMacTests/CoachConversationTests test
```

Expected: FAIL because the conversation UI does not exist.

- [ ] **Step 3: Build the minimal conversation shell**

Add:
- thread list within existing `Coach` page
- input composer
- response status row
- feedback buttons
- used-memory section
- full memory management section

Keep the current Agent Team V1 controls visible; do not replace them.

- [ ] **Step 4: Re-run the targeted macOS test**

Expected: PASS

## Chunk 4 Review Checkpoint

- [ ] Dispatch a reviewer for **Chunk 4 only**
- [ ] Address any issues before starting Chunk 5

---

## Chunk 5: End-to-End Verification and Runbook

### Task 8: Add end-to-end coach conversation integration coverage

**Files:**
- Modify: `apps/api/tests/conversation-coach.integration.test.ts`
- Modify: `apps/macos/Tests/MindAnchorMacTests/CoachConversationTests.swift`

- [ ] **Step 1: Add negative-path tests**

Cover:
- owner mismatch returns `404`
- deleting a session revokes derived memory
- `fastResponse` success with pending `fullResponse`
- `fullResponse` failure keeps `fastResponse`
- retry semantics
- feedback accepted when only `fastResponse` exists
- suppressed/revoked memory not returned
- trace contains no raw user text

- [ ] **Step 2: Run API and macOS tests**

Run:

```bash
corepack pnpm --filter @mindanchor/api test -- conversation-coach.integration.test.ts
corepack pnpm --filter @mindanchor/macos test
```

Expected: FAIL on the new edge cases.

- [ ] **Step 3: Implement the minimal fixes**

- [ ] **Step 4: Re-run the same tests**

Expected: PASS

### Task 9: Write the local runbook

**Files:**
- Create: `docs/runbooks/macos-conversation-coach-phase1-local-test.md`
- Modify: `docs/runbooks/macos-agent-team-v1-local-test.md`

- [ ] **Step 1: Draft the runbook**

Include:
- required services
- startup order
- how to open the Coach conversation UI
- how to send a message and observe `fastResponse` then `fullResponse`
- how to record feedback
- how to inspect/revoke memory
- how to retry a failed message

- [ ] **Step 2: Add exact commands**

Include:

```bash
corepack pnpm dev:openclaw
corepack pnpm dev:api
corepack pnpm --filter @mindanchor/macos build
corepack pnpm --filter @mindanchor/api test -- conversation-coach.integration.test.ts
corepack pnpm --filter @mindanchor/macos test
```

- [ ] **Step 3: Review and link**

Link the new runbook from the existing macOS runbook when the lane is ready.

## Chunk 5 Review Checkpoint

- [ ] Dispatch a reviewer for **Chunk 5 only**
- [ ] Address any issues before execution handoff

---

## Execution Notes

- Keep the conversation lane isolated from the existing Agent Team V1 lane.
- Do not let Phase 1 write tasks, reminders, or recovery objects.
- Prefer summarized/de-identified text in persistence and trace logs.
- Keep the macOS `Coach` page decomposed into small focused SwiftUI files instead of growing a single giant view.
- Start with Chunk 1 and do not parallelize tasks that modify `packages/domain/src/index.ts` and `apps/api/src/store.ts` at the same time.

Plan complete and saved to `docs/superpowers/plans/2026-03-21-openclaw-conversation-coach-phase1-implementation.md`. Ready to execute?
