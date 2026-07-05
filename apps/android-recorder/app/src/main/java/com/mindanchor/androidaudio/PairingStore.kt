package com.mindanchor.androidaudio

import android.content.Context

data class PairingConfig(
    val receiverBaseUrl: String,
    val pairToken: String,
    val deviceId: String,
    val deviceName: String,
    val pairedAt: String,
)

class PairingStore(context: Context) {
    private val preferences = context.getSharedPreferences("mindanchor_audio_beta", Context.MODE_PRIVATE)

    fun save(config: PairingConfig) {
        preferences.edit()
            .putString("receiverBaseUrl", config.receiverBaseUrl)
            .putString("pairToken", config.pairToken)
            .putString("deviceId", config.deviceId)
            .putString("deviceName", config.deviceName)
            .putString("pairedAt", config.pairedAt)
            .apply()
    }

    fun load(): PairingConfig? {
        val receiverBaseUrl = preferences.getString("receiverBaseUrl", null) ?: return null
        val pairToken = preferences.getString("pairToken", null) ?: return null
        val deviceId = preferences.getString("deviceId", null) ?: return null
        val deviceName = preferences.getString("deviceName", null) ?: return null
        val pairedAt = preferences.getString("pairedAt", null) ?: return null

        return PairingConfig(
            receiverBaseUrl = receiverBaseUrl,
            pairToken = pairToken,
            deviceId = deviceId,
            deviceName = deviceName,
            pairedAt = pairedAt,
        )
    }
}

