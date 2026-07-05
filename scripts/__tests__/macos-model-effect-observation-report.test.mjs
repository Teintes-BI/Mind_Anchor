import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMacosModelEffectObservationSummary,
  renderMacosModelEffectObservationMarkdown,
} from "../lib/macos-model-effect-observation-report.mjs";

const greenTurn = (id) => ({
  id,
  assistantStatus: "completed",
  fastResponseLength: 42,
  fullResponseLength: 240,
  prompt: "请给我下一步。",
  fullResponseExcerpt: "先打开当前任务清单，选一个最小可执行步骤。",
  executionTrailIncludesOpenClaw: true,
  feedbackLabel: "helpful",
  feedbackPersisted: true,
  passed: true,
  errors: [],
});

test("macOS model effect report summarizes all-green observation", () => {
  const report = {
    startedAt: "2026-04-26T10:00:00.000Z",
    completedAt: "2026-04-26T10:01:00.000Z",
    durationMs: 60000,
    plannedTurnCount: 2,
    preflight: {
      openClawReachable: true,
      apiHealthy: true,
      macAppSignedIn: true,
    },
    turns: [greenTurn("next-action"), greenTurn("interruption-recovery")],
  };

  const summary = buildMacosModelEffectObservationSummary(report);

  assert.equal(summary.passed, true);
  assert.equal(summary.completedTurnCount, 2);
  assert.equal(summary.failedTurnCount, 0);
  assert.equal(summary.openClawTrailCount, 2);
  assert.equal(summary.feedbackPersistedCount, 2);
  assert.equal(summary.averageFullResponseLength, 240);

  const markdown = renderMacosModelEffectObservationMarkdown({ ...report, summary });
  assert.match(markdown, /M7 macOS 桌面模型效果观察/);
  assert.match(markdown, /M7 桌面模型效果观察门槛: `达到`/);
  assert.match(markdown, /Response Review/);
  assert.match(markdown, /先打开当前任务清单/);
});

test("macOS model effect report fails when feedback is missing", () => {
  const summary = buildMacosModelEffectObservationSummary({
    preflight: {
      openClawReachable: true,
      apiHealthy: true,
      macAppSignedIn: true,
    },
    turns: [
      {
        ...greenTurn("next-action"),
        feedbackPersisted: false,
        passed: false,
        errors: ["feedback not persisted"],
      },
    ],
  });

  assert.equal(summary.passed, false);
  assert.equal(summary.failedTurnCount, 1);
  assert.deepEqual(summary.errorSamples, ["next-action: feedback not persisted"]);
});

test("macOS model effect report fails when OpenClaw trail is missing", () => {
  const summary = buildMacosModelEffectObservationSummary({
    preflight: {
      openClawReachable: true,
      apiHealthy: true,
      macAppSignedIn: true,
    },
    turns: [
      {
        ...greenTurn("next-action"),
        executionTrailIncludesOpenClaw: false,
        passed: false,
        errors: ["execution trail missing OpenClaw"],
      },
    ],
  });

  assert.equal(summary.passed, false);
  assert.equal(summary.openClawTrailCount, 0);
  assert.deepEqual(summary.errorSamples, ["next-action: execution trail missing OpenClaw"]);
});

test("macOS model effect report summarizes OpenChronicle memory comparison", () => {
  const report = {
    preflight: {
      openClawReachable: true,
      apiHealthy: true,
      macAppSignedIn: true,
    },
    memoryMode: "compare",
    openChronicleMcpUrl: "http://127.0.0.1:8742/mcp",
    turns: [
      {
        ...greenTurn("next-action-baseline"),
        memoryVariant: "baseline",
      },
      {
        ...greenTurn("next-action-openchronicle"),
        memoryVariant: "openchronicle",
        desktopMemory: {
          summary: {
            readSucceeded: true,
          },
        },
      },
    ],
  };

  const summary = buildMacosModelEffectObservationSummary(report);

  assert.equal(summary.passed, true);
  assert.equal(summary.baselineTurnCount, 1);
  assert.equal(summary.openChronicleMemoryTurnCount, 1);
  assert.equal(summary.memoryReadSuccessCount, 1);
  assert.equal(summary.memoryReadFailedCount, 0);

  const markdown = renderMacosModelEffectObservationMarkdown({ ...report, summary });
  assert.match(markdown, /memoryMode: `compare`/);
  assert.match(markdown, /openChronicleMemoryTurnCount: `1`/);
  assert.match(markdown, /next-action-openchronicle/);
});
