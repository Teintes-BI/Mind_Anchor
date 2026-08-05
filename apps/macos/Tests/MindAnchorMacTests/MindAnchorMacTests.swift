import XCTest
@testable import MindAnchorCore

final class MindAnchorMacTests: XCTestCase {
    func testLocalStorePersistsQueuedSignals() {
        let directory = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString, isDirectory: true)
        let store = LocalStore(appSupportDirectory: directory)
        XCTAssertTrue(store.state.queuedSignals.isEmpty)
        store.enqueue(signal: DesktopSignalEvent(id: UUID(), eventType: "idle", occurredAt: .now, payload: ["idleSeconds": "180"]))
        XCTAssertEqual(store.state.queuedSignals.count, 1)
    }

    func testReminderMetadataSnoozeIsStored() {
        let directory = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString, isDirectory: true)
        let store = LocalStore(appSupportDirectory: directory)
        store.updateReminderMetadata { metadata in
            metadata.seenMessageIDs.insert("msg-1")
            metadata.snoozedUntilByMessageID["msg-1"] = Date().addingTimeInterval(60)
        }
        XCTAssertTrue(store.state.reminderMetadata.seenMessageIDs.contains("msg-1"))
        XCTAssertNotNil(store.state.reminderMetadata.snoozedUntilByMessageID["msg-1"])
    }

    func testDesktopCollectorStateTracksSyncHeartbeatAndErrorLifecycle() {
        let directory = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString, isDirectory: true)
        let store = LocalStore(appSupportDirectory: directory)

        store.enqueue(signal: DesktopSignalEvent(id: UUID(), eventType: "idle", occurredAt: .now, payload: ["idleSeconds": "180"]))
        store.markError("Gateway unavailable")
        let errorState = DesktopCollectorState(state: store.state)
        XCTAssertEqual(errorState.queueLength, 1)
        XCTAssertEqual(errorState.lastErrorMessage, "Gateway unavailable")

        store.markSync(date: Date(timeIntervalSince1970: 1_710_000_000))
        store.markHeartbeat(date: Date(timeIntervalSince1970: 1_710_000_100))
        let syncedState = DesktopCollectorState(state: store.state)
        XCTAssertNotNil(syncedState.lastSyncAt)
        XCTAssertNotNil(syncedState.lastHeartbeatAt)
        XCTAssertNil(syncedState.lastErrorMessage)
    }

    func testLocalStoreExportsDiagnosticsSnapshotAndPersistsMetadata() throws {
        let directory = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString, isDirectory: true)
        let store = LocalStore(appSupportDirectory: directory)

        let snapshot = SupportDiagnosticsSnapshot(
            generatedAt: Date(timeIntervalSince1970: 1_710_000_000),
            apiBaseURL: "http://127.0.0.1:3001",
            accountEmail: "user@example.com",
            bootstrapStatusTitle: "MindAnchor is ready",
            bootstrapStatusMessage: "Desktop activity, reminders, and recovery suggestions are available.",
            connectionStatusTitle: "Connected",
            connectionStatusDetail: "MindAnchor is connected to the Gateway and has no queued desktop events.",
            deviceProfile: .init(
                deviceID: "device-1",
                label: "MindAnchor Test Mac",
                platform: "macos",
                capabilities: ["desktop_signals", "notifications"],
                appVersion: "0.1.0"
            ),
            runtimeStatus: .init(
                queueLength: 1,
                lastSyncAt: nil,
                lastHeartbeatAt: nil,
                lastErrorMessage: "Gateway unavailable",
                lastFrontmostApp: "Xcode",
                lastIdleSeconds: 120
            ),
            collectorStatus: .init(
                activeAppCount: 1,
                windowSwitchCount: 2,
                idleCount: 1,
                lockCount: 0,
                unlockCount: 0,
                lastFrontmostApp: "Xcode",
                lastWindowTitle: "MindAnchor",
                lastIdleSeconds: 120,
                lastLockAt: nil,
                lastUnlockAt: nil,
                lastUpdatedAt: nil
            ),
            notificationStatusDescription: "Notifications allowed",
            notificationPermissionHelpText: "Notifications can be delivered through macOS Notification Center.",
            desktopCollectionStatusTitle: "Desktop collection active",
            desktopCollectionStatusDetail: "Idle, lock/unlock, and app-switch signals are available.",
            pendingReminderCount: 1,
            currentError: nil,
            systemNotificationRequestIDs: ["msg-1"]
        )

        let exportURL = try store.exportDiagnosticsSnapshot(snapshot)

        XCTAssertTrue(FileManager.default.fileExists(atPath: exportURL.path))
        XCTAssertEqual(store.state.lastDiagnosticsExportPath, exportURL.path)
        XCTAssertNotNil(store.state.lastDiagnosticsExportAt)
    }

    func testLocalStorePersistsWayfinderSnapshotAcrossReload() {
        let directory = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString, isDirectory: true)
        let situation = WayfinderSituation.fixture(status: .awaitingConfirmation)
        let snapshot = WayfinderLocalSnapshot(
            userID: "user-1",
            situation: situation,
            options: [],
            consentGrants: [],
            lastDecision: nil,
            fastResponse: "Captured",
            fullStatus: .pending,
            savedAt: Date(timeIntervalSince1970: 1_710_000_000)
        )

        let store = LocalStore(appSupportDirectory: directory)
        store.cacheWayfinderSnapshot(snapshot)

        let reloaded = LocalStore(appSupportDirectory: directory)

        XCTAssertEqual(reloaded.state.lastWayfinderSnapshot, snapshot)
        XCTAssertEqual(reloaded.state.lastWayfinderSnapshot?.situation?.id, situation.id)
    }
}

private extension WayfinderSituation {
    static func fixture(status: WayfinderSituationStatus) -> WayfinderSituation {
        WayfinderSituation(
            id: "situation-1",
            userId: "user-1",
            eventIds: ["event-1"],
            status: status,
            summary: "Prepare a proposal",
            uncertainty: [],
            linkedGoalIds: [],
            linkedTaskIds: [],
            riskLevel: .low,
            createdAt: "2026-08-05T00:00:00.000Z",
            updatedAt: "2026-08-05T00:00:00.000Z",
            traceId: "trace-1"
        )
    }
}
