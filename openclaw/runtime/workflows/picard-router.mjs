const includesAny = (value, tokens) => tokens.some((token) => value.includes(token));

const classifyIntent = ({ workflow, userMessage, memoryContext, contextSource, hasEmotionSignal, hasRecentSignals }) => {
  const text = String(userMessage ?? "").trim().toLowerCase();
  const workflowText = String(workflow ?? "").trim().toLowerCase();
  const contextSourceText = String(contextSource ?? "").trim().toLowerCase();
  const memoryText = [
    ...(Array.isArray(memoryContext?.preferences) ? memoryContext.preferences : []),
    ...(Array.isArray(memoryContext?.habits) ? memoryContext.habits : []),
    ...(Array.isArray(memoryContext?.constraints) ? memoryContext.constraints : []),
  ]
    .map((item) => String(item?.summary ?? "").toLowerCase())
    .join(" ");

  const emotion =
    includesAny(text, ["情绪", "焦虑", "难受", "崩溃", "混乱", "害怕", "压力", "委屈", "难过", "紧张"]) ||
    workflowText.includes("emotion") ||
    contextSourceText === "mixed" ||
    Boolean(hasEmotionSignal);
  const analysis =
    includesAny(text, ["分析", "现实", "利弊", "判断", "逻辑", "推理", "原因", "策略", "数据", "结论"]) ||
    workflowText.includes("analysis") ||
    contextSourceText === "mixed" ||
    Boolean(hasRecentSignals);
  const balance =
    includesAny(text, ["平衡", "稳", "稳步", "继续", "推进", "节奏", "慢慢"]) || workflowText.includes("balance");
  const planning =
    includesAny(text, ["计划", "安排", "改排", "调整", "排期", "日程", "突发", "重排", "优先级", "排序"]) ||
    includesAny(workflowText, ["planning", "task_management", "plan_adjustment"]);
  const memoryPrefersPlanningFirst =
    memoryText.includes("先重排任务") || memoryText.includes("先调整计划") || memoryText.includes("先安排");

  return {
    emotion,
    analysis,
    balance,
    planning,
    memoryPrefersPlanningFirst,
  };
};

const pickAutoRoute = (intent) => {
  if (intent.planning || intent.memoryPrefersPlanningFirst) {
    return {
      frontAgent: "life-secretary-agent",
      consultedAgent: intent.emotion ? "companion-agent" : null,
      reasoning: "Picard selected planning because workflow and memory context indicate schedule-first stabilization.",
    };
  }

  if (intent.balance) {
    return {
      frontAgent: "balance-agent",
      consultedAgent: null,
      reasoning: "Picard selected balance guidance for pacing and stability.",
    };
  }

  if (intent.emotion && intent.analysis) {
    return {
      frontAgent: "companion-agent",
      consultedAgent: "analyst-agent",
      reasoning: "Picard selected emotional containment first and requested one analytical consult.",
    };
  }

  if (intent.emotion) {
    return {
      frontAgent: "companion-agent",
      consultedAgent: null,
      reasoning: "Picard selected emotional support as the safest first response.",
    };
  }

  if (intent.analysis) {
    return {
      frontAgent: "analyst-agent",
      consultedAgent: null,
      reasoning: "Picard selected analytical reflection because the request is primarily reality-check oriented.",
    };
  }

  return {
    frontAgent: "director-agent",
    consultedAgent: null,
    reasoning: "Picard stays front because no specialist handoff is required yet.",
  };
};

export const routeWithPicard = ({
  workflow,
  userMessage,
  memoryContext,
  contextSource,
  hasEmotionSignal,
  hasRecentSignals,
  manualOverrideAgent,
  releaseOverride,
  requiresPlanWrite,
  requiresMemoryGovernance,
}) => {
  const intent = classifyIntent({
    workflow,
    userMessage,
    memoryContext,
    contextSource,
    hasEmotionSignal,
    hasRecentSignals,
  });

  if (manualOverrideAgent && !releaseOverride) {
    if (requiresPlanWrite && manualOverrideAgent !== "life-secretary-agent") {
      return {
        routingOwner: "director-agent",
        frontAgent: "life-secretary-agent",
        consultedAgent: null,
        routingMode: "manual",
        manualOverride: true,
        handoffReason: "plan_write_requires_jarvis",
        overrideSourceAgent: manualOverrideAgent,
        reasoning: "Picard enforced Jarvis because the turn needs plan authority.",
        visibleSummary: "Picard kept routing ownership and handed the turn to Jarvis for plan authority.",
      };
    }

    if (requiresMemoryGovernance && manualOverrideAgent !== "memory-governor-agent") {
      return {
        routingOwner: "director-agent",
        frontAgent: "memory-governor-agent",
        consultedAgent: null,
        routingMode: "manual",
        manualOverride: true,
        handoffReason: "memory_governance_requires_data",
        overrideSourceAgent: manualOverrideAgent,
        reasoning: "Picard enforced Data because the turn needs memory governance authority.",
        visibleSummary: "Picard kept routing ownership and handed the turn to Data for memory governance.",
      };
    }

    return {
      routingOwner: "director-agent",
      frontAgent: manualOverrideAgent,
      consultedAgent: null,
      routingMode: "manual",
      manualOverride: true,
      handoffReason: null,
      overrideSourceAgent: null,
      reasoning: "Picard accepted the current manual override for this turn.",
      visibleSummary: `Picard kept routing ownership and exposed ${manualOverrideAgent} for this turn.`,
    };
  }

  if (requiresPlanWrite) {
    return {
      routingOwner: "director-agent",
      frontAgent: "life-secretary-agent",
      consultedAgent: intent.emotion ? "companion-agent" : null,
      routingMode: "auto",
      manualOverride: false,
      handoffReason: null,
      overrideSourceAgent: null,
      reasoning: "Picard selected Jarvis because the turn requires plan-writing authority.",
      visibleSummary: "Picard routed this turn to Jarvis and kept one lightweight consult channel open.",
    };
  }

  if (requiresMemoryGovernance) {
    return {
      routingOwner: "director-agent",
      frontAgent: "memory-governor-agent",
      consultedAgent: null,
      routingMode: "auto",
      manualOverride: false,
      handoffReason: null,
      overrideSourceAgent: null,
      reasoning: "Picard selected Data because the turn requires memory governance authority.",
      visibleSummary: "Picard routed this turn to Data for memory governance.",
    };
  }

  const autoRoute = pickAutoRoute(intent);
  return {
    routingOwner: "director-agent",
    frontAgent: autoRoute.frontAgent,
    consultedAgent: autoRoute.consultedAgent,
    routingMode: "auto",
    manualOverride: false,
    handoffReason: null,
    overrideSourceAgent: null,
    reasoning: autoRoute.reasoning,
    visibleSummary: autoRoute.consultedAgent
      ? `Picard routed this turn to ${autoRoute.frontAgent} and consulted ${autoRoute.consultedAgent}.`
      : `Picard routed this turn to ${autoRoute.frontAgent}.`,
  };
};
