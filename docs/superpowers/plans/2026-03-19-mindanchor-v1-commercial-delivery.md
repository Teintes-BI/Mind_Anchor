# MindAnchor V1 Commercial Delivery Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-shaped MindAnchor V1 that ships a native Mac client, a single-user Gateway, a stable OpenClaw integration path, and a usable Web console for day-to-day review.

**Architecture:** Stabilize the current repository first, because the missing `openclaw/` runtime artifacts and the broken macOS test target prevent safe iteration. After the baseline is green, harden the single-user auth/bootstrap contract, finish the Mac-first product loop, align the Web console to the same read models, and then package the self-hosted guided-install experience for ordinary users.

**Tech Stack:** `pnpm` workspace, Node 22, Fastify, TypeScript, Vitest, React 19 + Vite, SwiftUI + AppKit, XcodeGen, XCTest, self-hosted Gateway + OpenClaw runtime.

---

## Scope Split

The approved V1 spec spans multiple subsystems. This implementation plan keeps one master rollout document, but it is intentionally split into independent chunks:

1. Baseline stabilization
2. Gateway single-user hardening
3. Native macOS client completion
4. Web console V1 alignment
5. Guided deployment and release readiness

Each chunk should produce working, testable software before moving to the next one.

## File Map

### Existing files to treat as V1 core

- `apps/api/src/app.ts` — REST surface, auth endpoints, debug endpoints, read-model routes
- `apps/api/src/orchestrator.ts` — business orchestration and OpenClaw routing
- `apps/api/src/env.ts` — runtime config, agent/provider config parsing
- `apps/api/src/store.ts` — JSON dev storage and read-model persistence
- `apps/api/tests/*.test.ts` — API/unit/integration regression coverage
- `apps/macos/project.yml` — XcodeGen project definition
- `apps/macos/Sources/Core/*.swift` — auth, API access, local state, collector, reminder integration
- `apps/macos/Sources/Features/**/*.swift` — Mac app screens
- `apps/macos/Tests/MindAnchorMacTests/*.swift` — native unit tests
- `apps/web/src/api.ts` — Web API access
- `apps/web/src/App.tsx` — route shell
- `apps/web/src/pages/*.tsx` — Dashboard / GoalFlow / State / Recovery / Reflections / Inbox / Agent Lab pages
- `README.md` — top-level setup and runtime guidance

### Files to create during V1

- `openclaw/local-cluster-server.mjs`
- `openclaw/local-runtime/server.mjs`
- `openclaw/skills/state-ingest-skill.schema.json`
- `openclaw/skills/notification-skill.schema.json`
- `apps/macos/Sources/Core/MindAnchorAPIProviding.swift`
- `apps/macos/Tests/MindAnchorMacTests/APIClientTests.swift`
- `apps/macos/Tests/MindAnchorMacTests/AppViewModelAuthTests.swift`
- `apps/macos/Tests/MindAnchorMacTests/DesktopActivityCollectorTests.swift`
- `apps/macos/Tests/MindAnchorMacTests/ReminderCenterTests.swift`
- `apps/web/src/test/setup.ts`
- `apps/web/src/pages/__tests__/dashboard-smoke.test.tsx`
- `apps/web/src/pages/__tests__/inbox-smoke.test.tsx`
- `docs/macos-v1-install-guide.md`
- `docs/gateway-openclaw-guided-install.md`
- `docs/macos-v1-release-checklist.md`
- `scripts/preflight-v1-stack.sh`

### Structural intent

- Keep OpenClaw local-runtime assets in `openclaw/` so the current Gateway test and smoke infrastructure can use them without path rewrites.
- Keep the native Mac app split into `App`, `Core`, and `Features`, but extract directly testable logic behind protocols instead of forcing XCTest to link against SwiftUI app entrypoints.
- Keep the Web console lightweight; prefer smoke coverage and shared page primitives over a large redesign.

## Chunk 1: Baseline Stabilization

### Task 1: Restore the local OpenClaw runtime artifacts

**Files:**
- Create: `openclaw/local-cluster-server.mjs`
- Create: `openclaw/local-runtime/server.mjs`
- Create: `openclaw/skills/state-ingest-skill.schema.json`
- Create: `openclaw/skills/notification-skill.schema.json`
- Modify: `README.md`
- Test: `apps/api/tests/openclaw-local-runtime.test.ts`
- Test: `apps/api/tests/skill-schema.test.ts`

- [ ] **Step 1: Run the currently failing targeted tests**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run \
  tests/openclaw-local-runtime.test.ts \
  tests/skill-schema.test.ts
```

Expected: FAIL with missing `openclaw/local-runtime/server.mjs` and missing schema files under `openclaw/skills/`.

- [ ] **Step 2: Add a minimal local runtime server module with the API shape the tests expect**

Implementation target:

```js
export function createLocalOpenClawServer(options = {}) {
  return {
    url,
    listen,
    close,
  };
}
```

Requirements:

- support the execute endpoints already referenced by the Gateway
- return deterministic JSON for probe/debug/generate calls
- expose a factory the Vitest suite can import directly

- [ ] **Step 3: Add the missing skill schemas**

Schema content should validate the current Gateway payload contracts instead of inventing a second protocol.

Minimum artifacts:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["..."]
}
```

The actual fields should be copied from the current domain/API payload shapes used in the tests.

- [ ] **Step 4: Re-run the targeted tests**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run \
  tests/openclaw-local-runtime.test.ts \
  tests/skill-schema.test.ts
```

Expected: PASS.

- [ ] **Step 5: Update the top-level docs so runtime assumptions match reality**

Update `README.md` to stop pointing at nonexistent runtime assets and to describe the restored `openclaw/` folder accurately.

- [ ] **Step 6: Checkpoint**

Do not create a git commit unless the user explicitly asks. Record progress in the task tracker or handoff notes if needed.

### Task 2: Make `api` and local phased tests green again

**Files:**
- Modify: `scripts/run-core-phase-tests.mjs`
- Modify: `docs/core-phase-test-runbook.md`
- Modify: `README.md`
- Test: `apps/api/tests/api.integration.test.ts`
- Test: `apps/api/tests/model-bridge.test.ts`
- Test: `test-results/core-phase-*/report.md` (generated artifact)

- [ ] **Step 1: Run the full API suite and record the remaining failures**

Run:

```bash
corepack pnpm --filter @mindanchor/api test
```

Expected: Any remaining red tests should now be unrelated to missing `openclaw/` files.

- [ ] **Step 2: Run the phased local regression and verify where it still stops**

Run:

```bash
corepack pnpm test:core-phases:local
```

Expected: If it still fails, the failure should now be a real contract/startup problem, not a missing-file crash.

- [ ] **Step 3: Patch the phased runner only where it is actually brittle**

Keep current behavior unless failure evidence requires a change. Likely fixes:

- ensure the runner starts the restored local cluster runtime
- ensure cleanup happens even after partial failure
- ensure `report.md` / `report.json` are always written

Do not redesign the whole runner.

- [ ] **Step 4: Re-run the two main regression gates**

Run:

```bash
corepack pnpm --filter @mindanchor/api test
corepack pnpm test:core-phases:local
```

Expected:

- API suite passes
- local phased run exits `0`
- `test-results/<latest>/report.md` and `report.json` both exist

- [ ] **Step 5: Checkpoint**

No commit unless explicitly requested.

## Chunk 2: Gateway Single-User Hardening

### Task 3: Finish the single-user auth and bootstrap contract

**Files:**
- Modify: `apps/api/src/lib/auth.ts`
- Modify: `apps/api/src/lib/gateway-auth.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/store.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `apps/api/tests/api.integration.test.ts`
- Test: `apps/api/tests/env.test.ts`

- [ ] **Step 1: Write or extend failing integration tests for auth precedence**

Cover these cases:

- bearer token user overrides a `userId` in request body/query
- unauthenticated `demo-user` compatibility still works only in dev/fallback paths
- `/client/bootstrap` returns enough data for the Mac app’s first screen

Example assertions:

```ts
expect(response.user.id).toBe(authenticatedUserId);
expect(bootstrap.dashboard).toBeDefined();
expect(bootstrap.inboxOverview).toBeDefined();
```

- [ ] **Step 2: Make token-derived identity the default path everywhere the Mac app uses**

Implementation rule:

```ts
const effectiveUserId = requestAuth?.userId ?? explicitUserId ?? "demo-user";
```

Use this consistently on V1-facing routes instead of mixing divergent behaviors.

- [ ] **Step 3: Tighten the bootstrap payload**

Ensure `GET /client/bootstrap` returns:

- authenticated user identity
- dashboard summary
- inbox overview
- goalflow overview
- permission hints needed by the native client

Keep response shape stable once aligned.

- [ ] **Step 4: Run the auth-related API tests**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run \
  tests/api.integration.test.ts \
  tests/env.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run the full API suite again**

Run:

```bash
corepack pnpm --filter @mindanchor/api test
```

Expected: PASS.

- [ ] **Step 6: Checkpoint**

No commit unless explicitly requested.

### Task 4: Lock the OpenClaw routing contract for V1 workflows

**Files:**
- Modify: `apps/api/src/orchestrator.ts`
- Modify: `apps/api/src/lib/model-bridge.ts`
- Modify: `apps/api/src/lib/openclaw-cluster-client.ts`
- Modify: `apps/api/src/lib/agent-contracts.ts`
- Test: `apps/api/tests/model-bridge.test.ts`
- Test: `apps/api/tests/agent-contracts.test.ts`
- Test: `apps/api/tests/openclaw-local-runtime.test.ts`

- [ ] **Step 1: Add or extend failing tests for the V1 workflow set**

The required workflow list is:

- `state_assessment`
- `task_management`
- `recovery_plan`
- `progress_summary`
- `reflection_report`
- `notification_dispatch`

Each should prove:

- input contract accepted
- OpenClaw route selected
- structured result normalized

- [ ] **Step 2: Make the workflow-to-agent routing explicit and centralized**

The routing table should remain easy to inspect, for example:

```ts
const WORKFLOW_DEFAULT_AGENT = {
  state_assessment: "state-insight-agent",
  ...
};
```

Keep one source of truth.

- [ ] **Step 3: Keep adapter fallback observable, not silent**

Ensure failures preserve:

- `traceId`
- selected route
- fallback reason
- endpoint attempted

This is required for guided support and V1 operations.

- [ ] **Step 4: Re-run the contract-focused tests**

Run:

```bash
corepack pnpm --filter @mindanchor/api exec vitest run \
  tests/model-bridge.test.ts \
  tests/agent-contracts.test.ts \
  tests/openclaw-local-runtime.test.ts
```

Expected: PASS.

- [ ] **Step 5: Re-run phased regression**

Run:

```bash
corepack pnpm test:core-phases:local
```

Expected: PASS with full report output.

- [ ] **Step 6: Checkpoint**

No commit unless explicitly requested.

## Chunk 3: Native macOS Client Completion

### Task 5: Make the macOS core testable and green

**Files:**
- Modify: `apps/macos/project.yml`
- Modify: `apps/macos/Sources/Core/AppConfiguration.swift`
- Modify: `apps/macos/Sources/Core/APIClient.swift`
- Modify: `apps/macos/Sources/Core/LocalStore.swift`
- Modify: `apps/macos/Sources/Core/AppModels.swift`
- Modify: `apps/macos/Tests/MindAnchorMacTests/MindAnchorMacTests.swift`
- Create: `apps/macos/Sources/Core/MindAnchorAPIProviding.swift`
- Create: `apps/macos/Tests/MindAnchorMacTests/APIClientTests.swift`

- [ ] **Step 1: Reproduce the current native test failure**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
```

Expected: FAIL with unresolved `MindAnchorMac.LocalStore` / `DesktopSignalEvent` symbols.

- [ ] **Step 2: Extract testable core code behind a stable module boundary**

Preferred shape:

```swift
protocol MindAnchorAPIProviding {
    func fetchBootstrap(token: String) async throws -> ClientBootstrapPayload
}
```

And ensure the test target links that code without depending on the SwiftUI app entrypoint.

- [ ] **Step 3: Keep the app target depending on the extracted core instead of duplicating code**

Do not fork business logic between app and tests. The same `LocalStore`, `APIClient`, and models should be used by both.

- [ ] **Step 4: Add focused unit tests for the extracted core**

Cover at least:

- `LocalStore` queue persistence
- `LocalStore` reminder snooze persistence
- `APIClient` request decoding / auth header behavior

- [ ] **Step 5: Re-run native build and tests**

Run:

```bash
corepack pnpm --filter @mindanchor/macos build
corepack pnpm --filter @mindanchor/macos test
```

Expected: both PASS.

- [ ] **Step 6: Checkpoint**

No commit unless explicitly requested.

### Task 6: Finish the login → bootstrap → device registration loop

**Files:**
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Sources/Core/APIClient.swift`
- Modify: `apps/macos/Sources/Core/KeychainStore.swift`
- Modify: `apps/macos/Sources/Features/Login/LoginView.swift`
- Create: `apps/macos/Tests/MindAnchorMacTests/AppViewModelAuthTests.swift`

- [ ] **Step 1: Write failing tests for session bootstrap behavior**

Required coverage:

- stored session is restored
- debug bootstrap can register/sign in for QA builds
- failed bootstrap surfaces a user-readable error
- successful bootstrap triggers refresh and background tasks

- [ ] **Step 2: Ensure the view model has injectable dependencies for tests**

Avoid hard-coding `URLSession.shared` / singleton-only behavior when tests need controlled responses.

- [ ] **Step 3: Make login and registration flows deterministic**

Success criteria:

- session is written once
- `/client/bootstrap` is fetched immediately after auth
- device registration begins during background startup

- [ ] **Step 4: Re-run focused auth tests**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
```

Expected: PASS, including the new auth/view-model coverage.

- [ ] **Step 5: Manual smoke the login shell**

Run:

```bash
corepack pnpm --filter @mindanchor/macos build
open -na ~/Library/Developer/Xcode/DerivedData/MindAnchorMac-*/Build/Products/Debug/MindAnchorMac.app
```

Expected:

- login screen appears when no session exists
- after successful auth, app lands in the main shell

- [ ] **Step 6: Checkpoint**

No commit unless explicitly requested.

### Task 7: Complete collector, queue, heartbeat, and reminder flows

**Files:**
- Modify: `apps/macos/Sources/Core/DesktopActivityCollector.swift`
- Modify: `apps/macos/Sources/Core/LocalStore.swift`
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Sources/Core/ReminderCenter.swift`
- Create: `apps/macos/Tests/MindAnchorMacTests/DesktopActivityCollectorTests.swift`
- Create: `apps/macos/Tests/MindAnchorMacTests/ReminderCenterTests.swift`

- [ ] **Step 1: Write failing tests for collector and reminder behavior**

Cover:

- frontmost app switch emits `active_app` and `window_switch`
- idle cooldown throttles repeat signals
- snoozed reminders do not re-fire
- acknowledging a reminder clears local seen/snooze state

- [ ] **Step 2: Make collector state observable without weakening runtime behavior**

A good seam is a small wrapper around system event sources so tests can inject fake idle/app changes.

- [ ] **Step 3: Ensure queue flush + heartbeat flows update local diagnostics**

Success criteria:

- queue depth is visible
- last sync time is stored
- last heartbeat time is stored
- error text is human-readable

- [ ] **Step 4: Ensure reminders only fire for `desktop_local + pending` messages**

Keep the current product rule explicit:

```swift
guard message.channel == "desktop_local", message.status == "pending" else { return false }
```

- [ ] **Step 5: Re-run macOS tests and manual sync smoke**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
```

Manual smoke:

- queue events while API is down
- restore API
- verify queued events flush and inbox refreshes

- [ ] **Step 6: Checkpoint**

No commit unless explicitly requested.

### Task 8: Bring the Mac UI to V1 parity

**Files:**
- Modify: `apps/macos/Sources/App/MainWindowShell.swift`
- Modify: `apps/macos/Sources/Features/Today/TodayView.swift`
- Modify: `apps/macos/Sources/Features/Goals/GoalsTasksView.swift`
- Modify: `apps/macos/Sources/Features/State/StateView.swift`
- Modify: `apps/macos/Sources/Features/Reflections/ReflectionsView.swift`
- Modify: `apps/macos/Sources/Features/Reminders/RemindersView.swift`
- Modify: `apps/macos/Sources/Features/Settings/SettingsView.swift`

- [ ] **Step 1: Add explicit loading, empty, and error states to each V1 page**

Each screen should clearly show one of:

- loading
- content
- empty state
- recoverable error

- [ ] **Step 2: Wire each screen to the already-fetched read models**

Avoid duplicate network orchestration in individual views. `AppViewModel` should remain the state hub for V1.

- [ ] **Step 3: Expose the operational diagnostics ordinary users need**

At minimum:

- API base URL
- queue length
- last sync time
- last error
- permission status
- current account identity

- [ ] **Step 4: Manual QA the full app shell**

Checklist:

- menu-bar resident behavior
- close window hides instead of exits
- Today shows summary and reminders
- Settings shows permissions/build info
- Reminders supports acknowledge flow

- [ ] **Step 5: Re-run build and tests**

Run:

```bash
corepack pnpm --filter @mindanchor/macos build
corepack pnpm --filter @mindanchor/macos test
```

Expected: PASS.

- [ ] **Step 6: Checkpoint**

No commit unless explicitly requested.

## Chunk 4: Web Console V1 Alignment

### Task 9: Align core pages to the approved V1 read-model experience

**Files:**
- Modify: `apps/web/src/api.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/pages/DashboardPage.tsx`
- Modify: `apps/web/src/pages/TasksPage.tsx`
- Modify: `apps/web/src/pages/StatePage.tsx`
- Modify: `apps/web/src/pages/RecoveryPage.tsx`
- Modify: `apps/web/src/pages/ReflectionsPage.tsx`
- Modify: `apps/web/src/pages/InboxPage.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Add explicit empty/loading/error handling to each V1 page**

The UI must never fail as a blank panel if an endpoint is slow or empty.

- [ ] **Step 2: Make wording consistent with the V1 product language**

Use the same terminology across pages:

- GoalFlow
- 状态趋势
- 恢复建议
- 复盘
- 收件箱

- [ ] **Step 3: Ensure each page consumes only approved Gateway read models**

No page should depend on hidden local heuristics or ad-hoc client-side derivation for core product meaning.

- [ ] **Step 4: Rebuild the Web app**

Run:

```bash
corepack pnpm --filter @mindanchor/web build
```

Expected: PASS.

- [ ] **Step 5: Manual smoke the main pages**

Open the app and verify:

- Dashboard loads
- GoalFlow loads
- State/Recovery/Reflections/Inbox all load
- top-level nav stays usable during failures

- [ ] **Step 6: Checkpoint**

No commit unless explicitly requested.

### Task 10: Add lightweight automated Web smoke coverage

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/src/pages/__tests__/dashboard-smoke.test.tsx`
- Create: `apps/web/src/pages/__tests__/inbox-smoke.test.tsx`

- [ ] **Step 1: Add a minimal test runner instead of a large new frontend stack**

Prefer `Vitest + Testing Library` over heavyweight E2E for V1 smoke coverage.

- [ ] **Step 2: Write failing smoke tests for Dashboard and Inbox**

Example shape:

```tsx
render(<DashboardPage />);
expect(screen.getByText("Gateway 与 OpenClaw 总览")).toBeInTheDocument();
```

And for Inbox:

```tsx
expect(screen.getByText("提醒与行为结论")).toBeInTheDocument();
```

- [ ] **Step 3: Mock the API layer instead of real network for these tests**

Keep the tests fast and deterministic.

- [ ] **Step 4: Run the new Web tests and build**

Run:

```bash
corepack pnpm --filter @mindanchor/web exec vitest run
corepack pnpm --filter @mindanchor/web build
```

Expected: PASS.

- [ ] **Step 5: Checkpoint**

No commit unless explicitly requested.

## Chunk 5: Guided Deployment And Release Readiness

### Task 11: Package the ordinary-user guided install flow

**Files:**
- Create: `docs/gateway-openclaw-guided-install.md`
- Create: `docs/macos-v1-install-guide.md`
- Create: `scripts/preflight-v1-stack.sh`
- Modify: `README.md`
- Modify: `docs/local-development.md`

- [ ] **Step 1: Write the deployment preflight checklist**

It must answer:

- what machine can host Gateway/OpenClaw
- what ports/URLs are needed
- what the Mac client needs to connect
- how to verify health before login

- [ ] **Step 2: Add a simple preflight script**

Expected responsibilities:

```bash
./scripts/preflight-v1-stack.sh --gateway-url http://... --openclaw-url http://...
```

Checks:

- gateway health
- required env presence
- OpenClaw reachability
- readable next-step output

- [ ] **Step 3: Write the Mac install and first-connect guide**

Include:

- install app
- first launch
- grant notifications
- sign in
- verify dashboard/reminders are live

- [ ] **Step 4: Validate docs against a fresh local run**

Run through the docs using the current local stack and fix any drift immediately.

- [ ] **Step 5: Checkpoint**

No commit unless explicitly requested.

### Task 12: Define release verification and V1 acceptance

**Files:**
- Create: `docs/macos-v1-release-checklist.md`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-03-19-mindanchor-v1-commercial-delivery-design.md`

- [ ] **Step 1: Translate the spec acceptance criteria into a release checklist**

The checklist must cover:

- server health
- auth works
- device registration works
- signal upload works
- reminder reaches Mac app
- reflection is visible in client/Web

- [ ] **Step 2: Add exact verification commands**

Minimum commands:

```bash
corepack pnpm --filter @mindanchor/api test
corepack pnpm test:core-phases:local
corepack pnpm --filter @mindanchor/web exec vitest run
corepack pnpm --filter @mindanchor/web build
corepack pnpm --filter @mindanchor/macos build
corepack pnpm --filter @mindanchor/macos test
```

- [ ] **Step 3: Add manual QA gates for the native app**

Checklist:

- first launch
- login
- permissions
- reminder delivery
- queue recovery after offline period
- close-to-tray behavior

- [ ] **Step 4: Review the spec and README against the finished checklist**

Ensure docs all describe the same V1, not three different product versions.

- [ ] **Step 5: Final checkpoint**

No commit unless explicitly requested.

## Execution Notes

- Start with Chunk 1. Do not jump to Mac UI polish while the repo baseline is red.
- Treat `apps/desktop` and `apps/android-recorder` as non-blocking V1 legacy assets.
- Do not add audio/video/health functionality to the main path during this plan.
- Keep all new behavior behind the single-user V1 boundary.

## Verification Gate Before Calling V1 “Ready”

The work is not ready to hand off until all of the following are true:

- `corepack pnpm --filter @mindanchor/api test` passes
- `corepack pnpm test:core-phases:local` passes
- `corepack pnpm --filter @mindanchor/web exec vitest run` passes
- `corepack pnpm --filter @mindanchor/web build` passes
- `corepack pnpm --filter @mindanchor/macos build` passes
- `corepack pnpm --filter @mindanchor/macos test` passes
- the manual Mac login → signal upload → reminder loop is verified
- the guided-install docs match the actual shipping flow

