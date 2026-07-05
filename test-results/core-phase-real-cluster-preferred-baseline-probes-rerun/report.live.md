# Core Phase Test Report

- Started: `2026-03-24T03:24:55.178Z`
- Completed: `2026-03-24T03:26:35.338Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 3 Cluster Preferred | passed | openai-compatible | aligned | http://127.0.0.1:8788 | 21/21 |

## Failures

- 无失败记录。

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-cluster-preferred-baseline-probes-rerun/report.live.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-cluster-preferred-baseline-probes-rerun/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-cluster-preferred-baseline-probes-rerun/responses`

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`aligned`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
- Registry issue breakdown：contract=`0` / runtime=`0` / workflow=`0` / workflow-response=`0` / workflow-execution=`0` / execution-probe=`0` / unknown-external=`9`
- Registry runtime：`openclaw-local-cluster` / `structured-local-runtime-phase1`
- Registry matched agents：`6/6`

| Step | Status | Trace | Route | Endpoint | Fallback | Reason | Conclusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| health | 200 | — | — | — | — | — | passed |
| adapter-status | 200 | — | — | — | — | — | passed |
| agent-configs | 200 | — | — | — | — | — | passed |
| debug-scenarios | 200 | — | — | — | — | — | passed |
| registry-visibility | 200 | — | — | — | — | — | passed |
| clear-debug-runs | 200 | — | — | — | — | — | passed |
| clear-matrix-runs | 200 | — | — | — | — | — | passed |
| probe-chief-agent | 200 | dfbce5a0-c120-48dd-ba5d-aa08575b19f4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | dfbce5a0-c120-48dd-ba5d-aa08575b19f4 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 8b952b0f-1278-40e9-8be9-c6fe638aa3eb | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 8b952b0f-1278-40e9-8be9-c6fe638aa3eb | — | — | — | — | passed |
| probe-task-management-agent | 200 | 4ddfc09d-187f-474a-98b4-edff590119d0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | 4ddfc09d-187f-474a-98b4-edff590119d0 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | adb89b4f-ee53-414e-b575-4de38229e6b8 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | adb89b4f-ee53-414e-b575-4de38229e6b8 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 2b96d71d-6b94-40ed-8de2-e78b3cc3348b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 2b96d71d-6b94-40ed-8de2-e78b3cc3348b | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 2bd8c1f2-3132-4772-98db-89ae8a27da24 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 2bd8c1f2-3132-4772-98db-89ae8a27da24 | — | — | — | — | passed |
| probe-automation-agent | 200 | e7a3f621-8ed4-437a-9e11-a092f1db1b7d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | e7a3f621-8ed4-437a-9e11-a092f1db1b7d | — | — | — | — | passed |

