import { afterEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { createLocalOpenClawServer } from "../../../openclaw/local-runtime/server.mjs";
import { nativeOpenClawAgentRegistry } from "../../../openclaw/runtime/agent-registry.mjs";

describe("openclaw native agent registry", () => {
  const servers: Array<ReturnType<typeof createLocalOpenClawServer>> = [];

  afterEach(async () => {
    await Promise.all(
      servers.splice(0).map(
        (runtime) =>
          new Promise<void>((resolve, reject) => {
            runtime.server.close((error) => (error ? reject(error) : resolve()));
          }),
      ),
    );
  });

  it("registers all six native persona agents", () => {
    expect(nativeOpenClawAgentRegistry).toHaveLength(6);
    expect(nativeOpenClawAgentRegistry.map((entry) => entry.agentId)).toEqual([
      "director-agent",
      "companion-agent",
      "analyst-agent",
      "balance-agent",
      "life-secretary-agent",
      "memory-governor-agent",
    ]);
  });

  it("marks Picard as the front-capable routing agent", () => {
    const picard = nativeOpenClawAgentRegistry.find((entry) => entry.agentId === "director-agent");

    expect(picard).toBeDefined();
    expect(picard?.displayName).toBe("Picard");
    expect(picard?.canFront).toBe(true);
    expect(picard?.supportedWorkflows).toContain("persona_routing");
  });

  it("keeps plan writing authority only on Jarvis and memory governance only on Data", () => {
    const planWriters = nativeOpenClawAgentRegistry.filter((entry) => entry.canWritePlans);
    const memoryGovernors = nativeOpenClawAgentRegistry.filter((entry) => entry.canGovernMemory);

    expect(planWriters).toHaveLength(1);
    expect(planWriters[0]?.agentId).toBe("life-secretary-agent");
    expect(memoryGovernors).toHaveLength(1);
    expect(memoryGovernors[0]?.agentId).toBe("memory-governor-agent");
  });

  it("exposes the native persona registry through runtime health", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    servers.push(runtime);
    await runtime.start();

    const address = runtime.server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const payload = (await response.json()) as {
      agents: Array<{ name: string; supportedWorkflows: string[] }>;
    };

    expect(response.status).toBe(200);
    expect(payload.agents.some((agent) => agent.name === "director-agent" && agent.supportedWorkflows.includes("persona_routing"))).toBe(true);
    expect(payload.agents.some((agent) => agent.name === "life-secretary-agent" && agent.supportedWorkflows.includes("plan_adjustment"))).toBe(true);
    expect(payload.agents.some((agent) => agent.name === "memory-governor-agent" && agent.supportedWorkflows.includes("memory_governance"))).toBe(true);
  });
});
