# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-24T17:27:34.830Z`
- completedAt: `2026-04-24T17:27:41.613Z`
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

- totalSteps: `42`
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

## Phases

- baseline: latestHealthId=`63288bc7-b74f-40df-907a-151cc1f8bb76`, latestRecoveryPlanId=`—`, inboxMessageCount=`3`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-1: latestHealthId=`f2726378-b39c-4510-bba5-43601884c9f6`, latestRecoveryPlanId=`—`, inboxMessageCount=`9`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- stress-build-up-2: latestHealthId=`1bb0972f-cb00-4126-93da-2d3d248aa7e8`, latestRecoveryPlanId=`—`, inboxMessageCount=`14`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- recovery-trigger: latestHealthId=`1bb0972f-cb00-4126-93da-2d3d248aa7e8`, latestRecoveryPlanId=`47fb3312-060b-4398-8ffc-7812d8832a40`, inboxMessageCount=`17`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`false`
- post-recovery: latestHealthId=`eb4394a3-e4df-4ffa-8919-83bed60bdc7f`, latestRecoveryPlanId=`47fb3312-060b-4398-8ffc-7812d8832a40`, inboxMessageCount=`23`, inboxLatestRiskLevel=`high`, postRecoveryWriteAccepted=`true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=e538e7df-845d-43b1-91a7-206a201f0cef, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=11ed7d60-895d-497a-9daa-8e8c3053f3cd, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=11ed7d60-895d-497a-9daa-8e8c3053f3cd, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=c57b96cd-90cb-4c23-bea1-be97e997c755, status=active |
| device-heartbeat:baseline | `POST` | `/devices/heartbeat` | `200` | `true` | id=11ed7d60-895d-497a-9daa-8e8c3053f3cd, deviceId=android-m6-capture |
| emotion-assessment:baseline | `POST` | `/emotion/assessments` | `201` | `true` | id=877b83ef-b503-4f5d-83bd-1eb1317cb1f7, deviceId=android-m6-capture, sessionId=c57b96cd-90cb-4c23-bea1-be97e997c755 |
| video-assessment:baseline | `POST` | `/video/assessments` | `201` | `true` | id=5ed47a3f-f29d-405b-ba24-7c60329cc905, deviceId=android-m6-capture, sessionId=c57b96cd-90cb-4c23-bea1-be97e997c755 |
| health-snapshot:baseline | `POST` | `/health/snapshots` | `201` | `true` | id=63288bc7-b74f-40df-907a-151cc1f8bb76, deviceId=android-m6-capture |
| health-latest:baseline | `GET` | `/health/latest?userId=m6-mobile-user` | `200` | `true` | latestId=63288bc7-b74f-40df-907a-151cc1f8bb76, latestDeviceId=android-m6-capture |
| dashboard-summary:baseline | `GET` | `/dashboard/summary?userId=m6-mobile-user` | `200` | `true` | latestHealthSnapshotId=63288bc7-b74f-40df-907a-151cc1f8bb76, edgeDeviceCount=1, inboxCount=3 |
| inbox-overview:baseline | `GET` | `/client/inbox/overview?userId=m6-mobile-user` | `200` | `true` | totalMessages=3, latestBehaviorConclusionId=abf456da-99d2-4ea9-bb61-a55c56c5c662 |
| device-heartbeat:stress-build-up-1 | `POST` | `/devices/heartbeat` | `200` | `true` | id=11ed7d60-895d-497a-9daa-8e8c3053f3cd, deviceId=android-m6-capture |
| call-event:stress-build-up-1 | `POST` | `/mobile/call-events` | `201` | `true` | id=8556aa3c-d4b3-457b-9c00-816c7c15a6c1, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-1 | `POST` | `/emotion/assessments` | `201` | `true` | id=37906ce0-226c-497f-85e4-b77df9273133, deviceId=android-m6-capture, sessionId=c57b96cd-90cb-4c23-bea1-be97e997c755 |
| video-assessment:stress-build-up-1 | `POST` | `/video/assessments` | `201` | `true` | id=c65e4f4f-6f4a-49a4-a8de-d0899390077c, deviceId=android-m6-capture, sessionId=c57b96cd-90cb-4c23-bea1-be97e997c755 |
| health-snapshot:stress-build-up-1 | `POST` | `/health/snapshots` | `201` | `true` | id=f2726378-b39c-4510-bba5-43601884c9f6, deviceId=android-m6-capture |
| health-latest:stress-build-up-1 | `GET` | `/health/latest?userId=m6-mobile-user` | `200` | `true` | latestId=f2726378-b39c-4510-bba5-43601884c9f6, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-1 | `GET` | `/dashboard/summary?userId=m6-mobile-user` | `200` | `true` | latestHealthSnapshotId=f2726378-b39c-4510-bba5-43601884c9f6, edgeDeviceCount=1, inboxCount=8 |
| inbox-overview:stress-build-up-1 | `GET` | `/client/inbox/overview?userId=m6-mobile-user` | `200` | `true` | totalMessages=9, latestBehaviorConclusionId=56b64d4a-dcda-4f5a-852d-16c4c08249cc |
| device-heartbeat:stress-build-up-2 | `POST` | `/devices/heartbeat` | `200` | `true` | id=11ed7d60-895d-497a-9daa-8e8c3053f3cd, deviceId=android-m6-capture |
| emotion-assessment:stress-build-up-2 | `POST` | `/emotion/assessments` | `201` | `true` | id=f105b949-0bf5-43d3-a0d8-71e35ece9d0f, deviceId=android-m6-capture, sessionId=c57b96cd-90cb-4c23-bea1-be97e997c755 |
| video-assessment:stress-build-up-2 | `POST` | `/video/assessments` | `201` | `true` | id=6a4e7ee1-af59-4718-993f-56fe3f416c4a, deviceId=android-m6-capture, sessionId=c57b96cd-90cb-4c23-bea1-be97e997c755 |
| health-snapshot:stress-build-up-2 | `POST` | `/health/snapshots` | `201` | `true` | id=1bb0972f-cb00-4126-93da-2d3d248aa7e8, deviceId=android-m6-capture |
| health-latest:stress-build-up-2 | `GET` | `/health/latest?userId=m6-mobile-user` | `200` | `true` | latestId=1bb0972f-cb00-4126-93da-2d3d248aa7e8, latestDeviceId=android-m6-capture |
| dashboard-summary:stress-build-up-2 | `GET` | `/dashboard/summary?userId=m6-mobile-user` | `200` | `true` | latestHealthSnapshotId=1bb0972f-cb00-4126-93da-2d3d248aa7e8, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:stress-build-up-2 | `GET` | `/client/inbox/overview?userId=m6-mobile-user` | `200` | `true` | totalMessages=14, latestBehaviorConclusionId=4c7fcf8b-5c29-495f-bcdd-b977b8f6a419 |
| recovery-plan:recovery-trigger | `POST` | `/recovery/plan` | `200` | `true` | id=47fb3312-060b-4398-8ffc-7812d8832a40, reason=attention_shift_after_interruption |
| recovery-history:recovery-trigger | `GET` | `/recovery/history?userId=m6-mobile-user` | `200` | `true` | latestRecoveryPlanId=47fb3312-060b-4398-8ffc-7812d8832a40, recoveryPlanCount=1 |
| health-latest:recovery-trigger | `GET` | `/health/latest?userId=m6-mobile-user` | `200` | `true` | latestId=1bb0972f-cb00-4126-93da-2d3d248aa7e8, latestDeviceId=android-m6-capture |
| dashboard-summary:recovery-trigger | `GET` | `/dashboard/summary?userId=m6-mobile-user` | `200` | `true` | latestHealthSnapshotId=1bb0972f-cb00-4126-93da-2d3d248aa7e8, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:recovery-trigger | `GET` | `/client/inbox/overview?userId=m6-mobile-user` | `200` | `true` | totalMessages=17, latestBehaviorConclusionId=67cbd5db-f8fa-44d9-8416-c0f7fde77f52, latestRecoveryPlanId=47fb3312-060b-4398-8ffc-7812d8832a40 |
| device-heartbeat:post-recovery | `POST` | `/devices/heartbeat` | `200` | `true` | id=11ed7d60-895d-497a-9daa-8e8c3053f3cd, deviceId=android-m6-capture |
| emotion-assessment:post-recovery | `POST` | `/emotion/assessments` | `201` | `true` | id=6bc0537b-b4dc-4c5a-b0cc-95190676c01a, deviceId=android-m6-capture, sessionId=c57b96cd-90cb-4c23-bea1-be97e997c755 |
| video-assessment:post-recovery | `POST` | `/video/assessments` | `201` | `true` | id=cef3306c-9664-45ff-87da-be27e2d64413, deviceId=android-m6-capture, sessionId=c57b96cd-90cb-4c23-bea1-be97e997c755 |
| health-snapshot:post-recovery | `POST` | `/health/snapshots` | `201` | `true` | id=eb4394a3-e4df-4ffa-8919-83bed60bdc7f, deviceId=android-m6-capture |
| recovery-history:post-recovery | `GET` | `/recovery/history?userId=m6-mobile-user` | `200` | `true` | latestRecoveryPlanId=47fb3312-060b-4398-8ffc-7812d8832a40, recoveryPlanCount=1 |
| health-latest:post-recovery | `GET` | `/health/latest?userId=m6-mobile-user` | `200` | `true` | latestId=eb4394a3-e4df-4ffa-8919-83bed60bdc7f, latestDeviceId=android-m6-capture |
| client-inbox:post-recovery | `GET` | `/client/inbox?userId=m6-mobile-user` | `200` | `true` | firstMessageId=3e966668-df84-4de0-8234-82ed1e54c29e, totalMessages=21 |
| inbox-ack:post-recovery | `POST` | `/client/inbox/3e966668-df84-4de0-8234-82ed1e54c29e/ack` | `200` | `true` | messageId=3e966668-df84-4de0-8234-82ed1e54c29e, status=acknowledged |
| dashboard-summary:post-recovery | `GET` | `/dashboard/summary?userId=m6-mobile-user` | `200` | `true` | latestHealthSnapshotId=eb4394a3-e4df-4ffa-8919-83bed60bdc7f, edgeDeviceCount=1, inboxCount=10 |
| inbox-overview:post-recovery | `GET` | `/client/inbox/overview?userId=m6-mobile-user` | `200` | `true` | totalMessages=23, latestBehaviorConclusionId=71e8d228-cc62-4dfc-afbd-6e6f74a32ee1, latestRecoveryPlanId=47fb3312-060b-4398-8ffc-7812d8832a40 |
| audio-session-end:cadenced-finalize | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=c57b96cd-90cb-4c23-bea1-be97e997c755, status=completed |

## Response IDs

```json
{
  "mobileDeviceId": "e538e7df-845d-43b1-91a7-206a201f0cef",
  "audioSessionId": "c57b96cd-90cb-4c23-bea1-be97e997c755",
  "emotionAssessmentId": "6bc0537b-b4dc-4c5a-b0cc-95190676c01a",
  "videoAssessmentId": "cef3306c-9664-45ff-87da-be27e2d64413",
  "healthSnapshotId": "eb4394a3-e4df-4ffa-8919-83bed60bdc7f",
  "callEventId": "8556aa3c-d4b3-457b-9c00-816c7c15a6c1",
  "audioSessionStatus": "completed",
  "recoveryPlanId": "47fb3312-060b-4398-8ffc-7812d8832a40",
  "recoveryPlanReason": "attention_shift_after_interruption",
  "recoveryHistoryLatestPlanId": "47fb3312-060b-4398-8ffc-7812d8832a40",
  "recoveryHistoryPlanCount": 1,
  "inboxAckMessageId": "3e966668-df84-4de0-8234-82ed1e54c29e",
  "inboxAckStatus": "acknowledged",
  "latestHealthId": "eb4394a3-e4df-4ffa-8919-83bed60bdc7f",
  "latestHealthDeviceId": "android-m6-capture",
  "dashboardLatestHealthSnapshotId": "eb4394a3-e4df-4ffa-8919-83bed60bdc7f",
  "dashboardEdgeDeviceCount": 1,
  "dashboardLatestRecoveryPlanId": "47fb3312-060b-4398-8ffc-7812d8832a40",
  "inboxMessageCount": 23,
  "inboxLatestRiskLevel": "high",
  "inboxLatestRecoveryPlanId": "47fb3312-060b-4398-8ffc-7812d8832a40"
}
```

## Error Samples

- none
