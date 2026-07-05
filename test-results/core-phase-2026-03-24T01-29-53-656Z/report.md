# Core Phase Test Report

- Started: `2026-03-24T01:29:53.657Z`
- Completed: `2026-03-24T01:31:36.955Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-29-53-656Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-29-53-656Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-29-53-656Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
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
| seed-focus-recovery-loop | 200 | 03111713-cd93-4303-b86e-1f8379c4d7c9 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | cbb146bd-b31f-4f28-b1d1-6d6c0b96d231 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | ac6ae385-ae26-42cb-836b-7189eabce032 | — | — | — | — | passed |
| chief-route-recovery | 200 | 4eaa27d4-7a62-4309-83b7-f79514f6dc5d | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 4eaa27d4-7a62-4309-83b7-f79514f6dc5d | — | — | — | — | passed |
| chief-route-task-management | 200 | e8c62005-e4a6-426e-a58c-40845d8ec367 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | e8c62005-e4a6-426e-a58c-40845d8ec367 | — | — | — | — | passed |
| chief-route-reflection | 200 | 66eac3fb-021b-404a-9af5-75e785c52de1 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 66eac3fb-021b-404a-9af5-75e785c52de1 | — | — | — | — | passed |
| debug-state-insight | 200 | 84a248dc-c8fd-492a-b8bc-dd95b87d3190 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 84a248dc-c8fd-492a-b8bc-dd95b87d3190 | — | — | — | — | passed |
| debug-task-management | 200 | 43d4e96b-08e1-4409-948b-4d16aa62ac18 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 43d4e96b-08e1-4409-948b-4d16aa62ac18 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 6c53b44a-0492-4ba4-b219-71c2b5134d5f | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 6c53b44a-0492-4ba4-b219-71c2b5134d5f | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 33a3bcd2-7bd4-45a3-9cfe-11a83a8917f9 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 33a3bcd2-7bd4-45a3-9cfe-11a83a8917f9 | — | — | — | — | passed |
| debug-reflection | 200 | f37fd01b-99c5-42f7-9cee-106ba573165b | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | f37fd01b-99c5-42f7-9cee-106ba573165b | — | — | — | — | passed |
| debug-automation | 200 | c887de49-f462-4044-8f05-75c52955f4e9 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | c887de49-f462-4044-8f05-75c52955f4e9 | — | — | — | — | passed |
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
| full-regression | 200 | 2dfdfc7e-db9c-4f05-9daf-95877846d8e6 | — | — | — | — | passed |
| full-regression-trace | 200 | 2dfdfc7e-db9c-4f05-9daf-95877846d8e6 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | cada2531-7323-4b08-8e35-99e8027c2c74 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | cada2531-7323-4b08-8e35-99e8027c2c74 | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
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
| seed-focus-recovery-loop | 200 | 97210d52-7691-4b05-9914-31e843f2758e | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 86319bf5-6605-4ebb-8b58-ff5b8ee9eb50 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 0b36e3d6-020e-493d-a59b-5cbbd4fa6739 | — | — | — | — | passed |
| probe-chief-agent | 200 | adbe195e-9cd3-4c97-abd9-a2ae3baf17bc | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | adbe195e-9cd3-4c97-abd9-a2ae3baf17bc | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 97469985-dd43-4176-8c17-56d95ff848cb | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 97469985-dd43-4176-8c17-56d95ff848cb | — | — | — | — | passed |
| probe-task-management-agent | 200 | 9dfcffaf-072c-4619-bd3c-6f2cd94256a2 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 9dfcffaf-072c-4619-bd3c-6f2cd94256a2 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 0dbd64a4-54b2-43c0-814f-f91bb1a12b27 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 0dbd64a4-54b2-43c0-814f-f91bb1a12b27 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | daf4b894-fb63-4316-82ca-8b6021ec59ec | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | daf4b894-fb63-4316-82ca-8b6021ec59ec | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 1e077abd-7082-430d-91b9-0bdf0d358f90 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 1e077abd-7082-430d-91b9-0bdf0d358f90 | — | — | — | — | passed |
| probe-automation-agent | 200 | 48ad010e-ceba-4c66-b07d-c752338f4147 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 48ad010e-ceba-4c66-b07d-c752338f4147 | — | — | — | — | passed |
| chief-route-recovery | 200 | 9ecf77f5-4b19-49a0-a050-de050205785a | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 9ecf77f5-4b19-49a0-a050-de050205785a | — | — | — | — | passed |
| chief-route-task-management | 200 | 31e4d9a2-dc1f-4636-89ce-e93832e7994a | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 31e4d9a2-dc1f-4636-89ce-e93832e7994a | — | — | — | — | passed |
| chief-route-reflection | 200 | 7871cd94-a36c-424e-9446-fac90cfa16f7 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 7871cd94-a36c-424e-9446-fac90cfa16f7 | — | — | — | — | passed |
| debug-state-insight | 200 | ffcfbc60-f3b8-49ed-baff-274efabd1402 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | ffcfbc60-f3b8-49ed-baff-274efabd1402 | — | — | — | — | passed |
| debug-task-management | 200 | aa9c1ae6-046b-45db-a642-9da0b0e1350b | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | aa9c1ae6-046b-45db-a642-9da0b0e1350b | — | — | — | — | passed |
| debug-progress-feedback | 200 | caad977c-0221-46f9-8a3f-404d08b769aa | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | caad977c-0221-46f9-8a3f-404d08b769aa | — | — | — | — | passed |
| debug-interruption-recovery | 200 | aafac525-8bbe-4f15-8a52-64fc8d34adb2 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | aafac525-8bbe-4f15-8a52-64fc8d34adb2 | — | — | — | — | passed |
| debug-reflection | 200 | c2cd4317-d8ed-4c49-8dec-98d3c7a2d4ed | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | c2cd4317-d8ed-4c49-8dec-98d3c7a2d4ed | — | — | — | — | passed |
| debug-automation | 200 | 71f4bba0-0807-4aa9-a22a-cd4ed430b028 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 71f4bba0-0807-4aa9-a22a-cd4ed430b028 | — | — | — | — | passed |
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
| full-regression | 200 | 5c5f8b95-8e8f-40c5-9ea0-e8a94008ec6c | — | — | — | — | passed |
| full-regression-trace | 200 | 5c5f8b95-8e8f-40c5-9ea0-e8a94008ec6c | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 3fae5c4b-b6db-45c1-9e84-207e9aaba3ea | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 3fae5c4b-b6db-45c1-9e84-207e9aaba3ea | — | — | — | — | passed |

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`aligned`
- OpenClaw Base URL：`http://127.0.0.1:8788`
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
| seed-focus-recovery-loop | 200 | b1e80867-4ce8-4631-bbcc-135932f3fdb7 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 195072f0-8c1b-4113-9ed2-f558b24efa79 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 94f961ff-d323-4d6b-a6e7-607b255a8842 | — | — | — | — | passed |
| probe-chief-agent | 200 | aaa5586d-5d53-4ac6-af09-5976f8c618e7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | aaa5586d-5d53-4ac6-af09-5976f8c618e7 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 9241d11d-7d28-457a-a13e-720b54ced479 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 9241d11d-7d28-457a-a13e-720b54ced479 | — | — | — | — | passed |
| probe-task-management-agent | 200 | ed47350d-3990-4520-877b-8a88b9ebb432 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | ed47350d-3990-4520-877b-8a88b9ebb432 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | fa81f589-5894-46b6-b228-e2084a21e334 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | fa81f589-5894-46b6-b228-e2084a21e334 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 27cd2133-ccd4-4779-8d36-73cd54f9f802 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 27cd2133-ccd4-4779-8d36-73cd54f9f802 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 7f65d586-ee63-44a3-9436-e9185482cd22 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 7f65d586-ee63-44a3-9436-e9185482cd22 | — | — | — | — | passed |
| probe-automation-agent | 200 | 07cbc44b-12fa-40b9-814a-9f17ae4cf0cc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 07cbc44b-12fa-40b9-814a-9f17ae4cf0cc | — | — | — | — | passed |
| chief-route-recovery | 200 | 3bef4917-8ce2-4ff9-bbc4-eb3b2ebcaa29 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 3bef4917-8ce2-4ff9-bbc4-eb3b2ebcaa29 | — | — | — | — | passed |
| chief-route-task-management | 200 | 2ab5295a-06ef-4c90-a455-ac1c89604a3f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 2ab5295a-06ef-4c90-a455-ac1c89604a3f | — | — | — | — | passed |
| chief-route-reflection | 200 | 89cc9c40-34b7-433f-b85e-c3f3b63c7cee | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 89cc9c40-34b7-433f-b85e-c3f3b63c7cee | — | — | — | — | passed |
| debug-state-insight | 200 | ab33e90e-6661-4d9f-b2b5-adb9e26b0ae3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | ab33e90e-6661-4d9f-b2b5-adb9e26b0ae3 | — | — | — | — | passed |
| debug-task-management | 200 | abd58df4-91e1-4522-b8ba-4d264e0f3522 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | abd58df4-91e1-4522-b8ba-4d264e0f3522 | — | — | — | — | passed |
| debug-progress-feedback | 200 | abe527aa-4b64-4b01-9b7b-9da9b81ed6db | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | abe527aa-4b64-4b01-9b7b-9da9b81ed6db | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 474019e2-8732-440c-9b90-7d6e753b3346 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 474019e2-8732-440c-9b90-7d6e753b3346 | — | — | — | — | passed |
| debug-reflection | 200 | dfe01733-b026-4b52-9e3f-3c7ecbe56d2c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | dfe01733-b026-4b52-9e3f-3c7ecbe56d2c | — | — | — | — | passed |
| debug-automation | 200 | a433c93f-7402-4bb3-a335-7a7d90949c06 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | a433c93f-7402-4bb3-a335-7a7d90949c06 | — | — | — | — | passed |
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
| full-regression | 200 | 89ba2013-52d8-48d7-9ab7-40955892a68b | — | — | — | — | passed |
| full-regression-trace | 200 | 89ba2013-52d8-48d7-9ab7-40955892a68b | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 9d9dc1f5-8ddb-4946-b135-40a30b62993d | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 9d9dc1f5-8ddb-4946-b135-40a30b62993d | — | — | — | — | passed |

