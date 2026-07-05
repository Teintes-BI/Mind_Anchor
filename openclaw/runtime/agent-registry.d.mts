import type { MemoryScope } from "@mindanchor/domain";

export type NativeOpenClawRegistryAgent = {
  agentId: string;
  runtimeAgentId: string;
  displayName: string;
  soulFilePath: string;
  modelTarget: string;
  worker: string;
  skills: string[];
  supportedWorkflows: string[];
  memoryScopes: MemoryScope[];
  canFront: boolean;
  canConsult: boolean;
  canWritePlans: boolean;
  canGovernMemory: boolean;
};

export const nativeOpenClawAgentRegistry: NativeOpenClawRegistryAgent[];
export const nativeOpenClawAgentRegistryById: Map<string, NativeOpenClawRegistryAgent>;
