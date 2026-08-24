import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  coreEventSchema,
  corePermissionSchema,
  stateSnapshotSchema,
} from "@mindanchor/domain";
import { createId } from "../lib/utils.js";
import { CoreError } from "../core/core-errors.js";
import type { CoreRepository } from "../core/core-types.js";

type RequestWithContext = FastifyRequest & { authContext?: { userId: string } | null };
const requireUser = (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request as RequestWithContext).authContext?.userId;
  if (!userId) {
    reply.code(401);
    return null;
  }
  return userId;
};
const profileIdFor = (userId: string) => `profile:${userId}`;
const profileFor = async (core: CoreRepository, userId: string) => {
  const profileId = profileIdFor(userId);
  await core.ensureProfile({ profileId, userId, timezone: "UTC" });
  return profileId;
};
const coreEventInputSchema = coreEventSchema.omit({ id: true, profileId: true, userId: true, createdAt: true }).extend({
  purpose: z.string().optional(),
  scope: z.string().optional(),
});
const stateReportInputSchema = stateSnapshotSchema.omit({ id: true, profileId: true, userId: true, revision: true });

export const registerCoreRoutes = async (app: FastifyInstance, dependencies: { core: CoreRepository }) => {
  const { core } = dependencies;

  app.post("/v1/core/events", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const profileId = await profileFor(core, userId);
    const body = (request.body ?? {}) as Record<string, unknown>;
    const clientEventId = typeof request.headers["idempotency-key"] === "string" ? request.headers["idempotency-key"] : body.clientEventId;
    const input = coreEventInputSchema.parse({ ...body, clientEventId });
    const event = await core.appendEvent({ ...input, profileId, userId });
    reply.code(201);
    return event;
  });

  app.get("/v1/core/events", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const profileId = await profileFor(core, userId);
    const query = request.query as { from?: string; to?: string; limit?: string };
    return { events: await core.listEvents(profileId, userId, { from: query.from, to: query.to, limit: query.limit ? Number(query.limit) : undefined }) };
  });

  app.get("/v1/core/state/current", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    return { state: await core.getCurrentState(await profileFor(core, userId), userId) };
  });

  app.post("/v1/core/state/reports", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const profileId = await profileFor(core, userId);
    const body = (request.body ?? {}) as Record<string, unknown>;
    const input = stateReportInputSchema.parse(body);
    const expectedRevision = body.expectedRevision === undefined ? null : z.number().int().nonnegative().parse(body.expectedRevision);
    const state = await core.appendStateSnapshot({ ...input, profileId, userId, purpose: "core", scope: "write" }, expectedRevision);
    reply.code(201);
    return state;
  });

  app.get("/v1/core/life-compass", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    return core.getLifeCompass(await profileFor(core, userId), userId);
  });

  app.post("/v1/core/life-compass/candidates", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const profileId = await profileFor(core, userId);
    const body = z.object({ content: z.string().min(1).max(5000), evidenceEventIds: z.array(z.string().min(1)).optional() }).parse(request.body);
    const candidate = await core.createLifeCompassCandidate({ ...body, profileId, userId, purpose: "core", scope: "write" });
    reply.code(201);
    return candidate;
  });

  app.post("/v1/core/life-compass/candidates/:candidateId/confirm", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const body = z.object({ expectedVersion: z.number().int().nonnegative().nullable().default(null) }).parse(request.body ?? {});
    const candidateId = (request.params as { candidateId: string }).candidateId;
    return core.confirmLifeCompassCandidate(profileIdFor(userId), userId, candidateId, body.expectedVersion);
  });

  app.get("/v1/core/privacy", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    return { permissions: await core.listPermissions(await profileFor(core, userId), userId) };
  });

  app.patch("/v1/core/privacy/:purpose/:scope", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const profileId = await profileFor(core, userId);
    const params = request.params as { purpose: string; scope: string };
    const body = z.object({ status: z.enum(["granted", "paused", "revoked"]), dataLevel: z.enum(["P0", "P1", "P2", "P3"]) }).parse(request.body);
    return core.upsertPermission(corePermissionSchema.parse({ ...body, profileId, purpose: params.purpose, scope: params.scope, updatedAt: new Date().toISOString() }));
  });

  app.get("/v1/core/export", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    return core.exportProfile(await profileFor(core, userId), userId);
  });

  app.post("/v1/core/retention/run", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    await profileFor(core, userId);
    return core.runRetention(new Date().toISOString());
  });

  app.delete("/v1/core/data", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    return core.deleteProfile(profileIdFor(userId), userId);
  });
};

export const coreErrorStatus = (error: CoreError) => {
  if (["core_profile_scope_mismatch", "core_idempotency_conflict", "core_revision_conflict"].includes(error.code)) return 409;
  if (["core_permission_required", "core_p3_egress_blocked"].includes(error.code)) return 403;
  if (error.code === "core_not_found") return 404;
  return 500;
};

export const coreErrorResponse = (error: CoreError) => ({ error: error.code, message: error.message });
