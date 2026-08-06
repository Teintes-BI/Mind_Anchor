import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

test("macOS desktop collection has an explicit, default-off window-title contract", () => {
  const collector = read("apps/macos/Sources/Core/DesktopActivityCollector.swift");
  const viewModel = read("apps/macos/Sources/Core/AppViewModel.swift");
  const settings = read("apps/macos/Sources/Features/Settings/SettingsView.swift");

  assert.match(collector, /setWindowTitleCaptureEnabled/);
  assert.match(collector, /frontmostWindowTitle/);
  assert.match(collector, /windowTitle/);
  assert.match(collector, /windowTitleCaptureEnabled = false/);
  assert.match(viewModel, /recordWindowTitles/);
  assert.match(viewModel, /setWindowTitleCaptureEnabled/);
  assert.match(settings, /Record window titles/);
});
