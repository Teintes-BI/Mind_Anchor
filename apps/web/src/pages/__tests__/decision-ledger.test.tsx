import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DecisionLedgerPage } from "../DecisionLedgerPage";

const apiMock = vi.hoisted(() => ({
  listWayfinderHistory: vi.fn(),
  recordWayfinderOutcome: vi.fn(),
  exportWayfinderData: vi.fn(),
}));

vi.mock("../../api", () => ({ api: apiMock }));

const entry = {
  decision: {
    id: "decision-1",
    userId: "demo-user",
    situationId: "situation-1",
    selectedOptionId: "option-1",
    selectedAt: "2026-08-05T10:10:00.000Z",
    actionStatus: "in_progress" as const,
    traceId: "trace-decision-1",
  },
  situation: {
    id: "situation-1",
    userId: "demo-user",
    eventIds: ["event-1"],
    status: "confirmed" as const,
    summary: "周五前提交实验结果",
    uncertainty: [],
    linkedGoalIds: ["goal-quality"],
    linkedTaskIds: [],
    riskLevel: "medium" as const,
    createdAt: "2026-08-05T10:00:00.000Z",
    updatedAt: "2026-08-05T10:10:00.000Z",
    traceId: "trace-situation-1",
  },
  option: {
    id: "option-1",
    userId: "demo-user",
    situationId: "situation-1",
    status: "selected" as const,
    action: "先交付最小结果骨架",
    firstStep: "打开实验记录",
    rationale: "降低失约风险",
    immediateBenefits: ["建立进展"],
    costs: ["占用 20 分钟"],
    projectedConsequences: [{ horizon: "today" as const, text: "下午更容易完成", confidence: 0.8 }],
    reversibility: "reversible" as const,
    valueAlignment: [{ valueId: "craft", effect: "supports" as const, explanation: "保护质量" }],
    evidenceRefs: ["event-1"],
    consultedSkills: [],
    riskLevel: "medium" as const,
    requiresApproval: false,
    createdAt: "2026-08-05T10:00:00.000Z",
    traceId: "trace-option-1",
  },
  outcomes: [],
};

describe("DecisionLedgerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.listWayfinderHistory.mockResolvedValue({ decisions: [entry] });
    apiMock.recordWayfinderOutcome.mockResolvedValue({
      id: "outcome-1",
      userId: "demo-user",
      decisionId: "decision-1",
      observedAt: "2026-08-05T12:00:00.000Z",
      status: "observed",
      summary: "完成了结果骨架",
      userRating: 4,
      evidenceRefs: [],
      traceId: "trace-outcome-1",
    });
    apiMock.exportWayfinderData.mockResolvedValue({ exportedAt: "2026-08-05T12:00:00.000Z", userId: "demo-user", decisions: [entry.decision] });
  });

  it("shows predicted impact and records an outcome", async () => {
    render(<MemoryRouter><DecisionLedgerPage /></MemoryRouter>);

    expect(await screen.findByText("先交付最小结果骨架")).toBeInTheDocument();
    expect(screen.getByText("下午更容易完成")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("实际结果"), { target: { value: "完成了结果骨架" } });
    fireEvent.click(screen.getByRole("button", { name: "保存结果" }));

    await waitFor(() => expect(apiMock.recordWayfinderOutcome).toHaveBeenCalledTimes(1));
    expect(apiMock.recordWayfinderOutcome).toHaveBeenCalledWith(
      "decision-1",
      expect.objectContaining({ summary: "完成了结果骨架", status: "observed" }),
    );
  });

  it("filters the ledger by risk and exposes an export result", async () => {
    render(<MemoryRouter><DecisionLedgerPage /></MemoryRouter>);
    await screen.findByText("先交付最小结果骨架");
    fireEvent.change(screen.getByLabelText("风险筛选"), { target: { value: "critical" } });
    expect(screen.getByText("当前筛选没有选择记录")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("风险筛选"), { target: { value: "medium" } });
    fireEvent.click(screen.getByRole("button", { name: "导出 JSON" }));

    expect(await screen.findByText(/导出完成/)).toBeInTheDocument();
    expect(apiMock.exportWayfinderData).toHaveBeenCalledTimes(1);
  });
});
