import type { CoachFrontAgentState } from "@mindanchor/domain";
import { routeWithPicard } from "../../../../openclaw/runtime/workflows/picard-router.mjs";
import { executePersonaTurn } from "../../../../openclaw/runtime/workflows/persona-executor.mjs";

type AgentId =
  | "director-agent"
  | "companion-agent"
  | "analyst-agent"
  | "balance-agent"
  | "life-secretary-agent"
  | "memory-governor-agent";

type RouteInput = {
  userMessage: string;
  workflow?: string;
  memoryContext?: {
    preferences?: Array<{ summary?: string }>;
    habits?: Array<{ summary?: string }>;
    constraints?: Array<{ summary?: string }>;
  };
  manualOverrideAgent?: AgentId;
  releaseOverride?: boolean;
  requiresPlanWrite?: boolean;
  requiresMemoryGovernance?: boolean;
};

export class AgentTeamService {
  routeTurn(input: RouteInput): CoachFrontAgentState {
    const decision = routeWithPicard({
      workflow: input.workflow,
      userMessage: input.userMessage,
      memoryContext: input.memoryContext,
      manualOverrideAgent: input.manualOverrideAgent,
      releaseOverride: input.releaseOverride,
      requiresPlanWrite: input.requiresPlanWrite,
      requiresMemoryGovernance: input.requiresMemoryGovernance,
    });

    return executePersonaTurn({
      targetAgent: decision.routingOwner,
      routeDecision: decision,
      contextSource: input.workflow ?? "conversation",
    });
  }
}
