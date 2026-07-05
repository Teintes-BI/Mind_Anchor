export const HELPFUL_FEEDBACK_STRENGTHENING_PREFIX = "feedback-helpful";
export const HELPFUL_FEEDBACK_STRENGTHENING_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type HelpfulFeedbackStrengtheningScope = "preferences" | "habits";
export type HelpfulFeedbackStrengtheningEligibility = "eligible" | "stale" | "missing_source";

export const parseHelpfulFeedbackStrengtheningScope = (
  sourceTurnRef?: string | null,
): HelpfulFeedbackStrengtheningScope | null => {
  if (!sourceTurnRef || !sourceTurnRef.startsWith(HELPFUL_FEEDBACK_STRENGTHENING_PREFIX)) {
    return null;
  }
  if (sourceTurnRef.startsWith(`${HELPFUL_FEEDBACK_STRENGTHENING_PREFIX}:habits:`)) {
    return "habits";
  }
  return "preferences";
};

export const parseHelpfulFeedbackStrengtheningMessageId = (sourceTurnRef?: string | null) => {
  if (!sourceTurnRef || !sourceTurnRef.startsWith(`${HELPFUL_FEEDBACK_STRENGTHENING_PREFIX}:`)) {
    return null;
  }
  const parts = sourceTurnRef.split(":");
  return parts.length >= 3 ? parts[2] ?? null : null;
};

export const classifyHelpfulFeedbackStrengtheningCandidate = (input: {
  sourceTurnRef?: string | null;
  nowMs?: number;
  getSourceMessageCreatedAt: (messageId: string) => string | null | undefined;
}): HelpfulFeedbackStrengtheningEligibility => {
  const messageId = parseHelpfulFeedbackStrengtheningMessageId(input.sourceTurnRef);
  if (!messageId) {
    return "missing_source";
  }
  const createdAt = input.getSourceMessageCreatedAt(messageId);
  if (!createdAt) {
    return "missing_source";
  }
  const createdAtMs = Date.parse(createdAt);
  if (!Number.isFinite(createdAtMs)) {
    return "missing_source";
  }
  const ageMs = (input.nowMs ?? Date.now()) - createdAtMs;
  return ageMs <= HELPFUL_FEEDBACK_STRENGTHENING_MAX_AGE_MS ? "eligible" : "stale";
};
