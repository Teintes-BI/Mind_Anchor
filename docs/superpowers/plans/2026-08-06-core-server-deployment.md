# MindAnchor Core Server Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the MindAnchor Gateway and its persistent user state on `47.104.73.144`, with private client access through SSH forwarding and an external OpenAI-compatible model provider.

**Architecture:** The server runs the API as the stateful core, persisting data under the dedicated `claw` account. It listens only on loopback; macOS, Windows, and mobile development clients reach it using authenticated SSH forwarding. A low-memory server must not host a local model; model calls use a configured external compatible endpoint and API key stored outside Git.

**Tech Stack:** Node.js 22, pnpm, systemd user service, OpenSSH, Fastify API, JSON state store, external OpenAI-compatible model API.

---

### Task 1: Preserve and validate the current state store

**Files:**
- Read: `/home/claw/.local/share/mindanchor-api/mindanchor.json`
- Create: `/home/claw/.local/share/mindanchor-api/backups/mindanchor-<UTC timestamp>.json`

- [ ] **Step 1: Stop writes for the backup window**

Run:

```bash
systemctl --user stop mindanchor-api
```

Expected: `systemctl --user is-active mindanchor-api` returns `inactive`.

- [ ] **Step 2: Create an owner-only timestamped backup**

Run:

```bash
install -d -m 700 /home/claw/.local/share/mindanchor-api/backups
cp --preserve=mode,timestamps /home/claw/.local/share/mindanchor-api/mindanchor.json \
  /home/claw/.local/share/mindanchor-api/backups/mindanchor-$(date -u +%Y%m%dT%H%M%SZ).json
chmod 600 /home/claw/.local/share/mindanchor-api/backups/mindanchor-*.json
```

Expected: one backup exists and is owned by `claw` with mode `600`.

- [ ] **Step 3: Validate state JSON before restart**

Run:

```bash
node -e "JSON.parse(require('node:fs').readFileSync('/home/claw/.local/share/mindanchor-api/mindanchor.json', 'utf8')); console.log('state-json-valid')"
```

Expected: `state-json-valid`.

- [ ] **Step 4: Restart the existing service**

Run:

```bash
systemctl --user start mindanchor-api
curl --fail http://127.0.0.1:3001/health
```

Expected: the health endpoint returns JSON with `ok: true`.

### Task 2: Create a production-only secret environment file

**Files:**
- Create: `/home/claw/.config/mindanchor/core.env`
- Modify: `/home/claw/.config/systemd/user/mindanchor-api.service`

- [ ] **Step 1: Generate the local authentication signing secret**

Run:

```bash
install -d -m 700 /home/claw/.config/mindanchor
umask 077
openssl rand -base64 48
```

Expected: a newly generated random value is printed once and is not copied into shell history or Git.

- [ ] **Step 2: Create the restricted environment file**

Create `/home/claw/.config/mindanchor/core.env` with exactly these non-secret settings plus the generated secret and the approved external model values:

```ini
NODE_ENV=production
MINDANCHOR_API_HOST=127.0.0.1
MINDANCHOR_API_PORT=3001
MINDANCHOR_DATA_FILE=/home/claw/.local/share/mindanchor-api/mindanchor.json
MINDANCHOR_AGENT_MODE=openai-compatible
MINDANCHOR_AUTH_DEV_BYPASS=false
MINDANCHOR_AUTH_JWT_SECRET=<generated random secret>
MINDANCHOR_DEFAULT_MODEL_BASE_URL=<approved HTTPS OpenAI-compatible endpoint>
MINDANCHOR_DEFAULT_MODEL_API_KEY=<approved model API key>
MINDANCHOR_DEFAULT_MODEL_NAME=<approved model name>
MINDANCHOR_DEFAULT_MODEL_WIRE_API=responses
MINDANCHOR_DEFAULT_MODEL_REASONING_EFFORT=high
MINDANCHOR_DEFAULT_MODEL_DISABLE_RESPONSE_STORAGE=true
```

Run:

```bash
chmod 600 /home/claw/.config/mindanchor/core.env
```

Expected: only `claw` can read the file; it is not inside the Git checkout.

- [ ] **Step 3: Switch the service to the protected environment**

Replace the development environment lines in `/home/claw/.config/systemd/user/mindanchor-api.service` with:

```ini
EnvironmentFile=/home/claw/.config/mindanchor/core.env
ExecStart=/usr/bin/node /home/claw/workspace/Mind_Anchor/apps/api/dist/src/index.js
```

Keep these controls unchanged:

```ini
NoNewPrivileges=true
PrivateTmp=true
IPAddressDeny=any
IPAddressAllow=127.0.0.0/8
```

- [ ] **Step 4: Reload and verify the private listener**

Run:

```bash
systemctl --user daemon-reload
systemctl --user restart mindanchor-api
systemctl --user is-active mindanchor-api
ss -ltnp | grep '127.0.0.1:3001'
curl --fail http://127.0.0.1:3001/health
```

Expected: service is `active`, only `127.0.0.1:3001` is listening, and the health call succeeds.

### Task 3: Verify real-model routing without disclosing secrets

**Files:**
- Read: `apps/api/src/env.ts`
- Read: `apps/api/src/routes/debug.ts`

- [ ] **Step 1: Confirm the safe configuration audit**

Run:

```bash
curl --fail --silent http://127.0.0.1:3001/debug/agent-configs
```

Expected: response has `mode: "openai-compatible"`, `hasApiKey: true`, and does not contain the API key value.

- [ ] **Step 2: Run the provider-direct smoke test through the server configuration**

Run:

```bash
cd /home/claw/workspace/Mind_Anchor
set -a
. /home/claw/.config/mindanchor/core.env
set +a
corepack pnpm test:core-phases:real:aligned -- --phases provider-direct --segments baseline --report-dir /home/claw/.local/share/mindanchor-api/test-results/provider-direct
```

Expected: provider-direct phase succeeds and no token appears in output or report files.

### Task 4: Validate client access through SSH forwarding

**Files:**
- Read: `apps/macos/Config/Debug.xcconfig`
- Read: `apps/desktop/src/main/index.ts`

- [ ] **Step 1: Start a tunnel from an authorized client**

Run on the client:

```bash
ssh -N -L 3001:127.0.0.1:3001 claw-mac-via-ali
```

Expected: the terminal remains connected and no password is requested when the private key is present.

- [ ] **Step 2: Prove the forwarded health endpoint**

Run from a second client terminal:

```bash
curl --fail http://127.0.0.1:3001/health
```

Expected: JSON response contains `ok: true`.

- [ ] **Step 3: Prove the server port is not publicly reachable**

Run from a host other than `47.104.73.144`:

```bash
curl --connect-timeout 5 http://47.104.73.144:3001/health
```

Expected: connection fails; only the SSH tunnel is supported.

### Task 5: Add operational recovery checks

**Files:**
- Create: `/home/claw/.local/share/mindanchor-api/OPERATIONS.md`

- [ ] **Step 1: Record service and backup commands without secrets**

Create `OPERATIONS.md` containing:

```markdown
# MindAnchor Core Operations

Status: `systemctl --user status mindanchor-api --no-pager`

Logs: `journalctl --user -u mindanchor-api -f`

Backup: stop the service, copy `mindanchor.json` into `backups/`, validate it with `node -e "JSON.parse(...)"`, then start the service.

Restore: stop the service, replace `mindanchor.json` with one validated backup, set mode `600`, then start the service and call `/health` through loopback.
```

- [ ] **Step 2: Verify automatic restart**

Run:

```bash
systemctl --user restart mindanchor-api
systemctl --user is-active mindanchor-api
curl --fail http://127.0.0.1:3001/health
```

Expected: `active` and a successful health response.
