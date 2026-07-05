import { describe, expect, it, vi } from "vitest";
import { AgentAuthorityExecutionService } from "../src/services/agent-authority-execution-service.js";

describe("AgentAuthorityExecutionService", () => {
  it("skips read model refresh for Data governance when includeReadModelRefresh is false", async () => {
    const dataMemory = {
      deleteMemory: vi.fn().mockResolvedValue({
        status: "deleted",
        userId: "coach-user",
        memoryId: "memory-1",
      }),
    };
    const orchestrator = {
      getDashboardSummary: vi.fn(),
      getGoalFlowOverview: vi.fn(),
      getClientInboxOverview: vi.fn(),
    };
    const service = new AgentAuthorityExecutionService({} as never, dataMemory as never, orchestrator as never);

    const result = await service.executeDataDecision({
      authorityAgent: "memory-governor-agent",
      action: "delete_memory",
      executionMode: "govern",
      memoryId: "memory-1",
      includeReadModelRefresh: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "deleted",
        readModelRefresh: null,
      }),
    );
    expect(orchestrator.getDashboardSummary).not.toHaveBeenCalled();
    expect(orchestrator.getGoalFlowOverview).not.toHaveBeenCalled();
    expect(orchestrator.getClientInboxOverview).not.toHaveBeenCalled();
  });

  it("skips read model refresh for Jarvis authority when includeReadModelRefresh is false", async () => {
    const jarvisCommands = {
      submitRecoveryBlock: vi.fn().mockResolvedValue({
        status: "applied",
        userId: "coach-user",
      }),
    };
    const orchestrator = {
      getDashboardSummary: vi.fn(),
      getGoalFlowOverview: vi.fn(),
      getClientInboxOverview: vi.fn(),
    };
    const service = new AgentAuthorityExecutionService(jarvisCommands as never, {} as never, orchestrator as never);

    const result = await service.executeJarvisDecision({
      userId: "coach-user",
      riskLevel: "low",
      authorityAgent: "life-secretary-agent",
      targetKind: "recovery_block",
      executionMode: "apply_direct",
      rationale: "先插入恢复块。",
      includeReadModelRefresh: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "applied",
        readModelRefresh: null,
      }),
    );
    expect(orchestrator.getDashboardSummary).not.toHaveBeenCalled();
    expect(orchestrator.getGoalFlowOverview).not.toHaveBeenCalled();
    expect(orchestrator.getClientInboxOverview).not.toHaveBeenCalled();
  });

  it("does not apply a low-risk Jarvis task order when executionMode explicitly requests proposal", async () => {
    const jarvisCommands = {
      submitTaskOrderingChange: vi.fn(),
      submitRecoveryBlock: vi.fn(),
      submitPlanChangeProposal: vi.fn().mockResolvedValue({
        status: "proposal",
        proposal: {
          id: "proposal-1",
          userId: "coach-user",
          actorType: "agent",
          actorAgent: "life-secretary-agent",
          riskLevel: "low",
          status: "proposal",
          summary: "Adjust task ordering.",
          beforeStateSummary: "Before",
          afterStateSummary: "After",
          rationale: "Keep it reviewable.",
          createdAt: new Date().toISOString(),
          approvedAt: null,
        },
        commandLog: null,
      }),
    };
    const orchestrator = {
      getDashboardSummary: vi.fn(),
      getGoalFlowOverview: vi.fn(),
      getClientInboxOverview: vi.fn(),
    };
    const service = new AgentAuthorityExecutionService(jarvisCommands as never, {} as never, orchestrator as never);

    const result = await service.executeJarvisDecision({
      userId: "coach-user",
      goalId: "goal-1",
      riskLevel: "low",
      authorityAgent: "life-secretary-agent",
      targetKind: "task_order",
      executionMode: "proposal",
      orderedTaskIds: ["task-1", "task-2"],
      rationale: "Keep it reviewable.",
      summary: "Adjust task ordering.",
      beforeStateSummary: "Before",
      afterStateSummary: "After",
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "proposal",
        readModelRefresh: null,
      }),
    );
    expect(jarvisCommands.submitPlanChangeProposal).toHaveBeenCalledTimes(1);
    expect(jarvisCommands.submitTaskOrderingChange).not.toHaveBeenCalled();
    expect(jarvisCommands.submitRecoveryBlock).not.toHaveBeenCalled();
  });

  it("returns a stable rejected result when Data governance target is not found", async () => {
    const dataMemory = {
      deleteMemory: vi.fn().mockResolvedValue(null),
    };
    const orchestrator = {
      getDashboardSummary: vi.fn(),
      getGoalFlowOverview: vi.fn(),
      getClientInboxOverview: vi.fn(),
    };
    const service = new AgentAuthorityExecutionService({} as never, dataMemory as never, orchestrator as never);

    const result = await service.executeDataDecision({
      authorityAgent: "memory-governor-agent",
      action: "delete_memory",
      executionMode: "govern",
      memoryId: "missing-memory",
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "rejected",
        reason: "target_not_found",
        readModelRefresh: null,
      }),
    );
    expect(orchestrator.getDashboardSummary).not.toHaveBeenCalled();
    expect(orchestrator.getGoalFlowOverview).not.toHaveBeenCalled();
    expect(orchestrator.getClientInboxOverview).not.toHaveBeenCalled();
  });

  it("downgrades a low-risk Jarvis task ordering request to proposal when goalId is missing", async () => {
    const jarvisCommands = {
      submitTaskOrderingChange: vi.fn(),
      submitRecoveryBlock: vi.fn(),
      submitPlanChangeProposal: vi.fn().mockResolvedValue({
        status: "proposal",
        proposal: {
          id: "proposal-missing-goal",
          userId: "coach-user",
          actorType: "agent",
          actorAgent: "life-secretary-agent",
          riskLevel: "low",
          status: "proposal",
          summary: "Adjust task ordering.",
          beforeStateSummary: "Current task ordering.",
          afterStateSummary: "Proposed task ordering.",
          rationale: "Missing goal target should stay reviewable.",
          createdAt: new Date().toISOString(),
          approvedAt: null,
        },
        commandLog: null,
      }),
    };
    const service = new AgentAuthorityExecutionService(jarvisCommands as never, {} as never);

    const result = await service.executeJarvisDecision({
      userId: "coach-user",
      riskLevel: "low",
      authorityAgent: "life-secretary-agent",
      targetKind: "task_order",
      executionMode: "apply_direct",
      orderedTaskIds: ["task-1", "task-2"],
      rationale: "Missing goal target should stay reviewable.",
    });

    expect(result).toEqual(
      expect.objectContaining({
        status: "proposal",
        readModelRefresh: null,
      }),
    );
    expect(jarvisCommands.submitPlanChangeProposal).toHaveBeenCalledTimes(1);
    expect(jarvisCommands.submitTaskOrderingChange).not.toHaveBeenCalled();
    expect(jarvisCommands.submitRecoveryBlock).not.toHaveBeenCalled();
  });
});
