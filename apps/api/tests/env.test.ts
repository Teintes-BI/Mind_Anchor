import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { agentTeamPersonaMetadata } from "@mindanchor/domain";
import {
  getAgentConfigAuditResponse,
  getEnv,
  OPENCLAW_AGENT_NAMES,
  OPENCLAW_CONVERSATION_COACH_AGENT_NAMES,
  OPENCLAW_PERSONA_AGENT_NAMES,
} from "../src/env.js";

const ORIGINAL_ENV = { ...process.env };

const resetMindAnchorEnv = () => {
  process.env = { ...ORIGINAL_ENV };
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("MINDANCHOR_")) {
      delete process.env[key];
    }
  }
};

describe("env", () => {
  beforeEach(() => {
    resetMindAnchorEnv();
  });

  afterEach(() => {
    resetMindAnchorEnv();
  });

  it("listens on loopback by default and supports an explicit host override", () => {
    expect(getEnv().apiHost).toBe("127.0.0.1");

    process.env.MINDANCHOR_API_HOST = "0.0.0.0";

    expect(getEnv().apiHost).toBe("0.0.0.0");
  });

  it("builds default per-agent configs from the shared defaults", () => {
    process.env.MINDANCHOR_AGENT_MODE = "openai-compatible";
    process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL = "https://default.example";
    process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY = "default-key";
    process.env.MINDANCHOR_DEFAULT_MODEL_NAME = "gpt-5.4";
    process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API = "responses";
    process.env.MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT = "xhigh";

    const env = getEnv();

    expect(env.agentMode).toBe("openai-compatible");
    expect(Object.keys(env.agentModelConfigs)).toEqual([
      ...OPENCLAW_AGENT_NAMES,
      ...OPENCLAW_PERSONA_AGENT_NAMES,
      ...OPENCLAW_CONVERSATION_COACH_AGENT_NAMES,
    ]);
    expect(env.defaultModelConfig.baseUrl).toBe("https://default.example");
    expect(env.agentModelConfigs["chief-agent"]).toMatchObject({
      baseUrl: "https://default.example",
      apiKey: "default-key",
      model: "gpt-5.4",
      wireApi: "responses",
      reasoningEffort: "xhigh",
      disableResponseStorage: true,
    });
  });

  it("applies per-agent overrides without affecting other agents", () => {
    process.env.MINDANCHOR_AGENT_MODE = "openai-compatible";
    process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL = "https://default.example";
    process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY = "default-key";
    process.env.MINDANCHOR_DEFAULT_MODEL_NAME = "gpt-5.4";
    process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API = "responses";
    process.env.MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT = "xhigh";
    process.env.MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_API_KEY = "state-key";
    process.env.MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_MODEL = "state-specialist";
    process.env.MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_REASONING_EFFORT = "high";
    process.env.MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_DISABLE_RESPONSE_STORAGE = "false";

    const env = getEnv();

    expect(env.agentModelConfigs["state-insight-agent"]).toMatchObject({
      apiKey: "state-key",
      model: "state-specialist",
      reasoningEffort: "high",
      disableResponseStorage: false,
    });
    expect(env.agentModelConfigs["chief-agent"]).toMatchObject({
      apiKey: "default-key",
      model: "gpt-5.4",
      reasoningEffort: "xhigh",
      disableResponseStorage: true,
    });
    expect(env.agentModelConfigs["interruption-recovery-agent"]).toMatchObject({
      apiKey: "default-key",
      model: "gpt-5.4",
      reasoningEffort: "xhigh",
      disableResponseStorage: true,
    });
  });

  it("builds dedicated conversation coach configs inside the unified target config map", () => {
    process.env.MINDANCHOR_AGENT_MODE = "openai-compatible";
    process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL = "https://default.example";
    process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY = "default-key";
    process.env.MINDANCHOR_DEFAULT_MODEL_NAME = "gpt-5.4";
    process.env.MINDANCHOR_AGENT_CONVERSATION_COACH_FAST_AGENT_MODEL = "coach-fast-model";
    process.env.MINDANCHOR_AGENT_CONVERSATION_COACH_AGENT_MODEL = "coach-full-model";
    process.env.MINDANCHOR_AGENT_CONVERSATION_COACH_AGENT_REASONING_EFFORT = "high";

    const env = getEnv();

    expect(Object.keys(env.agentModelConfigs)).toEqual([
      ...OPENCLAW_AGENT_NAMES,
      ...OPENCLAW_PERSONA_AGENT_NAMES,
      ...OPENCLAW_CONVERSATION_COACH_AGENT_NAMES,
    ]);
    expect(env.agentModelConfigs["conversation-coach-fast-agent"]).toMatchObject({
      model: "coach-fast-model",
      baseUrl: "https://default.example",
      apiKey: "default-key",
    });
    expect(env.agentModelConfigs["conversation-coach-agent"]).toMatchObject({
      model: "coach-full-model",
      reasoningEffort: "high",
    });
    expect(getAgentConfigAuditResponse(env).agents.map((entry) => entry.target)).toEqual([
      ...OPENCLAW_AGENT_NAMES,
      ...OPENCLAW_PERSONA_AGENT_NAMES,
      ...OPENCLAW_CONVERSATION_COACH_AGENT_NAMES,
    ]);
  });

  it("builds a safe config audit without exposing raw API keys", () => {
    process.env.MINDANCHOR_AGENT_MODE = "openai-compatible";
    process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL = "https://default.example";
    process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY = "default-key";
    process.env.MINDANCHOR_DEFAULT_MODEL_NAME = "gpt-5.4";
    process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API = "responses";
    process.env.MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT = "xhigh";
    process.env.MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_API_KEY = "state-key";
    process.env.MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_MODEL = "state-specialist";
    process.env.MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_REASONING_EFFORT = "high";
    process.env.MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_DISABLE_RESPONSE_STORAGE = "false";

    const response = getAgentConfigAuditResponse(getEnv());
    const stateInsight = response.agents.find((config) => config.target === "state-insight-agent");
    const chief = response.agents.find((config) => config.target === "chief-agent");

    expect(response.defaultModelConfig.envPrefix).toBe("MINDANCHOR_DEFAULT_MODEL");
    expect(stateInsight).toMatchObject({
      envPrefix: "MINDANCHOR_AGENT_STATE_INSIGHT_AGENT",
      model: "state-specialist",
      reasoningEffort: "high",
      hasApiKey: true,
      differsFromDefault: {
        baseUrl: false,
        apiKey: true,
        model: true,
        wireApi: false,
        reasoningEffort: true,
        disableResponseStorage: true,
      },
    });
    expect(chief?.differsFromDefault).toEqual({
      baseUrl: false,
      apiKey: false,
      model: false,
      wireApi: false,
      reasoningEffort: false,
      disableResponseStorage: false,
    });
    expect(JSON.stringify(response)).not.toContain("state-key");
    expect(JSON.stringify(response)).not.toContain("default-key");
  });

  it("exposes shared agent-team metadata for all visible personas", () => {
    expect(new Set(Object.keys(agentTeamPersonaMetadata))).toEqual(new Set(["picard", "troi", "spock", "guinan", "jarvis", "data"]));
    expect(agentTeamPersonaMetadata.picard).toMatchObject({
      agentId: "director-agent",
      displayName: "Picard",
      soulFilePath: "openclaw/souls/picard.md",
    });
    expect(agentTeamPersonaMetadata.troi).toMatchObject({
      agentId: "companion-agent",
      displayName: "Deanna Troi",
      soulFilePath: "openclaw/souls/deanna-troi.md",
    });
    expect(agentTeamPersonaMetadata.spock).toMatchObject({
      agentId: "analyst-agent",
      displayName: "Spock",
      soulFilePath: "openclaw/souls/spock.md",
    });
    expect(agentTeamPersonaMetadata.guinan).toMatchObject({
      agentId: "balance-agent",
      displayName: "Guinan",
      soulFilePath: "openclaw/souls/guinan.md",
    });
    expect(agentTeamPersonaMetadata.jarvis).toMatchObject({
      agentId: "life-secretary-agent",
      displayName: "Jarvis",
      soulFilePath: "openclaw/souls/jarvis.md",
    });
    expect(agentTeamPersonaMetadata.data).toMatchObject({
      agentId: "memory-governor-agent",
      displayName: "Data",
      soulFilePath: "openclaw/souls/data.md",
    });
  });

  it("resolves dedicated conversation coach targets by their own agent names", () => {
    process.env.MINDANCHOR_AGENT_MODE = "openai-compatible";
    process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL = "https://default.example";
    process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY = "default-key";
    process.env.MINDANCHOR_DEFAULT_MODEL_NAME = "gpt-5.4";
    process.env.MINDANCHOR_DEFAULT_MODEL_WIRE_API = "responses";
    process.env.MINDANCHOR_AGENT_CONVERSATION_COACH_FAST_AGENT_MODEL = "coach-fast-specialist";
    process.env.MINDANCHOR_AGENT_CONVERSATION_COACH_AGENT_MODEL = "coach-full-specialist";

    const env = getEnv();

    expect(OPENCLAW_CONVERSATION_COACH_AGENT_NAMES).toEqual([
      "conversation-coach-fast-agent",
      "conversation-coach-agent",
    ]);
    expect(env.agentModelConfigs["conversation-coach-fast-agent"]).toMatchObject({
      model: "coach-fast-specialist",
      baseUrl: "https://default.example",
    });
    expect(env.agentModelConfigs["conversation-coach-agent"]).toMatchObject({
      model: "coach-full-specialist",
      baseUrl: "https://default.example",
    });
    expect(getAgentConfigAuditResponse(env).agents.map((entry) => entry.target)).toEqual([
      ...OPENCLAW_AGENT_NAMES,
      ...OPENCLAW_PERSONA_AGENT_NAMES,
      ...OPENCLAW_CONVERSATION_COACH_AGENT_NAMES,
    ]);
  });

  it("supports dedicated persona agent configs by their own agent names", () => {
    process.env.MINDANCHOR_AGENT_MODE = "openai-compatible";
    process.env.MINDANCHOR_DEFAULT_MODEL_BASE_URL = "https://default.example";
    process.env.MINDANCHOR_DEFAULT_MODEL_API_KEY = "default-key";
    process.env.MINDANCHOR_DEFAULT_MODEL_NAME = "gpt-5.4";
    process.env.MINDANCHOR_AGENT_COMPANION_AGENT_MODEL = "troi-model";
    process.env.MINDANCHOR_AGENT_ANALYST_AGENT_MODEL = "spock-model";

    const env = getEnv();

    expect(OPENCLAW_PERSONA_AGENT_NAMES).toEqual([
      "director-agent",
      "companion-agent",
      "analyst-agent",
      "balance-agent",
      "life-secretary-agent",
      "memory-governor-agent",
    ]);
    expect(env.agentModelConfigs["companion-agent"]).toMatchObject({
      model: "troi-model",
      baseUrl: "https://default.example",
    });
    expect(env.agentModelConfigs["analyst-agent"]).toMatchObject({
      model: "spock-model",
      baseUrl: "https://default.example",
    });
  });
});
