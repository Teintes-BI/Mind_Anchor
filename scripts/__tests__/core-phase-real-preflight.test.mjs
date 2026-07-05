import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateCorePhasePreflight,
  formatCorePhasePreflightIssues,
} from "../lib/core-phase-real-preflight.mjs";

test("evaluateCorePhasePreflight passes when real provider and real cluster prerequisites are present", () => {
  const result = evaluateCorePhasePreflight({
    clusterMode: "real",
    providerMode: "real",
    env: {
      MINDANCHOR_DEFAULT_MODEL_BASE_URL: "https://api.example.com/v1",
      MINDANCHOR_DEFAULT_MODEL_API_KEY: "test-key",
      MINDANCHOR_DEFAULT_MODEL_NAME: "gpt-5.4",
      MINDANCHOR_DEFAULT_MODEL_WIRE_API: "responses",
    },
    openClawBinPath: "/Users/test/.openclaw/bin/openclaw",
    openClawBinExists: true,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test("evaluateCorePhasePreflight reports all missing real provider variables", () => {
  const result = evaluateCorePhasePreflight({
    clusterMode: "local",
    providerMode: "real",
    env: {},
    openClawBinPath: "/Users/test/.openclaw/bin/openclaw",
    openClawBinExists: true,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    [
      "missing_default_model_base_url",
      "missing_default_model_api_key",
      "missing_default_model_name",
      "missing_default_model_wire_api",
    ],
  );
});

test("evaluateCorePhasePreflight reports missing OpenClaw CLI in real cluster mode", () => {
  const result = evaluateCorePhasePreflight({
    clusterMode: "real",
    providerMode: "mock",
    env: {},
    openClawBinPath: "/Users/test/.openclaw/bin/openclaw",
    openClawBinExists: false,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((issue) => issue.code), ["missing_openclaw_bin"]);
});

test("evaluateCorePhasePreflight reports incompatible Node for OpenClaw real mode", () => {
  const result = evaluateCorePhasePreflight({
    clusterMode: "real",
    providerMode: "mock",
    env: {},
    openClawBinPath: "/Users/test/.openclaw/bin/openclaw",
    openClawBinExists: true,
    selectedNodePath: "/repo/.tools/node/bin/node",
    selectedNodeVersion: "v22.14.0",
    minimumNodeVersion: { major: 22, minor: 16, patch: 0 },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map((issue) => issue.code), ["incompatible_openclaw_node"]);
});

test("formatCorePhasePreflightIssues renders readable guidance lines", () => {
  const text = formatCorePhasePreflightIssues([
    {
      code: "missing_default_model_api_key",
      message: "缺少 MINDANCHOR_DEFAULT_MODEL_API_KEY。",
      guidance: "请先导出真实 provider API key。",
    },
    {
      code: "missing_openclaw_bin",
      message: "OpenClaw CLI 不存在。",
      guidance: "请检查 OPENCLAW_BIN 或 ~/.openclaw/bin/openclaw。",
    },
  ]);

  assert.match(text, /missing_default_model_api_key/);
  assert.match(text, /请先导出真实 provider API key/);
  assert.match(text, /missing_openclaw_bin/);
});
