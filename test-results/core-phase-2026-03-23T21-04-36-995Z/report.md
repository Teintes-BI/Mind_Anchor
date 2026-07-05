# Core Phase Test Report

- Started: `2026-03-23T21:04:36.996Z`
- Completed: `2026-03-23T21:06:23.656Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-04-36-995Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-04-36-995Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T21-04-36-995Z/responses`

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
| seed-focus-recovery-loop | 200 | 7f7c07c0-e473-4917-a5ab-436562767918 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 92f48bfc-3a3f-4049-8199-11d76295d8fd | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | b8f983e7-19b6-403c-90d4-c3755444e96d | — | — | — | — | passed |
| chief-route-recovery | 200 | 91634039-1f00-4651-8b64-994b92aba0f7 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 91634039-1f00-4651-8b64-994b92aba0f7 | — | — | — | — | passed |
| chief-route-task-management | 200 | 4c9a5098-4b44-4d82-9038-b725a0f20ba5 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 4c9a5098-4b44-4d82-9038-b725a0f20ba5 | — | — | — | — | passed |
| chief-route-reflection | 200 | 32bf468c-fd70-4056-bcd0-fb73e8b10c26 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 32bf468c-fd70-4056-bcd0-fb73e8b10c26 | — | — | — | — | passed |
| debug-state-insight | 200 | 1522a8d3-0bbb-4b25-804b-4b1c56f219ab | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 1522a8d3-0bbb-4b25-804b-4b1c56f219ab | — | — | — | — | passed |
| debug-task-management | 200 | 1ca56204-a06f-46c5-be73-d3d426a9d93f | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 1ca56204-a06f-46c5-be73-d3d426a9d93f | — | — | — | — | passed |
| debug-progress-feedback | 200 | ce2b8367-97cc-49a4-be3a-a9279261ac7e | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | ce2b8367-97cc-49a4-be3a-a9279261ac7e | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 4e73c5e0-7ed4-447b-98f4-e1f80ceadcf7 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 4e73c5e0-7ed4-447b-98f4-e1f80ceadcf7 | — | — | — | — | passed |
| debug-reflection | 200 | 7eb01cb7-e27e-48af-9ee8-6f208b8121c5 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 7eb01cb7-e27e-48af-9ee8-6f208b8121c5 | — | — | — | — | passed |
| debug-automation | 200 | f2978d94-58bd-47f7-8ef2-5e8e3df7b418 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | f2978d94-58bd-47f7-8ef2-5e8e3df7b418 | — | — | — | — | passed |
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
| full-regression | 200 | 03230fc4-c499-49ee-9265-98460a07a5d1 | — | — | — | — | passed |
| full-regression-trace | 200 | 03230fc4-c499-49ee-9265-98460a07a5d1 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 9d396d60-0be2-4d3f-9a5d-582babecd798 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 9d396d60-0be2-4d3f-9a5d-582babecd798 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 826d6735-bab9-4b71-9ada-eb424703d3fa | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 65e40865-063f-49cf-bd6c-e3ee4553fda2 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 737b98e9-1849-4349-99f0-ae5ea25d3eaa | — | — | — | — | passed |
| probe-chief-agent | 200 | f21d1b20-b35b-4754-a407-90933a2e6f19 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | f21d1b20-b35b-4754-a407-90933a2e6f19 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 32f976c6-5c30-4357-90e6-d8e105ff40c7 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 32f976c6-5c30-4357-90e6-d8e105ff40c7 | — | — | — | — | passed |
| probe-task-management-agent | 200 | ab6b80eb-918f-4100-a885-d20e4f7eed39 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | ab6b80eb-918f-4100-a885-d20e4f7eed39 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | a47ab03d-d291-4feb-9277-8e9fdacce72e | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | a47ab03d-d291-4feb-9277-8e9fdacce72e | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | feacb3a5-8847-480f-8414-302fb5f98fe0 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | feacb3a5-8847-480f-8414-302fb5f98fe0 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 7964e9c7-34bc-46f0-88ee-97cbdcf7e23e | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 7964e9c7-34bc-46f0-88ee-97cbdcf7e23e | — | — | — | — | passed |
| probe-automation-agent | 200 | 5e52a3fa-6837-46fc-9bd4-37e75b92c407 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 5e52a3fa-6837-46fc-9bd4-37e75b92c407 | — | — | — | — | passed |
| chief-route-recovery | 200 | 7f0e778a-9cc6-4d2a-84c2-e5a940548f3c | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 7f0e778a-9cc6-4d2a-84c2-e5a940548f3c | — | — | — | — | passed |
| chief-route-task-management | 200 | f7f5fc54-077d-4fbf-a1e4-802feda23925 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | f7f5fc54-077d-4fbf-a1e4-802feda23925 | — | — | — | — | passed |
| chief-route-reflection | 200 | b9c7a1df-36cd-4002-a512-8bb2a7202999 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | b9c7a1df-36cd-4002-a512-8bb2a7202999 | — | — | — | — | passed |
| debug-state-insight | 200 | bebdb268-fb8f-4aa1-a231-bdec14ccf9b0 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | bebdb268-fb8f-4aa1-a231-bdec14ccf9b0 | — | — | — | — | passed |
| debug-task-management | 200 | d48bc6ba-0c85-4a4c-8274-9086fb797871 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | d48bc6ba-0c85-4a4c-8274-9086fb797871 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 2997a16f-02d0-4516-bb78-e106fed04a88 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 2997a16f-02d0-4516-bb78-e106fed04a88 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | b0b281d7-90e3-4e98-9794-3e82cf73711a | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | b0b281d7-90e3-4e98-9794-3e82cf73711a | — | — | — | — | passed |
| debug-reflection | 200 | b331a305-5cf1-4efd-be9f-1514f58381f8 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | b331a305-5cf1-4efd-be9f-1514f58381f8 | — | — | — | — | passed |
| debug-automation | 200 | c7f620b7-bf2e-4c63-97dc-256c10056cf5 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | c7f620b7-bf2e-4c63-97dc-256c10056cf5 | — | — | — | — | passed |
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
| full-regression | 200 | e16af565-54a4-4ac8-a007-fa68736e8d38 | — | — | — | — | passed |
| full-regression-trace | 200 | e16af565-54a4-4ac8-a007-fa68736e8d38 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 0a411def-027d-488e-8a4a-cb069ad95c6e | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 0a411def-027d-488e-8a4a-cb069ad95c6e | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 55c344ea-543f-4ab1-aedf-011b6869b1ff | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 9d7b51ab-a145-4579-a621-0c0a7270e372 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 80f68061-3ed6-4424-83fc-0f699218b71d | — | — | — | — | passed |
| probe-chief-agent | 200 | ca23384a-98ee-4413-aefb-5a3ed7c15fa9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | ca23384a-98ee-4413-aefb-5a3ed7c15fa9 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | b6d2b9b6-b2dd-410f-9ae0-a9471363ed7c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | b6d2b9b6-b2dd-410f-9ae0-a9471363ed7c | — | — | — | — | passed |
| probe-task-management-agent | 200 | c3057ccb-f1a2-4c8c-818d-296a90d17ba9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | c3057ccb-f1a2-4c8c-818d-296a90d17ba9 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 83db7daf-9cb9-444d-b75f-cd15804c96e7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 83db7daf-9cb9-444d-b75f-cd15804c96e7 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 3c700fa9-a629-42cc-add8-0dbdb311da13 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 3c700fa9-a629-42cc-add8-0dbdb311da13 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | fb4a6860-ad14-431f-a014-ae57afafdcdf | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | fb4a6860-ad14-431f-a014-ae57afafdcdf | — | — | — | — | passed |
| probe-automation-agent | 200 | 84033e08-7794-4d85-acd6-cfad431b6286 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 84033e08-7794-4d85-acd6-cfad431b6286 | — | — | — | — | passed |
| chief-route-recovery | 200 | eadcecb0-dd34-43c7-adb1-2f6a16c3f8df | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | eadcecb0-dd34-43c7-adb1-2f6a16c3f8df | — | — | — | — | passed |
| chief-route-task-management | 200 | a302a14c-7d9d-4ed9-b713-5be31290dfce | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | a302a14c-7d9d-4ed9-b713-5be31290dfce | — | — | — | — | passed |
| chief-route-reflection | 200 | 492e4573-03cf-4ffa-863c-93fbb798e855 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 492e4573-03cf-4ffa-863c-93fbb798e855 | — | — | — | — | passed |
| debug-state-insight | 200 | caf97b56-6029-421e-8c2f-6157abfa5901 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | caf97b56-6029-421e-8c2f-6157abfa5901 | — | — | — | — | passed |
| debug-task-management | 200 | 1156645c-3500-4f41-a370-3e2c4e6a6e0a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 1156645c-3500-4f41-a370-3e2c4e6a6e0a | — | — | — | — | passed |
| debug-progress-feedback | 200 | bc357cc9-4385-4177-b28e-b66ddad2e468 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | bc357cc9-4385-4177-b28e-b66ddad2e468 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | e2173c94-b9a0-42da-8e2e-e8d24b63de00 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | e2173c94-b9a0-42da-8e2e-e8d24b63de00 | — | — | — | — | passed |
| debug-reflection | 200 | 65f1acac-2aa9-43cf-a839-1b4e362f7e24 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 65f1acac-2aa9-43cf-a839-1b4e362f7e24 | — | — | — | — | passed |
| debug-automation | 200 | fe02db49-a132-400e-96ea-fd02695cad7f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | fe02db49-a132-400e-96ea-fd02695cad7f | — | — | — | — | passed |
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
| full-regression | 200 | e38d08e7-d4f5-4f26-a53f-429dd49664ad | — | — | — | — | passed |
| full-regression-trace | 200 | e38d08e7-d4f5-4f26-a53f-429dd49664ad | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 64c9f633-6671-4e63-bd2f-95d78fcaded9 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 64c9f633-6671-4e63-bd2f-95d78fcaded9 | — | — | — | — | passed |

