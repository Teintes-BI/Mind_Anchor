import XCTest
@testable import MindAnchorCore

@MainActor
final class CoachAgentTeamTests: XCTestCase {
    func testCoachDestinationAppearsInSidebarCatalog() {
        XCTAssertTrue(AppDestination.allCases.contains(.coach))
        XCTAssertEqual(AppDestination.coach.title, "Coach")
    }

    func testCoachSwitcherExposesVisiblePersonasAndExcludesData() {
        XCTAssertEqual(
            CoachPersonaCatalog.visibleFrontOptions.map(\.displayName),
            ["Picard", "Deanna Troi", "Spock", "Guinan", "Jarvis"]
        )
        XCTAssertFalse(
            CoachPersonaCatalog.visibleFrontOptions.map(\.displayName).contains("Data")
        )
    }

    func testCoachSwitcherRowsStayDeterministicForMacLayout() {
        let rows = CoachPersonaCatalog.visibleFrontRows(maxColumns: 4)

        XCTAssertEqual(rows.count, 2)
        XCTAssertEqual(rows[0].map(\.displayName), ["Picard", "Deanna Troi", "Spock", "Guinan"])
        XCTAssertEqual(rows[1].map(\.displayName), ["Jarvis"])
    }

    func testCoachViewModelSurfacesFrontAgentBadgeConsultSummaryAndHandoff() async throws {
        let client = CoachMockAPIClient()
        client.bootstrapPayload = .fixture(
            userID: "coach-user",
            coachFrontAgent: CoachFrontAgentPayload(
                currentFrontAgent: "life-secretary-agent",
                routingMode: "manual",
                manualOverride: true,
                consultedAgent: "analyst-agent",
                handoffReason: "plan_write_requires_jarvis",
                overrideSourceAgent: "companion-agent",
                visibleSummary: "Jarvis is stepping in because this request needs a real plan change."
            )
        )

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeCoachTempDirectory()),
            deviceProfile: .fixture,
            collector: CoachMockCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.coachCurrentPersonaName, "Jarvis")
        XCTAssertEqual(viewModel.coachRoutingModeTitle, "手动接管")
        XCTAssertEqual(
            viewModel.coachConsultedSummary,
            "已咨询 Spock · Jarvis is stepping in because this request needs a real plan change."
        )

        let handoff = try XCTUnwrap(viewModel.coachHandoffCard)
        XCTAssertEqual(handoff.sourceDisplayName, "Deanna Troi")
        XCTAssertEqual(handoff.nextDisplayName, "Jarvis")
        XCTAssertEqual(handoff.reasonKey, "plan_write_requires_jarvis")
        XCTAssertEqual(handoff.reasonTitle, "计划写入必须由 Jarvis 处理")

        viewModel.signOut()
    }

    func testCoachManualOverrideToggleAndPersonaSelectionUpdateState() async throws {
        let client = CoachMockAPIClient()
        client.bootstrapPayload = .fixture(
            userID: "coach-user",
            coachFrontAgent: CoachFrontAgentPayload(
                currentFrontAgent: "director-agent",
                routingMode: "auto",
                manualOverride: false,
                consultedAgent: nil,
                handoffReason: nil,
                overrideSourceAgent: nil,
                visibleSummary: "Picard is coordinating the team."
            )
        )

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeCoachTempDirectory()),
            deviceProfile: .fixture,
            collector: CoachMockCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        await viewModel.selectCoachPersona("analyst-agent")
        XCTAssertEqual(client.updatedFrontAgentPayloads.last?.currentFrontAgent, "analyst-agent")
        XCTAssertEqual(client.updatedFrontAgentPayloads.last?.routingMode, "manual")
        XCTAssertEqual(client.updatedFrontAgentPayloads.last?.manualOverride, true)
        XCTAssertEqual(viewModel.coachCurrentPersonaName, "Spock")
        XCTAssertEqual(viewModel.coachRoutingModeTitle, "手动接管")

        await viewModel.setCoachManualOverride(false)
        XCTAssertEqual(client.updatedFrontAgentPayloads.last?.currentFrontAgent, "director-agent")
        XCTAssertEqual(client.updatedFrontAgentPayloads.last?.routingMode, "auto")
        XCTAssertEqual(client.updatedFrontAgentPayloads.last?.manualOverride, false)
        XCTAssertEqual(viewModel.coachCurrentPersonaName, "Picard")
        XCTAssertEqual(viewModel.coachRoutingModeTitle, "自动路由")

        viewModel.signOut()
    }

    func testCoachLoadsJarvisProposalsAndApprovalActionsUpdateState() async throws {
        let client = CoachMockAPIClient()
        client.bootstrapPayload = .fixture(
            userID: "coach-user",
            coachFrontAgent: CoachFrontAgentPayload.defaultAuto
        )
        client.proposals = [
            JarvisProposalPayload(
                id: "proposal-1",
                userId: "coach-user",
                actorType: "agent",
                actorAgent: "life-secretary-agent",
                riskLevel: "high",
                status: "proposal",
                summary: "Move tomorrow's planning block.",
                beforeStateSummary: "Tomorrow 16:00-17:00 planning block",
                afterStateSummary: "Next Tuesday 09:00-10:00 planning block",
                rationale: "Current load is unsafe.",
                createdAt: "2026-03-21T00:00:00.000Z",
                approvedAt: nil
            )
        ]

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeCoachTempDirectory()),
            deviceProfile: .fixture,
            collector: CoachMockCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.coachProposals.count, 1)
        XCTAssertEqual(viewModel.coachProposals.first?.beforeStateSummary, "Tomorrow 16:00-17:00 planning block")
        XCTAssertEqual(viewModel.coachProposals.first?.afterStateSummary, "Next Tuesday 09:00-10:00 planning block")

        await viewModel.approveCoachProposal("proposal-1")
        XCTAssertEqual(client.approvedProposalIDs, ["proposal-1"])
        XCTAssertEqual(viewModel.coachProposals.first?.status, "approved")

        await viewModel.rejectCoachProposal("proposal-1")
        XCTAssertEqual(client.rejectedProposalIDs, ["proposal-1"])
        XCTAssertEqual(viewModel.coachProposals.first?.status, "rejected")

        viewModel.signOut()
    }

    func testCoachLoadsMemoryPanelAndFiltersDeletedRecallBlockedItems() async throws {
        let client = CoachMockAPIClient()
        client.bootstrapPayload = .fixture(
            userID: "coach-user",
            coachFrontAgent: CoachFrontAgentPayload.defaultAuto
        )
        client.memoryItems = [
            DataMemoryPayload(
                candidateId: "candidate-1",
                memoryId: "memory-1",
                status: "accepted",
                sourceAgent: "companion-agent",
                sourceTurnRef: "turn-1",
                summary: "The user prefers short recovery steps.",
                effectiveAt: "2026-03-21T00:00:00.000Z",
                recallBlockedAt: nil,
                deletedAt: nil
            ),
            DataMemoryPayload(
                candidateId: "candidate-2",
                memoryId: "memory-2",
                status: "recall_blocked",
                sourceAgent: "balance-agent",
                sourceTurnRef: "turn-2",
                summary: "Walking before analysis helps the user.",
                effectiveAt: "2026-03-20T00:00:00.000Z",
                recallBlockedAt: "2026-03-21T01:00:00.000Z",
                deletedAt: nil
            ),
        ]

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeCoachTempDirectory()),
            deviceProfile: .fixture,
            collector: CoachMockCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.coachMemoryItems.count, 2)
        XCTAssertEqual(viewModel.coachRecallEligibleMemoryItems.count, 1)
        XCTAssertEqual(viewModel.coachRecallEligibleMemoryItems.first?.memoryId, "memory-1")

        await viewModel.blockCoachMemoryRecall("memory-1")
        XCTAssertEqual(client.blockedMemoryIDs, ["memory-1"])
        XCTAssertTrue(viewModel.coachRecallEligibleMemoryItems.isEmpty)

        await viewModel.deleteCoachMemory("memory-1")
        XCTAssertEqual(client.deletedMemoryIDs, ["memory-1"])
        XCTAssertTrue(viewModel.coachRecallEligibleMemoryItems.isEmpty)
        XCTAssertEqual(viewModel.coachMemoryItems.first(where: { $0.memoryId == "memory-1" })?.status, "deleted")

        viewModel.signOut()
    }

    func testCoachProposalMetadataIncludesRiskBeforeAfterAndRationale() async throws {
        let client = CoachMockAPIClient()
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: CoachFrontAgentPayload.defaultAuto)
        client.proposals = [
            JarvisProposalPayload(
                id: "proposal-1",
                userId: "coach-user",
                actorType: "agent",
                actorAgent: "life-secretary-agent",
                riskLevel: "high",
                status: "proposal",
                summary: "Move tomorrow's planning block.",
                beforeStateSummary: "Tomorrow 16:00-17:00 planning block",
                afterStateSummary: "Next Tuesday 09:00-10:00 planning block",
                rationale: "Current load is unsafe.",
                createdAt: "2026-03-21T00:00:00.000Z",
                approvedAt: nil
            )
        ]

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeCoachTempDirectory()),
            deviceProfile: .fixture,
            collector: CoachMockCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        let metadata = viewModel.coachProposalMetadata(client.proposals[0])
        XCTAssertTrue(metadata.contains("风险：High"))
        XCTAssertTrue(metadata.contains("变更前：Tomorrow 16:00-17:00 planning block"))
        XCTAssertTrue(metadata.contains("变更后：Next Tuesday 09:00-10:00 planning block"))
        XCTAssertTrue(metadata.contains("理由：Current load is unsafe."))

        viewModel.signOut()
    }

    func testCoachUserLanguageContractStaysVisible() async throws {
        let client = CoachMockAPIClient()
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: CoachFrontAgentPayload.defaultAuto)

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeCoachTempDirectory()),
            deviceProfile: .fixture,
            collector: CoachMockCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(
            viewModel.coachAuthorityContractLines,
            ["Jarvis 负责改动计划。", "Data 负责长期记忆治理。"]
        )

        viewModel.signOut()
    }

    func testCoachUnavailableActionsShowFallbackMessaging() async throws {
        let client = CoachMockAPIClient()
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: CoachFrontAgentPayload.defaultAuto)
        client.proposals = [
            JarvisProposalPayload(
                id: "proposal-1",
                userId: "coach-user",
                actorType: "agent",
                actorAgent: "life-secretary-agent",
                riskLevel: "high",
                status: "proposal",
                summary: "Move tomorrow's planning block.",
                beforeStateSummary: "Tomorrow 16:00-17:00 planning block",
                afterStateSummary: "Next Tuesday 09:00-10:00 planning block",
                rationale: "Current load is unsafe.",
                createdAt: "2026-03-21T00:00:00.000Z",
                approvedAt: nil
            )
        ]
        client.memoryItems = [
            DataMemoryPayload(
                candidateId: "candidate-1",
                memoryId: "memory-1",
                status: "accepted",
                sourceAgent: "companion-agent",
                sourceTurnRef: "turn-1",
                summary: "The user prefers short recovery steps.",
                effectiveAt: "2026-03-21T00:00:00.000Z",
                recallBlockedAt: nil,
                deletedAt: nil
            )
        ]
        client.approveProposalError = MockCoachFailure.jarvisUnavailable
        client.deleteMemoryError = MockCoachFailure.dataUnavailable

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeCoachTempDirectory()),
            deviceProfile: .fixture,
            collector: CoachMockCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        await viewModel.approveCoachProposal("proposal-1")
        XCTAssertEqual(viewModel.coachSystemStatusTitle, "Jarvis 当前不可用")
        XCTAssertEqual(viewModel.coachSystemStatusMessage, "Jarvis 当前不可用，因此没有执行任何计划改动。")
        XCTAssertEqual(viewModel.coachProposals.first?.status, "proposal")

        await viewModel.deleteCoachMemory("memory-1")
        XCTAssertEqual(viewModel.coachSystemStatusTitle, "Data 当前不可用")
        XCTAssertEqual(viewModel.coachSystemStatusMessage, "Data 当前不可用，因此长期记忆保持不变。")
        XCTAssertEqual(viewModel.coachMemoryItems.first?.status, "accepted")

        viewModel.signOut()
    }

    func testCoachConsultFailureExplainsFallbackAndKeepsSingleFrontPersona() async throws {
        let client = CoachMockAPIClient()
        client.bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: nil)
        client.fetchCoachFrontAgentError = MockCoachFailure.consultUnavailable

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeCoachTempDirectory()),
            deviceProfile: .fixture,
            collector: CoachMockCollector(),
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.coachCurrentPersonaName, "Picard")
        XCTAssertNil(viewModel.coachConsultedSummary)
        XCTAssertEqual(viewModel.coachSystemStatusTitle, "支持 agent 当前不可用")
        XCTAssertEqual(
            viewModel.coachSystemStatusMessage,
            "某个支持 agent 当前不可用，因此 MindAnchor 保持了单一清晰前台人格，并直接说明了最合适的下一步。"
        )

        viewModel.signOut()
    }
}

private final class CoachMockAPIClient: MindAnchorAPIProviding, @unchecked Sendable {
    var storedSession = AuthSessionState(
        accessToken: "coach-token",
        refreshToken: nil,
        expiresAt: nil,
        user: AuthUser(id: "coach-user", email: "coach@example.com", provider: "gateway-local")
    )
    var bootstrapPayload: ClientBootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: nil)
    var proposals: [JarvisProposalPayload] = []
    var memoryItems: [DataMemoryPayload] = []
    var openClawRegistryVisibilityPayload = OpenClawRegistryVisibilityPayload(
        source: "gateway-openclaw-registry-visibility",
        explanation: "registry",
        nativeRegistry: OpenClawNativeAgentsResponsePayload(
            source: "gateway-native-openclaw-registry",
            explanation: "native",
            totalAgents: 0,
            agents: []
        ),
        externalRuntime: .init(
            configured: false,
            reachable: false,
            baseUrl: nil,
            runtime: nil,
            runtimeVersion: nil,
            agentCount: 0,
            agents: [],
            matchedAgentIds: [],
            missingInExternal: [],
            unknownExternalAgents: [],
            error: nil
        )
    )
    var fetchCoachFrontAgentError: Error?
    var approveProposalError: Error?
    var deleteMemoryError: Error?
    private(set) var updatedFrontAgentPayloads: [CoachFrontAgentPayload] = []
    private(set) var approvedProposalIDs: [String] = []
    private(set) var rejectedProposalIDs: [String] = []
    private(set) var deletedMemoryIDs: [String] = []
    private(set) var blockedMemoryIDs: [String] = []

    func loadStoredSession() -> AuthSessionState? { storedSession }
    func storeSession(_ authSession: AuthSessionState) throws { storedSession = authSession }
    func clearSession() {}

    func signIn(email: String, password: String) async throws -> AuthSessionState { storedSession }
    func register(email: String, password: String, displayName: String?) async throws -> AuthSessionState { storedSession }
    func fetchMe(token: String) async throws -> MePayload {
        MePayload(authenticated: true, user: storedSession.user)
    }
    func fetchBootstrap(token: String) async throws -> ClientBootstrapPayload { bootstrapPayload }
    func fetchCoachFrontAgent(token: String) async throws -> CoachFrontAgentPayload {
        if let fetchCoachFrontAgentError {
            throw fetchCoachFrontAgentError
        }
        return bootstrapPayload.dashboard.coachFrontAgent ?? CoachFrontAgentPayload(
            currentFrontAgent: "director-agent",
            routingMode: "auto",
            manualOverride: false,
            consultedAgent: nil,
            handoffReason: nil,
            overrideSourceAgent: nil,
            visibleSummary: "Picard is coordinating the team."
        )
    }
    func updateCoachFrontAgent(payload: CoachFrontAgentPayload, token: String) async throws -> CoachFrontAgentPayload {
        updatedFrontAgentPayloads.append(payload)
        bootstrapPayload = .fixture(userID: "coach-user", coachFrontAgent: payload)
        return payload
    }
    func fetchCoachProposals(token: String) async throws -> [JarvisProposalPayload] { proposals }
    func fetchCoachMemory(token: String) async throws -> [DataMemoryPayload] { memoryItems }
    func fetchOpenClawRegistryVisibility(token: String) async throws -> OpenClawRegistryVisibilityPayload { openClawRegistryVisibilityPayload }
    func approveCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload {
        if let approveProposalError {
            throw approveProposalError
        }
        approvedProposalIDs.append(proposalID)
        guard let index = proposals.firstIndex(where: { $0.id == proposalID }) else {
            throw NSError(domain: "CoachMockAPIClient", code: 404)
        }
        let current = proposals[index]
        let updated = JarvisProposalPayload(
            id: current.id,
            userId: current.userId,
            actorType: current.actorType,
            actorAgent: current.actorAgent,
            riskLevel: current.riskLevel,
            status: "approved",
            summary: current.summary,
            beforeStateSummary: current.beforeStateSummary,
            afterStateSummary: current.afterStateSummary,
            rationale: current.rationale,
            createdAt: current.createdAt,
            approvedAt: "2026-03-21T02:00:00.000Z"
        )
        proposals[index] = updated
        return updated
    }
    func rejectCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload {
        rejectedProposalIDs.append(proposalID)
        guard let index = proposals.firstIndex(where: { $0.id == proposalID }) else {
            throw NSError(domain: "CoachMockAPIClient", code: 404)
        }
        let current = proposals[index]
        let updated = JarvisProposalPayload(
            id: current.id,
            userId: current.userId,
            actorType: current.actorType,
            actorAgent: current.actorAgent,
            riskLevel: current.riskLevel,
            status: "rejected",
            summary: current.summary,
            beforeStateSummary: current.beforeStateSummary,
            afterStateSummary: current.afterStateSummary,
            rationale: current.rationale,
            createdAt: current.createdAt,
            approvedAt: nil
        )
        proposals[index] = updated
        return updated
    }
    func deleteCoachMemory(_ memoryID: String, token: String) async throws -> DataMemoryPayload {
        if let deleteMemoryError {
            throw deleteMemoryError
        }
        deletedMemoryIDs.append(memoryID)
        guard let index = memoryItems.firstIndex(where: { $0.memoryId == memoryID }) else {
            throw NSError(domain: "CoachMockAPIClient", code: 404)
        }
        let current = memoryItems[index]
        let updated = DataMemoryPayload(
            candidateId: current.candidateId,
            memoryId: current.memoryId,
            status: "deleted",
            sourceAgent: current.sourceAgent,
            sourceTurnRef: current.sourceTurnRef,
            summary: current.summary,
            effectiveAt: current.effectiveAt,
            recallBlockedAt: current.recallBlockedAt,
            deletedAt: "2026-03-21T03:00:00.000Z"
        )
        memoryItems[index] = updated
        return updated
    }
    func blockCoachMemoryRecall(_ memoryID: String, token: String) async throws -> DataMemoryPayload {
        blockedMemoryIDs.append(memoryID)
        guard let index = memoryItems.firstIndex(where: { $0.memoryId == memoryID }) else {
            throw NSError(domain: "CoachMockAPIClient", code: 404)
        }
        let current = memoryItems[index]
        let updated = DataMemoryPayload(
            candidateId: current.candidateId,
            memoryId: current.memoryId,
            status: "recall_blocked",
            sourceAgent: current.sourceAgent,
            sourceTurnRef: current.sourceTurnRef,
            summary: current.summary,
            effectiveAt: current.effectiveAt,
            recallBlockedAt: "2026-03-21T02:30:00.000Z",
            deletedAt: current.deletedAt
        )
        memoryItems[index] = updated
        return updated
    }
    func fetchInboxOverview(token: String) async throws -> InboxOverviewPayload { bootstrapPayload.inboxOverview }
    func fetchStateTrends(token: String, userID: String) async throws -> StateTrendsPayload { .fixture }
    func fetchReflectionOverview(token: String, userID: String) async throws -> ReflectionOverviewPayload { .fixture }
    func registerDevice(profile: DesktopDeviceProfile, token: String, userID: String) async throws -> RegisteredEdgeDevice {
        RegisteredEdgeDevice(id: "device-1", userId: userID, deviceId: profile.deviceID, label: profile.label, deviceType: "desktop", platform: profile.platform, capabilities: profile.capabilities, status: "online")
    }
    func sendHeartbeat(profile: DesktopDeviceProfile, token: String, userID: String, queueDepth: Int) async throws -> RegisteredEdgeDevice {
        RegisteredEdgeDevice(id: "device-1", userId: userID, deviceId: profile.deviceID, label: profile.label, deviceType: "desktop", platform: profile.platform, capabilities: profile.capabilities, status: "online")
    }
    func uploadSignals(_ signals: [DesktopSignalEvent], token: String, userID: String) async throws {}
    func submitCheckIn(focusScore: Int, energyScore: Int, moodScore: Int, note: String, token: String, userID: String) async throws {}
    func acknowledgeInboxMessage(_ messageID: String, token: String) async throws -> InboxOverviewPayload.Message {
        InboxOverviewPayload.Message(id: messageID, title: "Ack", message: "Ack", channel: "desktop_local", status: "acknowledged", createdAt: "2026-03-20T00:00:00.000Z")
    }
}

private enum MockCoachFailure: LocalizedError {
    case jarvisUnavailable
    case dataUnavailable
    case consultUnavailable

    var errorDescription: String? {
        switch self {
        case .jarvisUnavailable:
            return "Jarvis unavailable"
        case .dataUnavailable:
            return "Data unavailable"
        case .consultUnavailable:
            return "Support agent unavailable"
        }
    }
}

private final class CoachMockCollector: DesktopActivityCollecting {
    func start() {}
    func stop() {}
}

private func makeCoachTempDirectory() -> URL {
    let url = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString, isDirectory: true)
    try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
    return url
}

private extension ClientBootstrapPayload {
    static func fixture(userID: String, coachFrontAgent: CoachFrontAgentPayload?) -> ClientBootstrapPayload {
        ClientBootstrapPayload(
            me: MePayload(authenticated: true, user: AuthUser(id: userID, email: "\(userID)@example.com", provider: "gateway-local")),
            dashboard: DashboardSummaryPayload(
                goalCount: 1,
                taskCount: 1,
                openInterventions: 0,
                completionRate: 0,
                coachFrontAgent: coachFrontAgent,
                latestAssessment: .init(summary: "Focused", recommendedAction: "Continue", focusScore: 70, energyScore: 65, moodScore: 60),
                latestRecoveryPlan: nil,
                latestBehaviorConclusion: nil,
                goals: [.init(id: "goal-1", title: "Goal", status: "active")],
                tasks: [.init(id: "task-1", title: "Task", status: "todo", priority: "high", estimatedMinutes: 25)]
            ),
            inboxOverview: InboxOverviewPayload(messages: [], pendingMessages: [], acknowledgedMessages: [], channelCounts: []),
            goalFlow: GoalFlowOverviewPayload(
                goals: [.init(id: "goal-1", title: "Goal", status: "active")],
                tasks: [.init(id: "task-1", title: "Task", status: "todo", priority: "high", estimatedMinutes: 25)],
                suggestedFocusTaskId: "task-1",
                summaryHeadline: "Ready",
                latestAssessment: nil,
                latestRecoveryPlan: nil
            ),
            permissions: AppPermissionHint(notificationChannelRecommended: "desktop_local", desktopSignalsExpected: true, accessibilityRecommended: true)
        )
    }
}

private extension DesktopDeviceProfile {
    static let fixture = DesktopDeviceProfile(
        deviceID: "device-1",
        label: "MindAnchor Test Mac",
        platform: "macos",
        capabilities: ["desktop_signals", "notifications"],
        appVersion: "0.1.0"
    )
}

private extension StateTrendsPayload {
    static let fixture = StateTrendsPayload(currentAssessment: nil, assessments: [], activeInputs: [])
}

private extension ReflectionOverviewPayload {
    static let fixture = ReflectionOverviewPayload(latestWeekly: nil, latestMonthly: nil, reports: [])
}

private extension AppConfiguration {
    static let testValue = AppConfiguration(
        apiBaseURL: URL(string: "http://127.0.0.1:3001")!,
        supabaseURL: nil,
        supabaseAnonKey: nil,
        authDevToken: nil,
        debugAuthBootstrap: nil,
        notificationSnoozeMinutes: 15,
        inboxPollInterval: 30,
        heartbeatInterval: 60,
        idleThresholdSeconds: 120,
        authSessionAccount: "mindanchor-auth-session",
        reminderPollingOnly: false
    )
}
