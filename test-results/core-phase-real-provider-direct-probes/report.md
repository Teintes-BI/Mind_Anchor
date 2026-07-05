# Core Phase Test Report

- Started: `2026-03-24T03:00:04.172Z`
- Completed: `2026-03-24T03:01:45.497Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4175`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 2 Provider Direct | passed | openai-compatible | not_configured | — | 30/30 |

## Failures

- 无失败记录。

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-probes/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-probes/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-probes/responses`

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
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
| adapter-status | 200 | 8cf983bb-6454-4d89-a4cd-9e614969b5a7 | provider-direct | /responses | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| registry-visibility | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | 61063b06-f066-46af-a2ff-29603986c7cb | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 655733ec-46b5-464c-b08c-ec70f1cd6879 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 3035266c-83ed-4a73-a242-d845d3bc2224 | — | — | — | — | passed |
| probe-chief-agent | 200 | 32d730a2-854e-491c-9583-922a76635aa3 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 32d730a2-854e-491c-9583-922a76635aa3 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 8a6181c8-d35f-49ca-b1e1-f6141bad516f | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 8a6181c8-d35f-49ca-b1e1-f6141bad516f | — | — | — | — | passed |
| probe-task-management-agent | 200 | 00f8a04c-730e-4e2d-b564-f0babdc9e433 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 00f8a04c-730e-4e2d-b564-f0babdc9e433 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 604e84b0-9c9f-4e84-912a-5c7cd7414e51 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 604e84b0-9c9f-4e84-912a-5c7cd7414e51 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | e93c03cb-4a01-42e1-9598-569562a35f19 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | e93c03cb-4a01-42e1-9598-569562a35f19 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 76718cdd-73af-487d-8a58-50187f29fbb2 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 76718cdd-73af-487d-8a58-50187f29fbb2 | — | — | — | — | passed |
| probe-automation-agent | 200 | 124ef452-d40b-4217-ae97-dbbb00179966 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 124ef452-d40b-4217-ae97-dbbb00179966 | — | — | — | — | passed |
| chief-route-recovery | 200 | a119abb0-c0f9-4ffb-ae84-3238b19d0d86 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | a119abb0-c0f9-4ffb-ae84-3238b19d0d86 | — | — | — | — | passed |
| chief-route-task-management | 200 | 87c7e03e-3e2a-4f23-8cb0-ec595949ca4c | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 87c7e03e-3e2a-4f23-8cb0-ec595949ca4c | — | — | — | — | passed |
| chief-route-reflection | 200 | 350be4b3-eaa9-44a6-8ed5-fbbc593e78b5 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 350be4b3-eaa9-44a6-8ed5-fbbc593e78b5 | — | — | — | — | passed |

