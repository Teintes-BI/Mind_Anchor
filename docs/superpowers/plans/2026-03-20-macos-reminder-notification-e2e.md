# macOS Reminder Notification E2E Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a stable end-to-end macOS acceptance flow that goes from real reminder generation to real system-notification delivery evidence, then status-item restore, then app-driven acknowledgment written back to the server.

**Architecture:** Reuse the existing macOS automation snapshot path for observation, keep reminder generation on the real API/agent path, and keep only the stable black-box steps in the acceptance runner. The final deliverable is focused on one deterministic path: reminder is generated for a fresh user, macOS accepts the notification request into the system layer, the status item restores the reminders page, and the app automation path acknowledges the specific reminder back to Gateway.

**Tech Stack:** SwiftUI/AppKit, XCTest, Node.js acceptance scripts, AppleScript/System Events, Fastify API.

---

## Chunk 1: App observability and test seams

### Task 1: Extend automation snapshot with login/error state
**Files:**
- Modify: `apps/macos/Sources/Core/MacAutomation.swift`
- Modify: `apps/macos/Sources/Core/AppViewModel.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/MacAutomationTests.swift`

- [ ] Step 1: Write failing tests for signed-in and error fields in automation snapshots.
- [ ] Step 2: Run the targeted macOS tests and confirm they fail for the expected missing fields.
- [ ] Step 3: Add the minimal snapshot fields and protocol plumbing.
- [ ] Step 4: Re-run the targeted tests and confirm they pass.

### Task 2: Make macOS app poll intervals configurable for E2E
**Files:**
- Modify: `apps/macos/Sources/Core/AppConfiguration.swift`
- Test: `apps/macos/Tests/MindAnchorMacTests/AppConfigurationTests.swift`

- [ ] Step 1: Write failing tests for env-based overrides of inbox poll and heartbeat intervals.
- [ ] Step 2: Run the new tests and confirm they fail.
- [ ] Step 3: Implement the minimal env override parsing.
- [ ] Step 4: Re-run the tests and confirm they pass.

## Chunk 2: Reminder chain acceptance runner

### Task 3: Build a real reminder E2E runner
**Files:**
- Create: `scripts/run-macos-reminder-notification-e2e.mjs`
- Modify: `apps/macos/package.json`
- Modify: `package.json`

- [ ] Step 1: Write the runner structure and assertions for API start, app start, reminder creation, system-notification request evidence, status-item restore, and ack verification.
- [ ] Step 2: Run the new runner and capture the first real failure.
- [ ] Step 3: Iterate on the runner until it can: register/login a fresh user, create goal/task/session, send medium-risk desktop-only signals, wait for inbox reminder, observe the notification request in the system layer, restore the reminders page from the status item, and acknowledge the exact reminder through the app automation bridge.
- [ ] Step 4: Add workspace scripts for the new acceptance command.

### Task 4: Verify the full flow end to end
**Files:**
- Modify: `apps/macos/Tests/MindAnchorMacTests/ReminderCenterTests.swift` (only if a focused regression is needed)
- Verify: `scripts/run-macos-reminder-notification-e2e.mjs`

- [ ] Step 1: Run `corepack pnpm --filter @mindanchor/macos test`.
- [ ] Step 2: Run `corepack pnpm test:macos:status-item`.
- [ ] Step 3: Run the new reminder notification E2E command and confirm the full chain passes.
- [ ] Step 4: Record any remaining platform flake and bound it with explicit diagnostics instead of silent retries.
