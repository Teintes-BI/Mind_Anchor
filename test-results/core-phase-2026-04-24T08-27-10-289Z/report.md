# Core Phase Test Report

- Started: `2026-04-24T08:27:15.796Z`
- Completed: `2026-04-24T08:28:59.913Z`
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

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-24T08-27-10-289Z/report.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-24T08-27-10-289Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-24T08-27-10-289Z/responses`

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 90acf993-eae4-4b35-93f0-f68f0aa00c37 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 59b4a659-b466-483c-9fc3-ae0dffd44dee | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 58c75e0f-1e08-46b0-abc2-e1a86b7c3fcb | — | — | — | — | passed |
| probe-chief-agent | 200 | ae13a4cf-3ba5-4c0f-a77b-9e5c7c741b29 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | ae13a4cf-3ba5-4c0f-a77b-9e5c7c741b29 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | ec8bbf85-c2ad-4183-a86f-6347a3b49a69 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | ec8bbf85-c2ad-4183-a86f-6347a3b49a69 | — | — | — | — | passed |
| probe-task-management-agent | 200 | eebb89e7-7194-4437-bacc-265c3f38dc35 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | eebb89e7-7194-4437-bacc-265c3f38dc35 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 7a01b499-09d8-46bf-afc5-83768b335e4a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 7a01b499-09d8-46bf-afc5-83768b335e4a | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 3e4e3eed-8813-4f13-bfee-bf5f37949638 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 3e4e3eed-8813-4f13-bfee-bf5f37949638 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 92cf34d2-5dd8-44d3-8527-2fe1aaa5096b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 92cf34d2-5dd8-44d3-8527-2fe1aaa5096b | — | — | — | — | passed |
| probe-automation-agent | 200 | 191927d9-e4b1-4ad6-ab51-3db3d3346b31 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 191927d9-e4b1-4ad6-ab51-3db3d3346b31 | — | — | — | — | passed |
| chief-route-recovery | 200 | f1146e10-c6e9-4bba-9587-6b19364a4678 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | f1146e10-c6e9-4bba-9587-6b19364a4678 | — | — | — | — | passed |
| chief-route-task-management | 200 | 9dfb9553-3c0c-406a-bc85-3ea6e9e7e7f1 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 9dfb9553-3c0c-406a-bc85-3ea6e9e7e7f1 | — | — | — | — | passed |
| chief-route-reflection | 200 | 5903b79b-03fc-488c-992f-f4ef16fbfb4c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 5903b79b-03fc-488c-992f-f4ef16fbfb4c | — | — | — | — | passed |
| debug-state-insight | 200 | fff27d9e-e196-4e8e-a4b0-ab16a9347ebb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | fff27d9e-e196-4e8e-a4b0-ab16a9347ebb | — | — | — | — | passed |
| debug-task-management | 200 | 3cb9a8a7-db53-42cf-bf14-7b8d4c5bf1f9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 3cb9a8a7-db53-42cf-bf14-7b8d4c5bf1f9 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 3cbfadf3-b9a4-48ae-b73a-8c57a8327720 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 3cbfadf3-b9a4-48ae-b73a-8c57a8327720 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 8ba45d96-19ce-4974-8acd-d2143c3d2fee | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 8ba45d96-19ce-4974-8acd-d2143c3d2fee | — | — | — | — | passed |
| debug-reflection | 200 | 6b384708-8b2d-4c43-a23a-bb825c326b22 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 6b384708-8b2d-4c43-a23a-bb825c326b22 | — | — | — | — | passed |
| debug-automation | 200 | f2a5008e-d7c6-48c9-a0c9-f41bcee65656 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | f2a5008e-d7c6-48c9-a0c9-f41bcee65656 | — | — | — | — | passed |

