# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-24T15:58:54.059Z`
- completedAt: `2026-04-24T15:58:58.142Z`
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

- totalSteps: `17`
- failedSteps: `0`

## Read Models

- healthLatestReflectsDevice: `true`
- dashboardReflectsDevice: `true`
- inboxOverviewOk: `true`
- inboxAckReflected: `true`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=1b544b96-2cc7-4fe9-83dc-5fe9675d4706, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=9f2dc504-6ae9-4477-9b1b-7280013b0920, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=9f2dc504-6ae9-4477-9b1b-7280013b0920, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=f9022ab1-a519-4f60-990d-0099731633c5, status=active |
| call-event | `POST` | `/mobile/call-events` | `201` | `true` | id=3103a47e-3431-4d53-90a9-271e0921bf4c, deviceId=android-m6-capture |
| emotion-assessment | `POST` | `/emotion/assessments` | `201` | `true` | id=f22f639e-e170-4073-80c0-b7c6614c5bf2, deviceId=android-m6-capture, sessionId=f9022ab1-a519-4f60-990d-0099731633c5 |
| media-upload-session | `POST` | `/media/upload-sessions` | `201` | `true` | sessionId=354b5dc9-a280-44c0-b3c2-7b6eb06aeaf0, status=pending |
| media-upload-part | `POST` | `/media/upload-sessions/354b5dc9-a280-44c0-b3c2-7b6eb06aeaf0/parts` | `201` | `true` | id=99e812e1-da11-4b3a-a68b-154a975f1f72, sessionId=354b5dc9-a280-44c0-b3c2-7b6eb06aeaf0, sequence=0 |
| media-upload-complete | `POST` | `/media/upload-sessions/354b5dc9-a280-44c0-b3c2-7b6eb06aeaf0/complete` | `200` | `true` | sessionId=354b5dc9-a280-44c0-b3c2-7b6eb06aeaf0, status=completed |
| video-assessment | `POST` | `/video/assessments` | `201` | `true` | id=b8ab8dbd-e3aa-45f9-b4f6-45d324378c84, deviceId=android-m6-capture, sessionId=354b5dc9-a280-44c0-b3c2-7b6eb06aeaf0 |
| health-snapshot | `POST` | `/health/snapshots` | `201` | `true` | id=c30b5c07-aa61-4df3-9276-ed481f537535, deviceId=android-m6-capture |
| audio-session-end | `POST` | `/mobile/capture/sessions/end` | `200` | `true` | sessionId=f9022ab1-a519-4f60-990d-0099731633c5, status=completed |
| health-latest | `GET` | `/health/latest?userId=m6-mobile-user` | `200` | `true` | latestId=c30b5c07-aa61-4df3-9276-ed481f537535, latestDeviceId=android-m6-capture |
| client-inbox | `GET` | `/client/inbox?userId=m6-mobile-user` | `200` | `true` | firstMessageId=9ef59665-fc44-4ab7-b921-07102c424011, totalMessages=5 |
| inbox-ack | `POST` | `/client/inbox/9ef59665-fc44-4ab7-b921-07102c424011/ack` | `200` | `true` | messageId=9ef59665-fc44-4ab7-b921-07102c424011, status=acknowledged |
| dashboard-summary | `GET` | `/dashboard/summary?userId=m6-mobile-user` | `200` | `true` | latestHealthSnapshotId=c30b5c07-aa61-4df3-9276-ed481f537535, edgeDeviceCount=1, inboxCount=5 |
| inbox-overview | `GET` | `/client/inbox/overview?userId=m6-mobile-user` | `200` | `true` | totalMessages=5, latestBehaviorConclusionId=948de33d-5471-4762-a995-e9824e703dda |

## Response IDs

```json
{
  "mobileDeviceId": "1b544b96-2cc7-4fe9-83dc-5fe9675d4706",
  "audioSessionId": "f9022ab1-a519-4f60-990d-0099731633c5",
  "callEventId": "3103a47e-3431-4d53-90a9-271e0921bf4c",
  "emotionAssessmentId": "f22f639e-e170-4073-80c0-b7c6614c5bf2",
  "mediaUploadSessionId": "354b5dc9-a280-44c0-b3c2-7b6eb06aeaf0",
  "completedMediaStatus": "completed",
  "videoAssessmentId": "b8ab8dbd-e3aa-45f9-b4f6-45d324378c84",
  "healthSnapshotId": "c30b5c07-aa61-4df3-9276-ed481f537535",
  "audioSessionStatus": "completed",
  "inboxAckMessageId": "9ef59665-fc44-4ab7-b921-07102c424011",
  "inboxAckStatus": "acknowledged",
  "latestHealthId": "c30b5c07-aa61-4df3-9276-ed481f537535",
  "latestHealthDeviceId": "android-m6-capture",
  "dashboardLatestHealthSnapshotId": "c30b5c07-aa61-4df3-9276-ed481f537535",
  "dashboardEdgeDeviceCount": 1,
  "inboxMessageCount": 5,
  "inboxLatestRiskLevel": "high"
}
```

## Error Samples

- none
