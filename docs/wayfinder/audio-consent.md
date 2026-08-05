# Wayfinder Audio Consent

Wayfinder short-audio extraction is a user-started, foreground-only capability. It is not continuous listening.

## Required lifecycle

1. The user grants consent for `purpose=wayfinder_voice_candidate` and `scope=foreground_short_audio`.
2. The mobile session start request includes the returned `consentRef`.
3. Every audio chunk inherits that reference. Missing, paused, or revoked consent stops ASR and rejects the chunk before raw audio is persisted.
4. The transcriber receives the chunk ephemerally. The API stores only a bounded transcript excerpt, structured candidate, evidence reference, ASR metadata, and trace ID.
5. Candidates remain `awaiting_confirmation`; no real Task or external action is created automatically.
6. Revoking consent blocks new chunks. Existing derived summaries remain subject to their configured retention and export/delete controls.

## Default data policy

- `rawRetentionSeconds=0` is the default for Wayfinder extraction.
- The desktop bridge keeps raw chunks only in its existing local rolling buffer for the active session.
- Raw audio is not forwarded to the API unless `MINDANCHOR_WAYFINDER_ASR_REMOTE=1` is explicitly configured.
- `MINDANCHOR_API_TOKEN` is required for the desktop bridge to call the authenticated `/wayfinder/audio-events` route.

## Failure behavior

- Missing consent: reject before write or transcription.
- Low ASR confidence: return a candidate with low confidence and keep the situation awaiting confirmation.
- Non-task speech: ignore without creating a context event or situation.
- Duplicate `(sessionId, sequence)`: replay the original context event and situation without rerunning ASR.
- Offline API: retain the existing local bridge behavior and report candidate unavailability; never promote a local hint directly to a Task.
