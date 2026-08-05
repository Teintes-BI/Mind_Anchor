import {
  agentTeamPersonaMetadata,
  buildOpenClawManagementAgentDescriptor,
} from "../../packages/domain/dist/index.js";

export const buildOpenClawManagementRegistry = ({ managementProfileKey = "openclaw-dev" } = {}) =>
  Object.keys(agentTeamPersonaMetadata).map((personaKey) =>
    buildOpenClawManagementAgentDescriptor({
      personaKey,
      managementProfileKey,
    }),
  );

export const openClawManagementRegistry = buildOpenClawManagementRegistry();

export const openClawManagementRegistryByAgentId = new Map(
  openClawManagementRegistry.map((entry) => [entry.agentId, entry]),
);
