# Local development

## Runtime assumptions

- The portable Node runtime lives under `/Users/claw/mindanchor/.tools/node`.
- Use `pnpm` via Corepack; the previous `npm workspaces` flow is no longer the primary path.
- `apps/api` behaves as the Lobster Gateway and can simulate OpenClaw-cluster outputs when `MINDANCHOR_AGENT_MODE=stub`.
- Model routing is now agent-name-based: each OpenClaw agent can override its own provider config, but all of them can temporarily share the same GPT-5.4 endpoint through the default model variables.

## Bootstrapping

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm install
cp .env.example .env.local
pnpm dev:openclaw
pnpm dev:openclaw-runtime
pnpm dev:api
pnpm dev:web
pnpm dev:desktop
```

## Recommended environment

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

## Gateway-facing API summary

- `POST /devices/register`
- `POST /devices/heartbeat`
- `POST /media/upload-sessions`
- `POST /media/upload-sessions/:sessionId/parts`
- `POST /media/upload-sessions/:sessionId/complete`
- `GET /client/inbox`
- `POST /client/inbox/:messageId/ack`
- `POST /health/snapshots`
- `GET /health/latest`
- `POST /goals`
- `POST /tasks`
- `PATCH /tasks/:taskId`
- `POST /sessions/start`
- `POST /sessions/end`
- `POST /state/signals/batch`
- `POST /state/checkins`
- `GET /state/latest`
- `GET /dashboard/summary`
- `GET /reflections/latest`

## Web read-model endpoints

- `GET /goalflow/overview`
- `GET /state/trends`
- `GET /recovery/history`
- `GET /reflections/overview`
- `GET /client/inbox/overview`
- `GET /debug/openclaw/adapter`

See `docs/web-console-read-models.md` for the page-to-endpoint mapping.
See `docs/web-console-smoke-checklist.md` for the stub / provider-direct / cluster-preferred validation flow.
See `docs/macos-install-and-first-run.md` for the native macOS first-run path.
See `docs/macos-mainline-runbook.md` for the current macOS mainline acceptance flow.
See `docs/macos-pre-release-checklist.md` for the current pre-release gate.
See `docs/gateway-openclaw-guided-install.md` for the V1 self-hosted server setup flow.
See `docs/macos-v1-install-guide.md` for the V1 Mac-client install flow.
See `docs/macos-v1-release-checklist.md` for the V1 release gate.
See `docs/macos-release-runbook.md` for the macOS archive / DMG / signing-ready pipeline.
See `docs/macos-apple-signing-final-steps.md` for the final Apple credential handoff.
See `docs/openclaw-cluster-smoke-checklist.md` for real external cluster end-to-end smoke.
See `docs/openclaw-production-runtime-deployment.md` for single-user production runtime deployment.
See `docs/openclaw-production-runtime-ops-guide.md` for runtime operations / rollback / logs.
See `docs/openclaw-cluster-smoke-report-template.md` for recording one actual smoke run.
See `docs/openclaw-cluster-first-smoke-report-2026-03-07.md` for the first real smoke report sample.
See `docs/local-cluster-manual-verification.md` for page-by-page manual verification on the local cluster.

## Web console smoke

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
MINDANCHOR_API_URL=http://127.0.0.1:3001 bash scripts/smoke-web-console.sh
```

## External OpenClaw cluster smoke

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
bash scripts/new-openclaw-cluster-smoke-report.sh 2026-03-07
OPENCLAW_HOST=0.0.0.0 OPENCLAW_PORT=8787 pnpm dev:openclaw
MINDANCHOR_API_URL=http://127.0.0.1:3001 \
MINDANCHOR_OPENCLAW_BASE_URL=http://your-openclaw-host:8787 \
bash scripts/smoke-openclaw-cluster.sh
```

默认会自动生成 / 追加当天的 smoke report；如需自定义文件名，可设置：

```bash
MINDANCHOR_CLUSTER_SMOKE_REPORT_FILE=docs/openclaw-cluster-smoke-report-my-host.md
```

## Local cluster manual verification prep

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
MINDANCHOR_API_URL=http://127.0.0.1:3001 \
MINDANCHOR_WEB_URL=http://127.0.0.1:5173 \
bash scripts/prepare-local-cluster-manual-check.sh
```

默认会把本次人工验收准备信息追加到当前 cluster smoke report。

## One-command local verification stack

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm dev:local-cluster-stack
```

它会同时拉起：

- 本地最小 OpenClaw 兼容服务
- Gateway API（cluster-preferred 指向本地 cluster）
- Web UI

## Production runtime service

```bash
export PATH="$PWD/.tools/node/bin:$PATH"
corepack pnpm start:openclaw-runtime-lan
corepack pnpm status:openclaw-runtime-lan
corepack pnpm health:openclaw-runtime-lan
corepack pnpm restart:openclaw-runtime-lan
corepack pnpm stop:openclaw-runtime-lan
```

如果要安装 macOS 自启动：

```bash
corepack pnpm install:openclaw-runtime-launchd
corepack pnpm status:openclaw-runtime-launchd
```

## OpenClaw cluster notes

- In production, the OpenClaw cluster should run on a non-work device or remote host.
- In local development, the gateway uses deterministic stub outputs unless you wire compatible endpoints.
- The gateway resolves per-agent config in this order: agent-specific env vars → shared default model env vars → legacy OpenAI/Qwen compatibility env vars.
- Per-agent env prefixes use the normalized agent name, for example `MINDANCHOR_AGENT_STATE_INSIGHT_AGENT_*` and `MINDANCHOR_AGENT_INTERRUPTION_RECOVERY_AGENT_*`.
- Feishu / Telegram adapters are optional. If the webhook or bot credentials are absent, notification dispatch gracefully falls back to `desktop_local`.
- The current implementation keeps the old Android desktop bridge as a fallback, but the target architecture is client → gateway → remote OpenClaw cluster.

## Agent config debugging

- `GET /debug/agent-configs` returns the resolved safe config for every agent, including whether a field differs from the shared default.
- `GET /debug/model-probe/:agentName` runs a real live probe against the configured provider for that agent.
- `GET /debug/regressions/matrix-cases` and `POST /debug/regressions/matrix-run` expose the lightweight per-agent override matrix runner.
- The Web `Agent Lab` page now exposes the resolved config audit, the full regression suite, and the override matrix runner.
