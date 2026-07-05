# Core Phase Test Report

- Started: `2026-03-20T19:10:05.250Z`
- Completed: `2026-03-20T19:11:47.063Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Provider Mode: `mock`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | 57/57 |
| Phase 2 Provider Direct | passed | openai-compatible | — | 71/71 |
| Phase 3 Cluster Preferred | passed | openai-compatible | http://127.0.0.1:8788 | 71/71 |

## Failures

- 无失败记录。

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-20T19-10-05-247Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-20T19-10-05-247Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-20T19-10-05-247Z/responses`

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
| seed-focus-recovery-loop | 200 | de61ce29-3a53-4ac0-9faa-8de10c15b0c5 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 75f1c076-74e7-4e00-85e4-8c450bfc3910 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | f6ea0779-feec-4b2a-a5f2-f83b100624df | — | — | — | — | passed |
| chief-route-recovery | 200 | 61e9ac44-b3c1-45f7-9a6a-f14d65902068 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 61e9ac44-b3c1-45f7-9a6a-f14d65902068 | — | — | — | — | passed |
| chief-route-task-management | 200 | ee2a7a14-acce-45fc-99b8-2b2449dc6d17 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | ee2a7a14-acce-45fc-99b8-2b2449dc6d17 | — | — | — | — | passed |
| chief-route-reflection | 200 | 6b1fd950-c138-4da2-a2ff-1590c2c112f0 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 6b1fd950-c138-4da2-a2ff-1590c2c112f0 | — | — | — | — | passed |
| debug-state-insight | 200 | b29fa88a-4c8d-4ff0-9b6e-dfdc3936fc0a | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | b29fa88a-4c8d-4ff0-9b6e-dfdc3936fc0a | — | — | — | — | passed |
| debug-task-management | 200 | 81c6f0ab-29d2-4c6d-b5bd-1b243c322cce | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 81c6f0ab-29d2-4c6d-b5bd-1b243c322cce | — | — | — | — | passed |
| debug-progress-feedback | 200 | 1ea0eae5-8241-40c4-8056-2f3835e26779 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 1ea0eae5-8241-40c4-8056-2f3835e26779 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 55b9a9a3-4e22-415a-93a9-63c9ad25fe59 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 55b9a9a3-4e22-415a-93a9-63c9ad25fe59 | — | — | — | — | passed |
| debug-reflection | 200 | 506ffa18-3ce2-4448-98d1-76ef05da7b36 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 506ffa18-3ce2-4448-98d1-76ef05da7b36 | — | — | — | — | passed |
| debug-automation | 200 | a5bae92a-b31e-4d9c-be36-49c94d6c6897 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | a5bae92a-b31e-4d9c-be36-49c94d6c6897 | — | — | — | — | passed |
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
| full-regression | 200 | 144541bd-34a2-4b0e-a2bb-2479cd1e147a | — | — | — | — | passed |
| full-regression-trace | 200 | 144541bd-34a2-4b0e-a2bb-2479cd1e147a | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | bd72ea21-f952-4683-bfd1-3f20dfb80726 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | bd72ea21-f952-4683-bfd1-3f20dfb80726 | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`passed`
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
| seed-focus-recovery-loop | 200 | 87bb2330-83d2-45fa-9b05-b8e5d73d32fa | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 09f1370d-1e59-45cb-b5f3-4b075380f5f2 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 67e5f80f-1ab2-4ada-b3c1-f41d8e3828ed | — | — | — | — | passed |
| probe-chief-agent | 200 | a2625174-ea54-4303-98a2-f1e4dd1772ff | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | a2625174-ea54-4303-98a2-f1e4dd1772ff | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 0252fa9f-fb65-470d-abcb-837aa5b59b43 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 0252fa9f-fb65-470d-abcb-837aa5b59b43 | — | — | — | — | passed |
| probe-task-management-agent | 200 | b75de47a-5b72-40d9-bbd5-e0f850237104 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | b75de47a-5b72-40d9-bbd5-e0f850237104 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 11941dca-0523-4797-b4c3-7d420a863ddd | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 11941dca-0523-4797-b4c3-7d420a863ddd | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 85c85142-6711-4bc8-9d72-eed3046be845 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 85c85142-6711-4bc8-9d72-eed3046be845 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 160df759-8d46-485a-a307-c87ff2f8f367 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 160df759-8d46-485a-a307-c87ff2f8f367 | — | — | — | — | passed |
| probe-automation-agent | 200 | 8ba8aa90-ab0f-4019-829e-89856f6c0feb | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 8ba8aa90-ab0f-4019-829e-89856f6c0feb | — | — | — | — | passed |
| chief-route-recovery | 200 | 7d3b8848-1848-4ce7-8717-a750507fdcd3 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 7d3b8848-1848-4ce7-8717-a750507fdcd3 | — | — | — | — | passed |
| chief-route-task-management | 200 | 61b2e63e-ebc4-4935-a14d-490533f49635 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 61b2e63e-ebc4-4935-a14d-490533f49635 | — | — | — | — | passed |
| chief-route-reflection | 200 | 3ab73053-3197-45c3-9636-889835b90756 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 3ab73053-3197-45c3-9636-889835b90756 | — | — | — | — | passed |
| debug-state-insight | 200 | 1dd4bf0a-155e-40a8-beea-945bd70f02ca | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 1dd4bf0a-155e-40a8-beea-945bd70f02ca | — | — | — | — | passed |
| debug-task-management | 200 | 7495b1ed-0f8a-4f6c-bb1a-2688360dd42a | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 7495b1ed-0f8a-4f6c-bb1a-2688360dd42a | — | — | — | — | passed |
| debug-progress-feedback | 200 | 3e4a89c5-8863-4e6d-bc79-a9606ce1d116 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 3e4a89c5-8863-4e6d-bc79-a9606ce1d116 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 84a5f8ef-e889-4c1d-a2c3-27a1142379f4 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 84a5f8ef-e889-4c1d-a2c3-27a1142379f4 | — | — | — | — | passed |
| debug-reflection | 200 | a7ebc90d-d161-4604-bfc4-19edbdee0f97 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | a7ebc90d-d161-4604-bfc4-19edbdee0f97 | — | — | — | — | passed |
| debug-automation | 200 | 942e48de-e827-47e0-944b-5db09fdd6aa9 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 942e48de-e827-47e0-944b-5db09fdd6aa9 | — | — | — | — | passed |
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
| full-regression | 200 | 935df4b8-64eb-468d-b26a-601236c9d4a2 | — | — | — | — | passed |
| full-regression-trace | 200 | 935df4b8-64eb-468d-b26a-601236c9d4a2 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 7bbbf0f1-5b4d-4c95-ac6e-5d11867ab697 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 7bbbf0f1-5b4d-4c95-ac6e-5d11867ab697 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 56ef5513-e562-45bf-adef-6bb22c33c08c | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | c5a2694d-3d0e-46e5-a1cc-cc7280ddbc3d | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | b460af62-39fb-42c9-a8a5-ded9cb1d1899 | — | — | — | — | passed |
| probe-chief-agent | 200 | 8e58b9ad-6a94-40fd-877a-da7748da4ff0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 8e58b9ad-6a94-40fd-877a-da7748da4ff0 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 51ce05d0-185b-4d80-905c-196f04c0ef6c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 51ce05d0-185b-4d80-905c-196f04c0ef6c | — | — | — | — | passed |
| probe-task-management-agent | 200 | b7122664-7b11-47fa-851c-489f09314095 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | b7122664-7b11-47fa-851c-489f09314095 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | a43176bb-7803-4069-9ef6-8537b24e72c5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | a43176bb-7803-4069-9ef6-8537b24e72c5 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | d2ff3eb5-3bdf-412d-8219-0b712322ad91 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | d2ff3eb5-3bdf-412d-8219-0b712322ad91 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | a2eab35b-6198-4958-8388-94611755a367 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | a2eab35b-6198-4958-8388-94611755a367 | — | — | — | — | passed |
| probe-automation-agent | 200 | a9d3281c-587a-4daa-b24e-5b9beb890992 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | a9d3281c-587a-4daa-b24e-5b9beb890992 | — | — | — | — | passed |
| chief-route-recovery | 200 | a64582cd-a875-4ec3-93a6-2a8cea87b9d2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | a64582cd-a875-4ec3-93a6-2a8cea87b9d2 | — | — | — | — | passed |
| chief-route-task-management | 200 | 2c70beaf-b59a-419f-8846-7085e704a111 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 2c70beaf-b59a-419f-8846-7085e704a111 | — | — | — | — | passed |
| chief-route-reflection | 200 | 0cfac616-abc2-4ac3-aa45-5d01d3d872ab | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 0cfac616-abc2-4ac3-aa45-5d01d3d872ab | — | — | — | — | passed |
| debug-state-insight | 200 | 593ca9e1-13c6-4f71-86b2-d2f0b4b5c98d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 593ca9e1-13c6-4f71-86b2-d2f0b4b5c98d | — | — | — | — | passed |
| debug-task-management | 200 | 8d012e90-af4b-47b7-8bbe-b2e8e8f50800 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 8d012e90-af4b-47b7-8bbe-b2e8e8f50800 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 4b9503dc-1ebc-4669-a869-66d1dfa5a71a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 4b9503dc-1ebc-4669-a869-66d1dfa5a71a | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 6d887e7f-f5bb-474e-8052-31febf97ddd3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 6d887e7f-f5bb-474e-8052-31febf97ddd3 | — | — | — | — | passed |
| debug-reflection | 200 | d38395a0-b485-4ea2-867e-c201839c3dcc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | d38395a0-b485-4ea2-867e-c201839c3dcc | — | — | — | — | passed |
| debug-automation | 200 | 36087a3d-40a7-4690-a82d-df46c36223c2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 36087a3d-40a7-4690-a82d-df46c36223c2 | — | — | — | — | passed |
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
| full-regression | 200 | e570b05c-50d6-48dd-add6-c330d06ec25a | — | — | — | — | passed |
| full-regression-trace | 200 | e570b05c-50d6-48dd-add6-c330d06ec25a | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | dde84992-3b19-4f2a-b8f1-83ff6c26f905 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | dde84992-3b19-4f2a-b8f1-83ff6c26f905 | — | — | — | — | passed |

