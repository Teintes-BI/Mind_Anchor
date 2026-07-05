# Core Phase Test Report

- Started: `2026-03-20T19:32:59.943Z`
- Completed: `2026-03-20T19:34:41.673Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-20T19-32-59-942Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-20T19-32-59-942Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-20T19-32-59-942Z/responses`

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
| seed-focus-recovery-loop | 200 | bc9af0b5-10f6-4dbc-8ccc-62f1ae3bc785 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | b95859c2-4093-48c7-ba02-4893e69d0ae4 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | e186d9e1-d7dd-469d-8bbe-6cad2544583c | — | — | — | — | passed |
| chief-route-recovery | 200 | af1157ed-4128-49c0-8ffe-195444a1ef56 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | af1157ed-4128-49c0-8ffe-195444a1ef56 | — | — | — | — | passed |
| chief-route-task-management | 200 | fe0c294d-a905-42a2-8405-bf0f500395cf | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | fe0c294d-a905-42a2-8405-bf0f500395cf | — | — | — | — | passed |
| chief-route-reflection | 200 | a3421dae-0236-4c3a-8136-bbc6c34559a2 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | a3421dae-0236-4c3a-8136-bbc6c34559a2 | — | — | — | — | passed |
| debug-state-insight | 200 | 2d3d6e9f-a48e-468c-b803-70286b9d108d | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 2d3d6e9f-a48e-468c-b803-70286b9d108d | — | — | — | — | passed |
| debug-task-management | 200 | aff19217-a81b-492e-b5d1-42405f042ec9 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | aff19217-a81b-492e-b5d1-42405f042ec9 | — | — | — | — | passed |
| debug-progress-feedback | 200 | c801da05-fec9-4300-bf83-4289c19f1bf6 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | c801da05-fec9-4300-bf83-4289c19f1bf6 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 98909b90-5b9b-4300-85b2-b2ce5950a9bb | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 98909b90-5b9b-4300-85b2-b2ce5950a9bb | — | — | — | — | passed |
| debug-reflection | 200 | 736d24a9-0b0e-49f4-8c5a-f2a0ffbcf202 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 736d24a9-0b0e-49f4-8c5a-f2a0ffbcf202 | — | — | — | — | passed |
| debug-automation | 200 | 83c02898-5d20-4866-b4a8-b27119319391 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 83c02898-5d20-4866-b4a8-b27119319391 | — | — | — | — | passed |
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
| full-regression | 200 | 5ab620b6-9f43-411e-b253-059bfc1c427c | — | — | — | — | passed |
| full-regression-trace | 200 | 5ab620b6-9f43-411e-b253-059bfc1c427c | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 8b80cfae-f891-4f8b-8956-e6461736201c | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 8b80cfae-f891-4f8b-8956-e6461736201c | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | cccb163c-e4bb-481d-a412-ce70880be6f4 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | f04e3f68-8801-4a3d-8051-8c56299513ce | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 46e3a603-cd91-4dc7-aebc-f427327277fa | — | — | — | — | passed |
| probe-chief-agent | 200 | 298ee1d4-5dd1-4889-b930-46a3e377c302 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 298ee1d4-5dd1-4889-b930-46a3e377c302 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 94ca6597-7f5e-49fd-ab0b-ad394035951e | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 94ca6597-7f5e-49fd-ab0b-ad394035951e | — | — | — | — | passed |
| probe-task-management-agent | 200 | 4ccc8cbb-1ab1-4ebe-ae6a-9ccb4aa1bf3c | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 4ccc8cbb-1ab1-4ebe-ae6a-9ccb4aa1bf3c | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | ad24c03a-db46-4322-a95a-ce67bf5cdd4a | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | ad24c03a-db46-4322-a95a-ce67bf5cdd4a | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 36b2ce01-0a29-46d3-abc6-70a619d15ffd | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 36b2ce01-0a29-46d3-abc6-70a619d15ffd | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 4c20a1be-5c91-47bc-ab04-6f6b293c761f | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 4c20a1be-5c91-47bc-ab04-6f6b293c761f | — | — | — | — | passed |
| probe-automation-agent | 200 | 32b07215-719a-4fdb-9e94-07a6d054d8d2 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 32b07215-719a-4fdb-9e94-07a6d054d8d2 | — | — | — | — | passed |
| chief-route-recovery | 200 | 4a669cb1-ebb0-4791-b09c-723287f2cb7e | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 4a669cb1-ebb0-4791-b09c-723287f2cb7e | — | — | — | — | passed |
| chief-route-task-management | 200 | 957ed334-08d9-46f4-a39d-243011c21ff7 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 957ed334-08d9-46f4-a39d-243011c21ff7 | — | — | — | — | passed |
| chief-route-reflection | 200 | d4594d87-006a-44de-adee-5c2906fa4dbc | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | d4594d87-006a-44de-adee-5c2906fa4dbc | — | — | — | — | passed |
| debug-state-insight | 200 | a73a128d-5a3b-4ce6-8c33-84d9bbc65020 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | a73a128d-5a3b-4ce6-8c33-84d9bbc65020 | — | — | — | — | passed |
| debug-task-management | 200 | 10aefcb7-eda9-4754-af54-7ddc0b664f91 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 10aefcb7-eda9-4754-af54-7ddc0b664f91 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 9959e6c3-8094-4fdb-889a-09a0556f4d43 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 9959e6c3-8094-4fdb-889a-09a0556f4d43 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 07ce4c69-e9c2-4f3f-9d66-3aec08999230 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 07ce4c69-e9c2-4f3f-9d66-3aec08999230 | — | — | — | — | passed |
| debug-reflection | 200 | 6b7c612a-336a-4609-8b9d-ba1adaddebc4 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 6b7c612a-336a-4609-8b9d-ba1adaddebc4 | — | — | — | — | passed |
| debug-automation | 200 | 73abeda7-840d-46ea-a6fb-f6d25652d195 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 73abeda7-840d-46ea-a6fb-f6d25652d195 | — | — | — | — | passed |
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
| full-regression | 200 | 89c8a181-23c2-4836-837c-e23e909d4178 | — | — | — | — | passed |
| full-regression-trace | 200 | 89c8a181-23c2-4836-837c-e23e909d4178 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | d6c107a8-9a19-42ea-b5b9-954e796f8a14 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | d6c107a8-9a19-42ea-b5b9-954e796f8a14 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 69495c64-9d2f-4899-9264-ca03e9702a9c | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 51a2b7a4-fffe-4869-a48c-abad9e529bc2 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | b0e0271f-08a7-4bb1-8d29-b201d08654f5 | — | — | — | — | passed |
| probe-chief-agent | 200 | 71ce37dd-46ff-4757-b6e1-9408b44b6743 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 71ce37dd-46ff-4757-b6e1-9408b44b6743 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 630049a1-3c43-493e-aa66-6a0a64d49565 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 630049a1-3c43-493e-aa66-6a0a64d49565 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 6c82680e-8c21-4236-9d3e-1ecd5f61b7f6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 6c82680e-8c21-4236-9d3e-1ecd5f61b7f6 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | fe60a950-a150-4df3-94ff-31cba2a0a874 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | fe60a950-a150-4df3-94ff-31cba2a0a874 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 9164c5d2-23b3-4356-8f78-aad6e4cbb173 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 9164c5d2-23b3-4356-8f78-aad6e4cbb173 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | d9d0e756-3051-409a-b2f1-784ff467c32d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | d9d0e756-3051-409a-b2f1-784ff467c32d | — | — | — | — | passed |
| probe-automation-agent | 200 | 23949623-337c-477a-9adc-7c188a4aa913 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 23949623-337c-477a-9adc-7c188a4aa913 | — | — | — | — | passed |
| chief-route-recovery | 200 | 101278d5-b1d8-4a3a-aeec-8aea678f002d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 101278d5-b1d8-4a3a-aeec-8aea678f002d | — | — | — | — | passed |
| chief-route-task-management | 200 | 4d9da27e-ebb4-4b17-b43a-5b59d8b45602 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 4d9da27e-ebb4-4b17-b43a-5b59d8b45602 | — | — | — | — | passed |
| chief-route-reflection | 200 | 05296622-55eb-418e-81bf-00fa56c211f9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 05296622-55eb-418e-81bf-00fa56c211f9 | — | — | — | — | passed |
| debug-state-insight | 200 | 69a51782-7348-4b90-bf8c-fe83f046ff8d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 69a51782-7348-4b90-bf8c-fe83f046ff8d | — | — | — | — | passed |
| debug-task-management | 200 | 6d6710da-8886-4bf9-926b-1cccd65ea219 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 6d6710da-8886-4bf9-926b-1cccd65ea219 | — | — | — | — | passed |
| debug-progress-feedback | 200 | ccf800d4-419d-4e8f-ba37-976e9ce1b744 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | ccf800d4-419d-4e8f-ba37-976e9ce1b744 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 471e4c5f-3891-4e08-b6e8-01baf243b486 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 471e4c5f-3891-4e08-b6e8-01baf243b486 | — | — | — | — | passed |
| debug-reflection | 200 | 8ee6a841-c1fa-44b7-85b8-c7097c058b86 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 8ee6a841-c1fa-44b7-85b8-c7097c058b86 | — | — | — | — | passed |
| debug-automation | 200 | 7be94e3e-a33d-4a15-ad7b-c55edf074ffc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 7be94e3e-a33d-4a15-ad7b-c55edf074ffc | — | — | — | — | passed |
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
| full-regression | 200 | ff2cf1aa-39a5-4809-ad2f-0cc2dba6a948 | — | — | — | — | passed |
| full-regression-trace | 200 | ff2cf1aa-39a5-4809-ad2f-0cc2dba6a948 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 717f38e2-83ed-4ac7-8754-8ea52cca0d5d | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 717f38e2-83ed-4ac7-8754-8ea52cca0d5d | — | — | — | — | passed |

