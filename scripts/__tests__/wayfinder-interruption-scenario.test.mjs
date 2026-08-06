import test from "node:test";
import assert from "node:assert/strict";
import { runWayfinderInterruptionScenario } from "../wayfinder-interruption-scenario.mjs";

const response = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("runs the interruption scenario through consent, three options, choice, outcome, and history", async () => {
  const calls = [];
  const options = [1, 2, 3].map((index) => ({
    id: `option-${index}`,
    action: `Action ${index}`,
    requiresApproval: index === 1,
  }));
  const fetchImpl = async (url, init = {}) => {
    const path = new URL(url).pathname;
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method: init.method ?? "GET", path, body, headers: init.headers });
    if (path.startsWith("/wayfinder/consent/")) return response({ id: "consent-1" });
    if (path === "/wayfinder/events") return response({ situation: { id: "situation-1" } });
    if (path === "/wayfinder/situations/situation-1/confirm") {
      return response({ situation: { id: "situation-1", status: "confirmed" }, options, fullStatus: "completed" });
    }
    if (path === "/wayfinder/situations/situation-1/options") return response({ options });
    if (path === "/wayfinder/decisions" && init.method === "POST") return response({ id: "decision-1" }, 201);
    if (path === "/wayfinder/decisions/decision-1/outcome") return response({ id: "outcome-1", status: "observed" });
    if (path === "/wayfinder/decisions") {
      return response({ decisions: [{ decision: { id: "decision-1" }, option: options[0], outcomes: [{ id: "outcome-1" }] }] });
    }
    return response({ message: `Unexpected route ${path}` }, 404);
  };

  const result = await runWayfinderInterruptionScenario({
    baseUrl: "http://api.test",
    token: "test-token",
    fetchImpl,
    runId: "test-run",
    occurredAt: "2026-08-07T09:00:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.optionCount, 3);
  assert.equal(result.situationId, "situation-1");
  assert.equal(result.decisionId, "decision-1");
  assert.equal(result.outcomeId, "outcome-1");
  assert.deepEqual(calls.map(({ method, path }) => `${method} ${path}`), [
    "PATCH /wayfinder/consent/scenario-test-run",
    "POST /wayfinder/events",
    "POST /wayfinder/situations/situation-1/confirm",
    "GET /wayfinder/situations/situation-1/options",
    "POST /wayfinder/decisions",
    "PATCH /wayfinder/decisions/decision-1/outcome",
    "GET /wayfinder/decisions",
  ]);
  assert.equal(calls[4].body.approvalAcknowledged, true);
  assert.match(calls[1].body.payload.text, /main analysis/);
  assert.equal(String(calls[0].headers.Authorization).includes("test-token"), true);
});
