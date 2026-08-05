import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MindAnchorStore } from "../src/store.js";
import { WayfinderConsentService } from "../src/services/wayfinder/consent-service.js";
import {
  WayfinderAudioEventService,
  extractVoiceCandidate,
  type SpeechTranscriber,
} from "../src/services/wayfinder/audio-event-service.js";
import { WayfinderRepository } from "../src/services/wayfinder/wayfinder-repository.js";
import { WayfinderSituationService } from "../src/services/wayfinder/situation-service.js";

const date = "2026-08-05T10:00:00.000Z";

describe("Wayfinder audio event service", () => {
  let dataDir = "";
  let store: MindAnchorStore;
  let repository: WayfinderRepository;
  let consent: WayfinderConsentService;
  let situations: WayfinderSituationService;
  let transcriber: SpeechTranscriber;
  let service: WayfinderAudioEventService;
  let consentId = "";

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-wayfinder-audio-"));
    store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();
    repository = new WayfinderRepository(store);
    consent = new WayfinderConsentService(repository);
    situations = new WayfinderSituationService(repository);
    const grant = await consent.upsert(
      "user-a",
      {
        source: "phone-1",
        purpose: "wayfinder_voice_candidate",
        scope: "foreground_short_audio",
        status: "granted",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 7,
        modelSharing: "local_only",
      },
      "trace-consent",
    );
    consentId = grant.id;
    transcriber = {
      transcribe: vi.fn(async () => ({
        text: "请在周五前把预算发给李明",
        confidence: 0.82,
        modelName: "fixture-asr-v1",
        source: "fixture",
      })),
    };
    service = new WayfinderAudioEventService({ repository, consent, situations, transcriber });
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  const input = (sequence = 0) => ({
    userId: "user-a",
    sourceDeviceId: "phone-1",
    sessionId: "session-1",
    sequence,
    startedAt: date,
    endedAt: "2026-08-05T10:00:05.000Z",
    durationMs: 5000,
    encoding: "audio/pcm16le" as const,
    checksum: `checksum-${sequence}`,
    base64Audio: "raw-audio-must-not-be-persisted",
    consentRef: consentId,
    traceId: `trace-audio-${sequence}`,
  });

  it("turns a spoken task into a confirmed-later voice candidate", async () => {
    const result = await service.ingest(input());

    expect(result.status).toBe("candidate");
    expect(result.candidate).toMatchObject({
      action: "请在周五前把预算发给李明",
      evidenceRef: "audio:session-1:0",
    });
    expect(result.situation?.status).toBe("awaiting_confirmation");
    expect(store.listTasks("user-a")).toHaveLength(0);
    expect(result.contextEvent?.kind).toBe("voice_candidate");
    expect(result.contextEvent?.payload).not.toHaveProperty("base64Audio");
  });

  it("does not run ASR when the voice consent is missing or revoked", async () => {
    const denied = new WayfinderAudioEventService({
      repository,
      consent,
      situations,
      transcriber,
    });
    await expect(denied.ingest({ ...input(), consentRef: "missing-consent" })).rejects.toThrow("wayfinder_consent_required");
    expect(transcriber.transcribe).not.toHaveBeenCalled();

    await consent.upsert(
      "user-a",
      {
        source: "phone-1",
        purpose: "wayfinder_voice_candidate",
        scope: "foreground_short_audio",
        status: "revoked",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 7,
        modelSharing: "local_only",
      },
      "trace-revoke",
    );
    await expect(denied.ingest(input(1))).rejects.toThrow("wayfinder_consent_required");
  });

  it("keeps low-confidence speech in awaiting_confirmation and never creates a Task", async () => {
    transcriber = {
      transcribe: vi.fn(async () => ({
        text: "也许下周找时间看看这个事情",
        confidence: 0.2,
        modelName: "fixture-asr-v1",
        source: "fixture",
      })),
    };
    service = new WayfinderAudioEventService({ repository, consent, situations, transcriber });

    const result = await service.ingest(input(1));

    expect(result.status).toBe("candidate");
    expect(result.candidate?.confidence).toBeLessThan(0.5);
    expect(result.situation?.status).toBe("awaiting_confirmation");
    expect(store.listTasks("user-a")).toHaveLength(0);
  });

  it("ignores non-task conversation without creating a Wayfinder situation", async () => {
    transcriber = {
      transcribe: vi.fn(async () => ({
        text: "今天天气不错",
        confidence: 0.95,
        modelName: "fixture-asr-v1",
        source: "fixture",
      })),
    };
    service = new WayfinderAudioEventService({ repository, consent, situations, transcriber });

    const result = await service.ingest(input(1));

    expect(result.status).toBe("ignored");
    expect(repository.listContextEvents("user-a")).toHaveLength(0);
    expect(repository.listSituations("user-a")).toHaveLength(0);
  });

  it("replays a duplicate audio chunk idempotently", async () => {
    const first = await service.ingest(input());
    const duplicate = await service.ingest(input());

    expect(duplicate.contextEvent?.id).toBe(first.contextEvent?.id);
    expect(duplicate.situation?.id).toBe(first.situation?.id);
    expect(repository.listContextEvents("user-a")).toHaveLength(1);
    expect(transcriber.transcribe).toHaveBeenCalledTimes(1);
  });

  it("does not replay a candidate after its consent is revoked", async () => {
    await service.ingest(input());
    await consent.upsert(
      "user-a",
      {
        source: "phone-1",
        purpose: "wayfinder_voice_candidate",
        scope: "foreground_short_audio",
        status: "revoked",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 7,
        modelSharing: "local_only",
      },
      "trace-revoke-duplicate",
    );

    await expect(service.ingest(input())).rejects.toThrow("wayfinder_consent_required");
  });

  it("recognizes a normal Chinese task utterance", () => {
    const candidate = extractVoiceCandidate(
      {
        text: "请在周五前把预算发给李明",
        confidence: 0.91,
        modelName: "fixture-asr-v1",
        source: "fixture",
      },
      "audio:session-zh:0",
    );

    expect(candidate).toMatchObject({
      actor: "user",
      action: "请在周五前把预算发给李明",
    });
  });

  it("does not attribute a third-party commitment to the user", () => {
    const candidate = extractVoiceCandidate(
      {
        text: "Alice will send the report tomorrow",
        confidence: 0.91,
        modelName: "fixture-asr-v1",
        source: "fixture",
      },
      "audio:session-third-party:0",
    );

    expect(candidate).toMatchObject({
      actor: "Alice",
      action: "Alice will send the report tomorrow",
    });
  });
});
