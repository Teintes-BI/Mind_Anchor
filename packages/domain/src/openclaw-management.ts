import { z } from "zod";
import { agentTeamPersonaMetadata } from "./agent-team.js";

export const openClawManagementProfileKeySchema = z.string().min(1);

export const openClawManagementCapabilitiesSchema = z.object({
  canFront: z.boolean(),
  canConsult: z.boolean(),
  canWritePlans: z.boolean(),
  canGovernMemory: z.boolean(),
});

export const openClawManagementAgentDescriptorSchema = z.object({
  agentId: z.string().min(1),
  runtimeAgentId: z.string().min(1),
  displayName: z.string().min(1),
  soulFilePath: z.string().min(1),
  managementProfileKey: openClawManagementProfileKeySchema,
  managementWorkspaceName: z.string().min(1),
  capabilities: openClawManagementCapabilitiesSchema,
  supportedWorkflows: z.array(z.string().min(1)),
});

export type OpenClawManagementProfileKey = z.infer<typeof openClawManagementProfileKeySchema>;
export type OpenClawManagementCapabilities = z.infer<typeof openClawManagementCapabilitiesSchema>;
export type OpenClawManagementAgentDescriptor = z.infer<typeof openClawManagementAgentDescriptorSchema>;

export const buildOpenClawManagementAgentDescriptor = ({
  personaKey,
  managementProfileKey,
  supportedWorkflows = ["coach_front_state"],
}: {
  personaKey: keyof typeof agentTeamPersonaMetadata;
  managementProfileKey: OpenClawManagementProfileKey;
  supportedWorkflows?: string[];
}): OpenClawManagementAgentDescriptor => {
  const persona = agentTeamPersonaMetadata[personaKey];

  return {
    agentId: persona.agentId,
    runtimeAgentId: persona.runtimeAgentId,
    displayName: persona.displayName,
    soulFilePath: persona.soulFilePath,
    managementProfileKey,
    managementWorkspaceName: persona.runtimeAgentId,
    capabilities: {
      canFront: persona.canFront,
      canConsult: persona.canConsult,
      canWritePlans: persona.canWritePlans,
      canGovernMemory: persona.canGovernMemory,
    },
    supportedWorkflows,
  };
};
