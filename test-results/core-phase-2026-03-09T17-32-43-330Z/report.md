# Core Phase Test Report

- Started: `2026-03-09T17:32:43.331Z`
- Completed: `2026-03-09T17:52:24.209Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | 58/58 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 59/60 |
| Phase 3 Cluster Preferred | passed | openai-compatible | http://127.0.0.1:8788 | 72/72 |

## Failures

- [provider-direct] reflection-latest-monthly: This operation was aborted
- [provider-direct] provider-direct-phase: This operation was aborted

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T17-32-43-330Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T17-32-43-330Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T17-32-43-330Z/responses`

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
| seed-focus-recovery-loop | 200 | 9211332f-4b04-4feb-8ea5-1888b733368b | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 6df9d459-0b6c-4aa6-8fd4-c574f4c2b1b8 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | b59736d8-a75e-4a15-a2c8-acff5d7f6c1a | — | — | — | — | passed |
| chief-route-recovery | 200 | 335eaffb-8c8e-4da1-9642-125f0a9f7c87 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 335eaffb-8c8e-4da1-9642-125f0a9f7c87 | — | — | — | — | passed |
| chief-route-task-management | 200 | 65d34105-2567-4c53-90ed-f346d55c90ae | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 65d34105-2567-4c53-90ed-f346d55c90ae | — | — | — | — | passed |
| chief-route-reflection | 200 | 9b4541f7-5e4b-4af3-8cdd-2af0208f23b5 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 9b4541f7-5e4b-4af3-8cdd-2af0208f23b5 | — | — | — | — | passed |
| debug-state-insight | 200 | 1b391801-45e2-4d68-8faf-236db02c7860 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 1b391801-45e2-4d68-8faf-236db02c7860 | — | — | — | — | passed |
| debug-task-management | 200 | 285cf0ce-d69f-4919-8ad6-7ceab1d2f99f | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 285cf0ce-d69f-4919-8ad6-7ceab1d2f99f | — | — | — | — | passed |
| debug-progress-feedback | 200 | 9699571d-a59c-48cc-8ad4-dd767c74fb12 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 9699571d-a59c-48cc-8ad4-dd767c74fb12 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | c7ae27c7-a8de-4ce6-b96d-9c65050fb44a | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | c7ae27c7-a8de-4ce6-b96d-9c65050fb44a | — | — | — | — | passed |
| debug-reflection | 200 | 514b0d61-9d1c-4e8c-80d9-20352cbe16be | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 514b0d61-9d1c-4e8c-80d9-20352cbe16be | — | — | — | — | passed |
| debug-automation | 200 | 35704b6a-9b3b-49ff-b637-463aa1fbcf1b | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 35704b6a-9b3b-49ff-b637-463aa1fbcf1b | — | — | — | — | passed |
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
| reflection-latest-monthly | 200 | — | — | — | — | — | passed |
| web-dashboard-summary | 200 | — | — | — | — | — | passed |
| web-goalflow-overview | 200 | — | — | — | — | — | passed |
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| full-regression | 200 | 836865df-c72f-459f-a881-c4e77f4b89d8 | — | — | — | — | passed |
| full-regression-trace | 200 | 836865df-c72f-459f-a881-c4e77f4b89d8 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 1b19b23a-7ab8-4fc8-aa70-c3756c0c24ef | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 1b19b23a-7ab8-4fc8-aa70-c3756c0c24ef | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 711984a3-4541-49d5-9720-8436979625ab | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | a97780d2-34f8-42dc-abc3-0fd1db53fc27 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 29d4d53f-a67d-43c9-b257-741c209416d9 | — | — | — | — | passed |
| probe-chief-agent | 200 | 6b7ec9a5-7cb4-441e-9f06-dea68c852a5b | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 6b7ec9a5-7cb4-441e-9f06-dea68c852a5b | — | — | — | — | passed |
| probe-state-insight-agent | 200 | eb8d726b-7161-4cc1-91b5-d7a35a79dd29 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | eb8d726b-7161-4cc1-91b5-d7a35a79dd29 | — | — | — | — | passed |
| probe-task-management-agent | 200 | f10093aa-6d41-4703-b2ce-c596cabc9eec | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | f10093aa-6d41-4703-b2ce-c596cabc9eec | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | d9f48863-8d50-4ebb-8bc8-f8929a1ddeb4 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | d9f48863-8d50-4ebb-8bc8-f8929a1ddeb4 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 1525ae30-e759-46ba-8f03-43c27063b03e | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 1525ae30-e759-46ba-8f03-43c27063b03e | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 29cdb074-3d22-4c78-bcb2-7c72485632c1 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 29cdb074-3d22-4c78-bcb2-7c72485632c1 | — | — | — | — | passed |
| probe-automation-agent | 200 | b6655ab5-9c88-4d76-932b-067d9ae5b2f7 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | b6655ab5-9c88-4d76-932b-067d9ae5b2f7 | — | — | — | — | passed |
| chief-route-recovery | 200 | b8ff5f44-2912-4f91-b3d3-a97e25bf3eb1 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | b8ff5f44-2912-4f91-b3d3-a97e25bf3eb1 | — | — | — | — | passed |
| chief-route-task-management | 200 | a5a8ff39-de20-45aa-934c-2fd6c91f5057 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | a5a8ff39-de20-45aa-934c-2fd6c91f5057 | — | — | — | — | passed |
| chief-route-reflection | 200 | 517bfbfa-2995-4f4f-8dcb-018f6c11cf73 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 517bfbfa-2995-4f4f-8dcb-018f6c11cf73 | — | — | — | — | passed |
| debug-state-insight | 200 | dd3fcc24-8c6b-4cf6-979c-d86d4e66ffc5 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | dd3fcc24-8c6b-4cf6-979c-d86d4e66ffc5 | — | — | — | — | passed |
| debug-task-management | 200 | c97245d3-1f4b-4df7-b029-65c6900cea53 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | c97245d3-1f4b-4df7-b029-65c6900cea53 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 14affdaf-df1a-4f4d-b7bd-f7e6dd22cd85 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 14affdaf-df1a-4f4d-b7bd-f7e6dd22cd85 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 074019e3-cc63-41af-8334-f3e0ed6272cf | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 074019e3-cc63-41af-8334-f3e0ed6272cf | — | — | — | — | passed |
| debug-reflection | 200 | 809b9084-e116-495c-864e-fff021d02c42 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 809b9084-e116-495c-864e-fff021d02c42 | — | — | — | — | passed |
| debug-automation | 200 | 181f8554-1aed-4459-afe8-4625c80bb523 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 181f8554-1aed-4459-afe8-4625c80bb523 | — | — | — | — | passed |
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
| reflection-latest-monthly | ERR | — | — | — | — | — | This operation was aborted |

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
| seed-focus-recovery-loop | 200 | 0b00e261-3c7b-406f-9a1e-d073b569bb02 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | c46cb0ff-d28b-42e5-8091-7e84c9a7cf39 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 6ba88dc9-dbc4-49cd-990d-894029dfbe89 | — | — | — | — | passed |
| probe-chief-agent | 200 | 7b7c84af-a78c-4abf-9b6a-8a66059cd329 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 7b7c84af-a78c-4abf-9b6a-8a66059cd329 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | f9a200c7-4000-425b-8657-3e84736f2a16 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | f9a200c7-4000-425b-8657-3e84736f2a16 | — | — | — | — | passed |
| probe-task-management-agent | 200 | a30558a9-5a1b-4ab7-a772-b14a82f73e0e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | a30558a9-5a1b-4ab7-a772-b14a82f73e0e | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 7812c20c-89d7-44b8-a344-f25cd33f6103 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 7812c20c-89d7-44b8-a344-f25cd33f6103 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 6d50f742-9997-47bb-9e4d-f729b99fff3a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 6d50f742-9997-47bb-9e4d-f729b99fff3a | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | aca07892-56c5-47e7-b2f1-1afb90b06e8d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | aca07892-56c5-47e7-b2f1-1afb90b06e8d | — | — | — | — | passed |
| probe-automation-agent | 200 | c8fb5978-c67e-4a92-aabd-fc1ebb05f6d6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | c8fb5978-c67e-4a92-aabd-fc1ebb05f6d6 | — | — | — | — | passed |
| chief-route-recovery | 200 | 2c2b1958-4c7a-4c81-bf26-9a2b51a044a5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 2c2b1958-4c7a-4c81-bf26-9a2b51a044a5 | — | — | — | — | passed |
| chief-route-task-management | 200 | 3aab2ee3-9c04-4878-ac8e-3b2ba5a01fcb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 3aab2ee3-9c04-4878-ac8e-3b2ba5a01fcb | — | — | — | — | passed |
| chief-route-reflection | 200 | 4038a467-dc7e-4e36-be2f-e0d0c4eb5cc6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 4038a467-dc7e-4e36-be2f-e0d0c4eb5cc6 | — | — | — | — | passed |
| debug-state-insight | 200 | a100e078-1d6d-4b7a-a756-15eceb2a325f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | a100e078-1d6d-4b7a-a756-15eceb2a325f | — | — | — | — | passed |
| debug-task-management | 200 | 4bd56cc3-df30-4661-80d2-dbdc8f35b6c0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 4bd56cc3-df30-4661-80d2-dbdc8f35b6c0 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 742be50a-8e43-437d-80f0-d119dad747cd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 742be50a-8e43-437d-80f0-d119dad747cd | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 13b21059-e17e-453d-9190-dc4b4b112ae0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 13b21059-e17e-453d-9190-dc4b4b112ae0 | — | — | — | — | passed |
| debug-reflection | 200 | 0c08961d-29bd-499a-a8df-8c55285f2cde | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 0c08961d-29bd-499a-a8df-8c55285f2cde | — | — | — | — | passed |
| debug-automation | 200 | fd722111-0553-4502-9f5d-579e37fd02a7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | fd722111-0553-4502-9f5d-579e37fd02a7 | — | — | — | — | passed |
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
| reflection-latest-monthly | 200 | — | — | — | — | — | passed |
| web-dashboard-summary | 200 | — | — | — | — | — | passed |
| web-goalflow-overview | 200 | — | — | — | — | — | passed |
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| full-regression | 200 | 42952f4f-e88a-4bdb-b0f2-baa93db757b2 | — | — | — | — | passed |
| full-regression-trace | 200 | 42952f4f-e88a-4bdb-b0f2-baa93db757b2 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 3d490a9e-ccae-4f7a-a044-330a039e05b0 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 3d490a9e-ccae-4f7a-a044-330a039e05b0 | — | — | — | — | passed |

