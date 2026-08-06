package com.mindanchor.androidaudio

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.security.MessageDigest
import java.time.Instant
import java.util.Base64
import kotlin.math.abs
import kotlin.math.sqrt

class AudioCaptureService : Service() {
    companion object {
        const val ACTION_START = "com.mindanchor.androidaudio.action.START"
        const val ACTION_STOP = "com.mindanchor.androidaudio.action.STOP"
        const val ACTION_FLUSH = "com.mindanchor.androidaudio.action.FLUSH"
        const val ACTION_REVOKE_CONSENT = "com.mindanchor.androidaudio.action.REVOKE_CONSENT"
        const val ACTION_STATUS = "com.mindanchor.androidaudio.STATUS"
        private const val NOTIFICATION_CHANNEL_ID = "mindanchor_audio_capture"
        private const val NOTIFICATION_ID = 4001
        private const val SAMPLE_RATE_HZ = 16_000
        private const val CHANNEL_COUNT = 1
        private const val CHUNK_DURATION_MS = 5_000
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var pairingStore: PairingStore
    private lateinit var lanBridgeClient: LanBridgeClient
    private lateinit var audioChunkQueue: AudioChunkQueue
    private var currentSessionId: String? = null
    private var currentConsentRef: String? = null
    private var recorder: AudioRecord? = null
    private var isCapturing = false
    private var telephonyCallback: TelephonyCallback? = null
    private var phoneStateListener: PhoneStateListener? = null
    private var lastCallState = TelephonyManager.CALL_STATE_IDLE

    override fun onCreate() {
        super.onCreate()
        pairingStore = PairingStore(this)
        lanBridgeClient = LanBridgeClient()
        audioChunkQueue = AudioChunkQueue(this)
        createNotificationChannel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startCapture()
            ACTION_STOP -> stopCapture()
            ACTION_FLUSH -> flushQueue()
            ACTION_REVOKE_CONSENT -> revokeConsent()
        }
        return START_STICKY
    }

    override fun onDestroy() {
        stopCapture()
        serviceScope.cancel()
        super.onDestroy()
    }

    private fun startCapture() {
        if (isCapturing) {
            publishStatus("Audio capture is already running.")
            return
        }

        val config = pairingStore.load()
        if (config == null) {
            publishStatus("Pair with a desktop before starting foreground capture.")
            return
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            publishStatus("Microphone permission is missing.")
            return
        }

        startForeground(NOTIFICATION_ID, buildNotification())
        isCapturing = true
        registerCallMonitoring()

        serviceScope.launch {
            var consentRef: String? = null
            try {
                val grantedConsent = lanBridgeClient.setAudioConsent(config, "granted")
                consentRef = grantedConsent.consentRef
                if (!isCapturing) {
                    runCatching { lanBridgeClient.setAudioConsent(config, "revoked") }
                    return@launch
                }
                currentConsentRef = consentRef
                val session = lanBridgeClient.startSession(config, grantedConsent.consentRef)
                if (!isCapturing) {
                    runCatching { lanBridgeClient.completeSession(config, session.sessionId, grantedConsent.consentRef) }
                    runCatching { lanBridgeClient.setAudioConsent(config, "revoked") }
                    return@launch
                }
                currentSessionId = session.sessionId
                publishStatus("Foreground audio capture started.")
                runRecorderLoop(config, session.sessionId, grantedConsent.consentRef)
            } catch (error: Throwable) {
                if (consentRef != null) {
                    runCatching { lanBridgeClient.setAudioConsent(config, "revoked") }
                }
                publishStatus("Failed to start session: ${error.message}")
                stopCapture()
            }
        }
    }

    private fun stopCapture() {
        if (!isCapturing) return
        isCapturing = false
        unregisterCallMonitoring()
        recorder?.runCatching {
            stop()
            release()
        }
        recorder = null

        val config = pairingStore.load()
        val sessionId = currentSessionId
        val consentRef = currentConsentRef
        if (config != null && sessionId != null && consentRef != null) {
            serviceScope.launch {
                runCatching { lanBridgeClient.completeSession(config, sessionId, consentRef) }
            }
        }
        currentSessionId = null
        currentConsentRef = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        publishStatus("Foreground audio capture stopped.")
    }

    private fun flushQueue() {
        val config = pairingStore.load()
        if (config == null) {
            publishStatus("No desktop pairing found for backlog flush.")
            return
        }

        serviceScope.launch {
            try {
                val processed = audioChunkQueue.drain { chunk ->
                    lanBridgeClient.uploadChunk(config, chunk.copy(replayed = true))
                }
                publishStatus("Flushed $processed queued audio chunks.")
            } catch (error: Throwable) {
                publishStatus("Failed to flush queued audio chunks: ${error.message}")
            }
        }
    }

    private fun revokeConsent() {
        val config = pairingStore.load()
        if (config == null) {
            publishStatus("Pair with a desktop before revoking audio consent.")
            return
        }

        serviceScope.launch {
            val revokeResult = runCatching { lanBridgeClient.setAudioConsent(config, "revoked") }
            if (isCapturing) {
                stopCapture()
            }
            revokeResult
                .onSuccess {
                    currentConsentRef = null
                    publishStatus("Wayfinder audio consent revoked. Queued audio will not be replayed without new consent.")
                }
                .onFailure { error -> publishStatus("Failed to revoke Wayfinder audio consent: ${error.message}") }
        }
    }

    private suspend fun runRecorderLoop(config: PairingConfig, sessionId: String, consentRef: String) {
        val minBufferSize = AudioRecord.getMinBufferSize(
            SAMPLE_RATE_HZ,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
        )
        val chunkBytes = SAMPLE_RATE_HZ * CHANNEL_COUNT * 2 * CHUNK_DURATION_MS / 1000
        val bufferSize = maxOf(minBufferSize, chunkBytes)
        val audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            SAMPLE_RATE_HZ,
            AudioFormat.CHANNEL_IN_MONO,
            AudioFormat.ENCODING_PCM_16BIT,
            bufferSize,
        )
        recorder = audioRecord
        audioRecord.startRecording()

        var sequence = 0
        while (serviceScope.isActive && isCapturing) {
            val startedAt = Instant.now()
            val chunkBuffer = ByteArray(chunkBytes)
            var offset = 0
            while (offset < chunkBytes && isCapturing) {
                val bytesRead = audioRecord.read(chunkBuffer, offset, chunkBytes - offset)
                if (bytesRead > 0) {
                    offset += bytesRead
                }
            }
            if (!isCapturing) break

            val endedAt = Instant.now()
            val metrics = measurePcm(chunkBuffer)
            val base64Audio = Base64.getEncoder().encodeToString(chunkBuffer)
            val checksum = sha256(chunkBuffer)
            val payload = AudioChunkPayload(
                sessionId = sessionId,
                deviceId = config.deviceId,
                consentRef = consentRef,
                sequence = sequence,
                startedAt = startedAt.toString(),
                endedAt = endedAt.toString(),
                durationMs = CHUNK_DURATION_MS,
                encoding = "audio/pcm16le",
                checksum = checksum,
                base64Audio = base64Audio,
                rms = metrics.first,
                peak = metrics.second,
                replayed = false,
            )

            try {
                lanBridgeClient.uploadChunk(config, payload)
                audioChunkQueue.drain { chunk ->
                    lanBridgeClient.uploadChunk(config, chunk.copy(replayed = true))
                }
                publishStatus("Uploaded audio chunk #$sequence.")
            } catch (error: Throwable) {
                audioChunkQueue.enqueue(payload)
                publishStatus("Queued audio chunk #$sequence for LAN retry.")
            }

            sequence += 1
            delay(50)
        }
    }

    private fun measurePcm(bytes: ByteArray): Pair<Double, Double> {
        var peak = 0.0
        var sumSquares = 0.0
        var count = 0
        var index = 0
        while (index + 1 < bytes.size) {
            val low = bytes[index].toInt() and 0xff
            val high = bytes[index + 1].toInt()
            val sample = ((high shl 8) or low).toShort().toInt() / 32768.0
            peak = maxOf(peak, abs(sample))
            sumSquares += sample * sample
            count += 1
            index += 2
        }
        val rms = if (count == 0) 0.0 else sqrt(sumSquares / count)
        return Pair(rms.coerceIn(0.0, 1.0), peak.coerceIn(0.0, 1.0))
    }

    private fun sha256(bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(bytes)
        return digest.joinToString("") { "%02x".format(it) }
    }

    private fun buildNotification(): Notification =
        NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentTitle(getString(R.string.foreground_notification_title))
            .setContentText(getString(R.string.foreground_notification_body))
            .setOngoing(true)
            .build()

    private fun createNotificationChannel() {
        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            getString(R.string.foreground_channel_name),
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = getString(R.string.foreground_channel_description)
        }
        manager.createNotificationChannel(channel)
    }

    private fun registerCallMonitoring() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return
        }

        val telephonyManager = getSystemService(TelephonyManager::class.java)
        val config = pairingStore.load() ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val callback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                override fun onCallStateChanged(state: Int) {
                    handleCallStateChange(config, state)
                }
            }
            telephonyManager.registerTelephonyCallback(mainExecutor, callback)
            telephonyCallback = callback
        } else {
            val listener = object : PhoneStateListener() {
                override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                    handleCallStateChange(config, state)
                }
            }
            @Suppress("DEPRECATION")
            telephonyManager.listen(listener, PhoneStateListener.LISTEN_CALL_STATE)
            phoneStateListener = listener
        }
    }

    private fun unregisterCallMonitoring() {
        val telephonyManager = getSystemService(TelephonyManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            telephonyCallback?.let(telephonyManager::unregisterTelephonyCallback)
            telephonyCallback = null
        } else {
            @Suppress("DEPRECATION")
            telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE)
            phoneStateListener = null
        }
    }

    private fun handleCallStateChange(config: PairingConfig, state: Int) {
        val statusDirection = when (state) {
            TelephonyManager.CALL_STATE_RINGING -> "ringing" to "incoming"
            TelephonyManager.CALL_STATE_OFFHOOK ->
                if (lastCallState == TelephonyManager.CALL_STATE_RINGING) {
                    "answered" to "incoming"
                } else {
                    "answered" to "outgoing"
                }
            TelephonyManager.CALL_STATE_IDLE ->
                if (lastCallState == TelephonyManager.CALL_STATE_RINGING) {
                    "missed" to "incoming"
                } else {
                    "ended" to "unknown"
                }
            else -> "unknown" to "unknown"
        }
        lastCallState = state

        serviceScope.launch {
            runCatching { lanBridgeClient.postCallEvent(config, statusDirection.first, statusDirection.second) }
        }
    }

    private fun publishStatus(message: String) {
        sendBroadcast(Intent(ACTION_STATUS).putExtra("message", message))
    }
}

