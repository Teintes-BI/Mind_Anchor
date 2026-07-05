# Core Phase Test Report

- Started: `2026-03-23T19:59:38.118Z`
- Completed: `2026-03-23T20:01:21.145Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T19-59-38-117Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T19-59-38-117Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T19-59-38-117Z/responses`

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
| seed-focus-recovery-loop | 200 | cc8e88c1-a8c6-48a6-bdbf-884f7ba9a79a | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | b3f31a8b-8d47-4bd3-884b-7c1ecd30865a | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 32ab6746-6113-4b28-9b13-1aae7ee2f400 | — | — | — | — | passed |
| chief-route-recovery | 200 | 8f9ec80c-ffb5-44bf-bde0-1bb0042ee2ee | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 8f9ec80c-ffb5-44bf-bde0-1bb0042ee2ee | — | — | — | — | passed |
| chief-route-task-management | 200 | 073f93ac-546f-4ed1-8526-5f1606704ded | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 073f93ac-546f-4ed1-8526-5f1606704ded | — | — | — | — | passed |
| chief-route-reflection | 200 | 1f201091-3ec6-4534-acd3-628faf02c6a2 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 1f201091-3ec6-4534-acd3-628faf02c6a2 | — | — | — | — | passed |
| debug-state-insight | 200 | c13029d3-9782-4dd1-8b33-69c55d9961d9 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | c13029d3-9782-4dd1-8b33-69c55d9961d9 | — | — | — | — | passed |
| debug-task-management | 200 | 937bfbf1-941c-49be-ba88-74bb1e080564 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 937bfbf1-941c-49be-ba88-74bb1e080564 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 906fb298-5c62-4057-a3f7-6ba67b94de20 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 906fb298-5c62-4057-a3f7-6ba67b94de20 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | eed4de0b-bb07-48e1-9800-7d2eafec3737 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | eed4de0b-bb07-48e1-9800-7d2eafec3737 | — | — | — | — | passed |
| debug-reflection | 200 | d7b8dac9-aaf1-4bbe-a8c6-7f6ddb862755 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | d7b8dac9-aaf1-4bbe-a8c6-7f6ddb862755 | — | — | — | — | passed |
| debug-automation | 200 | f2dee098-e768-45ba-8fa2-0f28d9e6ecc1 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | f2dee098-e768-45ba-8fa2-0f28d9e6ecc1 | — | — | — | — | passed |
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
| full-regression | 200 | fa617059-4c98-48f1-b115-15398fa176f1 | — | — | — | — | passed |
| full-regression-trace | 200 | fa617059-4c98-48f1-b115-15398fa176f1 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | fe26024c-bfee-4a54-b70d-94fbe0d43416 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | fe26024c-bfee-4a54-b70d-94fbe0d43416 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 49126490-c462-44e7-9fae-6d463fb06cbb | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 744bc108-067b-49c9-a1c5-d8dbbe95e3d8 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 432c6048-9c96-4aba-9c68-17689411ab70 | — | — | — | — | passed |
| probe-chief-agent | 200 | 9050edb6-1b9b-4bf4-adac-e87d0714a740 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 9050edb6-1b9b-4bf4-adac-e87d0714a740 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 10a6a65a-0d24-4d7c-8766-5609be9ca40b | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 10a6a65a-0d24-4d7c-8766-5609be9ca40b | — | — | — | — | passed |
| probe-task-management-agent | 200 | ab047066-0d55-4533-8e8a-9919ba8cdd60 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | ab047066-0d55-4533-8e8a-9919ba8cdd60 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 7d6a750d-f426-4c15-9815-038506dc9fa1 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 7d6a750d-f426-4c15-9815-038506dc9fa1 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 981cc491-4bba-4dd8-aa9b-3077ae6e2079 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 981cc491-4bba-4dd8-aa9b-3077ae6e2079 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 9b01b083-8fb2-4792-ad77-b1c5aadf7dc9 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 9b01b083-8fb2-4792-ad77-b1c5aadf7dc9 | — | — | — | — | passed |
| probe-automation-agent | 200 | cd03ae44-30ea-4548-9113-1610731c08cf | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | cd03ae44-30ea-4548-9113-1610731c08cf | — | — | — | — | passed |
| chief-route-recovery | 200 | 6900e144-5da6-471b-918d-43a44e589c22 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 6900e144-5da6-471b-918d-43a44e589c22 | — | — | — | — | passed |
| chief-route-task-management | 200 | 23ad0d7a-d501-46c4-ad9c-e69437817b21 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 23ad0d7a-d501-46c4-ad9c-e69437817b21 | — | — | — | — | passed |
| chief-route-reflection | 200 | 30016b49-5bb9-4dd1-9d7a-5dd52596e58d | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 30016b49-5bb9-4dd1-9d7a-5dd52596e58d | — | — | — | — | passed |
| debug-state-insight | 200 | aa61eba0-9b76-4ac6-af2f-25deab6761b1 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | aa61eba0-9b76-4ac6-af2f-25deab6761b1 | — | — | — | — | passed |
| debug-task-management | 200 | bcfaeb0e-28fc-4ae3-91f6-0d1fccb670b8 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | bcfaeb0e-28fc-4ae3-91f6-0d1fccb670b8 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 5de20250-be92-4396-bf50-b558958fb894 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 5de20250-be92-4396-bf50-b558958fb894 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | cd85b4d5-8acb-40c8-995b-8874c69d90e2 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | cd85b4d5-8acb-40c8-995b-8874c69d90e2 | — | — | — | — | passed |
| debug-reflection | 200 | 65cd7dd8-3b4e-4f5d-bc17-f58b0fd19259 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 65cd7dd8-3b4e-4f5d-bc17-f58b0fd19259 | — | — | — | — | passed |
| debug-automation | 200 | fe29d0f4-0b55-4547-a609-e958ca287309 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | fe29d0f4-0b55-4547-a609-e958ca287309 | — | — | — | — | passed |
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
| full-regression | 200 | 3d973f74-5f16-44b5-b8e0-d2e388ef4bbe | — | — | — | — | passed |
| full-regression-trace | 200 | 3d973f74-5f16-44b5-b8e0-d2e388ef4bbe | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | a1fc7a58-1d98-41bb-9b02-c2b8c78079ae | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | a1fc7a58-1d98-41bb-9b02-c2b8c78079ae | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 5a347319-0e8d-437a-986f-03389bc9727f | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 7db59f9b-f16b-4c24-a528-aded637c687c | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 89fc31aa-d4df-406c-9bf5-a3a836ed1759 | — | — | — | — | passed |
| probe-chief-agent | 200 | 1fa7bb8d-769d-4b5b-b563-23656bbeff2a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 1fa7bb8d-769d-4b5b-b563-23656bbeff2a | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 078f0e42-8e07-4333-a5cd-f21d194d218b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 078f0e42-8e07-4333-a5cd-f21d194d218b | — | — | — | — | passed |
| probe-task-management-agent | 200 | 0449f8b6-839e-4824-aae1-420b3bf8d57e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 0449f8b6-839e-4824-aae1-420b3bf8d57e | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 13c1f1d9-11bb-48c0-8987-c7bfd808ba9c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 13c1f1d9-11bb-48c0-8987-c7bfd808ba9c | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 7383191a-6850-451a-8fdb-6b14a0a424fe | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 7383191a-6850-451a-8fdb-6b14a0a424fe | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | ddc8cf48-5407-406b-ba46-c3ce7ae15d61 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | ddc8cf48-5407-406b-ba46-c3ce7ae15d61 | — | — | — | — | passed |
| probe-automation-agent | 200 | b9a2bb0f-1c8f-43a3-9deb-112a0c68d6a9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | b9a2bb0f-1c8f-43a3-9deb-112a0c68d6a9 | — | — | — | — | passed |
| chief-route-recovery | 200 | 981e42b4-1a46-4df8-a833-b345a92aa183 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 981e42b4-1a46-4df8-a833-b345a92aa183 | — | — | — | — | passed |
| chief-route-task-management | 200 | a1ac2c5d-d47a-40bb-9e58-ccb89bd4a269 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | a1ac2c5d-d47a-40bb-9e58-ccb89bd4a269 | — | — | — | — | passed |
| chief-route-reflection | 200 | 0b0f8930-3b90-4f5e-84a7-7a5faaa606ac | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 0b0f8930-3b90-4f5e-84a7-7a5faaa606ac | — | — | — | — | passed |
| debug-state-insight | 200 | c0e09199-e6f0-4a88-8409-48959a2e0862 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | c0e09199-e6f0-4a88-8409-48959a2e0862 | — | — | — | — | passed |
| debug-task-management | 200 | 7be8b7fc-608d-4ab5-83bc-08ed05b4a8c8 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 7be8b7fc-608d-4ab5-83bc-08ed05b4a8c8 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 0a2b388b-7b7a-4a91-bc7d-d0984b08549c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 0a2b388b-7b7a-4a91-bc7d-d0984b08549c | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 1cae2d44-886b-40dc-a859-5fcf13c0dae6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 1cae2d44-886b-40dc-a859-5fcf13c0dae6 | — | — | — | — | passed |
| debug-reflection | 200 | 5bc310a1-5933-4d1b-9958-1375fcf83505 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 5bc310a1-5933-4d1b-9958-1375fcf83505 | — | — | — | — | passed |
| debug-automation | 200 | 3f571a80-699b-4454-99cd-36b37b6baf43 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 3f571a80-699b-4454-99cd-36b37b6baf43 | — | — | — | — | passed |
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
| full-regression | 200 | 70e9f43e-34ed-4d38-a96f-8c89cc4346ae | — | — | — | — | passed |
| full-regression-trace | 200 | 70e9f43e-34ed-4d38-a96f-8c89cc4346ae | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | cc959c5a-76fe-4e65-bdd8-74c29307d26a | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | cc959c5a-76fe-4e65-bdd8-74c29307d26a | — | — | — | — | passed |

