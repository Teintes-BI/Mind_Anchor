# Core Phase Test Report

- Started: `2026-04-21T02:15:38.431Z`
- Completed: `2026-04-21T02:17:22.105Z`
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

- JSON report: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-15-31-162Z/report.live.json`
- Logs: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-15-31-162Z/logs`
- Responses: `/Volumes/固态/Mac迁移_20260420_v3/home/mindanchor/test-results/core-phase-2026-04-21T02-15-31-162Z/responses`

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Failure categories：无


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| seed-focus-recovery-loop | 200 | 33b466ba-4d00-4edd-89d7-a75706ef91ab | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 10945ba6-27fa-4807-b472-a667979dff54 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | ca9ebe82-a5c9-4abd-9521-cf98a97c40e7 | — | — | — | — | passed |
| probe-chief-agent | 200 | 9b58bf21-683f-4bc9-9576-9b80f4555501 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 9b58bf21-683f-4bc9-9576-9b80f4555501 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 6eba0240-67da-4059-bb3c-2443ee4e99d3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 6eba0240-67da-4059-bb3c-2443ee4e99d3 | — | — | — | — | passed |
| probe-task-management-agent | 200 | cd363b85-39c5-4ad3-a81e-23a26395ac9e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | cd363b85-39c5-4ad3-a81e-23a26395ac9e | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 6dea6521-e76f-41cc-bc3b-52ae65ec5f20 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 6dea6521-e76f-41cc-bc3b-52ae65ec5f20 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 917dba1c-ff9d-43d4-9503-dcf719c7063c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 917dba1c-ff9d-43d4-9503-dcf719c7063c | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 1a79d24a-3ccb-4ec0-8db7-1e7fcefc153d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 1a79d24a-3ccb-4ec0-8db7-1e7fcefc153d | — | — | — | — | passed |
| probe-automation-agent | 200 | 7aa81039-38d8-467d-a666-d058be13f26a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 7aa81039-38d8-467d-a666-d058be13f26a | — | — | — | — | passed |
| chief-route-recovery | 200 | 50f71014-5376-4d40-b030-0102f7dd833f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 50f71014-5376-4d40-b030-0102f7dd833f | — | — | — | — | passed |
| chief-route-task-management | 200 | c48c3fe7-b614-46e7-9f2c-71bf5ce1f7fe | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | c48c3fe7-b614-46e7-9f2c-71bf5ce1f7fe | — | — | — | — | passed |
| chief-route-reflection | 200 | 39269519-4754-428c-b3e8-9db8caf11c8c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 39269519-4754-428c-b3e8-9db8caf11c8c | — | — | — | — | passed |
| debug-state-insight | 200 | 262423f5-fcc5-4e25-87e4-c1a3ea993b8e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 262423f5-fcc5-4e25-87e4-c1a3ea993b8e | — | — | — | — | passed |
| debug-task-management | 200 | e9a25040-2881-4573-a65a-1d7c7a6c97ca | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | e9a25040-2881-4573-a65a-1d7c7a6c97ca | — | — | — | — | passed |
| debug-progress-feedback | 200 | 9966a7a1-0fb2-4efe-b06c-ba463f52fbe7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 9966a7a1-0fb2-4efe-b06c-ba463f52fbe7 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | c979b4e5-9fe2-420a-9da5-1171f625cfed | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | c979b4e5-9fe2-420a-9da5-1171f625cfed | — | — | — | — | passed |
| debug-reflection | 200 | 79901cf0-4ba2-4457-b7a3-d9f3e6d9eb0f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 79901cf0-4ba2-4457-b7a3-d9f3e6d9eb0f | — | — | — | — | passed |
| debug-automation | 200 | d0d5dac6-364c-4e24-aec4-7c3c15437cfa | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | d0d5dac6-364c-4e24-aec4-7c3c15437cfa | — | — | — | — | passed |

