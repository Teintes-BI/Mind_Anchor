package com.mindanchor.androidaudio

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant

class HealthConnectBridge(private val context: Context) {
    private val client: HealthConnectClient?
        get() = if (isAvailable()) HealthConnectClient.getOrCreate(context) else null

    fun isAvailable(): Boolean = HealthConnectClient.getSdkStatus(context, PROVIDER_PACKAGE_NAME) == HealthConnectClient.SDK_AVAILABLE

    fun requiredPermissions(): Set<String> = REQUIRED_PERMISSIONS

    suspend fun grantedPermissions(): Set<String> = client?.permissionController?.getGrantedPermissions() ?: emptySet()

    suspend fun readSummary(sourceDevice: String, windowStart: Instant, windowEnd: Instant): HealthSummaryPayload {
        val healthClient = client ?: return HealthSummaryMapper.map(
            sourceDevice = sourceDevice,
            windowStart = windowStart,
            windowEnd = windowEnd,
            state = HealthSummaryReadState.PROVIDER_UNAVAILABLE,
        )
        val granted = healthClient.permissionController.getGrantedPermissions()
        if (!REQUIRED_PERMISSIONS.all(granted::contains)) {
            return HealthSummaryMapper.map(
                sourceDevice = sourceDevice,
                windowStart = windowStart,
                windowEnd = windowEnd,
                state = HealthSummaryReadState.PERMISSION_MISSING,
            )
        }

        val sleep = healthClient.readRecords(ReadRecordsRequest(SleepSessionRecord::class, TimeRangeFilter.between(windowStart, windowEnd))).records
        val exercises = healthClient.readRecords(ReadRecordsRequest(ExerciseSessionRecord::class, TimeRangeFilter.between(windowStart, windowEnd))).records
        val steps = healthClient.readRecords(ReadRecordsRequest(StepsRecord::class, TimeRangeFilter.between(windowStart, windowEnd))).records.sumOf { it.count }
        val restingRates = healthClient.readRecords(ReadRecordsRequest(RestingHeartRateRecord::class, TimeRangeFilter.between(windowStart, windowEnd))).records
        return HealthSummaryMapper.map(
            sourceDevice = sourceDevice,
            windowStart = windowStart,
            windowEnd = windowEnd,
            readings = HealthSummaryReadings(
                sleepSessions = sleep.map { HealthInterval(it.startTime, it.endTime) },
                exerciseSessions = exercises.map { HealthInterval(it.startTime, it.endTime) },
                steps = steps,
                restingHeartRates = restingRates.map { HealthHeartRateSample(it.time, it.beatsPerMinute) },
            ),
        )
    }

    companion object {
        const val PROVIDER_PACKAGE_NAME = "com.google.android.apps.healthdata"

        val REQUIRED_PERMISSIONS: Set<String> = setOf(
            HealthPermission.getReadPermission(SleepSessionRecord::class),
            HealthPermission.getReadPermission(ExerciseSessionRecord::class),
            HealthPermission.getReadPermission(StepsRecord::class),
            HealthPermission.getReadPermission(RestingHeartRateRecord::class),
        )
    }
}
