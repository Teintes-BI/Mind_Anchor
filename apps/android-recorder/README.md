# MindAnchor Android Audio Beta

This Android app is the mobile companion for the MindAnchor Android Audio Beta track.

## What it does

- Runs a user-started foreground microphone capture service
- Chunks PCM audio every few seconds
- Pushes chunks only to a paired desktop receiver on the same LAN
- Queues failed chunks locally and retries later
- Emits call metadata events while the foreground service is running
- Provides a user-triggered, read-only Health Connect summary for the previous 24 hours

## Important boundaries

- It does **not** attempt to capture protected third-party app audio streams
- It does **not** attempt to capture carrier phone call digital audio
- It does **not** upload audio to public cloud services
- It requires explicit user consent, runtime permissions, and a visible notification
- Tapping **Start foreground recording** obtains a short-audio Wayfinder consent grant first; the returned consent reference is required on the session, every chunk, and every replay
- Tapping **Revoke audio consent** revokes the grant on the desktop/API path and blocks subsequent chunks until the next explicit start
- Health Connect reads are aggregated on-device; raw health samples never leave the phone
- Health summary sync is manual and bounded to a 24-hour window. Missing data is reported as missing, not as inactivity.
- Health Connect permissions remain user-controlled; revoking or denying any required read permission causes the next summary to be marked `missing`.
- Each sync requests a separate Wayfinder `health_summary` consent grant from the paired desktop and uses the returned opaque `consentRef`; the **Revoke health consent** control invalidates it and blocks uploads until the next explicit sync grant.

## Open in Android Studio

Open this folder (`apps/android-recorder`) as an Android Studio project.

The project intentionally does not ship a Gradle wrapper binary in this repo snapshot. Android Studio can generate or sync it on first open.

## Health Connect scope

The prototype requests read-only access to sleep sessions, exercise sessions, steps, and resting heart rate through Android Health Connect. This lets compatible providers (including Samsung Health, Fitbit, and other apps that publish to Health Connect) flow through one platform boundary without claiming direct support for every vendor. The app does not poll in the background and does not make medical judgments.

The provider adapter aggregates records into a bounded 24-hour summary on-device. `HealthSummaryMapper` is intentionally independent of Health Connect, so JVM tests cover sleep-minute clipping, exercise/activity minutes, steps, latest resting heart rate, empty data, missing permissions, and an unavailable provider without requiring a phone.

### Android health contract verification

From this directory, run the host-side source contract check:

```powershell
powershell -ExecutionPolicy Bypass -File .\verify-health-contract.ps1
```

When Android Studio/Gradle and a JDK are available, also run `./gradlew :app:testDebugUnitTest`. This repository snapshot does not include a Gradle wrapper; a Windows host without Java/Gradle/Android SDK cannot claim an APK or JVM test build.

