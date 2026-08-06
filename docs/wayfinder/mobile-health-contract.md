# Mobile Health Summary Contract

Android and iOS emit the same bounded summary fields to the gateway. The phone aggregates provider records locally; the gateway receives no raw samples.

```json
{
  "sourcePlatform": "android|ios",
  "sourceProvider": "health_connect|healthkit|vendor_cloud|vendor_sdk",
  "sourceDevice": "opaque device label",
  "windowStart": "ISO-8601",
  "windowEnd": "ISO-8601",
  "capturedAt": "ISO-8601",
  "receivedAt": "ISO-8601",
  "missingness": "available|missing|delayed",
  "consentScope": "health_summary",
  "retentionClass": "summary",
  "consentRef": "opaque-grant-reference",
  "sleepMinutes": 420,
  "activeMinutes": 42,
  "steps": 6800,
  "restingHeartRate": 58
}
```

`missing` means the provider or permission did not yield a value. `delayed` means a value exists but arrived more than 24 hours after the requested window. Neither state is treated as evidence of inactivity or illness. Health summaries only adjust suggestion dose and remain low-confidence context.

Android uses Health Connect as the platform hub. iOS uses HealthKit behind the same adapter shape. Vendor brands are compatible only when they publish through one of these approved platform/provider boundaries; no direct vendor account credentials are stored by MindAnchor.

## Consent and retention

The user starts each sync from the mobile UI after the platform permission prompt. The gateway retains summary fields and provenance only. Raw provider samples stay on-device and are not uploaded. A user can pause or revoke the health scope through the Wayfinder consent control, then export or delete derived summaries through the T11 data controls.

## Verification record

- Android source contract: `apps/android-recorder/app/src/main/java/com/mindanchor/androidaudio/HealthSummaryPayload.kt`
- Android provider adapter: `apps/android-recorder/app/src/main/java/com/mindanchor/androidaudio/HealthConnectBridge.kt`
- iOS prototype contract: `apps/ios-wayfinder/Sources/WayfinderHealth/HealthSummaryPayload.swift`
- Gateway normalizer: `apps/api/src/services/wayfinder/health-signal-service.ts`
- Windows verification uses source/static checks; iOS execution requires a macOS/Xcode environment and is intentionally not claimed here.

## Windows verification record (2026-08-06)

- `corepack pnpm --filter @mindanchor/desktop test`: exit 0; build passed and 26/26 Node tests passed.
- `corepack pnpm --filter @mindanchor/desktop build`: exit 0.
- `powershell -ExecutionPolicy Bypass -File apps/android-recorder/verify-health-contract.ps1`: exit 0; `Android Health Connect static contract: PASS`.
- `git diff --check -- apps/android-recorder`: exit 0.
- `java -version`, `gradle`, and Android SDK probes: unavailable on this Windows workstation; no APK build is claimed.
- `swift --version`, `swiftc --version`, and `xcodebuild -version`: unavailable on this Windows workstation; no iOS build is claimed.
- iOS structural check: exit 0; `iOS HealthKit structural contract: PASS`; `swift`, `swiftc`, and `xcodebuild` unavailable.
- `corepack pnpm --filter @mindanchor/api exec vitest run tests/wayfinder-health-signal.test.ts tests/health-signal-schema.test.ts`: exit 0; 2 files/10 tests passed.
- `corepack pnpm --filter @mindanchor/api test`: exit 0; 33 files/264 tests passed.
- `corepack pnpm --filter @mindanchor/web test`: exit 0; 8 files/16 tests passed.
- `corepack pnpm --filter @mindanchor/desktop test`: exit 0; 26/26 Node tests passed.
- `& 'apps/api/node_modules/.bin/vitest.cmd' run --config apps/api/vitest.config.ts scripts/__tests__/wayfinder-audio-evaluation.test.mjs`: exit 0; 2 audio-evaluation tests passed.
- `node scripts/wayfinder-audio-evaluation.mjs --fixtures docs/wayfinder/audio-evaluation-fixtures.json --output <isolated-temp-file>`: exit 0; 6 fixtures, candidate precision/recall 1.0/1.0, consent rejection 1.0, `passed: true`.
- `& 'apps/api/node_modules/.bin/vitest.cmd' run --config apps/api/vitest.config.ts scripts/__tests__/wayfinder-evaluation.test.mjs scripts/__tests__/wayfinder-export.test.mjs scripts/__tests__/wayfinder-audio-evaluation.test.mjs`: exit 0; 3 files/9 tests passed, including missing/delayed health dose-neutrality, audio consent safety, and persistent source deletion.
- `node scripts/wayfinder-evaluation.mjs --fixtures docs/wayfinder/evaluation-scenarios.json --output <isolated-temp-file>`: exit 0; 10 scenarios evaluated, 2 health-missingness fixtures handled safely, and `passed: true`.
- `node scripts/wayfinder-export.mjs --input <isolated-fixture> --user demo-user --format json --output <isolated-temp-file> --delete-after-export`: exit 0; deletion verification reported `deleted: true, remaining: 0`, and the source fixture was rewritten without the deleted user's records; raw audio fields were omitted.
- `node scripts/wayfinder-export.mjs --input <isolated-fixture> --user demo-user --format markdown --output <isolated-temp-file>`: exit 0; Markdown export included the health summary collection.
