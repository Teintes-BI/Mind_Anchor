# Core Phase Test Report

- Started: `2026-03-24T03:07:14.275Z`
- Completed: `2026-03-24T03:12:48.924Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4175`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 2 Provider Direct | failed | openai-compatible | — | — | 5/6 |

## Failures

- [provider-direct] debug-task-management: socket hang up
- [provider-direct] provider-direct-phase: socket hang up

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-debugs-business/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-debugs-business/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-debugs-business/responses`

## Phase 2 Provider Direct

- 状态：`failed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 5fc51a02-1502-4b3b-91b0-49289aa8ef5c | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | c033d133-416f-43aa-91f7-598b2912ade4 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | df0e002e-3464-461a-9e83-66762c122a46 | — | — | — | — | passed |
| debug-state-insight | 200 | 27431475-3ea0-4c73-83e5-7d4bf6bcc007 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 27431475-3ea0-4c73-83e5-7d4bf6bcc007 | — | — | — | — | passed |
| debug-task-management | ERR | — | — | — | — | — | socket hang up |

