Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$appRoot = Join-Path $PSScriptRoot "app"
$mapperPath = Join-Path $appRoot "src/main/java/com/mindanchor/androidaudio/HealthSummaryMapper.kt"
$bridgePath = Join-Path $appRoot "src/main/java/com/mindanchor/androidaudio/HealthConnectBridge.kt"
$payloadPath = Join-Path $appRoot "src/main/java/com/mindanchor/androidaudio/HealthSummaryPayload.kt"
$lanClientPath = Join-Path $appRoot "src/main/java/com/mindanchor/androidaudio/LanBridgeClient.kt"
$activityPath = Join-Path $appRoot "src/main/java/com/mindanchor/androidaudio/MainActivity.kt"
$testPath = Join-Path $appRoot "src/test/java/com/mindanchor/androidaudio/HealthSummaryMapperTest.kt"
$manifestPath = Join-Path $appRoot "src/main/AndroidManifest.xml"
$layoutPath = Join-Path $appRoot "src/main/res/layout/activity_main.xml"
$stringsPath = Join-Path $appRoot "src/main/res/values/strings.xml"

function Assert-File([string] $path) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Missing required Android health file: $path"
    }
}

function Assert-Contains([string] $path, [string] $pattern) {
    $content = Get-Content -Raw -LiteralPath $path
    if ($content -notmatch [regex]::Escape($pattern)) {
        throw "Expected '$pattern' in $path"
    }
}

function Assert-NotContains([string] $path, [string] $pattern) {
    $content = Get-Content -Raw -LiteralPath $path
    if ($content -match [regex]::Escape($pattern)) {
        throw "Did not expect '$pattern' in $path"
    }
}

@($mapperPath, $bridgePath, $payloadPath, $lanClientPath, $activityPath, $testPath, $manifestPath, $layoutPath, $stringsPath) | ForEach-Object { Assert-File $_ }

Assert-Contains $mapperPath "enum class HealthSummaryReadState"
Assert-Contains $mapperPath "data class HealthSummaryReadings"
Assert-Contains $mapperPath "fun map("
Assert-Contains $mapperPath "PROVIDER_UNAVAILABLE"
Assert-Contains $mapperPath "PERMISSION_MISSING"
Assert-Contains $bridgePath "HealthSummaryMapper.map"
Assert-Contains $payloadPath "consentScope"
Assert-Contains $payloadPath "retentionClass"
Assert-Contains $lanClientPath "/local/mobile/health/consent"
Assert-Contains $lanClientPath "setHealthConsent"
Assert-Contains $lanClientPath 'consentRef = response.getString("consentRef")'
Assert-Contains $activityPath 'setHealthConsent(config, "granted")'
Assert-Contains $activityPath 'setHealthConsent(config, "revoked")'
Assert-Contains $activityPath "healthConsentRef"
Assert-Contains $activityPath "uploadHealthSummary(config, summary, consent.consentRef)"
Assert-NotContains $activityPath "health-summary-"
Assert-Contains $testPath "mapsSleepActivityStepsAndLatestRestingHeartRate"
Assert-Contains $testPath "reportsMissingWhenPermissionIsNotGrantedEvenIfReadingsWereProvided"
Assert-Contains $testPath "reportsMissingWhenHealthConnectProviderIsUnavailable"
Assert-Contains $testPath "serializesSharedContractFieldsAndConsentReference"
Assert-Contains $manifestPath "android.permission.health.READ_SLEEP"
Assert-Contains $manifestPath "android.permission.health.READ_EXERCISE"
Assert-Contains $manifestPath "android.permission.health.READ_STEPS"
Assert-Contains $manifestPath "android.permission.health.READ_HEART_RATE"
Assert-Contains $layoutPath "healthConsentStatusText"
Assert-Contains $layoutPath "revokeHealthConsentButton"
Assert-Contains $stringsPath "revoke_health_consent"

Write-Output "Android Health Connect static contract: PASS"
