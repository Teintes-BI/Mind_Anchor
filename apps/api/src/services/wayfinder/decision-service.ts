import {
  createDecisionInputSchema,
  type DecisionRecord,
  type WayfinderOutcome,
  updateOutcomeInputSchema,
} from "@mindanchor/domain";
import { WayfinderRepository } from "./wayfinder-repository.js";

export class WayfinderDecisionService {
  constructor(private readonly repository: WayfinderRepository) {}

  async recordDecision(
    userId: string,
    input: Omit<DecisionRecord, "id" | "userId" | "selectedAt"> & { selectedAt?: string; approvalAcknowledged?: boolean },
  ) {
    const parsed = createDecisionInputSchema.parse({ userId, ...input });
    if (parsed.selectedOptionId) {
      const option = this.repository
        .listOptions(userId, parsed.situationId)
        .find((candidate) => candidate.id === parsed.selectedOptionId);
      if (!option) {
        throw new Error("wayfinder_option_not_found");
      }
      if (option.requiresApproval && input.approvalAcknowledged !== true) {
        throw new Error("wayfinder_approval_required");
      }
    }
    return this.repository.recordDecision(parsed);
  }

  async recordOutcome(userId: string, decisionId: string, input: Omit<WayfinderOutcome, "id" | "userId" | "decisionId" | "observedAt"> & { observedAt?: string }) {
    const decision = this.repository.listDecisionHistory(userId).find((candidate) => candidate.id === decisionId);
    if (!decision) {
      throw new Error("wayfinder_decision_not_found");
    }
    return this.repository.recordOutcome({ userId, decisionId, ...updateOutcomeInputSchema.parse(input) });
  }

  listHistory(userId: string, limit = 100) {
    return this.repository.listDecisionHistory(userId, limit).map((decision) => {
      const situation = this.repository.getSituation(userId, decision.situationId);
      const option = decision.selectedOptionId
        ? this.repository.listOptions(userId, decision.situationId).find((candidate) => candidate.id === decision.selectedOptionId) ?? null
        : null;
      return {
        decision,
        outcomes: this.repository.listOutcomes(userId, decision.id),
        situation,
        option,
      };
    });
  }
}
