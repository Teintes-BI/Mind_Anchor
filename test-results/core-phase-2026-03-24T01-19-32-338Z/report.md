# Core Phase Test Report

- Started: `2026-03-24T01:19:32.339Z`
- Completed: `2026-03-24T01:21:16.291Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-19-32-338Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-19-32-338Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-19-32-338Z/responses`

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
| seed-focus-recovery-loop | 200 | 9ec33111-429c-410b-80d4-532ab1b20c3c | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | d3ddb43f-d426-40ed-a30b-81b6d77a0b8f | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | ea0a2ec0-3e38-4da7-b1fb-a551a4596bce | — | — | — | — | passed |
| chief-route-recovery | 200 | 95600221-2c59-49d4-8ea3-848fe0ff91a4 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 95600221-2c59-49d4-8ea3-848fe0ff91a4 | — | — | — | — | passed |
| chief-route-task-management | 200 | de2b3d34-acc0-47f9-93bd-4de06dc62c3a | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | de2b3d34-acc0-47f9-93bd-4de06dc62c3a | — | — | — | — | passed |
| chief-route-reflection | 200 | cf7c945b-2df8-4923-8ca6-0a9d175d2c23 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | cf7c945b-2df8-4923-8ca6-0a9d175d2c23 | — | — | — | — | passed |
| debug-state-insight | 200 | f2e99bfa-709d-42aa-8a2c-830584c66265 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | f2e99bfa-709d-42aa-8a2c-830584c66265 | — | — | — | — | passed |
| debug-task-management | 200 | 49e9b4e2-dc38-4450-96e3-b3346f01eac9 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 49e9b4e2-dc38-4450-96e3-b3346f01eac9 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 3dc1cdfc-2d14-411e-8874-ea5c4b4fcb3a | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 3dc1cdfc-2d14-411e-8874-ea5c4b4fcb3a | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 175f068d-ea47-4060-827f-2153b5d1e633 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 175f068d-ea47-4060-827f-2153b5d1e633 | — | — | — | — | passed |
| debug-reflection | 200 | 96eeb0dd-43d7-45f7-85d8-7c9a1598ef3e | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 96eeb0dd-43d7-45f7-85d8-7c9a1598ef3e | — | — | — | — | passed |
| debug-automation | 200 | 41eb62ee-2453-4418-8204-904c987c1a62 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 41eb62ee-2453-4418-8204-904c987c1a62 | — | — | — | — | passed |
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
| full-regression | 200 | 249d1cc8-3777-49b6-bc27-6f3b093e459b | — | — | — | — | passed |
| full-regression-trace | 200 | 249d1cc8-3777-49b6-bc27-6f3b093e459b | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | b9d529ca-a7a9-459a-a2e8-3a33c8e78925 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | b9d529ca-a7a9-459a-a2e8-3a33c8e78925 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | bf4835dd-6822-4732-a606-a6674e7c9d20 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 6c32f821-c0de-4eb9-9aae-1f1ea5da7a2a | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | b62cc3ae-10d2-4c15-aa63-deb403b11557 | — | — | — | — | passed |
| probe-chief-agent | 200 | ebeb0b33-246a-4906-b500-17c3697b81b8 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | ebeb0b33-246a-4906-b500-17c3697b81b8 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 85206bce-71ff-4005-9bed-579c6da6fe08 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 85206bce-71ff-4005-9bed-579c6da6fe08 | — | — | — | — | passed |
| probe-task-management-agent | 200 | bd6d38be-3bd0-47d2-82bc-73ca374b6a34 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | bd6d38be-3bd0-47d2-82bc-73ca374b6a34 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 889d9f30-c3c2-45c2-b4b9-cf09af7fe198 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 889d9f30-c3c2-45c2-b4b9-cf09af7fe198 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 0e010160-c2ab-46d8-95d7-1e13e04d257f | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 0e010160-c2ab-46d8-95d7-1e13e04d257f | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | e4868dcc-e9c4-48e7-bbec-0d6daf0f5af3 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | e4868dcc-e9c4-48e7-bbec-0d6daf0f5af3 | — | — | — | — | passed |
| probe-automation-agent | 200 | 8c11cb9c-47fe-49c8-bfc7-19fdb8e01b43 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 8c11cb9c-47fe-49c8-bfc7-19fdb8e01b43 | — | — | — | — | passed |
| chief-route-recovery | 200 | 310b75a1-d977-44b2-b3e0-5e25dd5e92cb | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 310b75a1-d977-44b2-b3e0-5e25dd5e92cb | — | — | — | — | passed |
| chief-route-task-management | 200 | 4aa39c30-2ab3-4f63-8c5a-d9e6ff31d546 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 4aa39c30-2ab3-4f63-8c5a-d9e6ff31d546 | — | — | — | — | passed |
| chief-route-reflection | 200 | 7868b37d-af49-4475-b373-deef1ff436f1 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 7868b37d-af49-4475-b373-deef1ff436f1 | — | — | — | — | passed |
| debug-state-insight | 200 | 1f205650-a938-452e-8a99-a5ec25f7025c | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 1f205650-a938-452e-8a99-a5ec25f7025c | — | — | — | — | passed |
| debug-task-management | 200 | cbe0d06f-846b-4142-94dc-11d23c39d73b | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | cbe0d06f-846b-4142-94dc-11d23c39d73b | — | — | — | — | passed |
| debug-progress-feedback | 200 | 1fb1e2aa-dcf7-4487-8666-b61be245acb2 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 1fb1e2aa-dcf7-4487-8666-b61be245acb2 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | e737678c-4249-4ecf-b58f-4cd6ae3ac17e | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | e737678c-4249-4ecf-b58f-4cd6ae3ac17e | — | — | — | — | passed |
| debug-reflection | 200 | a168bf54-3a64-43e9-a246-2ed3c85a96f2 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | a168bf54-3a64-43e9-a246-2ed3c85a96f2 | — | — | — | — | passed |
| debug-automation | 200 | afcf0520-a923-4d24-979a-b4e8cd41153e | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | afcf0520-a923-4d24-979a-b4e8cd41153e | — | — | — | — | passed |
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
| full-regression | 200 | d8856f0f-70a8-4ea1-bc4d-9d61456c8b64 | — | — | — | — | passed |
| full-regression-trace | 200 | d8856f0f-70a8-4ea1-bc4d-9d61456c8b64 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | c26dcc8e-41b0-4d4f-898d-368edf0e2a45 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | c26dcc8e-41b0-4d4f-898d-368edf0e2a45 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 31d89ec1-d484-44d8-bcbc-c6d64ef60be8 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | d8dd6599-3407-4d9b-8c57-90cc9e425d69 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | c2480be8-1237-4421-8244-24c9c5e85c55 | — | — | — | — | passed |
| probe-chief-agent | 200 | 9987905b-7b96-445c-afda-671e87ad1682 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 9987905b-7b96-445c-afda-671e87ad1682 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | f1a7ff09-d621-4a28-b505-7c181d8e2c65 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | f1a7ff09-d621-4a28-b505-7c181d8e2c65 | — | — | — | — | passed |
| probe-task-management-agent | 200 | d4d55a36-daf3-4be4-9436-e9804560bab6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | d4d55a36-daf3-4be4-9436-e9804560bab6 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | c91f9790-dfe4-4df8-a464-aac4127a3450 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | c91f9790-dfe4-4df8-a464-aac4127a3450 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | a8817192-3fc4-4993-9a9a-3d1b2b983bd8 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | a8817192-3fc4-4993-9a9a-3d1b2b983bd8 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 53ac596d-db92-4392-83cb-a1bd3e643085 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 53ac596d-db92-4392-83cb-a1bd3e643085 | — | — | — | — | passed |
| probe-automation-agent | 200 | c7b9bff4-4912-4e58-811c-c99a7be84d16 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | c7b9bff4-4912-4e58-811c-c99a7be84d16 | — | — | — | — | passed |
| chief-route-recovery | 200 | 3b06f33f-c253-494a-9340-16b902362a8d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 3b06f33f-c253-494a-9340-16b902362a8d | — | — | — | — | passed |
| chief-route-task-management | 200 | cdb0b763-05d2-485e-848e-c38c69c358dc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | cdb0b763-05d2-485e-848e-c38c69c358dc | — | — | — | — | passed |
| chief-route-reflection | 200 | 7a6a7a5e-e728-468f-870a-f02e60a14013 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 7a6a7a5e-e728-468f-870a-f02e60a14013 | — | — | — | — | passed |
| debug-state-insight | 200 | 0d431136-ab6f-4bab-af67-b366541ee359 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 0d431136-ab6f-4bab-af67-b366541ee359 | — | — | — | — | passed |
| debug-task-management | 200 | 0e65a4e8-c825-4d91-a3e0-135273582659 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 0e65a4e8-c825-4d91-a3e0-135273582659 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 6a3580fc-4776-4956-a421-ee0f66f7b41e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 6a3580fc-4776-4956-a421-ee0f66f7b41e | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 1bb5d972-7e62-40d6-ba1e-a0dd13ba1129 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 1bb5d972-7e62-40d6-ba1e-a0dd13ba1129 | — | — | — | — | passed |
| debug-reflection | 200 | ee62fb93-1e59-43b1-87cc-690b5962d8be | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | ee62fb93-1e59-43b1-87cc-690b5962d8be | — | — | — | — | passed |
| debug-automation | 200 | 9b44151b-a087-4e3d-8226-6eb765b92531 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 9b44151b-a087-4e3d-8226-6eb765b92531 | — | — | — | — | passed |
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
| full-regression | 200 | 66c40e60-2b47-4e71-bba1-57d2f1863621 | — | — | — | — | passed |
| full-regression-trace | 200 | 66c40e60-2b47-4e71-bba1-57d2f1863621 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 14359d98-9855-4145-b215-761186a6ed14 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 14359d98-9855-4145-b215-761186a6ed14 | — | — | — | — | passed |

