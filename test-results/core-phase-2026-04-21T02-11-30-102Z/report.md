# Core Phase Test Report

- Started: `2026-04-21T02:11:38.177Z`
- Completed: `2026-04-21T02:13:29.008Z`
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

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-11-30-102Z/report.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-11-30-102Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-11-30-102Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | cd294f57-c516-4e8e-857d-646f1e7d7e67 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 26518e7e-733b-43bb-b18d-f56af4609da6 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 204e89a8-d62b-45d7-a9e9-77f00e5f7be0 | — | — | — | — | passed |
| chief-route-recovery | 200 | 54589b27-451c-4dbe-8624-694f005189e2 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 54589b27-451c-4dbe-8624-694f005189e2 | — | — | — | — | passed |
| chief-route-task-management | 200 | 9a4a41f4-df71-44b5-910e-91e2922019a1 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 9a4a41f4-df71-44b5-910e-91e2922019a1 | — | — | — | — | passed |
| chief-route-reflection | 200 | 2bbcf980-1726-4a40-9edb-bf5032b5f881 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 2bbcf980-1726-4a40-9edb-bf5032b5f881 | — | — | — | — | passed |
| debug-state-insight | 200 | 885f35a7-e5aa-4191-afa7-b7ed1006a969 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 885f35a7-e5aa-4191-afa7-b7ed1006a969 | — | — | — | — | passed |
| debug-task-management | 200 | 0d40d9de-49e6-4b54-b2d9-0df227e1f4ee | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 0d40d9de-49e6-4b54-b2d9-0df227e1f4ee | — | — | — | — | passed |
| debug-progress-feedback | 200 | 30057f14-c974-4df8-980a-77be4c52e722 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 30057f14-c974-4df8-980a-77be4c52e722 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | e1da1b83-3bb0-4d28-a765-2f85fbcc1e70 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | e1da1b83-3bb0-4d28-a765-2f85fbcc1e70 | — | — | — | — | passed |
| debug-reflection | 200 | 2df92a7b-26a0-42df-adbd-565bf870adfe | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 2df92a7b-26a0-42df-adbd-565bf870adfe | — | — | — | — | passed |
| debug-automation | 200 | 25957f62-54c0-432b-8a5f-0c4d39d9a95a | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 25957f62-54c0-432b-8a5f-0c4d39d9a95a | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 8956217c-4241-4b44-88f4-539552783f40 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | cf7b702f-411b-42e9-be33-594a2265be8a | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 23f061ac-2205-4cde-9756-6a56f8a1e4b4 | — | — | — | — | passed |
| probe-chief-agent | 200 | 922319b1-71f6-482e-b024-6f423d0c4338 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 922319b1-71f6-482e-b024-6f423d0c4338 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | a279304a-ea1f-4cd8-8445-8fa501c82a0f | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | a279304a-ea1f-4cd8-8445-8fa501c82a0f | — | — | — | — | passed |
| probe-task-management-agent | 200 | 6e792644-bf10-41bc-877a-91df3ab91f76 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 6e792644-bf10-41bc-877a-91df3ab91f76 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 2ccd68ea-f13f-4901-b4d1-317e52d2486d | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 2ccd68ea-f13f-4901-b4d1-317e52d2486d | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 9cf140a6-a8ec-45da-9bc0-65a3c53f4717 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 9cf140a6-a8ec-45da-9bc0-65a3c53f4717 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | c164a8f3-a8cd-4a92-bd2a-75adc9381712 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | c164a8f3-a8cd-4a92-bd2a-75adc9381712 | — | — | — | — | passed |
| probe-automation-agent | 200 | 414b3526-4559-4120-8996-6631492996c5 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 414b3526-4559-4120-8996-6631492996c5 | — | — | — | — | passed |
| chief-route-recovery | 200 | 50bb2efb-6fc8-438e-9999-25db9a908b03 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 50bb2efb-6fc8-438e-9999-25db9a908b03 | — | — | — | — | passed |
| chief-route-task-management | 200 | 189211c3-3914-443c-b807-6045ea48eb4f | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 189211c3-3914-443c-b807-6045ea48eb4f | — | — | — | — | passed |
| chief-route-reflection | 200 | 01826772-0f79-4163-aede-8d5c17fd61ae | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 01826772-0f79-4163-aede-8d5c17fd61ae | — | — | — | — | passed |
| debug-state-insight | 200 | e1bcbf9a-f311-4b25-9e98-4c48e23a9c3d | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | e1bcbf9a-f311-4b25-9e98-4c48e23a9c3d | — | — | — | — | passed |
| debug-task-management | 200 | badf6dbc-eda1-43ec-8fbf-6cf1430eb7ad | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | badf6dbc-eda1-43ec-8fbf-6cf1430eb7ad | — | — | — | — | passed |
| debug-progress-feedback | 200 | ca44c56f-3554-4693-973c-a74aac9a7a1b | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | ca44c56f-3554-4693-973c-a74aac9a7a1b | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 0ea65e15-a82d-486b-b67d-1f73ade8ab71 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 0ea65e15-a82d-486b-b67d-1f73ade8ab71 | — | — | — | — | passed |
| debug-reflection | 200 | 2ca828ec-268d-472e-8155-94603186a480 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 2ca828ec-268d-472e-8155-94603186a480 | — | — | — | — | passed |
| debug-automation | 200 | 584b1cbc-86ae-483a-91d7-a2877975362f | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 584b1cbc-86ae-483a-91d7-a2877975362f | — | — | — | — | passed |

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | b6dfa871-e3ce-4c9c-96e5-a7bdb03c110a | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 666975d6-7524-4d36-80f8-e4f8c2aedad7 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 1b029e62-b626-4d61-a63a-f395379d5f32 | — | — | — | — | passed |
| probe-chief-agent | 200 | 5366138d-40e3-40f9-b781-3965691ff4fd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 5366138d-40e3-40f9-b781-3965691ff4fd | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 65556b33-415d-4db3-a6fc-80fcb0ff10ec | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 65556b33-415d-4db3-a6fc-80fcb0ff10ec | — | — | — | — | passed |
| probe-task-management-agent | 200 | f108cd75-fa6f-49f9-85d0-c767137ef45f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | f108cd75-fa6f-49f9-85d0-c767137ef45f | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 3e9e0357-0e4b-4107-97ae-246320d4b638 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 3e9e0357-0e4b-4107-97ae-246320d4b638 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 63254b89-7493-4df2-b042-fca542b44705 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 63254b89-7493-4df2-b042-fca542b44705 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 51e1b9b7-f6ee-48c4-88ba-db1b67cc1e7d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 51e1b9b7-f6ee-48c4-88ba-db1b67cc1e7d | — | — | — | — | passed |
| probe-automation-agent | 200 | d30719bb-51c9-47ee-a330-f1ed3aa9e83d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | d30719bb-51c9-47ee-a330-f1ed3aa9e83d | — | — | — | — | passed |
| chief-route-recovery | 200 | d3bdd844-f978-4ba5-a2d5-0743f1ba9bae | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | d3bdd844-f978-4ba5-a2d5-0743f1ba9bae | — | — | — | — | passed |
| chief-route-task-management | 200 | c3ba7eef-5f1e-4235-a1ac-4c0cc40039cf | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | c3ba7eef-5f1e-4235-a1ac-4c0cc40039cf | — | — | — | — | passed |
| chief-route-reflection | 200 | 07e869a3-dcc5-4e0c-9f3d-58f9165e0283 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 07e869a3-dcc5-4e0c-9f3d-58f9165e0283 | — | — | — | — | passed |
| debug-state-insight | 200 | f22120a7-eba7-4624-b8e5-c44282a36378 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | f22120a7-eba7-4624-b8e5-c44282a36378 | — | — | — | — | passed |
| debug-task-management | 200 | d621111f-89fb-4b19-a08e-10debf8e6354 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | d621111f-89fb-4b19-a08e-10debf8e6354 | — | — | — | — | passed |
| debug-progress-feedback | 200 | bb97c36d-c0a9-48c4-bac2-e13e130d76b9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | bb97c36d-c0a9-48c4-bac2-e13e130d76b9 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | b4f7b01f-4755-4765-8730-42befa14abee | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | b4f7b01f-4755-4765-8730-42befa14abee | — | — | — | — | passed |
| debug-reflection | 200 | d13baafe-71bb-47c7-8389-98bcc18b33ba | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | d13baafe-71bb-47c7-8389-98bcc18b33ba | — | — | — | — | passed |
| debug-automation | 200 | 6916066b-219d-4044-aa51-a5adbc3703d3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 6916066b-219d-4044-aa51-a5adbc3703d3 | — | — | — | — | passed |

