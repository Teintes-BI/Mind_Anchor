# Core Phase Test Report

- Started: `2026-03-29T12:38:56.803Z`
- Completed: `2026-03-29T12:42:03.555Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-29T12-38-56-722Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-29T12-38-56-722Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-29T12-38-56-722Z/responses`

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 6e13aea6-7a87-4317-ab38-3419d75d959e | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | ef18f681-e7fc-4408-914d-8f4f5ba87dfe | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 2ab04938-1b28-4eb8-98b5-665ec03fe6c8 | — | — | — | — | passed |
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
| web-goalflow-overview | 200 | — | — | — | — | — | passed |

