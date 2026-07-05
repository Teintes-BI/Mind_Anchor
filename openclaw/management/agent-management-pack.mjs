import { buildOpenClawManagementRegistry } from "./agent-management-registry.mjs";

export const buildOpenClawManagementPack = ({
  managementProfileKey = "openclaw-dev",
  generatedAt = new Date().toISOString(),
} = {}) => ({
  schemaVersion: 1,
  generatedAt,
  managementProfileKey,
  agents: buildOpenClawManagementRegistry({ managementProfileKey }),
});
