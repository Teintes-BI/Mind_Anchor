import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SqliteCoreRepository } from "../src/core/sqlite-core-repository.js";

const state = (overrides: Record<string, unknown> = {}) => ({ energy: 70, emotion: 60, cognitiveLoad: 30, mentalNoise: 20, focusReadiness: 80, physicalFatigue: 25, recoveryNeed: 15, source: ["user"], confidence: 0.9, userConfirmed: true, capturedAt: "2026-08-24T10:00:00.000Z", ...overrides });

describe("append-only personal state", () => {
  it("requires optimistic revisions and ignores ordinary events", async () => {
    const repo = SqliteCoreRepository.fromDatabase(new Database(":memory:"));
    await repo.init();
    await repo.ensureProfile({ profileId: "p", userId: "u", timezone: "UTC" });
    expect(await repo.getCurrentState("p", "u")).toBeNull();
    const first = await repo.appendStateSnapshot({ ...state(), profileId: "p", userId: "u", purpose: "core", scope: "write" }, null);
    expect(first.revision).toBe(1);
    await expect(repo.appendStateSnapshot({ ...state({ energy: 50 }), profileId: "p", userId: "u", purpose: "core", scope: "write" }, null)).rejects.toMatchObject({ code: "core_revision_conflict" });
    const second = await repo.appendStateSnapshot({ ...state({ energy: 50 }), profileId: "p", userId: "u", purpose: "core", scope: "write" }, 1);
    expect(second.revision).toBe(2);
    const activity = await repo.appendEvent({ profileId: "p", userId: "u", eventType: "activity", occurredAt: "2026-08-24T10:00:00.000Z", source: "desktop", payload: {}, privacyLevel: "P1", confidence: 1 });
    expect(await repo.deriveStateFromEvent(activity, 2)).toBeNull();
    repo.close();
  });
});
