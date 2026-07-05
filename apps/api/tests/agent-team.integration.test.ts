import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";
import { MindAnchorStore } from "../src/store.js";

describe("agent team store integration", () => {
  let dataDir = "";
  let store: MindAnchorStore;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-agent-team-"));
    store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await store.init();
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("persists and reloads front-agent state per user", async () => {
    await store.saveCoachFrontAgentState({
      userId: "demo-user",
      currentFrontAgent: "director-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: null,
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard is currently handling routing.",
    });

    const reloaded = new MindAnchorStore(join(dataDir, "mindanchor.json"));
    await reloaded.init();

    expect(reloaded.getCoachFrontAgentState("demo-user")).toMatchObject({
      currentFrontAgent: "director-agent",
      routingMode: "auto",
      visibleSummary: "Picard is currently handling routing.",
    });
  });

  it("persists proposals and command logs", async () => {
    const proposal = await store.createPlanChangeProposal({
      userId: "demo-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Move the planning block to tomorrow morning.",
      beforeStateSummary: "Today 16:00-17:00 planning block",
      afterStateSummary: "Tomorrow 09:00-10:00 planning block",
      rationale: "The current day is over capacity.",
    });

    const approved = await store.approvePlanChangeProposal(proposal.id);

    await store.appendPlanChangeCommandLog({
      userId: "demo-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      targetKind: "plan_change",
      proposalId: proposal.id,
      approvedAt: approved?.approvedAt ?? null,
    });

    expect(store.listPlanChangeProposals("demo-user")).toHaveLength(1);
    expect(store.listPlanChangeProposals("demo-user")[0]?.status).toBe("approved");
    expect(store.listPlanChangeCommandLogs("demo-user")).toHaveLength(1);
    expect(store.listPlanChangeCommandLogs("demo-user")[0]).toMatchObject({
      actorAgent: "life-secretary-agent",
      proposalId: proposal.id,
    });
  });

  it("does not let store-level proposal transitions flip once finalized", async () => {
    const approvedProposal = await store.createPlanChangeProposal({
      userId: "demo-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Move the planning block to tomorrow morning.",
      beforeStateSummary: "Today 16:00-17:00 planning block",
      afterStateSummary: "Tomorrow 09:00-10:00 planning block",
      rationale: "The current day is over capacity.",
    });

    const firstApproval = await store.approvePlanChangeProposal(approvedProposal.id);
    const rejectedAfterApproval = await store.rejectPlanChangeProposal(approvedProposal.id);

    expect(firstApproval?.status).toBe("approved");
    expect(rejectedAfterApproval).toBeNull();
    expect(store.findPlanChangeProposalById(approvedProposal.id)?.status).toBe("approved");

    const rejectedProposal = await store.createPlanChangeProposal({
      userId: "demo-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Pause the planning block.",
      beforeStateSummary: "Today 16:00-17:00 planning block",
      afterStateSummary: "Next Monday 09:00-10:00 planning block",
      rationale: "Need a safer slot.",
    });

    const firstReject = await store.rejectPlanChangeProposal(rejectedProposal.id);
    const approvedAfterReject = await store.approvePlanChangeProposal(rejectedProposal.id);

    expect(firstReject?.status).toBe("rejected");
    expect(approvedAfterReject).toBeNull();
    expect(store.findPlanChangeProposalById(rejectedProposal.id)?.status).toBe("rejected");
  });

  it("persists Data candidates, items, and recall-eligible reads", async () => {
    const candidate = await store.createMemoryCandidate({
      userId: "demo-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "companion-agent",
      sourceTurnRef: "turn-1",
      summary: "User prefers short, practical recovery steps.",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });

    const accepted = await store.acceptMemoryCandidate(candidate.candidateId);
    expect(accepted?.status).toBe("accepted");

    const recallEligible = store.listRecallEligibleMemory("demo-user");
    expect(recallEligible).toHaveLength(1);
    expect(recallEligible[0]).toMatchObject({
      sourceCandidateId: candidate.candidateId,
      sourceAgent: "companion-agent",
    });

    const blocked = await store.blockMemoryRecall(recallEligible[0]!.memoryId);
    expect(blocked?.status).toBe("recall_blocked");
    expect(store.listRecallEligibleMemory("demo-user")).toHaveLength(0);

    const candidate2 = await store.createMemoryCandidate({
      userId: "demo-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "balance-agent",
      sourceTurnRef: "turn-2",
      summary: "Walking before analysis helps the user stabilize.",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });

    const accepted2 = await store.acceptMemoryCandidate(candidate2.candidateId);
    const deleted = await store.deleteMemory(accepted2!.memoryId!);

    expect(deleted?.status).toBe("deleted");
    expect(store.listRecallEligibleMemory("demo-user")).toHaveLength(0);

    const candidate3 = await store.createMemoryCandidate({
      userId: "demo-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "analyst-agent",
      sourceTurnRef: "turn-3",
      summary: "The user prefers explicit tradeoff language.",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });

    const rejected = await store.rejectMemoryCandidate(candidate3.candidateId);
    expect(rejected?.status).toBe("rejected");
    expect(store.listRecallEligibleMemory("demo-user")).toHaveLength(0);
  });
});

describe("agent team read models", () => {
  let dataDir = "";
  let app: Awaited<ReturnType<typeof buildApp>>;
  let store: MindAnchorStore;
  let env: AppEnv;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-agent-team-api-"));
    env = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
      agentMode: "stub",
      openClawBaseUrl: undefined,
      supabaseUrl: undefined,
      supabaseJwksUrl: undefined,
      supabaseJwtIssuer: undefined,
      authDevBypassEnabled: true,
      feishuBotWebhookUrl: undefined,
      telegramBotToken: undefined,
      telegramChatId: undefined,
      defaultModelConfig: {
        baseUrl: undefined,
        apiKey: undefined,
        model: "gpt-5.4",
        wireApi: "responses",
        reasoningEffort: "xhigh",
        disableResponseStorage: true,
      },
      agentModelConfigs: Object.fromEntries(
        OPENCLAW_AGENT_NAMES.map((agentName) => [
          agentName,
          {
            baseUrl: undefined,
            apiKey: undefined,
            model: "gpt-5.4",
            wireApi: "responses",
            reasoningEffort: "xhigh",
            disableResponseStorage: true,
          },
        ]),
      ),
    };
    store = new MindAnchorStore(env.dataFile);
    await store.init();
    app = await buildApp(env);
  });

  afterEach(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("exposes front-agent state in dashboard and bootstrap summaries", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/client/bootstrap",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().dashboard.coachFrontAgent.currentFrontAgent).toBe("director-agent");
    expect(typeof response.json().dashboard.coachFrontAgent.visibleSummary).toBe("string");
    expect(response.json().dashboard.coachFrontAgent.visibleSummary.length).toBeGreaterThan(0);
  });

  it("persists manual override and surfaces handoff reasons", async () => {
    const manualOverride = await app.inject({
      method: "POST",
      url: "/coach/front-agent",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
      payload: {
        currentFrontAgent: "life-secretary-agent",
        routingMode: "manual",
        manualOverride: true,
        consultedAgent: null,
        handoffReason: "plan_write_requires_jarvis",
        overrideSourceAgent: "analyst-agent",
        visibleSummary: "Jarvis must handle the requested plan write.",
      },
    });

    expect(manualOverride.statusCode).toBe(200);
    expect(manualOverride.json().manualOverride).toBe(true);

    const summary = await app.inject({
      method: "GET",
      url: "/dashboard/summary",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(summary.statusCode).toBe(200);
    expect(summary.json().coachFrontAgent.manualOverride).toBe(true);
    expect(summary.json().coachFrontAgent.handoffReason).toBe("plan_write_requires_jarvis");
    expect(summary.json().coachFrontAgent.overrideSourceAgent).toBe("analyst-agent");
    expect(summary.json().coachFrontAgent.currentFrontAgent).toBe("life-secretary-agent");
  });

  it("returns coach proposals for the authenticated user", async () => {
    await store.createPlanChangeProposal({
      userId: "coach-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Move tomorrow's planning block.",
      beforeStateSummary: "Tomorrow 16:00-17:00 planning block",
      afterStateSummary: "Next Tuesday 09:00-10:00 planning block",
      rationale: "Current load is unsafe.",
    });
    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/coach/proposals",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
    expect(response.json().length).toBe(1);
    expect(response.json()[0]?.actorAgent).toBe("life-secretary-agent");
    expect(response.json()[0]?.status).toBe("proposal");
  });

  it("returns coach memory candidates for the authenticated user", async () => {
    await store.createMemoryCandidate({
      userId: "coach-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "companion-agent",
      sourceTurnRef: "turn-1",
      summary: "User prefers short recovery steps.",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });
    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/coach/memory",
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
    expect(response.json().length).toBe(1);
    expect(response.json()[0]?.sourceAgent).toBe("companion-agent");
    expect(response.json()[0]?.status).toBe("candidate");
  });

  it("approves and rejects coach proposals through action routes", async () => {
    const proposal = await store.createPlanChangeProposal({
      userId: "coach-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Move tomorrow's planning block.",
      beforeStateSummary: "Tomorrow 16:00-17:00 planning block",
      afterStateSummary: "Next Tuesday 09:00-10:00 planning block",
      rationale: "Current load is unsafe.",
    });
    await app.close();
    app = await buildApp(env);

    const approved = await app.inject({
      method: "POST",
      url: `/coach/proposals/${proposal.id}/approve`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(approved.statusCode).toBe(200);
    expect(approved.json().id).toBe(proposal.id);
    expect(approved.json().status).toBe("approved");

    const rejected = await app.inject({
      method: "POST",
      url: `/coach/proposals/${proposal.id}/reject`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(rejected.statusCode).toBe(409);
    expect(rejected.json()).toEqual(
      expect.objectContaining({
        message: "Proposal already finalized.",
        reason: "proposal_already_final",
        proposal: expect.objectContaining({
          id: proposal.id,
          status: "approved",
        }),
      }),
    );
  });

  it("blocks recall and deletes memory through action routes", async () => {
    const candidate = await store.createMemoryCandidate({
      userId: "coach-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "companion-agent",
      sourceTurnRef: "turn-1",
      summary: "User prefers short recovery steps.",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });
    const accepted = await store.acceptMemoryCandidate(candidate.candidateId);
    await app.close();
    app = await buildApp(env);

    const blocked = await app.inject({
      method: "POST",
      url: `/coach/memory/${accepted!.memoryId}/recall-block`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(blocked.statusCode).toBe(200);
    expect(blocked.json().memoryId).toBe(accepted!.memoryId);
    expect(blocked.json().status).toBe("recall_blocked");

    const deleted = await app.inject({
      method: "POST",
      url: `/coach/memory/${accepted!.memoryId}/delete`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(deleted.statusCode).toBe(200);
    expect(deleted.json().memoryId).toBe(accepted!.memoryId);
    expect(deleted.json().status).toBe("deleted");
  });

  it("does not allow another user to mutate Jarvis proposals", async () => {
    const proposal = await store.createPlanChangeProposal({
      userId: "other-user",
      actorType: "agent",
      actorAgent: "life-secretary-agent",
      riskLevel: "high",
      status: "proposal",
      summary: "Move another user's planning block.",
      beforeStateSummary: "Other user's planning block",
      afterStateSummary: "Rescheduled planning block",
      rationale: "Current load is unsafe.",
    });
    await app.close();
    app = await buildApp(env);

    const response = await app.inject({
      method: "POST",
      url: `/coach/proposals/${proposal.id}/approve`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(response.statusCode).toBe(404);
    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listPlanChangeProposals("other-user")[0]?.status).toBe("proposal");
    expect(reloaded.listPlanChangeCommandLogs("other-user")).toHaveLength(0);
  });

  it("does not allow another user to mutate Data memory", async () => {
    const candidate = await store.createMemoryCandidate({
      userId: "other-user",
      memoryId: null,
      status: "candidate",
      sourceAgent: "companion-agent",
      sourceTurnRef: "turn-1",
      summary: "Other user's private preference.",
      effectiveAt: null,
      recallBlockedAt: null,
      deletedAt: null,
    });
    const accepted = await store.acceptMemoryCandidate(candidate.candidateId);
    await app.close();
    app = await buildApp(env);

    const blocked = await app.inject({
      method: "POST",
      url: `/coach/memory/${accepted!.memoryId}/recall-block`,
      headers: {
        Authorization: "Bearer dev:coach-user:coach@example.com",
      },
    });

    expect(blocked.statusCode).toBe(404);
    const reloaded = new MindAnchorStore(env.dataFile);
    await reloaded.init();
    expect(reloaded.listRecallEligibleMemory("other-user")).toHaveLength(1);
    expect(reloaded.listMemoryCandidates("other-user")[0]?.status).toBe("accepted");
  });
});
