import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InboxPage } from "../InboxPage";

vi.mock("../../api", () => ({
  api: {
    getClientInboxOverview: vi.fn(() => new Promise(() => {})),
    ackClientInbox: vi.fn(),
  },
}));

describe("InboxPage", () => {
  it("shows an explicit loading state before the inbox overview resolves", () => {
    render(<InboxPage />);

    expect(screen.getByText("正在加载收件箱…")).toBeInTheDocument();
    expect(screen.getByText("正在拉取待处理提醒、恢复上下文和行为结论。")).toBeInTheDocument();
  });
});
