import { useEffect, useMemo, useState } from "react";
import type { DecisionOption, WayfinderOutcome } from "@mindanchor/domain";
import { Link } from "react-router-dom";
import { api, type WayfinderHistoryItem } from "../api";

const riskLabels: Record<NonNullable<WayfinderHistoryItem["situation"]>["riskLevel"], string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  critical: "关键风险",
};

const actionLabels: Record<WayfinderHistoryItem["decision"]["actionStatus"], string> = {
  not_started: "尚未开始",
  in_progress: "进行中",
  completed: "已完成",
  abandoned: "已放弃",
};

export function DecisionLedgerPage() {
  const [entries, setEntries] = useState<WayfinderHistoryItem[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [goalFilter, setGoalFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportPreview, setExportPreview] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setEntries((await api.listWayfinderHistory({ limit: 100 })).decisions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载选择账本失败");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const risk = entry.situation?.riskLevel ?? "low";
        const goals = entry.situation?.linkedGoalIds ?? [];
        const matchesDate = !dateFilter || entry.decision.selectedAt.startsWith(dateFilter);
        const matchesGoal = !goalFilter || goals.some((goal) => goal.toLowerCase().includes(goalFilter.toLowerCase()));
        const matchesRisk = !riskFilter || risk === riskFilter;
        return matchesDate && matchesGoal && matchesRisk;
      }),
    [dateFilter, entries, goalFilter, riskFilter],
  );

  const exportData = async () => {
    try {
      setError(null);
      setExportPreview(JSON.stringify(await api.exportWayfinderData(), null, 2));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "导出数据失败");
    }
  };

  const saveOutcome = async (decisionId: string, payload: Parameters<typeof api.recordWayfinderOutcome>[1]) => {
    try {
      setBusy(true);
      setError(null);
      await api.recordWayfinderOutcome(decisionId, payload);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存结果失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Wayfinder</p>
          <h2>选择账本</h2>
          <p className="muted">对照当时的预测与实际结果，修正下一次选择，而不是追求服从率。</p>
        </div>
        <div className="inline-actions">
          <Link className="button-secondary" to="/wayfinder">新建情境</Link>
          <button className="button-secondary" onClick={() => void load()}>刷新</button>
          <button className="button-primary" onClick={() => void exportData()}>导出 JSON</button>
        </div>
      </div>

      {error ? <p className="error-banner" role="alert">{error}</p> : null}

      <article className="card ledger-filters">
        <div>
          <label htmlFor="ledger-date">日期筛选</label>
          <input id="ledger-date" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
        </div>
        <div>
          <label htmlFor="ledger-goal">目标筛选</label>
          <input id="ledger-goal" value={goalFilter} onChange={(event) => setGoalFilter(event.target.value)} placeholder="输入目标 ID" />
        </div>
        <div>
          <label htmlFor="ledger-risk">风险筛选</label>
          <select id="ledger-risk" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
            <option value="">全部风险</option>
            <option value="low">低风险</option>
            <option value="medium">中风险</option>
            <option value="high">高风险</option>
            <option value="critical">关键风险</option>
          </select>
        </div>
        <div className="ledger-filter-summary">
          <span className="pill">显示 {filteredEntries.length} / {entries.length}</span>
          <Link className="muted" to="/wayfinder">管理采集同意</Link>
        </div>
      </article>

      {filteredEntries.length === 0 ? <article className="card"><p className="muted">当前筛选没有选择记录</p></article> : null}
      <div className="stack">
        {filteredEntries.map((entry) => (
          <LedgerEntry key={entry.decision.id} entry={entry} busy={busy} onSaveOutcome={saveOutcome} />
        ))}
      </div>

      {exportPreview ? (
        <article className="card">
          <div className="inline-header">
            <h3>导出完成</h3>
            <button className="button-secondary" onClick={() => setExportPreview(null)}>关闭</button>
          </div>
          <pre className="code-block" aria-label="导出内容">{exportPreview}</pre>
        </article>
      ) : null}
    </section>
  );
}

function LedgerEntry({
  entry,
  busy,
  onSaveOutcome,
}: {
  entry: WayfinderHistoryItem;
  busy: boolean;
  onSaveOutcome: (decisionId: string, payload: Parameters<typeof api.recordWayfinderOutcome>[1]) => Promise<void>;
}) {
  const [summary, setSummary] = useState("");
  const [feeling, setFeeling] = useState("");
  const [rating, setRating] = useState("");
  const [predictionError, setPredictionError] = useState("");
  const latestOutcome = entry.outcomes.at(-1) ?? null;
  const risk = entry.situation?.riskLevel ?? "low";

  const submit = async () => {
    if (!summary.trim()) return;
    const payload: Parameters<typeof api.recordWayfinderOutcome>[1] = {
      status: "observed",
      summary: summary.trim(),
      evidenceRefs: [],
      traceId: `ledger-${Date.now()}`,
    };
    if (feeling.trim()) payload.userFeeling = feeling.trim();
    if (predictionError.trim()) payload.predictionError = predictionError.trim();
    if (rating) payload.userRating = Number(rating) as 1 | 2 | 3 | 4 | 5;
    await onSaveOutcome(entry.decision.id, payload);
  };

  return (
    <article className="card ledger-entry" data-testid={`ledger-entry-${entry.decision.id}`}>
      <div className="inline-header">
        <div>
          <p className="eyebrow">{new Date(entry.decision.selectedAt).toLocaleString()}</p>
          <h3>{entry.situation?.summary ?? "未关联情境"}</h3>
        </div>
        <div className="detail-row">
          <span className={`status-pill status-${risk}`}>{riskLabels[risk]}</span>
          <span className="pill">{actionLabels[entry.decision.actionStatus]}</span>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="compare-pane">
          <strong>当时的选择</strong>
          <p>{entry.option?.action ?? "用户自定义处理"}</p>
          {entry.option ? <p className="muted">第一步：{entry.option.firstStep}</p> : null}
          {entry.option ? <ProjectedConsequences consequences={entry.option.projectedConsequences} /> : null}
        </div>
        <div className="compare-pane">
          <strong>实际结果</strong>
          {latestOutcome ? (
            <>
              <p>{latestOutcome.summary}</p>
              {latestOutcome.userFeeling ? <p className="muted">感受：{latestOutcome.userFeeling}</p> : null}
              {latestOutcome.userRating ? <p className="muted">帮助度：{latestOutcome.userRating} / 5</p> : null}
              {latestOutcome.predictionError ? <p className="muted">预测误差：{latestOutcome.predictionError}</p> : null}
            </>
          ) : (
            <p className="muted">尚未记录结果。</p>
          )}
        </div>
      </div>

      {!latestOutcome ? (
        <div className="ledger-outcome-form">
          <label htmlFor={`outcome-${entry.decision.id}`}>实际结果</label>
          <textarea id={`outcome-${entry.decision.id}`} aria-label="实际结果" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="发生了什么？" />
          <div className="grid grid-3">
            <div>
              <label htmlFor={`feeling-${entry.decision.id}`}>感受（可选）</label>
              <input id={`feeling-${entry.decision.id}`} value={feeling} onChange={(event) => setFeeling(event.target.value)} />
            </div>
            <div>
              <label htmlFor={`rating-${entry.decision.id}`}>帮助度（可选）</label>
              <select id={`rating-${entry.decision.id}`} value={rating} onChange={(event) => setRating(event.target.value)}>
                <option value="">未评分</option>
                {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`prediction-${entry.decision.id}`}>预测不准确原因（可选）</label>
              <input id={`prediction-${entry.decision.id}`} value={predictionError} onChange={(event) => setPredictionError(event.target.value)} />
            </div>
          </div>
          <button className="button-primary" onClick={() => void submit()} disabled={busy || !summary.trim()}>
            {busy ? "保存中..." : "保存结果"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ProjectedConsequences({ consequences }: { consequences: DecisionOption["projectedConsequences"] }) {
  return (
    <ul className="list compact-list">
      {consequences.map((consequence) => (
        <li key={`${consequence.horizon}-${consequence.text}`}>
          <span>{consequence.text}</span>
          <span className="muted">预测置信度 {Math.round(consequence.confidence * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}
