import { z } from "zod";
import type { ContextPacket, GatewayTraceContext } from "@mindanchor/domain";
import type { AppEnv } from "../env.js";
import type { ModelBridge } from "../lib/model-bridge.js";

export type SingleBrainModelInput = {
  packet: ContextPacket;
  systemPromptVersion: string;
  traceContext: GatewayTraceContext;
};

export type SingleBrainModelResult =
  | { status: "completed"; response: string; modelTier: string; adapterDecision: Record<string, unknown> }
  | {
      status: "failed";
      failureCode: "model_unavailable" | "invalid_model_response" | "provider_error";
      modelTier: string;
      adapterDecision: Record<string, unknown>;
    }
  | {
      status: "blocked";
      failureCode: "p3_local_only_unavailable";
      modelTier: string;
      adapterDecision: Record<string, unknown>;
    };

export interface SingleBrainModelAdapter {
  readonly locality: "local" | "remote" | "stub";
  generate(input: SingleBrainModelInput): Promise<SingleBrainModelResult>;
}

const MODEL_TARGET = "comma-single-brain" as const;
const generationSchema = z.object({ response: z.string().min(1).max(12000) }).strict();

const decision = (value: Record<string, unknown>): Record<string, unknown> => value;

/** An entirely deterministic adapter for development and offline operation. */
export class StubSingleBrainModelAdapter implements SingleBrainModelAdapter {
  readonly locality = "stub" as const;

  async generate(_input: SingleBrainModelInput): Promise<SingleBrainModelResult> {
    return {
      status: "completed",
      response: "我在这里陪你一起梳理。可以先从眼前最想说的一点开始。",
      modelTier: "stub",
      adapterDecision: decision({ adapter: "stub", target: MODEL_TARGET, offline: true }),
    };
  }
}

type GenerateJson = Pick<ModelBridge, "generateJson">["generateJson"];
type BridgeLike = { generateJson: GenerateJson };

/**
 * Capability adapter around ModelBridge. It deliberately accepts only a
 * bounded ContextPacket, never the legacy store or raw events.
 */
export class ModelBridgeSingleBrainAdapter implements SingleBrainModelAdapter {
  readonly locality = "remote" as const;

  constructor(
    private readonly bridge: BridgeLike,
    private readonly env: Pick<AppEnv, "defaultModelConfig" | "agentMode"> & {
      agentModelConfigs?: Record<string, AppEnv["defaultModelConfig"]>;
    },
  ) {}

  async generate(input: SingleBrainModelInput): Promise<SingleBrainModelResult> {
    const config = this.env.agentModelConfigs?.[MODEL_TARGET] ?? this.env.defaultModelConfig;
    const modelTier = config.model ?? MODEL_TARGET;
    const baseDecision = {
      adapter: "model-bridge",
      target: MODEL_TARGET,
      dataBoundary: input.packet.dataBoundary,
      systemPromptVersion: input.systemPromptVersion,
    };

    if (input.packet.dataBoundary === "local_only") {
      return {
        status: "blocked",
        failureCode: "p3_local_only_unavailable",
        modelTier,
        adapterDecision: decision({ ...baseDecision, locality: this.locality, blocked: true }),
      };
    }

    if (this.env.agentMode !== "openai-compatible" || !config.baseUrl || !config.model) {
      return {
        status: "failed",
        failureCode: "model_unavailable",
        modelTier,
        adapterDecision: decision({ ...baseDecision, route: "failed", reason: "model_unavailable" }),
      };
    }

    const systemPrompt = [
      `You are Comma Single Brain. systemPromptVersion=${input.systemPromptVersion}.`,
      "Respond with JSON matching the schema {response:string}.",
      "Be warm, concise, and non-commanding; do not expose internal metadata.",
    ].join("\n");
    // ContextBuilder is the sole source of this packet. JSON serialization is
    // intentionally limited to its allow-listed fields.
    const { lifeCompass: _omittedLifeCompass, ...cloudSafePacket } = input.packet;
    const userPrompt = JSON.stringify(cloudSafePacket);

    try {
      const generated = await this.bridge.generateJson({
        target: MODEL_TARGET,
        systemPrompt,
        userPrompt,
        schema: generationSchema,
        fallback: () => {
          // A configured bridge reached its terminal fallback after an
          // unusable model payload. Missing configuration is handled above.
          throw new Error("invalid_model_response");
        },
        traceContext: input.traceContext,
      });
      const parsed = generationSchema.safeParse(generated);
      if (!parsed.success) {
        return {
          status: "failed",
          failureCode: "invalid_model_response",
          modelTier,
          adapterDecision: decision({ ...baseDecision, route: "provider", reason: "invalid_model_response" }),
        };
      }
      return {
        status: "completed",
        response: parsed.data.response,
        modelTier,
        adapterDecision: decision({ ...baseDecision, route: "provider", success: true }),
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "provider_error";
      const failureCode = /invalid|json|schema/i.test(reason) ? "invalid_model_response" : "provider_error";
      return {
        status: "failed",
        failureCode,
        modelTier,
        adapterDecision: decision({ ...baseDecision, route: "provider", reason: failureCode }),
      };
    }
  }
}
