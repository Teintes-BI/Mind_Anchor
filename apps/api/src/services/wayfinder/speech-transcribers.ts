import type { SpeechTranscriber, SpeechTranscription } from "./audio-event-service.js";

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type ConsentAwareSpeechTranscriberConfig = {
  remoteEnabled?: boolean;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  fetchImpl?: FetchLike;
};

const unavailable = (): SpeechTranscription => ({
  text: "",
  confidence: 0,
  modelName: "unavailable",
  source: "unavailable",
});

const decodeBase64 = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, "");
  if (!normalized || normalized === "local-only" || !/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    return null;
  }
  const decoded = Buffer.from(normalized, "base64");
  return decoded.length > 0 ? decoded : null;
};

export const pcm16LeToWav = (pcm: Buffer, sampleRate = 16_000) => {
  if (pcm.length === 0 || pcm.length % 2 !== 0) {
    throw new Error("PCM16LE audio must contain a non-empty, even number of bytes.");
  }
  const wav = Buffer.alloc(44 + pcm.length);
  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + pcm.length, 4);
  wav.write("WAVE", 8, "ascii");
  wav.write("fmt ", 12, "ascii");
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(pcm.length, 40);
  pcm.copy(wav, 44);
  return wav;
};

export class ConsentAwareSpeechTranscriber implements SpeechTranscriber {
  private readonly remoteEnabled: boolean;
  private readonly baseUrl?: string;
  private readonly apiKey?: string;
  private readonly model?: string;
  private readonly fetchImpl: FetchLike;

  constructor(config: ConsentAwareSpeechTranscriberConfig = {}) {
    this.remoteEnabled = config.remoteEnabled ?? false;
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async transcribe(input: Parameters<SpeechTranscriber["transcribe"]>[0]): Promise<SpeechTranscription> {
    const transcriptHint = input.transcriptHint?.trim();
    if (transcriptHint) {
      return {
        text: transcriptHint,
        confidence: 0.85,
        modelName: input.transcriptModelName ?? "client-local-asr",
        source: input.transcriptSource ?? "local_hint",
      };
    }

    if (!input.allowCloud || !this.remoteEnabled || !this.baseUrl || !this.model) {
      return unavailable();
    }

    const audio = decodeBase64(input.base64Audio);
    if (!audio) {
      return unavailable();
    }

    let wav: Buffer;
    try {
      wav = input.encoding === "audio/wav" ? audio : pcm16LeToWav(audio);
    } catch {
      return unavailable();
    }

    try {
      const form = new FormData();
      form.append("model", this.model);
      form.append("file", new Blob([new Uint8Array(wav)], { type: "audio/wav" }), "wayfinder-audio.wav");
      const endpoint = new URL("audio/transcriptions", this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`);
      const response = await this.fetchImpl(endpoint.toString(), {
        method: "POST",
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : undefined,
        body: form,
      });
      if (!response.ok) {
        return unavailable();
      }
      const payload = (await response.json()) as { text?: unknown; confidence?: unknown };
      const text = typeof payload.text === "string" ? payload.text.trim() : "";
      if (!text) {
        return unavailable();
      }
      return {
        text,
        confidence:
          typeof payload.confidence === "number" && Number.isFinite(payload.confidence)
            ? Math.min(1, Math.max(0, payload.confidence))
            : 0.75,
        modelName: this.model,
        source: "cloud_openai_compatible",
      };
    } catch {
      return unavailable();
    }
  }
}
