import { cp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = resolve(repositoryRoot, "openclaw");
const destinationDirectory = resolve(repositoryRoot, "apps", "openclaw");

await rm(destinationDirectory, { recursive: true, force: true });
await cp(sourceDirectory, destinationDirectory, {
  recursive: true,
  filter: (entry) => ![".git", ".logs", "node_modules"].includes(entry.split(/[\\/]/).at(-1)),
});

const stagedModuleFiles = (await readdir(destinationDirectory, { recursive: true })).filter((entry) => entry.endsWith(".mjs"));

await Promise.all(
  stagedModuleFiles.map(async (entry) => {
    const stagedModuleFile = resolve(destinationDirectory, entry);
    const stagedModuleSource = await readFile(stagedModuleFile, "utf8");
    const rewrittenStagedModuleSource = stagedModuleSource.replaceAll(
      'from "../../packages/domain/dist/index.js"',
      'from "../../../packages/domain/dist/index.js"',
    );

    if (rewrittenStagedModuleSource !== stagedModuleSource) {
      await writeFile(stagedModuleFile, rewrittenStagedModuleSource);
    }
  }),
);
