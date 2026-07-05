import {
  OPENCHRONICLE_DEFAULT_MCP_URL,
  OPENCHRONICLE_REQUIRED_TOOLS,
} from "./openchronicle-sidecar-validation-report.mjs";

const DEFAULT_TIMEOUT_MS = 10000;

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

const textFromToolResult = (result) => {
  const content = Array.isArray(result?.content) ? result.content : [];
  return content
    .map((item) => (typeof item?.text === "string" ? item.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
};

const parseToolText = (result) => {
  const text = textFromToolResult(result);
  if (!text) {
    return { text: "", json: null };
  }
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
};

const compact = (value, maxChars = 1200) => {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? null);
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > maxChars ? `${normalized.slice(0, maxChars)}…` : normalized;
};

function createRpcClient({ mcpUrl, timeoutMs, fetchImpl }) {
  let rpcId = 0;
  let sessionId = null;

  return async function rpc(method, params, { notification = false } = {}) {
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
      const response = await fetchImpl(mcpUrl, {
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
  };
}

async function callTool(rpc, name, args = {}) {
  const result = await rpc("tools/call", {
    name,
    arguments: args,
  });
  const parsed = parseToolText(result);
  return {
    name,
    ok: true,
    text: parsed.text,
    json: parsed.json,
    summary: compact(parsed.json ?? parsed.text, 360),
  };
}

export function buildDesktopMemoryAdapterSummary(snapshot = {}) {
  const toolNames = new Set((Array.isArray(snapshot.tools) ? snapshot.tools : []).map((tool) => tool.name).filter(Boolean));
  const requiredToolsPresent = OPENCHRONICLE_REQUIRED_TOOLS.every((name) => toolNames.has(name));
  const toolCalls = Array.isArray(snapshot.toolCalls) ? snapshot.toolCalls : [];
  const successfulCallCount = toolCalls.filter((call) => call.ok === true).length;
  const failedCallCount = toolCalls.filter((call) => call.ok === false).length;
  const errors = [
    ...(Array.isArray(snapshot.errors) ? snapshot.errors.map(String) : []),
    ...toolCalls.filter((call) => call.ok === false).map((call) => `${call.name}: ${call.error ?? "failed"}`),
  ];
  const promptContextLength = String(snapshot.promptContext ?? "").length;
  const readSucceeded =
    snapshot.enabled === true &&
    snapshot.preflight?.mcpReachable === true &&
    snapshot.preflight?.initialized === true &&
    requiredToolsPresent &&
    failedCallCount === 0 &&
    successfulCallCount >= OPENCHRONICLE_REQUIRED_TOOLS.length &&
    errors.length === 0;

  return {
    enabled: snapshot.enabled === true,
    readSucceeded,
    requiredToolsPresent,
    toolCount: toolNames.size,
    successfulCallCount,
    failedCallCount,
    promptContextLength,
    errorSamples: errors.slice(0, 5),
  };
}

export function renderDesktopMemoryPromptContext(snapshot = {}, { maxChars = 1800 } = {}) {
  const calls = new Map((Array.isArray(snapshot.toolCalls) ? snapshot.toolCalls : []).map((call) => [call.name, call]));
  const currentContext = calls.get("current_context");
  const recentActivity = calls.get("recent_activity");
  const memories = calls.get("list_memories");
  const sections = [
    ["current_context", currentContext?.summary],
    ["recent_activity", recentActivity?.summary],
    ["list_memories", memories?.summary],
  ]
    .filter(([, value]) => value)
    .map(([name, value]) => `- ${name}: ${value}`)
    .join("\n");

  if (!sections) {
    return "";
  }
  return compact(`旁路桌面记忆上下文（OpenChronicle，只读，仅供本次回答参考）：\n${sections}`, maxChars);
}

export function buildMemoryAugmentedPrompt({ originalPrompt, promptContext }) {
  if (!promptContext) {
    return originalPrompt;
  }
  return `${promptContext}\n\n用户当前请求：${originalPrompt}`;
}

export async function collectOpenChronicleDesktopMemorySnapshot({
  mcpUrl = OPENCHRONICLE_DEFAULT_MCP_URL,
  query = "MindAnchor desktop model effect loop",
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
} = {}) {
  const snapshot = {
    source: "openchronicle",
    enabled: true,
    mcpUrl,
    query,
    preflight: {
      mcpReachable: false,
      initialized: false,
    },
    tools: [],
    toolCalls: [],
    promptContext: "",
    errors: [],
  };

  try {
    const rpc = createRpcClient({ mcpUrl, timeoutMs, fetchImpl });
    await rpc("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: {
        name: "mindanchor-desktop-memory-adapter",
        version: "0.1.0",
      },
    });
    snapshot.preflight.mcpReachable = true;
    snapshot.preflight.initialized = true;
    await rpc("notifications/initialized", {}, { notification: true }).catch(() => {});

    const toolsResult = await rpc("tools/list", {});
    snapshot.tools = Array.isArray(toolsResult?.tools) ? toolsResult.tools : [];
    const toolNames = new Set(snapshot.tools.map((tool) => tool.name).filter(Boolean));

    for (const [name, args] of [
      ["current_context", { headline_limit: 5, fulltext_limit: 1, timeline_limit: 5 }],
      ["recent_activity", { limit: 5 }],
      ["list_memories", { query, limit: 5 }],
    ]) {
      if (!toolNames.has(name)) {
        snapshot.toolCalls.push({ name, ok: false, error: "required tool missing" });
        continue;
      }
      try {
        snapshot.toolCalls.push(await callTool(rpc, name, args));
      } catch (error) {
        snapshot.toolCalls.push({ name, ok: false, error: error.message ?? String(error) });
      }
    }
    snapshot.promptContext = renderDesktopMemoryPromptContext(snapshot);
  } catch (error) {
    snapshot.errors.push(error.stack || error.message || String(error));
  }

  snapshot.summary = buildDesktopMemoryAdapterSummary(snapshot);
  return snapshot;
}
