import test from "node:test";
import assert from "node:assert/strict";

import { buildCorePhaseReportMarkdown } from "../lib/core-phase-report-files.mjs";

test("buildCorePhaseReportMarkdown renders in-progress completion and phase table", () => {
  const markdown = buildCorePhaseReportMarkdown({
    report: {
      startedAt: "2026-03-24T02:00:00.000Z",
      completedAt: null,
      failures: [],
      phases: [
        {
          title: "Phase 2 Provider Direct",
          status: "running",
          agentMode: "openai-compatible",
          openClawBaseUrl: null,
          registrySummary: {
            healthStatus: "not_configured",
            totalIssueCount: 0,
            missingPersonaCount: 0,
            healthReasonCodes: [],
            contractMismatchCount: 0,
            runtimeContractMismatchCount: 0,
            workflowContractMismatchCount: 0,
            workflowResponseContractMismatchCount: 0,
            workflowExecutionContractMismatchCount: 0,
            workflowExecutionProbeMismatchCount: 0,
            unknownExternalAgentCount: 0,
            runtime: null,
            runtimeVersion: null,
            matchedAgentCount: 0,
            nativeAgentCount: 6,
          },
          steps: [
            {
              label: "health",
              statusCode: 200,
              traceId: null,
              adapterRoute: null,
              selectedEndpoint: null,
              fallbackLikely: null,
              fallbackReason: null,
              failureCategory: null,
              conclusion: "passed",
            },
          ],
          failureCategoryCounts: {},
        },
      ],
    },
    apiBaseUrl: "http://127.0.0.1:3024",
    webBaseUrl: "http://127.0.0.1:4174",
    clusterBaseUrl: "http://127.0.0.1:8788",
    clusterMode: "real",
    providerMode: "real",
    jsonFile: "/tmp/report.live.json",
    logsDir: "/tmp/logs",
    responsesDir: "/tmp/responses",
  });

  assert.match(markdown, /Completed: `in-progress`/);
  assert.match(markdown, /\| Phase 2 Provider Direct \| running \| openai-compatible \| not_configured \| — \| 1\/1 \|/);
  assert.match(markdown, /JSON report: `\/tmp\/report.live.json`/);
});

test("buildCorePhaseReportMarkdown excludes degraded fallback steps from passed count", () => {
  const markdown = buildCorePhaseReportMarkdown({
    report: {
      startedAt: "2026-03-29T14:43:29.701Z",
      completedAt: "2026-03-29T14:49:01.543Z",
      failures: [
        {
          phaseId: "provider-direct",
          label: "provider-direct-phase",
          message: "Provider phase probe failed: probe-chief-agent",
        },
      ],
      phases: [
        {
          title: "Phase 2 Provider Direct",
          status: "failed",
          agentMode: "openai-compatible",
          openClawBaseUrl: null,
          registrySummary: null,
          steps: [
            {
              label: "probe-chief-agent",
              statusCode: 200,
              traceId: "trace-1",
              adapterRoute: "failed",
              selectedEndpoint: "/v1/responses",
              fallbackLikely: true,
              fallbackReason: "Provider returned HTTP 401.",
              failureCategory: "provider_http_error",
              success: false,
              conclusion: "passed",
            },
            {
              label: "probe-chief-agent-trace",
              statusCode: 200,
              traceId: "trace-1",
              adapterRoute: null,
              selectedEndpoint: null,
              fallbackLikely: null,
              fallbackReason: null,
              failureCategory: null,
              success: null,
              conclusion: "passed",
            },
          ],
          failureCategoryCounts: {
            provider_http_error: 1,
          },
        },
      ],
    },
    apiBaseUrl: "http://127.0.0.1:3024",
    webBaseUrl: "http://127.0.0.1:4174",
    clusterBaseUrl: "http://127.0.0.1:8788",
    clusterMode: "real",
    providerMode: "real",
    jsonFile: "/tmp/report.json",
    logsDir: "/tmp/logs",
    responsesDir: "/tmp/responses",
  });

  assert.match(markdown, /\| Phase 2 Provider Direct \| failed \| openai-compatible \| — \| — \| 1\/2 \|/);
  assert.match(markdown, /Failure categories：`provider_http_error=1`/);
});
