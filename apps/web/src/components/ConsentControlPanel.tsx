import type { ConsentGrant } from "@mindanchor/domain";

const statusLabels: Record<ConsentGrant["status"], string> = {
  granted: "已授权",
  paused: "已暂停",
  revoked: "已撤回",
};

export function ConsentControlPanel({
  grants,
  busySource,
  onUpdate,
  onExport,
  onGrantManual,
}: {
  grants: ConsentGrant[];
  busySource?: string | null;
  onUpdate: (grant: ConsentGrant, status: ConsentGrant["status"]) => void;
  onExport?: () => void;
  onGrantManual?: () => void;
}) {
  return (
    <article className="card consent-panel">
      <div className="inline-header">
        <div>
          <h3>采集与同意</h3>
          <p className="muted">每个数据源独立控制；撤回后不会再接收新的情境事件。</p>
        </div>
        {onExport ? (
          <button className="button-secondary" onClick={onExport}>
            导出数据
          </button>
        ) : null}
      </div>

      <div className="stack">
        {grants.map((grant) => {
          const busy = busySource === grant.source;
          return (
            <div className="message-card consent-row" key={grant.id}>
              <div className="inline-header">
                <div>
                  <strong>{grant.source}</strong>
                  <p className="muted">
                    {grant.scope} · 原始数据保留 {grant.rawRetentionSeconds} 秒 · 摘要保留 {grant.derivedRetentionDays} 天
                  </p>
                </div>
                <span className={`status-pill consent-${grant.status}`}>{statusLabels[grant.status]}</span>
              </div>
              <div className="card-actions">
                {grant.status === "granted" ? (
                  <button className="button-secondary" disabled={busy} onClick={() => onUpdate(grant, "paused")}>
                    {busy ? "保存中..." : "暂停"}
                  </button>
                ) : null}
                {grant.status === "paused" ? (
                  <button className="button-primary" disabled={busy} onClick={() => onUpdate(grant, "granted")}>
                    {busy ? "保存中..." : "恢复"}
                  </button>
                ) : null}
                {grant.status !== "revoked" ? (
                  <button className="button-secondary" disabled={busy} onClick={() => onUpdate(grant, "revoked")}>
                    撤回
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
        {grants.length === 0 ? (
          <div className="empty-state-actions">
            <p className="muted">还没有授权的数据源。只授权手动输入即可开始，不会打开持续录音。</p>
            {onGrantManual ? (
              <button className="button-primary" onClick={onGrantManual} disabled={busySource === "phone"}>
                {busySource === "phone" ? "授权中..." : "授权手动输入"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
