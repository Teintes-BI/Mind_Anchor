# M6 Recovery Closed Loop Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Android ADB M6 e2e to cover recovery plan creation, recovery history verification, and inbox/dashboard consistency checks.

**Architecture:** Reuse the existing `scripts/run-m6-mobile-capture-adb-e2e.mjs` runner and extend its endpoint sequence, response extraction, read-model checks, and reports. Keep the API surface unchanged and validate the new behavior first through failing dry-run/report tests, then with a real-device end-to-end run.

**Tech Stack:** Node.js, built-in `node:test`, existing Fastify Gateway API, ADB, Android shell `curl`

---

## Chunk 1: Report Contract

### Task 1: Extend report tests for recovery fields

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`
- Modify: `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`

- [ ] **Step 1: Write the failing summary test for recovery success**

Add a test that expects recovery read-model flags to exist and pass:

```js
assert.deepEqual(summary.readModels, {
  healthLatestReflectsDevice: true,
  dashboardReflectsDevice: true,
  inboxOverviewOk: true,
  inboxAckReflected: true,
  recoveryPlanCreated: true,
  recoveryHistoryReflectsPlan: true,
  recoveryInboxConsistent: true,
  recoveryDashboardConsistent: true,
});
```

- [ ] **Step 2: Write the failing summary test for missing recovery history reflection**

Add a test where `recoveryHistoryReflectsPlan` is `false` and expect:

```js
assert.equal(summary.passed, false);
assert.match(summary.errorSamples.join("\n"), /recoveryHistoryReflectsPlan/);
```

- [ ] **Step 3: Run the report tests to verify RED**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: FAIL because recovery fields are not yet part of the report summary.

- [ ] **Step 4: Implement minimal report changes**

Update `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs` to:

- include recovery steps in `M6_MOBILE_CAPTURE_ENDPOINT_PLAN`
- include recovery read-model flags in the normalized summary
- fail summary when any recovery flag is `false`
- render recovery flags in Markdown

- [ ] **Step 5: Run the report tests to verify GREEN**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: PASS.

## Chunk 2: Runner Dry-Run Contract

### Task 2: Extend dry-run tests and endpoint plan

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`
- Modify: `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`

- [ ] **Step 1: Write the failing dry-run test**

Extend the expected endpoint plan list with:

```js
"POST /recovery/plan",
"GET /recovery/history",
```

- [ ] **Step 2: Run the dry-run test to verify RED**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`

Expected: FAIL because dry-run does not yet expose recovery steps.

- [ ] **Step 3: Implement minimal endpoint-plan update**

Add recovery steps to `M6_MOBILE_CAPTURE_ENDPOINT_PLAN` in the correct order after `audio-session-end` and before dashboard/overview reads.

- [ ] **Step 4: Run the dry-run test to verify GREEN**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`

Expected: PASS.

## Chunk 3: Real Runner Recovery Flow

### Task 3: Add recovery plan and history execution to the runner

**Files:**
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`
- Test: `scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

- [ ] **Step 1: Add failing report test for recovery plan creation failure**

Add a test that sets `recoveryPlanCreated: false` and expects the report to fail.

- [ ] **Step 2: Run the report test to verify RED**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: FAIL because `recoveryPlanCreated` is not yet enforced.

- [ ] **Step 3: Implement minimal runner flow**

In `scripts/run-m6-mobile-capture-adb-e2e.mjs`:

- call `POST /recovery/plan` after `audio-session-end`
- call `GET /recovery/history`
- extract and store `recoveryPlanId`
- set:
  - `recoveryPlanCreated`
  - `recoveryHistoryReflectsPlan`
  - `recoveryInboxConsistent`
  - `recoveryDashboardConsistent`

Use the current session/task/user context generated earlier in the run.

- [ ] **Step 4: Run the report tests to verify GREEN**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: PASS.

## Chunk 4: Full Verification and Docs

### Task 4: Verify end-to-end and update docs

**Files:**
- Modify: `docs/m6-mobile-capture-closed-loop-2026-04-24.md`
- Modify: `tasks.md`

- [ ] **Step 1: Run both test files**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`

Expected: PASS with zero failures.

- [ ] **Step 2: Run dry-run verification**

Run: `corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run`

Expected: JSON output includes recovery steps and unchanged ADB requirements.

- [ ] **Step 3: Run the real-device flow**

Run: `corepack pnpm e2e:m6-mobile-capture-adb`

Expected: report files created under `test-results/` and summary indicates recovery flags are all `true`.

- [ ] **Step 4: Update M6 docs**

Record:

- the new stage name `M6 Recovery Closed Loop`
- the new recovery verification steps
- the latest successful report path

- [ ] **Step 5: Update `tasks.md`**

Add a new checked item for the recovery closed loop run and summarize the evidence.
