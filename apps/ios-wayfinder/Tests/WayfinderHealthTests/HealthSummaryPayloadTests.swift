import XCTest
@testable import WayfinderHealth

final class HealthSummaryPayloadTests: XCTestCase {
    private let windowStart = Date(timeIntervalSince1970: 0)
    private let windowEnd = Date(timeIntervalSince1970: 86_400)

    func testPayloadUsesSharedProviderAndMissingnessContract() throws {
        let payload = HealthSummaryPayload(
            sourceDevice: "iPhone",
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: windowEnd,
            receivedAt: windowEnd,
            missingness: .available,
            consentRef: "health-consent-1",
            sleepMinutes: 420,
            activeMinutes: 42,
            steps: 6800,
            restingHeartRate: 58
        )

        let data = try payload.encodedJSON(requireConsent: true)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertEqual(json["sourcePlatform"] as? String, "ios")
        XCTAssertEqual(json["sourceProvider"] as? String, "healthkit")
        XCTAssertEqual(json["missingness"] as? String, "available")
        XCTAssertEqual(json["consentScope"] as? String, "health_summary")
        XCTAssertEqual(json["retentionClass"] as? String, "summary")
        XCTAssertEqual(json["consentRef"] as? String, "health-consent-1")
        XCTAssertEqual(json["sleepMinutes"] as? Int, 420)
        XCTAssertEqual(json["activeMinutes"] as? Int, 42)
        XCTAssertEqual(json["steps"] as? Int, 6800)
        XCTAssertEqual((json["restingHeartRate"] as? NSNumber)?.doubleValue, 58)
        XCTAssertEqual(json["windowStart"] as? String, "1970-01-01T00:00:00Z")
        XCTAssertEqual(json["windowEnd"] as? String, "1970-01-02T00:00:00Z")
    }

    func testPayloadOmitsUnavailableOptionalValuesAndRequiresConsentOnlyForUpload() throws {
        let payload = HealthSummaryPayload(
            sourceDevice: "iPhone",
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: windowEnd,
            receivedAt: windowEnd,
            missingness: .missing
        )

        let data = try payload.encodedJSON()
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertNil(json["consentRef"])
        XCTAssertNil(json["sleepMinutes"])
        XCTAssertNil(json["activeMinutes"])
        XCTAssertNil(json["steps"])
        XCTAssertNil(json["restingHeartRate"])
        XCTAssertThrowsError(try payload.encodedJSON(requireConsent: true))
    }

    func testMapperAggregatesSleepActivityStepsAndLatestRestingHeartRate() {
        let readings = HealthSummaryReadings(
            sleepIntervals: [
                .init(startDate: windowStart, endDate: windowStart.addingTimeInterval(7_200), stage: .inBed),
                .init(startDate: windowStart.addingTimeInterval(7_200), endDate: windowStart.addingTimeInterval(25_200), stage: .asleep),
                .init(startDate: windowStart.addingTimeInterval(25_200), endDate: windowStart.addingTimeInterval(28_800), stage: .awake),
                .init(startDate: windowStart.addingTimeInterval(28_800), endDate: windowStart.addingTimeInterval(39_600), stage: .asleep)
            ],
            activeMinuteSamples: [
                .init(startDate: windowStart, endDate: windowStart.addingTimeInterval(3_600), value: 12.4),
                .init(startDate: windowStart.addingTimeInterval(3_600), endDate: windowStart.addingTimeInterval(7_200), value: 29.6)
            ],
            stepSamples: [
                .init(startDate: windowStart, endDate: windowStart.addingTimeInterval(3_600), value: 1_200),
                .init(startDate: windowStart.addingTimeInterval(3_600), endDate: windowStart.addingTimeInterval(7_200), value: 5_600)
            ],
            restingHeartRateSamples: [
                .init(date: windowStart.addingTimeInterval(100), value: 62),
                .init(date: windowStart.addingTimeInterval(200), value: 58)
            ]
        )

        let metrics = HealthSummaryMapper.aggregate(readings)
        XCTAssertEqual(metrics.sleepMinutes, 480)
        XCTAssertEqual(metrics.activeMinutes, 42)
        XCTAssertEqual(metrics.steps, 6_800)
        XCTAssertEqual(metrics.restingHeartRate, 58)
    }

    func testMapperClassifiesMissingAndDelayedWithoutTreatingMissingAsInactivity() throws {
        let empty = HealthSummaryReadings()
        let noPermission = try HealthSummaryMapper.makePayload(
            sourceDevice: "iPhone",
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: windowEnd,
            receivedAt: windowEnd,
            readings: empty,
            providerAvailable: true,
            authorization: .denied,
            consentRef: "health-consent-1"
        )
        XCTAssertEqual(noPermission.missingness, .missing)
        XCTAssertNil(noPermission.activeMinutes)
        XCTAssertNil(noPermission.steps)

        let delayed = try HealthSummaryMapper.makePayload(
            sourceDevice: "iPhone",
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: windowEnd,
            receivedAt: windowEnd.addingTimeInterval(86_401),
            readings: .init(activeMinuteSamples: [.init(startDate: windowStart, endDate: windowEnd, value: 30)]),
            providerAvailable: true,
            authorization: .authorized,
            consentRef: "health-consent-1"
        )
        XCTAssertEqual(delayed.missingness, .delayed)

        let available = try HealthSummaryMapper.makePayload(
            sourceDevice: "iPhone",
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: windowEnd,
            receivedAt: windowEnd,
            readings: .init(activeMinuteSamples: [.init(startDate: windowStart, endDate: windowEnd, value: 30)]),
            providerAvailable: true,
            authorization: .authorized,
            consentRef: "health-consent-1"
        )
        XCTAssertEqual(available.missingness, .available)
        XCTAssertEqual(available.activeMinutes, 30)
    }

    func testUnavailableProviderIsMissingEvenIfAStaleReadingExists() throws {
        let payload = try HealthSummaryMapper.makePayload(
            sourceDevice: "iPhone",
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: windowEnd,
            receivedAt: windowEnd.addingTimeInterval(86_401),
            readings: .init(restingHeartRateSamples: [.init(date: windowEnd, value: 60)]),
            providerAvailable: false,
            authorization: .unavailable
        )

        XCTAssertEqual(payload.missingness, .missing)
        XCTAssertNil(payload.restingHeartRate)
    }

    func testMapperRejectsInvertedWindows() {
        XCTAssertThrowsError(
            try HealthSummaryMapper.makePayload(
                sourceDevice: "iPhone",
                windowStart: windowEnd,
                windowEnd: windowStart,
                capturedAt: windowEnd,
                readings: .init(),
                providerAvailable: true,
                authorization: .authorized
            )
        ) { error in
            XCTAssertEqual(error as? HealthSummaryWindowError, .invalidOrder)
        }
    }

    func testMapperBoundsCapturedAtToTheRequestedWindow() throws {
        let payload = try HealthSummaryMapper.makePayload(
            sourceDevice: "iPhone",
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: windowEnd.addingTimeInterval(86_400),
            readings: .init(),
            providerAvailable: true,
            authorization: .authorized
        )
        XCTAssertEqual(payload.capturedAt, windowEnd)
    }

    func testMapperClipsAndDoesNotDoubleCountOverlappingQuantityIntervals() throws {
        let samples = [
            HealthQuantityInterval(
                startDate: windowStart.addingTimeInterval(-3_600),
                endDate: windowStart.addingTimeInterval(3_600),
                value: 60
            ),
            HealthQuantityInterval(
                startDate: windowStart,
                endDate: windowStart.addingTimeInterval(7_200),
                value: 60
            )
        ]
        let readings = HealthSummaryReadings(activeMinuteSamples: samples)
        let metrics = HealthSummaryMapper.aggregate(readings, windowStart: windowStart, windowEnd: windowStart.addingTimeInterval(3_600))
        XCTAssertEqual(metrics.activeMinutes, 30)

        let sleep = HealthSummaryMapper.sleepMinutes(
            from: [.init(
                startDate: windowStart.addingTimeInterval(-3_600),
                endDate: windowStart.addingTimeInterval(3_600),
                stage: .asleep
            )],
            windowStart: windowStart,
            windowEnd: windowStart.addingTimeInterval(1_800)
        )
        XCTAssertEqual(sleep, 30)
    }

    func testPermissionAndManualSyncStateContract() {
        var state = HealthInteractionState()
        XCTAssertFalse(state.canSync)

        state.beginAuthorization()
        XCTAssertEqual(state.authorization, .requesting)
        state.finishAuthorization(.requestCompleted)
        XCTAssertTrue(state.canSync)
        XCTAssertTrue(state.beginSync())
        XCTAssertFalse(state.canSync)

        let syncAt = windowEnd.addingTimeInterval(10)
        state.finishSync(.delayed, at: syncAt)
        XCTAssertEqual(state.sync, .delayed)
        XCTAssertEqual(state.lastSyncAt, syncAt)
        XCTAssertTrue(state.canSync)

        state.finishAuthorization(.denied)
        XCTAssertFalse(state.canSync)
        XCTAssertFalse(state.beginSync())
    }

    func testHealthKitStoreIsReachedOnlyThroughTheProviderBoundary() {
        let provider: any HealthSummaryProvider = HealthKitBridge()
        let initialStates: Set<HealthAuthorizationState> = [.notRequested, .unavailable]
        XCTAssertTrue(initialStates.contains(provider.authorizationState))
    }

    func testViewModelManualSyncUsesProviderAndConsentReference() async throws {
        let payload = HealthSummaryPayload(
            sourceDevice: "iPhone",
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: windowEnd,
            receivedAt: windowEnd,
            missingness: .available,
            consentRef: "health-consent-1",
            activeMinutes: 30
        )
        let provider = StubHealthSummaryProvider(payload: payload)
        let model = HealthViewModel(bridge: provider, consentRef: "health-consent-1")

        XCTAssertFalse(model.canSync)
        await model.requestAuthorization()
        XCTAssertTrue(model.canSync)
        await model.sync()

        XCTAssertEqual(model.interaction.sync, .available)
        XCTAssertEqual(model.summary?.activeMinutes, 30)
        XCTAssertEqual(provider.receivedConsentRef, "health-consent-1")
    }
}

private final class StubHealthSummaryProvider: HealthSummaryProvider {
    var authorizationState: HealthAuthorizationState = .notRequested
    let payload: HealthSummaryPayload
    var receivedConsentRef: String?

    init(payload: HealthSummaryPayload) {
        self.payload = payload
    }

    func requestAuthorization() async throws {
        authorizationState = .requestCompleted
    }

    func readSummary(
        sourceDevice: String,
        windowStart: Date,
        windowEnd: Date,
        consentRef: String?
    ) async throws -> HealthSummaryPayload {
        receivedConsentRef = consentRef
        return payload
    }
}
