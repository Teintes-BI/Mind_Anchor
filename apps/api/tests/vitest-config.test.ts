import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("api vitest config", () => {
  it("excludes AppleDouble sidecar files from test discovery", async () => {
    const configPath = resolve(import.meta.dirname, "../vitest.config.ts");
    const configSource = await readFile(configPath, "utf8");
    expect(configSource).toContain("**/._*");
  });
});
