import {
  agentTeamPersonaMetadata,
  buildOpenClawManagementAgentDescriptor,
} from "@mindanchor/domain";

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
