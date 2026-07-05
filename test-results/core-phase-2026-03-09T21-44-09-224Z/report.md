# Core Phase Test Report

- Started: `2026-03-09T21:44:09.224Z`
- Completed: `2026-03-09T21:45:48.951Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Provider Mode: `mock`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | 57/57 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 52/53 |
| Phase 3 Cluster Preferred | passed | openai-compatible | http://127.0.0.1:8788 | 71/71 |

## Failures

- [provider-direct] business-state-latest: Latest state missing assessment.
- [provider-direct] provider-direct-phase: Latest state missing assessment.

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T21-44-09-224Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T21-44-09-224Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T21-44-09-224Z/responses`

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
| seed-focus-recovery-loop | 200 | f9f4e01c-37ea-4261-b029-75369c01ca1a | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 61dfeb40-d4df-414a-b7e0-ae7cc28c4596 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 145c4ccc-f878-4091-8a88-049685332ea7 | — | — | — | — | passed |
| chief-route-recovery | 200 | fd9c25c9-3262-4c7a-93b9-7d382d42582e | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | fd9c25c9-3262-4c7a-93b9-7d382d42582e | — | — | — | — | passed |
| chief-route-task-management | 200 | 5b9994cf-910f-4aa3-9a4c-551cb36580c6 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 5b9994cf-910f-4aa3-9a4c-551cb36580c6 | — | — | — | — | passed |
| chief-route-reflection | 200 | 2a8becae-02d3-42ca-9868-530994186e31 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 2a8becae-02d3-42ca-9868-530994186e31 | — | — | — | — | passed |
| debug-state-insight | 200 | f84cb863-abfd-4183-b76c-2c63f9c84e43 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | f84cb863-abfd-4183-b76c-2c63f9c84e43 | — | — | — | — | passed |
| debug-task-management | 200 | ba76e5ab-f971-4041-9b63-c538b425decb | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | ba76e5ab-f971-4041-9b63-c538b425decb | — | — | — | — | passed |
| debug-progress-feedback | 200 | 3d34a0b0-69c4-42e4-b8c6-bfb10c956a31 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 3d34a0b0-69c4-42e4-b8c6-bfb10c956a31 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 8ed7713e-d8ea-4959-9ea8-cab6fd236e66 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 8ed7713e-d8ea-4959-9ea8-cab6fd236e66 | — | — | — | — | passed |
| debug-reflection | 200 | d5281461-61b8-4136-bd6b-36aa809b1a3e | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | d5281461-61b8-4136-bd6b-36aa809b1a3e | — | — | — | — | passed |
| debug-automation | 200 | d7a73880-ab7e-4b21-84a6-5cc91c0a83b0 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | d7a73880-ab7e-4b21-84a6-5cc91c0a83b0 | — | — | — | — | passed |
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
| full-regression | 200 | d0c99986-7112-42b4-8467-3976bd2e29c5 | — | — | — | — | passed |
| full-regression-trace | 200 | d0c99986-7112-42b4-8467-3976bd2e29c5 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | f3f60db5-309d-4886-8419-df47b6a96a92 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | f3f60db5-309d-4886-8419-df47b6a96a92 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | d4d6e245-f47c-4984-b4f0-fd2f6e36aeff | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 7a0c4189-7abd-43c0-8d44-dcf829e068c8 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | c84e947f-cac6-4dc4-bff8-682e40e21d85 | — | — | — | — | passed |
| probe-chief-agent | 200 | 9d767b99-55dd-4523-9fa3-95f00628d73e | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 9d767b99-55dd-4523-9fa3-95f00628d73e | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 9f972fde-6f2a-4a72-adc9-1ed9357ab423 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 9f972fde-6f2a-4a72-adc9-1ed9357ab423 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 870ca8a7-e176-467e-8610-3b3b9941ca04 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 870ca8a7-e176-467e-8610-3b3b9941ca04 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | fb21a1dd-13f9-4177-8537-0510860a5c3c | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | fb21a1dd-13f9-4177-8537-0510860a5c3c | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 6e78611e-01d7-48e7-b2b2-a82039c9ebc7 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 6e78611e-01d7-48e7-b2b2-a82039c9ebc7 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | df46b651-3280-4a12-bf39-d2fb532f4a06 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | df46b651-3280-4a12-bf39-d2fb532f4a06 | — | — | — | — | passed |
| probe-automation-agent | 200 | 38b652b0-7921-4695-9ee2-0eef86a39339 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 38b652b0-7921-4695-9ee2-0eef86a39339 | — | — | — | — | passed |
| chief-route-recovery | 200 | 140b3e0b-f747-4f92-a897-55bde7838ebe | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 140b3e0b-f747-4f92-a897-55bde7838ebe | — | — | — | — | passed |
| chief-route-task-management | 200 | 054aa52f-3b3b-4ca7-973f-502b3b706d3c | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 054aa52f-3b3b-4ca7-973f-502b3b706d3c | — | — | — | — | passed |
| chief-route-reflection | 200 | eac3a64e-87f5-483d-adb3-e2971b48032c | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | eac3a64e-87f5-483d-adb3-e2971b48032c | — | — | — | — | passed |
| debug-state-insight | 200 | e603b4fa-baa3-4421-93ec-636186173d8c | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | e603b4fa-baa3-4421-93ec-636186173d8c | — | — | — | — | passed |
| debug-task-management | 200 | 4a6f1764-ca84-4e1d-ab6a-f9f5bd4f1740 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 4a6f1764-ca84-4e1d-ab6a-f9f5bd4f1740 | — | — | — | — | passed |
| debug-progress-feedback | 200 | e7faf968-cab8-4f35-9afb-a2a70eb78649 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | e7faf968-cab8-4f35-9afb-a2a70eb78649 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | fac9663f-6c80-408c-80c3-c1ed005b9a2f | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | fac9663f-6c80-408c-80c3-c1ed005b9a2f | — | — | — | — | passed |
| debug-reflection | 200 | e43c708d-19d4-4536-9f3d-edaa2d03e635 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | e43c708d-19d4-4536-9f3d-edaa2d03e635 | — | — | — | — | passed |
| debug-automation | 200 | be58d4f2-b6bf-46ad-9605-2ba1906652fd | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | be58d4f2-b6bf-46ad-9605-2ba1906652fd | — | — | — | — | passed |
| business-create-goal | 201 | — | — | — | — | — | passed |
| business-create-task | 201 | — | — | — | — | — | passed |
| business-start-session | 201 | — | — | — | — | — | passed |
| business-signal-batch | 200 | — | — | — | — | — | passed |
| business-state-latest | 200 | — | — | — | — | — | Latest state missing assessment. |

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
| seed-focus-recovery-loop | 200 | 739b0a1c-802f-40a9-b597-2470397dd0cf | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | f58e5ef9-2193-437b-a8f1-6f7a43464996 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 850f04fa-89cb-45a9-b18c-a09ba35e78b6 | — | — | — | — | passed |
| probe-chief-agent | 200 | 1e3c3359-d93d-4ca4-8047-087b9bd317b1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 1e3c3359-d93d-4ca4-8047-087b9bd317b1 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 87c8fb38-22b2-40e3-bbb6-98d0d7030901 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 87c8fb38-22b2-40e3-bbb6-98d0d7030901 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 51988b73-ca59-4ac2-928c-838b9d50016f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 51988b73-ca59-4ac2-928c-838b9d50016f | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | b6a70eec-0d04-44aa-b743-96f0b38b4b7d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | b6a70eec-0d04-44aa-b743-96f0b38b4b7d | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 899f722e-2b3f-4308-8cd0-768acc90d0c5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 899f722e-2b3f-4308-8cd0-768acc90d0c5 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | f4fb475c-b0f4-45f8-a3df-dda96ede6f40 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | f4fb475c-b0f4-45f8-a3df-dda96ede6f40 | — | — | — | — | passed |
| probe-automation-agent | 200 | e35fc8c9-5b35-491b-8363-2838d932fcd6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | e35fc8c9-5b35-491b-8363-2838d932fcd6 | — | — | — | — | passed |
| chief-route-recovery | 200 | 34d4f559-f1a9-4607-a80e-0b3243e74e27 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 34d4f559-f1a9-4607-a80e-0b3243e74e27 | — | — | — | — | passed |
| chief-route-task-management | 200 | 2b04c1d6-2967-4394-9186-38757aaa407a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 2b04c1d6-2967-4394-9186-38757aaa407a | — | — | — | — | passed |
| chief-route-reflection | 200 | b0f7a232-97af-4ef9-a022-2bcf7f272308 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | b0f7a232-97af-4ef9-a022-2bcf7f272308 | — | — | — | — | passed |
| debug-state-insight | 200 | c9ef28a4-43b5-4bd7-8bdc-24ee4b6e86f6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | c9ef28a4-43b5-4bd7-8bdc-24ee4b6e86f6 | — | — | — | — | passed |
| debug-task-management | 200 | 21ca4cb3-7c70-4f70-94ba-ec58fa1b2fea | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 21ca4cb3-7c70-4f70-94ba-ec58fa1b2fea | — | — | — | — | passed |
| debug-progress-feedback | 200 | d9f736cb-0eb6-4fe8-9ba2-87513d1b556c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | d9f736cb-0eb6-4fe8-9ba2-87513d1b556c | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 67cc90c9-867a-487d-ba7e-5bbdf8514160 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 67cc90c9-867a-487d-ba7e-5bbdf8514160 | — | — | — | — | passed |
| debug-reflection | 200 | cfc7be25-fad2-40a2-ba97-edd6a8bbe73f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | cfc7be25-fad2-40a2-ba97-edd6a8bbe73f | — | — | — | — | passed |
| debug-automation | 200 | 061bc97e-8b69-4e06-be96-9b327acd23b4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 061bc97e-8b69-4e06-be96-9b327acd23b4 | — | — | — | — | passed |
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
| full-regression | 200 | c901f8db-f5ff-4f3d-bd7e-55980a334044 | — | — | — | — | passed |
| full-regression-trace | 200 | c901f8db-f5ff-4f3d-bd7e-55980a334044 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 251846ca-3388-43dd-9be3-330e03df1228 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 251846ca-3388-43dd-9be3-330e03df1228 | — | — | — | — | passed |

