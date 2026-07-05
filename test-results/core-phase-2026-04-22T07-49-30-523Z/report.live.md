# Core Phase Test Report

- Started: `2026-04-22T07:49:37.694Z`
- Completed: `2026-04-22T07:51:26.448Z`
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

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-49-30-523Z/report.live.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-49-30-523Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-22T07-49-30-523Z/responses`

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 2986c53f-79ba-48e3-ba9f-1603a661c914 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | bc2baadc-b649-41a9-91f2-e72c7b92da9b | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 9e00c85e-7128-456d-9e33-597a82c19e9a | — | — | — | — | passed |
| probe-chief-agent | 200 | 20f6a690-b7b8-430a-97b5-cedaeced6d1f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 20f6a690-b7b8-430a-97b5-cedaeced6d1f | — | — | — | — | passed |
| probe-state-insight-agent | 200 | f51c0e7b-b7a7-4438-97cc-b8b459cec5bb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | f51c0e7b-b7a7-4438-97cc-b8b459cec5bb | — | — | — | — | passed |
| probe-task-management-agent | 200 | 0ed234e1-85b1-4fa9-b11e-f253679699c0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 0ed234e1-85b1-4fa9-b11e-f253679699c0 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 2edf516b-315d-4c2c-9d9a-2e124cda4f3a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 2edf516b-315d-4c2c-9d9a-2e124cda4f3a | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 12c76093-2bbc-4441-95b8-f1c3e498378e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 12c76093-2bbc-4441-95b8-f1c3e498378e | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 12030867-a4bd-4bad-81e7-781e944e3ad3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 12030867-a4bd-4bad-81e7-781e944e3ad3 | — | — | — | — | passed |
| probe-automation-agent | 200 | 3af013e7-85e4-47ce-8d1b-56d3b501a596 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 3af013e7-85e4-47ce-8d1b-56d3b501a596 | — | — | — | — | passed |
| chief-route-recovery | 200 | 5237cac1-2997-4e59-ab36-ef9b7e8c189b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 5237cac1-2997-4e59-ab36-ef9b7e8c189b | — | — | — | — | passed |
| chief-route-task-management | 200 | 4f385b54-2e7d-4ef8-817f-44cec96828f0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 4f385b54-2e7d-4ef8-817f-44cec96828f0 | — | — | — | — | passed |
| chief-route-reflection | 200 | b5ac6c88-882e-416c-8b4e-36f21387c30a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | b5ac6c88-882e-416c-8b4e-36f21387c30a | — | — | — | — | passed |
| debug-state-insight | 200 | e56a9a7d-2312-4679-965c-7be0ea05ba2b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | e56a9a7d-2312-4679-965c-7be0ea05ba2b | — | — | — | — | passed |
| debug-task-management | 200 | 5b135d5e-2512-4d9c-891d-2e9b606630ac | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 5b135d5e-2512-4d9c-891d-2e9b606630ac | — | — | — | — | passed |
| debug-progress-feedback | 200 | 44eba0af-3813-4733-925f-a09a3520364b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 44eba0af-3813-4733-925f-a09a3520364b | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 601c91a1-8150-49f7-83ad-eae46dfe0d60 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 601c91a1-8150-49f7-83ad-eae46dfe0d60 | — | — | — | — | passed |
| debug-reflection | 200 | 99773f89-6e5f-4078-95f3-c27521721384 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 99773f89-6e5f-4078-95f3-c27521721384 | — | — | — | — | passed |
| debug-automation | 200 | 0494cb9b-5be0-425c-8eb0-2a2e508ea918 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 0494cb9b-5be0-425c-8eb0-2a2e508ea918 | — | — | — | — | passed |

