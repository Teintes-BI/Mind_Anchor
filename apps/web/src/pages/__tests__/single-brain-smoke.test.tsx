import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SingleBrainPage } from "../SingleBrainPage";

vi.mock("../../api", () => ({
  api: {
    listCoreConversations: vi.fn().mockResolvedValue({ conversations: [] }),
  },
}));

describe("SingleBrainPage", () => {
  it("shows the single brain workspace and an empty session state", async () => {
    render(
      <MemoryRouter>
        <SingleBrainPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Single Brain" })).toBeInTheDocument();
    expect(screen.getByText("还没有会话，创建一个新的对话开始吧。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新建会话" })).toBeInTheDocument();
  });
});
