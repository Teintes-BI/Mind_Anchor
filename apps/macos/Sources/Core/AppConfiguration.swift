import Foundation

enum ConfigurationError: LocalizedError {
    case missingAPIBaseURL
    case missingSupabaseURL
    case missingSupabaseAnonKey

    var errorDescription: String? {
        switch self {
        case .missingAPIBaseURL:
            return "Missing MINDANCHOR_API_BASE_URL in build settings."
        case .missingSupabaseURL:
            return "Missing MINDANCHOR_SUPABASE_URL in build settings."
        case .missingSupabaseAnonKey:
            return "Missing MINDANCHOR_SUPABASE_ANON_KEY in build settings."
        }
    }
}

struct AppConfiguration {
    struct DebugAuthBootstrap {
        let mode: String
        let email: String
        let password: String
        let displayName: String?
    }

    let apiBaseURL: URL
    let supabaseURL: URL?
    let supabaseAnonKey: String?
    let authDevToken: String?
    let debugAuthBootstrap: DebugAuthBootstrap?
    let notificationSnoozeMinutes: Int
    let inboxPollInterval: TimeInterval
    let heartbeatInterval: TimeInterval
    let idleThresholdSeconds: TimeInterval
    let authSessionAccount: String
    let reminderPollingOnly: Bool
    let autoRequestNotificationsOnBootstrap: Bool
    let notificationStatusDiagnosticOutputPath: String?

    init(
        apiBaseURL: URL,
        supabaseURL: URL?,
        supabaseAnonKey: String?,
        authDevToken: String?,
        debugAuthBootstrap: DebugAuthBootstrap?,
        notificationSnoozeMinutes: Int,
        inboxPollInterval: TimeInterval,
        heartbeatInterval: TimeInterval,
        idleThresholdSeconds: TimeInterval,
        authSessionAccount: String = "mindanchor-auth-session",
        reminderPollingOnly: Bool = false,
        autoRequestNotificationsOnBootstrap: Bool = false,
        notificationStatusDiagnosticOutputPath: String? = nil
    ) {
        self.apiBaseURL = apiBaseURL
        self.supabaseURL = supabaseURL
        self.supabaseAnonKey = supabaseAnonKey
        self.authDevToken = authDevToken
        self.debugAuthBootstrap = debugAuthBootstrap
        self.notificationSnoozeMinutes = notificationSnoozeMinutes
        self.inboxPollInterval = inboxPollInterval
        self.heartbeatInterval = heartbeatInterval
        self.idleThresholdSeconds = idleThresholdSeconds
        self.authSessionAccount = authSessionAccount
        self.reminderPollingOnly = reminderPollingOnly
        self.autoRequestNotificationsOnBootstrap = autoRequestNotificationsOnBootstrap
        self.notificationStatusDiagnosticOutputPath = notificationStatusDiagnosticOutputPath
    }

    static func load(
        bundle: Bundle = .main,
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) throws -> AppConfiguration {

        let apiBaseURLString = environment["MINDANCHOR_API_BASE_URL"] ?? (bundle.object(forInfoDictionaryKey: "MINDANCHOR_API_BASE_URL") as? String)
        guard let apiBaseURL = validatedBaseURL(apiBaseURLString) else {
            throw ConfigurationError.missingAPIBaseURL
        }

        let supabaseURLString = environment["MINDANCHOR_SUPABASE_URL"] ?? (bundle.object(forInfoDictionaryKey: "MINDANCHOR_SUPABASE_URL") as? String)
        let supabaseURL = supabaseURLString.flatMap(URL.init(string:))
        let supabaseAnonKey = environment["MINDANCHOR_SUPABASE_ANON_KEY"] ?? (bundle.object(forInfoDictionaryKey: "MINDANCHOR_SUPABASE_ANON_KEY") as? String)
        let authDevToken = environment["MINDANCHOR_AUTH_DEV_TOKEN"] ?? (bundle.object(forInfoDictionaryKey: "MINDANCHOR_AUTH_DEV_TOKEN") as? String)
        let bootstrapMode = environment["MINDANCHOR_AUTH_BOOTSTRAP_MODE"] ?? (bundle.object(forInfoDictionaryKey: "MINDANCHOR_AUTH_BOOTSTRAP_MODE") as? String)
        let bootstrapEmail = environment["MINDANCHOR_AUTH_BOOTSTRAP_EMAIL"] ?? (bundle.object(forInfoDictionaryKey: "MINDANCHOR_AUTH_BOOTSTRAP_EMAIL") as? String)
        let bootstrapPassword = environment["MINDANCHOR_AUTH_BOOTSTRAP_PASSWORD"] ?? (bundle.object(forInfoDictionaryKey: "MINDANCHOR_AUTH_BOOTSTRAP_PASSWORD") as? String)
        let bootstrapDisplayName = environment["MINDANCHOR_AUTH_BOOTSTRAP_DISPLAY_NAME"] ?? (bundle.object(forInfoDictionaryKey: "MINDANCHOR_AUTH_BOOTSTRAP_DISPLAY_NAME") as? String)
        let debugAuthBootstrap: DebugAuthBootstrap?
        if let bootstrapMode, let bootstrapEmail, let bootstrapPassword,
           !bootstrapMode.isEmpty, !bootstrapEmail.isEmpty, !bootstrapPassword.isEmpty {
            debugAuthBootstrap = DebugAuthBootstrap(
                mode: bootstrapMode,
                email: bootstrapEmail,
                password: bootstrapPassword,
                displayName: bootstrapDisplayName?.isEmpty == false ? bootstrapDisplayName : nil
            )
        } else {
            debugAuthBootstrap = nil
        }

        let configuration = AppConfiguration(
            apiBaseURL: apiBaseURL,
            supabaseURL: supabaseURL,
            supabaseAnonKey: supabaseAnonKey,
            authDevToken: authDevToken,
            debugAuthBootstrap: debugAuthBootstrap,
            notificationSnoozeMinutes: parseInt(
                environment["MINDANCHOR_NOTIFICATION_SNOOZE_MINUTES"],
                defaultValue: 15
            ),
            inboxPollInterval: parseTimeInterval(
                environment["MINDANCHOR_INBOX_POLL_INTERVAL_SECONDS"],
                defaultValue: 30
            ),
            heartbeatInterval: parseTimeInterval(
                environment["MINDANCHOR_HEARTBEAT_INTERVAL_SECONDS"],
                defaultValue: 60
            ),
            idleThresholdSeconds: parseTimeInterval(
                environment["MINDANCHOR_IDLE_THRESHOLD_SECONDS"],
                defaultValue: 120
            ),
            authSessionAccount: parseString(
                environment["MINDANCHOR_AUTH_SESSION_ACCOUNT"],
                defaultValue: "mindanchor-auth-session"
            ),
            reminderPollingOnly: parseBool(
                environment["MINDANCHOR_REMINDER_POLLING_ONLY"],
                defaultValue: false
            ),
            autoRequestNotificationsOnBootstrap: parseBool(
                environment["MINDANCHOR_AUTO_REQUEST_NOTIFICATIONS_ON_BOOTSTRAP"],
                defaultValue: false
            ),
            notificationStatusDiagnosticOutputPath: environment["MINDANCHOR_NOTIFICATION_STATUS_DIAGNOSTIC_OUTPUT_FILE"]
        )
        AppConfigurationLogger.write(configuration: configuration)
        return configuration
    }

    private static func validatedBaseURL(_ rawValue: String?) -> URL? {
        guard let rawValue else { return nil }
        let trimmed = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              !trimmed.hasPrefix("$("),
              let url = URL(string: trimmed),
              let scheme = url.scheme,
              !scheme.isEmpty,
              let host = url.host,
              !host.isEmpty else {
            return nil
        }
        return url
    }
}

private func parseInt(_ value: String?, defaultValue: Int) -> Int {
    guard let value, let parsed = Int(value), parsed > 0 else {
        return defaultValue
    }
    return parsed
}

private func parseTimeInterval(_ value: String?, defaultValue: TimeInterval) -> TimeInterval {
    guard let value, let parsed = TimeInterval(value), parsed > 0 else {
        return defaultValue
    }
    return parsed
}

private func parseString(_ value: String?, defaultValue: String) -> String {
    guard let value, !value.isEmpty else {
        return defaultValue
    }
    return value
}

private func parseBool(_ value: String?, defaultValue: Bool) -> Bool {
    guard let value else {
        return defaultValue
    }
    switch value.lowercased() {
    case "1", "true", "yes", "on":
        return true
    case "0", "false", "no", "off":
        return false
    default:
        return defaultValue
    }
}

enum AppConfigurationLogger {
    static func write(configuration: AppConfiguration) {
        let logURL = FileManager.default.temporaryDirectory.appendingPathComponent("mindanchor-macos-config.log")
        let lines = [
            "apiBaseURL=\(configuration.apiBaseURL.absoluteString)",
            "supabaseURL=\(configuration.supabaseURL?.absoluteString ?? "nil")",
            "supabaseAnonKey=\(configuration.supabaseAnonKey?.isEmpty == false ? "set" : "nil")",
            "authDevToken=\(configuration.authDevToken?.isEmpty == false ? "set" : "nil")",
            "debugAuthBootstrap=\(configuration.debugAuthBootstrap?.email ?? "nil")",
            "authSessionAccount=\(configuration.authSessionAccount)",
            "reminderPollingOnly=\(configuration.reminderPollingOnly)",
            "autoRequestNotificationsOnBootstrap=\(configuration.autoRequestNotificationsOnBootstrap)",
            "notificationStatusDiagnosticOutputPath=\(configuration.notificationStatusDiagnosticOutputPath ?? "nil")",
        ]
        try? lines.joined(separator: "\n").write(to: logURL, atomically: true, encoding: .utf8)
    }
}
