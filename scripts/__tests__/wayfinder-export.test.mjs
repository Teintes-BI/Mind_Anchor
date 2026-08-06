import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildWayfinderExport, deleteUserRecords, deleteUserRecordsAndPersist, scopeSourceToUser, verifyDeletion } from "../wayfinder-export.mjs";

const source = {
  userId: "demo-user",
  contextEvents: [{ id: "event-1", userId: "demo-user" }],
  situations: [{ id: "situation-1", userId: "demo-user" }],
  options: [{ id: "option-1", userId: "demo-user" }],
  decisions: [{ id: "decision-1", userId: "demo-user" }],
  outcomes: [{ id: "outcome-1", userId: "demo-user" }],
  consent: [{ id: "consent-1", userId: "demo-user" }],
  healthSnapshots: [{ id: "health-1", userId: "demo-user" }],
  healthCalibrationRecords: [{ id: "calibration-1", userId: "demo-user" }],
  memoryCandidates: [{ id: "candidate-1", userId: "demo-user" }],
  memoryItems: [{ id: "memory-1", userId: "demo-user" }],
  auditEvents: [{ id: "audit-1", userId: "demo-user" }],
};

describe("Wayfinder export and deletion helpers", () => {
  it("exports bounded JSON and Markdown without raw audio", () => {
    const exported = buildWayfinderExport(source, { exportedAt: "2026-08-06T00:00:00.000Z" });

    expect(exported.json.userId).toBe("demo-user");
    expect(exported.json.contextEvents).toHaveLength(1);
    expect(exported.json.memoryCandidates).toHaveLength(1);
    expect(exported.json.memoryItems).toHaveLength(1);
    expect(exported.json.auditEvents).toHaveLength(1);
    expect(exported.markdown).toContain("event-1");
    expect(exported.markdown).not.toContain("base64Audio");
  });

  it("deletes all user-owned records and verifies no records remain", () => {
    const records = {
      demo: { ...source },
      other: { userId: "other", contextEvents: [{ id: "event-2", userId: "other" }] },
    };

    deleteUserRecords(records, "demo-user");
    expect(verifyDeletion(records, "demo-user")).toEqual({ deleted: true, remaining: 0 });
    expect(records.other.contextEvents).toHaveLength(1);
  });

  it("scopes a multi-user source to the explicitly requested user", () => {
    const scoped = scopeSourceToUser(
      {
        userId: "all-users",
        contextEvents: [
          { id: "event-1", userId: "demo-user" },
          { id: "event-2", userId: "other" },
        ],
        decisions: [{ id: "decision-1", userId: "demo-user" }],
      },
      "demo-user",
    );

    expect(scoped.userId).toBe("demo-user");
    expect(scoped.contextEvents).toEqual([{ id: "event-1", userId: "demo-user" }]);
    expect(scoped.decisions).toEqual([{ id: "decision-1", userId: "demo-user" }]);
  });

  it("persists delete-after-export changes to the source file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "mindanchor-export-"));
    const inputPath = join(directory, "source.json");
    const records = {
      ...source,
      contextEvents: [...source.contextEvents, { id: "event-2", userId: "other" }],
    };

    try {
      await writeFile(inputPath, `${JSON.stringify(records)}\n`, "utf8");
      const deletion = await deleteUserRecordsAndPersist(records, "demo-user", inputPath);
      const persisted = JSON.parse(await readFile(inputPath, "utf8"));

      expect(deletion).toEqual({ deleted: true, remaining: 0 });
      expect(persisted.contextEvents).toEqual([{ id: "event-2", userId: "other" }]);
      expect(persisted.userId).toBe("demo-user");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
