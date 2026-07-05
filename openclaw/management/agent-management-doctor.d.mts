import type { OpenClawManagementPack } from "./agent-management-pack.mjs";

export type OpenClawManagementFieldMismatch = {
  agentId: string;
  field: string;
  expected: unknown;
  actual: unknown;
};

export type OpenClawManagementDoctorReport = {
  schemaVersion: 1;
  generatedAt: string;
  targetProfileKey: string;
  aligned: boolean;
  sourceManagementProfileKey: string;
  expectedAgentCount: number;
  actualAgentCount: number;
  missingAgents: string[];
  extraAgents: string[];
  fieldMismatches: OpenClawManagementFieldMismatch[];
};

export declare const normalizeOpenClawManagedAgentsInput: (value: unknown) => unknown[];

export declare const buildOpenClawManagementDoctorReport: (options: {
  pack: OpenClawManagementPack;
  actualManagedAgents?: unknown;
  targetProfileKey: string;
}) => OpenClawManagementDoctorReport;
