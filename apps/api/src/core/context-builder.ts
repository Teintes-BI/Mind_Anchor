import { contextPacketSchema, type ContextPacket } from "@mindanchor/domain";
import type { CoreRepository } from "./core-types.js";
import { buildContextHash, redactEvent, redactState } from "./context-redaction.js";

const MAX_CONTEXT = 24_000;
const MAX_HISTORY = 6;
const MAX_EVENTS = 12;
const MAX_HISTORY_CONTENT = 1_200;

type BuildInput = {
  profileId: string;
  userId: string;
  conversationId: string;
  userMessage: string;
  dataBoundary: "local_only" | "cloud_allowed";
};

export class ContextBuilder {
  constructor(private readonly repository: CoreRepository, private readonly clock: () => string = () => new Date().toISOString()) {}

  async build(input: BuildInput): Promise<ContextPacket> {
    const compass = await this.repository.getLifeCompass(input.profileId, input.userId);
    const state = await this.repository.getCurrentState(input.profileId, input.userId);
    const permissions = input.dataBoundary === "cloud_allowed"
      ? await this.repository.listPermissions(input.profileId, input.userId)
      : [];
    const stateAllowed = input.dataBoundary === "local_only" || permissions.some((permission) => permission.purpose === "conversation" && permission.scope === "context_state" && permission.status === "granted");
    const events = await this.repository.listEvents(input.profileId, input.userId, { limit: 100 });
    const safeEvents = events
      .filter((event) => input.dataBoundary === "local_only" || event.privacyLevel !== "P3")
      .slice(0, MAX_EVENTS)
      .map((event) => redactEvent(event));
    const allMessages = (await this.repository.listConversationMessages(input.profileId, input.userId, input.conversationId))
      .filter((message) => (message.role === "user" || message.role === "assistant") && message.status === "completed");
    const currentIndex = [...allMessages].reverse().findIndex((message) => message.role === "user" && message.content === input.userMessage);
    if (currentIndex >= 0) allMessages.splice(allMessages.length - 1 - currentIndex, 1);
    const historyRows = allMessages.slice(-MAX_HISTORY);
    const history = historyRows.map((message) => ({ id: message.id, role: message.role as "user" | "assistant", content: message.content.slice(0, MAX_HISTORY_CONTENT), createdAt: message.createdAt }));
    const redactions: string[] = [];
    if (input.dataBoundary === "cloud_allowed") redactions.push("P3_life_compass_omitted");
    if (!stateAllowed && state) redactions.push("state_context_permission_missing");
    if (events.length > MAX_EVENTS) redactions.push(`events_omitted:${events.length - MAX_EVENTS}`);
    if (safeEvents.some((item) => item.redacted)) redactions.push("sensitive_event_fields_omitted");
    if (input.dataBoundary === "cloud_allowed" && events.some((event) => event.privacyLevel === "P3")) redactions.push("P3_events_omitted");

    let currentHistory = history;
    let currentEvents = safeEvents.map((item) => item.event);
    const lifeCompass = input.dataBoundary === "local_only" ? compass.active?.content ?? null : null;
    const currentState = state && stateAllowed ? redactState(state) : null;
    const base = () => ({
      conversationId: input.conversationId,
      profileId: input.profileId,
      userId: input.userId,
      userMessage: input.userMessage,
      dataBoundary: input.dataBoundary,
      lifeCompass,
      currentState,
      recentEvents: currentEvents,
      history: currentHistory,
      redactions,
      sourceEventIds: currentEvents.map((event) => event.id),
    });
    while (JSON.stringify(base()).length > MAX_CONTEXT && currentHistory.length > 0) {
      currentHistory = currentHistory.slice(1);
      if (!redactions.includes("history_omitted_for_budget")) redactions.push("history_omitted_for_budget");
    }
    while (JSON.stringify(base()).length > MAX_CONTEXT && currentEvents.length > 0) {
      currentEvents = currentEvents.slice(0, -1);
      if (!redactions.includes("events_omitted_for_budget")) redactions.push("events_omitted_for_budget");
    }
    const projection = base();
    const characterCount = JSON.stringify(projection).length;
    const contextHash = buildContextHash(projection);
    return contextPacketSchema.parse({
      ...projection,
      characterCount,
      contextHash,
      createdAt: this.clock(),
    });
  }
}
