# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-25T14:55:21.511Z`
- completedAt: `2026-04-25T14:56:06.748Z`
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

- totalSteps: `79`
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

- round 1: elapsedMs=`0`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`2ce24906-0b70-4e32-b039-a3248db27ed6`, inboxMessageCount=`33`, overviewMessageCount=`34`, acknowledgedMessageVisible=`true`
- round 2: elapsedMs=`5651`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`2ce24906-0b70-4e32-b039-a3248db27ed6`, inboxMessageCount=`37`, overviewMessageCount=`38`, acknowledgedMessageVisible=`true`
- round 3: elapsedMs=`11393`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`2ce24906-0b70-4e32-b039-a3248db27ed6`, inboxMessageCount=`41`, overviewMessageCount=`42`, acknowledgedMessageVisible=`true`
- round 4: elapsedMs=`17142`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`2ce24906-0b70-4e32-b039-a3248db27ed6`, inboxMessageCount=`45`, overviewMessageCount=`46`, acknowledgedMessageVisible=`true`
- round 5: elapsedMs=`23094`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`2ce24906-0b70-4e32-b039-a3248db27ed6`, inboxMessageCount=`49`, overviewMessageCount=`50`, acknowledgedMessageVisible=`true`
- round 6: elapsedMs=`28980`, bootstrapOk=`true`, inboxOk=`true`, overviewOk=`true`, bootstrapUserId=`2ce24906-0b70-4e32-b039-a3248db27ed6`, inboxMessageCount=`50`, overviewMessageCount=`50`, acknowledgedMessageVisible=`true`

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
- recoveredUserId: `2ce24906-0b70-4e32-b039-a3248db27ed6`

## Refresh Token Recovery

- enabled: `true`
- tokenStorage: `android-temp-file`
- tokenFilePath: `/data/local/tmp/client-refresh-token-recovery-token.json`
- tokenIssued: `true`
- tokenPersisted: `true`
- tokenReloaded: `true`
- tokenRotated: `true`
- oldRefreshTokenRejected: `true`
- meOk: `true`
- bootstrapOk: `true`
- logoutRevoked: `true`
- postLogoutRefreshRejected: `true`
- userStable: `true`
- recoveredUserId: `2ce24906-0b70-4e32-b039-a3248db27ed6`

## Phases

- baseline: latestHealthId=`5f928848-1ac7-4d53-9d43-2660a0d7b8a3`, latestRecoveryPlanId=`—`, inboxMessageCount=`3`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-1: latestHealthId=`89bfe04f-217c-40e5-91c9-3d334ec943e8`, latestRecoveryPlanId=`—`, inboxMessageCount=`9`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-2: latestHealthId=`ab8ed2aa-1030-4342-9610-31ab163045a0`, latestRecoveryPlanId=`—`, inboxMessageCount=`14`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- recovery-trigger: latestHealthId=`ab8ed2aa-1030-4342-9610-31ab163045a0`, latestRecoveryPlanId=`6e1afdb2-2237-4ce4-b9f9-8b66db09197c`, inboxMessageCount=`17`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- post-recovery: latestHealthId=`232f936e-e205-491a-9451-57eb91d08788`, latestRecoveryPlanId=`6e1afdb2-2237-4ce4-b9f9-8b66db09197c`, inboxMessageCount=`23`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| auth-login | `POST` | `/auth/login` | `401` | `false` | accessTokenPresent=false, refreshTokenPresent=false |
| auth-register | `POST` | `/auth/register` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, email=m6-mobile-client@example.com, accessTokenPresent=true, refreshTokenPresent=true |
| auth-login:retry | `POST` | `/auth/login` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, email=m6-mobile-client@example.com, accessTokenPresent=true, refreshTokenPresent=true |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=4bd86af0-1978-4b20-9ef9-304dc4adbfd5, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=7b5b9765-9d72-4086-a773-bc17bb3a0749, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=7b5b9765-9d72-4086-a773-bc17bb3a0749, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=3ff73a7b-73ca-4c03-9297-2537f617eaa5, status=active |
| device-heartbeat:baseline | `POST` | `/devices/heartbeat` | `200` | `true` | id=7b5b9765-9d72-4086-a773-bc17bb3a0749, deviceId=android-m6-capture |
| emotion-assessment:baseline | `POST` | `/emotion/assessments` | `201` | `true` | id=2913c37d-8b3d-48e3-8527-88cf01a5573e, deviceId=android-m6-capture, sessionId=3ff73a7b-73ca-4c03-9297-2537f617eaa5 |
| video-assessment:baseline | `POST` | `/video/assessments` | `201` | `true` | id=626f9d08-1370-4822-90b9-6bb7bbe9e94a, deviceId=android-m6-capture, sessionId=3ff73a7b-73ca-4c03-9297-2537f617eaa5 |
| health-snapshot:baseline | `POST` | `/health/snapshots` | `201` | `true` | id=5f928848-1ac7-4d53-9d43-2660a0d7b8a3, deviceId=android-m6-capture |
| health-latest:baseline | `GET` | `/health/latest?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestId=5f928848-1ac7-4d53-9d43-2660a0d7b8a3, latestDeviceId=android-m6-capture |
| dashboard-summary:baseline | `GET` | `/dashboard/summary?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestHealthSnapshotId=5f928848-1ac7-4d53-9d43-2660a0d7b8a3, edgeDeviceCount=1, inboxCount=3 |
| inbox-overview:baseline | `GET` | `/client/inbox/overview?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | totalMessages=3, latestBehaviorConclusionId=6c2055f8-7cb8-4491-b5e9-bd07e353aed0 |
| device-heartbeat:stress-build-up-1 | `POST` | `/devices/heartbeat` | `200` | `true` | id=7b5b9765-9d72-4086-a773-bc17bb3a0749, deviceId=android-m6-capture |
| call-event:stress-build-up-1 | `POST` | `/mobile/call-events` | `201` | `true` | id=83591acb-600b-477a-9918-0e1b4933be28, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-1 | `POST` | `/emotion/assessments` | `201` | `true` | id=e6f522da-e45e-482b-b9bc-db8bf0faf6a8, deviceId=android-m6-capture, sessionId=3ff73a7b-73ca-4c03-9297-2537f617eaa5 |
| video-assessment:stress-build-up-1 | `POST` | `/video/assessments` | `201` | `true` | id=a84f9c77-cb56-4050-ae38-90ac9696a370, deviceId=android-m6-capture, sessionId=3ff73a7b-73ca-4c03-9297-2537f617eaa5 |
| health-snapshot:stress-build-up-1 | `POST` | `/health/snapshots` | `201` | `true` | id=89bfe04f-217c-40e5-91c9-3d334ec943e8, deviceId=android-m6-capture |
| health-latest:stress-build-up-1 | `GET` | `/health/latest?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestId=89bfe04f-217c-40e5-91c9-3d334ec943e8, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-1 | `GET` | `/dashboard/summary?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestHealthSnapshotId=89bfe04f-217c-40e5-91c9-3d334ec943e8, edgeDeviceCount=1, inboxCount=8 |
| inbox-overview:stress-build-up-1 | `GET` | `/client/inbox/overview?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | totalMessages=9, latestBehaviorConclusionId=2e5beb8f-2621-45e4-83a7-f6de461668f9 |
| device-heartbeat:stress-build-up-2 | `POST` | `/devices/heartbeat` | `200` | `true` | id=7b5b9765-9d72-4086-a773-bc17bb3a0749, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-2 | `POST` | `/emotion/assessments` | `201` | `true` | id=770ad08f-7419-4aa9-b368-74cfe15076cf, deviceId=android-m6-capture, sessionId=3ff73a7b-73ca-4c03-9297-2537f617eaa5 |
| video-assessment:stress-build-up-2 | `POST` | `/video/assessments` | `201` | `true` | id=38a22fdd-6efc-435d-ad95-3247cc349a51, deviceId=android-m6-capture, sessionId=3ff73a7b-73ca-4c03-9297-2537f617eaa5 |
| health-snapshot:stress-build-up-2 | `POST` | `/health/snapshots` | `201` | `true` | id=ab8ed2aa-1030-4342-9610-31ab163045a0, deviceId=android-m6-capture |
| health-latest:stress-build-up-2 | `GET` | `/health/latest?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestId=ab8ed2aa-1030-4342-9610-31ab163045a0, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-2 | `GET` | `/dashboard/summary?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestHealthSnapshotId=ab8ed2aa-1030-4342-9610-31ab163045a0, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:stress-build-up-2 | `GET` | `/client/inbox/overview?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | totalMessages=14, latestBehaviorConclusionId=7a3ac8de-548b-4e76-abea-e83cbee355d0 |
| recovery-plan:recovery-trigger | `POST` | `/recovery/plan` | `200` | `true` | id=6e1afdb2-2237-4ce4-b9f9-8b66db09197c, reason=attention_shift_after_interruption |
| recovery-history:recovery-trigger | `GET` | `/recovery/history?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c, recoveryPlanCount=1 |
| health-latest:recovery-trigger | `GET` | `/health/latest?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestId=ab8ed2aa-1030-4342-9610-31ab163045a0, latestDeviceId=android-m6-capture |
| dashboard-summary:recovery-trigger | `GET` | `/dashboard/summary?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestHealthSnapshotId=ab8ed2aa-1030-4342-9610-31ab163045a0, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:recovery-trigger | `GET` | `/client/inbox/overview?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | totalMessages=17, latestBehaviorConclusionId=0e2b0534-0896-4534-9c56-3676eebdda31, latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c |
| device-heartbeat:post-recovery | `POST` | `/devices/heartbeat` | `200` | `true` | id=7b5b9765-9d72-4086-a773-bc17bb3a0749, deviceId=android-m6-capture |
| emotion-assessment:post-recovery | `POST` | `/emotion/assessments` | `201` | `true` | id=3394eea3-3d72-4268-89ce-6cc93d46b64d, deviceId=android-m6-capture, sessionId=3ff73a7b-73ca-4c03-9297-2537f617eaa5 |
| video-assessment:post-recovery | `POST` | `/video/assessments` | `201` | `true` | id=c0c84153-6b06-4fce-ae00-9de44956e6e6, deviceId=android-m6-capture, sessionId=3ff73a7b-73ca-4c03-9297-2537f617eaa5 |
| health-snapshot:post-recovery | `POST` | `/health/snapshots` | `201` | `true` | id=232f936e-e205-491a-9451-57eb91d08788, deviceId=android-m6-capture |
| recovery-history:post-recovery | `GET` | `/recovery/history?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c, recoveryPlanCount=1 |
| health-latest:post-recovery | `GET` | `/health/latest?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestId=232f936e-e205-491a-9451-57eb91d08788, latestDeviceId=android-m6-capture |
| client-inbox:post-recovery | `GET` | `/client/inbox?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | firstMessageId=48bbc758-8c27-433f-ace1-f8c890139871, totalMessages=21 |
| inbox-ack:post-recovery | `POST` | `/client/inbox/48bbc758-8c27-433f-ace1-f8c890139871/ack` | `200` | `true` | messageId=48bbc758-8c27-433f-ace1-f8c890139871, status=acknowledged |
| dashboard-summary:post-recovery | `GET` | `/dashboard/summary?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | latestHealthSnapshotId=232f936e-e205-491a-9451-57eb91d08788, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:post-recovery | `GET` | `/client/inbox/overview?userId=2ce24906-0b70-4e32-b039-a3248db27ed6` | `200` | `true` | totalMessages=23, latestBehaviorConclusionId=1a9d6154-6633-4a77-b835-8fe9488720c5, latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c |
| audio-session-end:cadenced-finalize | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=3ff73a7b-73ca-4c03-9297-2537f617eaa5, status=completed |
| me:client-session | `GET` | `/me` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, email=m6-mobile-client@example.com, authenticated=true |
| client-bootstrap:client-session | `GET` | `/client/bootstrap` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, inboxMessageCount=20 |
| client-inbox:client-session | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=5ac6f73f-47ad-4d98-9709-70c65a5fcbc0, totalMessages=26 |
| inbox-ack:client-session | `POST` | `/client/inbox/5ac6f73f-47ad-4d98-9709-70c65a5fcbc0/ack` | `200` | `true` | messageId=5ac6f73f-47ad-4d98-9709-70c65a5fcbc0, status=acknowledged |
| inbox-overview:client-session | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=27, latestBehaviorConclusionId=2ae8564e-4c15-445c-8ae6-a94862018466, latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c |
| client-bootstrap:client-session-refresh | `GET` | `/client/bootstrap` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, inboxMessageCount=20 |
| client-bootstrap:client-session-poll-1 | `GET` | `/client/bootstrap` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, inboxMessageCount=20 |
| client-inbox:client-session-poll-1 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=9a9dec6a-9f0a-4f67-9dd6-68ec162d5af6, totalMessages=33 |
| inbox-overview:client-session-poll-1 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=34, latestBehaviorConclusionId=045fb26b-2744-404a-ab99-c944080186da, latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c |
| client-bootstrap:client-session-poll-2 | `GET` | `/client/bootstrap` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, inboxMessageCount=20 |
| client-inbox:client-session-poll-2 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=cbee9f29-8038-4e22-83e3-55f20be46a0d, totalMessages=37 |
| inbox-overview:client-session-poll-2 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=38, latestBehaviorConclusionId=7bd8ef3a-a3eb-47df-ad4d-0000069e8414, latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c |
| client-bootstrap:client-session-poll-3 | `GET` | `/client/bootstrap` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, inboxMessageCount=20 |
| client-inbox:client-session-poll-3 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=808e10ed-e6b7-402c-8727-75d11d651446, totalMessages=41 |
| inbox-overview:client-session-poll-3 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=42, latestBehaviorConclusionId=c8646da3-b6f5-4788-99e1-29818c07b31b, latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c |
| client-bootstrap:client-session-poll-4 | `GET` | `/client/bootstrap` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, inboxMessageCount=20 |
| client-inbox:client-session-poll-4 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=977365e7-f574-4ce5-930e-b2afdb3f0553, totalMessages=45 |
| inbox-overview:client-session-poll-4 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=46, latestBehaviorConclusionId=d43173a5-8531-45e3-9011-318b6ed2d33e, latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c |
| client-bootstrap:client-session-poll-5 | `GET` | `/client/bootstrap` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, inboxMessageCount=20 |
| client-inbox:client-session-poll-5 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=7416ef28-89e7-43c7-8e4b-f991c78f1f4f, totalMessages=49 |
| inbox-overview:client-session-poll-5 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=50, latestBehaviorConclusionId=ea0bd72a-f996-4bb9-9957-185ea023de41, latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c |
| client-bootstrap:client-session-poll-6 | `GET` | `/client/bootstrap` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, inboxMessageCount=20 |
| client-inbox:client-session-poll-6 | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=b1357a9b-d328-411a-a4bc-c2f9759cd4da, totalMessages=50 |
| inbox-overview:client-session-poll-6 | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=50, latestBehaviorConclusionId=61924fbe-3a96-4fb4-b0a1-953dcb2afd94, latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c |
| me:session-recovery | `GET` | `/me` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, email=m6-mobile-client@example.com, authenticated=true |
| client-bootstrap:session-recovery | `GET` | `/client/bootstrap` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, inboxMessageCount=20 |
| client-inbox:session-recovery | `GET` | `/client/inbox` | `200` | `true` | firstMessageId=230b3072-374a-4930-b8bd-01715ac09b89, totalMessages=50 |
| inbox-overview:session-recovery | `GET` | `/client/inbox/overview` | `200` | `true` | totalMessages=50, latestBehaviorConclusionId=ccec80da-71df-4441-a93c-804204e51ac5, latestRecoveryPlanId=6e1afdb2-2237-4ce4-b9f9-8b66db09197c |
| auth-refresh:refresh-token-recovery | `POST` | `/auth/refresh` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, email=m6-mobile-client@example.com, accessTokenPresent=true, refreshTokenPresent=true |
| auth-refresh-old-reuse:refresh-token-recovery | `POST` | `/auth/refresh` | `401` | `false` | — |
| me:refresh-token-recovery | `GET` | `/me` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, email=m6-mobile-client@example.com, authenticated=true |
| client-bootstrap:refresh-token-recovery | `GET` | `/client/bootstrap` | `200` | `true` | userId=2ce24906-0b70-4e32-b039-a3248db27ed6, inboxMessageCount=20 |
| auth-logout:refresh-token-recovery | `POST` | `/auth/logout` | `200` | `true` | revoked=true |
| auth-refresh-post-logout:refresh-token-recovery | `POST` | `/auth/refresh` | `401` | `false` | — |

## Response IDs

```json
{
  "authUserId": "2ce24906-0b70-4e32-b039-a3248db27ed6",
  "authEmail": "m6-mobile-client@example.com",
  "mobileDeviceId": "4bd86af0-1978-4b20-9ef9-304dc4adbfd5",
  "audioSessionId": "3ff73a7b-73ca-4c03-9297-2537f617eaa5",
  "emotionAssessmentId": "3394eea3-3d72-4268-89ce-6cc93d46b64d",
  "videoAssessmentId": "c0c84153-6b06-4fce-ae00-9de44956e6e6",
  "healthSnapshotId": "232f936e-e205-491a-9451-57eb91d08788",
  "callEventId": "83591acb-600b-477a-9918-0e1b4933be28",
  "audioSessionStatus": "completed",
  "clientInboxAckMessageId": "5ac6f73f-47ad-4d98-9709-70c65a5fcbc0",
  "clientPollingPollCount": 6,
  "sessionRecoveryUserId": "2ce24906-0b70-4e32-b039-a3248db27ed6",
  "refreshTokenRecoveryUserId": "2ce24906-0b70-4e32-b039-a3248db27ed6",
  "refreshTokenRecoveryRecoveredUserId": "2ce24906-0b70-4e32-b039-a3248db27ed6",
  "clientBootstrapUserId": "2ce24906-0b70-4e32-b039-a3248db27ed6",
  "recoveryPlanId": "6e1afdb2-2237-4ce4-b9f9-8b66db09197c",
  "recoveryPlanReason": "attention_shift_after_interruption",
  "recoveryHistoryLatestPlanId": "6e1afdb2-2237-4ce4-b9f9-8b66db09197c",
  "recoveryHistoryPlanCount": 1,
  "inboxAckMessageId": "48bbc758-8c27-433f-ace1-f8c890139871",
  "inboxAckStatus": "acknowledged",
  "latestHealthId": "232f936e-e205-491a-9451-57eb91d08788",
  "latestHealthDeviceId": "android-m6-capture",
  "dashboardLatestHealthSnapshotId": "232f936e-e205-491a-9451-57eb91d08788",
  "dashboardEdgeDeviceCount": 1,
  "dashboardLatestRecoveryPlanId": "6e1afdb2-2237-4ce4-b9f9-8b66db09197c",
  "inboxMessageCount": 23,
  "inboxLatestRiskLevel": "high",
  "inboxLatestRecoveryPlanId": "6e1afdb2-2237-4ce4-b9f9-8b66db09197c"
}
```

## Error Samples

- none
