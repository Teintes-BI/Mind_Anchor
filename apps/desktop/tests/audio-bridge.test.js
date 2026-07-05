import test from "node:test";
import assert from "node:assert/strict";
import { buildStubEmotionAssessment, inspectPcm16LeBase64 } from "../audio-emotion.js";
import { isPrivateLanAddress } from "../audio-bridge.js";

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
