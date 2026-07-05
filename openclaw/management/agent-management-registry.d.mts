import type { OpenClawManagementAgentDescriptor, OpenClawManagementProfileKey } from "@mindanchor/domain";

export declare const buildOpenClawManagementRegistry: (options?: {
  managementProfileKey?: OpenClawManagementProfileKey;
}) => OpenClawManagementAgentDescriptor[];

export declare const openClawManagementRegistry: OpenClawManagementAgentDescriptor[];
export declare const openClawManagementRegistryByAgentId: Map<string, OpenClawManagementAgentDescriptor>;
