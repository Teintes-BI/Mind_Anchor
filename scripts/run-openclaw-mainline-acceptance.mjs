#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import {
  defaultOpenClawMainlineAcceptanceMarkdownPath,
  defaultOpenClawMainlineAcceptanceReportPath,
  renderOpenClawMainlineAcceptanceMarkdown,
} from "./lib/openclaw-mainline-acceptance-report.mjs";

const reportPath =
  process.argv[2] ||
  process.env.MINDANCHOR_OPENCLAW_MAINLINE_ACCEPTANCE_REPORT_FILE ||
  defaultOpenClawMainlineAcceptanceReportPath(process.cwd());
const markdownPath =
  process.argv[3] ||
  process.env.MINDANCHOR_OPENCLAW_MAINLINE_ACCEPTANCE_MARKDOWN_FILE ||
  defaultOpenClawMainlineAcceptanceMarkdownPath(process.cwd());
const vitestJsonPath = path.resolve(path.dirname(reportPath), "openclaw-mainline-vitest.json");
const commandArgs = [
  "pnpm",
  "--filter",
  "@mindanchor/api",
  "exec",
  "vitest",
  "run",
  "tests/conversation-coach-original-runtime-route.integration.test.ts",
  "--reporter=json",
  `--outputFile=${vitestJsonPath}`,
  "--no-file-parallelism",
];

function runCommand(command, args) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

const result = await runCommand("corepack", commandArgs);
const vitestRaw = await fs.readFile(vitestJsonPath, "utf8").catch(() => "{}");
const vitestJson = JSON.parse(vitestRaw || "{}");
const cases = [];
for (const file of vitestJson.testResults ?? []) {
  for (const assertion of file.assertionResults ?? []) {
    cases.push({
      name: assertion.fullName || assertion.title || "unknown",
      status: assertion.status === "passed" ? "passed" : "failed",
    });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  status: result.code === 0 ? "passed" : "failed",
  durationMs: result.durationMs,
  command: `corepack ${commandArgs.join(" ")}`,
  reportPath,
  markdownPath,
  vitestJsonPath,
  stdout: result.stdout,
  stderr: result.stderr,
  cases,
};

await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
await fs.writeFile(markdownPath, renderOpenClawMainlineAcceptanceMarkdown(report), "utf8");

process.stdout.write(`openClawMainlineAcceptanceReport=${reportPath}\n`);
process.stdout.write(`openClawMainlineAcceptanceMarkdown=${markdownPath}\n`);
process.exitCode = result.code;
