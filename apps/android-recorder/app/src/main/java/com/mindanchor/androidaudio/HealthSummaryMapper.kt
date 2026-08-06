package com.mindanchor.androidaudio

import java.time.Duration
import java.time.Instant

/**
 * The result of the platform read before it is converted to the shared payload.
 * These small value types deliberately do not depend on Health Connect so the
 * aggregation rules can be tested on the JVM without a device or provider.
 */
data class HealthInterval(
    val startTime: Instant,
    val endTime: Instant,
)

data class HealthHeartRateSample(
    val time: Instant,
    val beatsPerMinute: Long,
)

data class HealthSummaryReadings(
    val sleepSessions: List<HealthInterval> = emptyList(),
    val exerciseSessions: List<HealthInterval> = emptyList(),
    val steps: Long = 0,
    val restingHeartRates: List<HealthHeartRateSample> = emptyList(),
)

enum class HealthSummaryReadState {
    READABLE,
    PERMISSION_MISSING,
    PROVIDER_UNAVAILABLE,
}

/**
 * Maps provider records into the bounded, missingness-aware mobile contract.
 * No medical interpretation is performed here; this class only aggregates
 * values that were already read with explicit user permission.
 */
object HealthSummaryMapper {
    fun map(
        sourceDevice: String,
        windowStart: Instant,
        windowEnd: Instant,
        readings: HealthSummaryReadings = HealthSummaryReadings(),
        state: HealthSummaryReadState = HealthSummaryReadState.READABLE,
    ): HealthSummaryPayload {
        require(!windowEnd.isBefore(windowStart)) { "Health summary window must be non-negative" }

        if (state != HealthSummaryReadState.READABLE) {
            return missingPayload(sourceDevice, windowStart, windowEnd)
        }

        val sleepMinutes = sumClippedMinutes(readings.sleepSessions, windowStart, windowEnd)
        val activeMinutes = sumClippedMinutes(readings.exerciseSessions, windowStart, windowEnd)
        val steps = readings.steps.takeIf { it > 0 }
        val restingHeartRate = readings.restingHeartRates
            .asSequence()
            .filter { it.time >= windowStart && it.time <= windowEnd && it.beatsPerMinute > 0 }
            .maxByOrNull { it.time }
            ?.beatsPerMinute
            ?.toDouble()
        val hasValue = sleepMinutes != null || activeMinutes != null || steps != null || restingHeartRate != null

        return HealthSummaryPayload(
            sourceDevice = sourceDevice,
            windowStart = windowStart.toString(),
            windowEnd = windowEnd.toString(),
            capturedAt = windowEnd.toString(),
            missingness = if (hasValue) "available" else "missing",
            sleepMinutes = sleepMinutes,
            activeMinutes = activeMinutes,
            steps = steps,
            restingHeartRate = restingHeartRate,
        )
    }

    private fun missingPayload(sourceDevice: String, windowStart: Instant, windowEnd: Instant) = HealthSummaryPayload(
        sourceDevice = sourceDevice,
        windowStart = windowStart.toString(),
        windowEnd = windowEnd.toString(),
        capturedAt = windowEnd.toString(),
        missingness = "missing",
    )

    private fun sumClippedMinutes(
        intervals: List<HealthInterval>,
        windowStart: Instant,
        windowEnd: Instant,
    ): Int? {
        var totalMinutes = 0L
        for (interval in intervals) {
            if (!interval.endTime.isAfter(interval.startTime)) continue

            val clippedStart = if (interval.startTime.isAfter(windowStart)) interval.startTime else windowStart
            val clippedEnd = if (interval.endTime.isBefore(windowEnd)) interval.endTime else windowEnd
            if (!clippedEnd.isAfter(clippedStart)) continue

            val minutes = Duration.between(clippedStart, clippedEnd).toMinutes()
            if (minutes <= 0) continue
            totalMinutes = (totalMinutes + minutes).coerceAtMost(Int.MAX_VALUE.toLong())
        }
        return totalMinutes.toInt().takeIf { it > 0 }
    }
}
