import type { MemoryCandidate, MemoryItem } from "@mindanchor/domain";
import { MindAnchorStore } from "../store.js";

type DataAgentId = "memory-governor-agent";
type SubmitAgentId = "companion-agent" | "analyst-agent" | "balance-agent" | "life-secretary-agent";

type ForbiddenResult = {
  status: "forbidden";
  reason: "data_only" | "source_not_allowed";
  message: string;
};

const DATA_AGENT_ID: DataAgentId = "memory-governor-agent";
const ALLOWED_SUBMIT_AGENTS = new Set<SubmitAgentId>([
  "companion-agent",
  "analyst-agent",
  "balance-agent",
  "life-secretary-agent",
]);

export class DataMemoryService {
  constructor(private readonly store: MindAnchorStore) {}

  private ensureDataAuthority(actorAgent: string): ForbiddenResult | null {
    if (actorAgent === DATA_AGENT_ID) {
      return null;
    }

    return {
      status: "forbidden",
      reason: "data_only",
      message: "Only Data can govern long-term memory.",
    };
  }

  private ensureSubmitAuthority(actorAgent: string): ForbiddenResult | null {
    if (ALLOWED_SUBMIT_AGENTS.has(actorAgent as SubmitAgentId)) {
      return null;
    }

    return {
      status: "forbidden",
      reason: "source_not_allowed",
      message: "Only Troi, Spock, Guinan, or Jarvis can submit long-term memory candidates.",
    };
  }

  async submitCandidate(input: {
    userId: string;
    actorAgent: SubmitAgentId;
    sourceTurnRef: string;
    summary: string;
  }): Promise<MemoryCandidate | ForbiddenResult> {
    const submitError = this.ensureSubmitAuthority(input.actorAgent);
    if (submitError) {
      return submitError;
    }

    return this.store.createMemoryCandidate({
      userId: input.userId,
      memoryId: null,
      status: "candidate",
      sourceAgent: input.actorAgent,
      sourceTurnRef: input.sourceTurnRef,
      summary: input.summary,
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });
  }

  listCandidates(userId = "demo-user") {
    return this.store.listMemoryCandidates(userId);
  }

  listRecallEligibleMemory(userId = "demo-user") {
    return this.store.listRecallEligibleMemory(userId);
  }

  async acceptCandidate(input: { actorAgent: string; candidateId: string }): Promise<MemoryCandidate | ForbiddenResult | null> {
    const authorityError = this.ensureDataAuthority(input.actorAgent);
    if (authorityError) {
      return authorityError;
    }

    return this.store.acceptMemoryCandidate(input.candidateId);
  }

  async rejectCandidate(input: { actorAgent: string; candidateId: string }): Promise<MemoryCandidate | ForbiddenResult | null> {
    const authorityError = this.ensureDataAuthority(input.actorAgent);
    if (authorityError) {
      return authorityError;
    }

    return this.store.rejectMemoryCandidate(input.candidateId);
  }

  async deleteMemory(input: { actorAgent: string; memoryId: string }): Promise<MemoryItem | ForbiddenResult | null> {
    const authorityError = this.ensureDataAuthority(input.actorAgent);
    if (authorityError) {
      return authorityError;
    }

    return this.store.deleteMemory(input.memoryId);
  }

  async blockMemoryRecall(input: { actorAgent: string; memoryId: string }): Promise<MemoryItem | ForbiddenResult | null> {
    const authorityError = this.ensureDataAuthority(input.actorAgent);
    if (authorityError) {
      return authorityError;
    }

    return this.store.blockMemoryRecall(input.memoryId);
  }
}
