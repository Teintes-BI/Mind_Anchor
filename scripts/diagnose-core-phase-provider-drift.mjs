#!/usr/bin/env node
import { compareProviderConfigDrift, readOpenClawProfileProviderConfig } from "./lib/core-phase-provider-config-drift.mjs";

const profileName = process.env.OPENCLAW_REAL_PROFILE ?? "dev";

const gateway = {
  baseUrl: process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL ?? null,
  model: process.env.MINDANCHOR_DEFAULT_MODEL_NAME ?? null,
  wireApi: process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API === "chat-completions" ? "chat-completions" : "responses",
  apiKey: process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY ?? null,
};

const openClaw = await readOpenClawProfileProviderConfig({ profileName });
const result = compareProviderConfigDrift({ gateway, openClaw });
const recommendedEnvOverrides = {};
if (openClaw?.baseUrl && gateway.baseUrl !== openClaw.baseUrl) {
  recommendedEnvOverrides.MINDANCHOR_DEFAULT_MODEL_BASE_URL = openClaw.baseUrl;
}
if (openClaw?.model && gateway.model !== openClaw.model) {
  recommendedEnvOverrides.MINDANCHOR_DEFAULT_MODEL_NAME = openClaw.model;
}
if (openClaw?.wireApi && gateway.wireApi !== openClaw.wireApi) {
  recommendedEnvOverrides.MINDANCHOR_DEFAULT_MODEL_WIRE_API = openClaw.wireApi;
}

process.stdout.write(`${JSON.stringify({
  profileName,
  aligned: result.aligned,
  issues: result.issues,
  summary: result.summary,
  openClawConfigPath: openClaw?.configPath ?? null,
  recommendedEnvOverrides,
}, null, 2)}\n`);

if (!result.aligned) {
  process.exitCode = 1;
}
