# M6 Refresh Token Recovery Loop Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add refresh token issue/rotate/revoke semantics to gateway-local auth and verify them from the Android ADB M6 e2e runner.

**Architecture:** Store only hashed opaque refresh tokens in the local Gateway data file. Keep access JWT validation unchanged. Add optional runner flow that persists the refresh token on Android, reloads it, refreshes, verifies old-token rejection, verifies rotated access-token reads, logs out, then verifies post-logout refresh rejection.

**Tech Stack:** Node.js, Fastify, Zod, Vitest, built-in `node:test`, ADB, Android shell `curl`

---

## Chunk 1: API Contract

### Task 1: Add refresh/logout API tests

**Files:**
- Modify: `apps/api/tests/api.integration.test.ts`

- [x] Assert register/login return non-null refresh token.
- [x] Add refresh rotation test.
- [x] Assert old refresh token reuse returns `401`.
- [x] Add logout revoke test.
- [x] Assert post-logout refresh returns `401`.

## Chunk 2: Auth Implementation

### Task 2: Persist and rotate refresh tokens

**Files:**
- Modify: `packages/domain/src/index.ts`
- Modify: `apps/api/src/lib/gateway-auth.ts`
- Modify: `apps/api/src/store.ts`
- Modify: `apps/api/src/app.ts`

- [x] Add auth refresh/logout schemas.
- [x] Add `localAuthRefreshTokens` database table schema.
- [x] Generate opaque refresh tokens and store only hashes.
- [x] Issue refresh tokens on register/login.
- [x] Implement `/auth/refresh` rotation.
- [x] Implement `/auth/logout` revoke.
- [x] Run API tests to green.

## Chunk 3: Runner Contract

### Task 3: Add refresh recovery report gates

**Files:**
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-entry.test.mjs`
- Modify: `scripts/__tests__/m6-mobile-capture-adb-e2e-report.test.mjs`
- Modify: `scripts/lib/m6-mobile-capture-adb-e2e-report.mjs`
- Modify: `scripts/run-m6-mobile-capture-adb-e2e.mjs`

- [x] Add dry-run coverage for `--with-refresh-token-recovery`.
- [x] Add report success/failure tests.
- [x] Add summary fields and Markdown rendering.
- [x] Redact auth tokens from JSON reports.
- [x] Add Android refresh-token persistence, reload, rotate, revoke, and cleanup.

## Chunk 4: Verification and Docs

### Task 4: Run true-device acceptance

**Files:**
- Modify: `docs/m6-mobile-capture-closed-loop-2026-04-24.md`
- Modify: `tasks.md`

- [x] Run API integration tests.
- [x] Run runner entry/report tests.
- [x] Run dry-run with refresh-token recovery.
- [x] Run Android true-device e2e with polling, session recovery, and refresh-token recovery.
- [x] Confirm report has `passed=true` and no raw token leakage.
- [x] Update M6 docs and task tracking.
