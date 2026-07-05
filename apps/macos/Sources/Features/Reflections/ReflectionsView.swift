import SwiftUI

struct ReflectionsView: View {
    @ObservedObject var viewModel: AppViewModel

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    var body: some View {
        if !viewModel.isSignedIn {
            LoginView(viewModel: viewModel)
        } else if viewModel.reflectionOverview == nil && viewModel.isLoadingInitialContent {
            LoadingStateView(
                title: text("正在加载复盘", "Loading reflections"),
                message: text("正在拉取最新的周报和月报。", "Pulling the latest weekly and monthly reflection reports.")
            )
        } else if let error = viewModel.currentError, viewModel.reflectionOverview == nil {
            ErrorStateView(
                title: text("无法加载复盘页", "Unable to load Reflections"),
                message: viewModel.userFacingCurrentErrorMessage ?? error,
                retryTitle: viewModel.l10n.retry,
                retry: { Task { await viewModel.syncNow() } }
            )
        } else if viewModel.reflectionOverview?.reports.isEmpty ?? true {
            EmptyStateView(
                title: text("暂无复盘", "No reflections available"),
                systemImage: "text.book.closed",
                message: text("当 Gateway 产出 reflection 输出后，周报和月报会显示在这里。", "Weekly and monthly reports will appear after Gateway produces reflection outputs.")
            )
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    GroupBox(text("周报", "Weekly")) {
                        ReflectionCard(report: viewModel.reflectionOverview?.latestWeekly, language: viewModel.appLanguage)
                    }
                    GroupBox(text("月报", "Monthly")) {
                        ReflectionCard(report: viewModel.reflectionOverview?.latestMonthly, language: viewModel.appLanguage)
                    }
                }
                .padding(24)
            }
        }
    }
}

private struct ReflectionCard: View {
    let report: ReflectionOverviewPayload.ReflectionReport?
    let language: AppLanguage

    private func text(_ chinese: String, _ english: String) -> String {
        language == .chinese ? chinese : english
    }

    var body: some View {
        if let report {
            VStack(alignment: .leading, spacing: 8) {
                Text("\(text("创建于", "Created")) \(report.createdAt)").foregroundStyle(.secondary)
                ReflectionList(title: text("亮点", "Highlights"), items: report.highlights, language: language)
                ReflectionList(title: text("阻塞项", "Blockers"), items: report.blockers, language: language)
                ReflectionList(title: text("趋势", "Trends"), items: report.trends, language: language)
                ReflectionList(title: text("下一步", "Next"), items: report.nextSuggestions, language: language)
            }
        } else {
            Text(text("还没有报告。", "No report yet."))
                .foregroundStyle(.secondary)
        }
    }
}

private struct ReflectionList: View {
    let title: String
    let items: [String]
    let language: AppLanguage

    private func text(_ chinese: String, _ english: String) -> String {
        language == .chinese ? chinese : english
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).bold()
            if items.isEmpty {
                Text(text("无", "None")).foregroundStyle(.secondary)
            } else {
                ForEach(items, id: \.self) { item in
                    Text("• \(item)")
                }
            }
        }
    }
}
