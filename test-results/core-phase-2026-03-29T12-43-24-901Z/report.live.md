# Core Phase Test Report

- Started: `2026-03-29T12:43:24.924Z`
- Completed: `2026-03-29T12:46:17.284Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-29T12-43-24-901Z/report.live.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-29T12-43-24-901Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-29T12-43-24-901Z/responses`

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 159ca0e3-3567-4efd-bc05-3b125ddc7a95 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | e0decef5-be66-4b26-93b2-12d07d8678d5 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | fa4f95d1-6ea4-48d0-9af3-d4253c69aaab | — | — | — | — | passed |
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
| web-recovery-history | 200 | — | — | — | — | — | passed |

