# Wayfinder Live Options and ASR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically generate three persisted Wayfinder options after confirmation and provide local-first, explicitly consented cloud-fallback speech transcription.

**Architecture:** A focused API option-generation service uses the existing `ModelBridge` and deterministic OpenClaw worker fallback. Desktop audio uses a lazy local Whisper adapter; the API exposes a separate OpenAI-compatible transcription adapter whose invocation is gated by the persisted consent grant.

**Tech Stack:** TypeScript, Fastify, Zod, Vitest, Electron/Node.js, `@huggingface/transformers`, Kotlin Android, OpenAI-compatible audio transcription.

---

### Task 1: Automatic option generation

**Files:**
- Create: `apps/api/src/services/wayfinder/option-generation-service.ts`
- Create: `apps/api/tests/wayfinder-option-generation.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/routes/wayfinder.ts`
- Modify: `apps/api/tests/wayfinder.integration.test.ts`

- [ ] Write a failing service test that requests three drafts and verifies scoped, persisted `DecisionOption` records.
- [ ] Run `corepack pnpm --dir apps/api exec vitest run tests/wayfinder-option-generation.test.ts` and confirm the service is missing.
- [ ] Implement the service with `ModelBridge.generateJson`, schema normalization, and `architectWayfinderOptions` fallback.
- [ ] Inject the service into Wayfinder routes and generate options when a situation is confirmed.
- [ ] Replace manual option seeding in the integration scenario with assertions on the three generated options.
- [ ] Run focused tests and commit.

### Task 2: Consent-aware API speech transcription

**Files:**
- Create: `apps/api/src/services/wayfinder/speech-transcribers.ts`
- Create: `apps/api/tests/wayfinder-speech-transcribers.test.ts`
- Modify: `apps/api/src/env.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/services/wayfinder/audio-event-service.ts`
- Modify: `apps/api/src/services/wayfinder/consent-service.ts`

- [ ] Write failing tests proving transcript hints bypass cloud, `local_only` blocks cloud, provider sharing enables cloud, PCM is uploaded as WAV, and empty provider responses fail closed.
- [ ] Run the focused test and confirm the transcriber module is missing.
- [ ] Implement hybrid and OpenAI-compatible transcribers with in-memory PCM-to-WAV conversion.
- [ ] Resolve ASR configuration without exposing secrets and validate the stored consent grant before cloud use.
- [ ] Run focused audio/API tests and commit.

### Task 3: Desktop local Whisper and Android cloud consent control

**Files:**
- Create: `apps/desktop/local-whisper-transcriber.js`
- Create: `apps/desktop/tests/local-whisper-transcriber.test.js`
- Modify: `apps/desktop/audio-bridge.js`
- Modify: `apps/desktop/tests/audio-bridge.test.js`
- Modify: `apps/desktop/package.json`
- Modify: `apps/android-recorder/app/src/main/java/com/mindanchor/androidaudio/MainActivity.kt`
- Modify: `apps/android-recorder/app/src/main/java/com/mindanchor/androidaudio/AudioCaptureService.kt`
- Modify: `apps/android-recorder/app/src/main/java/com/mindanchor/androidaudio/LanBridgeClient.kt`
- Modify: `apps/android-recorder/app/src/main/res/layout/activity_main.xml`
- Modify: `apps/android-recorder/app/src/main/res/values/strings.xml`

- [ ] Write failing desktop tests for PCM decoding, lazy local transcription, transcript-first forwarding, and consent-gated raw forwarding.
- [ ] Install `@huggingface/transformers` in the desktop workspace.
- [ ] Implement lazy local Whisper inference and integrate it before candidate forwarding.
- [ ] Add an off-by-default Android switch, pass the choice into audio consent, and preserve it for the capture session.
- [ ] Run desktop tests and Android unit/assemble checks when the SDK is available, then commit.

### Task 4: Scenario, production verification, and deployment

**Files:**
- Create: `scripts/wayfinder-interruption-scenario.mjs`
- Create: `scripts/__tests__/wayfinder-interruption-scenario.test.mjs`
- Modify: `package.json`
- Modify: `docs/wayfinder/pilot-runbook.md`

- [ ] Write a failing script test for consent, situation, confirmation, three options, decision, outcome, and history.
- [ ] Implement the reusable scenario runner and CLI entry.
- [ ] Run domain build, API tests, Web tests, desktop tests, scenario tests, production build, and `git diff --check`.
- [ ] Configure the server ASR environment without printing secrets, deploy the commits, run the scenario against the server, and probe a consented cloud transcription only if the provider supports it.
- [ ] Push `codex/wayfinder-t6` to GitHub and record any provider/tool limitation explicitly.
