import { cp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = resolve(repositoryRoot, "openclaw");
const destinationDirectory = resolve(repositoryRoot, "apps", "openclaw");
const domainSourceDirectory = resolve(repositoryRoot, "packages", "domain");
const domainDestinationDirectory = resolve(repositoryRoot, "apps", "packages", "domain");

await rm(destinationDirectory, { recursive: true, force: true });
await rm(domainDestinationDirectory, { recursive: true, force: true });
await cp(sourceDirectory, destinationDirectory, {
  recursive: true,
  filter: (entry) => ![".git", ".logs", "node_modules"].includes(entry.split(/[\\/]/).at(-1)),
});
await cp(domainSourceDirectory, domainDestinationDirectory, {
  recursive: true,
  filter: (entry) => ![".git", "node_modules"].includes(entry.split(/[\\/]/).at(-1)),
});
