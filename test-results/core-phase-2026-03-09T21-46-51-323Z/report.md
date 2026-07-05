# Core Phase Test Report

- Started: `2026-03-09T21:46:51.324Z`
- Completed: `2026-03-09T21:48:31.437Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Provider Mode: `mock`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | 57/57 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 71/71 |
| Phase 3 Cluster Preferred | passed | openai-compatible | http://127.0.0.1:8788 | 71/71 |

## Failures

- [provider-direct] provider-direct-phase: Provider phase probe failed: probe-chief-agent-trace

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T21-46-51-323Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T21-46-51-323Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T21-46-51-323Z/responses`

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
| seed-focus-recovery-loop | 200 | b86f39b4-70c7-483d-804e-0c3642e29648 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 9393801e-a956-4441-9305-6b39861754b6 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 7ae938c2-da6b-4849-bf9e-cd623d3c200f | — | — | — | — | passed |
| chief-route-recovery | 200 | 10bdef57-b0f9-4473-adf0-8b7631482203 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 10bdef57-b0f9-4473-adf0-8b7631482203 | — | — | — | — | passed |
| chief-route-task-management | 200 | e0278162-48ea-485f-8a93-6b8949a86f72 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | e0278162-48ea-485f-8a93-6b8949a86f72 | — | — | — | — | passed |
| chief-route-reflection | 200 | f8a384a0-7483-4f70-8832-da32634aedba | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | f8a384a0-7483-4f70-8832-da32634aedba | — | — | — | — | passed |
| debug-state-insight | 200 | be8f0b72-7adb-4ca8-a8c9-5193f218e421 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | be8f0b72-7adb-4ca8-a8c9-5193f218e421 | — | — | — | — | passed |
| debug-task-management | 200 | c3e12e3a-1207-4092-b06f-e061c389f962 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | c3e12e3a-1207-4092-b06f-e061c389f962 | — | — | — | — | passed |
| debug-progress-feedback | 200 | becea9e9-6bce-4de1-a41e-586f17cf9b66 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | becea9e9-6bce-4de1-a41e-586f17cf9b66 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 9d11edbc-6553-425d-89c7-b0ef38fc17d0 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 9d11edbc-6553-425d-89c7-b0ef38fc17d0 | — | — | — | — | passed |
| debug-reflection | 200 | bcf10072-b201-43d0-9e4d-9eb103a106d6 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | bcf10072-b201-43d0-9e4d-9eb103a106d6 | — | — | — | — | passed |
| debug-automation | 200 | cbb59b5d-5162-4a6a-888f-ab3d10949c43 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | cbb59b5d-5162-4a6a-888f-ab3d10949c43 | — | — | — | — | passed |
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
| full-regression | 200 | 933f9212-9968-43f7-a750-26c39209b24b | — | — | — | — | passed |
| full-regression-trace | 200 | 933f9212-9968-43f7-a750-26c39209b24b | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 8ffe9e85-d947-41ec-811a-f6160afa6d0c | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 8ffe9e85-d947-41ec-811a-f6160afa6d0c | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 7d372064-1323-49e0-8a54-5d36af8a2f00 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | d2549fe8-eb20-4a67-8a89-7bf6997dd17f | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | cca9c352-63ff-48ef-a476-1b7952549e61 | — | — | — | — | passed |
| probe-chief-agent | 200 | c8407be7-bd54-4be9-a43e-e851ca20b419 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | c8407be7-bd54-4be9-a43e-e851ca20b419 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 2212f9f6-fad0-4aed-babd-36005e580fb7 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 2212f9f6-fad0-4aed-babd-36005e580fb7 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 0a45d0f5-d1ed-4ac5-add7-1e237b1592db | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 0a45d0f5-d1ed-4ac5-add7-1e237b1592db | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | d39e27bf-f1f3-4e09-89c4-c62b5ba3046b | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | d39e27bf-f1f3-4e09-89c4-c62b5ba3046b | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 8f5f0cac-15df-427a-9f57-fd320cff055d | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 8f5f0cac-15df-427a-9f57-fd320cff055d | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | fc4196cd-7bef-490a-9329-8e81fe0c9560 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | fc4196cd-7bef-490a-9329-8e81fe0c9560 | — | — | — | — | passed |
| probe-automation-agent | 200 | ba3ee8a8-1855-4275-83d9-28eb0727dee0 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | ba3ee8a8-1855-4275-83d9-28eb0727dee0 | — | — | — | — | passed |
| chief-route-recovery | 200 | a8c3268a-03ac-4e8b-83b0-0d715ab9b628 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | a8c3268a-03ac-4e8b-83b0-0d715ab9b628 | — | — | — | — | passed |
| chief-route-task-management | 200 | 9443c414-cfad-4993-bf86-3be22f04c641 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 9443c414-cfad-4993-bf86-3be22f04c641 | — | — | — | — | passed |
| chief-route-reflection | 200 | 08455775-b0eb-4f0c-8a0b-74e073644b40 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 08455775-b0eb-4f0c-8a0b-74e073644b40 | — | — | — | — | passed |
| debug-state-insight | 200 | 3efa2374-674e-4cf5-8d49-a97241043a64 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 3efa2374-674e-4cf5-8d49-a97241043a64 | — | — | — | — | passed |
| debug-task-management | 200 | e7f91388-d109-41ed-80b8-1eb1f4139693 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | e7f91388-d109-41ed-80b8-1eb1f4139693 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 7afd7337-7c4a-4011-ad1b-6db543f5582e | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 7afd7337-7c4a-4011-ad1b-6db543f5582e | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 175558e3-b44b-4f2b-abf1-b9db92a4457f | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 175558e3-b44b-4f2b-abf1-b9db92a4457f | — | — | — | — | passed |
| debug-reflection | 200 | 9e9bc4ad-ed57-40c3-9fea-2c41d189b580 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 9e9bc4ad-ed57-40c3-9fea-2c41d189b580 | — | — | — | — | passed |
| debug-automation | 200 | 1f625f81-154a-4301-8301-da7c2c79a7e7 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 1f625f81-154a-4301-8301-da7c2c79a7e7 | — | — | — | — | passed |
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
| full-regression | 200 | 19d7816d-c3fb-4fe3-bff2-ead61cb904a5 | — | — | — | — | passed |
| full-regression-trace | 200 | 19d7816d-c3fb-4fe3-bff2-ead61cb904a5 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 56118339-44ee-4df8-a94c-88f9b64c7c70 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 56118339-44ee-4df8-a94c-88f9b64c7c70 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | f76b3e00-3042-4ca5-a0b2-0359036f24b2 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 7b690bea-9f59-4c77-b8ac-22c244f25885 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | b404b885-6653-4f68-bfa5-8bc74a974a28 | — | — | — | — | passed |
| probe-chief-agent | 200 | 5de030ca-7864-44f0-8bf8-5ec45d1da5f2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 5de030ca-7864-44f0-8bf8-5ec45d1da5f2 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | e9cf015c-b6a5-4f59-876f-251148dc598c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | e9cf015c-b6a5-4f59-876f-251148dc598c | — | — | — | — | passed |
| probe-task-management-agent | 200 | 969db652-8cb6-4b5c-95ce-e3206e976fed | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 969db652-8cb6-4b5c-95ce-e3206e976fed | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 3650197f-551e-4554-9d2f-4d719446e76b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 3650197f-551e-4554-9d2f-4d719446e76b | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | f167fece-f85e-4c4e-bd48-30c583a12045 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | f167fece-f85e-4c4e-bd48-30c583a12045 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | b68dd340-85ff-4c4a-892d-2630f8795fd4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | b68dd340-85ff-4c4a-892d-2630f8795fd4 | — | — | — | — | passed |
| probe-automation-agent | 200 | 51be9377-4787-462a-bd51-10e81b486e5b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 51be9377-4787-462a-bd51-10e81b486e5b | — | — | — | — | passed |
| chief-route-recovery | 200 | b2117833-9a18-4648-9ee4-1560325ab926 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | b2117833-9a18-4648-9ee4-1560325ab926 | — | — | — | — | passed |
| chief-route-task-management | 200 | 784b875e-43f1-457f-ab8b-d16198921fc5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 784b875e-43f1-457f-ab8b-d16198921fc5 | — | — | — | — | passed |
| chief-route-reflection | 200 | a8f7ecd4-66d0-4774-bb53-4a38bb990c06 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | a8f7ecd4-66d0-4774-bb53-4a38bb990c06 | — | — | — | — | passed |
| debug-state-insight | 200 | 50659e77-7321-4ac3-ba9c-b299634d4aae | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 50659e77-7321-4ac3-ba9c-b299634d4aae | — | — | — | — | passed |
| debug-task-management | 200 | 93e537af-bf90-4608-81f9-6616fd05af8a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 93e537af-bf90-4608-81f9-6616fd05af8a | — | — | — | — | passed |
| debug-progress-feedback | 200 | bf57f147-7ae6-4f5d-94de-4c05cb33856f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | bf57f147-7ae6-4f5d-94de-4c05cb33856f | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 4d38329a-029a-4746-a5af-b8c0c896fb7b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 4d38329a-029a-4746-a5af-b8c0c896fb7b | — | — | — | — | passed |
| debug-reflection | 200 | fba4d327-aea9-4174-98f6-a09329a47763 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | fba4d327-aea9-4174-98f6-a09329a47763 | — | — | — | — | passed |
| debug-automation | 200 | ddbabfb7-3798-40bf-9e8a-f2756090e792 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | ddbabfb7-3798-40bf-9e8a-f2756090e792 | — | — | — | — | passed |
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
| full-regression | 200 | 4cda0bb4-fdab-4743-aa89-094127df630b | — | — | — | — | passed |
| full-regression-trace | 200 | 4cda0bb4-fdab-4743-aa89-094127df630b | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | c68dc657-d2dc-4644-a2a2-a2786de37d01 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | c68dc657-d2dc-4644-a2a2-a2786de37d01 | — | — | — | — | passed |

