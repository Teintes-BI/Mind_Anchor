import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAlignedRunnerProviderDriftWarning,
  buildGatewayProviderEnvOverrides,
  compareProviderConfigDrift,
} from "../lib/core-phase-provider-config-drift.mjs";

test("compareProviderConfigDrift reports aligned configs", () => {
  const result = compareProviderConfigDrift({
    gateway: {
      baseUrl: "https://gmncode.cn",
      model: "gpt-5.4",
      wireApi: "responses",
      apiKey: "same-key",
    },
    openClaw: {
      baseUrl: "https://gmncode.cn",
      model: "gpt-5.4",
      wireApi: "responses",
      apiKey: "same-key",
    },
  });

  assert.equal(result.aligned, true);
  assert.deepEqual(result.issues, []);
});

test("compareProviderConfigDrift reports base url and key drift without leaking secrets", () => {
  const result = compareProviderConfigDrift({
    gateway: {
      baseUrl: "https://cdn-gmn.chuangzuoli.com",
      model: "gpt-5.4",
      wireApi: "responses",
      apiKey: "gateway-key",
    },
    openClaw: {
      baseUrl: "https://gmncode.cn",
      model: "gpt-5.4",
      wireApi: "responses",
      apiKey: "openclaw-key",
    },
  });

  assert.equal(result.aligned, false);
  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ["provider_base_url_drift", "provider_api_key_drift"],
  );
  assert.equal(result.summary.gateway.apiKeyPresent, true);
  assert.equal(result.summary.openClaw.apiKeyPresent, true);
  assert.equal(result.summary.gateway.apiKeyLength, 11);
  assert.equal(result.summary.openClaw.apiKeyLength, 12);
});

test("compareProviderConfigDrift reports missing openclaw config", () => {
  const result = compareProviderConfigDrift({
    gateway: {
      baseUrl: "https://gmncode.cn",
      model: "gpt-5.4",
      wireApi: "responses",
      apiKey: "gateway-key",
    },
    openClaw: null,
  });

  assert.equal(result.aligned, false);
  assert.equal(result.issues[0].code, "missing_openclaw_profile_provider_config");
});

test("buildGatewayProviderEnvOverrides maps OpenClaw profile config to Gateway env overrides", () => {
  assert.deepEqual(
    buildGatewayProviderEnvOverrides({
      baseUrl: "https://gmncode.cn",
      model: "gpt-5.4",
      wireApi: "responses",
      apiKey: "token-value",
    }),
    {
      MINDANCHOR_DEFAULT_MODEL_BASE_URL: "https://gmncode.cn",
      MINDANCHOR_DEFAULT_MODEL_NAME: "gpt-5.4",
      MINDANCHOR_DEFAULT_MODEL_WIRE_API: "responses",
      MINDANCHOR_DEFAULT_MODEL_API_KEY: "token-value",
    },
  );
});

test("buildAlignedRunnerProviderDriftWarning returns non-secret warning metadata when shell env drifts from profile", () => {
  const warning = buildAlignedRunnerProviderDriftWarning({
    gateway: {
      baseUrl: "https://cdn-gmn.chuangzuoli.com",
      model: "gpt-5.4",
      wireApi: "responses",
      apiKey: "gateway-key",
    },
    openClaw: {
      profileName: "dev",
      baseUrl: "https://drigeo.com",
      model: "gpt-5.4",
      wireApi: "responses",
      apiKey: "openclaw-key",
    },
  });

  assert.deepEqual(warning.driftCodes, ["provider_base_url_drift", "provider_api_key_drift"]);
  assert.equal(warning.profileName, "dev");
  assert.deepEqual(warning.shellSummary, {
    baseUrl: "https://cdn-gmn.chuangzuoli.com",
    model: "gpt-5.4",
    wireApi: "responses",
    apiKeyPresent: true,
    apiKeyLength: 11,
  });
  assert.deepEqual(warning.profileSummary, {
    baseUrl: "https://drigeo.com",
    model: "gpt-5.4",
    wireApi: "responses",
    apiKeyPresent: true,
    apiKeyLength: 12,
  });
  assert.deepEqual(warning.alignedEnvOverrides, {
    MINDANCHOR_DEFAULT_MODEL_BASE_URL: "https://drigeo.com",
    MINDANCHOR_DEFAULT_MODEL_NAME: "gpt-5.4",
    MINDANCHOR_DEFAULT_MODEL_WIRE_API: "responses",
    MINDANCHOR_DEFAULT_MODEL_API_KEY: "openclaw-key",
  });
});

test("buildAlignedRunnerProviderDriftWarning returns null when shell env already matches profile", () => {
  const warning = buildAlignedRunnerProviderDriftWarning({
    gateway: {
      baseUrl: "https://drigeo.com",
      model: "gpt-5.4",
      wireApi: "responses",
      apiKey: "same-key",
    },
    openClaw: {
      profileName: "dev",
      baseUrl: "https://drigeo.com",
      model: "gpt-5.4",
      wireApi: "responses",
      apiKey: "same-key",
    },
  });

  assert.equal(warning, null);
});
