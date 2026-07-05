# Core Phase Test Report

- Started: `2026-04-22T07:25:06.660Z`
- Completed: `2026-04-22T07:26:53.623Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 3 Cluster Preferred | passed | openai-compatible | — | http://127.0.0.1:8788 | 35/35 |

## Failures

- 无失败记录。

## Preflight

- 状态：`passed`
- Issues：`0`
- Provider auth probe：`passed`
- Provider auth accepted via：`ok`
- Provider auth endpoint：`/responses`
- Provider config drift：`aligned`
- Gateway baseUrl：`https://drigeo.com`
- OpenClaw baseUrl：`https://drigeo.com`
- 无 preflight 问题。


## Artifacts

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-24-59-878Z/report.live.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-24-59-878Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-24-59-878Z/responses`

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 450d2409-c5df-40e4-99ce-aa03c6b6f691 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 276ce1d2-ac17-4c68-a8dc-7cfde1cee1e4 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | afd46dcf-71ed-4e5e-950c-211061d8b77b | — | — | — | — | passed |
| probe-chief-agent | 200 | 5b87ff27-c1d6-4536-b7be-efd1cabcf91b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 5b87ff27-c1d6-4536-b7be-efd1cabcf91b | — | — | — | — | passed |
| probe-state-insight-agent | 200 | fe464826-89f0-462a-9d20-c05f0f2333ed | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | fe464826-89f0-462a-9d20-c05f0f2333ed | — | — | — | — | passed |
| probe-task-management-agent | 200 | e347019d-0b46-4184-af02-d10231d0aa4c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | e347019d-0b46-4184-af02-d10231d0aa4c | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | dc77604f-91b6-47ae-9760-2ca87d2274e8 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | dc77604f-91b6-47ae-9760-2ca87d2274e8 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | a437e079-0781-4a1a-abd0-4beaf5c85d7a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | a437e079-0781-4a1a-abd0-4beaf5c85d7a | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 73c8de8c-059c-472b-84e0-904ce8f2adbd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 73c8de8c-059c-472b-84e0-904ce8f2adbd | — | — | — | — | passed |
| probe-automation-agent | 200 | eb0bd698-21c5-4bdd-855a-d2cee9f2207a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | eb0bd698-21c5-4bdd-855a-d2cee9f2207a | — | — | — | — | passed |
| chief-route-recovery | 200 | bb797d9d-001d-4238-85b3-cc9257d2937c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | bb797d9d-001d-4238-85b3-cc9257d2937c | — | — | — | — | passed |
| chief-route-task-management | 200 | e2074f47-35cf-4fa0-be7a-ca848201e305 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | e2074f47-35cf-4fa0-be7a-ca848201e305 | — | — | — | — | passed |
| chief-route-reflection | 200 | 9144cac2-9175-4e19-a978-2066152ccbd9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 9144cac2-9175-4e19-a978-2066152ccbd9 | — | — | — | — | passed |
| debug-state-insight | 200 | 75b07611-6bef-45b9-99d9-c3ccbeee9106 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 75b07611-6bef-45b9-99d9-c3ccbeee9106 | — | — | — | — | passed |
| debug-task-management | 200 | 28a64e73-2ecc-477a-b129-524b9bc9ae40 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 28a64e73-2ecc-477a-b129-524b9bc9ae40 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 855bf228-fc6a-4b99-81fc-5d5f9251bd66 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 855bf228-fc6a-4b99-81fc-5d5f9251bd66 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 1e57299b-899f-498d-a755-467cfcc64f51 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 1e57299b-899f-498d-a755-467cfcc64f51 | — | — | — | — | passed |
| debug-reflection | 200 | f46d1f31-61f8-45cd-a2ab-dd9bdd76a01e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | f46d1f31-61f8-45cd-a2ab-dd9bdd76a01e | — | — | — | — | passed |
| debug-automation | 200 | 7e39d049-9a2e-48a2-9416-2e2137043bba | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 7e39d049-9a2e-48a2-9416-2e2137043bba | — | — | — | — | passed |

