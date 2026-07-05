# Core Phase Test Report

- Started: `2026-03-24T01:11:18.102Z`
- Completed: `2026-03-24T01:13:01.016Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-11-18-100Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-11-18-100Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-11-18-100Z/responses`

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
| seed-focus-recovery-loop | 200 | 7b8c5b51-7edd-43c2-b42d-8a211d444495 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 2eac206b-80da-47b6-a8c0-c3710d1aebe7 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 1d150ed2-8397-497c-83ca-564a3f6447c2 | — | — | — | — | passed |
| chief-route-recovery | 200 | c181bae9-e229-43a8-80e1-660a6c622550 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | c181bae9-e229-43a8-80e1-660a6c622550 | — | — | — | — | passed |
| chief-route-task-management | 200 | 4ed9c488-311d-4adc-8c18-8be0cf74a825 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 4ed9c488-311d-4adc-8c18-8be0cf74a825 | — | — | — | — | passed |
| chief-route-reflection | 200 | 305447ec-7deb-4ddb-93e0-56693851e7eb | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 305447ec-7deb-4ddb-93e0-56693851e7eb | — | — | — | — | passed |
| debug-state-insight | 200 | 80c3c3d3-addc-4a26-8299-492bbba25d6a | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 80c3c3d3-addc-4a26-8299-492bbba25d6a | — | — | — | — | passed |
| debug-task-management | 200 | 3dbaa98f-5daf-4b2f-ae8e-c6d4c9a7e578 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 3dbaa98f-5daf-4b2f-ae8e-c6d4c9a7e578 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 5b17d02e-1b1c-4ff0-9b67-26bee0151d8b | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 5b17d02e-1b1c-4ff0-9b67-26bee0151d8b | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 9f31e377-f51d-49df-b53b-6639854a5ba1 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 9f31e377-f51d-49df-b53b-6639854a5ba1 | — | — | — | — | passed |
| debug-reflection | 200 | 44f73c58-7646-483f-833b-1126cf456bed | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 44f73c58-7646-483f-833b-1126cf456bed | — | — | — | — | passed |
| debug-automation | 200 | 9896d7ca-67a7-475e-8234-a80c8cd090eb | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 9896d7ca-67a7-475e-8234-a80c8cd090eb | — | — | — | — | passed |
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
| full-regression | 200 | 13604fa4-a4a3-465d-b6d5-4c84698354f0 | — | — | — | — | passed |
| full-regression-trace | 200 | 13604fa4-a4a3-465d-b6d5-4c84698354f0 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | d033c99f-0687-4865-a77b-1117312a0462 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | d033c99f-0687-4865-a77b-1117312a0462 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | df5786dd-f339-4675-9fa9-d3046bb1ddd5 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | c1cb3806-60d2-4a2a-b072-74859db4d110 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 633b842a-e32b-44ea-ba1a-c4cd0920ace6 | — | — | — | — | passed |
| probe-chief-agent | 200 | 6ded6b0f-0c65-4089-9be5-966a48a7c4ad | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 6ded6b0f-0c65-4089-9be5-966a48a7c4ad | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 6335fbcd-15f5-40fc-b7e1-a4382be5ba50 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 6335fbcd-15f5-40fc-b7e1-a4382be5ba50 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 54775a3b-b31c-48b9-b9b9-e60700f9ebfb | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 54775a3b-b31c-48b9-b9b9-e60700f9ebfb | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | dde41764-dac3-41b1-a993-de9a26e2d3b6 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | dde41764-dac3-41b1-a993-de9a26e2d3b6 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | a2aab63b-f9d1-4c50-be32-a775e1e04377 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | a2aab63b-f9d1-4c50-be32-a775e1e04377 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 5bfb3a8c-32a5-4fe0-840c-1681c0f11993 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 5bfb3a8c-32a5-4fe0-840c-1681c0f11993 | — | — | — | — | passed |
| probe-automation-agent | 200 | 20ccbd29-6f0d-4c58-b006-b105e768f567 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 20ccbd29-6f0d-4c58-b006-b105e768f567 | — | — | — | — | passed |
| chief-route-recovery | 200 | db962bba-46bb-4d75-b39c-e00ceb1ce322 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | db962bba-46bb-4d75-b39c-e00ceb1ce322 | — | — | — | — | passed |
| chief-route-task-management | 200 | 3d03ffe7-7b3e-4a08-9c9d-ec82bbd67dd8 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 3d03ffe7-7b3e-4a08-9c9d-ec82bbd67dd8 | — | — | — | — | passed |
| chief-route-reflection | 200 | 399c3fca-6d29-434b-9c7a-de529581d34c | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 399c3fca-6d29-434b-9c7a-de529581d34c | — | — | — | — | passed |
| debug-state-insight | 200 | 7601126d-3eda-47a7-b9b2-b73ca4cbf115 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 7601126d-3eda-47a7-b9b2-b73ca4cbf115 | — | — | — | — | passed |
| debug-task-management | 200 | 017993a8-1fbe-41d9-bfb5-df642856049d | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 017993a8-1fbe-41d9-bfb5-df642856049d | — | — | — | — | passed |
| debug-progress-feedback | 200 | 5fb79dc0-04fa-48c1-961c-6660b489d6ac | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 5fb79dc0-04fa-48c1-961c-6660b489d6ac | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 7ab97ead-9997-4439-861a-27c7e13b1646 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 7ab97ead-9997-4439-861a-27c7e13b1646 | — | — | — | — | passed |
| debug-reflection | 200 | 1dd4fb3b-b810-4598-9d40-631414be907b | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 1dd4fb3b-b810-4598-9d40-631414be907b | — | — | — | — | passed |
| debug-automation | 200 | 713a5b3d-a498-489f-a6f7-36d4b0f5107a | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 713a5b3d-a498-489f-a6f7-36d4b0f5107a | — | — | — | — | passed |
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
| full-regression | 200 | d9936aed-9136-4ab4-9cad-70790114ecb0 | — | — | — | — | passed |
| full-regression-trace | 200 | d9936aed-9136-4ab4-9cad-70790114ecb0 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 6da2ac33-d00c-4020-b30f-6a3fd359fd19 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 6da2ac33-d00c-4020-b30f-6a3fd359fd19 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 9defe2d8-59f1-44e8-af5e-9bf6bb81bd79 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | fc2bfb1b-b315-4909-94c9-9332944012e5 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 798c749f-9779-40c6-8bad-d127c75d27d0 | — | — | — | — | passed |
| probe-chief-agent | 200 | 4cf6ca61-ce83-4614-b0a4-b7dace768872 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 4cf6ca61-ce83-4614-b0a4-b7dace768872 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | ca8d3d5d-001e-484c-b993-974cba49d354 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | ca8d3d5d-001e-484c-b993-974cba49d354 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 615d29cb-2f6f-4d51-b12d-181b31e1335b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 615d29cb-2f6f-4d51-b12d-181b31e1335b | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 23f34776-5c6a-48d9-8ba6-49c8f32a2e21 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 23f34776-5c6a-48d9-8ba6-49c8f32a2e21 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 456cef52-296a-4512-8872-02149eadc5f6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 456cef52-296a-4512-8872-02149eadc5f6 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 8cf4f27b-32f4-4401-be52-e924a136f8b9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 8cf4f27b-32f4-4401-be52-e924a136f8b9 | — | — | — | — | passed |
| probe-automation-agent | 200 | 09542de4-a80f-4c63-8052-6d7a8bcf79dd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 09542de4-a80f-4c63-8052-6d7a8bcf79dd | — | — | — | — | passed |
| chief-route-recovery | 200 | 39eeeabb-1cd3-423a-9d40-7a659459f382 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 39eeeabb-1cd3-423a-9d40-7a659459f382 | — | — | — | — | passed |
| chief-route-task-management | 200 | 3c820e40-5503-4855-85f4-011e8d34eed8 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 3c820e40-5503-4855-85f4-011e8d34eed8 | — | — | — | — | passed |
| chief-route-reflection | 200 | 049b3736-7c70-4082-b95f-38ff0cb5a56c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 049b3736-7c70-4082-b95f-38ff0cb5a56c | — | — | — | — | passed |
| debug-state-insight | 200 | b303db54-640a-40bd-bcd4-78ca267347ae | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | b303db54-640a-40bd-bcd4-78ca267347ae | — | — | — | — | passed |
| debug-task-management | 200 | c7196ace-dcb9-4918-a696-ca4675ddd9d4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | c7196ace-dcb9-4918-a696-ca4675ddd9d4 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 89be7dff-8770-4bd1-8a9b-feae5b06bed6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 89be7dff-8770-4bd1-8a9b-feae5b06bed6 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 6c1fbf7c-9214-4b77-aa7e-271dbbe04f36 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 6c1fbf7c-9214-4b77-aa7e-271dbbe04f36 | — | — | — | — | passed |
| debug-reflection | 200 | 5a86c3aa-4389-41ac-9c8b-b75ea860fa57 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 5a86c3aa-4389-41ac-9c8b-b75ea860fa57 | — | — | — | — | passed |
| debug-automation | 200 | ce4a6244-7b03-4842-a799-d04f9f8297ab | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | ce4a6244-7b03-4842-a799-d04f9f8297ab | — | — | — | — | passed |
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
| full-regression | 200 | 63e09d40-a682-4316-b57d-6aec5b3c4340 | — | — | — | — | passed |
| full-regression-trace | 200 | 63e09d40-a682-4316-b57d-6aec5b3c4340 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 8a95ff93-6805-40a2-96f2-0718eaa3bc03 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 8a95ff93-6805-40a2-96f2-0718eaa3bc03 | — | — | — | — | passed |

