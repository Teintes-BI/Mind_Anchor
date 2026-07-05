# Core Phase Test Report

- Started: `2026-03-19T16:30:46.131Z`
- Completed: `2026-03-19T16:32:28.636Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-19T16-30-46-131Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-19T16-30-46-131Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-19T16-30-46-131Z/responses`

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
| seed-focus-recovery-loop | 200 | abbb4257-6123-4bbd-a9c7-40f54027f17f | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 7458368a-bf30-4212-8497-067aef6a669e | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | c8a274fd-6316-4b4f-b0dc-48c8ff8934ce | — | — | — | — | passed |
| chief-route-recovery | 200 | 7f753176-4c41-4dcd-8676-f4022ac447c8 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 7f753176-4c41-4dcd-8676-f4022ac447c8 | — | — | — | — | passed |
| chief-route-task-management | 200 | c2cbd954-e973-4d0c-879f-e98d0faebac2 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | c2cbd954-e973-4d0c-879f-e98d0faebac2 | — | — | — | — | passed |
| chief-route-reflection | 200 | 526f8071-b436-45c7-97c3-662d3196cced | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 526f8071-b436-45c7-97c3-662d3196cced | — | — | — | — | passed |
| debug-state-insight | 200 | 908bdb1e-c69f-4fe6-904d-e5187e1cec7a | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 908bdb1e-c69f-4fe6-904d-e5187e1cec7a | — | — | — | — | passed |
| debug-task-management | 200 | 09f86c45-40e1-4cd6-abbf-75fb9a2f318f | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 09f86c45-40e1-4cd6-abbf-75fb9a2f318f | — | — | — | — | passed |
| debug-progress-feedback | 200 | 0df074ce-5365-46f3-857d-6e56490e3890 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 0df074ce-5365-46f3-857d-6e56490e3890 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | b1f4e8f5-cf2a-4744-b6b2-d49d54bae3f6 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | b1f4e8f5-cf2a-4744-b6b2-d49d54bae3f6 | — | — | — | — | passed |
| debug-reflection | 200 | 34dfc8c2-d0e2-41c6-bb94-95769f734cd1 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 34dfc8c2-d0e2-41c6-bb94-95769f734cd1 | — | — | — | — | passed |
| debug-automation | 200 | 11d0f9d5-85e7-4fb9-a07d-0fa1f8f1e716 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 11d0f9d5-85e7-4fb9-a07d-0fa1f8f1e716 | — | — | — | — | passed |
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
| full-regression | 200 | f4c11ab4-ccc6-4fd4-80ea-8fa3531ed83f | — | — | — | — | passed |
| full-regression-trace | 200 | f4c11ab4-ccc6-4fd4-80ea-8fa3531ed83f | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 99ff354c-188a-487a-964c-56c4b4e8219c | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 99ff354c-188a-487a-964c-56c4b4e8219c | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 52b95da0-35ef-4c86-b489-668af9326b02 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | bc86cc47-9d36-4dfb-8787-3941543a6aa9 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 770cdc4d-c712-4cca-b719-104d17ce8b78 | — | — | — | — | passed |
| probe-chief-agent | 200 | c70ef8c3-084b-4ac7-bf1a-b630c319dffc | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | c70ef8c3-084b-4ac7-bf1a-b630c319dffc | — | — | — | — | passed |
| probe-state-insight-agent | 200 | ac9ac317-580d-429d-81aa-953faa423c91 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | ac9ac317-580d-429d-81aa-953faa423c91 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 1ccc9bd3-cdfe-43aa-b071-283d3be99ca6 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 1ccc9bd3-cdfe-43aa-b071-283d3be99ca6 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | b084a5c0-2341-41a2-b263-5f7ba907240d | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | b084a5c0-2341-41a2-b263-5f7ba907240d | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 441702fb-5437-46ba-ab5f-b593818390f6 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 441702fb-5437-46ba-ab5f-b593818390f6 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | c3a78e1f-2a38-44a0-ba2b-4543b936848f | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | c3a78e1f-2a38-44a0-ba2b-4543b936848f | — | — | — | — | passed |
| probe-automation-agent | 200 | f1ac5b9a-4d9f-4701-8b98-1f5841203466 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | f1ac5b9a-4d9f-4701-8b98-1f5841203466 | — | — | — | — | passed |
| chief-route-recovery | 200 | 907bc71c-9834-4924-81ef-929c77d349ca | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 907bc71c-9834-4924-81ef-929c77d349ca | — | — | — | — | passed |
| chief-route-task-management | 200 | 1e70ac1e-1c9b-429e-9254-e07db8ab5b69 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 1e70ac1e-1c9b-429e-9254-e07db8ab5b69 | — | — | — | — | passed |
| chief-route-reflection | 200 | a6716281-3b7f-43b7-83c9-80f39653a046 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | a6716281-3b7f-43b7-83c9-80f39653a046 | — | — | — | — | passed |
| debug-state-insight | 200 | 3a5b08b7-3d6b-4b58-9996-45137d14e7a6 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 3a5b08b7-3d6b-4b58-9996-45137d14e7a6 | — | — | — | — | passed |
| debug-task-management | 200 | ba1e3c3a-e5da-4b8d-8a2f-92eeaa38d0e0 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | ba1e3c3a-e5da-4b8d-8a2f-92eeaa38d0e0 | — | — | — | — | passed |
| debug-progress-feedback | 200 | a926035f-0b9c-4240-9473-d99acd9fa4f1 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | a926035f-0b9c-4240-9473-d99acd9fa4f1 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | f024b1d1-8aa2-4d81-8852-c213ff9c22ca | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | f024b1d1-8aa2-4d81-8852-c213ff9c22ca | — | — | — | — | passed |
| debug-reflection | 200 | 31f2b9ba-fd2c-4f70-b778-7d6aa845494e | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 31f2b9ba-fd2c-4f70-b778-7d6aa845494e | — | — | — | — | passed |
| debug-automation | 200 | 9b728bab-2a90-49ee-9710-33a22c786774 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 9b728bab-2a90-49ee-9710-33a22c786774 | — | — | — | — | passed |
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
| full-regression | 200 | a41e859f-0820-4ab9-970f-9c93411bd29e | — | — | — | — | passed |
| full-regression-trace | 200 | a41e859f-0820-4ab9-970f-9c93411bd29e | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | c915de34-65fe-455b-a70d-1692310ebeb9 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | c915de34-65fe-455b-a70d-1692310ebeb9 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | a893e7fc-fbbc-4b57-bf0f-8d1813410d65 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 2c7e8525-6cb4-4501-89ce-51976231eb5d | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | ae803583-12cd-4646-b59b-9eb9794785ad | — | — | — | — | passed |
| probe-chief-agent | 200 | 321bb289-5cab-40e9-ab04-0db8848f7742 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 321bb289-5cab-40e9-ab04-0db8848f7742 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 4fe7f640-0786-41e0-b025-919772ef6fe5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 4fe7f640-0786-41e0-b025-919772ef6fe5 | — | — | — | — | passed |
| probe-task-management-agent | 200 | b798d076-6679-42d2-9cb7-50dfec3686b4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | b798d076-6679-42d2-9cb7-50dfec3686b4 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 72f3f89f-536d-41bf-9b85-256866469d51 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 72f3f89f-536d-41bf-9b85-256866469d51 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 663ebbd6-2840-4a7f-8711-95439cf87eed | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 663ebbd6-2840-4a7f-8711-95439cf87eed | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 6a1ea79f-846c-4270-b69e-416941e83f92 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 6a1ea79f-846c-4270-b69e-416941e83f92 | — | — | — | — | passed |
| probe-automation-agent | 200 | 6cf66416-cd55-44c0-8225-e74aed5ab1b5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 6cf66416-cd55-44c0-8225-e74aed5ab1b5 | — | — | — | — | passed |
| chief-route-recovery | 200 | d30e6a04-47bf-462e-bd47-5ae4a35abbee | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | d30e6a04-47bf-462e-bd47-5ae4a35abbee | — | — | — | — | passed |
| chief-route-task-management | 200 | c26cac80-19f0-490f-8439-263af3cdf156 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | c26cac80-19f0-490f-8439-263af3cdf156 | — | — | — | — | passed |
| chief-route-reflection | 200 | 3b8a5d15-aaf3-489d-a3f0-2b7a85b2275a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 3b8a5d15-aaf3-489d-a3f0-2b7a85b2275a | — | — | — | — | passed |
| debug-state-insight | 200 | b3691f72-ad7d-47b9-9295-d1510628c532 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | b3691f72-ad7d-47b9-9295-d1510628c532 | — | — | — | — | passed |
| debug-task-management | 200 | 5cf6ef74-8566-4fc6-9018-8cbcefaf3f77 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 5cf6ef74-8566-4fc6-9018-8cbcefaf3f77 | — | — | — | — | passed |
| debug-progress-feedback | 200 | c1d22e55-b143-44ae-97c1-65750c440a14 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | c1d22e55-b143-44ae-97c1-65750c440a14 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 6cba2be7-265d-43bd-be73-fef5c52f9823 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 6cba2be7-265d-43bd-be73-fef5c52f9823 | — | — | — | — | passed |
| debug-reflection | 200 | cfcb1963-458d-45cc-99aa-578f99354f24 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | cfcb1963-458d-45cc-99aa-578f99354f24 | — | — | — | — | passed |
| debug-automation | 200 | 8bdede6f-615e-46dd-a64d-d27d8cd76a6d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 8bdede6f-615e-46dd-a64d-d27d8cd76a6d | — | — | — | — | passed |
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
| full-regression | 200 | 429538f9-c4c7-4a39-9285-e3a3b0f215b6 | — | — | — | — | passed |
| full-regression-trace | 200 | 429538f9-c4c7-4a39-9285-e3a3b0f215b6 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 9d603b9a-5ea5-487c-b4fb-e634ede61614 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 9d603b9a-5ea5-487c-b4fb-e634ede61614 | — | — | — | — | passed |

