import test from "node:test";
import assert from "node:assert/strict";

import {
  compareOpenClawRuntimeTransportReports,
  defaultOpenClawRuntimeTransportCompareMarkdownPath,
  defaultOpenClawRuntimeTransportComparePath,
  renderOpenClawRuntimeTransportCompareMarkdown,
} from "../lib/openclaw-runtime-transport-compare-report.mjs";

const baselineReport = {
  generatedAt: "2026-04-22T09:19:21.347Z",
  diagnoseCommand: "corepack pnpm diagnose:openclaw-runtime-transport-lan",
  snapshot: {
    runtimeFiles: {
      status: "running",
    },
    runtimeHealth: {
      loopback: { ok: true, status: 200 },
      lan: { ok: true, status: 200 },
    },
    adapter: {
      httpStatus: 200,
      executionStrategy: "cluster-preferred",
      lastDecision: {
        route: "cluster",
        selectedEndpoint: "cluster:/v1/tasks/execute",
      },
      lastFallback: null,
      failureCategoryCounts: {},
      clusterAttemptSummary: {
        totalAttempts: 0,
        uniqueEndpoints: [],
        attemptsPerEndpoint: {},
        allErrorsFetchFailed: false,
      },
    },
    issues: [],
  },
};

const incidentReport = {
  generatedAt: "2026-04-23T01:23:45.000Z",
  diagnoseCommand: "corepack pnpm diagnose:openclaw-runtime-transport-lan",
  snapshot: {
    runtimeFiles: {
      status: "running",
    },
    runtimeHealth: {
      loopback: { ok: true, status: 200 },
      lan: { ok: false, status: null },
    },
    adapter: {
      httpStatus: 200,
      executionStrategy: "cluster-preferred",
      lastDecision: {
        route: "provider-fallback",
        selectedEndpoint: "/responses",
      },
      lastFallback: {
        failureCategory: "cluster_transport_error",
        fallbackReason: "fetch failed",
      },
      failureCategoryCounts: {
        cluster_transport_error: 2,
      },
      clusterAttemptSummary: {
        totalAttempts: 6,
        uniqueEndpoints: ["/v1/tasks/execute", "/tasks/execute", "/api/tasks/execute"],
        attemptsPerEndpoint: {
          "/v1/tasks/execute": 2,
          "/tasks/execute": 2,
          "/api/tasks/execute": 2,
        },
        allErrorsFetchFailed: true,
      },
    },
    issues: [{ code: "lan_health_failed", message: "LAN health failed." }],
  },
};

test("defaultOpenClawRuntimeTransportComparePath resolves under tmp", () => {
  assert.equal(
    defaultOpenClawRuntimeTransportComparePath("/repo"),
    "/repo/tmp/openclaw-runtime-transport-compare.json",
  );
});

test("defaultOpenClawRuntimeTransportCompareMarkdownPath resolves under tmp", () => {
  assert.equal(
    defaultOpenClawRuntimeTransportCompareMarkdownPath("/repo"),
    "/repo/tmp/openclaw-runtime-transport-compare.md",
  );
});

test("compareOpenClawRuntimeTransportReports extracts key drifts between baseline and incident", () => {
  const comparison = compareOpenClawRuntimeTransportReports({
    baselineReport,
    currentReport: incidentReport,
  });

  assert.deepEqual(comparison.driftCodes, [
    "lan_health_changed",
    "adapter_route_changed",
    "selected_endpoint_changed",
    "fallback_category_changed",
    "issue_codes_changed",
    "cluster_attempt_summary_changed",
  ]);
  assert.equal(comparison.baseline.adapterRoute, "cluster");
  assert.equal(comparison.current.adapterRoute, "provider-fallback");
  assert.equal(comparison.current.fallbackCategory, "cluster_transport_error");
  assert.deepEqual(comparison.current.issueCodes, ["lan_health_failed"]);
});

test("renderOpenClawRuntimeTransportCompareMarkdown renders baseline, current, and drift summary", () => {
  const markdown = renderOpenClawRuntimeTransportCompareMarkdown({
    generatedAt: "2026-04-23T01:30:00.000Z",
    baselinePath: "/repo/test-results/baseline.json",
    currentPath: "/repo/test-results/incident.json",
    comparison: compareOpenClawRuntimeTransportReports({
      baselineReport,
      currentReport: incidentReport,
    }),
  });

  assert.match(markdown, /OpenClaw Runtime Transport Compare Report/);
  assert.match(markdown, /lan_health_changed/);
  assert.match(markdown, /adapter_route_changed/);
  assert.match(markdown, /cluster_transport_error/);
  assert.match(markdown, /provider-fallback/);
  assert.match(markdown, /cluster:\/v1\/tasks\/execute/);
});
