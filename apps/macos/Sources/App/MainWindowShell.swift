import SwiftUI

struct MainWindowShell: View {
    @ObservedObject var viewModel: AppViewModel

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    var body: some View {
        NavigationSplitView {
            List(AppDestination.allCases, selection: $viewModel.selectedDestination) { destination in
                Label(destination.title(for: viewModel.appLanguage), systemImage: destination.iconName)
                    .tag(destination)
            }
            .navigationTitle("MindAnchor")
        } detail: {
            switch viewModel.selectedDestination {
            case .today:
                TodayView(viewModel: viewModel)
            case .coach:
                CoachView(viewModel: viewModel)
            case .goals:
                GoalsTasksView(viewModel: viewModel)
            case .state:
                StateView(viewModel: viewModel)
            case .reflections:
                ReflectionsView(viewModel: viewModel)
            case .reminders:
                RemindersView(viewModel: viewModel)
            case .settings:
                SettingsView(viewModel: viewModel)
            }
        }
        .toolbar {
            ToolbarItemGroup {
                StatusBadge(
                    text: viewModel.isSignedIn ? viewModel.l10n.signedIn : viewModel.l10n.signedOut,
                    tone: viewModel.isSignedIn ? .good : .warning
                )
                StatusBadge(
                    text: viewModel.pendingReminderBadgeText,
                    tone: viewModel.pendingReminderCount > 0 ? .warning : .neutral
                )
                Button {
                    Task { await viewModel.syncNow() }
                } label: {
                    Label(viewModel.l10n.sync, systemImage: "arrow.clockwise")
                }
            }
        }
        .overlay(alignment: .top) {
            if let error = viewModel.currentError, !error.isEmpty {
                HStack(spacing: 10) {
                    Image(systemName: "exclamationmark.circle.fill")
                    Text(error)
                        .lineLimit(2)
                    Spacer()
                    Button(viewModel.l10n.retry) {
                        Task { await viewModel.syncNow() }
                    }
                    .buttonStyle(.bordered)
                }
                .padding(12)
                .background(.red.opacity(0.92))
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .padding()
            }
        }
    }
}
