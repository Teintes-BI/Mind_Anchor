import { agentTeamPersonaMetadata } from "@mindanchor/domain";
import { openClawManagementRegistryByAgentId } from "../management/agent-management-registry.mjs";
import { WAYFINDER_PERSPECTIVE_PACK_IDS } from "./wayfinder-perspective-packs.mjs";

const getManagementDescriptor = (agentId) => {
  const descriptor = openClawManagementRegistryByAgentId.get(agentId);
  if (!descriptor) {
    throw new Error(`Missing OpenClaw management descriptor for agent: ${agentId}`);
  }
  return descriptor;
};

export const nativeOpenClawAgentRegistry = [
  {
    ...getManagementDescriptor(agentTeamPersonaMetadata.picard.agentId),
    modelTarget: agentTeamPersonaMetadata.picard.agentId,
    worker: `${agentTeamPersonaMetadata.picard.agentId}-worker`,
    skills: [
      "coach-front-agent",
      "persona-routing-skill",
      "situation-framing-skill@1.0.0",
      WAYFINDER_PERSPECTIVE_PACK_IDS.find((skill) => skill.startsWith("values_clarification@")),
      WAYFINDER_PERSPECTIVE_PACK_IDS.find((skill) => skill.startsWith("systems_perspective@")),
    ].filter(Boolean),
    supportedWorkflows: ["coach_front_state", "persona_routing", "wayfinder_situation_framing"],
    wayfinderWorker: "wayfinder-situation-worker",
    wayfinderPerspectivePacks: WAYFINDER_PERSPECTIVE_PACK_IDS.filter(
      (skill) => skill.startsWith("values_clarification@") || skill.startsWith("systems_perspective@"),
    ),
    memoryScopes: [...agentTeamPersonaMetadata.picard.memoryScopes],
    canFront: agentTeamPersonaMetadata.picard.canFront,
    canConsult: agentTeamPersonaMetadata.picard.canConsult,
    canWritePlans: agentTeamPersonaMetadata.picard.canWritePlans,
    canGovernMemory: agentTeamPersonaMetadata.picard.canGovernMemory,
  },
  {
    ...getManagementDescriptor(agentTeamPersonaMetadata.troi.agentId),
    modelTarget: agentTeamPersonaMetadata.troi.agentId,
    worker: `${agentTeamPersonaMetadata.troi.agentId}-worker`,
    skills: [
      "coach-front-agent",
      "companion-support-skill",
      "decision-outcome-skill@1.0.0",
      WAYFINDER_PERSPECTIVE_PACK_IDS.find((skill) => skill.startsWith("values_clarification@")),
      WAYFINDER_PERSPECTIVE_PACK_IDS.find((skill) => skill.startsWith("energy_recovery@")),
    ].filter(Boolean),
    supportedWorkflows: ["coach_front_state", "companion_support", "wayfinder_reflection"],
    wayfinderWorker: "wayfinder-reflection-worker",
    wayfinderPerspectivePacks: WAYFINDER_PERSPECTIVE_PACK_IDS.filter(
      (skill) => skill.startsWith("values_clarification@") || skill.startsWith("energy_recovery@"),
    ),
    memoryScopes: [...agentTeamPersonaMetadata.troi.memoryScopes],
    canFront: agentTeamPersonaMetadata.troi.canFront,
    canConsult: agentTeamPersonaMetadata.troi.canConsult,
    canWritePlans: agentTeamPersonaMetadata.troi.canWritePlans,
    canGovernMemory: agentTeamPersonaMetadata.troi.canGovernMemory,
  },
  {
    ...getManagementDescriptor(agentTeamPersonaMetadata.spock.agentId),
    modelTarget: agentTeamPersonaMetadata.spock.agentId,
    worker: `${agentTeamPersonaMetadata.spock.agentId}-worker`,
    skills: [
      "coach-front-agent",
      "analysis-skill",
      "option-architecture-skill@1.0.0",
      WAYFINDER_PERSPECTIVE_PACK_IDS.find((skill) => skill.startsWith("systems_perspective@")),
      WAYFINDER_PERSPECTIVE_PACK_IDS.find((skill) => skill.startsWith("scientific_reasoning@")),
    ].filter(Boolean),
    supportedWorkflows: ["coach_front_state", "analytical_reasoning", "wayfinder_option_architecture"],
    wayfinderWorker: "wayfinder-option-worker",
    wayfinderPerspectivePacks: WAYFINDER_PERSPECTIVE_PACK_IDS.filter(
      (skill) => skill.startsWith("systems_perspective@") || skill.startsWith("scientific_reasoning@"),
    ),
    memoryScopes: [...agentTeamPersonaMetadata.spock.memoryScopes],
    canFront: agentTeamPersonaMetadata.spock.canFront,
    canConsult: agentTeamPersonaMetadata.spock.canConsult,
    canWritePlans: agentTeamPersonaMetadata.spock.canWritePlans,
    canGovernMemory: agentTeamPersonaMetadata.spock.canGovernMemory,
  },
  {
    ...getManagementDescriptor(agentTeamPersonaMetadata.guinan.agentId),
    modelTarget: agentTeamPersonaMetadata.guinan.agentId,
    worker: `${agentTeamPersonaMetadata.guinan.agentId}-worker`,
    skills: [
      "coach-front-agent",
      "balance-guidance-skill",
      WAYFINDER_PERSPECTIVE_PACK_IDS.find((skill) => skill.startsWith("values_clarification@")),
      WAYFINDER_PERSPECTIVE_PACK_IDS.find((skill) => skill.startsWith("energy_recovery@")),
    ].filter(Boolean),
    supportedWorkflows: ["coach_front_state", "balance_guidance"],
    wayfinderPerspectivePacks: WAYFINDER_PERSPECTIVE_PACK_IDS.filter(
      (skill) => skill.startsWith("values_clarification@") || skill.startsWith("energy_recovery@"),
    ),
    memoryScopes: [...agentTeamPersonaMetadata.guinan.memoryScopes],
    canFront: agentTeamPersonaMetadata.guinan.canFront,
    canConsult: agentTeamPersonaMetadata.guinan.canConsult,
    canWritePlans: agentTeamPersonaMetadata.guinan.canWritePlans,
    canGovernMemory: agentTeamPersonaMetadata.guinan.canGovernMemory,
  },
  {
    ...getManagementDescriptor(agentTeamPersonaMetadata.jarvis.agentId),
    modelTarget: agentTeamPersonaMetadata.jarvis.agentId,
    worker: `${agentTeamPersonaMetadata.jarvis.agentId}-worker`,
    skills: ["coach-front-agent", "plan-adjustment-skill"],
    supportedWorkflows: ["coach_front_state", "plan_adjustment"],
    memoryScopes: [...agentTeamPersonaMetadata.jarvis.memoryScopes],
    canFront: agentTeamPersonaMetadata.jarvis.canFront,
    canConsult: agentTeamPersonaMetadata.jarvis.canConsult,
    canWritePlans: agentTeamPersonaMetadata.jarvis.canWritePlans,
    canGovernMemory: agentTeamPersonaMetadata.jarvis.canGovernMemory,
  },
  {
    ...getManagementDescriptor(agentTeamPersonaMetadata.data.agentId),
    modelTarget: agentTeamPersonaMetadata.data.agentId,
    worker: `${agentTeamPersonaMetadata.data.agentId}-worker`,
    skills: ["coach-front-agent", "memory-governance-skill"],
    supportedWorkflows: ["coach_front_state", "memory_governance"],
    memoryScopes: [...agentTeamPersonaMetadata.data.memoryScopes],
    canFront: agentTeamPersonaMetadata.data.canFront,
    canConsult: agentTeamPersonaMetadata.data.canConsult,
    canWritePlans: agentTeamPersonaMetadata.data.canWritePlans,
    canGovernMemory: agentTeamPersonaMetadata.data.canGovernMemory,
  },
];

export const nativeOpenClawAgentRegistryById = new Map(
  nativeOpenClawAgentRegistry.map((entry) => [entry.agentId, entry]),
);
