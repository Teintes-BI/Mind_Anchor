import { useEffect, useMemo, useState } from "react";
import type { RecoveryHistoryResponse, RecoveryPlan, Task } from "@mindanchor/domain";
import { api } from "../api";
import {
  formatInterventionAction,
  formatInterventionTrigger,
  formatRecoveryReason,
  formatSessionStatus,
  formatTaskPriority,
  formatTaskStatus,
} from "../labels";

const DEFAULT_REASON = "manual_request";

export function RecoveryPage() {
  const [history, setHistory] = useState<RecoveryHistoryResponse | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [manualReason, setManualReason] = useState(DEFAULT_REASON);
  const [generatedPlan, setGeneratedPlan] = useState<RecoveryPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const historyData = await api.getRecoveryHistory({ limit: 20 });
      setHistory(historyData);

      const pendingTasks = historyData.pendingTasks;
      const activeSessionTaskId = historyData.activeSession?.taskId;
      setSelectedTaskId((current) => {
        if (current && pendingTasks.some((task) => task.id === current)) {
          return current;
        }
        return activeSessionTaskId ?? historyData.suggestedFocusTaskId ?? pendingTasks[0]?.id ?? "";
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载恢复数据失败");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const tasks = history?.pendingTasks ?? [];
  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const activeSession = history?.activeSession ?? null;
  const interruptedSessions = history?.interruptedSessions ?? [];
  const pendingTasks = useMemo(
    () =>
      [...tasks].sort((left, right) => {
        const statusOrder = ["in_progress", "todo", "blocked"];
        const statusDiff = statusOrder.indexOf(left.status) - statusOrder.indexOf(right.status);
        if (statusDiff !== 0) {
          return statusDiff;
        }
        return left.updatedAt.localeCompare(right.updatedAt) * -1;
      }),
    [tasks],
  );
  const latestPlan = generatedPlan ?? history?.recoveryPlans[0] ?? null;
  const selectedTask = selectedTaskId ? taskMap.get(selectedTaskId) ?? null : null;
  const verificationChecks = [
    {
      label: "恢复计划",
      passed: Boolean(latestPlan),
      detail: latestPlan ? "最新恢复计划已经有内容。" : "先生成一条恢复计划，或者先跑一遍场景造数。",
    },
    {
      label: "中断会话",
      passed: interruptedSessions.length > 0,
      detail:
        interruptedSessions.length > 0
          ? `当前有 ${interruptedSessions.length} 条中断会话可供查看。`
          : "暂时还没有中断会话，请先运行本地 cluster 场景准备。",
    },
    {
      label: "恢复候选任务",
      passed: pendingTasks.length > 0,
      detail: pendingTasks.length > 0 ? `当前已列出 ${pendingTasks.length} 个可恢复任务。` : "暂时没有读取到未完成任务。",
    },
  ];

  const generatePlan = async ({ sessionId, taskId, reason }: { sessionId?: string; taskId?: string; reason: string }) => {
    try {
      setBusy(true);
      setError(null);
      const plan = await api.createRecoveryPlan({
        sessionId,
        taskId,
        reason: reason.trim() || DEFAULT_REASON,
      });
      setGeneratedPlan(plan);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "生成恢复计划失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">恢复</p>
          <h2>中断与恢复计划</h2>
        </div>
        <button className="button-secondary" onClick={() => void load()}>
          刷新
        </button>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="grid grid-3">
        <MetricCard label="未关闭干预" value={history?.interventions.filter((item) => item.status === "open").length ?? 0} />
        <MetricCard label="中断会话" value={interruptedSessions.length} />
        <MetricCard label="恢复候选任务" value={pendingTasks.length} />
      </div>

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>恢复验收</h3>
            <p className="muted">先看这里，快速判断本地 cluster 的输出是否已经像一条真实恢复建议。</p>
          </div>
          <span className={`status-pill ${verificationChecks.every((item) => item.passed) ? "status-done" : "status-blocked"}`}>
            {verificationChecks.every((item) => item.passed) ? "可用" : "待检查"}
          </span>
        </div>
        <div className="grid grid-3">
          {verificationChecks.map((item) => (
            <article className="message-card" key={item.label}>
              <div className="stack">
                <div className="inline-header">
                  <strong>{item.label}</strong>
                  <span className={`status-pill ${item.passed ? "status-done" : "status-blocked"}`}>{item.passed ? "通过" : "待补"}</span>
                </div>
                <p className="muted">{item.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </article>

      <div className="grid grid-2">
        <article className="card">
          <h3>最新干预</h3>
          {history?.interventions[0] ? (
            <div className="stack">
              <div className="detail-row">
                <span className="pill">{history.interventions[0].status === "open" ? "未关闭" : "已关闭"}</span>
                <span className="pill">{formatInterventionAction(history.interventions[0].action)}</span>
              </div>
              <p>{history.interventions[0].copy}</p>
              <p className="muted">
                触发原因 {formatInterventionTrigger(history.interventions[0].trigger)} · {new Date(history.interventions[0].createdAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="muted">当前没有未关闭干预。</p>
          )}
        </article>

        <article className="card">
          <h3>最新恢复计划</h3>
          {latestPlan ? (
            <div className="recovery-plan">
              <h4>{taskMap.get(latestPlan.taskId ?? "")?.title ?? "恢复计划已生成"}</h4>
              <p>{latestPlan.nextStep}</p>
              <p className="muted">
                建议时长：{latestPlan.suggestedMinutes} 分钟 · 原因 {formatRecoveryReason(latestPlan.reason)}
              </p>
              {latestPlan.reprioritizedTaskIds.length > 0 ? (
                <p className="muted">重排任务：{latestPlan.reprioritizedTaskIds.join("，")}</p>
              ) : null}
            </div>
          ) : (
            <p className="muted">暂时还没有生成恢复计划。</p>
          )}
        </article>
      </div>

      <div className="grid grid-2">
        <article className="card">
          <div className="inline-header">
            <div>
              <h3>生成计划</h3>
              <p className="muted">可以基于当前会话、最近一次中断，或者任意未完成任务来生成恢复计划。</p>
            </div>
          </div>

          <div className="stack">
            <div>
              <label className="muted" htmlFor="recovery-task">
                恢复任务
              </label>
              <select id="recovery-task" value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)}>
                <option value="">不绑定任务</option>
                {pendingTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="muted" htmlFor="recovery-reason">
                原因
              </label>
              <input id="recovery-reason" value={manualReason} onChange={(event) => setManualReason(event.target.value)} placeholder="manual_request" />
            </div>

            <div className="card-actions">
              <button
                className="button-primary"
                onClick={() =>
                  void generatePlan({
                    sessionId: activeSession?.id,
                    taskId: activeSession?.taskId ?? (selectedTaskId || undefined),
                    reason: manualReason,
                  })
                }
                disabled={busy || (!activeSession && !selectedTaskId)}
              >
                {busy ? "生成中..." : activeSession ? "为当前会话生成" : "根据所选任务生成"}
              </button>
              <button
                className="button-secondary"
                onClick={() =>
                  void generatePlan({
                    sessionId: interruptedSessions[0]?.id,
                    taskId: interruptedSessions[0]?.taskId,
                    reason: "session_interrupted",
                  })
                }
                disabled={busy || interruptedSessions.length === 0}
              >
                使用最近一次中断
              </button>
            </div>

            {activeSession ? (
              <p className="muted">
                当前会话开始于 {new Date(activeSession.startedAt).toLocaleString()} · 任务{" "}
                {taskMap.get(activeSession.taskId ?? "")?.title ?? "未绑定"}
              </p>
            ) : selectedTask ? (
              <p className="muted">
                已选任务：{selectedTask.title} · {formatTaskPriority(selectedTask.priority)} · {selectedTask.estimatedMinutes ?? "?"} 分钟
              </p>
            ) : (
              <p className="muted">当前没有进行中会话，也没有选中未完成任务。</p>
            )}
          </div>
        </article>

        <article className="card">
          <h3>最近中断</h3>
          <ul className="list">
            {interruptedSessions.slice(0, 6).map((session) => {
              const task = taskMap.get(session.taskId ?? "");
              return (
                <li key={session.id} className="task-row">
                  <div className="task-meta">
                    <strong>{task?.title ?? "未绑定任务的会话"}</strong>
                    <div className="detail-row">
                      <span className="status-pill status-blocked">{formatSessionStatus(session.status)}</span>
                      <span className="pill">{session.interruptionCount} 次中断</span>
                    </div>
                    <span className="muted">
                      开始于 {new Date(session.startedAt).toLocaleString()}
                      {session.endedAt ? ` · 结束于 ${new Date(session.endedAt).toLocaleString()}` : ""}
                    </span>
                    {session.summary ? <span>{session.summary}</span> : null}
                  </div>
                  <div className="task-actions">
                    <button
                      className="button-secondary"
                      onClick={() =>
                        void generatePlan({
                          sessionId: session.id,
                          taskId: session.taskId,
                          reason: "session_interrupted",
                        })
                      }
                      disabled={busy}
                    >
                      生成计划
                    </button>
                  </div>
                </li>
              );
            })}
            {interruptedSessions.length === 0 ? <li className="muted">暂时还没有中断会话。</li> : null}
          </ul>
        </article>
      </div>

      <article className="card">
        <h3>恢复候选任务</h3>
        <ul className="list">
          {pendingTasks.slice(0, 8).map((task) => (
            <li key={task.id} className="task-row">
              <div className="task-meta">
                <strong>{task.title}</strong>
                <div className="detail-row">
                  <span className={`status-pill status-${task.status}`}>{formatTaskStatus(task.status)}</span>
                  <span className="pill">{formatTaskPriority(task.priority)}</span>
                  {history?.suggestedFocusTaskId === task.id ? <span className="pill">建议专注</span> : null}
                </div>
                <span className="muted">
                  {task.estimatedMinutes ?? "?"} 分钟
                  {task.dueAt ? ` · 截止 ${new Date(task.dueAt).toLocaleDateString()}` : ""}
                </span>
              </div>
              <div className="task-actions">
                <button className="button-secondary" onClick={() => setSelectedTaskId(task.id)}>
                  用于恢复
                </button>
              </div>
            </li>
          ))}
          {pendingTasks.length === 0 ? <li className="muted">当前没有可用于恢复计划的未完成任务。</li> : null}
        </ul>
      </article>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="card metric-card">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
