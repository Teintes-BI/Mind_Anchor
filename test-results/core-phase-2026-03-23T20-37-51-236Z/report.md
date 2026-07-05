# Core Phase Test Report

- Started: `2026-03-23T20:37:51.237Z`
- Completed: `2026-03-23T20:39:35.706Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-37-51-236Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-37-51-236Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-37-51-236Z/responses`

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
| seed-focus-recovery-loop | 200 | aecdd1f1-d8b1-454d-b378-565064f30e03 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 88bd585c-291f-4793-8474-40200f21e172 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 855e8666-de35-47aa-a543-a65eecc9854a | — | — | — | — | passed |
| chief-route-recovery | 200 | f6213786-0363-44ed-80c1-ae9d2db76f74 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | f6213786-0363-44ed-80c1-ae9d2db76f74 | — | — | — | — | passed |
| chief-route-task-management | 200 | d4ea9b47-0a41-4509-9193-8cd5a2ff5c48 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | d4ea9b47-0a41-4509-9193-8cd5a2ff5c48 | — | — | — | — | passed |
| chief-route-reflection | 200 | 0f645efb-6243-4941-87ca-fbdd174b1723 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 0f645efb-6243-4941-87ca-fbdd174b1723 | — | — | — | — | passed |
| debug-state-insight | 200 | 2916ec3d-1099-47c8-b7df-fb826f91189e | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 2916ec3d-1099-47c8-b7df-fb826f91189e | — | — | — | — | passed |
| debug-task-management | 200 | 8f9b35dc-04b9-4baa-8c3b-b53458adb686 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 8f9b35dc-04b9-4baa-8c3b-b53458adb686 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 013aee97-3e4b-4092-a7c6-a992d6ad4db4 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 013aee97-3e4b-4092-a7c6-a992d6ad4db4 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | b15236c2-2d01-4e19-9436-e0e804388d20 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | b15236c2-2d01-4e19-9436-e0e804388d20 | — | — | — | — | passed |
| debug-reflection | 200 | 997fad7c-2c1b-40a5-ac9a-3648b4593fa8 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 997fad7c-2c1b-40a5-ac9a-3648b4593fa8 | — | — | — | — | passed |
| debug-automation | 200 | 076776d7-c788-4a33-9425-70bc96688707 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 076776d7-c788-4a33-9425-70bc96688707 | — | — | — | — | passed |
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
| full-regression | 200 | 2ba16c66-a848-4ac0-8efa-b1e3b298a55c | — | — | — | — | passed |
| full-regression-trace | 200 | 2ba16c66-a848-4ac0-8efa-b1e3b298a55c | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 7affb048-98d0-4d0c-adfe-52ed718b7edd | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 7affb048-98d0-4d0c-adfe-52ed718b7edd | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 9bf6b6f4-7af0-4c9e-a88f-63616f39be56 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | b173eb1d-fb86-4052-9c27-d3b88699fd6c | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 25cd7c33-ddc4-4bb3-bc00-a31ea4b67445 | — | — | — | — | passed |
| probe-chief-agent | 200 | 8dce6f9d-336b-4b78-8cf0-ee4b0d748d5d | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 8dce6f9d-336b-4b78-8cf0-ee4b0d748d5d | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 17f42731-73a6-4af8-92f4-a856f3c1b737 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 17f42731-73a6-4af8-92f4-a856f3c1b737 | — | — | — | — | passed |
| probe-task-management-agent | 200 | fd6b8ca8-e8ca-4304-88e9-ddac27f9cfd4 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | fd6b8ca8-e8ca-4304-88e9-ddac27f9cfd4 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 1c0a8054-842a-4d73-aa2e-bebafd491083 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 1c0a8054-842a-4d73-aa2e-bebafd491083 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | dfb47f1e-2cc5-4050-96a7-831710656503 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | dfb47f1e-2cc5-4050-96a7-831710656503 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | b954fadb-e881-4c6f-9040-7842cb29ada6 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | b954fadb-e881-4c6f-9040-7842cb29ada6 | — | — | — | — | passed |
| probe-automation-agent | 200 | fda2e3c1-8c80-4c50-a53f-5766da40214b | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | fda2e3c1-8c80-4c50-a53f-5766da40214b | — | — | — | — | passed |
| chief-route-recovery | 200 | 8ba12e3e-3187-4428-8bb8-96b92e0fd074 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 8ba12e3e-3187-4428-8bb8-96b92e0fd074 | — | — | — | — | passed |
| chief-route-task-management | 200 | d44cb2aa-403d-4dc9-9837-09f531424c0a | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | d44cb2aa-403d-4dc9-9837-09f531424c0a | — | — | — | — | passed |
| chief-route-reflection | 200 | f3769ed5-56f9-444a-adae-a392750e8e78 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | f3769ed5-56f9-444a-adae-a392750e8e78 | — | — | — | — | passed |
| debug-state-insight | 200 | cc512d82-1bb5-41d7-8a1e-9e129c705ac2 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | cc512d82-1bb5-41d7-8a1e-9e129c705ac2 | — | — | — | — | passed |
| debug-task-management | 200 | c96a8a68-8a49-475b-a50c-1ca6279144d8 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | c96a8a68-8a49-475b-a50c-1ca6279144d8 | — | — | — | — | passed |
| debug-progress-feedback | 200 | c0f18be3-1a7e-4604-8654-cb99780f4d37 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | c0f18be3-1a7e-4604-8654-cb99780f4d37 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 5738b0e8-07c8-447d-a2ea-b36e7f4c5681 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 5738b0e8-07c8-447d-a2ea-b36e7f4c5681 | — | — | — | — | passed |
| debug-reflection | 200 | 0540e0cc-cba7-417c-9d36-0d9323c44a44 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 0540e0cc-cba7-417c-9d36-0d9323c44a44 | — | — | — | — | passed |
| debug-automation | 200 | 81377453-a1bc-4562-b245-36dd72822692 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 81377453-a1bc-4562-b245-36dd72822692 | — | — | — | — | passed |
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
| full-regression | 200 | abd64633-777a-4f5b-bda3-3731a4cc873e | — | — | — | — | passed |
| full-regression-trace | 200 | abd64633-777a-4f5b-bda3-3731a4cc873e | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 7680dac5-ba92-403e-9d5e-f8885458e691 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 7680dac5-ba92-403e-9d5e-f8885458e691 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 2fafc25b-d6c3-4b1a-8d34-9099d123edc1 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | bdcea731-97c3-4ed2-9706-ade2e8706169 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 8546874c-6025-48aa-91de-4706849884cc | — | — | — | — | passed |
| probe-chief-agent | 200 | d1e030f3-a59a-4285-a3d3-0bd608a3dcdb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | d1e030f3-a59a-4285-a3d3-0bd608a3dcdb | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 34e3fc34-5221-4756-9af7-4413ef7e4cfc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 34e3fc34-5221-4756-9af7-4413ef7e4cfc | — | — | — | — | passed |
| probe-task-management-agent | 200 | 05b3902a-a9ed-48cf-bec8-442f42348247 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 05b3902a-a9ed-48cf-bec8-442f42348247 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 4ad22407-bca0-477e-b54c-73aa1ec5685a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 4ad22407-bca0-477e-b54c-73aa1ec5685a | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 2a427ab5-8486-446e-8743-43ac4042f1fb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 2a427ab5-8486-446e-8743-43ac4042f1fb | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | a216da60-93b0-43f9-9ea9-adc39b6a5bf0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | a216da60-93b0-43f9-9ea9-adc39b6a5bf0 | — | — | — | — | passed |
| probe-automation-agent | 200 | 5e1b6873-96d9-4e93-ad58-882f389c5818 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 5e1b6873-96d9-4e93-ad58-882f389c5818 | — | — | — | — | passed |
| chief-route-recovery | 200 | 0a090582-ac27-42a9-b1c2-7001c7026f19 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 0a090582-ac27-42a9-b1c2-7001c7026f19 | — | — | — | — | passed |
| chief-route-task-management | 200 | cd402651-f298-4cbb-8e60-921307e3ed14 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | cd402651-f298-4cbb-8e60-921307e3ed14 | — | — | — | — | passed |
| chief-route-reflection | 200 | 9407d2bf-d648-4c54-ae6b-93d861bef3fb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 9407d2bf-d648-4c54-ae6b-93d861bef3fb | — | — | — | — | passed |
| debug-state-insight | 200 | 701d8477-e9eb-46b8-bdcc-eb1e8d52500b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 701d8477-e9eb-46b8-bdcc-eb1e8d52500b | — | — | — | — | passed |
| debug-task-management | 200 | 9998a1fa-d042-44eb-aa52-dbe77a6874f9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 9998a1fa-d042-44eb-aa52-dbe77a6874f9 | — | — | — | — | passed |
| debug-progress-feedback | 200 | a00edc2d-3d28-4a4d-8801-d7b28e6790ef | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | a00edc2d-3d28-4a4d-8801-d7b28e6790ef | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 96d16f52-d772-4504-95b4-511d63b1edbd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 96d16f52-d772-4504-95b4-511d63b1edbd | — | — | — | — | passed |
| debug-reflection | 200 | e320a000-3b7f-4098-b41e-0b597f1d3ebb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | e320a000-3b7f-4098-b41e-0b597f1d3ebb | — | — | — | — | passed |
| debug-automation | 200 | 027e3eaa-1e98-456c-9407-a74630109153 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 027e3eaa-1e98-456c-9407-a74630109153 | — | — | — | — | passed |
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
| full-regression | 200 | cb963071-8d57-4013-b6ba-7af04b001f90 | — | — | — | — | passed |
| full-regression-trace | 200 | cb963071-8d57-4013-b6ba-7af04b001f90 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 059ef24d-62dd-422b-a2d6-25f469cf8b63 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 059ef24d-62dd-422b-a2d6-25f469cf8b63 | — | — | — | — | passed |

