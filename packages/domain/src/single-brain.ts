import { z } from "zod";

const identifierSchema = z.string().min(1);
const dateTimeSchema = z.string().datetime({ offset: true });

export const conversationRoleSchema = z.enum(["user", "assistant", "system"]);
export const conversationMessageStatusSchema = z.enum(["pending", "completed", "failed", "blocked"]);
export const conversationStatusSchema = z.enum(["active", "archived", "deleted"]);
export const contextBoundarySchema = z.enum(["local_only", "cloud_allowed"]);
export const singleBrainGenerationStatusSchema = z.enum(["completed", "failed", "blocked"]);

export const conversationMessageSchema = z.object({
  id: identifierSchema,
  conversationId: identifierSchema,
  profileId: identifierSchema,
  userId: identifierSchema,
  role: conversationRoleSchema,
  content: z.string().min(1).max(12000),
  status: z.enum(["completed", "failed", "blocked"]),
  clientMessageId: identifierSchema.optional(),
  modelTier: z.string().min(1).nullable().default(null),
  contextHash: z.string().min(1).nullable().default(null),
  redactions: z.array(z.string()).default([]),
  failureCode: z.string().min(1).nullable().default(null),
  createdAt: dateTimeSchema,
});

const contextEventSchema = z
  .object({
    id: identifierSchema,
    occurredAt: dateTimeSchema,
    type: z.string().min(1),
    summary: z.string().min(1).max(500),
  })
  .strict();

export const contextPacketSchema = z.object({
  conversationId: identifierSchema,
  profileId: identifierSchema,
  userId: identifierSchema,
  userMessage: z.string().min(1).max(12000),
  boundary: contextBoundarySchema,
  lifeCompass: z.string().max(5000).nullable(),
  currentState: z.record(z.unknown()).nullable(),
  recentEvents: z.array(contextEventSchema).max(12),
  redactions: z.array(z.string()).default([]),
  sourceEventIds: z.array(identifierSchema).default([]),
  characterCount: z.number().int().min(0).max(24000),
  contextHash: z.string().min(1),
  createdAt: dateTimeSchema,
});

export const singleBrainGenerationSchema = z
  .object({
    id: identifierSchema,
    conversationId: identifierSchema,
    profileId: identifierSchema,
    userId: identifierSchema,
    status: singleBrainGenerationStatusSchema,
    response: z.string().min(1).max(12000).nullable().default(null),
    userFacingNote: z.string().max(500).optional(),
    createdAt: dateTimeSchema,
  })
  .superRefine((value, context) => {
    if (value.status === "completed" && value.response === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["response"],
        message: "Completed generations require a response",
      });
    }
  });

export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
export type ContextPacket = z.infer<typeof contextPacketSchema>;
export type SingleBrainGeneration = z.infer<typeof singleBrainGenerationSchema>;
