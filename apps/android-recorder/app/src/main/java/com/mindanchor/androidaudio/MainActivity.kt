package com.mindanchor.androidaudio

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import com.google.android.material.switchmaterial.SwitchMaterial
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED
import androidx.lifecycle.lifecycleScope
import androidx.health.connect.client.permission.PermissionController
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.temporal.ChronoUnit

class MainActivity : AppCompatActivity() {
    private lateinit var pairingStore: PairingStore
    private val lanBridgeClient = LanBridgeClient()

    private lateinit var receiverHostInput: EditText
    private lateinit var pairCodeInput: EditText
    private lateinit var pairButton: Button
    private lateinit var startButton: Button
    private lateinit var cloudTranscriptionSwitch: SwitchMaterial
    private lateinit var stopButton: Button
    private lateinit var revokeConsentButton: Button
    private lateinit var flushButton: Button
    private lateinit var pairingStatusText: TextView
    private lateinit var serviceStatusText: TextView
    private lateinit var healthStatusText: TextView
    private lateinit var healthConsentStatusText: TextView
    private lateinit var syncHealthButton: Button
    private lateinit var revokeHealthConsentButton: Button
    private lateinit var healthBridge: HealthConnectBridge
    private var healthConsentRef: String? = null
    private var healthConsentEpoch: Long = 0

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        updateServiceStatus("Permissions updated.")
    }

    private val healthPermissionLauncher = registerForActivityResult(PermissionController.createRequestPermissionResultContract()) {
        syncHealthSummary()
    }

    private val serviceStatusReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            updateServiceStatus(intent?.getStringExtra("message") ?: return)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        pairingStore = PairingStore(this)
        healthBridge = HealthConnectBridge(this)

        receiverHostInput = findViewById(R.id.receiverHostInput)
        pairCodeInput = findViewById(R.id.pairCodeInput)
        pairButton = findViewById(R.id.pairButton)
        startButton = findViewById(R.id.startButton)
        cloudTranscriptionSwitch = findViewById(R.id.cloudTranscriptionSwitch)
        stopButton = findViewById(R.id.stopButton)
        revokeConsentButton = findViewById(R.id.revokeConsentButton)
        flushButton = findViewById(R.id.flushButton)
        pairingStatusText = findViewById(R.id.pairingStatusText)
        serviceStatusText = findViewById(R.id.serviceStatusText)
        healthStatusText = findViewById(R.id.healthStatusText)
        healthConsentStatusText = findViewById(R.id.healthConsentStatusText)
        syncHealthButton = findViewById(R.id.syncHealthButton)
        revokeHealthConsentButton = findViewById(R.id.revokeHealthConsentButton)
        updateHealthConsentStatus("not_granted")

        val existingPairing = pairingStore.load()
        if (existingPairing != null) {
            receiverHostInput.setText(existingPairing.receiverBaseUrl)
            pairingStatusText.text = "Paired with ${existingPairing.deviceName} at ${existingPairing.pairedAt}"
        }

        pairButton.setOnClickListener { pairWithDesktop() }
        startButton.setOnClickListener {
            ensurePermissions()
            ContextCompat.startForegroundService(
                this,
                Intent(this, AudioCaptureService::class.java)
                    .setAction(AudioCaptureService.ACTION_START)
                    .putExtra(
                        AudioCaptureService.EXTRA_ALLOW_CLOUD_TRANSCRIPTION,
                        cloudTranscriptionSwitch.isChecked,
                    ),
            )
        }
        stopButton.setOnClickListener {
            startService(Intent(this, AudioCaptureService::class.java).setAction(AudioCaptureService.ACTION_STOP))
        }
        revokeConsentButton.setOnClickListener {
            startService(Intent(this, AudioCaptureService::class.java).setAction(AudioCaptureService.ACTION_REVOKE_CONSENT))
        }
        flushButton.setOnClickListener {
            startService(Intent(this, AudioCaptureService::class.java).setAction(AudioCaptureService.ACTION_FLUSH))
        }
        syncHealthButton.setOnClickListener { syncHealthSummary() }
        revokeHealthConsentButton.setOnClickListener { revokeHealthConsent() }

        ensurePermissions()
    }

    override fun onStart() {
        super.onStart()
        ContextCompat.registerReceiver(
            this,
            serviceStatusReceiver,
            IntentFilter(AudioCaptureService.ACTION_STATUS),
            RECEIVER_NOT_EXPORTED,
        )
    }

    override fun onStop() {
        unregisterReceiver(serviceStatusReceiver)
        super.onStop()
    }

    private fun pairWithDesktop() {
        val receiverBaseUrl = receiverHostInput.text.toString().trim()
        val pairCode = pairCodeInput.text.toString().trim()
        val deviceId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: Build.ID
        val deviceName = "${Build.MANUFACTURER} ${Build.MODEL}"

        lifecycleScope.launch {
            runCatching {
                val result = lanBridgeClient.pair(
                    receiverBaseUrl = receiverBaseUrl,
                    pairCode = pairCode,
                    deviceId = deviceId,
                    deviceName = deviceName,
                    appVersion = BuildConfig.VERSION_NAME,
                    platformVersion = Build.VERSION.RELEASE ?: "unknown",
                )
                val config = PairingConfig(
                    receiverBaseUrl = result.desktopHost,
                    pairToken = result.pairToken,
                    deviceId = deviceId,
                    deviceName = deviceName,
                    pairedAt = Instant.now().toString(),
                )
                pairingStore.save(config)
                pairingStatusText.text = "Paired with desktop host ${result.desktopHost}"
                updateServiceStatus("Desktop pairing completed.")
            }.onFailure { error ->
                pairingStatusText.text = "Pairing failed: ${error.message}"
            }
        }
    }

    private fun ensurePermissions() {
        val permissions = buildList {
            add(Manifest.permission.RECORD_AUDIO)
            add(Manifest.permission.READ_PHONE_STATE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (permissions.isNotEmpty()) {
            permissionLauncher.launch(permissions.toTypedArray())
        }
    }

    private fun updateServiceStatus(message: String) {
        serviceStatusText.text = message
    }

    private fun syncHealthSummary() {
        if (!healthBridge.isAvailable()) {
            healthStatusText.text = getString(R.string.health_provider_unavailable)
            return
        }
        val config = pairingStore.load()
        if (config == null) {
            healthStatusText.text = getString(R.string.health_pairing_required)
            return
        }
        lifecycleScope.launch {
            val granted = healthBridge.grantedPermissions()
            if (!healthBridge.requiredPermissions().all(granted::contains)) {
                healthStatusText.text = getString(R.string.health_permission_required)
                healthPermissionLauncher.launch(healthBridge.requiredPermissions())
                return@launch
            }

            val requestEpoch = ++healthConsentEpoch
            runCatching {
                val consent = lanBridgeClient.setHealthConsent(config, "granted")
                check(requestEpoch == healthConsentEpoch) {
                    "Health summary consent request was superseded."
                }
                check(consent.status == "granted") { "Health summary consent was not granted." }
                check(consent.consentRef.isNotBlank()) { "Health summary consent reference is missing." }
                healthConsentRef = consent.consentRef
                updateHealthConsentStatus("granted")

                val end = Instant.now()
                val start = end.minus(24, ChronoUnit.HOURS)
                val summary = healthBridge.readSummary("${Build.MANUFACTURER} ${Build.MODEL}", start, end)
                check(requestEpoch == healthConsentEpoch && healthConsentRef == consent.consentRef) {
                    "Health summary consent was revoked before upload."
                }
                lanBridgeClient.uploadHealthSummary(config, summary, consent.consentRef)
                summary
            }.onSuccess { summary ->
                healthStatusText.text = getString(R.string.health_sync_success, summary.missingness)
            }.onFailure { error ->
                if (requestEpoch == healthConsentEpoch && error.message?.contains("consent", ignoreCase = true) == true) {
                    healthConsentRef = null
                    updateHealthConsentStatus("not_granted")
                }
                healthStatusText.text = getString(R.string.health_sync_failed, error.message ?: "unknown error")
            }
        }
    }

    private fun revokeHealthConsent() {
        val config = pairingStore.load()
        if (config == null) {
            healthStatusText.text = getString(R.string.health_pairing_required)
            return
        }

        healthConsentRef = null
        healthConsentEpoch += 1
        updateHealthConsentStatus("revoking")
        lifecycleScope.launch {
            runCatching {
                val result = lanBridgeClient.setHealthConsent(config, "revoked")
                check(result.status == "revoked") { "Health summary consent was not revoked." }
                result
            }.onSuccess {
                updateHealthConsentStatus("revoked")
                healthStatusText.text = getString(R.string.health_consent_revoked)
            }.onFailure { error ->
                updateHealthConsentStatus("not_granted")
                healthStatusText.text = getString(R.string.health_consent_revoke_failed, error.message ?: "unknown error")
            }
        }
    }

    private fun updateHealthConsentStatus(status: String) {
        healthConsentStatusText.text = when (status) {
            "granted" -> getString(R.string.health_consent_granted)
            "revoking" -> getString(R.string.health_consent_revoking)
            "revoked" -> getString(R.string.health_consent_revoked)
            else -> getString(R.string.health_consent_not_granted)
        }
    }
}
