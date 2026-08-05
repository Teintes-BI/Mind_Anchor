import AppKit
import Combine
import Foundation
import SwiftUI
import UserNotifications

enum AppDestination: String, CaseIterable, Identifiable {
    case today
    case coach
    case wayfinder
    case goals
    case state
    case reflections
    case reminders
    case settings

    var id: String { rawValue }

    var title: String {
        title(for: .english)
    }

    func title(for language: AppLanguage) -> String {
        AppLocalization(language: language).destinationTitle(self)
    }

    var iconName: String {
        switch self {
        case .today: return "sun.max"
        case .coach: return "person.2.crop.square.stack"
        case .wayfinder: return "point.3.connected.trianglepath.dotted"
        case .goals: return "checklist"
        case .state: return "waveform.path.ecg"
        case .reflections: return "text.book.closed"
        case .reminders: return "bell"
        case .settings: return "gearshape"
        }
    }
}

enum ReminderStatusContext {
    case refreshFailed
    case acknowledgeFailed
}

struct CoachConversationTraceSummary: Equatable {
    let frontAgent: String?
    let consultedAgent: String?
    let authorityAgent: String?
    let authorityTarget: String?
    let executionStatus: String?
    let runtimeSource: String?
    let revokedMemoryCount: Int
    let primaryRoute: String?
    let usedOpenClaw: Bool
    let hadFallback: Bool
    let degraded: Bool
    let degradedReason: String?
}

@MainActor
final class AppViewModel: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    @Published var appLanguage: AppLanguage
    @Published var authSession: AuthSessionState?
    @Published private(set) var bootstrapState: AppBootstrapState = .signedOut
    @Published var dashboardSummary: DashboardSummaryPayload?
    @Published var coachFrontAgentState: CoachFrontAgentPayload?
    @Published var coachProposals: [JarvisProposalPayload] = []
    @Published var coachMemoryItems: [DataMemoryPayload] = []
    @Published var coachConversationSessions: [CoachConversationSessionPayload] = []
    @Published var coachConversationSelectedSessionID: String?
    @Published var coachConversationMessages: [CoachConversationMessagePayload] = []
    @Published var coachConversationMemoryItems: [CoachConversationMemoryPayload] = []
    @Published var coachConversationFeedbackByMessageID: [String: CoachConversationFeedbackPayload] = [:]
    @Published var coachConversationTraceSummaryByMessageID: [String: CoachConversationTraceSummary] = [:]
    @Published var openClawRegistryVisibility: OpenClawRegistryVisibilityPayload?
    @Published var coachConversationDraft = ""
    @Published var coachConversationLastTraceID: String?
    @Published var wayfinderSituation: WayfinderSituation?
    @Published var wayfinderOptions: [WayfinderDecisionOption] = []
    @Published var wayfinderConsentGrants: [WayfinderConsentGrant] = []
    @Published var wayfinderLastDecision: WayfinderDecisionRecord?
    @Published var wayfinderFastResponse: String?
    @Published var wayfinderFullStatus: WayfinderProcessingStatus?
    @Published var wayfinderIsRefreshing = false
    @Published var wayfinderActionInFlight = false
    @Published var goalFlowOverview: GoalFlowOverviewPayload?
    @Published var inboxOverview: InboxOverviewPayload?
    @Published var reflectionOverview: ReflectionOverviewPayload?
    @Published var stateTrends: StateTrendsPayload?
    @Published var permissionsHint: AppPermissionHint?
    @Published var currentError: String?
    @Published var selectedDestination: AppDestination = .today
    @Published var email = ""
    @Published var password = ""
    @Published var displayName = ""
    @Published var isBusy = false
    @Published var diagnostics: PermissionsDiagnostics
    @Published var collectorStatus = RecentActivitySnapshot()
    @Published private(set) var systemNotificationRequestIDs: [String] = []
    @Published private var reminderStatusContext: ReminderStatusContext?
    @Published var runtimeStatus = DesktopCollectorState(
        queueLength: 0,
        lastSyncAt: nil,
        lastHeartbeatAt: nil,
        lastErrorMessage: nil,
        lastFrontmostApp: "",
        lastIdleSeconds: 0
    )

    let configuration: AppConfiguration
    let apiClient: any MindAnchorAPIProviding
    let languageStore: AppLanguageStore
    let localStore: LocalStore
    let deviceProfile: DesktopDeviceProfile
    let collector: any DesktopActivityCollecting
    let reminderPresenter: any ReminderPresenting
    let notificationInspector: any NotificationInspecting
    var windowManager: (any MainWindowManaging)?
    private let shouldConfigureSystemNotifications: Bool
    private let shouldRefreshDiagnosticsOnBootstrap: Bool
    private let collectorEnabled: Bool

    private var inboxPollingTask: Task<Void, Never>?
    private var heartbeatTask: Task<Void, Never>?
    private var coachConversationRefreshTask: Task<Void, Never>?
    private var hasRegisteredDevice = false
    private var diagnosticsObservation: AnyCancellable?
    private var lastOpenClawRegistryAlertKey: String?

    var isSignedIn: Bool {
        authSession != nil
    }

    var isLoadingInitialContent: Bool {
        isSignedIn &&
        dashboardSummary == nil &&
        goalFlowOverview == nil &&
        inboxOverview == nil &&
        reflectionOverview == nil &&
        stateTrends == nil &&
        currentError == nil
    }

    var accountEmail: String {
        authSession?.user.email ?? l10n.notSignedInAccountEmail()
    }

    var pendingReminderCount: Int {
        inboxOverview?.pendingMessages.count ?? 0
    }

    var latestMessages: [InboxOverviewPayload.Message] {
        Array((inboxOverview?.messages ?? []).prefix(10))
    }

    var l10n: AppLocalization {
        AppLocalization(language: appLanguage)
    }

    var localizedNotificationStatusDescription: String {
        l10n.notificationStatusDescription(diagnostics.notificationAuthorizationState)
    }

    var accessibilityStatusDescription: String {
        l10n.accessibilityStatus(granted: diagnostics.accessibilityGranted)
    }

    var pendingReminderBadgeText: String {
        l10n.pendingBadgeText(count: pendingReminderCount)
    }

    func setAppLanguage(_ language: AppLanguage) {
        guard appLanguage != language else { return }
        appLanguage = language
        languageStore.save(language)
        if shouldConfigureSystemNotifications {
            reminderPresenter.configureCategories(language: language)
        }
    }

    func snoozedUntil(for messageID: String) -> Date? {
        localStore.state.reminderMetadata.snoozedUntilByMessageID[messageID]
    }

    init(
        configuration: AppConfiguration,
        apiClient: (any MindAnchorAPIProviding)? = nil,
        localStore: LocalStore? = nil,
        deviceProfile: DesktopDeviceProfile? = nil,
        collector: (any DesktopActivityCollecting)? = nil,
        collectorEnabled: Bool = true,
        reminderPresenter: (any ReminderPresenting)? = nil,
        diagnostics: PermissionsDiagnostics? = nil,
        notificationInspector: (any NotificationInspecting)? = nil,
        languageStore: AppLanguageStore? = nil,
        windowManager: (any MainWindowManaging)? = nil,
        shouldConfigureSystemNotifications: Bool = true,
        shouldRefreshDiagnosticsOnBootstrap: Bool = true
    ) {
        self.configuration = configuration
        let resolvedLanguageStore = languageStore ?? AppLanguageStore()
        self.languageStore = resolvedLanguageStore
        self.appLanguage = resolvedLanguageStore.load()
        let appSupportDirectory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first ?? URL(fileURLWithPath: NSTemporaryDirectory())
        let resolvedLocalStore = localStore ?? LocalStore(appSupportDirectory: appSupportDirectory)
        self.localStore = resolvedLocalStore
        let resolvedDeviceProfile = deviceProfile ?? DesktopDeviceProfile(
            deviceID: Host.current().localizedName ?? UUID().uuidString,
            label: Host.current().localizedName ?? "MindAnchor Mac",
            platform: "macos",
            capabilities: ["desktop_signals", "notifications"],
            appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.1.0"
        )
        self.deviceProfile = resolvedDeviceProfile
        self.apiClient = apiClient ?? APIClient(configuration: configuration)
        self.reminderPresenter = reminderPresenter ?? ReminderCenter.shared
        self.diagnostics = diagnostics ?? PermissionsDiagnostics()
        self.notificationInspector =
            notificationInspector ??
            (shouldConfigureSystemNotifications ? SystemNotificationInspector() : NoopNotificationInspector())
        self.windowManager = windowManager
        self.collectorEnabled = collectorEnabled
        self.collector =
            collector ??
            (collectorEnabled
                ? DesktopActivityCollector(configuration: configuration) { [weak resolvedLocalStore] signal in
                    resolvedLocalStore?.enqueue(signal: signal)
                }
                : NoopDesktopActivityCollector())
        self.shouldConfigureSystemNotifications = shouldConfigureSystemNotifications
        self.shouldRefreshDiagnosticsOnBootstrap = shouldRefreshDiagnosticsOnBootstrap
        super.init()
        if shouldConfigureSystemNotifications {
            UNUserNotificationCenter.current().delegate = self
            self.reminderPresenter.configureCategories(language: appLanguage)
        }
        diagnosticsObservation = self.diagnostics.objectWillChange.sink { [weak self] _ in
            self?.objectWillChange.send()
        }
        refreshRuntimeStatus()
    }

    func bootstrap() async {
        if shouldRefreshDiagnosticsOnBootstrap {
            await diagnostics.refresh(context: "bootstrap")
            if configuration.autoRequestNotificationsOnBootstrap,
               diagnostics.notificationAuthorizationState == .notRequested {
                Task { @MainActor [weak self] in
                    try? await Task.sleep(for: .milliseconds(750))
                    guard let self else { return }
                    if self.diagnostics.notificationAuthorizationState == .notRequested {
                        NSApp.activate(ignoringOtherApps: true)
                        await self.diagnostics.requestNotifications(context: "bootstrap-auto-request")
                    }
                }
            }
        }
        if let session = apiClient.loadStoredSession() {
            authSession = session
            bootstrapState = .loadingWorkspace
            await refreshDataForCurrentMode()
            startBackgroundWork()
            finalizeBootstrapState()
            return
        }

        if let bootstrap = configuration.debugAuthBootstrap {
            email = bootstrap.email
            password = bootstrap.password
            displayName = bootstrap.displayName ?? ""
            if bootstrap.mode.lowercased() == "register" {
                await register()
            } else {
                await signIn()
            }
            return
        }

        bootstrapState = .signedOut
    }

    func signIn() async {
        guard !email.isEmpty, !password.isEmpty else {
            currentError = "Email and password are required."
            bootstrapState = .signedOut
            return
        }

        bootstrapState = .authenticating
        isBusy = true
        defer { isBusy = false }

        do {
            let session = try await apiClient.signIn(email: email, password: password)
            authSession = session
            currentError = nil
            bootstrapState = .loadingWorkspace
            await refreshDataForCurrentMode()
            startBackgroundWork()
            finalizeBootstrapState()
        } catch {
            currentError = error.localizedDescription
            bootstrapState = .degraded
        }
    }

    func register() async {
        guard !email.isEmpty, !password.isEmpty else {
            currentError = "Email and password are required."
            bootstrapState = .signedOut
            return
        }

        bootstrapState = .authenticating
        isBusy = true
        defer { isBusy = false }

        do {
            let session = try await apiClient.register(email: email, password: password, displayName: displayName.isEmpty ? nil : displayName)
            authSession = session
            currentError = nil
            bootstrapState = .loadingWorkspace
            await refreshDataForCurrentMode()
            startBackgroundWork()
            finalizeBootstrapState()
        } catch {
            let message = error.localizedDescription
            if message.localizedCaseInsensitiveContains("already registered") {
                await signIn()
            } else {
                currentError = message
                bootstrapState = .degraded
            }
        }
    }

    func signOut() {
        inboxPollingTask?.cancel()
        heartbeatTask?.cancel()
        coachConversationRefreshTask?.cancel()
        collector.stop()
        apiClient.clearSession()
        authSession = nil
        dashboardSummary = nil
        coachFrontAgentState = nil
        coachProposals = []
        coachMemoryItems = []
        coachConversationSessions = []
        coachConversationSelectedSessionID = nil
        coachConversationMessages = []
        coachConversationMemoryItems = []
        coachConversationFeedbackByMessageID = [:]
        coachConversationTraceSummaryByMessageID = [:]
        coachConversationDraft = ""
        coachConversationLastTraceID = nil
        wayfinderSituation = nil
        wayfinderOptions = []
        wayfinderConsentGrants = []
        wayfinderLastDecision = nil
        wayfinderFastResponse = nil
        wayfinderFullStatus = nil
        wayfinderIsRefreshing = false
        wayfinderActionInFlight = false
        goalFlowOverview = nil
        inboxOverview = nil
        reflectionOverview = nil
        stateTrends = nil
        openClawRegistryVisibility = nil
        permissionsHint = nil
        currentError = nil
        hasRegisteredDevice = false
        lastOpenClawRegistryAlertKey = nil
        bootstrapState = .signedOut
    }

    func focus(destination: AppDestination) {
        selectedDestination = destination
        if let windowManager {
            windowManager.showMainWindow(activateApp: true)
            return
        }
        NSApp.activate(ignoringOtherApps: true)
        NSApp.windows.first?.makeKeyAndOrderFront(nil)
    }

    func refreshWayfinder() async {
        guard let session = authSession else { return }
        wayfinderIsRefreshing = true
        defer { wayfinderIsRefreshing = false }
        do {
            let consent = try await apiClient.fetchWayfinderConsent(token: session.accessToken)
            wayfinderConsentGrants = consent.grants
            if wayfinderSituation == nil {
                let situations = try await apiClient.fetchWayfinderSituations(token: session.accessToken)
                wayfinderSituation = situations.situations.first(where: { $0.status == .awaitingConfirmation || $0.status == .confirmed })
            }
            if let situation = wayfinderSituation {
                wayfinderSituation = try await apiClient.fetchWayfinderSituation(situation.id, token: session.accessToken)
                let options = try await apiClient.fetchWayfinderOptions(situation.id, token: session.accessToken)
                wayfinderOptions = options.options
                wayfinderFullStatus = options.fullStatus
            }
            currentError = nil
        } catch {
            if !handleUnauthorized(error) {
                currentError = error.localizedDescription
            }
        }
    }

    func grantWayfinderConsent() async {
        guard let session = authSession else { return }
        wayfinderActionInFlight = true
        defer { wayfinderActionInFlight = false }
        do {
            let grant = try await apiClient.updateWayfinderConsent(
                source: deviceProfile.deviceID,
                payload: WayfinderConsentInput(
                    purpose: "wayfinder_context",
                    scope: "manual_notes",
                    status: .granted,
                    rawRetentionSeconds: 0,
                    derivedRetentionDays: 30,
                    modelSharing: .localOnly
                ),
                token: session.accessToken
            )
            wayfinderConsentGrants = wayfinderConsentGrants.filter { $0.id != grant.id } + [grant]
            currentError = nil
        } catch {
            if !handleUnauthorized(error) { currentError = error.localizedDescription }
        }
    }

    func createWayfinderEvent(summary: String) async {
        guard let session = authSession else { return }
        guard let grant = wayfinderConsentGrants.first(where: { $0.status == .granted }) else {
            currentError = "Grant Wayfinder consent before capturing a situation."
            return
        }
        let formatter = ISO8601DateFormatter()
        let now = formatter.string(from: Date())
        wayfinderIsRefreshing = true
        defer { wayfinderIsRefreshing = false }
        do {
            let response = try await apiClient.createWayfinderEvent(
                payload: WayfinderEventInput(
                    sourceDeviceId: deviceProfile.deviceID,
                    kind: .manualNote,
                    occurredAt: now,
                    clientEventId: UUID().uuidString,
                    payload: ["summary": .string(summary)],
                    confidence: 1,
                    consentRef: grant.id,
                    retentionClass: .summary,
                    traceId: UUID().uuidString
                ),
                token: session.accessToken
            )
            wayfinderSituation = response.situation
            wayfinderOptions = []
            wayfinderFastResponse = "Captured: \(response.situation.summary)"
            wayfinderFullStatus = response.fullStatus
            currentError = nil
        } catch {
            if !handleUnauthorized(error) {
                currentError = error.localizedDescription
            }
        }
    }

    func confirmWayfinderSituation(status: WayfinderSituationStatus) async {
        guard let session = authSession, let situation = wayfinderSituation else { return }
        guard !wayfinderActionInFlight else { return }
        wayfinderActionInFlight = true
        defer { wayfinderActionInFlight = false }
        do {
            let response = try await apiClient.confirmWayfinderSituation(
                situation.id,
                status: status,
                traceID: UUID().uuidString,
                token: session.accessToken
            )
            wayfinderSituation = response.situation
            wayfinderFastResponse = status == .confirmed ? "Situation confirmed. Options are being prepared." : "Situation dismissed."
            wayfinderFullStatus = response.fullStatus
            if status == .confirmed {
                let options = try await apiClient.fetchWayfinderOptions(situation.id, token: session.accessToken)
                wayfinderOptions = options.options
                wayfinderFullStatus = options.fullStatus
            } else {
                wayfinderOptions = []
            }
            currentError = nil
        } catch {
            if !handleUnauthorized(error) {
                currentError = error.localizedDescription
            }
        }
    }

    func recordWayfinderDecision(option: WayfinderDecisionOption) async {
        guard let session = authSession, let situation = wayfinderSituation else { return }
        guard option.status == .proposed, !wayfinderActionInFlight else { return }
        wayfinderActionInFlight = true
        defer { wayfinderActionInFlight = false }
        do {
            wayfinderLastDecision = try await apiClient.recordWayfinderDecision(
                payload: WayfinderDecisionInput(
                    situationId: situation.id,
                    selectedOptionId: option.id,
                    actionStatus: .notStarted,
                    traceId: UUID().uuidString,
                    approvalAcknowledged: option.requiresApproval || option.riskLevel == .high || option.riskLevel == .critical
                ),
                token: session.accessToken
            )
            wayfinderFastResponse = "Choice recorded: \(option.action)"
            wayfinderOptions = []
            currentError = nil
        } catch {
            if !handleUnauthorized(error) {
                currentError = error.localizedDescription
            }
        }
    }

    private func handleUnauthorized(_ error: Error) -> Bool {
        guard case APIClientError.server(let statusCode, _) = error, statusCode == 401 else { return false }
        signOut()
        return true
    }

    func submitCheckIn(focus: Int, energy: Int, mood: Int, note: String) async {
        guard let session = authSession else { return }
        do {
            try await apiClient.submitCheckIn(focusScore: focus, energyScore: energy, moodScore: mood, note: note, token: session.accessToken, userID: session.user.id)
            await refreshDataForCurrentMode()
        } catch {
            currentError = error.localizedDescription
        }
    }

    func acknowledge(messageID: String) async {
        guard let session = authSession else { return }
        do {
            _ = try await apiClient.acknowledgeInboxMessage(messageID, token: session.accessToken)
            localStore.updateReminderMetadata { metadata in
                metadata.seenMessageIDs.remove(messageID)
                metadata.snoozedUntilByMessageID.removeValue(forKey: messageID)
            }
            reminderStatusContext = nil
            refreshRuntimeStatus()
            await refreshDataForCurrentMode()
        } catch {
            reminderStatusContext = .acknowledgeFailed
            currentError = error.localizedDescription
        }
    }

    func snooze(messageID: String) {
        localStore.updateReminderMetadata { metadata in
            metadata.snoozedUntilByMessageID[messageID] = Date().addingTimeInterval(Double(configuration.notificationSnoozeMinutes * 60))
            metadata.seenMessageIDs.remove(messageID)
        }
        refreshRuntimeStatus()
    }

    func syncNow() async {
        await flushQueuedSignals()
        await refreshDataForCurrentMode()
    }

    func setCoachManualOverride(_ enabled: Bool) async {
        if enabled {
            let current = activeCoachFrontAgentState
            let pinnedAgent = current.currentFrontAgent == "memory-governor-agent"
                ? "director-agent"
                : current.currentFrontAgent
            let nextState = CoachFrontAgentPayload(
                currentFrontAgent: pinnedAgent,
                routingMode: "manual",
                manualOverride: true,
                consultedAgent: current.consultedAgent,
                handoffReason: current.handoffReason,
                overrideSourceAgent: current.overrideSourceAgent,
                visibleSummary: current.visibleSummary ?? "\(CoachPersonaCatalog.displayName(for: pinnedAgent)) is pinned as the current front persona."
            )
            await persistCoachFrontAgentState(nextState)
            return
        }

        await persistCoachFrontAgentState(.defaultAuto)
    }

    func selectCoachPersona(_ agentID: String) async {
        let nextState = CoachFrontAgentPayload(
            currentFrontAgent: agentID,
            routingMode: "manual",
            manualOverride: true,
            consultedAgent: nil,
            handoffReason: nil,
            overrideSourceAgent: nil,
            visibleSummary: "\(CoachPersonaCatalog.displayName(for: agentID)) is now leading the response."
        )
        await persistCoachFrontAgentState(nextState)
    }

    func approveCoachProposal(_ proposalID: String) async {
        guard let session = authSession else { return }
        do {
            let updated = try await apiClient.approveCoachProposal(proposalID, token: session.accessToken)
            replaceCoachProposal(updated)
            currentError = nil
        } catch {
            currentError = error.localizedDescription
        }
    }

    func rejectCoachProposal(_ proposalID: String) async {
        guard let session = authSession else { return }
        do {
            let updated = try await apiClient.rejectCoachProposal(proposalID, token: session.accessToken)
            replaceCoachProposal(updated)
            currentError = nil
        } catch {
            currentError = error.localizedDescription
        }
    }

    func blockCoachMemoryRecall(_ memoryID: String) async {
        guard let session = authSession else { return }
        do {
            let updated = try await apiClient.blockCoachMemoryRecall(memoryID, token: session.accessToken)
            replaceCoachMemory(updated)
            currentError = nil
        } catch {
            currentError = error.localizedDescription
        }
    }

    func deleteCoachMemory(_ memoryID: String) async {
        guard let session = authSession else { return }
        do {
            let updated = try await apiClient.deleteCoachMemory(memoryID, token: session.accessToken)
            replaceCoachMemory(updated)
            currentError = nil
        } catch {
            currentError = error.localizedDescription
        }
    }

    func refreshCoachConversation() async {
        guard let session = authSession else { return }
        do {
            let sessions = try await apiClient.fetchCoachConversationSessions(token: session.accessToken)
            let memory = try await apiClient.fetchCoachConversationMemory(token: session.accessToken)
            coachConversationSessions = sessions
            coachConversationMemoryItems = memory

            if let selected = coachConversationSelectedSessionID,
               sessions.contains(where: { $0.id == selected }) {
                try await loadCoachConversationSessionDetail(selected, token: session.accessToken)
            } else if let first = sessions.first {
                coachConversationSelectedSessionID = first.id
                try await loadCoachConversationSessionDetail(first.id, token: session.accessToken)
            } else {
                coachConversationSelectedSessionID = nil
                coachConversationMessages = []
            }
            try await refreshCoachAuthoritySidecars(token: session.accessToken)
            await refreshCoachConversationTraceSummaries(token: session.accessToken)
            currentError = nil
            scheduleCoachConversationAutoRefreshIfNeeded()
        } catch {
            if !isIgnorableCoachConversationError(error) {
                currentError = error.localizedDescription
            }
        }
    }

    func selectCoachConversationSession(_ sessionID: String) async {
        guard let session = authSession else { return }
        do {
            try await loadCoachConversationSessionDetail(sessionID, token: session.accessToken)
            currentError = nil
        } catch {
            currentError = error.localizedDescription
        }
    }

    func createCoachConversation(title: String? = nil) async {
        guard let session = authSession else { return }
        do {
            let created = try await apiClient.createCoachConversationSession(title: title, token: session.accessToken)
            coachConversationSessions.removeAll(where: { $0.id == created.id })
            coachConversationSessions.insert(created, at: 0)
            coachConversationSelectedSessionID = created.id
            coachConversationMessages = []
            currentError = nil
        } catch {
            currentError = error.localizedDescription
        }
    }

    func createCoachConversationSession(title: String? = nil) async {
        await createCoachConversation(title: title)
    }

    func sendCoachConversationMessage() async {
        guard let session = authSession else { return }
        let trimmed = coachConversationDraft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        do {
            if coachConversationSelectedSessionID == nil {
                let created = try await apiClient.createCoachConversationSession(title: nil, token: session.accessToken)
                coachConversationSessions.removeAll(where: { $0.id == created.id })
                coachConversationSessions.insert(created, at: 0)
                coachConversationSelectedSessionID = created.id
            }

            guard let sessionID = coachConversationSelectedSessionID else { return }
            let response = try await apiClient.sendCoachConversationMessage(sessionID: sessionID, text: trimmed, token: session.accessToken)
            coachConversationDraft = ""
            coachConversationLastTraceID = response.traceID
            applyCoachFrontAgentState(response.frontAgentState)
            upsertCoachConversationMessage(response.userMessage)
            upsertCoachConversationMessage(response.assistantMessage)
            try await refreshCoachAuthoritySidecars(token: session.accessToken)
            await refreshCoachConversationTraceSummaries(token: session.accessToken)
            currentError = nil
            scheduleCoachConversationAutoRefreshIfNeeded()
        } catch {
            currentError = error.localizedDescription
        }
    }

    func sendCoachConversationMessage(_ text: String) async {
        coachConversationDraft = text
        await sendCoachConversationMessage()
    }

    func retryCoachConversationMessage(_ messageID: String) async {
        guard let session = authSession else { return }
        do {
            let response = try await apiClient.retryCoachConversationMessage(messageID, token: session.accessToken)
            coachConversationLastTraceID = response.traceID
            applyCoachFrontAgentState(response.frontAgentState)
            upsertCoachConversationMessage(response.userMessage)
            upsertCoachConversationMessage(response.assistantMessage)
            try await refreshCoachAuthoritySidecars(token: session.accessToken)
            await refreshCoachConversationTraceSummaries(token: session.accessToken)
            currentError = nil
            scheduleCoachConversationAutoRefreshIfNeeded()
        } catch {
            currentError = error.localizedDescription
        }
    }

    func submitCoachConversationFeedback(messageID: String, label: String, reason: String? = nil) async {
        guard let session = authSession else { return }
        do {
            let feedback = try await apiClient.submitCoachConversationFeedback(messageID: messageID, label: label, reason: reason, token: session.accessToken)
            coachConversationFeedbackByMessageID[messageID] = feedback
            try await refreshCoachAuthoritySidecars(token: session.accessToken)
            await refreshCoachConversationTraceSummaries(token: session.accessToken)
            currentError = nil
        } catch {
            currentError = error.localizedDescription
        }
    }

    func deleteCoachConversationMemory(_ memoryID: String) async {
        guard let session = authSession else { return }
        do {
            let updated = try await apiClient.deleteCoachConversationMemory(memoryID, token: session.accessToken)
            if let index = coachConversationMemoryItems.firstIndex(where: { $0.id == updated.id }) {
                coachConversationMemoryItems[index] = updated
            } else {
                coachConversationMemoryItems.insert(updated, at: 0)
            }
            try await refreshCoachAuthoritySidecars(token: session.accessToken)
            await refreshCoachConversationTraceSummaries(token: session.accessToken)
            currentError = nil
        } catch {
            currentError = error.localizedDescription
        }
    }

    func refreshCoachConversationSession() async {
        await refreshCoachConversation()
    }

    @discardableResult
    func exportDiagnosticsSnapshot() -> URL? {
        let snapshot = SupportDiagnosticsSnapshot(
            generatedAt: .now,
            apiBaseURL: configuration.apiBaseURL.absoluteString,
            accountEmail: accountEmail,
            bootstrapStatusTitle: bootstrapStatusTitle,
            bootstrapStatusMessage: bootstrapStatusMessage,
            connectionStatusTitle: connectionStatusTitle,
            connectionStatusDetail: connectionStatusDetail,
            deviceProfile: deviceProfile,
            runtimeStatus: runtimeStatus,
            collectorStatus: collectorStatus,
            notificationStatusDescription: diagnostics.notificationStatusDescription,
            notificationPermissionHelpText: notificationPermissionHelpText,
            desktopCollectionStatusTitle: desktopCollectionStatusTitle,
            desktopCollectionStatusDetail: desktopCollectionStatusDetail,
            pendingReminderCount: pendingReminderCount,
            currentError: currentError,
            systemNotificationRequestIDs: systemNotificationRequestIDs
        )

        do {
            let exportURL = try localStore.exportDiagnosticsSnapshot(snapshot)
            refreshRuntimeStatus()
            return exportURL
        } catch {
            currentError = error.localizedDescription
            refreshRuntimeStatus()
            return nil
        }
    }

    private func startBackgroundWork() {
        if collectorEnabled {
            collector.start()
        } else {
            collector.stop()
        }
        inboxPollingTask?.cancel()
        heartbeatTask?.cancel()

        inboxPollingTask = Task { [weak self] in
            while !Task.isCancelled {
                await self?.flushQueuedSignals()
                await self?.refreshDataForCurrentMode()
                try? await Task.sleep(for: .seconds(self?.configuration.inboxPollInterval ?? 30))
            }
        }

        heartbeatTask = Task { [weak self] in
            while !Task.isCancelled {
                await self?.sendHeartbeat()
                try? await Task.sleep(for: .seconds(self?.configuration.heartbeatInterval ?? 60))
            }
        }
    }

    private func flushQueuedSignals() async {
        guard let session = authSession else { return }
        refreshRuntimeStatus()
        let signals = localStore.state.queuedSignals
        guard !signals.isEmpty else { return }
        do {
            try await apiClient.uploadSignals(signals, token: session.accessToken, userID: session.user.id)
            localStore.replaceQueuedSignals([])
            localStore.markSync()
            refreshRuntimeStatus()
        } catch {
            localStore.markError(error.localizedDescription)
            refreshRuntimeStatus()
            currentError = error.localizedDescription
        }
    }

    private func sendHeartbeat() async {
        guard let session = authSession else { return }
        do {
            if !hasRegisteredDevice {
                _ = try await apiClient.registerDevice(profile: deviceProfile, token: session.accessToken, userID: session.user.id)
                hasRegisteredDevice = true
            }
            _ = try await apiClient.sendHeartbeat(profile: deviceProfile, token: session.accessToken, userID: session.user.id, queueDepth: localStore.state.queuedSignals.count)
            localStore.markHeartbeat()
            refreshRuntimeStatus()
        } catch {
            localStore.markError(error.localizedDescription)
            refreshRuntimeStatus()
            currentError = error.localizedDescription
        }
    }

    private func refreshDataForCurrentMode() async {
        if configuration.reminderPollingOnly {
            await refreshInboxOnly()
        } else {
            await refreshAll()
        }
    }

    private func refreshInboxOnly() async {
        guard let session = authSession else { return }
        do {
            let inbox = try await apiClient.fetchInboxOverview(token: session.accessToken)
            inboxOverview = inbox
            localStore.cacheInboxOverview(inbox)
            reminderStatusContext = nil
            currentError = nil
            refreshRuntimeStatus()
            await maybeNotify(messages: inbox.pendingMessages)
            await refreshSystemNotificationRequestIDs()
        } catch {
            if handleUnauthorized(error) { return }
            reminderStatusContext = inboxOverview == nil ? nil : .refreshFailed
            currentError = error.localizedDescription
        }
    }

    private func refreshAll() async {
        guard let session = authSession else { return }
        do {
            let bootstrap = try await apiClient.fetchBootstrap(token: session.accessToken)
            dashboardSummary = bootstrap.dashboard
            coachFrontAgentState = bootstrap.dashboard.coachFrontAgent ?? coachFrontAgentState
            goalFlowOverview = bootstrap.goalFlow
            inboxOverview = bootstrap.inboxOverview
            permissionsHint = bootstrap.permissions
            reminderStatusContext = nil
            localStore.cacheBootstrap(
                dashboard: bootstrap.dashboard,
                goalFlow: bootstrap.goalFlow,
                inbox: bootstrap.inboxOverview
            )
            refreshRuntimeStatus()
            await maybeNotify(messages: bootstrap.inboxOverview.pendingMessages)
            await refreshSystemNotificationRequestIDs()
        } catch {
            if handleUnauthorized(error) { return }
            reminderStatusContext = inboxOverview == nil ? nil : .refreshFailed
            currentError = error.localizedDescription
        }

        if coachFrontAgentState == nil {
            do {
                coachFrontAgentState = try await apiClient.fetchCoachFrontAgent(token: session.accessToken)
            } catch {
                currentError = currentError ?? error.localizedDescription
            }
        }

        do {
            async let stateTask = apiClient.fetchStateTrends(token: session.accessToken, userID: session.user.id)
            async let reflectionsTask = apiClient.fetchReflectionOverview(token: session.accessToken, userID: session.user.id)
            stateTrends = try await stateTask
            reflectionOverview = try await reflectionsTask
            localStore.cacheSupplementary(
                reflections: reflectionOverview,
                stateTrends: stateTrends
            )
            refreshRuntimeStatus()
        } catch {
            currentError = error.localizedDescription
        }

        do {
            async let proposalsTask = apiClient.fetchCoachProposals(token: session.accessToken)
            async let memoryTask = apiClient.fetchCoachMemory(token: session.accessToken)
            coachProposals = try await proposalsTask
            coachMemoryItems = try await memoryTask
        } catch {
            currentError = currentError ?? error.localizedDescription
        }

        do {
            openClawRegistryVisibility = try await apiClient.fetchOpenClawRegistryVisibility(token: session.accessToken)
            await maybeNotifyOpenClawRegistryHealth()
        } catch {
            currentError = currentError ?? error.localizedDescription
        }

        await refreshCoachConversation()
    }

    private func maybeNotify(messages: [InboxOverviewPayload.Message]) async {
        let now = Date()
        let seen = localStore.state.reminderMetadata.seenMessageIDs
        let snoozed = localStore.state.reminderMetadata.snoozedUntilByMessageID
        let notifiable = messages.filter { message in
            guard message.channel == "desktop_local", message.status == "pending" else { return false }
            if let snoozedUntil = snoozed[message.id], snoozedUntil > now { return false }
            return !seen.contains(message.id)
        }
        guard !notifiable.isEmpty else { return }
        for message in notifiable {
            localStore.updateReminderMetadata { metadata in
                metadata.seenMessageIDs.insert(message.id)
            }
            refreshRuntimeStatus()
            await reminderPresenter.show(message: message)
        }
    }

    private func refreshSystemNotificationRequestIDs() async {
        systemNotificationRequestIDs = await notificationInspector.fetchSystemNotificationRequestIDs()
    }

    private func refreshRuntimeStatus() {
        collectorStatus = localStore.state.recentActivity
        runtimeStatus = DesktopCollectorState(state: localStore.state)
    }

    func refreshOpenClawRegistryVisibility() async {
        guard let session = authSession else { return }
        do {
            openClawRegistryVisibility = try await apiClient.fetchOpenClawRegistryVisibility(token: session.accessToken)
            await maybeNotifyOpenClawRegistryHealth()
            currentError = nil
        } catch {
            currentError = error.localizedDescription
        }
    }

    private func openClawRegistryAlertKey() -> String? {
        guard let external = openClawRegistryVisibility?.externalRuntime,
              external.configured,
              !external.reachable else {
            return nil
        }

        return [external.baseUrl, external.error]
            .compactMap { value in
                guard let value, !value.isEmpty else { return nil }
                return value
            }
            .joined(separator: "|")
    }

    private func maybeNotifyOpenClawRegistryHealth() async {
        guard let alertKey = openClawRegistryAlertKey() else {
            lastOpenClawRegistryAlertKey = nil
            return
        }
        guard lastOpenClawRegistryAlertKey != alertKey else { return }

        lastOpenClawRegistryAlertKey = alertKey
        await reminderPresenter.showOperationalAlert(
            id: "mindanchor-openclaw-registry-alert",
            title: openClawRegistryStatusTitle,
            message: openClawRegistryStatusMessage,
            kind: "openclaw_registry"
        )
        await refreshSystemNotificationRequestIDs()
    }

    private func persistCoachFrontAgentState(_ nextState: CoachFrontAgentPayload) async {
        guard let session = authSession else {
            applyCoachFrontAgentState(nextState)
            return
        }

        applyCoachFrontAgentState(nextState)
        do {
            let saved = try await apiClient.updateCoachFrontAgent(payload: nextState, token: session.accessToken)
            applyCoachFrontAgentState(saved)
        } catch {
            currentError = error.localizedDescription
        }
    }

    private func applyCoachFrontAgentState(_ nextState: CoachFrontAgentPayload) {
        coachFrontAgentState = nextState
        guard let summary = dashboardSummary else { return }
        dashboardSummary = DashboardSummaryPayload(
            goalCount: summary.goalCount,
            taskCount: summary.taskCount,
            openInterventions: summary.openInterventions,
            completionRate: summary.completionRate,
            coachFrontAgent: nextState,
            latestAssessment: summary.latestAssessment,
            latestRecoveryPlan: summary.latestRecoveryPlan,
            latestBehaviorConclusion: summary.latestBehaviorConclusion,
            goals: summary.goals,
            tasks: summary.tasks
        )
    }

    private func replaceCoachProposal(_ updated: JarvisProposalPayload) {
        if let index = coachProposals.firstIndex(where: { $0.id == updated.id }) {
            coachProposals[index] = updated
            return
        }
        coachProposals.insert(updated, at: 0)
    }

    private func replaceCoachMemory(_ updated: DataMemoryPayload) {
        if let index = coachMemoryItems.firstIndex(where: { $0.id == updated.id }) {
            coachMemoryItems[index] = updated
            return
        }
        coachMemoryItems.insert(updated, at: 0)
    }

    private func loadCoachConversationSessionDetail(_ sessionID: String, token: String) async throws {
        let detail = try await apiClient.fetchCoachConversationSession(sessionID, token: token)
        coachConversationSelectedSessionID = detail.session.id
        coachConversationMessages = detail.messages
        if let index = coachConversationSessions.firstIndex(where: { $0.id == detail.session.id }) {
            coachConversationSessions[index] = detail.session
        } else {
            coachConversationSessions.insert(detail.session, at: 0)
        }
    }

    private func refreshCoachAuthoritySidecars(token: String) async throws {
        async let frontAgentTask = apiClient.fetchCoachFrontAgent(token: token)
        async let proposalsTask = apiClient.fetchCoachProposals(token: token)
        async let memoryTask = apiClient.fetchCoachMemory(token: token)

        let frontAgent = try await frontAgentTask
        let proposals = try await proposalsTask
        let memory = try await memoryTask

        applyCoachFrontAgentState(frontAgent)
        coachProposals = proposals
        coachMemoryItems = memory
    }

    private func refreshCoachConversationTraceSummaries(token: String) async {
        let assistantMessages = coachConversationMessages.filter { $0.role == "assistant" }
        guard !assistantMessages.isEmpty else {
            coachConversationTraceSummaryByMessageID = [:]
            return
        }

        var next: [String: CoachConversationTraceSummary] = [:]
        for message in assistantMessages {
            if let summary = buildCoachConversationTraceSummary(from: message) {
                next[message.id] = summary
                continue
            }
            guard let traceID = message.traceId, !traceID.isEmpty else { continue }
            guard let trace = try? await apiClient.fetchCoachDebugTrace(traceID, token: token) else { continue }
            if let summary = buildCoachConversationTraceSummary(from: trace) {
                next[message.id] = summary
            }
        }
        coachConversationTraceSummaryByMessageID = next
    }

    private func buildCoachConversationTraceSummary(from message: CoachConversationMessagePayload) -> CoachConversationTraceSummary? {
        guard let summary = message.conversationPath else {
            return nil
        }
        guard summary.frontAgent != nil ||
                summary.consultedAgent != nil ||
                summary.authorityAgent != nil ||
                (summary.revokedMemoryCount ?? 0) > 0 ||
                summary.degraded else {
            return nil
        }
        return CoachConversationTraceSummary(
            frontAgent: summary.frontAgent,
            consultedAgent: summary.consultedAgent,
            authorityAgent: summary.authorityAgent,
            authorityTarget: summary.authorityTarget,
            executionStatus: summary.authorityExecutionStatus,
            runtimeSource: summary.runtimeSource,
            revokedMemoryCount: summary.revokedMemoryCount ?? 0,
            primaryRoute: summary.primaryRoute,
            usedOpenClaw: summary.usedOpenClaw,
            hadFallback: summary.hadFallback,
            degraded: summary.degraded,
            degradedReason: summary.degradedReason
        )
    }

    private func buildCoachConversationTraceSummary(from trace: DebugTraceLookupPayload) -> CoachConversationTraceSummary? {
        if let summary = trace.summary?.conversationPath {
            let frontAgent = summary.frontAgent
            let consultedAgent = summary.consultedAgent
            let authorityAgent = summary.authorityAgent
            let authorityTarget = summary.authorityTarget
            let executionStatus = summary.authorityExecutionStatus
            let revokedMemoryCount = summary.revokedMemoryCount ?? trace.events
                .filter { $0.event == "coach.memory.revoked" || $0.event == "coach.feedback.applied" }
                .reduce(0) { partialResult, event in
                    max(partialResult, event.metadata["revokedMemoryCount"]?.intValue ?? (event.event == "coach.memory.revoked" ? 1 : 0))
                }

            guard frontAgent != nil || consultedAgent != nil || authorityAgent != nil || revokedMemoryCount > 0 || summary.degraded else {
                return nil
            }

            return CoachConversationTraceSummary(
                frontAgent: frontAgent,
                consultedAgent: consultedAgent,
                authorityAgent: authorityAgent,
                authorityTarget: authorityTarget,
                executionStatus: executionStatus,
                runtimeSource: summary.runtimeSource,
                revokedMemoryCount: revokedMemoryCount,
                primaryRoute: summary.primaryRoute,
                usedOpenClaw: summary.usedOpenClaw,
                hadFallback: summary.hadFallback,
                degraded: summary.degraded,
                degradedReason: summary.degradedReason
            )
        }

        var consultedAgent: String?
        var authorityAgent: String?
        var authorityTarget: String?
        var executionStatus: String?
        var revokedMemoryCount = 0

        for event in trace.events {
            switch event.event {
            case "coach.consult.completed":
                consultedAgent = event.metadata["consultedAgent"]?.stringValue ?? consultedAgent
            case "coach.authority.handoff.completed":
                authorityAgent = event.metadata["authorityAgent"]?.stringValue ?? authorityAgent
                authorityTarget = event.metadata["action"]?.stringValue
                    ?? event.metadata["targetKind"]?.stringValue
                    ?? authorityTarget
                executionStatus = event.metadata["executionStatus"]?.stringValue ?? executionStatus
            case "coach.memory.revoked":
                revokedMemoryCount = max(revokedMemoryCount, event.metadata["revokedMemoryCount"]?.intValue ?? 1)
            default:
                continue
            }
        }

        guard consultedAgent != nil || authorityAgent != nil || revokedMemoryCount > 0 else {
            return nil
        }

        return CoachConversationTraceSummary(
            frontAgent: nil,
            consultedAgent: consultedAgent,
            authorityAgent: authorityAgent,
            authorityTarget: authorityTarget,
            executionStatus: executionStatus,
            runtimeSource: nil,
            revokedMemoryCount: revokedMemoryCount,
            primaryRoute: nil,
            usedOpenClaw: false,
            hadFallback: false,
            degraded: false,
            degradedReason: nil
        )
    }

    private func upsertCoachConversationMessage(_ updated: CoachConversationMessagePayload) {
        if let index = coachConversationMessages.firstIndex(where: { $0.id == updated.id }) {
            coachConversationMessages[index] = updated
            return
        }
        coachConversationMessages.append(updated)
        coachConversationMessages.sort { $0.createdAt < $1.createdAt }
    }

    private func scheduleCoachConversationAutoRefreshIfNeeded() {
        coachConversationRefreshTask?.cancel()

        guard coachConversationMessages.contains(where: { $0.role == "assistant" && $0.status == "pending_full" }),
              let sessionID = coachConversationSelectedSessionID,
              let token = authSession?.accessToken else {
            return
        }

        coachConversationRefreshTask = Task { [weak self] in
            guard let self else { return }

            for _ in 0..<6 {
                try? await Task.sleep(for: .milliseconds(350))
                if Task.isCancelled { return }
                if self.coachConversationSelectedSessionID != sessionID { return }

                do {
                    try await self.loadCoachConversationSessionDetail(sessionID, token: token)
                    try await self.refreshCoachAuthoritySidecars(token: token)
                    await self.refreshCoachConversationTraceSummaries(token: token)
                    if !self.coachConversationMessages.contains(where: { $0.role == "assistant" && $0.status == "pending_full" }) {
                        return
                    }
                } catch {
                    if !self.isIgnorableCoachConversationError(error) {
                        self.currentError = error.localizedDescription
                    }
                    return
                }
            }
        }
    }

    private func isIgnorableCoachConversationError(_ error: Error) -> Bool {
        error.localizedDescription.localizedCaseInsensitiveContains("not implemented")
    }

    private func finalizeBootstrapState() {
        guard authSession != nil else {
            bootstrapState = .signedOut
            return
        }
        if currentError != nil {
            bootstrapState = .degraded
        } else {
            bootstrapState = .ready
        }
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        let messageID = response.notification.request.identifier
        let actionIdentifier = response.actionIdentifier
        let notificationKind = response.notification.request.content.userInfo["notificationKind"] as? String
        await MainActor.run {
            switch actionIdentifier {
            case ReminderCenter.snoozeActionIdentifier:
                self.snooze(messageID: messageID)
            case ReminderCenter.acknowledgeActionIdentifier:
                Task { await self.acknowledge(messageID: messageID) }
            case ReminderCenter.runtimeAlertOpenActionIdentifier:
                self.focus(destination: .settings)
            case ReminderCenter.openActionIdentifier, UNNotificationDefaultActionIdentifier:
                if notificationKind == "openclaw_registry" {
                    self.focus(destination: .settings)
                } else {
                    self.focus(destination: .reminders)
                }
            default:
                break
            }
        }
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .list, .sound]
    }
}

extension AppViewModel: StatusBarDestinationHandling {}
extension AppViewModel: AutomationAppStateProviding {}

extension AppViewModel {
    func requestNotificationPermissionForAutomation() {
        Task { @MainActor [weak self] in
            guard let self else { return }
            self.windowManager?.showMainWindow(activateApp: true)
            NSApp.activate(ignoringOtherApps: true)
            NSRunningApplication.current.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
            try? await Task.sleep(for: .milliseconds(250))
            await self.diagnostics.requestNotifications(context: "automation-command")
            await self.refreshSystemNotificationRequestIDs()
        }
    }
}

extension AppViewModel {
    static var coachPersonaOptions: [CoachPersonaOption] {
        CoachPersonaCatalog.visibleFrontOptions
    }

    var coachSelectedConversationSessionID: String? {
        coachConversationSelectedSessionID
    }

    func coachUsedConversationMemory(for messageID: String) -> [CoachConversationMemoryPayload] {
        guard let message = coachConversationMessages.first(where: { $0.id == messageID }) else { return [] }
        let usedIDs = Set(message.usedMemoryIds)
        guard !usedIDs.isEmpty else { return [] }
        return coachConversationMemoryItems.filter { usedIDs.contains($0.id) }
    }

    func coachUsedConversationMemoryDisplayLines(for messageID: String) -> [String] {
        guard let message = coachConversationMessages.first(where: { $0.id == messageID }) else { return [] }

        if !message.usedMemoryEntries.isEmpty {
            let frontAgent = coachConversationTraceSummaryByMessageID[messageID]?.frontAgent
            return message.usedMemoryEntries.map { entry in
                let source = l10n.coachMemorySourceLabel(
                    entry.source.trimmingCharacters(in: .whitespacesAndNewlines),
                    kind: entry.kind,
                    frontAgent: frontAgent
                )
                guard !source.isEmpty else { return entry.summary }
                return "\(entry.summary) [\(source)]"
            }
        }

        return coachUsedConversationMemory(for: messageID).map(\.summary)
    }

    func coachMessageExecutionTrailLines(for message: CoachConversationMessagePayload) -> [String] {
        guard let summary = coachConversationTraceSummaryByMessageID[message.id] else { return [] }
        var lines: [String] = []

        if let routeLine = l10n.coachExecutionTrailRoute(
            runtimeSource: summary.runtimeSource,
            primaryRoute: summary.primaryRoute,
            usedOpenClaw: summary.usedOpenClaw,
            hadFallback: summary.hadFallback
        ) {
            lines.append(routeLine)
        }

        if let consultedAgent = summary.consultedAgent {
            lines.append(l10n.coachExecutionTrailConsult(agentName: CoachPersonaCatalog.displayName(for: consultedAgent)))
        }

        if let authorityAgent = summary.authorityAgent {
            let authorityName = CoachPersonaCatalog.displayName(for: authorityAgent)
            let target = summary.authorityTarget.map { l10n.localizedStatus($0) }
            let status = summary.executionStatus.map { l10n.localizedStatus($0) }
            lines.append(l10n.coachExecutionTrailAuthority(agentName: authorityName, target: target, status: status))
        }

        if summary.revokedMemoryCount > 0 {
            lines.append(l10n.coachExecutionTrailMemoryRevoked(count: summary.revokedMemoryCount))
        }

        if summary.degraded {
            lines.append(l10n.coachExecutionTrailDegraded(reason: summary.degradedReason))
        }

        return lines
    }

    func coachPrimaryResponseText(for message: CoachConversationMessagePayload) -> String? {
        if let fullResponse = message.fullResponse?.trimmingCharacters(in: .whitespacesAndNewlines),
           !fullResponse.isEmpty {
            return fullResponse
        }
        if let fastResponse = message.fastResponse?.trimmingCharacters(in: .whitespacesAndNewlines),
           !fastResponse.isEmpty {
            return fastResponse
        }
        return nil
    }

    func coachPrimaryResponsePhase(for message: CoachConversationMessagePayload) -> String? {
        if let fullResponse = message.fullResponse?.trimmingCharacters(in: .whitespacesAndNewlines),
           !fullResponse.isEmpty {
            return "full"
        }
        if let fastResponse = message.fastResponse?.trimmingCharacters(in: .whitespacesAndNewlines),
           !fastResponse.isEmpty {
            return "fast"
        }
        return nil
    }

    var activeCoachFrontAgentState: CoachFrontAgentPayload {
        coachFrontAgentState ?? dashboardSummary?.coachFrontAgent ?? .defaultAuto
    }

    var coachCurrentPersonaName: String {
        CoachPersonaCatalog.displayName(for: activeCoachFrontAgentState.currentFrontAgent)
    }

    var coachVisibleSummary: String {
        activeCoachFrontAgentState.visibleSummary ?? l10n.coachVisibleSummaryFallback(personaName: coachCurrentPersonaName)
    }

    var coachRoutingModeTitle: String {
        l10n.coachRoutingModeTitle(manualOverride: activeCoachFrontAgentState.manualOverride)
    }

    var coachIsManualOverrideEnabled: Bool {
        activeCoachFrontAgentState.manualOverride
    }

    var coachSelectedPersonaID: String {
        let currentFrontAgent = activeCoachFrontAgentState.currentFrontAgent
        return currentFrontAgent == "memory-governor-agent" ? "director-agent" : currentFrontAgent
    }

    var coachConsultedSummary: String? {
        guard let consultedAgent = activeCoachFrontAgentState.consultedAgent else { return nil }
        return l10n.coachConsultedSummary(
            agentName: CoachPersonaCatalog.displayName(for: consultedAgent),
            visibleSummary: coachVisibleSummary
        )
    }

    var coachHandoffCard: CoachHandoffCardState? {
        guard let reason = activeCoachFrontAgentState.handoffReason,
              let sourceAgent = activeCoachFrontAgentState.overrideSourceAgent else {
            return nil
        }
        return CoachHandoffCardState(
            sourceDisplayName: CoachPersonaCatalog.displayName(for: sourceAgent),
            reasonKey: reason,
            reasonTitle: coachHandoffReasonTitle(reason),
            reasonDescription: coachVisibleSummary,
            nextDisplayName: CoachPersonaCatalog.displayName(for: activeCoachFrontAgentState.currentFrontAgent)
        )
    }

    var coachVisiblePersonaOptions: [CoachPersonaOption] {
        CoachPersonaCatalog.visibleFrontOptions
    }

    var coachFrontAgentDisplayName: String {
        coachCurrentPersonaName
    }

    var coachFrontAgentRoleSummary: String {
        l10n.coachPersonaRoleSummary(agentID: activeCoachFrontAgentState.currentFrontAgent)
    }

    var coachRoutingModeBadgeText: String {
        l10n.coachRoutingModeBadge(manualOverride: activeCoachFrontAgentState.manualOverride)
    }

    var coachRoutingModeDescription: String {
        l10n.coachRoutingModeDescription(manualOverride: activeCoachFrontAgentState.manualOverride)
    }

    var coachManualOverrideEnabled: Bool {
        coachIsManualOverrideEnabled
    }

    var coachConsultedAgentDisplayName: String? {
        guard let consultedAgent = activeCoachFrontAgentState.consultedAgent else { return nil }
        return CoachPersonaCatalog.displayName(for: consultedAgent)
    }

    func coachPersonaRoleSummary(for agentID: String?) -> String {
        l10n.coachPersonaRoleSummary(agentID: agentID)
    }

    var coachVisibleSummaryText: String {
        coachVisibleSummary
    }

    var coachRecallEligibleMemoryItems: [DataMemoryPayload] {
        coachMemoryItems.filter { item in
            item.memoryId != nil &&
            item.deletedAt == nil &&
            item.recallBlockedAt == nil &&
            item.status != "deleted" &&
            item.status != "recall_blocked"
        }
    }

    var coachAuthorityContractLines: [String] {
        l10n.coachAuthorityContractLines
    }

    func coachProposalMetadata(_ proposal: JarvisProposalPayload) -> [String] {
        l10n.coachProposalMetadata(proposal)
    }

    var coachSystemStatusTitle: String? {
        guard let currentError else { return nil }
        return l10n.coachSystemStatusTitle(for: currentError)
    }

    var coachSystemStatusMessage: String? {
        guard let currentError else { return nil }
        return l10n.coachSystemStatusMessage(for: currentError)
    }

    var userFacingCurrentErrorMessage: String? {
        guard let currentError, !currentError.isEmpty else { return nil }
        return l10n.userFacingErrorMessage(currentError)
    }

    var todayOperationalHeadline: String {
        dashboardSummary?.latestAssessment?.summary ?? bootstrapStatusTitle
    }

    var todaySuggestedActionSummary: String {
        dashboardSummary?.latestBehaviorConclusion?.suggestedAction ??
        dashboardSummary?.latestAssessment?.recommendedAction ??
        dashboardSummary?.latestRecoveryPlan?.nextStep ??
        l10n.noSuggestedActionYet
    }

    var todayReminderSummary: String {
        l10n.pendingReminderSummary(count: pendingReminderCount)
    }

    var bootstrapStatusTitle: String {
        l10n.bootstrapStatusTitle(bootstrapState)
    }

    var bootstrapStatusMessage: String {
        l10n.bootstrapStatusMessage(bootstrapState, currentError: currentError)
    }

    var desktopCollectionStatusTitle: String {
        l10n.desktopCollectionStatusTitle(
            collectorEnabled: collectorEnabled,
            accessibilityGranted: diagnostics.accessibilityGranted
        )
    }

    var desktopCollectionStatusDetail: String {
        l10n.desktopCollectionStatusDetail(
            collectorEnabled: collectorEnabled,
            accessibilityGranted: diagnostics.accessibilityGranted
        )
    }

    var notificationPermissionHelpText: String {
        l10n.notificationPermissionHelpText(diagnostics.notificationAuthorizationState)
    }

    var connectionStatusTitle: String {
        l10n.connectionStatusTitle(
            isSignedIn: isSignedIn,
            currentError: currentError,
            queueLength: runtimeStatus.queueLength,
            lastHeartbeatAt: runtimeStatus.lastHeartbeatAt
        )
    }

    var connectionStatusDetail: String {
        l10n.connectionStatusDetail(
            isSignedIn: isSignedIn,
            currentError: currentError,
            queueLength: runtimeStatus.queueLength,
            lastHeartbeatAt: runtimeStatus.lastHeartbeatAt
        )
    }

    var reminderStatusTitle: String? {
        l10n.reminderStatusTitle(reminderStatusContext)
    }

    var reminderStatusMessage: String? {
        l10n.reminderStatusMessage(reminderStatusContext)
    }

    private func coachHandoffReasonTitle(_ reason: String) -> String {
        l10n.coachHandoffReasonTitle(reason)
    }

    var supportExportStatusTitle: String {
        l10n.supportExportStatusTitle(hasExport: localStore.state.lastDiagnosticsExportPath != nil)
    }

    var supportExportStatusMessage: String {
        let exportedAt: String
        if let exportDate = localStore.state.lastDiagnosticsExportAt {
            exportedAt = exportDate.formatted(date: .abbreviated, time: .shortened)
        } else {
            exportedAt = l10n.notAvailable
        }
        return l10n.supportExportStatusMessage(
            path: localStore.state.lastDiagnosticsExportPath,
            exportedAt: exportedAt
        )
    }

    var lastDiagnosticsExportPath: String? {
        localStore.state.lastDiagnosticsExportPath
    }

    var localDiagnosticsStoragePath: String {
        localStore.storageDirectoryPath
    }

    var localDiagnosticsStateFilePath: String {
        localStore.stateFilePath
    }

    var openClawNativePersonaCount: Int {
        openClawRegistryVisibility?.nativeRegistry.totalAgents ?? 0
    }

    var openClawExternalConfigured: Bool {
        openClawRegistryVisibility?.externalRuntime.configured ?? false
    }

    var openClawExternalReachable: Bool {
        openClawRegistryVisibility?.externalRuntime.reachable ?? false
    }

    var openClawExternalBaseURL: String {
        openClawRegistryVisibility?.externalRuntime.baseUrl ?? l10n.notAvailable
    }

    var openClawMatchedAgentCount: Int {
        openClawRegistryVisibility?.externalRuntime.matchedAgentIds.count ?? 0
    }

    var openClawMissingExternalAgentsSummary: String {
        let values = openClawRegistryVisibility?.externalRuntime.missingInExternal ?? []
        return values.isEmpty ? l10n.none : values.joined(separator: ", ")
    }

    var openClawUnknownExternalAgentsSummary: String {
        let values = openClawRegistryVisibility?.externalRuntime.unknownExternalAgents ?? []
        return values.isEmpty ? l10n.none : values.joined(separator: ", ")
    }

    var openClawRuntimeDisplay: String {
        let runtime = openClawRegistryVisibility?.externalRuntime.runtime
        let version = openClawRegistryVisibility?.externalRuntime.runtimeVersion
        switch (runtime, version) {
        case let (.some(runtime), .some(version)) where !runtime.isEmpty && !version.isEmpty:
            return "\(runtime) · \(version)"
        case let (.some(runtime), _ ) where !runtime.isEmpty:
            return runtime
        case let (_, .some(version)) where !version.isEmpty:
            return version
        default:
            return l10n.notAvailable
        }
    }

    var openClawExternalAgentCount: Int {
        openClawRegistryVisibility?.externalRuntime.agentCount ?? 0
    }

    var openClawRegistryIssueCount: Int {
        if let total = openClawRegistryVisibility?.externalRuntime.healthIssueCounts?.totalIssueCount {
            return total
        }
        return openClawRegistryVisibility?.externalRuntime.missingInExternal.count ?? 0
    }

    var openClawRegistryIssueSummary: String {
        if openClawRegistryIssueCount == 0 {
            return l10n.none
        }
        if appLanguage == .chinese {
            return "\(openClawRegistryIssueCount) 个问题"
        }
        return openClawRegistryIssueCount == 1 ? "1 issue" : "\(openClawRegistryIssueCount) issues"
    }

    var openClawRegistryReasonSummary: String {
        let values = openClawRegistryVisibility?.externalRuntime.healthReasonCodes ?? []
        return values.isEmpty ? l10n.none : values.joined(separator: ", ")
    }

    var openClawRegistryContractSummaryLines: [String] {
        guard let external = openClawRegistryVisibility?.externalRuntime else { return [] }
        var lines: [String] = []

        if !external.runtimeContractMismatches.isEmpty {
            let values = external.runtimeContractMismatches.joined(separator: ", ")
            lines.append(appLanguage == .chinese ? "Runtime contract：\(values)" : "Runtime contract: \(values)")
        }

        if !external.contractMismatches.isEmpty {
            let entry = external.contractMismatches[0]
            let values = entry.mismatchFields.joined(separator: ", ")
            lines.append(appLanguage == .chinese ? "Persona contract：\(entry.agentId) · \(values)" : "Persona contract: \(entry.agentId) · \(values)")
        }

        if !external.workflowContractMismatches.isEmpty {
            let entry = external.workflowContractMismatches[0]
            let values = entry.missingRequiredContextFields.joined(separator: ", ")
            lines.append(appLanguage == .chinese ? "Workflow payload：\(entry.workflow) · \(values)" : "Workflow payload: \(entry.workflow) · \(values)")
        }

        if !external.workflowResponseContractMismatches.isEmpty {
            let entry = external.workflowResponseContractMismatches[0]
            let values = entry.missingRequiredParsedFields.joined(separator: ", ")
            lines.append(appLanguage == .chinese ? "Workflow response：\(entry.workflow) · \(values)" : "Workflow response: \(entry.workflow) · \(values)")
        }

        if !external.workflowExecutionContractMismatches.isEmpty {
            let entry = external.workflowExecutionContractMismatches[0]
            let values = (entry.missingRequiredMetadataFields + entry.missingMemoryFetchFields + entry.missingAuthorityApplyFields)
                .joined(separator: ", ")
            lines.append(appLanguage == .chinese ? "Execute contract：\(entry.workflow) · \(values)" : "Execute contract: \(entry.workflow) · \(values)")
        }

        if !external.workflowExecutionProbeMismatches.isEmpty {
            let entry = external.workflowExecutionProbeMismatches[0]
            let suffix = [entry.target, entry.error].compactMap { value in
                guard let value, !value.isEmpty else { return nil }
                return value
            }.joined(separator: " · ")
            lines.append(
                appLanguage == .chinese
                    ? "Execute probe：\(entry.workflow) · \(suffix)"
                    : "Execute probe: \(entry.workflow) · \(suffix)"
            )
        }

        return lines
    }

    var openClawRegistryStatusTone: RegistryStatusTone {
        guard let visibility = openClawRegistryVisibility else { return .neutral }
        let external = visibility.externalRuntime
        if let healthStatus = external.healthStatus {
            switch healthStatus {
            case "unreachable":
                return .danger
            case "attention":
                return .warning
            case "aligned":
                return .good
            case "not_configured":
                return .warning
            default:
                break
            }
        }
        if external.configured && !external.reachable {
            return .danger
        }
        if !external.configured || !external.missingInExternal.isEmpty {
            return .warning
        }
        if external.reachable {
            return .good
        }
        return .neutral
    }

    var openClawRegistryStatusTitle: String {
        guard let visibility = openClawRegistryVisibility else {
            return appLanguage == .chinese ? "OpenClaw Registry 未加载" : "OpenClaw Registry not loaded"
        }
        let external = visibility.externalRuntime
        if let healthStatus = external.healthStatus {
            switch healthStatus {
            case "unreachable":
                return appLanguage == .chinese ? "OpenClaw Registry 不可达" : "OpenClaw Registry unreachable"
            case "not_configured":
                return appLanguage == .chinese ? "OpenClaw Registry 未配置" : "OpenClaw Registry not configured"
            case "attention":
                return appLanguage == .chinese ? "OpenClaw Registry 需要检查" : "OpenClaw Registry needs attention"
            case "aligned":
                return appLanguage == .chinese ? "OpenClaw Registry 已对齐" : "OpenClaw Registry aligned"
            default:
                break
            }
        }
        if external.configured && !external.reachable {
            return appLanguage == .chinese ? "OpenClaw Registry 不可达" : "OpenClaw Registry unreachable"
        }
        if !external.configured {
            return appLanguage == .chinese ? "OpenClaw Registry 未配置" : "OpenClaw Registry not configured"
        }
        if !external.missingInExternal.isEmpty {
            return appLanguage == .chinese ? "OpenClaw Registry 需要检查" : "OpenClaw Registry needs attention"
        }
        return appLanguage == .chinese ? "OpenClaw Registry 已对齐" : "OpenClaw Registry aligned"
    }

    var openClawRegistryStatusMessage: String {
        guard let visibility = openClawRegistryVisibility else {
            return appLanguage == .chinese
                ? "尚未从 Gateway 读取 OpenClaw registry 对照结果。"
                : "The OpenClaw registry comparison has not been loaded from the Gateway yet."
        }

        let external = visibility.externalRuntime
        if let healthStatus = external.healthStatus {
            switch healthStatus {
            case "unreachable":
                let reason = [external.baseUrl, external.error].compactMap { value in
                    guard let value, !value.isEmpty else { return nil }
                    return value
                }.joined(separator: " · ")
                return appLanguage == .chinese
                    ? "已配置外部 OpenClaw runtime，但当前无法连通：\(reason)。请检查 OpenClaw runtime / Registry 是否在线，然后刷新连接。"
                    : "An external OpenClaw runtime is configured, but it is currently unreachable: \(reason). Check the OpenClaw runtime / Registry, then refresh the connection."
            case "not_configured":
                return appLanguage == .chinese
                    ? "当前未配置外部 OpenClaw runtime；目前只能确认本仓库 native persona registry。"
                    : "No external OpenClaw runtime is configured yet; only the repository-native persona registry can be confirmed right now."
            case "attention":
                return appLanguage == .chinese
                    ? "外部实例 \(openClawRuntimeDisplay) 需要检查：\(openClawRegistryIssueSummary)。原因：\(openClawRegistryReasonSummary)。"
                    : "The external runtime \(openClawRuntimeDisplay) needs attention: \(openClawRegistryIssueSummary). Reasons: \(openClawRegistryReasonSummary)."
            case "aligned":
                return appLanguage == .chinese
                    ? "外部实例 \(openClawRuntimeDisplay) 已可达，\(openClawMatchedAgentCount) 个 persona 已对齐，另有 \(openClawUnknownExternalAgentsSummary == l10n.none ? 0 : (openClawRegistryVisibility?.externalRuntime.unknownExternalAgents.count ?? 0)) 个额外 workflow agents。"
                    : "The external runtime \(openClawRuntimeDisplay) is reachable, \(openClawMatchedAgentCount) personas are aligned, and there are \(openClawUnknownExternalAgentsSummary == l10n.none ? 0 : (openClawRegistryVisibility?.externalRuntime.unknownExternalAgents.count ?? 0)) additional workflow agents."
            default:
                break
            }
        }

        if external.configured && !external.reachable {
            let reason = [external.baseUrl, external.error].compactMap { value in
                guard let value, !value.isEmpty else { return nil }
                return value
            }.joined(separator: " · ")
            return appLanguage == .chinese
                ? "已配置外部 OpenClaw runtime，但当前无法连通：\(reason)。请检查 OpenClaw runtime / Registry 是否在线，然后刷新连接。"
                : "An external OpenClaw runtime is configured, but it is currently unreachable: \(reason). Check the OpenClaw runtime / Registry, then refresh the connection."
        }
        if !external.configured {
            return appLanguage == .chinese
                ? "当前未配置外部 OpenClaw runtime；目前只能确认本仓库 native persona registry。"
                : "No external OpenClaw runtime is configured yet; only the repository-native persona registry can be confirmed right now."
        }
        if !external.missingInExternal.isEmpty {
            let missing = external.missingInExternal.joined(separator: ", ")
            return appLanguage == .chinese
                ? "外部 OpenClaw 已连通，但仍缺少 \(external.missingInExternal.count) 个 persona：\(missing)"
                : "The external OpenClaw runtime is reachable, but it is still missing \(external.missingInExternal.count) personas: \(missing)"
        }

        return appLanguage == .chinese
            ? "外部实例 \(openClawRuntimeDisplay) 已可达，\(openClawMatchedAgentCount) 个 persona 已对齐，另有 \(openClawUnknownExternalAgentsSummary == l10n.none ? 0 : (openClawRegistryVisibility?.externalRuntime.unknownExternalAgents.count ?? 0)) 个额外 workflow agents。"
            : "The external runtime \(openClawRuntimeDisplay) is reachable, \(openClawMatchedAgentCount) personas are aligned, and there are \(openClawUnknownExternalAgentsSummary == l10n.none ? 0 : (openClawRegistryVisibility?.externalRuntime.unknownExternalAgents.count ?? 0)) additional workflow agents."
    }

    var shouldShowOpenClawRegistryCallout: Bool {
        openClawRegistryVisibility != nil
    }

    var openClawRegistryMenuStatus: String? {
        guard shouldShowOpenClawRegistryCallout else { return nil }
        switch openClawRegistryStatusTone {
        case .good:
            return appLanguage == .chinese ? "OpenClaw：已对齐" : "OpenClaw: aligned"
        case .warning:
            return appLanguage == .chinese ? "OpenClaw：需检查" : "OpenClaw: attention"
        case .danger:
            return appLanguage == .chinese ? "OpenClaw：不可达" : "OpenClaw: unreachable"
        case .neutral:
            return appLanguage == .chinese ? "OpenClaw：未加载" : "OpenClaw: not loaded"
        }
    }

    var isSignedInForAutomation: Bool { isSignedIn }
    var accountEmailForAutomation: String { accountEmail }
    var notificationStatusForAutomation: String { diagnostics.notificationStatusDescription }
    var systemNotificationRequestIDsForAutomation: [String] { systemNotificationRequestIDs }
    var currentErrorMessageForAutomation: String? { currentError }
    var userFacingCurrentErrorMessageForAutomation: String? { userFacingCurrentErrorMessage }
    var bootstrapStatusTitleForAutomation: String { bootstrapStatusTitle }
    var bootstrapStatusMessageForAutomation: String { bootstrapStatusMessage }
    var connectionStatusTitleForAutomation: String { connectionStatusTitle }
    var connectionStatusDetailForAutomation: String { connectionStatusDetail }
    var openClawRegistryStatusToneForAutomation: String {
        switch openClawRegistryStatusTone {
        case .neutral:
            return "neutral"
        case .good:
            return "good"
        case .warning:
            return "warning"
        case .danger:
            return "danger"
        }
    }
    var openClawRegistryStatusTitleForAutomation: String { openClawRegistryStatusTitle }
    var openClawRegistryStatusMessageForAutomation: String { openClawRegistryStatusMessage }
    var openClawRegistryIssueSummaryForAutomation: String { openClawRegistryIssueSummary }
    var openClawRegistryReasonSummaryForAutomation: String { openClawRegistryReasonSummary }
    var openClawRegistryContractSummaryLinesForAutomation: [String] { openClawRegistryContractSummaryLines }
    var coachDraftTextForAutomation: String { coachConversationDraft }
    var coachConversationSessionCountForAutomation: Int { coachConversationSessions.count }
    var coachConversationMessageCountForAutomation: Int { coachConversationMessages.count }
    var coachLastUserMessageTextForAutomation: String? {
        coachConversationMessages.last(where: { $0.role == "user" })?.userText
    }
    var coachLastAssistantStatusForAutomation: String? {
        coachConversationMessages.last(where: { $0.role == "assistant" })?.status
    }
    var coachLastAssistantFastResponseForAutomation: String? {
        coachConversationMessages.last(where: { $0.role == "assistant" })?.fastResponse
    }
    var coachLastAssistantFullResponseForAutomation: String? {
        coachConversationMessages.last(where: { $0.role == "assistant" })?.fullResponse
    }
    var coachLastAssistantPrimaryResponseForAutomation: String? {
        guard let message = coachConversationMessages.last(where: { $0.role == "assistant" }) else { return nil }
        return coachPrimaryResponseText(for: message)
    }
    var coachLastAssistantExecutionTrailForAutomation: [String] {
        guard let message = coachConversationMessages.last(where: { $0.role == "assistant" }) else { return [] }
        return coachMessageExecutionTrailLines(for: message)
    }
    var coachLastFeedbackLabelForAutomation: String? {
        guard let messageID = coachConversationMessages.last(where: { $0.role == "assistant" })?.id else { return nil }
        return coachConversationFeedbackByMessageID[messageID]?.label
    }
    var coachActiveMemoryCountForAutomation: Int {
        coachConversationMemoryItems.filter { $0.status == "active" }.count
    }
    var coachRevokedMemoryCountForAutomation: Int {
        coachConversationMemoryItems.filter { $0.status == "revoked" }.count
    }

    func acknowledgeReminderForAutomation(messageID: String?) {
        let resolvedMessageID = messageID ?? inboxOverview?.pendingMessages.first?.id
        guard let resolvedMessageID else { return }
        selectedDestination = .reminders
        Task { [weak self] in
            await self?.acknowledge(messageID: resolvedMessageID)
        }
    }

    func openCoachForAutomation() {
        selectedDestination = .coach
    }

    func refreshCoachConversationForAutomation() {
        selectedDestination = .coach
        Task { [weak self] in
            await self?.refreshCoachConversation()
        }
    }

    func setCoachDraftTextForAutomation(_ text: String) {
        selectedDestination = .coach
        coachConversationDraft = text
    }

    func sendCoachConversationForAutomation() {
        selectedDestination = .coach
        Task { [weak self] in
            await self?.sendCoachConversationMessage()
        }
    }

    func submitCoachFeedbackForAutomation(messageID: String?, label: String) {
        let resolvedMessageID = messageID ?? coachConversationMessages.last(where: { $0.role == "assistant" })?.id
        guard let resolvedMessageID else { return }
        selectedDestination = .coach
        Task { [weak self] in
            await self?.submitCoachConversationFeedback(messageID: resolvedMessageID, label: label)
        }
    }

    func revokeCoachConversationMemoryForAutomation(memoryID: String?) {
        let resolvedMemoryID = memoryID ?? coachConversationMemoryItems.first(where: { $0.status == "active" })?.id
        guard let resolvedMemoryID else { return }
        selectedDestination = .coach
        Task { [weak self] in
            await self?.deleteCoachConversationMemory(resolvedMemoryID)
        }
    }

    func refreshOpenClawRegistryForAutomation() {
        Task { [weak self] in
            await self?.refreshOpenClawRegistryVisibility()
        }
    }
}

private final class NoopDesktopActivityCollector: DesktopActivityCollecting {
    func start() {}
    func stop() {}
}
