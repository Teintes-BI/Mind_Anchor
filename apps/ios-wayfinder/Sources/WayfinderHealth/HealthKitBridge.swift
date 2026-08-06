import Foundation

public protocol HealthSummaryProvider: AnyObject {
    var authorizationState: HealthAuthorizationState { get }

    func requestAuthorization() async throws

    func readSummary(
        sourceDevice: String,
        windowStart: Date,
        windowEnd: Date,
        consentRef: String?
    ) async throws -> HealthSummaryPayload
}

#if canImport(HealthKit)
import HealthKit
import Combine

public final class HealthKitBridge: ObservableObject, HealthSummaryProvider {
    @Published public private(set) var authorizationState: HealthAuthorizationState = .notRequested
    @Published public private(set) var authorizationRequested = false
    private let store = HKHealthStore()

    public init() {}

    public var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(sleep) }
        if let steps = HKObjectType.quantityType(forIdentifier: .stepCount) { types.insert(steps) }
        if let exerciseTime = HKObjectType.quantityType(forIdentifier: .appleExerciseTime) { types.insert(exerciseTime) }
        if let restingRate = HKObjectType.quantityType(forIdentifier: .restingHeartRate) { types.insert(restingRate) }
        return types
    }

    public func requestAuthorization() async throws {
        guard isAvailable else {
            await MainActor.run {
                authorizationRequested = true
                authorizationState = .unavailable
            }
            return
        }

        await MainActor.run {
            authorizationRequested = true
            authorizationState = .requesting
        }
        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
            // HealthKit does not expose a reliable read-grant status. Keep the
            // prompt-completed state separate from `.authorized`; an empty
            // result remains an explicit `.missing` summary rather than a claim
            // that the user has no activity or sleep.
            await MainActor.run { authorizationState = .requestCompleted }
        } catch {
            await MainActor.run { authorizationState = .denied }
            throw error
        }
    }

    public func readSummary(
        sourceDevice: String,
        windowStart: Date,
        windowEnd: Date,
        consentRef: String? = nil
    ) async throws -> HealthSummaryPayload {
        try HealthSummaryMapper.validateWindow(start: windowStart, end: windowEnd)
        guard isAvailable else {
            return try HealthSummaryMapper.makePayload(
                sourceDevice: sourceDevice,
                windowStart: windowStart,
                windowEnd: windowEnd,
                capturedAt: windowEnd,
                receivedAt: Date(),
                readings: HealthSummaryReadings(),
                providerAvailable: false,
                authorization: .unavailable,
                consentRef: consentRef
            )
        }

        guard authorizationState.canRead else {
            return try HealthSummaryMapper.makePayload(
                sourceDevice: sourceDevice,
                windowStart: windowStart,
                windowEnd: windowEnd,
                capturedAt: windowEnd,
                receivedAt: Date(),
                readings: HealthSummaryReadings(),
                providerAvailable: true,
                authorization: authorizationState,
                consentRef: consentRef
            )
        }

        let sleep = try await readSleepIntervals(start: windowStart, end: windowEnd)
        let activeMinutes = try await readQuantityValues(
            identifier: .appleExerciseTime,
            unit: HKUnit.minute(),
            start: windowStart,
            end: windowEnd
        )
        let steps = try await readQuantityValues(
            identifier: .stepCount,
            unit: HKUnit.count(),
            start: windowStart,
            end: windowEnd
        )
        let restingRate = try await readTimedValues(
            identifier: .restingHeartRate,
            unit: HKUnit.count().unitDivided(by: HKUnit.minute()),
            start: windowStart,
            end: windowEnd
        )

        let readings = HealthSummaryReadings(
            sleepIntervals: sleep,
            activeMinuteSamples: activeMinutes,
            stepSamples: steps,
            restingHeartRateSamples: restingRate
        )
        let capturedAt = readings.latestSampleDate.map {
            min(max($0, windowStart), windowEnd)
        } ?? windowEnd
        return try HealthSummaryMapper.makePayload(
            sourceDevice: sourceDevice,
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: capturedAt,
            receivedAt: Date(),
            readings: readings,
            providerAvailable: true,
            authorization: authorizationState,
            consentRef: consentRef
        )
    }

    private func readSleepIntervals(start: Date, end: Date) async throws -> [HealthSleepInterval] {
        guard let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return [] }
        let samples: [HKCategorySample] = uniqueSamples(try await readSamples(type: type, start: start, end: end))
        return samples.map { sample in
            let stage: HealthSleepStage
            switch sample.value {
            case 0: stage = .inBed
            // 1 is the legacy asleep value; 3-6 are iOS 16+ core/deep/REM/
            // unspecified asleep stages. Future values remain unknown.
            case 1, 3, 4, 5, 6: stage = .asleep
            case 2: stage = .awake
            default: stage = .unknown
            }
            return HealthSleepInterval(startDate: sample.startDate, endDate: sample.endDate, stage: stage)
        }
    }

    private func readQuantityValues(
        identifier: HKQuantityTypeIdentifier,
        unit: HKUnit,
        start: Date,
        end: Date
    ) async throws -> [HealthQuantityInterval] {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return [] }
        let samples: [HKQuantitySample] = uniqueSamples(try await readSamples(type: type, start: start, end: end))
        return samples.map {
            HealthQuantityInterval(
                startDate: $0.startDate,
                endDate: $0.endDate,
                value: $0.quantity.doubleValue(for: unit)
            )
        }
    }

    private func readTimedValues(
        identifier: HKQuantityTypeIdentifier,
        unit: HKUnit,
        start: Date,
        end: Date
    ) async throws -> [HealthTimedValue] {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return [] }
        let samples: [HKQuantitySample] = uniqueSamples(try await readSamples(type: type, start: start, end: end))
        return samples.map {
            HealthTimedValue(date: $0.endDate, value: $0.quantity.doubleValue(for: unit))
        }
    }

    private func readSamples<T: HKSample>(type: HKSampleType, start: Date, end: Date) async throws -> [T] {
        try await withCheckedThrowingContinuation { continuation in
            let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
            let query = HKSampleQuery(
                sampleType: type,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: nil
            ) { _, samples, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume(returning: (samples as? [T]) ?? [])
            }
            store.execute(query)
        }
    }

    private func uniqueSamples<T: HKSample>(_ samples: [T]) -> [T] {
        var seen = Set<UUID>()
        return samples.filter { seen.insert($0.uuid).inserted }
    }
}
#else

public final class HealthKitBridge: HealthSummaryProvider {
    public private(set) var authorizationState: HealthAuthorizationState = .unavailable
    public private(set) var authorizationRequested = false

    public init() {}

    public var isAvailable: Bool { false }

    public func requestAuthorization() async throws {
        authorizationRequested = true
        authorizationState = .unavailable
    }

    public func readSummary(
        sourceDevice: String,
        windowStart: Date,
        windowEnd: Date,
        consentRef: String? = nil
    ) async throws -> HealthSummaryPayload {
        try HealthSummaryMapper.validateWindow(start: windowStart, end: windowEnd)
        return try HealthSummaryMapper.makePayload(
            sourceDevice: sourceDevice,
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: windowEnd,
            readings: HealthSummaryReadings(),
            providerAvailable: false,
            authorization: .unavailable,
            consentRef: consentRef
        )
    }
}
#endif
