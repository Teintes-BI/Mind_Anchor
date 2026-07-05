import AppKit
import XCTest
@testable import MindAnchorCore

@MainActor
final class StatusBarCoordinatorTests: XCTestCase {
    func testOpenMainWindowActionRoutesToTodayFocus() {
        let handler = MockStatusBarDestinationHandler()
        let statusItem = MockStatusItemController()
        let coordinator = StatusBarCoordinator(statusItemProvider: MockStatusItemProvider(item: statusItem))

        coordinator.configure(with: handler)
        coordinator.performAutomationAction(.openMainWindow)

        XCTAssertEqual(handler.focusCalls, [.today])
        XCTAssertEqual(statusItem.title, "MindAnchor")
    }

    func testOpenRemindersActionRoutesToRemindersFocus() {
        let handler = MockStatusBarDestinationHandler()
        let statusItem = MockStatusItemController()
        let coordinator = StatusBarCoordinator(statusItemProvider: MockStatusItemProvider(item: statusItem))

        coordinator.configure(with: handler)
        coordinator.performAutomationAction(.openReminders)

        XCTAssertEqual(handler.focusCalls, [.reminders])
        XCTAssertEqual(statusItem.menuItemTitles, [
            "打开 MindAnchor",
            "立即同步",
            "查看最近提醒 (0)",
            "退出",
        ])
    }

    func testMenuShowsOpenClawStatusLineWhenProvided() {
        let handler = MockStatusBarDestinationHandler()
        handler.openClawRegistryMenuStatus = "OpenClaw：已对齐"
        let statusItem = MockStatusItemController()
        let coordinator = StatusBarCoordinator(statusItemProvider: MockStatusItemProvider(item: statusItem))

        coordinator.configure(with: handler)

        XCTAssertEqual(statusItem.menuItemTitles, [
            "OpenClaw：已对齐",
            "打开 MindAnchor",
            "立即同步",
            "查看最近提醒 (0)",
            "退出",
        ])
    }
}

@MainActor
private final class MockStatusBarDestinationHandler: StatusBarDestinationHandling {
    private(set) var focusCalls: [AppDestination] = []
    var pendingReminderCount: Int = 0
    var appLanguage: AppLanguage = .chinese
    var openClawRegistryMenuStatus: String?

    func focus(destination: AppDestination) {
        focusCalls.append(destination)
    }

    func syncNow() async {}
}

@MainActor
private final class MockStatusItemProvider: StatusItemProviding {
    private let item: MockStatusItemController

    init(item: MockStatusItemController) {
        self.item = item
    }

    func makeStatusItem() -> any StatusItemControlling {
        item
    }
}

@MainActor
private final class MockStatusItemController: StatusItemControlling {
    private(set) var title: String?
    private(set) var menuItemTitles: [String] = []

    func setTitle(_ title: String) {
        self.title = title
    }

    func setMenu(_ menu: NSMenu) {
        menuItemTitles = menu.items.compactMap { item in
            item.isSeparatorItem ? nil : item.title
        }
    }
}
