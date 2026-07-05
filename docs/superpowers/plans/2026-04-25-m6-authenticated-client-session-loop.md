# M6 Authenticated Client Session Loop Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real authenticated client-session layer on top of the existing cadenced Android ADB e2e flow using a fixed local account and bearer token.

**Architecture:** Keep the existing `cadenced` data flow unchanged and add an optional `--with-client-session` subflow to the same runner. The runner logs in with a fixed local account, auto-registers only on first use, then uses the returned `accessToken` for `/me`, `/client/bootstrap`, `/client/inbox`, and `ack` verification while the report helper renders auth/session-specific results.

**Tech Stack:** Node.js, built-in `node:test`, existing Fastify Gateway API, ADB, Android shell `curl`

---

## Chunk 1: Dry-Run Contract for Client Session

### Task 1: Expose authenticated client-session mode in dry-run

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`

- [ ] **Step 1: Write the failing dry-run test**

Add a test for:

```bash
node scripts/run-m6-mobile-capture-adb-e2e.mjs --dry-run --scenario cadenced --with-client-session
```

and assert:

- `options.withClientSession === true`
- fixed auth email is exposed in a non-secret way
- client session step list includes `auth/login`, `client/bootstrap`, and `client/inbox`

- [ ] **Step 2: Run the entry test to verify RED**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`

Expected: FAIL because client-session dry-run metadata is not implemented.

- [ ] **Step 3: Implement minimal dry-run metadata**

Update the runner to parse:

```text
--with-client-session
```

and expose:

- `withClientSession`
- fixed auth email
- client session plan

- [ ] **Step 4: Run the entry test to verify GREEN**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`

Expected: PASS.

## Chunk 2: Report Contract for Authenticated Session

### Task 2: Extend report tests for auth/session summary

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`
- Modify: `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`

- [ ] **Step 1: Write the failing report test for successful authenticated session**

Add a test expecting:

```js
assert.equal(summary.authMode, "local-account");
assert.equal(summary.authLoggedIn, true);
assert.equal(summary.clientMeOk, true);
assert.equal(summary.clientBootstrapOk, true);
assert.equal(summary.clientInboxOk, true);
```

- [ ] **Step 2: Write the failing report test for missing bootstrap reflection**

Add a test where `clientBootstrapOk=false` and expect:

```js
assert.equal(summary.passed, false);
assert.match(summary.errorSamples.join("\n"), /clientBootstrapOk/);
```

- [ ] **Step 3: Run the report tests to verify RED**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: FAIL because auth/session summary fields are not implemented.

- [ ] **Step 4: Implement minimal report support**

Update the report helper to normalize and render:

- `authMode`
- `authRegistered`
- `authLoggedIn`
- `clientMeOk`
- `clientBootstrapOk`
- `clientInboxOk`
- `clientAckReflected`

- [ ] **Step 5: Run the report tests to verify GREEN**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: PASS.

## Chunk 3: Authenticated Session Execution

### Task 3: Implement login/register/bootstrap/inbox flow

**Files:**
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`

- [ ] **Step 1: Add failing report test for ack not reflected under authenticated session**

Add a report test where authenticated session exists but `clientAckReflected=false` and expect failure.

- [ ] **Step 2: Run the report tests to verify RED**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: FAIL because `clientAckReflected` is not enforced yet.

- [ ] **Step 3: Implement fixed-account auth flow**

In the runner:

- define fixed email/password envs
- attempt `POST /auth/login`
- on first-use failure, `POST /auth/register`, then `POST /auth/login`
- capture:
  - `authUserId`
  - `authEmail`
  - `accessToken`

- [ ] **Step 4: Implement authenticated client reads**

Use the real bearer token for:

- `GET /me`
- `GET /client/bootstrap`
- `GET /client/inbox`
- optional `POST /client/inbox/:messageId/ack`
- `GET /client/inbox/overview`

- [ ] **Step 5: Persist auth/session report fields**

Populate:

- `authMode`
- `authRegistered`
- `authLoggedIn`
- `clientMeOk`
- `clientBootstrapOk`
- `clientInboxOk`
- `clientAckReflected`
- `responseIds.authUserId`
- `responseIds.authEmail`
- `responseIds.clientBootstrapUserId`

- [ ] **Step 6: Run the report tests to verify GREEN**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`

Expected: PASS.

## Chunk 4: Full Verification and Docs

### Task 4: Verify authenticated client session and update docs

**Files:**
- Modify: `docs/m6-mobile-capture-closed-loop-2026-04-24.md`
- Modify: `tasks.md`

- [ ] **Step 1: Run the local test suite for this feature**

Run: `node --test scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs scripts/__tests__/m6-mobile-capture-adb-e2e-scenarios.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run dry-run with authenticated session**

Run: `corepack pnpm e2e:m6-mobile-capture-adb -- --dry-run --scenario cadenced --with-client-session`

Expected: JSON includes `withClientSession=true` and client-session plan.

- [ ] **Step 3: Run real-device authenticated session**

Run: `corepack pnpm e2e:m6-mobile-capture-adb -- --scenario cadenced --with-client-session`

Expected: report indicates:

- `authLoggedIn=true`
- `clientMeOk=true`
- `clientBootstrapOk=true`
- `clientInboxOk=true`
- `clientAckReflected=true` or explicit “no pending message” note

- [ ] **Step 4: Update the M6 stage doc**

Record:

- fixed-account real auth flow
- successful report path
- auth/session outcome

- [ ] **Step 5: Update `tasks.md`**

Add checked evidence for the authenticated client-session run and summarize the auth/bootstrap/inbox results.
