import AppKit
import Foundation

enum StatusBarAutomationAction: String, Codable, Equatable {
    case openMainWindow = "open_main_window"
    case openReminders = "open_reminders"
    case syncNow = "sync_now"
}

@MainActor
protocol StatusBarActionPerforming: AnyObject {
    func performAutomationAction(_ action: StatusBarAutomationAction)
}

@MainActor
protocol MainWindowStateControlling: AnyObject {
    var isMainWindowVisible: Bool { get }
    func hideMainWindow()
    func showMainWindow()
}

@MainActor
protocol AutomationAppStateProviding {
    var selectedDestination: AppDestination { get }
    var pendingReminderCount: Int { get }
    var isSignedInForAutomation: Bool { get }
    var accountEmailForAutomation: String { get }
    var notificationStatusForAutomation: String { get }
    var systemNotificationRequestIDsForAutomation: [String] { get }
    var currentErrorMessageForAutomation: String? { get }
    var userFacingCurrentErrorMessageForAutomation: String? { get }
    var bootstrapStatusTitleForAutomation: String { get }
    var bootstrapStatusMessageForAutomation: String { get }
    var connectionStatusTitleForAutomation: String { get }
    var connectionStatusDetailForAutomation: String { get }
    var openClawRegistryStatusToneForAutomation: String { get }
    var openClawRegistryStatusTitleForAutomation: String { get }
    var openClawRegistryStatusMessageForAutomation: String { get }
    var openClawRegistryIssueSummaryForAutomation: String { get }
    var openClawRegistryReasonSummaryForAutomation: String { get }
    var openClawRegistryContractSummaryLinesForAutomation: [String] { get }
    var coachDraftTextForAutomation: String { get }
    var coachConversationSessionCountForAutomation: Int { get }
    var coachConversationMessageCountForAutomation: Int { get }
    var coachLastUserMessageTextForAutomation: String? { get }
    var coachLastAssistantStatusForAutomation: String? { get }
    var coachLastAssistantFastResponseForAutomation: String? { get }
    var coachLastAssistantFullResponseForAutomation: String? { get }
    var coachLastAssistantExecutionTrailForAutomation: [String] { get }
    var coachLastFeedbackLabelForAutomation: String? { get }
    var coachActiveMemoryCountForAutomation: Int { get }
    var coachRevokedMemoryCountForAutomation: Int { get }
    func acknowledgeReminderForAutomation(messageID: String?)
    func requestNotificationPermissionForAutomation()
    func openCoachForAutomation()
    func refreshCoachConversationForAutomation()
    func setCoachDraftTextForAutomation(_ text: String)
    func sendCoachConversationForAutomation()
    func submitCoachFeedbackForAutomation(messageID: String?, label: String)
    func revokeCoachConversationMemoryForAutomation(memoryID: String?)
    func refreshOpenClawRegistryForAutomation()
}

struct MacAutomationCoachSnapshot: Codable, Equatable {
    let draftText: String
    let sessionCount: Int
    let messageCount: Int
    let lastUserMessageText: String?
    let lastAssistantStatus: String?
    let lastAssistantFastResponse: String?
    let lastAssistantFullResponse: String?
    let lastAssistantExecutionTrail: [String]
    let lastFeedbackLabel: String?
    let activeMemoryCount: Int
    let revokedMemoryCount: Int
}

struct MacAutomationSnapshot: Codable, Equatable {
    let mainWindowVisible: Bool
    let selectedDestination: String
    let pendingReminderCount: Int
    let isSignedIn: Bool
    let accountEmail: String
    let notificationStatus: String
    let systemNotificationRequestIDs: [String]
    let currentError: String?
    let userFacingCurrentError: String?
    let bootstrapStatusTitle: String
    let bootstrapStatusMessage: String
    let connectionStatusTitle: String
    let connectionStatusDetail: String
    let openClawRegistryStatusTone: String
    let openClawRegistryStatusTitle: String
    let openClawRegistryStatusMessage: String
    let openClawRegistryIssueSummary: String
    let openClawRegistryReasonSummary: String
    let openClawRegistryContractSummaryLines: [String]
    let coach: MacAutomationCoachSnapshot?
}

enum MacAutomationAction: String, Codable, Equatable {
    case snapshot
    case closeMainWindow = "close_main_window"
    case statusItemOpenMainWindow = "status_item_open_main_window"
    case statusItemOpenReminders = "status_item_open_reminders"
    case statusItemSyncNow = "status_item_sync_now"
    case acknowledgeReminder = "acknowledge_reminder"
    case openCoach = "open_coach"
    case refreshCoach = "refresh_coach"
    case setCoachDraftText = "set_coach_draft_text"
    case sendCoachMessage = "send_coach_message"
    case coachFeedbackHelpful = "coach_feedback_helpful"
    case coachFeedbackUnhelpful = "coach_feedback_unhelpful"
    case coachRevokeMemory = "coach_revoke_memory"
    case refreshOpenClawRegistry = "refresh_openclaw_registry"
    case requestNotificationPermission = "request_notification_permission"
}

struct MacAutomationCommand: Codable, Equatable {
    let id: String
    let action: MacAutomationAction
    let messageID: String?
    let text: String?

    init(id: String, action: MacAutomationAction, messageID: String? = nil, text: String? = nil) {
        self.id = id
        self.action = action
        self.messageID = messageID
        self.text = text
    }
}

struct MacAutomationResponse: Codable, Equatable {
    let id: String
    let ok: Bool
    let snapshot: MacAutomationSnapshot
}

@MainActor
protocol MacAutomationCommandHandling: AnyObject {
    func handle(command: MacAutomationCommand) throws -> MacAutomationResponse
}

@MainActor
final class MacAutomationController: MacAutomationCommandHandling {
    private let statusBarActions: any StatusBarActionPerforming
    private let windowState: any MainWindowStateControlling
    private let appState: any AutomationAppStateProviding

    init(
        statusBarActions: any StatusBarActionPerforming,
        windowState: any MainWindowStateControlling,
        appState: any AutomationAppStateProviding
    ) {
        self.statusBarActions = statusBarActions
        self.windowState = windowState
        self.appState = appState
    }

    func handle(command: MacAutomationCommand) throws -> MacAutomationResponse {
        switch command.action {
        case .snapshot:
            break
        case .closeMainWindow:
            windowState.hideMainWindow()
        case .statusItemOpenMainWindow:
            statusBarActions.performAutomationAction(.openMainWindow)
            windowState.showMainWindow()
        case .statusItemOpenReminders:
            statusBarActions.performAutomationAction(.openReminders)
            windowState.showMainWindow()
        case .statusItemSyncNow:
            statusBarActions.performAutomationAction(.syncNow)
        case .acknowledgeReminder:
            appState.acknowledgeReminderForAutomation(messageID: command.messageID)
        case .requestNotificationPermission:
            appState.requestNotificationPermissionForAutomation()
        case .openCoach:
            appState.openCoachForAutomation()
            windowState.showMainWindow()
        case .refreshCoach:
            appState.refreshCoachConversationForAutomation()
        case .setCoachDraftText:
            appState.setCoachDraftTextForAutomation(command.text ?? "")
            windowState.showMainWindow()
        case .sendCoachMessage:
            appState.sendCoachConversationForAutomation()
            windowState.showMainWindow()
        case .coachFeedbackHelpful:
            appState.submitCoachFeedbackForAutomation(messageID: command.messageID, label: "helpful")
        case .coachFeedbackUnhelpful:
            appState.submitCoachFeedbackForAutomation(messageID: command.messageID, label: "unhelpful")
        case .coachRevokeMemory:
            appState.revokeCoachConversationMemoryForAutomation(memoryID: command.messageID)
        case .refreshOpenClawRegistry:
            appState.refreshOpenClawRegistryForAutomation()
        }

        return MacAutomationResponse(
            id: command.id,
            ok: true,
            snapshot: .init(
                mainWindowVisible: windowState.isMainWindowVisible,
                selectedDestination: appState.selectedDestination.rawValue,
                pendingReminderCount: appState.pendingReminderCount,
                isSignedIn: appState.isSignedInForAutomation,
                accountEmail: appState.accountEmailForAutomation,
                notificationStatus: appState.notificationStatusForAutomation,
                systemNotificationRequestIDs: appState.systemNotificationRequestIDsForAutomation,
                currentError: appState.currentErrorMessageForAutomation,
                userFacingCurrentError: appState.userFacingCurrentErrorMessageForAutomation,
                bootstrapStatusTitle: appState.bootstrapStatusTitleForAutomation,
                bootstrapStatusMessage: appState.bootstrapStatusMessageForAutomation,
                connectionStatusTitle: appState.connectionStatusTitleForAutomation,
                connectionStatusDetail: appState.connectionStatusDetailForAutomation,
                openClawRegistryStatusTone: appState.openClawRegistryStatusToneForAutomation,
                openClawRegistryStatusTitle: appState.openClawRegistryStatusTitleForAutomation,
                openClawRegistryStatusMessage: appState.openClawRegistryStatusMessageForAutomation,
                openClawRegistryIssueSummary: appState.openClawRegistryIssueSummaryForAutomation,
                openClawRegistryReasonSummary: appState.openClawRegistryReasonSummaryForAutomation,
                openClawRegistryContractSummaryLines: appState.openClawRegistryContractSummaryLinesForAutomation,
                coach: MacAutomationCoachSnapshot(
                    draftText: appState.coachDraftTextForAutomation,
                    sessionCount: appState.coachConversationSessionCountForAutomation,
                    messageCount: appState.coachConversationMessageCountForAutomation,
                    lastUserMessageText: appState.coachLastUserMessageTextForAutomation,
                    lastAssistantStatus: appState.coachLastAssistantStatusForAutomation,
                    lastAssistantFastResponse: appState.coachLastAssistantFastResponseForAutomation,
                    lastAssistantFullResponse: appState.coachLastAssistantFullResponseForAutomation,
                    lastAssistantExecutionTrail: appState.coachLastAssistantExecutionTrailForAutomation,
                    lastFeedbackLabel: appState.coachLastFeedbackLabelForAutomation,
                    activeMemoryCount: appState.coachActiveMemoryCountForAutomation,
                    revokedMemoryCount: appState.coachRevokedMemoryCountForAutomation
                )
            )
        )
    }
}

@MainActor
final class MacAutomationCommandFileBridge {
    let commandURL: URL
    let responseURL: URL
    private var lastProcessedCommandID: String?
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(commandURL: URL, responseURL: URL) {
        self.commandURL = commandURL
        self.responseURL = responseURL
    }

    func processPendingCommand(using handler: any MacAutomationCommandHandling) throws {
        guard FileManager.default.fileExists(atPath: commandURL.path) else { return }
        let data = try Data(contentsOf: commandURL)
        let command = try decoder.decode(MacAutomationCommand.self, from: data)
        guard command.id != lastProcessedCommandID else { return }
        lastProcessedCommandID = command.id
        let response = try handler.handle(command: command)
        let responseData = try encoder.encode(response)
        try responseData.write(to: responseURL, options: .atomic)
    }
}

@MainActor
final class MacAutomationService {
    static let enabledEnvironmentKey = "MINDANCHOR_AUTOMATION_ENABLED"
    static let commandFileEnvironmentKey = "MINDANCHOR_AUTOMATION_COMMAND_FILE"
    static let responseFileEnvironmentKey = "MINDANCHOR_AUTOMATION_RESPONSE_FILE"

    static var defaultCommandURL: URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("mindanchor-macos-automation-command.json")
    }

    static var defaultResponseURL: URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("mindanchor-macos-automation-response.json")
    }

    static func commandURL(environment: [String: String] = ProcessInfo.processInfo.environment) -> URL {
        if let path = environment[commandFileEnvironmentKey], !path.isEmpty {
            return URL(fileURLWithPath: path)
        }
        return defaultCommandURL
    }

    static func responseURL(environment: [String: String] = ProcessInfo.processInfo.environment) -> URL {
        if let path = environment[responseFileEnvironmentKey], !path.isEmpty {
            return URL(fileURLWithPath: path)
        }
        return defaultResponseURL
    }

    private let bridge: MacAutomationCommandFileBridge
    private let handler: any MacAutomationCommandHandling
    private var timer: Timer?

    init(
        bridge: MacAutomationCommandFileBridge,
        handler: any MacAutomationCommandHandling
    ) {
        self.bridge = bridge
        self.handler = handler
    }

    func startIfEnabled(environment: [String: String] = ProcessInfo.processInfo.environment) {
        guard environment[Self.enabledEnvironmentKey] == "1" else { return }
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self else { return }
                try? self.bridge.processPendingCommand(using: self.handler)
            }
        }
        if let timer {
            RunLoop.main.add(timer, forMode: .common)
        }
    }

    func stop() {
        timer?.invalidate()
        timer = nil
    }
}
