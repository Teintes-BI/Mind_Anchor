import ApplicationServices
import UserNotifications
import Foundation

enum NotificationAuthorizationState: Equatable {
    case checking
    case allowed
    case denied
    case notRequested
    case unknown

    var diagnosticName: String {
        switch self {
        case .checking:
            return "checking"
        case .allowed:
            return "allowed"
        case .denied:
            return "denied"
        case .notRequested:
            return "not_requested"
        case .unknown:
            return "unknown"
        }
    }
}

@MainActor
final class PermissionsDiagnostics: ObservableObject {
    @Published private(set) var notificationStatusDescription = "Checking…"
    @Published private(set) var notificationAuthorizationState: NotificationAuthorizationState = .checking
    @Published private(set) var accessibilityGranted = AXIsProcessTrusted()
    private let debugLogger: NotificationPermissionDebugLogger

    var currentNotificationAuthorizationState: NotificationAuthorizationState {
        notificationAuthorizationState
    }

    var currentNotificationStatusDescription: String {
        notificationStatusDescription
    }

    init(
        notificationAuthorizationState: NotificationAuthorizationState = .checking,
        notificationStatusDescription: String = "Checking…",
        accessibilityGranted: Bool = AXIsProcessTrusted(),
        debugLogger: NotificationPermissionDebugLogger = NotificationPermissionDebugLogger()
    ) {
        self.notificationAuthorizationState = notificationAuthorizationState
        self.notificationStatusDescription = notificationStatusDescription
        self.accessibilityGranted = accessibilityGranted
        self.debugLogger = debugLogger
    }

    func refresh(context: String = "refresh") async {
        accessibilityGranted = AXIsProcessTrusted()
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        debugLogger.log(
            "notification settings refreshed",
            context: context,
            authorizationStatus: settings.authorizationStatus
        )
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            notificationAuthorizationState = .allowed
            notificationStatusDescription = "Notifications allowed"
        case .denied:
            notificationAuthorizationState = .denied
            notificationStatusDescription = "Notifications denied"
        case .notDetermined:
            notificationAuthorizationState = .notRequested
            notificationStatusDescription = "Notifications not requested"
        @unknown default:
            notificationAuthorizationState = .unknown
            notificationStatusDescription = "Notifications status unknown"
        }
    }

    func requestNotifications(context: String = "manual-request") async {
        let beforeSettings = await UNUserNotificationCenter.current().notificationSettings()
        debugLogger.log(
            "requestAuthorization starting",
            context: context,
            authorizationStatus: beforeSettings.authorizationStatus
        )
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
            debugLogger.log(
                "requestAuthorization returned",
                context: context,
                granted: granted
            )
        } catch {
            debugLogger.log(
                "requestAuthorization threw \(error.localizedDescription)",
                context: context
            )
        }
        await refresh(context: "\(context)-after-request")
    }
}
