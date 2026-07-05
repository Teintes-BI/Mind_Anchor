import { randomUUID } from "node:crypto";

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function inspectPcm16LeBase64(base64Audio) {
  const buffer = Buffer.from(base64Audio, "base64");
  if (buffer.length < 2) {
    return { rms: 0, peak: 0 };
  }

  let sumSquares = 0;
  let peak = 0;
  let sampleCount = 0;

  for (let index = 0; index + 1 < buffer.length; index += 2) {
    const sample = buffer.readInt16LE(index) / 32768;
    const absolute = Math.abs(sample);
    peak = Math.max(peak, absolute);
    sumSquares += sample * sample;
    sampleCount += 1;
  }

  const rms = sampleCount === 0 ? 0 : Math.sqrt(sumSquares / sampleCount);
  return {
    rms: clamp(rms, 0, 1),
    peak: clamp(peak, 0, 1),
  };
}

export function buildStubEmotionAssessment({
  userId,
  deviceId,
  sessionId,
  chunkSequence,
  windowStart,
  windowEnd,
  rms,
  peak,
}) {
  const arousalScore = clamp(Math.round(rms * 120 + peak * 30), 0, 100);
  const stressScore = clamp(Math.round(arousalScore * 0.82 + (peak > 0.88 ? 10 : 0)), 0, 100);
  const valenceScore = clamp(Math.round(68 - stressScore * 0.36 + (rms < 0.08 ? 8 : -2)), 0, 100);

  let emotionLabel = "neutral";
  if (stressScore > 72) {
    emotionLabel = "stressed";
  } else if (arousalScore > 68) {
    emotionLabel = "tense";
  } else if (valenceScore > 68 && stressScore < 40) {
    emotionLabel = "positive";
  } else if (arousalScore < 25 && stressScore < 25) {
    emotionLabel = "calm";
  }

  const summaries = {
    calm: "Voice energy is low and stable, suggesting a calm state.",
    neutral: "Voice energy sits in a neutral range with no sharp stress spikes.",
    positive: "Voice energy suggests a positive and steady state.",
    tense: "Voice energy is elevated and may indicate tension.",
    stressed: "Voice energy is highly elevated and may indicate stress.",
  };

  return {
    id: randomUUID(),
    userId,
    deviceId,
    sessionId,
    chunkSequence,
    windowStart,
    windowEnd,
    emotionLabel,
    valenceScore,
    arousalScore,
    stressScore,
    confidence: 0.58,
    summary: summaries[emotionLabel],
    modelName: "desktop-heuristic-v1",
    source: "desktop-stub",
    createdAt: new Date().toISOString(),
  };
}

async function requestOpenAiCompatibleEmotion({
  modelBaseUrl,
  modelApiKey,
  modelName,
  payload,
}) {
  const response = await fetch(new URL("/chat/completions", modelBaseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(modelApiKey ? { Authorization: `Bearer ${modelApiKey}` } : {}),
    },
    body: JSON.stringify({
      model: modelName,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You estimate emotion from short mobile audio chunks. Return JSON only with emotionLabel, valenceScore, arousalScore, stressScore, confidence, and summary.",
        },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Emotion model request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Emotion model returned empty content");
  }

  return JSON.parse(content);
}

export async function analyzeEmotionChunk({
  userId,
  deviceId,
  sessionId,
  chunkSequence,
  windowStart,
  windowEnd,
  rms,
  peak,
  base64Audio,
  modelConfig,
}) {
  const metrics = rms !== undefined && peak !== undefined ? { rms, peak } : inspectPcm16LeBase64(base64Audio);

  if (modelConfig?.mode === "openai-compatible" && modelConfig.baseUrl && modelConfig.modelName) {
    try {
      const result = await requestOpenAiCompatibleEmotion({
        modelBaseUrl: modelConfig.baseUrl,
        modelApiKey: modelConfig.apiKey,
        modelName: modelConfig.modelName,
        payload: {
          userId,
          deviceId,
          sessionId,
          chunkSequence,
          windowStart,
          windowEnd,
          rms: metrics.rms,
          peak: metrics.peak,
          base64Audio,
        },
      });

      return {
        id: randomUUID(),
        userId,
        deviceId,
        sessionId,
        chunkSequence,
        windowStart,
        windowEnd,
        emotionLabel: result.emotionLabel,
        valenceScore: clamp(Number(result.valenceScore), 0, 100),
        arousalScore: clamp(Number(result.arousalScore), 0, 100),
        stressScore: clamp(Number(result.stressScore), 0, 100),
        confidence: clamp(Number(result.confidence ?? 0.7), 0, 1),
        summary: String(result.summary ?? "Emotion analysis completed."),
        modelName: modelConfig.modelName,
        source: "desktop-openai-compatible",
        createdAt: new Date().toISOString(),
      };
    } catch {
      return buildStubEmotionAssessment({
        userId,
        deviceId,
        sessionId,
        chunkSequence,
        windowStart,
        windowEnd,
        rms: metrics.rms,
        peak: metrics.peak,
      });
    }
  }

  return buildStubEmotionAssessment({
    userId,
    deviceId,
    sessionId,
    chunkSequence,
    windowStart,
    windowEnd,
    rms: metrics.rms,
    peak: metrics.peak,
  });
}
