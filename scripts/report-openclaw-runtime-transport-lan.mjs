#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import {
  defaultOpenClawRuntimeTransportReportMarkdownPath,
  defaultOpenClawRuntimeTransportReportPath,
  renderOpenClawRuntimeTransportReportMarkdown,
} from "./lib/openclaw-runtime-transport-report.mjs";

const execFileAsync = promisify(execFile);
const cwd = process.cwd();
const jsonPath =
  process.argv[2] ||
  process.env.MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_REPORT_FILE ||
  defaultOpenClawRuntimeTransportReportPath(cwd);
const markdownPath =
  process.argv[3] ||
  process.env.MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_REPORT_MARKDOWN_FILE ||
  defaultOpenClawRuntimeTransportReportMarkdownPath(cwd);

const { stdout } = await execFileAsync(process.execPath, [path.resolve(cwd, "scripts/diagnose-openclaw-runtime-transport-lan.mjs")], {
  cwd,
  env: process.env,
  maxBuffer: 1024 * 1024 * 10,
});

const snapshot = JSON.parse(stdout);
const report = {
  generatedAt: new Date().toISOString(),
  diagnoseCommand: "corepack pnpm diagnose:openclaw-runtime-transport-lan",
  snapshot,
};

await fs.mkdir(path.dirname(jsonPath), { recursive: true });
await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
await fs.mkdir(path.dirname(markdownPath), { recursive: true });
await fs.writeFile(markdownPath, renderOpenClawRuntimeTransportReportMarkdown(report), "utf8");

process.stdout.write(`openclawRuntimeTransportReport=${jsonPath}\n`);
process.stdout.write(`openclawRuntimeTransportReportMarkdown=${markdownPath}\n`);
