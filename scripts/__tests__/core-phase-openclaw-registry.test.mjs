import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRegistryPhaseSummary,
  evaluateRegistryPhaseGate,
} from "../lib/core-phase-openclaw-registry.mjs";

test("buildRegistryPhaseSummary extracts compressed registry health fields", () => {
  const summary = buildRegistryPhaseSummary({
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
        unknownExternalAgentCount: 2,
        totalIssueCount: 1,
      },
      reachable: true,
      configured: true,
      baseUrl: "http://127.0.0.1:8787",
      runtime: "openclaw-local-cluster",
      runtimeVersion: "phase1",
      matchedAgentIds: ["director-agent", "companion-agent"],
    },
    nativeRegistry: {
      totalAgents: 6,
    },
  });

  assert.deepEqual(summary, {
    healthStatus: "attention",
    healthReasonCodes: ["workflow_execution_probe_mismatch"],
    totalIssueCount: 1,
    missingPersonaCount: 0,
    contractMismatchCount: 0,
    runtimeContractMismatchCount: 0,
    workflowContractMismatchCount: 0,
    workflowResponseContractMismatchCount: 0,
    workflowExecutionContractMismatchCount: 0,
    workflowExecutionProbeMismatchCount: 1,
    unknownExternalAgentCount: 2,
    issueBreakdown: {
      missingPersona: 0,
      contractMismatch: 0,
      runtimeContractMismatch: 0,
      workflowContractMismatch: 0,
      workflowResponseContractMismatch: 0,
      workflowExecutionContractMismatch: 0,
      workflowExecutionProbeMismatch: 1,
      unknownExternalAgent: 2,
    },
    reachable: true,
    configured: true,
    baseUrl: "http://127.0.0.1:8787",
    runtime: "openclaw-local-cluster",
    runtimeVersion: "phase1",
    matchedAgentCount: 2,
    nativeAgentCount: 6,
  });
});

test("buildRegistryPhaseSummary derives a readable issue breakdown for report output", () => {
  const summary = buildRegistryPhaseSummary({
    externalRuntime: {
      healthStatus: "attention",
      healthReasonCodes: ["runtime_contract_mismatch", "workflow_execution_probe_mismatch"],
      healthIssueCounts: {
        missingPersonaCount: 1,
        contractMismatchCount: 2,
        runtimeContractMismatchCount: 1,
        workflowContractMismatchCount: 0,
        workflowResponseContractMismatchCount: 3,
        workflowExecutionContractMismatchCount: 0,
        workflowExecutionProbeMismatchCount: 4,
        unknownExternalAgentCount: 2,
        totalIssueCount: 11,
      },
      reachable: true,
      configured: true,
      matchedAgentIds: ["director-agent"],
    },
    nativeRegistry: {
      totalAgents: 6,
    },
  });

  assert.deepEqual(summary.issueBreakdown, {
    missingPersona: 1,
    contractMismatch: 2,
    runtimeContractMismatch: 1,
    workflowContractMismatch: 0,
    workflowResponseContractMismatch: 3,
    workflowExecutionContractMismatch: 0,
    workflowExecutionProbeMismatch: 4,
    unknownExternalAgent: 2,
  });
});

test("evaluateRegistryPhaseGate fails cluster enforcement when registry health is not aligned", () => {
  assert.throws(
    () =>
      evaluateRegistryPhaseGate({
        phaseTitle: "Cluster Preferred",
        shouldEnforceCluster: true,
        registrySummary: {
          healthStatus: "attention",
          healthReasonCodes: ["workflow_execution_probe_mismatch"],
          totalIssueCount: 1,
          issueBreakdown: {
            missingPersona: 0,
            contractMismatch: 0,
            runtimeContractMismatch: 0,
            workflowContractMismatch: 0,
            workflowResponseContractMismatch: 0,
            workflowExecutionContractMismatch: 0,
            workflowExecutionProbeMismatch: 1,
            unknownExternalAgent: 0,
          },
        },
      }),
    /issue breakdown: .*workflowExecutionProbeMismatch=1/i,
  );
});

test("evaluateRegistryPhaseGate allows non-cluster phases to continue without aligned registry", () => {
  assert.doesNotThrow(() =>
    evaluateRegistryPhaseGate({
      phaseTitle: "Provider Direct",
      shouldEnforceCluster: false,
      registrySummary: {
        healthStatus: "not_configured",
        healthReasonCodes: ["missing_persona"],
        totalIssueCount: 1,
      },
    }),
  );
});
