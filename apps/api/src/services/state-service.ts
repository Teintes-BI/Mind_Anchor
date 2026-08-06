import {
  type CheckinInput,
  type EmotionAssessment,
  type HealthSnapshot,
  type StateAssessment,
  type StateSignalEvent,
  type VideoAssessment,
} from "@mindanchor/domain";
import { clamp, createId, now } from "../lib/utils.js";

const productiveApps = ["code", "cursor", "terminal", "notion", "figma", "linear", "chrome"];

const toHealthSummary = (snapshot?: HealthSnapshot | null) => {
  if (!snapshot) {
    return undefined;
  }

  const parts: string[] = [];
  if (snapshot.sleepMinutes !== undefined) {
    parts.push(`sleep ${snapshot.sleepMinutes}m`);
  }
  if (snapshot.heartRate !== undefined) {
    parts.push(`hr ${Math.round(snapshot.heartRate)}`);
  }
  if (snapshot.oxygenSaturation !== undefined) {
    parts.push(`spo2 ${Math.round(snapshot.oxygenSaturation)}%`);
  }

  return snapshot.summary ?? (parts.length > 0 ? `Health bridge: ${parts.join(" · ")}` : undefined);
};

export const scoreState = ({
  userId,
  signals,
  checkin,
  latestEmotionAssessment,
  latestVideoAssessment,
  latestHealthSnapshot,
  source,
}: {
  userId: string;
  signals: StateSignalEvent[];
  checkin?: CheckinInput;
  latestEmotionAssessment?: EmotionAssessment | null;
  latestVideoAssessment?: VideoAssessment | null;
  latestHealthSnapshot?: HealthSnapshot | null;
  source: StateAssessment["source"];
}): StateAssessment => {
  const windowSignals = signals.slice(0, 20);
  let focusScore = checkin?.focusScore ?? 70;
  let energyScore = checkin?.energyScore ?? 68;
  let moodScore = checkin?.moodScore ?? 60;
  let fatigueScore = latestVideoAssessment?.fatigueScore;
  const activeInputs = ["desktop_signal"];

  for (const signal of windowSignals) {
    switch (signal.eventType) {
      case "idle":
        focusScore -= 15;
        energyScore -= 8;
        break;
      case "lock":
        focusScore -= 10;
        energyScore -= 4;
        break;
      case "unlock":
        focusScore += 6;
        break;
      case "active_app": {
        const appName = String(signal.payload.app ?? "").toLowerCase();
        if (productiveApps.some((candidate) => appName.includes(candidate))) {
          focusScore += 5;
          moodScore += 2;
        }
        break;
      }
      case "window_switch":
        focusScore -= 8;
        break;
      case "manual_checkin":
        focusScore = Number(signal.payload.focusScore ?? focusScore);
        energyScore = Number(signal.payload.energyScore ?? energyScore);
        moodScore = Number(signal.payload.moodScore ?? moodScore);
        break;
      case "call_started":
        focusScore -= 12;
        break;
      case "call_ended":
        focusScore += 4;
        break;
      case "audio_stream_disconnected":
        energyScore -= 5;
        break;
      case "audio_stream_replayed":
        focusScore -= 3;
        break;
    }
  }

  if (latestEmotionAssessment) {
    activeInputs.push("audio_server_inference");
    moodScore = Math.round((moodScore + latestEmotionAssessment.valenceScore) / 2);
    energyScore = clamp(Math.round((energyScore + latestEmotionAssessment.arousalScore) / 2), 0, 100);
    focusScore = clamp(Math.round(focusScore - latestEmotionAssessment.stressScore * 0.12), 0, 100);
  }

  if (latestVideoAssessment) {
    activeInputs.push("video_server_inference");
    focusScore = clamp(Math.round((focusScore + latestVideoAssessment.focusScore) / 2), 0, 100);
    fatigueScore = latestVideoAssessment.fatigueScore;
    energyScore = clamp(Math.round(energyScore - latestVideoAssessment.fatigueScore * 0.18), 0, 100);
    if (latestVideoAssessment.fatigueScore > 65) {
      moodScore = clamp(Math.round(moodScore - 6), 0, 100);
    }
  }

  if (latestHealthSnapshot) {
    activeInputs.push("health_bridge");
    const healthMissingness = latestHealthSnapshot.missingness ?? "available";
    if (healthMissingness === "available" && (latestHealthSnapshot.sleepMinutes ?? 420) < 360) {
      energyScore = clamp(energyScore - 8, 0, 100);
    }
    if (healthMissingness === "available" && latestHealthSnapshot.oxygenSaturation !== undefined && latestHealthSnapshot.oxygenSaturation < 94) {
      energyScore = clamp(energyScore - 6, 0, 100);
    }
  }

  focusScore = clamp(focusScore, 0, 100);
  energyScore = clamp(energyScore, 0, 100);
  moodScore = clamp(moodScore, 0, 100);

  const summaries: string[] = [];
  if (focusScore < 40) summaries.push("Context switching is high.");
  if (energyScore < 40) summaries.push("Energy is running low.");
  if (moodScore < 45) summaries.push("Mood trend suggests frustration.");
  if (latestEmotionAssessment) summaries.push(`Audio inference: ${latestEmotionAssessment.summary}`);
  if (latestVideoAssessment) summaries.push(`Video inference: ${latestVideoAssessment.summary}`);
  if (latestHealthSnapshot) {
    const healthSummary = toHealthSummary(latestHealthSnapshot);
    if (healthSummary) summaries.push(healthSummary);
  }
  if (summaries.length === 0) summaries.push("State looks stable for focused work.");

  let recommendedAction = "Continue the current task with a 25-minute focus block.";
  if ((latestEmotionAssessment?.stressScore ?? 0) > 70) {
    recommendedAction = "Pause for a short reset before resuming the next small task step.";
  } else if ((latestVideoAssessment?.fatigueScore ?? 0) > 70) {
    recommendedAction = "Step away from the screen, hydrate, and restart with a shorter block.";
  } else if (focusScore < 40) {
    recommendedAction = "Reduce context switching and restart with one small next step.";
  } else if (energyScore < 40) {
    recommendedAction = "Take a short recharge break before resuming.";
  } else if (moodScore < 45) {
    recommendedAction = "Do a quick reset check-in and lower the task size.";
  }

  const createdAt = now();
  const newestSignal = windowSignals[0];
  const oldestSignal = windowSignals[windowSignals.length - 1];

  return {
    id: createId(),
    userId,
    windowStart:
      oldestSignal?.occurredAt ??
      latestVideoAssessment?.windowStart ??
      latestEmotionAssessment?.windowStart ??
      latestHealthSnapshot?.windowStart ??
      createdAt,
    windowEnd:
      newestSignal?.occurredAt ??
      latestVideoAssessment?.windowEnd ??
      latestEmotionAssessment?.windowEnd ??
      latestHealthSnapshot?.windowEnd ??
      createdAt,
    focusScore,
    energyScore,
    moodScore,
    summary: summaries.join(" "),
    recommendedAction,
    emotionSummary: latestEmotionAssessment?.summary,
    emotionConfidence: latestEmotionAssessment?.confidence,
    fatigueScore,
    videoSummary: latestVideoAssessment?.summary,
    healthSummary: toHealthSummary(latestHealthSnapshot),
    activeInputs,
    mediaFreshness:
      latestVideoAssessment?.createdAt ?? latestEmotionAssessment?.createdAt ?? latestHealthSnapshot?.createdAt
        ? "fresh"
        : undefined,
    source,
    createdAt,
  };
};

export const shouldCreateIntervention = (assessment: StateAssessment) =>
  assessment.focusScore < 40 ||
  assessment.energyScore < 35 ||
  assessment.moodScore < 40 ||
  (assessment.fatigueScore !== undefined && assessment.fatigueScore > 70) ||
  (assessment.emotionConfidence !== undefined && (assessment.emotionConfidence > 0.5 ? assessment.summary.includes("stressed") : false));
