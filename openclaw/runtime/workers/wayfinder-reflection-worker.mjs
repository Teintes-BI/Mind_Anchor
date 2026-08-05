const clean = (value, fallback) => (typeof value === "string" && value.trim() ? value.trim() : fallback);

export const reflectWayfinderDecision = (input = {}) => {
  const decision = input.decision && typeof input.decision === "object" ? input.decision : {};
  const outcomes = Array.isArray(input.outcomes) ? input.outcomes.filter((outcome) => outcome && typeof outcome === "object") : [];
  const evidenceRefs = Array.isArray(input.evidenceRefs) && input.evidenceRefs.length > 0 ? input.evidenceRefs : [clean(decision.id, "decision")];
  const observed = outcomes.map((outcome) => clean(outcome.summary, "An outcome was recorded.")).join(" ");
  return {
    traceId: clean(input.traceId, "wayfinder-reflection-trace"),
    agent: "reflection-worker",
    modelTarget: clean(input.modelTarget, "balance-agent"),
    decisionId: clean(decision.id, "decision"),
    summary: observed || "No outcome has been recorded yet; schedule a review instead of inferring success.",
    predictionError: outcomes.length > 0 ? clean(outcomes[0].predictionError, "No prediction error was supplied.") : undefined,
    evidenceRefs,
    confidence: outcomes.length > 0 ? 0.7 : 0.3,
    riskLevel: ["low", "medium", "high", "critical"].includes(input.riskLevel) ? input.riskLevel : "low",
  };
};
