import test from "node:test";
import assert from "node:assert/strict";

import { parseProfilesShowJson } from "../lib/macos-installed-profiles.mjs";

test("parseProfilesShowJson parses a valid plist-converted json payload", () => {
  const parsed = parseProfilesShowJson(`{"_computerLevel":[{"PayloadIdentifier":"com.example.profile"}]}`);
  assert.deepEqual(parsed, {
    _computerLevel: [{ PayloadIdentifier: "com.example.profile" }],
  });
});

test("parseProfilesShowJson falls back to empty object for empty output", () => {
  assert.deepEqual(parseProfilesShowJson(""), {});
});
