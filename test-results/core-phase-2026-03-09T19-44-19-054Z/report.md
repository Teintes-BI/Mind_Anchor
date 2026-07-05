# Core Phase Test Report

- Started: `2026-03-09T19:44:19.055Z`
- Completed: `2026-03-09T20:24:43.268Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | 57/57 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 32/33 |
| Phase 3 Cluster Preferred | passed | openai-compatible | http://127.0.0.1:8788 | 71/71 |

## Failures

- [provider-direct] chief-route-task-management: Request timeout after 1200000ms
- [provider-direct] provider-direct-phase: Request timeout after 1200000ms

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T19-44-19-054Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T19-44-19-054Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T19-44-19-054Z/responses`

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
| seed-focus-recovery-loop | 200 | f5086397-133d-4de3-8632-8b48b3b690fb | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 291dae89-b36a-4f38-b700-db93eb075c02 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 6d8cf0b5-475e-4e9d-b761-c89c86230182 | — | — | — | — | passed |
| chief-route-recovery | 200 | 64d2b1d5-539c-4731-9cae-bc0de21f5aad | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 64d2b1d5-539c-4731-9cae-bc0de21f5aad | — | — | — | — | passed |
| chief-route-task-management | 200 | 54c0c901-4efe-4afa-a032-a0b6352b5dff | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 54c0c901-4efe-4afa-a032-a0b6352b5dff | — | — | — | — | passed |
| chief-route-reflection | 200 | e362d256-e9bd-4704-9cb2-cd7c54b18c8f | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | e362d256-e9bd-4704-9cb2-cd7c54b18c8f | — | — | — | — | passed |
| debug-state-insight | 200 | 6ff32a9f-6650-44c5-99fc-1275febbdf11 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 6ff32a9f-6650-44c5-99fc-1275febbdf11 | — | — | — | — | passed |
| debug-task-management | 200 | f74bacd9-4696-421a-8cc5-8ddb4c1639ab | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | f74bacd9-4696-421a-8cc5-8ddb4c1639ab | — | — | — | — | passed |
| debug-progress-feedback | 200 | cea264a5-1a5f-4427-8b3a-ec6e896dee49 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | cea264a5-1a5f-4427-8b3a-ec6e896dee49 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | f00a7b57-22b8-422a-997e-8ca03111c949 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | f00a7b57-22b8-422a-997e-8ca03111c949 | — | — | — | — | passed |
| debug-reflection | 200 | 44f1183f-c50d-4c2d-987d-9d8b9db8c45f | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 44f1183f-c50d-4c2d-987d-9d8b9db8c45f | — | — | — | — | passed |
| debug-automation | 200 | 6529dd90-3d44-4a7b-8b3f-8d6456a9f2dc | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 6529dd90-3d44-4a7b-8b3f-8d6456a9f2dc | — | — | — | — | passed |
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
| full-regression | 200 | 91091561-35ab-4cd9-a6a4-718ce0c20457 | — | — | — | — | passed |
| full-regression-trace | 200 | 91091561-35ab-4cd9-a6a4-718ce0c20457 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 3c822756-5237-4332-81fc-ebf2f4c9c4c5 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 3c822756-5237-4332-81fc-ebf2f4c9c4c5 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | d2962bd4-ca99-45f0-8d0b-fb84e2ef5487 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | fc52e134-3a47-4d0b-a6cc-fb55fcc81ee5 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | cc11818c-ef58-46fb-88cc-8cb93242a981 | — | — | — | — | passed |
| probe-chief-agent | 200 | a6d7428a-b637-41a1-a83c-b2d609d7944a | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | a6d7428a-b637-41a1-a83c-b2d609d7944a | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 4f6de8c2-ac58-46b9-a4dd-80e92e0332cd | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 4f6de8c2-ac58-46b9-a4dd-80e92e0332cd | — | — | — | — | passed |
| probe-task-management-agent | 200 | b620ca2b-d5c7-4fbe-bc6b-6de99dc01b59 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | b620ca2b-d5c7-4fbe-bc6b-6de99dc01b59 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | ceedbabe-f608-4246-9d6e-3edbddd66a1f | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | ceedbabe-f608-4246-9d6e-3edbddd66a1f | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | abdf004b-2ece-43a1-861f-23ddab16cee4 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | abdf004b-2ece-43a1-861f-23ddab16cee4 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | eaa9f29c-bc70-4e4e-a48a-56288e940f31 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | eaa9f29c-bc70-4e4e-a48a-56288e940f31 | — | — | — | — | passed |
| probe-automation-agent | 200 | b2dcb7fb-fda7-4cf4-b031-16df5de7e2fd | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | b2dcb7fb-fda7-4cf4-b031-16df5de7e2fd | — | — | — | — | passed |
| chief-route-recovery | 200 | 69e8e97d-5d5b-4827-b3de-a05041b58975 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 69e8e97d-5d5b-4827-b3de-a05041b58975 | — | — | — | — | passed |
| chief-route-task-management | ERR | — | — | — | — | — | Request timeout after 1200000ms |

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
| seed-focus-recovery-loop | 200 | 9519100a-3a97-4140-a9c2-c7202c49764c | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 1e9b5014-cad0-41fb-981e-412b6625f381 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | b4917b80-3358-4b1d-801e-d9e06c29a233 | — | — | — | — | passed |
| probe-chief-agent | 200 | b05ea4af-9592-4388-9578-f052b14b9d12 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | b05ea4af-9592-4388-9578-f052b14b9d12 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 6d332c23-6b70-4f58-a7b6-e76baf976272 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 6d332c23-6b70-4f58-a7b6-e76baf976272 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 063ce15f-dfa1-40dc-b380-44f936782842 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 063ce15f-dfa1-40dc-b380-44f936782842 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | a9166d76-f33a-420b-94d1-4abb5b97be1b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | a9166d76-f33a-420b-94d1-4abb5b97be1b | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 3fd3ab7b-9993-4184-a458-20fede309f26 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 3fd3ab7b-9993-4184-a458-20fede309f26 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 8643fdeb-357d-459c-a1fc-3c5cb0dc432d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 8643fdeb-357d-459c-a1fc-3c5cb0dc432d | — | — | — | — | passed |
| probe-automation-agent | 200 | 2f0b578c-d9d2-4d83-aff2-1ba701fcfcad | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 2f0b578c-d9d2-4d83-aff2-1ba701fcfcad | — | — | — | — | passed |
| chief-route-recovery | 200 | a74ffd66-8ff8-4248-ad96-f1d93b7638c1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | a74ffd66-8ff8-4248-ad96-f1d93b7638c1 | — | — | — | — | passed |
| chief-route-task-management | 200 | a31ac50a-fd03-45e3-8309-7f68e832dbe5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | a31ac50a-fd03-45e3-8309-7f68e832dbe5 | — | — | — | — | passed |
| chief-route-reflection | 200 | 611bf6b5-d01e-4eb4-aa50-91b6549ac3d3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 611bf6b5-d01e-4eb4-aa50-91b6549ac3d3 | — | — | — | — | passed |
| debug-state-insight | 200 | a6b00f4d-cd3f-4713-84a6-de422d74996b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | a6b00f4d-cd3f-4713-84a6-de422d74996b | — | — | — | — | passed |
| debug-task-management | 200 | 08a77183-07f7-4718-bd09-90f67358dc46 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 08a77183-07f7-4718-bd09-90f67358dc46 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 9cec85c0-c0f8-4167-b5c9-1581be704b7d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 9cec85c0-c0f8-4167-b5c9-1581be704b7d | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 2f7e70aa-5481-4d86-a02c-4ee2a26cb1d7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 2f7e70aa-5481-4d86-a02c-4ee2a26cb1d7 | — | — | — | — | passed |
| debug-reflection | 200 | 15cfe46b-3d8d-44f5-8aee-3177319d8d62 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 15cfe46b-3d8d-44f5-8aee-3177319d8d62 | — | — | — | — | passed |
| debug-automation | 200 | a9fe39b8-a03f-435e-9a6a-aed93511b6be | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | a9fe39b8-a03f-435e-9a6a-aed93511b6be | — | — | — | — | passed |
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
| full-regression | 200 | 2cb54300-c207-4e97-b83b-cdae4fad538e | — | — | — | — | passed |
| full-regression-trace | 200 | 2cb54300-c207-4e97-b83b-cdae4fad538e | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 97f8b95a-4e65-4098-a8d9-dc3127349af2 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 97f8b95a-4e65-4098-a8d9-dc3127349af2 | — | — | — | — | passed |

