const clean = (value, fallback) => (typeof value === "string" && value.trim() ? value.trim() : fallback);

export const frameWayfinderSituation = (input = {}) => {
  const evidenceRefs = Array.isArray(input.evidenceRefs) ? input.evidenceRefs.filter((value) => typeof value === "string" && value.length > 0) : [];
  const summary = clean(input.summary, "A new situation needs user confirmation.");
  return {
    traceId: clean(input.traceId, "wayfinder-situation-trace"),
    agent: "situation-framer",
    modelTarget: clean(input.modelTarget, "director-agent"),
    summary,
    uncertainty: Array.isArray(input.uncertainty) ? input.uncertainty.filter((value) => typeof value === "string") : [],
    evidenceRefs: evidenceRefs.length > 0 ? evidenceRefs : ["situation-summary"],
    confidence: Math.max(0, Math.min(1, Number(input.confidence ?? 0.5))),
    riskLevel: ["low", "medium", "high", "critical"].includes(input.riskLevel) ? input.riskLevel : "low",
  };
};
