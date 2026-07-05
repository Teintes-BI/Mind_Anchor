import test from "node:test";
import assert from "node:assert/strict";

import { buildCurlAuthArgs } from "../lib/m6-mobile-capture-adb-e2e-curl.mjs";

test("buildCurlAuthArgs maps bearer authorization to oauth2-bearer", () => {
  assert.deepEqual(buildCurlAuthArgs({ Authorization: "Bearer token-123" }), ["--oauth2-bearer", "token-123"]);
});

test("buildCurlAuthArgs keeps non-auth headers as -H pairs", () => {
  assert.deepEqual(buildCurlAuthArgs({ "Content-Type": "application/json" }), ["-H", "Content-Type: application/json"]);
});

test("buildCurlAuthArgs combines oauth2-bearer and regular headers", () => {
  assert.deepEqual(buildCurlAuthArgs({ Authorization: "Bearer token-123", Accept: "application/json" }), [
    "-H",
    "Accept: application/json",
    "--oauth2-bearer",
    "token-123",
  ]);
});
