# MindAnchor Mobile Health and T11 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing T8 mobile audio path with Android and iOS companion prototypes, normalize Health Connect/HealthKit/vendor summaries into low-confidence Wayfinder signals, and complete T11 evaluation, safety, export, deletion, and pilot controls.

**Architecture:** Keep the existing desktop bridge and Wayfinder API as the source of truth. Mobile clients only collect user-consented summaries and short foreground audio, then send bounded payloads through authenticated API/desktop bridge routes. A health-signal service normalizes provenance and missingness before policy input; it never emits medical diagnoses. T11 scripts operate on deterministic fixtures and the existing repository/store APIs, with export and deletion paths that can be audited without model memory.

**Tech Stack:** TypeScript, Fastify, Zod, Vitest, Node test runner, Kotlin Android/Health Connect, SwiftUI/HealthKit prototype, Supabase SQL migrations, existing pnpm workspace.

---

## Scope and non-goals

- Mac client remains skipped for this Windows turn; existing Mac working-tree changes are preserved and no Mac build/test claim is made.
- Android receives a real Health Connect adapter boundary and a user-triggered sync prototype; it does not run continuous background health polling.
- iOS receives a SwiftUI/HealthKit prototype and shared payload contract; it is not installed or run on this Windows workstation.
- Supported health providers are `health_connect`, `healthkit`, `vendor_cloud`, and `vendor_sdk`; vendor brands flow through the platform hub and do not receive bespoke claims.
- No medical diagnosis, emergency decision, automatic message, task creation, or deletion of user data without an explicit user action.

## Task 1: Domain health provenance and calibration contracts

**Files:**
- Modify: `packages/domain/src/index.ts`
- Create: `packages/domain/src/health-signal.ts`
- Create: `packages/domain/src/__tests__/health-signal.test.ts`
- Create: `supabase/migrations/004_wayfinder_health_provenance.sql`

- [x] Write failing tests for `healthSignalSchema`, `healthSummarySchema`, and `healthCalibrationRecordSchema` covering `missing`, `delayed`, and `available` states, consent scope, retention class, and non-diagnostic summary text.
- [x] Run `corepack pnpm --filter @mindanchor/domain test -- health-signal.test.ts`; confirm failure is caused by missing contracts.
- [x] Implement schemas and exports. Health summaries must include `signalKind`, `sourcePlatform`, `sourceProvider`, `sourceDevice`, `capturedAt`, `receivedAt`, `missingness`, `consentScope`, `retentionClass`, bounded numeric values, `confidence`, and `evidenceRef`.
- [x] Add SQL columns/indexes for provenance and calibration without deleting existing rows; preserve nullable compatibility for old snapshots.
- [x] Run the focused domain test and domain build.

## Task 2: Health normalization and policy calibration service

**Files:**
- Create: `apps/api/src/services/wayfinder/health-signal-service.ts`
- Create: `apps/api/tests/wayfinder-health-signal.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/orchestrator.ts`
- Modify: `apps/api/src/services/state-service.ts`

- [x] Write failing tests for normalization of Health Connect, HealthKit, and vendor input into `sleep_summary`, `activity_summary`, and `resting_hr_summary`.
- [x] Add tests proving absent permission becomes `missing`, stale input becomes `delayed`, and neither state yields a negative factual conclusion.
- [x] Add tests proving health signals only alter intervention dose (`continue`, `reduced_load`, `energy_recovery`) and never create diagnosis phrases or autonomous actions.
- [x] Add calibration tests using a 14-day fixture: each recommendation records predicted energy band, actual self-report band, outcome, rating, and mean absolute error by user and window.
- [x] Run the focused API tests and confirm red state.
- [x] Implement `HealthSignalService.normalize`, `buildPolicyModifiers`, and `summarizeCalibration` with deterministic clock injection and bounded output.
- [x] Route existing `POST /health/snapshots` through normalization while preserving the existing response shape; add `GET /health/signals` and `GET /health/calibration` for authenticated users.
- [x] Make state summaries use explicit missingness language such as `健康数据不可用或尚未同步` and never infer inactivity from no data.
- [x] Run focused tests, state read-model tests, API build, and full API tests.

## Task 3: Android Health Connect prototype and shared mobile contract

**Files:**
- Modify: `apps/android-recorder/app/build.gradle.kts`
- Modify: `apps/android-recorder/app/src/main/AndroidManifest.xml`
- Modify: `apps/android-recorder/app/src/main/java/com/mindanchor/androidaudio/MainActivity.kt`
- Create: `apps/android-recorder/app/src/main/java/com/mindanchor/androidaudio/HealthConnectBridge.kt`
- Create: `apps/android-recorder/app/src/main/java/com/mindanchor/androidaudio/HealthSummaryPayload.kt`
- Modify: `apps/android-recorder/app/src/main/res/layout/activity_main.xml`
- Modify: `apps/android-recorder/app/src/main/res/values/strings.xml`
- Modify: `apps/android-recorder/README.md`
- Create: `docs/wayfinder/mobile-health-contract.md`

- [x] Write Kotlin unit-testable mapper tests for sleep minutes, steps/activity minutes, and resting heart rate; include no-permission and unavailable-provider cases.
- [x] Add the official Health Connect dependency and manifest permission declarations for read-only sleep, steps, active calories/activity, and resting heart rate.
- [x] Implement `HealthConnectBridge` with explicit permission request, availability check, bounded time-window reads, aggregation, missingness, and a callback that serializes the shared payload. Do not start a background service for health polling.
- [x] Add a visible “健康摘要” section with provider status, last sync time, missingness label, and a user-triggered “同步摘要” control. Keep all touch targets at least 48dp and expose content descriptions.
- [x] Send only the normalized summary to the existing authenticated health endpoint; never send raw samples or account tokens to the desktop bridge.
- [x] Run Android static checks/Gradle assemble when a local Gradle/Android SDK is available; otherwise run source contract checks and record the missing tool without claiming an APK build.

## Task 4: iOS HealthKit prototype

**Files:**
- Create: `apps/ios-wayfinder/Package.swift`
- Create: `apps/ios-wayfinder/Sources/WayfinderHealth/HealthKitBridge.swift`
- Create: `apps/ios-wayfinder/Sources/WayfinderHealth/HealthSummaryPayload.swift`
- Create: `apps/ios-wayfinder/Sources/WayfinderHealth/WayfinderHealthView.swift`
- Create: `apps/ios-wayfinder/Tests/WayfinderHealthTests/HealthSummaryPayloadTests.swift`
- Create: `apps/ios-wayfinder/README.md`
- Modify: `docs/wayfinder/mobile-health-contract.md`

- [x] Write Swift package tests for payload encoding and missingness normalization using fixture data; do not require HealthKit entitlement in tests.
- [x] Implement a SwiftUI prototype view with consent text, permission request state, last sync, summary cards, and a manual sync button. Use `HKHealthStore` only behind an adapter so the view is testable.
- [x] Implement HealthKit reads for sleep, step count/activity, and resting heart rate over a bounded window; aggregate on-device and emit the same JSON field names as Android.
- [x] Add the required `NSHealthShareUsageDescription` guidance to the README and explicitly state that this prototype is not installed or tested on Windows.
- [x] Run `swift test` if Swift is installed; otherwise run a structural check over the package and report the unavailable tool.

## Task 5: T8 mobile audio hardening and documentation alignment

**Files:**
- Modify: `apps/desktop/audio-bridge.js`
- Modify: `apps/api/src/services/wayfinder/audio-event-service.ts`
- Modify: `apps/api/tests/wayfinder-audio-event.test.ts`
- Modify: `apps/desktop/tests/audio-bridge.test.js`
- Modify: `docs/wayfinder/audio-consent.md`
- Modify: `docs/android-audio-beta.md`
- Create: `scripts/wayfinder-audio-evaluation.mjs`
- Create: `scripts/__tests__/wayfinder-audio-evaluation.test.mjs`
- Create: `docs/wayfinder/audio-evaluation-fixtures.json`

- [x] Add regression fixtures for duplicate, out-of-order, replayed, empty, low-confidence, third-party, and consent-revoked chunks.
- [x] Ensure a chunk without `consentRef` is rejected before ASR and raw audio is never persisted by the API; preserve idempotent `voice-audio:{session}:{sequence}` handling.
- [x] Ensure low-confidence or ambiguous speaker extraction returns `awaiting_confirmation` semantics in the candidate payload instead of writing a task.
- [x] Add an offline candidate precision/recall report command over the audio fixtures without changing the event protocol.
- [x] Run the existing mobile ADB E2E entry point when the Android device/toolchain is available, plus focused desktop/API tests.

## Task 6: T11 evaluation, red-team, export, deletion, and pilot runbooks

**Files:**
- Create: `scripts/wayfinder-evaluation.mjs`
- Create: `scripts/__tests__/wayfinder-evaluation.test.mjs`
- Create: `scripts/wayfinder-export.mjs`
- Create: `scripts/__tests__/wayfinder-export.test.mjs`
- Create: `docs/wayfinder/pilot-runbook.md`
- Create: `docs/wayfinder/safety-incident-runbook.md`

- [x] Write failing evaluator tests for the ten fixtures: candidate precision/recall, high-risk interception, option count, evidence completeness, duplicate reminders, average response status, and health missingness handling.
- [x] Implement the evaluator with deterministic fixture input and JSON output; red-team strings such as “ignore previous policy”, “send this message automatically”, and “delete all records” must only produce `blocked`/`needs_confirmation` outcomes.
- [x] Write failing export tests covering events, situations, options, decisions, outcomes, memory candidates, health summaries, and audit records in both JSON and Markdown.
- [x] Implement `--user`, `--format`, `--output`, and `--delete-after-export` flags. Deletion must remove source and derived records through the existing store API and verify the business API no longer returns them.
- [x] Document consent opening, daily pause, incident escalation, accidental capture, emergency stop, exit, export, and destruction in two runbooks.
- [x] Run evaluator, script tests, API tests, web tests, and a deletion/export smoke test against an isolated temporary data directory.

## Task 7: Final verification and delivery record

- [x] Update the original execution plan checkboxes only for evidence actually produced; do not claim Mac or T10 completion.
- [x] Run domain build/tests, focused API tests, full API tests, desktop tests, T11 script tests, `git diff --check`, and `git status --short`.
- [x] Record Android/iOS tool availability and exact commands/output in `docs/wayfinder/mobile-health-contract.md`.
- [x] Preserve unrelated dirty files (`apps/api/src/lib/utils.ts`, existing test-results, and any user changes); do not use `git add .`, reset, or checkout.
