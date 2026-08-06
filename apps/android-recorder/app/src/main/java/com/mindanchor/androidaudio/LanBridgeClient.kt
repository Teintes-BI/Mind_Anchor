package com.mindanchor.androidaudio

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.time.Instant

data class PairResult(
    val pairToken: String,
    val desktopHost: String,
    val hostBindings: List<String>,
)

data class StartSessionResult(
    val sessionId: String,
)

data class AudioConsentResult(
    val consentRef: String,
    val status: String,
)

data class HealthConsentResult(
    val consentRef: String,
    val status: String,
)

data class AudioChunkPayload(
    val sessionId: String,
    val deviceId: String,
    val consentRef: String,
    val sequence: Int,
    val startedAt: String,
    val endedAt: String,
    val durationMs: Int,
    val encoding: String,
    val checksum: String,
    val base64Audio: String,
    val rms: Double,
    val peak: Double,
    val replayed: Boolean,
)

class LanBridgeClient {
    private fun validateReceiverBaseUrl(value: String): String {
        val uri = URI(value.trim())
        require(uri.scheme == "http") { "Only plain HTTP LAN endpoints are supported." }
        val host = uri.host ?: error("Receiver host is missing.")
        val octets = host.split(".")
        val isPrivateIp =
            host.startsWith("10.") ||
                host.startsWith("192.168.") ||
                (octets.size == 4 && octets[0] == "172" && octets[1].toIntOrNull() in 16..31)
        val isAllowedHostname = host.endsWith(".local")
        require(isPrivateIp || isAllowedHostname) { "Receiver host must stay on the local LAN." }
        return value.trim().removeSuffix("/")
    }

    private suspend fun request(method: String, url: String, body: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        val connection = URL(url).openConnection() as HttpURLConnection
        connection.requestMethod = method
        connection.connectTimeout = 10_000
        connection.readTimeout = 15_000
        connection.doInput = true
        connection.setRequestProperty("Content-Type", "application/json")

        if (method != "GET") {
            connection.doOutput = true
            connection.outputStream.use { output ->
                output.write(body.toString().toByteArray())
            }
        }

        val stream =
            if (connection.responseCode in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream ?: connection.inputStream
            }
        val text = BufferedReader(InputStreamReader(stream)).use { reader -> reader.readText() }
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException("Receiver request failed: ${connection.responseCode} $text")
        }

        if (text.isBlank()) JSONObject() else JSONObject(text)
    }

    suspend fun pair(
        receiverBaseUrl: String,
        pairCode: String,
        deviceId: String,
        deviceName: String,
        appVersion: String,
        platformVersion: String,
    ): PairResult {
        val baseUrl = validateReceiverBaseUrl(receiverBaseUrl)
        val response = request(
            method = "POST",
            url = "$baseUrl/local/mobile/pair",
            body = JSONObject()
                .put("pairCode", pairCode)
                .put("deviceId", deviceId)
                .put("deviceName", deviceName)
                .put("appVersion", appVersion)
                .put("platformVersion", platformVersion),
        )

        val bindings = response.optJSONArray("hostBindings") ?: JSONArray()
        val bindingValues = buildList {
            for (index in 0 until bindings.length()) {
                add(bindings.getJSONObject(index).optString("url"))
            }
        }

        return PairResult(
            pairToken = response.getString("pairToken"),
            desktopHost = response.getString("desktopHost"),
            hostBindings = bindingValues,
        )
    }

    suspend fun startSession(config: PairingConfig, consentRef: String): StartSessionResult {
        val response = request(
            method = "POST",
            url = "${config.receiverBaseUrl}/local/mobile/audio/sessions",
            body = JSONObject()
                .put("pairToken", config.pairToken)
                .put("deviceId", config.deviceId)
                .put("captureMode", "foreground_microphone_with_call_events")
                .put("sampleRateHz", 16000)
                .put("channels", 1)
                .put("encoding", "audio/pcm16le")
                .put("chunkDurationMs", 5000)
                .put("rollingBufferSeconds", 3600)
                .put("consentRef", consentRef)
                .put("startedAt", Instant.now().toString()),
        )

        return StartSessionResult(sessionId = response.getString("sessionId"))
    }

    suspend fun uploadChunk(config: PairingConfig, chunk: AudioChunkPayload) {
        request(
            method = "POST",
            url = "${config.receiverBaseUrl}/local/mobile/audio/chunks",
            body = JSONObject()
                .put("pairToken", config.pairToken)
                .put("deviceId", chunk.deviceId)
                .put("sessionId", chunk.sessionId)
                .put("sequence", chunk.sequence)
                .put("startedAt", chunk.startedAt)
                .put("endedAt", chunk.endedAt)
                .put("durationMs", chunk.durationMs)
                .put("encoding", chunk.encoding)
                .put("checksum", chunk.checksum)
                .put("base64Audio", chunk.base64Audio)
                .put("rms", chunk.rms)
                .put("peak", chunk.peak)
                .put("consentRef", chunk.consentRef)
                .put("replayed", chunk.replayed),
        )
    }

    suspend fun completeSession(config: PairingConfig, sessionId: String, consentRef: String) {
        request(
            method = "POST",
            url = "${config.receiverBaseUrl}/local/mobile/audio/sessions/$sessionId/complete",
            body = JSONObject()
                .put("pairToken", config.pairToken)
                .put("deviceId", config.deviceId)
                .put("status", "completed")
                .put("consentRef", consentRef)
                .put("endedAt", Instant.now().toString()),
        )
    }

    suspend fun setAudioConsent(
        config: PairingConfig,
        status: String,
        allowCloudTranscription: Boolean = false,
    ): AudioConsentResult {
        val response = request(
            method = "POST",
            url = "${config.receiverBaseUrl}/local/mobile/audio/consent",
            body = buildAudioConsentPayload(
                pairToken = config.pairToken,
                deviceId = config.deviceId,
                status = status,
                allowCloudTranscription = allowCloudTranscription,
            ),
        )
        return AudioConsentResult(
            consentRef = response.getString("consentRef"),
            status = response.getString("status"),
        )
    }

    suspend fun setHealthConsent(config: PairingConfig, status: String): HealthConsentResult {
        require(status in setOf("granted", "paused", "revoked")) {
            "Unsupported health consent status: $status"
        }
        val response = request(
            method = "POST",
            url = "${config.receiverBaseUrl}/local/mobile/health/consent",
            body = JSONObject()
                .put("pairToken", config.pairToken)
                .put("deviceId", config.deviceId)
                .put("status", status),
        )
        return HealthConsentResult(
            consentRef = response.getString("consentRef"),
            status = response.getString("status"),
        )
    }

    suspend fun postCallEvent(config: PairingConfig, status: String, direction: String) {
        request(
            method = "POST",
            url = "${config.receiverBaseUrl}/local/mobile/call-events",
            body = JSONObject()
                .put("pairToken", config.pairToken)
                .put("deviceId", config.deviceId)
                .put("status", status)
                .put("direction", direction)
                .put("occurredAt", Instant.now().toString()),
        )
    }

    suspend fun uploadHealthSummary(config: PairingConfig, summary: HealthSummaryPayload, consentRef: String) {
        request(
            method = "POST",
            url = "${config.receiverBaseUrl}/local/mobile/health/summaries",
            body = summary.toJson(config.deviceId, consentRef)
                .put("pairToken", config.pairToken),
        )
    }
}
