import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { decisionOptionSchema } from "@mindanchor/domain";
import { createLocalOpenClawServer } from "../../../openclaw/local-runtime/server.mjs";
import { nativeOpenClawAgentRegistry } from "../../../openclaw/runtime/agent-registry.mjs";
import { frameWayfinderSituation } from "../../../openclaw/runtime/workers/wayfinder-situation-worker.mjs";
import { architectWayfinderOptions } from "../../../openclaw/runtime/workers/wayfinder-option-worker.mjs";
import { reflectWayfinderDecision } from "../../../openclaw/runtime/workers/wayfinder-reflection-worker.mjs";
import {
  WAYFINDER_PERSPECTIVE_PACK_IDS,
  WAYFINDER_PERSPECTIVE_PACKS,
} from "../../../openclaw/runtime/wayfinder-perspective-packs.mjs";

const forbiddenKeys = new Set(["rawAudio", "rawVideo", "cameraFrame", "originalTranscript", "thirdPartyConversation"]);
const assertNoForbiddenFields = (value: unknown) => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    expect(forbiddenKeys.has(key), `forbidden field ${key}`).toBe(false);
    assertNoForbiddenFields(child);
  }
};

describe("Wayfinder OpenClaw worker contracts", () => {
  const runtimes: Array<ReturnType<typeof createLocalOpenClawServer>> = [];

  afterEach(async () => {
    await Promise.all(
      runtimes.splice(0).map(
        (runtime) =>
          new Promise<void>((resolve, reject) => runtime.server.close((error) => (error ? reject(error) : resolve()))),
      ),
    );
  });

  it("validates the three versioned skill schemas and generated outputs", async () => {
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const schema = async (name: string) => ajv.compile(JSON.parse(await readFile(join(process.cwd(), "..", "..", "openclaw", "skills", name), "utf8")));
    const situation = frameWayfinderSituation({
      traceId: "trace-situation",
      summary: "Prepare a proposal",
      evidenceRefs: ["event-1"],
      confidence: 0.8,
      riskLevel: "low",
      rawAudio: "must not be copied",
    });
    const situationValid = (await schema("situation-framing-skill.schema.json"))(situation);
    expect(situationValid).toBe(true);

    const options = architectWayfinderOptions({
      traceId: "trace-options",
      userId: "user-a",
      situation: { id: "situation-1", summary: situation.summary, riskLevel: "high" },
      evidenceRefs: ["event-1"],
    });
    expect((await schema("option-architecture-skill.schema.json"))(options)).toBe(true);
    expect(options.options).toHaveLength(3);
    expect(options.options[0]?.consultedSkills).toEqual(WAYFINDER_PERSPECTIVE_PACK_IDS);
    for (const option of options.options) {
      expect(decisionOptionSchema.parse(option).requiresApproval).toBe(true);
    }

    const reflection = reflectWayfinderDecision({
      traceId: "trace-reflection",
      decision: { id: "decision-1" },
      outcomes: [{ summary: "Started the outline", predictionError: "none" }],
      evidenceRefs: ["outcome-1"],
      riskLevel: "low",
    });
    expect((await schema("decision-outcome-skill.schema.json"))(reflection)).toBe(true);
    assertNoForbiddenFields({ situation, options, reflection });
  });

  it("registers four versioned perspective packs with provenance and scope boundaries", () => {
    expect(WAYFINDER_PERSPECTIVE_PACKS).toHaveLength(4);
    expect(WAYFINDER_PERSPECTIVE_PACK_IDS).toEqual([
      "values_clarification@1.0.0",
      "systems_perspective@1.0.0",
      "scientific_reasoning@1.0.0",
      "energy_recovery@1.0.0",
    ]);
    for (const pack of WAYFINDER_PERSPECTIVE_PACKS) {
      expect(pack.source.kind).toBe("internal_synthesis");
      expect(pack.source.citationPolicy).toMatch(/never|do not|no /i);
      expect(pack.applicableScopes.length).toBeGreaterThan(0);
      expect(pack.disabledScopes.length).toBeGreaterThan(0);
      expect(pack.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("exposes Wayfinder workers through registry and local runtime without execution authority", async () => {
    expect(nativeOpenClawAgentRegistry.find((agent) => agent.wayfinderWorker === "wayfinder-situation-worker")).toBeDefined();
    expect(nativeOpenClawAgentRegistry.find((agent) => agent.wayfinderWorker === "wayfinder-option-worker")).toBeDefined();
    expect(nativeOpenClawAgentRegistry.find((agent) => agent.wayfinderWorker === "wayfinder-reflection-worker")).toBeDefined();
    expect(new Set(nativeOpenClawAgentRegistry.flatMap((agent) => agent.wayfinderPerspectivePacks ?? []))).toEqual(
      new Set(WAYFINDER_PERSPECTIVE_PACK_IDS),
    );
    expect(nativeOpenClawAgentRegistry.every((agent) => agent.canWritePlans === false || agent.agentId === "life-secretary-agent")).toBe(true);

    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    runtimes.push(runtime);
    await runtime.start();
    const address = runtime.server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const health = await fetch(`${baseUrl}/health`);
    const healthPayload = (await health.json()) as {
      agents: Array<{ wayfinderWorker?: string | null; skills: string[]; wayfinderPerspectivePacks?: string[] }>;
    };
    expect(
      healthPayload.agents.some(
        (agent) =>
          agent.wayfinderWorker === "wayfinder-option-worker" &&
          agent.skills.some((skill) => skill.startsWith("option-architecture-skill@")) &&
          agent.wayfinderPerspectivePacks?.includes("scientific_reasoning@1.0.0"),
      ),
    ).toBe(true);

    const execute = async (target: string, context: Record<string, unknown>) => {
      const response = await fetch(`${baseUrl}/v1/tasks/execute`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target, mode: "generate", taskId: `task-${target}`, trace: { traceId: `trace-${target}` }, payload: { userPrompt: JSON.stringify(context) } }),
      });
      return (await response.json()) as { parsed: Record<string, unknown>; metadata: Record<string, unknown> };
    };
    const framed = await execute("director-agent", { workflow: "wayfinder_situation_framing", summary: "A choice", evidenceRefs: ["event-1"] });
    const architected = await execute("analyst-agent", { workflow: "wayfinder_option_architecture", userId: "user-a", situation: { id: "situation-1", summary: "A choice", riskLevel: "low" }, evidenceRefs: ["event-1"] });
    const reflected = await execute("balance-agent", { workflow: "wayfinder_reflection", decision: { id: "decision-1" }, outcomes: [], evidenceRefs: ["decision-1"] });
    expect(framed.parsed.agent).toBe("situation-framer");
    expect((architected.parsed.options as unknown[])).toHaveLength(3);
    expect(reflected.parsed.agent).toBe("reflection-worker");
    expect((architected.metadata.authorityApply as { attempted: boolean }).attempted).toBe(false);
    assertNoForbiddenFields({ framed, architected, reflected });
  });
});
