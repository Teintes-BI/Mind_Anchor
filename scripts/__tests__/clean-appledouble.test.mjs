import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { deleteAppleDoubleFiles, findAppleDoubleFiles } from "../lib/appledouble-cleanup.mjs";

describe("appledouble cleanup", () => {
  let fixtureDir = null;

  afterEach(async () => {
    if (fixtureDir) {
      await rm(fixtureDir, { recursive: true, force: true });
      fixtureDir = null;
    }
  });

  it("finds and deletes only AppleDouble sidecar files", async () => {
    fixtureDir = await mkdtemp(join(tmpdir(), "mindanchor-appledouble-"));
    await writeFile(join(fixtureDir, "keep.txt"), "keep");
    await writeFile(join(fixtureDir, "._delete-me"), "sidecar");
    await writeFile(join(fixtureDir, "._nested"), "root-sidecar");
    await writeFile(join(fixtureDir, ".DS_Store"), "finder");

    const nestedDir = join(fixtureDir, "nested");
    await mkdir(nestedDir, { recursive: true });
    await writeFile(join(fixtureDir, "nested/.keep"), "");
    await writeFile(join(fixtureDir, "nested/._inner"), "nested-sidecar");

    const before = (await findAppleDoubleFiles(fixtureDir)).sort();
    expect(before.map((path) => path.replace(`${fixtureDir}/`, ""))).toEqual(["._delete-me", "._nested", "nested/._inner"]);

    const removedCount = await deleteAppleDoubleFiles(fixtureDir);
    expect(removedCount).toBe(3);

    const after = await findAppleDoubleFiles(fixtureDir);
    expect(after).toHaveLength(0);

    const remaining = new Set(await readdir(fixtureDir));
    expect(remaining.has("keep.txt")).toBe(true);
    expect(remaining.has(".DS_Store")).toBe(true);
    expect(remaining.has("nested")).toBe(true);
  });
});
