# M6 Mobile Capture ADB E2E

- generatedAt: `2026-04-24T15:40:15.531Z`
- completedAt: `2026-04-24T15:40:18.249Z`
- apiBaseUrl: `http://127.0.0.1:3011`
- apiLanBaseUrl: `http://192.168.0.104:3011`
- openClawBaseUrl: `http://192.168.0.104:8800`
- passed: `false`

## Device

- serial: `320146882257`
- model: `NX733J`
- androidVersion: `15`
- wifiIp: `10.32.158.206`
- curlPath: `/system/bin/curl`

## Preflight

- adbDeviceConnected: `true`
- wifiIpDetected: `true`
- curlAvailable: `true`
- gatewayLanHealthOk: `false`

## Summary

- totalSteps: `0`
- failedSteps: `0`

## Read Models

- healthLatestReflectsDevice: `false`
- dashboardReflectsDevice: `false`
- inboxOverviewOk: `false`

## Steps

| Step | Method | Endpoint | HTTP | OK | Response IDs |
| --- | --- | --- | --- | --- | --- |


## Response IDs

```json
{}
```

## Error Samples

- read model check failed: healthLatestReflectsDevice
- read model check failed: dashboardReflectsDevice
- read model check failed: inboxOverviewOk
- Command failed: adb -s 320146882257 shell sh -c curl -sS -m 20 -w '\nHTTP_STATUS=%{http_code}\n' 'http://192.168.0.104:3011/health'
curl: try 'curl --help' or 'curl --manual' for more information

