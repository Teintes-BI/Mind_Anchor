export function normalizeWindowBounds(bounds = {}) {
  return {
    x: Number(bounds.X ?? 0),
    y: Number(bounds.Y ?? 0),
    width: Number(bounds.Width ?? 0),
    height: Number(bounds.Height ?? 0),
  };
}

export function findSecurityAgentWindow(windowList = []) {
  const match = windowList.find((entry) => entry?.kCGWindowOwnerName === "SecurityAgent");
  if (!match) {
    return null;
  }

  return {
    ownerName: match.kCGWindowOwnerName,
    windowNumber: Number(match.kCGWindowNumber ?? 0),
    windowName: match.kCGWindowName ?? "",
    layer: Number(match.kCGWindowLayer ?? 0),
    alpha: Number(match.kCGWindowAlpha ?? 0),
    bounds: normalizeWindowBounds(match.kCGWindowBounds),
  };
}

export function buildSecurityAgentWindowSummary(windowInfo) {
  if (!windowInfo) {
    return "SecurityAgent window: not found";
  }

  const { windowNumber, layer, alpha, bounds } = windowInfo;
  return `SecurityAgent window#${windowNumber} layer=${layer} alpha=${alpha} bounds=(${bounds.x},${bounds.y},${bounds.width}x${bounds.height})`;
}
