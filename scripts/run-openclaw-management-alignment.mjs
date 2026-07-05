#!/usr/bin/env node

import path from "node:path";
import process from "node:process";

import { readOpenClawManagedAgentsFromProfile } from "../openclaw/management/actual-managed-agents.mjs";
import { writeOpenClawManagementPack } from "./export-openclaw-management-pack.mjs";
import { writeOpenClawManagementDoctorReport } from "./doctor-openclaw-management-pack.mjs";

const resolveDefaultProfileHome = (managementProfileKey) => {
  const home = process.env.HOME ?? "";
  return managementProfileKey === "openclaw-dev"
    ? path.join(home, ".openclaw-dev")
    : path.join(home, `.${managementProfileKey}`);
};

export async function writeOpenClawManagementProfileAlignmentReport({
  profileHome,
  managementProfileKey = "openclaw-dev",
  packOutputPath = "tmp/openclaw-management-pack.json",
  reportOutputPath = "tmp/openclaw-management-profile-alignment-report.json",
  generatedAt,
} = {}) {
  const resolvedProfileHome = profileHome
    ? path.resolve(process.cwd(), profileHome)
    : resolveDefaultProfileHome(managementProfileKey);

  const { pack } = await writeOpenClawManagementPack({
    outputPath: packOutputPath,
    managementProfileKey,
    generatedAt,
  });

  const actualManagedAgents = await readOpenClawManagedAgentsFromProfile({
    profileHome: resolvedProfileHome,
    managementProfileKey,
  });

  const { outputPath } = await writeOpenClawManagementDoctorReport({
    pack,
    actualManagedAgents,
    outputPath: reportOutputPath,
    targetProfileKey: managementProfileKey,
  });

  return {
    profileHome: resolvedProfileHome,
    packOutputPath: path.resolve(process.cwd(), packOutputPath),
    reportOutputPath: path.resolve(process.cwd(), outputPath),
  };
}

function parseArgs(argv) {
  let managementProfileKey = "openclaw-dev";
  let profileHome = null;
  let packOutputPath = "tmp/openclaw-management-pack.json";
  let reportOutputPath = "tmp/openclaw-management-profile-alignment-report.json";

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--profile-key" && next) {
      managementProfileKey = next;
      index += 1;
      continue;
    }

    if (token === "--profile-home" && next) {
      profileHome = next;
      index += 1;
      continue;
    }

    if (!packOutputPath || packOutputPath === "tmp/openclaw-management-pack.json") {
      packOutputPath = token;
      continue;
    }

    reportOutputPath = token;
  }

  return {
    managementProfileKey,
    profileHome,
    packOutputPath,
    reportOutputPath,
  };
}

const isMainModule = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isMainModule) {
  const { managementProfileKey, profileHome, packOutputPath, reportOutputPath } = parseArgs(process.argv.slice(2));
  const result = await writeOpenClawManagementProfileAlignmentReport({
    profileHome,
    managementProfileKey,
    packOutputPath,
    reportOutputPath,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
