# Core Phase Test Report

- Started: `2026-04-21T02:44:54.965Z`
- Completed: `2026-04-21T02:46:46.409Z`
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

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-44-47-061Z/report.live.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-44-47-061Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-44-47-061Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 5ac8291f-c4b1-4135-bddb-6c47e461e5a4 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 0ad0147d-ec07-423c-85e4-497ab25f6f78 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | a77f9db8-7f8e-4845-9e49-b96bf6418ff6 | — | — | — | — | passed |
| chief-route-recovery | 200 | 7b7ff373-2e73-443b-8e9c-2ee6a6572955 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 7b7ff373-2e73-443b-8e9c-2ee6a6572955 | — | — | — | — | passed |
| chief-route-task-management | 200 | 52eaba83-8935-4bf9-aedf-70f1150da176 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 52eaba83-8935-4bf9-aedf-70f1150da176 | — | — | — | — | passed |
| chief-route-reflection | 200 | e60fa9ca-ca71-4fb4-bbc9-88229b443dd5 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | e60fa9ca-ca71-4fb4-bbc9-88229b443dd5 | — | — | — | — | passed |
| debug-state-insight | 200 | 4bc02948-632e-4752-ab86-3e7186b8cbb1 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 4bc02948-632e-4752-ab86-3e7186b8cbb1 | — | — | — | — | passed |
| debug-task-management | 200 | 128d162f-3699-4e73-af08-464ea64cc472 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 128d162f-3699-4e73-af08-464ea64cc472 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 555916ca-8d53-49e1-9d60-5ae9612042d9 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 555916ca-8d53-49e1-9d60-5ae9612042d9 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 1231c876-6b64-4b81-86c6-21681fa6a15a | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 1231c876-6b64-4b81-86c6-21681fa6a15a | — | — | — | — | passed |
| debug-reflection | 200 | 89b9b0cc-500b-4c32-9d28-b6d318e35dbb | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 89b9b0cc-500b-4c32-9d28-b6d318e35dbb | — | — | — | — | passed |
| debug-automation | 200 | fb4ffc1f-fef0-4658-8b7b-560861675088 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | fb4ffc1f-fef0-4658-8b7b-560861675088 | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | b9506a34-f781-4f06-9acf-3a3f3a87eced | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | cd308ff8-c12a-4752-bc22-6f3bb8e2c231 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 2f1e47d0-048f-4280-9f78-a099e48acf73 | — | — | — | — | passed |
| probe-chief-agent | 200 | 7687c1e9-393f-4c1d-b5c8-5b72b68eaa9e | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 7687c1e9-393f-4c1d-b5c8-5b72b68eaa9e | — | — | — | — | passed |
| probe-state-insight-agent | 200 | e0f6de6d-54ee-4cb9-a89e-82782a155a78 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | e0f6de6d-54ee-4cb9-a89e-82782a155a78 | — | — | — | — | passed |
| probe-task-management-agent | 200 | ee2e8996-6b75-429c-9fbc-d0f39e47fe3d | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | ee2e8996-6b75-429c-9fbc-d0f39e47fe3d | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 34a5acaa-a613-47f2-961b-a63d7d3b7c41 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 34a5acaa-a613-47f2-961b-a63d7d3b7c41 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 104139e6-7423-4914-a9c8-b06c4cb56247 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 104139e6-7423-4914-a9c8-b06c4cb56247 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | bb5ba99b-6a78-4244-8846-5fe41b80f70f | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | bb5ba99b-6a78-4244-8846-5fe41b80f70f | — | — | — | — | passed |
| probe-automation-agent | 200 | b0422bfa-ad94-4d3d-ba88-bb2eaf583605 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | b0422bfa-ad94-4d3d-ba88-bb2eaf583605 | — | — | — | — | passed |
| chief-route-recovery | 200 | c7aae479-037e-497d-b72c-2182248da454 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | c7aae479-037e-497d-b72c-2182248da454 | — | — | — | — | passed |
| chief-route-task-management | 200 | 62ab2e2c-50ec-49c0-9017-80bf1884a5fa | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 62ab2e2c-50ec-49c0-9017-80bf1884a5fa | — | — | — | — | passed |
| chief-route-reflection | 200 | 085b26ae-4800-4ad9-90f0-efc0888c7d95 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 085b26ae-4800-4ad9-90f0-efc0888c7d95 | — | — | — | — | passed |
| debug-state-insight | 200 | b13183f4-e3d4-4c02-a14d-0ce7b5aaf8c9 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | b13183f4-e3d4-4c02-a14d-0ce7b5aaf8c9 | — | — | — | — | passed |
| debug-task-management | 200 | c2d84caa-12a4-4ab2-bb90-611780d16673 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | c2d84caa-12a4-4ab2-bb90-611780d16673 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 2703eb09-4bd0-4096-adab-6571a21e889a | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 2703eb09-4bd0-4096-adab-6571a21e889a | — | — | — | — | passed |
| debug-interruption-recovery | 200 | a777f14d-39f6-49c9-bee3-8ec1e7c0c0d8 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | a777f14d-39f6-49c9-bee3-8ec1e7c0c0d8 | — | — | — | — | passed |
| debug-reflection | 200 | 0ef8e074-324f-4f6d-a78d-01f3b7414627 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 0ef8e074-324f-4f6d-a78d-01f3b7414627 | — | — | — | — | passed |
| debug-automation | 200 | 8a60fbc1-11f4-4b88-98d6-78b6e5d083e8 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 8a60fbc1-11f4-4b88-98d6-78b6e5d083e8 | — | — | — | — | passed |

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 5633d5ed-4abc-43d1-937f-072ec4a75d20 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | f964f264-0aa0-430d-b7c9-d0b76d8ddf68 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 1e6e6564-4846-4db4-bca2-f5df077a0ed0 | — | — | — | — | passed |
| probe-chief-agent | 200 | 43de86d7-2eca-42d6-af14-1d4daf4fc2ab | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 43de86d7-2eca-42d6-af14-1d4daf4fc2ab | — | — | — | — | passed |
| probe-state-insight-agent | 200 | af9a8dec-9168-486f-bfcf-8f650aadd1f2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | af9a8dec-9168-486f-bfcf-8f650aadd1f2 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 7691316f-be22-4bc6-b3e1-b7eb7fab2d16 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 7691316f-be22-4bc6-b3e1-b7eb7fab2d16 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 31ac7c30-f9e6-44b5-a12e-4ba8ee001c37 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 31ac7c30-f9e6-44b5-a12e-4ba8ee001c37 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | ff6f99fc-0a01-4c80-9715-ef93c0333fe7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | ff6f99fc-0a01-4c80-9715-ef93c0333fe7 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | fad028e0-a191-44da-8a6e-0cf107e86ce0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | fad028e0-a191-44da-8a6e-0cf107e86ce0 | — | — | — | — | passed |
| probe-automation-agent | 200 | 8bd1e66a-0b02-47b6-9820-224b2c7dc34b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 8bd1e66a-0b02-47b6-9820-224b2c7dc34b | — | — | — | — | passed |
| chief-route-recovery | 200 | ed5c4606-4855-416e-af46-ffb17594858a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | ed5c4606-4855-416e-af46-ffb17594858a | — | — | — | — | passed |
| chief-route-task-management | 200 | 96d952ac-31e4-4212-8448-2864c9508058 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 96d952ac-31e4-4212-8448-2864c9508058 | — | — | — | — | passed |
| chief-route-reflection | 200 | 4369e5af-0b8b-422f-8a28-ffb9fda0a668 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 4369e5af-0b8b-422f-8a28-ffb9fda0a668 | — | — | — | — | passed |
| debug-state-insight | 200 | 6a121052-a1c4-4efb-b9cc-78127d96f451 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 6a121052-a1c4-4efb-b9cc-78127d96f451 | — | — | — | — | passed |
| debug-task-management | 200 | 3c3116f8-af67-4655-b3e5-c5e8c8c5fce4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 3c3116f8-af67-4655-b3e5-c5e8c8c5fce4 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 0c6e1fb9-115e-4a73-b64c-fbaf06de1dc1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 0c6e1fb9-115e-4a73-b64c-fbaf06de1dc1 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 8c40978e-c872-4eb3-80a7-f256a9d19729 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 8c40978e-c872-4eb3-80a7-f256a9d19729 | — | — | — | — | passed |
| debug-reflection | 200 | 91504ab3-40c8-44b1-9579-0a21fc9ddb63 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 91504ab3-40c8-44b1-9579-0a21fc9ddb63 | — | — | — | — | passed |
| debug-automation | 200 | f548766c-d0ea-4c48-a73f-063ff8da1ed3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | f548766c-d0ea-4c48-a73f-063ff8da1ed3 | — | — | — | — | passed |

