import { z } from "zod";

const isoDateTimeSchema = z.string().datetime({ offset: true });
const identifierSchema = z.string().min(1);

export const healthSignalKindSchema = z.enum(["sleep_summary", "activity_summary", "resting_hr_summary"]);
export const healthMissingnessSchema = z.enum(["available", "missing", "delayed"]);
export const healthConsentScopeSchema = z.enum(["health_summary"]);
export const healthRetentionClassSchema = z.enum(["summary", "ephemeral"]);
export const healthValueUnitSchema = z.enum(["minutes", "count", "bpm"]);
export const energyBandSchema = z.enum(["low", "medium", "high"]);
export const calibrationOutcomeSchema = z.enum(["completed", "partially_completed", "skipped", "cancelled"]);

export const healthSignalSchema = z.object({
  signalKind: healthSignalKindSchema,
  sourcePlatform: z.enum(["android", "ios"]),
  sourceProvider: z.enum(["health_connect", "healthkit", "vendor_cloud", "vendor_sdk"]),
  sourceDevice: identifierSchema.max(120),
  capturedAt: isoDateTimeSchema,
  receivedAt: isoDateTimeSchema,
  windowStart: isoDateTimeSchema,
  windowEnd: isoDateTimeSchema,
  missingness: healthMissingnessSchema,
  consentScope: healthConsentScopeSchema,
  retentionClass: healthRetentionClassSchema,
  value: z.number().finite().nonnegative().optional(),
  unit: healthValueUnitSchema.optional(),
  confidence: z.number().min(0).max(1),
  evidenceRef: identifierSchema.max(240),
});

export const healthSummarySchema = z.object({
  sourcePlatform: z.enum(["android", "ios"]),
  sourceProvider: z.enum(["health_connect", "healthkit", "vendor_cloud", "vendor_sdk"]),
  sourceDevice: identifierSchema.max(120),
  capturedAt: isoDateTimeSchema,
  receivedAt: isoDateTimeSchema,
  windowStart: isoDateTimeSchema,
  windowEnd: isoDateTimeSchema,
  missingness: healthMissingnessSchema,
  consentScope: healthConsentScopeSchema,
  retentionClass: healthRetentionClassSchema,
  confidence: z.number().min(0).max(1),
  signals: z.array(healthSignalSchema).max(20),
  summary: z.string().min(1).max(400),
});

export const healthProvenanceFieldsSchema = z.object({
  sourceDevice: z.string().min(1).max(120).optional(),
  capturedAt: isoDateTimeSchema.optional(),
  receivedAt: isoDateTimeSchema.optional(),
  missingness: healthMissingnessSchema.optional(),
  consentScope: healthConsentScopeSchema.optional(),
  consentRef: identifierSchema.optional(),
  retentionClass: healthRetentionClassSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidenceRefs: z.array(identifierSchema.max(240)).max(20).optional(),
});

export const healthCalibrationRecordSchema = z.object({
  id: identifierSchema,
  userId: identifierSchema,
  windowStart: isoDateTimeSchema,
  windowEnd: isoDateTimeSchema,
  recommendation: z.enum(["continue", "reduced_load", "energy_recovery"]),
  predictedEnergyBand: energyBandSchema,
  actualEnergyBand: energyBandSchema,
  outcome: calibrationOutcomeSchema,
  userRating: z.number().int().min(1).max(5).optional(),
  absoluteError: z.number().min(0).max(1),
  evidenceRefs: z.array(identifierSchema.max(240)).max(20).default([]),
  createdAt: isoDateTimeSchema,
});

export type HealthSignal = z.infer<typeof healthSignalSchema>;
export type HealthSummary = z.infer<typeof healthSummarySchema>;
export type HealthCalibrationRecord = z.infer<typeof healthCalibrationRecordSchema>;
export type HealthMissingness = z.infer<typeof healthMissingnessSchema>;
export type EnergyBand = z.infer<typeof energyBandSchema>;
