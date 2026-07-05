# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-24T15:42:25.363Z`
- completedAt: `2026-04-24T15:42:27.540Z`
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

- totalSteps: `1`
- failedSteps: `1`

## Read Models

- healthLatestReflectsDevice: `false`
- dashboardReflectsDevice: `false`
- inboxOverviewOk: `false`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |
| mobile-device-register | `POST` | `/mobile/devices/register` | `0` | `false` | — |

## Response IDs

```json
{}
```

## Error Samples

- mobile-device-register failed with HTTP 0
- read model check failed: healthLatestReflectsDevice
- read model check failed: dashboardReflectsDevice
- read model check failed: inboxOverviewOk
- mobile-device-register failed with HTTP 0
