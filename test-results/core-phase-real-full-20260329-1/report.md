# Core Phase Test Report

- Started: `2026-03-29T14:43:29.701Z`
- Completed: `2026-03-29T14:49:01.543Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4175`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | not_configured | — | 58/58 |
| Phase 2 Provider Direct | failed | openai-compatible | not_configured | — | 56/72 |
| Phase 3 Cluster Preferred | passed | openai-compatible | aligned | http://127.0.0.1:8788 | 72/72 |

## Failures

- [provider-direct] provider-direct-phase: Provider phase probe failed: probe-chief-agent

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-full-20260329-1/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-full-20260329-1/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-full-20260329-1/responses`

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
| seed-focus-recovery-loop | 200 | ffcc068e-984d-4ee9-a6ee-8f3ba9d204a2 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 5bb1c290-308c-449b-83ff-0a6e2f5f26a7 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | ce97fb81-253e-4ac2-800e-28a426df83f7 | — | — | — | — | passed |
| chief-route-recovery | 200 | fe89053b-1310-4cf0-b2ed-05c6df15d07a | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | fe89053b-1310-4cf0-b2ed-05c6df15d07a | — | — | — | — | passed |
| chief-route-task-management | 200 | ff1bc43a-4a8b-4d11-9ebd-df5b65b853b5 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | ff1bc43a-4a8b-4d11-9ebd-df5b65b853b5 | — | — | — | — | passed |
| chief-route-reflection | 200 | 889d678b-7483-4054-8e45-1476cc38461a | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 889d678b-7483-4054-8e45-1476cc38461a | — | — | — | — | passed |
| debug-state-insight | 200 | f52093a8-befb-45d2-95f9-bb4d3c132f0b | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | f52093a8-befb-45d2-95f9-bb4d3c132f0b | — | — | — | — | passed |
| debug-task-management | 200 | dd72ae73-2e25-47e9-9ec3-0797c0135868 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | dd72ae73-2e25-47e9-9ec3-0797c0135868 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 92da3b03-39eb-49af-9b16-b60f83f30eed | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 92da3b03-39eb-49af-9b16-b60f83f30eed | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 20da6add-74eb-4fe9-ae66-4503e3dab29c | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 20da6add-74eb-4fe9-ae66-4503e3dab29c | — | — | — | — | passed |
| debug-reflection | 200 | c87c1643-0bd5-491c-acba-77f3a0cfed97 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | c87c1643-0bd5-491c-acba-77f3a0cfed97 | — | — | — | — | passed |
| debug-automation | 200 | 93bd3b93-a053-4ee6-9379-642203d44795 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 93bd3b93-a053-4ee6-9379-642203d44795 | — | — | — | — | passed |
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
| full-regression | 200 | ee197357-e305-438c-b736-645be7e9d5a4 | — | — | — | — | passed |
| full-regression-trace | 200 | ee197357-e305-438c-b736-645be7e9d5a4 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | c585e08b-1ed4-483f-81e1-d9c29a3e897b | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | c585e08b-1ed4-483f-81e1-d9c29a3e897b | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`failed`
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
| seed-focus-recovery-loop | 200 | 12dddfa4-00ed-40bd-a20b-bbdb012345e3 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 6e6b7312-e13a-4b23-afe9-d671816930ba | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | bf3d26ca-ab05-49ca-922a-bb71edbedc2c | — | — | — | — | passed |
| probe-chief-agent | 200 | 38970d9a-39fd-41f1-9d9c-7f51138525e5 | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| probe-chief-agent-trace | 200 | 38970d9a-39fd-41f1-9d9c-7f51138525e5 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | eb03e926-9ff6-4344-8a2e-7ef057ef6921 | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| probe-state-insight-agent-trace | 200 | eb03e926-9ff6-4344-8a2e-7ef057ef6921 | — | — | — | — | passed |
| probe-task-management-agent | 200 | bdccf1f5-4b72-47db-85a9-2126c3150a07 | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| probe-task-management-agent-trace | 200 | bdccf1f5-4b72-47db-85a9-2126c3150a07 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 8346b742-ff51-417e-a311-d1ce440db83b | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| probe-progress-feedback-agent-trace | 200 | 8346b742-ff51-417e-a311-d1ce440db83b | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | f4e23685-90c9-483f-b445-50fc50a520a6 | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| probe-interruption-recovery-agent-trace | 200 | f4e23685-90c9-483f-b445-50fc50a520a6 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | fe3f42f7-37ad-4b48-9fee-3cb1b6eb14b6 | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| probe-reflection-coach-agent-trace | 200 | fe3f42f7-37ad-4b48-9fee-3cb1b6eb14b6 | — | — | — | — | passed |
| probe-automation-agent | 200 | 43db111f-4ef1-44c4-a73a-89533ee291bc | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| probe-automation-agent-trace | 200 | 43db111f-4ef1-44c4-a73a-89533ee291bc | — | — | — | — | passed |
| chief-route-recovery | 200 | 2351bf18-ab68-4120-af9a-88f6b9420a19 | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| chief-route-recovery-trace | 200 | 2351bf18-ab68-4120-af9a-88f6b9420a19 | — | — | — | — | passed |
| chief-route-task-management | 200 | af52d5fb-5d7e-4b9a-ac43-83942cd0fed2 | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| chief-route-task-management-trace | 200 | af52d5fb-5d7e-4b9a-ac43-83942cd0fed2 | — | — | — | — | passed |
| chief-route-reflection | 200 | a74c721f-555e-4792-882b-f0acaeb13de3 | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| chief-route-reflection-trace | 200 | a74c721f-555e-4792-882b-f0acaeb13de3 | — | — | — | — | passed |
| debug-state-insight | 200 | c364e89d-c901-4663-af63-4adabaeb174b | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| debug-state-insight-trace | 200 | c364e89d-c901-4663-af63-4adabaeb174b | — | — | — | — | passed |
| debug-task-management | 200 | b3e2e111-a5b5-4c92-b320-0ef185d526cb | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| debug-task-management-trace | 200 | b3e2e111-a5b5-4c92-b320-0ef185d526cb | — | — | — | — | passed |
| debug-progress-feedback | 200 | d7dabf6c-c61b-4247-ac24-c3bba3295de9 | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| debug-progress-feedback-trace | 200 | d7dabf6c-c61b-4247-ac24-c3bba3295de9 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 933cfc27-3667-4164-9f4e-408bead2fabc | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| debug-interruption-recovery-trace | 200 | 933cfc27-3667-4164-9f4e-408bead2fabc | — | — | — | — | passed |
| debug-reflection | 200 | ba68db4d-2ece-4508-b81f-94e6180304fe | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| debug-reflection-trace | 200 | ba68db4d-2ece-4508-b81f-94e6180304fe | — | — | — | — | passed |
| debug-automation | 200 | 8b6f00bb-89a5-4c46-8fe7-49505d7bad11 | failed | /v1/responses | true | Provider returned HTTP 401. | passed |
| debug-automation-trace | 200 | 8b6f00bb-89a5-4c46-8fe7-49505d7bad11 | — | — | — | — | passed |
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
| full-regression | 200 | 1664613d-3489-4a30-97ad-6a6e5e37c7f4 | — | — | — | — | passed |
| full-regression-trace | 200 | 1664613d-3489-4a30-97ad-6a6e5e37c7f4 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 78ad0fe3-701d-4f16-8696-20df77725263 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 78ad0fe3-701d-4f16-8696-20df77725263 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 387ecf75-2a7a-4c45-8757-d21c40717e78 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 52cccb23-8b8f-4a48-bb9f-7541c8a73e9a | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 78eedb92-0c58-4a15-b056-9c7f726d57fc | — | — | — | — | passed |
| probe-chief-agent | 200 | 5a39761b-8a7e-4740-9c4c-dfdc874878dc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 5a39761b-8a7e-4740-9c4c-dfdc874878dc | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 80de0878-721b-4171-a75e-6b7bfebdf589 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 80de0878-721b-4171-a75e-6b7bfebdf589 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 69fd7b8e-f89c-4761-957a-ce24fda05aa0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 69fd7b8e-f89c-4761-957a-ce24fda05aa0 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 54309f30-c0b3-4ffb-850e-28f6c0f9b715 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 54309f30-c0b3-4ffb-850e-28f6c0f9b715 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 2adfa235-98e4-43a3-982a-5e87478d4738 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 2adfa235-98e4-43a3-982a-5e87478d4738 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 74e913c8-3d6f-4b4a-80fc-0dee7440c4dd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 74e913c8-3d6f-4b4a-80fc-0dee7440c4dd | — | — | — | — | passed |
| probe-automation-agent | 200 | d70ab94c-bb69-4196-8f81-6567b178467a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | d70ab94c-bb69-4196-8f81-6567b178467a | — | — | — | — | passed |
| chief-route-recovery | 200 | d09ba949-83d0-429a-982e-0312bce4b4e1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | d09ba949-83d0-429a-982e-0312bce4b4e1 | — | — | — | — | passed |
| chief-route-task-management | 200 | a8aa5fc5-0d82-4070-87dd-ac79db13b848 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | a8aa5fc5-0d82-4070-87dd-ac79db13b848 | — | — | — | — | passed |
| chief-route-reflection | 200 | a70ae195-a03b-47a6-bae0-b2dd87612c8e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | a70ae195-a03b-47a6-bae0-b2dd87612c8e | — | — | — | — | passed |
| debug-state-insight | 200 | 7c262102-cf40-4ddb-a667-06828ba2e40a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 7c262102-cf40-4ddb-a667-06828ba2e40a | — | — | — | — | passed |
| debug-task-management | 200 | ef1f98a2-7064-4a96-9612-7a9c3fb41ea2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | ef1f98a2-7064-4a96-9612-7a9c3fb41ea2 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 3599241a-679a-4505-8283-9c7ae625f43b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 3599241a-679a-4505-8283-9c7ae625f43b | — | — | — | — | passed |
| debug-interruption-recovery | 200 | e0f98e7c-fb49-4b8d-aeee-d617e754f00e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | e0f98e7c-fb49-4b8d-aeee-d617e754f00e | — | — | — | — | passed |
| debug-reflection | 200 | c95b4712-d111-4350-a301-d996483d28f3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | c95b4712-d111-4350-a301-d996483d28f3 | — | — | — | — | passed |
| debug-automation | 200 | 219685a1-ca22-4044-a3cc-4eba07ff2cc9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 219685a1-ca22-4044-a3cc-4eba07ff2cc9 | — | — | — | — | passed |
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
| full-regression | 200 | 5ae60bfb-addf-483e-9a40-77b5d284dbd0 | — | — | — | — | passed |
| full-regression-trace | 200 | 5ae60bfb-addf-483e-9a40-77b5d284dbd0 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | e939047d-af6a-459a-b99e-59baffe198ea | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | e939047d-af6a-459a-b99e-59baffe198ea | — | — | — | — | passed |

