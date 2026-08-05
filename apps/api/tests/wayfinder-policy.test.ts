import { describe, expect, it } from "vitest";
import { evaluateInterventionPolicy } from "../src/services/wayfinder/intervention-policy.js";
import { WayfinderConsentService } from "../src/services/wayfinder/consent-service.js";
import { WayfinderRepository } from "../src/services/wayfinder/wayfinder-repository.js";
import { MindAnchorStore } from "../src/store.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = {
  userId: "user-a",
  now: "2026-08-05T10:00:00+08:00",
  kind: "task_prompt",
  riskLevel: "low" as const,
  consentGranted: true,
  focusState: "available" as const,
};

describe("Wayfinder intervention policy", () => {
  it("suppresses missing consent before any other action", () => {
    expect(evaluateInterventionPolicy({ ...base, consentGranted: false }).decision).toBe("suppress");
  });

  it("escalates high and critical actions until explicitly approved", () => {
    expect(evaluateInterventionPolicy({ ...base, riskLevel: "high" }).decision).toBe("escalate");
    expect(evaluateInterventionPolicy({ ...base, riskLevel: "critical" }).requiresApproval).toBe(true);
    expect(evaluateInterventionPolicy({ ...base, riskLevel: "critical" }).decision).toBe("escalate");
  });

  it("queues during quiet hours, focus, exhausted budget, and repeated prompts", () => {
    const budget = {
      userId: "user-a",
      budgetDate: "2026-08-05",
      limit: 3,
      used: 3,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      dismissedUntilByKind: {},
      updatedAt: base.now,
    } as const;
    expect(evaluateInterventionPolicy({ ...base, now: "2026-08-05T23:00:00+08:00", budget }).decision).toBe("queue");
    expect(evaluateInterventionPolicy({ ...base, focusState: "focused", budget: { ...budget, used: 0 } }).decision).toBe("queue");
    expect(evaluateInterventionPolicy({ ...base, budget: { ...budget, used: 3 } }).decision).toBe("queue");
    expect(
      evaluateInterventionPolicy({
        ...base,
        budget: { ...budget, used: 0 },
        recentInterventions: [
          { kind: "task_prompt", occurredAt: base.now },
          { kind: "task_prompt", occurredAt: base.now },
          { kind: "task_prompt", occurredAt: base.now },
        ],
      }).decision,
    ).toBe("queue");
  });

  it("supports grant, pause, and revoke semantics for consent refs", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-wayfinder-consent-"));
    try {
      const store = new MindAnchorStore(join(dataDir, "mindanchor.json"));
      await store.init();
      const consent = new WayfinderConsentService(new WayfinderRepository(store));
      const grant = await consent.upsert(
        "user-a",
        {
          source: "phone",
          purpose: "wayfinder_context",
          scope: "manual_notes",
          status: "granted",
          rawRetentionSeconds: 0,
          derivedRetentionDays: 30,
          modelSharing: "local_only",
        },
        "trace-consent",
      );
      expect(consent.isGranted("user-a", grant.id)).toBe(true);
      const paused = await consent.upsert(
        "user-a",
        {
          source: "phone",
          purpose: "wayfinder_context",
          scope: "manual_notes",
          status: "paused",
          rawRetentionSeconds: 0,
          derivedRetentionDays: 30,
          modelSharing: "local_only",
        },
        "trace-consent-2",
      );
      expect(paused.id).toBe(grant.id);
      expect(consent.isGranted("user-a", grant.id)).toBe(false);
    } finally {
      await rm(dataDir, { recursive: true, force: true });
    }
  });
});
