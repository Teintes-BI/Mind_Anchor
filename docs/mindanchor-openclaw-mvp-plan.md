# MindAnchor OpenClaw MVP Plan

## Status
- Status: planned only, not implemented
- Last updated: 2026-03-06
- Source baseline: [dev.md](/Users/claw/mindanchor/dev.md)
- Purpose: preserve enough product, architecture, and implementation context so a future conversation can resume without reconstructing prior decisions

## Project Intent
MindAnchor is a personal cognition and task management system. GoalFlow is its submodule for goal decomposition and task execution. The agreed V1 direction is not a full platform rebuild from scratch. It is a shortest-path MVP focused on state sensing and agent-driven task support.

The primary V1 loop is:
1. Desktop app collects lightweight behavior signals.
2. Signals are stored in the MindAnchor data layer.
3. OpenClaw orchestrates multiple agents.
4. Agents generate state assessments, task adjustments, recovery suggestions, and reflection reports.
5. Web app displays goals, task progress, state trends, and reports.

## Frozen Decisions
These decisions were explicitly chosen and should be treated as the current baseline unless changed deliberately.

- OpenClaw is the primary agent runtime and orchestration framework.
- The product ships as Web + Desktop, not Web-only.
- V1 is state-sensing first, not full feature parity with every module in `dev.md`.
- Initial sensing uses software behavior signals, not wearables.
- `chief-agent` uses GPT 5.4.
- All other business agents use a locally hosted Qwen model.
- Local Qwen should be reused through an existing serving stack if possible.
- If Qwen already runs on Ollama, use OpenClaw's Ollama support directly.
- If Qwen already runs behind an OpenAI-compatible endpoint, connect OpenClaw directly to that endpoint.
- Do not build a custom model gateway unless the two options above are unavailable.
- `chief-agent` may access full business context for orchestration.
- Model context still must exclude sensitive raw content such as typed text, screenshots, and chat message bodies.
- Supabase Cloud is the preferred MVP data platform to avoid building auth, storage, and realtime infrastructure.
- Desktop should use Electron first to minimize native integration risk and development time.
- V1 uses only first-party OpenClaw skills for core business flows.
- Third-party ClawHub skills are not allowed in the production-critical path for V1.
- This plan is archived only. No implementation has started yet.

## MVP Goal
Deliver a usable MVP with the least custom engineering work while still proving the product loop:
- Collect system idle and context signals.
- Assess user state.
- Connect state to task planning.
- Detect interruptions and suggest recovery.
- Show state and progress in a simple dashboard.
- Generate weekly and monthly reflection summaries.

## Non-Goals For V1
- No wearable integrations.
- No advanced emotion model pipeline.
- No screen capture or typed-content ingestion.
- No Slack, Telegram, or email channel integrations in the critical path.
- No high-permission automation execution.
- No Tool Builder Agent in V1.
- No custom auth or custom realtime infrastructure.
- No custom generic agent runtime.

## Reuse-First Architecture
The implementation should minimize bespoke infrastructure by reusing mature services and official tooling.

### Layers
- Desktop Collector
  - Electron app for signal capture and lightweight local state
- MindAnchor Data/API
  - thin business API and domain logic
  - business truth stored in database, not in agent memory
- OpenClaw Runtime
  - agents, skills, tool sandboxing, model routing, memory, dashboard, admin surfaces
- Web App
  - goal, task, state, recovery, and reflection UI

### Core Data Flow
1. Desktop captures `idle`, `lock/unlock`, `active app`, `window switch`, and `manual check-in`.
2. Client batches events to `POST /state/signals/batch`.
3. Backend normalizes and stores events, then creates a context snapshot for agent work.
4. `chief-agent` decides which downstream agent should act.
5. Local Qwen agents produce structured outputs.
6. Results are written back through MindAnchor APIs.
7. Web app reads and subscribes to summary data for display.

## Model And Agent Layout
Use OpenClaw as the single orchestration surface.

### Required Agents
- `chief-agent`
- `state-insight-agent`
- `task-management-agent`
- `progress-feedback-agent`
- `interruption-recovery-agent`
- `reflection-coach-agent`
- `automation-agent`

### Model Assignment
- `chief-agent -> GPT 5.4`
- `state-insight-agent -> local Qwen`
- `task-management-agent -> local Qwen`
- `progress-feedback-agent -> local Qwen`
- `interruption-recovery-agent -> local Qwen`
- `reflection-coach-agent -> local Qwen`
- `automation-agent -> local Qwen`

### Routing Rules
- `chief-agent` performs orchestration, prioritization, fallback, and cross-agent coordination.
- Business agents do the detailed reasoning and structured output generation.
- If local Qwen is unavailable, the system should queue, retry, or degrade gracefully.
- Do not automatically spill local-agent business inference to GPT 5.4.
- If GPT 5.4 is unavailable, preserve local workflows where possible and reduce the chief to simpler routing logic.

## Skills To Build
These remain first-party custom work and are the main reusable business layer.

- `state-ingest-skill`
- `state-score-skill`
- `goalflow-plan-skill`
- `task-reprioritize-skill`
- `progress-summary-skill`
- `interruption-recovery-skill`
- `reflection-report-skill`
- `notification-skill`

### Skill Rules
- Every skill must use explicit JSON-schema-shaped input and output.
- Skills must use minimum permissions.
- Core skills must not depend on third-party marketplace packages.
- Skills must call MindAnchor APIs instead of directly reading or writing the database.

## Minimum Domain Objects
These are the core business objects already identified and should anchor schema and API design.

- `Goal`
- `Task`
- `FocusSession`
- `StateSignalEvent`
- `StateAssessment`
- `Intervention`
- `RecoveryPlan`
- `ReflectionReport`

## Minimum External API
Keep the surface narrow for MVP.

- `POST /state/signals/batch`
- `POST /state/checkins`
- `GET /state/latest`
- `POST /goals`
- `POST /tasks`
- `POST /sessions/start`
- `POST /sessions/end`
- `POST /recovery/plan`
- `GET /dashboard/summary`
- `GET /reflections/latest`

## Reusable External Resources
These were identified as the highest-leverage resources to reduce build time.

### OpenClaw
- Official site: [OpenClaw](https://openclawdoc.com/)
- Agent overview: [OpenClaw Agents](https://www.openclawdoc.com/docs/agents/overview/)
- Built-in tools: [OpenClaw Tools](https://openclawdoc.com/docs/agents/tools/)
- Configuration: [OpenClaw Configuration](https://openclawdoc.com/en/docs/configuration/)
- Model docs: [OpenClaw Models](https://openclawdoc.com/docs/models/overview/)
- Local model docs: [OpenClaw Local Models](https://openclawdoc.com/docs/models/local-models/)

Use OpenClaw directly for:
- agent runtime
- tool execution and sandboxing
- model registration and routing
- built-in admin and dashboard surfaces
- terminal/admin channel

Do not rebuild these capabilities unless OpenClaw proves insufficient during implementation.

### Local Model Serving
- Ollama OpenAI-compatible docs: [Ollama OpenAI Compatibility](https://docs.ollama.com/api/openai-compatibility)

Preferred order:
1. Reuse existing Ollama-hosted Qwen via OpenClaw if available.
2. Reuse an existing OpenAI-compatible local serving endpoint if available.
3. Only then consider writing a compatibility layer.

### Data Platform
- Supabase quickstart: [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

Use Supabase Cloud for:
- Postgres
- Auth
- Storage
- Realtime

This removes the need to build custom auth, file storage, and realtime infrastructure in V1.

### Web UI
- Starter shell: [Vercel Admin Dashboard Template](https://vercel.com/templates/authentication/admin-dashboard-tailwind-postgres-react-nextjs)
- Charts: [shadcn/ui charts](https://ui.shadcn.com/charts)
- Schema-based forms: [react-jsonschema-form](https://rjsf-team.github.io/react-jsonschema-form/docs/)

Use these instead of building:
- dashboard shell
- chart wrappers
- generic settings forms

### Desktop Signals
- Idle and power state: [Electron powerMonitor](https://www.electronjs.org/docs/latest/api/power-monitor/)
- Window and app metadata: [get-windows](https://github.com/sindresorhus/get-windows)

Use Electron for V1 because it reduces native integration uncertainty compared with building a Tauri-first collector.

## What Should Be Deleted From The Original Larger Build Ambition
To control scope and time, the following should not be built in V1:

- custom agent runtime
- custom tool sandbox
- custom model router
- custom OpenAI-compatible gateway
- custom auth
- custom storage
- custom realtime push
- custom admin console
- Tool Builder Agent
- advanced emotion analysis pipeline
- wearable support
- external IM channels
- high-privilege automation execution

## Expected MVP Pages
Keep the UI narrow.

- Dashboard overview
- GoalFlow task page
- State trends page
- Reflection reports page

## Expected Desktop Signals
Keep the desktop collector narrow.

- system idle
- lock / unlock
- active application
- window switch
- manual self-check-in

## Privacy And Context Rules
- Do not collect typed raw text.
- Do not collect screenshots or screen frames.
- Do not collect chat message bodies.
- `chief-agent` may read full business context, but only from normalized business data and metadata.
- Downstream local agents should receive the smallest context slice needed for the task.

## Recommended Delivery Sequence
This is a planning baseline only. It has not started.

### Week 1
- OpenClaw installation and local validation
- Supabase project bootstrap
- Vercel dashboard template bootstrap
- Electron collector skeleton

### Weeks 2-3
- domain schema
- minimum API
- `chief-agent`
- local Qwen connection
- event ingestion

### Weeks 4-5
- state insight flow
- progress feedback flow
- dashboard views
- offline resend for desktop signals

### Weeks 6-7
- GoalFlow decomposition
- task reprioritization
- interruption recovery

### Weeks 8-9
- weekly and monthly reflection reporting
- notifications
- stability and permission hardening

### Weeks 10-11
- gray rollout buffer
- bug fixing buffer

## Test Baseline
These tests were already identified as minimum acceptance coverage.

### Unit
- state scoring
- interruption detection
- task reprioritization
- reflection generation
- skill schema validation

### Integration
- Electron event -> API -> OpenClaw -> local Qwen -> API write-back
- `chief-agent` routing to local agents
- local Qwen unavailable -> retry or degrade path
- Supabase realtime updates -> UI refresh

### End-To-End
- new user sign-in
- create goal
- start focus session
- interruption occurs
- recovery suggestion appears
- weekly report view works
- desktop offline batch replay works

### Performance Targets
- `chief-agent` routing P95 < 2s
- local agent inference P95 < 5s
- key page load P95 < 2s
- event loss rate < 1%
- core success rate >= 99%

## Resume Checklist For A Future Conversation
If a future session needs to start implementation, begin from these questions in order:
1. Is Qwen already running on Ollama or another OpenAI-compatible local endpoint?
2. Do we accept Supabase Cloud for MVP, or must all data infrastructure be self-hosted?
3. Should the desktop collector stay Electron-first, or is there now a hard requirement for Tauri?
4. Which OpenClaw version and config format should the repo target?
5. Which four pages should be implemented first if time is tighter than expected?

If no new constraints appear, implementation should proceed without reopening the broader architecture debate.

## Current Repository State
As of 2026-03-06, the repository only contains the original planning file:
- [dev.md](/Users/claw/mindanchor/dev.md)

No implementation scaffold was present when this document was created.
