# Core Phase Test Report

- Started: `2026-03-23T20:54:32.745Z`
- Completed: `2026-03-23T20:56:20.414Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-54-32-744Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-54-32-744Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-54-32-744Z/responses`

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
| seed-focus-recovery-loop | 200 | b7139824-26ba-467c-95ac-c74b999783e0 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 0a921fb7-e8e1-4afc-8c3e-7637dfb17e12 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | cb7fb14d-1e33-4238-9fdf-e5234f51a0e0 | — | — | — | — | passed |
| chief-route-recovery | 200 | 4166e7df-d3cf-4dac-9e70-c2e9e5f0132e | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 4166e7df-d3cf-4dac-9e70-c2e9e5f0132e | — | — | — | — | passed |
| chief-route-task-management | 200 | a9ed17e2-ba28-4505-95e0-c29adf317917 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | a9ed17e2-ba28-4505-95e0-c29adf317917 | — | — | — | — | passed |
| chief-route-reflection | 200 | b6b70bd6-72fb-46a5-8d93-785d3d975a1e | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | b6b70bd6-72fb-46a5-8d93-785d3d975a1e | — | — | — | — | passed |
| debug-state-insight | 200 | 57d420ca-e7b7-494d-b6c0-b0cb08025afb | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 57d420ca-e7b7-494d-b6c0-b0cb08025afb | — | — | — | — | passed |
| debug-task-management | 200 | aecccd3b-3b3f-48cf-b3d6-164c1f487753 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | aecccd3b-3b3f-48cf-b3d6-164c1f487753 | — | — | — | — | passed |
| debug-progress-feedback | 200 | d3d5171c-d809-4da3-a1e7-d99516c6bbae | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | d3d5171c-d809-4da3-a1e7-d99516c6bbae | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 51d7e501-5daf-4f54-8415-8e0e814a8bda | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 51d7e501-5daf-4f54-8415-8e0e814a8bda | — | — | — | — | passed |
| debug-reflection | 200 | c4c25b78-3c9a-4ab7-9410-633ed5982e11 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | c4c25b78-3c9a-4ab7-9410-633ed5982e11 | — | — | — | — | passed |
| debug-automation | 200 | dee6ee43-1a2e-492e-8877-f941b719c65f | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | dee6ee43-1a2e-492e-8877-f941b719c65f | — | — | — | — | passed |
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
| full-regression | 200 | c71b3bd8-a0b1-4049-9863-42536a1d7f37 | — | — | — | — | passed |
| full-regression-trace | 200 | c71b3bd8-a0b1-4049-9863-42536a1d7f37 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | b68882e8-92ac-43df-bf30-b708f5a1a907 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | b68882e8-92ac-43df-bf30-b708f5a1a907 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 3dc61c33-ea21-4d3b-a7be-6db989b73059 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 16d6cd8d-a3ec-4e20-a8e5-eeb9b0ae126b | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 368f1d5c-616b-4dd3-bda9-f79f4ac54005 | — | — | — | — | passed |
| probe-chief-agent | 200 | af342ec9-3dbe-4c52-9d06-3b29a0b5c215 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | af342ec9-3dbe-4c52-9d06-3b29a0b5c215 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | fa98cb4d-59d0-4fc7-8931-1bb961d3ef96 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | fa98cb4d-59d0-4fc7-8931-1bb961d3ef96 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 015ec124-2501-4ad4-a0ac-91c4a33be3cf | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 015ec124-2501-4ad4-a0ac-91c4a33be3cf | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | c0607fa7-9860-464d-a034-9fa59670d816 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | c0607fa7-9860-464d-a034-9fa59670d816 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | e2956eec-24c0-4601-915a-c0d2c0f65049 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | e2956eec-24c0-4601-915a-c0d2c0f65049 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 4b3be76d-464c-4104-b4a6-a5dc7f7fdf33 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 4b3be76d-464c-4104-b4a6-a5dc7f7fdf33 | — | — | — | — | passed |
| probe-automation-agent | 200 | 2ebd78a2-e9e6-4b51-b07f-697e5ba279c2 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 2ebd78a2-e9e6-4b51-b07f-697e5ba279c2 | — | — | — | — | passed |
| chief-route-recovery | 200 | e24c2800-28ff-4405-8204-6c391854ad4b | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | e24c2800-28ff-4405-8204-6c391854ad4b | — | — | — | — | passed |
| chief-route-task-management | 200 | 80792d9f-620e-40b2-a52e-ffc459c3ff91 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 80792d9f-620e-40b2-a52e-ffc459c3ff91 | — | — | — | — | passed |
| chief-route-reflection | 200 | 7ecc050a-6db0-4e47-bf5f-7f020e83c83b | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 7ecc050a-6db0-4e47-bf5f-7f020e83c83b | — | — | — | — | passed |
| debug-state-insight | 200 | 34504efa-2621-48e1-b811-21e34aac1b4c | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 34504efa-2621-48e1-b811-21e34aac1b4c | — | — | — | — | passed |
| debug-task-management | 200 | c258d676-af1b-4c8e-a70c-16c99b92c3bf | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | c258d676-af1b-4c8e-a70c-16c99b92c3bf | — | — | — | — | passed |
| debug-progress-feedback | 200 | 5181e525-fa9d-4d55-b524-72a130c13fd1 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 5181e525-fa9d-4d55-b524-72a130c13fd1 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 93f1451a-03a4-4d84-b41f-e4a932395579 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 93f1451a-03a4-4d84-b41f-e4a932395579 | — | — | — | — | passed |
| debug-reflection | 200 | 3641fa9d-2209-4db4-92d2-b0e98b65f0e5 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 3641fa9d-2209-4db4-92d2-b0e98b65f0e5 | — | — | — | — | passed |
| debug-automation | 200 | 1019f334-a0e4-42b1-b3f3-315be8529ffc | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 1019f334-a0e4-42b1-b3f3-315be8529ffc | — | — | — | — | passed |
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
| full-regression | 200 | 53793925-8f7c-4eb9-ab30-3e1681ec5231 | — | — | — | — | passed |
| full-regression-trace | 200 | 53793925-8f7c-4eb9-ab30-3e1681ec5231 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | f16dc3b6-dbd4-4faa-bf1e-1d83beb0029f | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | f16dc3b6-dbd4-4faa-bf1e-1d83beb0029f | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | d2f5b55f-a415-4d16-9dee-1dd144ff97ae | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | e26a2e52-5581-4b82-ab0a-38ac05dd0219 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | ea42bebb-bbcb-4f6d-8946-4a47ac3e50a4 | — | — | — | — | passed |
| probe-chief-agent | 200 | 142bfab2-d44a-4618-a873-505db1ff6216 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 142bfab2-d44a-4618-a873-505db1ff6216 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 647b317b-3442-4c2c-abb9-57a2abce9c00 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 647b317b-3442-4c2c-abb9-57a2abce9c00 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 52c533d6-dfa2-4a72-a310-5066313e2a0b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 52c533d6-dfa2-4a72-a310-5066313e2a0b | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | e83fd382-01f1-4f82-8821-dfc0eb5b6a4e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | e83fd382-01f1-4f82-8821-dfc0eb5b6a4e | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 45078151-e77b-40b2-b641-4e0a9ad405b9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 45078151-e77b-40b2-b641-4e0a9ad405b9 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 0d085f9f-38e6-4a50-a45a-bd662a8e4fdd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 0d085f9f-38e6-4a50-a45a-bd662a8e4fdd | — | — | — | — | passed |
| probe-automation-agent | 200 | 42b34d5c-ded1-416f-8340-d54878d3eb38 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 42b34d5c-ded1-416f-8340-d54878d3eb38 | — | — | — | — | passed |
| chief-route-recovery | 200 | b657fe9c-849c-4b8b-b39d-792bbce73e29 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | b657fe9c-849c-4b8b-b39d-792bbce73e29 | — | — | — | — | passed |
| chief-route-task-management | 200 | 8a02da12-517b-46f4-955c-50ca16327adf | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 8a02da12-517b-46f4-955c-50ca16327adf | — | — | — | — | passed |
| chief-route-reflection | 200 | 247cdf12-ea02-42c3-91c5-d8556bcfbebd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 247cdf12-ea02-42c3-91c5-d8556bcfbebd | — | — | — | — | passed |
| debug-state-insight | 200 | 3419316a-2d39-4dd8-9225-30f838f0c039 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 3419316a-2d39-4dd8-9225-30f838f0c039 | — | — | — | — | passed |
| debug-task-management | 200 | 140ece9e-ae37-48b7-bbca-3f41b33b9417 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 140ece9e-ae37-48b7-bbca-3f41b33b9417 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 67574c17-a9cc-4dff-bd1d-71de3a1ddead | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 67574c17-a9cc-4dff-bd1d-71de3a1ddead | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 3e6ee00b-60ae-4fb1-b1ba-e74ea199012f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 3e6ee00b-60ae-4fb1-b1ba-e74ea199012f | — | — | — | — | passed |
| debug-reflection | 200 | bf1d3229-d557-4d2c-9875-68f809832064 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | bf1d3229-d557-4d2c-9875-68f809832064 | — | — | — | — | passed |
| debug-automation | 200 | 1d37c53d-bce2-424e-a892-1998e25f1f2f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 1d37c53d-bce2-424e-a892-1998e25f1f2f | — | — | — | — | passed |
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
| full-regression | 200 | f06ad26e-088e-403e-b219-4be03137fa6d | — | — | — | — | passed |
| full-regression-trace | 200 | f06ad26e-088e-403e-b219-4be03137fa6d | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 59446b13-9f6f-4988-99ca-7896949bf55e | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 59446b13-9f6f-4988-99ca-7896949bf55e | — | — | — | — | passed |

