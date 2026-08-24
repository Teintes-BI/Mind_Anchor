import { z } from "zod";

const coreIdentifierSchema = z.string().min(1);
const coreIsoDateTimeSchema = z.string().datetime({ offset: true });
const coreUserIdSchema = z.string().min(1).default("demo-user");

export const corePrivacyLevelSchema = z.enum(["P0", "P1", "P2", "P3"]);
export const coreEventSourceSchema = z.enum([
  "user",
  "desktop",
  "web",
  "mobile",
  "watch",
  "glasses",
  "system",
]);
export const coreEventTypeSchema = z.enum([
  "state_report",
  "activity",
  "task_candidate",
  "check_in",
  "interaction",
  "device_signal",
]);
export const coreMemoryBoundarySchema = z.enum(["local_only", "cloud_allowed"]);

export const coreEventSchema = z.object({
  id: coreIdentifierSchema,
  profileId: coreIdentifierSchema,
  userId: coreUserIdSchema,
  clientEventId: z.string().min(1).optional(),
  eventType: coreEventTypeSchema,
  occurredAt: coreIsoDateTimeSchema,
  createdAt: coreIsoDateTimeSchema,
  source: coreEventSourceSchema,
  payload: z.record(z.unknown()),
  privacyLevel: corePrivacyLevelSchema,
  retentionClass: z.string().min(1).default("P1_standard"),
  expiresAt: coreIsoDateTimeSchema.nullable().default(null),
  confidence: z.number().min(0).max(1),
});

export const stateSnapshotSchema = z.object({
  id: coreIdentifierSchema,
  profileId: coreIdentifierSchema,
  userId: coreUserIdSchema,
  energy: z.number().min(0).max(100),
  emotion: z.number().min(0).max(100),
  cognitiveLoad: z.number().min(0).max(100),
  mentalNoise: z.number().min(0).max(100),
  focusReadiness: z.number().min(0).max(100),
  physicalFatigue: z.number().min(0).max(100),
  recoveryNeed: z.number().min(0).max(100),
  source: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
  userConfirmed: z.boolean(),
  revision: z.number().int().positive(),
  capturedAt: coreIsoDateTimeSchema,
});

export const lifeCompassCandidateSchema = z.object({
  id: coreIdentifierSchema,
  profileId: coreIdentifierSchema,
  userId: coreUserIdSchema,
  content: z.string().min(1).max(5000),
  evidenceEventIds: z.array(coreIdentifierSchema).default([]),
  status: z.enum(["pending", "rejected"]),
  createdAt: coreIsoDateTimeSchema,
});

export const lifeCompassVersionSchema = z.object({
  id: coreIdentifierSchema,
  profileId: coreIdentifierSchema,
  userId: coreUserIdSchema,
  content: z.string().min(1).max(5000),
  version: z.number().int().positive(),
  confirmedAt: coreIsoDateTimeSchema,
  supersedesId: coreIdentifierSchema.nullable(),
});

export const corePermissionSchema = z.object({
  profileId: coreIdentifierSchema,
  purpose: z.string().min(1),
  scope: z.string().min(1),
  status: z.enum(["granted", "paused", "revoked"]),
  dataLevel: corePrivacyLevelSchema,
  updatedAt: coreIsoDateTimeSchema,
});

export const coreExportSchema = z.object({
  exportedAt: coreIsoDateTimeSchema,
  profile: z.record(z.unknown()),
  events: z.array(coreEventSchema),
  stateSnapshots: z.array(stateSnapshotSchema),
  lifeCompassCandidates: z.array(lifeCompassCandidateSchema),
  lifeCompassVersions: z.array(lifeCompassVersionSchema),
  permissions: z.array(corePermissionSchema),
  systemTraceCount: z.number().int().nonnegative(),
});

export type CoreEvent = z.infer<typeof coreEventSchema>;
export type StateSnapshot = z.infer<typeof stateSnapshotSchema>;
export type LifeCompassCandidate = z.infer<typeof lifeCompassCandidateSchema>;
export type LifeCompassVersion = z.infer<typeof lifeCompassVersionSchema>;
export type CorePermission = z.infer<typeof corePermissionSchema>;
export type CoreExport = z.infer<typeof coreExportSchema>;
