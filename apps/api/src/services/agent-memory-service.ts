import {
  agentMemoryEntrySchema,
  agentMemoryContextBundleSchema,
  agentTeamPersonaMetadata,
  type AgentMemoryContextBundle,
  type AgentMemoryEntry,
  type MemoryScope,
} from "@mindanchor/domain";
import { MindAnchorStore } from "../store.js";
import {
  classifyHelpfulFeedbackStrengtheningCandidate,
  parseHelpfulFeedbackStrengtheningScope,
} from "./helpful-feedback-strengthening.js";

type AgentId = (typeof agentTeamPersonaMetadata)[keyof typeof agentTeamPersonaMetadata]["agentId"];

export class AgentMemoryScopeError extends Error {
  constructor(
    message: string,
    readonly requestedScopes: MemoryScope[],
    readonly allowedScopes: readonly MemoryScope[],
  ) {
    super(message);
    this.name = "AgentMemoryScopeError";
  }
}

const ACTIVE_COACH_MEMORY_STATUSES = new Set(["active"]);
const DEFAULT_SCOPE_LIMITS = {
  preferences: 3,
  habits: 2,
  constraints: 2,
  recentContext: 1,
} as const;

const toEntry = (input: {
  memoryId: string;
  kind: string;
  summary: string;
  source: string;
  confidence: number;
  updatedAt: string;
  recallAllowed: boolean;
}): AgentMemoryEntry =>
  agentMemoryEntrySchema.parse({
    memoryId: input.memoryId,
    kind: input.kind,
    summary: input.summary,
    source: input.source,
    confidence: input.confidence,
    updatedAt: input.updatedAt,
    recallAllowed: input.recallAllowed,
  });

const agentMetadataById = new Map(
  Object.values(agentTeamPersonaMetadata).map((entry) => [entry.agentId, entry] as const),
);

const compareEntries = (left: AgentMemoryEntry, right: AgentMemoryEntry) => {
  const updatedCompare = right.updatedAt.localeCompare(left.updatedAt);
  if (updatedCompare !== 0) {
    return updatedCompare;
  }
  const confidenceCompare = right.confidence - left.confidence;
  if (confidenceCompare !== 0) {
    return confidenceCompare;
  }
  const summaryCompare = left.summary.localeCompare(right.summary, "zh-Hans-CN");
  if (summaryCompare !== 0) {
    return summaryCompare;
  }
  return left.memoryId.localeCompare(right.memoryId);
};

export class AgentMemoryService {
  constructor(private readonly store: MindAnchorStore) {}

  private buildStrengtheningSummarySet(userId: string, targetScope: "preferences" | "habits") {
    return new Set(
      this.store
        .listPendingMemoryCandidates(userId, 50)
        .filter(
          (candidate) =>
            parseHelpfulFeedbackStrengtheningScope(candidate.sourceTurnRef) === targetScope &&
            classifyHelpfulFeedbackStrengtheningCandidate({
              sourceTurnRef: candidate.sourceTurnRef,
              getSourceMessageCreatedAt: (messageId) => this.store.getCoachMessage(userId, messageId)?.createdAt,
            }) === "eligible",
        )
        .map((candidate) => candidate.summary.trim())
        .filter(Boolean),
    );
  }

  private prioritizeStrengthenedEntries(
    entries: AgentMemoryEntry[],
    strengthenedSummaries: Set<string>,
  ) {
    return [...entries].sort((left, right) => {
      const leftBoosted = strengthenedSummaries.has(left.summary.trim()) ? 1 : 0;
      const rightBoosted = strengthenedSummaries.has(right.summary.trim()) ? 1 : 0;
      if (leftBoosted !== rightBoosted) {
        return rightBoosted - leftBoosted;
      }
      return compareEntries(left, right);
    });
  }

  private resolveAllowedScopes(agentId: AgentId): readonly MemoryScope[] {
    const metadata = agentMetadataById.get(agentId);
    if (!metadata) {
      return [] as const;
    }
    return [...metadata.memoryScopes];
  }

  private normalizeScopes(agentId: AgentId, scopes?: MemoryScope[]) {
    const allowedScopes = this.resolveAllowedScopes(agentId);
    const requestedScopes = [...new Set((scopes?.length ? scopes : [...allowedScopes]) as MemoryScope[])];
    const outOfScope = requestedScopes.filter((scope) => !allowedScopes.includes(scope));

    if (outOfScope.length > 0) {
      throw new AgentMemoryScopeError(
        `Requested scopes are out of scope for ${agentId}: ${outOfScope.join(", ")}`,
        requestedScopes,
        allowedScopes,
      );
    }

    return allowedScopes.filter((scope) => requestedScopes.includes(scope));
  }

  private compactEntries(entries: AgentMemoryEntry[], limit: number, strengthenedSummaries?: Set<string>) {
    const seenSummaries = new Set<string>();
    const compacted: AgentMemoryEntry[] = [];

    for (const entry of [...entries].sort((left, right) => {
      const leftBoosted = strengthenedSummaries?.has(left.summary.trim()) ? 1 : 0;
      const rightBoosted = strengthenedSummaries?.has(right.summary.trim()) ? 1 : 0;
      if (leftBoosted !== rightBoosted) {
        return rightBoosted - leftBoosted;
      }
      return compareEntries(left, right);
    })) {
      const normalizedSummary = entry.summary.trim();
      if (normalizedSummary.length === 0 || seenSummaries.has(normalizedSummary)) {
        continue;
      }
      seenSummaries.add(normalizedSummary);
      compacted.push(entry);
      if (compacted.length >= limit) {
        break;
      }
    }

    return compacted;
  }

  getContext(input: { userId: string; agentId: AgentId; scopes?: MemoryScope[] }): AgentMemoryContextBundle {
    const scopes = this.normalizeScopes(input.agentId, input.scopes);
    const coachMemory = this.store
      .listCoachMemoryItems(input.userId)
      .filter((item) => ACTIVE_COACH_MEMORY_STATUSES.has(item.status));
    const longTermMemory = this.store.listRecallEligibleMemory(input.userId);
    const frontAgentState = this.store.getCoachFrontAgentState(input.userId);
    const strengthenedPreferenceSummaries = this.buildStrengtheningSummarySet(input.userId, "preferences");
    const strengthenedHabitSummaries = this.buildStrengtheningSummarySet(input.userId, "habits");

    const preferences = scopes.includes("preferences")
      ? this.prioritizeStrengthenedEntries(
          coachMemory
          .filter((item) => item.kind === "preference")
          .map((item) =>
            toEntry({
              memoryId: item.id,
              kind: item.kind,
              summary: item.summary,
              source: "coach-memory",
              confidence: item.confidence,
              updatedAt: item.lastUsedAt ?? item.createdAt,
              recallAllowed: item.status === "active",
            }),
          ),
          strengthenedPreferenceSummaries,
        )
      : [];

    const habits = scopes.includes("habits")
      ? this.prioritizeStrengthenedEntries(
          coachMemory
          .filter((item) => item.kind === "habit" || item.kind === "work_style")
          .map((item) =>
            toEntry({
              memoryId: item.id,
              kind: item.kind,
              summary: item.summary,
              source: "coach-memory",
              confidence: item.confidence,
              updatedAt: item.lastUsedAt ?? item.createdAt,
              recallAllowed: item.status === "active",
            }),
          ),
          strengthenedHabitSummaries,
        )
      : [];

    const constraints = scopes.includes("constraints")
      ? longTermMemory.map((item) =>
          toEntry({
            memoryId: item.memoryId,
            kind: "constraint",
            summary: item.summary,
            source: "gateway-memory",
            confidence: 0.8,
            updatedAt: item.effectiveAt,
            recallAllowed: item.status === "active",
          }),
        )
      : [];

    const recentContext = scopes.includes("recentContext") && frontAgentState
      ? [
          toEntry({
            memoryId: `${input.userId}:front-agent`,
            kind: "recent_context",
            summary: frontAgentState.visibleSummary ?? `Current front agent: ${frontAgentState.currentFrontAgent}`,
            source: "front-agent-state",
            confidence: 0.72,
            updatedAt: frontAgentState.updatedAt,
            recallAllowed: true,
          }),
        ]
      : [];

    const compactedPreferences = this.compactEntries(
      preferences,
      DEFAULT_SCOPE_LIMITS.preferences,
      strengthenedPreferenceSummaries,
    );
    const compactedHabits = this.compactEntries(habits, DEFAULT_SCOPE_LIMITS.habits, strengthenedHabitSummaries);
    const compactedConstraints = this.compactEntries(constraints, DEFAULT_SCOPE_LIMITS.constraints);
    const compactedRecentContext = this.compactEntries(recentContext, DEFAULT_SCOPE_LIMITS.recentContext);
    const compactedEntries = [
      ...compactedPreferences,
      ...compactedHabits,
      ...compactedConstraints,
      ...compactedRecentContext,
    ];
    const sourceCounts = compactedEntries.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.source] = (counts[entry.source] ?? 0) + 1;
      return counts;
    }, {});

    return agentMemoryContextBundleSchema.parse({
      userId: input.userId,
      agentId: input.agentId,
      scopes,
      identity: [],
      preferences: compactedPreferences,
      habits: compactedHabits,
      constraints: compactedConstraints,
      recentContext: compactedRecentContext,
      metadata: {
        activeMemoryCount: coachMemory.length + longTermMemory.length + (frontAgentState ? 1 : 0),
        proposalCount: this.store.listMemoryCandidates(input.userId).filter((item) => item.status === "candidate").length,
        retrievedAt: new Date().toISOString(),
        scopeEntryCounts: {
          preferences: compactedPreferences.length,
          habits: compactedHabits.length,
          constraints: compactedConstraints.length,
          recentContext: compactedRecentContext.length,
        },
        sourceCounts,
      },
    });
  }
}
