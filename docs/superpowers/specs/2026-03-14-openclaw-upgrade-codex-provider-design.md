# OpenClaw 2026.3.13 Upgrade And Codex Provider Primary Design

## Goal

Upgrade the local OpenClaw installation from `2026.3.8` to `2026.3.13`, then switch the default OpenClaw model from `crs/gpt-5.4` to a provider derived from `/Users/claw/.codex/config.toml` and `/Users/claw/.codex/auth.json`.

## Current State

- Installed CLI version: `OpenClaw 2026.3.8 (3caab92)`
- Installed package path: `/Users/claw/.openclaw/lib/node_modules/openclaw`
- CLI shim path: `/Users/claw/.openclaw/bin/openclaw`
- Gateway service config: `/Users/claw/.openclaw/openclaw.json`
- Gateway port: `18789`
- Current default model: `crs/gpt-5.4`
- Current custom provider source: generated `~/.openclaw/agents/main/agent/models.json`

## Constraints

- Do not expose secrets from `.codex/auth.json` or OpenClaw config in terminal output.
- Preserve gateway bind/port and existing OpenClaw state under `~/.openclaw`.
- Keep a rollback path by backing up config before changes.
- Prefer exact-version install (`2026.3.13`) instead of floating `latest`.

## Chosen Approach

1. Back up `openclaw.json` and `~/.openclaw/agents/main/agent/models.json`.
2. Upgrade the installed npm package in place under `~/.openclaw`.
3. Map `.codex` provider settings into `models.providers` in `openclaw.json`.
4. Update agent default model to the `.codex`-derived provider and keep `crs/gpt-5.4` as a fallback.
5. Restart the gateway so generated `models.json` and runtime state pick up the new provider.
6. Verify version, gateway health, and resolved model status.

## Provider Mapping

- Source provider definition:
  - `/Users/claw/.codex/config.toml`
  - `/Users/claw/.codex/auth.json`
- Target OpenClaw provider:
  - Provider id: `codex`
  - API mode: `openai-responses`
  - Model id: `gpt-5.4`
  - Base URL: copied from `.codex/config.toml`
  - API key: copied from `.codex/auth.json`

## Safety And Rollback

- Backups will be written with a timestamp suffix next to the original files.
- If `openclaw models status` or `openclaw gateway status` fails after migration:
  - restore the two backup files
  - restart the gateway
  - confirm the default model returns to `crs/gpt-5.4`

## Verification

- `openclaw --version`
- `openclaw gateway status`
- `openclaw models status`
- inspect generated `~/.openclaw/agents/main/agent/models.json` for the new provider id

