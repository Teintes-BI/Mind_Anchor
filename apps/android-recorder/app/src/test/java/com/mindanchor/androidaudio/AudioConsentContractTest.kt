package com.mindanchor.androidaudio

import org.junit.Assert.assertEquals
import org.junit.Test

class AudioConsentContractTest {
    @Test
    fun `cloud transcription is disabled by default`() {
        val payload = buildAudioConsentPayload(
            pairToken = "pair-token",
            deviceId = "android-device",
            status = "granted",
        )

        assertEquals("pair-token", payload.getString("pairToken"))
        assertEquals("android-device", payload.getString("deviceId"))
        assertEquals("granted", payload.getString("status"))
        assertEquals(false, payload.getBoolean("allowCloudTranscription"))
    }

    @Test
    fun `cloud transcription requires an explicit true value`() {
        val payload = buildAudioConsentPayload(
            pairToken = "pair-token",
            deviceId = "android-device",
            status = "granted",
            allowCloudTranscription = true,
        )

        assertEquals(true, payload.getBoolean("allowCloudTranscription"))
    }
}
