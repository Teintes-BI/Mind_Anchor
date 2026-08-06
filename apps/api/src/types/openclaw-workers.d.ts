declare module "*wayfinder-option-worker.mjs" {
  import type { DecisionOption, Situation } from "@mindanchor/domain";

  export function architectWayfinderOptions(input: {
    userId: string;
    situation: Situation;
    evidenceRefs: string[];
    traceId: string;
    createdAt: string;
  }): { options: DecisionOption[] };
}
