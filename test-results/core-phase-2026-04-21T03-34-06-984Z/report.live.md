# Core Phase Test Report

- Started: `2026-04-21T03:34:14.454Z`
- Completed: `2026-04-21T03:36:05.911Z`
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

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T03-34-06-984Z/report.live.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T03-34-06-984Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T03-34-06-984Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 28154a52-98b4-49dc-9dca-0b9cf3d4355f | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 941c8ec5-7a74-4606-8e6f-35ad178aa59e | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 1f6a2e73-8769-418c-89f8-2b9ae9b330d5 | — | — | — | — | passed |
| chief-route-recovery | 200 | 9e174bc2-3507-4138-94cc-e572bbe4c31c | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 9e174bc2-3507-4138-94cc-e572bbe4c31c | — | — | — | — | passed |
| chief-route-task-management | 200 | 72b455be-6788-4d3d-b0da-1b81a8300316 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 72b455be-6788-4d3d-b0da-1b81a8300316 | — | — | — | — | passed |
| chief-route-reflection | 200 | 6ee23efa-5c8a-46bc-a1ef-2ba4b9e9b4fe | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 6ee23efa-5c8a-46bc-a1ef-2ba4b9e9b4fe | — | — | — | — | passed |
| debug-state-insight | 200 | 3ef5bb55-f641-44ce-802e-e06e545e237c | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 3ef5bb55-f641-44ce-802e-e06e545e237c | — | — | — | — | passed |
| debug-task-management | 200 | 176145af-9773-4e5e-a3a0-61d2f9ceb510 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 176145af-9773-4e5e-a3a0-61d2f9ceb510 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 9660957f-86c9-48db-a36c-a819f3037506 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 9660957f-86c9-48db-a36c-a819f3037506 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 8b653ca3-1603-4b89-b247-9aa33a6f8f16 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 8b653ca3-1603-4b89-b247-9aa33a6f8f16 | — | — | — | — | passed |
| debug-reflection | 200 | 768c1375-d766-4679-8e7d-bb4f7fb9d2be | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 768c1375-d766-4679-8e7d-bb4f7fb9d2be | — | — | — | — | passed |
| debug-automation | 200 | 3a5d102a-edf1-42a0-af56-213aa6b23ee2 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 3a5d102a-edf1-42a0-af56-213aa6b23ee2 | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`未配置`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | f3a90d35-25b8-413c-8745-392fdadbfcac | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 68b986d2-ff63-4345-80c1-504d9952188e | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 53219551-7cd1-4bdf-8a20-774808420ad2 | — | — | — | — | passed |
| probe-chief-agent | 200 | 55807c4c-1527-4fcf-80d1-4efe48b89ec6 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 55807c4c-1527-4fcf-80d1-4efe48b89ec6 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 12c69075-22aa-4915-920e-93ae1509ecc5 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 12c69075-22aa-4915-920e-93ae1509ecc5 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 03dfb187-7001-4590-b265-b69389a27f08 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 03dfb187-7001-4590-b265-b69389a27f08 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 4564f37e-2ec8-4a62-8548-00a61c5ac2a7 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 4564f37e-2ec8-4a62-8548-00a61c5ac2a7 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 8565a42c-6b3f-4137-a22a-2f06d0a89c67 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 8565a42c-6b3f-4137-a22a-2f06d0a89c67 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | c95320c7-9f3e-42b4-8f7c-469cbfc23595 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | c95320c7-9f3e-42b4-8f7c-469cbfc23595 | — | — | — | — | passed |
| probe-automation-agent | 200 | 9f6415ca-b63e-4277-9c68-10fda953a64b | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 9f6415ca-b63e-4277-9c68-10fda953a64b | — | — | — | — | passed |
| chief-route-recovery | 200 | 900fc2e8-997c-4418-a3e3-2f78bf536033 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 900fc2e8-997c-4418-a3e3-2f78bf536033 | — | — | — | — | passed |
| chief-route-task-management | 200 | 14168eac-5b00-43e0-9801-a90c5a9b0e90 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 14168eac-5b00-43e0-9801-a90c5a9b0e90 | — | — | — | — | passed |
| chief-route-reflection | 200 | 15b1cd69-5716-4028-b55a-98164ed21b6e | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 15b1cd69-5716-4028-b55a-98164ed21b6e | — | — | — | — | passed |
| debug-state-insight | 200 | 7d4173a4-581d-44a3-b52c-a914b115b489 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 7d4173a4-581d-44a3-b52c-a914b115b489 | — | — | — | — | passed |
| debug-task-management | 200 | 0abe141e-3f66-4194-b5ec-9257c4ef55b0 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 0abe141e-3f66-4194-b5ec-9257c4ef55b0 | — | — | — | — | passed |
| debug-progress-feedback | 200 | af45ac8b-8d13-44a7-b3c5-b68797d6ccd7 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | af45ac8b-8d13-44a7-b3c5-b68797d6ccd7 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | f21d85dd-cb43-4654-b620-dea3dc1d1723 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | f21d85dd-cb43-4654-b620-dea3dc1d1723 | — | — | — | — | passed |
| debug-reflection | 200 | c82ccabd-0f5b-4fe3-8054-54bd618bc9a3 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | c82ccabd-0f5b-4fe3-8054-54bd618bc9a3 | — | — | — | — | passed |
| debug-automation | 200 | 388318fc-69cc-4447-905b-fb7b992174fe | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 388318fc-69cc-4447-905b-fb7b992174fe | — | — | — | — | passed |

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 3f2348f3-39fc-4a55-a0c9-498c274da810 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | b0151ab1-1b41-496d-8f0e-38c9ddb9fa77 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | fecffd73-4d12-489e-981e-5706bb597062 | — | — | — | — | passed |
| probe-chief-agent | 200 | 86bc1a8b-a3bf-48a4-99e0-015a36be5224 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 86bc1a8b-a3bf-48a4-99e0-015a36be5224 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 6ff65c60-7297-41bc-8717-c8c850c5d581 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 6ff65c60-7297-41bc-8717-c8c850c5d581 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 4e790076-0319-4f4a-9111-32bf93ef0800 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 4e790076-0319-4f4a-9111-32bf93ef0800 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 7102317a-b433-4ddf-b6c4-42c2dcafb7e4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 7102317a-b433-4ddf-b6c4-42c2dcafb7e4 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 3767544c-3def-41c0-a42c-3eb433bcc60c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 3767544c-3def-41c0-a42c-3eb433bcc60c | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 5df5ca28-9721-4e63-9a06-cfbcf50cc927 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 5df5ca28-9721-4e63-9a06-cfbcf50cc927 | — | — | — | — | passed |
| probe-automation-agent | 200 | a9a51438-f549-4462-81f7-47028f7f8604 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | a9a51438-f549-4462-81f7-47028f7f8604 | — | — | — | — | passed |
| chief-route-recovery | 200 | 844a36ce-00df-4983-918a-24460b8a7ad9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 844a36ce-00df-4983-918a-24460b8a7ad9 | — | — | — | — | passed |
| chief-route-task-management | 200 | 26c28ab9-2521-4ddd-a746-b1a7613633a8 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 26c28ab9-2521-4ddd-a746-b1a7613633a8 | — | — | — | — | passed |
| chief-route-reflection | 200 | 223b00d1-7398-4692-8258-c2aa0222c996 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 223b00d1-7398-4692-8258-c2aa0222c996 | — | — | — | — | passed |
| debug-state-insight | 200 | 62bfde72-3212-47ee-ad8b-42c34d167358 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 62bfde72-3212-47ee-ad8b-42c34d167358 | — | — | — | — | passed |
| debug-task-management | 200 | 29dee947-5540-4e6e-8488-01b27af982e9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 29dee947-5540-4e6e-8488-01b27af982e9 | — | — | — | — | passed |
| debug-progress-feedback | 200 | fa4d722c-64d2-44da-8f58-1a4c073b7734 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | fa4d722c-64d2-44da-8f58-1a4c073b7734 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | a6296873-79d8-4744-8448-cecc65d824da | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | a6296873-79d8-4744-8448-cecc65d824da | — | — | — | — | passed |
| debug-reflection | 200 | 31d9f751-8d8c-4f9a-ab0a-0e11f06b1865 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 31d9f751-8d8c-4f9a-ab0a-0e11f06b1865 | — | — | — | — | passed |
| debug-automation | 200 | e7efcbe1-93ef-4f99-a2e7-ac3ce749308b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | e7efcbe1-93ef-4f99-a2e7-ac3ce749308b | — | — | — | — | passed |

