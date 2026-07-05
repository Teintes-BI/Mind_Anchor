# Core Phase Test Report

- Started: `2026-03-24T02:57:28.113Z`
- Completed: `2026-03-24T02:57:38.041Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4175`
- Cluster Mode: `local`
- Provider Mode: `mock`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | not_configured | — | 7/7 |

## Failures

- 无失败记录。

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-test-segments/report.live.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-test-segments/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-test-segments/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry issue breakdown：contract=`0` / runtime=`0` / workflow=`0` / workflow-response=`0` / workflow-execution=`0` / execution-probe=`0` / unknown-external=`0`
- Registry runtime：`未上报` / `未上报`
- Registry matched agents：`0/6`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | 8cf983bb-6454-4d89-a4cd-9e614969b5a7 | provider-direct | /responses | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| registry-visibility | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |

