import {
  type CallEvent,
  type EmotionAssessment,
  type FocusSession,
  type Goal,
  type HealthSnapshot,
  type ReflectionReport,
  type StateAssessment,
  type Task,
  type VideoAssessment,
} from "@mindanchor/domain";
import { createId, now } from "../lib/utils.js";

const toPeriodRange = (periodType: ReflectionReport["periodType"]) => {
  const end = new Date();
  const start = new Date(end);
  if (periodType === "weekly") {
    start.setDate(end.getDate() - 7);
  } else {
    start.setMonth(end.getMonth() - 1);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

export const generateReflectionReport = ({
  userId,
  goals,
  tasks,
  sessions,
  assessments,
  emotionAssessments,
  videoAssessments = [],
  healthSnapshots = [],
  callEvents,
  periodType,
}: {
  userId: string;
  goals: Goal[];
  tasks: Task[];
  sessions: FocusSession[];
  assessments: StateAssessment[];
  emotionAssessments: EmotionAssessment[];
  videoAssessments?: VideoAssessment[];
  healthSnapshots?: HealthSnapshot[];
  callEvents: CallEvent[];
  periodType: ReflectionReport["periodType"];
}): ReflectionReport => {
  const range = toPeriodRange(periodType);
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const activeGoals = goals.filter((goal) => goal.status === "active").length;
  const interruptions = sessions.filter((session) => session.status === "interrupted").length;
  const averageFocus =
    assessments.length > 0
      ? Math.round(assessments.reduce((sum, assessment) => sum + assessment.focusScore, 0) / assessments.length)
      : 0;
  const averageEnergy =
    assessments.length > 0
      ? Math.round(assessments.reduce((sum, assessment) => sum + assessment.energyScore, 0) / assessments.length)
      : 0;
  const averageStress =
    emotionAssessments.length > 0
      ? Math.round(emotionAssessments.reduce((sum, assessment) => sum + assessment.stressScore, 0) / emotionAssessments.length)
      : 0;
  const averageFatigue =
    videoAssessments.length > 0
      ? Math.round(videoAssessments.reduce((sum, assessment) => sum + assessment.fatigueScore, 0) / videoAssessments.length)
      : 0;
  const latestEmotion = emotionAssessments[0];
  const latestVideo = videoAssessments[0];
  const latestHealth = healthSnapshots[0];
  const missedCalls = callEvents.filter((event) => event.status === "missed").length;

  const trends = [`Average focus score: ${averageFocus}.`, `Average energy score: ${averageEnergy}.`];

  if (emotionAssessments.length > 0) {
    trends.push(`Average server-side audio stress score: ${averageStress}.`);
  }

  if (videoAssessments.length > 0) {
    trends.push(`Average video fatigue score: ${averageFatigue}.`);
  }

  if (latestEmotion) {
    trends.push(`Latest audio emotion: ${latestEmotion.emotionLabel}.`);
  }

  if (latestVideo) {
    trends.push(`Latest video focus score: ${latestVideo.focusScore}.`);
  }

  if (latestHealth?.sleepMinutes !== undefined) {
    trends.push(`Latest sleep duration from health bridge: ${latestHealth.sleepMinutes} minutes.`);
  }

  const blockers =
    interruptions > 0 ? [`${interruptions} sessions were interrupted.`] : ["No major interruptions were logged."];

  if (missedCalls > 0) {
    blockers.push(`${missedCalls} missed or dropped call events were detected.`);
  }

  if (averageFatigue > 65) {
    blockers.push("Video fatigue indicators stayed elevated.");
  }

  const nextSuggestions = [
    averageFocus < 50 ? "Reduce concurrent tasks before the next sprint." : "Keep the current focus cadence.",
    averageEnergy < 50 ? "Schedule shorter blocks and recharge breaks." : "Maintain the current work-rest rhythm.",
  ];

  if (averageStress > 60) {
    nextSuggestions.push("Use shorter audio-monitored focus blocks and add a recovery window after calls.");
  }

  if (averageFatigue > 60) {
    nextSuggestions.push("Reduce long screen sessions and insert recovery breaks before fatigue spikes.");
  }

  if ((latestHealth?.sleepMinutes ?? 420) < 360) {
    nextSuggestions.push("Use the health bridge to track short sleep and lower the next day workload.");
  }

  return {
    id: createId(),
    userId,
    periodType,
    periodStart: range.start,
    periodEnd: range.end,
    highlights: [
      `${completedTasks} tasks reached done status.`,
      `${activeGoals} goals stayed active.`,
      ...(emotionAssessments.length > 0 ? [`${emotionAssessments.length} audio emotion windows were analyzed.`] : []),
      ...(videoAssessments.length > 0 ? [`${videoAssessments.length} video focus/fatigue windows were analyzed.`] : []),
    ],
    blockers,
    trends,
    nextSuggestions,
    createdAt: now(),
  };
};
