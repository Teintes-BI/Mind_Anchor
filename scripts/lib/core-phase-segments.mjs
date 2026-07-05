export const CORE_PHASE_SEGMENT_IDS = [
  "baseline",
  "web",
  "seed",
  "probes",
  "routes",
  "debugs",
  "runtime-contracts",
  "business",
  "business-core",
  "business-web-dashboard",
  "business-web-goalflow",
  "business-web-state",
  "business-web-recovery",
  "business-web-reflections",
  "business-web-inbox",
  "regressions",
];

const CORE_PHASE_SCENARIO_SEED_SEGMENTS = new Set([
  "seed",
  "routes",
  "debugs",
  "runtime-contracts",
  "business",
  "business-core",
  "business-web-dashboard",
  "business-web-goalflow",
  "business-web-state",
  "business-web-recovery",
  "business-web-reflections",
  "business-web-inbox",
]);

const CORE_PHASE_BUSINESS_FLOW_SEGMENTS = new Set([
  "business",
  "business-core",
  "business-web-dashboard",
  "business-web-goalflow",
  "business-web-state",
  "business-web-recovery",
  "business-web-reflections",
  "business-web-inbox",
]);

const BUSINESS_WEB_SEGMENT_TO_CHECK_ID = new Map([
  ["business-web-dashboard", "dashboard"],
  ["business-web-goalflow", "goalflow"],
  ["business-web-state", "state"],
  ["business-web-recovery", "recovery"],
  ["business-web-reflections", "reflections"],
  ["business-web-inbox", "inbox"],
]);

export const parseSelectedSegmentIds = (rawValue) => {
  if (!rawValue) {
    return null;
  }
  const ids = String(rawValue)
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return ids.length > 0 ? ids : null;
};

export const validateSelectedSegmentIds = (selectedIds, availableIds = CORE_PHASE_SEGMENT_IDS) => {
  if (!selectedIds) {
    return { selectedIds: null, unknownIds: [] };
  }
  const unknownIds = selectedIds.filter((id) => !availableIds.includes(id));
  return {
    selectedIds,
    unknownIds,
  };
};

export const shouldRunCorePhaseSegment = (selectedIds, segmentId) => {
  if (!selectedIds) {
    return true;
  }
  return selectedIds.includes(segmentId);
};

export const shouldRunCorePhaseScenarioSeed = (selectedIds) => {
  if (!selectedIds) {
    return true;
  }
  return selectedIds.some((segmentId) => CORE_PHASE_SCENARIO_SEED_SEGMENTS.has(segmentId));
};

export const shouldRunBusinessFlow = (selectedIds) => {
  if (!selectedIds) {
    return true;
  }
  return selectedIds.some((segmentId) => CORE_PHASE_BUSINESS_FLOW_SEGMENTS.has(segmentId));
};

export const getSelectedBusinessWebCheckIds = (selectedIds) => {
  if (!selectedIds || selectedIds.includes("business")) {
    return ["dashboard", "goalflow", "state", "recovery", "reflections", "inbox"];
  }

  return selectedIds
    .map((segmentId) => BUSINESS_WEB_SEGMENT_TO_CHECK_ID.get(segmentId) ?? null)
    .filter(Boolean);
};
