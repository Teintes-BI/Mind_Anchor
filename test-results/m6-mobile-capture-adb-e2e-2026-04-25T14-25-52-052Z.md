# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-25T14:25:52.053Z`
- completedAt: `2026-04-25T14:27:02.074Z`
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

- totalSteps: `63`
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

## Client Polling

- enabled: `true`
- durationMs: `30000`
- intervalMs: `5000`
- completed: `true`
- pollCount: `4`
- allOk: `true`
- bootstrapStable: `true`
- inboxReadable: `true`
- ackStatusStable: `true`

- round 1: elapsedMs=`0`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee`, inboxMessageCount=`33`, overviewMessageCount=`34`, acknowledgedMessageVisible=`true`
- round 2: elapsedMs=`13247`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee`, inboxMessageCount=`37`, overviewMessageCount=`38`, acknowledgedMessageVisible=`true`
- round 3: elapsedMs=`22509`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee`, inboxMessageCount=`41`, overviewMessageCount=`42`, acknowledgedMessageVisible=`true`
- round 4: elapsedMs=`29502`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee`, inboxMessageCount=`45`, overviewMessageCount=`46`, acknowledgedMessageVisible=`true`

## Phases

- baseline: latestHealthId=`55d038e3-caf3-4f32-80ef-213da842a3c4`, latestRecoveryPlanId=`—`, inboxMessageCount=`3`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-1: latestHealthId=`07281676-66df-4bec-86ec-96beb7c04770`, latestRecoveryPlanId=`—`, inboxMessageCount=`9`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-2: latestHealthId=`d09506c0-91b9-4be2-b74a-f2dfb4cd28d9`, latestRecoveryPlanId=`—`, inboxMessageCount=`14`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- recovery-trigger: latestHealthId=`d09506c0-91b9-4be2-b74a-f2dfb4cd28d9`, latestRecoveryPlanId=`18db0d76-2cbd-49ef-bee8-9bfc46fa646f`, inboxMessageCount=`17`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- post-recovery: latestHealthId=`4f7b1953-12a4-43ef-b659-c768d2ee4659`, latestRecoveryPlanId=`18db0d76-2cbd-49ef-bee8-9bfc46fa646f`, inboxMessageCount=`23`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| auth-login | `POST` | `/auth/login` | `401` | `false` | accessTokenPresent=false |
| auth-register | `POST` | `/auth/register` | `200` | `true` | userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee, email=m6-mobile-client@example.com, accessTokenPresent=true |
| auth-login:retry | `POST` | `/auth/login` | `200` | `true` | userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee, email=m6-mobile-client@example.com, accessTokenPresent=true |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=7453d262-3b46-443a-b42b-9f2274086c7e, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=caaf12c8-b667-4f62-9bb8-e994c501613c, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=caaf12c8-b667-4f62-9bb8-e994c501613c, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=d8e3585a-0c48-4cae-8f96-81cef926b77d, status=active |
| device-heartbeat:baseline | `POST` | `/devices/heartbeat` | `200` | `true` | id=caaf12c8-b667-4f62-9bb8-e994c501613c, deviceId=android-m6-capture |
| emotion-assessment:baseline | `POST` | `/emotion/assessments` | `201` | `true` | id=25759194-fee6-40d6-9686-f7ceedffd215, deviceId=android-m6-capture, sessionId=d8e3585a-0c48-4cae-8f96-81cef926b77d |
| video-assessment:baseline | `POST` | `/video/assessments` | `201` | `true` | id=d52aeb12-ecbf-4534-aa09-7b01733c0eb6, deviceId=android-m6-capture, sessionId=d8e3585a-0c48-4cae-8f96-81cef926b77d |
| health-snapshot:baseline | `POST` | `/health/snapshots` | `201` | `true` | id=55d038e3-caf3-4f32-80ef-213da842a3c4, deviceId=android-m6-capture |
| health-latest:baseline | `GET` | `/health/latest?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestId=55d038e3-caf3-4f32-80ef-213da842a3c4, latestDeviceId=android-m6-capture |
| dashboard-summary:baseline | `GET` | `/dashboard/summary?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestHealthSnapshotId=55d038e3-caf3-4f32-80ef-213da842a3c4, edgeDeviceCount=1, inboxCount=3 |
| inbox-overview:baseline | `GET` | `/client/inbox/overview?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | totalMessages=3, latestBehaviorConclusionId=a92c3fbf-c870-4f60-8fef-796b61a20bf2 |
| device-heartbeat:stress-build-up-1 | `POST` | `/devices/heartbeat` | `200` | `true` | id=caaf12c8-b667-4f62-9bb8-e994c501613c, deviceId=android-m6-capture |
| call-event:stress-build-up-1 | `POST` | `/mobile/call-events` | `201` | `true` | id=612ba9de-6174-4fb4-b782-705cfd121dfb, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-1 | `POST` | `/emotion/assessments` | `201` | `true` | id=3dfed85b-773a-495d-9137-b8ec4728450f, deviceId=android-m6-capture, sessionId=d8e3585a-0c48-4cae-8f96-81cef926b77d |
| video-assessment:stress-build-up-1 | `POST` | `/video/assessments` | `201` | `true` | id=12a93519-83a4-4d75-ad67-3bc5f26d144c, deviceId=android-m6-capture, sessionId=d8e3585a-0c48-4cae-8f96-81cef926b77d |
| health-snapshot:stress-build-up-1 | `POST` | `/health/snapshots` | `201` | `true` | id=07281676-66df-4bec-86ec-96beb7c04770, deviceId=android-m6-capture |
| health-latest:stress-build-up-1 | `GET` | `/health/latest?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestId=07281676-66df-4bec-86ec-96beb7c04770, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-1 | `GET` | `/dashboard/summary?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestHealthSnapshotId=07281676-66df-4bec-86ec-96beb7c04770, edgeDeviceCount=1, inboxCount=8 |
| inbox-overview:stress-build-up-1 | `GET` | `/client/inbox/overview?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | totalMessages=9, latestBehaviorConclusionId=8a1f72e0-856b-4873-8509-6a25159b0559 |
| device-heartbeat:stress-build-up-2 | `POST` | `/devices/heartbeat` | `200` | `true` | id=caaf12c8-b667-4f62-9bb8-e994c501613c, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-2 | `POST` | `/emotion/assessments` | `201` | `true` | id=bbd03aba-7010-4e13-81c1-97d996eb26fe, deviceId=android-m6-capture, sessionId=d8e3585a-0c48-4cae-8f96-81cef926b77d |
| video-assessment:stress-build-up-2 | `POST` | `/video/assessments` | `201` | `true` | id=ade5ffd6-529f-4693-9ca7-362fefa7e6f7, deviceId=android-m6-capture, sessionId=d8e3585a-0c48-4cae-8f96-81cef926b77d |
| health-snapshot:stress-build-up-2 | `POST` | `/health/snapshots` | `201` | `true` | id=d09506c0-91b9-4be2-b74a-f2dfb4cd28d9, deviceId=android-m6-capture |
| health-latest:stress-build-up-2 | `GET` | `/health/latest?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestId=d09506c0-91b9-4be2-b74a-f2dfb4cd28d9, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-2 | `GET` | `/dashboard/summary?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestHealthSnapshotId=d09506c0-91b9-4be2-b74a-f2dfb4cd28d9, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:stress-build-up-2 | `GET` | `/client/inbox/overview?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | totalMessages=14, latestBehaviorConclusionId=bb9056ae-a8ee-442d-95d5-d8e267d6de1f |
| recovery-plan:recovery-trigger | `POST` | `/recovery/plan` | `200` | `true` | id=18db0d76-2cbd-49ef-bee8-9bfc46fa646f, reason=attention_shift_after_interruption |
| recovery-history:recovery-trigger | `GET` | `/recovery/history?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestRecoveryPlanId=18db0d76-2cbd-49ef-bee8-9bfc46fa646f, recoveryPlanCount=1 |
| health-latest:recovery-trigger | `GET` | `/health/latest?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestId=d09506c0-91b9-4be2-b74a-f2dfb4cd28d9, latestDeviceId=android-m6-capture |
| dashboard-summary:recovery-trigger | `GET` | `/dashboard/summary?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestHealthSnapshotId=d09506c0-91b9-4be2-b74a-f2dfb4cd28d9, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:recovery-trigger | `GET` | `/client/inbox/overview?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | totalMessages=17, latestBehaviorConclusionId=2feee1a2-7993-4da4-9e64-e9b68535fa4c, latestRecoveryPlanId=18db0d76-2cbd-49ef-bee8-9bfc46fa646f |
| device-heartbeat:post-recovery | `POST` | `/devices/heartbeat` | `200` | `true` | id=caaf12c8-b667-4f62-9bb8-e994c501613c, deviceId=android-m6-capture |
| emotion-assessment:post-recovery | `POST` | `/emotion/assessments` | `201` | `true` | id=7f6e85dd-6955-44a9-ab4a-560534f15aeb, deviceId=android-m6-capture, sessionId=d8e3585a-0c48-4cae-8f96-81cef926b77d |
| video-assessment:post-recovery | `POST` | `/video/assessments` | `201` | `true` | id=8de676ca-ff3a-4d67-9cd4-3c678d55217a, deviceId=android-m6-capture, sessionId=d8e3585a-0c48-4cae-8f96-81cef926b77d |
| health-snapshot:post-recovery | `POST` | `/health/snapshots` | `201` | `true` | id=4f7b1953-12a4-43ef-b659-c768d2ee4659, deviceId=android-m6-capture |
| recovery-history:post-recovery | `GET` | `/recovery/history?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestRecoveryPlanId=18db0d76-2cbd-49ef-bee8-9bfc46fa646f, recoveryPlanCount=1 |
| health-latest:post-recovery | `GET` | `/health/latest?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestId=4f7b1953-12a4-43ef-b659-c768d2ee4659, latestDeviceId=android-m6-capture |
| client-inbox:post-recovery | `GET` | `/client/inbox?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | firstMessageId=4defd8e3-00b5-4ba2-a6c9-06097a01fca7, totalMessages=21 |
| inbox-ack:post-recovery | `POST` | `/client/inbox/4defd8e3-00b5-4ba2-a6c9-06097a01fca7/ack` | `200` | `true` | messageId=4defd8e3-00b5-4ba2-a6c9-06097a01fca7, status=acknowledged |
| dashboard-summary:post-recovery | `GET` | `/dashboard/summary?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | latestHealthSnapshotId=4f7b1953-12a4-43ef-b659-c768d2ee4659, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:post-recovery | `GET` | `/client/inbox/overview?userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee` | `200` | `true` | totalMessages=23, latestBehaviorConclusionId=019637e4-8b0d-4509-992d-282429624206, latestRecoveryPlanId=18db0d76-2cbd-49ef-bee8-9bfc46fa646f |
| audio-session-end:cadenced-finalize | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=d8e3585a-0c48-4cae-8f96-81cef926b77d, status=completed |
| me:client-session | `GET` | `/me` | `200` | `true` | userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee, email=m6-mobile-client@example.com, authenticated=true |
| client-bootstrap:client-session | `GET` | `/client/bootstrap` | `200` | `true` | userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee, inboxMessageCount=20 |
| client-inbox:client-session | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=8f955fce-02d0-4e0c-b92d-07a4a50ebc42, totalMessages=26 |
| inbox-ack:client-session | `POST` | `/client/inbox/8f955fce-02d0-4e0c-b92d-07a4a50ebc42/ack` | `200` | `true` | messageId=8f955fce-02d0-4e0c-b92d-07a4a50ebc42, status=acknowledged |
| inbox-overview:client-session | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=27, latestBehaviorConclusionId=98e2050c-cf13-45a5-a249-648d4c1ec339, latestRecoveryPlanId=18db0d76-2cbd-49ef-bee8-9bfc46fa646f |
| client-bootstrap:client-session-refresh | `GET` | `/client/bootstrap` | `200` | `true` | userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee, inboxMessageCount=20 |
| client-bootstrap:client-session-poll-1 | `GET` | `/client/bootstrap` | `200` | `true` | userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee, inboxMessageCount=20 |
| client-inbox:client-session-poll-1 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=34906a3f-2672-4fc0-b489-d4afb970b014, totalMessages=33 |
| inbox-overview:client-session-poll-1 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=34, latestBehaviorConclusionId=03933a14-16b8-4c99-aa1e-812c99844bbf, latestRecoveryPlanId=18db0d76-2cbd-49ef-bee8-9bfc46fa646f |
| client-bootstrap:client-session-poll-2 | `GET` | `/client/bootstrap` | `200` | `true` | userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee, inboxMessageCount=20 |
| client-inbox:client-session-poll-2 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=d27e958a-3128-4de5-8330-263fd9313581, totalMessages=37 |
| inbox-overview:client-session-poll-2 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=38, latestBehaviorConclusionId=edde9de4-f2f5-4e27-a1d6-3d5eb729d607, latestRecoveryPlanId=18db0d76-2cbd-49ef-bee8-9bfc46fa646f |
| client-bootstrap:client-session-poll-3 | `GET` | `/client/bootstrap` | `200` | `true` | userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee, inboxMessageCount=20 |
| client-inbox:client-session-poll-3 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=013e16c9-3013-4311-94b4-46f2e44b4177, totalMessages=41 |
| inbox-overview:client-session-poll-3 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=42, latestBehaviorConclusionId=3db33f97-5176-4ccc-b143-b2f23af47857, latestRecoveryPlanId=18db0d76-2cbd-49ef-bee8-9bfc46fa646f |
| client-bootstrap:client-session-poll-4 | `GET` | `/client/bootstrap` | `200` | `true` | userId=b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee, inboxMessageCount=20 |
| client-inbox:client-session-poll-4 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=c67ea181-62c0-49cb-9010-46c2c38a23f9, totalMessages=45 |
| inbox-overview:client-session-poll-4 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=46, latestBehaviorConclusionId=9357d338-e736-4d97-bac1-edfa43307acf, latestRecoveryPlanId=18db0d76-2cbd-49ef-bee8-9bfc46fa646f |

## Response IDs

```json
{
  "authUserId": "b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee",
  "authEmail": "m6-mobile-client@example.com",
  "mobileDeviceId": "7453d262-3b46-443a-b42b-9f2274086c7e",
  "audioSessionId": "d8e3585a-0c48-4cae-8f96-81cef926b77d",
  "emotionAssessmentId": "7f6e85dd-6955-44a9-ab4a-560534f15aeb",
  "videoAssessmentId": "8de676ca-ff3a-4d67-9cd4-3c678d55217a",
  "healthSnapshotId": "4f7b1953-12a4-43ef-b659-c768d2ee4659",
  "callEventId": "612ba9de-6174-4fb4-b782-705cfd121dfb",
  "audioSessionStatus": "completed",
  "clientInboxAckMessageId": "8f955fce-02d0-4e0c-b92d-07a4a50ebc42",
  "clientPollingPollCount": 4,
  "clientBootstrapUserId": "b2bd83b4-70bd-49a8-8d1c-6296b7b2c2ee",
  "recoveryPlanId": "18db0d76-2cbd-49ef-bee8-9bfc46fa646f",
  "recoveryPlanReason": "attention_shift_after_interruption",
  "recoveryHistoryLatestPlanId": "18db0d76-2cbd-49ef-bee8-9bfc46fa646f",
  "recoveryHistoryPlanCount": 1,
  "inboxAckMessageId": "4defd8e3-00b5-4ba2-a6c9-06097a01fca7",
  "inboxAckStatus": "acknowledged",
  "latestHealthId": "4f7b1953-12a4-43ef-b659-c768d2ee4659",
  "latestHealthDeviceId": "android-m6-capture",
  "dashboardLatestHealthSnapshotId": "4f7b1953-12a4-43ef-b659-c768d2ee4659",
  "dashboardEdgeDeviceCount": 1,
  "dashboardLatestRecoveryPlanId": "18db0d76-2cbd-49ef-bee8-9bfc46fa646f",
  "inboxMessageCount": 23,
  "inboxLatestRiskLevel": "high",
  "inboxLatestRecoveryPlanId": "18db0d76-2cbd-49ef-bee8-9bfc46fa646f"
}
```

## Error Samples

- none
