import {
  agentMemoryProposalSchema,
  agentTeamPersonaMetadata,
  type AgentMemoryProposal,
  type MemoryScope,
} from "@mindanchor/domain";
import { MindAnchorStore } from "../store.js";
import { AgentMemoryScopeError } from "./agent-memory-service.js";

type AgentId = (typeof agentTeamPersonaMetadata)[keyof typeof agentTeamPersonaMetadata]["agentId"];

const agentMetadataById = new Map(
  Object.values(agentTeamPersonaMetadata).map((entry) => [entry.agentId, entry] as const),
);

export class AgentMemoryProposalService {
  constructor(private readonly store: MindAnchorStore) {}

  async submit(input: {
    userId: string;
    sourceAgent: AgentId;
    targetScope: MemoryScope;
    kind: string;
    summary: string;
    rationale: string;
    sourceTurnRef?: string;
    confidence?: number;
  }): Promise<AgentMemoryProposal> {
    const metadata = agentMetadataById.get(input.sourceAgent);
    const allowedScopes: readonly MemoryScope[] = metadata ? [...metadata.memoryScopes] : [];
    if (!allowedScopes.includes(input.targetScope)) {
      throw new AgentMemoryScopeError(
        `Requested scope is out of scope for ${input.sourceAgent}: ${input.targetScope}`,
        [input.targetScope],
        allowedScopes,
      );
    }

    return this.store.createAgentMemoryProposal(input);
  }
}
