import Foundation
import XCTest
@testable import MindAnchorCore

final class AppConfigurationTests: XCTestCase {
    func testLoadUsesEnvironmentOverridesForPollingIntervals() throws {
        let environment = [
            "MINDANCHOR_API_BASE_URL": "http://127.0.0.1:3101",
            "MINDANCHOR_INBOX_POLL_INTERVAL_SECONDS": "3",
            "MINDANCHOR_HEARTBEAT_INTERVAL_SECONDS": "7",
            "MINDANCHOR_NOTIFICATION_SNOOZE_MINUTES": "9",
            "MINDANCHOR_IDLE_THRESHOLD_SECONDS": "45",
        ]

        let configuration = try AppConfiguration.load(
            bundle: .main,
            environment: environment
        )

        XCTAssertEqual(configuration.apiBaseURL.absoluteString, "http://127.0.0.1:3101")
        XCTAssertEqual(configuration.inboxPollInterval, 3)
        XCTAssertEqual(configuration.heartbeatInterval, 7)
        XCTAssertEqual(configuration.notificationSnoozeMinutes, 9)
        XCTAssertEqual(configuration.idleThresholdSeconds, 45)
    }

    func testLoadFallsBackToDefaultsWhenIntervalOverridesMissing() throws {
        let configuration = try AppConfiguration.load(
            bundle: .main,
            environment: [
                "MINDANCHOR_API_BASE_URL": "http://127.0.0.1:3201",
            ]
        )

        XCTAssertEqual(configuration.inboxPollInterval, 30)
        XCTAssertEqual(configuration.heartbeatInterval, 60)
        XCTAssertEqual(configuration.notificationSnoozeMinutes, 15)
        XCTAssertEqual(configuration.idleThresholdSeconds, 120)
    }

    func testLoadSupportsReminderOnlyPollingAndAuthSessionIsolation() throws {
        let configuration = try AppConfiguration.load(
            bundle: .main,
            environment: [
                "MINDANCHOR_API_BASE_URL": "http://127.0.0.1:3301",
                "MINDANCHOR_REMINDER_POLLING_ONLY": "1",
                "MINDANCHOR_AUTH_SESSION_ACCOUNT": "mindanchor-auth-session-e2e",
                "MINDANCHOR_AUTO_REQUEST_NOTIFICATIONS_ON_BOOTSTRAP": "1",
            ]
        )

        XCTAssertEqual(configuration.authSessionAccount, "mindanchor-auth-session-e2e")
        XCTAssertEqual(configuration.reminderPollingOnly, true)
        XCTAssertEqual(configuration.autoRequestNotificationsOnBootstrap, true)
    }

    func testLoadSupportsNotificationStatusDiagnosticOutputPath() throws {
        let configuration = try AppConfiguration.load(
            bundle: .main,
            environment: [
                "MINDANCHOR_API_BASE_URL": "http://127.0.0.1:3301",
                "MINDANCHOR_NOTIFICATION_STATUS_DIAGNOSTIC_OUTPUT_FILE": "/tmp/mindanchor-live-status.json",
            ]
        )

        XCTAssertEqual(configuration.notificationStatusDiagnosticOutputPath, "/tmp/mindanchor-live-status.json")
    }

    func testLoadRejectsSchemeOnlyAPIBaseURL() {
        XCTAssertThrowsError(
            try AppConfiguration.load(
                bundle: .main,
                environment: [
                    "MINDANCHOR_API_BASE_URL": "http:",
                ]
            )
        ) { error in
            XCTAssertEqual(error as? ConfigurationError, .missingAPIBaseURL)
        }
    }

    func testLoadRejectsPlaceholderAPIBaseURL() {
        XCTAssertThrowsError(
            try AppConfiguration.load(
                bundle: .main,
                environment: [
                    "MINDANCHOR_API_BASE_URL": "$(MINDANCHOR_API_BASE_URL)",
                ]
            )
        ) { error in
            XCTAssertEqual(error as? ConfigurationError, .missingAPIBaseURL)
        }
    }
}
