export function executeDataGovernance(context: unknown): {
  authorityAgent: "memory-governor-agent";
  action: "accept_candidate" | "reject_candidate" | "block_recall" | "delete_memory";
  executionMode: "govern";
  candidateId?: string | null;
  memoryId?: string | null;
  rationale: string;
  summary?: string;
};
