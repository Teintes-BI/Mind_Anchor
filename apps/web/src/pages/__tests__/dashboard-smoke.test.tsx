import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DashboardPage } from "../DashboardPage";

vi.mock("../../api", () => ({
  api: {
    getDashboardSummary: vi.fn(() => new Promise(() => {})),
  },
}));

describe("DashboardPage", () => {
  it("shows an explicit loading state before the dashboard summary resolves", () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("正在加载 Dashboard…")).toBeInTheDocument();
    expect(screen.getByText("正在同步 Gateway 与 OpenClaw 的最新工作区摘要。")).toBeInTheDocument();
  });
});
