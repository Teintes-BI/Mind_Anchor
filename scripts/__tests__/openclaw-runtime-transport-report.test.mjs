import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultOpenClawRuntimeTransportReportMarkdownPath,
  defaultOpenClawRuntimeTransportReportPath,
  renderOpenClawRuntimeTransportReportMarkdown,
} from "../lib/openclaw-runtime-transport-report.mjs";

test("defaultOpenClawRuntimeTransportReportPath resolves under tmp", () => {
  assert.equal(
    defaultOpenClawRuntimeTransportReportPath("/repo"),
    "/repo/tmp/openclaw-runtime-transport-report.json",
  );
});

test("defaultOpenClawRuntimeTransportReportMarkdownPath resolves under tmp", () => {
  assert.equal(
    defaultOpenClawRuntimeTransportReportMarkdownPath("/repo"),
    "/repo/tmp/openclaw-runtime-transport-report.md",
  );
});

test("renderOpenClawRuntimeTransportReportMarkdown renders runtime, health, adapter, and issue summary", () => {
  const markdown = renderOpenClawRuntimeTransportReportMarkdown({
    generatedAt: "2026-04-22T08:40:00.000Z",
    diagnoseCommand: "corepack pnpm diagnose:openclaw-runtime-transport-lan",
    snapshot: {
      runtimeFiles: {
        filePrefix: "openclaw-real-lan",
        pidFile: "/repo/.logs/openclaw-real-lan.pid",
        logFile: "/repo/.logs/openclaw-real-lan.log",
        envFile: "/repo/.logs/openclaw-real-lan.env",
        status: "running",
      },
      runtimeHealth: {
        loopback: {
          ok: true,
          status: 200,
          url: "http://127.0.0.1:8800/health",
        },
        lan: {
          ok: false,
          status: null,
          url: "http://192.168.0.104:8800/health",
          error: "fetch failed",
        },
      },
      adapter: {
        httpStatus: 200,
        clusterEnabled: true,
        executionStrategy: "cluster-preferred",
        lastDecision: {
          route: "provider-fallback",
          target: "chief-agent",
        },
        lastFallback: {
          fallbackReason: "fetch failed",
          failureCategory: "cluster_transport_error",
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
      issues: [
        {
          code: "lan_health_failed",
          message: "LAN health failed.",
        },
      ],
    },
  });

  assert.match(markdown, /OpenClaw Runtime Transport Report/);
  assert.match(markdown, /2026-04-22T08:40:00.000Z/);
  assert.match(markdown, /openclaw-real-lan/);
  assert.match(markdown, /cluster-preferred/);
  assert.match(markdown, /cluster_transport_error/);
  assert.match(markdown, /\/v1\/tasks\/execute/);
  assert.match(markdown, /allErrorsFetchFailed/);
  assert.match(markdown, /lan_health_failed/);
});
