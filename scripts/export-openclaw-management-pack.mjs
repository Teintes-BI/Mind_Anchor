#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { buildOpenClawManagementPack } from "../openclaw/management/agent-management-pack.mjs";

export async function writeOpenClawManagementPack({
  outputPath,
  managementProfileKey = "openclaw-dev",
  generatedAt,
} = {}) {
  if (!outputPath) {
    throw new Error("outputPath is required");
  }

  const pack = buildOpenClawManagementPack({ managementProfileKey, generatedAt });
  const resolvedOutputPath = path.resolve(process.cwd(), outputPath);

  await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");

  return {
    outputPath: resolvedOutputPath,
    pack,
  };
}

function parseArgs(argv) {
  let outputPath = "tmp/openclaw-management-pack.json";
  let managementProfileKey = "openclaw-dev";

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--profile-key" && next) {
      managementProfileKey = next;
      index += 1;
      continue;
    }

    outputPath = token;
  }

  return { outputPath, managementProfileKey };
}

const isMainModule = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isMainModule) {
  const { outputPath, managementProfileKey } = parseArgs(process.argv.slice(2));
  const { outputPath: resolvedOutputPath } = await writeOpenClawManagementPack({
    outputPath,
    managementProfileKey,
  });
  process.stdout.write(`${resolvedOutputPath}\n`);
}
