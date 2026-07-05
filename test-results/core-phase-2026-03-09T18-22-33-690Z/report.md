# Core Phase Test Report

- Started: `2026-03-09T18:22:33.691Z`
- Completed: `2026-03-09T18:39:40.098Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | 57/57 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 26/27 |
| Phase 3 Cluster Preferred | passed | openai-compatible | http://127.0.0.1:8788 | 71/71 |

## Failures

- [provider-direct] probe-reflection-coach-agent: Request timeout after 300000ms
- [provider-direct] provider-direct-phase: Request timeout after 300000ms

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T18-22-33-690Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T18-22-33-690Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T18-22-33-690Z/responses`

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
| seed-focus-recovery-loop | 200 | 3dad5a5c-8c86-4269-9cb5-cd38e45c27fb | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 3dbad497-3499-4ec8-9c15-90e414ab3e9e | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 5422ebf7-81dc-4ac9-af62-61ae84cb9957 | — | — | — | — | passed |
| chief-route-recovery | 200 | c4a19fa7-2091-409c-b712-bfae70e8f0be | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | c4a19fa7-2091-409c-b712-bfae70e8f0be | — | — | — | — | passed |
| chief-route-task-management | 200 | 18a3e073-24ba-4c64-8e47-892788e1624c | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 18a3e073-24ba-4c64-8e47-892788e1624c | — | — | — | — | passed |
| chief-route-reflection | 200 | abc3f694-40e9-41cb-8bac-a355ccc2bc03 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | abc3f694-40e9-41cb-8bac-a355ccc2bc03 | — | — | — | — | passed |
| debug-state-insight | 200 | 73403de1-1f6b-45ef-9207-81ce6d32a56f | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 73403de1-1f6b-45ef-9207-81ce6d32a56f | — | — | — | — | passed |
| debug-task-management | 200 | 7deccb0b-29c0-4e47-bdbf-855cd05861a2 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 7deccb0b-29c0-4e47-bdbf-855cd05861a2 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 9a24fb12-1881-4c6b-a3f6-d9825c697f8d | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 9a24fb12-1881-4c6b-a3f6-d9825c697f8d | — | — | — | — | passed |
| debug-interruption-recovery | 200 | b90e4d7f-5238-4694-8161-f02ebea412ae | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | b90e4d7f-5238-4694-8161-f02ebea412ae | — | — | — | — | passed |
| debug-reflection | 200 | 9acbeff5-da29-4ebe-919d-0b1a66827d3c | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 9acbeff5-da29-4ebe-919d-0b1a66827d3c | — | — | — | — | passed |
| debug-automation | 200 | af1f9e95-338c-49b3-8a28-4b34985ad603 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | af1f9e95-338c-49b3-8a28-4b34985ad603 | — | — | — | — | passed |
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
| full-regression | 200 | e69963bf-6b8e-41d7-97d5-2c6fc19caa1b | — | — | — | — | passed |
| full-regression-trace | 200 | e69963bf-6b8e-41d7-97d5-2c6fc19caa1b | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 2b6d77d2-64f3-4fd1-b452-64138be716ff | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 2b6d77d2-64f3-4fd1-b452-64138be716ff | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | e7ee51f5-444d-4087-b9fb-f8878a2d5e43 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 30b40278-2308-40f4-b899-94c19a195850 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | ff5b7abb-fa3f-419f-a83a-77614eefde01 | — | — | — | — | passed |
| probe-chief-agent | 200 | 00574439-9043-44e4-9541-3b2b7ca5d6f7 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 00574439-9043-44e4-9541-3b2b7ca5d6f7 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 25de6405-2ed4-4731-8f92-27cc778a0284 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 25de6405-2ed4-4731-8f92-27cc778a0284 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 61e9342a-25c5-4afe-8640-31c2222f940a | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 61e9342a-25c5-4afe-8640-31c2222f940a | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 2af59eb1-f7be-4e2a-8e38-afafd7d23cca | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 2af59eb1-f7be-4e2a-8e38-afafd7d23cca | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 2d67e901-a687-46ba-a817-974b9c40f8fc | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 2d67e901-a687-46ba-a817-974b9c40f8fc | — | — | — | — | passed |
| probe-reflection-coach-agent | ERR | — | — | — | — | — | Request timeout after 300000ms |

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
| seed-focus-recovery-loop | 200 | ba25667b-f666-4978-a22b-684c0040a45b | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 2c8fcd28-aaa4-42d3-bf20-fb30db64cde0 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 2faaec3e-a1db-4786-92c2-68c45c5f98a1 | — | — | — | — | passed |
| probe-chief-agent | 200 | 53d015eb-698e-4b93-86fd-f6bcac61460a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 53d015eb-698e-4b93-86fd-f6bcac61460a | — | — | — | — | passed |
| probe-state-insight-agent | 200 | b85c22e6-1f8d-4b68-b258-5aba3f8eaca6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | b85c22e6-1f8d-4b68-b258-5aba3f8eaca6 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 62e8b6e5-453b-4064-83e6-53935b35028f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 62e8b6e5-453b-4064-83e6-53935b35028f | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 71bcdbe0-196d-4bcb-a112-a2145e8420e4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 71bcdbe0-196d-4bcb-a112-a2145e8420e4 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | e5acf177-15ff-446c-9c64-9871d5cb0251 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | e5acf177-15ff-446c-9c64-9871d5cb0251 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 07101611-386e-4380-ae6e-6b11d1261f44 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 07101611-386e-4380-ae6e-6b11d1261f44 | — | — | — | — | passed |
| probe-automation-agent | 200 | f3c6a75a-dbd9-42ab-a766-54d5bc46a324 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | f3c6a75a-dbd9-42ab-a766-54d5bc46a324 | — | — | — | — | passed |
| chief-route-recovery | 200 | 84fbb394-bcde-40af-afaa-95279e091f3c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 84fbb394-bcde-40af-afaa-95279e091f3c | — | — | — | — | passed |
| chief-route-task-management | 200 | ca48ba7d-cef5-4c06-8f9a-64f3380a97d0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | ca48ba7d-cef5-4c06-8f9a-64f3380a97d0 | — | — | — | — | passed |
| chief-route-reflection | 200 | be9162ba-059e-4087-a2e5-b0b585edab62 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | be9162ba-059e-4087-a2e5-b0b585edab62 | — | — | — | — | passed |
| debug-state-insight | 200 | ef913400-1358-463c-ac5d-1537e26c91d2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | ef913400-1358-463c-ac5d-1537e26c91d2 | — | — | — | — | passed |
| debug-task-management | 200 | 155e5632-95f1-4e04-b1c1-13657f1384c4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 155e5632-95f1-4e04-b1c1-13657f1384c4 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 8e3d8413-b6b7-478f-9251-c7ef6fbef720 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 8e3d8413-b6b7-478f-9251-c7ef6fbef720 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 0fb3f626-364b-446f-987c-3c6227fb5889 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 0fb3f626-364b-446f-987c-3c6227fb5889 | — | — | — | — | passed |
| debug-reflection | 200 | b41544ff-063d-4fb6-8c0f-c4c3d1ae0f88 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | b41544ff-063d-4fb6-8c0f-c4c3d1ae0f88 | — | — | — | — | passed |
| debug-automation | 200 | c0c559bb-d3f5-4016-be46-a7e1c76bc36c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | c0c559bb-d3f5-4016-be46-a7e1c76bc36c | — | — | — | — | passed |
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
| full-regression | 200 | 4e869d2e-1baa-4be0-bcc6-7152216c25f3 | — | — | — | — | passed |
| full-regression-trace | 200 | 4e869d2e-1baa-4be0-bcc6-7152216c25f3 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | eac0a9fc-fca0-4b4d-b688-67e7c897594e | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | eac0a9fc-fca0-4b4d-b688-67e7c897594e | — | — | — | — | passed |

