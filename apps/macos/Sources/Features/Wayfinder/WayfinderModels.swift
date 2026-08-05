import Foundation

enum WayfinderJSONValue: Codable, Equatable, Sendable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case array([WayfinderJSONValue])
    case object([String: WayfinderJSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode([String: WayfinderJSONValue].self) {
            self = .object(value)
        } else if let value = try? container.decode([WayfinderJSONValue].self) {
            self = .array(value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported Wayfinder JSON value.")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }

    var stringValue: String? {
        if case .string(let value) = self { return value }
        return nil
    }
}

enum WayfinderContextEventKind: String, Codable, Equatable, Sendable {
    case voiceCandidate = "voice_candidate"
    case manualNote = "manual_note"
    case desktopSignal = "desktop_signal"
    case healthSummary = "health_summary"
    case wearableSignal = "wearable_signal"
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

enum WayfinderRetentionClass: String, Codable, Equatable, Sendable {
    case ephemeral
    case summary
    case longTermCandidate = "long_term_candidate"
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

enum WayfinderRiskLevel: String, Codable, Equatable, Sendable {
    case low
    case medium
    case high
    case critical
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }

    var requiresExplicitConfirmation: Bool { self != .low }
}

enum WayfinderSituationStatus: String, Codable, Equatable, Sendable {
    case draft
    case awaitingConfirmation = "awaiting_confirmation"
    case confirmed
    case dismissed
    case expired
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }

    var isActive: Bool {
        switch self {
        case .awaitingConfirmation, .confirmed:
            return true
        case .draft, .dismissed, .expired, .unknown:
            return false
        }
    }
}

enum WayfinderOptionStatus: String, Codable, Equatable, Sendable {
    case proposed
    case selected
    case rejected
    case expired
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

enum WayfinderOptionHorizon: String, Codable, Equatable, Sendable {
    case today
    case week
    case month
    case longTerm = "long_term"
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

enum WayfinderOptionReversibility: String, Codable, Equatable, Sendable {
    case reversible
    case partlyReversible = "partly_reversible"
    case hardToReverse = "hard_to_reverse"
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

enum WayfinderDecisionActionStatus: String, Codable, Equatable, Sendable {
    case notStarted = "not_started"
    case inProgress = "in_progress"
    case completed
    case abandoned
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

enum WayfinderOutcomeStatus: String, Codable, Equatable, Sendable {
    case observed
    case partial
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

enum WayfinderConsentStatus: String, Codable, Equatable, Sendable {
    case granted
    case paused
    case revoked
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

enum WayfinderModelSharing: String, Codable, Equatable, Sendable {
    case localOnly = "local_only"
    case selectedProvider = "selected_provider"
    case anyConfiguredProvider = "any_configured_provider"
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

enum WayfinderProcessingStatus: String, Codable, Equatable, Sendable {
    case completed
    case pending
    case cancelled
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

enum WayfinderValueAlignmentEffect: String, Codable, Equatable, Sendable {
    case supports
    case tradesOff = "trades_off"
    case unknown

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? .unknown
    }
}

struct WayfinderContextEvent: Codable, Equatable, Identifiable, Sendable {
    let id: String
    let userId: String
    let sourceDeviceId: String
    let kind: WayfinderContextEventKind
    let occurredAt: String
    let receivedAt: String
    let clientEventId: String?
    let payload: [String: WayfinderJSONValue]
    let confidence: Double
    let consentRef: String
    let retentionClass: WayfinderRetentionClass
    let evidenceRefs: [String]
    let traceId: String
}

struct WayfinderEventInput: Codable, Equatable, Sendable {
    let sourceDeviceId: String
    let kind: WayfinderContextEventKind
    let occurredAt: String
    let clientEventId: String?
    let payload: [String: WayfinderJSONValue]
    let confidence: Double
    let consentRef: String
    let retentionClass: WayfinderRetentionClass
    let evidenceRefs: [String]
    let traceId: String

    init(
        sourceDeviceId: String,
        kind: WayfinderContextEventKind,
        occurredAt: String,
        clientEventId: String? = nil,
        payload: [String: WayfinderJSONValue] = [:],
        confidence: Double,
        consentRef: String,
        retentionClass: WayfinderRetentionClass,
        evidenceRefs: [String] = [],
        traceId: String
    ) {
        self.sourceDeviceId = sourceDeviceId
        self.kind = kind
        self.occurredAt = occurredAt
        self.clientEventId = clientEventId
        self.payload = payload
        self.confidence = confidence
        self.consentRef = consentRef
        self.retentionClass = retentionClass
        self.evidenceRefs = evidenceRefs
        self.traceId = traceId
    }
}

struct WayfinderSituation: Codable, Equatable, Identifiable, Sendable {
    let id: String
    let userId: String
    let eventIds: [String]
    let status: WayfinderSituationStatus
    let summary: String
    let uncertainty: [String]
    let linkedGoalIds: [String]
    let linkedTaskIds: [String]
    let riskLevel: WayfinderRiskLevel
    let createdAt: String
    let updatedAt: String
    let traceId: String
}

struct WayfinderSituationsResponse: Codable, Equatable, Sendable {
    let situations: [WayfinderSituation]
}

struct WayfinderProjectedConsequence: Codable, Equatable, Sendable {
    let horizon: WayfinderOptionHorizon
    let text: String
    let confidence: Double
}

struct WayfinderValueAlignment: Codable, Equatable, Sendable {
    let valueId: String
    let effect: WayfinderValueAlignmentEffect
    let explanation: String
}

struct WayfinderDecisionOption: Codable, Equatable, Identifiable, Sendable {
    let id: String
    let userId: String
    let situationId: String
    let status: WayfinderOptionStatus
    let action: String
    let firstStep: String
    let rationale: String
    let immediateBenefits: [String]
    let costs: [String]
    let projectedConsequences: [WayfinderProjectedConsequence]
    let reversibility: WayfinderOptionReversibility
    let valueAlignment: [WayfinderValueAlignment]
    let evidenceRefs: [String]
    let consultedSkills: [String]
    let riskLevel: WayfinderRiskLevel
    let requiresApproval: Bool
    let createdAt: String
    let traceId: String
}

struct WayfinderDecisionInput: Codable, Equatable, Sendable {
    let situationId: String
    let selectedOptionId: String?
    let userOverride: String?
    let actionStatus: WayfinderDecisionActionStatus
    let followUpAt: String?
    let traceId: String
    let approvalAcknowledged: Bool

    init(
        situationId: String,
        selectedOptionId: String? = nil,
        userOverride: String? = nil,
        actionStatus: WayfinderDecisionActionStatus,
        followUpAt: String? = nil,
        traceId: String,
        approvalAcknowledged: Bool = false
    ) {
        self.situationId = situationId
        self.selectedOptionId = selectedOptionId
        self.userOverride = userOverride
        self.actionStatus = actionStatus
        self.followUpAt = followUpAt
        self.traceId = traceId
        self.approvalAcknowledged = approvalAcknowledged
    }
}

struct WayfinderDecisionRecord: Codable, Equatable, Identifiable, Sendable {
    let id: String
    let userId: String
    let situationId: String
    let selectedOptionId: String?
    let userOverride: String?
    let selectedAt: String
    let actionStatus: WayfinderDecisionActionStatus
    let followUpAt: String?
    let traceId: String
}

struct WayfinderOutcomeInput: Codable, Equatable, Sendable {
    let status: WayfinderOutcomeStatus
    let summary: String
    let userFeeling: String?
    let userRating: Int?
    let predictionError: String?
    let evidenceRefs: [String]
    let traceId: String

    init(
        status: WayfinderOutcomeStatus,
        summary: String,
        userFeeling: String? = nil,
        userRating: Int? = nil,
        predictionError: String? = nil,
        evidenceRefs: [String] = [],
        traceId: String
    ) {
        self.status = status
        self.summary = summary
        self.userFeeling = userFeeling
        self.userRating = userRating
        self.predictionError = predictionError
        self.evidenceRefs = evidenceRefs
        self.traceId = traceId
    }
}

struct WayfinderOutcome: Codable, Equatable, Identifiable, Sendable {
    let id: String
    let userId: String
    let decisionId: String
    let observedAt: String
    let status: WayfinderOutcomeStatus
    let summary: String
    let userFeeling: String?
    let userRating: Int?
    let predictionError: String?
    let evidenceRefs: [String]
    let traceId: String
}

struct WayfinderConsentGrant: Codable, Equatable, Identifiable, Sendable {
    let id: String
    let userId: String
    let source: String
    let purpose: String
    let scope: String
    let status: WayfinderConsentStatus
    let rawRetentionSeconds: Int
    let derivedRetentionDays: Int
    let modelSharing: WayfinderModelSharing
    let grantedAt: String
    let updatedAt: String
    let traceId: String
}

struct WayfinderConsentInput: Codable, Equatable, Sendable {
    let purpose: String
    let scope: String
    let status: WayfinderConsentStatus
    let rawRetentionSeconds: Int
    let derivedRetentionDays: Int
    let modelSharing: WayfinderModelSharing

    init(
        purpose: String,
        scope: String,
        status: WayfinderConsentStatus,
        rawRetentionSeconds: Int,
        derivedRetentionDays: Int,
        modelSharing: WayfinderModelSharing
    ) {
        self.purpose = purpose
        self.scope = scope
        self.status = status
        self.rawRetentionSeconds = rawRetentionSeconds
        self.derivedRetentionDays = derivedRetentionDays
        self.modelSharing = modelSharing
    }
}

struct WayfinderEventResponse: Codable, Equatable, Sendable {
    let event: WayfinderContextEvent
    let situation: WayfinderSituation
    let fastStatus: WayfinderProcessingStatus
    let fullStatus: WayfinderProcessingStatus
}

struct WayfinderSituationConfirmationResponse: Codable, Equatable, Sendable {
    let situation: WayfinderSituation
    let fastStatus: WayfinderProcessingStatus
    let fullStatus: WayfinderProcessingStatus
}

struct WayfinderOptionsResponse: Codable, Equatable, Sendable {
    let situationId: String
    let status: WayfinderSituationStatus
    let options: [WayfinderDecisionOption]
    let fullStatus: WayfinderProcessingStatus
}

struct WayfinderOptionsSaveResponse: Codable, Equatable, Sendable {
    let options: [WayfinderDecisionOption]
}

struct WayfinderHistoryItem: Codable, Equatable, Sendable {
    let decision: WayfinderDecisionRecord
    let outcomes: [WayfinderOutcome]
    let situation: WayfinderSituation?
    let option: WayfinderDecisionOption?
}

struct WayfinderHistoryResponse: Codable, Equatable, Sendable {
    let decisions: [WayfinderHistoryItem]
}

struct WayfinderConsentResponse: Codable, Equatable, Sendable {
    let grants: [WayfinderConsentGrant]
}

struct WayfinderLocalSnapshot: Codable, Equatable, Sendable {
    let userID: String
    let situation: WayfinderSituation?
    let options: [WayfinderDecisionOption]
    let consentGrants: [WayfinderConsentGrant]
    let lastDecision: WayfinderDecisionRecord?
    let fastResponse: String?
    let fullStatus: WayfinderProcessingStatus?
    let savedAt: Date
}
