import test from "node:test";
import assert from "node:assert/strict";
import { createWayfinderClient, WayfinderClientError } from "../wayfinder-client.js";

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return payload; } };
}

test("reports an explicit configuration state before API calls", () => {
  const client = createWayfinderClient({ apiBaseUrl: "http://api" });
  assert.equal(client.getStatus().configured, false);
  assert.match(client.getStatus().message, /MINDANCHOR_API_TOKEN/);
});

test("loads consent, active situation, and options", async () => {
  const calls = [];
  const client = createWayfinderClient({
    apiBaseUrl: "http://api",
    token: "token-1",
    fetchImpl: async (url, options) => {
      calls.push([url, options]);
      if (url.endsWith("/wayfinder/consent")) return response({ grants: [{ id: "grant-1", status: "granted" }] });
      if (url.endsWith("/wayfinder/situations")) return response({ situations: [{ id: "s-1", status: "confirmed", summary: "Decide" }] });
      return response({ situationId: "s-1", options: [{ id: "o-1", status: "proposed", action: "Start" }] });
    },
  });

  await client.refresh();
  assert.equal(client.getStatus().connected, true);
  assert.equal(client.getStatus().situation.id, "s-1");
  assert.equal(client.getStatus().options[0].id, "o-1");
  assert.equal(calls[0][1].headers.Authorization, "Bearer token-1");
});

test("captures only after consent and sends a bounded manual event", async () => {
  const requests = [];
  const client = createWayfinderClient({
    apiBaseUrl: "http://api",
    token: "token-1",
    fetchImpl: async (url, options) => {
      requests.push([url, options]);
      if (url.endsWith("/wayfinder/consent")) return response({ grants: [{ id: "grant-1", status: "granted" }] });
      if (url.endsWith("/wayfinder/situations")) return response({ situations: [] });
      return response({ situation: { id: "s-1", status: "awaiting_confirmation", summary: "Decide" } });
    },
  });
  await client.refresh();
  await client.capture("  Decide whether to start  ");
  const body = JSON.parse(requests.at(-1)[1].body);
  assert.equal(body.payload.summary, "Decide whether to start");
  assert.equal(body.kind, "manual_note");
});

test("surfaces API errors without hiding them", async () => {
  const client = createWayfinderClient({
    apiBaseUrl: "http://api",
    token: "token-1",
    fetchImpl: async () => response({ message: "Unauthorized" }, 401),
  });
  await assert.rejects(() => client.refresh(), (error) => {
    assert.ok(error instanceof WayfinderClientError);
    assert.equal(error.status, 401);
    return true;
  });
  assert.equal(client.getStatus().error, "Unauthorized");
});
