# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-25T13:49:18.201Z`
- completedAt: `2026-04-25T13:49:25.660Z`
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

- totalSteps: `51`
- failedSteps: `0`
- phaseCount: `5`
- latestHealthProgressed: `true`
- recoveryPlanPersistedAcrossPhases: `true`
- postRecoverySamplingAccepted: `true`

## Read Models

- healthLatestReflectsDevice: `true`
- dashboardReflectsDevice: `true`
- inboxOverviewOk: `true`
- inboxAckReflected: `true`
- recoveryPlanCreated: `true`
- recoveryHistoryReflectsPlan: `true`
- recoveryInboxConsistent: `true`
- recoveryDashboardConsistent: `true`

## Client Session

- enabled: `true`
- authMode: `local-account`
- authEmail: `m6-mobile-client@example.com`
- authRegistered: `true`
- authLoggedIn: `true`
- clientMeOk: `true`
- clientBootstrapOk: `false`
- clientInboxOk: `true`
- clientAckAttempted: `true`
- clientAckReflected: `true`

## Phases

- baseline: latestHealthId=`9485a503-5cad-4d6e-9455-ca6c83645a21`, latestRecoveryPlanId=`—`, inboxMessageCount=`3`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-1: latestHealthId=`8b6c445a-a6cd-4168-9e83-a47db724e4ce`, latestRecoveryPlanId=`—`, inboxMessageCount=`9`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-2: latestHealthId=`7688d512-a17f-4bd6-97e5-ac51dab382cc`, latestRecoveryPlanId=`—`, inboxMessageCount=`14`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- recovery-trigger: latestHealthId=`7688d512-a17f-4bd6-97e5-ac51dab382cc`, latestRecoveryPlanId=`c88913f2-a350-43b6-b06d-f0438ac4c28b`, inboxMessageCount=`17`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- post-recovery: latestHealthId=`c7d77944-95a4-4880-8be1-cad1aef12c62`, latestRecoveryPlanId=`c88913f2-a350-43b6-b06d-f0438ac4c28b`, inboxMessageCount=`23`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| auth-login | `POST` | `/auth/login` | `401` | `false` | accessTokenPresent=false |
| auth-register | `POST` | `/auth/register` | `200` | `true` | userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16, email=m6-mobile-client@example.com, accessTokenPresent=true |
| auth-login:retry | `POST` | `/auth/login` | `200` | `true` | userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16, email=m6-mobile-client@example.com, accessTokenPresent=true |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=d45d4ab1-c8d0-4758-b27b-e65399c859ae, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=8e6f1069-b145-44ea-a67f-27ff1268f515, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=8e6f1069-b145-44ea-a67f-27ff1268f515, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8, status=active |
| device-heartbeat:baseline | `POST` | `/devices/heartbeat` | `200` | `true` | id=8e6f1069-b145-44ea-a67f-27ff1268f515, deviceId=android-m6-capture |
| emotion-assessment:baseline | `POST` | `/emotion/assessments` | `201` | `true` | id=3b6a7979-dee9-4d18-88c1-d64a4db45475, deviceId=android-m6-capture, sessionId=8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8 |
| video-assessment:baseline | `POST` | `/video/assessments` | `201` | `true` | id=638e2213-c24e-4a62-a5d6-13f11e7c360a, deviceId=android-m6-capture, sessionId=8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8 |
| health-snapshot:baseline | `POST` | `/health/snapshots` | `201` | `true` | id=9485a503-5cad-4d6e-9455-ca6c83645a21, deviceId=android-m6-capture |
| health-latest:baseline | `GET` | `/health/latest?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestId=9485a503-5cad-4d6e-9455-ca6c83645a21, latestDeviceId=android-m6-capture |
| dashboard-summary:baseline | `GET` | `/dashboard/summary?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestHealthSnapshotId=9485a503-5cad-4d6e-9455-ca6c83645a21, edgeDeviceCount=1, inboxCount=3 |
| inbox-overview:baseline | `GET` | `/client/inbox/overview?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | totalMessages=3, latestBehaviorConclusionId=e8fa0224-3623-492a-b35b-28d749452ef2 |
| device-heartbeat:stress-build-up-1 | `POST` | `/devices/heartbeat` | `200` | `true` | id=8e6f1069-b145-44ea-a67f-27ff1268f515, deviceId=android-m6-capture |
| call-event:stress-build-up-1 | `POST` | `/mobile/call-events` | `201` | `true` | id=161e52d7-68b4-430b-b8cd-8cb1d638831c, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-1 | `POST` | `/emotion/assessments` | `201` | `true` | id=a8c4e052-e6c8-4456-bab8-1de251d7e8f2, deviceId=android-m6-capture, sessionId=8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8 |
| video-assessment:stress-build-up-1 | `POST` | `/video/assessments` | `201` | `true` | id=201de610-5606-46ce-8687-d46365ee101b, deviceId=android-m6-capture, sessionId=8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8 |
| health-snapshot:stress-build-up-1 | `POST` | `/health/snapshots` | `201` | `true` | id=8b6c445a-a6cd-4168-9e83-a47db724e4ce, deviceId=android-m6-capture |
| health-latest:stress-build-up-1 | `GET` | `/health/latest?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestId=8b6c445a-a6cd-4168-9e83-a47db724e4ce, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-1 | `GET` | `/dashboard/summary?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestHealthSnapshotId=8b6c445a-a6cd-4168-9e83-a47db724e4ce, edgeDeviceCount=1, inboxCount=8 |
| inbox-overview:stress-build-up-1 | `GET` | `/client/inbox/overview?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | totalMessages=9, latestBehaviorConclusionId=378c539b-a5d6-4e93-bf14-c9c9143d4272 |
| device-heartbeat:stress-build-up-2 | `POST` | `/devices/heartbeat` | `200` | `true` | id=8e6f1069-b145-44ea-a67f-27ff1268f515, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-2 | `POST` | `/emotion/assessments` | `201` | `true` | id=813d504c-81ea-4274-af12-3f92e6e68192, deviceId=android-m6-capture, sessionId=8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8 |
| video-assessment:stress-build-up-2 | `POST` | `/video/assessments` | `201` | `true` | id=47318c3f-97a8-4d10-ad2c-f2d8ac02f525, deviceId=android-m6-capture, sessionId=8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8 |
| health-snapshot:stress-build-up-2 | `POST` | `/health/snapshots` | `201` | `true` | id=7688d512-a17f-4bd6-97e5-ac51dab382cc, deviceId=android-m6-capture |
| health-latest:stress-build-up-2 | `GET` | `/health/latest?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestId=7688d512-a17f-4bd6-97e5-ac51dab382cc, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-2 | `GET` | `/dashboard/summary?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestHealthSnapshotId=7688d512-a17f-4bd6-97e5-ac51dab382cc, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:stress-build-up-2 | `GET` | `/client/inbox/overview?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | totalMessages=14, latestBehaviorConclusionId=e302a18e-66df-472b-ba60-1dc9cf5cf57a |
| recovery-plan:recovery-trigger | `POST` | `/recovery/plan` | `200` | `true` | id=c88913f2-a350-43b6-b06d-f0438ac4c28b, reason=attention_shift_after_interruption |
| recovery-history:recovery-trigger | `GET` | `/recovery/history?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestRecoveryPlanId=c88913f2-a350-43b6-b06d-f0438ac4c28b, recoveryPlanCount=1 |
| health-latest:recovery-trigger | `GET` | `/health/latest?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestId=7688d512-a17f-4bd6-97e5-ac51dab382cc, latestDeviceId=android-m6-capture |
| dashboard-summary:recovery-trigger | `GET` | `/dashboard/summary?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestHealthSnapshotId=7688d512-a17f-4bd6-97e5-ac51dab382cc, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:recovery-trigger | `GET` | `/client/inbox/overview?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | totalMessages=17, latestBehaviorConclusionId=4a10844b-cb55-40e1-b4cf-ed648e1d89cd, latestRecoveryPlanId=c88913f2-a350-43b6-b06d-f0438ac4c28b |
| device-heartbeat:post-recovery | `POST` | `/devices/heartbeat` | `200` | `true` | id=8e6f1069-b145-44ea-a67f-27ff1268f515, deviceId=android-m6-capture |
| emotion-assessment:post-recovery | `POST` | `/emotion/assessments` | `201` | `true` | id=c6e8c2a0-ff50-4dc9-9386-92242e3d62b8, deviceId=android-m6-capture, sessionId=8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8 |
| video-assessment:post-recovery | `POST` | `/video/assessments` | `201` | `true` | id=a69b1735-e874-4b37-adec-b64356da07bf, deviceId=android-m6-capture, sessionId=8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8 |
| health-snapshot:post-recovery | `POST` | `/health/snapshots` | `201` | `true` | id=c7d77944-95a4-4880-8be1-cad1aef12c62, deviceId=android-m6-capture |
| recovery-history:post-recovery | `GET` | `/recovery/history?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestRecoveryPlanId=c88913f2-a350-43b6-b06d-f0438ac4c28b, recoveryPlanCount=1 |
| health-latest:post-recovery | `GET` | `/health/latest?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestId=c7d77944-95a4-4880-8be1-cad1aef12c62, latestDeviceId=android-m6-capture |
| client-inbox:post-recovery | `GET` | `/client/inbox?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | firstMessageId=0dddf973-e073-46ad-ac6f-0c4f31d1dfbd, totalMessages=21 |
| inbox-ack:post-recovery | `POST` | `/client/inbox/0dddf973-e073-46ad-ac6f-0c4f31d1dfbd/ack` | `200` | `true` | messageId=0dddf973-e073-46ad-ac6f-0c4f31d1dfbd, status=acknowledged |
| dashboard-summary:post-recovery | `GET` | `/dashboard/summary?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | latestHealthSnapshotId=c7d77944-95a4-4880-8be1-cad1aef12c62, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:post-recovery | `GET` | `/client/inbox/overview?userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16` | `200` | `true` | totalMessages=23, latestBehaviorConclusionId=d0113ebe-cab0-4eb3-9ef2-79a7ce6d1a24, latestRecoveryPlanId=c88913f2-a350-43b6-b06d-f0438ac4c28b |
| audio-session-end:cadenced-finalize | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8, status=completed |
| me:client-session | `GET` | `/me` | `200` | `true` | userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16, email=m6-mobile-client@example.com, authenticated=true |
| client-bootstrap:client-session | `GET` | `/client/bootstrap` | `200` | `true` | userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16, inboxMessageCount=20 |
| client-inbox:client-session | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=bbb4026b-33a9-44a0-8f09-3448e31cb0df, totalMessages=26 |
| inbox-ack:client-session | `POST` | `/client/inbox/bbb4026b-33a9-44a0-8f09-3448e31cb0df/ack` | `200` | `true` | messageId=bbb4026b-33a9-44a0-8f09-3448e31cb0df, status=acknowledged |
| inbox-overview:client-session | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=27, latestBehaviorConclusionId=7c7ccd61-eb5f-4e68-80b9-836492251fea, latestRecoveryPlanId=c88913f2-a350-43b6-b06d-f0438ac4c28b |
| client-bootstrap:client-session-refresh | `GET` | `/client/bootstrap` | `200` | `true` | userId=fe6fb220-9bbf-4a3a-b80e-7f4461c05f16, inboxMessageCount=20 |

## Response IDs

```json
{
  "authUserId": "fe6fb220-9bbf-4a3a-b80e-7f4461c05f16",
  "authEmail": "m6-mobile-client@example.com",
  "mobileDeviceId": "d45d4ab1-c8d0-4758-b27b-e65399c859ae",
  "audioSessionId": "8d475d93-f2d9-45e5-9e3d-0b4de3e2bdd8",
  "emotionAssessmentId": "c6e8c2a0-ff50-4dc9-9386-92242e3d62b8",
  "videoAssessmentId": "a69b1735-e874-4b37-adec-b64356da07bf",
  "healthSnapshotId": "c7d77944-95a4-4880-8be1-cad1aef12c62",
  "callEventId": "161e52d7-68b4-430b-b8cd-8cb1d638831c",
  "audioSessionStatus": "completed",
  "clientInboxAckMessageId": "bbb4026b-33a9-44a0-8f09-3448e31cb0df",
  "clientBootstrapUserId": "fe6fb220-9bbf-4a3a-b80e-7f4461c05f16",
  "recoveryPlanId": "c88913f2-a350-43b6-b06d-f0438ac4c28b",
  "recoveryPlanReason": "attention_shift_after_interruption",
  "recoveryHistoryLatestPlanId": "c88913f2-a350-43b6-b06d-f0438ac4c28b",
  "recoveryHistoryPlanCount": 1,
  "inboxAckMessageId": "0dddf973-e073-46ad-ac6f-0c4f31d1dfbd",
  "inboxAckStatus": "acknowledged",
  "latestHealthId": "c7d77944-95a4-4880-8be1-cad1aef12c62",
  "latestHealthDeviceId": "android-m6-capture",
  "dashboardLatestHealthSnapshotId": "c7d77944-95a4-4880-8be1-cad1aef12c62",
  "dashboardEdgeDeviceCount": 1,
  "dashboardLatestRecoveryPlanId": "c88913f2-a350-43b6-b06d-f0438ac4c28b",
  "inboxMessageCount": 23,
  "inboxLatestRiskLevel": "high",
  "inboxLatestRecoveryPlanId": "c88913f2-a350-43b6-b06d-f0438ac4c28b"
}
```

## Error Samples

- client session check failed: clientBootstrapOk
