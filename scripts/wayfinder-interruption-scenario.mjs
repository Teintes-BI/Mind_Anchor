import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

export const INTERRUPTION_SCENARIO_TEXT =
  "I am finishing the main analysis, but a colleague asks me to send a preliminary result this afternoon.";

const ensure = (condition, message) => {
  if (!condition) throw new Error(message);
};

const requestJson = async ({ baseUrl, token, fetchImpl, method, path, body, idempotencyKey }) => {
  const response = await fetchImpl(new URL(path, `${baseUrl.replace(/\/$/, "")}/`).toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${method} ${path} returned non-JSON HTTP ${response.status}.`);
  }
  if (!response.ok) {
    const detail = typeof payload?.message === "string" ? `: ${payload.message}` : "";
    throw new Error(`${method} ${path} failed with HTTP ${response.status}${detail}`);
  }
  return payload;
};

export async function runWayfinderInterruptionScenario({
  baseUrl,
  token,
  fetchImpl = fetch,
  runId = randomUUID(),
  occurredAt = new Date().toISOString(),
}) {
  ensure(typeof baseUrl === "string" && baseUrl.trim(), "A Wayfinder API base URL is required.");
  ensure(typeof token === "string" && token.trim(), "A Wayfinder API bearer token is required.");
  const request = (method, path, body, idempotencyKey) =>
    requestJson({ baseUrl, token, fetchImpl, method, path, body, idempotencyKey });
  const source = `scenario-${runId}`;
  const trace = (step) => `wayfinder-interruption-${runId}-${step}`;

  const consent = await request("PATCH", `/wayfinder/consent/${encodeURIComponent(source)}`, {
    purpose: "wayfinder_context",
    scope: "manual_notes",
    status: "granted",
    rawRetentionSeconds: 0,
    derivedRetentionDays: 30,
    modelSharing: "local_only",
  });
  ensure(typeof consent.id === "string" && consent.id, "Consent response did not include an id.");

  const event = await request(
    "POST",
    "/wayfinder/events",
    {
      sourceDeviceId: source,
      kind: "manual_note",
      occurredAt,
      payload: { text: INTERRUPTION_SCENARIO_TEXT },
      confidence: 1,
      consentRef: consent.id,
      retentionClass: "summary",
      evidenceRefs: [`scenario-evidence-${runId}`],
      traceId: trace("event"),
    },
    `wayfinder-interruption-${runId}`,
  );
  const situationId = event?.situation?.id;
  ensure(typeof situationId === "string" && situationId, "Event response did not include a situation id.");

  const confirmation = await request("POST", `/wayfinder/situations/${encodeURIComponent(situationId)}/confirm`, {
    status: "confirmed",
    traceId: trace("confirm"),
  });
  ensure(confirmation?.situation?.status === "confirmed", "Situation was not confirmed.");
  ensure(confirmation?.fullStatus === "completed", "Option generation did not complete during confirmation.");
  ensure(Array.isArray(confirmation.options) && confirmation.options.length === 3, "Confirmation did not return exactly three options.");

  const persisted = await request("GET", `/wayfinder/situations/${encodeURIComponent(situationId)}/options`);
  ensure(Array.isArray(persisted.options) && persisted.options.length === 3, "Exactly three options were not persisted.");
  ensure(new Set(persisted.options.map((option) => option.action)).size === 3, "Persisted options are not distinct.");
  const selected = persisted.options[0];
  ensure(typeof selected?.id === "string" && selected.id, "The selected option has no id.");

  const decision = await request("POST", "/wayfinder/decisions", {
    situationId,
    selectedOptionId: selected.id,
    actionStatus: "in_progress",
    approvalAcknowledged: selected.requiresApproval === true,
    traceId: trace("decision"),
  });
  ensure(typeof decision.id === "string" && decision.id, "Decision response did not include an id.");

  const outcome = await request("PATCH", `/wayfinder/decisions/${encodeURIComponent(decision.id)}/outcome`, {
    status: "observed",
    summary: "The preliminary result was bounded and the main analysis remained the primary task.",
    userFeeling: "The trade-off was explicit and remained under user control.",
    userRating: 4,
    evidenceRefs: [`scenario-evidence-${runId}`],
    traceId: trace("outcome"),
  });
  ensure(typeof outcome.id === "string" && outcome.id, "Outcome response did not include an id.");

  const history = await request("GET", "/wayfinder/decisions");
  const persistedDecision = history?.decisions?.find((entry) => entry?.decision?.id === decision.id);
  ensure(persistedDecision, "Decision history did not contain the scenario decision.");
  ensure(persistedDecision.option?.id === selected.id, "Decision history did not preserve the selected option.");
  ensure(persistedDecision.outcomes?.some((item) => item.id === outcome.id), "Decision history did not preserve the outcome.");

  return {
    ok: true,
    runId,
    situationId,
    optionCount: persisted.options.length,
    selectedOptionId: selected.id,
    selectedAction: selected.action,
    decisionId: decision.id,
    outcomeId: outcome.id,
  };
}

const argumentValue = (args, name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const baseUrl = argumentValue(args, "--base-url") ?? process.env.MINDANCHOR_API_BASE_URL ?? "http://127.0.0.1:3001";
  const suppliedToken = argumentValue(args, "--token") ?? process.env.MINDANCHOR_API_TOKEN;
  const localBaseUrl = /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/?$/i.test(baseUrl);
  const token = suppliedToken ?? (localBaseUrl ? "dev:wayfinder-scenario:wayfinder-scenario@local" : undefined);
  const result = await runWayfinderInterruptionScenario({ baseUrl, token });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
