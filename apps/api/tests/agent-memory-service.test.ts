import { describe, expect, it } from "vitest";
import {
  agentMemoryContextBundleSchema,
  agentMemoryProposalSchema,
  agentRuntimeDescriptorSchema,
  agentTeamPersonaMetadata,
  memoryScopeSchema,
} from "@mindanchor/domain";

describe("native agent memory contracts", () => {
  it("parses supported memory scopes and rejects unknown scopes", () => {
    expect(memoryScopeSchema.parse("preferences")).toBe("preferences");
    expect(() => memoryScopeSchema.parse("unknown-scope")).toThrow();
  });

  it("parses an agent memory context bundle", () => {
    const parsed = agentMemoryContextBundleSchema.parse({
      userId: "demo-user",
      agentId: "director-agent",
      scopes: ["preferences", "recentContext"],
      identity: [],
      preferences: [
        {
          memoryId: "memory-1",
          kind: "preference",
          summary: "用户偏好短而直接的提醒。",
          source: "gateway-memory",
          confidence: 0.82,
          updatedAt: "2026-03-22T08:00:00.000Z",
          recallAllowed: true,
        },
      ],
      habits: [],
      constraints: [],
      recentContext: [
        {
          memoryId: "memory-2",
          kind: "recent_context",
          summary: "今天上午连续会议较多。",
          source: "gateway-memory",
          confidence: 0.7,
          updatedAt: "2026-03-22T08:05:00.000Z",
          recallAllowed: true,
        },
      ],
      metadata: {
        activeMemoryCount: 2,
        proposalCount: 1,
        retrievedAt: "2026-03-22T08:06:00.000Z",
        scopeEntryCounts: {
          preferences: 1,
          habits: 0,
          constraints: 0,
          recentContext: 1,
        },
        sourceCounts: {
          "gateway-memory": 1,
          "front-agent-state": 1,
        },
      },
    });

    expect(parsed.agentId).toBe("director-agent");
    expect(parsed.scopes).toEqual(["preferences", "recentContext"]);
    expect(parsed.preferences[0]?.summary).toContain("短而直接");
    expect(parsed.metadata.activeMemoryCount).toBe(2);
    expect(parsed.metadata.scopeEntryCounts?.preferences).toBe(1);
    expect(parsed.metadata.sourceCounts?.["gateway-memory"]).toBe(1);
  });

  it("parses an agent memory proposal", () => {
    const parsed = agentMemoryProposalSchema.parse({
      proposalId: "proposal-1",
      userId: "demo-user",
      sourceAgent: "companion-agent",
      targetScope: "preferences",
      kind: "preference",
      summary: "用户在压力高时更适合更温和的建议语气。",
      rationale: "多轮对话中反复表现出对强指令语气的抗拒。",
      sourceTurnRef: "turn-1",
      confidence: 0.76,
      status: "proposal",
      createdAt: "2026-03-22T08:10:00.000Z",
    });

    expect(parsed.sourceAgent).toBe("companion-agent");
    expect(parsed.targetScope).toBe("preferences");
    expect(parsed.status).toBe("proposal");
  });

  it("parses a runtime descriptor for a front-capable agent", () => {
    const parsed = agentRuntimeDescriptorSchema.parse({
      agentId: "director-agent",
      runtimeAgentId: "picard-runtime-agent",
      displayName: "Picard",
      soulFilePath: "openclaw/souls/picard.md",
      memoryScopes: ["preferences", "habits", "constraints", "recentContext"],
      canFront: true,
      canConsult: true,
      canWritePlans: false,
      canGovernMemory: false,
    });

    expect(parsed.runtimeAgentId).toBe("picard-runtime-agent");
    expect(parsed.canFront).toBe(true);
    expect(parsed.memoryScopes).toContain("recentContext");
  });

  it("declares allowed memory scopes for every agent persona", () => {
    const entries = Object.values(agentTeamPersonaMetadata);

    expect(entries).toHaveLength(6);
    entries.forEach((entry) => {
      expect(entry.runtimeAgentId).toEqual(expect.any(String));
      expect(entry.memoryScopes.length).toBeGreaterThan(0);
      entry.memoryScopes.forEach((scope) => {
        expect(memoryScopeSchema.parse(scope)).toBe(scope);
      });
      expect(entry.canConsult).toBeTypeOf("boolean");
      expect(entry.canWritePlans).toBeTypeOf("boolean");
      expect(entry.canGovernMemory).toBeTypeOf("boolean");
    });

    expect(agentTeamPersonaMetadata.picard.canFront).toBe(true);
    expect(agentTeamPersonaMetadata.jarvis.canWritePlans).toBe(true);
    expect(agentTeamPersonaMetadata.data.canGovernMemory).toBe(true);
    expect(agentTeamPersonaMetadata.troi.memoryScopes).toEqual(["preferences", "recentContext"]);
  });
});
