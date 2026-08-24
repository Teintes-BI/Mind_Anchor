import { describe, expect, it } from "vitest";
import {
  coreEventSchema,
  lifeCompassCandidateSchema,
  stateSnapshotSchema,
} from "@mindanchor/domain";

describe("Comma Core contracts", () => {
  it("requires source and confidence on every event", () => {
    expect(() =>
      coreEventSchema.parse({
        id: "evt-1",
        profileId: "profile-1",
        userId: "u-1",
        eventType: "state_report",
        occurredAt: "2026-08-24T10:00:00.000Z",
        payload: {},
        privacyLevel: "P1",
        source: "user",
        confidence: 1,
        createdAt: "2026-08-24T10:00:01.000Z",
      }),
    ).not.toThrow();
    expect(() =>
      coreEventSchema.parse({
        id: "evt-2",
        profileId: "profile-1",
        userId: "u-1",
        eventType: "state_report",
        occurredAt: "2026-08-24T10:00:00.000Z",
        payload: {},
        privacyLevel: "P1",
        source: "user",
        createdAt: "2026-08-24T10:00:01.000Z",
      }),
    ).toThrow();
  });

  it("does not allow a candidate to claim confirmation", () => {
    expect(() =>
      lifeCompassCandidateSchema.parse({
        id: "lc-c-1",
        profileId: "profile-1",
        userId: "u-1",
        content: "保留创造性工作和稳定生活的平衡",
        status: "confirmed",
        createdAt: "2026-08-24T10:00:00.000Z",
      }),
    ).toThrow();
  });

  it("keeps state values within 0..100", () => {
    expect(() =>
      stateSnapshotSchema.parse({
        id: "st-1",
        profileId: "profile-1",
        userId: "u-1",
        energy: 101,
        emotion: 50,
        cognitiveLoad: 50,
        mentalNoise: 50,
        focusReadiness: 50,
        physicalFatigue: 50,
        recoveryNeed: 50,
        source: ["user"],
        confidence: 0.8,
        userConfirmed: true,
        revision: 1,
        capturedAt: "2026-08-24T10:00:00.000Z",
      }),
    ).toThrow();
  });
});
