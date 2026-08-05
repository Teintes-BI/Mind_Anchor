import {
  contextEventSchema,
  situationSchema,
  type CreateContextEventInput,
  type DecisionOption,
  type Situation,
} from "@mindanchor/domain";
import { WayfinderRepository } from "./wayfinder-repository.js";

export class WayfinderSituationService {
  constructor(private readonly repository: WayfinderRepository) {}

  async ingestEvent(input: CreateContextEventInput) {
    const event = contextEventSchema.parse(await this.repository.appendContextEvent(input));
    const existing = this.repository
      .listSituations(input.userId)
      .find((situation) => situation.eventIds.includes(event.id));
    if (existing) {
      return { event, situation: existing, fastStatus: "completed" as const, fullStatus: "pending" as const };
    }

    const payload = event.payload;
    const summary =
      typeof payload.summary === "string"
        ? payload.summary
        : typeof payload.text === "string"
          ? payload.text
          : `${event.kind} detected from ${event.sourceDeviceId}`;
    const situation = await this.repository.createSituation(
      situationSchema.omit({ id: true, createdAt: true, updatedAt: true }).parse({
        userId: input.userId,
        eventIds: [event.id],
        status: "awaiting_confirmation",
        summary,
        uncertainty: typeof payload.uncertainty === "string" ? [payload.uncertainty] : [],
        linkedGoalIds: [],
        linkedTaskIds: [],
        riskLevel:
          payload.riskLevel === "critical" || payload.riskLevel === "high" || payload.riskLevel === "medium"
            ? payload.riskLevel
            : "low",
        traceId: event.traceId,
      }),
    );
    return { event, situation, fastStatus: "completed" as const, fullStatus: "pending" as const };
  }

  get(userId: string, situationId: string) {
    return this.repository.getSituation(userId, situationId);
  }

  list(userId: string, limit = 20) {
    return this.repository.listSituations(userId, limit);
  }

  confirm(userId: string, situationId: string, status: Situation["status"]) {
    return this.repository.confirmSituation(userId, situationId, status);
  }

  saveOptions(userId: string, situationId: string, options: DecisionOption[]) {
    return this.repository.saveOptions(userId, situationId, options);
  }

  listOptions(userId: string, situationId: string) {
    return this.repository.listOptions(userId, situationId);
  }
}
