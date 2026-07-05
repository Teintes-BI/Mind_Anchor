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
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import java.time.Instant

class MainActivity : AppCompatActivity() {
    private lateinit var pairingStore: PairingStore
    private val lanBridgeClient = LanBridgeClient()

    private lateinit var receiverHostInput: EditText
    private lateinit var pairCodeInput: EditText
    private lateinit var pairButton: Button
    private lateinit var startButton: Button
    private lateinit var stopButton: Button
    private lateinit var flushButton: Button
    private lateinit var pairingStatusText: TextView
    private lateinit var serviceStatusText: TextView

    private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        updateServiceStatus("Permissions updated.")
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

        receiverHostInput = findViewById(R.id.receiverHostInput)
        pairCodeInput = findViewById(R.id.pairCodeInput)
        pairButton = findViewById(R.id.pairButton)
        startButton = findViewById(R.id.startButton)
        stopButton = findViewById(R.id.stopButton)
        flushButton = findViewById(R.id.flushButton)
        pairingStatusText = findViewById(R.id.pairingStatusText)
        serviceStatusText = findViewById(R.id.serviceStatusText)

        val existingPairing = pairingStore.load()
        if (existingPairing != null) {
            receiverHostInput.setText(existingPairing.receiverBaseUrl)
            pairingStatusText.text = "Paired with ${existingPairing.deviceName} at ${existingPairing.pairedAt}"
        }

        pairButton.setOnClickListener { pairWithDesktop() }
        startButton.setOnClickListener {
            ensurePermissions()
            ContextCompat.startForegroundService(this, Intent(this, AudioCaptureService::class.java).setAction(AudioCaptureService.ACTION_START))
        }
        stopButton.setOnClickListener {
            startService(Intent(this, AudioCaptureService::class.java).setAction(AudioCaptureService.ACTION_STOP))
        }
        flushButton.setOnClickListener {
            startService(Intent(this, AudioCaptureService::class.java).setAction(AudioCaptureService.ACTION_FLUSH))
        }

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
}
