# OpenClaw Upgrade And Codex Provider Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade OpenClaw to `2026.3.13` and switch the default model to the `.codex` provider while preserving a rollback path.

**Architecture:** Update the installed npm package in place under `~/.openclaw`, then edit the runtime config so OpenClaw regenerates the main agent model registry with a `.codex`-derived provider. Keep the previous `crs` model as a fallback until verification passes.

**Tech Stack:** OpenClaw CLI, npm, JSON config, launchd gateway service

---

## Chunk 1: Backup And Inspect

### Task 1: Capture current runtime state

**Files:**
- Modify: `/Users/claw/.openclaw/openclaw.json`
- Modify: `/Users/claw/.openclaw/agents/main/agent/models.json`

- [ ] **Step 1: Create timestamped backups**

Run: `ts=$(date +%Y%m%d-%H%M%S) && cp /Users/claw/.openclaw/openclaw.json /Users/claw/.openclaw/openclaw.json.bak-$ts && cp /Users/claw/.openclaw/agents/main/agent/models.json /Users/claw/.openclaw/agents/main/agent/models.json.bak-$ts`
Expected: backup files exist with the same JSON content as the originals.

- [ ] **Step 2: Record current version and model state**

Run: `openclaw --version && openclaw models status && openclaw gateway status`
Expected: version shows `2026.3.8`, model status shows `crs/gpt-5.4`, gateway reports running on `127.0.0.1:18789`.

## Chunk 2: Upgrade OpenClaw

### Task 2: Install exact package version

**Files:**
- Modify: `/Users/claw/.openclaw/lib/node_modules/openclaw`

- [ ] **Step 1: Install OpenClaw 2026.3.13 in place**

Run: `npm install -g openclaw@2026.3.13 --prefix /Users/claw/.openclaw`
Expected: npm exits `0` and updates the package under `~/.openclaw/lib/node_modules/openclaw`.

- [ ] **Step 2: Verify upgraded CLI version**

Run: `openclaw --version`
Expected: `OpenClaw 2026.3.13`

## Chunk 3: Switch Primary Model

### Task 3: Update OpenClaw config to use the `.codex` provider

**Files:**
- Modify: `/Users/claw/.openclaw/openclaw.json`

- [ ] **Step 1: Read `.codex` provider inputs**

Run: parse `/Users/claw/.codex/config.toml` and `/Users/claw/.codex/auth.json` without printing secrets.
Expected: capture `base_url`, `wire_api`, and `OPENAI_API_KEY`.

- [ ] **Step 2: Write provider and primary model changes**

Implementation:
- ensure `models.providers.codex` exists with `.codex` base URL, API mode, and model catalog for `gpt-5.4`
- set `agents.defaults.model.primary` to `codex/gpt-5.4`
- ensure `agents.defaults.model.fallbacks` includes `crs/gpt-5.4`

Expected: config JSON stays valid and preserves unrelated OpenClaw settings.

## Chunk 4: Apply And Verify

### Task 4: Restart gateway and confirm effective model

**Files:**
- Modify: `/Users/claw/.openclaw/agents/main/agent/models.json`

- [ ] **Step 1: Restart the gateway**

Run: `openclaw gateway restart`
Expected: service restarts cleanly and binds again on `127.0.0.1:18789`.

- [ ] **Step 2: Verify effective model state**

Run: `openclaw models status`
Expected: default model is `codex/gpt-5.4` and `crs/gpt-5.4` appears as a fallback.

- [ ] **Step 3: Verify gateway health**

Run: `openclaw gateway status`
Expected: runtime active, RPC probe ok.

- [ ] **Step 4: Roll back if verification fails**

Run: restore the backup files and rerun `openclaw gateway restart`, `openclaw models status`.
Expected: previous working state is restored.
