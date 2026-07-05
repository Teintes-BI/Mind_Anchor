import SwiftUI

struct StateView: View {
    @ObservedObject var viewModel: AppViewModel

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    var body: some View {
        if !viewModel.isSignedIn {
            LoginView(viewModel: viewModel)
        } else if viewModel.stateTrends == nil && viewModel.isLoadingInitialContent {
            LoadingStateView(
                title: text("正在加载状态趋势", "Loading state trends"),
                message: text("正在获取最近 assessment 和 active inputs。", "Fetching recent assessments and active inputs.")
            )
        } else if let error = viewModel.currentError, viewModel.stateTrends == nil {
            ErrorStateView(
                title: text("无法加载状态页", "Unable to load State"),
                message: viewModel.userFacingCurrentErrorMessage ?? error,
                retryTitle: viewModel.l10n.retry,
                retry: { Task { await viewModel.syncNow() } }
            )
        } else if (viewModel.stateTrends?.assessments.isEmpty ?? true) && viewModel.dashboardSummary?.latestAssessment == nil {
            EmptyStateView(
                title: text("还没有状态评估", "No state assessments yet"),
                systemImage: "waveform.path.ecg",
                message: text("当 signals 和 check-ins 到达 Gateway 后，状态摘要会出现在这里。", "State summaries will appear after signals and check-ins reach Gateway.")
            )
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    GroupBox(text("当前状态", "Current State")) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(viewModel.dashboardSummary?.latestAssessment?.summary ?? text("当前还没有 assessment。", "No current assessment."))
                                .font(.title3.weight(.semibold))
                            InfoRow(label: text("建议动作", "Recommended Action"), value: viewModel.dashboardSummary?.latestAssessment?.recommendedAction ?? text("暂时没有动作建议。", "No action yet"))
                        }
                    }
                    GroupBox(text("活跃输入", "Active Inputs")) {
                        let activeInputs = viewModel.stateTrends?.activeInputs ?? []
                        if activeInputs.isEmpty {
                            Text(text("还没有活跃输入。", "No active inputs yet."))
                                .foregroundStyle(.secondary)
                        } else {
                            LazyVGrid(columns: [GridItem(.adaptive(minimum: 120), alignment: .leading)], alignment: .leading, spacing: 8) {
                                ForEach(activeInputs, id: \.self) { input in
                                    StatusBadge(text: input, tone: .neutral)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                        }
                    }
                    GroupBox(text("最近评估", "Recent Assessments")) {
                        VStack(alignment: .leading, spacing: 10) {
                            ForEach(viewModel.stateTrends?.assessments ?? []) { assessment in
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(assessment.summary).bold()
                                    Text("\(text("专注", "Focus")) \(Int(assessment.focusScore)) · \(text("精力", "Energy")) \(Int(assessment.energyScore)) · \(text("情绪", "Mood")) \(Int(assessment.moodScore))")
                                        .foregroundStyle(.secondary)
                                    Text(assessment.createdAt)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                if assessment.id != viewModel.stateTrends?.assessments.last?.id {
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
