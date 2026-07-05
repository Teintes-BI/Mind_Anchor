# MindAnchor macOS Pre-Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current macOS mainline from “E2E proven” into a pre-release-quality candidate that ordinary users can install, understand, and troubleshoot.

**Architecture:** Keep the current architecture intact: `apps/macos` remains the main client, `apps/api` remains the Gateway, and OpenClaw remains the only intelligent backend. This rollout focuses on product hardening around onboarding, permissions, connectivity, reminders, and release materials rather than adding new sensing modules.

**Tech Stack:** SwiftUI + AppKit, XCTest, XcodeGen, Node.js, Fastify, pnpm workspace, OpenClaw-backed Gateway, Markdown docs.

---

## Scope Split

This plan is intentionally limited to one product line:

1. First-run and permissions hardening
2. Connectivity and queue resilience polish
3. Mac product-page completion
4. Pre-release packaging and documentation

Android, iOS, audio, video, health, and official signed distribution stay out of scope for this plan.

## File Map

### Existing Mac client files expected to change

- `apps/macos/Sources/Core/AppConfiguration.swift` — runtime feature flags and environment toggles
- `apps/macos/Sources/Core/AppViewModel.swift` — bootstrap flow, connection state, reminder refresh, error surfacing
- `apps/macos/Sources/Core/PermissionsDiagnostics.swift` — notification / accessibility diagnostics
- `apps/macos/Sources/Core/DesktopActivityCollector.swift` — collector health and degraded mode reporting
- `apps/macos/Sources/Core/LocalStore.swift` — cached runtime metadata, queue state, diagnostics persistence
- `apps/macos/Sources/Core/ReminderCenter.swift` — user-facing reminder presentation behavior
- `apps/macos/Sources/Core/AppModels.swift` — local diagnostic / connection models
- `apps/macos/Sources/Features/Login/LoginView.swift` — first-run / sign-in UX
- `apps/macos/Sources/Features/Today/TodayView.swift` — current state and health cards
- `apps/macos/Sources/Features/Reminders/RemindersView.swift` — inbox clarity and action affordances
- `apps/macos/Sources/Features/Settings/SettingsView.swift` — permissions, connection, account, logs, support
- `apps/macos/Sources/Features/Shared/SupportViews.swift` — reusable diagnostic rows, banners, empty/error states
- `apps/macos/Sources/App/MainWindowShell.swift` — page layout and sidebar-level badges

### Existing Gateway / docs files expected to change

- `apps/api/src/app.ts` — if bootstrap or diagnostics payloads need small compatible extensions
- `apps/api/tests/api.integration.test.ts` — bootstrap/read-model regression coverage if API payload expands
- `README.md` — top-level doc navigation
- `docs/macos-mainline-runbook.md` — update once hardening lands
- `docs/local-development.md` — Mac-first developer startup notes

### Existing tests expected to change

- `apps/macos/Tests/MindAnchorMacTests/AppConfigurationTests.swift`
- `apps/macos/Tests/MindAnchorMacTests/AppViewModelAuthTests.swift`
- `apps/macos/Tests/MindAnchorMacTests/DesktopActivityCollectorTests.swift`
- `apps/macos/Tests/MindAnchorMacTests/ReminderCenterTests.swift`
- `apps/macos/Tests/MindAnchorMacTests/MacAutomationTests.swift`

### New docs to create

- `docs/macos-pre-release-checklist.md`
- `docs/macos-install-and-first-run.md`

## Chunk 1: First-Run and Permissions Hardening

### Task 1: Make first-run state explicit and user-readable

**Files:**
- Modify: `apps/macos/Sources/Core/AppModels.swift`
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Sources/Features/Login/LoginView.swift`
- Modify: `apps/macos/Sources/Features/Shared/SupportViews.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/AppViewModelAuthTests.swift`

- [ ] **Step 1: Write failing tests for first-run bootstrap state**

Cover:

- stored session missing
- bootstrap login pending
- bootstrap failure showing actionable copy
- signed-in but bootstrap payload unavailable

- [ ] **Step 2: Run the targeted auth tests and confirm failure**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
```

Expected: red tests around missing first-run / bootstrap state handling.

- [ ] **Step 3: Add a dedicated first-run / bootstrap status model**

Keep it small. It should represent:

- not signed in
- signing in / bootstrapping
- signed in but degraded
- ready

- [ ] **Step 4: Surface the new status in `LoginView` and shared support UI**

Requirements:

- clear loading copy
- clear failure copy
- retry entry
- no ambiguous blank screen

- [ ] **Step 5: Re-run the macOS test suite**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
```

Expected: green.

### Task 2: Complete permission diagnostics and degraded-mode copy

**Files:**
- Modify: `apps/macos/Sources/Core/PermissionsDiagnostics.swift`
- Modify: `apps/macos/Sources/Core/DesktopActivityCollector.swift`
- Modify: `apps/macos/Sources/Features/Settings/SettingsView.swift`
- Modify: `apps/macos/Sources/Features/Today/TodayView.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/DesktopActivityCollectorTests.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/AppViewModelAuthTests.swift`

- [ ] **Step 1: Write failing tests for degraded collector states**

Cover:

- notifications denied
- frontmost-app collection unavailable
- collector disabled by environment
- accessibility-dependent signal path unavailable

- [ ] **Step 2: Run targeted tests and confirm failure**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
```

- [ ] **Step 3: Add explicit diagnostics output for each missing permission / degraded capability**

The user should be able to tell:

- what is missing
- which signal path is affected
- whether the app still works in degraded mode

- [ ] **Step 4: Show these diagnostics in `Settings` and summarized form in `Today`**

Do not add a new page. Reuse existing surfaces.

- [ ] **Step 5: Re-run the full macOS suite**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
```

Expected: green.

## Chunk 2: Connectivity and Queue Resilience

### Task 3: Make sync / queue / heartbeat state understandable

**Files:**
- Modify: `apps/macos/Sources/Core/LocalStore.swift`
- Modify: `apps/macos/Sources/Core/AppModels.swift`
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Sources/Features/Today/TodayView.swift`
- Modify: `apps/macos/Sources/Features/Settings/SettingsView.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/MindAnchorMacTests.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/ReminderCenterTests.swift`

- [ ] **Step 1: Write failing tests for connection diagnostics persistence**

Cover:

- queue depth visible after enqueue
- last sync timestamp updates after flush
- last heartbeat timestamp updates after heartbeat
- last error survives failed sync and clears after successful retry

- [ ] **Step 2: Run the targeted tests and verify they fail**

- [ ] **Step 3: Expand the local diagnostic model with explicit connection-state fields**

Keep the fields product-readable, not just raw debug values.

- [ ] **Step 4: Render the connection state in `Today` and `Settings`**

Minimum output:

- current API base URL
- queue depth
- last sync time
- last heartbeat time
- last error

- [ ] **Step 5: Re-run the macOS suite**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
```

Expected: green.

### Task 4: Bound reminder polling failures and ack errors with user-facing behavior

**Files:**
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Sources/Core/ReminderCenter.swift`
- Modify: `apps/macos/Sources/Features/Reminders/RemindersView.swift`
- Modify: `apps/macos/Sources/Features/Shared/SupportViews.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/ReminderCenterTests.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/MacAutomationTests.swift`

- [ ] **Step 1: Write failing tests for reminder polling and ack failure presentation**

Cover:

- inbox fetch fails
- ack request fails
- snoozed reminder stays local-only
- target message ack succeeds while other pending messages remain

- [ ] **Step 2: Run targeted reminder tests and verify failure**

- [ ] **Step 3: Tighten reminder error handling in `AppViewModel`**

Rules:

- show actionable errors
- do not wipe loaded inbox state on transient failure
- keep ack behavior target-specific

- [ ] **Step 4: Make `RemindersView` reflect transient vs persistent failure clearly**

No redesign needed; just remove ambiguity.

- [ ] **Step 5: Re-run unit tests and both macOS acceptance commands**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
corepack pnpm test:macos:status-item
corepack pnpm test:macos:reminder-e2e
```

Expected: all green.

## Chunk 3: Product-Page Completion

### Task 5: Make `Today` a useful operational homepage

**Files:**
- Modify: `apps/macos/Sources/Features/Today/TodayView.swift`
- Modify: `apps/macos/Sources/Features/Shared/SupportViews.swift`
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/AppViewModelAuthTests.swift`

- [ ] **Step 1: Define the minimal `Today` card set**

It must show:

- current account / connection status
- latest state summary
- recent activity summary
- next suggested action
- recent reminder summary

- [ ] **Step 2: Add failing tests where logic is extracted**

Only test extracted view-model logic, not visual minutiae.

- [ ] **Step 3: Implement the minimal `Today` card layout**

Prefer existing view primitives over new abstractions.

- [ ] **Step 4: Run the macOS suite**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
```

Expected: green.

### Task 6: Make `Settings` the real diagnostics and support page

**Files:**
- Modify: `apps/macos/Sources/Features/Settings/SettingsView.swift`
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Modify: `apps/macos/Sources/Core/LocalStore.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/MindAnchorMacTests.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/AppViewModelAuthTests.swift`

- [ ] **Step 1: Decide the fixed sections of `Settings`**

Keep:

- account
- permissions
- device / connection
- local diagnostics
- support / log export placeholder

- [ ] **Step 2: Write failing tests for any new derived state**

- [ ] **Step 3: Implement the page sections without adding new navigation**

- [ ] **Step 4: Add a simple diagnostics export path if feasible**

If full export is too large, start with a local text/JSON snapshot export.

- [ ] **Step 5: Re-run the macOS suite and status-item acceptance**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
corepack pnpm test:macos:status-item
```

Expected: green.

## Chunk 4: Pre-Release Materials and Checklist

### Task 7: Write installation and first-run docs for another Mac

**Files:**
- Create: `docs/macos-install-and-first-run.md`
- Modify: `docs/macos-mainline-runbook.md`
- Modify: `README.md`

- [ ] **Step 1: Document the exact environment prerequisites**

- [ ] **Step 2: Document the exact command sequence for first launch**

- [ ] **Step 3: Document what “success” looks like at each stage**

- [ ] **Step 4: Link the docs from `README.md` and the runbook**

- [ ] **Step 5: Manually proofread for cross-machine handoff clarity**

### Task 8: Create a pre-release checklist and freeze the current release gate

**Files:**
- Create: `docs/macos-pre-release-checklist.md`
- Modify: `docs/macos-mainline-runbook.md`
- Modify: `README.md`

- [ ] **Step 1: Define the current release gate**

It should include:

- build
- macOS tests
- status-item acceptance
- reminder E2E
- doc completeness
- known non-goals

- [ ] **Step 2: Record current accepted limitations explicitly**

Include:

- no official Apple signing identity required yet
- no real notification click automation required
- no Android / audio / video / health in this gate

- [ ] **Step 3: Add the checklist file and link it from docs**

- [ ] **Step 4: Run the final verification commands**

Run:

```bash
corepack pnpm --filter @mindanchor/macos test
corepack pnpm test:macos:status-item
corepack pnpm test:macos:reminder-e2e
```

Expected: all green, with docs aligned to the actual gate.

## Execution Order

Run chunks in this order:

1. Chunk 1 — First-run and permissions
2. Chunk 2 — Connectivity and queue resilience
3. Chunk 3 — Product-page completion
4. Chunk 4 — Pre-release materials and checklist

Do not start Android / media work during this rollout.

## Completion Gate

This plan is complete only when:

- the Mac client is easier for a non-author user to understand
- the current mainline acceptance still passes
- the project has installation, first-run, runbook, and checklist coverage
- the repository has a clear “Mac pre-release candidate” story

Plan complete and saved to `docs/superpowers/plans/2026-03-21-macos-pre-release-hardening.md`. Ready to execute?
