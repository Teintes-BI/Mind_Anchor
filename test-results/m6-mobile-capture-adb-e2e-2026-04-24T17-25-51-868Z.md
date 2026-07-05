# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-24T17:25:51.868Z`
- completedAt: `2026-04-24T17:25:54.720Z`
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

- totalSteps: `6`
- failedSteps: `1`
- phaseCount: `0`
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

## Phases

- none

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| mobile-device-register | `POST` | `/mobile/devices/register` | `201` | `true` | id=67f1bdb2-0f27-4837-a0ad-60e46bb3e188, deviceId=android-m6-capture |
| edge-device-register | `POST` | `/devices/register` | `201` | `true` | id=3a465020-b24f-4fc7-ba8b-b41b67ee9d4c, deviceId=android-m6-capture |
| device-heartbeat | `POST` | `/devices/heartbeat` | `200` | `true` | id=3a465020-b24f-4fc7-ba8b-b41b67ee9d4c, deviceId=android-m6-capture |
| audio-session-start | `POST` | `/mobile/capture/sessions/start` | `201` | `true` | sessionId=edc60204-12c9-41db-9d9b-76172b4a5c65, status=active |
| device-heartbeat:baseline | `POST` | `/devices/heartbeat` | `200` | `true` | id=3a465020-b24f-4fc7-ba8b-b41b67ee9d4c, deviceId=android-m6-capture |
| emotion-assessment:baseline | `POST` | `/emotion/assessments` | `400` | `false` | — |

## Response IDs

```json
{
  "mobileDeviceId": "67f1bdb2-0f27-4837-a0ad-60e46bb3e188",
  "audioSessionId": "edc60204-12c9-41db-9d9b-76172b4a5c65"
}
```

## Error Samples

- emotion-assessment:baseline failed with HTTP 400
- read model check failed: healthLatestReflectsDevice
- read model check failed: dashboardReflectsDevice
- read model check failed: inboxOverviewOk
- read model check failed: inboxAckReflected
- read model check failed: recoveryPlanCreated
- read model check failed: recoveryHistoryReflectsPlan
- read model check failed: recoveryInboxConsistent
- read model check failed: recoveryDashboardConsistent
- emotion-assessment:baseline failed with HTTP 400
