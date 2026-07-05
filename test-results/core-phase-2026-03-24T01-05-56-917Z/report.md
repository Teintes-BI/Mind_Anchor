# Core Phase Test Report

- Started: `2026-03-24T01:05:56.919Z`
- Completed: `2026-03-24T01:07:40.177Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Provider Mode: `mock`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | not_configured | — | 58/58 |
| Phase 2 Provider Direct | passed | openai-compatible | not_configured | — | 72/72 |
| Phase 3 Cluster Preferred | passed | openai-compatible | aligned | http://127.0.0.1:8788 | 72/72 |

## Failures

- 无失败记录。

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-05-56-917Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-05-56-917Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-05-56-917Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry runtime：`未上报` / `未上报`
- Registry matched agents：`0/6`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
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
| seed-focus-recovery-loop | 200 | 645b96b8-7196-42d3-803e-4701c61f573e | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | f0a2b1fd-f954-420c-8f9d-7b1518c5f823 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 01e7d799-9d11-466d-9958-aee90969bd70 | — | — | — | — | passed |
| chief-route-recovery | 200 | 953e7859-a050-4954-ab41-59b80c4d8f7d | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 953e7859-a050-4954-ab41-59b80c4d8f7d | — | — | — | — | passed |
| chief-route-task-management | 200 | ec387346-42d9-482c-bc1d-af4b561991b2 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | ec387346-42d9-482c-bc1d-af4b561991b2 | — | — | — | — | passed |
| chief-route-reflection | 200 | 1fea1320-6569-4b39-bd02-ecf023853580 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 1fea1320-6569-4b39-bd02-ecf023853580 | — | — | — | — | passed |
| debug-state-insight | 200 | 82573e8b-22af-40b2-96ea-c033ea3118ce | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 82573e8b-22af-40b2-96ea-c033ea3118ce | — | — | — | — | passed |
| debug-task-management | 200 | 7d6fabb1-f381-4d16-bccf-e782baca51ef | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 7d6fabb1-f381-4d16-bccf-e782baca51ef | — | — | — | — | passed |
| debug-progress-feedback | 200 | 98c071c5-7ddd-4769-8ca2-dece92082282 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 98c071c5-7ddd-4769-8ca2-dece92082282 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 27189201-8645-4e4a-984b-4be4aedebfc6 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 27189201-8645-4e4a-984b-4be4aedebfc6 | — | — | — | — | passed |
| debug-reflection | 200 | 741bc2e0-6bbc-4284-b2ec-edb6beff3666 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 741bc2e0-6bbc-4284-b2ec-edb6beff3666 | — | — | — | — | passed |
| debug-automation | 200 | 53b107fe-e290-44ba-b8c2-d0a95484fe94 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 53b107fe-e290-44ba-b8c2-d0a95484fe94 | — | — | — | — | passed |
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
| full-regression | 200 | 28578313-5cff-41dd-95f1-9fe176d99e9a | — | — | — | — | passed |
| full-regression-trace | 200 | 28578313-5cff-41dd-95f1-9fe176d99e9a | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 22e6482a-f768-4bd4-8483-0533f40f3fcb | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 22e6482a-f768-4bd4-8483-0533f40f3fcb | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry runtime：`未上报` / `未上报`
- Registry matched agents：`0/6`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
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
| seed-focus-recovery-loop | 200 | 993279ee-bce1-4f23-9646-98c5724e2e15 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | eae49310-f3ce-4f41-9194-d8c8dbc936f6 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | d8ec3e0e-80c3-481b-978c-78d605932377 | — | — | — | — | passed |
| probe-chief-agent | 200 | 8ae359ba-d956-4fc8-be47-d0a3ce3ac1f1 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 8ae359ba-d956-4fc8-be47-d0a3ce3ac1f1 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 3f99a221-b8c3-49cf-9077-6d885aaa0bd3 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 3f99a221-b8c3-49cf-9077-6d885aaa0bd3 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 079585f8-fc61-43d6-b6d6-11e7dc3366ea | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 079585f8-fc61-43d6-b6d6-11e7dc3366ea | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | dcece261-02ef-45be-8ff0-9f4bc0bcf595 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | dcece261-02ef-45be-8ff0-9f4bc0bcf595 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 0865d7de-c9bc-41ea-a65d-4543514bdce9 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 0865d7de-c9bc-41ea-a65d-4543514bdce9 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | fb9df2b5-beb8-4c2f-b75c-9a09efd931a0 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | fb9df2b5-beb8-4c2f-b75c-9a09efd931a0 | — | — | — | — | passed |
| probe-automation-agent | 200 | 86e1571d-311a-4835-94cc-91dc1d1323c7 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 86e1571d-311a-4835-94cc-91dc1d1323c7 | — | — | — | — | passed |
| chief-route-recovery | 200 | 2b5de9c6-5682-4f8f-bf04-eefce8cabe17 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 2b5de9c6-5682-4f8f-bf04-eefce8cabe17 | — | — | — | — | passed |
| chief-route-task-management | 200 | 9e9f217b-ab47-4558-aedf-6bf8489c2051 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 9e9f217b-ab47-4558-aedf-6bf8489c2051 | — | — | — | — | passed |
| chief-route-reflection | 200 | 11f392c9-5e8a-4848-a1c2-f6a90ea694db | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 11f392c9-5e8a-4848-a1c2-f6a90ea694db | — | — | — | — | passed |
| debug-state-insight | 200 | f8e2100d-de02-429e-97db-f77d843d6d76 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | f8e2100d-de02-429e-97db-f77d843d6d76 | — | — | — | — | passed |
| debug-task-management | 200 | ef514e8d-1c46-475c-b566-b0fb3697a579 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | ef514e8d-1c46-475c-b566-b0fb3697a579 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 5d415307-66ae-45ac-8e99-000302e24d35 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 5d415307-66ae-45ac-8e99-000302e24d35 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | f0396dd7-b84b-499c-bcbd-48b83d8faba5 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | f0396dd7-b84b-499c-bcbd-48b83d8faba5 | — | — | — | — | passed |
| debug-reflection | 200 | 9a26d731-5c58-4e37-9cd2-48e58665c39a | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 9a26d731-5c58-4e37-9cd2-48e58665c39a | — | — | — | — | passed |
| debug-automation | 200 | 6d8f68a7-d20b-4bd3-85a4-2dd3e380cbe3 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 6d8f68a7-d20b-4bd3-85a4-2dd3e380cbe3 | — | — | — | — | passed |
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
| full-regression | 200 | 2faf1a69-4a24-4091-9f24-5abbf7e07777 | — | — | — | — | passed |
| full-regression-trace | 200 | 2faf1a69-4a24-4091-9f24-5abbf7e07777 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | b54c4474-e068-421e-b775-cfbc09e1d167 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | b54c4474-e068-421e-b775-cfbc09e1d167 | — | — | — | — | passed |

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`aligned`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry runtime：`openclaw-local-cluster` / `structured-local-runtime-phase1`
- Registry matched agents：`6/6`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
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
| seed-focus-recovery-loop | 200 | f7d7caa6-9e90-4f5d-acd8-f4e56c28b23b | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | e44fc620-fc45-4267-97b5-7b664a429d9b | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 81a0d113-804f-4c8d-b851-c9b8ca35a8ba | — | — | — | — | passed |
| probe-chief-agent | 200 | 539fc6dd-f49e-4a9b-b418-a4ec997fdb4c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 539fc6dd-f49e-4a9b-b418-a4ec997fdb4c | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 41b1e9a9-fbe0-4789-8235-ead0b9babac1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 41b1e9a9-fbe0-4789-8235-ead0b9babac1 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 0f9a96c0-0bac-47d1-9be1-3675c053bd34 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 0f9a96c0-0bac-47d1-9be1-3675c053bd34 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 34a67ccd-849b-4b11-a4ef-033e12c64cdc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 34a67ccd-849b-4b11-a4ef-033e12c64cdc | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | a2dccddf-7dd8-417c-b9ad-1d96c0439b9a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | a2dccddf-7dd8-417c-b9ad-1d96c0439b9a | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 56024467-effc-4263-8bd7-28a1488100cd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 56024467-effc-4263-8bd7-28a1488100cd | — | — | — | — | passed |
| probe-automation-agent | 200 | db24842d-113d-4f6a-b114-eb524fd91458 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | db24842d-113d-4f6a-b114-eb524fd91458 | — | — | — | — | passed |
| chief-route-recovery | 200 | 9723c0de-7bc7-492c-8255-834aed4cf3bd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 9723c0de-7bc7-492c-8255-834aed4cf3bd | — | — | — | — | passed |
| chief-route-task-management | 200 | 8b8abf12-1dbf-4269-ad0c-4ffc37877ff9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 8b8abf12-1dbf-4269-ad0c-4ffc37877ff9 | — | — | — | — | passed |
| chief-route-reflection | 200 | 874caa06-21cb-4ad3-8610-3db03312731d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 874caa06-21cb-4ad3-8610-3db03312731d | — | — | — | — | passed |
| debug-state-insight | 200 | af136077-ecfe-4052-9106-c14262d1b514 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | af136077-ecfe-4052-9106-c14262d1b514 | — | — | — | — | passed |
| debug-task-management | 200 | be67560d-6523-425d-9be9-377b506e423a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | be67560d-6523-425d-9be9-377b506e423a | — | — | — | — | passed |
| debug-progress-feedback | 200 | bafb1a9b-100d-4d27-8517-dec448f4d1cb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | bafb1a9b-100d-4d27-8517-dec448f4d1cb | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 955a29c6-15bb-4a8a-aaa8-30e56ea4ba9e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 955a29c6-15bb-4a8a-aaa8-30e56ea4ba9e | — | — | — | — | passed |
| debug-reflection | 200 | 3f537f20-8630-4f4c-8a9a-2b8d0d6d183a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 3f537f20-8630-4f4c-8a9a-2b8d0d6d183a | — | — | — | — | passed |
| debug-automation | 200 | 6e61aa6e-bc9a-4121-b56d-933ac789d4aa | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 6e61aa6e-bc9a-4121-b56d-933ac789d4aa | — | — | — | — | passed |
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
| full-regression | 200 | 8f988067-6ccb-4ddf-b791-06f91ab2a071 | — | — | — | — | passed |
| full-regression-trace | 200 | 8f988067-6ccb-4ddf-b791-06f91ab2a071 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 71d6373d-84ad-43fc-aa4a-a2868edb3da8 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 71d6373d-84ad-43fc-aa4a-a2868edb3da8 | — | — | — | — | passed |

