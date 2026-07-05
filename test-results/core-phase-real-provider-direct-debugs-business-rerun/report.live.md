# Core Phase Test Report

- Started: `2026-03-24T03:29:20.200Z`
- Completed: `in-progress`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 2 Provider Direct | running | openai-compatible | — | — | 28/28 |

## Failures

- 无失败记录。

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-debugs-business-rerun/report.live.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-debugs-business-rerun/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-debugs-business-rerun/responses`

## Phase 2 Provider Direct

- 状态：`running`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 94922a73-a1cd-4333-addd-15bf1d4ec4d1 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | d67f48b5-bf32-4a40-819f-e4ef672aed02 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 2cd3e58a-5084-451e-a532-7d4854cc25c9 | — | — | — | — | passed |
| debug-state-insight | 200 | 6b50eb51-b893-4d4e-9eb4-a77d4c4052cb | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 6b50eb51-b893-4d4e-9eb4-a77d4c4052cb | — | — | — | — | passed |
| debug-task-management | 200 | 82697d17-aaf9-4f50-83ea-8b20d6f10e46 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 82697d17-aaf9-4f50-83ea-8b20d6f10e46 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 9dc76637-8b64-489c-a722-b0cca62b740d | provider-direct | /v1/responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 9dc76637-8b64-489c-a722-b0cca62b740d | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 93ed7955-d9d3-4926-8d47-e5168b3c7a15 | provider-direct | /v1/responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 93ed7955-d9d3-4926-8d47-e5168b3c7a15 | — | — | — | — | passed |
| debug-reflection | 200 | 6d3034dc-9b2b-40ee-aa01-05e0dbd77334 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 6d3034dc-9b2b-40ee-aa01-05e0dbd77334 | — | — | — | — | passed |
| debug-automation | 200 | 29dd7633-2228-4674-a3f6-00d547eec674 | provider-direct | /v1/responses | false | — | passed |
| debug-automation-trace | 200 | 29dd7633-2228-4674-a3f6-00d547eec674 | — | — | — | — | passed |
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

