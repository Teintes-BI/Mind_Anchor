import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SqliteCoreRepository } from "../src/core/sqlite-core-repository.js";

describe("Core privacy, export and deletion", () => {
  it("blocks P3 cloud projection and excludes trace payloads from export", async () => {
    const repo = SqliteCoreRepository.fromDatabase(new Database(":memory:"));
    await repo.init();
    await repo.ensureProfile({ profileId: "p", userId: "u", timezone: "UTC" });
    await expect(repo.appendEvent({ profileId: "p", userId: "u", eventType: "activity", occurredAt: "2026-08-24T10:00:00.000Z", source: "desktop", payload: { secret: "x" }, privacyLevel: "P3", confidence: 1 })).rejects.toMatchObject({ code: "core_p3_egress_blocked" });
    const event = await repo.appendEvent({ profileId: "p", userId: "u", eventType: "activity", occurredAt: "2026-08-24T10:00:00.000Z", source: "desktop", payload: { summary: "safe" }, privacyLevel: "P1", confidence: 1 });
    await repo.addSystemTrace({ profileId: "p", userId: "u", event: "model.raw", payload: { prompt: "secret", response: "secret" } });
    const exported = await repo.exportProfile("p", "u");
    expect(exported.events[0].id).toBe(event.id);
    expect(exported.systemTraceCount).toBe(1);
    expect(JSON.stringify(exported)).not.toContain("secret");
    await repo.deleteProfile("p", "u");
    await expect(repo.exportProfile("p", "u")).rejects.toMatchObject({ code: "core_not_found" });
    repo.close();
  });
});
