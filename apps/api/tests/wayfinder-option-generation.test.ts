import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WayfinderOptionGenerationService } from "../src/services/wayfinder/option-generation-service.js";
import { WayfinderRepository } from "../src/services/wayfinder/wayfinder-repository.js";
import { MindAnchorStore } from "../src/store.js";

const draft = (index: number) => ({
  action: `Option ${index}`,
  firstStep: `First step ${index}`,
  rationale: `Rationale ${index}`,
  immediateBenefits: [`Benefit ${index}`],
  costs: [`Cost ${index}`],
  projectedConsequences: [
    { horizon: "today", text: `Today ${index}`, confidence: 0.8 },
    { horizon: "long_term", text: `Long term ${index}`, confidence: 0.6 },
  ],
  reversibility: "reversible",
  valueAlignment: [{ valueId: "focus", effect: "supports", explanation: `Focus ${index}` }],
  riskLevel: "low",
  requiresApproval: false,
});

describe("WayfinderOptionGenerationService", () => {
  let dataDir = "";
  let repository: WayfinderRepository;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-option-generation-"));
    const store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();
    repository = new WayfinderRepository(store);
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("turns exactly three model drafts into scoped persisted options", async () => {
    const situation = await repository.createSituation({
      userId: "user-a",
      eventIds: ["event-1"],
      status: "confirmed",
      summary: "I am finishing the main analysis, but a colleague asks me to send a preliminary result this afternoon.",
      uncertainty: [],
      linkedGoalIds: [],
      linkedTaskIds: [],
      riskLevel: "low",
      traceId: "trace-situation",
    });
    let systemPrompt = "";
    const modelBridge = {
      generateJson: async (input: { systemPrompt: string }) => {
        systemPrompt = input.systemPrompt;
        return { options: [draft(1), draft(2), draft(3)] };
      },
    };
    let id = 0;
    const service = new WayfinderOptionGenerationService({
      repository,
      modelBridge,
      idFactory: () => `generated-option-${++id}`,
      clock: () => "2026-08-07T09:00:00.000Z",
    });

    const options = await service.generateForSituation({
      userId: "user-a",
      situation,
      traceId: "trace-options",
    });

    expect(options).toHaveLength(3);
    expect(options.map((option) => option.id)).toEqual([
      "generated-option-1",
      "generated-option-2",
      "generated-option-3",
    ]);
    expect(options.every((option) => option.userId === "user-a" && option.situationId === situation.id)).toBe(true);
    expect(options.every((option) => option.evidenceRefs.includes("event-1"))).toBe(true);
    expect(repository.listOptions("user-a", situation.id)).toEqual(options);
    expect(systemPrompt).toContain('"firstStep"');
    expect(systemPrompt).toContain('"projectedConsequences"');
    expect(systemPrompt).toContain('"long_term"');
    expect(systemPrompt).toContain('"requiresApproval"');
  });

  it("persists three deterministic options when model generation falls back", async () => {
    const situation = await repository.createSituation({
      userId: "user-a",
      eventIds: ["event-1"],
      status: "confirmed",
      summary: "A colleague asks for a preliminary result while the main analysis is unfinished.",
      uncertainty: ["Whether the preliminary result could be misunderstood"],
      linkedGoalIds: [],
      linkedTaskIds: [],
      riskLevel: "high",
      traceId: "trace-situation",
    });
    const modelBridge = {
      generateJson: async ({ fallback }: { fallback: () => { options: ReturnType<typeof draft>[] } }) => fallback(),
    };
    let id = 0;
    const service = new WayfinderOptionGenerationService({
      repository,
      modelBridge,
      idFactory: () => `fallback-option-${++id}`,
      clock: () => "2026-08-07T09:00:00.000Z",
    });

    const options = await service.generateForSituation({
      userId: "user-a",
      situation,
      traceId: "trace-options",
    });

    expect(options).toHaveLength(3);
    expect(new Set(options.map((option) => option.action)).size).toBe(3);
    expect(options.every((option) => option.riskLevel === "high")).toBe(true);
    expect(options.every((option) => option.requiresApproval)).toBe(true);
    expect(repository.listOptions("user-a", situation.id)).toEqual(options);
  });
});
