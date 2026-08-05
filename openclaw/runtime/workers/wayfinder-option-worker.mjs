import { WAYFINDER_PERSPECTIVE_PACK_IDS, isWayfinderPerspectivePack } from "../wayfinder-perspective-packs.mjs";

const clean = (value, fallback) => (typeof value === "string" && value.trim() ? value.trim() : fallback);
const risk = (value) => (["low", "medium", "high", "critical"].includes(value) ? value : "low");

export const architectWayfinderOptions = (input = {}) => {
  const situation = input.situation && typeof input.situation === "object" ? input.situation : {};
  const summary = clean(situation.summary, "the current situation");
  const riskLevel = risk(situation.riskLevel);
  const evidenceRefs = Array.isArray(input.evidenceRefs) && input.evidenceRefs.length > 0 ? input.evidenceRefs : [clean(situation.id, "situation-summary")];
  const requiresApproval = riskLevel === "high" || riskLevel === "critical";
  const consultedSkills = Array.isArray(input.consultedSkills)
    ? input.consultedSkills.filter((value) => isWayfinderPerspectivePack(value))
    : [...WAYFINDER_PERSPECTIVE_PACK_IDS];
  const options = [
    { id: "wayfinder-option-observe", action: `Clarify ${summary} before acting`, firstStep: "Write down the next observable fact", rationale: "Reduces uncertainty with a reversible step", costs: ["delays commitment"], horizon: "today", consequence: "Improves clarity", reversibility: "reversible" },
    { id: "wayfinder-option-small-step", action: `Take the smallest useful step on ${summary}`, firstStep: "Spend ten minutes on the first step", rationale: "Builds evidence without locking in a large decision", costs: ["uses a short focus block"], horizon: "week", consequence: "Creates momentum", reversibility: "reversible" },
    { id: "wayfinder-option-defer", action: `Defer ${summary} with a review point`, firstStep: "Set a specific review time", rationale: "Protects capacity when timing is poor", costs: ["may postpone learning"], horizon: "month", consequence: "Preserves optionality", reversibility: "partly_reversible" },
  ].map((option) => ({
    id: option.id,
    userId: clean(input.userId, "demo-user"),
    situationId: clean(situation.id, "situation"),
    status: "proposed",
    action: option.action,
    firstStep: option.firstStep,
    rationale: option.rationale,
    immediateBenefits: ["keeps the user in control"],
    costs: option.costs,
    projectedConsequences: [
      { horizon: option.horizon, text: option.consequence, confidence: 0.6 },
      { horizon: "long_term", text: "The user can review the choice with new evidence", confidence: 0.45 },
    ],
    reversibility: option.reversibility,
    valueAlignment: [{ valueId: "agency", effect: "supports", explanation: "The user chooses the commitment level" }],
    evidenceRefs,
    consultedSkills,
    riskLevel,
    requiresApproval,
    createdAt: clean(input.createdAt, "2026-08-05T10:00:00+08:00"),
    traceId: clean(input.traceId, "wayfinder-option-trace"),
  }));

  return {
    traceId: clean(input.traceId, "wayfinder-option-trace"),
    agent: "option-architect",
    modelTarget: clean(input.modelTarget, "analyst-agent"),
    evidenceRefs,
    confidence: 0.6,
    riskLevel,
    options,
  };
};
