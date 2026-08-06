package com.mindanchor.androidaudio

import org.json.JSONObject

internal fun buildAudioConsentPayload(
    pairToken: String,
    deviceId: String,
    status: String,
    allowCloudTranscription: Boolean = false,
): JSONObject {
    require(status in setOf("granted", "paused", "revoked")) {
        "Unsupported audio consent status: $status"
    }
    return JSONObject()
        .put("pairToken", pairToken)
        .put("deviceId", deviceId)
        .put("status", status)
        .put("allowCloudTranscription", allowCloudTranscription)
}
