package com.mindanchor.androidaudio

import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class HealthSummaryMapperTest {
    private val windowStart = Instant.parse("2026-08-05T00:00:00Z")
    private val windowEnd = Instant.parse("2026-08-06T00:00:00Z")

    @Test
    fun mapsSleepActivityStepsAndLatestRestingHeartRate() {
        val summary = HealthSummaryMapper.map(
            sourceDevice = "Pixel test",
            windowStart = windowStart,
            windowEnd = windowEnd,
            readings = HealthSummaryReadings(
                sleepSessions = listOf(
                    HealthInterval(
                        Instant.parse("2026-08-05T22:00:00Z"),
                        Instant.parse("2026-08-06T06:00:00Z"),
                    ),
                ),
                exerciseSessions = listOf(
                    HealthInterval(
                        Instant.parse("2026-08-05T08:00:00Z"),
                        Instant.parse("2026-08-05T08:35:00Z"),
                    ),
                    HealthInterval(
                        Instant.parse("2026-08-05T18:00:00Z"),
                        Instant.parse("2026-08-05T18:07:00Z"),
                    ),
                ),
                steps = 6_800,
                restingHeartRates = listOf(
                    HealthHeartRateSample(Instant.parse("2026-08-05T09:00:00Z"), 62),
                    HealthHeartRateSample(Instant.parse("2026-08-05T23:00:00Z"), 58),
                ),
            ),
        )

        assertEquals("available", summary.missingness)
        assertEquals(480, summary.sleepMinutes)
        assertEquals(42, summary.activeMinutes)
        assertEquals(6_800L, summary.steps)
        assertEquals(58.0, summary.restingHeartRate)
    }

    @Test
    fun clipsIntervalsToRequestedWindowAndIgnoresInvalidIntervals() {
        val summary = HealthSummaryMapper.map(
            sourceDevice = "Pixel test",
            windowStart = windowStart,
            windowEnd = windowEnd,
            readings = HealthSummaryReadings(
                sleepSessions = listOf(
                    HealthInterval(
                        Instant.parse("2026-08-04T23:30:00Z"),
                        Instant.parse("2026-08-05T01:00:00Z"),
                    ),
                    HealthInterval(windowEnd, windowStart),
                ),
                exerciseSessions = listOf(
                    HealthInterval(
                        Instant.parse("2026-08-06T23:50:00Z"),
                        Instant.parse("2026-08-06T00:10:00Z"),
                    ),
                ),
            ),
        )

        assertEquals(60, summary.sleepMinutes)
        assertNull(summary.activeMinutes)
        assertEquals("available", summary.missingness)
    }

    @Test
    fun reportsMissingWhenProviderReturnsNoValues() {
        val summary = HealthSummaryMapper.map(
            sourceDevice = "Pixel test",
            windowStart = windowStart,
            windowEnd = windowEnd,
        )

        assertEquals("missing", summary.missingness)
        assertNull(summary.sleepMinutes)
        assertNull(summary.activeMinutes)
        assertNull(summary.steps)
        assertNull(summary.restingHeartRate)
    }

    @Test
    fun reportsMissingWhenPermissionIsNotGrantedEvenIfReadingsWereProvided() {
        val summary = HealthSummaryMapper.map(
            sourceDevice = "Pixel test",
            windowStart = windowStart,
            windowEnd = windowEnd,
            readings = HealthSummaryReadings(steps = 1_000),
            state = HealthSummaryReadState.PERMISSION_MISSING,
        )

        assertEquals("missing", summary.missingness)
        assertNull(summary.steps)
    }

    @Test
    fun reportsMissingWhenHealthConnectProviderIsUnavailable() {
        val summary = HealthSummaryMapper.map(
            sourceDevice = "Pixel test",
            windowStart = windowStart,
            windowEnd = windowEnd,
            readings = HealthSummaryReadings(steps = 1_000),
            state = HealthSummaryReadState.PROVIDER_UNAVAILABLE,
        )

        assertEquals("missing", summary.missingness)
        assertNull(summary.steps)
    }

    @Test
    fun serializesSharedContractFieldsAndConsentReference() {
        val summary = HealthSummaryMapper.map(
            sourceDevice = "Pixel test",
            windowStart = windowStart,
            windowEnd = windowEnd,
            readings = HealthSummaryReadings(steps = 6800),
        )

        val json = summary.toJson("android-device-1", "health-consent-1")
        assertEquals("android", json.getString("sourcePlatform"))
        assertEquals("health_connect", json.getString("sourceProvider"))
        assertEquals("health_summary", json.getString("consentScope"))
        assertEquals("summary", json.getString("retentionClass"))
        assertEquals("health-consent-1", json.getString("consentRef"))
        assertEquals(6800L, json.getLong("steps"))
    }
}
