import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT_DIR = resolve(import.meta.dirname, "../..");
const WEB_SRC_DIR = join(ROOT_DIR, "apps/web/src");

const collectJsFiles = async (dir, matches = []) => {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectJsFiles(fullPath, matches);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      matches.push(fullPath);
    }
  }

  return matches;
};

describe("web source hygiene", () => {
  it("does not keep compiled js siblings under apps/web/src", async () => {
    const jsFiles = (await collectJsFiles(WEB_SRC_DIR)).map((path) => path.replace(`${ROOT_DIR}/`, ""));
    expect(jsFiles).toEqual([]);
  });
});
