import test from "node:test";
import assert from "node:assert/strict";
import { createServer as createNetServer } from "node:net";

import {
  findAvailablePort,
  isPortAvailable,
  probeHostsForBindHost,
} from "../lib/core-phase-port-availability.mjs";

test("probeHostsForBindHost checks wildcard binding for loopback hosts", () => {
  assert.deepEqual(probeHostsForBindHost("127.0.0.1"), ["127.0.0.1", "0.0.0.0"]);
  assert.deepEqual(probeHostsForBindHost("localhost"), ["127.0.0.1", "0.0.0.0"]);
  assert.deepEqual(probeHostsForBindHost("0.0.0.0"), ["0.0.0.0"]);
});

test("isPortAvailable treats a loopback port as unavailable when wildcard binding already owns it", async () => {
  const server = createNetServer();
  await new Promise((resolve) => server.listen(0, "0.0.0.0", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    assert.equal(await isPortAvailable("127.0.0.1", address.port), false);
    assert.equal(await isPortAvailable("0.0.0.0", address.port), false);
  } finally {
    server.close();
  }
});

test("findAvailablePort skips an occupied preferred port", async () => {
  const server = createNetServer();
  await new Promise((resolve) => server.listen(0, "0.0.0.0", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const selectedPort = await findAvailablePort("127.0.0.1", address.port);
    assert.notEqual(selectedPort, address.port);
    assert.ok(selectedPort > 0);
  } finally {
    server.close();
  }
});
