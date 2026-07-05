import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

describe("web api auth headers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends dev bearer token for coach requests in local development", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ currentFrontAgent: "director-agent", routingMode: "auto", manualOverride: false, consultedAgent: null, handoffReason: null, overrideSourceAgent: null, visibleSummary: null }),
    } as Response);

    await api.getCoachFrontAgent();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer dev:demo-user:demo@example.com");
  });
});
