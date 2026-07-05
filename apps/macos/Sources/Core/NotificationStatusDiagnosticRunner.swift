import Foundation

struct NotificationStatusDiagnosticPayload: Codable, Equatable {
    let generatedAt: String
    let bundleIdentifier: String
    let notificationAuthorizationState: String
    let notificationStatusDescription: String
    let accessibilityGranted: Bool
}

@MainActor
enum NotificationStatusDiagnosticRunner {
    private static let formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    static func makePayload(
        bundleIdentifier: String,
        diagnostics: PermissionsDiagnostics,
        generatedAt: Date = Date()
    ) -> NotificationStatusDiagnosticPayload {
        NotificationStatusDiagnosticPayload(
            generatedAt: formatter.string(from: generatedAt),
            bundleIdentifier: bundleIdentifier,
            notificationAuthorizationState: diagnostics.notificationAuthorizationState.diagnosticName,
            notificationStatusDescription: diagnostics.notificationStatusDescription,
            accessibilityGranted: diagnostics.accessibilityGranted
        )
    }

    static func writePayload(_ payload: NotificationStatusDiagnosticPayload, outputURL: URL) throws {
        try FileManager.default.createDirectory(
            at: outputURL.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(payload)
        try data.write(to: outputURL, options: .atomic)
    }

    static func run(
        diagnostics: PermissionsDiagnostics,
        outputURL: URL,
        bundleIdentifier: String
    ) async throws {
        await diagnostics.refresh(context: "notification-status-diagnostic")
        let payload = makePayload(
            bundleIdentifier: bundleIdentifier,
            diagnostics: diagnostics
        )
        try writePayload(payload, outputURL: outputURL)
    }
}
