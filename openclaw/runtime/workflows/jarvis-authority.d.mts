export function executeJarvisAuthority(context: unknown): {
  authorityAgent: "life-secretary-agent";
  targetKind: "task_order" | "recovery_block" | "plan_change";
  executionMode: "apply_direct" | "proposal";
  orderedTaskIds?: string[];
  rationale: string;
  summary?: string;
  beforeStateSummary?: string;
  afterStateSummary?: string;
  nextStep?: string;
  suggestedMinutes?: number;
};
