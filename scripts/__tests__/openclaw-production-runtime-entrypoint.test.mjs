import test from "node:test";
import assert from "node:assert/strict";

test("production runtime entrypoint can be imported as the canonical runtime module", async () => {
  const module = await import("../../openclaw/production-runtime-server.mjs");

  assert.equal(typeof module.startProductionOpenClawRuntime, "function");
});
