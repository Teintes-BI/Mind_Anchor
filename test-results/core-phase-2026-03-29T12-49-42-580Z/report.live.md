# Core Phase Test Report

- Started: `2026-03-29T12:49:42.606Z`
- Completed: `2026-03-29T12:52:26.070Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4175`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-29T12-49-42-580Z/report.live.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-29T12-49-42-580Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-29T12-49-42-580Z/responses`

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | ef9bdb32-0389-4a5e-8e45-7fddf87b217d | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | ef3db548-50c7-436c-9a4a-b8b839190a9d | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | d92f6bfb-b70c-4b9e-9580-18d90a688265 | — | — | — | — | passed |
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
| web-inbox-overview | 200 | — | — | — | — | — | passed |

