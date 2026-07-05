import type { AgentTeamAgentId } from "@mindanchor/domain";

export type PicardRouteDecision = {
  routingOwner: AgentTeamAgentId;
  frontAgent: AgentTeamAgentId;
  consultedAgent: AgentTeamAgentId | null;
  routingMode: "auto" | "manual";
  manualOverride: boolean;
  handoffReason: string | null;
  overrideSourceAgent: AgentTeamAgentId | null;
  reasoning: string;
  visibleSummary: string;
};

export function routeWithPicard(input: {
  workflow?: string;
  userMessage?: string;
  memoryContext?: {
    preferences?: Array<{ summary?: string }>;
    habits?: Array<{ summary?: string }>;
    constraints?: Array<{ summary?: string }>;
  };
  contextSource?: string;
  hasEmotionSignal?: boolean;
  hasRecentSignals?: boolean;
  manualOverrideAgent?: AgentTeamAgentId;
  releaseOverride?: boolean;
  requiresPlanWrite?: boolean;
  requiresMemoryGovernance?: boolean;
}): PicardRouteDecision;
