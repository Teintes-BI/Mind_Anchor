import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AgentLabPage } from "../AgentLabPage";

vi.mock("../../api", () => ({
  api: {
    getGatewayHealth: vi.fn(async () => ({
      ok: true,
      mode: "openai-compatible",
      topology: "gateway-openclaw",
      openClawBaseUrl: "http://127.0.0.1:8787",
    })),
    getDebugOpenClawAdapterStatus: vi.fn(async () => ({
      gatewayMode: "openai-compatible",
      executionStrategy: "cluster-preferred",
      clusterEnabled: true,
      openClawBaseUrl: "http://127.0.0.1:8787",
      clusterEndpoints: ["/v1/tasks/execute"],
      lastDecision: null,
      lastFallback: null,
      recentTimeline: [],
    })),
    getDebugOpenClawRegistryVisibility: vi.fn(async () => ({
      source: "gateway-openclaw-registry-visibility",
      explanation: "registry visibility",
      nativeRegistry: {
        source: "gateway-native-openclaw-registry",
        explanation: "native",
        totalAgents: 6,
        agents: [],
      },
      externalRuntime: {
        healthStatus: "attention",
        healthReasonCodes: ["workflow_execution_probe_mismatch"],
        healthIssueCounts: {
          missingPersonaCount: 0,
          contractMismatchCount: 0,
          runtimeContractMismatchCount: 0,
          workflowContractMismatchCount: 0,
          workflowResponseContractMismatchCount: 0,
          workflowExecutionContractMismatchCount: 0,
          workflowExecutionProbeMismatchCount: 1,
          unknownExternalAgentCount: 0,
          totalIssueCount: 1,
        },
        configured: true,
        reachable: true,
        baseUrl: "http://127.0.0.1:8787",
        runtime: "openclaw-local-cluster",
        runtimeVersion: "structured-local-runtime-phase1",
        responseMode: "parsed",
        executeEndpoints: ["/v1/tasks/execute"],
        workflowContracts: [],
        workflowResponseContracts: [],
        workflowExecutionContracts: [],
        agentCount: 15,
        agents: [],
        matchedAgentIds: [
          "director-agent",
          "companion-agent",
          "analyst-agent",
          "balance-agent",
          "life-secretary-agent",
          "memory-governor-agent",
        ],
        missingInExternal: [],
        contractMismatches: [],
        runtimeContractMismatches: [],
        workflowContractMismatches: [],
        workflowResponseContractMismatches: [],
        workflowExecutionContractMismatches: [],
        workflowExecutionProbeMismatches: [
          {
            workflow: "coach_conversation_full",
            target: "director-agent",
            statusCode: 200,
            missingRequiredMetadataFields: ["responseMode", "memoryFetch"],
            missingMemoryFetchFields: ["attempted", "loaded", "error"],
            missingAuthorityApplyFields: [],
            error: null,
          },
        ],
        unknownExternalAgents: ["chief-agent"],
        error: null,
      },
      managementIntegration: {
        configured: true,
        targetProfileKey: "openclaw-dev",
        aligned: false,
        expectedAgentCount: 6,
        actualAgentCount: 5,
        missingAgents: ["memory-governor-agent"],
        extraAgents: [],
        fieldMismatches: [
          {
            agentId: "companion-agent",
            field: "managementWorkspaceName",
            expected: "troi-runtime-agent",
            actual: "troi-prod-runtime-agent",
          },
        ],
      },
    })),
    getDebugAgentConfigs: vi.fn(async () => ({
      mode: "openai-compatible",
      defaultModelConfig: {
        target: "default",
        envPrefix: "MINDANCHOR_AGENT_DEFAULT",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-5.4",
        wireApi: "responses",
        reasoningEffort: "medium",
        disableResponseStorage: false,
        hasApiKey: true,
        differsFromDefault: {
          baseUrl: false,
          apiKey: false,
          model: false,
          wireApi: false,
          reasoningEffort: false,
          disableResponseStorage: false,
        },
      },
      agents: [],
    })),
    getDebugRegressionMatrixCases: vi.fn(async () => ({ cases: [] })),
    getDebugRegressionMatrixRuns: vi.fn(async () => ({ runs: [] })),
    getDebugScenarios: vi.fn(async () => ({ scenarios: [] })),
    getDebugRuns: vi.fn(async () => ({ runs: [] })),
    clearDebugRuns: vi.fn(async () => ({ userId: null })),
    clearDebugRegressionMatrixRuns: vi.fn(async () => ({ cleared: true })),
    runDebugRegressionMatrix: vi.fn(async () => ({ traceId: "trace", caseResults: [], summary: { total: 0, passed: 0, failed: 0 } })),
    runFullRegressionSuite: vi.fn(async () => ({ traceId: "trace", createdAt: new Date().toISOString(), scenarioResults: [] })),
    getDebugTrace: vi.fn(async () => ({ traceId: "trace", agentRuns: [], matrixRuns: [], events: [] })),
    seedDebugScenario: vi.fn(async () => ({
      scenarioId: "focus-recovery-loop",
      title: "focus",
      description: "focus",
      userId: "demo-user",
      recommendedWorkflows: [],
      notes: [],
      counts: { goals: 0, tasks: 0, sessions: 0, assessments: 0, recoveryPlans: 0, reflections: 0, inbox: 0 },
    })),
    probeChiefAgent: vi.fn(),
    debugChiefAgent: vi.fn(),
    debugStateInsight: vi.fn(),
    debugTaskManagement: vi.fn(),
    debugProgressFeedback: vi.fn(),
    debugRecovery: vi.fn(),
    debugReflection: vi.fn(),
    debugAutomation: vi.fn(),
  },
}));

describe("AgentLabPage", () => {
  it("shows the external openclaw registry health summary from gateway diagnostics", async () => {
    render(
      <MemoryRouter>
        <AgentLabPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("OpenClaw Registry")).toBeInTheDocument();
    });

    expect(screen.getByText("需要检查")).toBeInTheDocument();
    expect(screen.getByText("workflow_execution_probe_mismatch")).toBeInTheDocument();
    expect(screen.getByText("问题数：1")).toBeInTheDocument();
    expect(screen.getByText("缺失 persona：0")).toBeInTheDocument();
    expect(screen.getByText("管理接入")).toBeInTheDocument();
    expect(screen.getByText("未对齐")).toBeInTheDocument();
    expect(screen.getByText("缺失 agent：1")).toBeInTheDocument();
    expect(screen.getByText("字段漂移：1")).toBeInTheDocument();
    expect(screen.getByText("memory-governor-agent")).toBeInTheDocument();
  });
});
