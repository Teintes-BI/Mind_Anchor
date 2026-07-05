#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import net from "node:net";

const ROOT_DIR = import.meta.dirname.endsWith("/scripts")
  ? import.meta.dirname.slice(0, -"/scripts".length)
  : import.meta.dirname;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const findAvailablePort = async () =>
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Failed to resolve a free port."));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
    server.on("error", reject);
  });

const waitForJson = async (url, timeoutMs = 60000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch {}
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const startProvider = async () => {
  const requestPaths = [];
  const server = createServer((req, res) => {
    requestPaths.push(String(req.url ?? ""));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        output_text: JSON.stringify({
          probe: "ok",
        }),
      }),
    );
  });

  const port = await findAvailablePort();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(undefined)));
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
    requestPaths,
  };
};

const startCluster = async () => {
  const requestPaths = [];
  let executeRequestCount = 0;
  const server = createServer((req, res) => {
    const path = String(req.url ?? "");
    if (req.method === "GET" && path === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, runtime: "mock-session-lock-cluster" }));
      return;
    }

    requestPaths.push(path);
    if (path !== "/v1/tasks/execute") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: `Unexpected path: ${path}` }));
      return;
    }

    executeRequestCount += 1;
    if (executeRequestCount === 1) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error:
            '[diagnostic] lane task error: lane=main durationMs=11485 error="Error: session file locked (timeout 10000ms): pid=15843 /Users/claw/.openclaw-dev/agents/state-insight-agent/sessions/demo"',
        }),
      );
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        taskId: "cluster-task-session-lock-retry",
        trace: {
          traceId: "cluster-trace-session-lock-retry",
        },
        parsed: {
          probe: "ok",
        },
        metadata: {
          runtime: "mock-session-lock-cluster",
        },
      }),
    );
  });

  const port = await findAvailablePort();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(undefined)));
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
    requestPaths,
    getRequestCount: () => executeRequestCount,
  };
};

const stopServer = async (server) =>
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve(undefined))));

const main = async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-session-lock-repro-"));
  const apiPort = await findAvailablePort();
  const cluster = await startCluster();
  const provider = await startProvider();

  let apiStdout = "";
  let apiStderr = "";
  const apiProcess = spawn(
    "corepack",
    ["pnpm", "--filter", "@mindanchor/api", "exec", "tsx", "src/index.ts"],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        MINDANCHOR_API_PORT: String(apiPort),
        MINDANCHOR_DATA_FILE: join(dataDir, "mindanchor.json"),
        MINDANCHOR_AGENT_MODE: "openai-compatible",
        MINDANCHOR_OPENCLAW_BASE_URL: cluster.baseUrl,
        MINDANCHOR_DEFAULT_MODEL_BASE_URL: provider.baseUrl,
        MINDANCHOR_DEFAULT_MODEL_API_KEY: "default-key",
        MINDANCHOR_DEFAULT_MODEL_NAME: "gpt-5.4",
        MINDANCHOR_DEFAULT_MODEL_WIRE_API: "responses",
        MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT: "xhigh",
        MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_BASE_URL: provider.baseUrl,
        MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_API_KEY: "state-insight-agent-key",
        MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_MODEL: "gpt-5.4",
        MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_WIRE_API: "responses",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  apiProcess.stdout.on("data", (chunk) => {
    apiStdout += chunk.toString();
  });
  apiProcess.stderr.on("data", (chunk) => {
    apiStderr += chunk.toString();
  });

  try {
    await waitForJson(`http://127.0.0.1:${apiPort}/health`);

    const probeResponse = await fetch(
      `http://127.0.0.1:${apiPort}/debug/model-probe/state-insight-agent?userId=session-lock-repro-user`,
    );
    const probePayload = await probeResponse.json();

    const adapterResponse = await fetch(`http://127.0.0.1:${apiPort}/debug/openclaw/adapter`);
    const adapterPayload = await adapterResponse.json();

    const summary = {
      clusterBaseUrl: cluster.baseUrl,
      providerBaseUrl: provider.baseUrl,
      probe: {
        status: probeResponse.status,
        success: Boolean(probePayload?.success),
      },
      adapter: {
        lastDecision: adapterPayload?.lastDecision ?? null,
        lastFallback: adapterPayload?.lastFallback ?? null,
        failureCategoryCounts: adapterPayload?.failureCategoryCounts ?? {},
      },
      cluster: {
        requestCount: cluster.getRequestCount(),
        requestPaths: cluster.requestPaths,
      },
      provider: {
        requestPaths: provider.requestPaths,
      },
    };

    if (summary.adapter.lastDecision?.route !== "cluster") {
      throw new Error(`Expected adapter route=cluster but received ${summary.adapter.lastDecision?.route ?? "null"}.`);
    }
    if (summary.cluster.requestCount !== 2) {
      throw new Error(`Expected 2 cluster attempts but received ${summary.cluster.requestCount}.`);
    }
    if (summary.provider.requestPaths.length !== 0) {
      throw new Error(`Expected provider to stay unused but received ${summary.provider.requestPaths.length} calls.`);
    }

    process.stdout.write(`${JSON.stringify(summary)}\n`);
  } catch (error) {
    const failure = {
      message: error instanceof Error ? error.message : String(error),
      apiStdout,
      apiStderr,
    };
    process.stderr.write(`${JSON.stringify(failure, null, 2)}\n`);
    process.exitCode = 1;
  } finally {
    apiProcess.kill("SIGTERM");
    await stopServer(cluster.server);
    await stopServer(provider.server);
    await rm(dataDir, { recursive: true, force: true });
  }
};

await main();
