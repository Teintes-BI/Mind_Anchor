# MindAnchor iOS Health Prototype

This is an iOS-only SwiftUI/HealthKit prototype. It is intentionally not installed or tested from the Windows workstation.

## Scope

- User-triggered read-only HealthKit authorization
- Bounded 24-hour aggregation of sleep, activity/energy, steps, and resting heart rate
- Shared JSON payload with the Android Health Connect adapter
- Explicit missingness semantics and no medical diagnosis text
- `available`, `missing`, and `delayed` are normalized on-device; delayed means the summary arrives more than 24 hours after the requested window
- Permission and manual-sync state are explicit (`not requested`, `requesting`, `prompt completed`, `ready`, `not granted`, `unavailable`, `syncing`, `available`, `missing`, `delayed`, or `failed`)
- `consentRef` is optional while a summary is kept on-device, but required by `encodedJSON(requireConsent: true)` before an upload boundary

The host application must provide `NSHealthShareUsageDescription` and its HealthKit entitlement. Raw samples stay on the iPhone; only the summary payload is eligible for upload after the user starts a sync.

The host should pass the active health consent reference when constructing `HealthViewModel` or `HealthKitBridge.readSummary`. The prototype never fabricates a consent reference and never treats an empty result as inactivity or illness. Sleep aggregation counts asleep stages only; `inBed` and `awake` intervals are excluded. Records are clipped to the requested window, and overlapping intervals/samples are merged or de-duplicated before aggregation.

Run on macOS with Xcode/Swift:

```bash
swift test
```

On the Windows development workstation used for this repository, `swift`, `swiftc`, and `xcodebuild` are unavailable. The iOS package therefore has not been built or executed here; run `swift test` on macOS/Xcode before installing the prototype.
