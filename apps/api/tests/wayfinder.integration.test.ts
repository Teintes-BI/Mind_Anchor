import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";

describe("Wayfinder API", () => {
  let dataDir = "";
  let app: Awaited<ReturnType<typeof buildApp>>;
  let env: AppEnv;
  const auth = "Bearer dev:user-a:user-a@example.com";

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-wayfinder-api-"));
    env = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
      agentMode: "stub",
      openClawBaseUrl: undefined,
      supabaseUrl: undefined,
      supabaseJwksUrl: undefined,
      supabaseJwtIssuer: undefined,
      authDevBypassEnabled: true,
      feishuBotWebhookUrl: undefined,
      telegramBotToken: undefined,
      telegramChatId: undefined,
      defaultModelConfig: {
        baseUrl: undefined,
        apiKey: undefined,
        model: "gpt-5.4",
        wireApi: "responses",
        reasoningEffort: "xhigh",
        disableResponseStorage: true,
      },
      agentModelConfigs: Object.fromEntries(
        OPENCLAW_AGENT_NAMES.map((agentName) => [
          agentName,
          {
            baseUrl: undefined,
            apiKey: undefined,
            model: "gpt-5.4",
            wireApi: "responses",
            reasoningEffort: "xhigh",
            disableResponseStorage: true,
          },
        ]),
      ),
    };
    app = await buildApp(env);
  });

  afterEach(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("requires auth and completes an event-to-decision-to-outcome loop", async () => {
    expect((await app.inject({ method: "GET", url: "/wayfinder/decisions" })).statusCode).toBe(401);

    const consent = await app.inject({
      method: "PATCH",
      url: "/wayfinder/consent/phone",
      headers: { authorization: auth },
      payload: {
        purpose: "wayfinder_context",
        scope: "manual_notes",
        status: "granted",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 30,
        modelSharing: "local_only",
      },
    });
    expect(consent.statusCode).toBe(200);
    const consentId = consent.json().id;

    const eventPayload = {
      sourceDeviceId: "phone-1",
      kind: "manual_note",
      occurredAt: "2026-08-05T10:00:00+08:00",
      payload: {
        text: "I am finishing the main analysis, but a colleague asks me to send a preliminary result this afternoon.",
      },
      confidence: 1,
      consentRef: consentId,
      retentionClass: "summary",
      evidenceRefs: ["manual-note-1"],
      traceId: "trace-event-1",
    };
    const firstEvent = await app.inject({
      method: "POST",
      url: "/wayfinder/events",
      headers: { authorization: auth, "idempotency-key": "event-1" },
      payload: eventPayload,
    });
    expect(firstEvent.statusCode).toBe(200);
    expect(firstEvent.json().situation.status).toBe("awaiting_confirmation");
    const situations = await app.inject({
      method: "GET",
      url: "/wayfinder/situations",
      headers: { authorization: auth },
    });
    expect(situations.statusCode).toBe(200);
    expect(situations.json().situations[0].id).toBe(firstEvent.json().situation.id);
    const duplicateEvent = await app.inject({
      method: "POST",
      url: "/wayfinder/events",
      headers: { authorization: auth, "idempotency-key": "event-1" },
      payload: eventPayload,
    });
    expect(duplicateEvent.json().event.id).toBe(firstEvent.json().event.id);
    expect(duplicateEvent.json().situation.id).toBe(firstEvent.json().situation.id);

    const situationId = firstEvent.json().situation.id;
    const confirmed = await app.inject({
      method: "POST",
      url: `/wayfinder/situations/${situationId}/confirm`,
      headers: { authorization: auth },
      payload: { status: "confirmed", traceId: "trace-confirm" },
    });
    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.json().situation.status).toBe("confirmed");
    expect(confirmed.json().fullStatus).toBe("completed");
    expect(confirmed.json().options).toHaveLength(3);
    const option = confirmed.json().options[0];
    const persistedOptions = await app.inject({
      method: "GET",
      url: `/wayfinder/situations/${situationId}/options`,
      headers: { authorization: auth },
    });
    expect(persistedOptions.json().options).toEqual(confirmed.json().options);

    const decision = await app.inject({
      method: "POST",
      url: "/wayfinder/decisions",
      headers: { authorization: auth },
      payload: { situationId, selectedOptionId: option.id, actionStatus: "in_progress", traceId: "trace-decision-api" },
    });
    expect(decision.statusCode).toBe(201);
    const duplicateDecision = await app.inject({
      method: "POST",
      url: "/wayfinder/decisions",
      headers: { authorization: auth },
      payload: { situationId, selectedOptionId: option.id, actionStatus: "in_progress", traceId: "trace-decision-api-duplicate" },
    });
    expect(duplicateDecision.statusCode).toBe(409);
    const outcome = await app.inject({
      method: "PATCH",
      url: `/wayfinder/decisions/${decision.json().id}/outcome`,
      headers: { authorization: auth },
      payload: { status: "observed", summary: "Outline started", traceId: "trace-outcome-api", userRating: 4 },
    });
    expect(outcome.statusCode).toBe(200);
    const history = (await app.inject({ method: "GET", url: "/wayfinder/decisions", headers: { authorization: auth } })).json().decisions;
    expect(history).toHaveLength(1);
    expect(history[0].situation.summary).toContain("main analysis");
    expect(history[0].option.action).toBe(option.action);
  });

  it("does not allow a bearer user to read another user's situation", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/wayfinder/situations/not-owned",
      headers: { authorization: "Bearer dev:user-b:user-b@example.com" },
    });
    expect(response.statusCode).toBe(404);
  });

  it("turns a consented short-audio chunk into a candidate without creating a Task", async () => {
    expect(
      (await app.inject({ method: "POST", url: "/wayfinder/audio-events", payload: {} })).statusCode,
    ).toBe(401);

    const consent = await app.inject({
      method: "PATCH",
      url: "/wayfinder/consent/phone-1",
      headers: { authorization: auth },
      payload: {
        purpose: "wayfinder_voice_candidate",
        scope: "foreground_short_audio",
        status: "granted",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 7,
        modelSharing: "local_only",
      },
    });
    const payload = {
      sourceDeviceId: "phone-1",
      sessionId: "session-api-1",
      sequence: 0,
      startedAt: "2026-08-05T10:00:00+08:00",
      endedAt: "2026-08-05T10:00:05+08:00",
      durationMs: 5000,
      encoding: "audio/pcm16le",
      checksum: "checksum-api-1",
      base64Audio: "raw-audio",
      consentRef: consent.json().id,
      traceId: "trace-audio-api-1",
      transcriptHint: "请把周报发给团队",
    };

    const response = await app.inject({
      method: "POST",
      url: "/wayfinder/audio-events",
      headers: { authorization: auth },
      payload,
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: "candidate",
      situation: { status: "awaiting_confirmation" },
      candidate: { action: "请把周报发给团队" },
    });

    const duplicate = await app.inject({
      method: "POST",
      url: "/wayfinder/audio-events",
      headers: { authorization: auth },
      payload,
    });
    expect(duplicate.statusCode).toBe(200);
    expect(duplicate.json().contextEvent.id).toBe(response.json().contextEvent.id);
    expect((await app.inject({ method: "GET", url: "/tasks?userId=user-a", headers: { authorization: auth } })).json().tasks).toEqual([]);
  });

  it("rejects a short-audio chunk with an unavailable consent before ASR", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/wayfinder/audio-events",
      headers: { authorization: auth },
      payload: {
        sourceDeviceId: "phone-1",
        sessionId: "session-api-denied",
        sequence: 0,
        startedAt: "2026-08-05T10:00:00+08:00",
        endedAt: "2026-08-05T10:00:05+08:00",
        durationMs: 5000,
        encoding: "audio/pcm16le",
        checksum: "checksum-api-denied",
        base64Audio: "local-only",
        consentRef: "missing-consent",
        traceId: "trace-audio-api-denied",
        transcriptHint: "send the report",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ message: "Wayfinder audio consent is required." });
  });

  it("exports and deletes Wayfinder data including health summaries", async () => {
    const consent = await app.inject({
      method: "PATCH",
      url: "/wayfinder/consent/health",
      headers: { authorization: auth },
      payload: {
        purpose: "wayfinder_health_summary",
        scope: "health_summary",
        status: "granted",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 30,
        modelSharing: "local_only",
      },
    });
    expect(consent.statusCode).toBe(200);

    const health = await app.inject({
      method: "POST",
      url: "/health/summaries",
      headers: { authorization: auth },
      payload: {
        userId: "user-a",
        deviceId: "iphone-health",
        sourcePlatform: "ios",
        sourceProvider: "healthkit",
        windowStart: "2026-08-05T00:00:00.000Z",
        windowEnd: "2026-08-06T00:00:00.000Z",
        sleepMinutes: 420,
        consentRef: consent.json().id,
      },
    });
    expect(health.statusCode).toBe(201);

    const exported = await app.inject({ method: "POST", url: "/wayfinder/export", headers: { authorization: auth } });
    expect(exported.statusCode).toBe(200);
    expect(exported.json().healthSnapshots).toHaveLength(1);
    expect(exported.json().memoryCandidates).toEqual([]);
    expect(exported.json().memoryItems).toEqual([]);
    expect(exported.json().auditEvents).toEqual([]);

    const deleted = await app.inject({ method: "POST", url: "/wayfinder/delete", headers: { authorization: auth } });
    expect(deleted.statusCode).toBe(200);
    expect(deleted.json().deleted).toBe(true);

    const afterDelete = await app.inject({ method: "POST", url: "/wayfinder/export", headers: { authorization: auth } });
    expect(afterDelete.statusCode).toBe(200);
    expect(afterDelete.json().healthSnapshots).toEqual([]);
    expect(afterDelete.json().contextEvents).toEqual([]);
    expect(afterDelete.json().memoryCandidates).toEqual([]);
    expect(afterDelete.json().memoryItems).toEqual([]);
    expect(afterDelete.json().auditEvents).toEqual([]);

    await app.close();
    app = await buildApp(env);
    const afterRestart = await app.inject({ method: "POST", url: "/wayfinder/export", headers: { authorization: auth } });
    expect(afterRestart.statusCode).toBe(200);
    expect(afterRestart.json().healthSnapshots).toEqual([]);
    expect(afterRestart.json().contextEvents).toEqual([]);
    expect(afterRestart.json().memoryCandidates).toEqual([]);
    expect(afterRestart.json().memoryItems).toEqual([]);
    expect(afterRestart.json().auditEvents).toEqual([]);
  });

  it("binds health writes to the authenticated user and requires health consent", async () => {
    const consent = await app.inject({
      method: "PATCH",
      url: "/wayfinder/consent/health",
      headers: { authorization: auth },
      payload: {
        purpose: "wayfinder_health_summary",
        scope: "health_summary",
        status: "granted",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 30,
        modelSharing: "local_only",
      },
    });
    expect(consent.statusCode).toBe(200);

    const withoutAuth = await app.inject({
      method: "POST",
      url: "/health/summaries",
      payload: {
        userId: "user-a",
        deviceId: "health-unauthenticated",
        sourcePlatform: "android",
        sourceProvider: "health_connect",
        windowStart: "2026-08-05T00:00:00.000Z",
        windowEnd: "2026-08-06T00:00:00.000Z",
        sleepMinutes: 420,
        consentRef: consent.json().id,
      },
    });
    expect(withoutAuth.statusCode).toBe(401);

    const withoutConsent = await app.inject({
      method: "POST",
      url: "/health/summaries",
      headers: { authorization: auth },
      payload: {
        userId: "user-a",
        deviceId: "health-no-consent",
        sourcePlatform: "android",
        sourceProvider: "health_connect",
        windowStart: "2026-08-05T00:00:00.000Z",
        windowEnd: "2026-08-06T00:00:00.000Z",
        sleepMinutes: 420,
      },
    });
    expect(withoutConsent.statusCode).toBe(403);

    const spoofedUser = await app.inject({
      method: "POST",
      url: "/health/summaries",
      headers: { authorization: auth },
      payload: {
        userId: "user-b",
        deviceId: "health-spoofed-user",
        sourcePlatform: "android",
        sourceProvider: "health_connect",
        windowStart: "2026-08-05T00:00:00.000Z",
        windowEnd: "2026-08-06T00:00:00.000Z",
        sleepMinutes: 420,
        consentRef: consent.json().id,
      },
    });
    expect(spoofedUser.statusCode).toBe(201);
    expect(spoofedUser.json().snapshot.userId).toBe("user-a");
  });
});
