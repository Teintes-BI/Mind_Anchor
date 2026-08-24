import { randomUUID } from "node:crypto";
import type { GatewayTraceContext, ConversationMessage, ContextPacket } from "@mindanchor/domain";
import { buildGatewayTraceContext } from "../lib/openclaw-trace.js";
import { CoreError } from "../core/core-errors.js";
import type { CoreRepository } from "../core/core-types.js";
import type { ContextBuilder } from "../core/context-builder.js";
import type { SingleBrainModelAdapter, SingleBrainModelResult } from "./single-brain-model.js";

export const SINGLE_BRAIN_SYSTEM_PROMPT_VERSION = "single-brain-v0.1-b-1";
export const SINGLE_BRAIN_SYSTEM_PROMPT = [
  "你是 Comma 的单一温和声音。先理解当前问题，再提出可选的下一步，不命令用户。",
  "不诊断，不声称知道未提供的事实；Life Compass 只能作为方向参考，不能擅自修改。",
  "遇到高风险、医疗或自伤内容，只给安全转介和人工确认建议。",
  "只返回 {response} JSON。",
].join("\n");

export type SendMessageInput = {
  profileId: string;
  userId: string;
  conversationId: string;
  content: string;
  clientMessageId?: string;
  dataBoundary: "local_only" | "cloud_allowed";
};

export type SendMessageResult = {
  userMessage: ConversationMessage;
  assistantMessage: ConversationMessage;
  packetMeta: Pick<ContextPacket, "contextHash" | "redactions" | "dataBoundary">;
};

type Clock = () => string;
type IdFactory = () => string;

const safeDecision = (decision: Record<string, unknown>) => {
  const allowed = new Set(["adapter", "offline", "locality", "blocked", "success", "reason", "dataBoundary", "systemPromptVersion"]);
  return Object.fromEntries(Object.entries(decision).filter(([key, value]) => allowed.has(key) && ["string", "boolean", "number"].includes(typeof value)));
};

export class SingleBrainService {
  constructor(
    private readonly repository: CoreRepository,
    private readonly contextBuilder: ContextBuilder,
    private readonly adapter: SingleBrainModelAdapter,
    private readonly clock: Clock = () => new Date().toISOString(),
    private readonly idFactory: IdFactory = randomUUID,
  ) {}

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const conversation = await this.repository.getConversation(input.profileId, input.userId, input.conversationId);
    if (conversation.status !== "active") throw new CoreError("core_not_found");

    const userMessage = await this.repository.appendConversationMessage({
      profileId: input.profileId,
      userId: input.userId,
      conversationId: input.conversationId,
      role: "user",
      content: input.content,
      clientMessageId: input.clientMessageId,
    });

    // Repository idempotency returns the original user row. If a terminal
    // assistant already follows it, return the original pair without invoking
    // context construction or the provider a second time.
    const existingMessages = await this.repository.listConversationMessages(input.profileId, input.userId, input.conversationId);
    const existingAssistant = existingMessages.find((message) => message.role === "assistant" && this.isAssistantFor(message, userMessage, existingMessages));
    if (existingAssistant) {
      return {
        userMessage,
        assistantMessage: existingAssistant,
        packetMeta: { contextHash: existingAssistant.contextHash ?? "idempotent-replay", redactions: existingAssistant.redactions, dataBoundary: input.dataBoundary },
      };
    }

    let packet: ContextPacket | null = null;
    let result: SingleBrainModelResult;
    try {
      packet = await this.contextBuilder.build({
        profileId: input.profileId,
        userId: input.userId,
        conversationId: input.conversationId,
        userMessage: input.content,
        dataBoundary: input.dataBoundary,
      });
      const traceContext = this.buildTraceContext(input.userId);
      result = await this.adapter.generate({ packet, systemPromptVersion: SINGLE_BRAIN_SYSTEM_PROMPT_VERSION, traceContext });
    } catch {
      const redactions = packet?.redactions ?? [];
      const assistantMessage = await this.repository.failConversationMessage(input.profileId, input.userId, userMessage.id, { status: "failed", failureCode: "provider_error", redactions });
      await this.writeTrace(input, userMessage.id, assistantMessage.id, packet, assistantMessage.status, "provider_error", undefined);
      return { userMessage, assistantMessage, packetMeta: { contextHash: packet?.contextHash ?? "unavailable", redactions, dataBoundary: input.dataBoundary } };
    }

    const redactions = packet.redactions;
    let assistantMessage: ConversationMessage;
    if (result.status === "completed") {
      assistantMessage = await this.repository.completeConversationMessage(input.profileId, input.userId, userMessage.id, {
        content: result.response,
        modelTier: result.modelTier,
        contextHash: packet.contextHash,
        redactions,
      });
    } else {
      assistantMessage = await this.repository.failConversationMessage(input.profileId, input.userId, userMessage.id, {
        status: result.status,
        failureCode: result.failureCode,
        redactions,
      });
    }
    await this.writeTrace(input, userMessage.id, assistantMessage.id, packet, result.status, result.status === "completed" ? undefined : result.failureCode, result);
    return { userMessage, assistantMessage, packetMeta: { contextHash: packet.contextHash, redactions, dataBoundary: packet.dataBoundary } };
  }

  private buildTraceContext(userId: string): GatewayTraceContext {
    return buildGatewayTraceContext({ traceId: this.idFactory(), requestTraceId: this.idFactory(), operation: "single_brain.generate", workflow: "single_brain", userId });
  }

  private isAssistantFor(assistant: ConversationMessage, user: ConversationMessage, all: ConversationMessage[]) {
    if (assistant.role !== "assistant") return false;
    const userIndex = all.findIndex((item) => item.id === user.id);
    const assistantIndex = all.findIndex((item) => item.id === assistant.id);
    return assistantIndex > userIndex;
  }

  private async writeTrace(input: SendMessageInput, userMessageId: string, assistantMessageId: string, packet: ContextPacket | null, status: string, failureCode?: string, result?: SingleBrainModelResult) {
    const traceId = this.idFactory();
    const payload: Record<string, unknown> = {
      decisionId: this.idFactory(),
      traceId,
      userMessageId,
      assistantMessageId,
      contextHash: packet?.contextHash ?? "unavailable",
      dataBoundary: input.dataBoundary,
      modelTier: result?.modelTier ?? this.adapter.locality,
      status,
      redactions: packet?.redactions ?? [],
      systemPromptVersion: SINGLE_BRAIN_SYSTEM_PROMPT_VERSION,
      createdAt: this.clock(),
    };
    if (failureCode) payload.failureCode = failureCode;
    if (result?.adapterDecision) payload.adapterDecision = safeDecision(result.adapterDecision);
    await this.repository.addSystemTrace({ profileId: input.profileId, userId: input.userId, traceId, event: "single_brain.message", payload });
  }
}
