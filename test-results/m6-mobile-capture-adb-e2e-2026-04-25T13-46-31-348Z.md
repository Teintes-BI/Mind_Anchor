# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-25T13:46:31.348Z`
- completedAt: `2026-04-25T13:46:37.621Z`
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

- totalSteps: `46`
- failedSteps: `1`
- phaseCount: `5`
- latestHealthProgressed: `true`
- recoveryPlanPersistedAcrossPhases: `true`
- postRecoverySamplingAccepted: `true`

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

- baseline: latestHealthId=`b2ba1073-4069-4bbc-9b62-4f688948842d`, latestRecoveryPlanId=`—`, inboxMessageCount=`3`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-1: latestHealthId=`2bc9fb6c-4cb0-4bbd-8625-bbfb74fc2294`, latestRecoveryPlanId=`—`, inboxMessageCount=`9`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-2: latestHealthId=`b8f58558-cb75-48a7-a204-6c06b427653f`, latestRecoveryPlanId=`—`, inboxMessageCount=`14`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- recovery-trigger: latestHealthId=`b8f58558-cb75-48a7-a204-6c06b427653f`, latestRecoveryPlanId=`b50b9b6e-f073-442f-bef2-66fb79532a0e`, inboxMessageCount=`17`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- post-recovery: latestHealthId=`c48559e1-1d63-4e96-88c2-74eee7d5fa94`, latestRecoveryPlanId=`b50b9b6e-f073-442f-bef2-66fb79532a0e`, inboxMessageCount=`23`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| auth-login | `POST` | `/auth/login` | `401` | `false` | accessTokenPresent=false |
| auth-register | `POST` | `/auth/register` | `200` | `true` | userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b, email=m6-mobile-client@example.com, accessTokenPresent=true |
| auth-login:retry | `POST` | `/auth/login` | `200` | `true` | userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b, email=m6-mobile-client@example.com, accessTokenPresent=true |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=8a8a9120-d4f0-4627-ab12-73cdc2866244, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=c9106db7-7451-4443-a51d-5bf3b8828a72, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=c9106db7-7451-4443-a51d-5bf3b8828a72, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=ede12685-7b57-4be1-bb85-281bda19a405, status=active |
| device-heartbeat:baseline | `POST` | `/devices/heartbeat` | `200` | `true` | id=c9106db7-7451-4443-a51d-5bf3b8828a72, deviceId=android-m6-capture |
| emotion-assessment:baseline | `POST` | `/emotion/assessments` | `201` | `true` | id=2292bac3-7b6f-487a-be98-6e83b0e19d08, deviceId=android-m6-capture, sessionId=ede12685-7b57-4be1-bb85-281bda19a405 |
| video-assessment:baseline | `POST` | `/video/assessments` | `201` | `true` | id=f402203a-a3b5-4935-b0f8-fca2edb6407b, deviceId=android-m6-capture, sessionId=ede12685-7b57-4be1-bb85-281bda19a405 |
| health-snapshot:baseline | `POST` | `/health/snapshots` | `201` | `true` | id=b2ba1073-4069-4bbc-9b62-4f688948842d, deviceId=android-m6-capture |
| health-latest:baseline | `GET` | `/health/latest?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestId=b2ba1073-4069-4bbc-9b62-4f688948842d, latestDeviceId=android-m6-capture |
| dashboard-summary:baseline | `GET` | `/dashboard/summary?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestHealthSnapshotId=b2ba1073-4069-4bbc-9b62-4f688948842d, edgeDeviceCount=1, inboxCount=3 |
| inbox-overview:baseline | `GET` | `/client/inbox/overview?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | totalMessages=3, latestBehaviorConclusionId=86bf8809-20c9-4b6e-9496-d7143e8d6c95 |
| device-heartbeat:stress-build-up-1 | `POST` | `/devices/heartbeat` | `200` | `true` | id=c9106db7-7451-4443-a51d-5bf3b8828a72, deviceId=android-m6-capture |
| call-event:stress-build-up-1 | `POST` | `/mobile/call-events` | `201` | `true` | id=ada65925-1b2d-44b3-bd42-bb0fb3cfb5e8, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-1 | `POST` | `/emotion/assessments` | `201` | `true` | id=948ad56c-235d-4a1b-ab81-2f6c70bf9ca3, deviceId=android-m6-capture, sessionId=ede12685-7b57-4be1-bb85-281bda19a405 |
| video-assessment:stress-build-up-1 | `POST` | `/video/assessments` | `201` | `true` | id=1587018f-70f9-46d5-aaa2-10aeb2ed8497, deviceId=android-m6-capture, sessionId=ede12685-7b57-4be1-bb85-281bda19a405 |
| health-snapshot:stress-build-up-1 | `POST` | `/health/snapshots` | `201` | `true` | id=2bc9fb6c-4cb0-4bbd-8625-bbfb74fc2294, deviceId=android-m6-capture |
| health-latest:stress-build-up-1 | `GET` | `/health/latest?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestId=2bc9fb6c-4cb0-4bbd-8625-bbfb74fc2294, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-1 | `GET` | `/dashboard/summary?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestHealthSnapshotId=2bc9fb6c-4cb0-4bbd-8625-bbfb74fc2294, edgeDeviceCount=1, inboxCount=8 |
| inbox-overview:stress-build-up-1 | `GET` | `/client/inbox/overview?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | totalMessages=9, latestBehaviorConclusionId=b39b8967-59a0-4c72-97b3-d36c3a798d4d |
| device-heartbeat:stress-build-up-2 | `POST` | `/devices/heartbeat` | `200` | `true` | id=c9106db7-7451-4443-a51d-5bf3b8828a72, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-2 | `POST` | `/emotion/assessments` | `201` | `true` | id=4adcab83-f3a8-4a49-a5c2-f42c1c298bcc, deviceId=android-m6-capture, sessionId=ede12685-7b57-4be1-bb85-281bda19a405 |
| video-assessment:stress-build-up-2 | `POST` | `/video/assessments` | `201` | `true` | id=e7b4e0ba-c187-4ae2-a4cf-bd485f1de9e7, deviceId=android-m6-capture, sessionId=ede12685-7b57-4be1-bb85-281bda19a405 |
| health-snapshot:stress-build-up-2 | `POST` | `/health/snapshots` | `201` | `true` | id=b8f58558-cb75-48a7-a204-6c06b427653f, deviceId=android-m6-capture |
| health-latest:stress-build-up-2 | `GET` | `/health/latest?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestId=b8f58558-cb75-48a7-a204-6c06b427653f, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-2 | `GET` | `/dashboard/summary?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestHealthSnapshotId=b8f58558-cb75-48a7-a204-6c06b427653f, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:stress-build-up-2 | `GET` | `/client/inbox/overview?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | totalMessages=14, latestBehaviorConclusionId=6f811db3-ad0b-4e33-a275-c95637584549 |
| recovery-plan:recovery-trigger | `POST` | `/recovery/plan` | `200` | `true` | id=b50b9b6e-f073-442f-bef2-66fb79532a0e, reason=attention_shift_after_interruption |
| recovery-history:recovery-trigger | `GET` | `/recovery/history?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestRecoveryPlanId=b50b9b6e-f073-442f-bef2-66fb79532a0e, recoveryPlanCount=1 |
| health-latest:recovery-trigger | `GET` | `/health/latest?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestId=b8f58558-cb75-48a7-a204-6c06b427653f, latestDeviceId=android-m6-capture |
| dashboard-summary:recovery-trigger | `GET` | `/dashboard/summary?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestHealthSnapshotId=b8f58558-cb75-48a7-a204-6c06b427653f, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:recovery-trigger | `GET` | `/client/inbox/overview?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | totalMessages=17, latestBehaviorConclusionId=cc0af262-8d9f-469b-a61e-a84f36290646, latestRecoveryPlanId=b50b9b6e-f073-442f-bef2-66fb79532a0e |
| device-heartbeat:post-recovery | `POST` | `/devices/heartbeat` | `200` | `true` | id=c9106db7-7451-4443-a51d-5bf3b8828a72, deviceId=android-m6-capture |
| emotion-assessment:post-recovery | `POST` | `/emotion/assessments` | `201` | `true` | id=ea1ad2d2-10e3-40ee-b8e5-a3a2d05e7102, deviceId=android-m6-capture, sessionId=ede12685-7b57-4be1-bb85-281bda19a405 |
| video-assessment:post-recovery | `POST` | `/video/assessments` | `201` | `true` | id=8148441e-2a20-4426-8160-e2a045bd7d89, deviceId=android-m6-capture, sessionId=ede12685-7b57-4be1-bb85-281bda19a405 |
| health-snapshot:post-recovery | `POST` | `/health/snapshots` | `201` | `true` | id=c48559e1-1d63-4e96-88c2-74eee7d5fa94, deviceId=android-m6-capture |
| recovery-history:post-recovery | `GET` | `/recovery/history?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestRecoveryPlanId=b50b9b6e-f073-442f-bef2-66fb79532a0e, recoveryPlanCount=1 |
| health-latest:post-recovery | `GET` | `/health/latest?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestId=c48559e1-1d63-4e96-88c2-74eee7d5fa94, latestDeviceId=android-m6-capture |
| client-inbox:post-recovery | `GET` | `/client/inbox?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | firstMessageId=ab6d5a9b-4e7a-46b1-9de6-740f185656f3, totalMessages=21 |
| inbox-ack:post-recovery | `POST` | `/client/inbox/ab6d5a9b-4e7a-46b1-9de6-740f185656f3/ack` | `200` | `true` | messageId=ab6d5a9b-4e7a-46b1-9de6-740f185656f3, status=acknowledged |
| dashboard-summary:post-recovery | `GET` | `/dashboard/summary?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | latestHealthSnapshotId=c48559e1-1d63-4e96-88c2-74eee7d5fa94, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:post-recovery | `GET` | `/client/inbox/overview?userId=9fabb6b7-aaf9-43d2-ac25-f98526fffe5b` | `200` | `true` | totalMessages=23, latestBehaviorConclusionId=1af79c1c-2049-4fdb-944f-01c86acf13a4, latestRecoveryPlanId=b50b9b6e-f073-442f-bef2-66fb79532a0e |
| audio-session-end:cadenced-finalize | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=ede12685-7b57-4be1-bb85-281bda19a405, status=completed |
| me:client-session | `GET` | `/me` | `401` | `false` | authenticated=false |

## Response IDs

```json
{
  "authUserId": "9fabb6b7-aaf9-43d2-ac25-f98526fffe5b",
  "authEmail": "m6-mobile-client@example.com",
  "mobileDeviceId": "8a8a9120-d4f0-4627-ab12-73cdc2866244",
  "audioSessionId": "ede12685-7b57-4be1-bb85-281bda19a405",
  "emotionAssessmentId": "ea1ad2d2-10e3-40ee-b8e5-a3a2d05e7102",
  "videoAssessmentId": "8148441e-2a20-4426-8160-e2a045bd7d89",
  "healthSnapshotId": "c48559e1-1d63-4e96-88c2-74eee7d5fa94",
  "callEventId": "ada65925-1b2d-44b3-bd42-bb0fb3cfb5e8",
  "audioSessionStatus": "completed"
}
```

## Error Samples

- me:client-session failed with HTTP 401
- read model check failed: healthLatestReflectsDevice
- read model check failed: dashboardReflectsDevice
- read model check failed: inboxOverviewOk
- read model check failed: inboxAckReflected
- read model check failed: recoveryPlanCreated
- read model check failed: recoveryHistoryReflectsPlan
- read model check failed: recoveryInboxConsistent
- read model check failed: recoveryDashboardConsistent
- client session check failed: clientMeOk
