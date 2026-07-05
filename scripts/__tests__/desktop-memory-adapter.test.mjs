import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMemoryAugmentedPrompt,
  collectOpenChronicleDesktopMemorySnapshot,
  renderDesktopMemoryPromptContext,
} from "../lib/desktop-memory-adapter.mjs";

const jsonResponse = (body, headers = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });

test("OpenChronicle desktop memory adapter reads required tools", async () => {
  const requests = [];
  const fetchImpl = async (_url, options) => {
    const request = JSON.parse(options.body);
    requests.push(request);
    if (request.method === "initialize") {
      return jsonResponse({ jsonrpc: "2.0", id: request.id, result: {} }, { "mcp-session-id": "session-1" });
    }
    if (request.method === "notifications/initialized") {
      return jsonResponse({});
    }
    if (request.method === "tools/list") {
      return jsonResponse({
        jsonrpc: "2.0",
        id: request.id,
        result: {
          tools: [{ name: "current_context" }, { name: "recent_activity" }, { name: "list_memories" }],
        },
      });
    }
    if (request.method === "tools/call") {
      return jsonResponse({
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [{ type: "text", text: JSON.stringify({ ok: true, tool: request.params.name }) }],
        },
      });
    }
    throw new Error(`unexpected method ${request.method}`);
  };

  const snapshot = await collectOpenChronicleDesktopMemorySnapshot({
    mcpUrl: "http://127.0.0.1:8742/mcp",
    query: "focus recovery",
    fetchImpl,
  });

  assert.equal(snapshot.summary.readSucceeded, true);
  assert.equal(snapshot.summary.successfulCallCount, 3);
  assert.equal(snapshot.summary.failedCallCount, 0);
  assert.match(snapshot.promptContext, /旁路桌面记忆上下文/);
  assert.deepEqual(
    requests.filter((request) => request.method === "tools/call").map((request) => request.params.name),
    ["current_context", "recent_activity", "list_memories"],
  );
});

test("OpenChronicle desktop memory adapter reports missing required tool", async () => {
  const fetchImpl = async (_url, options) => {
    const request = JSON.parse(options.body);
    if (request.method === "initialize") {
      return jsonResponse({ jsonrpc: "2.0", id: request.id, result: {} });
    }
    if (request.method === "notifications/initialized") {
      return jsonResponse({});
    }
    if (request.method === "tools/list") {
      return jsonResponse({
        jsonrpc: "2.0",
        id: request.id,
        result: { tools: [{ name: "current_context" }, { name: "recent_activity" }] },
      });
    }
    if (request.method === "tools/call") {
      return jsonResponse({
        jsonrpc: "2.0",
        id: request.id,
        result: { content: [{ type: "text", text: "ok" }] },
      });
    }
    throw new Error(`unexpected method ${request.method}`);
  };

  const snapshot = await collectOpenChronicleDesktopMemorySnapshot({ fetchImpl });

  assert.equal(snapshot.summary.readSucceeded, false);
  assert.equal(snapshot.summary.requiredToolsPresent, false);
  assert.equal(snapshot.summary.failedCallCount, 1);
  assert.deepEqual(snapshot.summary.errorSamples, ["list_memories: required tool missing"]);
});

test("desktop memory prompt augmentation preserves original request", () => {
  const promptContext = renderDesktopMemoryPromptContext({
    toolCalls: [
      {
        name: "current_context",
        summary: "Codex is editing MindAnchor files",
      },
    ],
  });
  const prompt = buildMemoryAugmentedPrompt({
    originalPrompt: "请给我下一步。",
    promptContext,
  });

  assert.match(prompt, /旁路桌面记忆上下文/);
  assert.match(prompt, /用户当前请求：请给我下一步。/);
});
