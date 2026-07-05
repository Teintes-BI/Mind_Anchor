# Core Phase Test Report

- Started: `2026-03-29T15:26:47.025Z`
- Completed: `2026-03-29T15:32:30.948Z`
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
- Provider auth endpoint：`/v1/responses`
- 无 preflight 问题。


## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-aligned-baseurl-20260329-1/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-aligned-baseurl-20260329-1/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-provider-direct-aligned-baseurl-20260329-1/responses`

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
| probe-chief-agent | 200 | cebb86f6-ebd8-4a92-891a-e63cebf3467a | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | cebb86f6-ebd8-4a92-891a-e63cebf3467a | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 10f083de-11a1-47d0-a85a-335846161b06 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 10f083de-11a1-47d0-a85a-335846161b06 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 856ada3d-653c-473d-92d7-67c695fe1c72 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 856ada3d-653c-473d-92d7-67c695fe1c72 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 6a3f7ec3-26da-430e-b1bf-78cad9398dd2 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 6a3f7ec3-26da-430e-b1bf-78cad9398dd2 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 808e3461-bdf3-486a-994e-87573a1374bb | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 808e3461-bdf3-486a-994e-87573a1374bb | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 34bbc822-70a5-494e-8926-37b16b2cd30b | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 34bbc822-70a5-494e-8926-37b16b2cd30b | — | — | — | — | passed |
| probe-automation-agent | 200 | 4e4625b0-b38c-4bba-b038-0549ab33b3e6 | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 4e4625b0-b38c-4bba-b038-0549ab33b3e6 | — | — | — | — | passed |

