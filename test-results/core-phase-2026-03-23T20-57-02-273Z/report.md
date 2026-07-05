# Core Phase Test Report

- Started: `2026-03-23T20:57:02.275Z`
- Completed: `2026-03-23T20:58:46.200Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Provider Mode: `mock`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | Registry Health | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | not_configured | — | 58/58 |
| Phase 2 Provider Direct | passed | openai-compatible | not_configured | — | 72/72 |
| Phase 3 Cluster Preferred | passed | openai-compatible | aligned | http://127.0.0.1:8788 | 72/72 |

## Failures

- 无失败记录。

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-57-02-273Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-57-02-273Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-23T20-57-02-273Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
- Agent mode：`stub`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
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
| seed-focus-recovery-loop | 200 | 886111c3-01fb-4b63-98b4-307773fc5bc7 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | ca91c45d-8686-499d-8da7-cf232e471948 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | f7fdb80e-1c77-4cee-a16c-d7a949df5510 | — | — | — | — | passed |
| chief-route-recovery | 200 | a28bf155-b4e4-4369-91a8-28ce89c4e6b7 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | a28bf155-b4e4-4369-91a8-28ce89c4e6b7 | — | — | — | — | passed |
| chief-route-task-management | 200 | a173643a-3552-42b6-80a2-e4ab1cbd9234 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | a173643a-3552-42b6-80a2-e4ab1cbd9234 | — | — | — | — | passed |
| chief-route-reflection | 200 | 989dceff-c65e-4699-b862-af58d38c3208 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 989dceff-c65e-4699-b862-af58d38c3208 | — | — | — | — | passed |
| debug-state-insight | 200 | 2b9b9246-d4bf-407e-bc47-96856b0dc760 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 2b9b9246-d4bf-407e-bc47-96856b0dc760 | — | — | — | — | passed |
| debug-task-management | 200 | 17306db6-9e39-4330-b10b-f177afeaf65c | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 17306db6-9e39-4330-b10b-f177afeaf65c | — | — | — | — | passed |
| debug-progress-feedback | 200 | 1c74739c-bb85-4865-9f00-8cb1095acf01 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 1c74739c-bb85-4865-9f00-8cb1095acf01 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 9f4b6b53-47ed-4bd2-b2ae-48d4d778f76b | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 9f4b6b53-47ed-4bd2-b2ae-48d4d778f76b | — | — | — | — | passed |
| debug-reflection | 200 | 57a85df2-a515-40d0-9010-a0258a4c5cbd | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 57a85df2-a515-40d0-9010-a0258a4c5cbd | — | — | — | — | passed |
| debug-automation | 200 | ff76e71a-c007-4d84-95e5-9c37926fcd9c | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | ff76e71a-c007-4d84-95e5-9c37926fcd9c | — | — | — | — | passed |
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
| full-regression | 200 | 07ed31e2-20db-4c7e-82ee-02facb818c57 | — | — | — | — | passed |
| full-regression-trace | 200 | 07ed31e2-20db-4c7e-82ee-02facb818c57 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 06a3893b-7097-431e-98e9-19508ebe0334 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 06a3893b-7097-431e-98e9-19508ebe0334 | — | — | — | — | passed |

## Phase 2 Provider Direct

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`not_configured`
- OpenClaw Base URL：`未配置`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
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
| seed-focus-recovery-loop | 200 | 82b03079-fb4b-4e24-92c6-1473502bf363 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 6ebdeb32-ec4f-44a6-b2d4-d7a9b2734c10 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | d9d5fd59-d9a4-4777-be5a-11da202285d4 | — | — | — | — | passed |
| probe-chief-agent | 200 | 53ba08f0-6a4b-47dc-a015-a4dedda6368d | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 53ba08f0-6a4b-47dc-a015-a4dedda6368d | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 7919a8c1-cc8c-408a-ab7a-890247937c97 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 7919a8c1-cc8c-408a-ab7a-890247937c97 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 220a0a77-ea82-4e13-a86f-44003e26581a | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 220a0a77-ea82-4e13-a86f-44003e26581a | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 61a6d9b2-db0f-4e24-aeba-36c76c74720e | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 61a6d9b2-db0f-4e24-aeba-36c76c74720e | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | afe07208-74bf-43e3-8d19-992da92093e3 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | afe07208-74bf-43e3-8d19-992da92093e3 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | f2e738d3-73d6-4e13-a1cf-d31f32b9e0e3 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | f2e738d3-73d6-4e13-a1cf-d31f32b9e0e3 | — | — | — | — | passed |
| probe-automation-agent | 200 | b45041bb-7585-483e-88fb-e84e4a0a2a0b | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | b45041bb-7585-483e-88fb-e84e4a0a2a0b | — | — | — | — | passed |
| chief-route-recovery | 200 | 0ea890fc-e567-4aec-9205-35776e844a80 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 0ea890fc-e567-4aec-9205-35776e844a80 | — | — | — | — | passed |
| chief-route-task-management | 200 | 6ecc9d28-cf35-4f18-8e64-5a6c41b82314 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 6ecc9d28-cf35-4f18-8e64-5a6c41b82314 | — | — | — | — | passed |
| chief-route-reflection | 200 | 0e2f7595-f70b-486f-8eac-ce578d1a272e | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 0e2f7595-f70b-486f-8eac-ce578d1a272e | — | — | — | — | passed |
| debug-state-insight | 200 | f31e7efb-2b3e-4bd2-9165-46d253e03ee6 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | f31e7efb-2b3e-4bd2-9165-46d253e03ee6 | — | — | — | — | passed |
| debug-task-management | 200 | 2b88baa4-9ec8-4fa1-a6b6-14768b4d241e | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 2b88baa4-9ec8-4fa1-a6b6-14768b4d241e | — | — | — | — | passed |
| debug-progress-feedback | 200 | 7a9a932b-653d-4179-ae83-159c5ef14aa4 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 7a9a932b-653d-4179-ae83-159c5ef14aa4 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 2946db4d-4712-4a78-8806-f1da7ba29e73 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 2946db4d-4712-4a78-8806-f1da7ba29e73 | — | — | — | — | passed |
| debug-reflection | 200 | 69292d6d-4ebf-4680-930a-73048532ca4c | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 69292d6d-4ebf-4680-930a-73048532ca4c | — | — | — | — | passed |
| debug-automation | 200 | a14891ce-d176-43d1-a692-fb95802bcd1a | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | a14891ce-d176-43d1-a692-fb95802bcd1a | — | — | — | — | passed |
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
| full-regression | 200 | 369e7d5b-1325-4df4-8d8b-7da544e9aff3 | — | — | — | — | passed |
| full-regression-trace | 200 | 369e7d5b-1325-4df4-8d8b-7da544e9aff3 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | fcb9a901-0d9e-443f-9cd1-17df52b9bc6b | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | fcb9a901-0d9e-443f-9cd1-17df52b9bc6b | — | — | — | — | passed |

## Phase 3 Cluster Preferred

- 状态：`passed`
- Agent mode：`openai-compatible`
- Registry health：`aligned`
- OpenClaw Base URL：`http://127.0.0.1:8788`
- Registry issues：`0`（missing persona: `0`）
- Registry reasons：无
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
| seed-focus-recovery-loop | 200 | 680bc4e7-6e5a-4dd2-bab3-72bfa10dddaf | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 856ead9e-1479-44d1-9aed-9aab2fdeb0b5 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | d2576bf1-f4a5-40ae-ae56-7cc07b1c039d | — | — | — | — | passed |
| probe-chief-agent | 200 | 6567aad7-ae86-48b1-b36f-12a2adc2c8c6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | 6567aad7-ae86-48b1-b36f-12a2adc2c8c6 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | a869c621-12b2-4368-9d01-52e6bc3f0290 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | a869c621-12b2-4368-9d01-52e6bc3f0290 | — | — | — | — | passed |
| probe-task-management-agent | 200 | f20cd6a4-a36f-4543-87e4-a82e95bdbefd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | f20cd6a4-a36f-4543-87e4-a82e95bdbefd | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 7aaa8abf-afa8-43e0-b195-a16489f50979 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 7aaa8abf-afa8-43e0-b195-a16489f50979 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | cfe77fe7-7704-425e-a5eb-647baac33151 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | cfe77fe7-7704-425e-a5eb-647baac33151 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | fb367aff-98f7-488c-b0fe-2a61d2355538 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | fb367aff-98f7-488c-b0fe-2a61d2355538 | — | — | — | — | passed |
| probe-automation-agent | 200 | 6bd3f577-ff9f-4526-8544-b5fb62ff46a3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 6bd3f577-ff9f-4526-8544-b5fb62ff46a3 | — | — | — | — | passed |
| chief-route-recovery | 200 | 2693d82a-ef5a-4d7c-ba8d-589c9f9016db | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 2693d82a-ef5a-4d7c-ba8d-589c9f9016db | — | — | — | — | passed |
| chief-route-task-management | 200 | a98b2a40-2f48-4d70-95c5-99b5825a94b6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | a98b2a40-2f48-4d70-95c5-99b5825a94b6 | — | — | — | — | passed |
| chief-route-reflection | 200 | b11f8992-c0e7-48aa-b77e-f7ddb0ff24ab | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | b11f8992-c0e7-48aa-b77e-f7ddb0ff24ab | — | — | — | — | passed |
| debug-state-insight | 200 | 4b8ad2bf-0c9b-4be3-a7b0-95e0e9a40999 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 4b8ad2bf-0c9b-4be3-a7b0-95e0e9a40999 | — | — | — | — | passed |
| debug-task-management | 200 | a2f4a490-e1d5-404d-bad9-ab0b6893aa1e | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | a2f4a490-e1d5-404d-bad9-ab0b6893aa1e | — | — | — | — | passed |
| debug-progress-feedback | 200 | 773e96f2-f3b6-4c0d-b6af-621cd68b6f49 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 773e96f2-f3b6-4c0d-b6af-621cd68b6f49 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 595dfa42-9cd4-4472-a5fc-b866080a2905 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 595dfa42-9cd4-4472-a5fc-b866080a2905 | — | — | — | — | passed |
| debug-reflection | 200 | e0636e73-db7e-4b88-8c81-0c5019cafd0d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | e0636e73-db7e-4b88-8c81-0c5019cafd0d | — | — | — | — | passed |
| debug-automation | 200 | afa4fe84-d291-4769-a02f-28cd1f25c54d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | afa4fe84-d291-4769-a02f-28cd1f25c54d | — | — | — | — | passed |
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
| full-regression | 200 | 571a8da9-d259-45c9-a51d-5a7709d34e42 | — | — | — | — | passed |
| full-regression-trace | 200 | 571a8da9-d259-45c9-a51d-5a7709d34e42 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 77c64f15-448d-4e8e-94bf-e0f0ad55fba6 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 77c64f15-448d-4e8e-94bf-e0f0ad55fba6 | — | — | — | — | passed |

