# Core Phase Test Report

- Started: `2026-03-24T04:02:09.878Z`
- Completed: `2026-03-24T04:10:06.636Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-debugs/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-debugs/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-debugs/responses`

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 54d91cd5-37b5-436d-b065-100bc7f7e3b5 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | d6954d67-33dd-4254-a90a-7d0e92457dda | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | f61e2782-f3d8-4995-a850-05ed49d31b53 | — | — | — | — | passed |
| debug-state-insight | 200 | bfd2a690-576b-4a9e-8f78-7dbf43d579b5 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | bfd2a690-576b-4a9e-8f78-7dbf43d579b5 | — | — | — | — | passed |
| debug-task-management | 200 | 304f5969-322c-464f-809c-b15450d42fc1 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 304f5969-322c-464f-809c-b15450d42fc1 | — | — | — | — | passed |
| debug-progress-feedback | 200 | f1e578b4-5627-4e4f-809e-9723394fdf0f | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | f1e578b4-5627-4e4f-809e-9723394fdf0f | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 7f7bcf0d-7e83-444f-bd86-c09826c92e83 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 7f7bcf0d-7e83-444f-bd86-c09826c92e83 | — | — | — | — | passed |
| debug-reflection | 200 | 6e59f0a0-1ff7-450c-9618-6e0b031e7c9d | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 6e59f0a0-1ff7-450c-9618-6e0b031e7c9d | — | — | — | — | passed |
| debug-automation | 200 | f47e5053-0a21-4f8d-bddc-162995777a19 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | f47e5053-0a21-4f8d-bddc-162995777a19 | — | — | — | — | passed |

