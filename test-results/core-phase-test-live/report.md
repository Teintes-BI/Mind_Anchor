# Core Phase Test Report

- Started: `2026-03-24T02:51:20.322Z`
- Completed: `2026-03-24T02:51:53.558Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4175`
- Cluster Mode: `local`
- Provider Mode: `mock`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | running | stub | not_configured | — | 21/21 |

## Failures

- 无失败记录。

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-test-live/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-test-live/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-test-live/responses`

## Phase 1 Stub Baseline

- 状态：`running`
- Agent mode：`stub`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry issue breakdown：contract=`0` / runtime=`0` / workflow=`0` / workflow-response=`0` / workflow-execution=`0` / execution-probe=`0` / unknown-external=`0`
- Registry runtime：`未上报` / `未上报`
- Registry matched agents：`0/6`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | ebb53fb0-aa2c-4352-aa6c-619e4ec0c1dd | provider-direct | /v1/responses | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| registry-visibility | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | 6ad95540-7431-482c-8f32-432d4666a02c | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | d1f90e4d-f445-4cfa-9ee0-a3ba19cc0af0 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 4cfbbc14-7cbf-42a4-8da6-b838a21a5899 | — | — | — | — | passed |
| chief-route-recovery | 200 | 70cdfe9d-287f-4def-909a-640fe7a435c5 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 70cdfe9d-287f-4def-909a-640fe7a435c5 | — | — | — | — | passed |
| chief-route-task-management | 200 | 75027af8-2018-44b2-a103-3c2535099e18 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 75027af8-2018-44b2-a103-3c2535099e18 | — | — | — | — | passed |

