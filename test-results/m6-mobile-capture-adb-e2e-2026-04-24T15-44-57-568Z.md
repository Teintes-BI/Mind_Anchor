# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-24T15:44:57.568Z`
- completedAt: `2026-04-24T15:45:00.717Z`
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

- totalSteps: `15`
- failedSteps: `0`

## Read Models

- healthLatestReflectsDevice: `true`
- dashboardReflectsDevice: `true`
- inboxOverviewOk: `true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=8b573d55-c342-47f9-904d-6d9553ffe14a, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=94bceca5-aa9e-406a-8982-a62758583ece, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=94bceca5-aa9e-406a-8982-a62758583ece, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=59e32429-a0ef-467c-8cc7-a6585598e806, status=active |
| call-event | `POST` | `/mobile/call-events` | `201` | `true` | id=93f4b78a-a36d-4ac6-8188-21d9e10eda2a, deviceId=android-m6-capture |
| emotion-assessment | `POST` | `/emotion/assessments` | `201` | `true` | id=3992889e-9a11-4c43-b360-9822fbe05cab, deviceId=android-m6-capture, sessionId=59e32429-a0ef-467c-8cc7-a6585598e806 |
| media-upload-session | `POST` | `/media/upload-sessions` | `201` | `true` | sessionId=8e583072-f1ed-473f-8f69-2ea488956751, status=pending |
| media-upload-part | `POST` | `/media/upload-sessions/8e583072-f1ed-473f-8f69-2ea488956751/parts` | `201` | `true` | id=3d96c29a-9e6f-47ed-b553-fbc18487f83e, sessionId=8e583072-f1ed-473f-8f69-2ea488956751, sequence=0 |
| media-upload-complete | `POST` | `/media/upload-sessions/8e583072-f1ed-473f-8f69-2ea488956751/complete` | `200` | `true` | sessionId=8e583072-f1ed-473f-8f69-2ea488956751, status=completed |
| video-assessment | `POST` | `/video/assessments` | `201` | `true` | id=5f4c7675-da3f-4f47-95f2-075387a5301d, deviceId=android-m6-capture, sessionId=8e583072-f1ed-473f-8f69-2ea488956751 |
| health-snapshot | `POST` | `/health/snapshots` | `201` | `true` | id=64220b19-c3ed-46de-aff4-ce12a2608e3a, deviceId=android-m6-capture |
| audio-session-end | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=59e32429-a0ef-467c-8cc7-a6585598e806, status=completed |
| health-latest | `GET` | `/health/latest?userId=m6-mobile-user` | `200` | `true` | latestId=64220b19-c3ed-46de-aff4-ce12a2608e3a, latestDeviceId=android-m6-capture |
| dashboard-summary | `GET` | `/dashboard/summary?userId=m6-mobile-user` | `200` | `true` | latestHealthSnapshotId=64220b19-c3ed-46de-aff4-ce12a2608e3a, edgeDeviceCount=1, inboxCount=5 |
| inbox-overview | `GET` | `/client/inbox/overview?userId=m6-mobile-user` | `200` | `true` | totalMessages=5, latestBehaviorConclusionId=4bb85f40-18e1-46b7-9173-f345e1ed92dc |

## Response IDs

```json
{
  "mobileDeviceId": "8b573d55-c342-47f9-904d-6d9553ffe14a",
  "audioSessionId": "59e32429-a0ef-467c-8cc7-a6585598e806",
  "callEventId": "93f4b78a-a36d-4ac6-8188-21d9e10eda2a",
  "emotionAssessmentId": "3992889e-9a11-4c43-b360-9822fbe05cab",
  "mediaUploadSessionId": "8e583072-f1ed-473f-8f69-2ea488956751",
  "completedMediaStatus": "completed",
  "videoAssessmentId": "5f4c7675-da3f-4f47-95f2-075387a5301d",
  "healthSnapshotId": "64220b19-c3ed-46de-aff4-ce12a2608e3a",
  "audioSessionStatus": "completed",
  "latestHealthId": "64220b19-c3ed-46de-aff4-ce12a2608e3a",
  "latestHealthDeviceId": "android-m6-capture",
  "dashboardLatestHealthSnapshotId": "64220b19-c3ed-46de-aff4-ce12a2608e3a",
  "dashboardEdgeDeviceCount": 1,
  "inboxMessageCount": 5,
  "inboxLatestRiskLevel": "high"
}
```

## Error Samples

- none
