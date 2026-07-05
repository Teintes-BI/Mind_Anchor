# Core Phase Test Report

- Started: `2026-03-09T17:03:04.459Z`
- Completed: `2026-03-09T17:30:44.834Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | 58/58 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 66/67 |
| Phase 3 Cluster Preferred | passed | openai-compatible | http://127.0.0.1:8788 | 72/72 |

## Failures

- [provider-direct] full-regression: fetch failed
- [provider-direct] provider-direct-phase: fetch failed

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T17-03-04-458Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T17-03-04-458Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T17-03-04-458Z/responses`

## Phase 1 Stub Baseline

- 状态：`passed`
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
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | a5becc73-9779-44dd-8923-f642d487b8f1 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 1f1937e3-9b21-4319-b65c-0778eb15eb69 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 4960c4aa-658b-4aec-a465-bab61af935ee | — | — | — | — | passed |
| chief-route-recovery | 200 | 552c33bb-7143-4a68-983f-350917bf8bfe | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 552c33bb-7143-4a68-983f-350917bf8bfe | — | — | — | — | passed |
| chief-route-task-management | 200 | a5db82cc-5551-497a-8293-bc23d61c92a1 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | a5db82cc-5551-497a-8293-bc23d61c92a1 | — | — | — | — | passed |
| chief-route-reflection | 200 | f4d78968-aa06-485e-a9b6-62491d9532df | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | f4d78968-aa06-485e-a9b6-62491d9532df | — | — | — | — | passed |
| debug-state-insight | 200 | c8487bdc-8b65-4c12-8bd3-0beb24916386 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | c8487bdc-8b65-4c12-8bd3-0beb24916386 | — | — | — | — | passed |
| debug-task-management | 200 | 8f5f05c4-e85c-4ae4-9b10-e57d5feb3d95 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 8f5f05c4-e85c-4ae4-9b10-e57d5feb3d95 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 69d7450f-cc8a-4f6f-a231-37bd1e179f7a | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 69d7450f-cc8a-4f6f-a231-37bd1e179f7a | — | — | — | — | passed |
| debug-interruption-recovery | 200 | ba3adad4-55f6-4bb2-9ae9-f63b814f19c6 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | ba3adad4-55f6-4bb2-9ae9-f63b814f19c6 | — | — | — | — | passed |
| debug-reflection | 200 | 839f9ff8-6bb9-4574-a7d0-edda8c034f33 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 839f9ff8-6bb9-4574-a7d0-edda8c034f33 | — | — | — | — | passed |
| debug-automation | 200 | 6d77e067-e5a8-441f-9801-cccef35b45d1 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 6d77e067-e5a8-441f-9801-cccef35b45d1 | — | — | — | — | passed |
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
| web-dashboard-summary | 200 | — | — | — | — | — | passed |
| web-goalflow-overview | 200 | — | — | — | — | — | passed |
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| full-regression | 200 | 66f0b726-df84-4201-a065-674187e66522 | — | — | — | — | passed |
| full-regression-trace | 200 | 66f0b726-df84-4201-a065-674187e66522 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 267c0afa-6670-4a8e-9668-1af1ca69a76a | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 267c0afa-6670-4a8e-9668-1af1ca69a76a | — | — | — | — | passed |

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
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | c81092a8-bb6c-43d8-b9de-099026e78746 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 976f9d35-8554-479d-8949-4f8bfde570dd | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 1d26f35b-bdbe-4c31-b05b-0600fbb8bd77 | — | — | — | — | passed |
| probe-chief-agent | 200 | 67f9ae2e-d403-4134-ad3c-68464c7780e6 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 67f9ae2e-d403-4134-ad3c-68464c7780e6 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 84b9d87a-1568-4894-a258-75420e3cbd50 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 84b9d87a-1568-4894-a258-75420e3cbd50 | — | — | — | — | passed |
| probe-task-management-agent | 200 | 91eea008-22e5-44d2-9122-bf5cd7d1c6ac | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | 91eea008-22e5-44d2-9122-bf5cd7d1c6ac | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | e6dcd04e-42a2-4d49-831c-1847c6fba682 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | e6dcd04e-42a2-4d49-831c-1847c6fba682 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 8a9b2e58-3310-48cb-b099-d8c2d3cf047c | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 8a9b2e58-3310-48cb-b099-d8c2d3cf047c | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 921a273c-d83c-49ee-b1c5-23f9d3c81107 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 921a273c-d83c-49ee-b1c5-23f9d3c81107 | — | — | — | — | passed |
| probe-automation-agent | 200 | 539bead1-adfa-4233-9fbd-2813c5e51afd | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | 539bead1-adfa-4233-9fbd-2813c5e51afd | — | — | — | — | passed |
| chief-route-recovery | 200 | 1f3d314d-0224-41fc-84b3-e346537016e4 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 1f3d314d-0224-41fc-84b3-e346537016e4 | — | — | — | — | passed |
| chief-route-task-management | 200 | 60565972-ce8c-4c67-8fc8-48347aa08ff5 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 60565972-ce8c-4c67-8fc8-48347aa08ff5 | — | — | — | — | passed |
| chief-route-reflection | 200 | 25de500c-5ade-4655-a0ec-2c1e20584143 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 25de500c-5ade-4655-a0ec-2c1e20584143 | — | — | — | — | passed |
| debug-state-insight | 200 | 8269beca-e04b-4132-9872-1a7d80021e56 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 8269beca-e04b-4132-9872-1a7d80021e56 | — | — | — | — | passed |
| debug-task-management | 200 | a3b420ca-01c7-4d65-95fd-73338bfacd4f | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | a3b420ca-01c7-4d65-95fd-73338bfacd4f | — | — | — | — | passed |
| debug-progress-feedback | 200 | b433e23f-e46d-4345-8ae6-3e8d83b24f8b | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | b433e23f-e46d-4345-8ae6-3e8d83b24f8b | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 7fcfb2cf-52c1-498a-b989-d963a259005b | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 7fcfb2cf-52c1-498a-b989-d963a259005b | — | — | — | — | passed |
| debug-reflection | 200 | e9d323ef-97f4-4ae7-b96c-fc3faa739c85 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | e9d323ef-97f4-4ae7-b96c-fc3faa739c85 | — | — | — | — | passed |
| debug-automation | 200 | b2d2e215-9440-4f76-bfc5-91b8e33626a0 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | b2d2e215-9440-4f76-bfc5-91b8e33626a0 | — | — | — | — | passed |
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
| web-dashboard-summary | 200 | — | — | — | — | — | passed |
| web-goalflow-overview | 200 | — | — | — | — | — | passed |
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| full-regression | ERR | — | — | — | — | — | fetch failed |

## Phase 3 Cluster Preferred

- 状态：`passed`
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
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | 35359ed0-8f0e-4c84-ba89-44cdc38a45bd | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 1d5125aa-0880-4210-a05d-ef5dd03b8076 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 23982f16-8a97-4243-a6cf-b6a0fb318341 | — | — | — | — | passed |
| probe-chief-agent | 200 | b9d51bc3-c7a6-4faf-965f-c08bef6c409b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | b9d51bc3-c7a6-4faf-965f-c08bef6c409b | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 91c2b74c-7a1a-495e-866c-f87531fbdbe0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 91c2b74c-7a1a-495e-866c-f87531fbdbe0 | — | — | — | — | passed |
| probe-task-management-agent | 200 | c364ecbf-700b-4a18-9b24-246ae31784be | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | c364ecbf-700b-4a18-9b24-246ae31784be | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | a198ecec-1237-4b1a-8fb3-526b1566a1b5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | a198ecec-1237-4b1a-8fb3-526b1566a1b5 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 4b887a1f-4eee-46e1-a5e0-11032578809d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 4b887a1f-4eee-46e1-a5e0-11032578809d | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 986c7ee1-b945-4caf-9de8-d132626d3cbe | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 986c7ee1-b945-4caf-9de8-d132626d3cbe | — | — | — | — | passed |
| probe-automation-agent | 200 | 3ed1b1ca-1f80-4494-b8c6-f3f1c0860413 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 3ed1b1ca-1f80-4494-b8c6-f3f1c0860413 | — | — | — | — | passed |
| chief-route-recovery | 200 | b183d845-951e-49a3-883f-e17d0d0eb182 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | b183d845-951e-49a3-883f-e17d0d0eb182 | — | — | — | — | passed |
| chief-route-task-management | 200 | 95d4f2e5-e21b-4a9c-adb0-953480f7cf5d | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | 95d4f2e5-e21b-4a9c-adb0-953480f7cf5d | — | — | — | — | passed |
| chief-route-reflection | 200 | ed58ddda-61c6-4e2b-8aac-cca9e3de15f8 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | ed58ddda-61c6-4e2b-8aac-cca9e3de15f8 | — | — | — | — | passed |
| debug-state-insight | 200 | f5741d9c-5ea3-401d-8c7e-4c138bcbb447 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | f5741d9c-5ea3-401d-8c7e-4c138bcbb447 | — | — | — | — | passed |
| debug-task-management | 200 | b461cb33-310f-42d5-96f0-f498bdf04121 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | b461cb33-310f-42d5-96f0-f498bdf04121 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 0b8272d3-fec4-486a-ab7d-51e4b57e577c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 0b8272d3-fec4-486a-ab7d-51e4b57e577c | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 80428c57-9252-4418-913b-1958659b2129 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 80428c57-9252-4418-913b-1958659b2129 | — | — | — | — | passed |
| debug-reflection | 200 | dc6b220a-26a1-4d45-9f83-93de208400ab | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | dc6b220a-26a1-4d45-9f83-93de208400ab | — | — | — | — | passed |
| debug-automation | 200 | 692bbce1-526d-4722-93ed-d968ebedd273 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 692bbce1-526d-4722-93ed-d968ebedd273 | — | — | — | — | passed |
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
| web-dashboard-summary | 200 | — | — | — | — | — | passed |
| web-goalflow-overview | 200 | — | — | — | — | — | passed |
| web-state-trends | 200 | — | — | — | — | — | passed |
| web-recovery-history | 200 | — | — | — | — | — | passed |
| web-reflections-overview | 200 | — | — | — | — | — | passed |
| web-inbox-overview | 200 | — | — | — | — | — | passed |
| full-regression | 200 | 93b87d01-9d6c-4067-bcf8-989687eb9ac4 | — | — | — | — | passed |
| full-regression-trace | 200 | 93b87d01-9d6c-4067-bcf8-989687eb9ac4 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 7b7664e0-846b-4228-83fc-8fe370c197de | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 7b7664e0-846b-4228-83fc-8fe370c197de | — | — | — | — | passed |

