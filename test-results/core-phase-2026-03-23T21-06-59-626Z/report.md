# Core Phase Test Report

- Started: `2026-03-23T21:06:59.627Z`
- Completed: `2026-03-23T21:08:47.402Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-06-59-626Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-06-59-626Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-06-59-626Z/responses`

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
| seed-focus-recovery-loop | 200 | 4cb11190-c1ff-46e4-b9de-41323406bee2 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 17bba576-b6dc-4902-914c-23527e5adfeb | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 79f53ebf-f9bd-422e-b2d3-ccc5aa47752f | — | — | — | — | passed |
| chief-route-recovery | 200 | a0d1ce7a-57f4-45be-9639-11f6d87febc9 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | a0d1ce7a-57f4-45be-9639-11f6d87febc9 | — | — | — | — | passed |
| chief-route-task-management | 200 | 9ea6715c-bc66-4719-9ca0-5693956fc3b5 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 9ea6715c-bc66-4719-9ca0-5693956fc3b5 | — | — | — | — | passed |
| chief-route-reflection | 200 | a192ae47-883c-4891-a85f-6fb082331214 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | a192ae47-883c-4891-a85f-6fb082331214 | — | — | — | — | passed |
| debug-state-insight | 200 | 36939826-1bc4-4a7b-b2b4-91f82eaef4ce | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 36939826-1bc4-4a7b-b2b4-91f82eaef4ce | — | — | — | — | passed |
| debug-task-management | 200 | 077cdaa9-f9ba-4d22-879a-bb737cbb31b0 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 077cdaa9-f9ba-4d22-879a-bb737cbb31b0 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 70ab30f9-198d-4c14-8400-849cf744c61d | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 70ab30f9-198d-4c14-8400-849cf744c61d | — | — | — | — | passed |
| debug-interruption-recovery | 200 | e70f3a92-33b1-4b96-bc3d-b3ef88065d86 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | e70f3a92-33b1-4b96-bc3d-b3ef88065d86 | — | — | — | — | passed |
| debug-reflection | 200 | ab2e536b-eac0-4903-85ee-9e2348fd42e3 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | ab2e536b-eac0-4903-85ee-9e2348fd42e3 | — | — | — | — | passed |
| debug-automation | 200 | 13b3f5d6-966d-4153-912d-2a968936f6de | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 13b3f5d6-966d-4153-912d-2a968936f6de | — | — | — | — | passed |
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
| full-regression | 200 | 03b3d794-cded-49c4-a528-763cfbc88241 | — | — | — | — | passed |
| full-regression-trace | 200 | 03b3d794-cded-49c4-a528-763cfbc88241 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 98021b66-ecec-480f-9e6f-2adcc9b7f327 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 98021b66-ecec-480f-9e6f-2adcc9b7f327 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 8fa4783f-1125-4d77-9b34-225828636195 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | c9c56ab0-bf6e-4b9a-943e-e083305dded2 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 3923e1d3-9b99-4b6c-9e15-07c8fc5f3ee5 | — | — | — | — | passed |
| probe-chief-agent | 200 | 07db6c9b-1a49-4f58-844f-c1c41fb0424c | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 07db6c9b-1a49-4f58-844f-c1c41fb0424c | — | — | — | — | passed |
| probe-state-insight-agent | 200 | a6d70547-2d80-4b83-af68-f35229350d9f | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | a6d70547-2d80-4b83-af68-f35229350d9f | — | — | — | — | passed |
| probe-task-management-agent | 200 | 10476ca7-1400-46e2-b816-d90615154ea1 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 10476ca7-1400-46e2-b816-d90615154ea1 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | fe07c99a-f896-47a0-b369-f9f869a148cd | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | fe07c99a-f896-47a0-b369-f9f869a148cd | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 8c0f77ff-c5dc-4709-a978-8b41c9be7649 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 8c0f77ff-c5dc-4709-a978-8b41c9be7649 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 1e102174-c069-48af-8745-d31ca8fe15d3 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 1e102174-c069-48af-8745-d31ca8fe15d3 | — | — | — | — | passed |
| probe-automation-agent | 200 | 70fe66b1-757e-41dd-a074-7521bb3a3dfe | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 70fe66b1-757e-41dd-a074-7521bb3a3dfe | — | — | — | — | passed |
| chief-route-recovery | 200 | 546d4a3f-874f-4cba-a58e-20262aaa653e | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 546d4a3f-874f-4cba-a58e-20262aaa653e | — | — | — | — | passed |
| chief-route-task-management | 200 | c2985357-575a-403c-80e5-d212f80b08fe | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | c2985357-575a-403c-80e5-d212f80b08fe | — | — | — | — | passed |
| chief-route-reflection | 200 | 991190fd-93ae-4d17-bb58-053ffd035c97 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 991190fd-93ae-4d17-bb58-053ffd035c97 | — | — | — | — | passed |
| debug-state-insight | 200 | 34893f0b-e964-48ac-a9b1-bf89f12a93a2 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 34893f0b-e964-48ac-a9b1-bf89f12a93a2 | — | — | — | — | passed |
| debug-task-management | 200 | 5da369c1-50e5-42e4-ad82-45a27a264283 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 5da369c1-50e5-42e4-ad82-45a27a264283 | — | — | — | — | passed |
| debug-progress-feedback | 200 | c28f47a4-67de-42a7-861a-d9526ecd135d | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | c28f47a4-67de-42a7-861a-d9526ecd135d | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 6d53c10d-725f-4394-8ee7-517f06e7560a | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 6d53c10d-725f-4394-8ee7-517f06e7560a | — | — | — | — | passed |
| debug-reflection | 200 | 87169c84-f170-4fe4-94c1-af648db58f2e | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 87169c84-f170-4fe4-94c1-af648db58f2e | — | — | — | — | passed |
| debug-automation | 200 | b067413b-e7cc-4bb8-8e99-f7d2eca6eed9 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | b067413b-e7cc-4bb8-8e99-f7d2eca6eed9 | — | — | — | — | passed |
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
| full-regression | 200 | 8cdded38-216d-4567-8bef-1d6b78b87255 | — | — | — | — | passed |
| full-regression-trace | 200 | 8cdded38-216d-4567-8bef-1d6b78b87255 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | dac176fe-3689-4677-a609-4503a9c92d73 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | dac176fe-3689-4677-a609-4503a9c92d73 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 3b7e7a38-92ea-4bd8-8d81-e48fa3075cc6 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 2f566051-0526-43b6-a940-149b3023845c | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | ff618771-04d2-4f3b-9bd0-b8387f29555f | — | — | — | — | passed |
| probe-chief-agent | 200 | fa983fde-fbb7-47e1-a7d6-bfbf3694b1a0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | fa983fde-fbb7-47e1-a7d6-bfbf3694b1a0 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 31daaa07-16a6-4638-b38a-513839ae185d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 31daaa07-16a6-4638-b38a-513839ae185d | — | — | — | — | passed |
| probe-task-management-agent | 200 | 1be7a45a-0160-414a-874c-8453db885e63 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 1be7a45a-0160-414a-874c-8453db885e63 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 5d07191d-670f-4910-99d0-dfb8076e0d4f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 5d07191d-670f-4910-99d0-dfb8076e0d4f | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | f87b79c3-0b01-4c54-8e19-09dda9ecf1dc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | f87b79c3-0b01-4c54-8e19-09dda9ecf1dc | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 88816a3c-2109-45eb-bfba-525a93adaf25 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 88816a3c-2109-45eb-bfba-525a93adaf25 | — | — | — | — | passed |
| probe-automation-agent | 200 | 2b4ffdd5-5cbd-4ea6-9797-7e818ddd45d8 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 2b4ffdd5-5cbd-4ea6-9797-7e818ddd45d8 | — | — | — | — | passed |
| chief-route-recovery | 200 | 2a3004e5-3fcc-403f-981b-2a55956d8b29 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 2a3004e5-3fcc-403f-981b-2a55956d8b29 | — | — | — | — | passed |
| chief-route-task-management | 200 | 5f98aace-6862-495b-a032-c570f2de492a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 5f98aace-6862-495b-a032-c570f2de492a | — | — | — | — | passed |
| chief-route-reflection | 200 | 242f2ee8-93ac-462a-9e4f-756c4f292463 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 242f2ee8-93ac-462a-9e4f-756c4f292463 | — | — | — | — | passed |
| debug-state-insight | 200 | 8fcbc28f-7578-41f4-88d5-cbdef85b5fc0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 8fcbc28f-7578-41f4-88d5-cbdef85b5fc0 | — | — | — | — | passed |
| debug-task-management | 200 | 21c5169c-8070-485e-a6aa-8328b285ee13 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 21c5169c-8070-485e-a6aa-8328b285ee13 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 49a9a7dc-9961-4688-884d-7e55819ab78c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 49a9a7dc-9961-4688-884d-7e55819ab78c | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 12c5ee16-db91-43cc-84a4-9dc7020a7756 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 12c5ee16-db91-43cc-84a4-9dc7020a7756 | — | — | — | — | passed |
| debug-reflection | 200 | 24ad3149-319a-4a73-96b7-d1ce03384f44 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 24ad3149-319a-4a73-96b7-d1ce03384f44 | — | — | — | — | passed |
| debug-automation | 200 | 8088a265-d582-42b9-855f-e18969b1d8df | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 8088a265-d582-42b9-855f-e18969b1d8df | — | — | — | — | passed |
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
| full-regression | 200 | 9b8c4a43-03c9-4b06-9c1f-ea6db9499281 | — | — | — | — | passed |
| full-regression-trace | 200 | 9b8c4a43-03c9-4b06-9c1f-ea6db9499281 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | a9907889-c960-496b-9ade-bbc859b6e9b7 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | a9907889-c960-496b-9ade-bbc859b6e9b7 | — | — | — | — | passed |

