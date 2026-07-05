import type { OpenClawManagementAgentDescriptor, OpenClawManagementProfileKey } from "@mindanchor/domain";

export declare const normalizeOpenClawManagedAgentConfig: (options?: {
  agentConfig?: {
    id?: string;
    name?: string;
    workspace?: string;
    agentDir?: string;
    model?: string;
  };
  managementProfileKey?: OpenClawManagementProfileKey;
}) => OpenClawManagementAgentDescriptor | null;

export declare const readOpenClawManagedAgentsFromProfile: (options?: {
  profileHome?: string;
  managementProfileKey?: OpenClawManagementProfileKey;
}) => Promise<OpenClawManagementAgentDescriptor[]>;
