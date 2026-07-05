# Core Phase Test Report

- Started: `2026-04-22T07:22:42.349Z`
- Completed: `2026-04-22T07:24:29.652Z`
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

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-22-35-033Z/report.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-22-35-033Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-22-35-033Z/responses`

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 287fbfc4-9b33-414f-9f21-9bddc8fcd982 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | f0ee9d20-927c-4c98-a6bb-a096cae3e3b1 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | a1ae6358-1bcc-429e-a42f-e7994c89b240 | — | — | — | — | passed |
| probe-chief-agent | 200 | 40a30bfd-8cdd-430c-a228-77b50cbbdede | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 40a30bfd-8cdd-430c-a228-77b50cbbdede | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 46cb54bf-1b99-4088-8692-97d29361fae3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 46cb54bf-1b99-4088-8692-97d29361fae3 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 843ef4fc-be70-44f5-a2bc-740056dcdef5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 843ef4fc-be70-44f5-a2bc-740056dcdef5 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | f14b7eb2-fe03-48ca-93b8-81bed8e9ea1f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | f14b7eb2-fe03-48ca-93b8-81bed8e9ea1f | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 91e48b0a-80eb-497a-82df-b085f7d8941b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 91e48b0a-80eb-497a-82df-b085f7d8941b | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 8fc619ca-ae42-43f7-96ee-d8afe0cdd53c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 8fc619ca-ae42-43f7-96ee-d8afe0cdd53c | — | — | — | — | passed |
| probe-automation-agent | 200 | 9ed27327-49a6-4ae2-9f94-436dbc269a1b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 9ed27327-49a6-4ae2-9f94-436dbc269a1b | — | — | — | — | passed |
| chief-route-recovery | 200 | f9f90975-29a9-41fb-a2a9-ac63d964965c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | f9f90975-29a9-41fb-a2a9-ac63d964965c | — | — | — | — | passed |
| chief-route-task-management | 200 | 5cc621c9-81cd-41d9-8be1-a120d8883134 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 5cc621c9-81cd-41d9-8be1-a120d8883134 | — | — | — | — | passed |
| chief-route-reflection | 200 | 8064c77f-048d-4fd1-a2bd-70a9f9a3dede | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 8064c77f-048d-4fd1-a2bd-70a9f9a3dede | — | — | — | — | passed |
| debug-state-insight | 200 | efe9b753-71a4-457c-b66a-0c03e96b8062 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | efe9b753-71a4-457c-b66a-0c03e96b8062 | — | — | — | — | passed |
| debug-task-management | 200 | 2a1cf8c5-a862-4d7c-925a-65a36ca2ed4d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 2a1cf8c5-a862-4d7c-925a-65a36ca2ed4d | — | — | — | — | passed |
| debug-progress-feedback | 200 | b23fd43a-f8a9-4f1a-9c93-e5943434fb22 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | b23fd43a-f8a9-4f1a-9c93-e5943434fb22 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | fa5d7784-62fa-4053-ac0b-e18f680e0662 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | fa5d7784-62fa-4053-ac0b-e18f680e0662 | — | — | — | — | passed |
| debug-reflection | 200 | 874ed0fe-75f7-440d-aa5c-4a161d1c6c04 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 874ed0fe-75f7-440d-aa5c-4a161d1c6c04 | — | — | — | — | passed |
| debug-automation | 200 | 8bc9bb57-9507-4730-a123-52f7f99a208f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 8bc9bb57-9507-4730-a123-52f7f99a208f | — | — | — | — | passed |

