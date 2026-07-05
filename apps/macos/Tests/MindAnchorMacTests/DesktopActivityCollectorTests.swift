import XCTest
@testable import MindAnchorCore

@MainActor
final class DesktopActivityCollectorTests: XCTestCase {
    func testWorkspaceActivationEmitsActiveAppAndWindowSwitch() {
        var emitted: [DesktopSignalEvent] = []
        let collector = DesktopActivityCollector(
            configuration: .testValue,
            environment: .init(
                now: { Date(timeIntervalSince1970: 1_710_000_000) },
                idleSeconds: { 0 },
                accessibilityGranted: { true }
            ),
            onSignal: { emitted.append($0) }
        )

        collector.handleWorkspaceActivation(appName: "Safari")
        collector.handleWorkspaceActivation(appName: "Xcode")

        XCTAssertEqual(emitted.map(\.eventType), ["active_app", "active_app", "window_switch"])
        XCTAssertEqual(emitted[0].payload["app"], "Safari")
        XCTAssertEqual(emitted[1].payload["app"], "Xcode")
        XCTAssertEqual(emitted[2].payload["from"], "Safari")
        XCTAssertEqual(emitted[2].payload["to"], "Xcode")
        XCTAssertEqual(collector.recentActivity.activeAppCount, 2)
        XCTAssertEqual(collector.recentActivity.windowSwitchCount, 1)
        XCTAssertEqual(collector.recentActivity.lastFrontmostApp, "Xcode")
    }

    func testIdlePollingThrottlesRepeatedSignalsWithinCooldown() {
        var emitted: [DesktopSignalEvent] = []
        var now = Date(timeIntervalSince1970: 1_710_000_000)
        let collector = DesktopActivityCollector(
            configuration: .testValue,
            environment: .init(
                now: { now },
                idleSeconds: { 240 },
                accessibilityGranted: { true }
            ),
            onSignal: { emitted.append($0) }
        )

        collector.pollIdleState()
        now = now.addingTimeInterval(60)
        collector.pollIdleState()
        now = now.addingTimeInterval(70)
        collector.pollIdleState()

        XCTAssertEqual(emitted.map(\.eventType), ["idle", "idle"])
        XCTAssertEqual(collector.recentActivity.idleCount, 2)
        XCTAssertEqual(collector.recentActivity.lastIdleSeconds, 240)
        XCTAssertTrue(collector.accessibilityGranted)
    }

    func testCollectorReportsBasicModeWhenAccessibilityIsMissing() {
        let collector = DesktopActivityCollector(
            configuration: .testValue,
            environment: .init(
                now: { Date(timeIntervalSince1970: 1_710_000_000) },
                idleSeconds: { 0 },
                accessibilityGranted: { false }
            ),
            onSignal: { _ in }
        )

        collector.pollIdleState()

        XCTAssertFalse(collector.accessibilityGranted)
        XCTAssertEqual(collector.collectionModeTitle, "Basic desktop signals")
        XCTAssertEqual(collector.collectionModeDetail, "Idle, lock/unlock, and app-switch signals continue. Accessibility-only window context is unavailable.")
    }
}

private extension AppConfiguration {
    static let testValue = AppConfiguration(
        apiBaseURL: URL(string: "http://127.0.0.1:3001")!,
        supabaseURL: nil,
        supabaseAnonKey: nil,
        authDevToken: nil,
        debugAuthBootstrap: nil,
        notificationSnoozeMinutes: 15,
        inboxPollInterval: 30,
        heartbeatInterval: 60,
        idleThresholdSeconds: 120
    )
}
