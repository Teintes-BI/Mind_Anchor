# Core Phase Test Report

- Started: `2026-03-29T15:46:15.156Z`
- Completed: `2026-03-29T17:01:08.932Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4175`
- Cluster Mode: `real`
- Provider Mode: `real`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | not_configured | — | 58/58 |
| Phase 2 Provider Direct | passed | openai-compatible | not_configured | — | 72/72 |
| Phase 3 Cluster Preferred | passed | openai-compatible | aligned | http://127.0.0.1:8788 | 72/72 |

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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-real-full-aligned-baseurl-20260329-1/report.live.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-real-full-aligned-baseurl-20260329-1/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-real-full-aligned-baseurl-20260329-1/responses`

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
| seed-focus-recovery-loop | 200 | 15a9b123-4e6a-429b-90a0-f25bd41a448c | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 216d6c2f-8f31-49ce-a353-42053ce46632 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 174b3b7e-76b5-41ca-9411-11a4b6d94784 | — | — | — | — | passed |
| chief-route-recovery | 200 | 414f12a4-7ed9-49ad-b66f-7a1e920691a6 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 414f12a4-7ed9-49ad-b66f-7a1e920691a6 | — | — | — | — | passed |
| chief-route-task-management | 200 | 62b18905-d199-4601-8f97-25a38b3d6ae4 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 62b18905-d199-4601-8f97-25a38b3d6ae4 | — | — | — | — | passed |
| chief-route-reflection | 200 | 89e866ff-ee22-49b9-90af-23fad3d20df2 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 89e866ff-ee22-49b9-90af-23fad3d20df2 | — | — | — | — | passed |
| debug-state-insight | 200 | 4dccf378-8969-4f02-9736-faa738af093f | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 4dccf378-8969-4f02-9736-faa738af093f | — | — | — | — | passed |
| debug-task-management | 200 | 595691d7-ef17-4d72-8c7e-35ee8b080453 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 595691d7-ef17-4d72-8c7e-35ee8b080453 | — | — | — | — | passed |
| debug-progress-feedback | 200 | f7ad9ec7-fe1f-4884-aa65-7e5e53a30088 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | f7ad9ec7-fe1f-4884-aa65-7e5e53a30088 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 69a9e57c-f5e6-4670-aa60-1e67e9d3667b | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 69a9e57c-f5e6-4670-aa60-1e67e9d3667b | — | — | — | — | passed |
| debug-reflection | 200 | 8170847f-97e8-4502-9c1c-fbcd963c8e16 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 8170847f-97e8-4502-9c1c-fbcd963c8e16 | — | — | — | — | passed |
| debug-automation | 200 | ab540309-fc48-4feb-a841-7f690e962d71 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | ab540309-fc48-4feb-a841-7f690e962d71 | — | — | — | — | passed |
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
| full-regression | 200 | e68be644-544c-4742-8bdf-e4d2faadc59d | — | — | — | — | passed |
| full-regression-trace | 200 | e68be644-544c-4742-8bdf-e4d2faadc59d | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | b2c76d7c-ba52-4072-a6ee-af07c963b191 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | b2c76d7c-ba52-4072-a6ee-af07c963b191 | — | — | — | — | passed |

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
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | 2fe614e5-7f3d-4d7b-9c62-0b8dc36b7c71 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 089d0f2a-5343-4542-8772-def5f9e5410f | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 936cdc2a-e9d8-4f62-b944-bf08d5865ddf | — | — | — | — | passed |
| probe-chief-agent | 200 | 08c1d778-a3c1-4f30-a6fc-e598a0018a6f | provider-direct | /v1/responses | false | — | passed |
| probe-chief-agent-trace | 200 | 08c1d778-a3c1-4f30-a6fc-e598a0018a6f | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 2f471514-3a27-4459-bd72-856341f42461 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 2f471514-3a27-4459-bd72-856341f42461 | — | — | — | — | passed |
| probe-task-management-agent | 200 | d2d6bb61-f930-497f-b4b3-700cef038153 | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | d2d6bb61-f930-497f-b4b3-700cef038153 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 2a45a439-18f5-4541-9f00-04f0fe700677 | provider-direct | /v1/responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 2a45a439-18f5-4541-9f00-04f0fe700677 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | b68b34a9-4969-4a72-be6a-080e45416ac2 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | b68b34a9-4969-4a72-be6a-080e45416ac2 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | adf6b421-d7bd-443d-91ee-1484a7da5e91 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | adf6b421-d7bd-443d-91ee-1484a7da5e91 | — | — | — | — | passed |
| probe-automation-agent | 200 | 06e45340-6e13-48c4-8a2f-6d3f24a9970b | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 06e45340-6e13-48c4-8a2f-6d3f24a9970b | — | — | — | — | passed |
| chief-route-recovery | 200 | 608defb0-3b39-4bfa-850c-7a43cabb8a7a | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 608defb0-3b39-4bfa-850c-7a43cabb8a7a | — | — | — | — | passed |
| chief-route-task-management | 200 | ce26d79d-5f65-49c1-9ed4-11675dc6496d | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | ce26d79d-5f65-49c1-9ed4-11675dc6496d | — | — | — | — | passed |
| chief-route-reflection | 200 | f6831c83-cc89-4f4e-9a00-6f523bf03ea0 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | f6831c83-cc89-4f4e-9a00-6f523bf03ea0 | — | — | — | — | passed |
| debug-state-insight | 200 | 98b1c4d2-9731-45df-b30f-c1996969694f | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 98b1c4d2-9731-45df-b30f-c1996969694f | — | — | — | — | passed |
| debug-task-management | 200 | 3a36bd8a-dad4-4e2d-b65b-a06c7c659187 | provider-direct | /v1/responses | false | — | passed |
| debug-task-management-trace | 200 | 3a36bd8a-dad4-4e2d-b65b-a06c7c659187 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 9c7e20dc-18c2-4aaa-97b0-cca1ebd42d77 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 9c7e20dc-18c2-4aaa-97b0-cca1ebd42d77 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | d4b225b6-f462-4c5d-a815-0eba0baf136f | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | d4b225b6-f462-4c5d-a815-0eba0baf136f | — | — | — | — | passed |
| debug-reflection | 200 | 2b22b6f0-6f02-4692-8cdf-03f80a257eda | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 2b22b6f0-6f02-4692-8cdf-03f80a257eda | — | — | — | — | passed |
| debug-automation | 200 | b8e0edd7-70d5-4b9f-a76c-5f449102c68a | provider-direct | /v1/responses | false | — | passed |
| debug-automation-trace | 200 | b8e0edd7-70d5-4b9f-a76c-5f449102c68a | — | — | — | — | passed |
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
| full-regression | 200 | 306affa0-0574-467d-8765-650687b5d641 | — | — | — | — | passed |
| full-regression-trace | 200 | 306affa0-0574-467d-8765-650687b5d641 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 3c04f5f1-709c-44b6-8299-7314b589c79e | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 3c04f5f1-709c-44b6-8299-7314b589c79e | — | — | — | — | passed |

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
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | 3538a57f-9a1e-4671-9d1e-5459fb105519 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | bc888944-9661-4bc3-88f4-929ba961ecf2 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 46e4edaa-6f4a-4431-ac22-cd062047a7b0 | — | — | — | — | passed |
| probe-chief-agent | 200 | 5091f803-2a65-4d77-b08f-965c15987c13 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 5091f803-2a65-4d77-b08f-965c15987c13 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | d5e0d3a4-bd10-4afa-93e9-91a1aa48289d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | d5e0d3a4-bd10-4afa-93e9-91a1aa48289d | — | — | — | — | passed |
| probe-task-management-agent | 200 | a4b6b800-4460-4797-8cfb-dc8ae8f22d83 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | a4b6b800-4460-4797-8cfb-dc8ae8f22d83 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 1d80b6dc-2ab5-4261-b762-ec4532e93119 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 1d80b6dc-2ab5-4261-b762-ec4532e93119 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 83facd99-a258-4465-887e-831df26435ce | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 83facd99-a258-4465-887e-831df26435ce | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | a6c96d2f-9cc8-4d7c-baa0-9a62b899dc6e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | a6c96d2f-9cc8-4d7c-baa0-9a62b899dc6e | — | — | — | — | passed |
| probe-automation-agent | 200 | f0f71014-ee23-4dcb-971e-11be4d763a3a | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | f0f71014-ee23-4dcb-971e-11be4d763a3a | — | — | — | — | passed |
| chief-route-recovery | 200 | 754d73ce-3df9-41ec-b5f1-b95f174709ae | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 754d73ce-3df9-41ec-b5f1-b95f174709ae | — | — | — | — | passed |
| chief-route-task-management | 200 | 2b01487d-3f4a-4d4f-890e-ad9b0e622337 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 2b01487d-3f4a-4d4f-890e-ad9b0e622337 | — | — | — | — | passed |
| chief-route-reflection | 200 | 2d40b0c9-fc17-4081-806b-6eec5863c6f3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 2d40b0c9-fc17-4081-806b-6eec5863c6f3 | — | — | — | — | passed |
| debug-state-insight | 200 | a1f7dc04-e070-46ae-9b7e-237e36afb10e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | a1f7dc04-e070-46ae-9b7e-237e36afb10e | — | — | — | — | passed |
| debug-task-management | 200 | 30793de5-e01d-4c0e-a741-b41f9a2641dd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 30793de5-e01d-4c0e-a741-b41f9a2641dd | — | — | — | — | passed |
| debug-progress-feedback | 200 | 436e5af8-8be5-4ca3-b7fc-b1f88bb299b0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 436e5af8-8be5-4ca3-b7fc-b1f88bb299b0 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 340cf159-cf9e-4468-ae01-cecb651e148f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 340cf159-cf9e-4468-ae01-cecb651e148f | — | — | — | — | passed |
| debug-reflection | 200 | 3ccc4e48-bf23-468d-a1df-44bbbe3261e2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | 3ccc4e48-bf23-468d-a1df-44bbbe3261e2 | — | — | — | — | passed |
| debug-automation | 200 | 14ee2e73-a74f-491b-92e2-a60d385cc90b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 14ee2e73-a74f-491b-92e2-a60d385cc90b | — | — | — | — | passed |
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
| full-regression | 200 | 3b851aeb-d287-40fb-b384-b02dc6e3fdbc | — | — | — | — | passed |
| full-regression-trace | 200 | 3b851aeb-d287-40fb-b384-b02dc6e3fdbc | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | ca257c19-8257-43ae-bc5c-327f35e2b7b9 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | ca257c19-8257-43ae-bc5c-327f35e2b7b9 | — | — | — | — | passed |

