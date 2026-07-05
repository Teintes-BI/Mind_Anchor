# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-25T13:52:24.922Z`
- completedAt: `2026-04-25T13:52:32.930Z`
- apiBaseUrl: `http://127.0.0.1:3011`
- apiLanBaseUrl: `http://192.168.0.104:3011`
- openClawBaseUrl: `http://192.168.0.104:8800`
- passed: `true`

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
- clientBootstrapOk: `true`
- clientInboxOk: `true`
- clientAckAttempted: `true`
- clientAckReflected: `true`

## Phases

- baseline: latestHealthId=`6627dd6d-3b2f-40c6-8ef3-c6ba8d20a64e`, latestRecoveryPlanId=`—`, inboxMessageCount=`3`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-1: latestHealthId=`5c080615-e9e5-4084-aaf7-7d3a9eebb3e9`, latestRecoveryPlanId=`—`, inboxMessageCount=`9`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-2: latestHealthId=`182454ca-2959-438a-9d5c-3f16b8bb1811`, latestRecoveryPlanId=`—`, inboxMessageCount=`14`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- recovery-trigger: latestHealthId=`182454ca-2959-438a-9d5c-3f16b8bb1811`, latestRecoveryPlanId=`a940a442-3b90-48d3-939b-2ae08e3a983d`, inboxMessageCount=`17`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- post-recovery: latestHealthId=`0dac58be-41e5-454a-b946-9188e874e2e4`, latestRecoveryPlanId=`a940a442-3b90-48d3-939b-2ae08e3a983d`, inboxMessageCount=`23`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| auth-login | `POST` | `/auth/login` | `401` | `false` | accessTokenPresent=false |
| auth-register | `POST` | `/auth/register` | `200` | `true` | userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6, email=m6-mobile-client@example.com, accessTokenPresent=true |
| auth-login:retry | `POST` | `/auth/login` | `200` | `true` | userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6, email=m6-mobile-client@example.com, accessTokenPresent=true |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=9b6a45ca-1c89-4e0d-af56-7a997a885666, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=756dc26c-6fad-43ba-a725-9dd7e5ac3eed, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=756dc26c-6fad-43ba-a725-9dd7e5ac3eed, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=78d2f440-ca96-47e8-b080-3a2324cce190, status=active |
| device-heartbeat:baseline | `POST` | `/devices/heartbeat` | `200` | `true` | id=756dc26c-6fad-43ba-a725-9dd7e5ac3eed, deviceId=android-m6-capture |
| emotion-assessment:baseline | `POST` | `/emotion/assessments` | `201` | `true` | id=1a3cb258-4f54-46da-b04a-b358f7e04bbe, deviceId=android-m6-capture, sessionId=78d2f440-ca96-47e8-b080-3a2324cce190 |
| video-assessment:baseline | `POST` | `/video/assessments` | `201` | `true` | id=a197f6ee-d474-4de2-ae6b-1843de9ae511, deviceId=android-m6-capture, sessionId=78d2f440-ca96-47e8-b080-3a2324cce190 |
| health-snapshot:baseline | `POST` | `/health/snapshots` | `201` | `true` | id=6627dd6d-3b2f-40c6-8ef3-c6ba8d20a64e, deviceId=android-m6-capture |
| health-latest:baseline | `GET` | `/health/latest?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestId=6627dd6d-3b2f-40c6-8ef3-c6ba8d20a64e, latestDeviceId=android-m6-capture |
| dashboard-summary:baseline | `GET` | `/dashboard/summary?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestHealthSnapshotId=6627dd6d-3b2f-40c6-8ef3-c6ba8d20a64e, edgeDeviceCount=1, inboxCount=3 |
| inbox-overview:baseline | `GET` | `/client/inbox/overview?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | totalMessages=3, latestBehaviorConclusionId=e144c99c-e4fb-4eb6-92db-863b42136b47 |
| device-heartbeat:stress-build-up-1 | `POST` | `/devices/heartbeat` | `200` | `true` | id=756dc26c-6fad-43ba-a725-9dd7e5ac3eed, deviceId=android-m6-capture |
| call-event:stress-build-up-1 | `POST` | `/mobile/call-events` | `201` | `true` | id=c748f408-6721-4c66-9582-20d9bc266e84, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-1 | `POST` | `/emotion/assessments` | `201` | `true` | id=f7af6ff6-ef58-47f8-b243-b603beaaf677, deviceId=android-m6-capture, sessionId=78d2f440-ca96-47e8-b080-3a2324cce190 |
| video-assessment:stress-build-up-1 | `POST` | `/video/assessments` | `201` | `true` | id=bbf16653-09dc-42fe-8961-8a358e787a77, deviceId=android-m6-capture, sessionId=78d2f440-ca96-47e8-b080-3a2324cce190 |
| health-snapshot:stress-build-up-1 | `POST` | `/health/snapshots` | `201` | `true` | id=5c080615-e9e5-4084-aaf7-7d3a9eebb3e9, deviceId=android-m6-capture |
| health-latest:stress-build-up-1 | `GET` | `/health/latest?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestId=5c080615-e9e5-4084-aaf7-7d3a9eebb3e9, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-1 | `GET` | `/dashboard/summary?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestHealthSnapshotId=5c080615-e9e5-4084-aaf7-7d3a9eebb3e9, edgeDeviceCount=1, inboxCount=8 |
| inbox-overview:stress-build-up-1 | `GET` | `/client/inbox/overview?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | totalMessages=9, latestBehaviorConclusionId=f52abbdf-7776-488a-a8c0-ed1a7a43cf74 |
| device-heartbeat:stress-build-up-2 | `POST` | `/devices/heartbeat` | `200` | `true` | id=756dc26c-6fad-43ba-a725-9dd7e5ac3eed, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-2 | `POST` | `/emotion/assessments` | `201` | `true` | id=3a767c2e-cec6-41ce-a926-6163ae81b9ad, deviceId=android-m6-capture, sessionId=78d2f440-ca96-47e8-b080-3a2324cce190 |
| video-assessment:stress-build-up-2 | `POST` | `/video/assessments` | `201` | `true` | id=ce055150-504d-4152-9501-78e59423589a, deviceId=android-m6-capture, sessionId=78d2f440-ca96-47e8-b080-3a2324cce190 |
| health-snapshot:stress-build-up-2 | `POST` | `/health/snapshots` | `201` | `true` | id=182454ca-2959-438a-9d5c-3f16b8bb1811, deviceId=android-m6-capture |
| health-latest:stress-build-up-2 | `GET` | `/health/latest?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestId=182454ca-2959-438a-9d5c-3f16b8bb1811, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-2 | `GET` | `/dashboard/summary?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestHealthSnapshotId=182454ca-2959-438a-9d5c-3f16b8bb1811, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:stress-build-up-2 | `GET` | `/client/inbox/overview?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | totalMessages=14, latestBehaviorConclusionId=fa91df1b-25d3-475c-bda6-cb2426a411e0 |
| recovery-plan:recovery-trigger | `POST` | `/recovery/plan` | `200` | `true` | id=a940a442-3b90-48d3-939b-2ae08e3a983d, reason=attention_shift_after_interruption |
| recovery-history:recovery-trigger | `GET` | `/recovery/history?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestRecoveryPlanId=a940a442-3b90-48d3-939b-2ae08e3a983d, recoveryPlanCount=1 |
| health-latest:recovery-trigger | `GET` | `/health/latest?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestId=182454ca-2959-438a-9d5c-3f16b8bb1811, latestDeviceId=android-m6-capture |
| dashboard-summary:recovery-trigger | `GET` | `/dashboard/summary?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestHealthSnapshotId=182454ca-2959-438a-9d5c-3f16b8bb1811, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:recovery-trigger | `GET` | `/client/inbox/overview?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | totalMessages=17, latestBehaviorConclusionId=f79768c9-93c7-46e4-a10c-95b87626d6e3, latestRecoveryPlanId=a940a442-3b90-48d3-939b-2ae08e3a983d |
| device-heartbeat:post-recovery | `POST` | `/devices/heartbeat` | `200` | `true` | id=756dc26c-6fad-43ba-a725-9dd7e5ac3eed, deviceId=android-m6-capture |
| emotion-assessment:post-recovery | `POST` | `/emotion/assessments` | `201` | `true` | id=40bda992-8aa6-4155-a9c5-4202fd17a883, deviceId=android-m6-capture, sessionId=78d2f440-ca96-47e8-b080-3a2324cce190 |
| video-assessment:post-recovery | `POST` | `/video/assessments` | `201` | `true` | id=8d075631-484b-491b-8412-b4c57dea88fd, deviceId=android-m6-capture, sessionId=78d2f440-ca96-47e8-b080-3a2324cce190 |
| health-snapshot:post-recovery | `POST` | `/health/snapshots` | `201` | `true` | id=0dac58be-41e5-454a-b946-9188e874e2e4, deviceId=android-m6-capture |
| recovery-history:post-recovery | `GET` | `/recovery/history?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestRecoveryPlanId=a940a442-3b90-48d3-939b-2ae08e3a983d, recoveryPlanCount=1 |
| health-latest:post-recovery | `GET` | `/health/latest?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestId=0dac58be-41e5-454a-b946-9188e874e2e4, latestDeviceId=android-m6-capture |
| client-inbox:post-recovery | `GET` | `/client/inbox?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | firstMessageId=e695df98-b6dc-402f-98f7-1b7b68e9601c, totalMessages=21 |
| inbox-ack:post-recovery | `POST` | `/client/inbox/e695df98-b6dc-402f-98f7-1b7b68e9601c/ack` | `200` | `true` | messageId=e695df98-b6dc-402f-98f7-1b7b68e9601c, status=acknowledged |
| dashboard-summary:post-recovery | `GET` | `/dashboard/summary?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | latestHealthSnapshotId=0dac58be-41e5-454a-b946-9188e874e2e4, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:post-recovery | `GET` | `/client/inbox/overview?userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6` | `200` | `true` | totalMessages=23, latestBehaviorConclusionId=27fa6f15-e9fa-48ec-93d3-ef63089099fd, latestRecoveryPlanId=a940a442-3b90-48d3-939b-2ae08e3a983d |
| audio-session-end:cadenced-finalize | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=78d2f440-ca96-47e8-b080-3a2324cce190, status=completed |
| me:client-session | `GET` | `/me` | `200` | `true` | userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6, email=m6-mobile-client@example.com, authenticated=true |
| client-bootstrap:client-session | `GET` | `/client/bootstrap` | `200` | `true` | userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6, inboxMessageCount=20 |
| client-inbox:client-session | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=43630d76-ad7a-4457-bd72-ee463a842374, totalMessages=26 |
| inbox-ack:client-session | `POST` | `/client/inbox/43630d76-ad7a-4457-bd72-ee463a842374/ack` | `200` | `true` | messageId=43630d76-ad7a-4457-bd72-ee463a842374, status=acknowledged |
| inbox-overview:client-session | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=27, latestBehaviorConclusionId=54047730-353a-4050-9913-6ffa0c253a63, latestRecoveryPlanId=a940a442-3b90-48d3-939b-2ae08e3a983d |
| client-bootstrap:client-session-refresh | `GET` | `/client/bootstrap` | `200` | `true` | userId=da703a1f-8d1b-422a-8b76-d267c6aef9a6, inboxMessageCount=20 |

## Response IDs

```json
{
  "authUserId": "da703a1f-8d1b-422a-8b76-d267c6aef9a6",
  "authEmail": "m6-mobile-client@example.com",
  "mobileDeviceId": "9b6a45ca-1c89-4e0d-af56-7a997a885666",
  "audioSessionId": "78d2f440-ca96-47e8-b080-3a2324cce190",
  "emotionAssessmentId": "40bda992-8aa6-4155-a9c5-4202fd17a883",
  "videoAssessmentId": "8d075631-484b-491b-8412-b4c57dea88fd",
  "healthSnapshotId": "0dac58be-41e5-454a-b946-9188e874e2e4",
  "callEventId": "c748f408-6721-4c66-9582-20d9bc266e84",
  "audioSessionStatus": "completed",
  "clientInboxAckMessageId": "43630d76-ad7a-4457-bd72-ee463a842374",
  "clientBootstrapUserId": "da703a1f-8d1b-422a-8b76-d267c6aef9a6",
  "recoveryPlanId": "a940a442-3b90-48d3-939b-2ae08e3a983d",
  "recoveryPlanReason": "attention_shift_after_interruption",
  "recoveryHistoryLatestPlanId": "a940a442-3b90-48d3-939b-2ae08e3a983d",
  "recoveryHistoryPlanCount": 1,
  "inboxAckMessageId": "e695df98-b6dc-402f-98f7-1b7b68e9601c",
  "inboxAckStatus": "acknowledged",
  "latestHealthId": "0dac58be-41e5-454a-b946-9188e874e2e4",
  "latestHealthDeviceId": "android-m6-capture",
  "dashboardLatestHealthSnapshotId": "0dac58be-41e5-454a-b946-9188e874e2e4",
  "dashboardEdgeDeviceCount": 1,
  "dashboardLatestRecoveryPlanId": "a940a442-3b90-48d3-939b-2ae08e3a983d",
  "inboxMessageCount": 23,
  "inboxLatestRiskLevel": "high",
  "inboxLatestRecoveryPlanId": "a940a442-3b90-48d3-939b-2ae08e3a983d"
}
```

## Error Samples

- none
