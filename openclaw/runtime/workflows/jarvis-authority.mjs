const pickString = (...values) =>
  values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .find((value) => value.length > 0);

const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };
const statusRank = { in_progress: 0, todo: 1, blocked: 2, done: 3 };

const prioritizeTasks = (tasks = []) =>
  [...tasks]
    .sort((left, right) => {
      const leftStatus = statusRank[pickString(left?.status) ?? "todo"] ?? 9;
      const rightStatus = statusRank[pickString(right?.status) ?? "todo"] ?? 9;
      if (leftStatus !== rightStatus) return leftStatus - rightStatus;
      const leftPriority = priorityRank[pickString(left?.priority) ?? "medium"] ?? 9;
      const rightPriority = priorityRank[pickString(right?.priority) ?? "medium"] ?? 9;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return Number(left?.sortOrder ?? 999) - Number(right?.sortOrder ?? 999);
    })
    .map((task) => pickString(task?.id))
    .filter(Boolean);

export const executeJarvisAuthority = (context) => {
  const action = pickString(context?.action) ?? "task_order";
  const riskLevel = pickString(context?.riskLevel) ?? "low";
  const rationale = pickString(context?.rationale) ?? "Jarvis selected the safest operational adjustment.";
  const memoryFramingHints = Array.isArray(context?.memoryFramingHints) ? context.memoryFramingHints : [];
  const framedMemory = memoryFramingHints
    .map((item) => {
      const label = pickString(item?.label);
      const summary = pickString(item?.summary);
      if (!summary) return null;
      return label === "计划约束" ? summary : label ? `${label}：${summary}` : summary;
    })
    .filter(Boolean);
  const summarySuffix = framedMemory.length > 0 ? ` 计划约束：${framedMemory.join("；")}` : "";
  const providedSummary = pickString(context?.summary);
  const orderedTaskIds = prioritizeTasks(Array.isArray(context?.tasks) ? context.tasks : []);

  if (action === "task_order") {
    return {
      authorityAgent: "life-secretary-agent",
      targetKind: "task_order",
      executionMode: riskLevel === "low" ? "apply_direct" : "proposal",
      orderedTaskIds,
      rationale,
      summary: providedSummary ?? `Jarvis produced a task ordering decision.${summarySuffix}`,
    };
  }

  if (action === "recovery_block") {
    return {
      authorityAgent: "life-secretary-agent",
      targetKind: "recovery_block",
      executionMode: riskLevel === "low" ? "apply_direct" : "proposal",
      nextStep: pickString(context?.nextStep) ?? "先执行一个最小恢复块，再回到主任务。",
      suggestedMinutes: Number(context?.suggestedMinutes ?? 15),
      rationale,
      summary: providedSummary ?? `Jarvis produced a recovery block decision.${summarySuffix}`,
    };
  }

  return {
    authorityAgent: "life-secretary-agent",
    targetKind: "plan_change",
    executionMode: "proposal",
    beforeStateSummary: pickString(context?.beforeStateSummary) ?? "Current plan state",
    afterStateSummary: pickString(context?.afterStateSummary) ?? "Adjusted plan state",
    rationale,
    summary: providedSummary ?? `Jarvis produced a plan change proposal.${summarySuffix}`,
  };
};
