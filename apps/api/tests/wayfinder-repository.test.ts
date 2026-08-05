import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WayfinderRepository } from "../src/services/wayfinder/wayfinder-repository.js";
import { MindAnchorStore } from "../src/store.js";

const timestamp = "2026-08-05T10:00:00+08:00";

describe("WayfinderRepository", () => {
  let dataDir = "";
  let dataFile = "";
  let store: MindAnchorStore;
  let repository: WayfinderRepository;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-wayfinder-repository-"));
    dataFile = join(dataDir, "mindanchor.json");
    store = new MindAnchorStore(dataFile);
    await store.init();
    repository = new WayfinderRepository(store);
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  const event = (userId: string, clientEventId: string) => ({
    userId,
    sourceDeviceId: "phone-1",
    kind: "manual_note" as const,
    occurredAt: timestamp,
    clientEventId,
    payload: { text: "prepare proposal" },
    confidence: 1,
    consentRef: "consent-phone-notes",
    retentionClass: "summary" as const,
    evidenceRefs: ["note-1"],
    traceId: `trace-${clientEventId}`,
  });

  it("deduplicates the same client event and rejects cross-user reuse", async () => {
    const first = await repository.appendContextEvent(event("user-a", "client-1"));
    const second = await repository.appendContextEvent(event("user-a", "client-1"));
    expect(second.id).toBe(first.id);
    expect(repository.listContextEvents("user-a")).toHaveLength(1);
    await expect(repository.appendContextEvent(event("user-b", "client-1"))).rejects.toThrow("client_event_id_conflict");
  });

  it("persists and replays event -> situation -> option -> decision -> outcome", async () => {
    const contextEvent = await repository.appendContextEvent(event("user-a", "client-2"));
    const situation = await repository.createSituation({
      userId: "user-a",
      eventIds: [contextEvent.id],
      status: "draft",
      summary: "A proposal needs a first step",
      uncertainty: [],
      linkedGoalIds: [],
      linkedTaskIds: [],
      riskLevel: "low",
      traceId: "trace-situation",
    });
    const option = {
      id: "option-1",
      userId: "user-a",
      situationId: situation.id,
      status: "proposed" as const,
      action: "Draft the outline",
      firstStep: "Open a blank document",
      rationale: "Small reversible step",
      immediateBenefits: ["clarity"],
      costs: [],
      projectedConsequences: [{ horizon: "today" as const, text: "Creates momentum", confidence: 0.8 }],
      reversibility: "reversible" as const,
      valueAlignment: [{ valueId: "craft", effect: "supports" as const, explanation: "protects quality" }],
      evidenceRefs: [contextEvent.id],
      consultedSkills: [],
      riskLevel: "low" as const,
      requiresApproval: false,
      createdAt: timestamp,
      traceId: "trace-option",
    };
    await repository.saveOptions("user-a", situation.id, [option]);
    const decision = await repository.recordDecision({
      userId: "user-a",
      situationId: situation.id,
      selectedOptionId: option.id,
      actionStatus: "in_progress",
      traceId: "trace-decision",
    });
    await repository.recordOutcome({
      userId: "user-a",
      decisionId: decision.id,
      status: "observed",
      summary: "The outline was started",
      userRating: 4,
      evidenceRefs: [contextEvent.id],
      traceId: "trace-outcome",
    });

    const reloadedStore = new MindAnchorStore(dataFile);
    await reloadedStore.init();
    const reloaded = new WayfinderRepository(reloadedStore);
    expect(reloaded.listDecisionHistory("user-a")).toHaveLength(1);
    expect(reloaded.listOptions("user-a", situation.id)[0]?.status).toBe("selected");
    expect(reloaded.listOutcomes("user-a", decision.id)[0]?.summary).toBe("The outline was started");
    expect(reloaded.getSituation("user-b", situation.id)).toBeNull();
  });

  it("clears only the requested user's Wayfinder data", async () => {
    await repository.appendContextEvent(event("user-a", "client-a"));
    await repository.appendContextEvent(event("user-b", "client-b"));
    await store.resetUserData("user-a");
    expect(repository.listContextEvents("user-a")).toHaveLength(0);
    expect(repository.listContextEvents("user-b")).toHaveLength(1);
  });
});
