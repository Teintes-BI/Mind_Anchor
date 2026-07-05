import XCTest
@testable import MindAnchorCore

@MainActor
final class AppViewModelAuthTests: XCTestCase {
    func testViewModelDefaultsToChineseAndPersistsLanguageSelection() async throws {
        let defaults = UserDefaults(suiteName: "MindAnchorMacTests.AppLanguageSelection.\(UUID().uuidString)")!
        let store = AppLanguageStore(userDefaults: defaults)
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: MockAPIClient(),
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            languageStore: store,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        XCTAssertEqual(viewModel.appLanguage, .chinese)
        XCTAssertEqual(AppDestination.today.title(for: viewModel.appLanguage), "今天")

        viewModel.setAppLanguage(.english)

        XCTAssertEqual(viewModel.appLanguage, .english)

        let reloaded = AppViewModel(
            configuration: .testValue,
            apiClient: MockAPIClient(),
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            languageStore: AppLanguageStore(userDefaults: defaults),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        XCTAssertEqual(reloaded.appLanguage, .english)
        XCTAssertEqual(AppDestination.settings.title(for: reloaded.appLanguage), "Settings")
    }

    func testBootstrapCopyDefaultsToChinese() async throws {
        let client = MockAPIClient()
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            languageStore: AppLanguageStore(userDefaults: makeLanguageDefaults()),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()

        XCTAssertEqual(viewModel.bootstrapStatusTitle, "需要登录")
        XCTAssertEqual(viewModel.bootstrapStatusMessage, "登录后即可开始同步桌面活动、提醒和恢复建议。")
    }

    func testBootstrapWithoutStoredSessionKeepsSignedOutFirstRunState() async throws {
        let client = MockAPIClient()
        let store = LocalStore(appSupportDirectory: makeTempDirectory())
        let diagnostics = PermissionsDiagnostics(
            notificationAuthorizationState: .notRequested,
            notificationStatusDescription: "Notifications not requested",
            accessibilityGranted: false
        )
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: MockCollector(),
            diagnostics: diagnostics,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()

        XCTAssertEqual(viewModel.bootstrapState, .signedOut)
        XCTAssertEqual(viewModel.bootstrapStatusTitle, "需要登录")
        XCTAssertEqual(viewModel.bootstrapStatusMessage, "登录后即可开始同步桌面活动、提醒和恢复建议。")
    }

    private func makeLanguageDefaults() -> UserDefaults {
        let suiteName = "MindAnchorMacTests.AppViewModelLanguage.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defaults.removePersistentDomain(forName: suiteName)
        return defaults
    }

    func testBootstrapShowsWorkspaceLoadingWhileStoredSessionRefreshPending() async throws {
        let client = MockAPIClient()
        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.waitToResolveFetchBootstrap = true
        client.bootstrapPayload = .fixture(userID: "user-1")

        let store = LocalStore(appSupportDirectory: makeTempDirectory())
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: MockCollector(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        let bootstrapTask = Task { await viewModel.bootstrap() }
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.bootstrapState, .loadingWorkspace)

        client.resolveFetchBootstrap()
        await bootstrapTask.value
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.bootstrapState, .ready)
    }

    func testBootstrapFailureMovesStateToDegraded() async throws {
        let client = MockAPIClient()
        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.fetchBootstrapError = MockFailure.gatewayUnavailable

        let store = LocalStore(appSupportDirectory: makeTempDirectory())
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: MockCollector(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.bootstrapState, .degraded)
        XCTAssertEqual(viewModel.bootstrapStatusTitle, "已连接，但数据受限")
        XCTAssertEqual(viewModel.currentError, MockFailure.gatewayUnavailable.localizedDescription)
        XCTAssertEqual(viewModel.userFacingCurrentErrorMessage, "Gateway 当前不可达。请确认 Gateway 已启动、网络可访问，然后重试同步。")
    }

    func testBootstrapShowsAuthLoadingStateForDebugLogin() async throws {
        let client = MockAPIClient()
        client.waitToResolveSignIn = true
        client.signInResult = AuthSessionState(
            accessToken: "signin-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-signin", email: "signin@example.com", provider: "gateway-local")
        )
        client.bootstrapPayload = .fixture(userID: "user-signin")
        let configuration = AppConfiguration(
            apiBaseURL: URL(string: "http://127.0.0.1:3001")!,
            supabaseURL: nil,
            supabaseAnonKey: nil,
            authDevToken: nil,
            debugAuthBootstrap: .init(mode: "login", email: "signin@example.com", password: "Password123", displayName: nil),
            notificationSnoozeMinutes: 15,
            inboxPollInterval: 30,
            heartbeatInterval: 60,
            idleThresholdSeconds: 120
        )

        let viewModel = AppViewModel(
            configuration: configuration,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        let bootstrapTask = Task { await viewModel.bootstrap() }
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.bootstrapState, .authenticating)
        XCTAssertEqual(viewModel.bootstrapStatusTitle, "正在登录")

        client.resolveSignIn()
        await bootstrapTask.value
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.bootstrapState, .ready)
    }

    func testBootstrapUsesStoredSessionAndStartsCollector() async throws {
        let client = MockAPIClient()
        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(userID: "user-1")
        client.stateTrendsPayload = .fixture
        client.reflectionOverviewPayload = .fixture

        let store = LocalStore(appSupportDirectory: makeTempDirectory())
        let collector = MockCollector()
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: collector,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.authSession, session)
        XCTAssertEqual(viewModel.dashboardSummary?.goalCount, 1)
        XCTAssertTrue(collector.startCallCount >= 1)
        XCTAssertTrue(client.fetchBootstrapCallCount >= 1)
        XCTAssertEqual(client.registerDeviceCallCount, 1)
        XCTAssertTrue(client.sendHeartbeatCallCount >= 1)
        viewModel.signOut()
    }

    func testBootstrapLoadsOpenClawRegistryVisibility() async throws {
        let client = MockAPIClient()
        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(userID: "user-1")
        client.stateTrendsPayload = .fixture
        client.reflectionOverviewPayload = .fixture
        client.openClawRegistryVisibilityPayload = OpenClawRegistryVisibilityPayload(
            source: "gateway-openclaw-registry-visibility",
            explanation: "registry",
            nativeRegistry: OpenClawNativeAgentsResponsePayload(
                source: "gateway-native-openclaw-registry",
                explanation: "native",
                totalAgents: 6,
                agents: [
                    OpenClawNativeAgentPayload(
                        agentId: "director-agent",
                        displayName: "Picard",
                        runtimeAgentId: "picard-runtime-agent",
                        worker: "director-agent-worker",
                        modelTarget: "director-agent",
                        soulFilePath: "openclaw/souls/picard.md",
                        supportedWorkflows: ["coach_front_state", "persona_routing"],
                        memoryScopes: ["preferences", "constraints"],
                        canFront: true,
                        canConsult: true,
                        canWritePlans: false,
                        canGovernMemory: false,
                        visibleInLocalRuntime: true
                    )
                ]
            ),
            externalRuntime: .init(
                configured: true,
                reachable: true,
                baseUrl: "http://127.0.0.1:8788",
                runtime: "openclaw-local-cluster",
                runtimeVersion: "structured-local-runtime-phase1",
                agentCount: 15,
                agents: [
                    OpenClawExternalRuntimeAgentPayload(
                        name: "director-agent",
                        worker: "director-agent-worker",
                        modelTarget: "director-agent",
                        skillCount: 2,
                        supportedWorkflows: ["coach_front_state", "persona_routing"]
                    )
                ],
                matchedAgentIds: ["director-agent"],
                missingInExternal: [],
                unknownExternalAgents: ["chief-agent"],
                error: nil
            )
        )

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertTrue(client.fetchOpenClawRegistryVisibilityCallCount >= 1)
        XCTAssertEqual(viewModel.openClawRegistryVisibility?.nativeRegistry.totalAgents, 6)
        XCTAssertEqual(viewModel.openClawRegistryVisibility?.externalRuntime.matchedAgentIds, ["director-agent"])
        XCTAssertEqual(viewModel.openClawRegistryVisibility?.externalRuntime.unknownExternalAgents, ["chief-agent"])
    }

    func testOpenClawRegistryStatusUsesGoodToneWhenExternalRuntimeAligned() {
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: MockAPIClient(),
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )
        viewModel.openClawRegistryVisibility = OpenClawRegistryVisibilityPayload(
            source: "gateway-openclaw-registry-visibility",
            explanation: "registry",
            nativeRegistry: OpenClawNativeAgentsResponsePayload(
                source: "gateway-native-openclaw-registry",
                explanation: "native",
                totalAgents: 6,
                agents: []
            ),
            externalRuntime: .init(
                configured: true,
                reachable: true,
                baseUrl: "http://127.0.0.1:8788",
                runtime: "openclaw-local-cluster",
                runtimeVersion: "structured-local-runtime-phase1",
                agentCount: 15,
                agents: [],
                matchedAgentIds: ["director-agent", "companion-agent", "analyst-agent", "balance-agent", "life-secretary-agent", "memory-governor-agent"],
                missingInExternal: [],
                unknownExternalAgents: ["chief-agent"],
                error: nil
            )
        )

        XCTAssertEqual(viewModel.openClawRegistryStatusTone, .good)
        XCTAssertEqual(viewModel.openClawRegistryStatusTitle, "OpenClaw Registry 已对齐")
        XCTAssertTrue(viewModel.openClawRegistryStatusMessage.contains("openclaw-local-cluster"))
        XCTAssertTrue(viewModel.openClawRegistryStatusMessage.contains("6"))
        XCTAssertEqual(viewModel.openClawRuntimeDisplay, "openclaw-local-cluster · structured-local-runtime-phase1")
        XCTAssertEqual(viewModel.openClawExternalAgentCount, 15)
    }

    func testOpenClawRegistryStatusEscalatesWhenExternalRuntimeMissingOrUnreachable() {
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: MockAPIClient(),
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )
        viewModel.openClawRegistryVisibility = OpenClawRegistryVisibilityPayload(
            source: "gateway-openclaw-registry-visibility",
            explanation: "registry",
            nativeRegistry: OpenClawNativeAgentsResponsePayload(
                source: "gateway-native-openclaw-registry",
                explanation: "native",
                totalAgents: 6,
                agents: []
            ),
            externalRuntime: .init(
                configured: true,
                reachable: false,
                baseUrl: "http://127.0.0.1:8788",
                runtime: nil,
                runtimeVersion: nil,
                agentCount: 0,
                agents: [],
                matchedAgentIds: [],
                missingInExternal: ["director-agent", "companion-agent"],
                unknownExternalAgents: [],
                error: "connection refused"
            )
        )

        XCTAssertEqual(viewModel.openClawRegistryStatusTone, .danger)
        XCTAssertEqual(viewModel.openClawRegistryStatusTitle, "OpenClaw Registry 不可达")
        XCTAssertTrue(viewModel.openClawRegistryStatusMessage.contains("connection refused"))
        XCTAssertTrue(viewModel.openClawRegistryStatusMessage.contains("127.0.0.1:8788"))
        XCTAssertTrue(viewModel.openClawRegistryStatusMessage.contains("请检查 OpenClaw runtime / Registry 是否在线"))
    }

    func testOpenClawRegistryStatusPrefersHealthSummaryAttentionSignal() {
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: MockAPIClient(),
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )
        viewModel.openClawRegistryVisibility = OpenClawRegistryVisibilityPayload(
            source: "gateway-openclaw-registry-visibility",
            explanation: "registry",
            nativeRegistry: OpenClawNativeAgentsResponsePayload(
                source: "gateway-native-openclaw-registry",
                explanation: "native",
                totalAgents: 6,
                agents: []
            ),
            externalRuntime: .init(
                healthStatus: "attention",
                healthReasonCodes: ["workflow_execution_probe_mismatch"],
                healthIssueCounts: .init(
                    missingPersonaCount: 0,
                    contractMismatchCount: 0,
                    runtimeContractMismatchCount: 0,
                    workflowContractMismatchCount: 0,
                    workflowResponseContractMismatchCount: 0,
                    workflowExecutionContractMismatchCount: 0,
                    workflowExecutionProbeMismatchCount: 1,
                    unknownExternalAgentCount: 0,
                    totalIssueCount: 1
                ),
                configured: true,
                reachable: true,
                baseUrl: "http://127.0.0.1:8788",
                runtime: "openclaw-local-cluster",
                runtimeVersion: "structured-local-runtime-phase1",
                agentCount: 15,
                agents: [],
                matchedAgentIds: ["director-agent", "companion-agent", "analyst-agent", "balance-agent", "life-secretary-agent", "memory-governor-agent"],
                missingInExternal: [],
                unknownExternalAgents: ["chief-agent"],
                error: nil
            )
        )

        XCTAssertEqual(viewModel.openClawRegistryStatusTone, .warning)
        XCTAssertEqual(viewModel.openClawRegistryStatusTitle, "OpenClaw Registry 需要检查")
        XCTAssertEqual(viewModel.openClawRegistryIssueSummary, "1 个问题")
        XCTAssertEqual(viewModel.openClawRegistryReasonSummary, "workflow_execution_probe_mismatch")
        XCTAssertTrue(viewModel.openClawRegistryStatusMessage.contains("1 个问题"))
        XCTAssertTrue(viewModel.openClawRegistryStatusMessage.contains("workflow_execution_probe_mismatch"))
    }

    func testOpenClawRegistryContractSummaryLinesExposeMismatchFamilies() {
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: MockAPIClient(),
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )
        viewModel.openClawRegistryVisibility = OpenClawRegistryVisibilityPayload(
            source: "gateway-openclaw-registry-visibility",
            explanation: "registry",
            nativeRegistry: OpenClawNativeAgentsResponsePayload(
                source: "gateway-native-openclaw-registry",
                explanation: "native",
                totalAgents: 6,
                agents: []
            ),
            externalRuntime: .init(
                healthStatus: "attention",
                healthReasonCodes: ["workflow_execution_probe_mismatch", "workflow_response_contract_mismatch"],
                healthIssueCounts: .init(
                    missingPersonaCount: 0,
                    contractMismatchCount: 1,
                    runtimeContractMismatchCount: 1,
                    workflowContractMismatchCount: 1,
                    workflowResponseContractMismatchCount: 1,
                    workflowExecutionContractMismatchCount: 1,
                    workflowExecutionProbeMismatchCount: 1,
                    unknownExternalAgentCount: 1,
                    totalIssueCount: 6
                ),
                configured: true,
                reachable: true,
                baseUrl: "http://127.0.0.1:8788",
                runtime: "openclaw-local-cluster",
                runtimeVersion: "structured-local-runtime-phase1",
                responseMode: "legacy",
                executeEndpoints: ["/v1/tasks/execute"],
                agentCount: 15,
                agents: [],
                matchedAgentIds: ["director-agent"],
                missingInExternal: [],
                contractMismatches: [
                    .init(agentId: "director-agent", mismatchFields: ["supportedWorkflows", "canConsult"])
                ],
                runtimeContractMismatches: ["responseMode"],
                workflowContractMismatches: [
                    .init(workflow: "coach_conversation_full", missingRequiredContextFields: ["frontAgent", "userText"])
                ],
                workflowResponseContractMismatches: [
                    .init(workflow: "coach_conversation_full", missingRequiredParsedFields: ["fastResponse"])
                ],
                workflowExecutionContractMismatches: [
                    .init(
                        workflow: "plan_adjustment",
                        missingRequiredMetadataFields: ["authorityApply"],
                        missingMemoryFetchFields: [],
                        missingAuthorityApplyFields: ["status"]
                    )
                ],
                workflowExecutionProbeMismatches: [
                    .init(
                        workflow: "memory_governance",
                        target: "memory-governor-agent",
                        statusCode: 500,
                        missingRequiredMetadataFields: ["authorityApply"],
                        missingMemoryFetchFields: [],
                        missingAuthorityApplyFields: ["status"],
                        error: "Probe returned HTTP 500."
                    )
                ],
                unknownExternalAgents: ["chief-agent"],
                error: nil
            )
        )

        XCTAssertTrue(viewModel.openClawRegistryContractSummaryLines.contains(where: { $0.contains("director-agent") }))
        XCTAssertTrue(viewModel.openClawRegistryContractSummaryLines.contains(where: { $0.contains("coach_conversation_full") }))
        XCTAssertTrue(viewModel.openClawRegistryContractSummaryLines.contains(where: { $0.contains("plan_adjustment") }))
        XCTAssertTrue(viewModel.openClawRegistryContractSummaryLines.contains(where: { $0.contains("memory_governance") }))
    }

    func testBootstrapShowsOperationalAlertWhenOpenClawRegistryBecomesUnreachable() async throws {
        let client = MockAPIClient()
        let presenter = MockAuthReminderPresenter()
        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(userID: "user-1")
        client.stateTrendsPayload = .fixture
        client.reflectionOverviewPayload = .fixture
        client.openClawRegistryVisibilityPayload = OpenClawRegistryVisibilityPayload(
            source: "gateway-openclaw-registry-visibility",
            explanation: "registry",
            nativeRegistry: OpenClawNativeAgentsResponsePayload(
                source: "gateway-native-openclaw-registry",
                explanation: "native",
                totalAgents: 6,
                agents: []
            ),
            externalRuntime: .init(
                configured: true,
                reachable: false,
                baseUrl: "http://127.0.0.1:8788",
                runtime: nil,
                runtimeVersion: nil,
                agentCount: 0,
                agents: [],
                matchedAgentIds: [],
                missingInExternal: ["director-agent"],
                unknownExternalAgents: [],
                error: "connection refused"
            )
        )

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            reminderPresenter: presenter,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))
        XCTAssertEqual(presenter.operationalAlerts.count, 1)
        XCTAssertEqual(presenter.operationalAlerts.first?.title, "OpenClaw Registry 不可达")
        XCTAssertTrue(
            presenter.operationalAlerts.first?.message.contains("请检查 OpenClaw runtime / Registry 是否在线") == true
        )

        await viewModel.syncNow()
        try? await Task.sleep(for: .milliseconds(20))
        XCTAssertEqual(presenter.operationalAlerts.count, 1)

        client.openClawRegistryVisibilityPayload = OpenClawRegistryVisibilityPayload(
            source: "gateway-openclaw-registry-visibility",
            explanation: "registry",
            nativeRegistry: OpenClawNativeAgentsResponsePayload(
                source: "gateway-native-openclaw-registry",
                explanation: "native",
                totalAgents: 6,
                agents: []
            ),
            externalRuntime: .init(
                configured: true,
                reachable: true,
                baseUrl: "http://127.0.0.1:8788",
                runtime: "openclaw-local-cluster",
                runtimeVersion: "structured-local-runtime-phase1",
                agentCount: 15,
                agents: [],
                matchedAgentIds: ["director-agent"],
                missingInExternal: [],
                unknownExternalAgents: [],
                error: nil
            )
        )
        await viewModel.syncNow()
        try? await Task.sleep(for: .milliseconds(20))
        XCTAssertEqual(presenter.operationalAlerts.count, 1)

        client.openClawRegistryVisibilityPayload = OpenClawRegistryVisibilityPayload(
            source: "gateway-openclaw-registry-visibility",
            explanation: "registry",
            nativeRegistry: OpenClawNativeAgentsResponsePayload(
                source: "gateway-native-openclaw-registry",
                explanation: "native",
                totalAgents: 6,
                agents: []
            ),
            externalRuntime: .init(
                configured: true,
                reachable: false,
                baseUrl: "http://127.0.0.1:8788",
                runtime: nil,
                runtimeVersion: nil,
                agentCount: 0,
                agents: [],
                matchedAgentIds: [],
                missingInExternal: ["director-agent"],
                unknownExternalAgents: [],
                error: "connection refused again"
            )
        )
        await viewModel.syncNow()
        try? await Task.sleep(for: .milliseconds(20))
        XCTAssertEqual(presenter.operationalAlerts.count, 2)
    }

    func testBootstrapUsesDebugRegisterFlowWhenConfigured() async throws {
        let client = MockAPIClient()
        let registeredSession = AuthSessionState(
            accessToken: "registered-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-register", email: "register@example.com", provider: "gateway-local")
        )
        client.registerResult = registeredSession
        client.bootstrapPayload = .fixture(userID: "user-register")
        client.stateTrendsPayload = .fixture
        client.reflectionOverviewPayload = .fixture

        let store = LocalStore(appSupportDirectory: makeTempDirectory())
        let collector = MockCollector()
        let configuration = AppConfiguration(
            apiBaseURL: URL(string: "http://127.0.0.1:3001")!,
            supabaseURL: nil,
            supabaseAnonKey: nil,
            authDevToken: nil,
            debugAuthBootstrap: .init(mode: "register", email: "register@example.com", password: "Password123", displayName: "Register User"),
            notificationSnoozeMinutes: 15,
            inboxPollInterval: 30,
            heartbeatInterval: 60,
            idleThresholdSeconds: 120
        )
        let viewModel = AppViewModel(
            configuration: configuration,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: collector,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(client.registerCallCount, 1)
        XCTAssertEqual(client.lastRegisteredEmail, "register@example.com")
        XCTAssertEqual(viewModel.authSession?.accessToken, "registered-token")
        XCTAssertEqual(viewModel.dashboardSummary?.goalCount, 1)
        viewModel.signOut()
    }

    func testBootstrapDoesNotStartCollectorWhenCollectorDisabled() async throws {
        let client = MockAPIClient()
        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(userID: "user-1")
        client.stateTrendsPayload = .fixture
        client.reflectionOverviewPayload = .fixture

        let store = LocalStore(appSupportDirectory: makeTempDirectory())
        let collector = MockCollector()
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: collector,
            collectorEnabled: false,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(collector.startCallCount, 0)
        viewModel.signOut()
    }

    func testBootstrapUsesInboxOnlyRefreshWhenReminderPollingOnlyEnabled() async throws {
        let client = MockAPIClient()
        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.inboxOverviewPayload = .fixture(messages: [
            .init(id: "msg-1", title: "Take a break", message: "Walk two minutes.", channel: "desktop_local", status: "pending", createdAt: "2026-03-20T00:00:00.000Z")
        ])

        let store = LocalStore(appSupportDirectory: makeTempDirectory())
        let presenter = MockAuthReminderPresenter()
        let collector = MockCollector()
        let configuration = AppConfiguration(
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
            reminderPollingOnly: true
        )
        let viewModel = AppViewModel(
            configuration: configuration,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: collector,
            reminderPresenter: presenter,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertGreaterThanOrEqual(client.fetchInboxOverviewCallCount, 1)
        XCTAssertEqual(client.fetchBootstrapCallCount, 0)
        XCTAssertEqual(client.fetchStateTrendsCallCount, 0)
        XCTAssertEqual(client.fetchReflectionOverviewCallCount, 0)
        XCTAssertEqual(viewModel.pendingReminderCount, 1)
        XCTAssertEqual(presenter.shownMessageIDs, ["msg-1"])
        viewModel.signOut()
    }

    func testDesktopCollectionStatusExplainsDisabledCollector() {
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: MockAPIClient(),
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            collectorEnabled: false,
            diagnostics: PermissionsDiagnostics(
                notificationAuthorizationState: .allowed,
                notificationStatusDescription: "Notifications allowed",
                accessibilityGranted: true
            ),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        XCTAssertEqual(viewModel.desktopCollectionStatusTitle, "桌面采集已关闭")
        XCTAssertEqual(viewModel.desktopCollectionStatusDetail, "当前构建关闭了桌面信号采集。登录、同步和提醒功能仍可使用。")
    }

    func testPermissionHelpExplainsDegradedModeWhenNotificationsDeniedAndAccessibilityMissing() {
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: MockAPIClient(),
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            diagnostics: PermissionsDiagnostics(
                notificationAuthorizationState: .denied,
                notificationStatusDescription: "Notifications denied",
                accessibilityGranted: false
            ),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        XCTAssertEqual(viewModel.notificationPermissionHelpText, "通知已在 macOS 设置中被禁用；提醒仍会在 MindAnchor 内显示。")
        XCTAssertEqual(viewModel.desktopCollectionStatusTitle, "桌面采集为基础模式")
        XCTAssertEqual(viewModel.desktopCollectionStatusDetail, "idle、lock/unlock 和 app-switch 信号仍可继续；依赖 Accessibility 的窗口上下文需授权后才可用。")
    }

    func testTodayOperationalSummaryUsesAssessmentActionAndPendingReminderCount() async throws {
        let client = MockAPIClient()
        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(
            userID: "user-1",
            messages: [
                .init(
                    id: "msg-1",
                    title: "Take a break",
                    message: "Walk for two minutes.",
                    channel: "desktop_local",
                    status: "pending",
                    createdAt: "2026-03-20T00:00:00.000Z"
                )
            ]
        )
        let presenter = MockAuthReminderPresenter()

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            reminderPresenter: presenter,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        XCTAssertEqual(viewModel.todayOperationalHeadline, "Focused")
        XCTAssertEqual(viewModel.todaySuggestedActionSummary, "Continue")
        XCTAssertEqual(viewModel.todayReminderSummary, "有 1 条待处理提醒需要查看。")
    }

    func testDiagnosticsExportWritesSnapshotAndUpdatesSupportStatus() async throws {
        let client = MockAPIClient()
        let session = AuthSessionState(
            accessToken: "stored-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(userID: "user-1")
        let presenter = MockAuthReminderPresenter()

        let localStore = LocalStore(appSupportDirectory: makeTempDirectory())
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: localStore,
            deviceProfile: .fixture,
            collector: MockCollector(),
            reminderPresenter: presenter,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))

        let exportURL = viewModel.exportDiagnosticsSnapshot()

        XCTAssertNotNil(exportURL)
        XCTAssertEqual(viewModel.supportExportStatusTitle, "诊断包已准备好")
        XCTAssertTrue(viewModel.supportExportStatusMessage.contains("mindanchor-diagnostics-"))
        XCTAssertEqual(localStore.state.lastDiagnosticsExportPath, exportURL?.path)
        XCTAssertNotNil(localStore.state.lastDiagnosticsExportAt)
        if let exportURL {
            XCTAssertTrue(FileManager.default.fileExists(atPath: exportURL.path))
        }
    }
}

private final class MockAPIClient: MindAnchorAPIProviding, @unchecked Sendable {
    var storedSession: AuthSessionState?
    var registerResult: AuthSessionState?
    var signInResult: AuthSessionState?
    var bootstrapPayload: ClientBootstrapPayload = .fixture(userID: "user-1")
    var inboxOverviewPayload: InboxOverviewPayload = .fixture(messages: [])
    var stateTrendsPayload: StateTrendsPayload = .fixture
    var reflectionOverviewPayload: ReflectionOverviewPayload = .fixture
    var coachFrontAgentPayload: CoachFrontAgentPayload = .defaultAuto
    var coachProposalsPayload: [JarvisProposalPayload] = []
    var coachMemoryPayload: [DataMemoryPayload] = []
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

    var fetchBootstrapCallCount = 0
    var fetchInboxOverviewCallCount = 0
    var fetchStateTrendsCallCount = 0
    var fetchReflectionOverviewCallCount = 0
    var fetchOpenClawRegistryVisibilityCallCount = 0
    var registerDeviceCallCount = 0
    var sendHeartbeatCallCount = 0
    var registerCallCount = 0
    var signInCallCount = 0
    var lastRegisteredEmail: String?
    var fetchBootstrapError: Error?
    var waitToResolveFetchBootstrap = false
    var waitToResolveSignIn = false

    private var fetchBootstrapContinuation: CheckedContinuation<ClientBootstrapPayload, Error>?
    private var signInContinuation: CheckedContinuation<AuthSessionState, Error>?

    func loadStoredSession() -> AuthSessionState? { storedSession }
    func storeSession(_ authSession: AuthSessionState) throws { storedSession = authSession }
    func clearSession() { storedSession = nil }

    func signIn(email: String, password: String) async throws -> AuthSessionState {
        signInCallCount += 1
        if waitToResolveSignIn {
            return try await withCheckedThrowingContinuation { continuation in
                signInContinuation = continuation
            }
        }
        return signInResult ?? AuthSessionState(
            accessToken: "signin-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-signin", email: email, provider: "gateway-local")
        )
    }

    func register(email: String, password: String, displayName: String?) async throws -> AuthSessionState {
        registerCallCount += 1
        lastRegisteredEmail = email
        return registerResult ?? AuthSessionState(
            accessToken: "register-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-register", email: email, provider: "gateway-local")
        )
    }

    func fetchMe(token: String) async throws -> MePayload {
        MePayload(authenticated: true, user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local"))
    }

    func fetchBootstrap(token: String) async throws -> ClientBootstrapPayload {
        fetchBootstrapCallCount += 1
        if let fetchBootstrapError {
            throw fetchBootstrapError
        }
        if waitToResolveFetchBootstrap {
            return try await withCheckedThrowingContinuation { continuation in
                fetchBootstrapContinuation = continuation
            }
        }
        return bootstrapPayload
    }

    func fetchCoachFrontAgent(token: String) async throws -> CoachFrontAgentPayload {
        coachFrontAgentPayload
    }

    func updateCoachFrontAgent(payload: CoachFrontAgentPayload, token: String) async throws -> CoachFrontAgentPayload {
        coachFrontAgentPayload = payload
        return payload
    }

    func fetchCoachProposals(token: String) async throws -> [JarvisProposalPayload] {
        coachProposalsPayload
    }

    func fetchCoachMemory(token: String) async throws -> [DataMemoryPayload] {
        coachMemoryPayload
    }

    func fetchOpenClawRegistryVisibility(token: String) async throws -> OpenClawRegistryVisibilityPayload {
        fetchOpenClawRegistryVisibilityCallCount += 1
        return openClawRegistryVisibilityPayload
    }

    func approveCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload {
        if let proposal = coachProposalsPayload.first(where: { $0.id == proposalID }) {
            return proposal
        }
        throw MockFailure.gatewayUnavailable
    }

    func rejectCoachProposal(_ proposalID: String, token: String) async throws -> JarvisProposalPayload {
        if let proposal = coachProposalsPayload.first(where: { $0.id == proposalID }) {
            return proposal
        }
        throw MockFailure.gatewayUnavailable
    }

    func deleteCoachMemory(_ memoryID: String, token: String) async throws -> DataMemoryPayload {
        if let memory = coachMemoryPayload.first(where: { $0.memoryId == memoryID }) {
            return memory
        }
        throw MockFailure.gatewayUnavailable
    }

    func blockCoachMemoryRecall(_ memoryID: String, token: String) async throws -> DataMemoryPayload {
        if let memory = coachMemoryPayload.first(where: { $0.memoryId == memoryID }) {
            return memory
        }
        throw MockFailure.gatewayUnavailable
    }

    func fetchInboxOverview(token: String) async throws -> InboxOverviewPayload {
        fetchInboxOverviewCallCount += 1
        return inboxOverviewPayload
    }

    func fetchStateTrends(token: String, userID: String) async throws -> StateTrendsPayload {
        fetchStateTrendsCallCount += 1
        return stateTrendsPayload
    }

    func fetchReflectionOverview(token: String, userID: String) async throws -> ReflectionOverviewPayload {
        fetchReflectionOverviewCallCount += 1
        return reflectionOverviewPayload
    }

    func registerDevice(profile: DesktopDeviceProfile, token: String, userID: String) async throws -> RegisteredEdgeDevice {
        registerDeviceCallCount += 1
        return RegisteredEdgeDevice(id: "device-1", userId: userID, deviceId: profile.deviceID, label: profile.label, deviceType: "desktop", platform: profile.platform, capabilities: profile.capabilities, status: "online")
    }

    func sendHeartbeat(profile: DesktopDeviceProfile, token: String, userID: String, queueDepth: Int) async throws -> RegisteredEdgeDevice {
        sendHeartbeatCallCount += 1
        return RegisteredEdgeDevice(id: "device-1", userId: userID, deviceId: profile.deviceID, label: profile.label, deviceType: "desktop", platform: profile.platform, capabilities: profile.capabilities, status: "online")
    }

    func uploadSignals(_ signals: [DesktopSignalEvent], token: String, userID: String) async throws {}

    func submitCheckIn(focusScore: Int, energyScore: Int, moodScore: Int, note: String, token: String, userID: String) async throws {}

    func acknowledgeInboxMessage(_ messageID: String, token: String) async throws -> InboxOverviewPayload.Message {
        InboxOverviewPayload.Message(id: messageID, title: "Ack", message: "Ack", channel: "desktop_local", status: "acknowledged", createdAt: "2026-03-20T00:00:00.000Z")
    }

    func resolveFetchBootstrap() {
        fetchBootstrapContinuation?.resume(returning: bootstrapPayload)
        fetchBootstrapContinuation = nil
        waitToResolveFetchBootstrap = false
    }

    func resolveSignIn() {
        let result = signInResult ?? AuthSessionState(
            accessToken: "signin-token",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-signin", email: "signin@example.com", provider: "gateway-local")
        )
        signInContinuation?.resume(returning: result)
        signInContinuation = nil
        waitToResolveSignIn = false
    }
}

private final class MockCollector: DesktopActivityCollecting {
    private(set) var startCallCount = 0

    func start() {
        startCallCount += 1
    }

    func stop() {}
}

private final class MockAuthReminderPresenter: ReminderPresenting {
    private(set) var shownMessageIDs: [String] = []
    private(set) var operationalAlerts: [(id: String, title: String, message: String, kind: String)] = []

    func configureCategories(language: AppLanguage) {}

    func show(message: InboxOverviewPayload.Message) async {
        shownMessageIDs.append(message.id)
    }

    func showOperationalAlert(id: String, title: String, message: String, kind: String) async {
        operationalAlerts.append((id: id, title: title, message: message, kind: kind))
    }
}

private func makeTempDirectory() -> URL {
    let url = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString, isDirectory: true)
    try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
    return url
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

private extension ClientBootstrapPayload {
    static func fixture(userID: String) -> ClientBootstrapPayload {
        fixture(userID: userID, messages: [])
    }

    static func fixture(userID: String, messages: [InboxOverviewPayload.Message]) -> ClientBootstrapPayload {
        ClientBootstrapPayload(
            me: MePayload(authenticated: true, user: AuthUser(id: userID, email: "\(userID)@example.com", provider: "gateway-local")),
            dashboard: DashboardSummaryPayload(
                goalCount: 1,
                taskCount: 1,
                openInterventions: 0,
                completionRate: 0,
                coachFrontAgent: nil,
                latestAssessment: .init(summary: "Focused", recommendedAction: "Continue", focusScore: 70, energyScore: 65, moodScore: 60),
                latestRecoveryPlan: nil,
                latestBehaviorConclusion: nil,
                goals: [.init(id: "goal-1", title: "Goal", status: "active")],
                tasks: [.init(id: "task-1", title: "Task", status: "todo", priority: "high", estimatedMinutes: 25)]
            ),
            inboxOverview: InboxOverviewPayload.fixture(messages: messages),
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

private extension InboxOverviewPayload {
    static func fixture(messages: [InboxOverviewPayload.Message]) -> InboxOverviewPayload {
        InboxOverviewPayload(
            messages: messages,
            pendingMessages: messages.filter { $0.status == "pending" },
            acknowledgedMessages: messages.filter { $0.status == "acknowledged" },
            channelCounts: []
        )
    }
}

private extension StateTrendsPayload {
    static let fixture = StateTrendsPayload(currentAssessment: nil, assessments: [], activeInputs: [])
}

private extension ReflectionOverviewPayload {
    static let fixture = ReflectionOverviewPayload(latestWeekly: nil, latestMonthly: nil, reports: [])
}

private enum MockFailure: LocalizedError {
    case gatewayUnavailable

    var errorDescription: String? {
        switch self {
        case .gatewayUnavailable:
            return "Gateway unreachable"
        }
    }
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
