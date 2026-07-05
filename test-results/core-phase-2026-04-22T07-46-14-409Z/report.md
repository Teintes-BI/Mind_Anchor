# Core Phase Test Report

- Started: `2026-04-22T07:46:21.626Z`
- Completed: `2026-04-22T07:48:11.326Z`
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

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-46-14-409Z/report.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-46-14-409Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-46-14-409Z/responses`

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | c2116bb1-1131-4c72-ba91-aec83c7af7da | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | b73fbf51-4a04-4bb8-9cee-75c6d6e8882c | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | c30a402c-fc0f-4613-b2d2-d7745f3f695b | — | — | — | — | passed |
| probe-chief-agent | 200 | cf1490f0-3ca2-4c46-a962-b8fc5a295734 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | cf1490f0-3ca2-4c46-a962-b8fc5a295734 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 8d1ee569-eb79-4480-bce5-25809b8bf1cd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 8d1ee569-eb79-4480-bce5-25809b8bf1cd | — | — | — | — | passed |
| probe-task-management-agent | 200 | 4b25d333-41c8-48c6-a067-9b9fe8f287b3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 4b25d333-41c8-48c6-a067-9b9fe8f287b3 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 2764b99b-21fd-4aba-b114-9819aff94c53 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 2764b99b-21fd-4aba-b114-9819aff94c53 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | c8214d38-f2c5-4d2b-b911-6b73528c6a4c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | c8214d38-f2c5-4d2b-b911-6b73528c6a4c | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 1fd33ffc-e3df-4e60-a493-a6145064c07b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 1fd33ffc-e3df-4e60-a493-a6145064c07b | — | — | — | — | passed |
| probe-automation-agent | 200 | 3e222a33-827c-4218-af08-04f1e411d260 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 3e222a33-827c-4218-af08-04f1e411d260 | — | — | — | — | passed |
| chief-route-recovery | 200 | 71e50989-5e60-40a6-a98d-d5a0dd596142 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 71e50989-5e60-40a6-a98d-d5a0dd596142 | — | — | — | — | passed |
| chief-route-task-management | 200 | 60db49ae-ded6-4fd4-82c8-b7f93779f1dd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 60db49ae-ded6-4fd4-82c8-b7f93779f1dd | — | — | — | — | passed |
| chief-route-reflection | 200 | 05bcec38-95c6-4004-819a-33c83a1db827 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 05bcec38-95c6-4004-819a-33c83a1db827 | — | — | — | — | passed |
| debug-state-insight | 200 | fa5dccae-176d-459c-bd14-89598ff4c0b6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | fa5dccae-176d-459c-bd14-89598ff4c0b6 | — | — | — | — | passed |
| debug-task-management | 200 | ae55b184-9c42-4d38-985f-35d04e7102b3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | ae55b184-9c42-4d38-985f-35d04e7102b3 | — | — | — | — | passed |
| debug-progress-feedback | 200 | b9717207-b28c-4942-997c-c39794d8a3d4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | b9717207-b28c-4942-997c-c39794d8a3d4 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 86ab3290-db98-4597-8bc5-7134ddfaccec | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 86ab3290-db98-4597-8bc5-7134ddfaccec | — | — | — | — | passed |
| debug-reflection | 200 | 1cc86f8c-d0cc-4077-8893-e9a30a26fcf6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 1cc86f8c-d0cc-4077-8893-e9a30a26fcf6 | — | — | — | — | passed |
| debug-automation | 200 | 813850db-2d30-475a-8d88-fddd17dac144 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 813850db-2d30-475a-8d88-fddd17dac144 | — | — | — | — | passed |

