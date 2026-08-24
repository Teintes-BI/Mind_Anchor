import { createHash } from "node:crypto";
import type { CoreEvent, StateSnapshot } from "@mindanchor/domain";

const SENSITIVE_KEYS = new Set([
  "prompt", "systemPrompt", "userPrompt", "agent", "route", "runtimeAgentId",
  "rawAudio", "audioBase64", "screenshot", "image", "modelResponse", "debug", "trace",
]);

const normalize = (value: string) => value.replace(/\s+/gu, " ").trim();

export type SafeContextEvent = {
  id: string;
  occurredAt: string;
  type: string;
  summary: string;
};

export const redactEvent = (event: CoreEvent): { event: SafeContextEvent; redacted: boolean } => {
  const payload = event.payload as Record<string, unknown>;
  const source = [payload.summary, payload.text, payload.title].find((value) => typeof value === "string" && value.trim());
  const summary = normalize(typeof source === "string" ? source : `${event.eventType} event`).slice(0, 500);
  const redacted = Object.keys(payload).some((key) => SENSITIVE_KEYS.has(key));
  return {
    event: { id: event.id, occurredAt: event.occurredAt, type: event.eventType, summary: summary || `${event.eventType} event` },
    redacted,
  };
};

export const redactState = (state: StateSnapshot) => ({
  energy: state.energy,
  emotion: state.emotion,
  cognitiveLoad: state.cognitiveLoad,
  mentalNoise: state.mentalNoise,
  focusReadiness: state.focusReadiness,
  physicalFatigue: state.physicalFatigue,
  recoveryNeed: state.recoveryNeed,
  source: [...state.source],
  confidence: state.confidence,
  userConfirmed: state.userConfirmed,
});

export const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
};

export const buildContextHash = (value: unknown): string => createHash("sha256").update(stableJson(value)).digest("hex");
