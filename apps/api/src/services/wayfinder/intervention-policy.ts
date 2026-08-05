import {
  interventionPolicyResultSchema,
  type InterventionBudget,
  type InterventionPolicyResult,
} from "@mindanchor/domain";

export type InterventionHistoryEntry = {
  kind: string;
  occurredAt: string;
  decision?: "allow" | "suppress" | "queue" | "escalate";
};

export type InterventionPolicyInput = {
  userId: string;
  now: string;
  kind: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  consentGranted: boolean;
  focusState: "available" | "focused" | "quiet" | "sleeping";
  budget?: InterventionBudget | null;
  recentInterventions?: InterventionHistoryEntry[];
  approvalGranted?: boolean;
  openClawAvailable?: boolean;
};

const wallClockMinutes = (isoDateTime: string) => {
  const match = isoDateTime.match(/T(\d{2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
};

const isWithinQuietHours = (isoDateTime: string, start: string, end: string) => {
  const current = wallClockMinutes(isoDateTime);
  const parse = (value: string) => {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  };
  const quietStart = parse(start);
  const quietEnd = parse(end);
  if (quietStart === quietEnd) {
    return true;
  }
  return quietStart < quietEnd
    ? current >= quietStart && current < quietEnd
    : current >= quietStart || current < quietEnd;
};

const result = (
  input: InterventionPolicyInput,
  decision: InterventionPolicyResult["decision"],
  reason: string,
): InterventionPolicyResult =>
  interventionPolicyResultSchema.parse({
    decision,
    reason,
    riskLevel: input.riskLevel,
    requiresApproval: input.riskLevel === "high" || input.riskLevel === "critical",
    evaluatedAt: input.now,
  });

export const evaluateInterventionPolicy = (input: InterventionPolicyInput): InterventionPolicyResult => {
  if (!input.consentGranted) {
    return result(input, "suppress", "Required consent is not currently granted.");
  }

  if (input.riskLevel === "critical" && !input.approvalGranted) {
    return result(input, "escalate", "Critical actions require explicit user approval.");
  }

  if (input.riskLevel === "high" && !input.approvalGranted) {
    return result(input, "escalate", "High-risk actions require explicit user approval.");
  }

  if (input.openClawAvailable === false && (input.riskLevel === "high" || input.riskLevel === "critical")) {
    return result(input, "escalate", "The decision worker is unavailable; keep high-risk work pending human review.");
  }

  const budget = input.budget;
  if (budget && isWithinQuietHours(input.now, budget.quietHoursStart, budget.quietHoursEnd)) {
    return result(input, "queue", "Quiet hours are active, so the intervention is queued for later.");
  }

  const dismissedUntil = budget?.dismissedUntilByKind[input.kind];
  if (dismissedUntil && new Date(input.now).getTime() < new Date(dismissedUntil).getTime()) {
    return result(input, "suppress", "The user dismissed this intervention kind during its cooling-off period.");
  }

  const repeats = (input.recentInterventions ?? []).filter((entry) => entry.kind === input.kind).length;
  if (repeats >= 3) {
    return result(input, "queue", "The daily repetition threshold has been reached; do not interrupt again.");
  }

  if (budget && budget.used >= budget.limit) {
    return result(input, "queue", "The daily intervention budget is exhausted; record it without interrupting.");
  }

  if (input.focusState === "sleeping" || input.focusState === "quiet") {
    return result(input, "queue", "The user is unavailable for an active interruption.");
  }

  if (input.focusState === "focused") {
    return result(input, "queue", "The user is in a focused session; queue the suggestion for a natural break.");
  }

  return result(input, "allow", "Consent, timing, budget, and risk checks allow this intervention.");
};
