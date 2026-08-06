# Wayfinder Safety and Privacy Incident Runbook

## Immediate stop

1. Press the mobile stop control, disable the desktop collector, and revoke the affected consent scope.
2. Do not send a corrective external message or delete evidence before exporting the incident metadata.
3. Record timestamp, user/source device, trace ID, event/situation/decision IDs, and the exact unexpected output. Exclude raw audio and health samples.

## Accidental capture and emergency exit

- **Accidental capture:** stop the source immediately, revoke its consent, quarantine the local capture directory, and retain only hashes, trace IDs, and bounded metadata. Never copy raw audio or health samples into an incident ticket.
- **Emergency stop:** use both the mobile stop control and the desktop collector disable control, then verify new chunks/summaries receive a consent rejection. Keep the pilot paused until the verification passes.
- **Exit:** close the clients and rotate the local pairing token if an unauthorized device was involved. Resuming requires a new pairing and explicit consent.

## Triage

- **Unconsented capture:** confirm the chunk/snapshot was rejected before ASR or policy; rotate the local pairing token if needed.
- **External-action attempt:** verify the action was `blocked` or `needs_confirmation` and that no network side effect occurred. If a side effect occurred, stop the pilot and manually notify the affected party outside MindAnchor.
- **Bystander/privacy exposure:** stop the source, remove temporary local media, and preserve only hashes/trace IDs needed for audit.
- **Medical or crisis language:** treat the text as an unsafe model output; do not rely on it for care. Seek an appropriate human/professional route independently.
- **Deletion failure:** do not restart collection. Export the current audit metadata, isolate the data file, and repair the deletion path before resuming.

## Recovery and closure

1. Run `node scripts/wayfinder-evaluation.mjs --fixtures docs/wayfinder/evaluation-scenarios.json`.
2. Re-run the export/delete smoke test against an isolated data file.
3. Document root cause, affected scope, retained evidence, remediation, and the explicit decision to resume or stop.
4. A high-risk incident remains open until the creator confirms no unhandled data or external action remains.

## Destruction after an incident

After the incident metadata is exported and the scope of evidence is agreed, call the authenticated `POST /wayfinder/delete` route for the affected user, re-run export, and verify that source and derived collections—including health summaries, memory candidates/items, and audit records—are empty. Destroy temporary exports only after that verification is archived.
