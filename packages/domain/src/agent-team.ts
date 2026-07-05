export const memoryScopeValues = [
  "identity",
  "preferences",
  "habits",
  "constraints",
  "recentContext",
  "metadata",
] as const;

export const agentTeamPersonaMetadata = {
  picard: {
    agentId: "director-agent",
    runtimeAgentId: "picard-runtime-agent",
    displayName: "Picard",
    soulFilePath: "openclaw/souls/picard.md",
    memoryScopes: ["preferences", "habits", "constraints", "recentContext"],
    canFront: true,
    canConsult: true,
    canWritePlans: false,
    canGovernMemory: false,
  },
  troi: {
    agentId: "companion-agent",
    runtimeAgentId: "troi-runtime-agent",
    displayName: "Deanna Troi",
    soulFilePath: "openclaw/souls/deanna-troi.md",
    memoryScopes: ["preferences", "recentContext"],
    canFront: true,
    canConsult: true,
    canWritePlans: false,
    canGovernMemory: false,
  },
  spock: {
    agentId: "analyst-agent",
    runtimeAgentId: "spock-runtime-agent",
    displayName: "Spock",
    soulFilePath: "openclaw/souls/spock.md",
    memoryScopes: ["constraints", "habits", "recentContext"],
    canFront: true,
    canConsult: true,
    canWritePlans: false,
    canGovernMemory: false,
  },
  guinan: {
    agentId: "balance-agent",
    runtimeAgentId: "guinan-runtime-agent",
    displayName: "Guinan",
    soulFilePath: "openclaw/souls/guinan.md",
    memoryScopes: ["preferences", "habits", "recentContext"],
    canFront: true,
    canConsult: true,
    canWritePlans: false,
    canGovernMemory: false,
  },
  jarvis: {
    agentId: "life-secretary-agent",
    runtimeAgentId: "jarvis-runtime-agent",
    displayName: "Jarvis",
    soulFilePath: "openclaw/souls/jarvis.md",
    memoryScopes: ["preferences", "habits", "constraints", "recentContext"],
    canFront: true,
    canConsult: true,
    canWritePlans: true,
    canGovernMemory: false,
  },
  data: {
    agentId: "memory-governor-agent",
    runtimeAgentId: "data-runtime-agent",
    displayName: "Data",
    soulFilePath: "openclaw/souls/data.md",
    memoryScopes: ["metadata"],
    canFront: false,
    canConsult: true,
    canWritePlans: false,
    canGovernMemory: true,
  },
} as const;

export type AgentTeamPersonaName = keyof typeof agentTeamPersonaMetadata;
export type AgentTeamPersonaRegistry = typeof agentTeamPersonaMetadata;
export type AgentTeamPersonaEntry = AgentTeamPersonaRegistry[AgentTeamPersonaName];

export const agentTeamAgentIds = Object.values(agentTeamPersonaMetadata).map((persona) => persona.agentId) as [
  AgentTeamPersonaEntry["agentId"],
  ...AgentTeamPersonaEntry["agentId"][],
];
