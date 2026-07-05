import { z } from "zod";

export const debugScenarioIdSchema = z.enum(["focus-recovery-loop", "goal-reprioritization", "weekly-reflection-mix"]);

export type DebugScenarioId = z.infer<typeof debugScenarioIdSchema>;

export type DebugScenarioDefinition = {
  id: DebugScenarioId;
  title: string;
  description: string;
  defaultUserId: string;
  recommendedWorkflows: string[];
};

export const DEBUG_SCENARIOS: DebugScenarioDefinition[] = [
  {
    id: "focus-recovery-loop",
    title: "Focus recovery loop",
    description: "低专注 + 高压力媒体信号 + 活跃专注会话，用来调试 state / recovery / notification。",
    defaultUserId: "debug-focus-user",
    recommendedWorkflows: ["state_assessment", "recovery_plan", "notification_dispatch"],
  },
  {
    id: "goal-reprioritization",
    title: "Goal reprioritization",
    description: "多任务不同状态与优先级并存，用来调试 task management / progress summary。",
    defaultUserId: "debug-plan-user",
    recommendedWorkflows: ["task_management", "progress_summary"],
  },
  {
    id: "weekly-reflection-mix",
    title: "Weekly reflection mix",
    description: "一周内的任务、会话、音频/视频/健康混合数据，用来调试 reflection。",
    defaultUserId: "debug-reflection-user",
    recommendedWorkflows: ["reflection_report", "progress_summary"],
  },
];

export const getDebugScenarioDefinition = (scenarioId: DebugScenarioId) =>
  DEBUG_SCENARIOS.find((scenario) => scenario.id === scenarioId) ?? null;
