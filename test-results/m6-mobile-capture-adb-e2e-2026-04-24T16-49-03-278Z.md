# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-24T16:49:03.279Z`
- completedAt: `2026-04-24T16:49:07.895Z`
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

- totalSteps: `19`
- failedSteps: `0`

## Read Models

- healthLatestReflectsDevice: `true`
- dashboardReflectsDevice: `true`
- inboxOverviewOk: `true`
- inboxAckReflected: `true`
- recoveryPlanCreated: `true`
- recoveryHistoryReflectsPlan: `true`
- recoveryInboxConsistent: `true`
- recoveryDashboardConsistent: `true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=84d210eb-5f36-4a52-a7a4-65f76fef8298, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=de6e6d5e-692d-44ba-948b-fc12403c7df4, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=de6e6d5e-692d-44ba-948b-fc12403c7df4, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=9404ed74-2319-4af9-91d0-5f24e34941ad, status=active |
| call-event | `POST` | `/mobile/call-events` | `201` | `true` | id=95fe9a84-6cdd-4279-918b-64625d64a63c, deviceId=android-m6-capture |
| emotion-assessment | `POST` | `/emotion/assessments` | `201` | `true` | id=da3338fa-750d-4659-bf3a-a49ee39764fb, deviceId=android-m6-capture, sessionId=9404ed74-2319-4af9-91d0-5f24e34941ad |
| media-upload-session | `POST` | `/media/upload-sessions` | `201` | `true` | sessionId=105737e3-702e-47f9-81d7-b6f224bc7660, status=pending |
| media-upload-part | `POST` | `/media/upload-sessions/105737e3-702e-47f9-81d7-b6f224bc7660/parts` | `201` | `true` | id=8b150a5a-f191-4e13-8492-f8e0892617df, sessionId=105737e3-702e-47f9-81d7-b6f224bc7660, sequence=0 |
| media-upload-complete | `POST` | `/media/upload-sessions/105737e3-702e-47f9-81d7-b6f224bc7660/complete` | `200` | `true` | sessionId=105737e3-702e-47f9-81d7-b6f224bc7660, status=completed |
| video-assessment | `POST` | `/video/assessments` | `201` | `true` | id=85947074-3e22-4601-a595-f542e7b5c1e8, deviceId=android-m6-capture, sessionId=105737e3-702e-47f9-81d7-b6f224bc7660 |
| health-snapshot | `POST` | `/health/snapshots` | `201` | `true` | id=7c297d1e-b737-40ef-9bb1-1a495ead13fd, deviceId=android-m6-capture |
| audio-session-end | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=9404ed74-2319-4af9-91d0-5f24e34941ad, status=completed |
| recovery-plan | `POST` | `/recovery/plan` | `200` | `true` | id=3bdb493a-5034-4ffc-98cd-51c6b50e9644, reason=attention_shift_after_interruption |
| recovery-history | `GET` | `/recovery/history?userId=m6-mobile-user` | `200` | `true` | latestRecoveryPlanId=3bdb493a-5034-4ffc-98cd-51c6b50e9644, recoveryPlanCount=1 |
| health-latest | `GET` | `/health/latest?userId=m6-mobile-user` | `200` | `true` | latestId=7c297d1e-b737-40ef-9bb1-1a495ead13fd, latestDeviceId=android-m6-capture |
| client-inbox | `GET` | `/client/inbox?userId=m6-mobile-user` | `200` | `true` | firstMessageId=fdeead23-d8cd-485b-a0f7-de0ef59812d8, totalMessages=5 |
| inbox-ack | `POST` | `/client/inbox/fdeead23-d8cd-485b-a0f7-de0ef59812d8/ack` | `200` | `true` | messageId=fdeead23-d8cd-485b-a0f7-de0ef59812d8, status=acknowledged |
| dashboard-summary | `GET` | `/dashboard/summary?userId=m6-mobile-user` | `200` | `true` | latestHealthSnapshotId=7c297d1e-b737-40ef-9bb1-1a495ead13fd, edgeDeviceCount=1, inboxCount=5 |
| inbox-overview | `GET` | `/client/inbox/overview?userId=m6-mobile-user` | `200` | `true` | totalMessages=5, latestBehaviorConclusionId=6c36ebd7-c519-4842-a8e7-c78f25498e9e, latestRecoveryPlanId=3bdb493a-5034-4ffc-98cd-51c6b50e9644 |

## Response IDs

```json
{
  "mobileDeviceId": "84d210eb-5f36-4a52-a7a4-65f76fef8298",
  "audioSessionId": "9404ed74-2319-4af9-91d0-5f24e34941ad",
  "callEventId": "95fe9a84-6cdd-4279-918b-64625d64a63c",
  "emotionAssessmentId": "da3338fa-750d-4659-bf3a-a49ee39764fb",
  "mediaUploadSessionId": "105737e3-702e-47f9-81d7-b6f224bc7660",
  "completedMediaStatus": "completed",
  "videoAssessmentId": "85947074-3e22-4601-a595-f542e7b5c1e8",
  "healthSnapshotId": "7c297d1e-b737-40ef-9bb1-1a495ead13fd",
  "audioSessionStatus": "completed",
  "recoveryPlanId": "3bdb493a-5034-4ffc-98cd-51c6b50e9644",
  "recoveryPlanReason": "attention_shift_after_interruption",
  "recoveryHistoryLatestPlanId": "3bdb493a-5034-4ffc-98cd-51c6b50e9644",
  "recoveryHistoryPlanCount": 1,
  "inboxAckMessageId": "fdeead23-d8cd-485b-a0f7-de0ef59812d8",
  "inboxAckStatus": "acknowledged",
  "latestHealthId": "7c297d1e-b737-40ef-9bb1-1a495ead13fd",
  "latestHealthDeviceId": "android-m6-capture",
  "dashboardLatestHealthSnapshotId": "7c297d1e-b737-40ef-9bb1-1a495ead13fd",
  "dashboardEdgeDeviceCount": 1,
  "dashboardLatestRecoveryPlanId": "3bdb493a-5034-4ffc-98cd-51c6b50e9644",
  "inboxMessageCount": 5,
  "inboxLatestRiskLevel": "high",
  "inboxLatestRecoveryPlanId": "3bdb493a-5034-4ffc-98cd-51c6b50e9644"
}
```

## Error Samples

- none
