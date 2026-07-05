import AppKit

@MainActor
protocol StatusBarDestinationHandling: AnyObject {
    var pendingReminderCount: Int { get }
    var appLanguage: AppLanguage { get }
    var openClawRegistryMenuStatus: String? { get }
    func focus(destination: AppDestination)
    func syncNow() async
}

@MainActor
protocol StatusItemProviding {
    func makeStatusItem() -> any StatusItemControlling
}

@MainActor
protocol StatusItemControlling: AnyObject {
    func setTitle(_ title: String)
    func setMenu(_ menu: NSMenu)
}

@MainActor
final class SystemStatusItemController: StatusItemControlling {
    private let statusItem: NSStatusItem

    init(statusItem: NSStatusItem) {
        self.statusItem = statusItem
    }

    func setTitle(_ title: String) {
        statusItem.button?.title = title
    }

    func setMenu(_ menu: NSMenu) {
        statusItem.menu = menu
    }
}

struct SystemStatusItemProvider: StatusItemProviding {
    func makeStatusItem() -> any StatusItemControlling {
        SystemStatusItemController(
            statusItem: NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        )
    }
}

@MainActor
final class StatusBarCoordinator: NSObject, StatusBarActionPerforming {
    private let statusItem: any StatusItemControlling
    private weak var destinationHandler: (any StatusBarDestinationHandling)?

    init(statusItemProvider: any StatusItemProviding = SystemStatusItemProvider()) {
        self.statusItem = statusItemProvider.makeStatusItem()
        super.init()
    }

    func configure(with viewModel: any StatusBarDestinationHandling) {
        self.destinationHandler = viewModel
        statusItem.setTitle("MindAnchor")
        rebuildMenu()
    }

    func refresh() {
        rebuildMenu()
    }

    private func rebuildMenu() {
        let l10n = AppLocalization(language: destinationHandler?.appLanguage ?? .chinese)
        let menu = NSMenu()
        if let registryStatus = destinationHandler?.openClawRegistryMenuStatus, !registryStatus.isEmpty {
            let statusItem = NSMenuItem(title: registryStatus, action: nil, keyEquivalent: "")
            statusItem.isEnabled = false
            menu.addItem(statusItem)
            menu.addItem(.separator())
        }
        menu.addItem(NSMenuItem(title: l10n.statusBarOpenMindAnchor, action: #selector(openWindow), keyEquivalent: "o"))
        menu.addItem(NSMenuItem(title: l10n.syncNow, action: #selector(syncNow), keyEquivalent: "r"))
        let reminderTitle = l10n.statusBarViewRecentReminders(count: destinationHandler?.pendingReminderCount ?? 0)
        menu.addItem(NSMenuItem(title: reminderTitle, action: #selector(openReminders), keyEquivalent: "i"))
        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: l10n.quit, action: #selector(quit), keyEquivalent: "q"))
        menu.items.forEach { $0.target = self }
        statusItem.setMenu(menu)
    }

    func performAutomationAction(_ action: StatusBarAutomationAction) {
        switch action {
        case .openMainWindow:
            destinationHandler?.focus(destination: .today)
        case .openReminders:
            destinationHandler?.focus(destination: .reminders)
        case .syncNow:
            Task { await destinationHandler?.syncNow() }
        }
    }

    @objc private func openWindow() {
        performAutomationAction(.openMainWindow)
    }

    @objc private func syncNow() {
        performAutomationAction(.syncNow)
    }

    @objc private func openReminders() {
        performAutomationAction(.openReminders)
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }
}
