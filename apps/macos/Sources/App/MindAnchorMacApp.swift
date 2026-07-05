import SwiftUI

@main
struct MindAnchorMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var viewModel: AppViewModel
    private let configuration: AppConfiguration

    init() {
        let environment = ProcessInfo.processInfo.environment
        let configuration = (try? AppConfiguration.load()) ?? AppConfiguration(
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
        self.configuration = configuration
        let collectorEnabled = !["1", "true", "yes", "on"].contains(
            (environment["MINDANCHOR_DISABLE_COLLECTOR"] ?? "").lowercased()
        )
        _viewModel = StateObject(
            wrappedValue: AppViewModel(
                configuration: configuration,
                collectorEnabled: collectorEnabled
            )
        )
    }

    var body: some Scene {
        WindowGroup {
            MainWindowShell(viewModel: viewModel)
                .background(
                    WindowAccessor { window in
                        appDelegate.windowCoordinator.register(window: window)
                    }
                )
                .frame(minWidth: 1120, minHeight: 760)
                .task {
                    if let outputPath = configuration.notificationStatusDiagnosticOutputPath, !outputPath.isEmpty {
                        let outputURL = URL(fileURLWithPath: outputPath)
                        let bundleIdentifier = Bundle.main.bundleIdentifier ?? "unknown"
                        try? await NotificationStatusDiagnosticRunner.run(
                            diagnostics: viewModel.diagnostics,
                            outputURL: outputURL,
                            bundleIdentifier: bundleIdentifier
                        )
                        NSApp.terminate(nil)
                        return
                    }
                    appDelegate.appViewModel = viewModel
                    viewModel.windowManager = appDelegate.windowCoordinator
                    appDelegate.windowCoordinator.registerExistingWindow()
                    statusBarRefresh()
                    let automationController = MacAutomationController(
                        statusBarActions: appDelegate.statusBarCoordinator,
                        windowState: appDelegate.windowCoordinator,
                        appState: viewModel
                    )
                    let environment = ProcessInfo.processInfo.environment
                    let automationBridge = MacAutomationCommandFileBridge(
                        commandURL: MacAutomationService.commandURL(environment: environment),
                        responseURL: MacAutomationService.responseURL(environment: environment)
                    )
                    let automationService = MacAutomationService(
                        bridge: automationBridge,
                        handler: automationController
                    )
                    automationService.startIfEnabled(environment: environment)
                    appDelegate.automationService = automationService
                    await viewModel.bootstrap()
                }
                .onReceive(viewModel.$inboxOverview) { _ in statusBarRefresh() }
        }
        .windowResizability(.contentSize)

        Settings {
            SettingsView(viewModel: viewModel)
        }
    }

    private func statusBarRefresh() {
        appDelegate.statusBarCoordinator.configure(with: viewModel)
        appDelegate.statusBarCoordinator.refresh()
    }
}
