import test from "node:test";
import assert from "node:assert/strict";

import {
  probeProviderAuth,
  shouldTreatStatusAsAcceptedAuth,
} from "../lib/core-phase-provider-auth-probe.mjs";

test("shouldTreatStatusAsAcceptedAuth treats non-auth client errors as accepted auth", () => {
  assert.equal(shouldTreatStatusAsAcceptedAuth(400), true);
  assert.equal(shouldTreatStatusAsAcceptedAuth(422), true);
  assert.equal(shouldTreatStatusAsAcceptedAuth(429), true);
  assert.equal(shouldTreatStatusAsAcceptedAuth(401), false);
  assert.equal(shouldTreatStatusAsAcceptedAuth(403), false);
  assert.equal(shouldTreatStatusAsAcceptedAuth(404), false);
});

test("probeProviderAuth passes when provider returns HTTP 200", async () => {
  const calls = [];
  const result = await probeProviderAuth({
    baseUrl: "https://api.example.com",
    apiKey: "test-key",
    model: "gpt-5.4",
    wireApi: "responses",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ id: "resp_123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.acceptedVia, "ok");
  assert.equal(result.selectedEndpoint, "/responses");
  assert.equal(result.issue, null);
  assert.equal(calls.length, 1);
});

test("probeProviderAuth passes when provider returns HTTP 422 after auth succeeded", async () => {
  const result = await probeProviderAuth({
    baseUrl: "https://api.example.com",
    apiKey: "test-key",
    model: "gpt-5.4",
    wireApi: "responses",
    fetchImpl: async () =>
      new Response(JSON.stringify({ error: { message: "unprocessable" } }), {
        status: 422,
        headers: { "content-type": "application/json" },
      }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.acceptedVia, "non_auth_http_status");
  assert.equal(result.selectedEndpoint, "/responses");
  assert.equal(result.issue, null);
});

test("probeProviderAuth fails early when all variants return invalid api key", async () => {
  const result = await probeProviderAuth({
    baseUrl: "https://api.example.com",
    apiKey: "bad-key",
    model: "gpt-5.4",
    wireApi: "responses",
    fetchImpl: async () =>
      new Response(JSON.stringify({ code: "INVALID_API_KEY", message: "Invalid API key" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.issue.code, "invalid_provider_api_key");
  assert.match(result.issue.message, /HTTP 401/);
  assert.equal(result.attempts.length, 2);
});

test("probeProviderAuth fails with endpoint guidance when all variants are 404", async () => {
  const result = await probeProviderAuth({
    baseUrl: "https://api.example.com/custom",
    apiKey: "test-key",
    model: "gpt-5.4",
    wireApi: "responses",
    fetchImpl: async () => new Response("not found", { status: 404 }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.issue.code, "provider_probe_endpoint_not_found");
  assert.match(result.issue.guidance, /MINDANCHOR_DEFAULT_MODEL_BASE_URL/);
});

test("probeProviderAuth fails with network guidance when provider probe throws", async () => {
  const result = await probeProviderAuth({
    baseUrl: "https://api.example.com",
    apiKey: "test-key",
    model: "gpt-5.4",
    wireApi: "chat-completions",
    fetchImpl: async () => {
      throw new Error("connect ECONNREFUSED");
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.issue.code, "provider_probe_request_failed");
  assert.match(result.issue.message, /ECONNREFUSED/);
  assert.equal(result.attempts.length, 2);
});
