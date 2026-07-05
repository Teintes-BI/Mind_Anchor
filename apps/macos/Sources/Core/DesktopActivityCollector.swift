import ApplicationServices
import AppKit
import Foundation

@MainActor
struct DesktopActivityEnvironment {
    let now: () -> Date
    let idleSeconds: () -> Int
    let accessibilityGranted: () -> Bool

    static let live = DesktopActivityEnvironment(
        now: { .now },
        idleSeconds: { Int(CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .null)) },
        accessibilityGranted: { AXIsProcessTrusted() }
    )
}

@MainActor
protocol DesktopActivityCollecting: AnyObject {
    func start()
    func stop()
}

@MainActor
final class DesktopActivityCollector: ObservableObject, DesktopActivityCollecting {
    @Published private(set) var recentActivity = RecentActivitySnapshot()
    @Published private(set) var accessibilityGranted: Bool

    var collectionModeTitle: String {
        accessibilityGranted ? "Desktop collection active" : "Basic desktop signals"
    }

    var collectionModeDetail: String {
        accessibilityGranted
            ? "Idle, lock/unlock, and app-switch signals are available."
            : "Idle, lock/unlock, and app-switch signals continue. Accessibility-only window context is unavailable."
    }

    private var workspaceObserver: Any?
    private var idleTimer: Timer?
    private var lastIdleSignalAt: Date?
    private let idleThresholdSeconds: TimeInterval
    private let environment: DesktopActivityEnvironment
    private let onSignal: (DesktopSignalEvent) -> Void

    init(
        configuration: AppConfiguration,
        environment: DesktopActivityEnvironment = .live,
        onSignal: @escaping (DesktopSignalEvent) -> Void
    ) {
        self.idleThresholdSeconds = configuration.idleThresholdSeconds
        self.environment = environment
        self.onSignal = onSignal
        self.accessibilityGranted = environment.accessibilityGranted()
    }

    func start() {
        if workspaceObserver == nil {
            workspaceObserver = NSWorkspace.shared.notificationCenter.addObserver(
                forName: NSWorkspace.didActivateApplicationNotification,
                object: nil,
                queue: .main
            ) { [weak self] notification in
                let appName = (notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication)?.localizedName ?? "Unknown"
                Task { @MainActor in
                    self?.handleWorkspaceActivation(appName: appName)
                }
            }
        }

        DistributedNotificationCenter.default().addObserver(
            self,
            selector: #selector(handleScreenLocked),
            name: NSNotification.Name("com.apple.screenIsLocked"),
            object: nil
        )
        DistributedNotificationCenter.default().addObserver(
            self,
            selector: #selector(handleScreenUnlocked),
            name: NSNotification.Name("com.apple.screenIsUnlocked"),
            object: nil
        )

        idleTimer?.invalidate()
        idleTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.pollIdleState()
            }
        }
    }

    func stop() {
        if let workspaceObserver {
            NSWorkspace.shared.notificationCenter.removeObserver(workspaceObserver)
            self.workspaceObserver = nil
        }
        DistributedNotificationCenter.default().removeObserver(self)
        idleTimer?.invalidate()
        idleTimer = nil
    }

    @objc private func handleScreenLocked() {
        recentActivity.lockCount += 1
        recentActivity.lastLockAt = .now
        onSignal(signal(eventType: "lock"))
    }

    @objc private func handleScreenUnlocked() {
        recentActivity.unlockCount += 1
        recentActivity.lastUnlockAt = .now
        onSignal(signal(eventType: "unlock"))
    }

    func handleWorkspaceActivation(appName: String) {
        let previousApp = recentActivity.lastFrontmostApp
        recentActivity.lastFrontmostApp = appName
        recentActivity.activeAppCount += 1
        onSignal(signal(eventType: "active_app", payload: ["app": appName]))
        if !previousApp.isEmpty && previousApp != appName {
            recentActivity.windowSwitchCount += 1
            onSignal(signal(eventType: "window_switch", payload: ["from": previousApp, "to": appName]))
        }
    }

    func pollIdleState() {
        let idleSeconds = environment.idleSeconds()
        recentActivity.lastIdleSeconds = idleSeconds
        accessibilityGranted = environment.accessibilityGranted()
        if idleSeconds >= Int(idleThresholdSeconds) {
            let now = environment.now()
            if let lastIdleSignalAt, now.timeIntervalSince(lastIdleSignalAt) < idleThresholdSeconds {
                return
            }
            lastIdleSignalAt = now
            recentActivity.idleCount += 1
            onSignal(signal(eventType: "idle", payload: ["idleSeconds": String(idleSeconds)]))
        }
    }

    private func signal(eventType: String, payload: [String: String] = [:]) -> DesktopSignalEvent {
        recentActivity.lastUpdatedAt = .now
        return DesktopSignalEvent(id: UUID(), eventType: eventType, occurredAt: .now, payload: payload)
    }
}
