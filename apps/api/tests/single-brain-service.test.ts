import { describe, expect, it, vi } from "vitest";
import type { ContextPacket, ConversationMessage } from "@mindanchor/domain";
import type { CoreConversation, CoreRepository } from "../src/core/core-types.js";
import { CoreError } from "../src/core/core-errors.js";
import type { SingleBrainModelAdapter, SingleBrainModelResult } from "../src/services/single-brain-model.js";
import { ContextBuilder } from "../src/core/context-builder.js";
import { SingleBrainService } from "../src/services/single-brain-service.js";

const packet = (overrides: Partial<ContextPacket> = {}): ContextPacket => ({
  conversationId: "conv-1", profileId: "profile:u-1", userId: "u-1", userMessage: "hello",
  dataBoundary: "cloud_allowed", lifeCompass: null, currentState: null, recentEvents: [], history: [],
  redactions: ["P3_life_compass_omitted"], sourceEventIds: [], characterCount: 100, contextHash: "hash-1",
  createdAt: "2026-08-24T10:00:00.000Z", ...overrides,
});

const conversation: CoreConversation = { id: "conv-1", profileId: "profile:u-1", userId: "u-1", title: "新对话", status: "active", createdAt: "2026-08-24T10:00:00.000Z", updatedAt: "2026-08-24T10:00:00.000Z" };
const message = (role: "user" | "assistant", content: string, id: string, status: "completed" | "failed" | "blocked" = "completed", clientMessageId?: string): ConversationMessage => ({ id, conversationId: "conv-1", profileId: "profile:u-1", userId: "u-1", role, content, status, clientMessageId, modelTier: role === "assistant" ? "stub" : null, contextHash: role === "assistant" ? "hash-1" : null, redactions: [], failureCode: status === "completed" ? null : "provider_error", createdAt: "2026-08-24T10:00:00.000Z" });

function fixture(result: SingleBrainModelResult = { status: "completed", response: "好的，我们一起梳理。", modelTier: "stub", adapterDecision: { adapter: "stub" } }) {
  const traces: Array<{ event: string; payload?: Record<string, unknown> }> = [];
  const messages: ConversationMessage[] = [];
  const repo = {
    getConversation: vi.fn(async () => conversation),
    appendConversationMessage: vi.fn(async (input: { clientMessageId?: string; content: string }) => {
      const existing = messages.find((item) => item.role === "user" && item.clientMessageId === input.clientMessageId);
      if (existing) return existing;
      const next = message("user", input.content, `user-${messages.length + 1}`, "completed", input.clientMessageId);
      messages.push(next); return next;
    }),
    listConversationMessages: vi.fn(async () => [...messages]),
    completeConversationMessage: vi.fn(async (...args: unknown[]) => {
      const input = args.at(-1) as { content: string; modelTier: string; contextHash: string; redactions: string[] };
      const next = message("assistant", input.content, `assistant-${messages.length + 1}`); messages.push(next); return next;
    }),
    failConversationMessage: vi.fn(async (...args: unknown[]) => {
      const input = args.at(-1) as { status: "failed" | "blocked"; failureCode: string; redactions: string[] };
      const next = message("assistant", "回复暂时不可用。", `assistant-${messages.length + 1}`, input.status); next.failureCode = input.failureCode; next.redactions = input.redactions; messages.push(next); return next;
    }),
    addSystemTrace: vi.fn(async (input: { event: string; payload?: Record<string, unknown> }) => traces.push(input)),
  } as unknown as CoreRepository;
  const contextBuilder = { build: vi.fn(async () => packet()) } as unknown as ContextBuilder;
  const adapter = { locality: "stub", generate: vi.fn(async () => result) } as unknown as SingleBrainModelAdapter;
  const service = new SingleBrainService(repo, contextBuilder, adapter, () => "2026-08-24T10:00:00.000Z", () => "fixed-id");
  return { service, repo, contextBuilder, adapter, messages, traces };
}

const input = { profileId: "profile:u-1", userId: "u-1", conversationId: "conv-1", content: "hello", dataBoundary: "cloud_allowed" as const, clientMessageId: "client-1" };

describe("SingleBrainService", () => {
  it("returns core_not_found when conversation is unavailable", async () => {
    const f = fixture(); (f.repo.getConversation as ReturnType<typeof vi.fn>).mockRejectedValue(new CoreError("core_not_found"));
    await expect(f.service.sendMessage(input)).rejects.toMatchObject({ code: "core_not_found" });
  });

  it("persists the user before building context and generating", async () => {
    const f = fixture();
    await f.service.sendMessage(input);
    expect(f.repo.appendConversationMessage).toHaveBeenCalled();
    expect((f.repo.appendConversationMessage as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]).toBeLessThan((f.contextBuilder.build as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]);
    expect((f.contextBuilder.build as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]).toBeLessThan((f.adapter.generate as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]);
  });

  it("writes a completed assistant terminal message", async () => {
    const f = fixture(); const result = await f.service.sendMessage(input);
    expect(result.assistantMessage.status).toBe("completed"); expect(result.assistantMessage.content).toContain("一起梳理");
  });

  it("writes failed terminal message without fabricating model response", async () => {
    const f = fixture({ status: "failed", failureCode: "model_unavailable", modelTier: "remote", adapterDecision: {} });
    const result = await f.service.sendMessage(input);
    expect(result.assistantMessage.status).toBe("failed"); expect(result.assistantMessage.failureCode).toBe("model_unavailable"); expect(result.assistantMessage.content).toBe("回复暂时不可用。");
  });

  it("writes blocked terminal message", async () => {
    const f = fixture({ status: "blocked", failureCode: "p3_local_only_unavailable", modelTier: "remote", adapterDecision: {} });
    const result = await f.service.sendMessage({ ...input, dataBoundary: "local_only" });
    expect(result.assistantMessage.status).toBe("blocked"); expect(result.assistantMessage.failureCode).toBe("p3_local_only_unavailable");
  });

  it("converts adapter exceptions to provider_error and records trace", async () => {
    const f = fixture(); (f.adapter.generate as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("timeout"));
    const result = await f.service.sendMessage(input);
    expect(result.assistantMessage.status).toBe("failed"); expect(result.assistantMessage.failureCode).toBe("provider_error");
    expect(f.traces).toHaveLength(1); expect(f.traces[0].payload).toMatchObject({ status: "failed", dataBoundary: "cloud_allowed", modelTier: "stub" });
  });

  it("keeps trace free of prompt and response text", async () => {
    const f = fixture(); await f.service.sendMessage(input);
    const serialized = JSON.stringify(f.traces[0]); expect(serialized).not.toContain("hello"); expect(serialized).not.toContain("一起梳理");
    expect(f.traces[0].payload).toMatchObject({ contextHash: "hash-1", redactions: ["P3_life_compass_omitted"] });
  });

  it("returns the same user and assistant pair for an idempotent retry", async () => {
    const f = fixture(); const first = await f.service.sendMessage(input); const second = await f.service.sendMessage(input);
    expect(second.userMessage.id).toBe(first.userMessage.id); expect(second.assistantMessage.id).toBe(first.assistantMessage.id); expect(f.adapter.generate).toHaveBeenCalledTimes(1);
  });
});
