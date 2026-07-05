function normalizeAuthorizationStatus(status) {
  switch (status) {
    case "authorized":
    case "provisional":
    case "ephemeral":
      return "allowed";
    case "denied":
      return "denied";
    case "notDetermined":
      return "not_requested";
    default:
      return "unknown";
  }
}

export function parseMacOSNotificationDebugLog(text) {
  const lines = String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let lastAuthorizationStatus = null;
  let lastContext = null;
  let requestStarted = false;
  let requestReturned = false;
  let requestThrew = false;

  for (const line of lines) {
    const contextMatch = line.match(/\bcontext=([^\s]+)/);
    if (contextMatch) {
      lastContext = contextMatch[1];
    }

    const statusMatch = line.match(/\bstatus=([^\s]+)/);
    if (statusMatch) {
      lastAuthorizationStatus = statusMatch[1];
    }

    if (line.includes("requestAuthorization starting")) {
      requestStarted = true;
    }

    if (line.includes("requestAuthorization returned")) {
      requestReturned = true;
    }

    if (line.includes("requestAuthorization threw")) {
      requestThrew = true;
    }
  }

  let inferredState = normalizeAuthorizationStatus(lastAuthorizationStatus);
  if (
    inferredState === "not_requested" &&
    requestStarted &&
    !requestReturned &&
    !requestThrew
  ) {
    inferredState = "request_in_flight";
  }

  if (!lastAuthorizationStatus && !requestStarted && !requestReturned && !requestThrew) {
    inferredState = "unknown";
  }

  return {
    lastAuthorizationStatus,
    lastContext,
    requestStarted,
    requestReturned,
    requestThrew,
    inferredState,
  };
}
