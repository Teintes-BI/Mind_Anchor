#!/usr/bin/env node

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { buildOpenClawManagementPack } from "../openclaw/management/agent-management-pack.mjs";

const getExpectedAgentPaths = ({ profileHome, agent }) => ({
  workspace: profileHome ? path.join(profileHome, "workspaces", agent.managementWorkspaceName) : null,
  agentDir: profileHome ? path.join(profileHome, "agents", agent.agentId, "agent") : null,
});

export const buildOpenClawManagementApplyPlan = ({
  pack,
  targetProfileKey,
  dryRun = true,
  existingAgentConfigs = [],
  profileHome,
  defaultModel = null,
  confirmedFields = [],
} = {}) => {
  if (!pack) {
    throw new Error("pack is required");
  }
  if (!targetProfileKey) {
    throw new Error("targetProfileKey is required");
  }

  const existingById = new Map(existingAgentConfigs.map((entry) => [entry.id, entry]));

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    dryRun,
    sourceManagementProfileKey: pack.managementProfileKey,
    targetProfileKey,
    agentPlans: pack.agents.map((agent) => ({
      agentId: agent.agentId,
      runtimeAgentId: agent.runtimeAgentId,
      displayName: agent.displayName,
      targetWorkspaceName: agent.managementWorkspaceName,
      targetWorkspacePath: profileHome ? path.join(profileHome, "workspaces", agent.managementWorkspaceName) : null,
      targetAgentDirPath: profileHome ? path.join(profileHome, "agents", agent.agentId, "agent") : null,
      action: (() => {
        const existing = existingById.get(agent.agentId);
        if (!existing) {
          return dryRun ? "would_create" : "created";
        }
        const expectedPaths = getExpectedAgentPaths({ profileHome, agent });
        const pathMismatch =
          (expectedPaths.workspace && existing.workspace !== expectedPaths.workspace) ||
          (expectedPaths.agentDir && existing.agentDir !== expectedPaths.agentDir) ||
          existing.name !== agent.agentId;
        const riskyMismatch = false;
        const modelMismatch = defaultModel !== null && existing.model !== undefined && existing.model !== defaultModel;
        const modelConfirmed = confirmedFields.includes("model");

        if (pathMismatch && !riskyMismatch && !modelMismatch) {
          return dryRun ? "would_update_safe_fields" : "updated_safe_fields";
        }

        if (!pathMismatch && !riskyMismatch && modelMismatch && modelConfirmed) {
          return dryRun ? "would_update_confirmed_fields" : "updated_confirmed_fields";
        }

        if (pathMismatch || riskyMismatch || modelMismatch) {
          return dryRun ? "would_update" : "blocked_update";
        }

        return dryRun ? "would_keep" : "unchanged";
      })(),
    })),
  };
};

const resolveProfileHome = ({ targetProfileKey, profileHome }) => {
  if (profileHome) {
    return path.resolve(process.cwd(), profileHome);
  }
  const home = process.env.HOME ?? "";
  return targetProfileKey === "openclaw-dev" ? path.join(home, ".openclaw-dev") : path.join(home, `.${targetProfileKey}`);
};

const loadOpenClawConfig = async (profileHome) => {
  const configPath = path.join(profileHome, "openclaw.json");
  try {
    const raw = await readFile(configPath, "utf8");
    return {
      configPath,
      config: JSON.parse(raw),
    };
  } catch {
    return {
      configPath,
      config: {
        agents: {
          defaults: {},
          list: [],
        },
      },
    };
  }
};

const ensureAgentArtifacts = async ({ profileHome, agentId, runtimeAgentId }) => {
  const agentDir = path.join(profileHome, "agents", agentId, "agent");
  const workspaceDir = path.join(profileHome, "workspaces", runtimeAgentId);
  const mainAuthProfilesPath = path.join(profileHome, "agents", "main", "agent", "auth-profiles.json");
  const targetAuthProfilesPath = path.join(agentDir, "auth-profiles.json");

  await mkdir(agentDir, { recursive: true });
  await mkdir(workspaceDir, { recursive: true });

  try {
    await readFile(targetAuthProfilesPath, "utf8");
  } catch {
    try {
      await copyFile(mainAuthProfilesPath, targetAuthProfilesPath);
    } catch {
      await writeFile(
        targetAuthProfilesPath,
        `${JSON.stringify({ version: 1, profiles: {}, order: {}, lastGood: {} }, null, 2)}\n`,
        "utf8",
      );
    }
  }

  return {
    agentDir,
    workspaceDir,
  };
};

export async function applyOpenClawManagementPack({
  pack,
  targetProfileKey,
  dryRun = true,
  profileHome,
  confirmedFields = [],
} = {}) {
  if (!pack) {
    throw new Error("pack is required");
  }
  if (!targetProfileKey) {
    throw new Error("targetProfileKey is required");
  }

  const resolvedProfileHome = resolveProfileHome({ targetProfileKey, profileHome });
  const { configPath, config } = await loadOpenClawConfig(resolvedProfileHome);
  const existingAgentConfigs = Array.isArray(config.agents?.list) ? config.agents.list : [];
  const defaultModel = config.agents?.defaults?.model?.primary ?? null;
  const plan = buildOpenClawManagementApplyPlan({
    pack,
    targetProfileKey,
    dryRun,
    existingAgentConfigs,
    profileHome: resolvedProfileHome,
    defaultModel,
    confirmedFields,
  });

  if (dryRun) {
    return plan;
  }

  const nextAgentList = [...existingAgentConfigs];
  const existingById = new Map(nextAgentList.map((entry) => [entry.id, entry]));

  for (const agentPlan of plan.agentPlans) {
    if (
      agentPlan.action !== "created" &&
      agentPlan.action !== "updated_safe_fields" &&
      agentPlan.action !== "updated_confirmed_fields"
    ) {
      continue;
    }

    const artifacts = await ensureAgentArtifacts({
      profileHome: resolvedProfileHome,
      agentId: agentPlan.agentId,
      runtimeAgentId: agentPlan.runtimeAgentId,
    });

    const existingEntry = existingById.get(agentPlan.agentId);
    const entry = {
      ...(existingEntry ?? {}),
      id: agentPlan.agentId,
      name: agentPlan.agentId,
      workspace: artifacts.workspaceDir,
      agentDir: artifacts.agentDir,
      ...(() => {
        if (agentPlan.action === "updated_confirmed_fields" && confirmedFields.includes("model") && defaultModel) {
          return { model: defaultModel };
        }
        return existingEntry?.model ? { model: existingEntry.model } : defaultModel ? { model: defaultModel } : {};
      })(),
    };

    if (!existingEntry) {
      nextAgentList.push(entry);
      existingById.set(agentPlan.agentId, entry);
      continue;
    }

    const index = nextAgentList.findIndex((candidate) => candidate.id === agentPlan.agentId);
    nextAgentList[index] = entry;
    existingById.set(agentPlan.agentId, entry);
  }

  const nextConfig = {
    ...config,
    agents: {
      ...(config.agents ?? {}),
      list: nextAgentList,
    },
  };

  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(nextConfig, null, 2)}\n`, "utf8");

  return {
    ...plan,
    profileHome: resolvedProfileHome,
    configPath,
  };
}

export async function writeOpenClawManagementApplyReport({
  pack,
  outputPath,
  targetProfileKey,
  dryRun = true,
  profileHome,
  confirmedFields = [],
} = {}) {
  if (!outputPath) {
    throw new Error("outputPath is required");
  }

  const report = await applyOpenClawManagementPack({
    pack,
    targetProfileKey,
    dryRun,
    profileHome,
    confirmedFields,
  });
  const resolvedOutputPath = path.resolve(process.cwd(), outputPath);
  await mkdir(path.dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { outputPath, report };
}

async function parsePack(packPath) {
  if (!packPath) {
    return buildOpenClawManagementPack();
  }

  const raw = await readFile(path.resolve(process.cwd(), packPath), "utf8");
  return JSON.parse(raw);
}

function parseArgs(argv) {
  let packPath = null;
  let outputPath = "tmp/openclaw-management-apply-report.json";
  let targetProfileKey = "openclaw-dev";
  let dryRun = true;
  let profileHome = null;
  const confirmedFields = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === "--profile-key" && next) {
      targetProfileKey = next;
      index += 1;
      continue;
    }

    if (token === "--apply") {
      dryRun = false;
      continue;
    }

    if (token === "--confirm-model-update") {
      confirmedFields.push("model");
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

    outputPath = token;
  }

  return { packPath, outputPath, targetProfileKey, dryRun, profileHome, confirmedFields };
}

const isMainModule = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isMainModule) {
  const { packPath, outputPath, targetProfileKey, dryRun, profileHome, confirmedFields } = parseArgs(process.argv.slice(2));
  const pack = await parsePack(packPath);
  const { outputPath: resolvedOutputPath } = await writeOpenClawManagementApplyReport({
    pack,
    outputPath,
    targetProfileKey,
    dryRun,
    profileHome,
    confirmedFields,
  });
  process.stdout.write(`${resolvedOutputPath}\n`);
}
