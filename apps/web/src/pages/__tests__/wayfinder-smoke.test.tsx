import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WayfinderPage } from "../WayfinderPage";

const apiMock = vi.hoisted(() => ({
  getWayfinderConsent: vi.fn(),
  createWayfinderEvent: vi.fn(),
  confirmWayfinderSituation: vi.fn(),
  listWayfinderOptions: vi.fn(),
  recordWayfinderDecision: vi.fn(),
  recordWayfinderOutcome: vi.fn(),
  updateWayfinderConsent: vi.fn(),
  exportWayfinderData: vi.fn(),
}));

vi.mock("../../api", () => ({ api: apiMock }));

const situation = {
  id: "situation-1",
  userId: "demo-user",
  eventIds: ["event-1"],
  status: "awaiting_confirmation" as const,
  summary: "周五前提交实验结果",
  uncertainty: ["可能是对方的承诺，而非你的承诺"],
  linkedGoalIds: ["goal-quality"],
  linkedTaskIds: [],
  riskLevel: "low" as const,
  createdAt: "2026-08-05T10:00:00.000Z",
  updatedAt: "2026-08-05T10:00:00.000Z",
  traceId: "trace-situation-1",
};

const option = {
  id: "option-1",
  userId: "demo-user",
  situationId: "situation-1",
  status: "proposed" as const,
  action: "先交付最小结果骨架",
  firstStep: "打开实验记录，写出三条结果要点",
  rationale: "先降低失约风险，再保护主线分析",
  immediateBenefits: ["建立可见进展"],
  costs: ["占用 20 分钟"],
  projectedConsequences: [{ horizon: "today" as const, text: "下午更容易完成交付", confidence: 0.82 }],
  reversibility: "reversible" as const,
  valueAlignment: [{ valueId: "craft", effect: "supports" as const, explanation: "保留质量底线" }],
  evidenceRefs: ["event-1"],
  consultedSkills: ["values_clarification@1.0.0"],
  riskLevel: "low" as const,
  requiresApproval: false,
  createdAt: "2026-08-05T10:00:00.000Z",
  traceId: "trace-option-1",
};

describe("WayfinderPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.getWayfinderConsent.mockResolvedValue({
      grants: [
        {
          id: "consent-phone",
          userId: "demo-user",
          source: "phone",
          purpose: "wayfinder_context",
          scope: "manual_notes",
          status: "granted",
          rawRetentionSeconds: 0,
          derivedRetentionDays: 30,
          modelSharing: "local_only",
          grantedAt: "2026-08-05T09:00:00.000Z",
          updatedAt: "2026-08-05T09:00:00.000Z",
          traceId: "trace-consent",
        },
      ],
    });
    apiMock.createWayfinderEvent.mockResolvedValue({
      event: { id: "event-1" },
      situation,
      fastStatus: "completed",
      fullStatus: "pending",
    });
    apiMock.confirmWayfinderSituation.mockResolvedValue({
      situation: { ...situation, status: "confirmed" },
      fastStatus: "completed",
      fullStatus: "pending",
    });
    apiMock.listWayfinderOptions.mockResolvedValue({ situationId: "situation-1", status: "confirmed", options: [option], fullStatus: "pending" });
    apiMock.recordWayfinderDecision.mockResolvedValue({
      id: "decision-1",
      userId: "demo-user",
      situationId: "situation-1",
      selectedOptionId: "option-1",
      selectedAt: "2026-08-05T10:10:00.000Z",
      actionStatus: "not_started",
      traceId: "trace-decision-1",
    });
  });

  it("completes an API-backed situation confirmation and sends one decision", async () => {
    render(<WayfinderPage />);

    fireEvent.change(await screen.findByLabelText("情境描述"), { target: { value: "我答应周五前提交实验结果" } });
    fireEvent.click(screen.getByRole("button", { name: "创建情境" }));

    expect(await screen.findByText("周五前提交实验结果")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "确认这个情境" }));

    expect(await screen.findByText("先交付最小结果骨架")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择这个方案" }));
    const confirmButton = await screen.findByRole("button", { name: "确认选择" });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => expect(apiMock.recordWayfinderDecision).toHaveBeenCalledTimes(1));
    expect(apiMock.recordWayfinderDecision).toHaveBeenCalledWith(
      expect.objectContaining({ situationId: "situation-1", selectedOptionId: "option-1", actionStatus: "not_started" }),
    );
  });

  it("shows a pending empty state instead of inventing options", async () => {
    apiMock.listWayfinderOptions.mockResolvedValue({ situationId: "situation-1", status: "confirmed", options: [], fullStatus: "pending" });
    render(<WayfinderPage />);
    fireEvent.change(await screen.findByLabelText("情境描述"), { target: { value: "需要确认的事项" } });
    fireEvent.click(screen.getByRole("button", { name: "创建情境" }));
    fireEvent.click(await screen.findByRole("button", { name: "确认这个情境" }));

    expect(await screen.findByText(/完整选项仍在生成/)).toBeInTheDocument();
    expect(screen.queryByText("先交付最小结果骨架")).not.toBeInTheDocument();
  });
});
