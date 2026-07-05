import AppKit
import Foundation

@MainActor
protocol MainWindowManaging: AnyObject {
    func showMainWindow(activateApp: Bool)
}

@MainActor
protocol WindowManagingObject: AnyObject {
    var isVisible: Bool { get }
    func hideWindow()
    func showWindow()
}

extension NSWindow: WindowManagingObject {
    func hideWindow() {
        orderOut(nil)
    }

    func showWindow() {
        makeKeyAndOrderFront(nil)
    }
}

@MainActor
final class WindowCoordinator: NSObject, NSWindowDelegate, MainWindowManaging, MainWindowStateControlling {
    private weak var trackedWindow: (any WindowManagingObject)?

    func register(window: any WindowManagingObject) {
        trackedWindow = window
        if let appKitWindow = window as? NSWindow {
            appKitWindow.delegate = self
        }
    }

    func registerExistingWindow() {
        if let existingWindow = NSApp.windows.first(where: { !$0.title.isEmpty }) {
            register(window: existingWindow)
        }
    }

    func showMainWindow(activateApp: Bool = true) {
        guard let trackedWindow else { return }
        if activateApp {
            NSApp.activate(ignoringOtherApps: true)
        }
        trackedWindow.showWindow()
    }

    var isMainWindowVisible: Bool {
        trackedWindow?.isVisible ?? false
    }

    func hideMainWindow() {
        guard let trackedWindow else { return }
        trackedWindow.hideWindow()
    }

    func showMainWindow() {
        showMainWindow(activateApp: true)
    }

    @discardableResult
    func hide(window: any WindowManagingObject) -> Bool {
        window.hideWindow()
        return false
    }

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        hide(window: sender)
    }
}
