# Core Phase Test Report

- Started: `2026-03-09T21:49:22.177Z`
- Completed: `2026-03-09T21:51:02.338Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T21-49-22-176Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T21-49-22-176Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T21-49-22-176Z/responses`

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
| seed-focus-recovery-loop | 200 | edb278d5-c513-4a20-b8c8-b8cd0a777688 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | cf48d721-506d-4f8b-a0c6-fff3951b271b | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | eba70304-04f0-45ab-af33-6a5b86a79fb7 | — | — | — | — | passed |
| chief-route-recovery | 200 | 23a53ba3-e78c-43be-8e2b-9b52cbf193c6 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 23a53ba3-e78c-43be-8e2b-9b52cbf193c6 | — | — | — | — | passed |
| chief-route-task-management | 200 | 387a0a87-d154-47e6-8309-8da2fce22593 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 387a0a87-d154-47e6-8309-8da2fce22593 | — | — | — | — | passed |
| chief-route-reflection | 200 | 980d5d3f-d10a-4b1f-a258-09c8293aa57c | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 980d5d3f-d10a-4b1f-a258-09c8293aa57c | — | — | — | — | passed |
| debug-state-insight | 200 | d8ec424b-2c47-4534-b32b-3747cab5ae38 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | d8ec424b-2c47-4534-b32b-3747cab5ae38 | — | — | — | — | passed |
| debug-task-management | 200 | 3cc74a85-791a-4802-a57c-00f05267ab3d | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 3cc74a85-791a-4802-a57c-00f05267ab3d | — | — | — | — | passed |
| debug-progress-feedback | 200 | a4ef14cf-0223-4bb2-b675-0fd041883d11 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | a4ef14cf-0223-4bb2-b675-0fd041883d11 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 64047122-9f17-4e40-ba70-2a37346043d1 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 64047122-9f17-4e40-ba70-2a37346043d1 | — | — | — | — | passed |
| debug-reflection | 200 | a5596dad-358f-4d68-8950-7b5fa205675b | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | a5596dad-358f-4d68-8950-7b5fa205675b | — | — | — | — | passed |
| debug-automation | 200 | de54d5dd-d525-43c0-8d02-9b6d10e827fd | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | de54d5dd-d525-43c0-8d02-9b6d10e827fd | — | — | — | — | passed |
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
| full-regression | 200 | b12c67bf-0a8a-4a39-a941-1199c746bbda | — | — | — | — | passed |
| full-regression-trace | 200 | b12c67bf-0a8a-4a39-a941-1199c746bbda | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 6a7cb9db-6a8f-42a9-83cc-a5927d14407c | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 6a7cb9db-6a8f-42a9-83cc-a5927d14407c | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 57faccd8-58a0-4ae5-aed0-63d23c94e093 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 013c8366-bb98-4094-80e3-3e2a9772ca93 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | f8e8a568-7004-4476-a77a-3d51607b30a0 | — | — | — | — | passed |
| probe-chief-agent | 200 | 2cb2546f-f2ee-4c3d-8f31-da04cc5c8e6f | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 2cb2546f-f2ee-4c3d-8f31-da04cc5c8e6f | — | — | — | — | passed |
| probe-state-insight-agent | 200 | ea58413f-9d5b-4955-90ce-f79e6f50cde8 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | ea58413f-9d5b-4955-90ce-f79e6f50cde8 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 78efd6bf-88db-4a00-a08e-254f7bb62255 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 78efd6bf-88db-4a00-a08e-254f7bb62255 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 2f6a7445-29a6-4f57-b24b-52aaa3a69dc1 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 2f6a7445-29a6-4f57-b24b-52aaa3a69dc1 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 678b9b2a-59c7-4a0a-8255-4b71061e495a | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 678b9b2a-59c7-4a0a-8255-4b71061e495a | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 287f84b5-61ae-46fa-bbba-4a936a823cb5 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 287f84b5-61ae-46fa-bbba-4a936a823cb5 | — | — | — | — | passed |
| probe-automation-agent | 200 | 2445c054-3fbd-468a-a4d3-306387e1489c | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 2445c054-3fbd-468a-a4d3-306387e1489c | — | — | — | — | passed |
| chief-route-recovery | 200 | aaef0b71-2e25-4c21-9bed-4276194d39d7 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | aaef0b71-2e25-4c21-9bed-4276194d39d7 | — | — | — | — | passed |
| chief-route-task-management | 200 | e0c2d010-53a5-4bb6-887a-500dc6e9d9fb | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | e0c2d010-53a5-4bb6-887a-500dc6e9d9fb | — | — | — | — | passed |
| chief-route-reflection | 200 | 96748991-4b03-4e35-a90f-b9f329c90cdd | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 96748991-4b03-4e35-a90f-b9f329c90cdd | — | — | — | — | passed |
| debug-state-insight | 200 | 68780c82-124f-4b6e-8e5a-e90c0bc0ad5c | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 68780c82-124f-4b6e-8e5a-e90c0bc0ad5c | — | — | — | — | passed |
| debug-task-management | 200 | be390985-a90c-48f8-9d53-ac0d54d9c594 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | be390985-a90c-48f8-9d53-ac0d54d9c594 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 7a174ba7-594b-4a2a-bf66-1f39c9486f3e | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 7a174ba7-594b-4a2a-bf66-1f39c9486f3e | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 9d2d9164-689e-46d5-af76-44afad4241ce | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 9d2d9164-689e-46d5-af76-44afad4241ce | — | — | — | — | passed |
| debug-reflection | 200 | d4d60e55-1802-463a-9e8c-82308e04cc12 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | d4d60e55-1802-463a-9e8c-82308e04cc12 | — | — | — | — | passed |
| debug-automation | 200 | a2cda6f9-6d24-44f6-be9b-9050d39272a0 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | a2cda6f9-6d24-44f6-be9b-9050d39272a0 | — | — | — | — | passed |
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
| full-regression | 200 | 8e3a452e-060c-4ad6-b8a2-07601d3e0ac3 | — | — | — | — | passed |
| full-regression-trace | 200 | 8e3a452e-060c-4ad6-b8a2-07601d3e0ac3 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 904e5382-c696-41de-81f5-58298c62303f | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 904e5382-c696-41de-81f5-58298c62303f | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | b4543079-b89c-4758-b111-3cad3001c8de | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 22a4c626-590a-431e-802d-b74fe1cb0126 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 4f95df8c-4f58-4b89-a8cd-141e6a78cdba | — | — | — | — | passed |
| probe-chief-agent | 200 | eddcf23d-931d-469d-9d35-eba3fd6dc3d1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | eddcf23d-931d-469d-9d35-eba3fd6dc3d1 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 906cc04a-7f53-435a-87bb-fd784cd9e29f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 906cc04a-7f53-435a-87bb-fd784cd9e29f | — | — | — | — | passed |
| probe-task-management-agent | 200 | cf6d3670-a3eb-4857-a879-f11ba6e30865 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | cf6d3670-a3eb-4857-a879-f11ba6e30865 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | edd2f8d8-12dd-4e32-9622-13040d3843c5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | edd2f8d8-12dd-4e32-9622-13040d3843c5 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | e305002e-ab3c-424a-8ec6-6fc492a60c10 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | e305002e-ab3c-424a-8ec6-6fc492a60c10 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 1e54058c-2d78-46f3-9c35-bfbbb10b1a59 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 1e54058c-2d78-46f3-9c35-bfbbb10b1a59 | — | — | — | — | passed |
| probe-automation-agent | 200 | d894c5cd-0937-428a-b2f6-5280fcb13f77 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | d894c5cd-0937-428a-b2f6-5280fcb13f77 | — | — | — | — | passed |
| chief-route-recovery | 200 | 9331541d-4fc7-45ef-b00d-0a5e4abbb52c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 9331541d-4fc7-45ef-b00d-0a5e4abbb52c | — | — | — | — | passed |
| chief-route-task-management | 200 | 270700a6-03cc-41a8-a9d8-f62936e15fa5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 270700a6-03cc-41a8-a9d8-f62936e15fa5 | — | — | — | — | passed |
| chief-route-reflection | 200 | e158f932-c7ae-40cd-a2c4-d078d722bdeb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | e158f932-c7ae-40cd-a2c4-d078d722bdeb | — | — | — | — | passed |
| debug-state-insight | 200 | 05f7bac1-b92a-4c87-b16c-32534e04cecd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 05f7bac1-b92a-4c87-b16c-32534e04cecd | — | — | — | — | passed |
| debug-task-management | 200 | 8a167e2a-31e9-4f6e-bff0-aaf2ed5a0359 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 8a167e2a-31e9-4f6e-bff0-aaf2ed5a0359 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 136ce6cd-9d98-4fe5-90c5-ae522ab41dcf | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 136ce6cd-9d98-4fe5-90c5-ae522ab41dcf | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 5b806f7d-80fd-4c7a-a490-ea6b590c0fcf | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 5b806f7d-80fd-4c7a-a490-ea6b590c0fcf | — | — | — | — | passed |
| debug-reflection | 200 | 8ab68bee-0099-420d-bd8b-314f4c0aae78 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 8ab68bee-0099-420d-bd8b-314f4c0aae78 | — | — | — | — | passed |
| debug-automation | 200 | 69ee7415-c5b0-47fe-89e8-926e255ddd61 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 69ee7415-c5b0-47fe-89e8-926e255ddd61 | — | — | — | — | passed |
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
| full-regression | 200 | 1961bff4-bb0a-4f96-a1e3-9cf835a31615 | — | — | — | — | passed |
| full-regression-trace | 200 | 1961bff4-bb0a-4f96-a1e3-9cf835a31615 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | be890892-6383-41c7-b755-6250315299ee | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | be890892-6383-41c7-b755-6250315299ee | — | — | — | — | passed |

