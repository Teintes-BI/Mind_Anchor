import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSecurityAgentWindowSummary,
  findSecurityAgentWindow,
} from "../lib/macos-security-agent-window.mjs";

test("findSecurityAgentWindow returns the first SecurityAgent window with normalized bounds", () => {
  const window = findSecurityAgentWindow([
    {
      kCGWindowOwnerName: "ControlCenter",
      kCGWindowNumber: 11,
      kCGWindowBounds: { X: 1, Y: 2, Width: 3, Height: 4 },
    },
    {
      kCGWindowOwnerName: "SecurityAgent",
      kCGWindowNumber: 42,
      kCGWindowBounds: { X: 743, Y: 225, Width: 434, Height: 182 },
      kCGWindowLayer: 1000,
      kCGWindowAlpha: 1,
      kCGWindowName: "",
    },
  ]);

  assert.deepEqual(window, {
    ownerName: "SecurityAgent",
    windowNumber: 42,
    windowName: "",
    layer: 1000,
    alpha: 1,
    bounds: { x: 743, y: 225, width: 434, height: 182 },
  });
});

test("findSecurityAgentWindow returns null when no SecurityAgent window is present", () => {
  assert.equal(
    findSecurityAgentWindow([
      { kCGWindowOwnerName: "MindAnchor for Mac", kCGWindowNumber: 1, kCGWindowBounds: {} },
    ]),
    null,
  );
});

test("buildSecurityAgentWindowSummary returns a readable summary", () => {
  assert.equal(
    buildSecurityAgentWindowSummary({
      ownerName: "SecurityAgent",
      windowNumber: 42,
      windowName: "",
      layer: 1000,
      alpha: 1,
      bounds: { x: 743, y: 225, width: 434, height: 182 },
    }),
    "SecurityAgent window#42 layer=1000 alpha=1 bounds=(743,225,434x182)",
  );
});
