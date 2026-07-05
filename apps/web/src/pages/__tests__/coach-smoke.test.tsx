import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CoachPage } from "../CoachPage";

vi.mock("../../api", () => ({
  api: {
    getCoachFrontAgent: vi.fn(async () => ({
      currentFrontAgent: "companion-agent",
      routingMode: "auto",
      manualOverride: false,
      consultedAgent: "analyst-agent",
      handoffReason: null,
      overrideSourceAgent: null,
      visibleSummary: "Picard routed this turn to companion-agent with analyst-agent consult.",
    })),
    getCoachSessions: vi.fn(async () => ({
      sessions: [
        {
          id: "session-1",
          userId: "demo-user",
          title: "Coach Session",
          status: "active",
          createdAt: "2026-03-28T00:00:00.000Z",
          updatedAt: "2026-03-28T00:10:00.000Z",
          lastMessageAt: "2026-03-28T00:10:00.000Z",
        },
        {
          id: "session-2",
          userId: "demo-user",
          title: "Second Session",
          status: "active",
          createdAt: "2026-03-28T00:30:00.000Z",
          updatedAt: "2026-03-28T00:40:00.000Z",
          lastMessageAt: "2026-03-28T00:40:00.000Z",
        },
      ],
    })),
    getCoachSession: vi.fn(async (sessionId: string) => {
      if (sessionId === "session-2") {
        return {
          session: {
            id: "session-2",
            userId: "demo-user",
            title: "Second Session",
            status: "active",
            createdAt: "2026-03-28T00:30:00.000Z",
            updatedAt: "2026-03-28T00:40:00.000Z",
            lastMessageAt: "2026-03-28T00:40:00.000Z",
          },
          messages: [
            {
              id: "assistant-failed",
              userId: "demo-user",
              sessionId: "session-2",
              role: "assistant",
              status: "failed",
              userText: null,
              fastResponse: "上一轮没有成功完成。",
              fullResponse: null,
              usedMemoryIds: ["memory-2"],
              usedMemoryEntries: [
                {
                  memoryId: "memory-2",
                  summary: "用户这周更适合短反馈闭环。",
                  kind: "preference",
                  source: "coach-memory",
                },
              ],
              conversationPath: {
                frontAgent: "companion-agent",
                consultedAgent: null,
                authorityAgent: null,
                authorityTarget: null,
                authorityExecutionStatus: null,
                revokedMemoryCount: 0,
                authoritySummary: null,
                routeSummary: "Picard routed this turn to companion-agent.",
                routeMetrics: [],
                primaryRoute: "provider-fallback",
                usedOpenClaw: true,
                hadFallback: true,
                degraded: true,
                degradedReason: "cluster_fallback",
              },
              traceId: "trace-failed",
              errorCode: "coach_full_generation_failed",
              createdAt: "2026-03-28T00:39:00.000Z",
              updatedAt: "2026-03-28T00:39:05.000Z",
            },
            {
              id: "assistant-9",
              userId: "demo-user",
              sessionId: "session-2",
              role: "assistant",
              status: "completed",
              userText: null,
              fastResponse: "第二个会话先抓主线。",
              fullResponse: "这是第二个会话的完整回复。",
              usedMemoryIds: [],
              usedMemoryEntries: [],
              conversationPath: {
                frontAgent: "analyst-agent",
                consultedAgent: null,
                authorityAgent: null,
                authorityTarget: null,
                authorityExecutionStatus: null,
                revokedMemoryCount: 0,
                authoritySummary: null,
                routeSummary: "Picard routed this turn to analyst-agent.",
                routeMetrics: [],
                primaryRoute: "cluster",
                usedOpenClaw: true,
                hadFallback: false,
                degraded: false,
                degradedReason: null,
              },
              traceId: "trace-9",
              errorCode: null,
              createdAt: "2026-03-28T00:40:00.000Z",
              updatedAt: "2026-03-28T00:40:05.000Z",
            },
          ],
          feedback: [],
        };
      }

      return {
        session: {
          id: "session-1",
          userId: "demo-user",
          title: "Coach Session",
          status: "active",
          createdAt: "2026-03-28T00:00:00.000Z",
          updatedAt: "2026-03-28T00:10:00.000Z",
          lastMessageAt: "2026-03-28T00:10:00.000Z",
        },
        messages: [
          {
            id: "assistant-1",
            userId: "demo-user",
            sessionId: "session-1",
            role: "assistant",
            status: "completed",
            userText: null,
            fastResponse: "先收窄。",
            fullResponse: "先稳住，再确认今天最受限的一条现实约束。",
            usedMemoryIds: [],
            usedMemoryEntries: [],
            conversationPath: {
              frontAgent: "companion-agent",
              consultedAgent: "analyst-agent",
              authorityAgent: "memory-governor-agent",
              authorityTarget: "delete_memory",
              authorityExecutionStatus: "deleted",
              runtimeSource: "original-runtime",
              revokedMemoryCount: 1,
              authoritySummary: "Data 已删除这条长期记忆。",
              routeSummary: "Picard routed this turn to companion-agent with analyst-agent consult.",
              routeMetrics: [],
              primaryRoute: "cluster",
              usedOpenClaw: true,
              hadFallback: false,
              degraded: false,
              degradedReason: null,
            },
            traceId: "trace-1",
            errorCode: null,
            createdAt: "2026-03-28T00:10:00.000Z",
            updatedAt: "2026-03-28T00:10:05.000Z",
          },
        ],
        feedback: [],
      };
    }),
    createCoachSession: vi.fn(async (payload?: { title?: string }) => ({
      id: "session-2",
      userId: "demo-user",
      title: payload?.title ?? "New Coach Session",
      status: "active",
      createdAt: "2026-03-28T00:20:00.000Z",
      updatedAt: "2026-03-28T00:20:00.000Z",
      lastMessageAt: "2026-03-28T00:20:00.000Z",
    })),
    sendCoachMessage: vi.fn(async () => ({
      userMessage: {
        id: "user-2",
        userId: "demo-user",
        sessionId: "session-2",
        role: "user",
        status: "completed",
        userText: "现在先帮我收窄一下今天的重点。",
        fastResponse: null,
        fullResponse: null,
        usedMemoryIds: [],
        usedMemoryEntries: [],
        conversationPath: null,
        traceId: "trace-2",
        errorCode: null,
        createdAt: "2026-03-28T00:20:01.000Z",
        updatedAt: "2026-03-28T00:20:01.000Z",
      },
      assistantMessage: {
        id: "assistant-2",
        userId: "demo-user",
        sessionId: "session-2",
        role: "assistant",
        status: "pending_full",
        userText: null,
        fastResponse: "先只抓住今天最重要的一件事。",
        fullResponse: null,
        usedMemoryIds: [],
        usedMemoryEntries: [],
        conversationPath: {
          frontAgent: "companion-agent",
          consultedAgent: "analyst-agent",
          authorityAgent: null,
          authorityTarget: null,
          authorityExecutionStatus: null,
          runtimeSource: "original-runtime",
          revokedMemoryCount: 0,
          authoritySummary: null,
          routeSummary: "Picard routed this turn to companion-agent with analyst-agent consult.",
          routeMetrics: [],
          primaryRoute: "cluster",
          usedOpenClaw: true,
          hadFallback: false,
          degraded: false,
          degradedReason: null,
        },
        traceId: "trace-2",
        errorCode: null,
        createdAt: "2026-03-28T00:20:02.000Z",
        updatedAt: "2026-03-28T00:20:02.000Z",
      },
      frontAgentState: {
        currentFrontAgent: "companion-agent",
        routingMode: "auto",
        manualOverride: false,
        consultedAgent: "analyst-agent",
        handoffReason: null,
        overrideSourceAgent: null,
        visibleSummary: "Picard routed this turn to companion-agent with analyst-agent consult.",
      },
      fastResponse: "先只抓住今天最重要的一件事。",
      traceId: "trace-2",
    })),
    getCoachMessage: vi.fn(async () => ({
      id: "assistant-2",
      userId: "demo-user",
      sessionId: "session-2",
      role: "assistant",
      status: "completed",
      userText: null,
      fastResponse: "先只抓住今天最重要的一件事。",
      fullResponse: "先稳住，再把今天最重要的一件事定义成一个 10 分钟内能起步的动作。",
      usedMemoryIds: [],
      usedMemoryEntries: [],
      conversationPath: {
        frontAgent: "companion-agent",
        consultedAgent: "analyst-agent",
        authorityAgent: null,
        authorityTarget: null,
        authorityExecutionStatus: null,
        revokedMemoryCount: 0,
        authoritySummary: null,
        routeSummary: "Picard routed this turn to companion-agent with analyst-agent consult.",
        routeMetrics: [],
        primaryRoute: "cluster",
        usedOpenClaw: true,
        hadFallback: false,
        degraded: false,
        degradedReason: null,
      },
      traceId: "trace-2",
      errorCode: null,
      createdAt: "2026-03-28T00:20:02.000Z",
      updatedAt: "2026-03-28T00:20:04.000Z",
    })),
    retryCoachMessage: vi.fn(async (messageId: string) => ({
      userMessage: {
        id: "user-retry",
        userId: "demo-user",
        sessionId: "session-2",
        role: "user",
        status: "completed",
        userText: "重试上一轮。",
        fastResponse: null,
        fullResponse: null,
        usedMemoryIds: [],
        usedMemoryEntries: [],
        conversationPath: null,
        traceId: "trace-retry",
        errorCode: null,
        createdAt: "2026-03-28T00:41:00.000Z",
        updatedAt: "2026-03-28T00:41:00.000Z",
      },
      assistantMessage: {
        id: messageId,
        userId: "demo-user",
        sessionId: "session-2",
        role: "assistant",
        status: "completed",
        userText: null,
        fastResponse: "这次先只抓住最小下一步。",
        fullResponse: "重试已成功，这次先只抓住最小下一步，再看是否继续展开。",
        usedMemoryIds: ["memory-2"],
        usedMemoryEntries: [
          {
            memoryId: "memory-2",
            summary: "用户这周更适合短反馈闭环。",
            kind: "preference",
            source: "coach-memory",
          },
        ],
        conversationPath: {
          frontAgent: "companion-agent",
          consultedAgent: null,
          authorityAgent: null,
          authorityTarget: null,
          authorityExecutionStatus: null,
          runtimeSource: "original-runtime",
          revokedMemoryCount: 0,
          authoritySummary: null,
          routeSummary: "Picard routed this turn to companion-agent.",
          routeMetrics: [],
          primaryRoute: "cluster",
          usedOpenClaw: true,
          hadFallback: false,
          degraded: false,
          degradedReason: null,
        },
        traceId: "trace-retry",
        errorCode: null,
        createdAt: "2026-03-28T00:41:01.000Z",
        updatedAt: "2026-03-28T00:41:04.000Z",
      },
      frontAgentState: {
        currentFrontAgent: "companion-agent",
        routingMode: "auto",
        manualOverride: false,
        consultedAgent: null,
        handoffReason: null,
        overrideSourceAgent: null,
        visibleSummary: "Picard routed this turn to companion-agent.",
      },
      fastResponse: "这次先只抓住最小下一步。",
      traceId: "trace-retry",
    })),
    getDebugTrace: vi.fn(async (traceId: string) => ({
      traceId,
      agentRuns: [],
      matrixRuns: [],
      summary: {
        conversationPath:
          traceId === "trace-failed"
            ? {
                frontAgent: "companion-agent",
                consultedAgent: "analyst-agent",
                authorityAgent: null,
                authorityTarget: null,
                authorityExecutionStatus: null,
                runtimeSource: "original-runtime",
                revokedMemoryCount: 0,
                authoritySummary: null,
                routeSummary: "Picard routed this turn to companion-agent.",
                routeStatusSummary: "Fallback path: cluster did not fully handle this conversation.",
                degradedSummary: "Conversation degraded because cluster could not fully complete the turn and a fallback path was used.",
                routeMetrics: [],
                primaryRoute: "provider-fallback",
                usedOpenClaw: true,
                hadFallback: true,
                degraded: true,
                degradedReason: "cluster_fallback",
                memoryUsage: {
                  recalledCount: 1,
                  sourceCounts: {
                    "coach-memory": 1,
                  },
                  scopeEntryCounts: {
                    preferences: 1,
                    habits: 0,
                    constraints: 0,
                    recentContext: 0,
                  },
                },
                feedbackLearning: {
                  strengtheningRecalledCount: 1,
                  staleFilteredCount: 0,
                  missingSourceFilteredCount: 0,
                  weakenedRejectedCandidateCount: 0,
                },
                adapterRoutes: [
                  {
                    agentName: "companion-agent",
                    workflow: "coach_conversation_full",
                    route: "provider-fallback",
                    usedOpenClaw: true,
                    hadFallback: true,
                  },
                ],
              }
            : {
                frontAgent: "companion-agent",
                consultedAgent: "analyst-agent",
                authorityAgent: null,
                authorityTarget: null,
                authorityExecutionStatus: null,
                runtimeSource: "original-runtime",
                revokedMemoryCount: 0,
                authoritySummary: null,
                routeSummary: "Picard routed this turn to companion-agent with analyst-agent consult.",
                routeStatusSummary: "Cluster path healthy: OpenClaw handled the conversation without fallback.",
                degradedSummary: null,
                routeMetrics: [],
                primaryRoute: "cluster",
                usedOpenClaw: true,
                hadFallback: false,
                degraded: false,
                degradedReason: null,
                memoryUsage: {
                  recalledCount: 1,
                  sourceCounts: {
                    "coach-memory": 1,
                  },
                  scopeEntryCounts: {
                    preferences: 1,
                    habits: 0,
                    constraints: 0,
                    recentContext: 0,
                  },
                },
                feedbackLearning: {
                  strengtheningRecalledCount: 1,
                  staleFilteredCount: 0,
                  missingSourceFilteredCount: 0,
                  weakenedRejectedCandidateCount: 0,
                },
                adapterRoutes: [
                  {
                    agentName: "companion-agent",
                    workflow: "coach_conversation_full",
                    route: "cluster",
                    usedOpenClaw: true,
                    hadFallback: false,
                  },
                ],
              },
      },
      events: [
        {
          id: `${traceId}-event-route`,
          traceId,
          parentTraceId: undefined,
          level: "info",
          component: "conversation-coach",
          event: "coach.route.selected",
          message: "Coach route selected",
          metadata: {
            frontAgent: "companion-agent",
            consultedAgent: "analyst-agent",
          },
          createdAt: "2026-03-28T00:20:02.000Z",
        },
        {
          id: `${traceId}-event-runtime`,
          traceId,
          parentTraceId: undefined,
          level: "info",
          component: "model-bridge",
          event: "openclaw.original-runtime.request.succeeded",
          message: "Original OpenClaw runtime generate succeeded for companion-agent",
          metadata: {
            agentName: "companion-agent",
            workflow: "coach_conversation_full",
          },
          createdAt: "2026-03-28T00:20:03.000Z",
        },
        {
          id: `${traceId}-event-consult`,
          traceId,
          parentTraceId: undefined,
          level: "info",
          component: "conversation-coach",
          event: "coach.consult.completed",
          message: "Coach consult completed",
          metadata: {
            consultedAgent: "analyst-agent",
          },
          createdAt: "2026-03-28T00:20:04.000Z",
        },
      ],
    })),
    submitCoachFeedback: vi.fn(async (messageId: string, payload: { label: string; reason?: string }) => ({
      id: `feedback-${messageId}`,
      userId: "demo-user",
      sessionId: messageId === "assistant-9" ? "session-2" : "session-1",
      messageId,
      label: payload.label,
      reason: payload.reason ?? null,
      createdAt: "2026-03-28T00:50:00.000Z",
    })),
  },
}));

describe("CoachPage", () => {
  it("shows current coach routing and latest conversation explainability", async () => {
    const { fireEvent } = await import("@testing-library/react");

    render(
      <MemoryRouter>
        <CoachPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("正在加载 Coach…")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Coach 观测")).toBeInTheDocument();
    });

    expect(screen.getByText("当前摘要")).toBeInTheDocument();
    expect(screen.queryByText("当前前台人格")).not.toBeInTheDocument();
    expect(screen.queryByText("最近线程")).not.toBeInTheDocument();
    expect(screen.getByText("当前人格：Deanna Troi")).toBeInTheDocument();
    expect(screen.getByText("模式：自动路由")).toBeInTheDocument();
    expect(screen.getByText(/Picard routed this turn/)).toBeInTheDocument();
    expect(screen.getAllByText("官方 OpenClaw runtime · cluster").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("当前线程：Coach Session")).toBeInTheDocument();
    expect(screen.getByText("最近回复")).toBeInTheDocument();
    expect(screen.getByText("来源摘要")).toBeInTheDocument();
    expect(screen.getByText("查看来源细节")).toBeInTheDocument();
    expect(screen.queryByText("Authority · Data · delete memory · deleted")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("查看来源细节"));
    expect((await screen.findAllByText("Consult · Spock")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Authority · Data · delete memory · deleted")).toBeInTheDocument();
    expect(screen.getByText("查看会话消息（1）")).toBeInTheDocument();
    expect(screen.queryByText("assistant · assistant-1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("查看会话消息（1）"));
    expect(await screen.findByText("assistant · assistant-1")).toBeInTheDocument();
    expect(await screen.findByText("消息级 Trace")).toBeInTheDocument();
    expect(screen.getByText("查看事件时间线")).toBeInTheDocument();
    expect(screen.getByText("查看执行链路")).toBeInTheDocument();
    expect(screen.queryByText("coach.route.selected")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("查看事件时间线"));
    expect(await screen.findByText("coach.route.selected")).toBeInTheDocument();
    expect(screen.getByText("openclaw.original-runtime.request.succeeded")).toBeInTheDocument();
    expect(screen.queryByText(/回退/)).not.toBeInTheDocument();
  });

  it("sends a new coach message and refreshes the latest assistant reply", async () => {
    const { api } = await import("../../api");
    const { fireEvent } = await import("@testing-library/react");

    render(
      <MemoryRouter>
        <CoachPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Coach 观测")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("输入你现在的情况，或你想让 Coach 帮你收窄的问题"), {
      target: { value: "现在先帮我收窄一下今天的重点。" },
    });
    fireEvent.click(screen.getByText("发送给 Coach"));

    await waitFor(() => {
      expect(api.sendCoachMessage).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getAllByText("先稳住，再把今天最重要的一件事定义成一个 10 分钟内能起步的动作。").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText("已收到这轮消息，当前已同步到最新 assistant 结果。")).toBeInTheDocument();
    expect((await screen.findAllByText("trace trace-2")).length).toBeGreaterThanOrEqual(1);
  });

  it("switches sessions, expands selected message, and records feedback", async () => {
    const { api } = await import("../../api");
    const { fireEvent } = await import("@testing-library/react");

    render(
      <MemoryRouter>
        <CoachPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Coach 观测")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Second Session"));

    await waitFor(() => {
      expect(api.getCoachSession).toHaveBeenCalledWith("session-2");
    });
    expect((await screen.findAllByText("这是第二个会话的完整回复。")).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByText("查看会话消息（2）"));
    fireEvent.click(screen.getByText("assistant · assistant-9"));
    expect(await screen.findByText("已选消息")).toBeInTheDocument();
    expect(screen.getAllByText("trace trace-9").length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByText("有帮助"));

    await waitFor(() => {
      expect(api.submitCoachFeedback).toHaveBeenCalledWith("assistant-9", { label: "helpful" });
    });
    expect(await screen.findByText("feedback · helpful")).toBeInTheDocument();
  });

  it("retries a failed message and submits reasoned unhelpful feedback", async () => {
    const { api } = await import("../../api");
    const { fireEvent } = await import("@testing-library/react");

    render(
      <MemoryRouter>
        <CoachPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Coach 观测")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Second Session"));
    await waitFor(() => {
      expect(api.getCoachSession).toHaveBeenCalledWith("session-2");
    });
    expect((await screen.findAllByText("这是第二个会话的完整回复。")).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByText("查看会话消息（2）"));
    await waitFor(() => {
      expect(screen.getByText("assistant · assistant-failed")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("assistant · assistant-failed"));
    expect(await screen.findByText("coach_full_generation_failed")).toBeInTheDocument();
    expect(screen.getByText("用户这周更适合短反馈闭环。")).toBeInTheDocument();

    fireEvent.click(screen.getByText("重试这条消息"));
    await waitFor(() => {
      expect(api.retryCoachMessage).toHaveBeenCalledWith("assistant-failed");
    });
    const selectedMessageCard = screen.getByText("已选消息").closest("article");
    expect(selectedMessageCard).not.toBeNull();
    await waitFor(() => {
      expect(selectedMessageCard).toHaveTextContent("重试已成功，这次先只抓住最小下一步，再看是否继续展开。");
    });

    fireEvent.change(screen.getByPlaceholderText("可选：补一句为什么这条回复没帮助"), {
      target: { value: "这轮还是太宽泛，我需要更短更直接。" },
    });
    fireEvent.click(screen.getByText("没帮助"));

    await waitFor(() => {
      expect(api.submitCoachFeedback).toHaveBeenCalledWith("assistant-failed", {
        label: "unhelpful",
        reason: "这轮还是太宽泛，我需要更短更直接。",
      });
    });
    expect(await screen.findByText("feedback · unhelpful")).toBeInTheDocument();
  });

  it("shows trace summary and action status for the selected message", async () => {
    const { api } = await import("../../api");
    const { fireEvent } = await import("@testing-library/react");

    render(
      <MemoryRouter>
        <CoachPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Coach 观测")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Second Session"));
    await waitFor(() => {
      expect(api.getCoachSession).toHaveBeenCalledWith("session-2");
    });
    expect((await screen.findAllByText("这是第二个会话的完整回复。")).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByText("查看会话消息（2）"));
    await waitFor(() => {
      expect(screen.getByText("assistant · assistant-failed")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("assistant · assistant-failed"));

    expect(await screen.findByText("Fallback path: cluster did not fully handle this conversation.")).toBeInTheDocument();
    expect(screen.getByText("Conversation degraded because cluster could not fully complete the turn and a fallback path was used.")).toBeInTheDocument();
    expect(screen.getByText("memory recalled 1")).toBeInTheDocument();
    expect(screen.getByText("feedback learned 1")).toBeInTheDocument();
    expect(screen.getByText("本条消息记忆 1 / 本轮召回 1")).toBeInTheDocument();
    expect(screen.getByText("展开记忆联动")).toBeInTheDocument();
    expect(screen.getByText("查看执行链路")).toBeInTheDocument();
    expect(screen.getByText("查看事件时间线")).toBeInTheDocument();
    expect(screen.queryByText("记忆联动摘要")).not.toBeInTheDocument();
    expect(screen.queryByText("来源 coach-memory × 1")).not.toBeInTheDocument();
    expect(screen.queryByText("范围 preference × 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Deanna Troi · 完整回复 · OpenClaw 回退")).not.toBeInTheDocument();
    expect(screen.queryByText("companion-agent · coach_conversation_full · provider-fallback")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("展开记忆联动"));
    expect(await screen.findByText("记忆联动摘要")).toBeInTheDocument();
    expect(screen.getByText("来源 coach-memory × 1")).toBeInTheDocument();
    expect(screen.getByText("范围 preference × 1")).toBeInTheDocument();

    fireEvent.click(screen.getByText("查看执行链路"));
    expect(await screen.findByText("Deanna Troi · 完整回复 · OpenClaw 回退")).toBeInTheDocument();

    fireEvent.click(screen.getByText("查看事件时间线"));
    expect(await screen.findByText("coach.consult.completed")).toBeInTheDocument();

    fireEvent.click(screen.getByText("重试这条消息"));
    expect(await screen.findByText("已完成重试，当前已切到最新 assistant 结果。")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("可选：补一句为什么这条回复没帮助"), {
      target: { value: "还不够贴近我刚刚的问题。" },
    });
    fireEvent.click(screen.getByText("没帮助"));
    expect(await screen.findByText("已记录反馈，这会进入后续偏好学习与治理链。")).toBeInTheDocument();
  });
});
