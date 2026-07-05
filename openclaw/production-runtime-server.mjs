import { pathToFileURL } from "node:url";
import { createLocalOpenClawServer } from "./local-runtime/server.mjs";

export const startProductionOpenClawRuntime = async ({
  host = process.env.OPENCLAW_HOST ?? "127.0.0.1",
  port = Number(process.env.OPENCLAW_PORT ?? "8788"),
  responseMode = process.env.OPENCLAW_RESPONSE_MODE ?? "parsed",
} = {}) => {
  const runtime = createLocalOpenClawServer({ host, port, responseMode });

  const shutdown = () => {
    runtime.server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await runtime.start();

  const address = runtime.server.address();
  const displayPort = typeof address === "object" && address ? address.port : port;
  console.log(`OpenClaw production runtime listening at http://${host}:${displayPort}`);

  return runtime;
};

const isMainModule = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMainModule) {
  await startProductionOpenClawRuntime();
}
