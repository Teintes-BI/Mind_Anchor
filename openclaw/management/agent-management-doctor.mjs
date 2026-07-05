const comparableFields = ["runtimeAgentId", "displayName", "soulFilePath", "managementWorkspaceName"];

export const normalizeOpenClawManagedAgentsInput = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object" && Array.isArray(value.agents)) {
    return value.agents;
  }

  return [];
};

export const buildOpenClawManagementDoctorReport = ({
  pack,
  actualManagedAgents = [],
  targetProfileKey,
} = {}) => {
  if (!pack) {
    throw new Error("pack is required");
  }
  if (!targetProfileKey) {
    throw new Error("targetProfileKey is required");
  }

  const normalizedActualManagedAgents = normalizeOpenClawManagedAgentsInput(actualManagedAgents);

  const expectedByAgentId = new Map(pack.agents.map((agent) => [agent.agentId, agent]));
  const actualByAgentId = new Map(normalizedActualManagedAgents.map((agent) => [agent.agentId, agent]));

  const missingAgents = pack.agents
    .filter((agent) => !actualByAgentId.has(agent.agentId))
    .map((agent) => agent.agentId);

  const extraAgents = normalizedActualManagedAgents
    .filter((agent) => !expectedByAgentId.has(agent.agentId))
    .map((agent) => agent.agentId);

  const fieldMismatches = pack.agents.flatMap((expectedAgent) => {
    const actualAgent = actualByAgentId.get(expectedAgent.agentId);
    if (!actualAgent) {
      return [];
    }

    const mismatches = comparableFields.flatMap((fieldName) =>
      expectedAgent[fieldName] === actualAgent[fieldName]
        ? []
        : [{
            agentId: expectedAgent.agentId,
            field: fieldName,
            expected: expectedAgent[fieldName],
            actual: actualAgent[fieldName],
          }],
    );

    if (JSON.stringify(expectedAgent.capabilities) !== JSON.stringify(actualAgent.capabilities)) {
      mismatches.push({
        agentId: expectedAgent.agentId,
        field: "capabilities",
        expected: expectedAgent.capabilities,
        actual: actualAgent.capabilities,
      });
    }

    if (JSON.stringify(expectedAgent.supportedWorkflows) !== JSON.stringify(actualAgent.supportedWorkflows)) {
      mismatches.push({
        agentId: expectedAgent.agentId,
        field: "supportedWorkflows",
        expected: expectedAgent.supportedWorkflows,
        actual: actualAgent.supportedWorkflows,
      });
    }

    return mismatches;
  });

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    targetProfileKey,
    aligned: missingAgents.length === 0 && fieldMismatches.length === 0,
    sourceManagementProfileKey: pack.managementProfileKey,
    expectedAgentCount: pack.agents.length,
    actualAgentCount: normalizedActualManagedAgents.length,
    missingAgents,
    extraAgents,
    fieldMismatches,
  };
};
