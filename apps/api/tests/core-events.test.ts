import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { CoreError } from "../src/core/core-errors.js";
import { SqliteCoreRepository } from "../src/core/sqlite-core-repository.js";

const setup = async () => {
  const repo = SqliteCoreRepository.fromDatabase(new Database(":memory:"));
  await repo.init();
  await repo.ensureProfile({ profileId: "p-1", userId: "u-1", timezone: "UTC" });
  await repo.ensureProfile({ profileId: "p-2", userId: "u-2", timezone: "UTC" });
  return repo;
};
const event = (overrides: Record<string, unknown> = {}) => ({ profileId: "p-1", userId: "u-1", eventType: "activity" as const, occurredAt: "2026-08-24T10:00:00.000Z", source: "desktop" as const, payload: { app: "editor" }, privacyLevel: "P1" as const, confidence: 1, ...overrides });

describe("Core events", () => {
  it("is idempotent and rejects conflicting client keys", async () => {
    const repo = await setup();
    const first = await repo.appendEvent(event({ clientEventId: "same" }));
    const retry = await repo.appendEvent(event({ clientEventId: "same" }));
    expect(retry.id).toBe(first.id);
    await expect(repo.appendEvent(event({ clientEventId: "same", payload: { app: "other" } }))).rejects.toMatchObject({ code: "core_idempotency_conflict" });
    repo.close();
  });

  it("isolates profiles, sorts newest first, and retains expired P0 only", async () => {
    const repo = await setup();
    await repo.appendEvent(event({ occurredAt: "2026-08-24T09:00:00.000Z" }));
    await repo.appendEvent(event({ occurredAt: "2026-08-24T11:00:00.000Z" }));
    await repo.appendEvent(event({ profileId: "p-2", userId: "u-2", privacyLevel: "P0", expiresAt: "2026-08-24T08:00:00.000Z" }));
    expect((await repo.listEvents("p-1", "u-1")).map((item) => item.occurredAt)).toEqual(["2026-08-24T11:00:00.000Z", "2026-08-24T09:00:00.000Z"]);
    expect((await repo.runRetention("2026-08-24T10:00:00.000Z")).deletedEvents).toBe(1);
    expect(await repo.listEvents("p-2", "u-1")).toHaveLength(0);
    repo.close();
  });

  it("rejects a profile scope mismatch", async () => {
    const repo = await setup();
    await expect(repo.appendEvent(event({ userId: "u-2" }))).rejects.toBeInstanceOf(CoreError);
    repo.close();
  });
});
