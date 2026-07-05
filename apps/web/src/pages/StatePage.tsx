import { useEffect, useState, type ReactNode } from "react";
import type { StateTrendsResponse } from "@mindanchor/domain";
import { api } from "../api";
import { formatCallDirection, formatCallStatus, formatEmotionLabel, formatNotificationChannel, formatRiskLevel } from "../labels";

export function StatePage() {
  const [trends, setTrends] = useState<StateTrendsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setTrends(await api.getStateTrends({ limit: 20 }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载状态趋势失败");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">状态</p>
          <h2>多模态状态趋势</h2>
        </div>
        <button className="button-secondary" onClick={() => void load()}>
          刷新
        </button>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="grid grid-3">
        <MetricCard label="评估次数" value={trends?.metricCounts.assessments ?? 0} />
        <MetricCard label="行为结论" value={trends?.metricCounts.behaviorConclusions ?? 0} />
        <MetricCard label="健康 / 媒体输入" value={(trends?.metricCounts.healthSnapshots ?? 0) + (trends?.metricCounts.videoAssessments ?? 0) + (trends?.metricCounts.emotionAssessments ?? 0)} />
      </div>

      <div className="grid grid-2">
        <article className="card">
          <h3>当前评估</h3>
          {trends?.currentAssessment ? (
            <>
              <p>{trends.currentAssessment.summary}</p>
              <dl className="metrics-list">
                <div>
                  <dt>专注</dt>
                  <dd>{trends.currentAssessment.focusScore}</dd>
                </div>
                <div>
                  <dt>能量</dt>
                  <dd>{trends.currentAssessment.energyScore}</dd>
                </div>
                <div>
                  <dt>情绪</dt>
                  <dd>{trends.currentAssessment.moodScore}</dd>
                </div>
                <div>
                  <dt>疲劳</dt>
                  <dd>{trends.currentAssessment.fatigueScore ?? "—"}</dd>
                </div>
              </dl>
              {trends.activeInputs.length > 0 ? <p className="muted">当前输入：{trends.activeInputs.join(" · ")}</p> : null}
              {trends.currentAssessment.emotionSummary ? (
                <p className="muted">
                  音频：{trends.currentAssessment.emotionSummary} · 置信度 {trends.currentAssessment.emotionConfidence?.toFixed(2) ?? "—"}
                </p>
              ) : null}
              {trends.currentAssessment.videoSummary ? <p className="muted">视频：{trends.currentAssessment.videoSummary}</p> : null}
              {trends.currentAssessment.healthSummary ? <p className="muted">健康：{trends.currentAssessment.healthSummary}</p> : null}
            </>
          ) : (
            <p className="muted">暂时还没有状态评估。</p>
          )}
          {trends?.latestIntervention ? <p className="warning-banner">{trends.latestIntervention.copy}</p> : null}
        </article>

        <article className="card">
          <h3>最新行为结论</h3>
          {trends?.latestBehaviorConclusion ? (
            <>
              <p>{trends.latestBehaviorConclusion.summary}</p>
              <p className="muted">
                {formatRiskLevel(trends.latestBehaviorConclusion.riskLevel)} · 通道 {formatNotificationChannel(trends.latestBehaviorConclusion.recommendedChannel)}
              </p>
              <p>{trends.latestBehaviorConclusion.suggestedAction}</p>
            </>
          ) : (
            <p className="muted">暂时还没有行为结论。</p>
          )}
        </article>
      </div>

      <div className="grid grid-2">
        <TrendListCard
          title="评估历史"
          emptyText="暂时还没有评估历史。"
          items={trends?.assessments ?? []}
          renderItem={(assessment) => (
            <div>
              <strong>{new Date(assessment.createdAt).toLocaleString()}</strong>
              <span className="muted">
                专注 {assessment.focusScore} · 能量 {assessment.energyScore} · 情绪 {assessment.moodScore}
              </span>
            </div>
          )}
        />

        <TrendListCard
          title="音频情绪趋势"
          emptyText="暂时还没有音频情绪数据。"
          items={trends?.emotionAssessments ?? []}
          renderItem={(assessment) => (
            <>
              <div>
                <strong>{formatEmotionLabel(assessment.emotionLabel)}</strong>
                <span className="muted">
                  压力 {assessment.stressScore} · {new Date(assessment.createdAt).toLocaleString()}
                </span>
              </div>
              <span className="pill">audio_server_inference</span>
            </>
          )}
        />
      </div>

      <div className="grid grid-2">
        <TrendListCard
          title="视频疲劳 / 专注趋势"
          emptyText="暂时还没有视频评估。"
          items={trends?.videoAssessments ?? []}
          renderItem={(assessment) => (
            <>
              <div>
                <strong>专注 {assessment.focusScore}</strong>
                <span className="muted">
                  疲劳 {assessment.fatigueScore} · {new Date(assessment.createdAt).toLocaleString()}
                </span>
              </div>
              <span className="pill">video_server_inference</span>
            </>
          )}
        />

        <TrendListCard
          title="健康桥接趋势"
          emptyText="暂时还没有健康快照。"
          items={trends?.healthSnapshots ?? []}
          renderItem={(snapshot) => (
            <>
              <div>
                <strong>{snapshot.sourceProvider}</strong>
                <span className="muted">
                  睡眠 {snapshot.sleepMinutes ?? "—"} 分钟 · 血氧 {snapshot.oxygenSaturation ?? "—"}
                </span>
              </div>
              <span className="pill">health_bridge</span>
            </>
          )}
        />
      </div>

      <div className="grid grid-2">
        <TrendListCard
          title="行为结论"
          emptyText="暂时还没有行为结论。"
          items={trends?.behaviorConclusions ?? []}
          renderItem={(conclusion) => (
            <div>
              <strong>{formatRiskLevel(conclusion.riskLevel)}</strong>
              <span className="muted">
                {formatNotificationChannel(conclusion.recommendedChannel)} · {new Date(conclusion.createdAt).toLocaleString()}
              </span>
            </div>
          )}
        />

        <TrendListCard
          title="通话事件"
          emptyText="暂时还没有通话事件。"
          items={trends?.callEvents ?? []}
          renderItem={(event) => (
            <>
              <div>
                <strong>{formatCallStatus(event.status)}</strong>
                <span className="muted">
                  {formatCallDirection(event.direction)} · {new Date(event.occurredAt).toLocaleString()}
                </span>
              </div>
              <span className="pill">mobile_event</span>
            </>
          )}
        />
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

function TrendListCard<T>({
  title,
  items,
  emptyText,
  renderItem,
}: {
  title: string;
  items: T[];
  emptyText: string;
  renderItem: (item: T) => ReactNode;
}) {
  return (
    <article className="card">
      <h3>{title}</h3>
      <ul className="list">
        {items.map((item, index) => (
          <li key={index}>{renderItem(item)}</li>
        ))}
        {items.length === 0 ? <li className="muted">{emptyText}</li> : null}
      </ul>
    </article>
  );
}
