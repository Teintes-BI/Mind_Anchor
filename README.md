# MindAnchor Gateway MVP

MindAnchor now treats user-deployed OpenClaw infrastructure as the system brain. The clients in this repository act as thin data ingress/egress surfaces, while the gateway/API layer exposes a compatible REST surface and local stub behavior for development.

## Workspaces

- `apps/api` — Lobster Gateway / compatibility API, upload session management, JSON dev storage, and OpenClaw-cluster-friendly read models
- `apps/web` — React dashboard, GoalFlow, inbox ack flow, agent debug lab, and reflection views
- `apps/desktop` — existing desktop collector and Android bridge fallback
- `apps/android-recorder` — Android audio beta scaffold retained as an optional fallback track
- `packages/domain` — shared Zod schemas for gateway, media, health, inbox, and OpenClaw skill contracts
- `openclaw` — restored local cluster runtime entrypoints and skill schemas used by Gateway tests and phased cluster verification

## Handoff

- Latest cross-machine development handoff: `docs/development-handoff-2026-03-07.md`
- Final product target description: `docs/final-product-description.md`
- macOS mainline runbook: `docs/macos-mainline-runbook.md`
- macOS notification recovery HTML report entry: `corepack pnpm report:macos:openclaw-registry-notification-recovery`
- macOS Notification Center click diagnostics entry: `corepack pnpm diagnose:macos:notification-center-click`
- OpenClaw mainline acceptance entry: `corepack pnpm accept:openclaw-mainline`
- macOS conversation coach Phase 1 runbook: `docs/runbooks/macos-conversation-coach-phase1-local-test.md`
- macOS agent team V1 local runbook: `docs/runbooks/macos-agent-team-v1-local-test.md`
- macOS install / first run guide: `docs/macos-install-and-first-run.md`
- macOS pre-release checklist: `docs/macos-pre-release-checklist.md`
- Gateway + OpenClaw guided install: `docs/gateway-openclaw-guided-install.md`
- macOS V1 install guide: `docs/macos-v1-install-guide.md`
- macOS V1 release checklist: `docs/macos-v1-release-checklist.md`
- macOS release engineering runbook: `docs/macos-release-runbook.md`
- macOS Apple signing final steps: `docs/macos-apple-signing-final-steps.md`
- MindAnchor V1 completion report: `docs/mindanchor-v1-completion-report-2026-03-21.md`
- Core phased test runbook: `docs/core-phase-test-runbook.md`
- Core phased provider drift diagnose entry: `corepack pnpm diagnose:core-phases:provider-drift`
- Core phased real aligned entry: `corepack pnpm test:core-phases:real:aligned`
- M5 production runtime checklist: `docs/m5-production-runtime-completion-checklist.md`
- M5 production runtime deployment guide: `docs/openclaw-production-runtime-deployment.md`
- M5 production runtime ops guide: `docs/openclaw-production-runtime-ops-guide.md`
- M5 production runtime smoke report: `docs/openclaw-production-runtime-smoke-report-2026-03-08.md`
- M5 production runtime manual verification: `docs/openclaw-production-runtime-manual-verification-2026-03-08.md`
- Web console read-model inventory: `docs/web-console-read-models.md`
- Web console smoke checklist: `docs/web-console-smoke-checklist.md`
- External OpenClaw cluster smoke checklist: `docs/openclaw-cluster-smoke-checklist.md`
- External OpenClaw cluster smoke report template: `docs/openclaw-cluster-smoke-report-template.md`
- First cluster smoke sample report: `docs/openclaw-cluster-first-smoke-report-2026-03-07.md`
- Local cluster manual verification guide: `docs/local-cluster-manual-verification.md`
- Unified execution spec: `docs/spec.md`

The `Agent Lab` page now supports one-click debug scenario seeding, persisted run history, a full multi-agent regression run, a targeted override matrix regression runner, and a resolved agent config audit so you can replay flows and verify which model config each agent is actually using.

## Package management

Use `pnpm`, not the old npm workspace flow.

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm install
pnpm dev:openclaw
pnpm dev:api
pnpm dev:web
pnpm dev:desktop
pnpm dev:local-cluster-stack
pnpm test:core-phases:local
pnpm diagnose:core-phases:provider-drift
pnpm test:core-phases:real:aligned -- --phases provider-direct --segments baseline,probes
pnpm new:cluster-smoke-report
pnpm smoke:web-console
pnpm smoke:cluster
```

`pnpm smoke:cluster` now auto-creates/appends a dated smoke report under `docs/`.
`pnpm prepare:local-cluster-ui-check` appends a manual-verification prep snapshot to that report.

V1 preflight check:

```bash
bash scripts/preflight-v1-stack.sh \
  --gateway-url http://127.0.0.1:3001 \
  --openclaw-url http://127.0.0.1:8787
```

macOS release candidate:

```bash
corepack pnpm check:macos:signing
corepack pnpm test:macos:release
corepack pnpm release:macos
```

### Current runtime baseline

The repository baseline currently restores the **local** OpenClaw runtime path used by tests and cluster-preferred local verification:

- `openclaw/local-cluster-server.mjs`
- `openclaw/local-runtime/server.mjs`
- `openclaw/skills/state-ingest-skill.schema.json`
- `openclaw/skills/notification-skill.schema.json`

These assets are sufficient for:

- `corepack pnpm --filter @mindanchor/api test`
- `corepack pnpm test:core-phases:local`
- local Gateway ↔ OpenClaw cluster-first verification

The older production-runtime / LAN launchd commands remain historical scaffolding and should not be treated as the current guaranteed local baseline until the production runtime assets are restored in-repo.

For `real` core-phase verification, if your Gateway default provider env may have drifted away from the current OpenClaw real profile, prefer:

```bash
corepack pnpm diagnose:core-phases:provider-drift
corepack pnpm test:core-phases:real:aligned
```

The aligned entry reads the active OpenClaw real profile and mirrors its provider config into Gateway `provider-direct` env before starting the phased runner.

## Runtime shape

- Clients collect signals, upload optional media, receive reminders, and render results.
- `apps/api` acts as the gateway and development stub for the remote OpenClaw cluster.
- OpenClaw-compatible business outputs now include behavior conclusions, client inbox messages, media upload sessions, video assessments, and health snapshots.
- Optional audio/video processing stays explicit-consent and defaults off.
- Every OpenClaw agent now uses its own agent-name-based model target. For the current phase, all of them can temporarily share the same GPT-5.4 endpoint via the default model config.
- Focus sessions now auto-push linked tasks into `in_progress`, and `POST /sessions/end` can optionally mark the linked task as `done`.

## Key endpoints

- `POST /devices/register`
- `POST /devices/heartbeat`
- `POST /media/upload-sessions`
- `POST /media/upload-sessions/:sessionId/parts`
- `POST /media/upload-sessions/:sessionId/complete`
- `GET /client/inbox`
- `POST /client/inbox/:messageId/ack`
- `POST /health/snapshots`
- `GET /health/latest`
- `GET /recovery/history`
- `POST /goals`
- `POST /tasks`
- `PATCH /tasks/:taskId`
- `POST /sessions/start`
- `POST /sessions/end`
- Existing MVP endpoints such as `POST /state/signals/batch`, `GET /state/latest`, `GET /dashboard/summary`, and `GET /reflections/latest` remain available.
- Recommended read-model endpoints also include `GET /goalflow/overview`, `GET /state/trends`, `GET /recovery/history`, `GET /reflections/overview`, and `GET /client/inbox/overview`.

## Environment

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
export MINDANCHOR_API_PORT=3001
export MINDANCHOR_DATA_FILE="$PWD/data/mindanchor.json"
export MINDANCHOR_AGENT_MODE=stub
export MINDANCHOR_API_URL=http://localhost:3001
export MINDANCHOR_OPENCLAW_BASE_URL=http://localhost:8787
export MINDANCHOR_DEFAULT_MODEL_BASE_URL=https://gmncode.cn
export MINDANCHOR_DEFAULT_MODEL_API_KEY=replace-with-your-rotated-key
export MINDANCHOR_DEFAULT_MODEL_NAME=gpt-5.4
export MINDANCHOR_DEFAULT_MODEL_WIRE_API=responses
export MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT=xhigh
export MINDANCHOR_FEISHU_BOT_WEBHOOK_URL=
export MINDANCHOR_TELEGRAM_BOT_TOKEN=
export MINDANCHOR_TELEGRAM_CHAT_ID=
```

When `MINDANCHOR_AGENT_MODE=stub`, the gateway simulates remote OpenClaw outputs locally so the full flow remains runnable without a deployed cluster. When you switch to `openai-compatible`, the gateway resolves model config by agent name first and falls back to the shared default GPT-5.4 config. Feishu / Telegram notification adapters are optional and automatically fall back to `desktop_local` when not configured.

Per-agent overrides follow this naming pattern:

- `MINDANCHOR_AGENT_<AGENT_NAME>_BASE_URL`
- `MINDANCHOR_AGENT_<AGENT_NAME>_API_KEY`
- `MINDANCHOR_AGENT_<AGENT_NAME>_MODEL`
- `MINDANCHOR_AGENT_<AGENT_NAME>_WIRE_API`
- `MINDANCHOR_AGENT_<AGENT_NAME>_REASONING_EFFORT`
- `MINDANCHOR_AGENT_<AGENT_NAME>_DISABLE_RESPONSE_STORAGE`

Examples:

- `MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_MODEL`
- `MINDANCHOR_AGENT_REFLECTION_COACH_AGENT_REASONING_EFFORT`

For runtime verification, use:

- `GET /debug/agent-configs` — safe config audit for all agents
- `GET /debug/model-probe/:agentName` — live connectivity probe for one agent
- `GET /debug/regressions/matrix-cases` — lightweight override matrix presets
- `POST /debug/regressions/matrix-run` — run targeted per-agent override regressions
