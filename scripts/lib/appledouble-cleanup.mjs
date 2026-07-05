import { readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const walkAppleDoubleFiles = async (rootDir, currentDir, matches) => {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(currentDir, entry.name);
    if (entry.name.startsWith("._")) {
      matches.push(fullPath);
      continue;
    }

    if (entry.isDirectory()) {
      await walkAppleDoubleFiles(rootDir, fullPath, matches);
    }
  }

  return matches;
};

export const findAppleDoubleFiles = async (rootDir) => {
  const normalizedRootDir = resolve(rootDir);
  const matches = await walkAppleDoubleFiles(normalizedRootDir, normalizedRootDir, []);
  return matches.sort((left, right) => left.localeCompare(right, "en"));
};

export const deleteAppleDoubleFiles = async (rootDir) => {
  const matches = await findAppleDoubleFiles(rootDir);
  await Promise.all(matches.map((path) => rm(path, { recursive: true, force: true })));
  return matches.length;
};
