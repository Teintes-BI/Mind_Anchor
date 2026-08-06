package com.mindanchor.androidaudio

import org.json.JSONObject
import java.time.Instant

data class HealthSummaryPayload(
    val sourceDevice: String,
    val windowStart: String,
    val windowEnd: String,
    val capturedAt: String,
    val receivedAt: String = Instant.now().toString(),
    val missingness: String,
    val sleepMinutes: Int? = null,
    val activeMinutes: Int? = null,
    val steps: Long? = null,
    val restingHeartRate: Double? = null,
) {
    fun toJson(deviceId: String, consentRef: String): JSONObject = JSONObject()
        .put("deviceId", deviceId)
        .put("sourcePlatform", "android")
        .put("sourceProvider", "health_connect")
        .put("sourceDevice", sourceDevice)
        .put("windowStart", windowStart)
        .put("windowEnd", windowEnd)
        .put("capturedAt", capturedAt)
        .put("receivedAt", receivedAt)
        .put("missingness", missingness)
        .put("consentScope", "health_summary")
        .put("retentionClass", "summary")
        .put("consentRef", consentRef)
        .putOpt("sleepMinutes", sleepMinutes)
        .putOpt("activeMinutes", activeMinutes)
        .putOpt("steps", steps)
        .putOpt("restingHeartRate", restingHeartRate)
}
