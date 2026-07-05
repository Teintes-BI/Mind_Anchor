import Foundation
import XCTest
@testable import MindAnchorCore

@MainActor
final class MacAutomationTests: XCTestCase {
    func testCloseMainWindowCommandReturnsHiddenSnapshot() throws {
        let statusBar = MockStatusBarActionPerformer()
        let windowState = MockMainWindowStateController(isVisible: true)
        let appState = MockAutomationAppState(
            selectedDestination: .today,
            pendingReminderCount: 2,
            isSignedInForAutomation: true,
            accountEmailForAutomation: "user@example.com",
            notificationStatusForAutomation: "Notifications allowed",
            systemNotificationRequestIDsForAutomation: ["msg-1", "msg-2"],
            currentErrorMessageForAutomation: nil,
            openClawRegistryStatusToneForAutomation: "good",
            openClawRegistryStatusTitleForAutomation: "OpenClaw aligned",
            openClawRegistryStatusMessageForAutomation: "All personas are aligned."
        )
        let controller = MacAutomationController(
            statusBarActions: statusBar,
            windowState: windowState,
            appState: appState
        )

        let response = try controller.handle(
            command: .init(id: "cmd-close", action: .closeMainWindow)
        )

        XCTAssertEqual(response.id, "cmd-close")
        XCTAssertTrue(response.ok)
        XCTAssertEqual(response.snapshot.mainWindowVisible, false)
        XCTAssertEqual(response.snapshot.selectedDestination, "today")
        XCTAssertEqual(response.snapshot.pendingReminderCount, 2)
        XCTAssertEqual(response.snapshot.isSignedIn, true)
        XCTAssertEqual(response.snapshot.accountEmail, "user@example.com")
        XCTAssertEqual(response.snapshot.notificationStatus, "Notifications allowed")
        XCTAssertEqual(response.snapshot.systemNotificationRequestIDs, ["msg-1", "msg-2"])
        XCTAssertNil(response.snapshot.currentError)
        XCTAssertNil(response.snapshot.userFacingCurrentError)
        XCTAssertEqual(response.snapshot.bootstrapStatusTitle, "Signed in")
        XCTAssertEqual(response.snapshot.bootstrapStatusMessage, "Dashboard is ready.")
        XCTAssertEqual(response.snapshot.connectionStatusTitle, "Connected")
        XCTAssertEqual(response.snapshot.connectionStatusDetail, "Gateway and local collector look healthy.")
        XCTAssertEqual(response.snapshot.openClawRegistryStatusTone, "good")
        XCTAssertEqual(response.snapshot.openClawRegistryStatusTitle, "OpenClaw aligned")
        XCTAssertEqual(response.snapshot.openClawRegistryStatusMessage, "All personas are aligned.")
        XCTAssertEqual(response.snapshot.coach?.lastAssistantExecutionTrail, ["Authority · Data · Deleted"])
        XCTAssertTrue(statusBar.performedActions.isEmpty)
    }

    func testStatusItemOpenWindowCommandTriggersStatusBarActionAndReturnsVisibleSnapshot() throws {
        let statusBar = MockStatusBarActionPerformer()
        let windowState = MockMainWindowStateController(isVisible: false)
        let appState = MockAutomationAppState(
            selectedDestination: .today,
            pendingReminderCount: 0,
            isSignedInForAutomation: false,
            accountEmailForAutomation: "anonymous@example.com",
            notificationStatusForAutomation: "Notifications not requested",
            systemNotificationRequestIDsForAutomation: [],
            currentErrorMessageForAutomation: "login required",
            userFacingCurrentErrorMessageForAutomation: "Please sign in again to continue.",
            bootstrapStatusTitleForAutomation: "Sign in required",
            bootstrapStatusMessageForAutomation: "Please sign in to load your workspace.",
            connectionStatusTitleForAutomation: "Attention needed",
            connectionStatusDetailForAutomation: "Sign in is required before syncing desktop data.",
            openClawRegistryStatusToneForAutomation: "warning",
            openClawRegistryStatusTitleForAutomation: "OpenClaw attention",
            openClawRegistryStatusMessageForAutomation: "Registry needs attention.",
            openClawRegistryIssueSummaryForAutomation: "1 issue",
            openClawRegistryReasonSummaryForAutomation: "workflow_execution_probe_mismatch",
            openClawRegistryContractSummaryLinesForAutomation: [
                "Runtime contract: responseMode",
                "Execute probe: memory_governance · memory-governor-agent · Probe returned HTTP 500."
            ]
        )
        let controller = MacAutomationController(
            statusBarActions: statusBar,
            windowState: windowState,
            appState: appState
        )

        let response = try controller.handle(
            command: .init(id: "cmd-open", action: .statusItemOpenMainWindow)
        )

        XCTAssertEqual(statusBar.performedActions, [.openMainWindow])
        XCTAssertEqual(response.snapshot.mainWindowVisible, true)
        XCTAssertEqual(response.snapshot.selectedDestination, "today")
        XCTAssertEqual(response.snapshot.isSignedIn, false)
        XCTAssertEqual(response.snapshot.accountEmail, "anonymous@example.com")
        XCTAssertEqual(response.snapshot.notificationStatus, "Notifications not requested")
        XCTAssertEqual(response.snapshot.systemNotificationRequestIDs, [])
        XCTAssertEqual(response.snapshot.currentError, "login required")
        XCTAssertEqual(response.snapshot.userFacingCurrentError, "Please sign in again to continue.")
        XCTAssertEqual(response.snapshot.bootstrapStatusTitle, "Sign in required")
        XCTAssertEqual(response.snapshot.bootstrapStatusMessage, "Please sign in to load your workspace.")
        XCTAssertEqual(response.snapshot.connectionStatusTitle, "Attention needed")
        XCTAssertEqual(response.snapshot.connectionStatusDetail, "Sign in is required before syncing desktop data.")
        XCTAssertEqual(response.snapshot.openClawRegistryStatusTone, "warning")
        XCTAssertEqual(response.snapshot.openClawRegistryStatusTitle, "OpenClaw attention")
        XCTAssertEqual(response.snapshot.openClawRegistryIssueSummary, "1 issue")
        XCTAssertEqual(response.snapshot.openClawRegistryReasonSummary, "workflow_execution_probe_mismatch")
        XCTAssertEqual(
            response.snapshot.openClawRegistryContractSummaryLines,
            [
                "Runtime contract: responseMode",
                "Execute probe: memory_governance · memory-governor-agent · Probe returned HTTP 500."
            ]
        )
    }

    func testCommandFileBridgeProcessesCommandAndWritesResponse() throws {
        let commandURL = makeTempFileURL(suffix: "command.json")
        let responseURL = makeTempFileURL(suffix: "response.json")
        let bridge = MacAutomationCommandFileBridge(
            commandURL: commandURL,
            responseURL: responseURL
        )
        let controller = MockMacAutomationCommandHandling()

        let command = MacAutomationCommand(id: "cmd-file", action: .snapshot)
        let commandData = try JSONEncoder().encode(command)
        try commandData.write(to: commandURL)

        try bridge.processPendingCommand(using: controller)

        let responseData = try Data(contentsOf: responseURL)
        let response = try JSONDecoder().decode(MacAutomationResponse.self, from: responseData)

        XCTAssertEqual(controller.handledCommands.map(\.id), ["cmd-file"])
        XCTAssertEqual(response.id, "cmd-file")
        XCTAssertTrue(response.ok)
        XCTAssertEqual(response.snapshot.selectedDestination, "today")
        XCTAssertEqual(response.snapshot.isSignedIn, true)
        XCTAssertEqual(response.snapshot.accountEmail, "automation@example.com")
        XCTAssertEqual(response.snapshot.notificationStatus, "Notifications allowed")
        XCTAssertEqual(response.snapshot.systemNotificationRequestIDs, ["msg-1"])
        XCTAssertNil(response.snapshot.currentError)
        XCTAssertEqual(response.snapshot.bootstrapStatusTitle, "Signed in")
        XCTAssertEqual(response.snapshot.bootstrapStatusMessage, "Dashboard is ready.")
        XCTAssertEqual(response.snapshot.connectionStatusTitle, "Connected")
        XCTAssertEqual(response.snapshot.connectionStatusDetail, "Gateway and local collector look healthy.")
        XCTAssertEqual(response.snapshot.openClawRegistryStatusTone, "danger")
        XCTAssertEqual(response.snapshot.openClawRegistryStatusTitle, "OpenClaw unreachable")
    }

    func testStatusItemSyncNowCommandTriggersSyncAction() throws {
        let statusBar = MockStatusBarActionPerformer()
        let windowState = MockMainWindowStateController(isVisible: false)
        let appState = MockAutomationAppState(
            selectedDestination: .today,
            pendingReminderCount: 0,
            isSignedInForAutomation: true,
            accountEmailForAutomation: "user@example.com",
            notificationStatusForAutomation: "Notifications allowed",
            systemNotificationRequestIDsForAutomation: [],
            currentErrorMessageForAutomation: nil,
            openClawRegistryStatusToneForAutomation: "good",
            openClawRegistryStatusTitleForAutomation: "OpenClaw aligned",
            openClawRegistryStatusMessageForAutomation: "All personas are aligned."
        )
        let controller = MacAutomationController(
            statusBarActions: statusBar,
            windowState: windowState,
            appState: appState
        )

        _ = try controller.handle(
            command: .init(id: "cmd-sync", action: .statusItemSyncNow)
        )

        XCTAssertEqual(statusBar.performedActions, [.syncNow])
        XCTAssertEqual(windowState.isMainWindowVisible, false)
    }

    func testAcknowledgeReminderCommandTriggersAppAckAction() throws {
        let statusBar = MockStatusBarActionPerformer()
        let windowState = MockMainWindowStateController(isVisible: true)
        let appState = MockAutomationAppState(
            selectedDestination: .reminders,
            pendingReminderCount: 1,
            isSignedInForAutomation: true,
            accountEmailForAutomation: "user@example.com",
            notificationStatusForAutomation: "Notifications allowed",
            systemNotificationRequestIDsForAutomation: ["msg-ack"],
            currentErrorMessageForAutomation: nil,
            openClawRegistryStatusToneForAutomation: "good",
            openClawRegistryStatusTitleForAutomation: "OpenClaw aligned",
            openClawRegistryStatusMessageForAutomation: "All personas are aligned."
        )
        let controller = MacAutomationController(
            statusBarActions: statusBar,
            windowState: windowState,
            appState: appState
        )

        let response = try controller.handle(
            command: .init(id: "cmd-ack", action: .acknowledgeReminder, messageID: "msg-ack")
        )

        XCTAssertEqual(appState.acknowledgedMessageIDs, ["msg-ack"])
        XCTAssertEqual(response.snapshot.selectedDestination, "reminders")
        XCTAssertEqual(response.snapshot.pendingReminderCount, 1)
        XCTAssertTrue(statusBar.performedActions.isEmpty)
    }

    func testOpenCoachAndCoachAutomationCommandsDelegateIntoAppState() throws {
        let statusBar = MockStatusBarActionPerformer()
        let windowState = MockMainWindowStateController(isVisible: true)
        let appState = MockAutomationAppState(
            selectedDestination: .today,
            pendingReminderCount: 0,
            isSignedInForAutomation: true,
            accountEmailForAutomation: "user@example.com",
            notificationStatusForAutomation: "Notifications allowed",
            systemNotificationRequestIDsForAutomation: [],
            currentErrorMessageForAutomation: nil,
            openClawRegistryStatusToneForAutomation: "good",
            openClawRegistryStatusTitleForAutomation: "OpenClaw aligned",
            openClawRegistryStatusMessageForAutomation: "All personas are aligned."
        )
        let controller = MacAutomationController(
            statusBarActions: statusBar,
            windowState: windowState,
            appState: appState
        )

        let openCoach = try controller.handle(
            command: .init(id: "cmd-coach", action: .openCoach)
        )
        _ = try controller.handle(
            command: .init(id: "cmd-draft", action: .setCoachDraftText, text: "Focus one thing.")
        )
        _ = try controller.handle(
            command: .init(id: "cmd-send", action: .sendCoachMessage)
        )
        _ = try controller.handle(
            command: .init(id: "cmd-helpful", action: .coachFeedbackHelpful, messageID: "message-1")
        )
        _ = try controller.handle(
            command: .init(id: "cmd-refresh", action: .refreshCoach)
        )
        _ = try controller.handle(
            command: .init(id: "cmd-revoke", action: .coachRevokeMemory, messageID: "memory-1")
        )

        XCTAssertEqual(openCoach.snapshot.selectedDestination, "coach")
        XCTAssertEqual(appState.selectedDestination, .coach)
        XCTAssertEqual(appState.coachDraftTextForAutomation, "Focus one thing.")
        XCTAssertEqual(appState.sendCoachConversationCallCount, 1)
        XCTAssertEqual(appState.submittedCoachFeedback.count, 1)
        XCTAssertEqual(appState.submittedCoachFeedback.first?.0, "message-1")
        XCTAssertEqual(appState.submittedCoachFeedback.first?.1, "helpful")
        XCTAssertEqual(appState.refreshCoachCallCount, 1)
        XCTAssertEqual(appState.revokedCoachMemoryIDs, ["memory-1"])
        XCTAssertTrue(statusBar.performedActions.isEmpty)
    }

    func testRefreshOpenClawRegistryCommandDelegatesIntoAppState() throws {
        let statusBar = MockStatusBarActionPerformer()
        let windowState = MockMainWindowStateController(isVisible: false)
        let appState = MockAutomationAppState(
            selectedDestination: .today,
            pendingReminderCount: 0,
            isSignedInForAutomation: true,
            accountEmailForAutomation: "user@example.com",
            notificationStatusForAutomation: "Notifications allowed",
            systemNotificationRequestIDsForAutomation: [],
            currentErrorMessageForAutomation: nil,
            openClawRegistryStatusToneForAutomation: "neutral",
            openClawRegistryStatusTitleForAutomation: "OpenClaw not loaded",
            openClawRegistryStatusMessageForAutomation: "Pending registry fetch."
        )
        let controller = MacAutomationController(
            statusBarActions: statusBar,
            windowState: windowState,
            appState: appState
        )

        let response = try controller.handle(
            command: .init(id: "cmd-registry", action: .refreshOpenClawRegistry)
        )

        XCTAssertEqual(appState.refreshOpenClawRegistryCallCount, 1)
        XCTAssertEqual(response.snapshot.selectedDestination, "today")
        XCTAssertFalse(response.snapshot.mainWindowVisible)
        XCTAssertTrue(statusBar.performedActions.isEmpty)
    }

    func testRequestNotificationPermissionCommandDelegatesIntoAppState() throws {
        let statusBar = MockStatusBarActionPerformer()
        let windowState = MockMainWindowStateController(isVisible: false)
        let appState = MockAutomationAppState(
            selectedDestination: .today,
            pendingReminderCount: 0,
            isSignedInForAutomation: true,
            accountEmailForAutomation: "user@example.com",
            notificationStatusForAutomation: "Notifications not requested",
            systemNotificationRequestIDsForAutomation: [],
            currentErrorMessageForAutomation: nil,
            openClawRegistryStatusToneForAutomation: "neutral",
            openClawRegistryStatusTitleForAutomation: "OpenClaw not loaded",
            openClawRegistryStatusMessageForAutomation: "Pending registry fetch."
        )
        let controller = MacAutomationController(
            statusBarActions: statusBar,
            windowState: windowState,
            appState: appState
        )

        let response = try controller.handle(
            command: .init(id: "cmd-request-notifications", action: .requestNotificationPermission)
        )

        XCTAssertEqual(appState.requestNotificationPermissionCallCount, 1)
        XCTAssertEqual(response.snapshot.notificationStatus, "Notifications not requested")
        XCTAssertTrue(statusBar.performedActions.isEmpty)
    }

    func testSnapshotPreservesCoachExecutionTrailFromAppState() throws {
        let statusBar = MockStatusBarActionPerformer()
        let windowState = MockMainWindowStateController(isVisible: true)
        let appState = MockAutomationAppState(
            selectedDestination: .coach,
            pendingReminderCount: 0,
            isSignedInForAutomation: true,
            accountEmailForAutomation: "user@example.com",
            notificationStatusForAutomation: "Notifications allowed",
            systemNotificationRequestIDsForAutomation: [],
            currentErrorMessageForAutomation: nil,
            openClawRegistryStatusToneForAutomation: "good",
            openClawRegistryStatusTitleForAutomation: "OpenClaw aligned",
            openClawRegistryStatusMessageForAutomation: "All personas are aligned.",
            coachLastAssistantExecutionTrailForAutomation: [
                "官方 OpenClaw runtime · cluster",
                "Authority · Data · Deleted"
            ]
        )
        let controller = MacAutomationController(
            statusBarActions: statusBar,
            windowState: windowState,
            appState: appState
        )

        let response = try controller.handle(
            command: .init(id: "cmd-snapshot-coach-trail", action: .snapshot)
        )

        XCTAssertTrue(
            response.snapshot.coach?.lastAssistantExecutionTrail.contains(where: {
                $0.contains("官方 OpenClaw runtime") || $0.contains("Official OpenClaw runtime")
            }) == true
        )
    }

    func testServiceResolvesCommandAndResponseURLsFromEnvironmentOverrides() {
        let commandURL = makeTempFileURL(suffix: "override-command.json")
        let responseURL = makeTempFileURL(suffix: "override-response.json")
        let environment = [
            MacAutomationService.commandFileEnvironmentKey: commandURL.path,
            MacAutomationService.responseFileEnvironmentKey: responseURL.path,
        ]

        XCTAssertEqual(
            MacAutomationService.commandURL(environment: environment),
            commandURL
        )
        XCTAssertEqual(
            MacAutomationService.responseURL(environment: environment),
            responseURL
        )
    }

    func testServiceFallsBackToDefaultURLsWithoutOverrides() {
        XCTAssertEqual(
            MacAutomationService.commandURL(environment: [:]),
            MacAutomationService.defaultCommandURL
        )
        XCTAssertEqual(
            MacAutomationService.responseURL(environment: [:]),
            MacAutomationService.defaultResponseURL
        )
    }
}

@MainActor
private final class MockStatusBarActionPerformer: StatusBarActionPerforming {
    private(set) var performedActions: [StatusBarAutomationAction] = []

    func performAutomationAction(_ action: StatusBarAutomationAction) {
        performedActions.append(action)
    }
}

@MainActor
private final class MockMainWindowStateController: MainWindowStateControlling {
    private(set) var isMainWindowVisible: Bool

    init(isVisible: Bool) {
        self.isMainWindowVisible = isVisible
    }

    func hideMainWindow() {
        isMainWindowVisible = false
    }

    func showMainWindow() {
        isMainWindowVisible = true
    }
}

@MainActor
private final class MockAutomationAppState: AutomationAppStateProviding {
    var selectedDestination: AppDestination
    let pendingReminderCount: Int
    let isSignedInForAutomation: Bool
    let accountEmailForAutomation: String
    let notificationStatusForAutomation: String
    let systemNotificationRequestIDsForAutomation: [String]
    let currentErrorMessageForAutomation: String?
    let userFacingCurrentErrorMessageForAutomation: String?
    let bootstrapStatusTitleForAutomation: String
    let bootstrapStatusMessageForAutomation: String
    let connectionStatusTitleForAutomation: String
    let connectionStatusDetailForAutomation: String
    let openClawRegistryStatusToneForAutomation: String
    let openClawRegistryStatusTitleForAutomation: String
    let openClawRegistryStatusMessageForAutomation: String
    let openClawRegistryIssueSummaryForAutomation: String
    let openClawRegistryReasonSummaryForAutomation: String
    let openClawRegistryContractSummaryLinesForAutomation: [String]
    let coachExecutionTrailLinesForAutomation: [String]
    private(set) var acknowledgedMessageIDs: [String] = []
    private(set) var submittedCoachFeedback: [(String, String)] = []
    private(set) var revokedCoachMemoryIDs: [String] = []
    private(set) var refreshCoachCallCount = 0
    private(set) var refreshOpenClawRegistryCallCount = 0
    private(set) var requestNotificationPermissionCallCount = 0
    private(set) var sendCoachConversationCallCount = 0
    private(set) var coachDraftTextValue = ""

    init(
        selectedDestination: AppDestination,
        pendingReminderCount: Int,
        isSignedInForAutomation: Bool,
        accountEmailForAutomation: String,
        notificationStatusForAutomation: String,
        systemNotificationRequestIDsForAutomation: [String],
        currentErrorMessageForAutomation: String?,
        userFacingCurrentErrorMessageForAutomation: String? = nil,
        bootstrapStatusTitleForAutomation: String = "Signed in",
        bootstrapStatusMessageForAutomation: String = "Dashboard is ready.",
        connectionStatusTitleForAutomation: String = "Connected",
        connectionStatusDetailForAutomation: String = "Gateway and local collector look healthy.",
        openClawRegistryStatusToneForAutomation: String,
        openClawRegistryStatusTitleForAutomation: String,
        openClawRegistryStatusMessageForAutomation: String,
        openClawRegistryIssueSummaryForAutomation: String = "none",
        openClawRegistryReasonSummaryForAutomation: String = "none",
        openClawRegistryContractSummaryLinesForAutomation: [String] = [],
        coachLastAssistantExecutionTrailForAutomation: [String] = ["Authority · Data · Deleted"]
    ) {
        self.selectedDestination = selectedDestination
        self.pendingReminderCount = pendingReminderCount
        self.isSignedInForAutomation = isSignedInForAutomation
        self.accountEmailForAutomation = accountEmailForAutomation
        self.notificationStatusForAutomation = notificationStatusForAutomation
        self.systemNotificationRequestIDsForAutomation = systemNotificationRequestIDsForAutomation
        self.currentErrorMessageForAutomation = currentErrorMessageForAutomation
        self.userFacingCurrentErrorMessageForAutomation = userFacingCurrentErrorMessageForAutomation
        self.bootstrapStatusTitleForAutomation = bootstrapStatusTitleForAutomation
        self.bootstrapStatusMessageForAutomation = bootstrapStatusMessageForAutomation
        self.connectionStatusTitleForAutomation = connectionStatusTitleForAutomation
        self.connectionStatusDetailForAutomation = connectionStatusDetailForAutomation
        self.openClawRegistryStatusToneForAutomation = openClawRegistryStatusToneForAutomation
        self.openClawRegistryStatusTitleForAutomation = openClawRegistryStatusTitleForAutomation
        self.openClawRegistryStatusMessageForAutomation = openClawRegistryStatusMessageForAutomation
        self.openClawRegistryIssueSummaryForAutomation = openClawRegistryIssueSummaryForAutomation
        self.openClawRegistryReasonSummaryForAutomation = openClawRegistryReasonSummaryForAutomation
        self.openClawRegistryContractSummaryLinesForAutomation = openClawRegistryContractSummaryLinesForAutomation
        self.coachExecutionTrailLinesForAutomation = coachLastAssistantExecutionTrailForAutomation
    }

    func acknowledgeReminderForAutomation(messageID: String?) {
        guard let messageID else { return }
        acknowledgedMessageIDs.append(messageID)
    }

    func requestNotificationPermissionForAutomation() {
        requestNotificationPermissionCallCount += 1
    }

    func openCoachForAutomation() {
        selectedDestination = .coach
    }

    var coachDraftTextForAutomation: String { coachDraftTextValue }
    var coachConversationSessionCountForAutomation: Int { 0 }
    var coachConversationMessageCountForAutomation: Int { 0 }
    var coachLastUserMessageTextForAutomation: String? { nil }
    var coachLastAssistantStatusForAutomation: String? { nil }
    var coachLastAssistantFastResponseForAutomation: String? { nil }
    var coachLastAssistantFullResponseForAutomation: String? { nil }
    var coachLastAssistantExecutionTrailForAutomation: [String] { coachExecutionTrailLinesForAutomation }
    var coachLastFeedbackLabelForAutomation: String? { nil }
    var coachActiveMemoryCountForAutomation: Int { 0 }
    var coachRevokedMemoryCountForAutomation: Int { revokedCoachMemoryIDs.count }

    func setCoachDraftTextForAutomation(_ text: String) {
        selectedDestination = .coach
        coachDraftTextValue = text
    }

    func sendCoachConversationForAutomation() {
        selectedDestination = .coach
        sendCoachConversationCallCount += 1
    }

    func submitCoachFeedbackForAutomation(messageID: String?, label: String) {
        guard let messageID else { return }
        submittedCoachFeedback.append((messageID, label))
    }

    func revokeCoachConversationMemoryForAutomation(memoryID: String?) {
        guard let memoryID else { return }
        revokedCoachMemoryIDs.append(memoryID)
    }

    func refreshCoachConversationForAutomation() {
        refreshCoachCallCount += 1
    }

    func refreshOpenClawRegistryForAutomation() {
        refreshOpenClawRegistryCallCount += 1
    }
}

@MainActor
private final class MockMacAutomationCommandHandling: MacAutomationCommandHandling {
    private(set) var handledCommands: [MacAutomationCommand] = []

    func handle(command: MacAutomationCommand) throws -> MacAutomationResponse {
        handledCommands.append(command)
        return MacAutomationResponse(
            id: command.id,
            ok: true,
            snapshot: .init(
                mainWindowVisible: true,
                selectedDestination: "today",
                pendingReminderCount: 0,
                isSignedIn: true,
                accountEmail: "automation@example.com",
                notificationStatus: "Notifications allowed",
                systemNotificationRequestIDs: ["msg-1"],
                currentError: nil,
                userFacingCurrentError: nil,
                bootstrapStatusTitle: "Signed in",
                bootstrapStatusMessage: "Dashboard is ready.",
                connectionStatusTitle: "Connected",
                connectionStatusDetail: "Gateway and local collector look healthy.",
                openClawRegistryStatusTone: "danger",
                openClawRegistryStatusTitle: "OpenClaw unreachable",
                openClawRegistryStatusMessage: "The external runtime is unavailable.",
                openClawRegistryIssueSummary: "none",
                openClawRegistryReasonSummary: "none",
                openClawRegistryContractSummaryLines: [],
                coach: .init(
                    draftText: "",
                    sessionCount: 0,
                    messageCount: 0,
                    lastUserMessageText: nil,
                    lastAssistantStatus: nil,
                    lastAssistantFastResponse: nil,
                    lastAssistantFullResponse: nil,
                    lastAssistantExecutionTrail: [],
                    lastFeedbackLabel: nil,
                    activeMemoryCount: 0,
                    revokedMemoryCount: 0
                )
            )
        )
    }
}

private func makeTempFileURL(suffix: String) -> URL {
    FileManager.default.temporaryDirectory
        .appendingPathComponent(UUID().uuidString)
        .appendingPathExtension(suffix)
}
