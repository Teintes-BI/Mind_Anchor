# Core Phase Test Report

- Started: `2026-03-23T20:49:48.290Z`
- Completed: `2026-03-23T20:51:32.651Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-49-48-288Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-49-48-288Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-49-48-288Z/responses`

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
| seed-focus-recovery-loop | 200 | fae411e7-fa8a-4ed5-86ed-25fe11aac23b | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | b4220b6f-2932-4bc5-aecd-e2519b817811 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | a11b19f9-a04a-4bcc-a062-de6107eea3fb | — | — | — | — | passed |
| chief-route-recovery | 200 | 820a4d27-0627-4481-baaf-3eb6d7f5f16b | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 820a4d27-0627-4481-baaf-3eb6d7f5f16b | — | — | — | — | passed |
| chief-route-task-management | 200 | 4671e4b7-f328-47c7-b37a-c1bed5a3c95b | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 4671e4b7-f328-47c7-b37a-c1bed5a3c95b | — | — | — | — | passed |
| chief-route-reflection | 200 | b9fb9605-8f55-4378-a4e5-ea6a12b343dd | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | b9fb9605-8f55-4378-a4e5-ea6a12b343dd | — | — | — | — | passed |
| debug-state-insight | 200 | a8a34c1f-b050-45e9-ba4c-9cccd20440c7 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | a8a34c1f-b050-45e9-ba4c-9cccd20440c7 | — | — | — | — | passed |
| debug-task-management | 200 | 0f9b1842-7c19-402c-8acf-70bd339cf314 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 0f9b1842-7c19-402c-8acf-70bd339cf314 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 2c86b4fb-d6ad-4e00-9c18-a7c464a9a487 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 2c86b4fb-d6ad-4e00-9c18-a7c464a9a487 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 0861293a-2d03-491c-9f74-7519823a5cd8 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 0861293a-2d03-491c-9f74-7519823a5cd8 | — | — | — | — | passed |
| debug-reflection | 200 | 13269d69-9eae-4a40-bb7b-ac65ac56ad82 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 13269d69-9eae-4a40-bb7b-ac65ac56ad82 | — | — | — | — | passed |
| debug-automation | 200 | aa19f768-8fe7-4a66-b9b2-f010373530c6 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | aa19f768-8fe7-4a66-b9b2-f010373530c6 | — | — | — | — | passed |
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
| full-regression | 200 | 2f14f0da-800d-4224-b7c4-3571f9a5a61b | — | — | — | — | passed |
| full-regression-trace | 200 | 2f14f0da-800d-4224-b7c4-3571f9a5a61b | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | e54396a1-f922-491e-b500-5d920eb15a24 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | e54396a1-f922-491e-b500-5d920eb15a24 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 02344ba5-128f-448e-b890-07994510ce87 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 9eb10652-d857-49ad-9dfd-e669fb871d73 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 924f49db-4c02-45c3-8c1c-97996b95a875 | — | — | — | — | passed |
| probe-chief-agent | 200 | 82b44ffb-2e2b-4872-aa55-c94d755e3533 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 82b44ffb-2e2b-4872-aa55-c94d755e3533 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 6028446c-e87d-45d3-9cac-aab90f25452c | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 6028446c-e87d-45d3-9cac-aab90f25452c | — | — | — | — | passed |
| probe-task-management-agent | 200 | 84f191a0-8e23-4156-8099-924f5ed9b96b | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 84f191a0-8e23-4156-8099-924f5ed9b96b | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 1f7b32b0-4b62-46ff-93f7-82f254039df7 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 1f7b32b0-4b62-46ff-93f7-82f254039df7 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | dabcb19e-2cc3-4d58-bf80-20ba18baa070 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | dabcb19e-2cc3-4d58-bf80-20ba18baa070 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 13da6716-6351-4450-8e51-67ca6d1e6ddb | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 13da6716-6351-4450-8e51-67ca6d1e6ddb | — | — | — | — | passed |
| probe-automation-agent | 200 | 24e631b9-506b-4cd3-971f-4163364416bf | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 24e631b9-506b-4cd3-971f-4163364416bf | — | — | — | — | passed |
| chief-route-recovery | 200 | cac65430-240a-4dad-b3e2-af438aca1f5d | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | cac65430-240a-4dad-b3e2-af438aca1f5d | — | — | — | — | passed |
| chief-route-task-management | 200 | 3f4db2f7-f549-4bb2-b715-495449185c0d | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 3f4db2f7-f549-4bb2-b715-495449185c0d | — | — | — | — | passed |
| chief-route-reflection | 200 | 9eeeb454-a73a-47ec-8ec4-0c4f7880ab1f | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 9eeeb454-a73a-47ec-8ec4-0c4f7880ab1f | — | — | — | — | passed |
| debug-state-insight | 200 | c9c11078-3c5b-4b29-a401-c60d2c4274cc | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | c9c11078-3c5b-4b29-a401-c60d2c4274cc | — | — | — | — | passed |
| debug-task-management | 200 | 614b6260-9201-47c6-92a1-f701522f7f9d | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 614b6260-9201-47c6-92a1-f701522f7f9d | — | — | — | — | passed |
| debug-progress-feedback | 200 | c4aac57d-c903-4ddd-a62f-5b0387f5c7c2 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | c4aac57d-c903-4ddd-a62f-5b0387f5c7c2 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 72a048df-a028-46c3-9068-8be97e34f57c | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 72a048df-a028-46c3-9068-8be97e34f57c | — | — | — | — | passed |
| debug-reflection | 200 | c0ba8c79-4a8b-4424-9b60-618027c41d45 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | c0ba8c79-4a8b-4424-9b60-618027c41d45 | — | — | — | — | passed |
| debug-automation | 200 | 81245bbb-8fa9-427b-8387-5c1b2f1e31e5 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 81245bbb-8fa9-427b-8387-5c1b2f1e31e5 | — | — | — | — | passed |
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
| full-regression | 200 | 71389b54-d89b-4a61-9efe-43a87f7a7460 | — | — | — | — | passed |
| full-regression-trace | 200 | 71389b54-d89b-4a61-9efe-43a87f7a7460 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 46246bf7-cff5-4145-b28b-3bcac2dafc05 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 46246bf7-cff5-4145-b28b-3bcac2dafc05 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 72d3f34c-03c8-475f-9684-264a967ab7eb | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 64b59815-862a-45f7-9283-bb4fb71dfca3 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | b0823e7a-d799-4127-a896-7ff72586d2ea | — | — | — | — | passed |
| probe-chief-agent | 200 | c18c28aa-b890-4d8e-a8ca-8d02807bd789 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | c18c28aa-b890-4d8e-a8ca-8d02807bd789 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | c6b8652f-4f0f-428d-bdc0-ac618166cdd2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | c6b8652f-4f0f-428d-bdc0-ac618166cdd2 | — | — | — | — | passed |
| probe-task-management-agent | 200 | dbf75a96-d17a-4766-a8dc-ecea43a2a61c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | dbf75a96-d17a-4766-a8dc-ecea43a2a61c | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 4ee99c52-bc22-4cb3-a118-6cddab989874 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 4ee99c52-bc22-4cb3-a118-6cddab989874 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | b8f7f5ee-92f5-45b2-9226-9cc50f634c50 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | b8f7f5ee-92f5-45b2-9226-9cc50f634c50 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 1d9962e6-2325-4819-af21-2ad6678124b2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 1d9962e6-2325-4819-af21-2ad6678124b2 | — | — | — | — | passed |
| probe-automation-agent | 200 | baa66ecb-178c-4035-8e2b-ea5b1588a45a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | baa66ecb-178c-4035-8e2b-ea5b1588a45a | — | — | — | — | passed |
| chief-route-recovery | 200 | b9b93027-d9c4-4f28-9d83-6c338bb7e9c0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | b9b93027-d9c4-4f28-9d83-6c338bb7e9c0 | — | — | — | — | passed |
| chief-route-task-management | 200 | a7bcb393-6ed8-459c-9b67-4a7263a91725 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | a7bcb393-6ed8-459c-9b67-4a7263a91725 | — | — | — | — | passed |
| chief-route-reflection | 200 | b8b353eb-c7db-4da8-9cc8-adf0c8ed0445 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | b8b353eb-c7db-4da8-9cc8-adf0c8ed0445 | — | — | — | — | passed |
| debug-state-insight | 200 | 28ca2e72-2f9f-497f-afb9-f6bba014ec62 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 28ca2e72-2f9f-497f-afb9-f6bba014ec62 | — | — | — | — | passed |
| debug-task-management | 200 | 354491bf-bf51-4e75-99e3-e72bce36a908 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 354491bf-bf51-4e75-99e3-e72bce36a908 | — | — | — | — | passed |
| debug-progress-feedback | 200 | c54c0332-69bf-43e8-884a-0d92fd8bc41b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | c54c0332-69bf-43e8-884a-0d92fd8bc41b | — | — | — | — | passed |
| debug-interruption-recovery | 200 | e224ca8b-9785-498a-80e9-1a4bf68930e5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | e224ca8b-9785-498a-80e9-1a4bf68930e5 | — | — | — | — | passed |
| debug-reflection | 200 | 4d985ea6-6b7f-49d7-b9f0-82a17e1a4028 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 4d985ea6-6b7f-49d7-b9f0-82a17e1a4028 | — | — | — | — | passed |
| debug-automation | 200 | 63b3f746-bcbf-4fc7-adbe-9d57b16c9fbd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 63b3f746-bcbf-4fc7-adbe-9d57b16c9fbd | — | — | — | — | passed |
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
| full-regression | 200 | 0e8d3eeb-5011-40ab-899c-35e1aee08473 | — | — | — | — | passed |
| full-regression-trace | 200 | 0e8d3eeb-5011-40ab-899c-35e1aee08473 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 2554d33b-f787-4cae-9cdb-ae79f4f9eb1f | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 2554d33b-f787-4cae-9cdb-ae79f4f9eb1f | — | — | — | — | passed |

