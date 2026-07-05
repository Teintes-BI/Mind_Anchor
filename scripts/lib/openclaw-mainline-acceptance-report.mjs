import path from "node:path";

export function defaultOpenClawMainlineAcceptanceReportPath(cwd = process.cwd()) {
  return path.resolve(cwd, "tmp", "openclaw-mainline-acceptance-report.json");
}

export function defaultOpenClawMainlineAcceptanceMarkdownPath(cwd = process.cwd()) {
  return path.resolve(cwd, "tmp", "openclaw-mainline-acceptance-report.md");
}

export function renderOpenClawMainlineAcceptanceMarkdown(report) {
  const safe = normalize(report);
  const lines = [
    "# OpenClaw Mainline Acceptance Report",
    "",
    `- generatedAt: ${safe.generatedAt}`,
    `- status: ${safe.status}`,
    `- duration: ${safe.durationMs}ms`,
    `- command: \`${safe.command}\``,
    "",
    "## Cases",
  ];

  for (const item of safe.cases) {
    lines.push(`- [${item.status === "passed" ? "x" : " "}] ${item.name}`);
  }

  return `${lines.join("\n")}\n`;
}

function normalize(report = {}) {
  return {
    generatedAt: String(report.generatedAt ?? "unknown"),
    status: String(report.status ?? "unknown"),
    durationMs: Number(report.durationMs ?? 0),
    command: String(report.command ?? ""),
    cases: Array.isArray(report.cases)
      ? report.cases.map((item) => ({
          name: String(item.name ?? "unknown"),
          status: String(item.status ?? "unknown"),
        }))
      : [],
  };
}
