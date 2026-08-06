# Android Audio Beta

## Runtime model

- Android app runs a user-started foreground microphone service
- Audio is chunked every 5 seconds as PCM16 mono
- Chunks are sent only to the paired desktop receiver on the same LAN
- The desktop receiver stores raw chunks locally and writes only structured `EmotionAssessment` data back to the MindAnchor API
- Wayfinder task extraction is opt-in per capture session and requires a `consentRef`

## Product boundaries

- Carrier phone calls generate metadata events only
- The Android app does not promise capture of protected VoIP app internals
- No public cloud upload path is implemented in the mobile app
- Beta status must stay visible in UI and release notes

## Local pairing flow

1. Start the Electron desktop app
2. Read the LAN host URL and pair code from the Android Audio Beta card
3. Open the Android app and enter the host URL + pair code
4. Grant permissions
5. Tap **Start foreground recording**. The desktop bridge requests the bounded `wayfinder_voice_candidate / foreground_short_audio` grant and returns one `consentRef` for the session.
6. Tap **Revoke audio consent** to revoke that grant and block queued/new chunks until the next explicit start.

## Data path

`Android foreground service -> LAN chunk POST -> Desktop receiver -> local emotion analysis -> optional ASR/candidate hint -> MindAnchor API -> Web dashboard`

## Wayfinder candidate boundary

- Starting a session without `consentRef` is rejected before any chunk is written.
- The LAN consent endpoint is `POST /local/mobile/audio/consent`; it is authenticated by the pairing token and forwards a `PATCH /wayfinder/consent/:source` request to the gateway.
- A chunk without active consent is rejected before local analysis.
- The desktop bridge first transcribes each PCM16LE chunk with local `onnx-community/whisper-small`; the model is loaded lazily and reused.
- The Android cloud-transcription switch is off by default. Raw audio can reach the compatible transcription provider only when that switch was enabled for the capture session and `MINDANCHOR_WAYFINDER_ASR_REMOTE=1` is also set on the desktop bridge.
- The API stores only the bounded transcript excerpt and ASR provenance. It does not persist raw audio.
- The API stores a structured `voice_candidate` summary and evidence reference, never the base64 audio.
- A candidate always creates an `awaiting_confirmation` situation. It never creates a real Task automatically.
- The desktop bridge may set `MINDANCHOR_API_TOKEN` to an authenticated gateway token before calling the protected Wayfinder endpoint.

## Storage

- Android stores queued chunk JSON files under app-private storage
- Desktop stores chunk files under the Electron user data directory
- Main API stores only metadata, call events, sessions, devices, and emotion assessments

## Offline candidate evaluation

Run the deterministic fixture report before a pilot change or after changing candidate extraction:

```powershell
node scripts/wayfinder-audio-evaluation.mjs --fixtures docs/wayfinder/audio-evaluation-fixtures.json --output <report-file>
```

The report covers candidate precision/recall, the rate of candidates held in `awaiting_confirmation`, and rejection after consent revocation. It uses no raw audio and does not change the mobile event protocol.

