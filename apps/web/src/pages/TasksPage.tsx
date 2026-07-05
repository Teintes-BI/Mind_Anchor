import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { RecoveryPlan, Task } from "@mindanchor/domain";
import { api } from "../api";
import { formatTaskPriority, formatTaskStatus } from "../labels";

const STATUS_ACTIONS: Array<{ status: Task["status"]; label: string }> = [
  { status: "todo", label: "待办" },
  { status: "in_progress", label: "进行中" },
  { status: "blocked", label: "阻塞" },
  { status: "done", label: "完成" },
];

export function TasksPage() {
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof api.getGoalFlowOverview>> | null>(null);
  const [recoveryPlan, setRecoveryPlan] = useState<RecoveryPlan | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await api.getGoalFlowOverview();
      setOverview(data);
      if (!selectedGoalId && data.goals[0]) {
        setSelectedGoalId(data.goals[0].id);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载 GoalFlow 数据失败");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const goals = overview?.goals ?? [];
  const tasks = overview?.tasks ?? [];
  const activeSession = overview?.activeSession ?? null;
  const taskOptions = selectedGoalId ? tasks.filter((task) => task.goalId === selectedGoalId) : tasks;
  const selectedGoal = useMemo(() => goals.find((goal) => goal.id === selectedGoalId) ?? null, [goals, selectedGoalId]);
  const taskCounts = useMemo(
    () => ({
      total: taskOptions.length,
      todo: taskOptions.filter((task) => task.status === "todo").length,
      inProgress: taskOptions.filter((task) => task.status === "in_progress").length,
      blocked: taskOptions.filter((task) => task.status === "blocked").length,
      done: taskOptions.filter((task) => task.status === "done").length,
    }),
    [taskOptions],
  );
  const activeTask = useMemo(() => tasks.find((task) => task.id === activeSession?.taskId) ?? null, [activeSession?.taskId, tasks]);
  const currentRecoveryPlan = recoveryPlan ?? overview?.latestRecoveryPlan ?? null;

  const onCreateGoal = async (event: FormEvent) => {
    event.preventDefault();
    if (!goalTitle.trim()) return;
    await api.createGoal({ title: goalTitle.trim(), description: "" });
    setGoalTitle("");
    await load();
  };

  const onCreateTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGoalId || !taskTitle.trim()) return;
    await api.createTask({ goalId: selectedGoalId, title: taskTitle.trim() });
    setTaskTitle("");
    await load();
  };

  const onStartSession = async (taskId?: string) => {
    await api.startSession({
      taskId,
      goalId: selectedGoalId || undefined,
    });
    await load();
  };

  const onEndSession = async (interrupted: boolean, completeTask = false) => {
    if (!activeSession) return;
    const result = await api.endSession({
      sessionId: activeSession.id,
      interrupted,
      summary: interrupted ? "本次专注块在完成前被打断。" : "已按计划完成本次专注块。",
      completeTask,
    });
    setRecoveryPlan(result.recoveryPlan);
    await load();
  };

  const onGenerateRecovery = async () => {
    const plan = await api.createRecoveryPlan({
      sessionId: activeSession?.id,
      taskId: activeSession?.taskId,
      reason: "manual_request",
    });
    setRecoveryPlan(plan);
    await load();
  };

  const onUpdateTaskStatus = async (taskId: string, status: Task["status"]) => {
    await api.updateTask(taskId, { status });
    await load();
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">GoalFlow</p>
          <h2>任务与专注会话</h2>
        </div>
        <button className="button-secondary" onClick={() => void load()}>
          刷新
        </button>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>{selectedGoal?.title ?? "全部目标"}</h3>
            <p className="muted">
              {selectedGoal
                ? `已完成 ${selectedGoal.taskSummary.completed}/${selectedGoal.taskSummary.total} 个任务草稿`
                : overview?.summaryHeadline ?? "先选一个目标，再管理任务顺序与专注路径。"}
            </p>
          </div>
          <div className="task-summary">
            <span className="pill">总计 {taskCounts.total}</span>
            <span className="pill">待办 {taskCounts.todo}</span>
            <span className="pill">进行中 {taskCounts.inProgress}</span>
            <span className="pill">阻塞 {taskCounts.blocked}</span>
            <span className="pill">完成 {taskCounts.done}</span>
          </div>
        </div>
        {overview?.suggestedFocusTaskId ? (
          <p className="muted">建议专注任务：{tasks.find((task) => task.id === overview.suggestedFocusTaskId)?.title ?? overview.suggestedFocusTaskId}</p>
        ) : null}
        {overview?.latestAssessment ? <p className="muted">最新状态：{overview.latestAssessment.summary}</p> : null}
      </article>

      <div className="grid grid-2">
        <article className="card">
          <h3>创建目标</h3>
          <form className="stack" onSubmit={onCreateGoal}>
            <input value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="例如：稳定推进 MindAnchor 第一版" />
            <button className="button-primary" type="submit">
              添加目标
            </button>
          </form>
        </article>

        <article className="card">
          <h3>创建任务</h3>
          <form className="stack" onSubmit={onCreateTask}>
            <select value={selectedGoalId} onChange={(event) => setSelectedGoalId(event.target.value)}>
              <option value="">请选择目标</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
            <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="例如：补齐状态采集 API" />
            <button className="button-primary" type="submit" disabled={!selectedGoalId}>
              添加任务
            </button>
          </form>
        </article>
      </div>

      <div className="grid grid-2">
        <article className="card">
          <h3>任务列表</h3>
          <ul className="list">
            {taskOptions.map((task) => (
              <li key={task.id} className="task-row">
                <div className="task-meta">
                  <strong>{task.title}</strong>
                  <div className="task-meta-line">
                    <span className={`status-pill status-${task.status}`}>{formatTaskStatus(task.status)}</span>
                    {overview?.suggestedFocusTaskId === task.id ? <span className="pill">建议专注</span> : null}
                    <span className="muted">
                      {formatTaskPriority(task.priority)} · {task.estimatedMinutes} 分钟
                    </span>
                  </div>
                </div>
                <div className="task-actions">
                  <button className="button-secondary" onClick={() => void onStartSession(task.id)} disabled={Boolean(activeSession && activeSession.taskId !== task.id)}>
                    {activeSession?.taskId === task.id ? "专注中" : "开始专注"}
                  </button>
                  {STATUS_ACTIONS.map((action) => (
                    <button
                      key={action.status}
                      className="button-secondary"
                      onClick={() => void onUpdateTaskStatus(task.id, action.status)}
                      disabled={task.status === action.status}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
            {taskOptions.length === 0 ? <li className="muted">先创建一个目标和任务，再开始推进。</li> : null}
          </ul>
        </article>

        <article className="card">
          <h3>专注会话</h3>
          {activeSession ? (
            <div className="stack">
              <div>
                <p>会话开始于 {new Date(activeSession.startedAt).toLocaleString()}</p>
                <p className="muted">{activeTask ? `当前任务：${activeTask.title}` : "当前会话还没有绑定任务。"}</p>
                {overview?.latestBehaviorConclusion ? <p className="muted">最近提醒：{overview.latestBehaviorConclusion.suggestedAction}</p> : null}
              </div>
              <div className="inline-actions">
                <button className="button-primary" onClick={() => void onEndSession(false, false)}>
                  结束专注块
                </button>
                <button className="button-primary" onClick={() => void onEndSession(false, true)} disabled={!activeTask}>
                  完成任务
                </button>
                <button className="button-secondary" onClick={() => void onEndSession(true, false)}>
                  标记为中断
                </button>
                <button className="button-secondary" onClick={() => void onGenerateRecovery()}>
                  生成恢复计划
                </button>
              </div>
            </div>
          ) : (
            <p className="muted">当前没有进行中的专注会话。</p>
          )}

          {currentRecoveryPlan ? (
            <div className="recovery-plan">
              <h4>恢复计划</h4>
              <p>{currentRecoveryPlan.nextStep}</p>
              <p className="muted">建议时长：{currentRecoveryPlan.suggestedMinutes} 分钟</p>
              <Link className="button-secondary" to="/recovery">
                打开恢复工作区
              </Link>
            </div>
          ) : (
            <Link className="button-secondary" to="/recovery">
              打开恢复工作区
            </Link>
          )}
        </article>
      </div>
    </section>
  );
}
