import { useEffect, useMemo, useState } from "react";
import type { ClientInboxMessage, ClientInboxOverviewResponse } from "@mindanchor/domain";
import { api } from "../api";
import { formatMessageStatus, formatNotificationChannel, formatRiskLevel } from "../labels";

export function InboxPage() {
  const [overview, setOverview] = useState<ClientInboxOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyMessageId, setBusyMessageId] = useState<string | null>(null);
  const [busyBulk, setBusyBulk] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setOverview(await api.getClientInboxOverview({ limit: 50 }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载收件箱失败");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const messages = overview?.messages ?? [];
  const pendingMessages = useMemo(() => overview?.pendingMessages ?? [], [overview]);
  const acknowledgedMessages = useMemo(() => overview?.acknowledgedMessages ?? [], [overview]);

  const onAcknowledge = async (messageId: string) => {
    try {
      setBusyMessageId(messageId);
      setError(null);
      await api.ackClientInbox(messageId);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "确认消息失败");
    } finally {
      setBusyMessageId(null);
    }
  };

  const onAcknowledgeAll = async () => {
    try {
      setBusyBulk(true);
      setError(null);
      await Promise.all(pendingMessages.map((message) => api.ackClientInbox(message.id)));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "批量确认待处理消息失败");
    } finally {
      setBusyBulk(false);
    }
  };

  if (!overview && !error) {
    return (
      <section className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">收件箱</p>
            <h2>提醒与行为结论</h2>
          </div>
        </div>
        <article className="card">
          <h3>正在加载收件箱…</h3>
          <p className="muted">正在拉取待处理提醒、恢复上下文和行为结论。</p>
        </article>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">收件箱</p>
          <h2>提醒与行为结论</h2>
        </div>
        <div className="inline-actions">
          <button className="button-secondary" onClick={() => void load()}>
            刷新
          </button>
          <button className="button-primary" onClick={() => void onAcknowledgeAll()} disabled={pendingMessages.length === 0 || busyBulk}>
            {busyBulk ? "确认中..." : "确认全部待处理"}
          </button>
        </div>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="grid grid-3">
        <MetricCard label="消息总数" value={overview?.metricCounts.totalMessages ?? messages.length} />
        <MetricCard label="待处理" value={overview?.metricCounts.pendingMessages ?? pendingMessages.length} />
        <MetricCard label="已确认" value={overview?.metricCounts.acknowledgedMessages ?? acknowledgedMessages.length} />
      </div>

      <div className="grid grid-2">
        <article className="card">
          <h3>最新行为结论</h3>
          {overview?.latestBehaviorConclusion ? (
            <>
              <p>{overview.latestBehaviorConclusion.summary}</p>
              <p className="muted">
                {formatRiskLevel(overview.latestBehaviorConclusion.riskLevel)} · 通道 {formatNotificationChannel(overview.latestBehaviorConclusion.recommendedChannel)}
              </p>
              <p>{overview.latestBehaviorConclusion.suggestedAction}</p>
            </>
          ) : (
            <p className="muted">暂时还没有行为结论。</p>
          )}
          {overview?.latestRecoveryPlan ? (
            <div className="recovery-plan">
              <h4>最近恢复上下文</h4>
              <p>{overview.latestRecoveryPlan.nextStep}</p>
              <p className="muted">建议时长：{overview.latestRecoveryPlan.suggestedMinutes} 分钟</p>
            </div>
          ) : null}
        </article>

        <article className="card">
          <h3>通道分布</h3>
          <ul className="list">
            {(overview?.channelCounts ?? []).map((item) => (
              <li key={item.channel}>
                <div>
                  <strong>{formatNotificationChannel(item.channel)}</strong>
                  <span className="muted">
                    待处理 {item.pending} · 已确认 {item.acknowledged}
                  </span>
                </div>
                <span className="pill">总计 {item.total}</span>
              </li>
            ))}
            {(overview?.channelCounts ?? []).length === 0 ? <li className="muted">暂时还没有通道活动。</li> : null}
          </ul>
          {overview?.activeSession ? (
            <p className="muted">当前会话开始于 {new Date(overview.activeSession.startedAt).toLocaleString()}</p>
          ) : (
            <p className="muted">当前没有进行中的专注会话。</p>
          )}
        </article>
      </div>

      <div className="grid grid-2">
        <article className="card">
          <div className="inline-header">
            <h3>待处理队列</h3>
            <span className="pill">{pendingMessages.length} 条待处理</span>
          </div>
          <div className="stack">
            {pendingMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                actionLabel={busyMessageId === message.id ? "保存中..." : "确认"}
                disabled={busyMessageId === message.id || busyBulk}
                onAction={() => void onAcknowledge(message.id)}
              />
            ))}
            {pendingMessages.length === 0 ? <p className="muted">当前没有待处理提醒。</p> : null}
          </div>
        </article>

        <article className="card">
          <div className="inline-header">
            <h3>已确认</h3>
            <span className="pill">{acknowledgedMessages.length} 条归档</span>
          </div>
          <div className="stack">
            {acknowledgedMessages.map((message) => <MessageCard key={message.id} message={message} disabled actionLabel="已确认" />)}
            {acknowledgedMessages.length === 0 ? <p className="muted">暂时还没有已确认提醒。</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="card metric-card">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function MessageCard({
  message,
  actionLabel,
  disabled,
  onAction,
}: {
  message: ClientInboxMessage;
  actionLabel: string;
  disabled: boolean;
  onAction?: () => void;
}) {
  return (
    <article className="message-card">
      <div className="inline-header">
        <div>
          <strong>{message.title}</strong>
          <div className="detail-row">
            <span className={`status-pill ${message.status === "pending" ? "status-blocked" : "status-done"}`}>{formatMessageStatus(message.status)}</span>
            <span className="muted">
              {formatNotificationChannel(message.channel)} · {new Date(message.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        <button className="button-secondary" disabled={disabled || !onAction} onClick={onAction}>
          {actionLabel}
        </button>
      </div>
      <p className="message-body">{message.message}</p>
      {message.acknowledgedAt ? <p className="muted">确认于 {new Date(message.acknowledgedAt).toLocaleString()}</p> : null}
    </article>
  );
}
