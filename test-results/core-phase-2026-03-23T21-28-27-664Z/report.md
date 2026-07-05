# Core Phase Test Report

- Started: `2026-03-23T21:28:27.665Z`
- Completed: `2026-03-23T21:30:11.781Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-28-27-664Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-28-27-664Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-28-27-664Z/responses`

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
| seed-focus-recovery-loop | 200 | 0c76278a-0022-46f4-96cc-78e6c2260361 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 4a2f6bd9-b9ba-4450-9967-33d4f778ee90 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 42e7711c-c648-482e-b493-f4b7222bd619 | — | — | — | — | passed |
| chief-route-recovery | 200 | a0d95594-1c21-4bba-ad30-4c301c5eb336 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | a0d95594-1c21-4bba-ad30-4c301c5eb336 | — | — | — | — | passed |
| chief-route-task-management | 200 | ddc876e0-2d83-41a9-b47c-c32eb7c4c8fe | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | ddc876e0-2d83-41a9-b47c-c32eb7c4c8fe | — | — | — | — | passed |
| chief-route-reflection | 200 | 4da421ad-fec4-4f4f-b71f-37c3617bc24b | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 4da421ad-fec4-4f4f-b71f-37c3617bc24b | — | — | — | — | passed |
| debug-state-insight | 200 | 09e7aa03-f042-4ba7-9de4-88e427d5b0b7 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 09e7aa03-f042-4ba7-9de4-88e427d5b0b7 | — | — | — | — | passed |
| debug-task-management | 200 | 6cfd3cac-418c-41f3-86d7-be6e3a6e6858 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 6cfd3cac-418c-41f3-86d7-be6e3a6e6858 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 62858751-4b2c-4e3a-80ce-8c04c4ad6f3c | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 62858751-4b2c-4e3a-80ce-8c04c4ad6f3c | — | — | — | — | passed |
| debug-interruption-recovery | 200 | c090984c-7484-4e4d-a00a-24b4a9c92178 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | c090984c-7484-4e4d-a00a-24b4a9c92178 | — | — | — | — | passed |
| debug-reflection | 200 | 67a931c7-3182-4427-89d9-469c45c6fb7c | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 67a931c7-3182-4427-89d9-469c45c6fb7c | — | — | — | — | passed |
| debug-automation | 200 | e6226271-15de-4e86-acad-fd762b2e13be | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | e6226271-15de-4e86-acad-fd762b2e13be | — | — | — | — | passed |
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
| full-regression | 200 | 92d775f7-647c-4e3b-bd2f-ab36b5e2b9a9 | — | — | — | — | passed |
| full-regression-trace | 200 | 92d775f7-647c-4e3b-bd2f-ab36b5e2b9a9 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 730e5569-0a94-4a10-b419-ee330ea36304 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 730e5569-0a94-4a10-b419-ee330ea36304 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 07dff2cf-f593-44dc-9b65-4553061078f7 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | d48cd7ca-71af-4108-98e3-84a771a42110 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 9f8903d1-b076-44d3-82e0-c7c347ed2247 | — | — | — | — | passed |
| probe-chief-agent | 200 | 75cf3787-c782-4118-9834-501240437ae3 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 75cf3787-c782-4118-9834-501240437ae3 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 1249fb8b-6f1a-4d70-affa-3cdf9798bf79 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 1249fb8b-6f1a-4d70-affa-3cdf9798bf79 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 3b4877c1-b551-4298-aa66-15673377c287 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 3b4877c1-b551-4298-aa66-15673377c287 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 577d7483-bae4-4158-af17-13504c0f3978 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 577d7483-bae4-4158-af17-13504c0f3978 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 62db1cde-f8f6-43f8-8492-998ef254e1f3 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 62db1cde-f8f6-43f8-8492-998ef254e1f3 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 655b5781-359c-4254-b4ec-5b3c433bcdc7 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 655b5781-359c-4254-b4ec-5b3c433bcdc7 | — | — | — | — | passed |
| probe-automation-agent | 200 | ec966d51-eb19-4068-b44a-b9ce7889b08a | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | ec966d51-eb19-4068-b44a-b9ce7889b08a | — | — | — | — | passed |
| chief-route-recovery | 200 | ee4de065-02d3-43b4-a450-b10c408bd263 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | ee4de065-02d3-43b4-a450-b10c408bd263 | — | — | — | — | passed |
| chief-route-task-management | 200 | 9771243c-f691-467e-b0b1-3dc44c63e500 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 9771243c-f691-467e-b0b1-3dc44c63e500 | — | — | — | — | passed |
| chief-route-reflection | 200 | 7147aa74-5897-46ab-aeab-8fa9e681107d | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 7147aa74-5897-46ab-aeab-8fa9e681107d | — | — | — | — | passed |
| debug-state-insight | 200 | d587425f-9679-4f20-945b-e9737b72bcb3 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | d587425f-9679-4f20-945b-e9737b72bcb3 | — | — | — | — | passed |
| debug-task-management | 200 | 7309c874-16e1-4697-9d05-4db32b585097 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 7309c874-16e1-4697-9d05-4db32b585097 | — | — | — | — | passed |
| debug-progress-feedback | 200 | f4ab9b69-a7c5-4ba5-8292-a7f481432f4a | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | f4ab9b69-a7c5-4ba5-8292-a7f481432f4a | — | — | — | — | passed |
| debug-interruption-recovery | 200 | b1b8ca6b-6003-4024-bcd6-396eb381e439 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | b1b8ca6b-6003-4024-bcd6-396eb381e439 | — | — | — | — | passed |
| debug-reflection | 200 | 4a6d0380-939d-4a7c-bb0c-74c10892ff53 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 4a6d0380-939d-4a7c-bb0c-74c10892ff53 | — | — | — | — | passed |
| debug-automation | 200 | afa20cd6-b072-481b-9299-8c9263bca15b | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | afa20cd6-b072-481b-9299-8c9263bca15b | — | — | — | — | passed |
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
| full-regression | 200 | 6a0a92c0-64e0-409f-b2e5-9444ba183b28 | — | — | — | — | passed |
| full-regression-trace | 200 | 6a0a92c0-64e0-409f-b2e5-9444ba183b28 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | afd253fd-d170-455e-b589-141f4507c01d | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | afd253fd-d170-455e-b589-141f4507c01d | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | aa66d5dc-93f0-414e-adc0-65ce65cbaed9 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 4b33146e-dc7f-4ae3-8712-ebda1ebdeb9e | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | e8cc0dd5-6a5d-47f5-a8b1-6d28f7076151 | — | — | — | — | passed |
| probe-chief-agent | 200 | 51fff7eb-4335-4131-9469-26eb6ee5b03a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 51fff7eb-4335-4131-9469-26eb6ee5b03a | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 92cabe24-5d42-46c1-a8ef-e98331ec44ac | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 92cabe24-5d42-46c1-a8ef-e98331ec44ac | — | — | — | — | passed |
| probe-task-management-agent | 200 | 1063a90e-9eb0-4fe7-9896-89d1fe94180f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 1063a90e-9eb0-4fe7-9896-89d1fe94180f | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 6f23cb6d-1fc7-4ee9-9a68-60ad5501e163 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 6f23cb6d-1fc7-4ee9-9a68-60ad5501e163 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 37132889-22f4-489f-aa56-7c09ca2961a1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 37132889-22f4-489f-aa56-7c09ca2961a1 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | d220ff2d-d94a-4249-8834-a6407c68f632 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | d220ff2d-d94a-4249-8834-a6407c68f632 | — | — | — | — | passed |
| probe-automation-agent | 200 | 71067cce-5854-4e11-a56a-7bd8d0eb2d2e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 71067cce-5854-4e11-a56a-7bd8d0eb2d2e | — | — | — | — | passed |
| chief-route-recovery | 200 | 9db68228-bfa5-4d89-9ea9-42eb72c7623a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 9db68228-bfa5-4d89-9ea9-42eb72c7623a | — | — | — | — | passed |
| chief-route-task-management | 200 | da3d6a93-3a1a-4f89-9db9-7eddf5f4126b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | da3d6a93-3a1a-4f89-9db9-7eddf5f4126b | — | — | — | — | passed |
| chief-route-reflection | 200 | 76514053-706e-4351-9d7c-05198acbbd4d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 76514053-706e-4351-9d7c-05198acbbd4d | — | — | — | — | passed |
| debug-state-insight | 200 | 83684d1c-4d4a-4302-8e16-d874a806d845 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 83684d1c-4d4a-4302-8e16-d874a806d845 | — | — | — | — | passed |
| debug-task-management | 200 | dde88dbb-7662-4604-ac3a-86dfcee56a17 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | dde88dbb-7662-4604-ac3a-86dfcee56a17 | — | — | — | — | passed |
| debug-progress-feedback | 200 | e19f5e50-1760-45c1-8ae8-5f771b15ae7f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | e19f5e50-1760-45c1-8ae8-5f771b15ae7f | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 8c08ced4-3ecc-4315-a4c2-6e18ad1b5d14 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 8c08ced4-3ecc-4315-a4c2-6e18ad1b5d14 | — | — | — | — | passed |
| debug-reflection | 200 | 7c08da9f-0503-47de-8385-c0550e14e682 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 7c08da9f-0503-47de-8385-c0550e14e682 | — | — | — | — | passed |
| debug-automation | 200 | 9fe46444-42f7-4b84-b0ef-2cb7ddfeba4c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 9fe46444-42f7-4b84-b0ef-2cb7ddfeba4c | — | — | — | — | passed |
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
| full-regression | 200 | 60ddbcbe-b6c8-4f3d-8ae3-3526ad2b7224 | — | — | — | — | passed |
| full-regression-trace | 200 | 60ddbcbe-b6c8-4f3d-8ae3-3526ad2b7224 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | b9b75c41-1193-4adc-a9e9-6d790c50cd3d | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | b9b75c41-1193-4adc-a9e9-6d790c50cd3d | — | — | — | — | passed |

