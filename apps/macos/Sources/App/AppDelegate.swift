import AppKit
import SwiftUI

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    var statusBarCoordinator = StatusBarCoordinator()
    let windowCoordinator = WindowCoordinator()
    weak var appViewModel: AppViewModel?
    var automationService: MacAutomationService?
    private var windowObserver: NSObjectProtocol?

    func applicationDidFinishLaunching(_ notification: Notification) {
        if let appViewModel {
            statusBarCoordinator.configure(with: appViewModel)
        }
        windowObserver = NotificationCenter.default.addObserver(
            forName: NSWindow.didBecomeMainNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            guard let window = notification.object as? NSWindow else { return }
            Task { @MainActor [weak self] in
                self?.windowCoordinator.register(window: window)
            }
        }
        windowCoordinator.registerExistingWindow()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag {
            windowCoordinator.showMainWindow(activateApp: true)
        }
        return true
    }
}
