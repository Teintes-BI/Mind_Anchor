# Android Audio Beta

## Runtime model

- Android app runs a user-started foreground microphone service
- Audio is chunked every 5 seconds as PCM16 mono
- Chunks are sent only to the paired desktop receiver on the same LAN
- The desktop receiver stores raw chunks locally and writes only structured `EmotionAssessment` data back to the MindAnchor API

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
5. Start foreground recording

## Data path

`Android foreground service -> LAN chunk POST -> Desktop receiver -> local emotion analysis -> MindAnchor API -> Web dashboard`

## Storage

- Android stores queued chunk JSON files under app-private storage
- Desktop stores chunk files under the Electron user data directory
- Main API stores only metadata, call events, sessions, devices, and emotion assessments

