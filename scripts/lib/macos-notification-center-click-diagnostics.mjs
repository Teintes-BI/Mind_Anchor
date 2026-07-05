import path from "node:path";

export function defaultMacOSNotificationCenterClickDiagnosticsReportPath(cwd = process.cwd()) {
  return path.resolve(cwd, "tmp", "macos-notification-center-click-diagnostics.json");
}

export function defaultMacOSNotificationCenterClickDiagnosticsHtmlPath(cwd = process.cwd()) {
  return path.resolve(cwd, "tmp", "macos-notification-center-click-diagnostics.html");
}

export function deriveMacOSNotificationCenterClickBoundary({
  notificationDebugState,
  clickResult,
}) {
  if (clickResult && clickResult !== "not-found") {
    return "clicked";
  }
  if (notificationDebugState !== "allowed") {
    return "permission_not_ready";
  }
  return "notification_center_click_boundary";
}

export function buildMacOSNotificationCenterClickGuidance({
  boundary,
  reportPath,
  htmlPath,
}) {
  if (boundary === "notification_center_click_boundary") {
    return [
      "通知权限已经就绪，但当前仍无法在 Notification Center 中稳定命中并点击目标通知。",
      "这说明当前主机的剩余问题集中在 Notification Center 展示 / 点击自动化边界。",
      `诊断 JSON：${reportPath}`,
      `诊断 HTML：${htmlPath}`,
    ];
  }

  if (boundary === "permission_not_ready") {
    return [
      "当前通知权限还没有真正就绪，应先排查授权链而不是 Notification Center 点击本身。",
      `诊断 JSON：${reportPath}`,
      `诊断 HTML：${htmlPath}`,
    ];
  }

  return [
    "当前通知点击诊断没有发现新的边界问题。",
    `诊断 JSON：${reportPath}`,
    `诊断 HTML：${htmlPath}`,
  ];
}

export function renderMacOSNotificationCenterClickDiagnosticsHtml(report) {
  const payload = normalize(report);
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>macOS Notification Center 点击诊断</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; margin: 0; background: #f6f8fb; color: #1f2937; }
      .wrap { width: min(1080px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 56px; }
      .hero, .section { background: white; border: 1px solid #dbe3f0; border-radius: 20px; padding: 22px; margin-top: 18px; }
      .hero { background: linear-gradient(135deg, #1d4ed8, #4338ca); color: white; }
      .hero h1 { margin: 0 0 10px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
      .card { background: #f8fbff; border: 1px solid #dbe3f0; border-radius: 16px; padding: 14px; }
      code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      code { background: #eef3ff; color: #1d4ed8; padding: 2px 8px; border-radius: 8px; }
      pre { background: #0f172a; color: #e2e8f0; padding: 14px; border-radius: 14px; white-space: pre-wrap; word-break: break-word; overflow: auto; }
      ul { line-height: 1.8; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>macOS Notification Center 点击诊断</h1>
        <p>这份报告用于确认当前问题是通知权限链，还是 Notification Center 展示 / 点击边界。</p>
      </section>
      <section class="section">
        <div class="grid">
          <div class="card"><strong>Boundary</strong><p><code>${escapeHtml(payload.boundary)}</code></p></div>
          <div class="card"><strong>Click Result</strong><p><code>${escapeHtml(payload.clickResult)}</code></p></div>
          <div class="card"><strong>Notification State</strong><p><code>${escapeHtml(payload.notificationDebugState)}</code></p></div>
          <div class="card"><strong>Bundle</strong><p><code>${escapeHtml(payload.bundleIdentifier)}</code></p></div>
        </div>
      </section>
      <section class="section">
        <h2>Guidance</h2>
        <ul>${payload.guidance.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      </section>
      <section class="section">
        <h2>Notification Center Dump</h2>
        <pre>${escapeHtml(payload.dump)}</pre>
      </section>
    </div>
  </body>
</html>`;
}

function normalize(report = {}) {
  return {
    boundary: String(report.boundary ?? "unknown"),
    clickResult: String(report.clickResult ?? "unknown"),
    notificationDebugState: String(report.notificationDebugState ?? "unknown"),
    bundleIdentifier: String(report.bundleIdentifier ?? "unknown"),
    guidance: Array.isArray(report.guidance) ? report.guidance : [],
    dump: String(report.dump ?? ""),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
