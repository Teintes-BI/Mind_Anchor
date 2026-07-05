import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOpenChronicleSidecarValidationSummary,
  renderOpenChronicleSidecarValidationMarkdown,
} from "../lib/openchronicle-sidecar-validation-report.mjs";

const tools = [
  { name: "current_context", description: "Current context" },
  { name: "recent_activity", description: "Recent activity" },
  { name: "list_memories", description: "List memories" },
];

test("OpenChronicle report passes when MCP and required tools work", () => {
  const report = {
    preflight: {
      mcpReachable: true,
      initialized: true,
    },
    tools,
    toolCalls: tools.map((tool) => ({
      name: tool.name,
      ok: true,
      summary: "ok",
    })),
    errors: [],
  };

  const summary = buildOpenChronicleSidecarValidationSummary(report);
  assert.equal(summary.passed, true);
  assert.equal(summary.requiredToolsPresent, true);
  assert.equal(summary.successfulCallCount, 3);
  assert.equal(summary.failedCallCount, 0);

  const markdown = renderOpenChronicleSidecarValidationMarkdown({ ...report, summary });
  assert.match(markdown, /adapter 原型/);
});

test("OpenChronicle report fails when daemon is unreachable", () => {
  const summary = buildOpenChronicleSidecarValidationSummary({
    preflight: {
      mcpReachable: false,
      initialized: false,
    },
    tools: [],
    toolCalls: [],
    errors: ["connect ECONNREFUSED 127.0.0.1:8742"],
  });

  assert.equal(summary.passed, false);
  assert.equal(summary.requiredToolsPresent, false);
  assert.match(summary.errorSamples.join("\n"), /ECONNREFUSED/);
  assert.match(summary.errorSamples.join("\n"), /missing required tools/);
});

test("OpenChronicle report fails when a required tool is missing", () => {
  const summary = buildOpenChronicleSidecarValidationSummary({
    preflight: {
      mcpReachable: true,
      initialized: true,
    },
    tools: tools.filter((tool) => tool.name !== "list_memories"),
    toolCalls: [
      { name: "current_context", ok: true },
      { name: "recent_activity", ok: true },
    ],
  });

  assert.equal(summary.passed, false);
  assert.equal(summary.requiredToolsPresent, false);
  assert.match(summary.errorSamples.join("\n"), /list_memories/);
});
