#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

import {
  buildOpenChronicleSidecarValidationSummary,
  defaultOpenChronicleSidecarValidationJsonPath,
  defaultOpenChronicleSidecarValidationMarkdownPath,
  OPENCHRONICLE_DEFAULT_MCP_URL,
  OPENCHRONICLE_REQUIRED_TOOLS,
  renderOpenChronicleSidecarValidationMarkdown,
} from "./lib/openchronicle-sidecar-validation-report.mjs";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const now = () => new Date().toISOString();
const sanitizeStamp = (value) => String(value).replace(/[:.]/g, "-");

let argv = [...process.argv.slice(2)];
if (argv[0] === "--") {
  argv = argv.slice(1);
}

let dryRun = false;
let mcpUrl = process.env.OPENCHRONICLE_MCP_URL ?? OPENCHRONICLE_DEFAULT_MCP_URL;
let outDir = resolve(ROOT_DIR, process.env.MINDANCHOR_OPENCHRONICLE_VALIDATION_DIR ?? "test-results");
let query = process.env.MINDANCHOR_OPENCHRONICLE_VALIDATION_QUERY ?? "MindAnchor desktop model effect loop";
let timeoutMs = Number(process.env.MINDANCHOR_OPENCHRONICLE_VALIDATION_TIMEOUT_MS ?? "10000");

for (let index = 0; index < argv.length; index += 1) {
  const token = argv[index];
  if (token === "--dry-run") {
    dryRun = true;
    continue;
  }
  if (token === "--mcp-url") {
    mcpUrl = argv[index + 1] ?? mcpUrl;
    index += 1;
    continue;
  }
  if (token === "--out-dir") {
    outDir = resolve(ROOT_DIR, argv[index + 1] ?? outDir);
    index += 1;
    continue;
  }
  if (token === "--query") {
    query = argv[index + 1] ?? query;
    index += 1;
    continue;
  }
  if (token === "--timeout-ms") {
    const parsed = Number(argv[index + 1]);
    timeoutMs = Number.isFinite(parsed) && parsed > 0 ? parsed : timeoutMs;
    index += 1;
  }
}

const stamp = sanitizeStamp(process.env.MINDANCHOR_OPENCHRONICLE_VALIDATION_STAMP ?? new Date().toISOString());
const paths = {
  json: process.env.MINDANCHOR_OPENCHRONICLE_VALIDATION_REPORT_FILE
    ? resolve(ROOT_DIR, process.env.MINDANCHOR_OPENCHRONICLE_VALIDATION_REPORT_FILE)
    : defaultOpenChronicleSidecarValidationJsonPath(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), stamp).replace(
        resolve(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), "test-results"),
        outDir,
      ),
  markdown: process.env.MINDANCHOR_OPENCHRONICLE_VALIDATION_MARKDOWN_FILE
    ? resolve(ROOT_DIR, process.env.MINDANCHOR_OPENCHRONICLE_VALIDATION_MARKDOWN_FILE)
    : defaultOpenChronicleSidecarValidationMarkdownPath(
        outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir),
        stamp,
      ).replace(resolve(outDir === resolve(ROOT_DIR, "test-results") ? ROOT_DIR : dirname(outDir), "test-results"), outDir),
};

const options = {
  mcpUrl,
  outDir,
  query,
  timeoutMs,
  requiredTools: OPENCHRONICLE_REQUIRED_TOOLS,
};

if (dryRun) {
  process.stdout.write(
    `${JSON.stringify(
      {
        options,
        paths,
        plan: [
          "POST initialize to OpenChronicle MCP endpoint",
          "send notifications/initialized",
          "POST tools/list",
          "call current_context",
          "call recent_activity",
          "call list_memories",
          "write JSON and Markdown report",
        ],
      },
      null,
      2,
    )}\n`,
  );
  process.exit(0);
}

const parseSseJson = (text) => {
  const dataLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .filter(Boolean);
  if (dataLines.length === 0) {
    return null;
  }
  return JSON.parse(dataLines[dataLines.length - 1]);
};

const parseRpcResponse = async (response) => {
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (!text) {
    return null;
  }
  if (contentType.includes("text/event-stream")) {
    return parseSseJson(text);
  }
  return JSON.parse(text);
};

let rpcId = 0;
let sessionId = null;

async function rpc(method, params, { notification = false } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) {
    headers["Mcp-Session-Id"] = sessionId;
  }
  const body = notification
    ? {
        jsonrpc: "2.0",
        method,
        params,
      }
    : {
        jsonrpc: "2.0",
        id: ++rpcId,
        method,
        params,
      };

  try {
    const response = await fetch(mcpUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!sessionId) {
      sessionId = response.headers.get("mcp-session-id") ?? response.headers.get("Mcp-Session-Id") ?? null;
    }
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    if (notification) {
      return null;
    }
    const payload = await parseRpcResponse(response);
    if (payload?.error) {
      throw new Error(payload.error.message ?? JSON.stringify(payload.error));
    }
    return payload?.result ?? payload;
  } finally {
    clearTimeout(timeout);
  }
}

const textFromToolResult = (result) => {
  const content = Array.isArray(result?.content) ? result.content : [];
  return content
    .map((item) => (typeof item?.text === "string" ? item.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
};

const summarizeToolResult = (name, result) => {
  const text = textFromToolResult(result);
  if (!text) {
    return "empty tool response";
  }
  const compact = text.replace(/\s+/g, " ").slice(0, 180);
  return compact.length < text.length ? `${compact}…` : compact;
};

const callTool = async (name, args = {}) => {
  try {
    const result = await rpc("tools/call", {
      name,
      arguments: args,
    });
    return {
      name,
      ok: true,
      summary: summarizeToolResult(name, result),
      result,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      error: error.message ?? String(error),
    };
  }
};

const report = {
  generatedAt: now(),
  startedAt: now(),
  completedAt: null,
  durationMs: null,
  mcpUrl,
  query,
  preflight: {
    mcpReachable: false,
    initialized: false,
  },
  tools: [],
  toolCalls: [],
  errors: [],
};
const started = Date.now();

try {
  await rpc("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: {
      name: "mindanchor-openchronicle-sidecar-validator",
      version: "0.1.0",
    },
  });
  report.preflight.mcpReachable = true;
  report.preflight.initialized = true;
  await rpc("notifications/initialized", {}, { notification: true }).catch(() => {});

  const toolsResult = await rpc("tools/list", {});
  report.tools = Array.isArray(toolsResult?.tools) ? toolsResult.tools : [];

  report.toolCalls.push(await callTool("current_context", { headline_limit: 5, fulltext_limit: 1, timeline_limit: 5 }));
  report.toolCalls.push(await callTool("recent_activity", { limit: 5 }));
  report.toolCalls.push(await callTool("list_memories", { query, limit: 5 }));
} catch (error) {
  report.errors.push(error.stack || error.message || String(error));
} finally {
  report.completedAt = now();
  report.durationMs = Date.now() - started;
  report.summary = buildOpenChronicleSidecarValidationSummary(report);
  await mkdir(dirname(paths.json), { recursive: true });
  await writeFile(paths.json, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(paths.markdown, renderOpenChronicleSidecarValidationMarkdown(report), "utf8");
  process.stdout.write(`${report.summary.passed ? "PASS" : "FAIL"} OpenChronicle sidecar validation\n`);
  process.stdout.write(`json: ${paths.json}\n`);
  process.stdout.write(`markdown: ${paths.markdown}\n`);
  process.exitCode = report.summary.passed ? 0 : 1;
}
