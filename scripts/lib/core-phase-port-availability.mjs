import { createServer as createNetServer } from "node:net";

const portRange = (start, count = 25) => Array.from({ length: count }, (_, index) => start + index);

export const probeHostsForBindHost = (host) => {
  if (host === "127.0.0.1" || host === "localhost") {
    return ["127.0.0.1", "0.0.0.0"];
  }
  if (host === "::1") {
    return ["::1", "::"];
  }
  return [host];
};

const isPortAvailableOnSingleHost = (host, port) =>
  new Promise((resolve) => {
    const server = createNetServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, host, () => {
      server.close(() => resolve(true));
    });
  });

export const isPortAvailable = async (host, port) => {
  const probeHosts = probeHostsForBindHost(host);
  for (const probeHost of probeHosts) {
    // eslint-disable-next-line no-await-in-loop
    const available = await isPortAvailableOnSingleHost(probeHost, port);
    if (!available) {
      return false;
    }
  }
  return true;
};

export const findAvailablePort = async (host, preferredPort) => {
  for (const port of portRange(preferredPort)) {
    // eslint-disable-next-line no-await-in-loop
    const available = await isPortAvailable(host, port);
    if (available) {
      return port;
    }
  }

  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not resolve dynamic port."));
        return;
      }
      const port = address.port;
      server.close(() => resolve(port));
    });
  });
};
