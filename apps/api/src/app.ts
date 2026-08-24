import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";
import {
  agentMemoryContextBundleSchema,
  agentMemoryProposalSchema,
  agentDebugRunsQuerySchema,
  agentDebugRunsResponseSchema,
  agentTeamAgentIdSchema,
  authLoginInputSchema,
  authLogoutInputSchema,
  authLogoutResponseSchema,
  authRefreshInputSchema,
  authRegisterInputSchema,
  authSessionResponseSchema,
  coachFrontAgentStateSchema,
  coachMessageFeedbackInputSchema,
  coachMessageSendResponseSchema,
  coachSessionDetailResponseSchema,
  clientBootstrapResponseSchema,
  checkinInputSchema,
  clientInboxQuerySchema,
  clientInboxOverviewQuerySchema,
  clientInboxOverviewResponseSchema,
  clientInboxResponseSchema,
  createCallEventInputSchema,
  createCoachMessageInputSchema,
  createCoachSessionInputSchema,
  createEmotionAssessmentInputSchema,
  createGoalInputSchema,
  createHealthSnapshotInputSchema,
  healthCalibrationRecordSchema,
  createMediaUploadSessionInputSchema,
  createTaskInputSchema,
  createVideoAssessmentInputSchema,
  dashboardSummarySchema,
  debugAgentConfigsResponseSchema,
  openClawAdapterStatusResponseSchema,
  openClawNativeAgentsResponseSchema,
  openClawRegistryVisibilityResponseSchema,
  debugTraceLookupResponseSchema,
  debugRegressionMatrixRunsQuerySchema,
  debugRegressionMatrixRunsResponseSchema,
  debugRegressionMatrixResultSchema,
  debugRegressionMatrixRunInputSchema,
  deviceHeartbeatInputSchema,
  emotionQuerySchema,
  endAudioCaptureSessionInputSchema,
  endSessionInputSchema,
  goalFlowOverviewQuerySchema,
  goalFlowOverviewResponseSchema,
  healthLatestResponseSchema,
  healthQuerySchema,
  latestStateResponseSchema,
  localClusterManualBootstrapResponseSchema,
  meResponseSchema,
  memoryCandidateSchema,
  memoryScopeSchema,
  coachFeedbackSchema,
  coachMemoryItemSchema,
  coachMessageSchema,
  coachSessionSchema,
  mobileDeviceQuerySchema,
  planChangeProposalSchema,
  recoveryPlanInputSchema,
  recoveryHistoryQuerySchema,
  recoveryHistoryResponseSchema,
  reflectionQuerySchema,
  reflectionOverviewQuerySchema,
  reflectionOverviewResponseSchema,
  registerEdgeDeviceInputSchema,
  registerMediaChunkInputSchema,
  registerMobileDeviceInputSchema,
  signalBatchInputSchema,
  startAudioCaptureSessionInputSchema,
  startSessionInputSchema,
  stateTrendsQuerySchema,
  stateTrendsResponseSchema,
  updateTaskInputSchema,
  userIdSchema,
} from "@mindanchor/domain";
import { getAgentConfigAuditResponse, type AppEnv } from "./env.js";
import { resolveAuthContext, type AuthContext } from "./lib/auth.js";
import {
  createGatewayRefreshToken,
  hashGatewayRefreshToken,
  hashPassword,
  signGatewayAccessToken,
  verifyPassword,
} from "./lib/gateway-auth.js";
import { TRACE_HEADER_NAMES } from "./lib/openclaw-trace.js";
import { ModelBridge } from "./lib/model-bridge.js";
import { MindAnchorTraceLogger } from "./lib/trace-logger.js";
import { createId } from "./lib/utils.js";
import { MindAnchorOrchestrator } from "./orchestrator.js";
import { DataMemoryService } from "./services/data-memory-service.js";
import { JarvisCommandService } from "./services/jarvis-command-service.js";
import { ConversationCoachService } from "./services/conversation-coach-service.js";
import { AgentAuthorityExecutionService } from "./services/agent-authority-execution-service.js";
import { AgentMemoryProposalService } from "./services/agent-memory-proposal-service.js";
import { AgentMemoryScopeError, AgentMemoryService } from "./services/agent-memory-service.js";
import { WayfinderConsentService } from "./services/wayfinder/consent-service.js";
import { WayfinderDecisionService } from "./services/wayfinder/decision-service.js";
import { WayfinderAudioEventService } from "./services/wayfinder/audio-event-service.js";
import { ConsentAwareSpeechTranscriber } from "./services/wayfinder/speech-transcribers.js";
import { WayfinderSituationService } from "./services/wayfinder/situation-service.js";
import { WayfinderOptionGenerationService } from "./services/wayfinder/option-generation-service.js";
import { WayfinderRepository } from "./services/wayfinder/wayfinder-repository.js";
import { HealthSignalService, healthBridgeSnapshotInputSchema } from "./services/wayfinder/health-signal-service.js";
import { registerWayfinderRoutes } from "./routes/wayfinder.js";
import { coreErrorResponse, coreErrorStatus, registerCoreRoutes } from "./routes/core.js";
import { CoreError } from "./core/core-errors.js";
import { SqliteCoreRepository } from "./core/sqlite-core-repository.js";
import { MindAnchorStore } from "./store.js";
import { debugScenarioIdSchema } from "./debug-scenarios.js";
import { nativeOpenClawAgentRegistry } from "../../../openclaw/runtime/agent-registry.mjs";
import { buildOpenClawManagementPack } from "../../../openclaw/management/agent-management-pack.mjs";
import { buildOpenClawManagementDoctorReport } from "../../../openclaw/management/agent-management-doctor.mjs";
import { readOpenClawManagedAgentsFromProfile } from "../../../openclaw/management/actual-managed-agents.mjs";

const toClientPlatform = (platform: "android" | "ios") => platform;
type TraceAwareRequest = {
  mindanchorTraceId?: string;
  mindanchorParentTraceId?: string;
  authContext?: AuthContext | null;
};

export const buildApp = async (env: AppEnv) => {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  const store = new MindAnchorStore(env.dataFile);
  await store.init();
  const core = SqliteCoreRepository.fromFile(env.personalCoreSqliteFile ?? join(dirname(env.dataFile), "comma-personal-core.sqlite"));
  await core.init();
  const traceLogger = new MindAnchorTraceLogger(store, app.log, "gateway");
  const orchestrator = new MindAnchorOrchestrator(env, store, traceLogger);
  const jarvisCommands = new JarvisCommandService(store);
  const dataMemory = new DataMemoryService(store);
  const authorityExecution = new AgentAuthorityExecutionService(jarvisCommands, dataMemory, orchestrator);
  const agentMemory = new AgentMemoryService(store);
  const conversationCoach = new ConversationCoachService(store, env, authorityExecution, agentMemory, traceLogger);
  const agentMemoryProposals = new AgentMemoryProposalService(store);
  const wayfinderRepository = new WayfinderRepository(store);
  const wayfinderConsent = new WayfinderConsentService(wayfinderRepository);
  const wayfinderSituations = new WayfinderSituationService(wayfinderRepository);
  const wayfinderDecisions = new WayfinderDecisionService(wayfinderRepository);
  const wayfinderOptionGeneration = new WayfinderOptionGenerationService({
    repository: wayfinderRepository,
    modelBridge: new ModelBridge(env, traceLogger.child("wayfinder-options")),
  });
  const healthSignals = new HealthSignalService();
  const wayfinderAudioEvents = new WayfinderAudioEventService({
    repository: wayfinderRepository,
    consent: wayfinderConsent,
    situations: wayfinderSituations,
    transcriber: new ConsentAwareSpeechTranscriber({
      remoteEnabled: env.wayfinderAsrRemoteEnabled,
      baseUrl: env.asrBaseUrl,
      apiKey: env.asrApiKey,
      model: env.asrModel,
    }),
  });

  app.addHook("onClose", async () => {
    await conversationCoach.shutdown();
    core.close();
  });

  const buildNativeOpenClawRegistryResponse = () =>
    openClawNativeAgentsResponseSchema.parse({
      source: "gateway-native-openclaw-registry",
      explanation:
        "These are the persona agents registered in this repository's native OpenClaw runtime. If you are looking at another external OpenClaw instance, it may not automatically include this registry yet.",
      totalAgents: nativeOpenClawAgentRegistry.length,
      agents: nativeOpenClawAgentRegistry.map((agent) => ({
        agentId: agent.agentId,
        displayName: agent.displayName,
        runtimeAgentId: agent.runtimeAgentId,
        worker: agent.worker,
        wayfinderWorker: agent.wayfinderWorker ?? null,
        wayfinderPerspectivePacks: agent.wayfinderPerspectivePacks ?? [],
        modelTarget: agent.modelTarget,
        skills: agent.skills,
        soulFilePath: agent.soulFilePath,
        supportedWorkflows: agent.supportedWorkflows,
        memoryScopes: agent.memoryScopes,
        canFront: agent.canFront,
        canConsult: agent.canConsult,
        canWritePlans: agent.canWritePlans,
        canGovernMemory: agent.canGovernMemory,
        visibleInLocalRuntime: true,
      })),
    });

  const fetchOpenClawManagementIntegration = async () => {
    if (!env.openClawManagementActualPath && !env.openClawManagementProfileHome) {
      return {
        configured: false,
        targetProfileKey: null,
        aligned: false,
        expectedAgentCount: nativeOpenClawAgentRegistry.length,
        actualAgentCount: 0,
        missingAgents: [],
        extraAgents: [],
        fieldMismatches: [],
      };
    }

    try {
      const targetProfileKey = "openclaw-dev";
      const actualManagedAgents = env.openClawManagementProfileHome
        ? await readOpenClawManagedAgentsFromProfile({
            profileHome: env.openClawManagementProfileHome,
            managementProfileKey: targetProfileKey,
          })
        : JSON.parse(await readFile(env.openClawManagementActualPath!, "utf8"));
      const pack = buildOpenClawManagementPack({ managementProfileKey: targetProfileKey });
      const report = buildOpenClawManagementDoctorReport({
        pack,
        actualManagedAgents,
        targetProfileKey,
      });

      return {
        configured: true,
        targetProfileKey: report.targetProfileKey,
        aligned: report.aligned,
        expectedAgentCount: report.expectedAgentCount,
        actualAgentCount: report.actualAgentCount,
        missingAgents: report.missingAgents,
        extraAgents: report.extraAgents,
        fieldMismatches: report.fieldMismatches,
      };
    } catch {
      return {
        configured: true,
        targetProfileKey: "openclaw-dev",
        aligned: false,
        expectedAgentCount: nativeOpenClawAgentRegistry.length,
        actualAgentCount: 0,
        missingAgents: [],
        extraAgents: [],
        fieldMismatches: [],
      };
    }
  };

  const sameStringArray = (left: string[], right: string[]) => {
    const leftSorted = [...left].sort((a, b) => a.localeCompare(b, "en"));
    const rightSorted = [...right].sort((a, b) => a.localeCompare(b, "en"));
    return leftSorted.length === rightSorted.length && leftSorted.every((value, index) => value === rightSorted[index]);
  };
  const REQUIRED_OPENCLAW_EXECUTE_ENDPOINT = "/v1/tasks/execute";
  const REQUIRED_OPENCLAW_RESPONSE_MODE = "parsed";
  const REQUIRED_WORKFLOW_CONTRACTS = [
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
  ] as const;
  const REQUIRED_WORKFLOW_RESPONSE_CONTRACTS = [
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
  ] as const;
  const REQUIRED_WORKFLOW_EXECUTION_CONTRACTS = [
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
  ] as const;
  const REQUIRED_WORKFLOW_EXECUTION_PROBES = [
    { workflow: "coach_conversation_full", target: "director-agent" },
    { workflow: "plan_adjustment", target: "life-secretary-agent" },
    { workflow: "memory_governance", target: "memory-governor-agent" },
  ] as const;
  const getMissingObjectFields = (value: unknown, requiredFields: readonly string[]) => {
    if (!value || typeof value !== "object") {
      return [...requiredFields];
    }
    const record = value as Record<string, unknown>;
    return requiredFields.filter((field) => !(field in record));
  };
  const probeExternalWorkflowExecution = async ({
    baseUrl,
    workflow,
    target,
    requiredMetadataFields,
    memoryFetchFields,
    authorityApplyFields,
  }: {
    baseUrl: string;
    workflow: string;
    target: string;
    requiredMetadataFields: readonly string[];
    memoryFetchFields: readonly string[];
    authorityApplyFields: readonly string[];
  }) => {
    const persona = nativeOpenClawAgentRegistry.find((agent) => agent.agentId === target);
    const context = {
      workflow,
      userId: "registry-probe-user",
      frontAgent: persona?.canFront ? target : "director-agent",
      runtimeAgentId: persona?.runtimeAgentId ?? `${target}-runtime-agent`,
      memoryScopes: persona?.memoryScopes ?? [],
      ...(workflow === "plan_adjustment"
        ? {
            authorityAction: "plan_change",
            proposalContext: { goalId: "registry-probe-goal" },
          }
        : {}),
      ...(workflow === "memory_governance"
        ? {
            authorityAction: "block_recall",
          }
        : {}),
    };

    try {
      const response = await fetch(new URL(REQUIRED_OPENCLAW_EXECUTE_ENDPOINT, baseUrl), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          target,
          mode: "generate",
          taskId: `registry-probe-${workflow}-${target}`,
          trace: {
            traceId: createId(),
            source: "mindanchor-gateway",
            operation: "registry-visibility-probe",
            agentName: target,
            workflow,
          },
          payload: {
            userPrompt: JSON.stringify(context),
          },
        }),
      });
      const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      const metadata = payload && typeof payload === "object" ? payload.metadata : null;
      const metadataRecord = metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : null;
      const missingRequiredMetadataFields = getMissingObjectFields(metadataRecord, requiredMetadataFields);
      const missingMemoryFetchFields = getMissingObjectFields(metadataRecord?.memoryFetch, memoryFetchFields);
      const missingAuthorityApplyFields = getMissingObjectFields(metadataRecord?.authorityApply, authorityApplyFields);

      if (
        response.ok &&
        missingRequiredMetadataFields.length === 0 &&
        missingMemoryFetchFields.length === 0 &&
        missingAuthorityApplyFields.length === 0
      ) {
        return null;
      }

      return {
        workflow,
        target,
        statusCode: response.status,
        missingRequiredMetadataFields,
        missingMemoryFetchFields,
        missingAuthorityApplyFields,
        error: response.ok ? null : typeof payload?.error === "string" ? payload.error : `Probe returned HTTP ${response.status}.`,
      };
    } catch (error) {
      return {
        workflow,
        target,
        statusCode: null,
        missingRequiredMetadataFields: [...requiredMetadataFields],
        missingMemoryFetchFields: [...memoryFetchFields],
        missingAuthorityApplyFields: [...authorityApplyFields],
        error: error instanceof Error ? error.message : "Unknown execute probe error.",
      };
    }
  };
  const buildRegistryHealthSummary = ({
    configured,
    reachable,
    missingInExternal,
    contractMismatches,
    runtimeContractMismatches,
    workflowContractMismatches,
    workflowResponseContractMismatches,
    workflowExecutionContractMismatches,
    workflowExecutionProbeMismatches,
    unknownExternalAgents,
  }: {
    configured: boolean;
    reachable: boolean;
    missingInExternal: string[];
    contractMismatches: Array<unknown>;
    runtimeContractMismatches: string[];
    workflowContractMismatches: Array<unknown>;
    workflowResponseContractMismatches: Array<unknown>;
    workflowExecutionContractMismatches: Array<unknown>;
    workflowExecutionProbeMismatches: Array<unknown>;
    unknownExternalAgents: string[];
  }) => {
    const healthIssueCounts = {
      missingPersonaCount: missingInExternal.length,
      contractMismatchCount: contractMismatches.length,
      runtimeContractMismatchCount: runtimeContractMismatches.length,
      workflowContractMismatchCount: workflowContractMismatches.length,
      workflowResponseContractMismatchCount: workflowResponseContractMismatches.length,
      workflowExecutionContractMismatchCount: workflowExecutionContractMismatches.length,
      workflowExecutionProbeMismatchCount: workflowExecutionProbeMismatches.length,
      unknownExternalAgentCount: unknownExternalAgents.length,
      totalIssueCount:
        missingInExternal.length +
        contractMismatches.length +
        runtimeContractMismatches.length +
        workflowContractMismatches.length +
        workflowResponseContractMismatches.length +
        workflowExecutionContractMismatches.length +
        workflowExecutionProbeMismatches.length,
    };

    const healthReasonCodes = [
      ...(healthIssueCounts.missingPersonaCount > 0 ? ["missing_persona"] : []),
      ...(healthIssueCounts.contractMismatchCount > 0 ? ["agent_contract_mismatch"] : []),
      ...(healthIssueCounts.runtimeContractMismatchCount > 0 ? ["runtime_contract_mismatch"] : []),
      ...(healthIssueCounts.workflowContractMismatchCount > 0 ? ["workflow_payload_contract_mismatch"] : []),
      ...(healthIssueCounts.workflowResponseContractMismatchCount > 0 ? ["workflow_response_contract_mismatch"] : []),
      ...(healthIssueCounts.workflowExecutionContractMismatchCount > 0 ? ["workflow_execution_contract_mismatch"] : []),
      ...(healthIssueCounts.workflowExecutionProbeMismatchCount > 0 ? ["workflow_execution_probe_mismatch"] : []),
    ];

    const healthStatus = !configured
      ? "not_configured"
      : !reachable
        ? "unreachable"
        : healthIssueCounts.totalIssueCount === 0
          ? "aligned"
          : "attention";

    return {
      healthStatus,
      healthReasonCodes,
      healthIssueCounts,
    } as const;
  };

  const fetchExternalOpenClawRegistry = async () => {
    if (!env.openClawBaseUrl) {
      return {
        ...buildRegistryHealthSummary({
          configured: false,
          reachable: false,
          missingInExternal: [],
          contractMismatches: [],
          runtimeContractMismatches: [],
          workflowContractMismatches: [],
          workflowResponseContractMismatches: [],
          workflowExecutionContractMismatches: [],
          workflowExecutionProbeMismatches: [],
          unknownExternalAgents: [],
        }),
        configured: false,
        reachable: false,
        baseUrl: null,
        runtime: null,
        runtimeVersion: null,
        responseMode: null,
        executeEndpoints: [],
        workflowContracts: [],
        workflowResponseContracts: [],
        workflowExecutionContracts: [],
        workflowExecutionProbeMismatches: [],
        agentCount: 0,
        agents: [],
        matchedAgentIds: [],
        missingInExternal: [],
        contractMismatches: [],
        runtimeContractMismatches: [],
        workflowContractMismatches: [],
        workflowResponseContractMismatches: [],
        workflowExecutionContractMismatches: [],
        unknownExternalAgents: [],
        error: null,
      };
    }

    try {
      const response = await fetch(new URL("/health", env.openClawBaseUrl));
      if (!response.ok) {
        const missingInExternal = nativeOpenClawAgentRegistry.map((agent) => agent.agentId);
        return {
          ...buildRegistryHealthSummary({
            configured: true,
            reachable: false,
            missingInExternal,
            contractMismatches: [],
            runtimeContractMismatches: [],
            workflowContractMismatches: [],
            workflowResponseContractMismatches: [],
            workflowExecutionContractMismatches: [],
            workflowExecutionProbeMismatches: [],
            unknownExternalAgents: [],
          }),
          configured: true,
          reachable: false,
          baseUrl: env.openClawBaseUrl,
          runtime: null,
          runtimeVersion: null,
          responseMode: null,
          executeEndpoints: [],
          workflowContracts: [],
          workflowResponseContracts: [],
          workflowExecutionContracts: [],
          workflowExecutionProbeMismatches: [],
          agentCount: 0,
          agents: [],
          matchedAgentIds: [],
          missingInExternal,
          contractMismatches: [],
          runtimeContractMismatches: [],
          workflowContractMismatches: [],
          workflowResponseContractMismatches: [],
          workflowExecutionContractMismatches: [],
          unknownExternalAgents: [],
          error: `Health request failed with status ${response.status}.`,
        };
      }

      const payload = (await response.json()) as {
        runtime?: unknown;
        runtimeVersion?: unknown;
        responseMode?: unknown;
        endpoints?: unknown;
        workflowContracts?: Array<{
          workflow?: unknown;
          requiredContextFields?: unknown;
        }>;
        workflowResponseContracts?: Array<{
          workflow?: unknown;
          requiredParsedFields?: unknown;
        }>;
        workflowExecutionContracts?: Array<{
          workflow?: unknown;
          requiredMetadataFields?: unknown;
          memoryFetchFields?: unknown;
          authorityApplyFields?: unknown;
        }>;
        agentCount?: unknown;
        agents?: Array<{
          name?: unknown;
          worker?: unknown;
          modelTarget?: unknown;
          skillCount?: unknown;
          supportedWorkflows?: unknown;
          memoryScopes?: unknown;
          canFront?: unknown;
          canConsult?: unknown;
          canWritePlans?: unknown;
          canGovernMemory?: unknown;
        }>;
      };

      const agents = Array.isArray(payload.agents)
        ? payload.agents
            .map((agent) => ({
              name: typeof agent?.name === "string" ? agent.name : "",
              worker: typeof agent?.worker === "string" ? agent.worker : "",
              modelTarget: typeof agent?.modelTarget === "string" ? agent.modelTarget : "",
              skillCount: typeof agent?.skillCount === "number" ? agent.skillCount : 0,
              supportedWorkflows: Array.isArray(agent?.supportedWorkflows)
                ? agent.supportedWorkflows.filter((item): item is string => typeof item === "string")
                : [],
              memoryScopes: Array.isArray(agent?.memoryScopes)
                ? agent.memoryScopes.filter((item): item is string => typeof item === "string")
                : [],
              canFront: agent?.canFront === true,
              canConsult: agent?.canConsult === true,
              canWritePlans: agent?.canWritePlans === true,
              canGovernMemory: agent?.canGovernMemory === true,
            }))
            .filter((agent) => agent.name.length > 0)
        : [];
      const responseMode = typeof payload.responseMode === "string" ? payload.responseMode : null;
      const executeEndpoints = Array.isArray(payload.endpoints)
        ? payload.endpoints.filter((item): item is string => typeof item === "string" && item.length > 0)
        : [];
      const workflowContracts = Array.isArray(payload.workflowContracts)
        ? payload.workflowContracts
            .map((contract) => ({
              workflow: typeof contract?.workflow === "string" ? contract.workflow : "",
              requiredContextFields: Array.isArray(contract?.requiredContextFields)
                ? contract.requiredContextFields.filter((item): item is string => typeof item === "string" && item.length > 0)
                : [],
            }))
            .filter((contract) => contract.workflow.length > 0)
        : [];
      const workflowResponseContracts = Array.isArray(payload.workflowResponseContracts)
        ? payload.workflowResponseContracts
            .map((contract) => ({
              workflow: typeof contract?.workflow === "string" ? contract.workflow : "",
              requiredParsedFields: Array.isArray(contract?.requiredParsedFields)
                ? contract.requiredParsedFields.filter((item): item is string => typeof item === "string" && item.length > 0)
                : [],
            }))
            .filter((contract) => contract.workflow.length > 0)
        : [];
      const workflowExecutionContracts = Array.isArray(payload.workflowExecutionContracts)
        ? payload.workflowExecutionContracts
            .map((contract) => ({
              workflow: typeof contract?.workflow === "string" ? contract.workflow : "",
              requiredMetadataFields: Array.isArray(contract?.requiredMetadataFields)
                ? contract.requiredMetadataFields.filter((item): item is string => typeof item === "string" && item.length > 0)
                : [],
              memoryFetchFields: Array.isArray(contract?.memoryFetchFields)
                ? contract.memoryFetchFields.filter((item): item is string => typeof item === "string" && item.length > 0)
                : [],
              authorityApplyFields: Array.isArray(contract?.authorityApplyFields)
                ? contract.authorityApplyFields.filter((item): item is string => typeof item === "string" && item.length > 0)
                : [],
            }))
            .filter((contract) => contract.workflow.length > 0)
        : [];

      const nativeIds = new Set(nativeOpenClawAgentRegistry.map((agent) => agent.agentId));
      const externalIds = new Set(agents.map((agent) => agent.name));
      const externalById = new Map(agents.map((agent) => [agent.name, agent] as const));
      const contractMismatches = nativeOpenClawAgentRegistry.flatMap((nativeAgent) => {
        const externalAgent = externalById.get(nativeAgent.agentId);
        if (!externalAgent) {
          return [];
        }
        const mismatchFields: string[] = [];
        if (!sameStringArray(nativeAgent.supportedWorkflows, externalAgent.supportedWorkflows)) {
          mismatchFields.push("supportedWorkflows");
        }
        if (!sameStringArray(nativeAgent.memoryScopes, externalAgent.memoryScopes)) {
          mismatchFields.push("memoryScopes");
        }
        if (nativeAgent.canFront !== externalAgent.canFront) {
          mismatchFields.push("canFront");
        }
        if (nativeAgent.canConsult !== externalAgent.canConsult) {
          mismatchFields.push("canConsult");
        }
        if (nativeAgent.canWritePlans !== externalAgent.canWritePlans) {
          mismatchFields.push("canWritePlans");
        }
        if (nativeAgent.canGovernMemory !== externalAgent.canGovernMemory) {
          mismatchFields.push("canGovernMemory");
        }
        return mismatchFields.length > 0
          ? [
              {
                agentId: nativeAgent.agentId,
                mismatchFields,
              },
            ]
          : [];
      });
      const runtimeContractMismatches: string[] = [];
      if (responseMode !== REQUIRED_OPENCLAW_RESPONSE_MODE) {
        runtimeContractMismatches.push("responseMode");
      }
      if (!executeEndpoints.includes(REQUIRED_OPENCLAW_EXECUTE_ENDPOINT)) {
        runtimeContractMismatches.push("executeEndpoints");
      }
      const externalWorkflowContractByWorkflow = new Map(workflowContracts.map((contract) => [contract.workflow, contract] as const));
      const workflowContractMismatches = REQUIRED_WORKFLOW_CONTRACTS.flatMap((requiredContract) => {
        const externalContract = externalWorkflowContractByWorkflow.get(requiredContract.workflow);
        if (!externalContract) {
          return [
            {
              workflow: requiredContract.workflow,
              missingRequiredContextFields: [...requiredContract.requiredContextFields],
            },
          ];
        }
        const missingRequiredContextFields = requiredContract.requiredContextFields.filter(
          (field) => !externalContract.requiredContextFields.includes(field),
        );
        return missingRequiredContextFields.length > 0
          ? [
              {
                workflow: requiredContract.workflow,
                missingRequiredContextFields,
              },
            ]
          : [];
      });
      const externalWorkflowResponseContractByWorkflow = new Map(
        workflowResponseContracts.map((contract) => [contract.workflow, contract] as const),
      );
      const workflowResponseContractMismatches = REQUIRED_WORKFLOW_RESPONSE_CONTRACTS.flatMap((requiredContract) => {
        const externalContract = externalWorkflowResponseContractByWorkflow.get(requiredContract.workflow);
        if (!externalContract) {
          return [
            {
              workflow: requiredContract.workflow,
              missingRequiredParsedFields: [...requiredContract.requiredParsedFields],
            },
          ];
        }
        const missingRequiredParsedFields = requiredContract.requiredParsedFields.filter(
          (field) => !externalContract.requiredParsedFields.includes(field),
        );
        return missingRequiredParsedFields.length > 0
          ? [
              {
                workflow: requiredContract.workflow,
                missingRequiredParsedFields,
              },
            ]
          : [];
      });
      const externalWorkflowExecutionContractByWorkflow = new Map(
        workflowExecutionContracts.map((contract) => [contract.workflow, contract] as const),
      );
      const workflowExecutionContractMismatches = REQUIRED_WORKFLOW_EXECUTION_CONTRACTS.flatMap((requiredContract) => {
        const externalContract = externalWorkflowExecutionContractByWorkflow.get(requiredContract.workflow);
        if (!externalContract) {
          return [
            {
              workflow: requiredContract.workflow,
              missingRequiredMetadataFields: [...requiredContract.requiredMetadataFields],
              missingMemoryFetchFields: [...requiredContract.memoryFetchFields],
              missingAuthorityApplyFields: [...requiredContract.authorityApplyFields],
            },
          ];
        }
        const missingRequiredMetadataFields = requiredContract.requiredMetadataFields.filter(
          (field) => !externalContract.requiredMetadataFields.includes(field),
        );
        const missingMemoryFetchFields = requiredContract.memoryFetchFields.filter(
          (field) => !externalContract.memoryFetchFields.includes(field),
        );
        const missingAuthorityApplyFields = requiredContract.authorityApplyFields.filter(
          (field) => !externalContract.authorityApplyFields.includes(field),
        );
        return missingRequiredMetadataFields.length > 0 ||
          missingMemoryFetchFields.length > 0 ||
          missingAuthorityApplyFields.length > 0
          ? [
              {
                workflow: requiredContract.workflow,
                missingRequiredMetadataFields,
                missingMemoryFetchFields,
                missingAuthorityApplyFields,
              },
            ]
          : [];
      });
      const workflowExecutionProbeMismatches = executeEndpoints.includes(REQUIRED_OPENCLAW_EXECUTE_ENDPOINT)
        ? (
            await Promise.all(
              REQUIRED_WORKFLOW_EXECUTION_PROBES.map(async (probe) => {
                const requiredContract = REQUIRED_WORKFLOW_EXECUTION_CONTRACTS.find(
                  (contract) => contract.workflow === probe.workflow,
                );
                if (!requiredContract) {
                  return null;
                }
                return probeExternalWorkflowExecution({
                  baseUrl: env.openClawBaseUrl!,
                  workflow: probe.workflow,
                  target: probe.target,
                  requiredMetadataFields: requiredContract.requiredMetadataFields,
                  memoryFetchFields: requiredContract.memoryFetchFields,
                  authorityApplyFields: requiredContract.authorityApplyFields,
                });
              }),
            )
          ).filter((item): item is NonNullable<typeof item> => item !== null)
        : [];
      const matchedAgentIds = nativeOpenClawAgentRegistry
        .map((agent) => agent.agentId)
        .filter((agentId) => externalIds.has(agentId));
      const missingInExternal = nativeOpenClawAgentRegistry
        .map((agent) => agent.agentId)
        .filter((agentId) => !externalIds.has(agentId));
      const unknownExternalAgents = agents.map((agent) => agent.name).filter((agentId) => !nativeIds.has(agentId));

      return {
        ...buildRegistryHealthSummary({
          configured: true,
          reachable: true,
          missingInExternal,
          contractMismatches,
          runtimeContractMismatches,
          workflowContractMismatches,
          workflowResponseContractMismatches,
          workflowExecutionContractMismatches,
          workflowExecutionProbeMismatches,
          unknownExternalAgents,
        }),
        configured: true,
        reachable: true,
        baseUrl: env.openClawBaseUrl,
        runtime: typeof payload.runtime === "string" ? payload.runtime : null,
        runtimeVersion: typeof payload.runtimeVersion === "string" ? payload.runtimeVersion : null,
        responseMode,
        executeEndpoints,
        workflowContracts,
        workflowResponseContracts,
        workflowExecutionContracts,
        workflowExecutionProbeMismatches,
        agentCount: typeof payload.agentCount === "number" ? payload.agentCount : agents.length,
        agents,
        matchedAgentIds,
        missingInExternal,
        contractMismatches,
        runtimeContractMismatches,
        workflowContractMismatches,
        workflowResponseContractMismatches,
        workflowExecutionContractMismatches,
        unknownExternalAgents,
        error: null,
      };
    } catch (error) {
      const missingInExternal = nativeOpenClawAgentRegistry.map((agent) => agent.agentId);
      return {
        ...buildRegistryHealthSummary({
          configured: true,
          reachable: false,
          missingInExternal,
          contractMismatches: [],
          runtimeContractMismatches: [],
          workflowContractMismatches: [],
          workflowResponseContractMismatches: [],
          workflowExecutionContractMismatches: [],
          workflowExecutionProbeMismatches: [],
          unknownExternalAgents: [],
        }),
        configured: true,
        reachable: false,
        baseUrl: env.openClawBaseUrl,
        runtime: null,
        runtimeVersion: null,
        responseMode: null,
        executeEndpoints: [],
        workflowContracts: [],
        workflowResponseContracts: [],
        workflowExecutionContracts: [],
        workflowExecutionProbeMismatches: [],
        agentCount: 0,
        agents: [],
        matchedAgentIds: [],
        missingInExternal,
        contractMismatches: [],
        runtimeContractMismatches: [],
        workflowContractMismatches: [],
        workflowResponseContractMismatches: [],
        workflowExecutionContractMismatches: [],
        unknownExternalAgents: [],
        error: error instanceof Error ? error.message : "Unknown external OpenClaw registry error.",
      };
    }
  };

  app.addHook("onRequest", async (request, reply) => {
    const traceAware = request as typeof request & TraceAwareRequest;
    const incomingTraceId = request.headers[TRACE_HEADER_NAMES.traceId];
    const incomingParentTraceId = request.headers[TRACE_HEADER_NAMES.parentTraceId];
    traceAware.mindanchorTraceId = typeof incomingTraceId === "string" && incomingTraceId.length > 0 ? incomingTraceId : createId();
    traceAware.mindanchorParentTraceId = typeof incomingParentTraceId === "string" && incomingParentTraceId.length > 0 ? incomingParentTraceId : undefined;
    reply.header(TRACE_HEADER_NAMES.traceId, traceAware.mindanchorTraceId);
    if (traceAware.mindanchorParentTraceId) {
      reply.header(TRACE_HEADER_NAMES.parentTraceId, traceAware.mindanchorParentTraceId);
    }
    try {
      traceAware.authContext = await resolveAuthContext(env, request);
    } catch (error) {
      reply.code(401);
      return reply.send({
        message: error instanceof Error ? error.message : "Authentication failed.",
      });
    }
    await traceLogger.info({
      traceId: traceAware.mindanchorTraceId,
      parentTraceId: traceAware.mindanchorParentTraceId,
      event: "gateway.request.received",
      message: `${request.method} ${request.url}`,
      metadata: {
        method: request.method,
        url: request.url,
        requestId: request.id,
      },
    });
  });

  app.addHook("onResponse", async (request, reply) => {
    const traceAware = request as typeof request & TraceAwareRequest;
    if (!traceAware.mindanchorTraceId) {
      return;
    }
    await traceLogger.info({
      traceId: traceAware.mindanchorTraceId,
      parentTraceId: traceAware.mindanchorParentTraceId,
      event: "gateway.request.completed",
      message: `${request.method} ${request.url} -> ${reply.statusCode}`,
      metadata: {
        method: request.method,
        url: request.url,
        requestId: request.id,
        statusCode: reply.statusCode,
      },
    });
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof z.ZodError) {
      reply.code(400).send({
        message: "Invalid request.",
        issues: error.issues,
      });
      return;
    }

    if (error instanceof CoreError) {
      reply.code(coreErrorStatus(error)).send(coreErrorResponse(error));
      return;
    }

    request.log.error(error);
    reply.code(500).send({
      message: error instanceof Error ? error.message : "Internal server error.",
    });
  });

  const getRequestTrace = (request: FastifyRequest) => {
    const traceAware = request as typeof request & TraceAwareRequest;
    return {
      traceId: traceAware.mindanchorTraceId ?? createId(),
      parentTraceId: traceAware.mindanchorParentTraceId,
    };
  };

  const getRequestAuth = (request: FastifyRequest) => (request as typeof request & TraceAwareRequest).authContext ?? null;
  const getRequestUserId = (request: FastifyRequest, fallbackUserId?: string) =>
    getRequestAuth(request)?.userId ?? fallbackUserId ?? "demo-user";
  const requireAuthenticatedHealthUser = (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getRequestAuth(request)?.userId;
    if (!userId) {
      reply.code(401);
      return null;
    }

    return userId;
  };
  const requireHealthConsent = (userId: string, consentRef: string | undefined, reply: FastifyReply) => {
    if (!consentRef) {
      reply.code(403);
      return false;
    }
    try {
      wayfinderConsent.assertGranted(userId, consentRef);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === "wayfinder_consent_required") {
        reply.code(403);
        return false;
      }
      throw error;
    }
  };
  const buildMeResponse = (request: FastifyRequest) => {
    const auth = getRequestAuth(request);
    return meResponseSchema.parse({
      authenticated: Boolean(auth),
      user: auth
        ? {
            id: auth.userId,
            email: auth.email,
            provider: auth.provider,
          }
        : null,
    });
  };

  const internalAgentMemoryContextQuerySchema = z.object({
    userId: userIdSchema.optional(),
    agentId: agentTeamAgentIdSchema,
    scopes: z.string().optional(),
  });

  const internalAgentMemoryProposalInputSchema = z.object({
    userId: userIdSchema,
    sourceAgent: agentTeamAgentIdSchema,
    targetScope: memoryScopeSchema,
    kind: z.string().min(1),
    summary: z.string().min(1),
    rationale: z.string().min(1),
    sourceTurnRef: z.string().min(1).optional(),
    confidence: z.number().min(0).max(1).optional(),
  });

  const internalJarvisAuthorityExecutionInputSchema = z.object({
    userId: userIdSchema,
    goalId: z.string().optional(),
    riskLevel: z.enum(["low", "medium", "high"]),
    authorityAgent: z.literal("life-secretary-agent"),
    targetKind: z.enum(["task_order", "recovery_block", "plan_change"]),
    executionMode: z.enum(["apply_direct", "proposal"]),
    orderedTaskIds: z.array(z.string()).optional(),
    rationale: z.string().min(1),
    summary: z.string().optional(),
    beforeStateSummary: z.string().optional(),
    afterStateSummary: z.string().optional(),
    sessionId: z.string().optional(),
    taskId: z.string().optional(),
    nextStep: z.string().optional(),
    suggestedMinutes: z.number().int().positive().optional(),
    reprioritizedTaskIds: z.array(z.string()).optional(),
  });

  const internalDataAuthorityExecutionInputSchema = z.discriminatedUnion("action", [
    z.object({
      authorityAgent: z.literal("memory-governor-agent"),
      action: z.literal("accept_candidate"),
      executionMode: z.literal("govern"),
      candidateId: z.string().min(1),
      memoryId: z.string().optional(),
    }),
    z.object({
      authorityAgent: z.literal("memory-governor-agent"),
      action: z.literal("reject_candidate"),
      executionMode: z.literal("govern"),
      candidateId: z.string().min(1),
      memoryId: z.string().optional(),
    }),
    z.object({
      authorityAgent: z.literal("memory-governor-agent"),
      action: z.literal("block_recall"),
      executionMode: z.literal("govern"),
      candidateId: z.string().optional(),
      memoryId: z.string().min(1),
    }),
    z.object({
      authorityAgent: z.literal("memory-governor-agent"),
      action: z.literal("delete_memory"),
      executionMode: z.literal("govern"),
      candidateId: z.string().optional(),
      memoryId: z.string().min(1),
    }),
  ]);

  await registerWayfinderRoutes(app, {
    repository: wayfinderRepository,
    consent: wayfinderConsent,
    situations: wayfinderSituations,
    decisions: wayfinderDecisions,
    optionGeneration: wayfinderOptionGeneration,
    audioEvents: wayfinderAudioEvents,
  });
  await registerCoreRoutes(app, { core });

  app.get("/health", async () => ({
    ok: true,
    mode: env.agentMode,
    topology: "gateway->openclaw-cluster",
    openClawBaseUrl: env.openClawBaseUrl ?? null,
  }));

  app.get("/internal/agent-memory/context", async (request, reply) => {
    const query = internalAgentMemoryContextQuerySchema.parse(request.query);
    const scopes = query.scopes
      ? query.scopes
          .split(",")
          .map((scope) => scope.trim())
          .filter(Boolean)
          .map((scope) => memoryScopeSchema.parse(scope))
      : undefined;

    try {
      const context = agentMemory.getContext({
        userId: query.userId ?? "demo-user",
        agentId: query.agentId,
        scopes,
      });
      return agentMemoryContextBundleSchema.parse(context);
    } catch (error) {
      if (error instanceof AgentMemoryScopeError) {
        reply.code(403);
        return { message: error.message };
      }
      throw error;
    }
  });

  app.post("/internal/agent-memory/proposals", async (request, reply) => {
    const payload = internalAgentMemoryProposalInputSchema.parse(request.body);

    try {
      const proposal = await agentMemoryProposals.submit(payload);
      return agentMemoryProposalSchema.parse(proposal);
    } catch (error) {
      if (error instanceof AgentMemoryScopeError) {
        reply.code(403);
        return { message: error.message };
      }
      throw error;
    }
  });

  app.post("/internal/agent-authority/jarvis/execute", async (request) => {
    const payload = internalJarvisAuthorityExecutionInputSchema.parse(request.body);
    return authorityExecution.executeJarvisDecision(payload);
  });

  app.post("/internal/agent-authority/data/execute", async (request) => {
    const payload = internalDataAuthorityExecutionInputSchema.parse(request.body);
    return authorityExecution.executeDataDecision(payload);
  });

  const issueGatewayLocalAuthSession = async (localUser: {
    id: string;
    email: string;
    displayName?: string | null;
  }) => {
    const signed = await signGatewayAccessToken({
      env,
      userId: localUser.id,
      email: localUser.email,
    });
    const refresh = createGatewayRefreshToken();
    await store.createLocalAuthRefreshToken({
      userId: localUser.id,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
    });

    return authSessionResponseSchema.parse({
      accessToken: signed.accessToken,
      refreshToken: refresh.refreshToken,
      expiresAt: signed.expiresAt,
      user: {
        id: localUser.id,
        email: localUser.email,
        displayName: localUser.displayName ?? null,
        provider: "gateway-local",
      },
    });
  };

  app.post("/auth/register", async (request, reply) => {
    const payload = authRegisterInputSchema.parse(request.body);
    const existing = store.findLocalAuthUserByEmail(payload.email);
    if (existing) {
      reply.code(409);
      return { message: "Email already registered." };
    }

    const localUser = await store.createLocalAuthUser({
      email: payload.email,
      passwordHash: hashPassword(payload.password),
      displayName: payload.displayName,
    });

    return issueGatewayLocalAuthSession(localUser);
  });

  app.post("/auth/login", async (request, reply) => {
    const payload = authLoginInputSchema.parse(request.body);
    const localUser = store.findLocalAuthUserByEmail(payload.email);
    if (!localUser || !verifyPassword(payload.password, localUser.passwordHash)) {
      reply.code(401);
      return { message: "Invalid email or password." };
    }

    return issueGatewayLocalAuthSession(localUser);
  });

  app.post("/auth/refresh", async (request, reply) => {
    const payload = authRefreshInputSchema.parse(request.body);
    const currentTokenHash = hashGatewayRefreshToken(payload.refreshToken);
    const currentRefreshToken = store.findActiveLocalAuthRefreshTokenByHash(currentTokenHash);
    if (!currentRefreshToken) {
      reply.code(401);
      return { message: "Invalid or expired refresh token." };
    }

    const localUser = store.findLocalAuthUserById(currentRefreshToken.userId);
    if (!localUser) {
      await store.revokeLocalAuthRefreshToken(currentRefreshToken.id);
      reply.code(401);
      return { message: "Invalid or expired refresh token." };
    }

    const signed = await signGatewayAccessToken({
      env,
      userId: localUser.id,
      email: localUser.email,
    });
    const nextRefresh = createGatewayRefreshToken();
    const nextRefreshToken = await store.createLocalAuthRefreshToken({
      userId: localUser.id,
      tokenHash: nextRefresh.tokenHash,
      expiresAt: nextRefresh.expiresAt,
    });
    await store.revokeLocalAuthRefreshToken(currentRefreshToken.id, {
      replacedByTokenId: nextRefreshToken.id,
    });

    return authSessionResponseSchema.parse({
      accessToken: signed.accessToken,
      refreshToken: nextRefresh.refreshToken,
      expiresAt: signed.expiresAt,
      user: {
        id: localUser.id,
        email: localUser.email,
        displayName: localUser.displayName ?? null,
        provider: "gateway-local",
      },
    });
  });

  app.post("/auth/logout", async (request) => {
    const payload = authLogoutInputSchema.parse(request.body);
    const revoked = await store.revokeLocalAuthRefreshTokenByHash(hashGatewayRefreshToken(payload.refreshToken));
    return authLogoutResponseSchema.parse({
      revoked: Boolean(revoked),
    });
  });

  app.get("/me", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }
    return buildMeResponse(request);
  });

  app.get("/client/bootstrap", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    const userId = auth.userId;
    return clientBootstrapResponseSchema.parse({
      me: buildMeResponse(request),
      dashboard: await orchestrator.getDashboardSummary(userId),
      inboxOverview: await orchestrator.getClientInboxOverview(userId, 20),
      goalFlow: await orchestrator.getGoalFlowOverview(userId),
      permissions: {
        notificationChannelRecommended: store.getLatestMobileCaptureDevice(userId) ? "mobile_push" : "desktop_local",
        desktopSignalsExpected: true,
        accessibilityRecommended: true,
      },
    });
  });

  app.get("/coach/front-agent", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }
    return coachFrontAgentStateSchema.parse(orchestrator.getCoachFrontAgentState(auth.userId));
  });

  app.post("/coach/sessions", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    const payload = createCoachSessionInputSchema.parse(request.body);
    const trace = getRequestTrace(request);
    const session = await conversationCoach.createSession(auth.userId, payload, trace.traceId);
    return coachSessionSchema.parse(session);
  });

  app.get("/coach/sessions", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    return z.array(coachSessionSchema).parse(conversationCoach.listSessions(auth.userId));
  });

  app.get("/coach/sessions/:sessionId", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    const params = request.params as { sessionId: string };
    const result = conversationCoach.getSession(auth.userId, params.sessionId);
    if (!result) {
      reply.code(404);
      return { message: "Session not found." };
    }

    return coachSessionDetailResponseSchema.parse(result);
  });

  app.delete("/coach/sessions/:sessionId", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    const params = request.params as { sessionId: string };
    const deleted = await conversationCoach.deleteSession(auth.userId, params.sessionId);
    if (!deleted) {
      reply.code(404);
      return { message: "Session not found." };
    }

    return coachSessionSchema.parse(deleted);
  });

  app.post("/coach/sessions/:sessionId/messages", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    const params = request.params as { sessionId: string };
    const payload = createCoachMessageInputSchema.parse(request.body);
    const trace = getRequestTrace(request);
    const response = await conversationCoach.sendMessage(auth.userId, params.sessionId, payload, trace.traceId);
    if (!response) {
      reply.code(404);
      return { message: "Session not found." };
    }

    return coachMessageSendResponseSchema.parse(response);
  });

  app.get("/coach/messages/:messageId", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    const params = request.params as { messageId: string };
    const message = conversationCoach.getMessage(auth.userId, params.messageId);
    if (!message) {
      reply.code(404);
      return { message: "Message not found." };
    }

    return coachMessageSchema.parse(message);
  });

  app.post("/coach/messages/:messageId/retry", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    const params = request.params as { messageId: string };
    const trace = getRequestTrace(request);
    const message = await conversationCoach.retryMessage(auth.userId, params.messageId, trace.traceId);
    if (!message) {
      reply.code(404);
      return { message: "Message not found." };
    }

    return coachMessageSendResponseSchema.parse(message);
  });

  app.post("/coach/messages/:messageId/feedback", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    const params = request.params as { messageId: string };
    const payload = coachMessageFeedbackInputSchema.parse(request.body);
    const feedback = await conversationCoach.submitFeedback(auth.userId, params.messageId, payload);
    if (!feedback) {
      reply.code(404);
      return { message: "Message not found." };
    }

    return coachFeedbackSchema.parse(feedback);
  });

  app.get("/coach/memories", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    return z.array(coachMemoryItemSchema).parse(conversationCoach.listMemory(auth.userId));
  });

  app.delete("/coach/memories/:memoryId", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }

    const params = request.params as { memoryId: string };
    const memory = await conversationCoach.revokeMemory(auth.userId, params.memoryId);
    if (!memory) {
      reply.code(404);
      return { message: "Memory not found." };
    }

    return coachMemoryItemSchema.parse(memory);
  });

  app.post("/coach/front-agent", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }
    const payload = coachFrontAgentStateSchema.parse(request.body);
    const saved = await orchestrator.setCoachFrontAgentState(auth.userId, payload);
    return coachFrontAgentStateSchema.parse(saved);
  });

  app.get("/coach/proposals", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }
    const proposals = store.listPlanChangeProposals(auth.userId);
    return z.array(planChangeProposalSchema).parse(proposals);
  });

  app.get("/coach/memory", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }
    const candidates = store.listMemoryCandidates(auth.userId);
    return z.array(memoryCandidateSchema).parse(candidates);
  });

  app.post("/coach/proposals/:proposalId/approve", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }
    const params = request.params as { proposalId: string };
    const existing = store.listPlanChangeProposals(auth.userId).find((proposal) => proposal.id === params.proposalId);
    if (!existing) {
      reply.code(404);
      return { message: "Proposal not found." };
    }
    const result = await jarvisCommands.approveProposal(params.proposalId);
    if (!result.proposal || result.proposal.userId !== auth.userId) {
      reply.code(404);
      return { message: "Proposal not found." };
    }
    if (result.status === "rejected" && result.reason === "proposal_already_final") {
      reply.code(409);
      return {
        message: "Proposal already finalized.",
        reason: result.reason,
        proposal: planChangeProposalSchema.parse(result.proposal),
      };
    }
    return planChangeProposalSchema.parse(result.proposal);
  });

  app.post("/coach/proposals/:proposalId/reject", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }
    const params = request.params as { proposalId: string };
    const existing = store.listPlanChangeProposals(auth.userId).find((proposal) => proposal.id === params.proposalId);
    if (!existing) {
      reply.code(404);
      return { message: "Proposal not found." };
    }
    const result = await jarvisCommands.rejectProposal(params.proposalId);
    if (!result.proposal || result.proposal.userId !== auth.userId) {
      reply.code(404);
      return { message: "Proposal not found." };
    }
    if (result.status === "rejected" && result.reason === "proposal_already_final") {
      reply.code(409);
      return {
        message: "Proposal already finalized.",
        reason: result.reason,
        proposal: planChangeProposalSchema.parse(result.proposal),
      };
    }
    return planChangeProposalSchema.parse(result.proposal);
  });

  app.post("/coach/memory/:memoryId/recall-block", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }
    const params = request.params as { memoryId: string };
    const existing = store.listMemoryCandidates(auth.userId).find((item) => item.memoryId === params.memoryId);
    if (!existing) {
      reply.code(404);
      return { message: "Memory not found." };
    }
    const result = await dataMemory.blockMemoryRecall({
      actorAgent: "memory-governor-agent",
      memoryId: params.memoryId,
    });
    if (!result) {
      reply.code(404);
      return { message: "Memory not found." };
    }
    if ("reason" in result) {
      reply.code(403);
      return { message: result.message };
    }
    const candidate = store.listMemoryCandidates(auth.userId).find((item) => item.memoryId === params.memoryId);
    if (!candidate) {
      reply.code(404);
      return { message: "Memory candidate not found." };
    }
    return memoryCandidateSchema.parse(candidate);
  });

  app.post("/coach/memory/:memoryId/delete", async (request, reply) => {
    const auth = getRequestAuth(request);
    if (!auth) {
      reply.code(401);
      return { message: "Authentication required." };
    }
    const params = request.params as { memoryId: string };
    const existing = store.listMemoryCandidates(auth.userId).find((item) => item.memoryId === params.memoryId);
    if (!existing) {
      reply.code(404);
      return { message: "Memory not found." };
    }
    const result = await dataMemory.deleteMemory({
      actorAgent: "memory-governor-agent",
      memoryId: params.memoryId,
    });
    if (!result) {
      reply.code(404);
      return { message: "Memory not found." };
    }
    if ("reason" in result) {
      reply.code(403);
      return { message: result.message };
    }
    const candidate = store.listMemoryCandidates(auth.userId).find((item) => item.memoryId === params.memoryId);
    if (!candidate) {
      reply.code(404);
      return { message: "Memory candidate not found." };
    }
    return memoryCandidateSchema.parse(candidate);
  });

  app.get("/debug/model-probe/:agentName", async (request) => {
    const params = request.params as { agentName: string };
    const query = request.query as { userId?: string; scenarioId?: string };
    const trace = getRequestTrace(request);
    return orchestrator.probeAgentModel(
      params.agentName,
      getRequestUserId(request, typeof query.userId === "string" ? query.userId : undefined),
      query.scenarioId,
      trace.traceId,
    );
  });

  app.get("/debug/agent-configs", async () => {
    return debugAgentConfigsResponseSchema.parse(getAgentConfigAuditResponse(env));
  });

  app.get("/debug/openclaw/adapter", async () => {
    return openClawAdapterStatusResponseSchema.parse(orchestrator.getOpenClawAdapterStatus());
  });

  app.get("/debug/openclaw/native-agents", async () => {
    return buildNativeOpenClawRegistryResponse();
  });

  app.get("/debug/openclaw/registry-visibility", async () => {
    return openClawRegistryVisibilityResponseSchema.parse({
      source: "gateway-openclaw-registry-visibility",
      explanation:
        "This compares the repository's native OpenClaw persona registry with the currently configured external OpenClaw runtime health output, so you can see whether the external instance is actually exposing the same agents.",
      nativeRegistry: buildNativeOpenClawRegistryResponse(),
      externalRuntime: await fetchExternalOpenClawRegistry(),
      managementIntegration: await fetchOpenClawManagementIntegration(),
    });
  });

  app.get("/debug/agent/chief-route", async (request) => {
    const query = request.query as {
      workflow?: string;
      userId?: string;
      taskId?: string;
      periodType?: "weekly" | "monthly";
      scenarioId?: string;
    };
    const trace = getRequestTrace(request);
    return orchestrator.debugChiefRoute({
      workflow: String(query.workflow ?? "state_assessment"),
      userId: getRequestUserId(request, typeof query.userId === "string" ? query.userId : undefined),
      taskId: query.taskId,
      periodType: query.periodType,
      scenarioId: query.scenarioId,
      parentTraceId: trace.traceId,
    });
  });

  app.get("/debug/agent/state-insight", async (request) => {
    const query = request.query as { userId?: string; scenarioId?: string };
    const trace = getRequestTrace(request);
    return orchestrator.debugStateInsight(
      getRequestUserId(request, typeof query.userId === "string" ? query.userId : undefined),
      query.scenarioId,
      trace.traceId,
    );
  });

  app.get("/debug/agent/interruption-recovery", async (request) => {
    const query = request.query as { userId?: string; taskId?: string; scenarioId?: string };
    const trace = getRequestTrace(request);
    return orchestrator.debugRecovery(
      getRequestUserId(request, typeof query.userId === "string" ? query.userId : undefined),
      query.taskId,
      query.scenarioId,
      trace.traceId,
    );
  });

  app.get("/debug/agent/reflection", async (request) => {
    const query = request.query as { userId?: string; periodType?: "weekly" | "monthly"; scenarioId?: string };
    const trace = getRequestTrace(request);
    return orchestrator.debugReflection(
      getRequestUserId(request, typeof query.userId === "string" ? query.userId : undefined),
      query.periodType ?? "weekly",
      query.scenarioId,
      trace.traceId,
    );
  });

  app.get("/debug/agent/task-management", async (request) => {
    const query = request.query as { userId?: string; goalId?: string; scenarioId?: string };
    const trace = getRequestTrace(request);
    return orchestrator.debugTaskManagement(
      getRequestUserId(request, typeof query.userId === "string" ? query.userId : undefined),
      query.goalId,
      query.scenarioId,
      trace.traceId,
    );
  });

  app.get("/debug/agent/progress-feedback", async (request) => {
    const query = request.query as { userId?: string; scenarioId?: string };
    const trace = getRequestTrace(request);
    return orchestrator.debugProgressSummary(
      getRequestUserId(request, typeof query.userId === "string" ? query.userId : undefined),
      query.scenarioId,
      trace.traceId,
    );
  });

  app.get("/debug/agent/automation", async (request) => {
    const query = request.query as { userId?: string; scenarioId?: string };
    const trace = getRequestTrace(request);
    return orchestrator.debugAutomation(
      getRequestUserId(request, typeof query.userId === "string" ? query.userId : undefined),
      query.scenarioId,
      trace.traceId,
    );
  });

  app.get("/debug/scenarios", async () => {
    return {
      scenarios: orchestrator.listDebugScenarios(),
    };
  });

  app.post("/debug/scenarios/:scenarioId/seed", async (request, reply) => {
    const params = request.params as { scenarioId: string };
    const scenarioId = debugScenarioIdSchema.parse(params.scenarioId);
    const trace = getRequestTrace(request);
    const scenario = await orchestrator.seedDebugScenario(scenarioId, trace.traceId);
    if (!scenario) {
      reply.code(404);
      return { message: "Debug scenario not found" };
    }
    return scenario;
  });

  app.post("/debug/regressions/full-run", async (request) => {
    const trace = getRequestTrace(request);
    return orchestrator.runFullDebugRegressionSuite(trace.traceId);
  });

  app.get("/debug/regressions/matrix-cases", async () => {
    return {
      cases: orchestrator.listDebugRegressionMatrixCases(),
    };
  });

  app.post("/debug/regressions/matrix-run", async (request) => {
    const trace = getRequestTrace(request);
    const input = debugRegressionMatrixRunInputSchema.parse((request.body as Record<string, unknown> | undefined) ?? {});
    return debugRegressionMatrixResultSchema.parse(await orchestrator.runDebugRegressionMatrix(input, trace.traceId));
  });

  app.get("/debug/regressions/matrix-runs", async (request) => {
    const query = debugRegressionMatrixRunsQuerySchema.parse(request.query);
    return debugRegressionMatrixRunsResponseSchema.parse({
      runs: orchestrator.listDebugRegressionMatrixRuns(query.limit ?? 10, query.traceId),
    });
  });

  app.post("/debug/regressions/matrix-runs/clear", async () => {
    return orchestrator.clearDebugRegressionMatrixRuns();
  });

  app.get("/debug/runs", async (request) => {
    const query = agentDebugRunsQuerySchema.parse(request.query);
    const userId = getRequestUserId(request, query.userId ?? "demo-user");
    return agentDebugRunsResponseSchema.parse({
      runs: orchestrator.listAgentDebugRuns(userId, query.limit ?? 20, query.traceId),
    });
  });

  app.get("/goalflow/overview", async (request) => {
    const query = goalFlowOverviewQuerySchema.parse(request.query);
    return goalFlowOverviewResponseSchema.parse(await orchestrator.getGoalFlowOverview(getRequestUserId(request, query.userId ?? "demo-user")));
  });

  app.post("/debug/local-cluster/bootstrap", async (request) => {
    const trace = getRequestTrace(request);
    return localClusterManualBootstrapResponseSchema.parse((await orchestrator.bootstrapLocalClusterManualUser(trace.traceId)) ?? {});
  });

  app.get("/debug/traces/:traceId", async (request) => {
    const params = request.params as { traceId: string };
    return orchestrator.getDebugTrace(params.traceId);
  });

  app.post("/debug/runs/clear", async (request) => {
    const body = ((request.body as { userId?: string } | undefined) ?? {}) as { userId?: string };
    return orchestrator.clearAgentDebugRuns(body.userId);
  });

  app.get("/goals", async (request) => {
    const userId = getRequestUserId(request, String((request.query as { userId?: string }).userId ?? "demo-user"));
    return { goals: store.listGoals(userId) };
  });

  app.post("/goals", async (request, reply) => {
    const body = ((request.body as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    const payload = createGoalInputSchema.parse({
      ...body,
      userId: getRequestUserId(request, typeof body.userId === "string" ? body.userId : undefined),
    });
    const goal = await orchestrator.createGoal(payload);
    reply.code(201);
    return goal;
  });

  app.get("/tasks", async (request) => {
    const query = request.query as { userId?: string; goalId?: string };
    const userId = getRequestUserId(request, String(query.userId ?? "demo-user"));
    return { tasks: store.listTasks(userId, query.goalId) };
  });

  app.post("/tasks", async (request, reply) => {
    const body = ((request.body as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    const payload = createTaskInputSchema.parse({
      ...body,
      userId: getRequestUserId(request, typeof body.userId === "string" ? body.userId : undefined),
    });
    const task = await orchestrator.createTask(payload);
    reply.code(201);
    return task;
  });

  app.patch("/tasks/:taskId", async (request, reply) => {
    const params = request.params as { taskId: string };
    const payload = updateTaskInputSchema.parse(request.body);
    const task = await orchestrator.updateTask(params.taskId, payload);
    if (!task) {
      reply.code(404);
      return { message: "Task not found" };
    }
    return task;
  });

  app.get("/sessions", async (request) => {
    const userId = getRequestUserId(request, String((request.query as { userId?: string }).userId ?? "demo-user"));
    return { sessions: store.listSessions(userId) };
  });

  app.post("/sessions/start", async (request, reply) => {
    const body = ((request.body as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    const payload = startSessionInputSchema.parse({
      ...body,
      userId: getRequestUserId(request, typeof body.userId === "string" ? body.userId : undefined),
    });
    const session = await orchestrator.startSession(payload);
    reply.code(201);
    return session;
  });

  app.post("/sessions/end", async (request, reply) => {
    const payload = endSessionInputSchema.parse(request.body);
    const result = await orchestrator.endSession(payload);
    if (!result.session) {
      reply.code(404);
      return { message: "Session not found" };
    }
    return result;
  });

  app.post("/state/signals/batch", async (request) => {
    const raw = signalBatchInputSchema.parse(request.body);
    const userId = getRequestUserId(request, raw.events[0]?.userId);
    const payload = {
      events: raw.events.map((event) => ({
        ...event,
        userId,
      })),
    };
    return orchestrator.handleSignalBatch(payload);
  });

  app.post("/state/checkins", async (request) => {
    const body = ((request.body as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    const payload = checkinInputSchema.parse({
      ...body,
      userId: getRequestUserId(request, typeof body.userId === "string" ? body.userId : undefined),
    });
    return orchestrator.handleCheckin(payload);
  });

  app.get("/state/latest", async (request) => {
    const userId = getRequestUserId(request, String((request.query as { userId?: string }).userId ?? "demo-user"));
    return latestStateResponseSchema.parse(await orchestrator.getLatestState(userId));
  });

  app.get("/state/history", async (request) => {
    const userId = getRequestUserId(request, String((request.query as { userId?: string }).userId ?? "demo-user"));
    return {
      signals: store.listStateSignals(userId, 100),
      assessments: store.listStateAssessments(userId, 100),
      emotionAssessments: store.listEmotionAssessments(userId, 100),
      videoAssessments: store.listVideoAssessments(userId, 100),
      healthSnapshots: store.listHealthSnapshots(userId, 100),
      behaviorConclusions: store.listBehaviorConclusions(userId, 100),
      callEvents: store.listCallEvents(userId, 100),
    };
  });

  app.get("/state/trends", async (request) => {
    const query = stateTrendsQuerySchema.parse(request.query);
    return stateTrendsResponseSchema.parse(await orchestrator.getStateTrends(getRequestUserId(request, query.userId ?? "demo-user"), query.limit ?? 20));
  });

  app.post("/recovery/plan", async (request) => {
    const payload = recoveryPlanInputSchema.parse(request.body);
    return orchestrator.createRecoveryPlan(payload);
  });

  app.get("/recovery/history", async (request) => {
    const query = recoveryHistoryQuerySchema.parse(request.query);
    return recoveryHistoryResponseSchema.parse(
      await orchestrator.getRecoveryHistory(getRequestUserId(request, query.userId ?? "demo-user"), query.limit ?? 20),
    );
  });

  app.post("/mobile/devices/register", async (request, reply) => {
    const payload = registerMobileDeviceInputSchema.parse(request.body);
    const device = await store.upsertMobileCaptureDevice(payload);
    await orchestrator.registerEdgeDevice({
      userId: payload.userId,
      deviceId: payload.deviceId,
      label: payload.deviceName,
      deviceType: "mobile",
      platform: toClientPlatform(payload.platform ?? "android"),
      capabilities: ["notifications", "audio_capture", "health_bridge"],
      appVersion: payload.appVersion,
    });
    reply.code(201);
    return device;
  });

  app.get("/mobile/devices/latest", async (request) => {
    const query = mobileDeviceQuerySchema.parse(request.query);
    const userId = getRequestUserId(request, query.userId ?? "demo-user");
    return {
      device: store.getLatestMobileCaptureDevice(userId),
      latestSession: store.getLatestAudioCaptureSession(userId),
      latestCallEvent: store.getLatestCallEvent(userId),
    };
  });

  app.post("/mobile/capture/sessions/start", async (request, reply) => {
    const payload = startAudioCaptureSessionInputSchema.parse(request.body);
    const session = await store.startAudioCaptureSession(payload);
    reply.code(201);
    return session;
  });

  app.post("/mobile/capture/sessions/end", async (request, reply) => {
    const payload = endAudioCaptureSessionInputSchema.parse(request.body);
    const session = await store.endAudioCaptureSession(payload.sessionId, payload.status, payload.endedAt);
    if (!session) {
      reply.code(404);
      return { message: "Audio capture session not found" };
    }
    return session;
  });

  app.post("/mobile/call-events", async (request, reply) => {
    const payload = createCallEventInputSchema.parse(request.body);
    const callEvent = await store.addCallEvent(payload);
    await orchestrator.refreshAssessment(callEvent.userId);
    reply.code(201);
    return callEvent;
  });

  app.post("/emotion/assessments", async (request, reply) => {
    const payload = createEmotionAssessmentInputSchema.parse(request.body);
    const assessment = await orchestrator.recordEmotionAssessment(payload);
    if (payload.sessionId) {
      await store.incrementAudioCaptureSessionChunk(payload.sessionId, payload.windowEnd);
    }
    reply.code(201);
    return assessment;
  });

  app.get("/emotion/latest", async (request) => {
    const query = emotionQuerySchema.parse(request.query);
    const userId = getRequestUserId(request, query.userId ?? "demo-user");
    return {
      assessment: store.getLatestEmotionAssessment(userId),
      recent: store.listEmotionAssessments(userId, 20),
    };
  });

  app.post("/devices/register", async (request, reply) => {
    const body = ((request.body as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    const payload = registerEdgeDeviceInputSchema.parse({
      ...body,
      userId: getRequestUserId(request, typeof body.userId === "string" ? body.userId : undefined),
    });
    const device = await orchestrator.registerEdgeDevice(payload);
    reply.code(201);
    return device;
  });

  app.post("/devices/heartbeat", async (request, reply) => {
    const body = ((request.body as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    const payload = deviceHeartbeatInputSchema.parse({
      ...body,
      userId: getRequestUserId(request, typeof body.userId === "string" ? body.userId : undefined),
    });
    const device = await orchestrator.recordDeviceHeartbeat(payload);
    if (!device) {
      reply.code(404);
      return { message: "Device not found" };
    }
    return device;
  });

  app.post("/media/upload-sessions", async (request, reply) => {
    const payload = createMediaUploadSessionInputSchema.parse(request.body);
    const session = await orchestrator.createMediaUploadSession(payload);
    reply.code(201);
    return session;
  });

  app.post("/media/upload-sessions/:sessionId/parts", async (request, reply) => {
    const params = request.params as { sessionId: string };
    const payload = registerMediaChunkInputSchema.parse(request.body);
    const manifest = await orchestrator.registerMediaChunk(params.sessionId, payload);
    reply.code(201);
    return manifest;
  });

  app.post("/media/upload-sessions/:sessionId/complete", async (request, reply) => {
    const params = request.params as { sessionId: string };
    const body = (request.body as { completedAt?: string } | undefined) ?? {};
    const session = await orchestrator.completeMediaUploadSession(params.sessionId, body.completedAt);
    if (!session) {
      reply.code(404);
      return { message: "Media upload session not found" };
    }
    return session;
  });

  app.post("/video/assessments", async (request, reply) => {
    const payload = createVideoAssessmentInputSchema.parse(request.body);
    const assessment = await orchestrator.recordVideoAssessment(payload);
    reply.code(201);
    return assessment;
  });

  app.post("/health/snapshots", async (request, reply) => {
    const userId = requireAuthenticatedHealthUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const body = ((request.body as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    const payload = healthBridgeSnapshotInputSchema.parse({ ...body, userId });
    if (!requireHealthConsent(userId, payload.consentRef, reply)) {
      return { message: "Health summary consent is required." };
    }
    const normalized = healthSignals.normalize(payload);
    const snapshot = await orchestrator.recordHealthSnapshot(normalized.snapshot);
    reply.code(201);
    return { ...snapshot, healthSummary: normalized.summary };
  });

  app.post("/health/summaries", async (request, reply) => {
    const userId = requireAuthenticatedHealthUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const body = ((request.body as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
    const payload = healthBridgeSnapshotInputSchema.parse({ ...body, userId });
    if (!requireHealthConsent(userId, payload.consentRef, reply)) {
      return { message: "Health summary consent is required." };
    }
    const normalized = healthSignals.normalize(payload);
    const snapshot = await orchestrator.recordHealthSnapshot(normalized.snapshot);
    reply.code(201);
    return { snapshot, healthSummary: normalized.summary, policyModifiers: healthSignals.buildPolicyModifiers(normalized.summary) };
  });

  app.get("/health/signals", async (request, reply) => {
    const userId = requireAuthenticatedHealthUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    healthQuerySchema.parse(request.query);
    const summaries = store.listHealthSnapshots(userId, 20).map((snapshot) =>
      healthSignals.normalize({ ...snapshot, userId }).summary,
    );
    return { summaries };
  });

  app.post("/health/calibration", async (request, reply) => {
    const userId = requireAuthenticatedHealthUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    const body = (request.body ?? {}) as Record<string, unknown>;
    const input = healthCalibrationRecordSchema.omit({ id: true, createdAt: true, absoluteError: true }).parse({ ...body, userId });
    const record = healthSignals.createCalibrationRecord(input);
    const { id: _id, createdAt: _createdAt, ...persistInput } = record;
    const persisted = await store.addHealthCalibrationRecord(persistInput);
    reply.code(201);
    return persisted;
  });

  app.get("/health/calibration", async (request, reply) => {
    const userId = requireAuthenticatedHealthUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    healthQuerySchema.parse(request.query);
    const records = store.listHealthCalibrationRecords(userId, 100);
    return { records, summary: healthSignals.summarizeCalibration(records) };
  });

  app.get("/health/latest", async (request, reply) => {
    const userId = requireAuthenticatedHealthUser(request, reply);
    if (!userId) return { message: "Authentication required." };
    healthQuerySchema.parse(request.query);
    return healthLatestResponseSchema.parse({
      latest: store.getLatestHealthSnapshot(userId),
      recent: store.listHealthSnapshots(userId, 20),
    });
  });

  app.get("/client/inbox", async (request) => {
    const query = clientInboxQuerySchema.parse(request.query);
    const userId = getRequestUserId(request, query.userId ?? "demo-user");
    return clientInboxResponseSchema.parse({
      messages: store.listClientInboxMessages(userId, 50),
    });
  });

  app.get("/client/inbox/overview", async (request) => {
    const query = clientInboxOverviewQuerySchema.parse(request.query);
    return clientInboxOverviewResponseSchema.parse(
      await orchestrator.getClientInboxOverview(getRequestUserId(request, query.userId ?? "demo-user"), query.limit ?? 50),
    );
  });

  app.post("/client/inbox/:messageId/ack", async (request, reply) => {
    const params = request.params as { messageId: string };
    const message = await store.acknowledgeClientInboxMessage(params.messageId);
    if (!message) {
      reply.code(404);
      return { message: "Inbox message not found" };
    }
    return message;
  });

  app.get("/dashboard/summary", async (request) => {
    const userId = getRequestUserId(request, String((request.query as { userId?: string }).userId ?? "demo-user"));
    return dashboardSummarySchema.parse(await orchestrator.getDashboardSummary(userId));
  });

  app.get("/reflections/latest", async (request) => {
    const query = reflectionQuerySchema.parse(request.query);
    const userId = getRequestUserId(request, query.userId ?? "demo-user");
    const reports = await orchestrator.getLatestReflections(userId, query.periodType);
    return { reports };
  });

  app.get("/reflections/overview", async (request) => {
    const query = reflectionOverviewQuerySchema.parse(request.query);
    return reflectionOverviewResponseSchema.parse(
      await orchestrator.getReflectionOverview(getRequestUserId(request, query.userId ?? "demo-user"), query.limit ?? 10),
    );
  });

  return app;
};
