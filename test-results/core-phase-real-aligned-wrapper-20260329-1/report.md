# Core Phase Test Report

- Started: `2026-03-29T17:03:40.573Z`
- Completed: `2026-03-29T17:08:02.540Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4175`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 2 Provider Direct | passed | openai-compatible | not_configured | — | 21/21 |

## Failures

- 无失败记录。

## Preflight

- 状态：`passed`
- Issues：`0`
- Provider auth probe：`passed`
- Provider auth accepted via：`ok`
- Provider auth endpoint：`/responses`
- Provider config drift：`aligned`
- Gateway baseUrl：`https://gmncode.cn`
- OpenClaw baseUrl：`https://gmncode.cn`
- 无 preflight 问题。


## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-aligned-wrapper-20260329-1/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-aligned-wrapper-20260329-1/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-aligned-wrapper-20260329-1/responses`

## Phase 2 Provider Direct

- 状态：`passed`
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
| probe-chief-agent | 200 | c496f69b-8d58-4412-85c2-2f72fadab83b | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | c496f69b-8d58-4412-85c2-2f72fadab83b | — | — | — | — | passed |
| probe-state-insight-agent | 200 | cc1c5beb-9189-4be3-ac73-4719c353852b | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | cc1c5beb-9189-4be3-ac73-4719c353852b | — | — | — | — | passed |
| probe-task-management-agent | 200 | 78136531-40a1-4d2a-bd4b-f3f2fc96fa24 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 78136531-40a1-4d2a-bd4b-f3f2fc96fa24 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 984e7286-eb38-4d59-bba2-eee19b78cd35 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 984e7286-eb38-4d59-bba2-eee19b78cd35 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 8cb239e7-206e-4ec2-af36-3ac4b39b09ed | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 8cb239e7-206e-4ec2-af36-3ac4b39b09ed | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 524479d4-c584-46b4-bafa-180d4952bf64 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 524479d4-c584-46b4-bafa-180d4952bf64 | — | — | — | — | passed |
| probe-automation-agent | 200 | d5b68ace-0877-4a7f-b3ab-61ed9de798f2 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | d5b68ace-0877-4a7f-b3ab-61ed9de798f2 | — | — | — | — | passed |

