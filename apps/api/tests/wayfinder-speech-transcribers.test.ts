import { describe, expect, it, vi } from "vitest";
import {
  ConsentAwareSpeechTranscriber,
  pcm16LeToWav,
} from "../src/services/wayfinder/speech-transcribers.js";

const input = (overrides: Record<string, unknown> = {}) => ({
  userId: "user-a",
  sourceDeviceId: "phone-1",
  sessionId: "session-1",
  sequence: 0,
  encoding: "audio/pcm16le" as const,
  base64Audio: Buffer.from([0x00, 0x00, 0xff, 0x7f]).toString("base64"),
  allowCloud: false,
  ...overrides,
});

describe("ConsentAwareSpeechTranscriber", () => {
  it("uses a transcript hint without calling a cloud provider", async () => {
    const fetchImpl = vi.fn();
    const transcriber = new ConsentAwareSpeechTranscriber({
      remoteEnabled: true,
      baseUrl: "https://model.test/v1",
      apiKey: "secret",
      model: "whisper-1",
      fetchImpl,
    });

    await expect(transcriber.transcribe(input({
      transcriptHint: "  send the preliminary result  ",
      transcriptModelName: "onnx-community/whisper-small",
      transcriptSource: "local_whisper",
    }))).resolves.toMatchObject({
      text: "send the preliminary result",
      modelName: "onnx-community/whisper-small",
      source: "local_whisper",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("never uploads audio when provider sharing is not allowed", async () => {
    const fetchImpl = vi.fn();
    const transcriber = new ConsentAwareSpeechTranscriber({
      remoteEnabled: true,
      baseUrl: "https://model.test/v1",
      apiKey: "secret",
      model: "whisper-1",
      fetchImpl,
    });

    await expect(transcriber.transcribe(input())).resolves.toMatchObject({ text: "", source: "unavailable" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("uploads an in-memory WAV only when capability and consent both allow cloud ASR", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const form = init?.body as FormData;
      const file = form.get("file") as File;
      const bytes = Buffer.from(await file.arrayBuffer());
      expect(file.type).toBe("audio/wav");
      expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString("ascii")).toBe("WAVE");
      expect(bytes.readUInt32LE(40)).toBe(4);
      expect(form.get("model")).toBe("whisper-1");
      return new Response(JSON.stringify({ text: "send the preliminary result this afternoon" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    const transcriber = new ConsentAwareSpeechTranscriber({
      remoteEnabled: true,
      baseUrl: "https://model.test/v1/",
      apiKey: "secret",
      model: "whisper-1",
      fetchImpl,
    });

    await expect(transcriber.transcribe(input({ allowCloud: true }))).resolves.toMatchObject({
      text: "send the preliminary result this afternoon",
      modelName: "whisper-1",
      source: "cloud_openai_compatible",
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://model.test/v1/audio/transcriptions");
    expect(fetchImpl.mock.calls[0]?.[1]?.headers).toMatchObject({ Authorization: "Bearer secret" });
  });

  it.each([
    new Response("upstream unavailable", { status: 503 }),
    new Response(JSON.stringify({ text: "   " }), { status: 200, headers: { "Content-Type": "application/json" } }),
  ])("fails closed for unusable cloud responses", async (response) => {
    const transcriber = new ConsentAwareSpeechTranscriber({
      remoteEnabled: true,
      baseUrl: "https://model.test/v1",
      apiKey: "secret",
      model: "whisper-1",
      fetchImpl: vi.fn(async () => response),
    });

    await expect(transcriber.transcribe(input({ allowCloud: true }))).resolves.toMatchObject({
      text: "",
      confidence: 0,
      source: "unavailable",
    });
  });
});

describe("pcm16LeToWav", () => {
  it("creates a mono 16 kHz PCM WAV without touching disk", () => {
    const pcm = Buffer.from([0x00, 0x00, 0xff, 0x7f]);
    const wav = pcm16LeToWav(pcm);

    expect(wav).toHaveLength(48);
    expect(wav.readUInt16LE(22)).toBe(1);
    expect(wav.readUInt32LE(24)).toBe(16_000);
    expect(wav.readUInt16LE(34)).toBe(16);
    expect(wav.subarray(44)).toEqual(pcm);
  });
});
