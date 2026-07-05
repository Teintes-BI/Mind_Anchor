# Core Phase Test Report

- Started: `2026-03-24T04:46:01.204Z`
- Completed: `2026-03-24T04:58:58.066Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-business-web-dashboard/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-business-web-dashboard/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-business-web-dashboard/responses`

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | a58e0683-1c7f-4ad3-8189-a29410f5d44f | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 935e93d0-4633-451d-a934-db8a6ce96767 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 7840c42a-9add-46c4-9cb3-3492d3c66075 | — | — | — | — | passed |
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

