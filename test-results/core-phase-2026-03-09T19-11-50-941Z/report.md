# Core Phase Test Report

- Started: `2026-03-09T19:11:50.942Z`
- Completed: `2026-03-09T19:43:05.954Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | 57/57 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 30/31 |
| Phase 3 Cluster Preferred | passed | openai-compatible | http://127.0.0.1:8788 | 71/71 |

## Failures

- [provider-direct] chief-route-recovery: Request timeout after 300000ms
- [provider-direct] provider-direct-phase: Request timeout after 300000ms

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T19-11-50-941Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T19-11-50-941Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T19-11-50-941Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- OpenClaw Base URL：`未配置`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | 3ffa8f5e-8f9f-4cd2-af25-571cd0b194e6 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 979ab62d-ddcb-40e3-bbf5-bcfe6c7e7222 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 29b32849-5a8e-4361-b311-1c66db985b25 | — | — | — | — | passed |
| chief-route-recovery | 200 | 6fc46dac-4875-4c80-a6a1-422acd56a364 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 6fc46dac-4875-4c80-a6a1-422acd56a364 | — | — | — | — | passed |
| chief-route-task-management | 200 | 26f528a8-f50c-4c49-9888-e757480076b7 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 26f528a8-f50c-4c49-9888-e757480076b7 | — | — | — | — | passed |
| chief-route-reflection | 200 | a6dd9a83-3961-4dbd-80ed-7d92291b2862 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | a6dd9a83-3961-4dbd-80ed-7d92291b2862 | — | — | — | — | passed |
| debug-state-insight | 200 | da93925e-dfff-458a-a1c3-b14592996c38 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | da93925e-dfff-458a-a1c3-b14592996c38 | — | — | — | — | passed |
| debug-task-management | 200 | 9acf9a22-2643-4058-9caf-ba94c3266fac | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 9acf9a22-2643-4058-9caf-ba94c3266fac | — | — | — | — | passed |
| debug-progress-feedback | 200 | 8dd4e40e-673f-4a7a-8996-9465f0b795c3 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 8dd4e40e-673f-4a7a-8996-9465f0b795c3 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 79e28e1f-5c53-4a90-9120-44fa2919c1dd | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 79e28e1f-5c53-4a90-9120-44fa2919c1dd | — | — | — | — | passed |
| debug-reflection | 200 | 8fbb85c7-2c8e-4e52-b100-1e9b5adaa3d4 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 8fbb85c7-2c8e-4e52-b100-1e9b5adaa3d4 | — | — | — | — | passed |
| debug-automation | 200 | 8e8a3e31-b2a7-451e-83d0-ffc62d24e9b2 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 8e8a3e31-b2a7-451e-83d0-ffc62d24e9b2 | — | — | — | — | passed |
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
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| full-regression | 200 | 58b360db-0513-4e7a-b5a4-80fcb3847a3f | — | — | — | — | passed |
| full-regression-trace | 200 | 58b360db-0513-4e7a-b5a4-80fcb3847a3f | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 683da739-2595-49a5-9db3-3c3656e3419f | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 683da739-2595-49a5-9db3-3c3656e3419f | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`failed`
- Agent mode：`openai-compatible`
- OpenClaw Base URL：`未配置`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | 827c3c96-a4fd-47d5-a201-c14d5e2eccb3 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 449553e5-d163-4819-acdc-5c874ed7b8fc | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 7bc02b4d-e813-4c82-9393-9c5a703d4847 | — | — | — | — | passed |
| probe-chief-agent | 200 | d6337a88-4700-4b3c-bbcd-d65a292e8ca9 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | d6337a88-4700-4b3c-bbcd-d65a292e8ca9 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 7b26aeee-a662-4fed-881a-2f03a4afb7f9 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 7b26aeee-a662-4fed-881a-2f03a4afb7f9 | — | — | — | — | passed |
| probe-task-management-agent | 200 | d9186ba9-ce4c-423a-8214-e8c1f5c064f3 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | d9186ba9-ce4c-423a-8214-e8c1f5c064f3 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | c3a567fc-3fdb-418a-a3d0-670a2c7c2cec | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | c3a567fc-3fdb-418a-a3d0-670a2c7c2cec | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | b30a75cb-ca09-4ad1-8976-5b288a8923bd | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | b30a75cb-ca09-4ad1-8976-5b288a8923bd | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | c1d509d3-88ff-4b8d-baf8-0c47f32c0fd0 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | c1d509d3-88ff-4b8d-baf8-0c47f32c0fd0 | — | — | — | — | passed |
| probe-automation-agent | 200 | ff582ec6-cf2b-483f-9493-29ac717e652a | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | ff582ec6-cf2b-483f-9493-29ac717e652a | — | — | — | — | passed |
| chief-route-recovery | ERR | — | — | — | — | — | Request timeout after 300000ms |

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- OpenClaw Base URL：`http://127.0.0.1:8788`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | 3e07f9f7-da3f-421d-ba0c-23ae7bf5cd49 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 66995cf5-1576-40ce-aa82-a7eaa0b63843 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 18195ddb-d4f2-4205-9f41-3f8ea0946c02 | — | — | — | — | passed |
| probe-chief-agent | 200 | e0f4fe1d-3704-4c28-a679-389e14eefda4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | e0f4fe1d-3704-4c28-a679-389e14eefda4 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 55871870-5b33-4bb2-bc19-5e465f82e940 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 55871870-5b33-4bb2-bc19-5e465f82e940 | — | — | — | — | passed |
| probe-task-management-agent | 200 | d8cfdcb4-a736-4f97-8dcd-b3af16e27fca | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | d8cfdcb4-a736-4f97-8dcd-b3af16e27fca | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 9aa162c4-aeee-4166-b3bc-1b56bb88341f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 9aa162c4-aeee-4166-b3bc-1b56bb88341f | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 5484f382-cd68-4a0c-be44-e875b8ba02dd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 5484f382-cd68-4a0c-be44-e875b8ba02dd | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 0a2ce14a-96ea-442e-8d5b-c96add6929e7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 0a2ce14a-96ea-442e-8d5b-c96add6929e7 | — | — | — | — | passed |
| probe-automation-agent | 200 | d3feafdf-21bc-4d89-9f21-a43a77391de4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | d3feafdf-21bc-4d89-9f21-a43a77391de4 | — | — | — | — | passed |
| chief-route-recovery | 200 | e9e6a1cb-a286-4675-bbfa-7b010d6aa0f8 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | e9e6a1cb-a286-4675-bbfa-7b010d6aa0f8 | — | — | — | — | passed |
| chief-route-task-management | 200 | 95b1b5f1-739b-4632-914a-92409896aec6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 95b1b5f1-739b-4632-914a-92409896aec6 | — | — | — | — | passed |
| chief-route-reflection | 200 | ab8eff1f-f7c7-47d7-9c6b-cd270b277257 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | ab8eff1f-f7c7-47d7-9c6b-cd270b277257 | — | — | — | — | passed |
| debug-state-insight | 200 | 58c4cefb-56b0-4156-8d69-3aeffe33a8cc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 58c4cefb-56b0-4156-8d69-3aeffe33a8cc | — | — | — | — | passed |
| debug-task-management | 200 | 80f6d5ff-2c55-4902-866f-b0ed036537f6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 80f6d5ff-2c55-4902-866f-b0ed036537f6 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 804431d2-ee6e-46ba-b5be-fc0a2d7cd6de | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 804431d2-ee6e-46ba-b5be-fc0a2d7cd6de | — | — | — | — | passed |
| debug-interruption-recovery | 200 | d2b13871-bee8-4f9e-a58f-78ca2b2f51d3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | d2b13871-bee8-4f9e-a58f-78ca2b2f51d3 | — | — | — | — | passed |
| debug-reflection | 200 | 82bade5a-d753-4d45-8a96-59c36da13bf1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 82bade5a-d753-4d45-8a96-59c36da13bf1 | — | — | — | — | passed |
| debug-automation | 200 | 25c36f05-3fc6-44bd-9c9f-07fa39a4621d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 25c36f05-3fc6-44bd-9c9f-07fa39a4621d | — | — | — | — | passed |
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
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| full-regression | 200 | 6d9cb67c-35f8-4579-aadb-125b75984947 | — | — | — | — | passed |
| full-regression-trace | 200 | 6d9cb67c-35f8-4579-aadb-125b75984947 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 925dd075-2150-4d77-a37c-e26e7f2dd0a2 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 925dd075-2150-4d77-a37c-e26e7f2dd0a2 | — | — | — | — | passed |

