# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-25T14:36:20.229Z`
- completedAt: `2026-04-25T14:37:01.152Z`
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

- totalSteps: `73`
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
- pollCount: `6`
- allOk: `true`
- bootstrapStable: `true`
- inboxReadable: `true`
- ackStatusStable: `true`

- round 1: elapsedMs=`0`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`a8d4f1ba-6c8e-4f20-9655-1565ba114bea`, inboxMessageCount=`33`, overviewMessageCount=`34`, acknowledgedMessageVisible=`true`
- round 2: elapsedMs=`5758`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`a8d4f1ba-6c8e-4f20-9655-1565ba114bea`, inboxMessageCount=`37`, overviewMessageCount=`38`, acknowledgedMessageVisible=`true`
- round 3: elapsedMs=`11578`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`a8d4f1ba-6c8e-4f20-9655-1565ba114bea`, inboxMessageCount=`41`, overviewMessageCount=`42`, acknowledgedMessageVisible=`true`
- round 4: elapsedMs=`17452`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`a8d4f1ba-6c8e-4f20-9655-1565ba114bea`, inboxMessageCount=`45`, overviewMessageCount=`46`, acknowledgedMessageVisible=`true`
- round 5: elapsedMs=`23295`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`a8d4f1ba-6c8e-4f20-9655-1565ba114bea`, inboxMessageCount=`49`, overviewMessageCount=`50`, acknowledgedMessageVisible=`true`
- round 6: elapsedMs=`29085`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`a8d4f1ba-6c8e-4f20-9655-1565ba114bea`, inboxMessageCount=`50`, overviewMessageCount=`50`, acknowledgedMessageVisible=`true`

## Session Recovery

- enabled: `true`
- tokenStorage: `android-temp-file`
- tokenFilePath: `/data/local/tmp/client-session-recovery-token.json`
- tokenPersisted: `true`
- tokenReloaded: `true`
- meOk: `true`
- bootstrapOk: `true`
- inboxOk: `true`
- overviewOk: `true`
- userStable: `true`
- recoveredUserId: `a8d4f1ba-6c8e-4f20-9655-1565ba114bea`

## Phases

- baseline: latestHealthId=`5536bb20-c580-4e89-b1bf-a8b8872a92bb`, latestRecoveryPlanId=`—`, inboxMessageCount=`3`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-1: latestHealthId=`eee6920a-38e4-40be-8cc7-c6c32f4271f0`, latestRecoveryPlanId=`—`, inboxMessageCount=`9`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-2: latestHealthId=`1e4b2d17-25a5-4542-b896-11886f2daf5a`, latestRecoveryPlanId=`—`, inboxMessageCount=`14`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- recovery-trigger: latestHealthId=`1e4b2d17-25a5-4542-b896-11886f2daf5a`, latestRecoveryPlanId=`d4bcf5c9-79e2-483b-93bd-ccd661464a41`, inboxMessageCount=`17`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- post-recovery: latestHealthId=`396295e6-11c0-46bf-9311-7283cfcaa875`, latestRecoveryPlanId=`d4bcf5c9-79e2-483b-93bd-ccd661464a41`, inboxMessageCount=`23`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| auth-login | `POST` | `/auth/login` | `401` | `false` | accessTokenPresent=false |
| auth-register | `POST` | `/auth/register` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, email=m6-mobile-client@example.com, accessTokenPresent=true |
| auth-login:retry | `POST` | `/auth/login` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, email=m6-mobile-client@example.com, accessTokenPresent=true |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=1e308b47-b579-470c-95f8-70c5e7499b65, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=54229750-559a-460b-af63-19d1b382cb2b, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=54229750-559a-460b-af63-19d1b382cb2b, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=66d6db39-44bf-463f-a13b-82289e2d4734, status=active |
| device-heartbeat:baseline | `POST` | `/devices/heartbeat` | `200` | `true` | id=54229750-559a-460b-af63-19d1b382cb2b, deviceId=android-m6-capture |
| emotion-assessment:baseline | `POST` | `/emotion/assessments` | `201` | `true` | id=68c6ac0d-2b18-4275-9929-68e292cf9ed6, deviceId=android-m6-capture, sessionId=66d6db39-44bf-463f-a13b-82289e2d4734 |
| video-assessment:baseline | `POST` | `/video/assessments` | `201` | `true` | id=653a6676-75f8-4e76-9ff2-7fbf7bdea701, deviceId=android-m6-capture, sessionId=66d6db39-44bf-463f-a13b-82289e2d4734 |
| health-snapshot:baseline | `POST` | `/health/snapshots` | `201` | `true` | id=5536bb20-c580-4e89-b1bf-a8b8872a92bb, deviceId=android-m6-capture |
| health-latest:baseline | `GET` | `/health/latest?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestId=5536bb20-c580-4e89-b1bf-a8b8872a92bb, latestDeviceId=android-m6-capture |
| dashboard-summary:baseline | `GET` | `/dashboard/summary?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestHealthSnapshotId=5536bb20-c580-4e89-b1bf-a8b8872a92bb, edgeDeviceCount=1, inboxCount=3 |
| inbox-overview:baseline | `GET` | `/client/inbox/overview?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | totalMessages=3, latestBehaviorConclusionId=e7767cd0-ef94-41bb-b7f3-c49633ea4e42 |
| device-heartbeat:stress-build-up-1 | `POST` | `/devices/heartbeat` | `200` | `true` | id=54229750-559a-460b-af63-19d1b382cb2b, deviceId=android-m6-capture |
| call-event:stress-build-up-1 | `POST` | `/mobile/call-events` | `201` | `true` | id=209e5ba1-3a4f-4dc3-8b87-cd1e232ebe83, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-1 | `POST` | `/emotion/assessments` | `201` | `true` | id=eb05422e-394d-46f5-875a-dced282af201, deviceId=android-m6-capture, sessionId=66d6db39-44bf-463f-a13b-82289e2d4734 |
| video-assessment:stress-build-up-1 | `POST` | `/video/assessments` | `201` | `true` | id=5f5a25be-76f0-4972-b87d-3a60552d2f9b, deviceId=android-m6-capture, sessionId=66d6db39-44bf-463f-a13b-82289e2d4734 |
| health-snapshot:stress-build-up-1 | `POST` | `/health/snapshots` | `201` | `true` | id=eee6920a-38e4-40be-8cc7-c6c32f4271f0, deviceId=android-m6-capture |
| health-latest:stress-build-up-1 | `GET` | `/health/latest?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestId=eee6920a-38e4-40be-8cc7-c6c32f4271f0, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-1 | `GET` | `/dashboard/summary?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestHealthSnapshotId=eee6920a-38e4-40be-8cc7-c6c32f4271f0, edgeDeviceCount=1, inboxCount=8 |
| inbox-overview:stress-build-up-1 | `GET` | `/client/inbox/overview?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | totalMessages=9, latestBehaviorConclusionId=ec538a28-af36-4684-b84e-462e31d45d91 |
| device-heartbeat:stress-build-up-2 | `POST` | `/devices/heartbeat` | `200` | `true` | id=54229750-559a-460b-af63-19d1b382cb2b, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-2 | `POST` | `/emotion/assessments` | `201` | `true` | id=c42ffaab-7ec4-4a7c-8b02-ac486b60481f, deviceId=android-m6-capture, sessionId=66d6db39-44bf-463f-a13b-82289e2d4734 |
| video-assessment:stress-build-up-2 | `POST` | `/video/assessments` | `201` | `true` | id=dfcdd892-a017-4232-9796-4130f4a03967, deviceId=android-m6-capture, sessionId=66d6db39-44bf-463f-a13b-82289e2d4734 |
| health-snapshot:stress-build-up-2 | `POST` | `/health/snapshots` | `201` | `true` | id=1e4b2d17-25a5-4542-b896-11886f2daf5a, deviceId=android-m6-capture |
| health-latest:stress-build-up-2 | `GET` | `/health/latest?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestId=1e4b2d17-25a5-4542-b896-11886f2daf5a, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-2 | `GET` | `/dashboard/summary?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestHealthSnapshotId=1e4b2d17-25a5-4542-b896-11886f2daf5a, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:stress-build-up-2 | `GET` | `/client/inbox/overview?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | totalMessages=14, latestBehaviorConclusionId=64f81b48-cae6-43a1-91d3-af566b14a431 |
| recovery-plan:recovery-trigger | `POST` | `/recovery/plan` | `200` | `true` | id=d4bcf5c9-79e2-483b-93bd-ccd661464a41, reason=attention_shift_after_interruption |
| recovery-history:recovery-trigger | `GET` | `/recovery/history?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41, recoveryPlanCount=1 |
| health-latest:recovery-trigger | `GET` | `/health/latest?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestId=1e4b2d17-25a5-4542-b896-11886f2daf5a, latestDeviceId=android-m6-capture |
| dashboard-summary:recovery-trigger | `GET` | `/dashboard/summary?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestHealthSnapshotId=1e4b2d17-25a5-4542-b896-11886f2daf5a, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:recovery-trigger | `GET` | `/client/inbox/overview?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | totalMessages=17, latestBehaviorConclusionId=6d66945f-188f-4a17-a063-c487cc69265a, latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41 |
| device-heartbeat:post-recovery | `POST` | `/devices/heartbeat` | `200` | `true` | id=54229750-559a-460b-af63-19d1b382cb2b, deviceId=android-m6-capture |
| emotion-assessment:post-recovery | `POST` | `/emotion/assessments` | `201` | `true` | id=bfdb5e5f-b087-4d74-b208-bd41b0181c01, deviceId=android-m6-capture, sessionId=66d6db39-44bf-463f-a13b-82289e2d4734 |
| video-assessment:post-recovery | `POST` | `/video/assessments` | `201` | `true` | id=5ae4b489-e742-402e-907b-f8a6fd8d6261, deviceId=android-m6-capture, sessionId=66d6db39-44bf-463f-a13b-82289e2d4734 |
| health-snapshot:post-recovery | `POST` | `/health/snapshots` | `201` | `true` | id=396295e6-11c0-46bf-9311-7283cfcaa875, deviceId=android-m6-capture |
| recovery-history:post-recovery | `GET` | `/recovery/history?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41, recoveryPlanCount=1 |
| health-latest:post-recovery | `GET` | `/health/latest?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestId=396295e6-11c0-46bf-9311-7283cfcaa875, latestDeviceId=android-m6-capture |
| client-inbox:post-recovery | `GET` | `/client/inbox?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | firstMessageId=847bad7e-6aeb-4ff0-90a7-831cf03e01f8, totalMessages=21 |
| inbox-ack:post-recovery | `POST` | `/client/inbox/847bad7e-6aeb-4ff0-90a7-831cf03e01f8/ack` | `200` | `true` | messageId=847bad7e-6aeb-4ff0-90a7-831cf03e01f8, status=acknowledged |
| dashboard-summary:post-recovery | `GET` | `/dashboard/summary?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | latestHealthSnapshotId=396295e6-11c0-46bf-9311-7283cfcaa875, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:post-recovery | `GET` | `/client/inbox/overview?userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea` | `200` | `true` | totalMessages=23, latestBehaviorConclusionId=950cc6e8-a2b0-4644-95e2-117e5d539c13, latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41 |
| audio-session-end:cadenced-finalize | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=66d6db39-44bf-463f-a13b-82289e2d4734, status=completed |
| me:client-session | `GET` | `/me` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, email=m6-mobile-client@example.com, authenticated=true |
| client-bootstrap:client-session | `GET` | `/client/bootstrap` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, inboxMessageCount=20 |
| client-inbox:client-session | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=b98ffa05-dbf4-4c5a-8e02-48080923adff, totalMessages=26 |
| inbox-ack:client-session | `POST` | `/client/inbox/b98ffa05-dbf4-4c5a-8e02-48080923adff/ack` | `200` | `true` | messageId=b98ffa05-dbf4-4c5a-8e02-48080923adff, status=acknowledged |
| inbox-overview:client-session | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=27, latestBehaviorConclusionId=bd2119be-66a7-46eb-bc3a-069a03cdfdde, latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41 |
| client-bootstrap:client-session-refresh | `GET` | `/client/bootstrap` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, inboxMessageCount=20 |
| client-bootstrap:client-session-poll-1 | `GET` | `/client/bootstrap` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, inboxMessageCount=20 |
| client-inbox:client-session-poll-1 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=84cf42ff-163e-40c7-97d6-7446ce2c8796, totalMessages=33 |
| inbox-overview:client-session-poll-1 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=34, latestBehaviorConclusionId=37b76e13-de31-4edc-8d0b-a100fa16f37f, latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41 |
| client-bootstrap:client-session-poll-2 | `GET` | `/client/bootstrap` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, inboxMessageCount=20 |
| client-inbox:client-session-poll-2 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=b1592897-ed1f-4304-8987-13d3b41f3ff6, totalMessages=37 |
| inbox-overview:client-session-poll-2 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=38, latestBehaviorConclusionId=f370475f-3fbc-4529-bcd1-63e75bbacc8f, latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41 |
| client-bootstrap:client-session-poll-3 | `GET` | `/client/bootstrap` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, inboxMessageCount=20 |
| client-inbox:client-session-poll-3 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=69c5a604-1707-4e82-80c7-1a1879c9760e, totalMessages=41 |
| inbox-overview:client-session-poll-3 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=42, latestBehaviorConclusionId=acdf5bd2-96c3-4434-b986-77d16ef90a50, latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41 |
| client-bootstrap:client-session-poll-4 | `GET` | `/client/bootstrap` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, inboxMessageCount=20 |
| client-inbox:client-session-poll-4 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=bf553194-4f52-4ce2-a1e6-8fdd341a062f, totalMessages=45 |
| inbox-overview:client-session-poll-4 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=46, latestBehaviorConclusionId=f99e59c9-5901-496c-a59b-e64b574a819f, latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41 |
| client-bootstrap:client-session-poll-5 | `GET` | `/client/bootstrap` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, inboxMessageCount=20 |
| client-inbox:client-session-poll-5 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=e90dc052-df1d-4ec0-8a08-bbf0336ad167, totalMessages=49 |
| inbox-overview:client-session-poll-5 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=50, latestBehaviorConclusionId=14a2305f-1d09-481d-bb3d-cfb456bbed9e, latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41 |
| client-bootstrap:client-session-poll-6 | `GET` | `/client/bootstrap` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, inboxMessageCount=20 |
| client-inbox:client-session-poll-6 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=ba917ff0-7a93-48e3-929c-342cceea72fb, totalMessages=50 |
| inbox-overview:client-session-poll-6 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=50, latestBehaviorConclusionId=d1b5782c-10dc-42dc-8afd-9234a461e2c3, latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41 |
| me:session-recovery | `GET` | `/me` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, email=m6-mobile-client@example.com, authenticated=true |
| client-bootstrap:session-recovery | `GET` | `/client/bootstrap` | `200` | `true` | userId=a8d4f1ba-6c8e-4f20-9655-1565ba114bea, inboxMessageCount=20 |
| client-inbox:session-recovery | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=c25941b7-2402-482a-8dc0-d445f892ab7e, totalMessages=50 |
| inbox-overview:session-recovery | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=50, latestBehaviorConclusionId=47efdbfe-5659-4fb6-bef1-f6cecd9562d4, latestRecoveryPlanId=d4bcf5c9-79e2-483b-93bd-ccd661464a41 |

## Response IDs

```json
{
  "authUserId": "a8d4f1ba-6c8e-4f20-9655-1565ba114bea",
  "authEmail": "m6-mobile-client@example.com",
  "mobileDeviceId": "1e308b47-b579-470c-95f8-70c5e7499b65",
  "audioSessionId": "66d6db39-44bf-463f-a13b-82289e2d4734",
  "emotionAssessmentId": "bfdb5e5f-b087-4d74-b208-bd41b0181c01",
  "videoAssessmentId": "5ae4b489-e742-402e-907b-f8a6fd8d6261",
  "healthSnapshotId": "396295e6-11c0-46bf-9311-7283cfcaa875",
  "callEventId": "209e5ba1-3a4f-4dc3-8b87-cd1e232ebe83",
  "audioSessionStatus": "completed",
  "clientInboxAckMessageId": "b98ffa05-dbf4-4c5a-8e02-48080923adff",
  "clientPollingPollCount": 6,
  "sessionRecoveryUserId": "a8d4f1ba-6c8e-4f20-9655-1565ba114bea",
  "clientBootstrapUserId": "a8d4f1ba-6c8e-4f20-9655-1565ba114bea",
  "recoveryPlanId": "d4bcf5c9-79e2-483b-93bd-ccd661464a41",
  "recoveryPlanReason": "attention_shift_after_interruption",
  "recoveryHistoryLatestPlanId": "d4bcf5c9-79e2-483b-93bd-ccd661464a41",
  "recoveryHistoryPlanCount": 1,
  "inboxAckMessageId": "847bad7e-6aeb-4ff0-90a7-831cf03e01f8",
  "inboxAckStatus": "acknowledged",
  "latestHealthId": "396295e6-11c0-46bf-9311-7283cfcaa875",
  "latestHealthDeviceId": "android-m6-capture",
  "dashboardLatestHealthSnapshotId": "396295e6-11c0-46bf-9311-7283cfcaa875",
  "dashboardEdgeDeviceCount": 1,
  "dashboardLatestRecoveryPlanId": "d4bcf5c9-79e2-483b-93bd-ccd661464a41",
  "inboxMessageCount": 23,
  "inboxLatestRiskLevel": "high",
  "inboxLatestRecoveryPlanId": "d4bcf5c9-79e2-483b-93bd-ccd661464a41"
}
```

## Error Samples

- none
