import test from "node:test";
import assert from "node:assert/strict";

import {
  isNodeVersionAtLeast,
  selectOpenClawNodeBinary,
} from "../lib/openclaw-node-runtime.mjs";

test("isNodeVersionAtLeast accepts versions at or above the minimum", () => {
  assert.equal(isNodeVersionAtLeast("v22.16.0", { major: 22, minor: 16, patch: 0 }), true);
  assert.equal(isNodeVersionAtLeast("v24.14.0", { major: 22, minor: 16, patch: 0 }), true);
});

test("isNodeVersionAtLeast rejects versions below the minimum", () => {
  assert.equal(isNodeVersionAtLeast("v22.14.0", { major: 22, minor: 16, patch: 0 }), false);
  assert.equal(isNodeVersionAtLeast("v21.99.0", { major: 22, minor: 16, patch: 0 }), false);
});

test("selectOpenClawNodeBinary picks the first compatible candidate", () => {
  const result = selectOpenClawNodeBinary({
    minimumVersion: { major: 22, minor: 16, patch: 0 },
    candidates: [
      { path: "/repo/.tools/node/bin/node", version: "v22.14.0" },
      { path: "/Users/test/.nvm/versions/node/v24.14.0/bin/node", version: "v24.14.0" },
    ],
  });

  assert.equal(result.path, "/Users/test/.nvm/versions/node/v24.14.0/bin/node");
  assert.equal(result.version, "v24.14.0");
});

test("selectOpenClawNodeBinary surfaces all checked candidates when none are compatible", () => {
  const result = selectOpenClawNodeBinary({
    minimumVersion: { major: 22, minor: 16, patch: 0 },
    candidates: [
      { path: "/repo/.tools/node/bin/node", version: "v22.14.0" },
      { path: "/usr/local/bin/node", version: "v20.11.1" },
    ],
  });

  assert.equal(result.path, null);
  assert.deepEqual(result.checkedCandidates, [
    { path: "/repo/.tools/node/bin/node", version: "v22.14.0", compatible: false },
    { path: "/usr/local/bin/node", version: "v20.11.1", compatible: false },
  ]);
});
