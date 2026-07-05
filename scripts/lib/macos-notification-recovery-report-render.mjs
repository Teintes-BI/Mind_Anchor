import path from "node:path";

export function defaultOpenClawRegistryNotificationRecoveryHtmlReportPath(cwd = process.cwd()) {
  return path.resolve(cwd, "tmp", "mindanchor-openclaw-registry-notification-recovery-report.html");
}

export function renderOpenClawRegistryNotificationRecoveryHtml(report) {
  const safe = normalizeReport(report);
  const verifyAttempts = renderAttempts(safe.verifyAttempts);
  const doctorAttempts = renderAttempts(safe.doctorAttempts);
  const e2eAttempts = renderAttempts(safe.registryE2EAttempts);

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MindAnchor macOS 通知恢复报告</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; margin: 0; background: #f5f7fb; color: #1f2937; }
      .wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 56px; }
      .hero { background: linear-gradient(135deg, #1d4ed8, #4338ca); color: white; border-radius: 24px; padding: 28px 30px; }
      .hero h1 { margin: 0 0 10px; font-size: 34px; }
      .hero p { margin: 0; line-height: 1.7; color: rgba(255,255,255,0.9); }
      .section { background: white; border: 1px solid #dbe3f0; border-radius: 20px; padding: 22px; margin-top: 20px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
      .card { background: #f8fbff; border: 1px solid #dbe3f0; border-radius: 16px; padding: 16px; }
      h2 { margin: 0 0 14px; font-size: 22px; }
      h3 { margin: 0 0 10px; font-size: 16px; }
      p, li { line-height: 1.7; }
      code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      code { background: #eef3ff; color: #1d4ed8; padding: 2px 8px; border-radius: 8px; }
      pre { background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 14px; overflow: auto; white-space: pre-wrap; word-break: break-word; }
      .tag { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #e0e7ff; color: #3730a3; font-size: 13px; margin-right: 8px; }
      .muted { color: #5b6473; }
      .attempt { border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>MindAnchor macOS 通知恢复报告</h1>
        <p>这份报告汇总了当前 bundle 的通知恢复状态、恢复策略、关键证据和下一步动作，方便直接执行和留档。</p>
      </section>

      <section class="section">
        <h2>概览</h2>
        <div class="grid">
          <div class="card"><h3>Bundle</h3><p><code>${escapeHtml(safe.bundleIdentifier)}</code></p></div>
          <div class="card"><h3>结果</h3><p><span class="tag">${escapeHtml(safe.result)}</span><span class="tag">${escapeHtml(safe.recoveryAction)}</span></p></div>
          <div class="card"><h3>开始时间</h3><p>${escapeHtml(safe.startedAt)}</p></div>
          <div class="card"><h3>完成时间</h3><p>${escapeHtml(safe.completedAt)}</p></div>
          <div class="card"><h3>等待策略</h3><p><code>${escapeHtml(safe.plan.waitStrategy)}</code></p></div>
          <div class="card"><h3>Debug Log</h3><p><code>${escapeHtml(safe.debugLogPath)}</code></p></div>
        </div>
      </section>

      <section class="section">
        <h2>关键文件</h2>
        <ul>
          <li><code>${escapeHtml(safe.reportPath)}</code></li>
          <li><code>${escapeHtml(safe.debugLogPath)}</code></li>
        </ul>
      </section>

      <section class="section">
        <h2>恢复尝试</h2>
        <div class="grid">
          <div class="card">
            <h3>Verify</h3>
            ${verifyAttempts}
          </div>
          <div class="card">
            <h3>Doctor</h3>
            ${doctorAttempts}
          </div>
        </div>
        <div class="card" style="margin-top:14px">
          <h3>Registry E2E</h3>
          ${e2eAttempts}
        </div>
      </section>
    </div>
  </body>
</html>`;
}

function normalizeReport(report = {}) {
  return {
    bundleIdentifier: String(report.bundleIdentifier ?? "unknown"),
    recoveryAction: String(report.recoveryAction ?? "unknown"),
    result: String(report.result ?? "unknown"),
    startedAt: String(report.startedAt ?? "unknown"),
    completedAt: String(report.completedAt ?? "unknown"),
    debugLogPath: String(report.debugLogPath ?? ""),
    reportPath: String(report.reportPath ?? ""),
    verifyAttempts: Array.isArray(report.verifyAttempts) ? report.verifyAttempts : [],
    doctorAttempts: Array.isArray(report.doctorAttempts) ? report.doctorAttempts : [],
    registryE2EAttempts: Array.isArray(report.registryE2EAttempts) ? report.registryE2EAttempts : [],
    plan: {
      waitStrategy: String(report.plan?.waitStrategy ?? "unknown"),
    },
  };
}

function renderAttempts(attempts) {
  if (!attempts.length) {
    return `<p class="muted">暂无尝试记录。</p>`;
  }

  return attempts.map((attempt) => `
    <div class="attempt">
      <p><strong>时间：</strong>${escapeHtml(String(attempt.at ?? "unknown"))}</p>
      <p><strong>Exit Code：</strong><code>${escapeHtml(String(attempt.exitCode ?? "unknown"))}</code></p>
      ${attempt.stdout ? `<p><strong>stdout</strong></p><pre>${escapeHtml(String(attempt.stdout))}</pre>` : ""}
      ${attempt.stderr ? `<p><strong>stderr</strong></p><pre>${escapeHtml(String(attempt.stderr))}</pre>` : ""}
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
