export const CORE_PHASE_IDS = ["stub", "provider-direct", "cluster-preferred"];

export const parseSelectedPhaseIds = (rawValue) => {
  if (!rawValue) {
    return null;
  }
  const ids = String(rawValue)
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return ids.length > 0 ? ids : null;
};

export const validateSelectedPhaseIds = (selectedIds, availableIds = CORE_PHASE_IDS) => {
  if (!selectedIds) {
    return { selectedIds: null, unknownIds: [] };
  }
  const unknownIds = selectedIds.filter((id) => !availableIds.includes(id));
  return {
    selectedIds,
    unknownIds,
  };
};

export const filterSelectedPhases = (phases, selectedIds) => {
  if (!selectedIds) {
    return phases;
  }
  const selectedSet = new Set(selectedIds);
  return phases.filter((phase) => selectedSet.has(phase.id));
};
