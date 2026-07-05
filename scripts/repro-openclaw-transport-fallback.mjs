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
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const auth = String(req.headers.authorization ?? "");
      let output = JSON.stringify({ probe: "ok" });

      if (auth === "Bearer chief-agent-key") {
        output = JSON.stringify({
          workflow: "task_management",
          selectedAgent: "task-management-agent",
          reason: "Transport fallback repro routes into task-management-agent.",
          executionMode: "agent",
          confidence: 0.99,
        });
      } else if (auth === "Bearer task-management-agent-key") {
        output = JSON.stringify({
          orderedTaskIds: [],
          summary: "Provider fallback produced a stable starter plan.",
          suggestedTasks: [
            {
              title: "Repro fallback task",
              priority: "high",
              estimatedMinutes: 20,
            },
          ],
        });
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ output_text: output }));
    });
  });

  const port = await findAvailablePort();
  await new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(undefined)));
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
  };
};

const stopServer = async (server) =>
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve(undefined))));

const summarizeClusterAttempts = (clusterAttempts) => {
  const attempts = Array.isArray(clusterAttempts) ? clusterAttempts : [];
  const attemptsPerEndpoint = {};

  for (const attempt of attempts) {
    const endpoint = String(attempt?.endpoint ?? "");
    if (!endpoint) {
      continue;
    }
    attemptsPerEndpoint[endpoint] = (attemptsPerEndpoint[endpoint] ?? 0) + 1;
  }

  return {
    totalAttempts: attempts.length,
    uniqueEndpoints: Object.keys(attemptsPerEndpoint),
    attemptsPerEndpoint,
    allErrorsFetchFailed:
      attempts.length > 0 &&
      attempts.every((attempt) => attempt?.ok === false && String(attempt?.error ?? "").toLowerCase() === "fetch failed"),
  };
};

const main = async () => {
  const dataDir = await mkdtemp(join(tmpdir(), "mindanchor-transport-repro-"));
  const apiPort = await findAvailablePort();
  const unreachableClusterPort = await findAvailablePort();
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
        MINDANCHOR_OPENCLAW_BASE_URL: `http://127.0.0.1:${unreachableClusterPort}`,
        MINDANCHOR_DEFAULT_MODEL_BASE_URL: provider.baseUrl,
        MINDANCHOR_DEFAULT_MODEL_API_KEY: "default-key",
        MINDANCHOR_DEFAULT_MODEL_NAME: "gpt-5.4",
        MINDANCHOR_DEFAULT_MODEL_WIRE_API: "responses",
        MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT: "xhigh",
        MINDANCHOR_AGENT_CHIEF_AGENT_BASE_URL: provider.baseUrl,
        MINDANCHOR_AGENT_CHIEF_AGENT_API_KEY: "chief-agent-key",
        MINDANCHOR_AGENT_CHIEF_AGENT_MODEL: "gpt-5.4",
        MINDANCHOR_AGENT_CHIEF_AGENT_WIRE_API: "responses",
        MINDANCHOR_AGENT_TASK_MANAGEMENT_AGENT_BASE_URL: provider.baseUrl,
        MINDANCHOR_AGENT_TASK_MANAGEMENT_AGENT_API_KEY: "task-management-agent-key",
        MINDANCHOR_AGENT_TASK_MANAGEMENT_AGENT_MODEL: "gpt-5.4",
        MINDANCHOR_AGENT_TASK_MANAGEMENT_AGENT_WIRE_API: "responses",
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

    const createGoalResponse = await fetch(`http://127.0.0.1:${apiPort}/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "transport-repro-user",
        title: "Transport fallback repro",
        description: "Force generate-path provider fallback after cluster transport failure.",
      }),
    });
    const createGoalPayload = await createGoalResponse.json();

    const adapterResponse = await fetch(`http://127.0.0.1:${apiPort}/debug/openclaw/adapter`);
    const adapterPayload = await adapterResponse.json();

    const summary = {
      clusterBaseUrl: `http://127.0.0.1:${unreachableClusterPort}`,
      providerBaseUrl: provider.baseUrl,
      createGoal: {
        status: createGoalResponse.status,
        goalIdPresent: Boolean(createGoalPayload?.id),
      },
      adapter: {
        lastDecision: adapterPayload?.lastDecision ?? null,
        lastFallback: adapterPayload?.lastFallback ?? null,
        failureCategoryCounts: adapterPayload?.failureCategoryCounts ?? {},
        clusterAttemptSummary: summarizeClusterAttempts(adapterPayload?.lastFallback?.clusterAttempts),
      },
    };

    const category = summary.adapter.lastFallback?.failureCategory;
    if (category !== "cluster_transport_error") {
      throw new Error(`Expected cluster_transport_error but received ${category ?? "null"}.`);
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
    await stopServer(provider.server);
    await rm(dataDir, { recursive: true, force: true });
  }
};

await main();
