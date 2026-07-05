# Core Phase Test Report

- Started: `2026-03-09T15:50:05.767Z`
- Completed: `2026-03-09T16:06:42.619Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | failed | stub | — | 53/54 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 6/7 |
| Phase 3 Cluster Preferred | failed | openai-compatible | http://127.0.0.1:8788 | 73/73 |

## Failures

- [stub] full-regression: fetch failed
- [stub] stub-phase: fetch failed
- [provider-direct] bootstrap-demo-user: This operation was aborted
- [provider-direct] provider-direct-phase: This operation was aborted
- [cluster-preferred] cluster-preferred-phase: Cluster phase expected route=cluster, but debug-scenarios used unknown.

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T15-50-05-766Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T15-50-05-766Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T15-50-05-766Z/responses`

## Phase 1 Stub Baseline

- 状态：`failed`
- Agent mode：`stub`
- OpenClaw Base URL：`未配置`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| bootstrap-demo-user | 200 | — | — | — | — | — | passed |
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| web-dashboard-summary | 200 | — | — | — | — | — | passed |
| web-goalflow-overview | 200 | — | — | — | — | — | passed |
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | fa313b0e-ab35-4b1b-9c1a-e1f0f4368060 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | b28ecafc-2a3c-49c6-b15f-79842e69f247 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 0ca00313-44c3-499d-bd89-bd00f0be632e | — | — | — | — | passed |
| chief-route-recovery | 200 | 294dbd4d-3bdc-4a3a-be80-a838cf689f0c | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 294dbd4d-3bdc-4a3a-be80-a838cf689f0c | — | — | — | — | passed |
| chief-route-task-management | 200 | a7398613-d5e7-49ba-ab19-065c0def9277 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | a7398613-d5e7-49ba-ab19-065c0def9277 | — | — | — | — | passed |
| chief-route-reflection | 200 | 87de703b-a778-441c-8cd8-262a96c733b5 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 87de703b-a778-441c-8cd8-262a96c733b5 | — | — | — | — | passed |
| debug-state-insight | 200 | cb6bfaa0-9067-486e-8e0f-bed480bdb334 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | cb6bfaa0-9067-486e-8e0f-bed480bdb334 | — | — | — | — | passed |
| debug-task-management | 200 | 463791da-cb21-473f-8efc-55d7f44e49ce | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 463791da-cb21-473f-8efc-55d7f44e49ce | — | — | — | — | passed |
| debug-progress-feedback | 200 | 31a9c8e9-e11e-472d-9614-9d44b992dccd | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 31a9c8e9-e11e-472d-9614-9d44b992dccd | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 171af5ab-fb7d-4b1f-83ec-54e4cf5fe7e4 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 171af5ab-fb7d-4b1f-83ec-54e4cf5fe7e4 | — | — | — | — | passed |
| debug-reflection | 200 | 53105d31-7af2-4fb3-a505-62b79bfaaa09 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 53105d31-7af2-4fb3-a505-62b79bfaaa09 | — | — | — | — | passed |
| debug-automation | 200 | 6d7b647c-12fa-45de-ac08-97ebd7da08d7 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 6d7b647c-12fa-45de-ac08-97ebd7da08d7 | — | — | — | — | passed |
| business-create-goal | 201 | — | — | — | — | — | passed |
| business-create-task | 201 | — | — | — | — | — | passed |
| business-start-session | 201 | — | — | — | — | — | passed |
| business-signal-batch | 200 | — | — | — | — | — | passed |
| business-state-latest | 200 | — | — | — | — | — | passed |
| business-end-session | 200 | — | — | — | — | — | passed |
| business-inbox | 200 | — | — | — | — | — | passed |
| business-dashboard-summary | 200 | — | — | — | — | — | passed |
| business-reflections-latest | 200 | — | — | — | — | — | passed |
| business-inbox-ack | 200 | — | — | — | — | — | passed |
| reflection-latest-weekly | 200 | — | — | — | — | — | passed |
| reflection-latest-monthly | 200 | — | — | — | — | — | passed |
| full-regression | ERR | — | — | — | — | — | fetch failed |

## Phase 2 Provider Direct

- 状态：`failed`
- Agent mode：`openai-compatible`
- OpenClaw Base URL：`未配置`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| bootstrap-demo-user | ERR | — | — | — | — | — | This operation was aborted |

## Phase 3 Cluster Preferred

- 状态：`failed`
- Agent mode：`openai-compatible`
- OpenClaw Base URL：`http://127.0.0.1:8788`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| bootstrap-demo-user | 200 | — | — | — | — | — | passed |
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| web-dashboard-summary | 200 | — | — | — | — | — | passed |
| web-goalflow-overview | 200 | — | — | — | — | — | passed |
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | c5ddc0fb-0fb5-420b-8d4a-82c5b5709fb0 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 4a8fa2a1-3495-44db-a748-58564b7825a6 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 3eab333d-fe99-4727-a982-1f58d68131b3 | — | — | — | — | passed |
| chief-route-recovery | 200 | ed703f45-43e3-4b63-b80a-4c40a747f37c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | ed703f45-43e3-4b63-b80a-4c40a747f37c | — | — | — | — | passed |
| chief-route-task-management | 200 | 9e0919af-a92c-466d-94de-a79a83263485 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 9e0919af-a92c-466d-94de-a79a83263485 | — | — | — | — | passed |
| chief-route-reflection | 200 | bfd6cc99-dac4-4b30-b1bb-3435d599ca1c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | bfd6cc99-dac4-4b30-b1bb-3435d599ca1c | — | — | — | — | passed |
| probe-chief-agent | 200 | 8ccbc50f-4f2a-46d7-82fb-e3e9e5f55325 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 8ccbc50f-4f2a-46d7-82fb-e3e9e5f55325 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | e0863926-da82-40fa-aa84-305a200d442d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | e0863926-da82-40fa-aa84-305a200d442d | — | — | — | — | passed |
| probe-task-management-agent | 200 | 55551e55-fe8c-4048-98d6-077005365f83 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 55551e55-fe8c-4048-98d6-077005365f83 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 2c249a2e-8dcd-4284-9ef6-3155e34864e0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 2c249a2e-8dcd-4284-9ef6-3155e34864e0 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 4c55ed73-b892-4505-9206-cb71afa2d9cc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 4c55ed73-b892-4505-9206-cb71afa2d9cc | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | a81fea63-ed82-4c7b-9ba3-a375ea4a9b5e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | a81fea63-ed82-4c7b-9ba3-a375ea4a9b5e | — | — | — | — | passed |
| probe-automation-agent | 200 | 51daedcc-1335-4d9e-9020-4e8923f2b391 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 51daedcc-1335-4d9e-9020-4e8923f2b391 | — | — | — | — | passed |
| debug-state-insight | 200 | c76fd9d8-c811-4b9d-9d1e-44dd629c9365 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | c76fd9d8-c811-4b9d-9d1e-44dd629c9365 | — | — | — | — | passed |
| debug-task-management | 200 | 05823532-aaf8-43ed-9edb-28597a88a4ae | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 05823532-aaf8-43ed-9edb-28597a88a4ae | — | — | — | — | passed |
| debug-progress-feedback | 200 | c8695f01-44f2-4ab6-8773-225e60b96049 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | c8695f01-44f2-4ab6-8773-225e60b96049 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | d10843b9-3f6e-4ca2-ae38-6e31025b5328 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | d10843b9-3f6e-4ca2-ae38-6e31025b5328 | — | — | — | — | passed |
| debug-reflection | 200 | 86476e1d-f1e6-4e04-962e-0a3d4b570808 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 86476e1d-f1e6-4e04-962e-0a3d4b570808 | — | — | — | — | passed |
| debug-automation | 200 | d548b428-bc24-49bc-a0cc-efaeda1c68ad | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | d548b428-bc24-49bc-a0cc-efaeda1c68ad | — | — | — | — | passed |
| business-create-goal | 201 | — | — | — | — | — | passed |
| business-create-task | 201 | — | — | — | — | — | passed |
| business-start-session | 201 | — | — | — | — | — | passed |
| business-signal-batch | 200 | — | — | — | — | — | passed |
| business-state-latest | 200 | — | — | — | — | — | passed |
| business-end-session | 200 | — | — | — | — | — | passed |
| business-inbox | 200 | — | — | — | — | — | passed |
| business-dashboard-summary | 200 | — | — | — | — | — | passed |
| business-reflections-latest | 200 | — | — | — | — | — | passed |
| business-inbox-ack | 200 | — | — | — | — | — | passed |
| reflection-latest-weekly | 200 | — | — | — | — | — | passed |
| reflection-latest-monthly | 200 | — | — | — | — | — | passed |
| full-regression | 200 | fa02cf39-5e9b-4db2-afdc-24e8bdcd0d33 | — | — | — | — | passed |
| full-regression-trace | 200 | fa02cf39-5e9b-4db2-afdc-24e8bdcd0d33 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 26f062a7-8042-4731-938e-9ba025d81a00 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 26f062a7-8042-4731-938e-9ba025d81a00 | — | — | — | — | passed |

