import XCTest
import UserNotifications
@testable import MindAnchorCore

@MainActor
final class ReminderCenterTests: XCTestCase {
    func testReminderCenterSchedulesDesktopReminderWithShortTimeTrigger() async throws {
        let notificationCenter = MockUserNotificationCenter()
        let reminderCenter = ReminderCenter(notificationCenter: notificationCenter)

        await reminderCenter.show(message: .pendingDesktopReminder(id: "msg-trigger"))

        XCTAssertEqual(notificationCenter.addedRequests.count, 1)
        let request = try XCTUnwrap(notificationCenter.addedRequests.first)
        XCTAssertEqual(request.identifier, "msg-trigger")
        XCTAssertEqual(request.content.categoryIdentifier, ReminderCenter.categoryIdentifier)
        XCTAssertTrue(request.trigger is UNTimeIntervalNotificationTrigger)
    }

    func testReminderCenterSchedulesOperationalAlertWithShortTimeTrigger() async throws {
        let notificationCenter = MockUserNotificationCenter()
        let reminderCenter = ReminderCenter(notificationCenter: notificationCenter)

        await reminderCenter.showOperationalAlert(
            id: "runtime-alert",
            title: "OpenClaw Registry 不可达",
            message: "Runtime unreachable",
            kind: "openclaw_registry"
        )

        XCTAssertEqual(notificationCenter.addedRequests.count, 1)
        let request = try XCTUnwrap(notificationCenter.addedRequests.first)
        XCTAssertEqual(request.identifier, "runtime-alert")
        XCTAssertEqual(request.content.categoryIdentifier, ReminderCenter.runtimeAlertCategoryIdentifier)
        XCTAssertEqual(request.content.userInfo["notificationKind"] as? String, "openclaw_registry")
        XCTAssertTrue(request.trigger is UNTimeIntervalNotificationTrigger)
    }

    func testSnoozedPendingDesktopReminderDoesNotRefire() async throws {
        let client = MockReminderAPIClient()
        let session = AuthSessionState(
            accessToken: "token-1",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(messages: [.pendingDesktopReminder(id: "msg-1")])

        let store = LocalStore(appSupportDirectory: makeReminderTempDirectory())
        store.updateReminderMetadata { metadata in
            metadata.snoozedUntilByMessageID["msg-1"] = Date().addingTimeInterval(600)
        }
        let presenter = MockReminderPresenter()
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: MockCollector(),
            reminderPresenter: presenter,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))
        await viewModel.syncNow()

        XCTAssertEqual(presenter.shownMessageIDs, [])
    }

    func testAcknowledgingReminderClearsSeenAndSnoozedState() async throws {
        let client = MockReminderAPIClient()
        let session = AuthSessionState(
            accessToken: "token-1",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(messages: [])

        let store = LocalStore(appSupportDirectory: makeReminderTempDirectory())
        store.updateReminderMetadata { metadata in
            metadata.seenMessageIDs.insert("msg-ack")
            metadata.snoozedUntilByMessageID["msg-ack"] = Date().addingTimeInterval(600)
        }
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: MockCollector(),
            reminderPresenter: MockReminderPresenter(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))
        await viewModel.acknowledge(messageID: "msg-ack")

        XCTAssertEqual(client.lastAcknowledgedMessageID, "msg-ack")
        XCTAssertFalse(store.state.reminderMetadata.seenMessageIDs.contains("msg-ack"))
        XCTAssertNil(store.state.reminderMetadata.snoozedUntilByMessageID["msg-ack"])
    }

    func testSyncNowFlushesQueuedSignalsAndUpdatesDiagnostics() async throws {
        let client = MockReminderAPIClient()
        let session = AuthSessionState(
            accessToken: "token-1",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(messages: [.pendingDesktopReminder(id: "msg-1"), .pendingMobileReminder(id: "msg-2")])
        let inspector = MockNotificationInspector()
        inspector.requestIDs = ["msg-1"]

        let store = LocalStore(appSupportDirectory: makeReminderTempDirectory())
        store.enqueue(signal: DesktopSignalEvent(id: UUID(), eventType: "active_app", occurredAt: .now, payload: ["app": "Xcode"]))
        let presenter = MockReminderPresenter()
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: MockCollector(),
            reminderPresenter: presenter,
            notificationInspector: inspector,
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))
        store.enqueue(signal: DesktopSignalEvent(id: UUID(), eventType: "idle", occurredAt: .now, payload: ["idleSeconds": "240"]))
        await viewModel.syncNow()

        XCTAssertEqual(client.uploadSignalsCallCount, 2)
        XCTAssertTrue(store.state.queuedSignals.isEmpty)
        XCTAssertNotNil(store.state.lastSyncAt)
        XCTAssertNotNil(store.state.lastHeartbeatAt)
        XCTAssertEqual(presenter.shownMessageIDs, ["msg-1"])
        XCTAssertEqual(viewModel.systemNotificationRequestIDs, ["msg-1"])
        XCTAssertEqual(viewModel.runtimeStatus.queueLength, 0)
        XCTAssertEqual(viewModel.runtimeStatus.lastErrorMessage, nil)
    }

    func testAutomationAcknowledgeReminderUsesPendingMessageID() async throws {
        let client = MockReminderAPIClient()
        let session = AuthSessionState(
            accessToken: "token-1",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(messages: [.pendingDesktopReminder(id: "msg-ack")])

        let store = LocalStore(appSupportDirectory: makeReminderTempDirectory())
        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: store,
            deviceProfile: .fixture,
            collector: MockCollector(),
            reminderPresenter: MockReminderPresenter(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))
        viewModel.acknowledgeReminderForAutomation(messageID: "msg-ack")
        try? await Task.sleep(for: .milliseconds(50))

        XCTAssertEqual(client.lastAcknowledgedMessageID, "msg-ack")
    }

    func testInboxRefreshFailureKeepsLastSuccessfulInboxVisible() async throws {
        let client = MockReminderAPIClient()
        let session = AuthSessionState(
            accessToken: "token-1",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(messages: [.pendingDesktopReminder(id: "msg-1")])

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeReminderTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            reminderPresenter: MockReminderPresenter(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))
        XCTAssertEqual(viewModel.pendingReminderCount, 1)

        client.fetchBootstrapError = MockReminderFailure.inboxUnavailable
        await viewModel.syncNow()

        XCTAssertEqual(viewModel.pendingReminderCount, 1)
        XCTAssertEqual(viewModel.reminderStatusTitle, "显示最近一次同步的提醒")
        XCTAssertEqual(viewModel.reminderStatusMessage, "刷新提醒失败。MindAnchor 仍在显示最近一次成功获取的 inbox 快照。")
        XCTAssertEqual(viewModel.currentError, MockReminderFailure.inboxUnavailable.localizedDescription)
    }

    func testAcknowledgeFailureKeepsPendingReminderVisible() async throws {
        let client = MockReminderAPIClient()
        let session = AuthSessionState(
            accessToken: "token-1",
            refreshToken: nil,
            expiresAt: nil,
            user: AuthUser(id: "user-1", email: "user@example.com", provider: "gateway-local")
        )
        client.storedSession = session
        client.bootstrapPayload = .fixture(messages: [.pendingDesktopReminder(id: "msg-ack")])

        let viewModel = AppViewModel(
            configuration: .testValue,
            apiClient: client,
            localStore: LocalStore(appSupportDirectory: makeReminderTempDirectory()),
            deviceProfile: .fixture,
            collector: MockCollector(),
            reminderPresenter: MockReminderPresenter(),
            shouldConfigureSystemNotifications: false,
            shouldRefreshDiagnosticsOnBootstrap: false
        )

        await viewModel.bootstrap()
        try? await Task.sleep(for: .milliseconds(20))
        client.acknowledgeInboxError = MockReminderFailure.ackFailed

        await viewModel.acknowledge(messageID: "msg-ack")

        XCTAssertEqual(viewModel.pendingReminderCount, 1)
        XCTAssertEqual(viewModel.reminderStatusTitle, "提醒操作失败")
        XCTAssertEqual(viewModel.reminderStatusMessage, "MindAnchor 暂时无法确认这条提醒；它会继续保持待处理状态，方便你稍后重试。")
        XCTAssertEqual(viewModel.currentError, MockReminderFailure.ackFailed.localizedDescription)
    }
}

@MainActor
private final class MockUserNotificationCenter: UserNotificationCenterScheduling {
    private(set) var categories: Set<UNNotificationCategory> = []
    private(set) var addedRequests: [UNNotificationRequest] = []

    func setNotificationCategories(_ categories: Set<UNNotificationCategory>) {
        self.categories = categories
    }

    func add(_ request: UNNotificationRequest) async throws {
        addedRequests.append(request)
    }
}

private final class MockReminderAPIClient: MindAnchorAPIProviding, @unchecked Sendable {
    var storedSession: AuthSessionState?
    var bootstrapPayload: ClientBootstrapPayload = .fixture(messages: [])
    var stateTrendsPayload: StateTrendsPayload = .fixture
    var reflectionOverviewPayload: ReflectionOverviewPayload = .fixture
    var lastAcknowledgedMessageID: String?
    var uploadSignalsCallCount = 0
    var fetchBootstrapError: Error?
    var fetchInboxOverviewError: Error?
    var acknowledgeInboxError: Error?

    func loadStoredSession() -> AuthSessionState? { storedSession }
    func storeSession(_ authSession: AuthSessionState) throws { storedSession = authSession }
    func clearSession() { storedSession = nil }

    func signIn(email: String, password: String) async throws -> AuthSessionState { fatalError("unused") }
    func register(email: String, password: String, displayName: String?) async throws -> AuthSessionState { fatalError("unused") }
    func fetchMe(token: String) async throws -> MePayload { MePayload(authenticated: true, user: storedSession?.user) }
    func fetchBootstrap(token: String) async throws -> ClientBootstrapPayload {
        if let fetchBootstrapError {
            throw fetchBootstrapError
        }
        return bootstrapPayload
    }
    func fetchInboxOverview(token: String) async throws -> InboxOverviewPayload {
        if let fetchInboxOverviewError {
            throw fetchInboxOverviewError
        }
        return bootstrapPayload.inboxOverview
    }
    func fetchStateTrends(token: String, userID: String) async throws -> StateTrendsPayload { stateTrendsPayload }
    func fetchReflectionOverview(token: String, userID: String) async throws -> ReflectionOverviewPayload { reflectionOverviewPayload }

    func registerDevice(profile: DesktopDeviceProfile, token: String, userID: String) async throws -> RegisteredEdgeDevice {
        RegisteredEdgeDevice(id: "device-1", userId: userID, deviceId: profile.deviceID, label: profile.label, deviceType: "desktop", platform: profile.platform, capabilities: profile.capabilities, status: "online")
    }

    func sendHeartbeat(profile: DesktopDeviceProfile, token: String, userID: String, queueDepth: Int) async throws -> RegisteredEdgeDevice {
        RegisteredEdgeDevice(id: "device-1", userId: userID, deviceId: profile.deviceID, label: profile.label, deviceType: "desktop", platform: profile.platform, capabilities: profile.capabilities, status: "online")
    }

    func uploadSignals(_ signals: [DesktopSignalEvent], token: String, userID: String) async throws {
        uploadSignalsCallCount += 1
    }

    func submitCheckIn(focusScore: Int, energyScore: Int, moodScore: Int, note: String, token: String, userID: String) async throws {}

    func acknowledgeInboxMessage(_ messageID: String, token: String) async throws -> InboxOverviewPayload.Message {
        if let acknowledgeInboxError {
            throw acknowledgeInboxError
        }
        lastAcknowledgedMessageID = messageID
        return InboxOverviewPayload.Message(id: messageID, title: "Ack", message: "Ack", channel: "desktop_local", status: "acknowledged", createdAt: "2026-03-20T00:00:00.000Z")
    }
}

private final class MockReminderPresenter: ReminderPresenting {
    private(set) var shownMessageIDs: [String] = []

    func configureCategories(language: AppLanguage) {}

    func show(message: InboxOverviewPayload.Message) async {
        shownMessageIDs.append(message.id)
    }
}

private final class MockNotificationInspector: NotificationInspecting {
    var requestIDs: [String] = []

    func fetchSystemNotificationRequestIDs() async -> [String] {
        requestIDs
    }
}

private final class MockCollector: DesktopActivityCollecting {
    func start() {}
    func stop() {}
}

private func makeReminderTempDirectory() -> URL {
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

private extension InboxOverviewPayload.Message {
    static func pendingDesktopReminder(id: String) -> Self {
        .init(id: id, title: "Take a break", message: "Stand up and reset.", channel: "desktop_local", status: "pending", createdAt: "2026-03-20T00:00:00.000Z")
    }

    static func pendingMobileReminder(id: String) -> Self {
        .init(id: id, title: "Mobile reminder", message: "Phone only.", channel: "mobile_push", status: "pending", createdAt: "2026-03-20T00:00:00.000Z")
    }
}

private extension ClientBootstrapPayload {
    static func fixture(messages: [InboxOverviewPayload.Message]) -> ClientBootstrapPayload {
        ClientBootstrapPayload(
            me: MePayload(authenticated: true, user: AuthUser(id: "user-1", email: "user-1@example.com", provider: "gateway-local")),
            dashboard: DashboardSummaryPayload(
                goalCount: 1,
                taskCount: 1,
                openInterventions: 1,
                completionRate: 0.5,
                coachFrontAgent: nil,
                latestAssessment: .init(summary: "Focused", recommendedAction: "Continue", focusScore: 72, energyScore: 61, moodScore: 66),
                latestRecoveryPlan: .init(nextStep: "Walk for two minutes"),
                latestBehaviorConclusion: .init(summary: "Needs reset", suggestedAction: "Pause briefly", recommendedChannel: "desktop_local"),
                goals: [.init(id: "goal-1", title: "Goal", status: "active")],
                tasks: [.init(id: "task-1", title: "Task", status: "todo", priority: "high", estimatedMinutes: 25)]
            ),
            inboxOverview: InboxOverviewPayload(
                messages: messages,
                pendingMessages: messages.filter { $0.status == "pending" },
                acknowledgedMessages: messages.filter { $0.status == "acknowledged" },
                channelCounts: []
            ),
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

private extension StateTrendsPayload {
    static let fixture = StateTrendsPayload(currentAssessment: nil, assessments: [], activeInputs: [])
}

private extension ReflectionOverviewPayload {
    static let fixture = ReflectionOverviewPayload(latestWeekly: nil, latestMonthly: nil, reports: [])
}

private enum MockReminderFailure: LocalizedError {
    case inboxUnavailable
    case ackFailed

    var errorDescription: String? {
        switch self {
        case .inboxUnavailable:
            return "Inbox unavailable"
        case .ackFailed:
            return "Acknowledge failed"
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
        idleThresholdSeconds: 120
    )
}
