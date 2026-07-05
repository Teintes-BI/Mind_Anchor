# MindAnchor Android Audio Beta

This Android app is the mobile companion for the MindAnchor Android Audio Beta track.

## What it does

- Runs a user-started foreground microphone capture service
- Chunks PCM audio every few seconds
- Pushes chunks only to a paired desktop receiver on the same LAN
- Queues failed chunks locally and retries later
- Emits call metadata events while the foreground service is running

## Important boundaries

- It does **not** attempt to capture protected third-party app audio streams
- It does **not** attempt to capture carrier phone call digital audio
- It does **not** upload audio to public cloud services
- It requires explicit user consent, runtime permissions, and a visible notification

## Open in Android Studio

Open this folder (`apps/android-recorder`) as an Android Studio project.

The project intentionally does not ship a Gradle wrapper binary in this repo snapshot. Android Studio can generate or sync it on first open.

