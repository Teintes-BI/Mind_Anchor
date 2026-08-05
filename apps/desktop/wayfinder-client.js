const DEFAULT_USER_ID = "demo-user";

export class WayfinderClientError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "WayfinderClientError";
    this.status = status;
  }
}

const asArray = (value) => (Array.isArray(value) ? value : []);

const normalizeStatus = (value) => ({
  connected: Boolean(value?.connected),
  configured: Boolean(value?.configured),
  busy: Boolean(value?.busy),
  situation: value?.situation ?? null,
  options: asArray(value?.options),
  grants: asArray(value?.grants),
  lastDecision: value?.lastDecision ?? null,
  message: String(value?.message ?? "Wayfinder is ready."),
  error: value?.error ? String(value.error) : null,
});

export function createWayfinderClient({
  apiBaseUrl,
  token = "",
  userId = DEFAULT_USER_ID,
  sourceDeviceId = "windows-desktop",
  fetchImpl = globalThis.fetch,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("Wayfinder client requires fetch.");
  }

  const state = {
    connected: false,
    configured: Boolean(token),
    busy: false,
    situation: null,
    options: [],
    grants: [],
    lastDecision: null,
    message: token ? "Wayfinder is ready." : "Set MINDANCHOR_API_TOKEN to enable Wayfinder.",
    error: null,
  };

  const buildURL = (path) => `${String(apiBaseUrl ?? "").replace(/\/$/, "")}${path}`;
  const headers = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const request = async (path, options = {}) => {
    if (!token) throw new WayfinderClientError("MINDANCHOR_API_TOKEN is not configured.");
    const response = await fetchImpl(buildURL(path), {
      ...options,
      headers: { ...headers(), ...(options.headers ?? {}) },
    });
    let payload = null;
    try {
      payload = await response.json();
    } catch {}
    if (!response.ok) {
      throw new WayfinderClientError(payload?.message ?? `Wayfinder request failed: ${response.status}`, response.status);
    }
    return payload;
  };

  const withBusy = async (operation) => {
    state.busy = true;
    state.error = null;
    try {
      return await operation();
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
      state.message = state.error;
      throw error;
    } finally {
      state.busy = false;
    }
  };

  const refresh = () => withBusy(async () => {
    const [consent, situations] = await Promise.all([
      request("/wayfinder/consent"),
      request("/wayfinder/situations"),
    ]);
    state.grants = asArray(consent?.grants);
    const active = asArray(situations?.situations).find((item) => ["awaiting_confirmation", "confirmed"].includes(item?.status));
    state.situation = active ?? null;
    state.options = [];
    if (active) {
      const options = await request(`/wayfinder/situations/${encodeURIComponent(active.id)}/options`);
      state.situation = active;
      state.options = asArray(options?.options);
    }
    state.connected = true;
    state.message = active ? "Active Wayfinder situation loaded." : "No active situation.";
    return getStatus();
  });

  const grantConsent = () => withBusy(async () => {
    const grant = await request(`/wayfinder/consent/${encodeURIComponent(sourceDeviceId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        purpose: "wayfinder_context",
        scope: "manual_notes",
        status: "granted",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 30,
        modelSharing: "local_only",
      }),
    });
    state.grants = [...state.grants.filter((item) => item.id !== grant?.id), grant].filter(Boolean);
    state.connected = true;
    state.message = "Wayfinder consent granted.";
    return grant;
  });

  const capture = (summary) => withBusy(async () => {
    const grant = state.grants.find((item) => item?.status === "granted");
    if (!grant) throw new WayfinderClientError("Grant Wayfinder consent before capturing a situation.");
    const result = await request("/wayfinder/events", {
      method: "POST",
      headers: { "Idempotency-Key": `desktop-wayfinder-${Date.now()}` },
      body: JSON.stringify({
        sourceDeviceId,
        kind: "manual_note",
        occurredAt: new Date().toISOString(),
        payload: { summary: String(summary).trim() },
        confidence: 1,
        consentRef: grant.id,
        retentionClass: "summary",
        evidenceRefs: [],
        traceId: `desktop-wayfinder-${Date.now()}`,
      }),
    });
    state.situation = result?.situation ?? null;
    state.options = [];
    state.connected = true;
    state.message = "Situation captured. Confirm it before choosing an option.";
    return result;
  });

  const confirm = (status = "confirmed") => withBusy(async () => {
    if (!state.situation?.id) throw new WayfinderClientError("There is no active situation to confirm.");
    const result = await request(`/wayfinder/situations/${encodeURIComponent(state.situation.id)}/confirm`, {
      method: "POST",
      body: JSON.stringify({ status, traceId: `desktop-wayfinder-${Date.now()}` }),
    });
    state.situation = result?.situation ?? state.situation;
    if (status === "confirmed") {
      const options = await request(`/wayfinder/situations/${encodeURIComponent(state.situation.id)}/options`);
      state.options = asArray(options?.options);
    } else {
      state.options = [];
    }
    state.message = status === "confirmed" ? "Situation confirmed. Choose your next action." : "Situation dismissed.";
    return result;
  });

  const selectOption = (optionId) => withBusy(async () => {
    const option = state.options.find((item) => item?.id === optionId && item?.status === "proposed");
    if (!option || !state.situation?.id) throw new WayfinderClientError("That option is no longer available.");
    const decision = await request("/wayfinder/decisions", {
      method: "POST",
      body: JSON.stringify({
        situationId: state.situation.id,
        selectedOptionId: option.id,
        actionStatus: "not_started",
        traceId: `desktop-wayfinder-${Date.now()}`,
        approvalAcknowledged: option.requiresApproval || ["high", "critical"].includes(option.riskLevel),
      }),
    });
    state.lastDecision = decision;
    state.options = [];
    state.message = "Choice recorded.";
    return decision;
  });

  const getStatus = () => normalizeStatus(state);
  return { getStatus, refresh, grantConsent, capture, confirm, selectOption };
}
