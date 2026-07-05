import { type RecoveryPlan, type StateAssessment, type Task } from "@mindanchor/domain";
import { createId, now } from "../lib/utils.js";

const priorityWeight: Record<Task["priority"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const reprioritizeTasks = (tasks: Task[], reason: string) => {
  const ordered = [...tasks].sort((left, right) => {
    if (left.status === "done" && right.status !== "done") return 1;
    if (left.status !== "done" && right.status === "done") return -1;

    const priorityDelta = priorityWeight[right.priority] - priorityWeight[left.priority];
    if (priorityDelta !== 0) return priorityDelta;

    if (reason.includes("interruption")) {
      const leftDue = left.dueAt ?? "9999-12-31T00:00:00.000Z";
      const rightDue = right.dueAt ?? "9999-12-31T00:00:00.000Z";
      return leftDue.localeCompare(rightDue);
    }

    return left.sortOrder - right.sortOrder;
  });

  return ordered.map((task, index) => ({
    ...task,
    sortOrder: index,
    updatedAt: now(),
  }));
};

export const buildRecoveryPlan = ({
  userId,
  sessionId,
  taskId,
  tasks,
  latestAssessment,
}: {
  userId: string;
  sessionId?: string;
  taskId?: string;
  tasks: Task[];
  latestAssessment: StateAssessment | null;
}): RecoveryPlan => {
  const ordered = reprioritizeTasks(tasks, "interruption");
  const targetTask = ordered.find((task) => task.id === taskId) ?? ordered.find((task) => task.status !== "done");
  const lowEnergy = latestAssessment ? latestAssessment.energyScore < 40 : false;

  return {
    id: createId(),
    userId,
    sessionId,
    taskId: targetTask?.id ?? taskId,
    reason: lowEnergy ? "energy_drop" : "interruption_detected",
    nextStep: targetTask
      ? `Resume "${targetTask.title}" by completing the next visible sub-step.`
      : "Pick the smallest pending task and restart a short focus block.",
    suggestedMinutes: lowEnergy ? 10 : Math.min(targetTask?.estimatedMinutes ?? 25, 30),
    reprioritizedTaskIds: ordered.filter((task) => task.status !== "done").map((task) => task.id),
    createdAt: now(),
  };
};

