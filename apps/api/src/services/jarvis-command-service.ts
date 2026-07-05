import { type PlanChangeCommandLog, type PlanChangeProposal, type RecoveryPlan, type Task } from "@mindanchor/domain";
import { createId, now } from "../lib/utils.js";
import { MindAnchorStore } from "../store.js";

type JarvisAgentId = "life-secretary-agent";
type CommandRiskLevel = PlanChangeProposal["riskLevel"];
type ForbiddenResult = {
  status: "forbidden";
  reason: "jarvis_only";
  message: string;
};
type AppliedResult = {
  status: "applied";
  commandLog: PlanChangeCommandLog;
  proposal: null;
};
type ProposalResult = {
  status: "proposal";
  commandLog: null;
  proposal: PlanChangeProposal;
};
type ApprovedResult = {
  status: "approved";
  proposal: PlanChangeProposal;
  commandLog: PlanChangeCommandLog;
};
type RejectedResult = {
  status: "rejected";
  reason: "proposal_not_found" | "proposal_rejected" | "proposal_already_final";
  proposalId: string;
  proposal: PlanChangeProposal | null;
  commandLog: null;
};

const JARVIS_AGENT_ID: JarvisAgentId = "life-secretary-agent";

const describeTaskOrdering = (tasks: Task[]) =>
  tasks
    .map((task, index) => `${index + 1}. ${task.title}`)
    .join(" → ");

export class JarvisCommandService {
  constructor(private readonly store: MindAnchorStore) {}

  private ensureJarvisAuthority(actorAgent: string): ForbiddenResult | null {
    if (actorAgent === JARVIS_AGENT_ID) {
      return null;
    }

    return {
      status: "forbidden",
      reason: "jarvis_only",
      message: "Only Jarvis can execute durable plan writes.",
    };
  }

  private async createProposal(input: Omit<PlanChangeProposal, "id" | "createdAt" | "approvedAt">): Promise<ProposalResult> {
    const proposal = await this.store.createPlanChangeProposal(input);
    return {
      status: "proposal",
      proposal,
      commandLog: null,
    };
  }

  private async appendApprovedCommandLog(input: Omit<PlanChangeCommandLog, "id" | "createdAt">): Promise<AppliedResult> {
    const commandLog = await this.store.appendPlanChangeCommandLog(input);
    return {
      status: "applied",
      commandLog,
      proposal: null,
    };
  }

  private buildRejectedProposalResult(
    proposalId: string,
    proposal: PlanChangeProposal | null,
    reason: RejectedResult["reason"],
  ): RejectedResult {
    return {
      status: "rejected",
      reason,
      proposalId,
      proposal,
      commandLog: null,
    };
  }

  async submitTaskOrderingChange(input: {
    userId: string;
    goalId: string;
    actorAgent: PlanChangeProposal["actorAgent"];
    riskLevel: CommandRiskLevel;
    orderedTaskIds: string[];
    rationale: string;
  }): Promise<ForbiddenResult | AppliedResult | ProposalResult> {
    const authorityError = this.ensureJarvisAuthority(input.actorAgent);
    if (authorityError) {
      return authorityError;
    }

    const currentTasks = this.store.listTasks(input.userId, input.goalId);
    const taskById = new Map(currentTasks.map((task) => [task.id, task]));
    const reordered = [
      ...input.orderedTaskIds.map((taskId) => taskById.get(taskId)).filter((task): task is Task => Boolean(task)),
      ...currentTasks.filter((task) => !input.orderedTaskIds.includes(task.id)),
    ].map((task, index) => ({
      ...task,
      sortOrder: index,
      updatedAt: now(),
    }));

    if (input.riskLevel !== "low") {
      return this.createProposal({
        userId: input.userId,
        actorType: "agent",
        actorAgent: input.actorAgent,
        riskLevel: input.riskLevel,
        status: "proposal",
        summary: "Adjust task ordering.",
        beforeStateSummary: describeTaskOrdering(currentTasks),
        afterStateSummary: describeTaskOrdering(reordered),
        rationale: input.rationale,
      });
    }

    await this.store.updateTasks(reordered);
    return this.appendApprovedCommandLog({
      userId: input.userId,
      actorType: "agent",
      actorAgent: input.actorAgent,
      riskLevel: input.riskLevel,
      targetKind: "task_order",
      proposalId: null,
      approvedAt: now(),
    });
  }

  async submitRecoveryBlock(input: {
    userId: string;
    actorAgent: PlanChangeProposal["actorAgent"];
    riskLevel: CommandRiskLevel;
    sessionId?: string;
    taskId?: string;
    reason: string;
    nextStep: string;
    suggestedMinutes: number;
    reprioritizedTaskIds: string[];
  }): Promise<ForbiddenResult | AppliedResult | ProposalResult> {
    const authorityError = this.ensureJarvisAuthority(input.actorAgent);
    if (authorityError) {
      return authorityError;
    }

    const afterSummary = `${input.nextStep} (${input.suggestedMinutes}m)`;
    if (input.riskLevel !== "low") {
      return this.createProposal({
        userId: input.userId,
        actorType: "agent",
        actorAgent: input.actorAgent,
        riskLevel: input.riskLevel,
        status: "proposal",
        summary: "Insert or adjust a recovery block.",
        beforeStateSummary: "No recovery block persisted yet.",
        afterStateSummary: afterSummary,
        rationale: input.reason,
      });
    }

    const recoveryPlan: RecoveryPlan = {
      id: createId(),
      userId: input.userId,
      sessionId: input.sessionId,
      taskId: input.taskId,
      reason: input.reason,
      nextStep: input.nextStep,
      suggestedMinutes: input.suggestedMinutes,
      reprioritizedTaskIds: input.reprioritizedTaskIds,
      createdAt: now(),
    };
    await this.store.addRecoveryPlan(recoveryPlan);

    return this.appendApprovedCommandLog({
      userId: input.userId,
      actorType: "agent",
      actorAgent: input.actorAgent,
      riskLevel: input.riskLevel,
      targetKind: "recovery_block",
      proposalId: null,
      approvedAt: now(),
    });
  }

  async submitPlanChangeProposal(input: {
    userId: string;
    actorAgent: PlanChangeProposal["actorAgent"];
    riskLevel: CommandRiskLevel;
    summary: string;
    beforeStateSummary: string;
    afterStateSummary: string;
    rationale: string;
  }): Promise<ForbiddenResult | ProposalResult> {
    const authorityError = this.ensureJarvisAuthority(input.actorAgent);
    if (authorityError) {
      return authorityError;
    }

    return this.createProposal({
      userId: input.userId,
      actorType: "agent",
      actorAgent: input.actorAgent,
      riskLevel: input.riskLevel,
      status: "proposal",
      summary: input.summary,
      beforeStateSummary: input.beforeStateSummary,
      afterStateSummary: input.afterStateSummary,
      rationale: input.rationale,
    });
  }

  async approveProposal(proposalId: string): Promise<ApprovedResult | RejectedResult> {
    const existingProposal = this.store.findPlanChangeProposalById(proposalId);
    if (!existingProposal) {
      return this.buildRejectedProposalResult(proposalId, null, "proposal_not_found");
    }

    if (existingProposal.status !== "proposal") {
      return this.buildRejectedProposalResult(proposalId, existingProposal, "proposal_already_final");
    }

    const proposal = await this.store.approvePlanChangeProposal(proposalId);
    if (!proposal || !proposal.approvedAt) {
      return this.buildRejectedProposalResult(proposalId, proposal ?? null, "proposal_not_found");
    }

    const commandLog = await this.store.appendPlanChangeCommandLog({
      userId: proposal.userId,
      actorType: proposal.actorType,
      actorAgent: proposal.actorAgent,
      riskLevel: proposal.riskLevel,
      targetKind: "plan_change",
      proposalId: proposal.id,
      approvedAt: proposal.approvedAt,
    });

    return {
      status: "approved",
      proposal,
      commandLog,
    };
  }

  async rejectProposal(proposalId: string): Promise<RejectedResult> {
    const existingProposal = this.store.findPlanChangeProposalById(proposalId);
    if (!existingProposal) {
      return this.buildRejectedProposalResult(proposalId, null, "proposal_not_found");
    }

    if (existingProposal.status !== "proposal") {
      return this.buildRejectedProposalResult(proposalId, existingProposal, "proposal_already_final");
    }

    const proposal = await this.store.rejectPlanChangeProposal(proposalId);
    if (!proposal) {
      return this.buildRejectedProposalResult(proposalId, existingProposal, "proposal_not_found");
    }

    return {
      status: "rejected",
      reason: "proposal_rejected",
      proposalId,
      proposal,
      commandLog: null,
    };
  }
}
