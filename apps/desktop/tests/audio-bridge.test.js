import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildStubEmotionAssessment, inspectPcm16LeBase64 } from "../audio-emotion.js";
import {
  buildMobileAudioConsentPayload,
  buildMobileHealthConsentPayload,
  buildWayfinderAudioEventPayload,
  canForwardRawAudio,
  createAudioBridge,
  isPrivateLanAddress,
} from "../audio-bridge.js";

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const reservePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });

test("builds a bounded foreground voice consent request for a paired mobile device", () => {
  assert.deepEqual(
    buildMobileAudioConsentPayload({ deviceId: "android-1", status: "granted" }),
    {
      purpose: "wayfinder_voice_candidate",
      scope: "foreground_short_audio",
      status: "granted",
      rawRetentionSeconds: 0,
      derivedRetentionDays: 7,
      modelSharing: "local_only",
    },
  );
  assert.equal(
    buildMobileAudioConsentPayload({ status: "granted", allowCloudTranscription: true }).modelSharing,
    "selected_provider",
  );
});

test("forwards raw audio only when the operator and persisted consent both allow it", () => {
  assert.equal(canForwardRawAudio({ remoteEnabled: false, modelSharing: "selected_provider" }), false);
  assert.equal(canForwardRawAudio({ remoteEnabled: true, modelSharing: "local_only" }), false);
  assert.equal(canForwardRawAudio({ remoteEnabled: true, modelSharing: "selected_provider" }), true);
  assert.equal(canForwardRawAudio({ remoteEnabled: true, modelSharing: "any_configured_provider" }), true);
});

test("builds a separate health-summary consent request", () => {
  assert.deepEqual(buildMobileHealthConsentPayload({ status: "granted" }), {
    purpose: "wayfinder_health_summary",
    scope: "health_summary",
    status: "granted",
    rawRetentionSeconds: 0,
    derivedRetentionDays: 30,
    modelSharing: "local_only",
  });
});

test("detects private LAN addresses", () => {
  assert.equal(isPrivateLanAddress("192.168.1.4"), true);
  assert.equal(isPrivateLanAddress("10.0.0.5"), true);
  assert.equal(isPrivateLanAddress("172.20.4.2"), true);
  assert.equal(isPrivateLanAddress("8.8.8.8"), false);
});

test("derives RMS and peak from base64 PCM", () => {
  const sample = Buffer.alloc(8);
  sample.writeInt16LE(0, 0);
  sample.writeInt16LE(8192, 2);
  sample.writeInt16LE(-8192, 4);
  sample.writeInt16LE(0, 6);

  const stats = inspectPcm16LeBase64(sample.toString("base64"));
  assert.equal(stats.peak > 0.2, true);
  assert.equal(stats.rms > 0.1, true);
});

test("builds a stub emotion assessment", () => {
  const emotion = buildStubEmotionAssessment({
    userId: "demo-user",
    deviceId: "android-1",
    sessionId: "session-1",
    chunkSequence: 3,
    windowStart: new Date().toISOString(),
    windowEnd: new Date().toISOString(),
    rms: 0.42,
    peak: 0.85,
  });

  assert.equal(typeof emotion.summary, "string");
  assert.equal(typeof emotion.stressScore, "number");
  assert.equal(["calm", "neutral", "positive", "tense", "stressed"].includes(emotion.emotionLabel), true);
});

test("builds a consented Wayfinder audio payload without forwarding raw audio by default", () => {
  const payload = buildWayfinderAudioEventPayload({
    userId: "demo-user",
    session: { consentRef: "consent-1" },
    body: {
      deviceId: "android-1",
      sessionId: "session-1",
      sequence: 2,
      startedAt: "2026-08-05T10:00:00.000Z",
      endedAt: "2026-08-05T10:00:05.000Z",
      encoding: "audio/pcm16le",
      checksum: "checksum-2",
      base64Audio: "raw-audio",
      transcript: "请把周报发给团队",
    },
  });

  assert.equal(payload.consentRef, "consent-1");
  assert.equal(payload.transcriptHint, "请把周报发给团队");
  assert.equal(payload.base64Audio, "local-only");
});

test("does not create a Wayfinder audio payload without consent", () => {
  assert.equal(
    buildWayfinderAudioEventPayload({
      userId: "demo-user",
      session: {},
      body: { transcript: "请完成任务" },
    }),
    null,
  );
});

test("does not allow a chunk to replace the session consent reference", () => {
  assert.equal(
    buildWayfinderAudioEventPayload({
      userId: "demo-user",
      session: { consentRef: "consent-1" },
      body: { consentRef: "consent-2", transcript: "send the report" },
    }),
    null,
  );
});

test("requires explicit consent on every mobile chunk and deduplicates replayed sequences", async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-audio-bridge-"));
  const port = await reservePort();
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const parsedURL = new URL(url);
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ method: options.method ?? "GET", path: parsedURL.pathname, body });
    if (parsedURL.pathname.startsWith("/wayfinder/consent/")) {
      return jsonResponse({ id: "consent-1", status: body.status, source: "android-1", modelSharing: body.modelSharing });
    }
    if (parsedURL.pathname === "/mobile/devices/register") return jsonResponse({ id: "device-1" }, 201);
    if (parsedURL.pathname === "/mobile/capture/sessions/start") return jsonResponse({ id: "session-1" }, 201);
    if (parsedURL.pathname === "/mobile/capture/sessions/end") return jsonResponse({ sessionId: "session-1" });
    if (parsedURL.pathname === "/emotion/assessments") return jsonResponse({ id: "emotion-1" }, 201);
    if (parsedURL.pathname === "/wayfinder/audio-events") return jsonResponse({ status: "candidate" });
    if (parsedURL.pathname === "/health/summaries") return jsonResponse({ healthSummary: { missingness: "available" } }, 201);
    if (parsedURL.pathname === "/state/signals/batch") return jsonResponse({ accepted: 1 });
    throw new Error(`Unexpected fake API call: ${parsedURL.pathname}`);
  };

  const bridge = createAudioBridge({
    dataDir,
    apiBaseUrl: "http://api.test",
    port,
    publishStatus: () => {},
    localTranscriber: {
      transcribe: async () => ({
        text: "send the preliminary result this afternoon",
        modelName: "test-local-whisper",
        source: "local_whisper",
      }),
    },
  });

  try {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const baseURL = `http://127.0.0.1:${port}`;
    const pairResponse = await originalFetch(`${baseURL}/local/mobile/pair`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairCode: bridge.getSummary().pairCode, deviceId: "android-1" }),
    });
    const pairing = await pairResponse.json();
    assert.equal(pairResponse.status, 200);

    const consentResponse = await originalFetch(`${baseURL}/local/mobile/audio/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairToken: pairing.pairToken, deviceId: "android-1", status: "granted" }),
    });
    const consent = await consentResponse.json();
    assert.equal(consentResponse.status, 200);
    assert.equal(consent.consentRef, "consent-1");
    assert.equal(calls.find((call) => call.path === "/wayfinder/consent/android-1").method, "PATCH");

    const sessionResponse = await originalFetch(`${baseURL}/local/mobile/audio/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pairToken: pairing.pairToken,
        deviceId: "android-1",
        consentRef: consent.consentRef,
      }),
    });
    assert.equal(sessionResponse.status, 200);

    const chunk = {
      pairToken: pairing.pairToken,
      deviceId: "android-1",
      sessionId: "session-1",
      sequence: 0,
      startedAt: "2026-08-06T00:00:00.000Z",
      endedAt: "2026-08-06T00:00:05.000Z",
      durationMs: 5000,
      encoding: "audio/pcm16le",
      checksum: "checksum-1",
      base64Audio: Buffer.from("pcm").toString("base64"),
      consentRef: consent.consentRef,
      rms: 0.2,
      peak: 0.4,
    };
    const withoutConsent = await originalFetch(`${baseURL}/local/mobile/audio/chunks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chunk, consentRef: undefined }),
    });
    assert.equal(withoutConsent.status, 403);

    const firstChunk = await originalFetch(`${baseURL}/local/mobile/audio/chunks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    });
    assert.equal(firstChunk.status, 200);
    const wayfinderCall = calls.find((call) => call.path === "/wayfinder/audio-events");
    assert.equal(wayfinderCall.body.transcriptHint, "send the preliminary result this afternoon");
    assert.equal(wayfinderCall.body.transcriptModelName, "test-local-whisper");
    assert.equal(wayfinderCall.body.transcriptSource, "local_whisper");
    assert.equal(wayfinderCall.body.base64Audio, "local-only");
    const emotionCallsAfterFirstChunk = calls.filter((call) => call.path === "/emotion/assessments").length;

    const duplicateChunk = await originalFetch(`${baseURL}/local/mobile/audio/chunks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chunk, replayed: true }),
    });
    assert.equal(duplicateChunk.status, 200);
    assert.equal((await duplicateChunk.json()).duplicate, true);
    assert.equal(calls.filter((call) => call.path === "/emotion/assessments").length, emotionCallsAfterFirstChunk);

    const outOfOrderChunk = await originalFetch(`${baseURL}/local/mobile/audio/chunks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chunk, sequence: 2, checksum: "checksum-2" }),
    });
    assert.equal(outOfOrderChunk.status, 200);
    const lateChunk = await originalFetch(`${baseURL}/local/mobile/audio/chunks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chunk, sequence: 1, checksum: "checksum-1" }),
    });
    assert.equal(lateChunk.status, 200);

    const emptyChunk = await originalFetch(`${baseURL}/local/mobile/audio/chunks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chunk, sequence: 1, base64Audio: "" }),
    });
    assert.equal(emptyChunk.status, 400);

    const revokeResponse = await originalFetch(`${baseURL}/local/mobile/audio/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairToken: pairing.pairToken, deviceId: "android-1", status: "revoked" }),
    });
    assert.equal(revokeResponse.status, 200);
    const blockedAfterRevoke = await originalFetch(`${baseURL}/local/mobile/audio/chunks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...chunk, sequence: 3, checksum: "checksum-3" }),
    });
    assert.equal(blockedAfterRevoke.status, 403);

    const healthWithoutConsent = await originalFetch(`${baseURL}/local/mobile/health/summaries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pairToken: pairing.pairToken,
        deviceId: "android-1",
        sleepMinutes: 420,
      }),
    });
    assert.equal(healthWithoutConsent.status, 403);

    const healthConsentResponse = await originalFetch(`${baseURL}/local/mobile/health/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairToken: pairing.pairToken, deviceId: "android-1", status: "granted" }),
    });
    const healthConsent = await healthConsentResponse.json();
    assert.equal(healthConsentResponse.status, 200);
    assert.equal(calls.filter((call) => call.path === "/wayfinder/consent/android-1").length, 3);

    const healthSummaryResponse = await originalFetch(`${baseURL}/local/mobile/health/summaries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pairToken: pairing.pairToken,
        deviceId: "android-1",
        consentRef: healthConsent.consentRef,
        sourcePlatform: "android",
        sourceProvider: "health_connect",
        windowStart: "2026-08-05T00:00:00.000Z",
        windowEnd: "2026-08-06T00:00:00.000Z",
        sleepMinutes: 420,
      }),
    });
    assert.equal(healthSummaryResponse.status, 200);
    const healthApiCall = calls.find((call) => call.path === "/health/summaries");
    assert.equal(healthApiCall.body.consentRef, healthConsent.consentRef);

    await originalFetch(`${baseURL}/local/mobile/health/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairToken: pairing.pairToken, deviceId: "android-1", status: "revoked" }),
    });
    const healthAfterRevoke = await originalFetch(`${baseURL}/local/mobile/health/summaries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pairToken: pairing.pairToken,
        deviceId: "android-1",
        consentRef: healthConsent.consentRef,
        sourcePlatform: "android",
        sourceProvider: "health_connect",
        windowStart: "2026-08-05T00:00:00.000Z",
        windowEnd: "2026-08-06T00:00:00.000Z",
        sleepMinutes: 420,
      }),
    });
    assert.equal(healthAfterRevoke.status, 403);
  } finally {
    bridge.dispose();
    globalThis.fetch = originalFetch;
    await rm(dataDir, { recursive: true, force: true });
  }
});
