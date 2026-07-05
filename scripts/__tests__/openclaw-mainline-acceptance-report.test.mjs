import test from "node:test";
import assert from "node:assert/strict";

import {
  defaultOpenClawMainlineAcceptanceMarkdownPath,
  defaultOpenClawMainlineAcceptanceReportPath,
  renderOpenClawMainlineAcceptanceMarkdown,
} from "../lib/openclaw-mainline-acceptance-report.mjs";

test("defaultOpenClawMainlineAcceptanceReportPath resolves under tmp", () => {
  assert.equal(
    defaultOpenClawMainlineAcceptanceReportPath("/repo"),
    "/repo/tmp/openclaw-mainline-acceptance-report.json",
  );
});

test("defaultOpenClawMainlineAcceptanceMarkdownPath resolves under tmp", () => {
  assert.equal(
    defaultOpenClawMainlineAcceptanceMarkdownPath("/repo"),
    "/repo/tmp/openclaw-mainline-acceptance-report.md",
  );
});

test("renderOpenClawMainlineAcceptanceMarkdown renders summary and test cases", () => {
  const markdown = renderOpenClawMainlineAcceptanceMarkdown({
    generatedAt: "2026-03-29T12:00:00.000Z",
    status: "passed",
    command: "corepack pnpm --filter @mindanchor/api exec vitest run tests/conversation-coach-original-runtime-route.integration.test.ts",
    durationMs: 12345,
    cases: [
      { name: "uses original runtime Picard routing before front-agent generation", status: "passed" },
      { name: "uses original runtime for consult chain after Picard routing", status: "passed" },
      { name: "uses original runtime for plan adjustment authority chain", status: "passed" },
      { name: "uses original runtime for memory governance authority chain", status: "passed" },
    ],
  });

  assert.match(markdown, /OpenClaw Mainline Acceptance Report/);
  assert.match(markdown, /status:\s+passed/);
  assert.match(markdown, /12345ms/);
  assert.match(markdown, /Picard routing/);
  assert.match(markdown, /consult chain/);
  assert.match(markdown, /plan adjustment authority chain/);
  assert.match(markdown, /memory governance authority chain/);
});
