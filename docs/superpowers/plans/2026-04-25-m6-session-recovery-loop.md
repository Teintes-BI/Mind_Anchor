# M6 Session Recovery Loop Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Android-side access-token persistence and recovery verification to the M6 ADB e2e runner.

**Architecture:** Keep the existing cadenced, authenticated session, and polling flows intact. Add an optional `--with-session-recovery` subflow that writes the access token to Android temp storage, reloads it later, verifies authenticated client endpoints with the reloaded token, and renders recovery-specific report gates.

**Tech Stack:** Node.js, built-in `node:test`, ADB, Android shell `curl`, existing Gateway auth API

---

## Chunk 1: Dry-Run Contract

### Task 1: Expose session recovery mode

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`

- [ ] Add a failing dry-run test for `--with-session-recovery`.
- [ ] Assert it auto-enables client session.
- [ ] Assert dry-run includes token persistence/reload recovery plan.
- [ ] Implement CLI parsing and dry-run metadata.
- [ ] Run entry tests to green.

## Chunk 2: Report Contract

### Task 2: Add recovery summary gates

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`
- Modify: `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`

- [ ] Add recovery success test.
- [ ] Add token reload failure test.
- [ ] Add recovered user mismatch test.
- [ ] Implement normalization, summary fields, error samples, and Markdown rendering.
- [ ] Run report tests to green.

## Chunk 3: Runner Recovery Flow

### Task 3: Persist and reload token on Android

**Files:**
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`

- [ ] Add recovery state to report.
- [ ] Persist token to Android temp storage without printing token.
- [ ] Reload token from Android after client session/polling.
- [ ] Use reloaded token for `/me`, `/client/bootstrap`, `/client/inbox`, `/client/inbox/overview`.
- [ ] Delete the Android temp token file.
- [ ] Run focused tests.

## Chunk 4: Verification and Docs

### Task 4: Run real-device recovery and update tracking

**Files:**
- Modify: `docs/m6-mobile-capture-closed-loop-2026-04-24.md`
- Modify: `tasks.md`

- [ ] Run dry-run with recovery enabled.
- [ ] Run real-device e2e with polling and recovery.
- [ ] Verify summary recovery gates are true.
- [ ] Update M6 stage doc with report path.
- [ ] Update `tasks.md`.
