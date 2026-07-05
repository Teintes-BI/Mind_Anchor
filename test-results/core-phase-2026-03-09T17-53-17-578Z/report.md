# Core Phase Test Report

- Started: `2026-03-09T17:53:17.580Z`
- Completed: `2026-03-09T18:20:17.891Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | 57/57 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 65/66 |
| Phase 3 Cluster Preferred | passed | openai-compatible | http://127.0.0.1:8788 | 71/71 |

## Failures

- [provider-direct] full-regression: fetch failed
- [provider-direct] provider-direct-phase: fetch failed

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T17-53-17-578Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T17-53-17-578Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T17-53-17-578Z/responses`

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
| seed-focus-recovery-loop | 200 | 36ef4159-2cfa-456c-8a85-3c6e949515f9 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | feb133dc-ad9f-40fa-afa9-1fee935e3894 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 324e9dc7-1671-4618-8cba-f24ee7ea6b46 | — | — | — | — | passed |
| chief-route-recovery | 200 | b0d5a429-da75-40d0-ae0e-f92bfc01b1e2 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | b0d5a429-da75-40d0-ae0e-f92bfc01b1e2 | — | — | — | — | passed |
| chief-route-task-management | 200 | b27122ff-7eba-4ae4-9d88-b4f9507d3486 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | b27122ff-7eba-4ae4-9d88-b4f9507d3486 | — | — | — | — | passed |
| chief-route-reflection | 200 | 7cd97bf8-7bae-4df3-9251-6aa28924331d | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 7cd97bf8-7bae-4df3-9251-6aa28924331d | — | — | — | — | passed |
| debug-state-insight | 200 | cb3e6d47-9c01-4921-aa29-baca8c470747 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | cb3e6d47-9c01-4921-aa29-baca8c470747 | — | — | — | — | passed |
| debug-task-management | 200 | 68ef5b72-c5c9-4515-b0cf-81f870f38319 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 68ef5b72-c5c9-4515-b0cf-81f870f38319 | — | — | — | — | passed |
| debug-progress-feedback | 200 | d43a4c85-1417-45f5-a766-737604f77534 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | d43a4c85-1417-45f5-a766-737604f77534 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 88dc1241-1af6-49c4-8160-cfd7810fe51f | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 88dc1241-1af6-49c4-8160-cfd7810fe51f | — | — | — | — | passed |
| debug-reflection | 200 | 0f613bf9-b26a-46ac-be6c-48364aee008f | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 0f613bf9-b26a-46ac-be6c-48364aee008f | — | — | — | — | passed |
| debug-automation | 200 | b7b417f2-8b9c-407d-97bf-454c63fb6e97 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | b7b417f2-8b9c-407d-97bf-454c63fb6e97 | — | — | — | — | passed |
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
| full-regression | 200 | bd16bcd8-3f7a-4e9d-8373-e085b26b46d6 | — | — | — | — | passed |
| full-regression-trace | 200 | bd16bcd8-3f7a-4e9d-8373-e085b26b46d6 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | be27432b-3e22-473b-828f-4af1dadc0041 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | be27432b-3e22-473b-828f-4af1dadc0041 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | b83278da-e663-4758-846c-edf5a937de52 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | e59866aa-9e23-4648-83b5-698ebba2c793 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 132317cd-ed01-4d20-8f4c-dca7fe940439 | — | — | — | — | passed |
| probe-chief-agent | 200 | 9983ac40-bb75-445b-937f-6fa4fc7027e5 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 9983ac40-bb75-445b-937f-6fa4fc7027e5 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 53634074-b975-43c0-9cab-fa62ef85554a | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 53634074-b975-43c0-9cab-fa62ef85554a | — | — | — | — | passed |
| probe-task-management-agent | 200 | 5c3142b2-b41b-4985-a621-420f233b5020 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 5c3142b2-b41b-4985-a621-420f233b5020 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | b4d11285-7cb2-453e-ab5c-92a3e7a1b7df | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | b4d11285-7cb2-453e-ab5c-92a3e7a1b7df | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 5d7a2f50-0c0f-4dc1-aecf-67a2e8990c80 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 5d7a2f50-0c0f-4dc1-aecf-67a2e8990c80 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | c3c20154-4f91-43d0-b956-b7d8eab059b9 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | c3c20154-4f91-43d0-b956-b7d8eab059b9 | — | — | — | — | passed |
| probe-automation-agent | 200 | bc73be82-7e6a-46d1-aaec-d18fbeec5f47 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | bc73be82-7e6a-46d1-aaec-d18fbeec5f47 | — | — | — | — | passed |
| chief-route-recovery | 200 | 96e1d9c0-6ad4-4f57-9e47-46c57f93175c | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 96e1d9c0-6ad4-4f57-9e47-46c57f93175c | — | — | — | — | passed |
| chief-route-task-management | 200 | 54bc3ba2-b6c6-4506-be72-2b5dfb71c579 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 54bc3ba2-b6c6-4506-be72-2b5dfb71c579 | — | — | — | — | passed |
| chief-route-reflection | 200 | e20e8642-9f97-4eac-a01c-f82ed3a3b76c | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | e20e8642-9f97-4eac-a01c-f82ed3a3b76c | — | — | — | — | passed |
| debug-state-insight | 200 | 5a180bea-3a90-46c4-b762-6e056b2cf07d | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 5a180bea-3a90-46c4-b762-6e056b2cf07d | — | — | — | — | passed |
| debug-task-management | 200 | 4455e0dd-1262-45cf-9814-65ce03e69683 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 4455e0dd-1262-45cf-9814-65ce03e69683 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 8666ce3b-e4b7-40e4-89f1-81b5358c5df6 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 8666ce3b-e4b7-40e4-89f1-81b5358c5df6 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 26d9d8d2-46f4-4067-ade1-295c33c7a89a | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 26d9d8d2-46f4-4067-ade1-295c33c7a89a | — | — | — | — | passed |
| debug-reflection | 200 | 519edc65-ae71-483f-a7dd-c69526e21567 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 519edc65-ae71-483f-a7dd-c69526e21567 | — | — | — | — | passed |
| debug-automation | 200 | 95d19c31-5980-40e0-8a91-9bb10e8b2eb9 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 95d19c31-5980-40e0-8a91-9bb10e8b2eb9 | — | — | — | — | passed |
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
| full-regression | ERR | — | — | — | — | — | fetch failed |

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
| seed-focus-recovery-loop | 200 | a37d8318-a49b-47d7-b537-cc2f902344cb | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 4a1e3c73-febf-4850-9513-eb58059fc2a7 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 37c7e157-fdfb-4fef-b0aa-e2f753f9c6dd | — | — | — | — | passed |
| probe-chief-agent | 200 | 175a394e-80aa-4aaa-8d4d-65b57980d750 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 175a394e-80aa-4aaa-8d4d-65b57980d750 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 0aec97a0-4995-435c-8c95-e866697b8eda | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 0aec97a0-4995-435c-8c95-e866697b8eda | — | — | — | — | passed |
| probe-task-management-agent | 200 | 107df106-702b-4bf7-94f9-2c4a9949f066 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 107df106-702b-4bf7-94f9-2c4a9949f066 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 325ccf8c-81e8-4dd1-8efa-69eda44fee7a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 325ccf8c-81e8-4dd1-8efa-69eda44fee7a | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | adbb5003-22d1-49f1-ac05-f42b36978791 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | adbb5003-22d1-49f1-ac05-f42b36978791 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 8080cd06-75f5-420d-b042-18f13d6f5c27 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 8080cd06-75f5-420d-b042-18f13d6f5c27 | — | — | — | — | passed |
| probe-automation-agent | 200 | 6518612b-f89f-4262-a983-ca6cdfe66191 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 6518612b-f89f-4262-a983-ca6cdfe66191 | — | — | — | — | passed |
| chief-route-recovery | 200 | d917c814-4a02-4fcd-9ad7-401bbe321027 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | d917c814-4a02-4fcd-9ad7-401bbe321027 | — | — | — | — | passed |
| chief-route-task-management | 200 | cfa72ab9-d9bc-4c9e-ae9e-0ca6555af8a3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | cfa72ab9-d9bc-4c9e-ae9e-0ca6555af8a3 | — | — | — | — | passed |
| chief-route-reflection | 200 | 3a3c60da-ef0c-4bd8-bfb5-f862133e7552 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 3a3c60da-ef0c-4bd8-bfb5-f862133e7552 | — | — | — | — | passed |
| debug-state-insight | 200 | 8906088f-8284-4f8b-b74b-ebb7b0b6dadf | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 8906088f-8284-4f8b-b74b-ebb7b0b6dadf | — | — | — | — | passed |
| debug-task-management | 200 | 7c0efb6e-83df-4684-bba0-aff68f49595f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 7c0efb6e-83df-4684-bba0-aff68f49595f | — | — | — | — | passed |
| debug-progress-feedback | 200 | a4887ad3-4563-4bd4-b7d4-7a4e7b725e9c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | a4887ad3-4563-4bd4-b7d4-7a4e7b725e9c | — | — | — | — | passed |
| debug-interruption-recovery | 200 | cf1fa619-8249-4b43-a739-3109d68403d5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | cf1fa619-8249-4b43-a739-3109d68403d5 | — | — | — | — | passed |
| debug-reflection | 200 | aa0ff633-0e56-4e8e-a1d0-4d3707a97dd8 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | aa0ff633-0e56-4e8e-a1d0-4d3707a97dd8 | — | — | — | — | passed |
| debug-automation | 200 | cec37197-dc2a-4f16-99dc-dee479d4dd3d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | cec37197-dc2a-4f16-99dc-dee479d4dd3d | — | — | — | — | passed |
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
| full-regression | 200 | 3a1f8dd4-a4af-4a0a-b970-6b4fde48b68a | — | — | — | — | passed |
| full-regression-trace | 200 | 3a1f8dd4-a4af-4a0a-b970-6b4fde48b68a | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 0e82c0a1-3e4a-4e8a-b886-97bff71ec1bd | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 0e82c0a1-3e4a-4e8a-b886-97bff71ec1bd | — | — | — | — | passed |

