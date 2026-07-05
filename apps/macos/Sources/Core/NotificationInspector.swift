import Foundation
import UserNotifications

@MainActor
protocol NotificationInspecting: AnyObject {
    func fetchSystemNotificationRequestIDs() async -> [String]
}

@MainActor
final class SystemNotificationInspector: NotificationInspecting {
    func fetchSystemNotificationRequestIDs() async -> [String] {
        let pendingIDs = await withCheckedContinuation { continuation in
            UNUserNotificationCenter.current().getPendingNotificationRequests { requests in
                continuation.resume(returning: requests.map(\.identifier))
            }
        }

        let deliveredIDs = await withCheckedContinuation { continuation in
            UNUserNotificationCenter.current().getDeliveredNotifications { notifications in
                continuation.resume(returning: notifications.map { $0.request.identifier })
            }
        }

        return Array(Set(pendingIDs + deliveredIDs)).sorted()
    }
}

@MainActor
final class NoopNotificationInspector: NotificationInspecting {
    func fetchSystemNotificationRequestIDs() async -> [String] {
        []
    }
}
