# M6 Cadenced Capture Loop Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Android ADB M6 runner with a cadenced scenario that simulates phased signal progression and verifies time-based read-model consistency.

**Architecture:** Keep the current one-shot flow intact and add a `cadenced` scenario mode to `scripts/run-m6-mobile-capture-adb-e2e.mjs`. Extract scenario/phase definitions into a helper so the runner only orchestrates execution, while the report helper renders both top-level and per-phase summaries.

**Tech Stack:** Node.js, built-in `node:test`, existing Fastify Gateway API, ADB, Android shell `curl`

---

## Chunk 1: Scenario and Report Contracts

### Task 1: Define the cadenced dry-run contract

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`
- Create: `scripts/lib/m6-mobile-capture-adb-e2e-scenarios.mjs`
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`

- [ ] **Step 1: Write the failing dry-run test for cadenced scenario**

Add a new test that runs:

```bash
node scripts/run-m6-mobile-capture-adb-e2e.mjs --dry-run --scenario cadenced
```

and asserts:

- `options.scenario === "cadenced"`
- a `phasePlan` array exists
- `phasePlan` contains `baseline`, `stress-build-up`, `recovery-trigger`, `post-recovery`

- [ ] **Step 2: Run the entry test to verify RED**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`

Expected: FAIL because scenario/phase plan is not yet exposed.

- [ ] **Step 3: Implement minimal scenario definition**

Create `scripts/lib/m6-mobile-capture-adb-e2e-scenarios.mjs` with:

- a one-shot scenario definition matching current behavior
- a cadenced scenario definition with ordered phases

Update the runner to parse:

```text
--scenario one-shot|cadenced
```

and expose `scenario` + `phasePlan` in dry-run output.

- [ ] **Step 4: Run the entry test to verify GREEN**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`

Expected: PASS.

## Chunk 2: Report Summary for Cadence

### Task 2: Extend report tests for phased summaries

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`
- Modify: `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`

- [ ] **Step 1: Write the failing report test for successful cadence summary**

Add a test that expects:

```js
assert.equal(summary.phaseCount, 4);
assert.equal(summary.latestHealthProgressed, true);
assert.equal(summary.recoveryPlanPersistedAcrossPhases, true);
assert.equal(summary.postRecoverySamplingAccepted, true);
```

- [ ] **Step 2: Write the failing report test for non-progressing health**

Add a test where all phases reuse the same latest health identity and expect:

```js
assert.equal(summary.passed, false);
assert.match(summary.errorSamples.join("\n"), /latestHealthProgressed/);
```

- [ ] **Step 3: Run the report test to verify RED**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: FAIL because cadence summary fields are not implemented.

- [ ] **Step 4: Implement minimal cadence summary**

Update `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs` to:

- normalize optional `phaseResults`
- compute:
  - `phaseCount`
  - `latestHealthProgressed`
  - `recoveryPlanPersistedAcrossPhases`
  - `postRecoverySamplingAccepted`
- fail the summary if cadence-specific gates are false
- render a `Phases` section in Markdown

- [ ] **Step 5: Run the report test to verify GREEN**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: PASS.

## Chunk 3: Cadenced Runner Execution

### Task 3: Implement phased signal execution

**Files:**
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`
- Modify: `scripts/lib/m6-mobile-capture-adb-e2e-scenarios.mjs`

- [ ] **Step 1: Write the failing report test for missing recovery plan persistence**

Add a report test where recovery exists in one phase but disappears later and expect:

```js
assert.equal(summary.passed, false);
assert.match(summary.errorSamples.join("\n"), /recoveryPlanPersistedAcrossPhases/);
```

- [ ] **Step 2: Run the report tests to verify RED**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: FAIL because cadence persistence is not fully enforced yet.

- [ ] **Step 3: Implement baseline and stress phases**

In the runner, execute the cadenced phases with timestamp progression:

- baseline writes stable signal payloads
- stress phase writes worsening payloads 2–3 times
- each phase records:
  - latest health ID/device
  - latest recovery plan ID
  - inbox count
  - risk level

- [ ] **Step 4: Implement recovery-trigger and post-recovery phases**

Add:

- `POST /recovery/plan`
- `GET /recovery/history`
- post-recovery writes slightly improved payloads
- optional inbox `ack` if new pending message appears

- [ ] **Step 5: Persist phase summaries into the report**

Ensure `report.phaseResults` includes exact phase names and per-phase snapshots.

- [ ] **Step 6: Run the report tests to verify GREEN**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: PASS.

## Chunk 4: End-to-End Verification and Docs

### Task 4: Verify cadenced scenario and update docs

**Files:**
- Modify: `docs/m6-mobile-capture-closed-loop-2026-04-24.md`
- Modify: `tasks.md`

- [ ] **Step 1: Run the full test suite for this feature**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`

Expected: PASS with zero failures.

- [ ] **Step 2: Run dry-run for the cadenced scenario**

Run: `corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced`

Expected: JSON shows `scenario=cadenced` and the ordered phase plan.

- [ ] **Step 3: Run the real-device cadenced scenario**

Run: `corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced`

Expected: a new report under `test-results/` with:

- `phaseCount >= 4`
- `latestHealthProgressed=true`
- `recoveryPlanPersistedAcrossPhases=true`
- `postRecoverySamplingAccepted=true`

- [ ] **Step 4: Update the M6 stage doc**

Record:

- the new cadenced scenario
- the successful report path
- phase-level verification results

- [ ] **Step 5: Update `tasks.md`**

Add checked evidence for the cadenced run and summarize the top-level cadence results.
