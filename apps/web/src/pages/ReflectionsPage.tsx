import { useEffect, useState } from "react";
import type { ReflectionOverviewResponse, ReflectionReport } from "@mindanchor/domain";
import { api } from "../api";

export function ReflectionsPage() {
  const [overview, setOverview] = useState<ReflectionOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setOverview(await api.getReflectionOverview({ limit: 12 }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载复盘总览失败");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const verificationChecks = [
    {
      label: "周报",
      passed: Boolean(overview?.latestWeekly),
      detail: overview?.latestWeekly ? "最近一份周报已生成。" : "周报暂时还没有生成。",
    },
    {
      label: "月报",
      passed: Boolean(overview?.latestMonthly),
      detail: overview?.latestMonthly ? "最近一份月报已生成。" : "月报暂时还没有生成。",
    },
    {
      label: "内容有效性",
      passed: Boolean(
        overview?.reports.some(
          (report) =>
            report.highlights.length > 0 ||
            report.blockers.length > 0 ||
            report.trends.length > 0 ||
            report.nextSuggestions.length > 0,
        ),
      ),
      detail:
        overview?.reports.some(
          (report) =>
            report.highlights.length > 0 ||
            report.blockers.length > 0 ||
            report.trends.length > 0 ||
            report.nextSuggestions.length > 0,
        )
          ? "至少有一份报告已经包含有业务含义的内容。"
          : "虽然已经有报告，但内容还显得太空。",
    },
  ];

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">复盘</p>
          <h2>周报与月报</h2>
        </div>
        <button className="button-secondary" onClick={() => void load()}>
          刷新
        </button>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="grid grid-3">
        <MetricCard label="报告数" value={overview?.metricCounts.reports ?? 0} />
        <MetricCard label="周报" value={overview?.metricCounts.weeklyReports ?? 0} />
        <MetricCard label="月报" value={overview?.metricCounts.monthlyReports ?? 0} />
      </div>

      <div className="grid grid-3">
        <MetricCard label="评估次数" value={overview?.metricCounts.assessments ?? 0} />
        <MetricCard label="会话数" value={overview?.metricCounts.sessions ?? 0} />
        <MetricCard
          label="媒体 / 健康输入"
          value={(overview?.metricCounts.emotionAssessments ?? 0) + (overview?.metricCounts.videoAssessments ?? 0) + (overview?.metricCounts.healthSnapshots ?? 0)}
        />
      </div>

      <article className="card">
        <div className="inline-header">
          <div>
            <h3>复盘验收</h3>
            <p className="muted">先看这里，快速判断周报 / 月报是否已经像一份真正可读的复盘报告。</p>
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
        <ReflectionCard title="最新周报" report={overview?.latestWeekly ?? null} />
        <ReflectionCard title="最新月报" report={overview?.latestMonthly ?? null} />
      </div>

      <div className="stack">
        {overview?.reports.map((report) => (
          <ReflectionCard key={report.id} title={report.periodType === "weekly" ? "周报" : "月报"} report={report} />
        ))}
        {overview?.reports.length === 0 ? <p className="muted">暂时还没有复盘报告。</p> : null}
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

function ReflectionCard({ title, report }: { title: string; report: ReflectionReport | null }) {
  return (
    <article className="card">
      <div className="inline-header">
        <h3>{title}</h3>
        {report ? (
          <span className="pill">
            {new Date(report.periodStart).toLocaleDateString()} → {new Date(report.periodEnd).toLocaleDateString()}
          </span>
        ) : null}
      </div>
      {report ? (
        <div className="grid grid-2">
          <ReportList title="亮点" items={report.highlights} />
          <ReportList title="阻碍" items={report.blockers} />
          <ReportList title="趋势" items={report.trends} />
          <ReportList title="下一步建议" items={report.nextSuggestions} />
        </div>
      ) : (
        <p className="muted">暂时还没有可用报告。</p>
      )}
    </article>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4>{title}</h4>
      <ul className="list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
        {items.length === 0 ? <li className="muted">暂无内容。</li> : null}
      </ul>
    </div>
  );
}
