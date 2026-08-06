import Foundation

public enum HealthMissingness: String, Codable, Sendable, Equatable {
    case available
    case missing
    case delayed
}

public enum HealthAuthorizationState: String, Codable, Sendable, Equatable, Hashable {
    case notRequested
    case requesting
    case requestCompleted
    case authorized
    case denied
    case unavailable

    public var canRead: Bool {
        self == .authorized || self == .requestCompleted
    }
}

public enum HealthSleepStage: String, Codable, Sendable, Equatable {
    case inBed
    case asleep
    case awake
    case unknown
}

public struct HealthSleepInterval: Codable, Equatable, Sendable {
    public let startDate: Date
    public let endDate: Date
    public let stage: HealthSleepStage

    public init(startDate: Date, endDate: Date, stage: HealthSleepStage) {
        self.startDate = startDate
        self.endDate = endDate
        self.stage = stage
    }
}

public struct HealthTimedValue: Codable, Equatable, Sendable {
    public let date: Date
    public let value: Double

    public init(date: Date, value: Double) {
        self.date = date
        self.value = value
    }
}

public struct HealthQuantityInterval: Codable, Equatable, Sendable {
    public let startDate: Date
    public let endDate: Date
    public let value: Double

    public init(startDate: Date, endDate: Date, value: Double) {
        self.startDate = startDate
        self.endDate = endDate
        self.value = value
    }
}

public struct HealthSummaryReadings: Equatable, Sendable {
    public let sleepIntervals: [HealthSleepInterval]
    public let activeMinuteSamples: [HealthQuantityInterval]
    public let stepSamples: [HealthQuantityInterval]
    public let restingHeartRateSamples: [HealthTimedValue]

    public init(
        sleepIntervals: [HealthSleepInterval] = [],
        activeMinuteSamples: [HealthQuantityInterval] = [],
        stepSamples: [HealthQuantityInterval] = [],
        restingHeartRateSamples: [HealthTimedValue] = []
    ) {
        self.sleepIntervals = sleepIntervals
        self.activeMinuteSamples = activeMinuteSamples
        self.stepSamples = stepSamples
        self.restingHeartRateSamples = restingHeartRateSamples
    }

    public var latestSampleDate: Date? {
        let dates = sleepIntervals.map(\.endDate)
            + activeMinuteSamples.map(\.endDate)
            + stepSamples.map(\.endDate)
            + restingHeartRateSamples.map(\.date)
        return dates.max()
    }
}

public struct HealthSummaryMetrics: Equatable, Sendable {
    public let sleepMinutes: Int?
    public let activeMinutes: Int?
    public let steps: Int?
    public let restingHeartRate: Double?

    public init(
        sleepMinutes: Int? = nil,
        activeMinutes: Int? = nil,
        steps: Int? = nil,
        restingHeartRate: Double? = nil
    ) {
        self.sleepMinutes = sleepMinutes
        self.activeMinutes = activeMinutes
        self.steps = steps
        self.restingHeartRate = restingHeartRate
    }

    public var hasValue: Bool {
        sleepMinutes != nil || activeMinutes != nil || steps != nil || restingHeartRate != nil
    }
}

public enum HealthSummaryEncodingError: Error, Equatable {
    case missingConsentReference
}

public enum HealthSummaryWindowError: Error, Equatable {
    case invalidOrder
}

public struct HealthSummaryPayload: Codable, Equatable, Sendable {
    public let sourcePlatform: String
    public let sourceProvider: String
    public let sourceDevice: String
    public let windowStart: Date
    public let windowEnd: Date
    public let capturedAt: Date
    public let receivedAt: Date
    public let missingness: HealthMissingness
    public let consentScope: String
    public let retentionClass: String
    public let consentRef: String?
    public let sleepMinutes: Int?
    public let activeMinutes: Int?
    public let steps: Int?
    public let restingHeartRate: Double?

    public init(
        sourceDevice: String,
        windowStart: Date,
        windowEnd: Date,
        capturedAt: Date,
        receivedAt: Date = Date(),
        missingness: HealthMissingness,
        sleepMinutes: Int? = nil,
        activeMinutes: Int? = nil,
        steps: Int? = nil,
        restingHeartRate: Double? = nil,
        consentRef: String? = nil
    ) {
        self.sourcePlatform = "ios"
        self.sourceProvider = "healthkit"
        self.sourceDevice = sourceDevice
        self.windowStart = windowStart
        self.windowEnd = windowEnd
        self.capturedAt = capturedAt
        self.receivedAt = receivedAt
        self.missingness = missingness
        self.consentScope = "health_summary"
        self.retentionClass = "summary"
        if let consentRef {
            let trimmedConsentRef = consentRef.trimmingCharacters(in: .whitespacesAndNewlines)
            self.consentRef = trimmedConsentRef.isEmpty ? nil : trimmedConsentRef
        } else {
            self.consentRef = nil
        }
        self.sleepMinutes = sleepMinutes
        self.activeMinutes = activeMinutes
        self.steps = steps
        self.restingHeartRate = restingHeartRate
    }

    public func encodedJSON(requireConsent: Bool = false) throws -> Data {
        if requireConsent && consentRef == nil {
            throw HealthSummaryEncodingError.missingConsentReference
        }
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(self)
    }

    private enum CodingKeys: String, CodingKey {
        case sourcePlatform
        case sourceProvider
        case sourceDevice
        case windowStart
        case windowEnd
        case capturedAt
        case receivedAt
        case missingness
        case consentScope
        case retentionClass
        case consentRef
        case sleepMinutes
        case activeMinutes
        case steps
        case restingHeartRate
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(sourcePlatform, forKey: .sourcePlatform)
        try container.encode(sourceProvider, forKey: .sourceProvider)
        try container.encode(sourceDevice, forKey: .sourceDevice)
        try container.encode(windowStart, forKey: .windowStart)
        try container.encode(windowEnd, forKey: .windowEnd)
        try container.encode(capturedAt, forKey: .capturedAt)
        try container.encode(receivedAt, forKey: .receivedAt)
        try container.encode(missingness, forKey: .missingness)
        try container.encode(consentScope, forKey: .consentScope)
        try container.encode(retentionClass, forKey: .retentionClass)
        try container.encodeIfPresent(consentRef, forKey: .consentRef)
        try container.encodeIfPresent(sleepMinutes, forKey: .sleepMinutes)
        try container.encodeIfPresent(activeMinutes, forKey: .activeMinutes)
        try container.encodeIfPresent(steps, forKey: .steps)
        try container.encodeIfPresent(restingHeartRate, forKey: .restingHeartRate)
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.sourcePlatform = try container.decode(String.self, forKey: .sourcePlatform)
        self.sourceProvider = try container.decode(String.self, forKey: .sourceProvider)
        self.sourceDevice = try container.decode(String.self, forKey: .sourceDevice)
        self.windowStart = try container.decode(Date.self, forKey: .windowStart)
        self.windowEnd = try container.decode(Date.self, forKey: .windowEnd)
        self.capturedAt = try container.decode(Date.self, forKey: .capturedAt)
        self.receivedAt = try container.decode(Date.self, forKey: .receivedAt)
        self.missingness = try container.decode(HealthMissingness.self, forKey: .missingness)
        self.consentScope = try container.decode(String.self, forKey: .consentScope)
        self.retentionClass = try container.decode(String.self, forKey: .retentionClass)
        self.consentRef = try container.decodeIfPresent(String.self, forKey: .consentRef)
        self.sleepMinutes = try container.decodeIfPresent(Int.self, forKey: .sleepMinutes)
        self.activeMinutes = try container.decodeIfPresent(Int.self, forKey: .activeMinutes)
        self.steps = try container.decodeIfPresent(Int.self, forKey: .steps)
        self.restingHeartRate = try container.decodeIfPresent(Double.self, forKey: .restingHeartRate)
    }
}

public enum HealthSummaryMapper {
    private static let delayedThreshold: TimeInterval = 24 * 60 * 60

    public static func sleepMinutes(
        from intervals: [HealthSleepInterval],
        windowStart: Date? = nil,
        windowEnd: Date? = nil
    ) -> Int? {
        let clipped = intervals.filter { $0.stage == .asleep }.compactMap {
            clip(start: $0.startDate, end: $0.endDate, value: nil, windowStart: windowStart, windowEnd: windowEnd)
        }
        let seconds = mergeDurations(clipped)
        return roundedPositiveInt(seconds / 60)
    }

    public static func totalMinutes(from samples: [Double]) -> Int? {
        roundedPositiveInt(samples.filter { $0.isFinite && $0 > 0 }.reduce(0, +))
    }

    public static func totalSteps(from samples: [Double]) -> Int? {
        roundedPositiveInt(samples.filter { $0.isFinite && $0 > 0 }.reduce(0, +))
    }

    public static func totalMinutes(
        from samples: [HealthQuantityInterval],
        windowStart: Date? = nil,
        windowEnd: Date? = nil
    ) -> Int? {
        roundedPositiveInt(totalQuantity(samples, windowStart: windowStart, windowEnd: windowEnd))
    }

    public static func totalSteps(
        from samples: [HealthQuantityInterval],
        windowStart: Date? = nil,
        windowEnd: Date? = nil
    ) -> Int? {
        roundedPositiveInt(totalQuantity(samples, windowStart: windowStart, windowEnd: windowEnd))
    }

    public static func latestRestingHeartRate(from samples: [HealthTimedValue]) -> Double? {
        samples
            .filter { $0.value.isFinite && $0.value > 0 }
            .max { $0.date < $1.date }?
            .value
    }

    public static func aggregate(
        _ readings: HealthSummaryReadings,
        windowStart: Date? = nil,
        windowEnd: Date? = nil
    ) -> HealthSummaryMetrics {
        HealthSummaryMetrics(
            sleepMinutes: sleepMinutes(from: readings.sleepIntervals, windowStart: windowStart, windowEnd: windowEnd),
            activeMinutes: totalMinutes(from: readings.activeMinuteSamples, windowStart: windowStart, windowEnd: windowEnd),
            steps: totalSteps(from: readings.stepSamples, windowStart: windowStart, windowEnd: windowEnd),
            restingHeartRate: latestRestingHeartRate(from: readings.restingHeartRateSamples)
        )
    }

    public static func missingness(
        metrics: HealthSummaryMetrics,
        providerAvailable: Bool,
        authorization: HealthAuthorizationState,
        windowEnd: Date,
        receivedAt: Date
    ) -> HealthMissingness {
        guard providerAvailable, authorization.canRead, metrics.hasValue else {
            return .missing
        }
        return receivedAt.timeIntervalSince(windowEnd) > delayedThreshold ? .delayed : .available
    }

    public static func makePayload(
        sourceDevice: String,
        windowStart: Date,
        windowEnd: Date,
        capturedAt: Date,
        receivedAt: Date = Date(),
        readings: HealthSummaryReadings,
        providerAvailable: Bool,
        authorization: HealthAuthorizationState,
        consentRef: String? = nil
    ) throws -> HealthSummaryPayload {
        try validateWindow(start: windowStart, end: windowEnd)
        let aggregatedMetrics = aggregate(readings, windowStart: windowStart, windowEnd: windowEnd)
        let metrics = providerAvailable && authorization.canRead
            ? aggregatedMetrics
            : HealthSummaryMetrics()
        let normalizedCapturedAt = min(max(capturedAt, windowStart), windowEnd)
        return HealthSummaryPayload(
            sourceDevice: sourceDevice,
            windowStart: windowStart,
            windowEnd: windowEnd,
            capturedAt: normalizedCapturedAt,
            receivedAt: receivedAt,
            missingness: missingness(
                metrics: metrics,
                providerAvailable: providerAvailable,
                authorization: authorization,
                windowEnd: windowEnd,
                receivedAt: receivedAt
            ),
            consentRef: consentRef,
            sleepMinutes: metrics.sleepMinutes,
            activeMinutes: metrics.activeMinutes,
            steps: metrics.steps,
            restingHeartRate: metrics.restingHeartRate
        )
    }

    private static func roundedPositiveInt(_ value: Double) -> Int? {
        guard value.isFinite, value > 0 else { return nil }
        let rounded = Int(value.rounded())
        return rounded > 0 ? rounded : nil
    }

    public static func validateWindow(start: Date, end: Date) throws {
        guard end >= start else { throw HealthSummaryWindowError.invalidOrder }
    }

    private struct ClippedInterval {
        let start: Date
        let end: Date
        let value: Double?
    }

    private static func clip(
        start: Date,
        end: Date,
        value: Double?,
        windowStart: Date?,
        windowEnd: Date?
    ) -> ClippedInterval? {
        guard end > start else { return nil }
        let clippedStart = max(start, windowStart ?? start)
        let clippedEnd = min(end, windowEnd ?? end)
        guard clippedEnd > clippedStart else { return nil }
        let sourceDuration = end.timeIntervalSince(start)
        let overlap = clippedEnd.timeIntervalSince(clippedStart)
        let clippedValue = value.map { $0 * overlap / sourceDuration }
        return ClippedInterval(start: clippedStart, end: clippedEnd, value: clippedValue)
    }

    private static func mergeDurations(_ intervals: [ClippedInterval]) -> Double {
        var total = 0.0
        var currentStart: Date?
        var currentEnd: Date?
        for interval in intervals.sorted(by: { $0.start < $1.start }) {
            guard let start = currentStart, let end = currentEnd else {
                currentStart = interval.start
                currentEnd = interval.end
                continue
            }
            if interval.start <= end {
                currentEnd = max(end, interval.end)
            } else {
                total += end.timeIntervalSince(start)
                currentStart = interval.start
                currentEnd = interval.end
            }
        }
        if let start = currentStart, let end = currentEnd {
            total += end.timeIntervalSince(start)
        }
        return total
    }

    private static func totalQuantity(
        _ samples: [HealthQuantityInterval],
        windowStart: Date?,
        windowEnd: Date?
    ) -> Double {
        let intervals = samples.compactMap { sample -> ClippedInterval? in
            guard sample.value.isFinite, sample.value > 0 else { return nil }
            return clip(
                start: sample.startDate,
                end: sample.endDate,
                value: sample.value,
                windowStart: windowStart,
                windowEnd: windowEnd
            )
        }
        let boundaries = Set(intervals.flatMap { [$0.start, $0.end] }).sorted()
        guard boundaries.count > 1 else { return intervals.first?.value ?? 0 }
        var total = 0.0
        for pair in zip(boundaries, boundaries.dropFirst()) {
            let segmentStart = pair.0
            let segmentEnd = pair.1
            guard segmentEnd > segmentStart else { continue }
            let rates = intervals.compactMap { interval -> Double? in
                guard interval.start < segmentEnd, interval.end > segmentStart,
                      let value = interval.value else { return nil }
                let duration = interval.end.timeIntervalSince(interval.start)
                return duration > 0 ? value / duration : nil
            }
            if let maxRate = rates.max() {
                total += maxRate * segmentEnd.timeIntervalSince(segmentStart)
            }
        }
        return total
    }
}

public enum HealthSyncState: Equatable, Sendable {
    case idle
    case syncing
    case available
    case missing
    case delayed
    case failed
}

public struct HealthInteractionState: Equatable, Sendable {
    public private(set) var authorization: HealthAuthorizationState = .notRequested
    public private(set) var sync: HealthSyncState = .idle
    public private(set) var lastSyncAt: Date?

    public init() {}

    public var canSync: Bool {
        authorization.canRead && sync != .syncing
    }

    public mutating func beginAuthorization() {
        authorization = .requesting
    }

    public mutating func finishAuthorization(_ state: HealthAuthorizationState) {
        authorization = state
        if !state.canRead, sync == .syncing {
            sync = .idle
        }
    }

    @discardableResult
    public mutating func beginSync() -> Bool {
        guard canSync else { return false }
        sync = .syncing
        return true
    }

    public mutating func finishSync(_ missingness: HealthMissingness, at date: Date) {
        sync = switch missingness {
        case .available: .available
        case .missing: .missing
        case .delayed: .delayed
        }
        lastSyncAt = date
    }

    public mutating func failSync(at date: Date = Date()) {
        sync = .failed
        lastSyncAt = date
    }
}
