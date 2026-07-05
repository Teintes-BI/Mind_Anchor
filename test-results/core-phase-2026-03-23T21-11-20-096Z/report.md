# Core Phase Test Report

- Started: `2026-03-23T21:11:20.096Z`
- Completed: `2026-03-23T21:13:07.621Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-11-20-096Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-11-20-096Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-11-20-096Z/responses`

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
| seed-focus-recovery-loop | 200 | 8fcdc46f-49e5-4d1c-8c88-d95165cb15a2 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 9a36a970-8688-4440-a4cc-13d5dd3a54ea | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | d9a95504-8b5d-4841-8b85-ed53cfc6e636 | — | — | — | — | passed |
| chief-route-recovery | 200 | b1ad3985-50ed-4d96-b8d2-35cee67a487d | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | b1ad3985-50ed-4d96-b8d2-35cee67a487d | — | — | — | — | passed |
| chief-route-task-management | 200 | 3f792458-37e7-456e-8f93-1875d0afedf9 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 3f792458-37e7-456e-8f93-1875d0afedf9 | — | — | — | — | passed |
| chief-route-reflection | 200 | 3960ac41-3850-4210-883f-00fc72098759 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 3960ac41-3850-4210-883f-00fc72098759 | — | — | — | — | passed |
| debug-state-insight | 200 | d961cb98-149c-45f3-b65b-39611371be67 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | d961cb98-149c-45f3-b65b-39611371be67 | — | — | — | — | passed |
| debug-task-management | 200 | 53754dee-749c-4286-bf67-b5b02799cc77 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 53754dee-749c-4286-bf67-b5b02799cc77 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 2e2e36c2-12a1-4e95-b798-84c4a861db1b | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 2e2e36c2-12a1-4e95-b798-84c4a861db1b | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 32bd8e32-6ada-4731-8f9a-0ad2b22894ea | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 32bd8e32-6ada-4731-8f9a-0ad2b22894ea | — | — | — | — | passed |
| debug-reflection | 200 | 8e7f9f14-cda0-4542-aec0-928fbd105173 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 8e7f9f14-cda0-4542-aec0-928fbd105173 | — | — | — | — | passed |
| debug-automation | 200 | bd52f134-f297-4e4d-804d-58abf33cd2f6 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | bd52f134-f297-4e4d-804d-58abf33cd2f6 | — | — | — | — | passed |
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
| full-regression | 200 | e832e1a0-84b3-4a9c-882a-ae6262370ab6 | — | — | — | — | passed |
| full-regression-trace | 200 | e832e1a0-84b3-4a9c-882a-ae6262370ab6 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | fe938630-fa06-43f9-ad6c-28ac5bf54a0c | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | fe938630-fa06-43f9-ad6c-28ac5bf54a0c | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 2f0be265-43b9-4d78-a099-dafdb38795cd | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 51f71b3c-cdbd-45f8-9fd5-38aaafc52822 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | e2568b03-1203-4807-b489-555b766ab548 | — | — | — | — | passed |
| probe-chief-agent | 200 | b8f250cf-6cda-4d33-a867-aae6a2246ff5 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | b8f250cf-6cda-4d33-a867-aae6a2246ff5 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | d34f2cb3-cd11-4926-92a1-000e911808fc | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | d34f2cb3-cd11-4926-92a1-000e911808fc | — | — | — | — | passed |
| probe-task-management-agent | 200 | 8ed66e76-b0e0-49da-a075-0be4e893d5e5 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 8ed66e76-b0e0-49da-a075-0be4e893d5e5 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | aff30388-0548-405b-aaf7-35a20ab754c5 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | aff30388-0548-405b-aaf7-35a20ab754c5 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | db053e00-39d9-4390-94bc-738021f18300 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | db053e00-39d9-4390-94bc-738021f18300 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 59b59d87-7c43-4833-8318-11e79d0cd65e | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 59b59d87-7c43-4833-8318-11e79d0cd65e | — | — | — | — | passed |
| probe-automation-agent | 200 | 408a57c4-5113-42a7-93b7-2aff2d042aed | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 408a57c4-5113-42a7-93b7-2aff2d042aed | — | — | — | — | passed |
| chief-route-recovery | 200 | 234495e7-d21a-408c-bee8-9a84ae73627d | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 234495e7-d21a-408c-bee8-9a84ae73627d | — | — | — | — | passed |
| chief-route-task-management | 200 | 94468eb4-b1c1-4049-896b-323619f6fb82 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 94468eb4-b1c1-4049-896b-323619f6fb82 | — | — | — | — | passed |
| chief-route-reflection | 200 | 9dce431f-8f78-45ba-8e76-3e0e70601dfc | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 9dce431f-8f78-45ba-8e76-3e0e70601dfc | — | — | — | — | passed |
| debug-state-insight | 200 | c6b83880-dc67-4732-971d-ba84083e9ad2 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | c6b83880-dc67-4732-971d-ba84083e9ad2 | — | — | — | — | passed |
| debug-task-management | 200 | ff0bcfc8-e52c-4c71-b810-974a02f8f5e6 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | ff0bcfc8-e52c-4c71-b810-974a02f8f5e6 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 4db429b4-a9fd-4f74-95f5-8d840db4eefc | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 4db429b4-a9fd-4f74-95f5-8d840db4eefc | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 3cfbdf84-9b90-4295-ad45-dcafe284c5f4 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 3cfbdf84-9b90-4295-ad45-dcafe284c5f4 | — | — | — | — | passed |
| debug-reflection | 200 | 0c148f7e-8693-4079-84fd-31666f5b7ce8 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 0c148f7e-8693-4079-84fd-31666f5b7ce8 | — | — | — | — | passed |
| debug-automation | 200 | 13e9fbeb-0987-4892-9417-4c2e1e91200f | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 13e9fbeb-0987-4892-9417-4c2e1e91200f | — | — | — | — | passed |
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
| full-regression | 200 | 8110757b-0270-43a6-9388-c909369ec227 | — | — | — | — | passed |
| full-regression-trace | 200 | 8110757b-0270-43a6-9388-c909369ec227 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | f373c368-40eb-4c5e-ae97-1efb294c898d | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | f373c368-40eb-4c5e-ae97-1efb294c898d | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 6740a37b-81ca-4ea5-b737-544bd1dbe452 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | a3d8310d-7a6b-4e2d-b68c-be32e244bd08 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 6c845e92-5fdc-4935-9ebd-50037059651e | — | — | — | — | passed |
| probe-chief-agent | 200 | 63a2ee89-4f37-4284-97c0-4dc4b6e1ddde | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 63a2ee89-4f37-4284-97c0-4dc4b6e1ddde | — | — | — | — | passed |
| probe-state-insight-agent | 200 | aaa9a795-2596-46ac-8aab-3615fcf61bbd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | aaa9a795-2596-46ac-8aab-3615fcf61bbd | — | — | — | — | passed |
| probe-task-management-agent | 200 | 103abd89-7b6c-4c3b-82ba-97db8bdfbf3d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 103abd89-7b6c-4c3b-82ba-97db8bdfbf3d | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | d4b70155-ad3e-41b2-a132-f9d68c4c7a66 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | d4b70155-ad3e-41b2-a132-f9d68c4c7a66 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 1787ec4c-978b-48fa-ad11-141c51514bb7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 1787ec4c-978b-48fa-ad11-141c51514bb7 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 05ac14cf-9848-465f-af7c-d02dbd79bd9e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 05ac14cf-9848-465f-af7c-d02dbd79bd9e | — | — | — | — | passed |
| probe-automation-agent | 200 | 9c7bd81b-3804-4222-99f9-1737c1ceca76 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 9c7bd81b-3804-4222-99f9-1737c1ceca76 | — | — | — | — | passed |
| chief-route-recovery | 200 | 51615f5b-d723-4037-9cf8-9095d15696d0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 51615f5b-d723-4037-9cf8-9095d15696d0 | — | — | — | — | passed |
| chief-route-task-management | 200 | 09e2b236-37d2-4007-b84a-0a2ce4bf1981 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 09e2b236-37d2-4007-b84a-0a2ce4bf1981 | — | — | — | — | passed |
| chief-route-reflection | 200 | e2aaddc2-582c-4379-ad6f-96e3917878bb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | e2aaddc2-582c-4379-ad6f-96e3917878bb | — | — | — | — | passed |
| debug-state-insight | 200 | 9ad48d4d-c2bf-4d9b-a21a-0580b938dff4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 9ad48d4d-c2bf-4d9b-a21a-0580b938dff4 | — | — | — | — | passed |
| debug-task-management | 200 | 37866752-a972-4708-9e78-a0177eeb5b91 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 37866752-a972-4708-9e78-a0177eeb5b91 | — | — | — | — | passed |
| debug-progress-feedback | 200 | a9612f16-052d-4e87-af28-67799ce9a83d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | a9612f16-052d-4e87-af28-67799ce9a83d | — | — | — | — | passed |
| debug-interruption-recovery | 200 | a00bc488-24c3-4360-a649-2789b1984e1c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | a00bc488-24c3-4360-a649-2789b1984e1c | — | — | — | — | passed |
| debug-reflection | 200 | 70bacb11-20de-42b3-af21-378f5e2a8906 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 70bacb11-20de-42b3-af21-378f5e2a8906 | — | — | — | — | passed |
| debug-automation | 200 | 8c2c140f-d4f2-4f1a-b0d9-f88b1a8acdef | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 8c2c140f-d4f2-4f1a-b0d9-f88b1a8acdef | — | — | — | — | passed |
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
| full-regression | 200 | ab6289cc-04c8-4e92-a024-9b5559b84b5e | — | — | — | — | passed |
| full-regression-trace | 200 | ab6289cc-04c8-4e92-a024-9b5559b84b5e | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 6e272fd5-2b4f-43d2-8c3a-2f7f38615b94 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 6e272fd5-2b4f-43d2-8c3a-2f7f38615b94 | — | — | — | — | passed |

