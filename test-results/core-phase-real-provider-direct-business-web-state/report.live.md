# Core Phase Test Report

- Started: `2026-03-24T04:59:18.797Z`
- Completed: `2026-03-24T05:14:46.640Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 2 Provider Direct | passed | openai-compatible | — | — | 15/15 |

## Failures

- 无失败记录。

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-business-web-state/report.live.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-business-web-state/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-business-web-state/responses`

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 8b5fb2aa-de49-4196-8a59-60e7290158f6 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 76bdcd12-d087-4f82-a4e9-219207793b23 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 61c4f10c-e9bd-4697-955a-46c60d6356c1 | — | — | — | — | passed |
| business-create-goal | 201 | — | — | — | — | — | passed |
| business-create-task | 201 | — | — | — | — | — | passed |
| business-start-session | 201 | — | — | — | — | — | passed |
| business-signal-batch | 200 | — | — | — | — | — | passed |
| business-state-latest | 200 | — | — | — | — | — | passed |
| business-end-session | 200 | — | — | — | — | — | passed |
| business-inbox | 200 | — | — | — | — | — | passed |
| business-dashboard-summary | 200 | — | — | — | — | — | passed |
| business-reflections-latest | 200 | — | — | — | — | — | passed |
| business-inbox-ack | 200 | — | — | — | — | — | passed |
| reflection-latest-weekly | 200 | — | — | — | — | — | passed |
| web-state-trends | 200 | — | — | — | — | — | passed |

