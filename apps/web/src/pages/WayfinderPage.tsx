import { useEffect, useMemo, useState } from "react";
import type { ConsentGrant, DecisionOption, DecisionRecord, Situation, WayfinderOutcome } from "@mindanchor/domain";
import { api, type WayfinderEventInput } from "../api";
import { ConsentControlPanel } from "../components/ConsentControlPanel";
import { WayfinderOptionCard } from "../components/WayfinderOptionCard";

const situationStatusLabels: Record<Situation["status"], string> = {
  draft: "草稿",
  awaiting_confirmation: "待确认",
  confirmed: "已确认",
  dismissed: "已忽略",
  expired: "已过期",
};

const decisionStatusLabels: Record<DecisionRecord["actionStatus"], string> = {
  not_started: "尚未开始",
  in_progress: "进行中",
  completed: "已完成",
  abandoned: "已放弃",
};

function traceId() {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `wayfinder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nowWithOffset() {
  return new Date().toISOString();
}

export function WayfinderPage() {
  const [grants, setGrants] = useState<ConsentGrant[]>([]);
  const [consentLoading, setConsentLoading] = useState(true);
  const [busySource, setBusySource] = useState<string | null>(null);
  const [contextText, setContextText] = useState("");
  const [situation, setSituation] = useState<Situation | null>(null);
  const [options, setOptions] = useState<DecisionOption[]>([]);
  const [optionsFullStatus, setOptionsFullStatus] = useState<"pending" | "completed" | "failed">("pending");
  const [selectedOption, setSelectedOption] = useState<DecisionOption | null>(null);
  const [approvalAcknowledged, setApprovalAcknowledged] = useState(false);
  const [decision, setDecision] = useState<DecisionRecord | null>(null);
  const [outcome, setOutcome] = useState<WayfinderOutcome | null>(null);
  const [outcomeSummary, setOutcomeSummary] = useState("");
  const [outcomeFeeling, setOutcomeFeeling] = useState("");
  const [outcomeRating, setOutcomeRating] = useState("");
  const [predictionError, setPredictionError] = useState("");
  const [fastStatus, setFastStatus] = useState<"completed" | "pending" | "failed">("completed");
  const [fullStatus, setFullStatus] = useState<"pending" | "completed" | "failed" | "cancelled">("pending");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportPreview, setExportPreview] = useState<string | null>(null);

  const grantedContext = useMemo(
    () => grants.find((grant) => grant.status === "granted" && grant.purpose === "wayfinder_context") ?? grants.find((grant) => grant.status === "granted"),
    [grants],
  );

  const loadConsent = async () => {
    try {
      setError(null);
      setConsentLoading(true);
      setGrants((await api.getWayfinderConsent()).grants);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "加载同意设置失败");
    } finally {
      setConsentLoading(false);
    }
  };

  useEffect(() => {
    void loadConsent();
  }, []);

  const loadOptions = async (situationId: string) => {
    try {
      setError(null);
      setOptionsFullStatus("pending");
      const response = await api.listWayfinderOptions(situationId);
      setOptions(response.options);
      setOptionsFullStatus(response.options.length > 0 ? "completed" : response.fullStatus);
    } catch (cause) {
      setOptions([]);
      setOptionsFullStatus("failed");
      setError(cause instanceof Error ? cause.message : "加载选项失败");
    }
  };

  const createSituation = async () => {
    const text = contextText.trim();
    if (!text) {
      setError("先写下需要处理的情境。");
      return;
    }
    if (!grantedContext) {
      setError("没有已授权的数据源，无法记录情境。");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      setDecision(null);
      setOutcome(null);
      setSelectedOption(null);
      const payload: WayfinderEventInput = {
        sourceDeviceId: "web-manual",
        kind: "manual_note",
        occurredAt: nowWithOffset(),
        clientEventId: traceId(),
        payload: { text },
        confidence: 1,
        consentRef: grantedContext.id,
        retentionClass: "summary",
        evidenceRefs: [],
        traceId: traceId(),
      };
      const response = await api.createWayfinderEvent(payload);
      setSituation(response.situation);
      setFastStatus(response.fastStatus);
      setFullStatus(response.fullStatus);
      setOptions([]);
      setOptionsFullStatus("pending");
    } catch (cause) {
      setFastStatus("failed");
      setFullStatus("failed");
      setError(cause instanceof Error ? cause.message : "创建情境失败");
    } finally {
      setBusy(false);
    }
  };

  const confirmSituation = async (status: "confirmed" | "dismissed") => {
    if (!situation) return;
    try {
      setBusy(true);
      setError(null);
      const response = await api.confirmWayfinderSituation(situation.id, { status, traceId: traceId() });
      setSituation(response.situation);
      setFullStatus(response.fullStatus);
      setSelectedOption(null);
      setDecision(null);
      setOutcome(null);
      if (status === "confirmed") {
        await loadOptions(situation.id);
      } else {
        setOptions([]);
        setOptionsFullStatus("completed");
      }
    } catch (cause) {
      setFullStatus("failed");
      setError(cause instanceof Error ? cause.message : "更新情境状态失败");
    } finally {
      setBusy(false);
    }
  };

  const recordDecision = async () => {
    if (!situation || !selectedOption) return;
    const requiresApproval = selectedOption.requiresApproval || selectedOption.riskLevel === "high" || selectedOption.riskLevel === "critical";
    if (requiresApproval && !approvalAcknowledged) {
      setError("这个高风险选项需要先完成明确确认。");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const saved = await api.recordWayfinderDecision({
        situationId: situation.id,
        selectedOptionId: selectedOption.id,
        actionStatus: "not_started",
        traceId: traceId(),
        approvalAcknowledged: requiresApproval,
      });
      setDecision(saved);
      setSelectedOption(null);
      setApprovalAcknowledged(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "记录选择失败");
    } finally {
      setBusy(false);
    }
  };

  const recordOutcome = async () => {
    if (!decision || !outcomeSummary.trim()) {
      setError("请先写下实际结果。");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      const payload: Parameters<typeof api.recordWayfinderOutcome>[1] = {
        status: "observed",
        summary: outcomeSummary.trim(),
        evidenceRefs: [],
        traceId: traceId(),
      };
      if (outcomeFeeling.trim()) payload.userFeeling = outcomeFeeling.trim();
      if (predictionError.trim()) payload.predictionError = predictionError.trim();
      if (outcomeRating) payload.userRating = Number(outcomeRating) as 1 | 2 | 3 | 4 | 5;
      setOutcome(await api.recordWayfinderOutcome(decision.id, payload));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "记录结果失败");
    } finally {
      setBusy(false);
    }
  };

  const updateConsent = async (grant: ConsentGrant, status: ConsentGrant["status"]) => {
    try {
      setBusySource(grant.source);
      setError(null);
      const updated = await api.updateWayfinderConsent(grant.source, {
        purpose: grant.purpose,
        scope: grant.scope,
        status,
        rawRetentionSeconds: grant.rawRetentionSeconds,
        derivedRetentionDays: grant.derivedRetentionDays,
        modelSharing: grant.modelSharing,
      });
      setGrants((current) => current.map((item) => (item.source === updated.source ? updated : item)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "更新同意设置失败");
    } finally {
      setBusySource(null);
    }
  };

  const grantManualContext = async () => {
    try {
      setBusySource("phone");
      setError(null);
      const updated = await api.updateWayfinderConsent("phone", {
        purpose: "wayfinder_context",
        scope: "manual_notes",
        status: "granted",
        rawRetentionSeconds: 0,
        derivedRetentionDays: 30,
        modelSharing: "local_only",
      });
      setGrants((current) => [...current.filter((grant) => grant.source !== updated.source), updated]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "授权手动输入失败");
    } finally {
      setBusySource(null);
    }
  };

  const exportData = async () => {
    try {
      setError(null);
      setExportPreview(JSON.stringify(await api.exportWayfinderData(), null, 2));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "导出数据失败");
    }
  };

  if (consentLoading) {
    return (
      <section className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Wayfinder</p>
            <h2>选择账本</h2>
          </div>
        </div>
        <article className="card" aria-label="加载状态">
          <h3>正在加载同意设置…</h3>
          <p className="muted">先确认哪些数据源可以参与情境识别。</p>
        </article>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Wayfinder</p>
          <h2>把模糊时刻变成可复盘的选择</h2>
          <p className="muted">系统只提供可解释的选项，最后的选择和外部行动始终由你确认。</p>
        </div>
        <button className="button-secondary" onClick={() => void loadConsent()}>
          刷新权限
        </button>
      </div>

      {error ? <p className="error-banner" role="alert">{error}</p> : null}

      <article className="card wayfinder-capture-card">
        <div>
          <h3>记录一个现在需要处理的情境</h3>
          <p className="muted">这是手动输入，不会自动录音，也不会把内容直接写入任务。</p>
        </div>
        <label htmlFor="wayfinder-context">情境描述</label>
        <textarea
          id="wayfinder-context"
          aria-label="情境描述"
          value={contextText}
          onChange={(event) => setContextText(event.target.value)}
          placeholder="例如：我答应下午给同事一个结果，但当前主线分析还没有完成。"
        />
        <div className="inline-actions">
          <span className={`status-pill ${grantedContext ? "status-done" : "status-blocked"}`}>
            {grantedContext ? `输入授权：${grantedContext.source}` : "没有可用输入授权"}
          </span>
          <button className="button-primary" onClick={() => void createSituation()} disabled={busy || !grantedContext}>
            {busy && !situation ? "创建中..." : "创建情境"}
          </button>
        </div>
      </article>

      {situation ? (
        <article className="card wayfinder-situation-card">
          <div className="inline-header">
            <div>
              <p className="eyebrow">情境摘要</p>
              <h3>{situation.summary}</h3>
            </div>
            <span className={`status-pill status-${situation.status}`}>{situationStatusLabels[situation.status]}</span>
          </div>
          {situation.uncertainty.length > 0 ? (
            <div className="warning-banner">
              <strong>仍需留意的不确定性</strong>
              <ul className="compact-list">
                {situation.uncertainty.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ) : null}
          <div className="detail-row">
            <span className="pill">风险：{situation.riskLevel}</span>
            <span className="muted">trace {situation.traceId}</span>
          </div>
          {situation.status === "awaiting_confirmation" ? (
            <div className="card-actions">
              <button className="button-primary" onClick={() => void confirmSituation("confirmed")} disabled={busy}>
                确认这个情境
              </button>
              <button className="button-secondary" onClick={() => void confirmSituation("dismissed")} disabled={busy}>
                忽略
              </button>
            </div>
          ) : null}
          {situation.status === "dismissed" ? <p className="muted">这个候选已忽略，不会生成选项。</p> : null}
        </article>
      ) : null}

      {situation?.status === "confirmed" ? (
        <article className="card">
          <div className="inline-header">
            <div>
              <h3>可选行动</h3>
              <p className="muted">每张卡片都标出第一步、成本、后果、证据和可逆性。</p>
            </div>
            <button className="button-secondary" onClick={() => void loadOptions(situation.id)} disabled={busy}>
              刷新选项
            </button>
          </div>
          {optionsFullStatus === "pending" && options.length === 0 ? <p className="warning-banner">完整选项仍在生成，当前不使用假数据填充。</p> : null}
          {optionsFullStatus === "failed" ? <p className="error-banner">选项加载失败，请稍后重试。</p> : null}
          {optionsFullStatus === "completed" && options.length === 0 ? <p className="muted">当前没有可比较的选项。</p> : null}
          <div className="grid grid-3 wayfinder-options-grid">
            {options.map((option) => (
              <WayfinderOptionCard key={option.id} option={option} selected={selectedOption?.id === option.id} disabled={busy} onSelect={() => setSelectedOption(option)} />
            ))}
          </div>
        </article>
      ) : null}

      {selectedOption ? (
        <article className="card wayfinder-confirmation-card">
          <div>
            <p className="eyebrow">选择确认</p>
            <h3>{selectedOption.action}</h3>
            <p className="muted">第一步：{selectedOption.firstStep}</p>
          </div>
          {selectedOption.requiresApproval || selectedOption.riskLevel === "high" || selectedOption.riskLevel === "critical" ? (
            <label className="checkbox-row">
              <input type="checkbox" checked={approvalAcknowledged} onChange={(event) => setApprovalAcknowledged(event.target.checked)} />
              我确认这是一个需要我本人承担后果的高风险选择。
            </label>
          ) : null}
          <div className="card-actions">
            <button className="button-primary" onClick={() => void recordDecision()} disabled={busy}>
              {busy ? "记录中..." : "确认选择"}
            </button>
            <button className="button-secondary" onClick={() => setSelectedOption(null)} disabled={busy}>
              返回比较
            </button>
          </div>
        </article>
      ) : null}

      {decision ? (
        <article className="card wayfinder-outcome-card">
          <div className="inline-header">
            <div>
              <p className="eyebrow">选择已记录</p>
              <h3>下一步检查点</h3>
            </div>
            <span className="status-pill status-in_progress">{decisionStatusLabels[decision.actionStatus]}</span>
          </div>
          {outcome ? (
            <div className="success-banner">
              <strong>结果已记录</strong>
              <p>{outcome.summary}</p>
            </div>
          ) : (
            <>
              <label htmlFor="wayfinder-outcome">实际结果</label>
              <textarea id="wayfinder-outcome" aria-label="实际结果" value={outcomeSummary} onChange={(event) => setOutcomeSummary(event.target.value)} placeholder="发生了什么？" />
              <div className="grid grid-2">
                <div>
                  <label htmlFor="wayfinder-feeling">感受（可选）</label>
                  <input id="wayfinder-feeling" value={outcomeFeeling} onChange={(event) => setOutcomeFeeling(event.target.value)} placeholder="精力、关系或情绪如何？" />
                </div>
                <div>
                  <label htmlFor="wayfinder-rating">帮助度评分（可选）</label>
                  <select id="wayfinder-rating" value={outcomeRating} onChange={(event) => setOutcomeRating(event.target.value)}>
                    <option value="">未评分</option>
                    {[1, 2, 3, 4, 5].map((value) => <option value={value} key={value}>{value} / 5</option>)}
                  </select>
                </div>
              </div>
              <label htmlFor="wayfinder-prediction-error">预测不准确的原因（可选）</label>
              <input id="wayfinder-prediction-error" value={predictionError} onChange={(event) => setPredictionError(event.target.value)} placeholder="哪些信息当时缺失？" />
              <button className="button-primary" onClick={() => void recordOutcome()} disabled={busy}>
                {busy ? "保存中..." : "记录结果"}
              </button>
            </>
          )}
        </article>
      ) : null}

      <ConsentControlPanel
        grants={grants}
        busySource={busySource}
        onUpdate={(grant, status) => void updateConsent(grant, status)}
        onGrantManual={() => void grantManualContext()}
        onExport={() => void exportData()}
      />
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
