import { decisionOptionSchema, type DecisionOption, type Situation } from "@mindanchor/domain";
import { z } from "zod";
import { architectWayfinderOptions } from "../../../../../openclaw/runtime/workers/wayfinder-option-worker.mjs";
import type { ModelBridge } from "../../lib/model-bridge.js";
import { buildGatewayTraceContext } from "../../lib/openclaw-trace.js";
import { createId, now } from "../../lib/utils.js";
import { WayfinderRepository } from "./wayfinder-repository.js";

const optionDraftSchema = z.object({
  action: z.string().min(1),
  firstStep: z.string().min(1),
  rationale: z.string().min(1),
  immediateBenefits: z.array(z.string().min(1)).default([]),
  costs: z.array(z.string().min(1)).default([]),
  projectedConsequences: z
    .array(
      z.object({
        horizon: z.enum(["today", "week", "month", "long_term"]),
        text: z.string().min(1),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1),
  reversibility: z.enum(["reversible", "partly_reversible", "hard_to_reverse"]),
  valueAlignment: z.array(
    z.object({
      valueId: z.string().min(1),
      effect: z.enum(["supports", "trades_off", "unknown"]),
      explanation: z.string().min(1),
    }),
  ),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  requiresApproval: z.boolean().default(false),
});

const optionDraftsSchema = z
  .object({ options: z.array(optionDraftSchema).length(3) })
  .superRefine((value, context) => {
    const actions = new Set(value.options.map((option) => option.action.trim().toLocaleLowerCase()));
    if (actions.size !== value.options.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["options"], message: "Options must be distinct" });
    }
  });

const optionDraftContractExample = {
  options: [
    {
      action: "string",
      firstStep: "string",
      rationale: "string",
      immediateBenefits: ["string"],
      costs: ["string"],
      projectedConsequences: [
        { horizon: "today", text: "string", confidence: 0.8 },
        { horizon: "long_term", text: "string", confidence: 0.6 },
      ],
      reversibility: "reversible",
      valueAlignment: [{ valueId: "agency", effect: "supports", explanation: "string" }],
      riskLevel: "low",
      requiresApproval: false,
    },
  ],
};

type OptionDrafts = z.infer<typeof optionDraftsSchema>;

const toDrafts = (options: DecisionOption[]): OptionDrafts =>
  optionDraftsSchema.parse({
    options: options.map((option) => ({
      action: option.action,
      firstStep: option.firstStep,
      rationale: option.rationale,
      immediateBenefits: option.immediateBenefits,
      costs: option.costs,
      projectedConsequences: option.projectedConsequences,
      reversibility: option.reversibility,
      valueAlignment: option.valueAlignment,
      riskLevel: option.riskLevel,
      requiresApproval: option.requiresApproval,
    })),
  });

export class WayfinderOptionGenerationService {
  private readonly repository: WayfinderRepository;
  private readonly modelBridge: Pick<ModelBridge, "generateJson">;
  private readonly idFactory: () => string;
  private readonly clock: () => string;

  constructor({
    repository,
    modelBridge,
    idFactory = createId,
    clock = now,
  }: {
    repository: WayfinderRepository;
    modelBridge: Pick<ModelBridge, "generateJson">;
    idFactory?: () => string;
    clock?: () => string;
  }) {
    this.repository = repository;
    this.modelBridge = modelBridge;
    this.idFactory = idFactory;
    this.clock = clock;
  }

  async generateForSituation({
    userId,
    situation,
    traceId,
  }: {
    userId: string;
    situation: Situation;
    traceId: string;
  }) {
    const evidenceRefs = [...situation.eventIds];
    const fallback = () =>
      toDrafts(
        architectWayfinderOptions({
          userId,
          situation,
          evidenceRefs,
          traceId,
          createdAt: this.clock(),
        }).options,
      );
    const generated = await this.modelBridge.generateJson({
      target: "analyst-agent",
      systemPrompt: [
        "You are the Wayfinder option architect.",
        "Return JSON with exactly three genuinely different options and no prose outside JSON.",
        "Use these exact keys and nesting for every option; do not rename or omit keys:",
        JSON.stringify(optionDraftContractExample),
        "Allowed horizon values: today, week, month, long_term.",
        "Allowed reversibility values: reversible, partly_reversible, hard_to_reverse.",
        "Allowed valueAlignment effect values: supports, trades_off, unknown.",
        "Allowed riskLevel values: low, medium, high, critical.",
        "Each option must preserve user agency, name costs, include today and long_term consequences, and avoid external action.",
        "High or critical risk options must set requiresApproval to true.",
      ].join(" "),
      userPrompt: JSON.stringify({
        workflow: "wayfinder_option_architecture",
        situation: {
          summary: situation.summary,
          uncertainty: situation.uncertainty,
          riskLevel: situation.riskLevel,
          linkedGoalIds: situation.linkedGoalIds,
          linkedTaskIds: situation.linkedTaskIds,
        },
        requiredOptionCount: 3,
      }),
      schema: optionDraftsSchema,
      fallback,
      traceContext: buildGatewayTraceContext({
        traceId,
        operation: "generate",
        agentName: "analyst-agent",
        workflow: "wayfinder_option_architecture",
        userId,
      }),
      runtimeContext: {
        workflow: "wayfinder_option_architecture",
        userId,
        frontAgent: "analyst-agent",
        memoryScopes: ["user.preferences", "user.goals", "user.decision_outcomes"],
      },
    });
    const createdAt = this.clock();
    const options = generated.options.map((draft, index) => {
      const enforcedRiskLevel =
        situation.riskLevel === "high" || situation.riskLevel === "critical"
          ? situation.riskLevel
          : draft.riskLevel;
      return decisionOptionSchema.parse({
        ...draft,
        id: this.idFactory(),
        userId,
        situationId: situation.id,
        status: "proposed",
        evidenceRefs,
        consultedSkills: ["values_clarification@1.0.0", "systems_perspective@1.0.0"],
        riskLevel: enforcedRiskLevel,
        requiresApproval:
          enforcedRiskLevel === "high" || enforcedRiskLevel === "critical" ? true : draft.requiresApproval,
        createdAt,
        traceId: `${traceId}:option:${index + 1}`,
      });
    });

    return (await this.repository.saveOptions(userId, situation.id, options)) ?? [];
  }
}
