# Core Phase Test Report

- Started: `2026-04-21T02:06:29.909Z`
- Completed: `2026-04-21T02:08:25.772Z`
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

## Preflight

- 状态：`passed`
- Issues：`0`
- Provider auth probe：`skipped`

- 无 preflight 问题。


## Artifacts

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-06-22-160Z/report.live.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-06-22-160Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-06-22-160Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
- Failure categories：无
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry issue breakdown：contract=`0` / runtime=`0` / workflow=`0` / workflow-response=`0` / workflow-execution=`0` / execution-probe=`0` / unknown-external=`0`
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
| seed-focus-recovery-loop | 200 | 36d06d45-288c-44e9-b308-9c21a603bb9d | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 241c2611-576a-4b7d-b506-e1b1263bc1e0 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | ac1822ca-43fe-412e-853e-a6094a8643d6 | — | — | — | — | passed |
| chief-route-recovery | 200 | c989b3e6-d753-4afa-b848-ac36943a083c | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | c989b3e6-d753-4afa-b848-ac36943a083c | — | — | — | — | passed |
| chief-route-task-management | 200 | 5e86a6d8-0c4c-49bb-a56a-1acdd465b7ba | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 5e86a6d8-0c4c-49bb-a56a-1acdd465b7ba | — | — | — | — | passed |
| chief-route-reflection | 200 | bb2791ba-3fe7-4456-8fa7-7fdfd3570f0b | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | bb2791ba-3fe7-4456-8fa7-7fdfd3570f0b | — | — | — | — | passed |
| debug-state-insight | 200 | ea4353eb-efff-4e58-948d-5c1b67c72eb3 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | ea4353eb-efff-4e58-948d-5c1b67c72eb3 | — | — | — | — | passed |
| debug-task-management | 200 | 092286c7-5a88-4c6d-bbb4-a9d02681b102 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 092286c7-5a88-4c6d-bbb4-a9d02681b102 | — | — | — | — | passed |
| debug-progress-feedback | 200 | ff0f25fc-5cce-4bc0-bb2c-bc46f78475e9 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | ff0f25fc-5cce-4bc0-bb2c-bc46f78475e9 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | df48e486-9ae3-4af8-9890-190da0fac387 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | df48e486-9ae3-4af8-9890-190da0fac387 | — | — | — | — | passed |
| debug-reflection | 200 | cad68bf5-2bf5-49d5-a007-aec0c5c79b54 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | cad68bf5-2bf5-49d5-a007-aec0c5c79b54 | — | — | — | — | passed |
| debug-automation | 200 | f47eb8f6-ec44-4592-891e-764c5fb9cc24 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | f47eb8f6-ec44-4592-891e-764c5fb9cc24 | — | — | — | — | passed |
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
| full-regression | 200 | 8c5d341d-7bb0-408d-93a4-2131c301e755 | — | — | — | — | passed |
| full-regression-trace | 200 | 8c5d341d-7bb0-408d-93a4-2131c301e755 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 7faedfb3-30c1-465b-b011-1936b24a016f | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 7faedfb3-30c1-465b-b011-1936b24a016f | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
- Failure categories：无
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry issue breakdown：contract=`0` / runtime=`0` / workflow=`0` / workflow-response=`0` / workflow-execution=`0` / execution-probe=`0` / unknown-external=`0`
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
| seed-focus-recovery-loop | 200 | 0f26d9fa-75ac-4a1f-ba0b-cdf0b892392d | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | c799cf40-9bf0-4cf8-abac-aa9d448f8592 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | f3d461cf-1229-47c2-889c-f8d84daa65bc | — | — | — | — | passed |
| probe-chief-agent | 200 | 3eb6b6f3-655d-40cb-b567-5b7e0e9a4b6b | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 3eb6b6f3-655d-40cb-b567-5b7e0e9a4b6b | — | — | — | — | passed |
| probe-state-insight-agent | 200 | b33e3985-38ef-42f9-af28-efefdfa945e8 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | b33e3985-38ef-42f9-af28-efefdfa945e8 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 42cfdcde-ee75-4a8b-a9ac-16a64d071e14 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 42cfdcde-ee75-4a8b-a9ac-16a64d071e14 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 7723643a-9b8e-4bca-b387-04c528880611 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 7723643a-9b8e-4bca-b387-04c528880611 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 119a3591-3a24-4176-a1cd-67fc23358f20 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 119a3591-3a24-4176-a1cd-67fc23358f20 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 0504f431-6a95-4bae-8b49-577e1b536626 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 0504f431-6a95-4bae-8b49-577e1b536626 | — | — | — | — | passed |
| probe-automation-agent | 200 | d071fa0f-fac2-47c7-8da0-24626d2cbed7 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | d071fa0f-fac2-47c7-8da0-24626d2cbed7 | — | — | — | — | passed |
| chief-route-recovery | 200 | 6817c184-6406-470d-84f7-0c2442fc74f5 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 6817c184-6406-470d-84f7-0c2442fc74f5 | — | — | — | — | passed |
| chief-route-task-management | 200 | 1d2748e3-9fff-4c66-b98a-21e681bf5204 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 1d2748e3-9fff-4c66-b98a-21e681bf5204 | — | — | — | — | passed |
| chief-route-reflection | 200 | fc4dccfb-53d6-4ed8-9ce5-9fadbb109a66 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | fc4dccfb-53d6-4ed8-9ce5-9fadbb109a66 | — | — | — | — | passed |
| debug-state-insight | 200 | 1050e69a-1091-4fa8-aea0-757c4abf69b7 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 1050e69a-1091-4fa8-aea0-757c4abf69b7 | — | — | — | — | passed |
| debug-task-management | 200 | 5f872634-67bd-4254-8e0c-f3146424ee76 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 5f872634-67bd-4254-8e0c-f3146424ee76 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 2cfa97f1-71e6-4a25-9827-f3f46739cd34 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 2cfa97f1-71e6-4a25-9827-f3f46739cd34 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 925db5eb-baf1-4210-a75d-e4303fc0a213 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 925db5eb-baf1-4210-a75d-e4303fc0a213 | — | — | — | — | passed |
| debug-reflection | 200 | 295e4ec9-8772-46f3-988e-1d1169a93254 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 295e4ec9-8772-46f3-988e-1d1169a93254 | — | — | — | — | passed |
| debug-automation | 200 | 49ad7507-7275-419e-84c9-f6fb79d831c9 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 49ad7507-7275-419e-84c9-f6fb79d831c9 | — | — | — | — | passed |
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
| full-regression | 200 | 96a763fb-2c35-423f-b8d6-71baedc246ed | — | — | — | — | passed |
| full-regression-trace | 200 | 96a763fb-2c35-423f-b8d6-71baedc246ed | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 07ebe0a1-2eed-48c1-aa8c-8cdcbbe00947 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 07ebe0a1-2eed-48c1-aa8c-8cdcbbe00947 | — | — | — | — | passed |

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`aligned`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry issue breakdown：contract=`0` / runtime=`0` / workflow=`0` / workflow-response=`0` / workflow-execution=`0` / execution-probe=`0` / unknown-external=`9`
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
| seed-focus-recovery-loop | 200 | e07b25b8-4cc5-449b-aa88-882373bf9d38 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 64c840de-7398-44c5-97a2-b788327e271f | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | a53c4bc9-b19e-4523-848a-c4e7399d3ae3 | — | — | — | — | passed |
| probe-chief-agent | 200 | a8e4a48a-0618-4a1b-9de3-a9c1ec43e8c7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | a8e4a48a-0618-4a1b-9de3-a9c1ec43e8c7 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 3d4a31eb-c549-4ad6-aa14-7398591ad4ee | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 3d4a31eb-c549-4ad6-aa14-7398591ad4ee | — | — | — | — | passed |
| probe-task-management-agent | 200 | 6ccb6d63-7133-47e6-8021-20006fc75b6a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 6ccb6d63-7133-47e6-8021-20006fc75b6a | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | f5c2e8ca-d63b-475a-a7ec-a63d838ffc9f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | f5c2e8ca-d63b-475a-a7ec-a63d838ffc9f | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 58d2c864-ae43-42b4-a5e0-3ea444de1364 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 58d2c864-ae43-42b4-a5e0-3ea444de1364 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 192c3621-0406-4e02-ac47-6e7785979f91 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 192c3621-0406-4e02-ac47-6e7785979f91 | — | — | — | — | passed |
| probe-automation-agent | 200 | de457fd0-263b-475c-b63b-9215484a2de1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | de457fd0-263b-475c-b63b-9215484a2de1 | — | — | — | — | passed |
| chief-route-recovery | 200 | f757c542-5df0-47b0-bf13-e24a55bde732 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | f757c542-5df0-47b0-bf13-e24a55bde732 | — | — | — | — | passed |
| chief-route-task-management | 200 | 2650a364-4e1e-4dd9-b5e8-5ef467594b32 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 2650a364-4e1e-4dd9-b5e8-5ef467594b32 | — | — | — | — | passed |
| chief-route-reflection | 200 | 978018c8-b069-46e1-9d47-0f345facf229 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 978018c8-b069-46e1-9d47-0f345facf229 | — | — | — | — | passed |
| debug-state-insight | 200 | 9d787d66-8832-45b5-bb8b-84e554c580b1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 9d787d66-8832-45b5-bb8b-84e554c580b1 | — | — | — | — | passed |
| debug-task-management | 200 | f274b0ad-b518-47f2-afbc-b3ea9c85c1db | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | f274b0ad-b518-47f2-afbc-b3ea9c85c1db | — | — | — | — | passed |
| debug-progress-feedback | 200 | 3f873c32-ced0-4c5a-a176-85ac58c6dfbe | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 3f873c32-ced0-4c5a-a176-85ac58c6dfbe | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 13a11a51-64d2-481a-8287-24ea7bbedfa6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 13a11a51-64d2-481a-8287-24ea7bbedfa6 | — | — | — | — | passed |
| debug-reflection | 200 | 677ebe2d-f795-4242-8c30-857f91108ad4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 677ebe2d-f795-4242-8c30-857f91108ad4 | — | — | — | — | passed |
| debug-automation | 200 | 56513290-5ba4-4f27-abd7-52c296605ab9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 56513290-5ba4-4f27-abd7-52c296605ab9 | — | — | — | — | passed |
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
| full-regression | 200 | 6fef3a30-dfd7-48a9-8664-6bf0da745816 | — | — | — | — | passed |
| full-regression-trace | 200 | 6fef3a30-dfd7-48a9-8664-6bf0da745816 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 9619116f-4692-4d26-8616-fab962f78b11 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 9619116f-4692-4d26-8616-fab962f78b11 | — | — | — | — | passed |

