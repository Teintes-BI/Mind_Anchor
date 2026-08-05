import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  confirmSituationInputSchema,
  createContextEventInputSchema,
  createDecisionInputSchema,
  decisionOptionSchema,
  updateConsentInputSchema,
  updateOutcomeInputSchema,
  wayfinderOutcomeSchema,
} from "@mindanchor/domain";
import { createId } from "../lib/utils.js";
import { WayfinderConsentService } from "../services/wayfinder/consent-service.js";
import { WayfinderDecisionService } from "../services/wayfinder/decision-service.js";
import { WayfinderRepository } from "../services/wayfinder/wayfinder-repository.js";
import { WayfinderSituationService } from "../services/wayfinder/situation-service.js";

type RequestWithContext = FastifyRequest & {
  authContext?: { userId: string } | null;
  mindanchorTraceId?: string;
};

const requireUser = (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request as RequestWithContext).authContext?.userId;
  if (!userId) {
    reply.code(401);
    return null;
  }
  return userId;
};

const traceFor = (request: FastifyRequest) => (request as RequestWithContext).mindanchorTraceId ?? createId();

export const registerWayfinderRoutes = async (
  app: FastifyInstance,
  dependencies: { repository: WayfinderRepository; consent: WayfinderConsentService; situations: WayfinderSituationService; decisions: WayfinderDecisionService },
) => {
  const { repository, consent, situations, decisions } = dependencies;

  app.post("/wayfinder/events", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const body = (request.body ?? {}) as Record<string, unknown>;
    const idempotencyKey = typeof request.headers["idempotency-key"] === "string" ? request.headers["idempotency-key"] : undefined;
    const payload = createContextEventInputSchema.parse({ ...body, userId, clientEventId: body.clientEventId ?? idempotencyKey });
    consent.assertGranted(userId, payload.consentRef);
    return situations.ingestEvent(payload);
  });

  app.get("/wayfinder/situations/:situationId", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const situationId = (request.params as { situationId: string }).situationId;
    const situation = situations.get(userId, situationId);
    if (!situation) return reply.code(404).send({ message: "Wayfinder situation not found." });
    return situation;
  });

  app.post("/wayfinder/situations/:situationId/confirm", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const situationId = (request.params as { situationId: string }).situationId;
    if (!situations.get(userId, situationId)) return reply.code(404).send({ message: "Wayfinder situation not found." });
    const payload = confirmSituationInputSchema.parse(request.body);
    const situation = await situations.confirm(userId, situationId, payload.status);
    return { situation, fastStatus: "completed", fullStatus: payload.status === "confirmed" ? "pending" : "cancelled" };
  });

  app.get("/wayfinder/situations/:situationId/options", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const situationId = (request.params as { situationId: string }).situationId;
    const situation = situations.get(userId, situationId);
    if (!situation) return reply.code(404).send({ message: "Wayfinder situation not found." });
    return { situationId, status: situation.status, options: situations.listOptions(userId, situationId), fullStatus: "pending" };
  });

  app.post("/wayfinder/situations/:situationId/options", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const situationId = (request.params as { situationId: string }).situationId;
    const situation = situations.get(userId, situationId);
    if (!situation) return reply.code(404).send({ message: "Wayfinder situation not found." });
    if (situation.status !== "confirmed") return reply.code(409).send({ message: "Confirm the situation before saving options." });
    const options = (request.body as { options?: unknown })?.options;
    if (!Array.isArray(options)) return reply.code(400).send({ message: "options must be an array." });
    return { options: await situations.saveOptions(userId, situationId, options.map((option) => decisionOptionSchema.parse(option))) };
  });

  app.post("/wayfinder/decisions", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const body = (request.body ?? {}) as Record<string, unknown>;
    const input = createDecisionInputSchema.omit({ userId: true }).parse({ ...body, userId });
    const decision = await decisions.recordDecision(userId, { ...input, approvalAcknowledged: body.approvalAcknowledged === true });
    return reply.code(201).send(decision);
  });

  const recordOutcome = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const decisionId = (request.params as { decisionId: string }).decisionId;
    const input = updateOutcomeInputSchema.parse(request.body);
    return decisions.recordOutcome(userId, decisionId, input);
  };
  app.patch("/wayfinder/decisions/:decisionId/outcome", recordOutcome);
  app.post("/wayfinder/decisions/:decisionId/reflect", recordOutcome);

  app.get("/wayfinder/decisions", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const limit = Number((request.query as { limit?: string }).limit ?? 100);
    return { decisions: decisions.listHistory(userId, Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 100) };
  });

  app.get("/wayfinder/consent", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    return { grants: consent.list(userId) };
  });

  app.patch("/wayfinder/consent/:source", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const source = (request.params as { source: string }).source;
    const payload = updateConsentInputSchema.parse({ ...(request.body as Record<string, unknown>), source });
    return consent.upsert(userId, payload, traceFor(request));
  });

  app.post("/wayfinder/export", async (request, reply) => {
    const userId = requireUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    return {
      exportedAt: new Date().toISOString(),
      userId,
      contextEvents: repository.listContextEvents(userId),
      situations: repository.listSituations(userId),
      options: repository.listSituations(userId).flatMap((situation) => repository.listOptions(userId, situation.id)),
      decisions: repository.listDecisionHistory(userId),
      outcomes: repository.listOutcomes(userId),
      consent: repository.listConsentGrants(userId),
    };
  });
};
