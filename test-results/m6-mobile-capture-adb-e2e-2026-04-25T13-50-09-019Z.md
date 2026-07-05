# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-25T13:50:09.019Z`
- completedAt: `2026-04-25T13:50:16.521Z`
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

- baseline: latestHealthId=`903c6283-f0d5-46b8-a857-9652c315e4dd`, latestRecoveryPlanId=`—`, inboxMessageCount=`3`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-1: latestHealthId=`8fca40f4-49f9-4f8e-b71c-b1980bd34e43`, latestRecoveryPlanId=`—`, inboxMessageCount=`9`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-2: latestHealthId=`b1157a75-62d7-4a84-b4c6-27276b88b0db`, latestRecoveryPlanId=`—`, inboxMessageCount=`14`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- recovery-trigger: latestHealthId=`b1157a75-62d7-4a84-b4c6-27276b88b0db`, latestRecoveryPlanId=`219ee810-c3b6-40e0-8979-bc737e552773`, inboxMessageCount=`17`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- post-recovery: latestHealthId=`27756267-7f71-4209-bd6a-eb4adf509adb`, latestRecoveryPlanId=`219ee810-c3b6-40e0-8979-bc737e552773`, inboxMessageCount=`23`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| auth-login | `POST` | `/auth/login` | `401` | `false` | accessTokenPresent=false |
| auth-register | `POST` | `/auth/register` | `200` | `true` | userId=4ecba48e-a299-48b5-a963-fa4d074d27fd, email=m6-mobile-client@example.com, accessTokenPresent=true |
| auth-login:retry | `POST` | `/auth/login` | `200` | `true` | userId=4ecba48e-a299-48b5-a963-fa4d074d27fd, email=m6-mobile-client@example.com, accessTokenPresent=true |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=5a65a4a6-a5e3-49bd-b640-f2592be6d395, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=a1e7ef31-ef2f-431a-8cde-485f13dec160, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=a1e7ef31-ef2f-431a-8cde-485f13dec160, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=61997fce-69de-4dd4-84ab-425fee4d18f2, status=active |
| device-heartbeat:baseline | `POST` | `/devices/heartbeat` | `200` | `true` | id=a1e7ef31-ef2f-431a-8cde-485f13dec160, deviceId=android-m6-capture |
| emotion-assessment:baseline | `POST` | `/emotion/assessments` | `201` | `true` | id=5356344d-825e-4cea-926c-bd6515ec227a, deviceId=android-m6-capture, sessionId=61997fce-69de-4dd4-84ab-425fee4d18f2 |
| video-assessment:baseline | `POST` | `/video/assessments` | `201` | `true` | id=34fe2a8d-b4e5-4329-bf8e-f1398c03620f, deviceId=android-m6-capture, sessionId=61997fce-69de-4dd4-84ab-425fee4d18f2 |
| health-snapshot:baseline | `POST` | `/health/snapshots` | `201` | `true` | id=903c6283-f0d5-46b8-a857-9652c315e4dd, deviceId=android-m6-capture |
| health-latest:baseline | `GET` | `/health/latest?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestId=903c6283-f0d5-46b8-a857-9652c315e4dd, latestDeviceId=android-m6-capture |
| dashboard-summary:baseline | `GET` | `/dashboard/summary?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestHealthSnapshotId=903c6283-f0d5-46b8-a857-9652c315e4dd, edgeDeviceCount=1, inboxCount=3 |
| inbox-overview:baseline | `GET` | `/client/inbox/overview?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | totalMessages=3, latestBehaviorConclusionId=31630113-ce22-445f-b361-ef2be81a5f30 |
| device-heartbeat:stress-build-up-1 | `POST` | `/devices/heartbeat` | `200` | `true` | id=a1e7ef31-ef2f-431a-8cde-485f13dec160, deviceId=android-m6-capture |
| call-event:stress-build-up-1 | `POST` | `/mobile/call-events` | `201` | `true` | id=7429bac2-ba3e-44f0-8578-fa3b4a5ca59c, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-1 | `POST` | `/emotion/assessments` | `201` | `true` | id=75f55fc3-bc0e-41e9-8ee2-0b99aa0145b2, deviceId=android-m6-capture, sessionId=61997fce-69de-4dd4-84ab-425fee4d18f2 |
| video-assessment:stress-build-up-1 | `POST` | `/video/assessments` | `201` | `true` | id=7c3f610d-9fbb-48d1-87c0-fa5af79291ea, deviceId=android-m6-capture, sessionId=61997fce-69de-4dd4-84ab-425fee4d18f2 |
| health-snapshot:stress-build-up-1 | `POST` | `/health/snapshots` | `201` | `true` | id=8fca40f4-49f9-4f8e-b71c-b1980bd34e43, deviceId=android-m6-capture |
| health-latest:stress-build-up-1 | `GET` | `/health/latest?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestId=8fca40f4-49f9-4f8e-b71c-b1980bd34e43, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-1 | `GET` | `/dashboard/summary?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestHealthSnapshotId=8fca40f4-49f9-4f8e-b71c-b1980bd34e43, edgeDeviceCount=1, inboxCount=8 |
| inbox-overview:stress-build-up-1 | `GET` | `/client/inbox/overview?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | totalMessages=9, latestBehaviorConclusionId=5e3946dd-7e5d-4454-8374-25defe0117e6 |
| device-heartbeat:stress-build-up-2 | `POST` | `/devices/heartbeat` | `200` | `true` | id=a1e7ef31-ef2f-431a-8cde-485f13dec160, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-2 | `POST` | `/emotion/assessments` | `201` | `true` | id=9357e186-875a-465b-a8bd-6db9ff0b5386, deviceId=android-m6-capture, sessionId=61997fce-69de-4dd4-84ab-425fee4d18f2 |
| video-assessment:stress-build-up-2 | `POST` | `/video/assessments` | `201` | `true` | id=0cd33e2d-efa0-4fb9-b91b-31b1ca92d2ca, deviceId=android-m6-capture, sessionId=61997fce-69de-4dd4-84ab-425fee4d18f2 |
| health-snapshot:stress-build-up-2 | `POST` | `/health/snapshots` | `201` | `true` | id=b1157a75-62d7-4a84-b4c6-27276b88b0db, deviceId=android-m6-capture |
| health-latest:stress-build-up-2 | `GET` | `/health/latest?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestId=b1157a75-62d7-4a84-b4c6-27276b88b0db, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-2 | `GET` | `/dashboard/summary?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestHealthSnapshotId=b1157a75-62d7-4a84-b4c6-27276b88b0db, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:stress-build-up-2 | `GET` | `/client/inbox/overview?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | totalMessages=14, latestBehaviorConclusionId=5745d10a-e39f-4fd0-9fb8-62ddf136d39a |
| recovery-plan:recovery-trigger | `POST` | `/recovery/plan` | `200` | `true` | id=219ee810-c3b6-40e0-8979-bc737e552773, reason=attention_shift_after_interruption |
| recovery-history:recovery-trigger | `GET` | `/recovery/history?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestRecoveryPlanId=219ee810-c3b6-40e0-8979-bc737e552773, recoveryPlanCount=1 |
| health-latest:recovery-trigger | `GET` | `/health/latest?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestId=b1157a75-62d7-4a84-b4c6-27276b88b0db, latestDeviceId=android-m6-capture |
| dashboard-summary:recovery-trigger | `GET` | `/dashboard/summary?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestHealthSnapshotId=b1157a75-62d7-4a84-b4c6-27276b88b0db, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:recovery-trigger | `GET` | `/client/inbox/overview?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | totalMessages=17, latestBehaviorConclusionId=04f4a0eb-f5a1-4183-861b-12d18c2a07b8, latestRecoveryPlanId=219ee810-c3b6-40e0-8979-bc737e552773 |
| device-heartbeat:post-recovery | `POST` | `/devices/heartbeat` | `200` | `true` | id=a1e7ef31-ef2f-431a-8cde-485f13dec160, deviceId=android-m6-capture |
| emotion-assessment:post-recovery | `POST` | `/emotion/assessments` | `201` | `true` | id=d511ca93-715b-440c-a42f-e916e5cf6810, deviceId=android-m6-capture, sessionId=61997fce-69de-4dd4-84ab-425fee4d18f2 |
| video-assessment:post-recovery | `POST` | `/video/assessments` | `201` | `true` | id=7d9bddff-b6a7-48ff-a98c-c9ecc727eaf7, deviceId=android-m6-capture, sessionId=61997fce-69de-4dd4-84ab-425fee4d18f2 |
| health-snapshot:post-recovery | `POST` | `/health/snapshots` | `201` | `true` | id=27756267-7f71-4209-bd6a-eb4adf509adb, deviceId=android-m6-capture |
| recovery-history:post-recovery | `GET` | `/recovery/history?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestRecoveryPlanId=219ee810-c3b6-40e0-8979-bc737e552773, recoveryPlanCount=1 |
| health-latest:post-recovery | `GET` | `/health/latest?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestId=27756267-7f71-4209-bd6a-eb4adf509adb, latestDeviceId=android-m6-capture |
| client-inbox:post-recovery | `GET` | `/client/inbox?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | firstMessageId=6a5106a8-d516-48da-923c-fb51e07cf09f, totalMessages=21 |
| inbox-ack:post-recovery | `POST` | `/client/inbox/6a5106a8-d516-48da-923c-fb51e07cf09f/ack` | `200` | `true` | messageId=6a5106a8-d516-48da-923c-fb51e07cf09f, status=acknowledged |
| dashboard-summary:post-recovery | `GET` | `/dashboard/summary?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | latestHealthSnapshotId=27756267-7f71-4209-bd6a-eb4adf509adb, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:post-recovery | `GET` | `/client/inbox/overview?userId=4ecba48e-a299-48b5-a963-fa4d074d27fd` | `200` | `true` | totalMessages=23, latestBehaviorConclusionId=533fefee-1b99-4774-903f-b1ddaf6b18a1, latestRecoveryPlanId=219ee810-c3b6-40e0-8979-bc737e552773 |
| audio-session-end:cadenced-finalize | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=61997fce-69de-4dd4-84ab-425fee4d18f2, status=completed |
| me:client-session | `GET` | `/me` | `200` | `true` | userId=4ecba48e-a299-48b5-a963-fa4d074d27fd, email=m6-mobile-client@example.com, authenticated=true |
| client-bootstrap:client-session | `GET` | `/client/bootstrap` | `200` | `true` | userId=4ecba48e-a299-48b5-a963-fa4d074d27fd, inboxMessageCount=20 |
| client-inbox:client-session | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=31f62db3-bd07-4df4-8cd4-0bb17c140452, totalMessages=26 |
| inbox-ack:client-session | `POST` | `/client/inbox/31f62db3-bd07-4df4-8cd4-0bb17c140452/ack` | `200` | `true` | messageId=31f62db3-bd07-4df4-8cd4-0bb17c140452, status=acknowledged |
| inbox-overview:client-session | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=27, latestBehaviorConclusionId=d832a458-0049-44c2-a821-3b3368d63c9d, latestRecoveryPlanId=219ee810-c3b6-40e0-8979-bc737e552773 |
| client-bootstrap:client-session-refresh | `GET` | `/client/bootstrap` | `200` | `true` | userId=4ecba48e-a299-48b5-a963-fa4d074d27fd, inboxMessageCount=20 |

## Response IDs

```json
{
  "authUserId": "4ecba48e-a299-48b5-a963-fa4d074d27fd",
  "authEmail": "m6-mobile-client@example.com",
  "mobileDeviceId": "5a65a4a6-a5e3-49bd-b640-f2592be6d395",
  "audioSessionId": "61997fce-69de-4dd4-84ab-425fee4d18f2",
  "emotionAssessmentId": "d511ca93-715b-440c-a42f-e916e5cf6810",
  "videoAssessmentId": "7d9bddff-b6a7-48ff-a98c-c9ecc727eaf7",
  "healthSnapshotId": "27756267-7f71-4209-bd6a-eb4adf509adb",
  "callEventId": "7429bac2-ba3e-44f0-8578-fa3b4a5ca59c",
  "audioSessionStatus": "completed",
  "clientInboxAckMessageId": "31f62db3-bd07-4df4-8cd4-0bb17c140452",
  "clientBootstrapUserId": "4ecba48e-a299-48b5-a963-fa4d074d27fd",
  "recoveryPlanId": "219ee810-c3b6-40e0-8979-bc737e552773",
  "recoveryPlanReason": "attention_shift_after_interruption",
  "recoveryHistoryLatestPlanId": "219ee810-c3b6-40e0-8979-bc737e552773",
  "recoveryHistoryPlanCount": 1,
  "inboxAckMessageId": "6a5106a8-d516-48da-923c-fb51e07cf09f",
  "inboxAckStatus": "acknowledged",
  "latestHealthId": "27756267-7f71-4209-bd6a-eb4adf509adb",
  "latestHealthDeviceId": "android-m6-capture",
  "dashboardLatestHealthSnapshotId": "27756267-7f71-4209-bd6a-eb4adf509adb",
  "dashboardEdgeDeviceCount": 1,
  "dashboardLatestRecoveryPlanId": "219ee810-c3b6-40e0-8979-bc737e552773",
  "inboxMessageCount": 23,
  "inboxLatestRiskLevel": "high",
  "inboxLatestRecoveryPlanId": "219ee810-c3b6-40e0-8979-bc737e552773"
}
```

## Error Samples

- none
