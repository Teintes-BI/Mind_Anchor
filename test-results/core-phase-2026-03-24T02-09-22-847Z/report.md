# Core Phase Test Report

- Started: `2026-03-24T02:09:22.869Z`
- Completed: `2026-03-24T03:12:48.875Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | not_configured | — | 58/58 |
| Phase 2 Provider Direct | failed | openai-compatible | not_configured | — | 66/67 |
| Phase 3 Cluster Preferred | failed | openai-compatible | — | http://127.0.0.1:8788 | 0/0 |

## Failures

- [provider-direct] full-regression: Request timeout after 1800000ms
- [provider-direct] provider-direct-phase: Request timeout after 1800000ms
- [cluster-preferred] start-cluster: Timed out waiting for http://127.0.0.1:8788/health

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T02-09-22-847Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T02-09-22-847Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T02-09-22-847Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry issue breakdown：contract=`0` / runtime=`0` / workflow=`0` / workflow-response=`0` / workflow-execution=`0` / execution-probe=`0` / unknown-external=`0`
- Registry runtime：`未上报` / `未上报`
- Registry matched agents：`0/6`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| registry-visibility | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | 73a1068c-e351-4679-96bb-6912df7a576f | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | b1d12331-225d-42ef-8583-d3aa898097f5 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | a0a85f1e-e7d3-42a3-aca0-fcc06086e0e7 | — | — | — | — | passed |
| chief-route-recovery | 200 | a4a26e7b-9be4-4914-884f-d97086e1dbbd | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | a4a26e7b-9be4-4914-884f-d97086e1dbbd | — | — | — | — | passed |
| chief-route-task-management | 200 | 250e0e80-4911-499e-b7cf-dd3a095b3e44 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 250e0e80-4911-499e-b7cf-dd3a095b3e44 | — | — | — | — | passed |
| chief-route-reflection | 200 | 069d4613-9865-478a-8a5b-8906bc73c038 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 069d4613-9865-478a-8a5b-8906bc73c038 | — | — | — | — | passed |
| debug-state-insight | 200 | 0765ebd1-84f2-4499-a442-a9f084b80866 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 0765ebd1-84f2-4499-a442-a9f084b80866 | — | — | — | — | passed |
| debug-task-management | 200 | 42338b34-bc56-468f-92ad-82fb956cec95 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 42338b34-bc56-468f-92ad-82fb956cec95 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 87d4ee85-0654-44a8-9296-05ca7f5f8dcd | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 87d4ee85-0654-44a8-9296-05ca7f5f8dcd | — | — | — | — | passed |
| debug-interruption-recovery | 200 | b125244d-d1f1-4241-8a9f-c9c4647b7c0d | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | b125244d-d1f1-4241-8a9f-c9c4647b7c0d | — | — | — | — | passed |
| debug-reflection | 200 | 82b5090a-e3cb-4895-83bc-891df8d094aa | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 82b5090a-e3cb-4895-83bc-891df8d094aa | — | — | — | — | passed |
| debug-automation | 200 | 5907bbcd-9c63-4983-af02-566f9a43cd5f | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 5907bbcd-9c63-4983-af02-566f9a43cd5f | — | — | — | — | passed |
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
| web-dashboard-summary | 200 | — | — | — | — | — | passed |
| web-goalflow-overview | 200 | — | — | — | — | — | passed |
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| full-regression | 200 | 73fd6ca5-a474-44ad-92a0-1a6facb75daa | — | — | — | — | passed |
| full-regression-trace | 200 | 73fd6ca5-a474-44ad-92a0-1a6facb75daa | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | ab5b8a2f-436c-4789-bf0c-3b63b19c2287 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | ab5b8a2f-436c-4789-bf0c-3b63b19c2287 | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`failed`
- Agent mode：`openai-compatible`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry issue breakdown：contract=`0` / runtime=`0` / workflow=`0` / workflow-response=`0` / workflow-execution=`0` / execution-probe=`0` / unknown-external=`0`
- Registry runtime：`未上报` / `未上报`
- Registry matched agents：`0/6`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| registry-visibility | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | ca0adc49-0120-4378-8011-b1939bbecdaf | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 83750d3a-12a5-48a4-9ea8-e9e9a6caddf6 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | fe1b9730-1193-4886-b3f4-dda3f2e60455 | — | — | — | — | passed |
| probe-chief-agent | 200 | aff80f14-8bf5-4ead-8b74-061ce74d2e27 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | aff80f14-8bf5-4ead-8b74-061ce74d2e27 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | c1eb2642-cec0-469a-a71c-6a628044dfd1 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | c1eb2642-cec0-469a-a71c-6a628044dfd1 | — | — | — | — | passed |
| probe-task-management-agent | 200 | c4a11b88-1b54-485b-b28b-08f1a646dbe9 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | c4a11b88-1b54-485b-b28b-08f1a646dbe9 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 21bcb7bd-1f9a-4ad4-83cd-47bc23833be2 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 21bcb7bd-1f9a-4ad4-83cd-47bc23833be2 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | cf10c7a2-099f-4dc8-ac04-860139235470 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | cf10c7a2-099f-4dc8-ac04-860139235470 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | aec6debb-3875-4c70-bd26-97d6ff698bd2 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | aec6debb-3875-4c70-bd26-97d6ff698bd2 | — | — | — | — | passed |
| probe-automation-agent | 200 | 20b4b219-0a27-443e-a00c-bb500f662d7f | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 20b4b219-0a27-443e-a00c-bb500f662d7f | — | — | — | — | passed |
| chief-route-recovery | 200 | 04bc64b8-0cd7-4827-a63a-11192f18e0ce | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 04bc64b8-0cd7-4827-a63a-11192f18e0ce | — | — | — | — | passed |
| chief-route-task-management | 200 | e7f895ae-29b4-412d-83cb-707786616ef4 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | e7f895ae-29b4-412d-83cb-707786616ef4 | — | — | — | — | passed |
| chief-route-reflection | 200 | 8828a2c5-0480-440c-ab46-f676ad6bafc2 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 8828a2c5-0480-440c-ab46-f676ad6bafc2 | — | — | — | — | passed |
| debug-state-insight | 200 | 9fba8222-88da-4dcb-9c15-2532d0686a9c | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 9fba8222-88da-4dcb-9c15-2532d0686a9c | — | — | — | — | passed |
| debug-task-management | 200 | d9eef269-27a7-4479-9628-dd35ada3f421 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | d9eef269-27a7-4479-9628-dd35ada3f421 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 36061d88-60cb-4e43-8262-943b19aba686 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 36061d88-60cb-4e43-8262-943b19aba686 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 8a2121e1-3594-44ac-8122-d82bbf5cefac | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 8a2121e1-3594-44ac-8122-d82bbf5cefac | — | — | — | — | passed |
| debug-reflection | 200 | e50e6ebd-230d-4df1-8680-61bd5ce13d75 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | e50e6ebd-230d-4df1-8680-61bd5ce13d75 | — | — | — | — | passed |
| debug-automation | 200 | 53301756-6d21-4ac6-8163-73397a2cbbf4 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 53301756-6d21-4ac6-8163-73397a2cbbf4 | — | — | — | — | passed |
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
| web-dashboard-summary | 200 | — | — | — | — | — | passed |
| web-goalflow-overview | 200 | — | — | — | — | — | passed |
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| full-regression | ERR | — | — | — | — | — | Request timeout after 1800000ms |

## Phase 3 Cluster Preferred

- 状态：`failed`
- Agent mode：`openai-compatible`
- Registry health：`未记录`
- OpenClaw Base URL：`http://127.0.0.1:8788`


| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |


