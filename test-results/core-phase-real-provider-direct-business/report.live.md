# Core Phase Test Report

- Started: `2026-03-24T04:10:26.697Z`
- Completed: `in-progress`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 2 Provider Direct | running | openai-compatible | — | — | 16/16 |

## Failures

- 无失败记录。

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-business/report.live.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-business/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-business/responses`

## Phase 2 Provider Direct

- 状态：`running`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 345bc731-c08e-432f-9ba6-44b1c4aa4050 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | d2c9177c-25b3-459c-bf53-39aa584111a4 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | a098e556-74ba-4c3e-9f02-d02891cc704a | — | — | — | — | passed |
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
| web-dashboard-summary | 200 | — | — | — | — | — | passed |
| web-goalflow-overview | 200 | — | — | — | — | — | passed |

