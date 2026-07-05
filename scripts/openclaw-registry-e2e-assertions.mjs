export function summarizeRegistryContractSummaryLines(lines) {
  return Array.isArray(lines) && lines.length > 0 ? lines.join(" | ") : "none";
}

export function assertNoRegistryContractDrift(snapshot, label) {
  const lines = Array.isArray(snapshot?.openClawRegistryContractSummaryLines)
    ? snapshot.openClawRegistryContractSummaryLines
    : [];

  if (lines.length === 0) {
    return;
  }

  throw new Error(
    `${label} 出现 OpenClaw contract drift：${summarizeRegistryContractSummaryLines(lines)}`,
  );
}
