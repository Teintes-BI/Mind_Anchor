import Foundation
import XCTest
@testable import MindAnchorCore

final class NotificationStatusDiagnosticTests: XCTestCase {
    @MainActor
    func testMakePayloadUsesCurrentDiagnosticsState() {
        let diagnostics = PermissionsDiagnostics(
            notificationAuthorizationState: .denied,
            notificationStatusDescription: "Notifications denied",
            accessibilityGranted: false
        )

        let payload = NotificationStatusDiagnosticRunner.makePayload(
            bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
            diagnostics: diagnostics,
            generatedAt: Date(timeIntervalSince1970: 1_700_000_000)
        )

        XCTAssertEqual(payload.bundleIdentifier, "com.mindanchor.mac.openclaw.registry.e2e")
        XCTAssertEqual(payload.notificationAuthorizationState, "denied")
        XCTAssertEqual(payload.notificationStatusDescription, "Notifications denied")
        XCTAssertEqual(payload.accessibilityGranted, false)
        XCTAssertEqual(payload.generatedAt, "2023-11-14T22:13:20Z")
    }

    @MainActor
    func testWritePayloadCreatesJSONFile() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let outputURL = directory.appendingPathComponent("notification-status.json")
        let payload = NotificationStatusDiagnosticPayload(
            generatedAt: "2026-03-24T00:00:00Z",
            bundleIdentifier: "com.mindanchor.mac.openclaw.registry.e2e",
            notificationAuthorizationState: "allowed",
            notificationStatusDescription: "Notifications allowed",
            accessibilityGranted: true
        )

        try NotificationStatusDiagnosticRunner.writePayload(payload, outputURL: outputURL)

        let data = try Data(contentsOf: outputURL)
        let decoded = try JSONDecoder().decode(NotificationStatusDiagnosticPayload.self, from: data)
        XCTAssertEqual(decoded, payload)
    }
}
