import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { CoreError } from "../core/core-errors.js";
import type { CoreRepository } from "../core/core-types.js";
import { SingleBrainService } from "../services/single-brain-service.js";

type RequestWithAuth = FastifyRequest & { authContext?: { userId: string } | null };
const profileIdFor = (userId: string) => `profile:${userId}`;
const requireUser = (request: FastifyRequest, reply: FastifyReply) => {
  const userId = (request as RequestWithAuth).authContext?.userId;
  if (!userId) { reply.code(401); return null; }
  return userId;
};
const conversationIdParams = z.object({ conversationId: z.string().min(1) });
const sendBody = z.object({ content: z.string().min(1).max(12000), clientMessageId: z.string().min(1).max(200).optional(), dataBoundary: z.enum(["local_only", "cloud_allowed"]).optional() });

export const registerSingleBrainRoutes = async (app: FastifyInstance, dependencies: { core: CoreRepository; service: SingleBrainService; dataBoundary: "local_only" | "cloud_allowed" }) => {
  const { core, service, dataBoundary } = dependencies;
  const profileFor = async (userId: string) => { await core.ensureProfile({ profileId: profileIdFor(userId), userId, timezone: "UTC" }); return profileIdFor(userId); };
  const handleError = (error: unknown, reply: FastifyReply) => {
    if (!(error instanceof CoreError)) throw error;
    const status = error.code === "core_not_found" ? 404 : ["core_idempotency_conflict", "core_revision_conflict"].includes(error.code) ? 409 : ["core_permission_required", "core_p3_egress_blocked"].includes(error.code) ? 403 : 500;
    reply.code(status); return { error: error.code, message: error.message };
  };

  app.post("/v1/core/conversations", async (request, reply) => {
    const userId = requireUser(request, reply); if (!userId) return { message: "Authentication required." };
    const body = z.object({ title: z.string().max(200).optional() }).parse(request.body ?? {});
    const conversation = await core.createConversation({ profileId: await profileFor(userId), userId, title: body.title });
    reply.code(201); return conversation;
  });
  app.get("/v1/core/conversations", async (request, reply) => {
    const userId = requireUser(request, reply); if (!userId) return { message: "Authentication required." };
    return { conversations: await core.listConversations(await profileFor(userId), userId) };
  });
  app.get("/v1/core/conversations/:conversationId", async (request, reply) => {
    const userId = requireUser(request, reply); if (!userId) return { message: "Authentication required." };
    try {
      const params = conversationIdParams.parse(request.params);
      const conversation = await core.getConversation(profileIdFor(userId), userId, params.conversationId);
      const messages = await core.listConversationMessages(profileIdFor(userId), userId, params.conversationId);
      return { conversation, messages };
    } catch (error) { return handleError(error, reply); }
  });
  app.post("/v1/core/conversations/:conversationId/messages", async (request, reply) => {
    const userId = requireUser(request, reply); if (!userId) return { message: "Authentication required." };
    try {
      const params = conversationIdParams.parse(request.params);
      const body = sendBody.parse(request.body ?? {});
      const headerKey = request.headers["idempotency-key"];
      const clientMessageId = typeof headerKey === "string" && headerKey.length > 0 ? headerKey : body.clientMessageId;
      const profileId = profileIdFor(userId);
      const before = clientMessageId ? (await core.listConversationMessages(profileId, userId, params.conversationId)).some((message) => message.role === "user" && message.clientMessageId === clientMessageId) : false;
      const result = await service.sendMessage({ profileId, userId, conversationId: params.conversationId, content: body.content, clientMessageId, dataBoundary: body.dataBoundary ?? dataBoundary });
      if (result.assistantMessage.status === "blocked") { reply.code(409); }
      else if (result.assistantMessage.status === "failed") { reply.code(503); }
      else { reply.code(before ? 200 : 201); }
      return result;
    } catch (error) { return handleError(error, reply); }
  });
  app.post("/v1/core/conversations/:conversationId/archive", async (request, reply) => {
    const userId = requireUser(request, reply); if (!userId) return { message: "Authentication required." };
    try { const params = conversationIdParams.parse(request.params); return await core.archiveConversation(profileIdFor(userId), userId, params.conversationId); }
    catch (error) { return handleError(error, reply); }
  });
  app.delete("/v1/core/conversations/:conversationId", async (request, reply) => {
    const userId = requireUser(request, reply); if (!userId) return { message: "Authentication required." };
    try { const params = conversationIdParams.parse(request.params); await core.deleteConversation(profileIdFor(userId), userId, params.conversationId); reply.code(204); return null; }
    catch (error) { return handleError(error, reply); }
  });
};
