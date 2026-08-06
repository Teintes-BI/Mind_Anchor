import test from "node:test";
import assert from "node:assert/strict";
import {
  LocalWhisperTranscriber,
  decodePcm16LeBase64,
  resolveLocalWhisperRemoteConfig,
} from "../local-whisper-transcriber.js";

test("uses a configurable model repository without changing the local ASR contract", () => {
  assert.deepEqual(
    resolveLocalWhisperRemoteConfig({
      remoteHost: "https://modelscope.cn/models/",
      remotePathTemplate: "{model}/resolve/master/",
    }),
    {
      remoteHost: "https://modelscope.cn/models/",
      remotePathTemplate: "{model}/resolve/master/",
    },
  );
});

test("decodes mono PCM16LE into normalized float samples", () => {
  const pcm = Buffer.alloc(6);
  pcm.writeInt16LE(-32768, 0);
  pcm.writeInt16LE(0, 2);
  pcm.writeInt16LE(32767, 4);

  const samples = decodePcm16LeBase64(pcm.toString("base64"));

  assert.equal(samples.length, 3);
  assert.equal(samples[0], -1);
  assert.equal(samples[1], 0);
  assert.ok(samples[2] > 0.999 && samples[2] < 1);
});

test("lazy-loads and reuses one Whisper pipeline", async () => {
  const calls = [];
  const recognizer = async (samples) => {
    calls.push(samples);
    return { text: "  send the preliminary result this afternoon  " };
  };
  let loads = 0;
  const transcriber = new LocalWhisperTranscriber({
    modelName: "test-whisper",
    pipelineFactory: async (task, modelName) => {
      loads += 1;
      assert.equal(task, "automatic-speech-recognition");
      assert.equal(modelName, "test-whisper");
      return recognizer;
    },
  });
  const audio = Buffer.from([0x00, 0x00, 0xff, 0x7f]).toString("base64");

  const first = await transcriber.transcribe({ base64Audio: audio, encoding: "audio/pcm16le" });
  const second = await transcriber.transcribe({ base64Audio: audio, encoding: "audio/pcm16le" });

  assert.equal(loads, 1);
  assert.equal(calls.length, 2);
  assert.deepEqual(first, {
    text: "send the preliminary result this afternoon",
    modelName: "test-whisper",
    source: "local_whisper",
  });
  assert.deepEqual(second, first);
});

test("does not load Whisper when local ASR is explicitly disabled", async () => {
  let loads = 0;
  const transcriber = new LocalWhisperTranscriber({
    enabled: false,
    pipelineFactory: async () => {
      loads += 1;
      return async () => ({ text: "should not run" });
    },
  });

  assert.equal(
    await transcriber.transcribe({ base64Audio: "AA==", encoding: "audio/pcm16le" }),
    null,
  );
  assert.equal(loads, 0);
});
