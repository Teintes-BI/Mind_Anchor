import SwiftUI

struct GoalsTasksView: View {
    @ObservedObject var viewModel: AppViewModel

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    var body: some View {
        if !viewModel.isSignedIn {
            LoginView(viewModel: viewModel)
        } else if viewModel.goalFlowOverview == nil && viewModel.isLoadingInitialContent {
            LoadingStateView(
                title: text("正在加载目标和任务", "Loading goals and tasks"),
                message: text("正在从 Gateway 拉取当前 GoalFlow。", "Pulling your current goal flow from Gateway.")
            )
        } else if let error = viewModel.currentError, viewModel.goalFlowOverview == nil {
            ErrorStateView(
                title: text("无法加载目标 / 任务", "Unable to load Goals / Tasks"),
                message: viewModel.userFacingCurrentErrorMessage ?? error,
                retryTitle: viewModel.l10n.retry,
                retry: { Task { await viewModel.syncNow() } }
            )
        } else if (viewModel.goalFlowOverview?.goals.isEmpty ?? true) && (viewModel.goalFlowOverview?.tasks.isEmpty ?? true) {
            EmptyStateView(
                title: text("没有进行中的目标或任务", "No active goals or tasks"),
                systemImage: "checklist.unchecked",
                message: text("请先在 Gateway 或 Web 中创建目标和任务，然后刷新此页。", "Create goals and tasks in Gateway or Web, then refresh this page.")
            )
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    GroupBox(text("摘要", "Summary")) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(viewModel.goalFlowOverview?.summaryHeadline ?? text("暂时没有目标摘要。", "No goal summary yet."))
                                .font(.title3.weight(.semibold))
                            InfoRow(label: text("建议聚焦任务", "Suggested Focus Task"), value: viewModel.goalFlowOverview?.suggestedFocusTaskId ?? viewModel.l10n.notAvailable)
                        }
                    }
                    GroupBox(text("目标", "Goals")) {
                        VStack(alignment: .leading, spacing: 10) {
                            ForEach(viewModel.goalFlowOverview?.goals ?? []) { goal in
                                HStack {
                                    Text(goal.title)
                                    Spacer()
                                    StatusBadge(text: viewModel.l10n.localizedStatus(goal.status), tone: goal.status == "active" ? .good : .neutral)
                                }
                            }
                        }
                    }
                    GroupBox(text("任务", "Tasks")) {
                        VStack(alignment: .leading, spacing: 10) {
                            ForEach(viewModel.goalFlowOverview?.tasks ?? []) { task in
                                VStack(alignment: .leading, spacing: 4) {
                                    HStack {
                                        Text(task.title).bold()
                                        Spacer()
                                        StatusBadge(text: viewModel.l10n.localizedStatus(task.priority), tone: task.priority == "high" ? .warning : .neutral)
                                    }
                                    Text("\(viewModel.l10n.localizedStatus(task.status)) · \(task.estimatedMinutes ?? 0) min")
                                        .foregroundStyle(.secondary)
                                }
                                if task.id != viewModel.goalFlowOverview?.tasks.last?.id {
                                    Divider()
                                }
                            }
                        }
                    }
                }
                .padding(24)
            }
        }
    }
}
