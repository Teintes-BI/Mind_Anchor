import type { OpenClawManagementAgentDescriptor, OpenClawManagementProfileKey } from "@mindanchor/domain";

export type OpenClawManagementPack = {
  schemaVersion: 1;
  generatedAt: string;
  managementProfileKey: OpenClawManagementProfileKey;
  agents: OpenClawManagementAgentDescriptor[];
};

export declare const buildOpenClawManagementPack: (options?: {
  managementProfileKey?: OpenClawManagementProfileKey;
  generatedAt?: string;
}) => OpenClawManagementPack;
