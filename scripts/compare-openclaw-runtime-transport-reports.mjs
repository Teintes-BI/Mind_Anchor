#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  compareOpenClawRuntimeTransportReports,
  defaultOpenClawRuntimeTransportCompareMarkdownPath,
  defaultOpenClawRuntimeTransportComparePath,
  renderOpenClawRuntimeTransportCompareMarkdown,
} from "./lib/openclaw-runtime-transport-compare-report.mjs";

const cwd = process.cwd();
const baselinePath = process.argv[2] || process.env.MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_BASELINE_REPORT;
const currentPath = process.argv[3] || process.env.MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_CURRENT_REPORT;
const jsonPath =
  process.argv[4] ||
  process.env.MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_COMPARE_FILE ||
  defaultOpenClawRuntimeTransportComparePath(cwd);
const markdownPath =
  process.argv[5] ||
  process.env.MINDANCHOR_OPENCLAW_RUNTIME_TRANSPORT_COMPARE_MARKDOWN_FILE ||
  defaultOpenClawRuntimeTransportCompareMarkdownPath(cwd);

if (!baselinePath || !currentPath) {
  process.stderr.write(
    "Usage: node scripts/compare-openclaw-runtime-transport-reports.mjs <baseline-report.json> <current-report.json> [compare.json] [compare.md]\n",
  );
  process.exit(1);
}

const baselineReport = JSON.parse(await fs.readFile(baselinePath, "utf8"));
const currentReport = JSON.parse(await fs.readFile(currentPath, "utf8"));
const comparison = compareOpenClawRuntimeTransportReports({ baselineReport, currentReport });
const report = {
  generatedAt: new Date().toISOString(),
  baselinePath,
  currentPath,
  comparison,
};

await fs.mkdir(path.dirname(jsonPath), { recursive: true });
await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf8");
await fs.mkdir(path.dirname(markdownPath), { recursive: true });
await fs.writeFile(markdownPath, renderOpenClawRuntimeTransportCompareMarkdown(report), "utf8");

process.stdout.write(`openclawRuntimeTransportCompare=${jsonPath}\n`);
process.stdout.write(`openclawRuntimeTransportCompareMarkdown=${markdownPath}\n`);
