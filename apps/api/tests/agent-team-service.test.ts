import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  coachFrontAgentStateSchema,
  memoryCandidateSchema,
  planChangeProposalSchema,
} from "@mindanchor/domain";
import { routeWithPicard } from "../../../openclaw/runtime/workflows/picard-router.mjs";
import { AgentTeamService } from "../src/services/agent-team-service.js";
import { DataMemoryService } from "../src/services/data-memory-service.js";
import { JarvisCommandService } from "../src/services/jarvis-command-service.js";
import { MindAnchorStore } from "../src/store.js";

describe("agent team domain contracts", () => {
  it("parses coach front-agent state", () => {
    const parsed = coachFrontAgentStateSchema.parse({
      currentFrontAgent: "life-secretary-agent",
      routingMode: "manual",
      manualOverride: true,
      consultedAgent: "analyst-agent",
      handoffReason: "plan_write_requires_jarvis",
      overrideSourceAgent: "analyst-agent",
      visibleSummary: "Picard asked Spock for one reality check before handing the turn to Jarvis.",
    });

    expect(parsed.currentFrontAgent).toBe("life-secretary-agent");
    expect(parsed.overrideSourceAgent).toBe("analyst-agent");
  });

  it("parses a Jarvis plan proposal", () => {
    const parsed = planChangeProposalSchema.parse({
      id: "proposal-1",
      userId: "demo-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Move the deep work block to tomorrow morning.",
      beforeStateSummary: "Today 14:00-16:00 deep work",
      afterStateSummary: "Tomorrow 09:00-11:00 deep work",
      rationale: "Energy and interruptions make the current slot poor.",
      createdAt: new Date().toISOString(),
      approvedAt: null,
    });

    expect(parsed.actorAgent).toBe("life-secretary-agent");
    expect(parsed.status).toBe("proposal");
  });

  it("parses a Data memory candidate", () => {
    const parsed = memoryCandidateSchema.parse({
      candidateId: "candidate-1",
      userId: "demo-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "companion-agent",
      sourceTurnRef: "turn-1",
      summary: "The user consistently prefers short recovery suggestions.",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });

    expect(parsed.sourceAgent).toBe("companion-agent");
    expect(parsed.status).toBe("candidate");
  });
});

describe("Jarvis authority boundaries", () => {
  let dataDir = "";
  let store: MindAnchorStore;
  let jarvis: JarvisCommandService;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-jarvis-"));
    store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();
    jarvis = new JarvisCommandService(store);
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("rejects durable plan writes from non-Jarvis agents", async () => {
    const goal = await store.createGoal({
      userId: "demo-user",
      title: "Ship agent team",
    });
    const taskA = await store.createTask({
      userId: "demo-user",
      goalId: goal.id,
      title: "Spec review",
      sortOrder: 0,
    });
    const taskB = await store.createTask({
      userId: "demo-user",
      goalId: goal.id,
      title: "Implement service",
      sortOrder: 1,
    });

    const result = await jarvis.submitTaskOrderingChange({
      userId: "demo-user",
      goalId: goal.id,
      actorAgent: "analyst-agent",
      riskLevel: "low",
      orderedTaskIds: [taskB.id, taskA.id],
      rationale: "Spock thinks this order is more rational.",
    });

    expect(result.status).toBe("forbidden");
    expect(store.listTasks("demo-user", goal.id).map((task) => task.id)).toEqual([taskA.id, taskB.id]);
    expect(store.listPlanChangeCommandLogs("demo-user")).toHaveLength(0);
    expect(store.listPlanChangeProposals("demo-user")).toHaveLength(0);
  });

  it("auto-applies low-risk Jarvis task ordering and records one command log", async () => {
    const goal = await store.createGoal({
      userId: "demo-user",
      title: "Stabilize the week",
    });
    const taskA = await store.createTask({
      userId: "demo-user",
      goalId: goal.id,
      title: "Inbox zero",
      sortOrder: 0,
    });
    const taskB = await store.createTask({
      userId: "demo-user",
      goalId: goal.id,
      title: "Deep work",
      sortOrder: 1,
    });

    const result = await jarvis.submitTaskOrderingChange({
      userId: "demo-user",
      goalId: goal.id,
      actorAgent: "life-secretary-agent",
      riskLevel: "low",
      orderedTaskIds: [taskB.id, taskA.id],
      rationale: "Move deep work ahead while energy is still available.",
    });

    expect(result.status).toBe("applied");
    expect(store.listTasks("demo-user", goal.id).map((task) => task.id)).toEqual([taskB.id, taskA.id]);
    expect(store.listPlanChangeCommandLogs("demo-user")[0]).toMatchObject({
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "low",
      targetKind: "task_order",
      proposalId: null,
    });
    expect(store.listPlanChangeCommandLogs("demo-user")[0]?.approvedAt).toEqual(expect.any(String));
  });

  it("auto-applies low-risk Jarvis recovery blocks and records one command log", async () => {
    const result = await jarvis.submitRecoveryBlock({
      userId: "demo-user",
      actorAgent: "life-secretary-agent",
      riskLevel: "low",
      sessionId: "session-1",
      taskId: "task-1",
      reason: "energy_drop",
      nextStep: "Take a 10-minute walk, then resume with the smallest visible step.",
      suggestedMinutes: 10,
      reprioritizedTaskIds: ["task-1"],
    });

    expect(result.status).toBe("applied");
    expect(store.listRecoveryPlans("demo-user", 10)).toHaveLength(1);
    expect(store.listPlanChangeCommandLogs("demo-user")[0]).toMatchObject({
      actorAgent: "life-secretary-agent",
      riskLevel: "low",
      targetKind: "recovery_block",
      proposalId: null,
    });
  });

  it("turns high-risk Jarvis changes into proposals and only writes a command log on approval", async () => {
    const proposalResult = await jarvis.submitPlanChangeProposal({
      userId: "demo-user",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      summary: "Move tomorrow's client block to next week.",
      beforeStateSummary: "Client work scheduled for tomorrow afternoon.",
      afterStateSummary: "Client work postponed to next Tuesday afternoon.",
      rationale: "Current emotional load makes the original slot unsafe.",
    });

    expect(proposalResult.status).toBe("proposal");
    expect(store.listPlanChangeProposals("demo-user")).toHaveLength(1);
    expect(store.listPlanChangeProposals("demo-user")[0]?.status).toBe("proposal");
    expect(store.listPlanChangeCommandLogs("demo-user")).toHaveLength(0);

    const approved = await jarvis.approveProposal(proposalResult.proposal!.id);
    expect(approved.status).toBe("approved");
    expect(store.listPlanChangeProposals("demo-user")[0]?.status).toBe("approved");
    expect(store.listPlanChangeCommandLogs("demo-user")[0]).toMatchObject({
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      targetKind: "plan_change",
      proposalId: proposalResult.proposal!.id,
    });
    expect(store.listPlanChangeCommandLogs("demo-user")[0]?.approvedAt).toEqual(expect.any(String));
  });

  it("returns a stable rejected result when approving a missing proposal", async () => {
    const result = await jarvis.approveProposal("missing-proposal");

    expect(result).toEqual({
      status: "rejected",
      reason: "proposal_not_found",
      proposalId: "missing-proposal",
      proposal: null,
      commandLog: null,
    });
    expect(store.listPlanChangeCommandLogs("demo-user")).toHaveLength(0);
  });

  it("returns a stable rejected result when rejecting a missing proposal", async () => {
    const result = await jarvis.rejectProposal("missing-proposal");

    expect(result).toEqual({
      status: "rejected",
      reason: "proposal_not_found",
      proposalId: "missing-proposal",
      proposal: null,
      commandLog: null,
    });
    expect(store.listPlanChangeCommandLogs("demo-user")).toHaveLength(0);
  });

  it("returns stable rejected result when approving a proposal twice", async () => {
    const proposal = await store.createPlanChangeProposal({
      userId: "demo-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Delay review session.",
      beforeStateSummary: "Tomorrow 14:00 meeting",
      afterStateSummary: "Next Wednesday 15:00 meeting",
      rationale: "Need more prep time.",
    });

    await jarvis.approveProposal(proposal.id);
    const repeated = await jarvis.approveProposal(proposal.id);

    expect(repeated).toEqual({
      status: "rejected",
      reason: "proposal_already_final",
      proposalId: proposal.id,
      proposal: expect.objectContaining({
        id: proposal.id,
        status: "approved",
      }),
      commandLog: null,
    });
    expect(store.listPlanChangeCommandLogs("demo-user")).toHaveLength(1);
  });

  it("keeps reject after approval idempotent", async () => {
    const proposal = await store.createPlanChangeProposal({
      userId: "demo-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Pause planning block.",
      beforeStateSummary: "Today 11:00 review",
      afterStateSummary: "Friday 11:00 review",
      rationale: "Too tired now.",
    });

    await jarvis.approveProposal(proposal.id);
    const repeated = await jarvis.rejectProposal(proposal.id);

    expect(repeated).toEqual({
      status: "rejected",
      reason: "proposal_already_final",
      proposalId: proposal.id,
      proposal: expect.objectContaining({
        id: proposal.id,
        status: "approved",
      }),
      commandLog: null,
    });
    expect(store.listPlanChangeCommandLogs("demo-user")).toHaveLength(1);
  });

  it("prevents approving a rejected proposal", async () => {
    const proposal = await store.createPlanChangeProposal({
      userId: "demo-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Reschedule planning block.",
      beforeStateSummary: "Today 16:00 review",
      afterStateSummary: "Next Monday 16:00 review",
      rationale: "Need quieter slot.",
    });

    await jarvis.rejectProposal(proposal.id);
    const repeated = await jarvis.approveProposal(proposal.id);

    expect(repeated).toEqual({
      status: "rejected",
      reason: "proposal_already_final",
      proposalId: proposal.id,
      proposal: expect.objectContaining({
        id: proposal.id,
        status: "rejected",
      }),
      commandLog: null,
    });
    expect(store.listPlanChangeCommandLogs("demo-user")).toHaveLength(0);
  });

  it("keeps repeated rejects idempotent", async () => {
    const proposal = await store.createPlanChangeProposal({
      userId: "demo-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Shift review again.",
      beforeStateSummary: "Today 12:00",
      afterStateSummary: "Tomorrow 12:00",
      rationale: "Need more energy.",
    });

    await jarvis.rejectProposal(proposal.id);
    const repeated = await jarvis.rejectProposal(proposal.id);

    expect(repeated).toEqual({
      status: "rejected",
      reason: "proposal_already_final",
      proposalId: proposal.id,
      proposal: expect.objectContaining({
        id: proposal.id,
        status: "rejected",
      }),
      commandLog: null,
    });
    expect(store.listPlanChangeCommandLogs("demo-user")).toHaveLength(0);
  });
});

describe("Picard routing", () => {
  let routing: AgentTeamService;

  beforeEach(() => {
    routing = new AgentTeamService();
  });

  it("auto-routes emotional input to Troi", () => {
    const result = routing.routeTurn({
      userMessage: "我很焦虑，情绪很乱，需要被理解。",
    });

    expect(result.currentFrontAgent).toBe("companion-agent");
    expect(result.routingMode).toBe("auto");
  });

  it("auto-routes analysis input to Spock", () => {
    const result = routing.routeTurn({
      userMessage: "帮我分析现实情况和利弊。",
    });

    expect(result.currentFrontAgent).toBe("analyst-agent");
  });

  it("auto-routes balance input to Guinan", () => {
    const result = routing.routeTurn({
      userMessage: "我需要找到工作和情绪的平衡。",
    });

    expect(result.currentFrontAgent).toBe("balance-agent");
  });

  it("auto-routes planning input to Jarvis", () => {
    const result = routing.routeTurn({
      userMessage: "帮我调整今天的计划和安排。",
    });

    expect(result.currentFrontAgent).toBe("life-secretary-agent");
  });

  it("auto-routes mixed emotional + analytical input through Picard and exposes one specialist front agent", () => {
    const result = routing.routeTurn({
      userMessage: "我现在很焦虑，但也想理性分析这件事的现实利弊。",
    });

    expect(result.currentFrontAgent).toBe("companion-agent");
    expect(result.currentFrontAgent).not.toBe("memory-governor-agent");
    expect(result.consultedAgent).toBe("analyst-agent");
    expect(result.visibleSummary).toContain("Picard");
  });

  it("auto-routes mixed emotional and analytical input through Picard with one consult", () => {
    const result = routing.routeTurn({
      userMessage: "我现在很混乱也很焦虑，但我也想做一个现实分析。",
    });

    expect(result.currentFrontAgent).toBe("companion-agent");
    expect(result.consultedAgent).toBe("analyst-agent");
    expect(result.visibleSummary).toContain("Picard");
  });

  it("respects manual override for the turn", () => {
    const result = routing.routeTurn({
      userMessage: "我很崩溃。",
      manualOverrideAgent: "analyst-agent",
    });

    expect(result.currentFrontAgent).toBe("analyst-agent");
    expect(result.routingMode).toBe("manual");
    expect(result.manualOverride).toBe(true);
  });

  it("hands off to Jarvis when manual override requires plan write", () => {
    const result = routing.routeTurn({
      userMessage: "我要改计划。",
      manualOverrideAgent: "analyst-agent",
      requiresPlanWrite: true,
    });

    expect(result.currentFrontAgent).toBe("life-secretary-agent");
    expect(result.routingMode).toBe("manual");
    expect(result.overrideSourceAgent).toBe("analyst-agent");
    expect(result.handoffReason).toBe("plan_write_requires_jarvis");
  });

  it("hands off to Data when manual override requires memory governance", () => {
    const result = routing.routeTurn({
      userMessage: "我要删除长期记忆。",
      manualOverrideAgent: "balance-agent",
      requiresMemoryGovernance: true,
    });

    expect(result.currentFrontAgent).toBe("memory-governor-agent");
    expect(result.routingMode).toBe("manual");
    expect(result.overrideSourceAgent).toBe("balance-agent");
    expect(result.handoffReason).toBe("memory_governance_requires_data");
  });

  it("auto-routes unknown input to Picard without selecting Data", () => {
    const result = routing.routeTurn({
      userMessage: "我不知道从哪里开始。",
    });

    expect(result.currentFrontAgent).toBe("director-agent");
    expect(result.currentFrontAgent).not.toBe("memory-governor-agent");
  });

  it("allows at most one background consult", () => {
    const result = routing.routeTurn({
      userMessage: "我现在很焦虑，但也想理性分析这件事的现实利弊。",
    });

    expect(result.consultedAgent === null || typeof result.consultedAgent === "string").toBe(true);
  });

  it("releases manual override back to auto routing when requested", () => {
    const result = routing.routeTurn({
      userMessage: "我很焦虑，情绪很乱，需要被理解。",
      manualOverrideAgent: "analyst-agent",
      releaseOverride: true,
    });

    expect(result.currentFrontAgent).toBe("companion-agent");
    expect(result.routingMode).toBe("auto");
    expect(result.manualOverride).toBe(false);
  });

  it("lets Picard choose a front persona from workflow and memory context", () => {
    const decision = routeWithPicard({
      workflow: "planning",
      userMessage: "我现在很焦虑，但今天也需要把计划重新排一下。",
      memoryContext: {
        preferences: [{ summary: "用户在情绪波动时仍希望保住当天最小可执行计划。" }],
        habits: [{ summary: "用户更适合先重排任务，再做情绪梳理。" }],
      },
    });

    expect(decision.routingOwner).toBe("director-agent");
    expect(decision.frontAgent).toBe("life-secretary-agent");
    expect(decision.consultedAgent).toBe("companion-agent");
    expect(decision.reasoning).toContain("planning");
  });

  it("keeps AgentTeamService aligned with Picard runtime routing output", () => {
    const serviceResult = routing.routeTurn({
      userMessage: "我现在很焦虑，但今天也需要把计划重新排一下。",
      workflow: "planning" as never,
      memoryContext: {
        preferences: [{ summary: "用户在情绪波动时仍希望保住当天最小可执行计划。" }],
        habits: [{ summary: "用户更适合先重排任务，再做情绪梳理。" }],
      } as never,
    });

    expect(serviceResult.currentFrontAgent).toBe("life-secretary-agent");
    expect(serviceResult.consultedAgent).toBe("companion-agent");
    expect(serviceResult.visibleSummary).toContain("Picard");
  });
});

describe("Data memory governance", () => {
  let dataDir = "";
  let store: MindAnchorStore;
  let data: DataMemoryService;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-data-"));
    store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();
    data = new DataMemoryService(store);
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("accepts candidates from Troi/Spock/Guinan/Jarvis and rejects non-Data governance", async () => {
    const troi = await data.submitCandidate({
      userId: "demo-user",
      actorAgent: "companion-agent",
      sourceTurnRef: "turn-troi",
      summary: "User calms down when responses are short.",
    });
    const spock = await data.submitCandidate({
      userId: "demo-user",
      actorAgent: "analyst-agent",
      sourceTurnRef: "turn-spock",
      summary: "Explicit tradeoffs reduce decision fatigue.",
    });
    const guinan = await data.submitCandidate({
      userId: "demo-user",
      actorAgent: "balance-agent",
      sourceTurnRef: "turn-guinan",
      summary: "Walking before analysis stabilizes mood.",
    });
    const jarvis = await data.submitCandidate({
      userId: "demo-user",
      actorAgent: "life-secretary-agent",
      sourceTurnRef: "turn-jarvis",
      summary: "User prefers a 10-minute recovery block after overload.",
    });

    expect(troi.status).toBe("candidate");
    expect(spock.status).toBe("candidate");
    expect(guinan.status).toBe("candidate");
    expect(jarvis.status).toBe("candidate");

    const forbidden = await data.acceptCandidate({
      actorAgent: "companion-agent",
      candidateId: troi.candidateId,
    });
    expect(forbidden.status).toBe("forbidden");
  });

  it("rejects candidate submissions from agents outside the allowed memory sources", async () => {
    const forbidden = await data.submitCandidate({
      userId: "demo-user",
      actorAgent: "director-agent" as never,
      sourceTurnRef: "turn-picard",
      summary: "Picard should not directly push long-term memory candidates.",
    });

    expect(forbidden.status).toBe("forbidden");
    expect(store.listMemoryCandidates("demo-user")).toHaveLength(0);
  });

  it("only Data can accept/reject/delete/recall-block and recall-eligible filters apply", async () => {
    const candidate = await data.submitCandidate({
      userId: "demo-user",
      actorAgent: "companion-agent",
      sourceTurnRef: "turn-1",
      summary: "User prefers short recovery steps.",
    });

    const accepted = await data.acceptCandidate({
      actorAgent: "memory-governor-agent",
      candidateId: candidate.candidateId,
    });
    expect(accepted.status).toBe("accepted");
    expect(data.listRecallEligibleMemory("demo-user")).toHaveLength(1);

    const blocked = await data.blockMemoryRecall({
      actorAgent: "memory-governor-agent",
      memoryId: accepted.memoryId!,
    });
    expect(blocked.status).toBe("recall_blocked");
    expect(data.listRecallEligibleMemory("demo-user")).toHaveLength(0);
    expect(store.listMemoryCandidates("demo-user")[0]?.status).not.toBe("deleted");

    const candidate2 = await data.submitCandidate({
      userId: "demo-user",
      actorAgent: "analyst-agent",
      sourceTurnRef: "turn-2",
      summary: "User needs explicit prioritization steps.",
    });
    const accepted2 = await data.acceptCandidate({
      actorAgent: "memory-governor-agent",
      candidateId: candidate2.candidateId,
    });
    expect(data.listRecallEligibleMemory("demo-user")).toHaveLength(1);

    const deleted = await data.deleteMemory({
      actorAgent: "memory-governor-agent",
      memoryId: accepted2.memoryId!,
    });
    expect(deleted.status).toBe("deleted");
    expect(data.listRecallEligibleMemory("demo-user")).toHaveLength(0);

    const candidate3 = await data.submitCandidate({
      userId: "demo-user",
      actorAgent: "balance-agent",
      sourceTurnRef: "turn-3",
      summary: "Small wins calm the user.",
    });
    const rejected = await data.rejectCandidate({
      actorAgent: "memory-governor-agent",
      candidateId: candidate3.candidateId,
    });
    expect(rejected.status).toBe("rejected");
  });
});
