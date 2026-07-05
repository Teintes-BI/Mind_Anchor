# Core Phase Test Report

- Started: `2026-03-09T16:12:19.719Z`
- Completed: `2026-03-09T16:39:01.344Z`
- API Base URL: `http://127.0.0.1:3024`
- Web Base URL: `http://127.0.0.1:4174`
- Cluster Mode: `local`
- Cluster Base URL: `http://127.0.0.1:8788`

## Phase Summary

| Phase | Status | Agent Mode | OpenClaw Base URL | Passed Steps |
| --- | --- | --- | --- | --- |
| Phase 1 Stub Baseline | passed | stub | — | 58/58 |
| Phase 2 Provider Direct | failed | openai-compatible | — | 64/65 |
| Phase 3 Cluster Preferred | failed | openai-compatible | http://127.0.0.1:8788 | 72/72 |

## Failures

- [provider-direct] web-reflections-overview: This operation was aborted
- [provider-direct] provider-direct-phase: This operation was aborted
- [cluster-preferred] cluster-preferred-phase: Cluster phase expected route=cluster, but probe-chief-agent-trace used unknown.

## Artifacts

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T16-12-19-718Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T16-12-19-718Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-09T16-12-19-718Z/responses`

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
| seed-focus-recovery-loop | 200 | 8e5e2398-5b47-4d67-8f92-c26c3d3ae038 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | f2a501dc-015f-4fee-9030-b6b419227081 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | c9d2e800-f1ac-4abb-beb7-494d177eb572 | — | — | — | — | passed |
| chief-route-recovery | 200 | bef00059-0598-4ed7-bc3c-22f4e6846c72 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | bef00059-0598-4ed7-bc3c-22f4e6846c72 | — | — | — | — | passed |
| chief-route-task-management | 200 | aa870f8f-f6bc-41af-a452-2795e00ae088 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | aa870f8f-f6bc-41af-a452-2795e00ae088 | — | — | — | — | passed |
| chief-route-reflection | 200 | 0debdaa5-6d91-42da-b500-3c56b018e3b8 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 0debdaa5-6d91-42da-b500-3c56b018e3b8 | — | — | — | — | passed |
| debug-state-insight | 200 | 4d6b8fc2-877a-46a0-9b32-10927731d4b6 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 4d6b8fc2-877a-46a0-9b32-10927731d4b6 | — | — | — | — | passed |
| debug-task-management | 200 | e39b51e1-f5b7-41cc-8772-69ca9e49607a | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | e39b51e1-f5b7-41cc-8772-69ca9e49607a | — | — | — | — | passed |
| debug-progress-feedback | 200 | 649f4ab8-7684-4765-8be4-ba1dda7aeb1b | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 649f4ab8-7684-4765-8be4-ba1dda7aeb1b | — | — | — | — | passed |
| debug-interruption-recovery | 200 | f40d0e8b-e9e4-4009-afea-4972bca2174a | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | f40d0e8b-e9e4-4009-afea-4972bca2174a | — | — | — | — | passed |
| debug-reflection | 200 | 14c1ceb1-dac3-4460-ab3f-8c791b952d5d | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 14c1ceb1-dac3-4460-ab3f-8c791b952d5d | — | — | — | — | passed |
| debug-automation | 200 | 0e9bce57-bbab-4fbc-84fc-fa270c90df23 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 0e9bce57-bbab-4fbc-84fc-fa270c90df23 | — | — | — | — | passed |
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
| full-regression | 200 | f12136de-8a15-437d-9d95-5801dd93c46d | — | — | — | — | passed |
| full-regression-trace | 200 | f12136de-8a15-437d-9d95-5801dd93c46d | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 4b2f2d57-d33f-4444-a142-d5029617b7d2 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 4b2f2d57-d33f-4444-a142-d5029617b7d2 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | a53a861f-60d6-4891-adee-86a7cecd6d62 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 6f0e3512-31c2-4252-a4c2-48592ad234e5 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 715191bc-92f8-4e91-826b-b99bc2d28302 | — | — | — | — | passed |
| probe-chief-agent | 200 | 5a4c2639-2171-4335-95da-1523f263b51b | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 5a4c2639-2171-4335-95da-1523f263b51b | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 012cf098-0a4a-4be6-a101-ec65358991f7 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 012cf098-0a4a-4be6-a101-ec65358991f7 | — | — | — | — | passed |
| probe-task-management-agent | 200 | e5b11de9-fb19-4c95-a5be-c80d725f6c0a | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | e5b11de9-fb19-4c95-a5be-c80d725f6c0a | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 8a6cc276-68f7-4bbc-a74c-07d64748eca8 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 8a6cc276-68f7-4bbc-a74c-07d64748eca8 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | ad80633a-6400-4764-855b-91ef19914c74 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | ad80633a-6400-4764-855b-91ef19914c74 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 433b7521-b35d-46c0-976f-56e5d637c578 | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 433b7521-b35d-46c0-976f-56e5d637c578 | — | — | — | — | passed |
| probe-automation-agent | 200 | a7e75bbb-f392-4c36-9499-282e4232e78e | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | a7e75bbb-f392-4c36-9499-282e4232e78e | — | — | — | — | passed |
| chief-route-recovery | 200 | 4d8b6b5f-5e51-4b90-a617-012ffda432d9 | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 4d8b6b5f-5e51-4b90-a617-012ffda432d9 | — | — | — | — | passed |
| chief-route-task-management | 200 | 648323ab-37d6-4d96-99ae-7c4d0b476f3d | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 648323ab-37d6-4d96-99ae-7c4d0b476f3d | — | — | — | — | passed |
| chief-route-reflection | 200 | 4034084b-5758-4858-98c5-5426dccc0778 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 4034084b-5758-4858-98c5-5426dccc0778 | — | — | — | — | passed |
| debug-state-insight | 200 | a600f94e-6190-493e-aa99-3eb0db8e0c37 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | a600f94e-6190-493e-aa99-3eb0db8e0c37 | — | — | — | — | passed |
| debug-task-management | 200 | 0e19ee28-6c51-4dec-8460-512000fc246e | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 0e19ee28-6c51-4dec-8460-512000fc246e | — | — | — | — | passed |
| debug-progress-feedback | 200 | ce1292ab-385f-41de-996f-b9c72a923588 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | ce1292ab-385f-41de-996f-b9c72a923588 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 275b5408-c01b-48ae-97dc-46e8a4545d41 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 275b5408-c01b-48ae-97dc-46e8a4545d41 | — | — | — | — | passed |
| debug-reflection | 200 | da40378b-1bfc-461d-bb77-cd6f574433ba | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | da40378b-1bfc-461d-bb77-cd6f574433ba | — | — | — | — | passed |
| debug-automation | 200 | 46d63e25-7edd-4533-a101-9e36a58f5e88 | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 46d63e25-7edd-4533-a101-9e36a58f5e88 | — | — | — | — | passed |
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
| web-reflections-overview | ERR | — | — | — | — | — | This operation was aborted |

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
| web-root | 200 | — | — | — | — | — | passed |
| web-tasks | 200 | — | — | — | — | — | passed |
| web-state | 200 | — | — | — | — | — | passed |
| web-recovery | 200 | — | — | — | — | — | passed |
| web-reflections | 200 | — | — | — | — | — | passed |
| web-inbox | 200 | — | — | — | — | — | passed |
| web-agents | 200 | — | — | — | — | — | passed |
| seed-focus-recovery-loop | 200 | ab0ea5ac-a6e6-48b2-b070-83f2d019fd8f | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 0f44502f-4c52-4d53-831a-f61a32a253e3 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 58c07b72-1202-4548-95f0-218a403309d3 | — | — | — | — | passed |
| probe-chief-agent | 200 | fe3884a1-7181-4e2f-88c6-8e790c5ea1d0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | fe3884a1-7181-4e2f-88c6-8e790c5ea1d0 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | bee79102-0ab6-4dad-bce0-1ba379f0d686 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | bee79102-0ab6-4dad-bce0-1ba379f0d686 | — | — | — | — | passed |
| probe-task-management-agent | 200 | ca236f46-c213-48f5-901c-1b91553487c0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | ca236f46-c213-48f5-901c-1b91553487c0 | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | a2a68546-08d9-4a99-bdea-e3c3b18779cc | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | a2a68546-08d9-4a99-bdea-e3c3b18779cc | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | a6bd9403-139c-486d-a68d-4baad7af96ed | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | a6bd9403-139c-486d-a68d-4baad7af96ed | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 257078e4-268c-4abe-8d25-bc431c0318f7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 257078e4-268c-4abe-8d25-bc431c0318f7 | — | — | — | — | passed |
| probe-automation-agent | 200 | 94161dd9-079f-4088-87ba-dc064ff992dd | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 94161dd9-079f-4088-87ba-dc064ff992dd | — | — | — | — | passed |
| chief-route-recovery | 200 | d92a492d-bb96-4fd7-8962-fe7c636dfc94 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | d92a492d-bb96-4fd7-8962-fe7c636dfc94 | — | — | — | — | passed |
| chief-route-task-management | 200 | d24d3959-8772-4d2b-90c0-7dbc2545da90 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | d24d3959-8772-4d2b-90c0-7dbc2545da90 | — | — | — | — | passed |
| chief-route-reflection | 200 | 72fe742b-8024-40f4-b486-60c5e13920a5 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | 72fe742b-8024-40f4-b486-60c5e13920a5 | — | — | — | — | passed |
| debug-state-insight | 200 | 361aa260-3bee-4eda-bdec-986587c92c13 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 361aa260-3bee-4eda-bdec-986587c92c13 | — | — | — | — | passed |
| debug-task-management | 200 | a2e46a48-9c17-4742-a6a0-8ea583b85a1c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | a2e46a48-9c17-4742-a6a0-8ea583b85a1c | — | — | — | — | passed |
| debug-progress-feedback | 200 | 4e13b509-b8b3-4a62-a9ae-3bdce0552ce7 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | 4e13b509-b8b3-4a62-a9ae-3bdce0552ce7 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | a69985ee-4b53-4e34-b994-ffb4b3cd92c2 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | a69985ee-4b53-4e34-b994-ffb4b3cd92c2 | — | — | — | — | passed |
| debug-reflection | 200 | f90c8f02-0883-4d36-8fc8-76fcf3bc7581 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | f90c8f02-0883-4d36-8fc8-76fcf3bc7581 | — | — | — | — | passed |
| debug-automation | 200 | 95b36ecc-0fd4-4133-a707-f67afc2f6a55 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | 95b36ecc-0fd4-4133-a707-f67afc2f6a55 | — | — | — | — | passed |
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
| full-regression | 200 | 51dc9347-ee38-48f2-9295-b86057add005 | — | — | — | — | passed |
| full-regression-trace | 200 | 51dc9347-ee38-48f2-9295-b86057add005 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | cbf943e0-99d6-4f08-af2f-9d3adbde3a77 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | cbf943e0-99d6-4f08-af2f-9d3adbde3a77 | — | — | — | — | passed |

