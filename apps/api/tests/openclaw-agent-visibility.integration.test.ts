import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { OPENCLAW_AGENT_NAMES, type AppEnv } from "../src/env.js";
import { createLocalOpenClawServer } from "../../../openclaw/local-runtime/server.mjs";
import { buildOpenClawManagementPack } from "../../../openclaw/management/agent-management-pack.mjs";

describe("openclaw agent visibility debug API", () => {
  let dataDir = "";
  let app: Awaited<ReturnType<typeof buildApp>>;
  let env: AppEnv;
  const runtimes: Array<ReturnType<typeof createLocalOpenClawServer>> = [];
  const customServers: Array<ReturnType<typeof createServer>> = [];

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "mindanchor-openclaw-agent-visibility-"));
    env = {
      apiPort: 3001,
      dataFile: join(dataDir, "mindanchor.json"),
      agentMode: "stub",
      openClawBaseUrl: undefined,
      openClawManagementActualPath: undefined,
      openClawManagementProfileHome: undefined,
      supabaseUrl: undefined,
      supabaseJwksUrl: undefined,
      supabaseJwtIssuer: undefined,
      authDevBypassEnabled: true,
      authJwtSecret: undefined,
      feishuBotWebhookUrl: undefined,
      telegramBotToken: undefined,
      telegramChatId: undefined,
      defaultModelConfig: {
        baseUrl: undefined,
        apiKey: undefined,
        model: "gpt-5.4",
        wireApi: "responses",
        reasoningEffort: "xhigh",
        disableResponseStorage: true,
      },
      agentModelConfigs: Object.fromEntries(
        OPENCLAW_AGENT_NAMES.map((agentName) => [
          agentName,
          {
            baseUrl: undefined,
            apiKey: undefined,
            model: "gpt-5.4",
            wireApi: "responses",
            reasoningEffort: "xhigh",
            disableResponseStorage: true,
          },
        ]),
      ),
    };
    app = await buildApp(env);
  });

  afterEach(async () => {
    await Promise.all(
      runtimes.splice(0).map(
        (runtime) =>
          new Promise<void>((resolve, reject) => {
            runtime.server.close((error) => (error ? reject(error) : resolve()));
          }),
      ),
    );
    await Promise.all(
      customServers.splice(0).map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
          }),
      ),
    );
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("lists native openclaw persona agents with technical ids and display names", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/native-agents",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        totalAgents: 6,
        agents: expect.arrayContaining([
          expect.objectContaining({
            agentId: "director-agent",
            displayName: "Picard",
            runtimeAgentId: "picard-runtime-agent",
            supportedWorkflows: expect.arrayContaining(["persona_routing"]),
            visibleInLocalRuntime: true,
          }),
          expect.objectContaining({
            agentId: "life-secretary-agent",
            displayName: "Jarvis",
            runtimeAgentId: "jarvis-runtime-agent",
            supportedWorkflows: expect.arrayContaining(["plan_adjustment"]),
            visibleInLocalRuntime: true,
          }),
          expect.objectContaining({
            agentId: "memory-governor-agent",
            displayName: "Data",
            runtimeAgentId: "data-runtime-agent",
            supportedWorkflows: expect.arrayContaining(["memory_governance"]),
            visibleInLocalRuntime: true,
          }),
        ]),
      }),
    );
  });

  it("compares the configured external openclaw runtime with the native registry", async () => {
    const runtime = createLocalOpenClawServer({ host: "127.0.0.1", port: 0 });
    runtimes.push(runtime);
    await runtime.start();
    const address = runtime.server.address() as AddressInfo;

    await app.close();
    env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.nativeRegistry.totalAgents).toBe(6);
    expect(payload.externalRuntime.healthStatus).toBe("aligned");
    expect(payload.externalRuntime.healthIssueCounts.totalIssueCount).toBe(0);
    expect(payload.externalRuntime.healthReasonCodes).toEqual([]);
    expect(payload.externalRuntime.configured).toBe(true);
    expect(payload.externalRuntime.reachable).toBe(true);
    expect(payload.externalRuntime.baseUrl).toBe(`http://127.0.0.1:${address.port}`);
    expect(payload.externalRuntime.agentCount).toEqual(expect.any(Number));
    expect(payload.externalRuntime.missingInExternal).toEqual([]);
    expect(payload.externalRuntime.contractMismatches).toEqual([]);
    expect(payload.externalRuntime.workflowExecutionProbeMismatches).toEqual([]);
    expect(payload.externalRuntime.matchedAgentIds).toEqual(
      expect.arrayContaining([
        "director-agent",
        "companion-agent",
        "analyst-agent",
        "balance-agent",
        "life-secretary-agent",
        "memory-governor-agent",
      ]),
    );
    expect(payload.externalRuntime.unknownExternalAgents).toEqual(
      expect.arrayContaining(["chief-agent"]),
    );
  });

  it("reports contract mismatches when an external runtime exposes the same persona id with different workflow metadata", async () => {
    const customRuntime = createServer((request, response) => {
      if (request.url === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            ok: true,
            runtime: "external-openclaw",
            runtimeVersion: "mismatch-runtime",
            agentCount: 1,
            agents: [
              {
                name: "director-agent",
                worker: "picard-runtime-agent",
                modelTarget: "director-agent",
                skillCount: 1,
                supportedWorkflows: ["wrong_workflow"],
                memoryScopes: ["preferences"],
                canFront: false,
                canConsult: true,
                canWritePlans: false,
                canGovernMemory: false,
              },
            ],
          }),
        );
        return;
      }
      response.writeHead(404);
      response.end();
    });
    customServers.push(customRuntime);
    await new Promise<void>((resolve, reject) => {
      customRuntime.listen(0, "127.0.0.1", (error?: Error) => (error ? reject(error) : resolve()));
    });
    const address = customRuntime.address() as AddressInfo;

    await app.close();
    env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        externalRuntime: expect.objectContaining({
          configured: true,
          reachable: true,
          matchedAgentIds: ["director-agent"],
          contractMismatches: [
            expect.objectContaining({
              agentId: "director-agent",
              mismatchFields: expect.arrayContaining(["supportedWorkflows", "memoryScopes", "canFront"]),
            }),
          ],
        }),
      }),
    );
  });

  it("reports runtime-level contract mismatches when an external runtime exposes incompatible response mode or execute endpoints", async () => {
    const customRuntime = createServer((request, response) => {
      if (request.url === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            ok: true,
            runtime: "external-openclaw",
            runtimeVersion: "runtime-contract-mismatch",
            responseMode: "text",
            endpoints: ["/legacy/tasks/execute"],
            agentCount: 0,
            agents: [],
          }),
        );
        return;
      }
      response.writeHead(404);
      response.end();
    });
    customServers.push(customRuntime);
    await new Promise<void>((resolve, reject) => {
      customRuntime.listen(0, "127.0.0.1", (error?: Error) => (error ? reject(error) : resolve()));
    });
    const address = customRuntime.address() as AddressInfo;

    await app.close();
    env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        externalRuntime: expect.objectContaining({
          configured: true,
          reachable: true,
          responseMode: "text",
          executeEndpoints: ["/legacy/tasks/execute"],
          runtimeContractMismatches: expect.arrayContaining(["responseMode", "executeEndpoints"]),
        }),
      }),
    );
  });

  it("reports workflow contract mismatches when an external runtime omits required payload fields for key workflows", async () => {
    const customRuntime = createServer((request, response) => {
      if (request.url === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            ok: true,
            runtime: "external-openclaw",
            runtimeVersion: "workflow-contract-mismatch",
            responseMode: "parsed",
            endpoints: ["/v1/tasks/execute"],
            agentCount: 0,
            agents: [],
            workflowContracts: [
              {
                workflow: "coach_conversation_full",
                requiredContextFields: ["workflow", "userId"],
              },
              {
                workflow: "memory_governance",
                requiredContextFields: ["workflow", "userId", "authorityAction"],
              },
            ],
          }),
        );
        return;
      }
      response.writeHead(404);
      response.end();
    });
    customServers.push(customRuntime);
    await new Promise<void>((resolve, reject) => {
      customRuntime.listen(0, "127.0.0.1", (error?: Error) => (error ? reject(error) : resolve()));
    });
    const address = customRuntime.address() as AddressInfo;

    await app.close();
    env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        externalRuntime: expect.objectContaining({
          workflowContractMismatches: expect.arrayContaining([
            expect.objectContaining({
              workflow: "coach_conversation_full",
              missingRequiredContextFields: expect.arrayContaining(["frontAgent", "runtimeAgentId", "memoryScopes", "gatewayBaseUrl"]),
            }),
            expect.objectContaining({
              workflow: "memory_governance",
              missingRequiredContextFields: expect.arrayContaining(["frontAgent", "runtimeAgentId", "memoryScopes", "gatewayBaseUrl"]),
            }),
          ]),
        }),
      }),
    );
  });

  it("reports workflow response contract mismatches when an external runtime omits required parsed fields for key workflows", async () => {
    const customRuntime = createServer((request, response) => {
      if (request.url === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            ok: true,
            runtime: "external-openclaw",
            runtimeVersion: "workflow-response-contract-mismatch",
            responseMode: "parsed",
            endpoints: ["/v1/tasks/execute"],
            agentCount: 0,
            agents: [],
            workflowContracts: [],
            workflowResponseContracts: [
              {
                workflow: "coach_conversation_full",
                requiredParsedFields: ["status", "fullResponse"],
              },
              {
                workflow: "memory_governance",
                requiredParsedFields: ["authorityAgent", "action"],
              },
            ],
          }),
        );
        return;
      }
      response.writeHead(404);
      response.end();
    });
    customServers.push(customRuntime);
    await new Promise<void>((resolve, reject) => {
      customRuntime.listen(0, "127.0.0.1", (error?: Error) => (error ? reject(error) : resolve()));
    });
    const address = customRuntime.address() as AddressInfo;

    await app.close();
    env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        externalRuntime: expect.objectContaining({
          workflowResponseContractMismatches: expect.arrayContaining([
            expect.objectContaining({
              workflow: "coach_conversation_full",
              missingRequiredParsedFields: expect.arrayContaining(["fastResponse"]),
            }),
            expect.objectContaining({
              workflow: "memory_governance",
              missingRequiredParsedFields: expect.arrayContaining(["executionMode", "summary"]),
            }),
          ]),
        }),
      }),
    );
  });

  it("reports workflow execution contract mismatches when an external runtime omits required metadata fields for key workflows", async () => {
    const customRuntime = createServer((request, response) => {
      if (request.url === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            ok: true,
            runtime: "external-openclaw",
            runtimeVersion: "workflow-execution-contract-mismatch",
            responseMode: "parsed",
            endpoints: ["/v1/tasks/execute"],
            agentCount: 0,
            agents: [],
            workflowContracts: [],
            workflowResponseContracts: [],
            workflowExecutionContracts: [
              {
                workflow: "coach_conversation_full",
                requiredMetadataFields: ["workflow", "responseMode"],
                memoryFetchFields: ["attempted"],
              },
              {
                workflow: "memory_governance",
                requiredMetadataFields: ["workflow", "authorityApply"],
                authorityApplyFields: ["attempted", "applied"],
              },
            ],
          }),
        );
        return;
      }
      response.writeHead(404);
      response.end();
    });
    customServers.push(customRuntime);
    await new Promise<void>((resolve, reject) => {
      customRuntime.listen(0, "127.0.0.1", (error?: Error) => (error ? reject(error) : resolve()));
    });
    const address = customRuntime.address() as AddressInfo;

    await app.close();
    env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        externalRuntime: expect.objectContaining({
          workflowExecutionContractMismatches: expect.arrayContaining([
            expect.objectContaining({
              workflow: "coach_conversation_full",
              missingRequiredMetadataFields: expect.arrayContaining(["memoryFetch"]),
              missingMemoryFetchFields: expect.arrayContaining(["loaded", "error"]),
            }),
            expect.objectContaining({
              workflow: "memory_governance",
              missingRequiredMetadataFields: expect.arrayContaining(["responseMode"]),
              missingAuthorityApplyFields: expect.arrayContaining(["status", "readModelRefresh"]),
            }),
          ]),
        }),
      }),
    );
  });

  it("reports real execute-response metadata mismatches when an external runtime returns malformed execution metadata", async () => {
    const customRuntime = createServer(async (request, response) => {
      if (request.url === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            ok: true,
            runtime: "external-openclaw",
            runtimeVersion: "workflow-execution-probe-mismatch",
            responseMode: "parsed",
            endpoints: ["/v1/tasks/execute"],
            agentCount: 3,
            agents: [
              {
                name: "director-agent",
                worker: "picard-runtime-agent",
                modelTarget: "director-agent",
                skillCount: 1,
                supportedWorkflows: ["persona_routing", "coach_conversation_fast", "coach_conversation_full"],
                memoryScopes: ["preferences", "habits", "constraints", "recentContext"],
                canFront: true,
                canConsult: true,
                canWritePlans: true,
                canGovernMemory: false,
              },
              {
                name: "life-secretary-agent",
                worker: "jarvis-runtime-agent",
                modelTarget: "life-secretary-agent",
                skillCount: 1,
                supportedWorkflows: ["plan_adjustment"],
                memoryScopes: ["preferences", "habits", "constraints", "recentContext"],
                canFront: false,
                canConsult: true,
                canWritePlans: true,
                canGovernMemory: false,
              },
              {
                name: "memory-governor-agent",
                worker: "data-runtime-agent",
                modelTarget: "memory-governor-agent",
                skillCount: 1,
                supportedWorkflows: ["memory_governance"],
                memoryScopes: ["preferences", "habits", "constraints", "recentContext"],
                canFront: false,
                canConsult: true,
                canWritePlans: false,
                canGovernMemory: true,
              },
            ],
            workflowContracts: [
              {
                workflow: "coach_conversation_fast",
                requiredContextFields: ["workflow", "userId", "frontAgent", "runtimeAgentId", "memoryScopes", "gatewayBaseUrl"],
              },
              {
                workflow: "coach_conversation_full",
                requiredContextFields: ["workflow", "userId", "frontAgent", "runtimeAgentId", "memoryScopes", "gatewayBaseUrl"],
              },
              {
                workflow: "coach_conversation_consult",
                requiredContextFields: ["workflow", "userId", "frontAgent", "runtimeAgentId", "memoryScopes", "gatewayBaseUrl"],
              },
              {
                workflow: "plan_adjustment",
                requiredContextFields: [
                  "workflow",
                  "userId",
                  "frontAgent",
                  "runtimeAgentId",
                  "memoryScopes",
                  "gatewayBaseUrl",
                  "authorityAction",
                  "proposalContext",
                ],
              },
              {
                workflow: "memory_governance",
                requiredContextFields: ["workflow", "userId", "frontAgent", "runtimeAgentId", "memoryScopes", "gatewayBaseUrl", "authorityAction"],
              },
            ],
            workflowResponseContracts: [
              {
                workflow: "coach_conversation_fast",
                requiredParsedFields: ["fastResponse", "status"],
              },
              {
                workflow: "coach_conversation_full",
                requiredParsedFields: ["fastResponse", "fullResponse", "status"],
              },
              {
                workflow: "coach_conversation_consult",
                requiredParsedFields: ["consultSummary", "status"],
              },
              {
                workflow: "plan_adjustment",
                requiredParsedFields: ["authorityAgent", "action", "executionMode", "summary"],
              },
              {
                workflow: "memory_governance",
                requiredParsedFields: ["authorityAgent", "action", "executionMode", "summary"],
              },
            ],
            workflowExecutionContracts: [
              {
                workflow: "coach_conversation_fast",
                requiredMetadataFields: ["workflow", "responseMode", "memoryFetch"],
                memoryFetchFields: ["attempted", "loaded", "error"],
                authorityApplyFields: [],
              },
              {
                workflow: "coach_conversation_full",
                requiredMetadataFields: ["workflow", "responseMode", "memoryFetch"],
                memoryFetchFields: ["attempted", "loaded", "error"],
                authorityApplyFields: [],
              },
              {
                workflow: "coach_conversation_consult",
                requiredMetadataFields: ["workflow", "responseMode", "memoryFetch"],
                memoryFetchFields: ["attempted", "loaded", "error"],
                authorityApplyFields: [],
              },
              {
                workflow: "plan_adjustment",
                requiredMetadataFields: ["workflow", "responseMode", "authorityApply"],
                memoryFetchFields: [],
                authorityApplyFields: ["attempted", "applied", "status", "readModelRefresh"],
              },
              {
                workflow: "memory_governance",
                requiredMetadataFields: ["workflow", "responseMode", "authorityApply"],
                memoryFetchFields: [],
                authorityApplyFields: ["attempted", "applied", "status", "readModelRefresh"],
              },
            ],
          }),
        );
        return;
      }

      if (request.url === "/v1/tasks/execute" && request.method === "POST") {
        let body = "";
        for await (const chunk of request) {
          body += chunk;
        }
        const parsedBody = JSON.parse(body || "{}");
        const workflow = JSON.parse(parsedBody?.payload?.userPrompt ?? "{}")?.workflow;

        response.writeHead(200, { "content-type": "application/json" });

        if (workflow === "coach_conversation_full") {
          response.end(
            JSON.stringify({
              success: true,
              parsed: {
                fastResponse: "先做一个最小下一步。",
                fullResponse: "先做一个最小下一步，再继续往下收。",
                status: "completed",
              },
              metadata: {
                workflow: "coach_conversation_full",
              },
            }),
          );
          return;
        }

        if (workflow === "plan_adjustment") {
          response.end(
            JSON.stringify({
              success: true,
              parsed: {
                authorityAgent: "life-secretary-agent",
                action: "plan_change",
                executionMode: "proposal",
                summary: "Jarvis prepared a proposal.",
              },
              metadata: {
                workflow: "plan_adjustment",
                responseMode: "parsed",
                authorityApply: {
                  attempted: true,
                },
              },
            }),
          );
          return;
        }

        response.end(
          JSON.stringify({
            success: true,
            parsed: {
              authorityAgent: "memory-governor-agent",
              action: "block_recall",
              executionMode: "proposal",
              summary: "Data prepared a proposal.",
            },
            metadata: {
              workflow: "memory_governance",
              responseMode: "parsed",
              authorityApply: {
                attempted: false,
                applied: false,
                status: null,
                readModelRefresh: null,
              },
            },
          }),
        );
        return;
      }

      response.writeHead(404);
      response.end();
    });
    customServers.push(customRuntime);
    await new Promise<void>((resolve, reject) => {
      customRuntime.listen(0, "127.0.0.1", (error?: Error) => (error ? reject(error) : resolve()));
    });
    const address = customRuntime.address() as AddressInfo;

    await app.close();
    env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.externalRuntime.healthStatus).toBe("attention");
    expect(payload.externalRuntime.healthIssueCounts.workflowExecutionProbeMismatchCount).toBe(2);
    expect(payload.externalRuntime.healthIssueCounts.totalIssueCount).toBeGreaterThanOrEqual(2);
    expect(payload.externalRuntime.healthReasonCodes).toEqual(
      expect.arrayContaining(["workflow_execution_probe_mismatch"]),
    );
    expect(payload.externalRuntime.workflowExecutionProbeMismatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workflow: "coach_conversation_full",
          target: "director-agent",
          missingRequiredMetadataFields: expect.arrayContaining(["responseMode", "memoryFetch"]),
          missingMemoryFetchFields: expect.arrayContaining(["attempted", "loaded", "error"]),
        }),
        expect.objectContaining({
          workflow: "plan_adjustment",
          target: "life-secretary-agent",
          missingAuthorityApplyFields: expect.arrayContaining(["applied", "status", "readModelRefresh"]),
        }),
      ]),
    );
  });

  it("reports when no external openclaw runtime is configured", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.nativeRegistry.totalAgents).toBe(6);
    expect(payload.externalRuntime.healthStatus).toBe("not_configured");
    expect(payload.externalRuntime.healthIssueCounts.totalIssueCount).toBe(0);
    expect(payload.externalRuntime.healthReasonCodes).toEqual([]);
    expect(payload.externalRuntime.configured).toBe(false);
    expect(payload.externalRuntime.reachable).toBe(false);
    expect(payload.externalRuntime.baseUrl).toBeNull();
    expect(payload.externalRuntime.agentCount).toBe(0);
    expect(payload.externalRuntime.contractMismatches).toEqual([]);
    expect(payload.externalRuntime.runtimeContractMismatches).toEqual([]);
    expect(payload.externalRuntime.workflowContractMismatches).toEqual([]);
    expect(payload.externalRuntime.workflowResponseContractMismatches).toEqual([]);
    expect(payload.externalRuntime.workflowExecutionContractMismatches).toEqual([]);
    expect(payload.externalRuntime.workflowExecutionProbeMismatches).toEqual([]);
    expect(payload.externalRuntime.matchedAgentIds).toEqual([]);
  });

  it("compresses multiple external runtime mismatch types into a direct health summary", async () => {
    const customRuntime = createServer((request, response) => {
      if (request.url === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            ok: true,
            runtime: "external-openclaw",
            runtimeVersion: "health-summary-mismatch",
            responseMode: "text",
            endpoints: ["/legacy/tasks/execute"],
            agentCount: 1,
            agents: [
              {
                name: "director-agent",
                worker: "picard-runtime-agent",
                modelTarget: "director-agent",
                skillCount: 1,
                supportedWorkflows: ["wrong_workflow"],
                memoryScopes: ["preferences"],
                canFront: false,
                canConsult: true,
                canWritePlans: false,
                canGovernMemory: false,
              },
            ],
          }),
        );
        return;
      }
      response.writeHead(404);
      response.end();
    });
    customServers.push(customRuntime);
    await new Promise<void>((resolve, reject) => {
      customRuntime.listen(0, "127.0.0.1", (error?: Error) => (error ? reject(error) : resolve()));
    });
    const address = customRuntime.address() as AddressInfo;

    await app.close();
    env.openClawBaseUrl = `http://127.0.0.1:${address.port}`;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.externalRuntime.healthStatus).toBe("attention");
    expect(payload.externalRuntime.healthIssueCounts).toEqual(
      expect.objectContaining({
        missingPersonaCount: 5,
        contractMismatchCount: 1,
        runtimeContractMismatchCount: 2,
        workflowContractMismatchCount: 5,
        workflowResponseContractMismatchCount: 5,
        workflowExecutionContractMismatchCount: 5,
        workflowExecutionProbeMismatchCount: 0,
        totalIssueCount: 23,
      }),
    );
    expect(payload.externalRuntime.healthReasonCodes).toEqual(
      expect.arrayContaining([
        "missing_persona",
        "agent_contract_mismatch",
        "runtime_contract_mismatch",
        "workflow_payload_contract_mismatch",
        "workflow_response_contract_mismatch",
        "workflow_execution_contract_mismatch",
      ]),
    );
  });

  it("surfaces management integration alignment when a managed agent pack file is configured", async () => {
    const managementPackPath = join(dataDir, "openclaw-management-pack.json");
    await writeFile(
      managementPackPath,
      JSON.stringify(
        buildOpenClawManagementPack({
          managementProfileKey: "openclaw-dev",
          generatedAt: "2026-03-28T00:00:00.000Z",
        }),
      ),
      "utf8",
    );

    await app.close();
    env.openClawManagementActualPath = managementPackPath;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        managementIntegration: expect.objectContaining({
          configured: true,
          targetProfileKey: "openclaw-dev",
          aligned: true,
          expectedAgentCount: 6,
          actualAgentCount: 6,
          missingAgents: [],
          extraAgents: [],
          fieldMismatches: [],
        }),
      }),
    );
  });

  it("surfaces management integration alignment when a real OpenClaw profile home is configured", async () => {
    const profileHome = join(dataDir, "openclaw-dev");
    const configPath = join(profileHome, "openclaw.json");

    await mkdir(profileHome, { recursive: true });
    await writeFile(
      configPath,
      JSON.stringify({
        agents: {
          list: buildOpenClawManagementPack({
            managementProfileKey: "openclaw-dev",
            generatedAt: "2026-03-28T00:00:00.000Z",
          }).agents.map((agent) => ({
            id: agent.agentId,
            name: agent.agentId,
            workspace: join(profileHome, "workspaces", agent.managementWorkspaceName),
            agentDir: join(profileHome, "agents", agent.agentId, "agent"),
            model: "codex/gpt-5.4@codex:manual",
          })),
        },
      }),
      "utf8",
    );

    await app.close();
    env.openClawManagementActualPath = undefined;
    env.openClawManagementProfileHome = profileHome;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        managementIntegration: expect.objectContaining({
          configured: true,
          targetProfileKey: "openclaw-dev",
          aligned: true,
          expectedAgentCount: 6,
          actualAgentCount: 6,
          missingAgents: [],
          extraAgents: [],
          fieldMismatches: [],
        }),
      }),
    );
  });

  it("keeps managementIntegration aligned when persona agents are present but legacy runtime agents also exist", async () => {
    const profileHome = join(dataDir, "openclaw-dev-mixed");
    const configPath = join(profileHome, "openclaw.json");
    const personaAgents = buildOpenClawManagementPack({
      managementProfileKey: "openclaw-dev",
      generatedAt: "2026-03-28T00:00:00.000Z",
    }).agents;

    await mkdir(profileHome, { recursive: true });
    await writeFile(
      configPath,
      JSON.stringify({
        agents: {
          list: [
            ...personaAgents.map((agent) => ({
              id: agent.agentId,
              name: agent.agentId,
              workspace: join(profileHome, "workspaces", agent.managementWorkspaceName),
              agentDir: join(profileHome, "agents", agent.agentId, "agent"),
              model: "codex/gpt-5.4@codex:manual",
            })),
            {
              id: "chief-agent",
              name: "chief-agent",
              workspace: join(profileHome, "workspaces", "chief-agent"),
              agentDir: join(profileHome, "agents", "chief-agent", "agent"),
              model: "codex/gpt-5.4@codex:manual",
            },
          ],
        },
      }),
      "utf8",
    );

    await app.close();
    env.openClawManagementActualPath = undefined;
    env.openClawManagementProfileHome = profileHome;
    app = await buildApp(env);

    const response = await app.inject({
      method: "GET",
      url: "/debug/openclaw/registry-visibility",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        managementIntegration: expect.objectContaining({
          configured: true,
          targetProfileKey: "openclaw-dev",
          aligned: true,
          expectedAgentCount: 6,
          actualAgentCount: 7,
          missingAgents: [],
          extraAgents: ["chief-agent"],
          fieldMismatches: [],
        }),
      }),
    );
  });
});
