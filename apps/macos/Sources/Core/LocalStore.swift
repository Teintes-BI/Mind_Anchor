import Foundation

final class LocalStore {
    struct PersistedState: Codable {
        var queuedSignals: [DesktopSignalEvent] = []
        var reminderMetadata: ReminderMetadata = .init()
        var recentActivity: RecentActivitySnapshot = .init()
        var lastInboxOverview: InboxOverviewPayload?
        var lastDashboardSummary: DashboardSummaryPayload?
        var lastGoalFlowOverview: GoalFlowOverviewPayload?
        var lastReflectionOverview: ReflectionOverviewPayload?
        var lastStateTrends: StateTrendsPayload?
        var lastErrorMessage: String?
        var lastSyncAt: Date?
        var lastHeartbeatAt: Date?
        var permissionsPromptDismissedAt: Date?
        var lastDiagnosticsExportAt: Date?
        var lastDiagnosticsExportPath: String?
    }

    private let baseDirectory: URL
    private let fileURL: URL
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    private(set) var state: PersistedState

    init(appSupportDirectory: URL) {
        let directory = appSupportDirectory.appendingPathComponent("MindAnchorMac", isDirectory: true)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        self.baseDirectory = directory
        self.fileURL = directory.appendingPathComponent("desktop-state.json")
        self.encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        self.encoder.dateEncodingStrategy = .iso8601
        self.decoder.dateDecodingStrategy = .iso8601
        if let data = try? Data(contentsOf: fileURL), let decoded = try? decoder.decode(PersistedState.self, from: data) {
            self.state = decoded
        } else {
            self.state = PersistedState()
            persist()
        }
    }

    func persist() {
        guard let data = try? encoder.encode(state) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }

    func enqueue(signal: DesktopSignalEvent) {
        state.queuedSignals.append(signal)
        persist()
    }

    func replaceQueuedSignals(_ signals: [DesktopSignalEvent]) {
        state.queuedSignals = signals
        persist()
    }

    func markError(_ message: String?) {
        state.lastErrorMessage = message
        persist()
    }

    func markSync(date: Date = .now) {
        state.lastSyncAt = date
        state.lastErrorMessage = nil
        persist()
    }

    func markHeartbeat(date: Date = .now) {
        state.lastHeartbeatAt = date
        persist()
    }

    func updateRecentActivity(_ update: (inout RecentActivitySnapshot) -> Void) {
        update(&state.recentActivity)
        state.recentActivity.lastUpdatedAt = .now
        persist()
    }

    func updateReminderMetadata(_ update: (inout ReminderMetadata) -> Void) {
        update(&state.reminderMetadata)
        persist()
    }

    func dismissPermissionsPrompt() {
        state.permissionsPromptDismissedAt = .now
        persist()
    }

    func cacheBootstrap(
        dashboard: DashboardSummaryPayload,
        goalFlow: GoalFlowOverviewPayload,
        inbox: InboxOverviewPayload
    ) {
        state.lastDashboardSummary = dashboard
        state.lastGoalFlowOverview = goalFlow
        state.lastInboxOverview = inbox
        persist()
    }

    func cacheInboxOverview(_ inbox: InboxOverviewPayload) {
        state.lastInboxOverview = inbox
        persist()
    }

    func cacheSupplementary(
        reflections: ReflectionOverviewPayload?,
        stateTrends: StateTrendsPayload?
    ) {
        state.lastReflectionOverview = reflections
        state.lastStateTrends = stateTrends
        persist()
    }

    func exportDiagnosticsSnapshot(_ snapshot: SupportDiagnosticsSnapshot) throws -> URL {
        let exportsDirectory = baseDirectory.appendingPathComponent("DiagnosticsExports", isDirectory: true)
        try FileManager.default.createDirectory(at: exportsDirectory, withIntermediateDirectories: true)
        let fileName = "mindanchor-diagnostics-\(Self.exportTimestampFormatter.string(from: snapshot.generatedAt)).json"
        let exportURL = exportsDirectory.appendingPathComponent(fileName)
        let data = try encoder.encode(snapshot)
        try data.write(to: exportURL, options: .atomic)
        state.lastDiagnosticsExportAt = snapshot.generatedAt
        state.lastDiagnosticsExportPath = exportURL.path
        persist()
        return exportURL
    }

    var storageDirectoryPath: String {
        baseDirectory.path
    }

    var stateFilePath: String {
        fileURL.path
    }

    private static let exportTimestampFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyyMMdd-HHmmss"
        return formatter
    }()
}
