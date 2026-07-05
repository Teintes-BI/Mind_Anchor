import Foundation

enum AppBootstrapState: Equatable {
    case signedOut
    case authenticating
    case loadingWorkspace
    case degraded
    case ready
}

enum RegistryStatusTone: Equatable {
    case neutral
    case good
    case warning
    case danger
}

struct AuthUser: Codable, Equatable {
    let id: String
    let email: String?
    let provider: String
}

struct AuthSessionState: Codable, Equatable {
    let accessToken: String
    let refreshToken: String?
    let expiresAt: Date?
    let user: AuthUser
}

struct AppPermissionHint: Codable, Equatable {
    let notificationChannelRecommended: String
    let desktopSignalsExpected: Bool
    let accessibilityRecommended: Bool
}

struct CoachFrontAgentPayload: Codable, Equatable {
    let currentFrontAgent: String
    let routingMode: String
    let manualOverride: Bool
    let consultedAgent: String?
    let handoffReason: String?
    let overrideSourceAgent: String?
    let visibleSummary: String?
}

struct CoachPersonaOption: Equatable, Identifiable {
    let agentID: String
    let displayName: String
    let roleSummary: String

    var id: String { agentID }
}

struct CoachHandoffCardState: Equatable {
    let sourceDisplayName: String
    let reasonKey: String
    let reasonTitle: String
    let reasonDescription: String
    let nextDisplayName: String
}

enum CoachPersonaCatalog {
    static let switchablePersonas: [CoachPersonaOption] = [
        .init(agentID: "director-agent", displayName: "Picard", roleSummary: "Routes the team and frames the next move."),
        .init(agentID: "companion-agent", displayName: "Deanna Troi", roleSummary: "Handles emotional attunement and context gathering."),
        .init(agentID: "analyst-agent", displayName: "Spock", roleSummary: "Provides rational analysis and structural clarity."),
        .init(agentID: "balance-agent", displayName: "Guinan", roleSummary: "Balances reality, pacing, and emotional steadiness."),
        .init(agentID: "life-secretary-agent", displayName: "Jarvis", roleSummary: "Owns planning, scheduling, and execution changes."),
    ]

    static let visibleFrontOptions = switchablePersonas

    static func visibleFrontRows(maxColumns: Int = 4) -> [[CoachPersonaOption]] {
        let resolvedMaxColumns = max(1, maxColumns)
        return stride(from: 0, to: visibleFrontOptions.count, by: resolvedMaxColumns).map { index in
            Array(visibleFrontOptions[index..<min(index + resolvedMaxColumns, visibleFrontOptions.count)])
        }
    }

    static func displayName(for agentID: String?) -> String {
        guard let agentID else { return "Picard" }
        return (switchablePersonas.first { $0.agentID == agentID }?.displayName)
            ?? (agentID == "memory-governor-agent" ? "Data" : agentID)
    }

    static func roleSummary(for agentID: String?) -> String {
        guard let agentID else { return switchablePersonas.first?.roleSummary ?? "" }
        if agentID == "memory-governor-agent" {
            return "Governs long-term memory decisions and recall boundaries."
        }
        return switchablePersonas.first(where: { $0.agentID == agentID })?.roleSummary ?? ""
    }
}

extension CoachFrontAgentPayload {
    static let defaultAuto = CoachFrontAgentPayload(
        currentFrontAgent: "director-agent",
        routingMode: "auto",
        manualOverride: false,
        consultedAgent: nil,
        handoffReason: nil,
        overrideSourceAgent: nil,
        visibleSummary: "Picard is currently coordinating the team."
    )
}

struct JarvisProposalPayload: Codable, Equatable, Identifiable {
    let id: String
    let userId: String
    let actorType: String
    let actorAgent: String
    let riskLevel: String
    let status: String
    let summary: String
    let beforeStateSummary: String
    let afterStateSummary: String
    let rationale: String
    let createdAt: String
    let approvedAt: String?
}

struct DataMemoryPayload: Codable, Equatable, Identifiable {
    var id: String { memoryId ?? candidateId }

    let candidateId: String
    let memoryId: String?
    let status: String
    let sourceAgent: String
    let sourceTurnRef: String
    let summary: String
    let effectiveAt: String?
    let recallBlockedAt: String?
    let deletedAt: String?
}

enum CoachDebugJSONValue: Codable, Equatable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case array([CoachDebugJSONValue])
    case object([String: CoachDebugJSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode([String: CoachDebugJSONValue].self) {
            self = .object(value)
        } else if let value = try? container.decode([CoachDebugJSONValue].self) {
            self = .array(value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported debug JSON value.")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .number(let value):
            try container.encode(value)
        case .bool(let value):
            try container.encode(value)
        case .array(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        case .null:
            try container.encodeNil()
        }
    }

    var stringValue: String? {
        if case .string(let value) = self { return value }
        return nil
    }

    var intValue: Int? {
        if case .number(let value) = self { return Int(value) }
        return nil
    }
}

struct CoachDebugTraceEventPayload: Codable, Equatable, Identifiable {
    let id: String
    let traceId: String
    let parentTraceId: String?
    let level: String
    let component: String
    let event: String
    let message: String
    let metadata: [String: CoachDebugJSONValue]
    let createdAt: String
}

struct DebugTraceLookupPayload: Codable, Equatable {
    struct SummaryPayload: Codable, Equatable {
        struct ConversationPathPayload: Codable, Equatable {
            let frontAgent: String?
            let consultedAgent: String?
            let authorityAgent: String?
            let authorityTarget: String?
            let authorityExecutionStatus: String?
            let runtimeSource: String?
            let revokedMemoryCount: Int?
            let primaryRoute: String?
            let usedOpenClaw: Bool
            let hadFallback: Bool
            let degraded: Bool
            let degradedReason: String?

            init(
                frontAgent: String?,
                consultedAgent: String?,
                authorityAgent: String?,
                authorityTarget: String?,
                authorityExecutionStatus: String?,
                runtimeSource: String? = nil,
                revokedMemoryCount: Int? = nil,
                primaryRoute: String?,
                usedOpenClaw: Bool,
                hadFallback: Bool,
                degraded: Bool,
                degradedReason: String?
            ) {
                self.frontAgent = frontAgent
                self.consultedAgent = consultedAgent
                self.authorityAgent = authorityAgent
                self.authorityTarget = authorityTarget
                self.authorityExecutionStatus = authorityExecutionStatus
                self.runtimeSource = runtimeSource
                self.revokedMemoryCount = revokedMemoryCount
                self.primaryRoute = primaryRoute
                self.usedOpenClaw = usedOpenClaw
                self.hadFallback = hadFallback
                self.degraded = degraded
                self.degradedReason = degradedReason
            }
        }

        let conversationPath: ConversationPathPayload?
    }

    let traceId: String
    let agentRuns: [CoachDebugJSONValue]
    let matrixRuns: [CoachDebugJSONValue]
    let events: [CoachDebugTraceEventPayload]
    let summary: SummaryPayload?
}

struct OpenClawNativeAgentPayload: Codable, Equatable, Identifiable {
    var id: String { agentId }

    let agentId: String
    let displayName: String
    let runtimeAgentId: String
    let worker: String
    let modelTarget: String
    let soulFilePath: String
    let supportedWorkflows: [String]
    let memoryScopes: [String]
    let canFront: Bool
    let canConsult: Bool
    let canWritePlans: Bool
    let canGovernMemory: Bool
    let visibleInLocalRuntime: Bool
}

struct OpenClawNativeAgentsResponsePayload: Codable, Equatable {
    let source: String
    let explanation: String
    let totalAgents: Int
    let agents: [OpenClawNativeAgentPayload]
}

struct OpenClawExternalRuntimeAgentPayload: Codable, Equatable, Identifiable {
    var id: String { name }

    let name: String
    let worker: String
    let modelTarget: String
    let skillCount: Int
    let supportedWorkflows: [String]
}

struct OpenClawRegistryVisibilityPayload: Codable, Equatable {
    struct ExternalRuntimePayload: Codable, Equatable {
        struct HealthIssueCounts: Codable, Equatable {
            let missingPersonaCount: Int
            let contractMismatchCount: Int
            let runtimeContractMismatchCount: Int
            let workflowContractMismatchCount: Int
            let workflowResponseContractMismatchCount: Int
            let workflowExecutionContractMismatchCount: Int
            let workflowExecutionProbeMismatchCount: Int
            let unknownExternalAgentCount: Int
            let totalIssueCount: Int
        }

        struct ContractMismatch: Codable, Equatable {
            let agentId: String
            let mismatchFields: [String]
        }

        struct WorkflowContractMismatch: Codable, Equatable {
            let workflow: String
            let missingRequiredContextFields: [String]
        }

        struct WorkflowResponseContractMismatch: Codable, Equatable {
            let workflow: String
            let missingRequiredParsedFields: [String]
        }

        struct WorkflowExecutionContractMismatch: Codable, Equatable {
            let workflow: String
            let missingRequiredMetadataFields: [String]
            let missingMemoryFetchFields: [String]
            let missingAuthorityApplyFields: [String]
        }

        struct WorkflowExecutionProbeMismatch: Codable, Equatable {
            let workflow: String
            let target: String
            let statusCode: Int?
            let missingRequiredMetadataFields: [String]
            let missingMemoryFetchFields: [String]
            let missingAuthorityApplyFields: [String]
            let error: String?
        }

        let healthStatus: String?
        let healthReasonCodes: [String]
        let healthIssueCounts: HealthIssueCounts?
        let configured: Bool
        let reachable: Bool
        let baseUrl: String?
        let runtime: String?
        let runtimeVersion: String?
        let responseMode: String?
        let executeEndpoints: [String]
        let agentCount: Int
        let agents: [OpenClawExternalRuntimeAgentPayload]
        let matchedAgentIds: [String]
        let missingInExternal: [String]
        let contractMismatches: [ContractMismatch]
        let runtimeContractMismatches: [String]
        let workflowContractMismatches: [WorkflowContractMismatch]
        let workflowResponseContractMismatches: [WorkflowResponseContractMismatch]
        let workflowExecutionContractMismatches: [WorkflowExecutionContractMismatch]
        let workflowExecutionProbeMismatches: [WorkflowExecutionProbeMismatch]
        let unknownExternalAgents: [String]
        let error: String?

        enum CodingKeys: String, CodingKey {
            case healthStatus
            case healthReasonCodes
            case healthIssueCounts
            case configured
            case reachable
            case baseUrl
            case runtime
            case runtimeVersion
            case responseMode
            case executeEndpoints
            case agentCount
            case agents
            case matchedAgentIds
            case missingInExternal
            case contractMismatches
            case runtimeContractMismatches
            case workflowContractMismatches
            case workflowResponseContractMismatches
            case workflowExecutionContractMismatches
            case workflowExecutionProbeMismatches
            case unknownExternalAgents
            case error
        }

        init(
            healthStatus: String? = nil,
            healthReasonCodes: [String] = [],
            healthIssueCounts: HealthIssueCounts? = nil,
            configured: Bool,
            reachable: Bool,
            baseUrl: String?,
            runtime: String?,
            runtimeVersion: String?,
            responseMode: String? = nil,
            executeEndpoints: [String] = [],
            agentCount: Int,
            agents: [OpenClawExternalRuntimeAgentPayload],
            matchedAgentIds: [String],
            missingInExternal: [String],
            contractMismatches: [ContractMismatch] = [],
            runtimeContractMismatches: [String] = [],
            workflowContractMismatches: [WorkflowContractMismatch] = [],
            workflowResponseContractMismatches: [WorkflowResponseContractMismatch] = [],
            workflowExecutionContractMismatches: [WorkflowExecutionContractMismatch] = [],
            workflowExecutionProbeMismatches: [WorkflowExecutionProbeMismatch] = [],
            unknownExternalAgents: [String],
            error: String?
        ) {
            self.healthStatus = healthStatus
            self.healthReasonCodes = healthReasonCodes
            self.healthIssueCounts = healthIssueCounts
            self.configured = configured
            self.reachable = reachable
            self.baseUrl = baseUrl
            self.runtime = runtime
            self.runtimeVersion = runtimeVersion
            self.responseMode = responseMode
            self.executeEndpoints = executeEndpoints
            self.agentCount = agentCount
            self.agents = agents
            self.matchedAgentIds = matchedAgentIds
            self.missingInExternal = missingInExternal
            self.contractMismatches = contractMismatches
            self.runtimeContractMismatches = runtimeContractMismatches
            self.workflowContractMismatches = workflowContractMismatches
            self.workflowResponseContractMismatches = workflowResponseContractMismatches
            self.workflowExecutionContractMismatches = workflowExecutionContractMismatches
            self.workflowExecutionProbeMismatches = workflowExecutionProbeMismatches
            self.unknownExternalAgents = unknownExternalAgents
            self.error = error
        }

        init(from decoder: any Decoder) throws {
            let container = try decoder.container(keyedBy: CodingKeys.self)
            self.healthStatus = try container.decodeIfPresent(String.self, forKey: .healthStatus)
            self.healthReasonCodes = try container.decodeIfPresent([String].self, forKey: .healthReasonCodes) ?? []
            self.healthIssueCounts = try container.decodeIfPresent(HealthIssueCounts.self, forKey: .healthIssueCounts)
            self.configured = try container.decode(Bool.self, forKey: .configured)
            self.reachable = try container.decode(Bool.self, forKey: .reachable)
            self.baseUrl = try container.decodeIfPresent(String.self, forKey: .baseUrl)
            self.runtime = try container.decodeIfPresent(String.self, forKey: .runtime)
            self.runtimeVersion = try container.decodeIfPresent(String.self, forKey: .runtimeVersion)
            self.responseMode = try container.decodeIfPresent(String.self, forKey: .responseMode)
            self.executeEndpoints = try container.decodeIfPresent([String].self, forKey: .executeEndpoints) ?? []
            self.agentCount = try container.decode(Int.self, forKey: .agentCount)
            self.agents = try container.decode([OpenClawExternalRuntimeAgentPayload].self, forKey: .agents)
            self.matchedAgentIds = try container.decodeIfPresent([String].self, forKey: .matchedAgentIds) ?? []
            self.missingInExternal = try container.decodeIfPresent([String].self, forKey: .missingInExternal) ?? []
            self.contractMismatches = try container.decodeIfPresent([ContractMismatch].self, forKey: .contractMismatches) ?? []
            self.runtimeContractMismatches = try container.decodeIfPresent([String].self, forKey: .runtimeContractMismatches) ?? []
            self.workflowContractMismatches = try container.decodeIfPresent([WorkflowContractMismatch].self, forKey: .workflowContractMismatches) ?? []
            self.workflowResponseContractMismatches = try container.decodeIfPresent([WorkflowResponseContractMismatch].self, forKey: .workflowResponseContractMismatches) ?? []
            self.workflowExecutionContractMismatches = try container.decodeIfPresent([WorkflowExecutionContractMismatch].self, forKey: .workflowExecutionContractMismatches) ?? []
            self.workflowExecutionProbeMismatches = try container.decodeIfPresent([WorkflowExecutionProbeMismatch].self, forKey: .workflowExecutionProbeMismatches) ?? []
            self.unknownExternalAgents = try container.decodeIfPresent([String].self, forKey: .unknownExternalAgents) ?? []
            self.error = try container.decodeIfPresent(String.self, forKey: .error)
        }
    }

    let source: String
    let explanation: String
    let nativeRegistry: OpenClawNativeAgentsResponsePayload
    let externalRuntime: ExternalRuntimePayload
}

struct CoachConversationSessionPayload: Codable, Equatable, Identifiable {
    let id: String
    let userId: String
    let title: String
    let status: String
    let createdAt: String
    let updatedAt: String
    let lastMessageAt: String?
}

struct CoachConversationMessagePayload: Codable, Equatable, Identifiable {
    struct ConversationPathPayload: Codable, Equatable {
        let frontAgent: String?
        let consultedAgent: String?
        let authorityAgent: String?
        let authorityTarget: String?
        let authorityExecutionStatus: String?
        let runtimeSource: String?
        let revokedMemoryCount: Int?
        let primaryRoute: String?
        let usedOpenClaw: Bool
        let hadFallback: Bool
        let degraded: Bool
        let degradedReason: String?

        init(
            frontAgent: String?,
            consultedAgent: String?,
            authorityAgent: String?,
            authorityTarget: String?,
            authorityExecutionStatus: String?,
            runtimeSource: String? = nil,
            revokedMemoryCount: Int? = nil,
            primaryRoute: String?,
            usedOpenClaw: Bool,
            hadFallback: Bool,
            degraded: Bool,
            degradedReason: String?
        ) {
            self.frontAgent = frontAgent
            self.consultedAgent = consultedAgent
            self.authorityAgent = authorityAgent
            self.authorityTarget = authorityTarget
            self.authorityExecutionStatus = authorityExecutionStatus
            self.runtimeSource = runtimeSource
            self.revokedMemoryCount = revokedMemoryCount
            self.primaryRoute = primaryRoute
            self.usedOpenClaw = usedOpenClaw
            self.hadFallback = hadFallback
            self.degraded = degraded
            self.degradedReason = degradedReason
        }
    }

    struct UsedMemoryEntryPayload: Codable, Equatable, Identifiable {
        var id: String { memoryId ?? "\(source):\(kind):\(summary)" }

        let memoryId: String?
        let summary: String
        let kind: String
        let source: String
    }

    let id: String
    let userId: String
    let sessionId: String
    let role: String
    let status: String
    let userText: String?
    let fastResponse: String?
    let fullResponse: String?
    let usedMemoryIds: [String]
    let usedMemoryEntries: [UsedMemoryEntryPayload]
    let conversationPath: ConversationPathPayload?
    let traceId: String?
    let errorCode: String?
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case sessionId
        case role
        case status
        case userText
        case fastResponse
        case fullResponse
        case usedMemoryIds
        case usedMemoryEntries
        case conversationPath
        case traceId
        case errorCode
        case createdAt
        case updatedAt
    }

    init(
        id: String,
        userId: String,
        sessionId: String,
        role: String,
        status: String,
        userText: String?,
        fastResponse: String?,
        fullResponse: String?,
        usedMemoryIds: [String],
        usedMemoryEntries: [UsedMemoryEntryPayload] = [],
        conversationPath: ConversationPathPayload? = nil,
        traceId: String?,
        errorCode: String?,
        createdAt: String,
        updatedAt: String
    ) {
        self.id = id
        self.userId = userId
        self.sessionId = sessionId
        self.role = role
        self.status = status
        self.userText = userText
        self.fastResponse = fastResponse
        self.fullResponse = fullResponse
        self.usedMemoryIds = usedMemoryIds
        self.usedMemoryEntries = usedMemoryEntries
        self.conversationPath = conversationPath
        self.traceId = traceId
        self.errorCode = errorCode
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        userId = try container.decode(String.self, forKey: .userId)
        sessionId = try container.decode(String.self, forKey: .sessionId)
        role = try container.decode(String.self, forKey: .role)
        status = try container.decode(String.self, forKey: .status)
        userText = try container.decodeIfPresent(String.self, forKey: .userText)
        fastResponse = try container.decodeIfPresent(String.self, forKey: .fastResponse)
        fullResponse = try container.decodeIfPresent(String.self, forKey: .fullResponse)
        usedMemoryIds = try container.decodeIfPresent([String].self, forKey: .usedMemoryIds) ?? []
        usedMemoryEntries = try container.decodeIfPresent([UsedMemoryEntryPayload].self, forKey: .usedMemoryEntries) ?? []
        conversationPath = try container.decodeIfPresent(ConversationPathPayload.self, forKey: .conversationPath)
        traceId = try container.decodeIfPresent(String.self, forKey: .traceId)
        errorCode = try container.decodeIfPresent(String.self, forKey: .errorCode)
        createdAt = try container.decode(String.self, forKey: .createdAt)
        updatedAt = try container.decode(String.self, forKey: .updatedAt)
    }
}

struct CoachConversationFeedbackPayload: Codable, Equatable, Identifiable {
    let id: String
    let userId: String
    let sessionId: String
    let messageId: String
    let label: String
    let reason: String?
    let createdAt: String
}

struct CoachConversationMemoryPayload: Codable, Equatable, Identifiable {
    let id: String
    let userId: String
    let kind: String
    let summary: String
    let confidence: Double
    let status: String
    let sourceMessageId: String
    let sourceExcerpt: String
    let createdAt: String
    let lastUsedAt: String?
    let revokedAt: String?
}

struct CoachConversationSessionDetailPayload: Codable, Equatable {
    let session: CoachConversationSessionPayload
    let messages: [CoachConversationMessagePayload]
}

struct CoachConversationSendMessageResponsePayload: Codable, Equatable {
    let userMessage: CoachConversationMessagePayload
    let assistantMessage: CoachConversationMessagePayload
    let frontAgentState: CoachFrontAgentPayload
    let fastResponse: String
    let traceID: String

    enum CodingKeys: String, CodingKey {
        case userMessage
        case assistantMessage
        case frontAgentState
        case fastResponse
        case traceID = "traceId"
    }
}

struct DashboardSummaryPayload: Codable, Equatable {
    struct StateAssessment: Codable, Equatable {
        let summary: String
        let recommendedAction: String
        let focusScore: Double?
        let energyScore: Double?
        let moodScore: Double?
    }

    struct RecoveryPlan: Codable, Equatable {
        let nextStep: String
    }

    struct BehaviorConclusion: Codable, Equatable {
        let summary: String
        let suggestedAction: String
        let recommendedChannel: String
    }

    struct Goal: Codable, Equatable, Identifiable {
        let id: String
        let title: String
        let status: String
    }

    struct Task: Codable, Equatable, Identifiable {
        let id: String
        let title: String
        let status: String
        let priority: String
        let estimatedMinutes: Int?
    }

    let goalCount: Int
    let taskCount: Int
    let openInterventions: Int
    let completionRate: Double
    let coachFrontAgent: CoachFrontAgentPayload?
    let latestAssessment: StateAssessment?
    let latestRecoveryPlan: RecoveryPlan?
    let latestBehaviorConclusion: BehaviorConclusion?
    let goals: [Goal]
    let tasks: [Task]
}

struct GoalFlowOverviewPayload: Codable, Equatable {
    let goals: [DashboardSummaryPayload.Goal]
    let tasks: [DashboardSummaryPayload.Task]
    let suggestedFocusTaskId: String?
    let summaryHeadline: String
    let latestAssessment: DashboardSummaryPayload.StateAssessment?
    let latestRecoveryPlan: DashboardSummaryPayload.RecoveryPlan?
}

struct InboxOverviewPayload: Codable, Equatable {
    struct Message: Codable, Equatable, Identifiable {
        let id: String
        let title: String
        let message: String
        let channel: String
        let status: String
        let createdAt: String
    }

    struct ChannelCount: Codable, Equatable, Identifiable {
        var id: String { channel }
        let channel: String
        let total: Int
        let pending: Int
        let acknowledged: Int
    }

    let messages: [Message]
    let pendingMessages: [Message]
    let acknowledgedMessages: [Message]
    let channelCounts: [ChannelCount]
}

struct ReflectionOverviewPayload: Codable, Equatable {
    struct ReflectionReport: Codable, Equatable, Identifiable {
        let id: String
        let periodType: String
        let highlights: [String]
        let blockers: [String]
        let trends: [String]
        let nextSuggestions: [String]
        let createdAt: String
    }

    let latestWeekly: ReflectionReport?
    let latestMonthly: ReflectionReport?
    let reports: [ReflectionReport]
}

struct StateTrendsPayload: Codable, Equatable {
    struct Assessment: Codable, Equatable, Identifiable {
        let id: String
        let summary: String
        let recommendedAction: String
        let focusScore: Double
        let energyScore: Double
        let moodScore: Double
        let createdAt: String
    }

    let currentAssessment: DashboardSummaryPayload.StateAssessment?
    let assessments: [Assessment]
    let activeInputs: [String]
}

struct MePayload: Codable, Equatable {
    let authenticated: Bool
    let user: AuthUser?
}

struct ClientBootstrapPayload: Codable, Equatable {
    let me: MePayload
    let dashboard: DashboardSummaryPayload
    let inboxOverview: InboxOverviewPayload
    let goalFlow: GoalFlowOverviewPayload
    let permissions: AppPermissionHint
}

struct DesktopSignalEvent: Codable, Equatable, Identifiable {
    let id: UUID
    let eventType: String
    let occurredAt: Date
    let payload: [String: String]
}

struct ReminderMetadata: Codable, Equatable {
    var seenMessageIDs: Set<String> = []
    var snoozedUntilByMessageID: [String: Date] = [:]
}

struct RecentActivitySnapshot: Codable, Equatable {
    var activeAppCount: Int = 0
    var windowSwitchCount: Int = 0
    var idleCount: Int = 0
    var lockCount: Int = 0
    var unlockCount: Int = 0
    var lastFrontmostApp: String = ""
    var lastWindowTitle: String?
    var lastIdleSeconds: Int = 0
    var lastLockAt: Date?
    var lastUnlockAt: Date?
    var lastUpdatedAt: Date?
}

struct DesktopCollectorState: Codable, Equatable {
    let queueLength: Int
    let lastSyncAt: Date?
    let lastHeartbeatAt: Date?
    let lastErrorMessage: String?
    let lastFrontmostApp: String
    let lastIdleSeconds: Int

    init(
        queueLength: Int,
        lastSyncAt: Date?,
        lastHeartbeatAt: Date?,
        lastErrorMessage: String?,
        lastFrontmostApp: String,
        lastIdleSeconds: Int
    ) {
        self.queueLength = queueLength
        self.lastSyncAt = lastSyncAt
        self.lastHeartbeatAt = lastHeartbeatAt
        self.lastErrorMessage = lastErrorMessage
        self.lastFrontmostApp = lastFrontmostApp
        self.lastIdleSeconds = lastIdleSeconds
    }

    init(state: LocalStore.PersistedState) {
        self.init(
            queueLength: state.queuedSignals.count,
            lastSyncAt: state.lastSyncAt,
            lastHeartbeatAt: state.lastHeartbeatAt,
            lastErrorMessage: state.lastErrorMessage,
            lastFrontmostApp: state.recentActivity.lastFrontmostApp,
            lastIdleSeconds: state.recentActivity.lastIdleSeconds
        )
    }
}

struct DesktopDeviceProfile: Codable, Equatable {
    let deviceID: String
    let label: String
    let platform: String
    let capabilities: [String]
    let appVersion: String
}

struct SupportDiagnosticsSnapshot: Codable, Equatable {
    let generatedAt: Date
    let apiBaseURL: String
    let accountEmail: String
    let bootstrapStatusTitle: String
    let bootstrapStatusMessage: String
    let connectionStatusTitle: String
    let connectionStatusDetail: String
    let deviceProfile: DesktopDeviceProfile
    let runtimeStatus: DesktopCollectorState
    let collectorStatus: RecentActivitySnapshot
    let notificationStatusDescription: String
    let notificationPermissionHelpText: String
    let desktopCollectionStatusTitle: String
    let desktopCollectionStatusDetail: String
    let pendingReminderCount: Int
    let currentError: String?
    let systemNotificationRequestIDs: [String]
}
