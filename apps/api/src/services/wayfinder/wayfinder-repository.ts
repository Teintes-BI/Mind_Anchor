import {
  createContextEventInputSchema,
  decisionOptionSchema,
  decisionRecordSchema,
  type ContextEvent,
  type CreateContextEventInput,
  type DecisionOption,
  type DecisionRecord,
  type Situation,
  type WayfinderOutcome,
  type ConsentGrant,
  type InterventionBudget,
  type ValueProfile,
  consentGrantSchema,
  interventionBudgetSchema,
  valueProfileSchema,
  updateOutcomeInputSchema,
  wayfinderOutcomeSchema,
} from "@mindanchor/domain";
import { createId, now } from "../../lib/utils.js";
import { MindAnchorStore } from "../../store.js";

export class WayfinderRepository {
  constructor(private readonly store: MindAnchorStore) {}

  appendContextEvent(input: CreateContextEventInput): Promise<ContextEvent> {
    return this.store.appendWayfinderContextEvent(createContextEventInputSchema.parse(input));
  }

  listContextEvents(userId: string, limit = 100) {
    return this.store.listWayfinderContextEvents(userId, limit);
  }

  getSituation(userId: string, situationId: string): Situation | null {
    const situation = this.store.getWayfinderSituation(userId, situationId);
    return situation && situation.userId === userId ? situation : null;
  }

  listSituations(userId: string, limit = 100) {
    return this.store.listWayfinderSituations(userId, limit);
  }

  async createSituation(input: Omit<Situation, "id" | "createdAt" | "updatedAt">) {
    return this.store.addWayfinderSituation(input);
  }

  confirmSituation(userId: string, situationId: string, status: Situation["status"]) {
    return this.store.updateWayfinderSituation(userId, situationId, status);
  }

  async saveOptions(userId: string, situationId: string, options: DecisionOption[]) {
    const parsed = options.map((option) => decisionOptionSchema.parse(option));
    return this.store.saveWayfinderOptions(userId, situationId, parsed);
  }

  listOptions(userId: string, situationId: string) {
    return this.store.listWayfinderOptions(userId, situationId);
  }

  async recordDecision(input: Omit<DecisionRecord, "id" | "selectedAt"> & { selectedAt?: string }) {
    const decision = decisionRecordSchema.parse({
      ...input,
      id: createId(),
      selectedAt: input.selectedAt ?? now(),
    });
    return this.store.createWayfinderDecision(decision);
  }

  async recordOutcome(
    input: Omit<WayfinderOutcome, "id" | "observedAt"> & { observedAt?: string },
  ) {
    const outcome = wayfinderOutcomeSchema.parse({
      ...input,
      id: createId(),
      observedAt: input.observedAt ?? now(),
    });
    return this.store.createWayfinderOutcome(outcome);
  }

  listOutcomes(userId: string, decisionId?: string) {
    return this.store.listWayfinderOutcomes(userId, decisionId);
  }

  listConsentGrants(userId: string) {
    return this.store.listWayfinderConsentGrants(userId);
  }

  async saveConsentGrant(grant: ConsentGrant) {
    return this.store.saveWayfinderConsentGrant(consentGrantSchema.parse(grant));
  }

  getInterventionBudget(userId: string, budgetDate: string) {
    return this.store.getWayfinderInterventionBudget(userId, budgetDate);
  }

  async saveInterventionBudget(budget: InterventionBudget) {
    return this.store.saveWayfinderInterventionBudget(interventionBudgetSchema.parse(budget));
  }

  async saveValueProfile(profile: ValueProfile) {
    return this.store.saveWayfinderValueProfile(valueProfileSchema.parse(profile));
  }

  listDecisionHistory(userId: string, limit = 100) {
    return this.store.listWayfinderDecisions(userId, limit);
  }

  listHealthSnapshots(userId: string, limit = 100) {
    return this.store.listHealthSnapshots(userId, limit);
  }

  listHealthCalibrationRecords(userId: string, limit = 100) {
    return this.store.listHealthCalibrationRecords(userId, limit);
  }

  listMemoryCandidates(userId: string, limit = 100) {
    return this.store.listMemoryCandidates(userId, limit);
  }

  listMemoryItems(userId: string, limit = 100) {
    return this.store.listMemoryItems(userId, limit);
  }

  listAuditEvents(userId: string, limit = 100) {
    return this.store.listWayfinderAuditEvents(userId, limit);
  }

  deleteUserData(userId: string) {
    return this.store.resetUserData(userId);
  }

  revokeMemory(userId: string, memoryId: string) {
    return this.store.revokeCoachMemoryItem(userId, memoryId);
  }

  validateOutcomeUpdate(input: unknown) {
    return updateOutcomeInputSchema.parse(input);
  }
}
