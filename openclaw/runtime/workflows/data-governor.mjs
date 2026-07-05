const pickString = (...values) =>
  values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find((value) => value.length > 0);

export const executeDataGovernance = (context) => {
  const action = pickString(context?.action) ?? "accept_candidate";
  const rationale = pickString(context?.rationale) ?? "Data is governing long-term memory safety.";
  const providedSummary = pickString(context?.summary);
  const memoryFramingHints = Array.isArray(context?.memoryFramingHints) ? context.memoryFramingHints : [];
  const framedMemory = memoryFramingHints
    .map((item) => {
      const label = pickString(item?.label);
      const summary = pickString(item?.summary);
      if (!summary) return null;
      return label === "治理目标" ? summary : label ? `${label}：${summary}` : summary;
    })
    .filter(Boolean);
  const summary = providedSummary ?? (framedMemory.length > 0
    ? `治理目标：${framedMemory.join("；")}。Data prepared a ${action} governance decision.`
    : `Data prepared a ${action} governance decision.`);

  return {
    authorityAgent: "memory-governor-agent",
    action,
    executionMode: "govern",
    candidateId: pickString(context?.candidateId) ?? null,
    memoryId: pickString(context?.memoryId) ?? null,
    rationale,
    summary,
  };
};
