import test from "node:test";
import assert from "node:assert/strict";
import { buildStubEmotionAssessment, inspectPcm16LeBase64 } from "../audio-emotion.js";
import { buildWayfinderAudioEventPayload, isPrivateLanAddress } from "../audio-bridge.js";

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
