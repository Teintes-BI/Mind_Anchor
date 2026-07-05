import Foundation
import UserNotifications

@MainActor
protocol UserNotificationCenterScheduling: AnyObject {
    func setNotificationCategories(_ categories: Set<UNNotificationCategory>)
    func add(_ request: UNNotificationRequest) async throws
}

@MainActor
final class SystemUserNotificationCenterScheduler: UserNotificationCenterScheduling {
    func setNotificationCategories(_ categories: Set<UNNotificationCategory>) {
        UNUserNotificationCenter.current().setNotificationCategories(categories)
    }

    func add(_ request: UNNotificationRequest) async throws {
        try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            UNUserNotificationCenter.current().add(request) { error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: ())
                }
            }
        }
    }
}

@MainActor
protocol ReminderPresenting: AnyObject {
    func configureCategories(language: AppLanguage)
    func show(message: InboxOverviewPayload.Message) async
    func showOperationalAlert(id: String, title: String, message: String, kind: String) async
}

@MainActor
final class ReminderCenter: ReminderPresenting {
    static let shared = ReminderCenter(notificationCenter: SystemUserNotificationCenterScheduler())
    static let categoryIdentifier = "mindanchor.reminder"
    static let runtimeAlertCategoryIdentifier = "mindanchor.runtime"
    static let snoozeActionIdentifier = "mindanchor.reminder.snooze"
    static let acknowledgeActionIdentifier = "mindanchor.reminder.ack"
    static let openActionIdentifier = "mindanchor.reminder.open"
    static let runtimeAlertOpenActionIdentifier = "mindanchor.runtime.open"
    static let immediateBannerDelaySeconds: TimeInterval = 1

    private let notificationCenter: any UserNotificationCenterScheduling

    init(notificationCenter: any UserNotificationCenterScheduling) {
        self.notificationCenter = notificationCenter
    }

    func configureCategories(language: AppLanguage) {
        let l10n = AppLocalization(language: language)
        let snooze = UNNotificationAction(identifier: Self.snoozeActionIdentifier, title: l10n.snoozeFifteenMinutes)
        let acknowledge = UNNotificationAction(identifier: Self.acknowledgeActionIdentifier, title: l10n.acknowledge)
        let open = UNNotificationAction(identifier: Self.openActionIdentifier, title: l10n.openMainWindow, options: [.foreground])
        let category = UNNotificationCategory(identifier: Self.categoryIdentifier, actions: [snooze, acknowledge, open], intentIdentifiers: [])
        let runtimeOpen = UNNotificationAction(identifier: Self.runtimeAlertOpenActionIdentifier, title: l10n.openMainWindow, options: [.foreground])
        let runtimeCategory = UNNotificationCategory(identifier: Self.runtimeAlertCategoryIdentifier, actions: [runtimeOpen], intentIdentifiers: [])
        notificationCenter.setNotificationCategories([category, runtimeCategory])
    }

    func show(message: InboxOverviewPayload.Message) async {
        let content = UNMutableNotificationContent()
        content.title = message.title
        content.body = message.message
        content.categoryIdentifier = Self.categoryIdentifier
        content.userInfo = ["messageID": message.id]
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: Self.immediateBannerDelaySeconds, repeats: false)
        let request = UNNotificationRequest(identifier: message.id, content: content, trigger: trigger)
        try? await notificationCenter.add(request)
    }

    func showOperationalAlert(id: String, title: String, message: String, kind: String) async {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = message
        content.categoryIdentifier = Self.runtimeAlertCategoryIdentifier
        content.userInfo = ["notificationKind": kind]
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: Self.immediateBannerDelaySeconds, repeats: false)
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        try? await notificationCenter.add(request)
    }
}
