# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-24T15:43:07.255Z`
- completedAt: `2026-04-24T15:43:09.647Z`
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

- totalSteps: `8`
- failedSteps: `1`

## Read Models

- healthLatestReflectsDevice: `false`
- dashboardReflectsDevice: `false`
- inboxOverviewOk: `false`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | — |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | — |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | — |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | — |
| call-event | `POST` | `/mobile/call-events` | `201` | `true` | — |
| emotion-assessment | `POST` | `/emotion/assessments` | `201` | `true` | — |
| media-upload-session | `POST` | `/media/upload-sessions` | `201` | `true` | — |
| media-upload-part | `POST` | `/media/upload-sessions/undefined/parts` | `400` | `false` | — |

## Response IDs

```json
{
  "mobileDeviceId": null,
  "audioSessionId": null,
  "callEventId": null,
  "emotionAssessmentId": null,
  "mediaUploadSessionId": null
}
```

## Error Samples

- media-upload-part failed with HTTP 400
- read model check failed: healthLatestReflectsDevice
- read model check failed: dashboardReflectsDevice
- read model check failed: inboxOverviewOk
- media-upload-part failed with HTTP 400
