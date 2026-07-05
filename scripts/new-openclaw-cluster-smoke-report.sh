#!/usr/bin/env bash
set -euo pipefail

report_date="${1:-$(date +%F)}"
target_file="docs/openclaw-cluster-smoke-report-${report_date}.md"
template_file="docs/openclaw-cluster-smoke-report-template.md"

if [[ "${1:-}" == "--help" ]]; then
  cat <<EOF
Usage:
  bash scripts/new-openclaw-cluster-smoke-report.sh [YYYY-MM-DD]

Creates a dated OpenClaw cluster smoke report from the shared template.
Default output:
  docs/openclaw-cluster-smoke-report-<date>.md
EOF
  exit 0
fi

if [[ ! -f "$template_file" ]]; then
  echo "Template not found: $template_file"
  exit 1
fi

if [[ -e "$target_file" ]]; then
  echo "Report already exists: $target_file"
  exit 1
fi

cp "$template_file" "$target_file"

python3 - <<'PY' "$target_file" "$report_date"
from pathlib import Path
import sys

target = Path(sys.argv[1])
report_date = sys.argv[2]
text = target.read_text(encoding="utf-8")
text = text.replace(
    "# OpenClaw Cluster Smoke Report Template",
    f"# OpenClaw Cluster Smoke Report（{report_date}）",
    1,
)
target.write_text(text, encoding="utf-8")
PY

echo "Created $target_file"
