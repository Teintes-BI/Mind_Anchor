import ApplicationServices
import AppKit
import Foundation

@MainActor
struct DesktopActivityEnvironment {
    let now: () -> Date
    let idleSeconds: () -> Int
    let accessibilityGranted: () -> Bool
    let frontmostWindowTitle: () -> String?

    init(
        now: @escaping () -> Date,
        idleSeconds: @escaping () -> Int,
        accessibilityGranted: @escaping () -> Bool,
        frontmostWindowTitle: @escaping () -> String? = { nil }
    ) {
        self.now = now
        self.idleSeconds = idleSeconds
        self.accessibilityGranted = accessibilityGranted
        self.frontmostWindowTitle = frontmostWindowTitle
    }

    static let live = DesktopActivityEnvironment(
        now: { .now },
        idleSeconds: { Int(CGEventSource.secondsSinceLastEventType(.combinedSessionState, eventType: .null)) },
        accessibilityGranted: { AXIsProcessTrusted() },
        frontmostWindowTitle: { Self.readFrontmostWindowTitle() }
    )

    private static func readFrontmostWindowTitle() -> String? {
        guard AXIsProcessTrusted(),
              let application = NSWorkspace.shared.frontmostApplication else {
            return nil
        }

        let applicationElement = AXUIElementCreateApplication(application.processIdentifier)
        var focusedWindow: CFTypeRef?
        guard AXUIElementCopyAttributeValue(
            applicationElement,
            kAXFocusedWindowAttribute as CFString,
            &focusedWindow
        ) == .success,
        let focusedWindow,
        let focusedWindowElement = focusedWindow as? AXUIElement else {
            return nil
        }

        var title: CFTypeRef?
        guard AXUIElementCopyAttributeValue(
            focusedWindowElement,
            kAXTitleAttribute as CFString,
            &title
        ) == .success,
        let title = title as? String,
        !title.isEmpty else {
            return nil
        }
        return title
    }
}

@MainActor
protocol DesktopActivityCollecting: AnyObject {
    func start()
    func stop()
    func setWindowTitleCaptureEnabled(_ enabled: Bool)
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
            ? "Idle, lock/unlock, and app-switch signals are available. Window titles are opt-in."
            : "Idle, lock/unlock, and app-switch signals continue. Accessibility-only window context is unavailable."
    }

    private var workspaceObserver: Any?
    private var idleTimer: Timer?
    private var lastIdleSignalAt: Date?
    private let idleThresholdSeconds: TimeInterval
    private let environment: DesktopActivityEnvironment
    private let onSignal: (DesktopSignalEvent) -> Void
    private(set) var windowTitleCaptureEnabled = false

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

    func setWindowTitleCaptureEnabled(_ enabled: Bool) {
        windowTitleCaptureEnabled = enabled
        if !enabled {
            recentActivity.lastWindowTitle = nil
        }
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

    func handleWorkspaceActivation(appName: String, windowTitle: String? = nil) {
        let previousApp = recentActivity.lastFrontmostApp
        let previousWindowTitle = recentActivity.lastWindowTitle ?? ""
        let resolvedWindowTitle = windowTitleCaptureEnabled
            ? (windowTitle ?? environment.frontmostWindowTitle() ?? "")
            : ""
        let titleChanged = windowTitleCaptureEnabled &&
            !resolvedWindowTitle.isEmpty &&
            resolvedWindowTitle != previousWindowTitle
        recentActivity.lastFrontmostApp = appName
        recentActivity.lastWindowTitle = resolvedWindowTitle.isEmpty ? nil : resolvedWindowTitle
        recentActivity.activeAppCount += 1
        var activePayload = ["app": appName]
        if windowTitleCaptureEnabled && !resolvedWindowTitle.isEmpty {
            activePayload["windowTitle"] = resolvedWindowTitle
        }
        onSignal(signal(eventType: "active_app", payload: activePayload))
        if !previousApp.isEmpty && (previousApp != appName || titleChanged) {
            recentActivity.windowSwitchCount += 1
            var switchPayload = ["from": previousApp, "to": appName]
            if windowTitleCaptureEnabled && !previousWindowTitle.isEmpty {
                switchPayload["fromWindowTitle"] = previousWindowTitle
            }
            if windowTitleCaptureEnabled && !resolvedWindowTitle.isEmpty {
                switchPayload["toWindowTitle"] = resolvedWindowTitle
            }
            onSignal(signal(eventType: "window_switch", payload: switchPayload))
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
