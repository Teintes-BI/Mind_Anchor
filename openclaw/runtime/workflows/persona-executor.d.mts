import type { CoachFrontAgentState } from "@mindanchor/domain";
import type { PicardRouteDecision } from "./picard-router.mjs";

export function executePersonaTurn(input: {
  targetAgent: string;
  routeDecision?: Partial<PicardRouteDecision> | null;
  contextSource?: string;
}): CoachFrontAgentState;
