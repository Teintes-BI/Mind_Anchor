# Core Phase Test Report

- Started: `2026-03-24T01:25:02.296Z`
- Completed: `2026-03-24T01:26:45.908Z`
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

- JSON report: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-25-02-295Z/report.json`
- Logs: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-25-02-295Z/logs`
- Responses: `/Users/claw/mindanchor/test-results/core-phase-2026-03-24T01-25-02-295Z/responses`

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
| seed-focus-recovery-loop | 200 | 576463b2-a345-48cc-b3c9-8bb49645ed8a | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | e9ddc42b-9800-45f1-a409-e5f2bd8ce9a2 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 1ed8d36b-3623-45ff-9ea2-22b5c3356dcd | — | — | — | — | passed |
| chief-route-recovery | 200 | d27d9bc4-2834-44a0-a164-0669730f9e0c | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | d27d9bc4-2834-44a0-a164-0669730f9e0c | — | — | — | — | passed |
| chief-route-task-management | 200 | bdc904cb-d75f-422a-a8a2-a6b9ca8fb008 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | bdc904cb-d75f-422a-a8a2-a6b9ca8fb008 | — | — | — | — | passed |
| chief-route-reflection | 200 | a1f4409a-ab47-42f9-ac24-37f00d1e8cd7 | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | a1f4409a-ab47-42f9-ac24-37f00d1e8cd7 | — | — | — | — | passed |
| debug-state-insight | 200 | f37aa32a-8978-4d46-be99-6598ff8dc823 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | f37aa32a-8978-4d46-be99-6598ff8dc823 | — | — | — | — | passed |
| debug-task-management | 200 | c05bef28-586a-4bb4-bc92-34844a810336 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | c05bef28-586a-4bb4-bc92-34844a810336 | — | — | — | — | passed |
| debug-progress-feedback | 200 | b40ceb01-8578-4332-a5ae-17648b6bb1e2 | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | b40ceb01-8578-4332-a5ae-17648b6bb1e2 | — | — | — | — | passed |
| debug-interruption-recovery | 200 | e6f39db6-6628-4e2b-a5d0-f3575c499eef | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | e6f39db6-6628-4e2b-a5d0-f3575c499eef | — | — | — | — | passed |
| debug-reflection | 200 | 7e01cc15-e2ba-4203-a44d-a4ed54dc1c14 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | 7e01cc15-e2ba-4203-a44d-a4ed54dc1c14 | — | — | — | — | passed |
| debug-automation | 200 | e88484c1-20e5-45dd-8ade-cd5616d4b7ed | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | e88484c1-20e5-45dd-8ade-cd5616d4b7ed | — | — | — | — | passed |
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
| full-regression | 200 | c7921a75-2551-4809-b037-93f5ac027d80 | — | — | — | — | passed |
| full-regression-trace | 200 | c7921a75-2551-4809-b037-93f5ac027d80 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | ee9577bb-8116-4939-9204-8fbef82421aa | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | ee9577bb-8116-4939-9204-8fbef82421aa | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 9318a55c-1c53-4a3f-b390-f6e2f965b179 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | 5a43adbf-69ee-4b51-b492-13b4aeca8944 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 9fe621a2-805c-42d9-accd-4700d8736a46 | — | — | — | — | passed |
| probe-chief-agent | 200 | 1648075c-5f57-4ad2-9f5e-89016e2f84a2 | provider-direct | /responses | false | — | passed |
| probe-chief-agent-trace | 200 | 1648075c-5f57-4ad2-9f5e-89016e2f84a2 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 904e536e-3793-4418-88e4-bdf9688071a1 | provider-direct | /responses | false | — | passed |
| probe-state-insight-agent-trace | 200 | 904e536e-3793-4418-88e4-bdf9688071a1 | — | — | — | — | passed |
| probe-task-management-agent | 200 | f168370e-8916-4cf8-8fa5-6a0002340bde | provider-direct | /responses | false | — | passed |
| probe-task-management-agent-trace | 200 | f168370e-8916-4cf8-8fa5-6a0002340bde | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | ec95374f-b069-4797-9a74-fdf6f93a7cf8 | provider-direct | /responses | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | ec95374f-b069-4797-9a74-fdf6f93a7cf8 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | fb427f7b-f519-44b5-9c34-4d7d0e3e60b5 | provider-direct | /responses | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | fb427f7b-f519-44b5-9c34-4d7d0e3e60b5 | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | 333fc6db-7d11-49b3-a327-8b699110804d | provider-direct | /responses | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | 333fc6db-7d11-49b3-a327-8b699110804d | — | — | — | — | passed |
| probe-automation-agent | 200 | b6190d82-b90d-4d69-b00a-d34231e366ea | provider-direct | /responses | false | — | passed |
| probe-automation-agent-trace | 200 | b6190d82-b90d-4d69-b00a-d34231e366ea | — | — | — | — | passed |
| chief-route-recovery | 200 | 24817692-3f42-46b9-9377-8f78c513557c | provider-direct | /responses | false | — | passed |
| chief-route-recovery-trace | 200 | 24817692-3f42-46b9-9377-8f78c513557c | — | — | — | — | passed |
| chief-route-task-management | 200 | 0351b65a-b50a-4655-9cbf-66b494b4d973 | provider-direct | /responses | false | — | passed |
| chief-route-task-management-trace | 200 | 0351b65a-b50a-4655-9cbf-66b494b4d973 | — | — | — | — | passed |
| chief-route-reflection | 200 | 1757d577-5f4d-46a1-b335-57547d6548ef | provider-direct | /responses | false | — | passed |
| chief-route-reflection-trace | 200 | 1757d577-5f4d-46a1-b335-57547d6548ef | — | — | — | — | passed |
| debug-state-insight | 200 | 887e9f82-574f-4633-99d7-5f7ec85fe989 | provider-direct | /responses | false | — | passed |
| debug-state-insight-trace | 200 | 887e9f82-574f-4633-99d7-5f7ec85fe989 | — | — | — | — | passed |
| debug-task-management | 200 | 79d31797-b221-4fbc-b85e-ad443b64f7d1 | provider-direct | /responses | false | — | passed |
| debug-task-management-trace | 200 | 79d31797-b221-4fbc-b85e-ad443b64f7d1 | — | — | — | — | passed |
| debug-progress-feedback | 200 | 50e8495e-8be9-446f-af1f-50e2b79f2c6d | provider-direct | /responses | false | — | passed |
| debug-progress-feedback-trace | 200 | 50e8495e-8be9-446f-af1f-50e2b79f2c6d | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 1e85d34b-7b0e-411c-97aa-66bdd9a68be7 | provider-direct | /responses | false | — | passed |
| debug-interruption-recovery-trace | 200 | 1e85d34b-7b0e-411c-97aa-66bdd9a68be7 | — | — | — | — | passed |
| debug-reflection | 200 | e6d73e08-fd87-4dbb-9cce-f36ea4b30f06 | provider-direct | /responses | false | — | passed |
| debug-reflection-trace | 200 | e6d73e08-fd87-4dbb-9cce-f36ea4b30f06 | — | — | — | — | passed |
| debug-automation | 200 | 57032621-43c2-4786-856c-b0288fc497cd | provider-direct | /responses | false | — | passed |
| debug-automation-trace | 200 | 57032621-43c2-4786-856c-b0288fc497cd | — | — | — | — | passed |
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
| full-regression | 200 | a67bb353-a0d7-4137-95b3-6c29d1bc8e9e | — | — | — | — | passed |
| full-regression-trace | 200 | a67bb353-a0d7-4137-95b3-6c29d1bc8e9e | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 1d5ef85d-eda6-4211-9e1d-91730f4bdd78 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 1d5ef85d-eda6-4211-9e1d-91730f4bdd78 | — | — | — | — | passed |

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
| seed-focus-recovery-loop | 200 | 06a52e0e-e5d2-416a-bd81-3ef36c32d2e0 | — | — | — | — | passed |
| seed-goal-reprioritization | 200 | f3cc2ab9-9d2e-4a01-b0e1-32f8ec55cc31 | — | — | — | — | passed |
| seed-weekly-reflection-mix | 200 | 36ef04de-df1b-47ec-a793-64076c1b6578 | — | — | — | — | passed |
| probe-chief-agent | 200 | db2d89d0-22c4-477e-8e91-bd676e9b23b9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-chief-agent-trace | 200 | db2d89d0-22c4-477e-8e91-bd676e9b23b9 | — | — | — | — | passed |
| probe-state-insight-agent | 200 | 6d92fca4-2efe-45e5-9aa7-869eccb319e6 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-state-insight-agent-trace | 200 | 6d92fca4-2efe-45e5-9aa7-869eccb319e6 | — | — | — | — | passed |
| probe-task-management-agent | 200 | b94f1628-3fff-4ddf-95fc-c6ccc2b36d0c | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-task-management-agent-trace | 200 | b94f1628-3fff-4ddf-95fc-c6ccc2b36d0c | — | — | — | — | passed |
| probe-progress-feedback-agent | 200 | 7e0446a5-d555-4e61-a419-1adab177bbc3 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-progress-feedback-agent-trace | 200 | 7e0446a5-d555-4e61-a419-1adab177bbc3 | — | — | — | — | passed |
| probe-interruption-recovery-agent | 200 | 86104e8b-20f8-4c0c-a701-8fb90355ef8f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-interruption-recovery-agent-trace | 200 | 86104e8b-20f8-4c0c-a701-8fb90355ef8f | — | — | — | — | passed |
| probe-reflection-coach-agent | 200 | cb175b1a-8818-4ed0-9b7b-861928d2e2e0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-reflection-coach-agent-trace | 200 | cb175b1a-8818-4ed0-9b7b-861928d2e2e0 | — | — | — | — | passed |
| probe-automation-agent | 200 | 261d18ce-3550-4fb5-8bb9-204f80fca2e9 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| probe-automation-agent-trace | 200 | 261d18ce-3550-4fb5-8bb9-204f80fca2e9 | — | — | — | — | passed |
| chief-route-recovery | 200 | 9a602999-f51e-40a1-948c-95f97c94681f | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-recovery-trace | 200 | 9a602999-f51e-40a1-948c-95f97c94681f | — | — | — | — | passed |
| chief-route-task-management | 200 | fdd8deb2-e725-4a6f-96ba-71076cf16a78 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-task-management-trace | 200 | fdd8deb2-e725-4a6f-96ba-71076cf16a78 | — | — | — | — | passed |
| chief-route-reflection | 200 | a5a5aba4-8032-42d5-b7f9-ab2bccf2606b | cluster | cluster:/v1/tasks/execute | false | — | passed |
| chief-route-reflection-trace | 200 | a5a5aba4-8032-42d5-b7f9-ab2bccf2606b | — | — | — | — | passed |
| debug-state-insight | 200 | 3dd45521-e6cf-4394-a5be-177cbe9af1ab | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-state-insight-trace | 200 | 3dd45521-e6cf-4394-a5be-177cbe9af1ab | — | — | — | — | passed |
| debug-task-management | 200 | 85167e59-ee4c-485c-a0cf-57d5522a7134 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-task-management-trace | 200 | 85167e59-ee4c-485c-a0cf-57d5522a7134 | — | — | — | — | passed |
| debug-progress-feedback | 200 | dfb8e0c6-3e32-47df-94ab-f7f4ae874bda | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-progress-feedback-trace | 200 | dfb8e0c6-3e32-47df-94ab-f7f4ae874bda | — | — | — | — | passed |
| debug-interruption-recovery | 200 | 96d0dab0-238d-42f3-a6e2-85f508d4cbf0 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-interruption-recovery-trace | 200 | 96d0dab0-238d-42f3-a6e2-85f508d4cbf0 | — | — | — | — | passed |
| debug-reflection | 200 | a5fdb7e7-99f4-400f-a314-ccc6e7174c18 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-reflection-trace | 200 | a5fdb7e7-99f4-400f-a314-ccc6e7174c18 | — | — | — | — | passed |
| debug-automation | 200 | a468dbc8-9749-48df-8414-c94c1af951f4 | cluster | cluster:/v1/tasks/execute | false | — | passed |
| debug-automation-trace | 200 | a468dbc8-9749-48df-8414-c94c1af951f4 | — | — | — | — | passed |
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
| full-regression | 200 | 5e3c0c05-54ef-4a29-a811-88fae1bee839 | — | — | — | — | passed |
| full-regression-trace | 200 | 5e3c0c05-54ef-4a29-a811-88fae1bee839 | — | — | — | — | passed |
| matrix-cases | 200 | — | — | — | — | — | passed |
| matrix-run | 200 | 9960648d-ab87-4b45-b5d7-f561f1285014 | — | — | — | — | passed |
| matrix-history | 200 | — | — | — | — | — | passed |
| matrix-run-trace | 200 | 9960648d-ab87-4b45-b5d7-f561f1285014 | — | — | — | — | passed |

