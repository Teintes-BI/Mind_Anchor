#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { buildOpenClawManagementPack } from "../openclaw/management/agent-management-pack.mjs";
import {
  buildOpenClawManagementDoctorReport,
  normalizeOpenClawManagedAgentsInput,
} from "../openclaw/management/agent-management-doctor.mjs";
import { readOpenClawManagedAgentsFromProfile } from "../openclaw/management/actual-managed-agents.mjs";

const DEFAULT_OUTPUT_PATH = "tmp/openclaw-management-doctor-report.json";

export async function writeOpenClawManagementDoctorReport({
  pack,
  actualManagedAgents = [],
  outputPath = DEFAULT_OUTPUT_PATH,
  targetProfileKey,
} = {}) {
  const report = buildOpenClawManagementDoctorReport({
    pack,
    actualManagedAgents,
    targetProfileKey,
  });

  const resolvedOutputPath = path.resolve(process.cwd(), outputPath);
  await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return {
    outputPath,
    report,
  };
}

async function parsePack(packPath) {
  if (!packPath) {
    return buildOpenClawManagementPack();
  }

  const raw = await readFile(path.resolve(process.cwd(), packPath), "utf8");
  return JSON.parse(raw);
}

async function parseActualManagedAgents(actualPath, profileHome, targetProfileKey) {
  if (profileHome) {
    return readOpenClawManagedAgentsFromProfile({
      profileHome: path.resolve(process.cwd(), profileHome),
      managementProfileKey: targetProfileKey,
    });
  }

  if (!actualPath) {
    return [];
  }

  const raw = await readFile(path.resolve(process.cwd(), actualPath), "utf8");
  return normalizeOpenClawManagedAgentsInput(JSON.parse(raw));
}

function parseArgs(argv) {
  let packPath = null;
  let actualPath = null;
  let outputPath = DEFAULT_OUTPUT_PATH;
  let targetProfileKey = "openclaw-dev";
  let profileHome = null;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--profile-key" && next) {
      targetProfileKey = next;
      index += 1;
      continue;
    }

    if (token === "--profile-home" && next) {
      profileHome = next;
      index += 1;
      continue;
    }

    if (!packPath) {
      packPath = token;
      continue;
    }

    if (!actualPath) {
      actualPath = token;
      continue;
    }

    outputPath = token;
  }

  return { packPath, actualPath, outputPath, targetProfileKey, profileHome };
}

const isMainModule = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isMainModule) {
  const { packPath, actualPath, outputPath, targetProfileKey, profileHome } = parseArgs(process.argv.slice(2));
  const pack = await parsePack(packPath);
  const actualManagedAgents = await parseActualManagedAgents(actualPath, profileHome, targetProfileKey);
  const { outputPath: reportPath } = await writeOpenClawManagementDoctorReport({
    pack,
    actualManagedAgents,
    outputPath,
    targetProfileKey,
  });
  process.stdout.write(`${path.resolve(process.cwd(), reportPath)}\n`);
}
