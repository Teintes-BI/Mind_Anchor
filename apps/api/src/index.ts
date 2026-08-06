import { getEnv } from "./env.js";
import { buildApp } from "./app.js";

const start = async () => {
  const env = getEnv();
  const app = await buildApp(env);

  try {
    await app.listen({
      host: env.apiHost,
      port: env.apiPort,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
