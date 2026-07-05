import { DataMemoryService } from "./data-memory-service.js";
import { JarvisCommandService } from "./jarvis-command-service.js";
import type { MindAnchorOrchestrator } from "../orchestrator.js";

export class AgentAuthorityExecutionService {
  constructor(
    private readonly jarvisCommands: JarvisCommandService,
    private readonly dataMemory: DataMemoryService,
    private readonly orchestrator?: MindAnchorOrchestrator,
  ) {}

  private async buildReadModelRefresh(userId: string) {
    if (!this.orchestrator) {
      return null;
    }

    return {
      dashboard: await this.orchestrator.getDashboardSummary(userId),
      goalFlow: await this.orchestrator.getGoalFlowOverview(userId),
      inboxOverview: await this.orchestrator.getClientInboxOverview(userId),
    };
  }

  private buildDataRejectedResult(input: {
    action: "accept_candidate" | "reject_candidate" | "block_recall" | "delete_memory";
    candidateId?: string;
    memoryId?: string;
    reason?: "target_not_found";
    message?: string;
  }) {
    return {
      status: "rejected" as const,
      reason: input.reason ?? "target_not_found",
      message:
        input.message ??
        (input.action === "accept_candidate" || input.action === "reject_candidate"
          ? "Memory candidate target was not found."
          : "Memory item target was not found."),
      action: input.action,
      candidateId: input.candidateId ?? null,
      memoryId: input.memoryId ?? null,
      readModelRefresh: null,
    };
  }

  private buildJarvisProposalPayload(input: {
    userId: string;
    authorityAgent: "life-secretary-agent";
    riskLevel: "low" | "medium" | "high";
    targetKind: "task_order" | "recovery_block" | "plan_change";
    rationale: string;
    summary?: string;
    beforeStateSummary?: string;
    afterStateSummary?: string;
    nextStep?: string;
    suggestedMinutes?: number;
  }) {
    if (input.targetKind === "task_order") {
      return {
        userId: input.userId,
        actorAgent: input.authorityAgent,
        riskLevel: input.riskLevel,
        summary: input.summary ?? "Adjust task ordering.",
        beforeStateSummary: input.beforeStateSummary ?? "Current task ordering.",
        afterStateSummary: input.afterStateSummary ?? "Proposed task ordering.",
        rationale: input.rationale,
      };
    }

    if (input.targetKind === "recovery_block") {
      const minutes = input.suggestedMinutes ?? 15;
      const nextStep = input.nextStep ?? "先执行一个最小恢复块。";
      return {
        userId: input.userId,
        actorAgent: input.authorityAgent,
        riskLevel: input.riskLevel,
        summary: input.summary ?? "Insert or adjust a recovery block.",
        beforeStateSummary: input.beforeStateSummary ?? "No recovery block persisted yet.",
        afterStateSummary: input.afterStateSummary ?? `${nextStep} (${minutes}m)`,
        rationale: input.rationale,
      };
    }

    return {
      userId: input.userId,
      actorAgent: input.authorityAgent,
      riskLevel: input.riskLevel,
      summary: input.summary ?? "Jarvis produced a plan change proposal.",
      beforeStateSummary: input.beforeStateSummary ?? "Current plan state",
      afterStateSummary: input.afterStateSummary ?? "Adjusted plan state",
      rationale: input.rationale,
    };
  }

  executeJarvisDecision(input: {
    userId: string;
    goalId?: string;
    riskLevel: "low" | "medium" | "high";
    authorityAgent: "life-secretary-agent";
    targetKind: "task_order" | "recovery_block" | "plan_change";
    executionMode: "apply_direct" | "proposal";
    orderedTaskIds?: string[];
    rationale: string;
    summary?: string;
    beforeStateSummary?: string;
    afterStateSummary?: string;
    sessionId?: string;
    taskId?: string;
    nextStep?: string;
    suggestedMinutes?: number;
    reprioritizedTaskIds?: string[];
    includeReadModelRefresh?: boolean;
  }) {
    const shouldRefreshReadModels = input.includeReadModelRefresh !== false;

    if (
      input.executionMode === "proposal" ||
      input.targetKind === "plan_change" ||
      input.riskLevel !== "low" ||
      (input.targetKind === "task_order" && (!input.goalId || input.goalId.trim().length === 0))
    ) {
      return this.jarvisCommands.submitPlanChangeProposal(this.buildJarvisProposalPayload(input)).then(async (result) => ({
        ...result,
        readModelRefresh: null,
      }));
    }

    if (input.targetKind === "task_order") {
      return this.jarvisCommands.submitTaskOrderingChange({
        userId: input.userId,
        goalId: String(input.goalId),
        actorAgent: input.authorityAgent,
        riskLevel: input.riskLevel,
        orderedTaskIds: input.orderedTaskIds ?? [],
        rationale: input.rationale,
      }).then(async (result) => ({
        ...result,
        readModelRefresh: result.status === "applied" && shouldRefreshReadModels ? await this.buildReadModelRefresh(input.userId) : null,
      }));
    }

    if (input.targetKind === "recovery_block") {
      return this.jarvisCommands.submitRecoveryBlock({
        userId: input.userId,
        actorAgent: input.authorityAgent,
        riskLevel: input.riskLevel,
        sessionId: input.sessionId,
        taskId: input.taskId,
        reason: input.rationale,
        nextStep: input.nextStep ?? "先执行一个最小恢复块。",
        suggestedMinutes: input.suggestedMinutes ?? 15,
        reprioritizedTaskIds: input.reprioritizedTaskIds ?? [],
      }).then(async (result) => ({
        ...result,
        readModelRefresh: result.status === "applied" && shouldRefreshReadModels ? await this.buildReadModelRefresh(input.userId) : null,
      }));
    }

    return this.jarvisCommands.submitPlanChangeProposal(this.buildJarvisProposalPayload(input)).then(async (result) => ({
      ...result,
      readModelRefresh: null,
    }));
  }

  executeDataDecision(input: {
    authorityAgent: "memory-governor-agent";
    action: "accept_candidate" | "reject_candidate" | "block_recall" | "delete_memory";
    executionMode: "govern";
    candidateId?: string;
    memoryId?: string;
    includeReadModelRefresh?: boolean;
  }) {
    const shouldRefreshReadModels = input.includeReadModelRefresh !== false;

    switch (input.action) {
      case "accept_candidate":
        return this.dataMemory.acceptCandidate({
          actorAgent: input.authorityAgent,
          candidateId: String(input.candidateId),
        }).then(async (result) => {
          if (!result) {
            return this.buildDataRejectedResult({
              action: input.action,
              candidateId: input.candidateId,
            });
          }

          return {
            ...result,
            readModelRefresh:
              shouldRefreshReadModels &&
              typeof result === "object" &&
              "userId" in result &&
              typeof result.userId === "string"
                ? await this.buildReadModelRefresh(result.userId)
                : null,
          };
        });
      case "reject_candidate":
        return this.dataMemory.rejectCandidate({
          actorAgent: input.authorityAgent,
          candidateId: String(input.candidateId),
        }).then(async (result) => {
          if (!result) {
            return this.buildDataRejectedResult({
              action: input.action,
              candidateId: input.candidateId,
            });
          }

          return {
            ...result,
            readModelRefresh:
              shouldRefreshReadModels &&
              typeof result === "object" &&
              "userId" in result &&
              typeof result.userId === "string"
                ? await this.buildReadModelRefresh(result.userId)
                : null,
          };
        });
      case "block_recall":
        return this.dataMemory.blockMemoryRecall({
          actorAgent: input.authorityAgent,
          memoryId: String(input.memoryId),
        }).then(async (result) => {
          if (!result) {
            return this.buildDataRejectedResult({
              action: input.action,
              memoryId: input.memoryId,
            });
          }

          return {
            ...result,
            readModelRefresh:
              shouldRefreshReadModels &&
              typeof result === "object" &&
              "userId" in result &&
              typeof result.userId === "string"
                ? await this.buildReadModelRefresh(result.userId)
                : null,
          };
        });
      case "delete_memory":
        return this.dataMemory.deleteMemory({
          actorAgent: input.authorityAgent,
          memoryId: String(input.memoryId),
        }).then(async (result) => {
          if (!result) {
            return this.buildDataRejectedResult({
              action: input.action,
              memoryId: input.memoryId,
            });
          }

          return {
            ...result,
            readModelRefresh:
              shouldRefreshReadModels &&
              typeof result === "object" &&
              "userId" in result &&
              typeof result.userId === "string"
                ? await this.buildReadModelRefresh(result.userId)
                : null,
          };
        });
      default:
        throw new Error("Unsupported Data governance action.");
    }
  }
}
