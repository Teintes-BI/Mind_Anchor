import type { DecisionOption } from "@mindanchor/domain";

const riskLabels: Record<DecisionOption["riskLevel"], string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  critical: "关键风险",
};

const reversibilityLabels: Record<DecisionOption["reversibility"], string> = {
  reversible: "可逆",
  partly_reversible: "部分可逆",
  hard_to_reverse: "难以撤销",
};

const horizonLabels: Record<DecisionOption["projectedConsequences"][number]["horizon"], string> = {
  today: "今天",
  week: "本周",
  month: "本月",
  long_term: "长期",
};

export function WayfinderOptionCard({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: DecisionOption;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={`card wayfinder-option-card${selected ? " wayfinder-option-card-selected" : ""}`} data-testid={`wayfinder-option-${option.id}`}>
      <div className="inline-header wayfinder-option-header">
        <div>
          <p className="eyebrow">行动选项</p>
          <h3>{option.action}</h3>
        </div>
        <div className="detail-row">
          <span className={`status-pill status-${option.riskLevel}`}>{riskLabels[option.riskLevel]}</span>
          <span className="pill">{reversibilityLabels[option.reversibility]}</span>
        </div>
      </div>

      <div className="wayfinder-first-step">
        <span className="muted">现在第一步</span>
        <strong>{option.firstStep}</strong>
      </div>
      <p className="long-text">{option.rationale}</p>

      <div className="grid grid-2 wayfinder-option-details">
        <DetailList title="即时收益" items={option.immediateBenefits} emptyLabel="未记录明确收益" />
        <DetailList title="即时成本" items={option.costs} emptyLabel="暂未识别成本" />
      </div>

      <div className="compare-pane">
        <strong>可能影响</strong>
        <ul className="list compact-list">
          {option.projectedConsequences.map((consequence) => (
            <li key={`${consequence.horizon}-${consequence.text}`} className="wayfinder-consequence">
              <span className="pill">{horizonLabels[consequence.horizon]}</span>
              <span className="long-text">{consequence.text}</span>
              <span className="muted">置信度 {Math.round(consequence.confidence * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="stack wayfinder-option-meta">
        <div>
          <span className="muted">价值对齐</span>
          <ul className="list compact-list">
            {option.valueAlignment.map((alignment) => (
              <li key={`${alignment.valueId}-${alignment.effect}`}>
                <span>{alignment.valueId}</span>
                <span className="muted">{alignment.explanation}</span>
              </li>
            ))}
            {option.valueAlignment.length === 0 ? <li className="muted">暂无价值对齐信息。</li> : null}
          </ul>
        </div>
        <div className="detail-row">
          <span className="muted">证据：{option.evidenceRefs.join("、")}</span>
          {option.consultedSkills.length > 0 ? <span className="muted">视角：{option.consultedSkills.join("、")}</span> : null}
        </div>
      </div>

      {option.requiresApproval ? (
        <p className="warning-banner" role="status">
          这个选项需要用户确认后才能记录，不会自动执行任何外部动作。
        </p>
      ) : null}

      <div className="card-actions">
        <button className={selected ? "button-secondary" : "button-primary"} onClick={onSelect} disabled={disabled}>
          {selected ? "已选择" : "选择这个方案"}
        </button>
      </div>
    </article>
  );
}

function DetailList({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div>
      <strong>{title}</strong>
      <ul className="list compact-list">
        {items.map((item) => (
          <li key={item} className="long-text">
            {item}
          </li>
        ))}
        {items.length === 0 ? <li className="muted">{emptyLabel}</li> : null}
      </ul>
    </div>
  );
}
