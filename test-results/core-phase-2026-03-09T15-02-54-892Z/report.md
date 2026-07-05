# Core Phase Test Report

- Started: `2026-03-09T15:02:54.893Z`
- Completed: `2026-03-09T15:08:06.116Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | failed | stub | — | 1/2 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 1/2 |
| Phase 3 Cluster Preferred | failed | openai-compatible | http://127.0.0.1:8788 | 6/7 |

## Failures

- [stub] adapter-status: Expected adapter strategy provider-direct.
- [stub] stub-phase: Expected adapter strategy provider-direct.
- [provider-direct] adapter-status: Expected adapter strategy provider-direct.
- [provider-direct] provider-direct-phase: Expected adapter strategy provider-direct.
- [cluster-preferred] bootstrap-demo-user: This operation was aborted
- [cluster-preferred] cluster-preferred-phase: This operation was aborted

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T15-02-54-892Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T15-02-54-892Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T15-02-54-892Z/responses`

## Phase 1 Stub Baseline

- 状态：`failed`
- Agent mode：`stub`
- OpenClaw Base URL：`未配置`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | ERR | — | — | — | — | — | Expected adapter strategy provider-direct. |

## Phase 2 Provider Direct

- 状态：`failed`
- Agent mode：`openai-compatible`
- OpenClaw Base URL：`未配置`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | ERR | — | — | — | — | — | Expected adapter strategy provider-direct. |

## Phase 3 Cluster Preferred

- 状态：`failed`
- Agent mode：`openai-compatible`
- OpenClaw Base URL：`http://127.0.0.1:8788`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | 81ad6c3c-a50f-4926-9a96-4bd12cbde3ea | provider-fallback | /responses | — | fetch failed | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| bootstrap-demo-user | ERR | — | — | — | — | — | This operation was aborted |

