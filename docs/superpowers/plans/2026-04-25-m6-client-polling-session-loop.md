# M6 Client Polling Session Loop Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed-duration authenticated client polling loop to the Android ADB M6 e2e runner.

**Architecture:** Keep the existing cadenced and authenticated client-session flow intact. Add a new optional `--with-client-polling` subflow that runs after the authenticated client session has a bearer token, polls bootstrap/inbox/overview for a fixed duration, records round-level state, and lets the report helper enforce polling consistency.

**Tech Stack:** Node.js, built-in `node:test`, existing Fastify Gateway API, ADB, Android shell `curl`

---

## Chunk 1: Dry-Run Contract

### Task 1: Expose polling defaults

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`

- [ ] Add a failing dry-run test for `--with-client-polling`.
- [ ] Assert `options.withClientPolling === true`.
- [ ] Assert polling auto-enables client session semantics.
- [ ] Assert default `durationMs=30000` and `intervalMs=5000`.
- [ ] Implement parsing and dry-run metadata.
- [ ] Run the entry test to green.

## Chunk 2: Report Contract

### Task 2: Enforce polling summary gates

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`
- Modify: `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`

- [ ] Add a failing report test for polling success.
- [ ] Add a failing report test for a failed polling round.
- [ ] Add a failing report test for ack not visible during polling.
- [ ] Implement polling normalization, summary fields, errors, and Markdown rendering.
- [ ] Run report tests to green.

## Chunk 3: Runner Execution

### Task 3: Run fixed-duration polling

**Files:**
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`

- [ ] Add polling state to the report object.
- [ ] After authenticated client session, run fixed-duration polling if enabled.
- [ ] Each round calls `/client/bootstrap`, `/client/inbox`, `/client/inbox/overview`.
- [ ] Record round-level results and ack visibility.
- [ ] Populate response IDs and polling summary state.
- [ ] Run local feature tests.

## Chunk 4: Verification and Docs

### Task 4: Validate with Android device and update tracking

**Files:**
- Modify: `docs/m6-mobile-capture-closed-loop-2026-04-24.md`
- Modify: `tasks.md`

- [ ] Run dry-run with polling enabled.
- [ ] Run real-device polling e2e.
- [ ] Verify report summary has `clientPollingCompleted=true`, `clientPollingAllOk=true`, and `clientPollingAckStatusStable=true`.
- [ ] Update M6 stage doc with report path and results.
- [ ] Update `tasks.md` with the completed polling evidence.
