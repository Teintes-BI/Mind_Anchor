import { describe, expect, it, vi } from "vitest";
import type { ContextPacket } from "@mindanchor/domain";
import { buildGatewayTraceContext } from "../src/lib/openclaw-trace.js";
import {
  ModelBridgeSingleBrainAdapter,
  StubSingleBrainModelAdapter,
  type SingleBrainModelInput,
} from "../src/services/single-brain-model.js";
import type { AppEnv } from "../src/env.js";

const packet = (overrides: Partial<ContextPacket> = {}): ContextPacket => ({
  conversationId: "conv-1",
  profileId: "profile:u-1",
  userId: "u-1",
  userMessage: "我今天有点混乱",
  dataBoundary: "cloud_allowed",
  lifeCompass: null,
  currentState: null,
  recentEvents: [],
  history: [],
  redactions: ["P3_life_compass_omitted"],
  sourceEventIds: [],
  characterCount: 7,
  contextHash: "hash-1",
  createdAt: "2026-08-24T10:00:00.000Z",
  ...overrides,
});

const input = (overrides: Partial<ContextPacket> = {}): SingleBrainModelInput => ({
  packet: packet(overrides),
  systemPromptVersion: "single-brain-v1",
  traceContext: buildGatewayTraceContext({ operation: "generate", agentName: "comma-single-brain", userId: "u-1" }),
});

const env = (config: { baseUrl?: string; model?: string } = {}): AppEnv => ({
  apiHost: "127.0.0.1",
  apiPort: 3001,
  dataFile: "memory",
  agentMode: "openai-compatible",
  authDevBypassEnabled: true,
  defaultModelConfig: {
    baseUrl: config.baseUrl,
    model: config.model,
    wireApi: "chat-completions",
    disableResponseStorage: true,
  },
  agentModelConfigs: {},
});

describe("Single Brain model adapters", () => {
  it("stub is deterministic, offline, and non-commanding", async () => {
    const adapter = new StubSingleBrainModelAdapter();
    const result1 = await adapter.generate(input());
    const result2 = await adapter.generate(input());
    expect(result1).toEqual(result2);
    expect(result1).toMatchObject({ status: "completed", modelTier: "stub" });
    expect(result1.response).toMatch(/[，。！？]/);
    expect(result1.response).not.toMatch(/^(请|应该|必须|要)/);
  });

  it("blocks local-only packets before a remote bridge call", async () => {
    const generateJson = vi.fn();
    const adapter = new ModelBridgeSingleBrainAdapter({ generateJson }, env({ baseUrl: "https://example.test", model: "m" }));
    const result = await adapter.generate(input({ dataBoundary: "local_only", lifeCompass: "我的 Compass" }));
    expect(result).toMatchObject({ status: "blocked", failureCode: "p3_local_only_unavailable" });
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("sends only the bounded cloud packet and includes prompt version", async () => {
    let args: Record<string, unknown> | undefined;
    const generateJson = vi.fn(async (value: Record<string, unknown>) => {
      args = value;
      return { response: "我在这里陪你一起梳理。" };
    });
    const adapter = new ModelBridgeSingleBrainAdapter({ generateJson }, env({ baseUrl: "https://example.test", model: "m" }));
    const result = await adapter.generate(input());
    expect(result).toMatchObject({ status: "completed", response: "我在这里陪你一起梳理。" });
    expect(args?.target).toBe("comma-single-brain");
    expect(String(args?.systemPrompt)).toContain("single-brain-v1");
    expect(String(args?.userPrompt)).not.toContain("lifeCompass");
    expect(String(args?.userPrompt)).not.toContain("我的 Compass");
    expect(args?.schema).toBeDefined();
  });

  it("maps malformed model output to invalid_model_response", async () => {
    const generateJson = vi.fn(async () => {
      throw new Error("Invalid response JSON");
    });
    const adapter = new ModelBridgeSingleBrainAdapter({ generateJson }, env({ baseUrl: "https://example.test", model: "m" }));
    const result = await adapter.generate(input());
    expect(result).toMatchObject({ status: "failed", failureCode: "invalid_model_response" });
  });

  it("reports unavailable when baseUrl or model is missing", async () => {
    const generateJson = vi.fn();
    const adapter = new ModelBridgeSingleBrainAdapter({ generateJson }, env());
    const result = await adapter.generate(input());
    expect(result).toMatchObject({ status: "failed", failureCode: "model_unavailable" });
    expect(generateJson).not.toHaveBeenCalled();
  });

  it("maps provider exceptions without leaking raw errors", async () => {
    const generateJson = vi.fn(async () => {
      throw new Error("upstream timeout with secret token");
    });
    const adapter = new ModelBridgeSingleBrainAdapter({ generateJson }, env({ baseUrl: "https://example.test", model: "m" }));
    const result = await adapter.generate(input());
    expect(result).toMatchObject({ status: "failed", failureCode: "provider_error" });
    expect(JSON.stringify(result)).not.toContain("secret token");
  });

  it("accepts a context packet only as its model input", () => {
    const _input: SingleBrainModelInput = input();
    expect(_input.packet.lifeCompass).toBeNull();
  });
});
