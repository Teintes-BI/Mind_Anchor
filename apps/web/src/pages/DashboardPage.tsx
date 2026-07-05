import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { DashboardSummary } from "@mindanchor/domain";
import { api } from "../api";
import {
  formatCapability,
  formatEmotionLabel,
  formatMessageStatus,
  formatNotificationChannel,
  formatOnlineStatus,
  formatPlatform,
  formatRiskLevel,
} from "../labels";

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingInbox = summary?.inbox.filter((message) => message.status === "pending") ?? [];
  const suggestedTask = summary?.tasks.find((task) => task.id === summary.suggestedFocusTaskId) ?? null;

  const load = async () => {
    try {
      setError(null);
      setSummary(await api.getDashboardSummary());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载 Dashboard 失败");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (!summary && !error) {
    return (
      <section className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Gateway 与 OpenClaw 总览</h2>
          </div>
        </div>
        <article className="card">
          <h3>正在加载 Dashboard…</h3>
          <p className="muted">正在同步 Gateway 与 OpenClaw 的最新工作区摘要。</p>
        </article>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Gateway 与 OpenClaw 总览</h2>
        </div>
        <button className="button-secondary" onClick={() => void load()}>
          刷新
        </button>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="grid grid-3">
        <MetricCard label="目标数" value={summary?.goalCount ?? 0} />
        <MetricCard label="任务数" value={summary?.taskCount ?? 0} />
        <MetricCard label="未关闭干预" value={summary?.openInterventions ?? 0} />
      </div>

      <div className="grid grid-3">
        <MetricCard label="已完成任务" value={summary?.completedTaskCount ?? 0} />
        <MetricCard label="进行中任务" value={summary?.inProgressTaskCount ?? 0} />
        <MetricCard label="完成率" value={`${Math.round((summary?.completionRate ?? 0) * 100)}%`} />
      </div>

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>工作区快捷入口</h3>
            <p className="muted">这些页面都基于当前 read-model 接口，适合日常查看与人工验收。</p>
          </div>
          <Link className="button-secondary" to="/agents">
            打开 Agent Lab
          </Link>
        </div>
        <div className="grid grid-3">
          <WorkspaceShortcut
            title="GoalFlow"
            description={suggestedTask ? `建议优先专注：${suggestedTask.title}` : "管理目标、任务和专注会话。"}
            to="/tasks"
            actionLabel="打开 GoalFlow"
          />
          <WorkspaceShortcut
            title="状态趋势"
            description={summary?.latestAssessment ? summary.latestAssessment.summary : "查看多模态状态趋势与最近判断。"}
            to="/state"
            actionLabel="打开状态页"
          />
          <WorkspaceShortcut
            title="恢复"
            description={summary?.latestRecoveryPlan ? summary.latestRecoveryPlan.nextStep : "查看中断历史并生成恢复计划。"}
            to="/recovery"
            actionLabel="打开恢复页"
          />
          <WorkspaceShortcut
            title="复盘"
            description="查看周报与月报，判断节奏是否在变好。"
            to="/reflections"
            actionLabel="打开复盘页"
          />
          <WorkspaceShortcut
            title="收件箱"
            description={pendingInbox.length > 0 ? `当前有 ${pendingInbox.length} 条待处理消息。` : "当前没有待处理客户端消息。"}
            to="/inbox"
            actionLabel="打开收件箱"
          />
          <WorkspaceShortcut
            title="调试台"
            description="查看 adapter 状态、trace、场景和回归结果。"
            to="/agents"
            actionLabel="使用 Agent Lab"
          />
        </div>
      </article>

      <div className="grid grid-2">
        <article className="card">
          <h3>最新状态</h3>
          {summary?.latestAssessment ? (
            <>
              <dl className="metrics-list">
                <div>
                  <dt>专注</dt>
                  <dd>{summary.latestAssessment.focusScore}</dd>
                </div>
                <div>
                  <dt>能量</dt>
                  <dd>{summary.latestAssessment.energyScore}</dd>
                </div>
                <div>
                  <dt>情绪</dt>
                  <dd>{summary.latestAssessment.moodScore}</dd>
                </div>
                <div>
                  <dt>疲劳</dt>
                  <dd>{summary.latestAssessment.fatigueScore ?? "—"}</dd>
                </div>
              </dl>
              <p>{summary.latestAssessment.summary}</p>
              {summary.latestAssessment.activeInputs.length > 0 ? (
                <p className="muted">输入来源：{summary.latestAssessment.activeInputs.join(" · ")}</p>
              ) : null}
            </>
          ) : (
            <p className="muted">暂时还没有状态评估。</p>
          )}
        </article>

        <article className="card">
          <h3>行为结论</h3>
          {summary?.latestBehaviorConclusion ? (
            <>
              <p>{summary.latestBehaviorConclusion.summary}</p>
              <p className="muted">
                {formatRiskLevel(summary.latestBehaviorConclusion.riskLevel)} · 通道 {formatNotificationChannel(summary.latestBehaviorConclusion.recommendedChannel)}
              </p>
              <p>{summary.latestBehaviorConclusion.suggestedAction}</p>
            </>
          ) : (
            <p className="muted">暂时还没有行为结论。</p>
          )}
        </article>
      </div>

      <div className="grid grid-2">
        <article className="card">
          <h3>进展摘要</h3>
          <p>{summary?.summaryHeadline ?? "暂时还没有进展摘要。"}</p>
          {suggestedTask ? (
            <div className="stack">
              <p className="muted">建议专注任务：{suggestedTask.title}</p>
              <Link className="button-secondary" to="/tasks">
                打开 GoalFlow
              </Link>
            </div>
          ) : summary?.suggestedFocusTaskId ? (
            <p className="muted">建议专注任务 ID：{summary.suggestedFocusTaskId}</p>
          ) : (
            <p className="muted">暂时还没有建议专注任务。</p>
          )}
        </article>

        <article className="card">
          <h3>任务状态分布</h3>
          <dl className="metrics-list">
            <div>
              <dt>待办</dt>
              <dd>{Math.max((summary?.taskCount ?? 0) - (summary?.completedTaskCount ?? 0) - (summary?.inProgressTaskCount ?? 0) - (summary?.blockedTaskCount ?? 0), 0)}</dd>
            </div>
            <div>
              <dt>进行中</dt>
              <dd>{summary?.inProgressTaskCount ?? 0}</dd>
            </div>
            <div>
              <dt>阻塞</dt>
              <dd>{summary?.blockedTaskCount ?? 0}</dd>
            </div>
            <div>
              <dt>完成</dt>
              <dd>{summary?.completedTaskCount ?? 0}</dd>
            </div>
          </dl>
        </article>
      </div>

      <div className="grid grid-2">
        <article className="card">
          <h3>可选媒体输入</h3>
          <dl className="metrics-list">
            <div>
              <dt>音频 Beta</dt>
              <dd>{summary?.mobileAudio.enabled ? "已开启" : "未开启"}</dd>
            </div>
            <div>
              <dt>最近音频</dt>
              <dd>{summary?.mobileAudio.latestEmotionAssessment?.emotionLabel ? formatEmotionLabel(summary.mobileAudio.latestEmotionAssessment.emotionLabel) : "—"}</dd>
            </div>
            <div>
              <dt>最近视频专注</dt>
              <dd>{summary?.latestVideoAssessment?.focusScore ?? "—"}</dd>
            </div>
            <div>
              <dt>最近视频疲劳</dt>
              <dd>{summary?.latestVideoAssessment?.fatigueScore ?? "—"}</dd>
            </div>
          </dl>
          <p className="muted">
            音频 / 视频仍是可选模块，处理发生在远端 OpenClaw Cluster，不在工作设备本地完成。
          </p>
        </article>

        <article className="card">
          <h3>健康桥接</h3>
          {summary?.latestHealthSnapshot ? (
            <>
              <p>{summary.latestHealthSnapshot.summary ?? "已收到最新健康桥接快照。"}</p>
              <p className="muted">
                {summary.latestHealthSnapshot.sourceProvider} · 睡眠 {summary.latestHealthSnapshot.sleepMinutes ?? "—"} 分钟 ·
                血氧 {summary.latestHealthSnapshot.oxygenSaturation ?? "—"}
              </p>
            </>
          ) : (
            <p className="muted">暂时还没有 Health Connect / HealthKit 快照。</p>
          )}
        </article>
      </div>

      <div className="grid grid-2">
        <article className="card">
          <h3>设备</h3>
          <ul className="list">
            {summary?.edgeDevices.map((device) => (
              <li key={device.id}>
                <strong>{device.label}</strong>
                <span className="muted">
                  {formatPlatform(device.platform)} · {formatOnlineStatus(device.status)} · {device.capabilities.map(formatCapability).join("、")}
                </span>
              </li>
            ))}
            {summary?.edgeDevices.length === 0 ? <li className="muted">暂时还没有已注册边缘设备。</li> : null}
          </ul>
        </article>

        <article className="card">
          <h3>客户端收件箱</h3>
          <ul className="list">
            {pendingInbox.map((message) => (
              <li key={message.id}>
                <strong>{message.title}</strong>
                <span className="muted">
                  {formatNotificationChannel(message.channel)} · {formatMessageStatus(message.status)}
                </span>
              </li>
            ))}
            {pendingInbox.length === 0 ? <li className="muted">当前没有待处理客户端消息。</li> : null}
          </ul>
        </article>
      </div>

      <div className="grid grid-2">
        <article className="card">
          <h3>最新恢复计划</h3>
          {summary?.latestRecoveryPlan ? (
            <>
              <p>{summary.latestRecoveryPlan.nextStep}</p>
              <p className="muted">建议时长：{summary.latestRecoveryPlan.suggestedMinutes} 分钟</p>
              <Link className="button-secondary" to="/recovery">
                打开恢复页
              </Link>
            </>
          ) : (
            <div className="stack">
              <p className="muted">暂时还没有恢复计划。</p>
              <Link className="button-secondary" to="/recovery">
                打开恢复页
              </Link>
            </div>
          )}
        </article>

        <article className="card">
          <h3>目标</h3>
          <ul className="list">
            {summary?.goals.map((goal) => (
              <li key={goal.id}>
                <strong>{goal.title}</strong>
                <span className="muted">
                  已完成 {goal.taskSummary.completed}/{goal.taskSummary.total} 个任务
                </span>
              </li>
            ))}
            {summary?.goals.length === 0 ? <li className="muted">先去 GoalFlow 创建一个目标。</li> : null}
          </ul>
        </article>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="card metric-card">
      <p className="muted">{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function WorkspaceShortcut({
  title,
  description,
  to,
  actionLabel,
}: {
  title: string;
  description: string;
  to: string;
  actionLabel: string;
}) {
  return (
    <article className="message-card">
      <div className="stack">
        <div>
          <strong>{title}</strong>
          <p className="muted">{description}</p>
        </div>
        <Link className="button-secondary" to={to}>
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}
