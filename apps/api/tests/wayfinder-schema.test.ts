import { describe, expect, it } from "vitest";
import {
  contextEventSchema,
  decisionOptionSchema,
  decisionRiskSchema,
  interventionBudgetSchema,
} from "@mindanchor/domain";

const date = "2026-08-05T00:00:00.000Z";

const validContextEvent = {
  userId: "schema-user",
  sourceDeviceId: "phone-1",
  kind: "manual_note",
  occurredAt: date,
  payload: { text: "A confirmed note" },
  confidence: 1,
  consentRef: "consent-manual-note",
  retentionClass: "summary",
  traceId: "trace-schema-1",
};

describe("Wayfinder domain schemas", () => {
  it("rejects an option without evidenceRefs or reversibility", () => {
    expect(() => decisionOptionSchema.parse({ action: "do it" })).toThrow();
  });

  it("accepts an idempotent context event with consent and retention", () => {
    expect(() => contextEventSchema.parse({ id: "event-1", receivedAt: date, ...validContextEvent })).not.toThrow();
  });

  it("forces approval for critical decisions", () => {
    expect(decisionRiskSchema.parse({ riskLevel: "critical", requiresApproval: false })).toEqual({
      riskLevel: "critical",
      requiresApproval: true,
    });
  });

  it("validates intervention budgets and time windows", () => {
    expect(
      interventionBudgetSchema.parse({
        userId: "schema-user",
        budgetDate: "2026-08-05",
        limit: 3,
        used: 1,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
        updatedAt: date,
      }),
    ).toMatchObject({ limit: 3, used: 1 });
  });
});
