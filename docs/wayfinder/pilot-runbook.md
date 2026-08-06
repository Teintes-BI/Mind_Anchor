# Wayfinder Personal Pilot Runbook

This runbook is for the creator's adult personal wellness pilot only. It is not an organizational, child, or medical deployment guide.

## Start and consent

1. Start the local Gateway, OpenClaw stub/runtime, and Web client using the commands in `README.md`.
2. Open the Wayfinder consent panel and grant only the scopes needed for the current experiment (`manual_notes`, `foreground_short_audio`, or `health_summary`).
3. Confirm the source, retention class, model-sharing mode, and revoke control before sending any event.
4. Keep camera and continuous audio disabled. Start mobile audio only from the visible foreground control.

## Daily operation

1. Before a session, record the intended task and energy/focus check-in.
2. When a situation appears, confirm the summary before requesting options.
3. Choose an option explicitly; high-risk options must remain pending until the approval control is acknowledged.
4. At the end of the day, record outcome, feeling, rating, and whether the prediction was useful.
5. Pause a source immediately if it produces a wrong candidate, repeated reminder, or unexpected data.

## Daily pause, emergency stop, and exit

- **Daily pause:** at the end of each session, tap the mobile stop control, pause every active source in the consent panel, and record the last situation/decision ID. Do not leave the microphone or health sync running unattended.
- **Emergency stop:** if an unconsented capture, bystander capture, unsafe instruction, or unexpected external action appears, press stop first, disable the desktop collector, revoke the affected scope, and preserve only trace IDs and hashes for triage.
- **Exit:** close the Web/Desktop clients after confirming all foreground sessions are ended. A later restart requires a fresh, visible consent action; no source resumes automatically.

## Data controls

- Export with the authenticated `POST /wayfinder/export` route or `node scripts/wayfinder-export.mjs --input <fixture> --user <user-id> --format markdown --output <file>`.
- Delete with the authenticated `POST /wayfinder/delete` route. Re-run export and confirm every collection for the user is empty.
- Revoke consent from the Wayfinder consent panel; subsequent audio/health ingestion must be rejected or ignored.
- Keep export files outside the production data directory and delete them after inspection.
- **Destruction:** export the audit metadata first, call the authenticated `POST /wayfinder/delete` route, re-run export after deletion, and confirm every collection (including health summaries, memory, and audit events) is empty. Destroy temporary export files after verification.

## Pilot evidence

For every day, keep the date, source scopes, situation IDs, option IDs, decision IDs, outcome IDs, health summary provenance, and any pause/revoke event. Do not store raw audio or platform health samples in the pilot log.

Before a pilot build, run the reusable interruption scenario against the intended API:

```bash
MINDANCHOR_API_BASE_URL=http://127.0.0.1:3001 \
MINDANCHOR_API_TOKEN=<authenticated-token> \
corepack pnpm scenario:wayfinder-interruption
```

The command must report `ok: true`, `optionCount: 3`, and IDs for the situation, selected option, decision, and outcome. It uses the scenario "I am finishing the main analysis, but a colleague asks me to send a preliminary result this afternoon" and verifies the final decision history.

## Stop conditions

Stop collection and follow the safety runbook when an external action is attempted, a bystander is captured, an unconsented source is processed, a deletion check fails, or a model emits a diagnosis/command instead of a bounded suggestion.
