import { readFile } from "node:fs/promises";
import path from "node:path";

import { openClawManagementRegistryByAgentId } from "./agent-management-registry.mjs";

const normalizeWorkspaceName = (workspacePath, fallbackValue) => {
  if (typeof workspacePath === "string" && workspacePath.length > 0) {
    return path.basename(workspacePath);
  }
  return fallbackValue;
};

export const normalizeOpenClawManagedAgentConfig = ({
  agentConfig,
  managementProfileKey = "openclaw-dev",
} = {}) => {
  if (!agentConfig?.id) {
    return null;
  }

  const canonical = openClawManagementRegistryByAgentId.get(agentConfig.id);
  const managementWorkspaceName = normalizeWorkspaceName(
    agentConfig.workspace,
    canonical?.managementWorkspaceName ?? agentConfig.id,
  );

  if (canonical) {
    return {
      ...canonical,
      managementProfileKey,
      managementWorkspaceName,
    };
  }

  return {
    agentId: agentConfig.id,
    runtimeAgentId: managementWorkspaceName,
    displayName: agentConfig.name ?? agentConfig.id,
    soulFilePath: `openclaw/souls/unmanaged/${agentConfig.id}.md`,
    managementProfileKey,
    managementWorkspaceName,
    capabilities: {
      canFront: false,
      canConsult: false,
      canWritePlans: false,
      canGovernMemory: false,
    },
    supportedWorkflows: [],
  };
};

export const readOpenClawManagedAgentsFromProfile = async ({
  profileHome,
  managementProfileKey = "openclaw-dev",
} = {}) => {
  if (!profileHome) {
    throw new Error("profileHome is required");
  }

  const configPath = path.join(profileHome, "openclaw.json");
  const raw = await readFile(configPath, "utf8");
  const config = JSON.parse(raw);
  const agentList = Array.isArray(config?.agents?.list) ? config.agents.list : [];

  return agentList
    .map((agentConfig) => normalizeOpenClawManagedAgentConfig({ agentConfig, managementProfileKey }))
    .filter(Boolean);
};
