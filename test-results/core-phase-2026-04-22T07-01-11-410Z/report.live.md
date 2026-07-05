# Core Phase Test Report

- Started: `2026-04-22T07:01:18.403Z`
- Completed: `2026-04-22T07:03:21.411Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Provider Mode: `mock`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | — | 21/21 |
| Phase 2 Provider Direct | passed | openai-compatible | — | — | 35/35 |
| Phase 3 Cluster Preferred | passed | openai-compatible | — | http://127.0.0.1:8788 | 35/35 |

## Failures

- 无失败记录。

## Preflight

- 状态：`passed`
- Issues：`0`
- Provider auth probe：`skipped`

- 无 preflight 问题。


## Artifacts

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-01-11-410Z/report.live.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-01-11-410Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-01-11-410Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 977e9c85-e965-49fc-94da-4936569639c2 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | a2d5011b-40a4-4b54-b31b-0a33ca65bf35 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 12e8d397-2b41-4683-b1e8-0cf0d4360398 | — | — | — | — | passed |
| chief-route-recovery | 200 | c46ca861-5da1-473e-9b4e-9bc114cf85f9 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | c46ca861-5da1-473e-9b4e-9bc114cf85f9 | — | — | — | — | passed |
| chief-route-task-management | 200 | 4a2ddf2f-cd3d-4f29-9605-6755811f4959 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 4a2ddf2f-cd3d-4f29-9605-6755811f4959 | — | — | — | — | passed |
| chief-route-reflection | 200 | 20e2cbc3-7093-40c7-aa9d-dd653937d1c9 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 20e2cbc3-7093-40c7-aa9d-dd653937d1c9 | — | — | — | — | passed |
| debug-state-insight | 200 | b9842b55-a7e2-4331-8f6c-e3335c540652 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | b9842b55-a7e2-4331-8f6c-e3335c540652 | — | — | — | — | passed |
| debug-task-management | 200 | 2896c963-7856-454c-bf5c-40b714b5980b | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 2896c963-7856-454c-bf5c-40b714b5980b | — | — | — | — | passed |
| debug-progress-feedback | 200 | 042fc824-d0c2-47f4-b89c-eb845dfe4a90 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 042fc824-d0c2-47f4-b89c-eb845dfe4a90 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 45108af7-207a-45de-9e22-2ae349193877 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 45108af7-207a-45de-9e22-2ae349193877 | — | — | — | — | passed |
| debug-reflection | 200 | 0f864299-e11c-4407-ab63-efbf11b99bb2 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 0f864299-e11c-4407-ab63-efbf11b99bb2 | — | — | — | — | passed |
| debug-automation | 200 | 98e00bf8-d641-4a1d-aa48-6cf7055e6ffb | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 98e00bf8-d641-4a1d-aa48-6cf7055e6ffb | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | affc16f9-d37d-45e3-a911-d216b7eb8fe6 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 882f0df2-fb9c-4d6d-a9b2-525d9400b7d0 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 373d33bd-5b8d-44c2-91f7-c481d15df96e | — | — | — | — | passed |
| probe-chief-agent | 200 | 2cbfc9ee-5c21-4d5a-b972-77e07954c3e0 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 2cbfc9ee-5c21-4d5a-b972-77e07954c3e0 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 61f75f41-dd09-4e52-8729-dc424347dfad | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 61f75f41-dd09-4e52-8729-dc424347dfad | — | — | — | — | passed |
| probe-task-management-agent | 200 | 61b87397-c161-48ee-87b9-e6ec5f971445 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 61b87397-c161-48ee-87b9-e6ec5f971445 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | d6ee858c-3af5-4018-a874-a85d2ac4c466 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | d6ee858c-3af5-4018-a874-a85d2ac4c466 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | adc6db7b-7cd6-494c-a308-780b85f2fe4d | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | adc6db7b-7cd6-494c-a308-780b85f2fe4d | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 56394f3a-a61f-4d95-9b36-5b88e4604788 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 56394f3a-a61f-4d95-9b36-5b88e4604788 | — | — | — | — | passed |
| probe-automation-agent | 200 | eeb6896f-1936-4316-bb63-9aaa119691fd | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | eeb6896f-1936-4316-bb63-9aaa119691fd | — | — | — | — | passed |
| chief-route-recovery | 200 | 808d26ca-a005-43b0-9d66-2d2c7eba34f1 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 808d26ca-a005-43b0-9d66-2d2c7eba34f1 | — | — | — | — | passed |
| chief-route-task-management | 200 | 30b623f6-353b-452d-a190-b89e6f788ba1 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 30b623f6-353b-452d-a190-b89e6f788ba1 | — | — | — | — | passed |
| chief-route-reflection | 200 | ca651416-4081-4665-9bad-4b8fa3c4b20e | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | ca651416-4081-4665-9bad-4b8fa3c4b20e | — | — | — | — | passed |
| debug-state-insight | 200 | a289430d-4cb8-40ed-b5cc-8057de622185 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | a289430d-4cb8-40ed-b5cc-8057de622185 | — | — | — | — | passed |
| debug-task-management | 200 | c11dfce8-0606-4c64-b3c7-eb2c4d4884ee | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | c11dfce8-0606-4c64-b3c7-eb2c4d4884ee | — | — | — | — | passed |
| debug-progress-feedback | 200 | 8473c7f4-21e8-4847-aaf2-68014103ada9 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 8473c7f4-21e8-4847-aaf2-68014103ada9 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | f5a68641-d0b6-434e-b831-287588c661aa | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | f5a68641-d0b6-434e-b831-287588c661aa | — | — | — | — | passed |
| debug-reflection | 200 | 4ddec253-16a6-4250-aa6b-b555828ffe31 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 4ddec253-16a6-4250-aa6b-b555828ffe31 | — | — | — | — | passed |
| debug-automation | 200 | 421aee9d-6a6c-4641-a007-ffd465dd34e4 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 421aee9d-6a6c-4641-a007-ffd465dd34e4 | — | — | — | — | passed |

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | e3cb02f0-0a29-4253-b896-dbeca0d71886 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | c727ff05-8c1b-4aef-ad5b-ff0dd6ed7e74 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | a13d2259-0bf0-4efc-87f9-05b384f4dade | — | — | — | — | passed |
| probe-chief-agent | 200 | 2e89a3b7-cab1-40ce-9003-6a7a1dcd5f0d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 2e89a3b7-cab1-40ce-9003-6a7a1dcd5f0d | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 6bd2f301-60a4-4725-bd5a-791f40545fae | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 6bd2f301-60a4-4725-bd5a-791f40545fae | — | — | — | — | passed |
| probe-task-management-agent | 200 | 104391f0-a790-4be6-aa30-cce73375a739 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 104391f0-a790-4be6-aa30-cce73375a739 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 992c19fe-c278-4860-8502-e98b8add221b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 992c19fe-c278-4860-8502-e98b8add221b | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | c97ab433-0958-4635-b28d-8fb6463f0975 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | c97ab433-0958-4635-b28d-8fb6463f0975 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 1accc923-dfd0-4bec-a5e8-2c25de770187 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 1accc923-dfd0-4bec-a5e8-2c25de770187 | — | — | — | — | passed |
| probe-automation-agent | 200 | 624fb0d3-cd2f-44db-9cb3-0a7777e80fb1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 624fb0d3-cd2f-44db-9cb3-0a7777e80fb1 | — | — | — | — | passed |
| chief-route-recovery | 200 | d11aaa39-70a2-4be9-903c-61913a88da26 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | d11aaa39-70a2-4be9-903c-61913a88da26 | — | — | — | — | passed |
| chief-route-task-management | 200 | 24311e54-3e79-4c54-a6db-b0e96d6e961f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 24311e54-3e79-4c54-a6db-b0e96d6e961f | — | — | — | — | passed |
| chief-route-reflection | 200 | 06d234a0-6882-4b6a-bc90-e56014875be9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 06d234a0-6882-4b6a-bc90-e56014875be9 | — | — | — | — | passed |
| debug-state-insight | 200 | 68469d29-2e5f-462b-af6d-98cc422acd94 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 68469d29-2e5f-462b-af6d-98cc422acd94 | — | — | — | — | passed |
| debug-task-management | 200 | 462d8cfb-1c08-486e-b376-56cdabb2f480 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 462d8cfb-1c08-486e-b376-56cdabb2f480 | — | — | — | — | passed |
| debug-progress-feedback | 200 | eb7c1070-22a9-4122-8e42-f2af45b531d2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | eb7c1070-22a9-4122-8e42-f2af45b531d2 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 1692c65e-0532-4638-82d3-5c4f3360a28a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 1692c65e-0532-4638-82d3-5c4f3360a28a | — | — | — | — | passed |
| debug-reflection | 200 | 9b68603b-acfc-4f11-b5d9-a04fdfb121d5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 9b68603b-acfc-4f11-b5d9-a04fdfb121d5 | — | — | — | — | passed |
| debug-automation | 200 | d7b96dd7-5411-44b0-a440-adf22d803719 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | d7b96dd7-5411-44b0-a440-adf22d803719 | — | — | — | — | passed |

