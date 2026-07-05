# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-25T13:44:10.006Z`
- completedAt: `2026-04-25T13:44:16.293Z`
- apiBaseUrl: `http://127.0.0.1:3011`
- apiLanBaseUrl: `http://192.168.0.104:3011`
- openClawBaseUrl: `http://192.168.0.104:8800`
- passed: `false`

## Device

- serial: `320146882257`
- model: `NX733J`
- androidVersion: `15`
- wifiIp: `192.168.0.100`
- curlPath: `/system/bin/curl`

## Preflight

- adbDeviceConnected: `true`
- wifiIpDetected: `true`
- curlAvailable: `true`
- gatewayLanHealthOk: `true`

## Summary

- totalSteps: `41`
- failedSteps: `1`
- phaseCount: `4`
- latestHealthProgressed: `false`
- recoveryPlanPersistedAcrossPhases: `true`
- postRecoverySamplingAccepted: `false`

## Read Models

- healthLatestReflectsDevice: `false`
- dashboardReflectsDevice: `false`
- inboxOverviewOk: `false`
- inboxAckReflected: `false`
- recoveryPlanCreated: `false`
- recoveryHistoryReflectsPlan: `false`
- recoveryInboxConsistent: `false`
- recoveryDashboardConsistent: `false`

## Client Session

- enabled: `true`
- authMode: `local-account`
- authEmail: `m6-mobile-client@example.com`
- authRegistered: `true`
- authLoggedIn: `true`
- clientMeOk: `false`
- clientBootstrapOk: `false`
- clientInboxOk: `false`
- clientAckAttempted: `false`
- clientAckReflected: `true`

## Phases

- baseline: latestHealthId=`—`, latestRecoveryPlanId=`—`, inboxMessageCount=`0`, inboxLatestRiskLevel=`—`, postRecoveryWriteAccepted=`false`
- stress-build-up-1: latestHealthId=`—`, latestRecoveryPlanId=`—`, inboxMessageCount=`0`, inboxLatestRiskLevel=`—`, postRecoveryWriteAccepted=`false`
- stress-build-up-2: latestHealthId=`—`, latestRecoveryPlanId=`—`, inboxMessageCount=`0`, inboxLatestRiskLevel=`—`, postRecoveryWriteAccepted=`false`
- recovery-trigger: latestHealthId=`—`, latestRecoveryPlanId=`—`, inboxMessageCount=`0`, inboxLatestRiskLevel=`—`, postRecoveryWriteAccepted=`false`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| auth-login | `POST` | `/auth/login` | `401` | `false` | accessTokenPresent=false |
| auth-register | `POST` | `/auth/register` | `200` | `true` | userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324, email=m6-mobile-client@example.com, accessTokenPresent=true |
| auth-login:retry | `POST` | `/auth/login` | `200` | `true` | userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324, email=m6-mobile-client@example.com, accessTokenPresent=true |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=15357817-00df-443c-bd97-d019b213b764, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=82deb354-1c76-4cf4-8287-d73763cd61ad, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=82deb354-1c76-4cf4-8287-d73763cd61ad, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=ab76dfd6-7388-4dbb-8730-8bfb803b61d3, status=active |
| device-heartbeat:baseline | `POST` | `/devices/heartbeat` | `200` | `true` | id=82deb354-1c76-4cf4-8287-d73763cd61ad, deviceId=android-m6-capture |
| emotion-assessment:baseline | `POST` | `/emotion/assessments` | `201` | `true` | id=fecadfd9-eb45-4757-89c3-d5968cf42ee2, deviceId=android-m6-capture, sessionId=ab76dfd6-7388-4dbb-8730-8bfb803b61d3 |
| video-assessment:baseline | `POST` | `/video/assessments` | `201` | `true` | id=df806822-3641-4a7e-ad9a-1673becac380, deviceId=android-m6-capture, sessionId=ab76dfd6-7388-4dbb-8730-8bfb803b61d3 |
| health-snapshot:baseline | `POST` | `/health/snapshots` | `201` | `true` | id=fdc62134-2e0e-481f-be13-7b51d8924cb7, deviceId=android-m6-capture |
| health-latest:baseline | `GET` | `/health/latest?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | — |
| dashboard-summary:baseline | `GET` | `/dashboard/summary?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | edgeDeviceCount=1, inboxCount=0 |
| inbox-overview:baseline | `GET` | `/client/inbox/overview?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | totalMessages=0 |
| device-heartbeat:stress-build-up-1 | `POST` | `/devices/heartbeat` | `200` | `true` | id=82deb354-1c76-4cf4-8287-d73763cd61ad, deviceId=android-m6-capture |
| call-event:stress-build-up-1 | `POST` | `/mobile/call-events` | `201` | `true` | id=1ffeebd5-510d-4189-a15e-245654e81744, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-1 | `POST` | `/emotion/assessments` | `201` | `true` | id=a07bf04e-fd23-4c96-8df9-b101c9ecf03e, deviceId=android-m6-capture, sessionId=ab76dfd6-7388-4dbb-8730-8bfb803b61d3 |
| video-assessment:stress-build-up-1 | `POST` | `/video/assessments` | `201` | `true` | id=a5a46cc9-f651-47b0-99f1-02fe8674fb84, deviceId=android-m6-capture, sessionId=ab76dfd6-7388-4dbb-8730-8bfb803b61d3 |
| health-snapshot:stress-build-up-1 | `POST` | `/health/snapshots` | `201` | `true` | id=91f2b4af-82de-47aa-b728-1f042d1a58fc, deviceId=android-m6-capture |
| health-latest:stress-build-up-1 | `GET` | `/health/latest?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | — |
| dashboard-summary:stress-build-up-1 | `GET` | `/dashboard/summary?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | edgeDeviceCount=1, inboxCount=0 |
| inbox-overview:stress-build-up-1 | `GET` | `/client/inbox/overview?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | totalMessages=0 |
| device-heartbeat:stress-build-up-2 | `POST` | `/devices/heartbeat` | `200` | `true` | id=82deb354-1c76-4cf4-8287-d73763cd61ad, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-2 | `POST` | `/emotion/assessments` | `201` | `true` | id=c9b8fbf4-ceab-4d4f-b136-d5f834d874f4, deviceId=android-m6-capture, sessionId=ab76dfd6-7388-4dbb-8730-8bfb803b61d3 |
| video-assessment:stress-build-up-2 | `POST` | `/video/assessments` | `201` | `true` | id=9463ae5e-25d3-43b0-acf0-d224170a2be9, deviceId=android-m6-capture, sessionId=ab76dfd6-7388-4dbb-8730-8bfb803b61d3 |
| health-snapshot:stress-build-up-2 | `POST` | `/health/snapshots` | `201` | `true` | id=01a4553b-af00-4c04-a19d-9072e90a17f4, deviceId=android-m6-capture |
| health-latest:stress-build-up-2 | `GET` | `/health/latest?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | — |
| dashboard-summary:stress-build-up-2 | `GET` | `/dashboard/summary?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | edgeDeviceCount=1, inboxCount=0 |
| inbox-overview:stress-build-up-2 | `GET` | `/client/inbox/overview?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | totalMessages=0 |
| recovery-plan:recovery-trigger | `POST` | `/recovery/plan` | `200` | `true` | id=e8c9a577-807d-4fd0-a494-44acd321edf3, reason=attention_shift_after_interruption |
| recovery-history:recovery-trigger | `GET` | `/recovery/history?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | recoveryPlanCount=0 |
| health-latest:recovery-trigger | `GET` | `/health/latest?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | — |
| dashboard-summary:recovery-trigger | `GET` | `/dashboard/summary?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | edgeDeviceCount=1, inboxCount=0 |
| inbox-overview:recovery-trigger | `GET` | `/client/inbox/overview?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | totalMessages=0 |
| device-heartbeat:post-recovery | `POST` | `/devices/heartbeat` | `200` | `true` | id=82deb354-1c76-4cf4-8287-d73763cd61ad, deviceId=android-m6-capture |
| emotion-assessment:post-recovery | `POST` | `/emotion/assessments` | `201` | `true` | id=4c7f8168-1eec-4b6a-b3a2-c5ca5083399e, deviceId=android-m6-capture, sessionId=ab76dfd6-7388-4dbb-8730-8bfb803b61d3 |
| video-assessment:post-recovery | `POST` | `/video/assessments` | `201` | `true` | id=785a8774-14ce-4df0-89ea-df161020bdeb, deviceId=android-m6-capture, sessionId=ab76dfd6-7388-4dbb-8730-8bfb803b61d3 |
| health-snapshot:post-recovery | `POST` | `/health/snapshots` | `201` | `true` | id=c77b191e-069e-498b-8ab9-98a308fb573d, deviceId=android-m6-capture |
| recovery-history:post-recovery | `GET` | `/recovery/history?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | recoveryPlanCount=0 |
| health-latest:post-recovery | `GET` | `/health/latest?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | — |
| client-inbox:post-recovery | `GET` | `/client/inbox?userId=bec4a4f8-b98a-454a-be8a-06bc8ab1a324` | `200` | `true` | totalMessages=0 |

## Response IDs

```json
{
  "authUserId": "bec4a4f8-b98a-454a-be8a-06bc8ab1a324",
  "authEmail": "m6-mobile-client@example.com",
  "mobileDeviceId": "15357817-00df-443c-bd97-d019b213b764",
  "audioSessionId": "ab76dfd6-7388-4dbb-8730-8bfb803b61d3",
  "emotionAssessmentId": "4c7f8168-1eec-4b6a-b3a2-c5ca5083399e",
  "videoAssessmentId": "785a8774-14ce-4df0-89ea-df161020bdeb",
  "healthSnapshotId": "c77b191e-069e-498b-8ab9-98a308fb573d",
  "callEventId": "1ffeebd5-510d-4189-a15e-245654e81744"
}
```

## Error Samples

- auth-login failed with HTTP 401
- read model check failed: healthLatestReflectsDevice
- read model check failed: dashboardReflectsDevice
- read model check failed: inboxOverviewOk
- read model check failed: inboxAckReflected
- read model check failed: recoveryPlanCreated
- read model check failed: recoveryHistoryReflectsPlan
- read model check failed: recoveryInboxConsistent
- read model check failed: recoveryDashboardConsistent
- cadence check failed: latestHealthProgressed
