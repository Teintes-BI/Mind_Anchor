# Core Phase Test Report

- Started: `2026-03-19T16:21:55.285Z`
- Completed: `2026-03-19T16:23:38.912Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-19T16-21-55-283Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-19T16-21-55-283Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-19T16-21-55-283Z/responses`

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
| seed-focus-recovery-loop | 200 | 1a16ff37-2ca1-416f-bd6d-79cdd2946121 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 8dc6d6f0-8f71-4418-bcbc-a2a3e01d17e7 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 22486dc7-dca0-4bc8-bb6d-0823cdf0ebf4 | — | — | — | — | passed |
| chief-route-recovery | 200 | 26307702-ce0e-4175-ad5a-d8b5912157a8 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 26307702-ce0e-4175-ad5a-d8b5912157a8 | — | — | — | — | passed |
| chief-route-task-management | 200 | 365d6881-be78-4595-bf66-c0faa141cca2 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 365d6881-be78-4595-bf66-c0faa141cca2 | — | — | — | — | passed |
| chief-route-reflection | 200 | 2583f014-22cc-4c93-bea0-b9df53677dad | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 2583f014-22cc-4c93-bea0-b9df53677dad | — | — | — | — | passed |
| debug-state-insight | 200 | ce620821-64c2-4b91-890e-a95178da8ccc | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | ce620821-64c2-4b91-890e-a95178da8ccc | — | — | — | — | passed |
| debug-task-management | 200 | 4d46e7aa-240c-42b7-9b87-9115b7c256b7 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 4d46e7aa-240c-42b7-9b87-9115b7c256b7 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 00ca1ba7-ac68-4649-84ef-23790b14ad7a | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 00ca1ba7-ac68-4649-84ef-23790b14ad7a | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 044f6b56-ce63-46b0-a891-179c7956fe96 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 044f6b56-ce63-46b0-a891-179c7956fe96 | — | — | — | — | passed |
| debug-reflection | 200 | 76d1af80-e1d1-4278-b9f1-dc01cc08f3aa | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 76d1af80-e1d1-4278-b9f1-dc01cc08f3aa | — | — | — | — | passed |
| debug-automation | 200 | 8f1ee198-d679-492f-9769-fea4d1e086c3 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 8f1ee198-d679-492f-9769-fea4d1e086c3 | — | — | — | — | passed |
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
| full-regression | 200 | 2b52c3c5-a266-432d-905f-57d8da7320bf | — | — | — | — | passed |
| full-regression-trace | 200 | 2b52c3c5-a266-432d-905f-57d8da7320bf | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 6f7876ef-b33e-4abd-8d9f-548c99b8b4c2 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 6f7876ef-b33e-4abd-8d9f-548c99b8b4c2 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 40338c73-d8ca-488e-abc4-c66e7c1769bd | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 92183a71-b5ac-4203-ac3e-9fed37cc7e3d | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 961869bb-4401-4a4c-8297-d4a5737274ef | — | — | — | — | passed |
| probe-chief-agent | 200 | 6b347638-dea1-4041-b0ba-54252ed1fa1b | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 6b347638-dea1-4041-b0ba-54252ed1fa1b | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 2defcb48-4197-42a8-880f-c35b35f8648d | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 2defcb48-4197-42a8-880f-c35b35f8648d | — | — | — | — | passed |
| probe-task-management-agent | 200 | eda75f79-5e0b-450e-b60d-427b6696720a | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | eda75f79-5e0b-450e-b60d-427b6696720a | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | a8e3a0da-2dff-4670-90b2-aa41c5d30822 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | a8e3a0da-2dff-4670-90b2-aa41c5d30822 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | e9498071-b828-44f8-9e93-74f31f2fd49d | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | e9498071-b828-44f8-9e93-74f31f2fd49d | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | d8627a46-038d-4d9c-a7f8-cd5b42a411fd | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | d8627a46-038d-4d9c-a7f8-cd5b42a411fd | — | — | — | — | passed |
| probe-automation-agent | 200 | 62723869-dd3e-4356-9f7a-94fcbf9fb8d9 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 62723869-dd3e-4356-9f7a-94fcbf9fb8d9 | — | — | — | — | passed |
| chief-route-recovery | 200 | 495796bf-b9d5-4549-b077-4bbd58e480ee | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 495796bf-b9d5-4549-b077-4bbd58e480ee | — | — | — | — | passed |
| chief-route-task-management | 200 | d60abd54-f3f1-469b-936e-e8b6a44ea69b | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | d60abd54-f3f1-469b-936e-e8b6a44ea69b | — | — | — | — | passed |
| chief-route-reflection | 200 | d17644ce-0667-4ced-9461-b22697c62b8a | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | d17644ce-0667-4ced-9461-b22697c62b8a | — | — | — | — | passed |
| debug-state-insight | 200 | c3708c65-d6cb-4f68-b5a5-6579ca660f42 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | c3708c65-d6cb-4f68-b5a5-6579ca660f42 | — | — | — | — | passed |
| debug-task-management | 200 | 94163725-f1b3-4f8a-b494-7e16d19a3a58 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 94163725-f1b3-4f8a-b494-7e16d19a3a58 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 3cd60c2b-3f1c-46f4-816b-284853bfe57e | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 3cd60c2b-3f1c-46f4-816b-284853bfe57e | — | — | — | — | passed |
| debug-interruption-recovery | 200 | fff05293-a64b-4aad-a554-1aefdde39ca1 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | fff05293-a64b-4aad-a554-1aefdde39ca1 | — | — | — | — | passed |
| debug-reflection | 200 | 539dad17-003d-42bc-8dd5-5a2e8693d16f | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 539dad17-003d-42bc-8dd5-5a2e8693d16f | — | — | — | — | passed |
| debug-automation | 200 | 21b5b1e6-a71a-4c78-b410-a099ca3cb795 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 21b5b1e6-a71a-4c78-b410-a099ca3cb795 | — | — | — | — | passed |
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
| full-regression | 200 | d7e85c51-059d-4112-b071-1bd2ec81fa61 | — | — | — | — | passed |
| full-regression-trace | 200 | d7e85c51-059d-4112-b071-1bd2ec81fa61 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | f38fabdb-6d14-4e43-9d40-6dee2e419b83 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | f38fabdb-6d14-4e43-9d40-6dee2e419b83 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 5ff40a58-93d2-43a3-b499-6a276ff0bb19 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | e2f58835-1f22-4d2c-a762-0cb65b275f68 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 198ae202-5f72-4c6c-9d50-4e57a4bcc865 | — | — | — | — | passed |
| probe-chief-agent | 200 | fb92c54a-453b-4ca9-a1d9-306543d2ad15 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | fb92c54a-453b-4ca9-a1d9-306543d2ad15 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | d96da047-b326-489f-af4b-b6c47b070a95 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | d96da047-b326-489f-af4b-b6c47b070a95 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 544b576d-01e1-4c14-a9ae-410e6752af8b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 544b576d-01e1-4c14-a9ae-410e6752af8b | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | eacd7788-40ca-4398-aa21-6f79f068de56 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | eacd7788-40ca-4398-aa21-6f79f068de56 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 2106e936-fb78-4b77-b248-2878f746eee7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 2106e936-fb78-4b77-b248-2878f746eee7 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | d4c6d68c-a431-4635-9c70-bb2dc1cd9a7a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | d4c6d68c-a431-4635-9c70-bb2dc1cd9a7a | — | — | — | — | passed |
| probe-automation-agent | 200 | 53f106bf-3e9c-471e-945f-14a7d5946e40 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 53f106bf-3e9c-471e-945f-14a7d5946e40 | — | — | — | — | passed |
| chief-route-recovery | 200 | d00c346f-49aa-4bca-96c6-f8a5b7bf4273 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | d00c346f-49aa-4bca-96c6-f8a5b7bf4273 | — | — | — | — | passed |
| chief-route-task-management | 200 | a7fca815-4275-424e-ae6a-e00bdd5a86a2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | a7fca815-4275-424e-ae6a-e00bdd5a86a2 | — | — | — | — | passed |
| chief-route-reflection | 200 | e969e7ee-7352-477b-8266-bac6d3989787 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | e969e7ee-7352-477b-8266-bac6d3989787 | — | — | — | — | passed |
| debug-state-insight | 200 | 09d1872d-2893-4ca9-9eaf-4d281ac923e0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 09d1872d-2893-4ca9-9eaf-4d281ac923e0 | — | — | — | — | passed |
| debug-task-management | 200 | 1dd00cd4-1683-4268-8666-d1948785dee6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 1dd00cd4-1683-4268-8666-d1948785dee6 | — | — | — | — | passed |
| debug-progress-feedback | 200 | d52eecad-b6e9-410a-98fd-0494a2b5b9e1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | d52eecad-b6e9-410a-98fd-0494a2b5b9e1 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 4ca05c71-c914-4162-b699-c8f355c3ef3a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 4ca05c71-c914-4162-b699-c8f355c3ef3a | — | — | — | — | passed |
| debug-reflection | 200 | 99161caf-06d7-4f9f-a470-ea5442f4c31e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 99161caf-06d7-4f9f-a470-ea5442f4c31e | — | — | — | — | passed |
| debug-automation | 200 | a3e27582-d990-4695-8f2f-e279b015ca96 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | a3e27582-d990-4695-8f2f-e279b015ca96 | — | — | — | — | passed |
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
| full-regression | 200 | d3642f03-d425-40ae-a165-a2f27d2a4dde | — | — | — | — | passed |
| full-regression-trace | 200 | d3642f03-d425-40ae-a165-a2f27d2a4dde | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 83bd6752-6eb9-4c9b-8a95-720900b79af0 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 83bd6752-6eb9-4c9b-8a95-720900b79af0 | — | — | — | — | passed |

