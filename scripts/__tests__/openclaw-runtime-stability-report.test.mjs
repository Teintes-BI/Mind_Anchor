import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOpenClawRuntimeStabilitySummary,
  renderOpenClawRuntimeStabilityMarkdown,
} from "../lib/openclaw-runtime-stability-report.mjs";

const clusterDecision = (target, traceId = `trace-${target}`) => ({
  target,
  route: "cluster",
  selectedEndpoint: "cluster:/v1/tasks/execute",
  traceId,
  fallbackReason: null,
  failureCategory: null,
});

test("stability summary marks all-cluster rounds as passing", () => {
  const report = {
    roundsPlanned: 2,
    rounds: [
      {
        round: 1,
        status: "passed",
        checks: [
          clusterDecision("chief-agent"),
          clusterDecision("state-insight-agent"),
          clusterDecision("task-management-agent"),
        ],
      },
      {
        round: 2,
        status: "passed",
        checks: [
          clusterDecision("chief-agent", "trace-chief-latest"),
          clusterDecision("state-insight-agent", "trace-state-latest"),
          clusterDecision("task-management-agent", "trace-task-latest"),
        ],
      },
    ],
  };

  const summary = buildOpenClawRuntimeStabilitySummary(report);

  assert.equal(summary.passed, true);
  assert.equal(summary.roundsPlanned, 2);
  assert.equal(summary.roundsCompleted, 2);
  assert.equal(summary.clusterRouteCount, 6);
  assert.equal(summary.providerFallbackCount, 0);
  assert.equal(summary.failedCount, 0);
  assert.equal(summary.latestByAgent["chief-agent"].traceId, "trace-chief-latest");
});

test("stability summary fails when provider fallback appears", () => {
  const report = {
    roundsPlanned: 1,
    rounds: [
      {
        round: 1,
        status: "failed",
        checks: [
          {
            target: "chief-agent",
            route: "provider-fallback",
            selectedEndpoint: null,
            traceId: "trace-fallback",
            fallbackReason: "fetch failed",
            failureCategory: "cluster_transport_error",
          },
        ],
      },
    ],
  };

  const summary = buildOpenClawRuntimeStabilitySummary(report);

  assert.equal(summary.passed, false);
  assert.equal(summary.providerFallbackCount, 1);
  assert.equal(summary.failureCategoryCounts.cluster_transport_error, 1);
  assert.equal(summary.failedCount, 1);
});

test("stability markdown highlights HTTP failures", () => {
  const markdown = renderOpenClawRuntimeStabilityMarkdown({
    generatedAt: "2026-04-24T09:00:00.000Z",
    startedAt: "2026-04-24T09:00:00.000Z",
    completedAt: "2026-04-24T09:01:00.000Z",
    durationMs: 60000,
    apiBaseUrl: "http://127.0.0.1:3011",
    openClawBaseUrl: "http://192.168.0.104:8800",
    roundsPlanned: 1,
    intervalMs: 1000,
    rounds: [
      {
        round: 1,
        status: "failed",
        errors: ["Gateway health failed with HTTP 500."],
        checks: [
          {
            target: "gateway-health",
            route: "failed",
            httpStatus: 500,
            selectedEndpoint: null,
            traceId: null,
            fallbackReason: null,
            failureCategory: "http_error",
          },
        ],
      },
    ],
  });

  assert.match(markdown, /M5 P0 短时稳定性观察/);
  assert.match(markdown, /passed: `false`/);
  assert.match(markdown, /failedCount: `1`/);
  assert.match(markdown, /Gateway health failed with HTTP 500/);
});
