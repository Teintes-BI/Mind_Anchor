import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SqliteCoreRepository } from "../src/core/sqlite-core-repository.js";

describe("Life Compass confirmation", () => {
  it("keeps candidates pending until confirmation and versions append", async () => {
    const repo = SqliteCoreRepository.fromDatabase(new Database(":memory:"), () => "2026-08-24T10:00:00.000Z", (() => { let i = 0; return () => `id-${++i}`; })());
    await repo.init();
    await repo.ensureProfile({ profileId: "p", userId: "u", timezone: "UTC" });
    const candidate = await repo.createLifeCompassCandidate({ profileId: "p", userId: "u", content: "Keep meaningful work and recovery in balance", purpose: "core", scope: "write" });
    expect((await repo.getLifeCompass("p", "u")).active).toBeNull();
    const first = await repo.confirmLifeCompassCandidate("p", "u", candidate.id, null);
    expect(first.version).toBe(1);
    const secondCandidate = await repo.createLifeCompassCandidate({ profileId: "p", userId: "u", content: "Prefer sustainable meaningful work", purpose: "core", scope: "write" });
    const second = await repo.confirmLifeCompassCandidate("p", "u", secondCandidate.id, 1);
    expect(second.version).toBe(2);
    await expect(repo.confirmLifeCompassCandidate("p", "u", secondCandidate.id, 2)).rejects.toMatchObject({ code: "core_revision_conflict" });
    repo.close();
  });
});
