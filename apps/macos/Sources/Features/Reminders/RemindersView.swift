import SwiftUI

struct RemindersView: View {
    @ObservedObject var viewModel: AppViewModel

    private func text(_ chinese: String, _ english: String) -> String {
        viewModel.appLanguage == .chinese ? chinese : english
    }

    var body: some View {
        if !viewModel.isSignedIn {
            LoginView(viewModel: viewModel)
        } else if viewModel.inboxOverview == nil && viewModel.isLoadingInitialContent {
            LoadingStateView(
                title: text("正在加载提醒", "Loading reminders"),
                message: text("正在获取你的 inbox 和通知历史。", "Fetching your inbox and notification history.")
            )
        } else if let error = viewModel.currentError, viewModel.inboxOverview == nil {
            ErrorStateView(
                title: text("无法加载提醒", "Unable to load reminders"),
                message: viewModel.userFacingCurrentErrorMessage ?? error,
                retryTitle: viewModel.l10n.retry,
                retry: { Task { await viewModel.syncNow() } }
            )
        } else if viewModel.inboxOverview?.messages.isEmpty ?? true {
            EmptyStateView(
                title: text("还没有提醒", "No reminders yet"),
                systemImage: "bell.slash",
                message: text("当 Gateway 开始分发提醒后，待处理和已处理消息都会显示在这里。", "Pending and acknowledged reminders will appear here once Gateway starts dispatching them.")
            )
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if let reminderStatusTitle = viewModel.reminderStatusTitle,
                       let reminderStatusMessage = viewModel.reminderStatusMessage {
                        DiagnosticCallout(
                            title: reminderStatusTitle,
                            message: reminderStatusMessage,
                            tone: .warning
                        )
                    }
                    GroupBox(text("待处理", "Pending")) {
                        reminderList(viewModel.inboxOverview?.pendingMessages ?? [])
                    }
                    GroupBox(text("已处理", "Acknowledged")) {
                        reminderList(viewModel.inboxOverview?.acknowledgedMessages ?? [])
                    }
                }
                .padding(24)
            }
        }
    }

    @ViewBuilder
    private func reminderList(_ messages: [InboxOverviewPayload.Message]) -> some View {
        if messages.isEmpty {
            Text(text("暂无提醒。", "No reminders."))
                .foregroundStyle(.secondary)
        } else {
            ForEach(messages) { message in
                ReminderSurfaceCard(
                    title: message.title,
                    bodyText: message.message,
                    metadata: [
                        message.channel,
                        message.createdAt,
                        viewModel.snoozedUntil(for: message.id).flatMap { snoozedUntil in
                            snoozedUntil > .now ? viewModel.l10n.reminderSnoozedUntil(MindAnchorFormatters.timestamp(snoozedUntil, language: viewModel.appLanguage)) : nil
                        },
                    ].compactMap { $0 },
                    statusText: viewModel.l10n.localizedStatus(message.status),
                    statusTone: message.status == "pending" ? .warning : .neutral,
                    actions: {
                        if message.status == "pending" {
                            HStack {
                                Button(viewModel.l10n.snoozeFifteenMinutes) { viewModel.snooze(messageID: message.id) }
                                Button(viewModel.l10n.acknowledge) { Task { await viewModel.acknowledge(messageID: message.id) } }
                                    .buttonStyle(.borderedProminent)
                            }
                        }
                    }
                )
                if message.id != messages.last?.id {
                    Divider()
                }
            }
        }
    }
}

struct ReminderSurfaceCard<Actions: View>: View {
    let title: String
    let bodyText: String
    let metadata: [String]
    let statusText: String
    let statusTone: StatusBadge.Tone
    @ViewBuilder let actions: () -> Actions

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(title).bold()
                    Text(bodyText).foregroundStyle(.secondary)
                    if !metadata.isEmpty {
                        ForEach(Array(metadata.enumerated()), id: \.offset) { _, line in
                            Text(line)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                Spacer()
                StatusBadge(text: statusText, tone: statusTone)
            }
            actions()
        }
        .padding(.vertical, 6)
    }
}
