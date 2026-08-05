import {
  voiceAudioEventInputSchema,
  voiceCandidateSchema,
  type ContextEvent,
  type Situation,
  type VoiceAudioEventInput,
  type VoiceCandidate,
} from "@mindanchor/domain";
import { WayfinderConsentService } from "./consent-service.js";
import { WayfinderRepository } from "./wayfinder-repository.js";
import { WayfinderSituationService } from "./situation-service.js";

export type SpeechTranscription = {
  text: string;
  confidence: number;
  modelName: string;
  source: string;
  dueAt?: string;
};

export type SpeechTranscriber = {
  transcribe(input: {
    userId: string;
    sourceDeviceId: string;
    sessionId: string;
    sequence: number;
    encoding: VoiceAudioEventInput["encoding"];
    base64Audio: string;
    transcriptHint?: string;
  }): Promise<SpeechTranscription>;
};

export class FixtureSpeechTranscriber implements SpeechTranscriber {
  async transcribe(input: Parameters<SpeechTranscriber["transcribe"]>[0]): Promise<SpeechTranscription> {
    return {
      text: input.transcriptHint?.trim() ?? "",
      confidence: input.transcriptHint?.trim() ? 0.8 : 0,
      modelName: "fixture-asr-v1",
      source: "fixture",
    };
  }
}

export type VoiceAudioEventResult = {
  status: "candidate" | "ignored";
  reason?: "non_task_conversation" | "empty_transcription";
  candidate?: VoiceCandidate;
  contextEvent?: ContextEvent;
  situation?: Situation;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const taskMarkerPattern = /(请|需要|记得|别忘了|安排|帮我|我得|我要|明天|后天|下周|发给|提交|完成|联系|回复|整理|准备|购买|预约|检查|发送|确认|follow up|send|prepare|schedule|remember|need to|please|todo)/i;
const conversationalPattern = /^(你好|嗨|谢谢|好的|嗯|哈哈|今天天气|天气不错|how are you|hello|thanks|okay)[。！!,.，]*/i;

export function extractVoiceCandidate(
  transcription: SpeechTranscription,
  evidenceRef: string,
): VoiceCandidate | null {
  const text = transcription.text.trim().replace(/\s+/g, " ");
  if (!text || conversationalPattern.test(text) || !taskMarkerPattern.test(text)) {
    return null;
  }

  const action = text.slice(0, 240);
  const englishActorMatch = text.match(/^([\p{L}\p{N}_-]{1,80})\s+(?:will|is going to|should|must)\b/iu);
  const chineseActorMatch = text.match(/^([\p{Script=Han}]{1,8})\s*(?:\u8981|\u4f1a|\u5c06)/u);
  const matchedActor = englishActorMatch?.[1] ?? chineseActorMatch?.[1];
  const actor = matchedActor && !/^(?:i|me)$/iu.test(matchedActor) && matchedActor !== "\u6211" ? matchedActor : "user";
  return voiceCandidateSchema.parse({
    candidateSummary: action,
    actor,
    action,
    dueAt: transcription.dueAt,
    confidence: clamp(transcription.confidence),
    evidenceRef,
  });
}

export class WayfinderAudioEventService {
  constructor(
    private readonly dependencies: {
      repository: WayfinderRepository;
      consent: WayfinderConsentService;
      situations: WayfinderSituationService;
      transcriber: SpeechTranscriber;
    },
  ) {}

  async ingest(rawInput: VoiceAudioEventInput): Promise<VoiceAudioEventResult> {
    const input = voiceAudioEventInputSchema.parse(rawInput);
    this.dependencies.consent.assertGranted(input.userId, input.consentRef);
    const clientEventId = `voice-audio:${input.sessionId}:${input.sequence}`;
    const existing = this.dependencies.repository
      .listContextEvents(input.userId)
      .find((event) => event.clientEventId === clientEventId);
    if (existing) {
      const candidate = voiceCandidateSchema.parse(existing.payload.candidate);
      const situation = this.dependencies.repository
        .listSituations(input.userId)
        .find((item) => item.eventIds.includes(existing.id));
      return { status: "candidate", candidate, contextEvent: existing, situation };
    }

    const transcription = await this.dependencies.transcriber.transcribe({
      userId: input.userId,
      sourceDeviceId: input.sourceDeviceId,
      sessionId: input.sessionId,
      sequence: input.sequence,
      encoding: input.encoding,
      base64Audio: input.base64Audio,
      transcriptHint: input.transcriptHint,
    });
    const evidenceRef = `audio:${input.sessionId}:${input.sequence}`;
    const candidate = extractVoiceCandidate(transcription, evidenceRef);
    if (!candidate) {
      return { status: "ignored", reason: transcription.text.trim() ? "non_task_conversation" : "empty_transcription" };
    }

    const result = await this.dependencies.situations.ingestEvent({
      userId: input.userId,
      sourceDeviceId: input.sourceDeviceId,
      kind: "voice_candidate",
      occurredAt: input.startedAt,
      clientEventId,
      payload: {
        candidate,
        transcriptExcerpt: transcription.text.trim().slice(0, 240),
        asrModel: transcription.modelName,
        asrSource: transcription.source,
        audioSequence: input.sequence,
        durationMs: input.durationMs,
      },
      confidence: candidate.confidence,
      consentRef: input.consentRef,
      retentionClass: "summary",
      evidenceRefs: [evidenceRef],
      traceId: input.traceId,
    });

    return { status: "candidate", candidate, contextEvent: result.event, situation: result.situation };
  }
}
