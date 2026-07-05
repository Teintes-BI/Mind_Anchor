import type { BehaviorConclusion, ClientInboxMessage, NotificationEndpoint, StateAssessment } from "@mindanchor/domain";

const pickRiskLevel = (assessment: StateAssessment): BehaviorConclusion["riskLevel"] => {
  if (
    assessment.focusScore < 35 ||
    assessment.energyScore < 30 ||
    assessment.moodScore < 35 ||
    (assessment.fatigueScore ?? 0) > 75
  ) {
    return "high";
  }

  if (
    assessment.focusScore < 55 ||
    assessment.energyScore < 50 ||
    assessment.moodScore < 50 ||
    (assessment.fatigueScore ?? 0) > 55
  ) {
    return "medium";
  }

  return "low";
};

const pickChannel = (hasMobileEndpoint: boolean, riskLevel: BehaviorConclusion["riskLevel"]): NotificationEndpoint =>
  hasMobileEndpoint || riskLevel === "high" ? "mobile_push" : "desktop_local";

export const buildBehaviorConclusion = ({
  userId,
  assessment,
  sessionId,
  taskId,
  hasMobileEndpoint,
}: {
  userId: string;
  assessment: StateAssessment;
  sessionId?: string;
  taskId?: string;
  hasMobileEndpoint: boolean;
}): Omit<BehaviorConclusion, "id" | "createdAt"> => {
  const riskLevel = pickRiskLevel(assessment);
  const trigger =
    riskLevel === "high"
      ? "high_risk_state"
      : riskLevel === "medium"
        ? "attention_shift_detected"
        : "stable_focus_state";

  return {
    userId,
    assessmentId: assessment.id,
    sessionId,
    taskId,
    riskLevel,
    summary:
      riskLevel === "high"
        ? "OpenClaw cluster 判断当前已进入高风险状态，建议立即介入。"
        : riskLevel === "medium"
          ? "OpenClaw cluster 检测到状态开始漂移，建议先做一次快速重置。"
          : "OpenClaw cluster 判断当前状态稳定，可以继续推进。",
    suggestedAction: assessment.recommendedAction,
    trigger,
    recommendedChannel: pickChannel(hasMobileEndpoint, riskLevel),
  };
};

export const buildInboxMessage = ({
  userId,
  conclusion,
}: {
  userId: string;
  conclusion: Omit<BehaviorConclusion, "id" | "createdAt">;
}): Omit<ClientInboxMessage, "id" | "createdAt" | "status"> => ({
  userId,
  title: conclusion.riskLevel === "high" ? "建议立即恢复主线" : "状态更新",
  message: `${conclusion.summary} ${conclusion.suggestedAction}`.trim(),
  channel: conclusion.recommendedChannel,
});
