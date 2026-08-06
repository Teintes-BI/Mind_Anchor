import { z } from "zod";

const dateTimeSchema = z.string().datetime({ offset: true });
const identifierSchema = z.string().min(1);

export const wayfinderContextEventKindSchema = z.enum([
  "voice_candidate",
  "manual_note",
  "desktop_signal",
  "health_summary",
  "wearable_signal",
]);

export const wayfinderRetentionClassSchema = z.enum(["ephemeral", "summary", "long_term_candidate"]);
export const wayfinderRiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const situationStatusSchema = z.enum(["draft", "awaiting_confirmation", "confirmed", "dismissed", "expired"]);
export const optionStatusSchema = z.enum(["proposed", "selected", "rejected", "expired"]);
export const optionHorizonSchema = z.enum(["today", "week", "month", "long_term"]);
export const optionReversibilitySchema = z.enum(["reversible", "partly_reversible", "hard_to_reverse"]);
export const decisionActionStatusSchema = z.enum(["not_started", "in_progress", "completed", "abandoned"]);
export const outcomeStatusSchema = z.enum(["observed", "partial", "unknown"]);
export const consentStatusSchema = z.enum(["granted", "paused", "revoked"]);
export const consentModelSharingSchema = z.enum(["local_only", "selected_provider", "any_configured_provider"]);
export const interventionDecisionSchema = z.enum(["allow", "suppress", "queue", "escalate"]);

export const contextEventSchema = z.object({
  id: identifierSchema,
  userId: identifierSchema,
  sourceDeviceId: identifierSchema,
  kind: wayfinderContextEventKindSchema,
  occurredAt: dateTimeSchema,
  receivedAt: dateTimeSchema,
  clientEventId: identifierSchema.optional(),
  payload: z.record(z.unknown()).default({}),
  confidence: z.number().min(0).max(1),
  consentRef: identifierSchema,
  retentionClass: wayfinderRetentionClassSchema,
  evidenceRefs: z.array(identifierSchema).default([]),
  traceId: identifierSchema,
});

export const createContextEventInputSchema = contextEventSchema.omit({
  id: true,
  receivedAt: true,
});

export const situationSchema = z.object({
  id: identifierSchema,
  userId: identifierSchema,
  eventIds: z.array(identifierSchema).min(1),
  status: situationStatusSchema,
  summary: z.string().min(1),
  uncertainty: z.array(z.string().min(1)).default([]),
  linkedGoalIds: z.array(identifierSchema).default([]),
  linkedTaskIds: z.array(identifierSchema).default([]),
  riskLevel: wayfinderRiskLevelSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  traceId: identifierSchema,
});

export const confirmSituationInputSchema = z.object({
  status: z.enum(["confirmed", "dismissed"]),
  traceId: identifierSchema,
});

export const decisionRiskSchema = z
  .object({
    riskLevel: wayfinderRiskLevelSchema,
    requiresApproval: z.boolean().default(false),
  })
  .transform((value) => ({
    ...value,
    requiresApproval: value.riskLevel === "high" || value.riskLevel === "critical" ? true : value.requiresApproval,
  }));

export const decisionOptionSchema = z
  .object({
    id: identifierSchema,
    userId: identifierSchema,
    situationId: identifierSchema,
    status: optionStatusSchema,
    action: z.string().min(1),
    firstStep: z.string().min(1),
    rationale: z.string().min(1),
    immediateBenefits: z.array(z.string().min(1)).default([]),
    costs: z.array(z.string().min(1)).default([]),
    projectedConsequences: z
      .array(
        z.object({
          horizon: optionHorizonSchema,
          text: z.string().min(1),
          confidence: z.number().min(0).max(1),
        }),
      )
      .min(1),
    reversibility: optionReversibilitySchema,
    valueAlignment: z.array(
      z.object({
        valueId: identifierSchema,
        effect: z.enum(["supports", "trades_off", "unknown"]),
        explanation: z.string().min(1),
      }),
    ),
    evidenceRefs: z.array(identifierSchema).min(1),
    consultedSkills: z.array(identifierSchema).default([]),
    riskLevel: wayfinderRiskLevelSchema,
    requiresApproval: z.boolean().default(false),
    createdAt: dateTimeSchema,
    traceId: identifierSchema,
  })
  .superRefine((value, context) => {
    if ((value.riskLevel === "high" || value.riskLevel === "critical") && !value.requiresApproval) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["requiresApproval"], message: "High-risk options require approval" });
    }
  });

export const decisionRecordSchema = z.object({
  id: identifierSchema,
  userId: identifierSchema,
  situationId: identifierSchema,
  selectedOptionId: identifierSchema.optional(),
  userOverride: z.string().min(1).optional(),
  selectedAt: dateTimeSchema,
  actionStatus: decisionActionStatusSchema,
  followUpAt: dateTimeSchema.optional(),
  traceId: identifierSchema,
});

export const createDecisionInputSchema = decisionRecordSchema.omit({ id: true, selectedAt: true });

export const wayfinderOutcomeSchema = z.object({
  id: identifierSchema,
  userId: identifierSchema,
  decisionId: identifierSchema,
  observedAt: dateTimeSchema,
  status: outcomeStatusSchema,
  summary: z.string().min(1),
  userFeeling: z.string().min(1).optional(),
  userRating: z.number().int().min(1).max(5).optional(),
  predictionError: z.string().min(1).optional(),
  evidenceRefs: z.array(identifierSchema).default([]),
  traceId: identifierSchema,
});

export const updateOutcomeInputSchema = wayfinderOutcomeSchema.omit({
  id: true,
  userId: true,
  decisionId: true,
  observedAt: true,
});

export const valueProfileSchema = z.object({
  id: identifierSchema,
  userId: identifierSchema,
  valueKey: identifierSchema,
  label: z.string().min(1),
  description: z.string().default(""),
  weight: z.number().min(0).max(1),
  priority: z.number().int().min(0),
  status: z.enum(["active", "paused", "archived"]),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  traceId: identifierSchema,
});

export const consentGrantSchema = z.object({
  id: identifierSchema,
  userId: identifierSchema,
  source: identifierSchema,
  purpose: identifierSchema,
  scope: identifierSchema,
  status: consentStatusSchema,
  rawRetentionSeconds: z.number().int().min(0),
  derivedRetentionDays: z.number().int().min(0),
  modelSharing: consentModelSharingSchema,
  grantedAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  traceId: identifierSchema,
});

export const updateConsentInputSchema = consentGrantSchema.pick({
  source: true,
  purpose: true,
  scope: true,
  status: true,
  rawRetentionSeconds: true,
  derivedRetentionDays: true,
  modelSharing: true,
});

export const interventionBudgetSchema = z.object({
  userId: identifierSchema,
  budgetDate: z.string().date(),
  limit: z.number().int().min(0),
  used: z.number().int().min(0),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  dismissedUntilByKind: z.record(dateTimeSchema).default({}),
  updatedAt: dateTimeSchema,
});

export const interventionPolicyResultSchema = z.object({
  decision: interventionDecisionSchema,
  reason: z.string().min(1),
  riskLevel: wayfinderRiskLevelSchema,
  requiresApproval: z.boolean(),
  evaluatedAt: dateTimeSchema,
});

export const wayfinderAuditEventSchema = z.object({
  id: identifierSchema,
  userId: identifierSchema,
  action: identifierSchema,
  entityType: identifierSchema,
  entityId: identifierSchema,
  reason: z.string().min(1),
  occurredAt: dateTimeSchema,
  traceId: identifierSchema,
});

export const voiceCandidateSchema = z.object({
  candidateSummary: z.string().min(1).max(240),
  actor: z.string().min(1).max(80),
  action: z.string().min(1).max(240),
  dueAt: dateTimeSchema.optional(),
  confidence: z.number().min(0).max(1),
  evidenceRef: identifierSchema,
});

export const voiceAudioEventInputSchema = z.object({
  userId: identifierSchema,
  sourceDeviceId: identifierSchema,
  sessionId: identifierSchema,
  sequence: z.number().int().nonnegative(),
  startedAt: dateTimeSchema,
  endedAt: dateTimeSchema,
  durationMs: z.number().int().positive(),
  encoding: z.enum(["audio/pcm16le", "audio/wav"]),
  checksum: identifierSchema,
  base64Audio: z.string().min(1),
  consentRef: identifierSchema,
  traceId: identifierSchema,
  transcriptHint: z.string().max(4000).optional(),
  transcriptModelName: z.string().min(1).max(160).optional(),
  transcriptSource: z.string().min(1).max(80).optional(),
});

export type ContextEvent = z.infer<typeof contextEventSchema>;
export type CreateContextEventInput = z.infer<typeof createContextEventInputSchema>;
export type Situation = z.infer<typeof situationSchema>;
export type DecisionOption = z.infer<typeof decisionOptionSchema>;
export type DecisionRecord = z.infer<typeof decisionRecordSchema>;
export type WayfinderOutcome = z.infer<typeof wayfinderOutcomeSchema>;
export type ValueProfile = z.infer<typeof valueProfileSchema>;
export type ConsentGrant = z.infer<typeof consentGrantSchema>;
export type InterventionBudget = z.infer<typeof interventionBudgetSchema>;
export type InterventionPolicyResult = z.infer<typeof interventionPolicyResultSchema>;
export type WayfinderAuditEvent = z.infer<typeof wayfinderAuditEventSchema>;
export type VoiceCandidate = z.infer<typeof voiceCandidateSchema>;
export type VoiceAudioEventInput = z.infer<typeof voiceAudioEventInputSchema>;
